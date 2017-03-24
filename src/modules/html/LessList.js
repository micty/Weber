
/**
* 动态 Less 资源文件列表。
*/
define('LessList', function (require, module, exports) {

    var $ = require('$');
    var path = require('path');

    var File = require('File');
    var FileRefs = require('FileRefs');
    var Watcher = require('Watcher');
    var MD5 = require('MD5');
    var Path = require('Path');
    var Patterns = require('Patterns');
    var Defaults = require('Defaults');
    var Log = require('Log');

    var Emitter = $.require('Emitter');
    var Url = $.require('Url');
   

    var mapper = new Map();




    function LessList(dir, config) {


        config = Defaults.clone(module.id, config);


        var meta = {
            'dir': dir,         //母版页所在的目录。
            'master': '',       //母版页的内容，在 parse() 中用到。
            'html': '',         //模式所生成的 html 块。
            'outer': '',        //包括开始标记和结束标记在内的原始的整一块 html。
            'patterns': [],     //全部模式列表。
            'list': [],         //真实 less 文件列表。
            'less$item': {},    //less 文件所对应的信息

            'emitter': new Emitter(this),
            'watcher': null,    //监控器，首次用到时再创建

            'extraPatterns': config.extraPatterns,  //额外附加的模式。
            'md5': config.md5,                      //填充模板所使用的 md5 的长度
            'sample': config.sample,                //使用的模板
            'tags': config.tags,
            'htdocsDir': config.htdocsDir,
            'cssDir': config.cssDir,
            'concat': config.concat,
            'minify': config.minify,

            //记录 concat, minify 的输出结果
            'build': {
                file: '',       //完整物理路径
                href: '',       //用于 link 标签中的 href 属性
                content: '',    //合并和压缩后的内容
            },

        };

        mapper.set(this, meta);

    }



    LessList.prototype = {
        constructor: LessList,

        /**
        * 重置为初始状态，即创建时的状态。
        */
        reset: function () {
            var meta = mapper.get(this);
            var less$item = meta.less$item;

            meta.list.forEach(function (less) {
                var item = less$item[less];

                FileRefs.delete(less);
                FileRefs.delete(item.file);
            });


            $.Object.extend(meta, {
                'master': '',       //母版页的内容，在 parse() 中用到。
                'html': '',         //模式所生成的 html 块。
                'outer': '',        //包括开始标记和结束标记在内的原始的整一块 html。
                'patterns': [],     //模式列表。
                'list': [],         //真实 less 文件列表。
                'less$item': {},    //less 文件所对应的信息

                //记录 concat, minify 的输出结果
                'build': {
                    file: '',       //完整物理路径
                    href: '',       //用于 link 标签中的 href 属性
                    content: '',    //合并和压缩后的内容
                },
            });
        },

        /**
        * 从当前或指定的母版页 html 内容中提出 less 文件列表信息。
        * @param {string} master 要提取的母版页 html 内容字符串。
        */
        parse: function (master) {
            var meta = mapper.get(this);
            master = meta.master = master || meta.master;

            var tags = meta.tags;
            var html = $.String.between(master, tags.begin, tags.end);

            if (!html) {
                return;
            }

            var patterns = $.String.between(html, '<script>', '</script>');
            if (!patterns) {
                return;
            }

            var dir = meta.dir;

            //母版页中可能会用到的上下文。
            var context = {
                'dir': dir,
                'master': master,
                'tags': meta.tags,
                'htdocsDir': meta.htdocsDir,
                'cssDir': meta.cssDir,
            };

            var fn = new Function('require', 'context',
                //包装多一层匿名立即执行函数
                'return (function () { ' +
                    'var a = ' + patterns + '; \r\n' +
                    'return a;' +
                '})();'
            );

            //执行母版页的 js 代码，并注入变量。
            patterns = fn(require, context);

            if (!Array.isArray(patterns)) {
                throw new Error('引入文件的模式必须返回一个数组!');
            }

            patterns = patterns.concat(meta.extraPatterns); //跟配置中的模式合并
            patterns = Patterns.fill(dir, patterns);
            patterns = Patterns.combine(dir, patterns);

            console.log('匹配到'.bgGreen, patterns.length.toString().cyan, '个 less 模式:');
            Log.logArray(patterns);

            meta.patterns = patterns;
            meta.outer = tags.begin + html + tags.end;

        },

        /**
        * 根据当前模式获取对应真实的 less 文件列表和将要产生 css 文件列表。
        */
        get: function () {
            var meta = mapper.get(this);
            var patterns = meta.patterns;
            var htdocsDir = meta.htdocsDir;
            var cssDir = meta.cssDir;
            var less$item = meta.less$item;
          
            var list = Patterns.getFiles(patterns);

            list.forEach(function (less) {
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

            meta.list = list;
            
           
        },


        /**
        * 获取 less 文件列表所对应的 md5 值和引用计数信息。
        */
        md5: function () {
            var meta = mapper.get(this);
            var list = meta.list;
            var file$stat = {};

            list.forEach(function (file) {

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
                        'dest': options.write ? item.file : '',
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
        * 把当前的动态 less 引用模式块转成真实的静态 css 引用所对应的 html。
        */
        toHtml: function () {
            var meta = mapper.get(this);
            var sample = meta.sample;
            var list = meta.list;
            if (list.length == 0) {
                meta.html = '';
                return;
            }

            var tags = meta.tags;
            var less$item = meta.less$item;

            //todo: 检查重复的文件
            list = $.Array.keep(list, function (less, index) {

                var item = less$item[less];
                var href = item.href;

                var len = meta.md5;
                if (len > 0) {

                    var md5 = item.md5;
                    if (!md5) { //动态去获取 md5 值。
                        md5 = item.md5 = MD5.get(item.content, len);
                    }
         
                    href = href + '?' + md5;
                }

                return $.String.format(sample, {
                    'href': href,
                });
            });

            meta.html =
                tags.begin + '\r\n    ' +
                list.join('\r\n    ') + '\r\n    ' +
                tags.end + '\r\n    ';


        },

        /**
        * 把整一块动态 less 引用模式替换成真实的静态 css 引用。
        * @param {string} [master] 要替换的母版 html。 如果不指定，则使用原来的。
        *   注意，如果使用新的模板，则该模板中的模式不能变。
        */
        mix: function (master) {
            var meta = mapper.get(this);
            var outer = meta.outer;

            master = master || meta.master;

            //实现安全替换
            var beginIndex = master.indexOf(outer);
            var endIndex = beginIndex + outer.length;

            master =
                master.slice(0, beginIndex) +
                meta.html +
                master.slice(endIndex);

            return master;

        },

        /**
        * 合并对应的 css 文件列表。
        */
        concat: function (options) {

            var meta = mapper.get(this);
            var list = meta.list;
            if (list.length == 0) { //没有 less 文件
                meta.html = '';
                return;
            }



            if (options === true) { //直接指定了为 true，则使用默认配置。
                options = meta.concat;
            }

            var build = meta.build;
            var cssDir = meta.cssDir;
            var less$item = meta.less$item;
           

            var contents = [];

            list.forEach(function (less) {
                var item = less$item[less];
                contents.push(item.content);

                if (options.delete) { //删除源分 css 文件
                    FileRefs.delete(item.file);
                }
                
            });

            var content = contents.join('');



            var name = options.name || 32;
            var isMd5Name = typeof name == 'number';  //为数字时，则表示使用 md5 作为名称。
            var md5 = MD5.get(content);

            if (isMd5Name) {
                name = md5.slice(0, name) + '.css';
            }

            var file = cssDir + name;

            var href = path.relative(meta.dir, file);
            href = Path.format(href);

            if (options.write) { //写入合并后的 css 文件
                File.write(file, content);
            }


            $.Object.extend(build, {
                'file': file,
                'href': href,
                'content': content,
            });

            //更新 html

            //当不是以 md5 作为名称时，即当成使用固定的名称，如 index.all.debug.css，
            //为了确保能刷新缓存，这里还是强行加进了 md5 值作为 query 部分。
            var len = meta.md5;
            if (len > 0 && !isMd5Name) {
                href = href + '?' + md5.slice(0, len);
            }

            meta.html = $.String.format(meta.sample, {
                'href': href,
            });

        },

        /**
        * 压缩合并后的 css 文件。
        */
        minify: function (options, fn) {

            if (!options) {
                fn && fn();
                return;
            }


            var meta = mapper.get(this);
            if (meta.list.length == 0) { //没有 less 文件
                meta.html = '';
                fn && fn();
                return;
            }


            if (options === true) { //直接指定了为 true，则使用默认配置。
                options = meta.minify;
            }

            var cssDir = meta.cssDir;
            var build = meta.build;
            var content = build.content;

            var Less = require('Less');

            Less.render(content, {
                compress: true,

            }, function (error, output) {
            
                var content = output.css;

                var file = MD5.get(content);
                file = cssDir + file + '.css';

                var href = path.relative(meta.dir, file);
                href = Path.format(href);

                //删除 concat() 产生的文件
                if (options.delete) {
                    File.delete(build.file);
                }

                File.write(file, content);


                $.Object.extend(build, {
                    'file': file,
                    'href': href,
                    'content': content,
                });

                //更新 html
                meta.html = $.String.format(meta.sample, {
                    'href': href,
                });

                fn && fn();

            });

        },

        /**
        * 删除模式列表中所对应的 less 物理文件。
        */
        delete: function () {
            var meta = mapper.get(this);
            var list = meta.list;

            list.forEach(function (less) {
                FileRefs.delete(less);
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
                            self.toHtml();
                            emitter.fire('change');
                        });
                        
                    },

                    'deleted': function (files) {

                        //删除对应的记录
                        files.forEach(function (less) {
                            var item = less$item[less];
                            delete less$item[less];

                            FileRefs.delete(less, true);
                            FileRefs.delete(item.file, true); //实时删除对应的 css 文件。

                        });

                        self.get();
                        self.toHtml();

                        emitter.fire('change');
                    },

                    //重命名的，会分别触发：deleted 和 renamed
                    'renamed': function (files) {
                        self.get();
                        self.compile(files, function () {
                            self.toHtml();
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


                        //有一种情况：less 虽然发生了变化，但生成的 css 文件内容却不变。
                        //比如在 less 里加了些无用的空格、空行等。
                        var html = meta.html;

                        self.compile(files, function () {
                            self.toHtml();

                            //生成后的内容确实发生了变化
                            if (meta.html != html) {
                                emitter.fire('change');
                            }
                        });
                        
                    },

                });

            }

            watcher.set(patterns);
        },


        copy: function () {

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



    return LessList;



});




