
/**
* 动态 JS 资源文件列表。
*/
define('JsPackage', function (require, module, exports) {

    var $ = require('$');
    var File = require('File');
    var FileRefs = require('FileRefs');
    var Path = require('Path');
    var Patterns = require('Patterns');
    var Watcher = require('Watcher');
    var Defaults = require('Defaults');
    var MD5 = require('MD5');

    var Emitter = $.require('Emitter');
    


    var mapper = new Map();




    function JsPackage(dir, config) {


        config = Defaults.clone(module.id, config);

        var meta = {

            'dir': dir,
            'patterns': [],     //模式列表。
            'list': [],         //真实 js 文件列表及其它信息。
            'content': '',      //编译后的 js 内容。
            'emitter': new Emitter(this),
            'watcher': null,                //监控器，首次用到时再创建。



        };

        mapper.set(this, meta);

    }



    JsPackage.prototype = {
        constructor: JsPackage,

        /**
        * 重置为初始状态，即创建时的状态。
        */
        reset: function () {

            var meta = mapper.get(this);

            //删除之前的文件引用计数
            meta.list.forEach(function (item) {
                FileRefs.delete(item.file);         
            });


            $.Object.extend(meta, {
                'master': '',       //母版页的内容，在 parse() 中用到。
                'html': '',         //模式所生成的 html 块，即缓存 toHtml() 方法中的返回结果。
                'outer': '',        //包括开始标记和结束标记在内的原始的整一块 html。
                'patterns': [],     //模式列表。
                'list': [],         //真实 js 文件列表及其它信息。
                'content': '',      //编译后的 js 内容。
            });

        },

        /**
        * 根据当前模式获取对应真实的 js 文件列表。
        */
        get: function (patterns) {
            var meta = mapper.get(this);
            var dir = meta.dir;

            patterns = meta.patterns = Patterns.combine(dir, patterns);

            var list = Patterns.getFiles(patterns);

            list = list.map(function (file, index) {

                file = Path.format(file);
                FileRefs.add(file);

                return file;

            });

            meta.list = list;

        },


        /**
        * 合并对应的 js 文件列表。
        */
        concat: function (options) {

            var meta = mapper.get(this);
            var list = meta.list;
            if (list.length == 0) {
                meta.content = '';
                return;
            }

            //加上文件头部和尾部，形成闭包
            var header = options.header;
            if (header) {
                header = Path.format(header);
                FileRefs.add(header);
                list = [header].concat(list);
            }

            var footer = options.footer;
            if (footer) {
                footer = Path.format(footer);
                FileRefs.add(footer);
                list = list.concat(footer);
            }

            var JS = require('JS');
            var content = meta.content = JS.concat(list, options);
            var md5 = MD5.get(content);

            return md5;

        },

        /**
        * 压缩合并后的 js 文件。
        */
        minify: function (dest) {

            var meta = mapper.get(this);
            var content = meta.content;
            var JS = require('JS');

            //直接从内容压缩，不读取文件
            content = meta.content = JS.minify(content);

            if (typeof dest == 'object') {
                var name = dest.name;
                if (typeof name == 'number') {
                    name = MD5.get(content, name);
                    name += '.js';
                }

                dest = dest.dir + name;
                File.write(dest, content); //写入合并后的 js 文件
            }

            return dest;
        },



        /**
        * 监控当前模式下 js 文件的变化。
        */
        watch: function () {
            var meta = mapper.get(this);
            var patterns = meta.patterns;
            if (patterns.length == 0) { //列表为空，不需要监控
                return;
            }

            var watcher = meta.watcher;

            if (!watcher) { //首次创建
               
                watcher = meta.watcher = new Watcher();

                var self = this;
                var emitter = meta.emitter;

                function add(files) {

                    //增加到列表
                    var list = files.map(function (file, index) {
                        file = Path.format(file);
                        FileRefs.add(file);
                        return file;
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

                        meta.list = meta.list.filter(function (file) {
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
                        emitter.fire('change');
                    },

                });
                
            }


            watcher.set(patterns);

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
        * 删除模式列表中所对应的 js 物理文件。
        */
        delete: function () {
            var meta = mapper.get(this);

            meta.list.forEach(function (item) {
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
        },

       

    };


    return $.Object.extend(JsPackage, {

       
    });



});




