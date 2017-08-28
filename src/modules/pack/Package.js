
/**
* 私有包。
*/
define('Package', function (require, module, exports) {

    var $ = require('$');
    var path = require('path');

    var File = require('File');
    var FileRefs = require('FileRefs');
    var Path = require('Path');
    var Watcher = require('Watcher');
    var Defaults = require('Defaults');
    var Lines = require('Lines');
    var Url = require('Url');
    var Patterns = require('Patterns');
    var Log = require('Log');

    var Emitter = $.require('Emitter');
    var HtmlPackage = require('HtmlPackage');
    var JsPackage = require('JsPackage');
    var LessPackage = require('LessPackage');

    var mapper = new Map();
    var name$file = {};         //记录包的名称与文件名的对应关系，防止出现重名的包。



    function Package(file, config) {

        config = Defaults.clone(module.id, config);

        var htdocsDir = config.htdocsDir;
        file = Path.join(htdocsDir, file);

        var dir = Path.dirname(file); //分包 package.json 文件所在的目录

        var meta = {
            'dir': dir,
            'file': file,

            'htdocsDir': htdocsDir,
            'packageDir': config.packageDir,
            'cssDir': config.cssDir,
            'compile': config.compile,
            'minify': config.minify,
            'md5': config.md5,


            'emitter': new Emitter(this),
            'watcher': null, //监控器，首次用到时再创建

            'old': {},      //用来存放旧的 HtmlPackage、JsPackage 和 LessPackage。

            'HtmlPackage': null,
            'JsPackage': null,
            'LessPackage': null,

            'css': '',
            'html': '',
            'js': '',
        };

        mapper.set(this, meta);
    }



    Package.prototype = {
        constructor: Package,

        /**
        * 重置上一次可能存在的结果。
        */
        reset: function () {
            var meta = mapper.get(this);
            var old = meta.old;

            //先备份。 old 中的一旦有值，将再也不会变为 null。
            old.HtmlPackage = meta.HtmlPackage;
            old.JsPackage = meta.JsPackage;
            old.LessPackage = meta.LessPackage;

            //再清空。
            $.Object.extend(meta, {
                'HtmlPackage': null,
                'JsPackage': null,
                'LessPackage': null,

                'css': '',
                'html': '',
                'js': '',
            });
        },

        /**
        * 
        */
        parse: function () {
            var meta = mapper.get(this);
            var file = meta.file;
            var dir = meta.dir;
            var htdocsDir = meta.htdocsDir;

            var json = File.readJSON(file);
            var name = json.name;

            //如果未指定 name，则以包文件所在的目录的第一个 js 文件名作为 name。
            if (!name) {
                var files = Patterns.getFiles(dir, '*.js');
                name = files[0];
                if (!name) {
                    console.log('包文件'.bgRed, file.yellow, '中未指定 name 字段，且未在其的所在目录找到任何 js 文件。'.bgRed);
                    throw new Error();
                }
                name = Path.relative(dir, name);
                name = name.slice(0, -3); //去掉 `.js` 后缀。
            }
            else if (name == '*') {
                name = Path.relative(htdocsDir, dir);
                name = name.split('/').join('.');
            }

            var oldFile = name$file[name];
            if (oldFile && oldFile != file) {
                console.log('存在同名'.bgRed, name.green, '的包文件:'.bgRed);
                Log.logArray([oldFile, file], 'yellow');
                throw new Error();
            }

            name$file[name] = file;
            meta.name = name;

            var old = meta.old;
            var packageDir = htdocsDir + meta.packageDir;

            if (json.html) {
                meta.HtmlPackage = old.HtmlPackage || new HtmlPackage(dir);
                meta.html = {
                    'src': json.html,
                    'dir': packageDir,
                    'dest': packageDir + name + '.html',
                    'md5': '',
                };
            }

            if (json.js) {
                meta.JsPackage = old.JsPackage || new JsPackage(dir);
                meta.js = {
                    'src': json.js,
                    'dir': packageDir,
                    'dest': packageDir + name + '.js',
                    'md5': '',
                };
            }

            if (json.css) {
                var cssDir = htdocsDir + meta.cssDir;
                meta.LessPackage = old.LessPackage || new LessPackage(dir);
                meta.css = {
                    'src': json.css,
                    'dir': cssDir,
                    'dest': cssDir + name + '.css',
                    'md5': '',
                };
            }

        },

        /**
        * 编译当前包文件。
        */
        compile: function (options, done) {

            //重载 compile(done)
            if (typeof options == 'function') {
                done = options;
                options = null;
            }

            var meta = mapper.get(this);
            var HtmlPackage = meta.HtmlPackage;
            var JsPackage = meta.JsPackage;
            var LessPackage = meta.LessPackage;


            options = options || meta.compile;

            if (HtmlPackage) {
                var file = options.html.write ? meta.html.dest : '';

                HtmlPackage.reset();
                HtmlPackage.get(meta.html.src);

                meta.html.md5 = HtmlPackage.compile(file);

                if (options.html.delete) {
                    HtmlPackage.delete();
                }
            }


            if (JsPackage) {
                var js = options.js;
                js.dest = js.write ? meta.js.dest : '';

                JsPackage.reset();
                JsPackage.get(meta.js.src);
                meta.js.md5 = JsPackage.concat(js);
            }


            if (LessPackage) {
                var less = options.less;
                var opt = { delete: less.delete };

                LessPackage.reset();
                LessPackage.get(meta.css.src);

                LessPackage.compile(opt, function () {

                    var css = less.write ? meta.css.dest : '';
                    meta.css.md5 = LessPackage.concat(css);

                    done && done();
                });
            }
            else {
                done && done();
            }

        },

        /**
        * 压缩。
        */
        minify: function (options, done) {
            //重载 minify(done)
            if (typeof options == 'function') {
                done = options;
                options = null;
            }

            var meta = mapper.get(this);
            var dest = meta.dest;
            var HtmlPackage = meta.HtmlPackage;
            var JsPackage = meta.JsPackage;
            var LessPackage = meta.LessPackage;


            options = options || meta.minify;

            if (HtmlPackage) {
                var opt = options.html;
                if (opt) {
                    if (opt === true) { //当指定为 true 时，则使用默认的压缩选项。
                        opt = meta.minify.html;
                    }

                    var html = meta.html;
                    html.dest = HtmlPackage.minify(opt, {
                        'dir': html.dir,
                        'name': 32,         //md5 的长度。
                    });

                    html.md5 = '';
                }
            }

            if (JsPackage) {
                var opt = options.js;
                if (opt && opt.write) {
                    var js = meta.js;
                    js.dest = JsPackage.minify({
                        'dir': js.dir,
                        'name': 32,
                    });

                    js.md5 = '';
                }
            }

            if (LessPackage) {
                var opt = options.less;
                if (opt && opt.write) {
                    var css = meta.css;
                    var dest = {
                        'dir': css.dir,
                        'name': 32,         //md5 的长度。
                    };

                    LessPackage.minify(dest, function (dest, content) {
                        css.dest = dest;
                        css.md5 = '';

                        done && done();
                    });
                }
                else {
                    done && done();
                }
            }
            else {
                done && done();
            }


        },

        /**
        * 监控当前包文件及各个资源引用模块。
        */
        watch: function () {
            var meta = mapper.get(this);
            var HtmlPackage = meta.HtmlPackage;
            var JsPackage = meta.JsPackage;
            var LessPackage = meta.LessPackage;
            var emitter = meta.emitter;
            var old = meta.old;

            if (HtmlPackage) {
                HtmlPackage.watch();
                if (!old.HtmlPackage) {
                    HtmlPackage.on('change', function () {
                        var html = meta.html;
                        html.md5 = HtmlPackage.compile(html.dest);
                        emitter.fire('change');
                    });
                }
            }
            else if (old.HtmlPackage) {
                old.HtmlPackage.unwatch();
            }


            if (JsPackage) {
                JsPackage.watch();
                if (!old.JsPackage) {
                    JsPackage.on('change', function () {
                        var js = meta.js;
                        js.md5 = JsPackage.concat({ 'dest': js.dest, });
                        emitter.fire('change');
                    });
                }
            }
            else if (old.JsPackage) {
                old.JsPackage.unwatch();
            }

            if (LessPackage) {
                LessPackage.watch();
                if (!old.LessPackage) {
                    LessPackage.on('change', function () {
                        var css = meta.css;
                        css.md5 = LessPackage.concat(css.dest);
                        emitter.fire('change');
                    });
                }
            }
            else if (old.LessPackage) {
                old.LessPackage.unwatch();
            }


            var watcher = meta.watcher;
            if (!watcher) {

                var self = this;

                watcher = meta.watcher = new Watcher();
                watcher.set(meta.file);      //这里只需要添加一次

                watcher.on('changed', function () {
                    self.reset();
                    self.parse();       //json 文件发生变化，重新解析。
                    self.compile();     //根节点发生变化，需要重新编译。
                    self.watch();

                    emitter.fire('change');

                });
            }


        },

        /**
        * 构建。
        */
        build: function (options, done) {

            var pkg = this;
            pkg.parse();

            pkg.compile(options.compile, function () {

                pkg.minify(options.minify, function () {

                    done && done();

                });
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

        clean: function () {
            var meta = mapper.get(this);
            FileRefs.delete(meta.file);
        },

        /**
        * 获取输出目标包的信息。
        * 该方法由静态方法 write 调用。
        */
        get: function () {
            var meta = mapper.get(this);
            var name = meta.name;
            var htdocsDir = meta.htdocsDir;

            var data = {};

            ['js', 'html', 'css'].forEach(function (type) {

                var item = meta[type];
                if (!item) {
                    return;
                }


                var md5 = item.md5;

                if (typeof md5 != 'string') {
                    item = JSON.stringify(item, null, 4);
                    //console.log(item.bgMagenta);
                    console.log(item.bgRed);

                    var msg = ' item.md5 不是 string 类型。';
                    console.log('');
                    console.log('错误:'.bgRed, msg.bgRed, '请检查目标文件是否存在。');
                    throw new Error(msg);
                }


                var href = Path.relative(htdocsDir, item.dest);

                md5 = md5.slice(0, meta.md5);

                if (md5) {
                    href = href + '?' + md5;
                }

                data[type] = href;

            });

            var obj = {};
            obj[name] = data;

            return obj;
        },


    };


    //静态方法。
    return $.Object.extend(Package, {

        /**
        * 写入到指定的总包。
        */
        write: function (dest, pkgs, minify) {

            var json = File.readJSON(dest) || {};

            pkgs && pkgs.forEach(function (pkg) {

                var obj = pkg.get();

                $.Object.extend(json, obj);
            });

            File.writeJSON(dest, json, minify);
        },
    });



});




