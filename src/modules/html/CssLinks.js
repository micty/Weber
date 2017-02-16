
/**
* 静态 CSS 资源文件列表。
*/
define('CssLinks', function (require, module, exports) {


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
    var $Url = $.require('Url');

    var mapper = new Map();



    function CssLinks(dir, config) {


        config = Defaults.clone(module.id, config);

        var meta = {
            'dir': dir,
            'master': '',
            'list': [],
            'lines': [],    //html 换行拆分的列表
            'file$md5': {},

            'emitter': new Emitter(this),
            'watcher': null,    //监控器，首次用到时再创建。

            'regexp': config.regexp,
            'md5': config.md5,
            'exts': config.exts,
            'minify': config.minify,
        };

        mapper.set(this, meta);

    }



    CssLinks.prototype = {
        constructor: CssLinks,

        /**
        * 重置为初始状态，即创建时的状态。
        */
        reset: function () {

            var meta = mapper.get(this);


            meta.list.forEach(function (item) {
                FileRefs.delete(item.file); //删除之前的文件引用计数
                FileRefs.delete(item.build.file); //删除之前的文件引用计数
            });


            $.Object.extend(meta, {
                'master': '',
                'list': [],
                'lines': [],
                'file$md5': {},
            });

        },

        /**
        * 从当前或指定的母版页 html 内容中提出 css 文件列表信息。
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

            var debug = meta.exts.debug;
            var min = meta.exts.min;
            var startIndex = 0;         //搜索的起始行号

            list = $.Array.map(list, function (item, index) {

                var src = Attribute.get(item, 'href');
                if (!src) {
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

                var href = Path.format(src);

                var ext = $.String.endsWith(href, debug) ? debug :
                    $.String.endsWith(href, min) ? min :
                    path.extname(href);

                var name = href.slice(0, -ext.length);

                var file = '';
                if (!Url.checkFull(src)) { //不是绝对(外部)地址
                    file = Path.join(meta.dir, href);
                   
                }

                var suffix = Url.suffix(src);

                return {
                    'file': file,       //完整的物理路径。 如果是外部地址，则为空字符串。
                    'src': src,         //原始地址，带 query 和 hash 部分。
                    'suffix': suffix,   //扩展名之后的部分，包括 '?' 在内的 query 和 hash 一整体。
                    'name': name,       //扩展名之前的部分。
                    'ext': ext,         //路径中的后缀名，如 '.debug.css' 或 '.min.css' 或 '.css'。
                    'index': index,     //行号，从 0 开始。
                    'html': item,       //标签的 html 内容。
                    'line': line,       //整一行的 html 内容。
                    'build': {},
                };

            });

            meta.list = list;
        

        },


        /**
        * 获取 css 文件列表所对应的 md5 值和引用计数信息。
        */
        md5: function () {
            var meta = mapper.get(this);
            var file$md5 = meta.file$md5;
            var list = meta.list;

            var file$stat = {};

            list.forEach(function (item) {

                var file = item.file;
                if (!file) {
                    return;
                }

                var stat = file$stat[file];
                if (stat) {
                    stat['count']++;
                    return;
                }


                var md5 = file$md5[file];
                if (!md5) {
                    md5 = file$md5[file] = MD5.read(file);
                }

                file$stat[file] = {
                    'count': 1,
                    'md5': md5,
                };

            });

            return file$stat;
        },

        /**
        * 监控 css 文件的变化。
        */
        watch: function () {
            var meta = mapper.get(this);

            //这里不要缓存起来，因为可能在 parse() 中给重设为新的对象。
            //var list = meta.list; 
            //var file$md5 = meta.file$md5; 

            var watcher = meta.watcher;

            if (!watcher) { //首次创建。

                watcher = meta.watcher = new Watcher();

                var self = this;
                var emitter = meta.emitter;

                watcher.on({

                    'added': function (files) {

                    },

                    'deleted': function (files) {

                        console.log('文件已给删除'.yellow, files);
                    },

                    //重命名的，会先后触发：deleted 和 renamed
                    'renamed': function (files) {

                        //emitter.fire('change');
                    },


                    'changed': function (files) {

                        files.forEach(function (file) {

                            //让对应的 md5 记录作废。
                            meta.file$md5[file] = '';

                            //根据当前文件名，找到具有相同文件名的节点集合。
                            var items = $.Array.grep(meta.list, function (item, index) {
                                return item.file == file;
                            });

                            //对应的 html 作废。
                            items.forEach(function (item) {
                                meta.lines[item.index] = null;
                            });

                        });

                        emitter.fire('change');
                    },

                });
            }


            var files = $.Array.map(meta.list, function (item) {
                return item.file || null;
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
            var file$md5 = meta.file$md5;
            var replace = $.String.replaceAll;

            var len = meta.md5;
            var rid = $.String.random(32);

            list.forEach(function (item) {

                var index = item.index;
                if (lines[index]) { //之前已经生成过了
                    return;
                }

                var build = item.build;
                var ext = build.ext || item.ext;
                var dest = item.name + ext + item.suffix;
                var file = build.file || item.file;

                if (file) {

                    FileRefs.add(file);

                    var md5 = file$md5[file];

                    if (!md5) { //动态去获取 md5 值。
                        md5 = file$md5[file] = MD5.read(file);
                    }

                    md5 = md5.slice(0, len);
                    dest = $Url.addQueryString(dest, md5, rid);
                    dest = replace(dest, md5 + '=' + rid, md5); //为了把类似 'MD5=XXX' 换成 'MD5'。
                }


                var html = replace(item.html, item.src, dest);
                var line = replace(item.line, item.html, html);

                lines[index] = line;

            });

 
            return Lines.join(lines);

        },

        /**
        * 压缩对应的 css 文件。
        */
        minify: function (options, done) {

            if (!options) {
                done && done();
                return;
            }

            var meta = mapper.get(this);
            if (options === true) { //直接指定了为 true，则使用默认配置。
                options = meta.minify;
            }

            var Less = require('Less');

            var meta = mapper.get(this);
            var list = meta.list;

            //并行地发起异步编译。
            var Tasks = require('Tasks');
            Tasks.parallel({
                data: list,
                all: done,
                each: function (item, index, done) {

                    var file = item.file;
                    var opts = options[item.ext];

                    if (!opts) {
                        return done();
                    }

                    if (!file) { //外部地址
                        if (opts.outer) { //指定了替换外部地址为压缩版
                            item.build.ext = opts.ext;
                        }

                        return done();
                    }


                    var dest = item.name + opts.ext;
                    dest = Path.join(meta.dir, dest);

                    Less.compile({
                        'src': file,
                        'compress': true,
                        'delete': opts.delete,
                        'overwrite': opts.overwrite,
                        'dest': opts.write ? dest : '',

                        'done': function (content) {

                            $.Object.extend(item.build, {
                                'file': dest,
                                'ext': opts.ext,
                                'content': content,
                            });

                            done();
                        },
                    });


                },
            });

        },

        /**
        * 删除列表中所对应的 css 物理文件。
        */
        'delete': function () {
            var meta = mapper.get(this);
            var list = meta.list;

            list.forEach(function (item) {
                FileRefs.delete(item.file);
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



    };



    return CssLinks;



});




