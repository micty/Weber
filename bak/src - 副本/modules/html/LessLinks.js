
/**
* 静态 less 资源文件列表。
*/
define('LessLinks', function (require, module, exports) {

    var $ = require('$');
    var path = require('path');

    var Watcher = require('Watcher');
    var Defaults = require('Defaults');
    var MD5 = require('MD5');
    var File = require('File');
    var FileRefs = require('FileRefs');
    var Lines = require('Lines');
    var Path = require('Path');
    var Url = require('Url');
    var Attribute = require('Attribute');

    var Emitter = $.require('Emitter');

    var mapper = new Map();



    function LessLinks(dir, config) {


        config = Defaults.clone(module.id, config);

        var meta = {
            'dir': dir,

            'master': '',
            'list': [],
            'lines': [],        //html 换行拆分的列表
            'less$item': {},    //less 文件所对应的信息

            'emitter': new Emitter(this),
            'watcher': null,    //监控器，首次用到时再创建

            'regexp': config.regexp,
            'md5': config.md5,          //填充模板所使用的 md5 的长度
            'sample': config.sample,    //使用的模板
            'tags': config.tags,
            'htdocsDir': config.htdocsDir,
            'cssDir': config.cssDir,
            'minify': config.minify,
          
        };





        mapper.set(this, meta);

    }



    LessLinks.prototype = {
        constructor: LessLinks,

        /**
        * 重置为初始状态，即创建时的状态。
        * @param {boolean} keep 是否保留之前编译过的信息。
        *   如果需要保留，请指定为 true；否则指定为 false 或不指定。
        */
        reset: function (keep) {
            var meta = mapper.get(this);
            var less$item = meta.less$item;

            meta.list.forEach(function (obj) {
                var less = obj.file;
                var item = less$item[less];

                FileRefs.delete(less);
                FileRefs.delete(item.file);
            });

            $.Object.extend(meta, {
                'master': '',
                'list': [],
                'lines': [],        //html 换行拆分的列表
                'less$item': keep ? less$item : {},    //less 文件所对应的信息
            });
        },

        /**
        * 从当前或指定的母版页 html 内容中提出 less 文件列表信息。
        * @param {string} master 要提取的母版页 html 内容字符串。
        */
        parse: function (master) {

            var meta = mapper.get(this);
            master = meta.master = master || meta.master;

            //这里必须要有，不管下面的 list 是否有数据。
            var lines = Lines.get(master);
            meta.lines = lines;

            //提取出 link 标签
            var list = master.match(meta.regexp);
            if (!list) {
                return;
            }

            var startIndex = 0;         //搜索的起始行号

            list = $.Array.map(list, function (item, index) {

                var href = Attribute.get(item, 'href');
                if (!href) {
                    return null;
                }

                var index = Lines.getIndex(lines, item, startIndex);
                startIndex = index + 1;     //下次搜索的起始行号。 这里要先加

                var line = lines[index];    //整一行的 html。
                lines[index] = null;        //先清空，后续会在 mix() 中重新计算而填进去。

                //所在的行给注释掉了，忽略
                if (Lines.commented(line, item)) {
                    return null;
                }

                var file = Path.join(meta.dir, href);

                return {
                    'file': file,
                    'index': index,     //行号，从 0 开始。
                    'html': item,       //标签的 html 内容。
                    'line': line,       //整一行的 html 内容。
                };
            });

            meta.list = list;



        },


        /**
        * 根据当前真实的 less 文件列表获取对应将要产生 css 文件列表。
        */
        get: function () {
            var meta = mapper.get(this);

            var htdocsDir = meta.htdocsDir;
            var cssDir = meta.cssDir;
            var less$item = meta.less$item;

            meta.list.forEach(function (item) {
                var less = item.file;

                //如 less = '../htdocs/html/test/style/less/index.less';

                if (less$item[less]) { //已处理过该项，针对 watch() 中的频繁调用。
                    return;
                }


                var name = path.relative(htdocsDir, less);  //如 'html/test/style/less/index.less'
                var ext = path.extname(name);               //如 '.less' 
                var basename = path.basename(name, ext);    //如 'index'

                name = path.dirname(name);              //如 'html/test/style/less'
                name = name.split('\\').join('.');      //如 'html.test.style.less'
                name = name + '.' + basename + '.css';  //如 'html.test.style.less.index.css'

                var file = path.join(cssDir, name);
                file = Path.format(file);

                var href = path.relative(meta.dir, file);
                href = Path.format(href);

                less$item[less] = {
                    'file': file,   //完整的 css 物理路径。
                    'href': href,   //用于 link 标签中的 href 属性(css)
                    'content': '',  //编译后的 css 内容。
                    'md5': '',      //编译后的 css 内容对应的 md5 值，需要用到时再去计算。
                };

                FileRefs.add(less);
                FileRefs.add(file);

            });



        },


        /**
        * 获取 less 文件列表所对应的 md5 值和引用计数信息。
        */
        md5: function () {
            var meta = mapper.get(this);
            var list = meta.list;
            var file$stat = {};

            list.forEach(function (item) {

                var file = item.file;
                var stat = file$stat[file];

                if (stat) {
                    stat['count']++;
                    return;
                }

                var md5 = MD5.read(file);

                file$stat[file] = {
                    'count': 1,
                    'md5': md5,
                };

            });

            return file$stat;
        },



        /**
        * 编译 less 文件列表(异步模式)。
        * 如果指定了要编译的列表，则无条件进行编译。
        * 否则，从原有的列表中过滤出尚未编译过的文件进行编译。
        * 已重载:
            compile(list, fn);
            compile(list, options);
            compile(list);
            compile(fn);
            compile(options);
            compile(options, fn);
        * @param {Array} [list] 经编译的 less 文件列表。 
            如果指定了具体的 less 文件列表，则必须为当前文件引用模式下的子集。 
            如果不指定，则使用原来已经解析出来的文件列表。
            提供了参数 list，主要是在 watch() 中用到。
        */
        compile: function (list, options) {
            var fn = null;
            if (list instanceof Array) {
                if (typeof options == 'function') { //重载 compile(list, fn);
                    fn = options;
                    options = null;
                }
                else if (typeof options == 'object') { //重载 compile(list, options);
                    fn = options.done;
                }
                else { //重载 compile(list);
                    options = null;
                }
            }
            else if (typeof list == 'function') { //重载 compile(fn);
                fn = list;
                list = null;
            }
            else if (typeof list == 'object') { //重载 compile(options); 或 compile(options, fn)
                fn = options;
                options = list;
                list = null;
                fn = fn || options.done;
            }


            options = options || {  //这个默认值不能删除，供开发时 watch 使用。
                'write': true,      //写入 css
                'minify': false,    //使用压缩版。
                'delete': false,    //删除 less，仅提供给上层业务 build 时使用。
            };


            var Less = require('Less');
            var meta = mapper.get(this);
            var less$item = meta.less$item;
            var force = !!list;         //是否强制编译

            list = list || meta.list.map(function (item) {
                return item.file;
            });


            if (list.length == 0) { //没有 less 文件
                fn && fn();
                return;
            }



            //并行地发起异步的 less 编译
            var Tasks = require('Tasks');
            Tasks.parallel({
                data: list,
                each: function (less, index, done) {
                    var item = less$item[less];

                    //没有指定强制编译，并且该文件已经编译过了，则跳过。
                    if (!force && item.content) {
                        done();
                        return;
                    }

                    Less.compile({
                        'src': less,
                        'dest': options.write ? item.file : '',
                        'delete': options.delete,
                        'compress': options.minify,
                        'done': function (css) {
                            item.content = css;
                            done();
                        },
                    });

                },
                all: function () {  //已全部完成
                    fn && fn();
                },
            });
        },


        /**
        * 监控 css 文件的变化。
        */
        watch: function () {
            var meta = mapper.get(this);

            //这里不要缓存起来，因为可能在 parse() 中给重设为新的对象。
            //var list = meta.list; 
            var watcher = meta.watcher;

            if (!watcher) { //首次创建。
                watcher = meta.watcher = new Watcher();

                var self = this;
                var emitter = meta.emitter;
                var less$item = meta.less$item;

                watcher.on({

                    'deleted': function (files) {
                        console.log('文件已给删除'.yellow, files);
                    },

                    'changed': function (files) {

                        //让对应的记录作废
                        files.forEach(function (less) {
                            var item = less$item[less];
                            item.md5 = '';
                            item.content = '';

                            //根据当前文件名，找到具有相同文件名的节点集合。
                            //让对应的 html 作废。
                            meta.list.forEach(function (item) {
                                if (item.file != less) {
                                    return;
                                }

                                meta.lines[item.index] = null;
                            });
                        });

                        self.compile(files, function () {
                            emitter.fire('change');
                        });

                    },

                });
            }


            var files = meta.list.map(function (item) {
                return item.file;
            });

            watcher.set(files);

        },


        /**
        * 
        */
        mix: function () {
            var meta = mapper.get(this);
            var list = meta.list;
            var lines = meta.lines;
            var replace = $.String.replaceAll;
            var len = meta.md5;
            var less$item = meta.less$item;
            var sample = meta.sample;


            list.forEach(function (obj) {

                var index = obj.index;
                if (lines[index]) { //之前已经生成过了
                    return;
                }

                var less = obj.file;
                var item = less$item[less];
                var href = item.href;

                if (len > 0) {
                    var md5 = item.md5;
                    if (!md5) { //动态去获取 md5 值。
                        md5 = item.md5 = MD5.get(item.content, len);
                    }

                    href = href + '?' + md5;
                }

                var html = $.String.format(sample, {
                    'href': href,
                });

                var line = replace(obj.line, obj.html, html);

                lines[index] = line;

            });


            return Lines.join(lines);

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



    };



    return LessLinks;



});




