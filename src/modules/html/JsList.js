
/**
* 动态 JS 资源文件列表。
*/
define('JsList', function (require, module, exports) {

    var $ = require('$');
    var path = require('path');

    var File = require('File');
    var FileRefs = require('FileRefs');
    var Path = require('Path');
    var Patterns = require('Patterns');
    var MD5 = require('MD5');
    var Watcher = require('Watcher');
    var Defaults = require('Defaults');
    var Log = require('Log');
    var Attribute = require('Attribute');
    var Lines = require('Lines');
    var Url = require('Url');

    var Emitter = $.require('Emitter');
    


    var mapper = new Map();




    function JsList(dir, config) {


        config = Defaults.clone(module.id, config);

        var rid = $.String.random(4); //随机 id

        var meta = {

            'dir': dir,         //母版页所在的目录。
            'master': '',       //母版页的内容，在 parse() 中用到。
            'html': '',         //模式所生成的 html 块，即缓存 toHtml() 方法中的返回结果。
            'outer': '',        //包括开始标记和结束标记在内的原始的整一块 html。
            'patterns': [],     //模式列表。
            'list': [],         //真实 js 文件列表及其它信息。
            'file$stat': {},    //记录文件内容中的最大行数和最大列数信息。 
            'file$md5': {}, 


            'scriptType': $.String.random(64),      //用于 script 的 type 值。 在页面压缩 js 时防止重复压缩。
            'emitter': new Emitter(this),
            'watcher': null,                        //监控器，首次用到时再创建。

            'extraPatterns': config.extraPatterns,  //额外附加的模式。
            'regexp': config.regexp,
            'md5': config.md5,
            'sample': config.sample,
            'tags': config.tags,
            'concat': config.concat,
            'minify': config.minify,
            'inline': config.inline,
            'max': config.max,              //允许的最大行数和列数。
            'htdocsDir': config.htdocsDir,

            //记录 concat, minify 的输出结果
            'build': {
                file: '',       //完整物理路径
                content: '',    //合并和压缩后的内容
            },

        };

        mapper.set(this, meta);

    }



    JsList.prototype = {
        constructor: JsList,

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
                'file$stat': {},    //文件所对应的最大行数和最大列数等统计信息。 
                'file$md5': {},     //
                'build': {
                    file: '',       //完整物理路径
                    content: '',    //合并和压缩后的内容
                },
            });

        },


        /**
        * 从当前或指定的母版页 html 内容中提出 js 文件列表信息。
        * @param {string} master 要提取的母版页 html 内容字符串。
        */
        parse: function (master) {
            var meta = mapper.get(this);
            master = meta.master = master || meta.master;
           

            var tags = meta.tags;
            var dir = meta.dir;
        
            var html = $.String.between(master, tags.begin, tags.end);
            if (!html) {
                return;
            }

            var patterns = $.String.between(html, '<script>', '</script>');

            if (!patterns) {

                var list = html.match(meta.regexp);
                if (!list) {
                    return;
                }
                
                var lines = Lines.get(html);
                var startIndex = 0;

                patterns = $.Array.map(list, function (item, index) {

                    var src = Attribute.get(item, 'src');
                    if (!src) {
                        console.log('JsList 块里的 script 标签必须含有 src 属性:'.bgRed, item);
                        throw new Error();
                    }

                    var index = Lines.getIndex(lines, item, startIndex);
                    var line = lines[index];    //整一行的 html。

                    //所在的行给注释掉了，忽略
                    if (Lines.commented(line, item)) {
                        return null;
                    }

                    startIndex = index + 1; //下次搜索的起始行号
                    
                    if (Url.checkFull(src)) { //是绝对(外部)地址
                        console.log('JsList 块里的 script 标签 src 属性不能引用外部地址:'.bgRed, item);
                        throw new Error();
                    }

                    src = Path.format(src);
                    return src;
                });

                patterns = JSON.stringify(patterns, null, 4);
            }


            if (!patterns) {
                return;
            }

            //母版页中可能会用到的上下文。
            var context = {
                'dir': dir,
                'master': master,
                'tags': meta.tags,
                'htdocsDir': meta.htdocsDir,
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

            console.log('匹配到'.bgGreen, patterns.length.toString().cyan, '个 js 模式:');
            Log.logArray(patterns);

            meta.patterns = patterns;
            meta.outer = tags.begin + html + tags.end;

        },

        /**
        * 根据当前模式获取对应真实的 js 文件列表和其它信息。
        */
        get: function () {
            var meta = mapper.get(this);
           
            //删除之前的文件引用计数
            meta.list.forEach(function (item) {
                FileRefs.delete(item.file);
            });

            var patterns = meta.patterns;
            var list = Patterns.getFiles(patterns);

            list = $.Array.keep(list, function (file, index) {

                file = Path.format(file);

                var href = path.relative(meta.dir, file);
                href = Path.format(href);

                FileRefs.add(file);

                return {
                    'file': file,
                    'href': href,
                };

            });

            meta.list = list;

        },


        /**
        * 获取 js 文件列表所对应的 md5 值和引用计数信息。
        */
        md5: function () {
            var meta = mapper.get(this);
            var file$md5 = meta.file$md5;
            var list = meta.list;
   
            var file$stat = {};

            list.forEach(function (item) {

                var file = item.file;
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
        * 把当前的动态 js 引用模式块转成真实的静态 js 引用所对应的 html。
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
            var file$stat = meta.file$stat;
            var file$md5 = meta.file$md5;

            var max = meta.max;

            //需要排除的文件列表，即不作检查的文件列表。
            var excludes = max.excludes;
            if (excludes) {
                excludes = Patterns.combine(meta.htdocsDir, excludes);
            }


            //todo: 检查重复的文件
            list = $.Array.keep(list, function (item, index) {
                var href = item.href;
                var file = item.file;

                var stat = file$stat[file];
                if (!stat) {
                    var content = File.read(file);
                    stat = file$stat[file] = Lines.stat(content);
                }

                //在排除列表中的文件，不作检查。
                //具体为: 如果未指定排除列表，或者不在排除列表中。
                if (!excludes || !Patterns.matchedIn(excludes, file)) {

                    if (stat.y > max.y) {
                        console.log('超出所允许的最大行数'.bgRed, JSON.stringify({
                            '所在文件': file,
                            '当前原始行数': stat.y0,
                            '当前有效行数': stat.y,
                            '允许最大行数': max.y,
                            '超过行数': stat.y - max.y,
                        }, null, 4).yellow);
                        throw new Error();
                    }

                    if (stat.x > max.x) {
                        console.log('代码行超出所允许的最大长度'.bgRed, JSON.stringify({
                            '所在文件': file,
                            '所在行号': stat.no,
                            '当前行长度': stat.x,
                            '允许最大长度': max.x,
                            '超过长度': stat.x - max.x,
                        }, null, 4).yellow);
                        throw new Error();
                    }
                }



                var len = meta.md5;
                if (len > 0) {

                    var md5 = file$md5[file];

                    if (!md5) { //动态去获取 md5 值。
                        md5 = file$md5[file] = MD5.read(file);
                    }

                    md5 = md5.slice(0, len);

                    href = href + '?' + md5;
                }

                return $.String.format(sample, {
                    'href': href,
                });
            });

            meta.html =
                tags.begin + '\r\n    ' +
                list.join('\r\n    ') + '\r\n    ' +
                tags.end + '\r\n';

        },

        /**
        * 把整一块动态 js 引用模式替换成真实的静态 js 引用。
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
                var file$stat = meta.file$stat;
                var file$md5 = meta.file$md5;
                var emitter = meta.emitter;

                watcher.on({
                    'added': function (files) {
                        self.get();
                        self.toHtml();
                        emitter.fire('change');
                    },

                    'deleted': function (files) {

                        //删除对应的记录
                        files.forEach(function (file) {
                            delete file$stat[file];
                            delete file$md5[file];
                            FileRefs.delete(file, true);
                        });

                        self.get();
                        self.toHtml();
                        emitter.fire('change');
                    },

                    //重命名的，会先后触发：deleted 和 renamed
                    'renamed': function (files) {
                        self.get();
                        self.toHtml();
                        emitter.fire('change');
                    },

                    'changed': function (files) {

                        //让对应的记录作废
                        files.forEach(function (file) {
                            file$stat[file] = null;
                            file$md5[file] = null;
                        });

                        self.toHtml();
                        emitter.fire('change');
                    },

                });
                
            }


            watcher.set(patterns);

        },

        /**
        * 合并对应的 js 文件列表。
        */
        concat: function (options) {

            var meta = mapper.get(this);
            var list = meta.list;
            if (list.length == 0) {
                meta.html = '';
                return;
            }


            if (options === true) { //直接指定了为 true，则使用默认配置。
                options = meta.concat;
            }
           

            list = $.Array.keep(list, function (item) {
                return item.file;
            });

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
            var content = JS.concat(list, {
                'addPath': options.addPath,
                'delete': options.delete,
            });


            var name = options.name || 32;
            var isMd5Name = typeof name == 'number';  //为数字时，则表示使用 md5 作为名称。
            var md5 = MD5.get(content);

            if (isMd5Name) {
                name = md5.slice(0, name) + '.js';
            }

            var file = meta.dir + name;

            if (options.write) { //写入合并后的 js 文件
                File.write(file, content);
            }


            $.Object.extend(meta.build, {
                'file': file,
                'content': content,
            });


            //更新 html

            var href = name;

            //当不是以 md5 作为名称时，即当成使用固定的名称，如 index.all.debug.js，
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
        * 压缩合并后的 js 文件。
        */
        minify: function (options) {
           
            var meta = mapper.get(this);
            if (meta.list.length == 0) {
                meta.html = '';
                return;
            }


            if (options === true) { //直接指定了为 true，则使用默认配置。
                options = meta.minify;
            }


            var build = meta.build;
            var content = build.content;

            if (options.delete) { //删除 concat() 产生的文件
                File.delete(build.file);
            }

            var JS = require('JS');
            content = JS.minify(content);    //直接从内容压缩，不读取文件


            var name = options.name || 32;
            var isMd5Name = typeof name == 'number';  //为数字时，则表示使用 md5 作为名称。
            var md5 = MD5.get(content);

            if (isMd5Name) {
                name = md5.slice(0, name) + '.js';
            }

            var file = meta.dir + name;

            if (options.write) {
                File.write(file, content);
            }


            $.Object.extend(build, {
                'file': file,
                'content': content,
            });

            //更新 html
            var href = name;

            //当不是以 md5 作为名称时，即当成使用固定的名称，如 index.all.debug.js，
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
        * 把 js 文件的内容内联到 html 中。
        */
        inline: function (options) {

            var meta = mapper.get(this);
            if (meta.list.length == 0) {
                meta.html = '';
                return;
            }

            if (options === true) {//直接指定了为 true，则使用默认配置。
                options = meta.inline;
            }

            var build = meta.build;
            var content = build.content;

            //删除 concat() 或 minify() 产生的文件
            if (options.delete) {
                File.delete(build.file);
            }
            
            //添加一个随机的 type 值，变成不可执行的 js 代码，
            //可以防止在压缩页面时重复压缩本 js 代码。
            var sample = '<script type="{type}">{content}</script>'
            meta.html = $.String.format(sample, {
                'type': meta.scriptType,
                'content': content,
            });

        },

        /**
        * 移除临时添加进去的 script type，恢复成可执行的 script 代码。
        */
        removeType: function (master) {
            var meta = mapper.get(this);

            var tag = $.String.format('<script type="{type}">', {
                'type': meta.scriptType,
            });

            master = master.split(tag).join('<script>'); //replaceAll
            return master;
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

            return this;
        },

    };


    return $.Object.extend(JsList, {

        //子类，用于提供实例方法:
        //检查 JsList 块里是否包含指定的 script 标签。
        Checker: (function () {

            var tags = null;

            function Checker(master) {
                tags = tags || Defaults.get(module.id).tags;
                this.html = $.String.between(master, tags.begin, tags.end);
            }

            Checker.prototype = {
                constructor: Checker,

                /**
                * 检查 JsList 块里是否包含指定的 script 标签。
                * 该方法主要是给 JsScripts 模块使用。
                * @param {string} 要检查的 html 文本内容。
                * @param {string} script 要检查的 script 标签内容。
                * @return {boolean} 返回一个布尔值，该值指示指定的 script 标签是否出现在 JsList 块里。
                */
                has: function (script) {
                    return this.html.indexOf(script) >= 0;
                },
            };

            return Checker;

        })(),

    });



});




