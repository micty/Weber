
/**
* 母版页类。
*/
define('MasterPage', function (require, module, exports) {

    var path = require('path');
    var $ = require('$');
    var Emitter = $.require('Emitter');

    var MD5 = require('MD5');
    var File = require('File');
    var FileRefs = require('FileRefs');

    var Path = require('Path');
    var Defaults = require('Defaults');
    var Watcher = require('Watcher');

    var HtmlList = require('HtmlList');
    var HtmlLinks = require('HtmlLinks');
    var CssLinks = require('CssLinks');
    var JsList = require('JsList');
    var LessLinks = require('LessLinks');
    var LessList = require('LessList');
    var JsScripts = require('JsScripts');
    var Verifier = require('Verifier');

    var mapper = new Map();


    function MasterPage(file, config) {

        config = Defaults.clone(module.id, config);

        var htdocsDir = config.htdocsDir;

        file = Path.join(htdocsDir, file);

        var dir = Path.dirname(file);           //如 '../htdocs/html/test/'
        var ext = path.extname(file);           //如 '.html'
        var name = path.basename(file, ext);    //如 'index.master'
        name = path.basename(name, path.extname(name)); //如 'index'

        var dest = dir + name + ext;
        FileRefs.add(file);


        //元数据提取
        var meta = {
            'dir': dir,     //母版页所在的目录。
            'master': '',   //母版页的原始内容。
            'file': file,   //母版页所在的完整路径
            'dest': dest,   //输出页面完整路径

            'emitter': new Emitter(this),
            'watcher': null, //监控器，首次用到时再创建
            'name$master': {}, //每个模块填充后的中间结果
            'minifyHtml': config.minifyHtml,

            'htdocsDir': htdocsDir,

            //子模块实例

            //HtmlList 实例的列表，多个实例数组。
            'HtmlLists': [],

            'HtmlLinks': new HtmlLinks(dir, {
                'base': config.base || name,    //二级目录
            }),

            'CssLinks': new CssLinks(dir),
            'JsScripts': new JsScripts(dir),
            'JsList': new JsList(dir, {
                'htdocsDir': htdocsDir,
            }),


            'LessLinks': new LessLinks(dir, {
                'htdocsDir': htdocsDir,
                'cssDir': htdocsDir + config.cssDir,
            }),

            'LessList': new LessList(dir, {
                'htdocsDir': htdocsDir,
                'cssDir': htdocsDir + config.cssDir,
            }),
           
        };

        mapper.set(this, meta);


    }

    //实例方法。
    MasterPage.prototype = {
        constructor: MasterPage,
        /**
        * 编译当前母版页。
        */
        compile: function (done) {
            var meta = mapper.get(this);

            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessLinks = meta.LessLinks;
            var LessList = meta.LessList;

            var self = this;

            var name$master = meta.name$master;

            var master = File.read(meta.file);
            meta.master = master;

            //创建多个 HtmlList 实例，每个都有一个唯一的 id 字段。
            var HtmlLists = meta.HtmlLists = HtmlList.create(master, meta.dir);


            //动态引用 html 
            HtmlLists.map(function (item) {
                item.reset();
                item.parse(master);
                item.get();
                item.toHtml();
                master = item.mix();

                name$master['HtmlList'] = master;
            });

           


            //静态引用 html 
            HtmlLinks.reset();
            HtmlLinks.parse(master);
            master = HtmlLinks.mix();
            name$master['HtmlLinks'] = master;

            //静态引用 css 
            CssLinks.reset();
            CssLinks.parse(master);
            master = CssLinks.mix();
            name$master['CssLinks'] = master;

            //静态引用 js 
            JsScripts.reset();
            JsScripts.parse(master);
            master = JsScripts.mix();
            name$master['JsScripts'] = master;

            //动态引用 js 
            JsList.reset();
            JsList.parse(master);
            JsList.get();
            JsList.toHtml();
            master = JsList.mix();
            name$master['JsList'] = master;


            //静态引用 less
            LessLinks.reset();
            LessLinks.parse(master);
            LessLinks.get();
            LessLinks.compile(function () {
                master = LessLinks.mix();
                name$master['LessLinks'] = master;
               

                //动态引用 less 
                LessList.reset();
                LessList.parse(master);
                LessList.get();

                //检查重复引用或内容相同的文件。
                self.uniqueFiles(false);

                LessList.compile(function () {
                    LessList.toHtml();
                    master = LessList.mix();

                    //检查重复使用的 id。
                    self.uniqueIds(master, false);


                    File.write(meta.dest, master);

                    done && done();
                });

            });


            
        },

        /**
        * 根据当前各个资源引用模块生成的结果，混合成最终的 html。
        * 该方法主要给 watch() 使用。
        */
        mix: function (name, HtmlList) {

            var meta = mapper.get(this);
           
        
            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessLinks = meta.LessLinks;
            var LessList = meta.LessList;

            var name$master = meta.name$master;


            //注意，下面的 switch 各分支里不能有 break 语句。
            var master = meta.master;
            
            switch (name) {

                case 'HtmlList':
                    master = HtmlList.mix(master);
                    name$master['HtmlList'] = master;

                case 'HtmlLinks':
                    master = name$master['HtmlList'];

                    //这级的重新解析不能放在上一个分支里。
                    HtmlLinks.reset();
                    HtmlLinks.parse(master);    //所在的行号可能发生了变化，要重新解析
                    HtmlLinks.watch();
                    master = HtmlLinks.mix();
                    name$master['HtmlLinks'] = master;

                    CssLinks.reset();
                    CssLinks.parse(master);     //所在的行号可能发生了变化，要重新解析

                case 'CssLinks':
                    master = name$master['HtmlLinks'];
                    master = CssLinks.mix();
                    name$master['CssLinks'] = master;

                    JsScripts.reset();
                    JsScripts.parse(master);    //所在的行号可能发生了变化，要重新解析

                case 'JsScripts':
                    master = name$master['CssLinks'];
                    master = JsScripts.mix();
                    name$master['JsScripts'] = master;

                case 'JsList':
                    master = name$master['JsScripts'];
                    master = JsList.mix(master);
                    name$master['JsList'] = master;

                    LessLinks.reset(true);      //保留之前的编译信息。
                    LessLinks.parse(master);    //所在的行号可能发生了变化，要重新解析
                    LessLinks.get();

                case 'LessLinks':
                    master = name$master['JsList'];
                    master = LessLinks.mix();
                    name$master['LessLinks'] = master;

                case 'LessList':
                    master = name$master['LessLinks'];
                    master = LessList.mix(master);
               
            }

            this.uniqueFiles(false);
            this.uniqueIds(master, false);

            File.write(meta.dest, master);
        },

        /**
        * 监控当前母版页及各个资源引用模块。
        */
        watch: function () {
            var meta = mapper.get(this);
            var watcher = meta.watcher;
            if (watcher) {
                return;
            }

            //首次创建
            var HtmlLists = meta.HtmlLists;
            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessLinks = meta.LessLinks;
            var LessList = meta.LessList;

            var self = this;
            var file = meta.file;

            watcher = meta.watcher = new Watcher();
            watcher.set(file); //这里只需要添加一次
            watcher.on('changed', function () {
                self.compile();     //根节点发生变化，需要重新编译。
               
                HtmlLists.map(function (item) {
                    item.watch();
                });

                HtmlLinks.watch();
                CssLinks.watch();
                JsScripts.watch();
                JsList.watch();
                LessLinks.watch();
                LessList.watch();
            });
            
           

            HtmlLists.map(function (item) {
                item.watch();
                item.on('change', function () {
                    self.mix('HtmlList', item);
                });
            });

            HtmlLinks.watch();
            HtmlLinks.on('change', function () {
                self.mix('HtmlLinks');
            });

            CssLinks.watch();
            CssLinks.on('change', function () {
                self.mix('CssLinks');
            });

            JsScripts.watch();
            JsScripts.on('change', function () {
                self.mix('JsScripts');
            });

            JsList.watch();
            JsList.on('change', function () {
                self.mix('JsList');
            });

            LessLinks.watch();
            LessLinks.on('change', function () {
                self.mix('LessLinks');
            });


            LessList.watch();
            LessList.on('change', function () {
                self.mix('LessList');
            });

        },

        /**
        * 对 html 页面进行压缩。
        */
        minify: function (html, config) {
            //重载 minify(config)
            if (typeof html == 'object') {
                config = html;
                html = null;
            }


            var meta = mapper.get(this);
            html = html || meta.master;
            
            if (config === true) { //直接指定了为 true，则使用默认配置。
                config = meta.minifyHtml;
            }

            var Html = require('Html');
            html = Html.minify(html, config);

            return html;
        },

        /**
        * 构建当前页面。
        */
        build: function (options) {
            var done = null;
            if (typeof options == 'function') {
                done = options;
                options = null;
            }
            else {
                done = options ? options.done : null;
            }


            var self = this;
            var meta = mapper.get(this);

            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessLinks = meta.LessLinks;
            var LessList = meta.LessList;

            var master = File.read(meta.file);



            //创建多个 HtmlList 实例，每个都有一个唯一的 id 字段。
            var HtmlLists = meta.HtmlLists = HtmlList.create(master, meta.dir);

            //动态引用 html 
            HtmlLists.map(function (item) {
                item.reset();
                item.parse(master);
                item.get();
                item.toHtml();
                master = item.mix();
            });


            //静态引用 html 
            HtmlLinks.reset();
            HtmlLinks.parse(master);
            master = HtmlLinks.mix(options.htmlLinks);


            //静态引用 css 
            CssLinks.reset();
            CssLinks.parse(master);
            CssLinks.minify(options.minifyCss, function () {

                master = CssLinks.mix();

                //静态引用 js 
                JsScripts.reset();
                JsScripts.parse(master);

                var minifyJs = options.minifyJs;
                if (minifyJs) {
                    JsScripts.minify(minifyJs);
                }
                

                master = JsScripts.mix();

                var inlines = options.inlines;
                if (inlines) {
                    master = JsScripts.inline(inlines);
                }

                //动态引用 js 
                JsList.reset();
                JsList.parse(master);
                JsList.get();

                var opt = options.jsList;
                if (opt && opt.concat) {
                    JsList.concat(opt.concat);

                    if (opt.minify) {
                        JsList.minify(opt.minify);
                    }

                    if (opt.inline) {
                        JsList.inline(opt.inline);
                    }
                }
                else {
                    JsList.toHtml();
                }

                master = JsList.mix();

                LessLinks.reset();
                LessLinks.parse(master);
                LessLinks.get();

                var opt = options.lessLinks;
                LessLinks.compile(opt.compile, function () {

                    master = LessLinks.mix();

                    //动态引用 less 
                    LessList.reset();
                    LessList.parse(master);
                    LessList.get();


                    //检查重复引用或内容相同的文件。
                    self.uniqueFiles(true);

                    var opt = options.lessList;
                    LessList.compile(opt.compile, function () {

                        if (opt.concat) {
                            LessList.concat(opt.concat);
                            LessList.minify(opt.minify, function () {
                                master = LessList.mix();
                                after();
                            });
                        }
                        else {
                            after();
                        }

                        function after() {

                            self.uniqueIds(master, true);

                            var minifyHtml = options.minifyHtml;
                            if (minifyHtml) {
                                master = self.minify(master, minifyHtml);
                            }

                            master = JsList.removeType(master);
                            File.write(meta.dest, master);
                            done && done();
                        }
                    });
                   
                });



            });

        },

        /**
        * 检查重复的引用或内容相同的 js 文件。
        * 必须在调用 
                CssLinks.parse();
                JsScripts.parse();
                JsList.get();
                LessLinks.get();
                LessList.get() ;
            后使用该方法。
        */
        uniqueFiles: function (stop) {

            var meta = mapper.get(this);
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var CssLinks = meta.CssLinks;
            var LessLinks = meta.LessLinks;
            var LessList = meta.LessList;

            var stats = [
                JsList.md5(),
                CssLinks.md5(),
                JsScripts.md5(),
                LessLinks.md5(),
                LessList.md5(),
            ];

            var invalid = Verifier.files(stats);

            if (invalid) {
                console.log(('页面 ' + meta.file + ' 无法通过编译，请修正!').bgRed);
                if (stop) {
                    throw new Error();
                }
            }

        },

        /**
        * 检查重复使用的 id。
        */
        uniqueIds: function (master, stop) {

            var meta = mapper.get(this);
            var invalid = Verifier.ids(master);

            if (invalid) {
                console.log(('页面 ' + meta.file + ' 无法通过编译，请修正!').bgRed);
                if (stop) {
                    throw new Error();
                }
            }
        },



        clean: function () {
            var meta = mapper.get(this);


            FileRefs.delete(meta.file);
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

        /**
        * 统计当前模板页的信息。
        */
        stat: function () {
            

        },

    };


    return MasterPage;

});




