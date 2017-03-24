
/**
* 动态引用 HTML 资源文件列表。
*/
define('HtmlList', function (require, module, exports) {

    var $ = require('$');
    var path = require('path');

    var Watcher = require('Watcher');
    var Patterns = require('Patterns');
    var Path = require('Path');
    var Defaults = require('Defaults');
    var Log = require('Log');
    var Emitter = $.require('Emitter');
    var Url = $.require('Url');
   

    var mapper = new Map();


    //该模块不需要进行资源文件引用计数，交给 HtmlLinks 计数即可。

    function HtmlList(dir, config) {

        config = Defaults.clone(module.id, config);

        var rid = $.String.random(4); //随机 id

        var meta = {
            'dir': dir,         //母版页所在的目录。
            'master': '',       //母版页的内容，在 parse() 中用到。
            'html': '',         //模式所生成的 html 块，即缓存 toHtml() 方法中的返回结果。
            'outer': '',        //包括开始标记和结束标记在内的原始的整一块的 html。
            'patterns': [],     //模式列表。
            'list': [],         //真实 html 文件列表及其它信息。

            'emitter': new Emitter(this),
            'watcher': null,    //监控器，首次用到时再创建

            'extraPatterns': config.extraPatterns,  //额外附加的模式。
            'sample': config.sample, //使用的模板
            'tags': config.tags,

        };

        mapper.set(this, meta);

        this.id = 'HtmlList-' + $.String.random(4);

    }



    HtmlList.prototype = {
        constructor: HtmlList,

        id: '',

        /**
        * 重置为初始状态，即创建时的状态。
        */
        reset: function () {

            var meta = mapper.get(this);

            $.Object.extend(meta, {
                'master': '',       //母版页的内容，在 parse() 中用到。
                'html': '',         //模式所生成的 html 块，即缓存 toHtml() 方法中的返回结果。
                'outer': '',        //包括开始标记和结束标记在内的原始的整一块的 html。
                'patterns': [],     //模式列表。
                'list': [],         //真实 html 文件列表及其它信息。
            });

        },


        /**
        * 从当前或指定的母版页 html 内容中提出 html 文件列表信息。
        * @param {string} master 要提取的母版页 html 内容字符串。
        * @return {Array} 返回一个模式数组。
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

            //patterns 中的 html 可能含有 id 等其它属性。
            //如 <script id="views"></script>，分两次逐步提取。
            var patterns = $.String.between(html, '<script', '</script>');
            if (!patterns) {
                return;
            }

            var index = patterns.indexOf('>');
            if (index < 0) {
                return;
            }

            patterns = patterns.slice(index + 1);

            //母版页中可能会用到的上下文。
            var context = {
                'dir': dir,
                'master': master,
                'tags': tags,
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

            console.log('匹配到'.bgGreen, patterns.length.toString().cyan, '个 html 模式:');
            Log.logArray(patterns);

            meta.patterns = patterns;
            meta.outer = tags.begin + html + tags.end;

        },

        /**
        * 根据当前模式获取对应真实的 html 文件列表和其它信息。
        */
        get: function () {
            var meta = mapper.get(this);

            var patterns = meta.patterns;
            var list = Patterns.getFiles(patterns);

            meta.list = list = list.map(function (file, index) {

                file = Path.format(file);

                var href = path.relative(meta.dir, file);
                href = Path.format(href);

                return {
                    'file': file,
                    'href': href,
                };

            });

            return list;

        },

        /**
        * 把当前的动态 html 引用模式块转成真实的静态 html 引用所对应的 html。
        */
        toHtml: function () {
            var meta = mapper.get(this);

            var list = meta.list;
            if (list.length == 0) {
                meta.html = '';
                return;
            }


            var tags = meta.tags;
            var sample = meta.sample;

            //todo: 检查重复的文件
            list = list.map(function (item, index) {

                return $.String.format(sample, {
                    'href': item.href,
                });
            });

            //多一个空行。
            list = [''].concat(list);

            var Lines = require('Lines');
            var seperator = Lines.seperator + '    ';

            meta.html = list.join(seperator) + seperator;

        },

        /**
        * 把整一块动态 html 引用模式替换成真实的静态 html 引用。
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
        * 监控当前模式下 html 文件的变化。
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

                var emitter = meta.emitter;
                var self = this;

                watcher.on({
                    'added': function (files) {
                        self.get();
                        self.toHtml();
                        emitter.fire('change');
                    },

                    'deleted': function (files) {
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

                });

            }

            watcher.set(patterns);
           

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



    return Object.assign(HtmlList, {

        //创建相应的多个实例的列表。
        create: function (master, dir, config) {
            config = Defaults.clone(module.id, config);
          
            var list = master.split(config.tags.begin);

            list = list.slice(1).map(function (item) {
                return new HtmlList(dir, config);
            });

            return list;
        },

    });



});




