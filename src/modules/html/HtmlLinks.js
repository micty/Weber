
/**
* 静态引用 HTML 资源文件列表。
*/
define('HtmlLinks', function (require, module, exports) {

    var $ = require('$');
    var path = require('path');

    var File = require('File');
    var FileRefs = require('FileRefs');
    var Path = require('Path');
    var Watcher = require('Watcher');
    var Defaults = require('Defaults');
    var Lines = require('Lines');
    var Attribute = require('Attribute');

    var Emitter = $.require('Emitter');
    var Url = $.require('Url');

    var LogicFile = module.require('LogicFile');

    var mapper = new Map();




    function HtmlLinks(dir, config) {


        config = Defaults.clone(module.id, config);


        //base 为下级页面的基目录。
        //假如 base='Detail'，而引入下级页面的 href='/panel.html'，
        //则 href='Detai/panel.html'，即提供了一种短名称引入下级页面的方式。

        var meta = {
            'dir': dir,     //当前分母版页所在的目录。
            'master': '',   //当前分母版页的内容。
            'lines': [],    //html 换行拆分的列表
            'list': [],     //html 片段文件列表及其它信息。
            'emitter': new Emitter(this),
            'watcher': null,            //监控器，首次用到时再创建
            'regexp': config.regexp,    //
            'base': config.base,        //下级页面的基目录。
        };

        mapper.set(this, meta);


    }



    HtmlLinks.prototype = {
        constructor: HtmlLinks,

        /**
        * 重置为初始状态，即创建时的状态。
        */
        reset: function () {
            var meta = mapper.get(this);


            meta.list.forEach(function (item) {
                item.links.destroy();               //移除之前的子节点实例
                FileRefs.delete(item.file);         //删除之前的文件引用计数
            });


            $.Object.extend(meta, {
                'master': '',   //当前分母版页的内容。
                'lines': [],    //html 换行拆分的列表
                'list': [],     //html 片段文件列表及其它信息。
            });

        },

        /**
        * 从当前或指定的母版页 html 内容中提出 html 标签列表信息
        * @param {string} master 要提取的母版页 html 内容字符串。
        */
        parse: function (master) {
            var meta = mapper.get(this);
            master = meta.master = master || meta.master;

            //提取出如引用了 html 分文件的 link 标签
            var list = master.match(meta.regexp);
            if (!list) {
                return;
            }


            var lines = Lines.get(master);
            meta.lines = lines;

            var startIndex = 0;

            list = $.Array.map(list, function (item, index) {

                var index = Lines.getIndex(lines, item, startIndex);
                var line = lines[index]; //整一行的 html
                startIndex = index + 1; //下次搜索的起始行号

                //所在的行给注释掉了，忽略
                if (Lines.commented(line, item)) {
                    return null;
                }

                var href = Attribute.get(item, 'href');
                if (!href) {
                    return null;
                }

                var file = '';
                var prefix = Attribute.get(item, 'prefix');

                if (prefix) {
                    var selector = ' ' + prefix + '="' + href + '"';  //如 ` data-panel="/User/List" `
                    var matches = LogicFile.get(selector);

                    file = matches[0];

                    if (!file) {
                        console.log('无法找到内容中含有 '.bgRed, selector.bgYellow, ' 的 html 文件'.bgRed);
                        throw new Error();
                    }

                    if (matches.length > 1) {
                        console.log('找到多个内容中含有 '.bgRed, selector.bgYellow, ' 的 html 文件'.bgRed);
                        Log.logArray(matches, 'yellow');
                        throw new Error();
                    }

                    href = Path.relative(meta.dir, file);
                }
                else {
                    //以 '/' 开头，如 '/panel.html'，则补充完名称。
                    if (href.slice(0, 1) == '/') {
                        href = meta.base + href;
                    }

                    file = path.join(meta.dir, href);
                }
                

                href = Path.format(href);
                file = Path.format(file);

                FileRefs.add(file); //添加文件引用计数。
               

                var pad = line.indexOf(item);       //前导空格数
                pad = new Array(pad + 1).join(' '); //产生指定数目的空格

                var dir = Path.dirname(file);


                //递归下级页面

                //下级节点的基目录，根据当前页面的文件名得到
                var ext = path.extname(file);
                var base = path.basename(file, ext);


                var master = File.read(file);
                var links = new HtmlLinks(dir, { 'base': base });
                var list = links.parse(master);

                if (list && list.length > 0) {
                    console.log('复合片段'.bgMagenta, file.bgMagenta);
                }
            
                return {
                    'href': href,   //原始地址
                    'file': file,   //完整的物理路径。 
                    'index': index, //行号，从 0 开始
                    'html': item,   //标签的 html 内容
                    'line': line,   //整一行的 html 内容
                    'pad': pad,     //前导空格
                    'dir': dir,     //所在的目录
                    'name': base,   //基本名称，如 'CardList'
                    'links': links,  //下级页面
                };

            });

            meta.list = list;

            return list;
           

        },

        /**
        * 混入(递归)。
        * 即把对 html 分文件的引用用所对应的内容替换掉。
        */
        mix: function (options) {

            options = options || {
                'delete': false,    //是否删除源 master 文件，仅提供给上层业务 build 时使用。
            };

            var meta = mapper.get(this);
            var list = meta.list;

            if (list.length == 0) { //没有下级页面
                return meta.master;   //原样返回
            }

            var lines = meta.lines;


            list.forEach(function (item, index) {
              
                var html = item.links.mix(options); //递归
                console.log('混入'.yellow, item.file.green);


                //在所有行的前面加上空格串，以保持原有的缩进
                var pad = item.pad;
                html = pad + Lines.get(html).join(Lines.seperator + pad);

                lines[item.index] = html;

                if (options.delete) {
                    FileRefs.delete(item.file);
                }

            });

            var html = Lines.join(lines);

            return html;
        },

        /**
        * 监控当前 html 文件列表的变化。
        */
        watch: function () {
            var meta = mapper.get(this);
            var emitter = meta.emitter;
            var watcher = meta.watcher;

            if (!watcher) { //首次创建
                
                watcher = meta.watcher = new Watcher();

                //因为是静态文件列表，所以只监控文件内容是否发生变化即可。
                watcher.on('changed', function (files) {

                    //{ 文件名: [节点, 节点, ..., 节点] }，一对多的关系。
                    files.forEach(function (file) {

                        //根据当前文件名，找到具有相同文件名的节点集合。
                        //闭包的关系，这里必须用 meta.list，且不能缓存起来。
                        var items = $.Array.grep(meta.list, function (item, index) {
                            return item.file == file;
                        });

                        items.forEach(function (item) {

                            var file = item.file;
                            var html = File.read(file);
                            var links = item.links;

                            links.reset();      //
                            links.parse(html);  //可能添加或移除了下级子节点
                            links.watch();      //更新监控列表

                        });
                    });

                    emitter.fire('change');

                });
            }


            //监控下级节点所对应的文件列表。

            var files = [];

            meta.list.forEach(function (item) {

                files.push(item.file);


                var links = item.links;

                links.on('change', function () {
                    emitter.fire('change');
                });

                links.watch();

            });

            watcher.set(files);

        },


        /**
        * 删除引用列表中所对应的 html 物理文件。
        */
        delete: function () {
            var meta = mapper.get(this);
            var list = meta.list;

            list.forEach(function (item) {

                FileRefs.delete(item.file);

                item.links.delete(); //递归删除下级的
            });

        },



        /**
        * 绑定事件。
        */
        on: function (name, fn) {
            var meta = mapper.get(this);
            var emitter = meta.emitter;

            var args = [].slice.call(arguments, 0);
            emitter.on.apply(emitter, args);

            return this;
        },

        /**
        * 销毁当前对象。
        */
        destroy: function () {

            var meta = mapper.get(this);

            meta.emitter.destroy();

            var watcher = meta.watcher;
            watcher && watcher.destroy();

            meta.list.forEach(function (item) {
                item.links.destroy();
            });

            mapper.delete(this);



        },

    };



    return HtmlLinks;



});




