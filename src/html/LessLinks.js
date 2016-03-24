
/**
* 静态 Less 资源文件列表。
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

    var Mapper = $.require('Mapper');
    var Emitter = $.require('Emitter');
    var $Url = $.require('Url');

    var mapper = new Mapper();



    function LessLinks(dir, config) {

        Mapper.setGuid(this);

        config = Defaults.clone(module.id, config);

        var meta = {
            'dir': dir,
            'master': '',
            'list': [],
            'lines': [],    //html 换行拆分的列表
            'file$md5': {},

            'emitter': new Emitter(this),
            'watcher': null,    //监控器，首次用到时再创建。

            'md5': config.md5,
            'minify': config.minify,
        };

        mapper.set(this, meta);

    }



    LessLinks.prototype = {
        constructor: LessLinks,

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
        * 从当前或指定的母版页 html 内容中提出 less 文件列表信息。
        * @param {string} master 要提取的母版页 html 内容字符串。
        */
        parse: function (master) {

            var meta = mapper.get(this);
            master = meta.master = master || meta.master;

            //这个必须要有，不管下面的 list 是否有数据。
            var lines = Lines.get(master);
            meta.lines = lines;


            //提取出 [rel="less"] 的 link 标签
            var reg = /<link\s+.*rel\s*=\s*["\']less["\'].*\/>/ig;
            var list = master.match(reg);

            if (!list) {
                return;
            }

            var startIndex = 0;

            list = $.Array.map(list, function (item, index) {

                var src = Attribute.get(item, 'href');
                if (!src) {
                    return null;
                }

                var index = Lines.getIndex(lines, item, startIndex);
                var line = lines[index];    //整一行的 html。
                lines[index] = null;        //先清空，后续会在 mix() 中重新计算而填进去。

                //所在的行给注释掉了，忽略
                if (Lines.commented(line, item)) {
                    return null;
                }


                startIndex = index + 1; //下次搜索的起始行号

                var href = Path.format(src);
                var file = Path.join(meta.dir, href);
               

                return {
                    'file': file,       //完整的物理路径。 
                    'src': src,         //原始地址。
                    'index': index,     //行号，从 0 开始。
                    'html': item,       //标签的 html 内容。
                    'line': line,       //整一行的 html 内容。
                    'build': {},
                };

            });

            meta.list = list;
        

        },


        /**
        * 监控 less 文件的变化。
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

            //https://github.com/mishoo/UglifyJS2
            var Less = require('less');

            var meta = mapper.get(this);
            var list = meta.list;

            //并行地发起异步的 less 编译
            var $Array = require('Array');
            $Array.parallel({
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


                    //详见: http://lesscss.org/usage/#programmatic-usage
                    var content = File.read(file);

                    Less.render(content, {
                        paths: ['.'],       // Specify search paths for @import directives
                        filename: file,     // Specify a filename, for better error messages
                        compress: true,     // Minify CSS output

                    }, function (error, output) {

                        var content = output.css;

                        if (opts.delete) { //删除源 css 文件
                            FileRefs.delete(file);
                        }

                        var dest = item.name + opts.ext;
                        dest = path.join(meta.dir, dest);

                        if (opts.write) {

                            if (File.exists(dest)) {
                                if (opts.override) {
                                    File.write(dest, content);
                                }
                            }
                            else {
                                File.write(dest, content);
                            }

                        }

                        $.Object.extend(item.build, {
                            'file': dest,
                            'ext': opts.ext,
                            'content': content,
                        });


                        done();

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



    return LessLinks;



});




