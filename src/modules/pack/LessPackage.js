
/**
* 动态 Less 资源文件列表。
*/
define('LessPackage', function (require, module, exports) {

    var $ = require('$');
    var File = require('File');
    var FileRefs = require('FileRefs');
    var Watcher = require('Watcher');
    var MD5 = require('MD5');
    var Path = require('Path');
    var Patterns = require('Patterns');
    var Defaults = require('Defaults');
    var MD5 = require('MD5');

    var Emitter = $.require('Emitter');

   

    var mapper = new Map();



    function LessPackage(dir, config) {


        config = Defaults.clone(module.id, config);


        var meta = {
            'dir': dir,         //母版页所在的目录。
            'patterns': [],     //模式列表。
            'list': [],         //真实 less 文件列表。
            'less$item': {},    //less 文件所对应的信息
            'content': '',      //合并后或压缩后的内容。

            'emitter': new Emitter(this),
            'watcher': null,    //监控器，首次用到时再创建

        };

        mapper.set(this, meta);

    }



    LessPackage.prototype = {
        constructor: LessPackage,

        /**
        * 重置为初始状态，即创建时的状态。
        */
        reset: function () {
            var meta = mapper.get(this);
            var less$item = meta.less$item;

            meta.list.forEach(function (less) {
                var item = less$item[less];
                FileRefs.delete(less);
            });


            $.Object.extend(meta, {
                'patterns': [],     //模式列表。
                'list': [],         //真实 less 文件列表。
                'less$item': {},    //less 文件所对应的信息
            });
        },


        /**
        * 根据当前模式获取对应真实的 less 文件列表和将要产生 css 文件列表。
        */
        get: function (patterns) {
            var meta = mapper.get(this);
            var less$item = meta.less$item;

            patterns = meta.patterns = Patterns.combine(meta.dir, patterns);

            var list = Patterns.getFiles(patterns);

            list.forEach(function (less) {
                //如 less = '../htdocs/html/test/style/less/index.less';

                if (less$item[less]) { //已处理过该项，针对 watch() 中的频繁调用。
                    return;
                }

                less$item[less] = {
                    'content': '',  //编译后的 css 内容。
                    'md5': '',      //编译后的 css 内容对应的 md5 值，需要用到时再去计算。
                };

                FileRefs.add(less);

            });

            meta.list = list;
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
                'delete': false,    //删除 less，仅提供给上层业务 build 时使用。
            };


            var Less = require('Less');
            var meta = mapper.get(this);
            var less$item = meta.less$item;

            var force = !!list;         //是否强制编译
            list = list || meta.list;

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
                        'delete': options.delete,
                        'compress': false,
                        'done': function (css) {
                            item.content = css;
                            done();
                        },
                    });

                },
                all: function () {
                    //已全部完成
                    fn && fn();
                },
            });
        },

        /**
        * 合并对应的 css 文件列表。
        */
        concat: function (dest) {

            var meta = mapper.get(this);
            var list = meta.list;
            if (list.length == 0) { //没有 less 文件
                return;
            }

            var less$item = meta.less$item;
            var contents = [];

            list.forEach(function (less) {
                var item = less$item[less];
                contents.push(item.content);
            });

            var content = meta.content = contents.join('');


            if (dest) {
                File.write(dest, content); //写入合并后的 css 文件
            }

            var md5 = MD5.get(content);

            return md5;
        },

        /**
        * 压缩合并后的 css 文件。
        */
        minify: function (dest, done) {

            var meta = mapper.get(this);
            var content = meta.content;
            var Less = require('Less');

            
            
            Less.minify(content, function (css) {

                if (typeof dest == 'object') {
                    var name = dest.name;

                    if (typeof name == 'number') {
                        name = MD5.get(css, name);
                        name += '.css';
                    }

                    dest = dest.dir + name;
                }

                File.write(dest, css);

                done && done(dest, css);
            });

        },

        /**
        * 监控当前模式下的所有 less 文件。
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
                var less$item = meta.less$item;
                var emitter = meta.emitter;


                watcher.on({
                    'added': function (files) {
                        self.get();
                        self.compile(files, function () {
                            emitter.fire('change');
                        });
                        
                    },

                    'deleted': function (files) {

                        //删除对应的记录
                        files.forEach(function (less) {
                            var item = less$item[less];
                            delete less$item[less];

                            FileRefs.delete(less, true);
                        });

                        self.get();

                        emitter.fire('change');
                    },

                    //重命名的，会分别触发：deleted 和 renamed
                    'renamed': function (files) {
                        self.get();
                        self.compile(files, function () {
                            emitter.fire('change');
                        });
                        
                    },

                    'changed': function (files) {

                        //让对应的记录作废
                        files.forEach(function (less) {
                            var item = less$item[less];
                            item.md5 = '';
                            item.content = '';
                        });

                        self.compile(files, function () {
                            emitter.fire('change');
                        });
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
        * 绑定事件。
        */
        on: function (name, fn) {
            var meta = mapper.get(this);
            var emitter = meta.emitter;

            var args = [].slice.call(arguments, 0);
            emitter.on.apply(emitter, args);
        },

        

    };



    return LessPackage;



});




