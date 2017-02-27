
/**
* 
*/
define('HtmlPackage', function (require, module, exports) {

    var $ = require('$');
    var File = require('File');
    var FileRefs = require('FileRefs');
    var Path = require('Path');
    var Patterns = require('Patterns');
    var Watcher = require('Watcher');
    var Defaults = require('Defaults');
    var HtmlLinks = require('HtmlLinks');
    var MD5 = require('MD5');

    var Emitter = $.require('Emitter');
    

    var mapper = new Map();



    function HtmlPackage(dir, config) {


        config = Defaults.clone(module.id, config);
        var emitter = new Emitter(this);


        var meta = {
            'dir': dir,                 //母版页所在的目录。
            'patterns': [],             //模式列表。
            'list': [],                 //真实 html 文件列表及其它信息。
            'html': '',                 //编译后的  html 内容。
            'minify': config.minify,    //
            'watcher': null,            //监控器，首次用到时再创建。
            'emitter': emitter,
        };

        mapper.set(this, meta);

    }



    HtmlPackage.prototype = {
        constructor: HtmlPackage,


        /**
        * 重置为初始状态，即创建时的状态。
        */
        reset: function () {

            var meta = mapper.get(this);

            //删除之前的文件引用计数
            meta.list.forEach(function (item) {
                FileRefs.delete(item.file);
                item.HtmlLinks.destroy();
            });

            $.Object.extend(meta, {
                'patterns': [],     //模式列表。
                'list': [],         //真实 html 文件列表及其它信息。
                'html': '',         //编译后的  html 内容。
            });

        },

        /**
        * 根据当前模式获取对应真实的 html 文件列表。
        */
        get: function (patterns) {
            var meta = mapper.get(this);
            var dir = meta.dir;

            patterns = meta.patterns = Patterns.combine(dir, patterns);

            var list = Patterns.getFiles(patterns);

            list = list.map(function (file, index) {

                file = Path.format(file);
                FileRefs.add(file);

                return {
                    'file': file,
                    'html': '',                         //编译后产生的 html 内容。
                    'HtmlLinks': new HtmlLinks(dir),    //对应的 HtmlLinks 实例。
                };

            });

            meta.list = list;

        },


        /**
        * 编译当前母版页。
        */
        compile: function (dest) {
            var meta = mapper.get(this);
            var list = meta.list;
            var htmls = [];

            list.forEach(function (item) {

                var html = item.html;

                if (!html) {
                    var file = item.file;
                    var HtmlLinks = item.HtmlLinks;

                    html = File.read(file);

                    HtmlLinks.reset();
                    HtmlLinks.parse(html);
                    html = HtmlLinks.mix();

                    item.html = html;
                }

                htmls.push(html);

            });

            var html = meta.html = htmls.join('');
            if (dest) {
                File.write(dest, html);
            }

            var md5 = MD5.get(html);
            return md5;

        },

        /**
        * 对 html 进行压缩。
        */
        minify: function (options, dest) {
            var Html = require('Html');

            var meta = mapper.get(this);
            var html = meta.html;

            html = Html.minify(html, options);
      
            if (typeof dest == 'object') {
                var name = dest.name;

                if (typeof name == 'number') {
                    name = MD5.get(html, name);
                    name += '.html';
                }

                dest = dest.dir + name;
            }

            File.write(dest, html);

            return dest;
        },

        /**
        * 删除引用列表中所对应的 html 物理文件。
        */
        delete: function () {
            var meta = mapper.get(this);
            var list = meta.list;

            list.forEach(function (item) {
                FileRefs.delete(item.file);
                item.HtmlLinks.delete(); //递归删除下级的
            });

        },



        /**
        * 监控当前模式下 html 文件的变化。
        */
        watch: function () {
            var meta = mapper.get(this);
            var patterns = meta.patterns;
            if (patterns.length == 0) { //列表为空，不需要监控
                return;
            }

            var emitter = meta.emitter;
            var watcher = meta.watcher;
       

            if (!watcher) { //首次创建

                watcher = meta.watcher = new Watcher();
                var self = this;

                function add(files) {

                    var dir = meta.dir;

                    //增加到列表
                    var list = files.map(function (file, index) {
                        file = Path.format(file);
                        FileRefs.add(file);

                        return {
                            'file': file,
                            'html': '',   //编译后产生的 html 内容。
                            'HtmlLinks': new HtmlLinks(dir), //对应的 HtmlLinks 实例。
                        };
                    });

                    meta.list = meta.list.concat(list);
                }


                watcher.on({
                    'added': function (files) {
                        add(files);
                        emitter.fire('change');
                    },

                    'deleted': function (files) {

                        //从列表中删除
                        var obj = {};
                        files.forEach(function (file) {
                            FileRefs.delete(file, true);
                            obj[file] = true;
                        });

                        meta.list = meta.list.filter(function (item) {
                            var file = item.file;
                            return !obj[file];
                        });

                        emitter.fire('change');
                    },

                    //重命名的，会先后触发 deleted 和 renamed
                    'renamed': function (files) {
                        add(files);
                        emitter.fire('change');
                    },

                    'changed': function (files) {
                        var obj = {};
                        files.forEach(function (file) {
                            obj[file] = true;
                        });

                        meta.list.forEach(function (item) {
                            var file = item.file;
                            if (obj[file]) {
                                item.html = '';
                            }

                        });

                        emitter.fire('change');
                    },

                });

                watcher.set(patterns);
            }

            //下级节点
            meta.list.forEach(function (item) {
                var HtmlLinks = item.HtmlLinks;
                HtmlLinks.watch();

                HtmlLinks.on('change', function () {
                    item.html = ''; //让之前编译的内容作废
                    emitter.fire('change');
                });

            });
        },

        /**
        * 取消监控。
        */
        unwatch: function () {
            var meta = mapper.get(this);
            var watcher = meta.watcher;
            if (watcher) {
                watcher.close();
            }
        },

        /**
        * 绑定事件。
        */
        on: function (name, fn) {
            var meta = mapper.get(this);
            var emitter = meta.emitter;

            var args = [].slice.call(arguments, 0);
            emitter.on.apply(emitter, args);

        },

    };



    return $.Object.extend(HtmlPackage, {

       
    });



});




