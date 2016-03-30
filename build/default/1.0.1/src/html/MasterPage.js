
/**
* 母版页类。
*/
define('MasterPage', function (require, module, exports) {

    var path = require('path');

    var $ = require('$');
    var Mapper = $.require('Mapper');
    var Emitter = $.require('Emitter');
    var mapper = new Mapper();

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
    var LessList = require('LessList');
    var JsScripts = require('JsScripts');


    function MasterPage(file, config) {

        Mapper.setGuid(this);
        config = Defaults.clone(module.id, config);

        var htdocsDir = config.htdocsDir;

        file = Path.join(htdocsDir, file);

        var dir = path.dirname(file) + '/';     //如 '../htdocs/html/test/'
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

            //子模块实例
            'HtmlList': new HtmlList(dir),
            'HtmlLinks': new HtmlLinks(dir, {
                'base': config.base || name,    //二级目录
            }),

            'CssLinks': new CssLinks(dir),
            'JsScripts': new JsScripts(dir),
            'JsList': new JsList(dir, {
                'htdocsDir': htdocsDir,
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

            var HtmlList = meta.HtmlList;
            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessList = meta.LessList;

            var name$master = meta.name$master;

            var master = File.read(meta.file);
            meta.master = master;

            //动态引用 html 
            HtmlList.reset();
            HtmlList.parse(master);
            HtmlList.get();
            HtmlList.toHtml();
            master = HtmlList.mix();
            name$master['HtmlList'] = master;

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

            //动态引用 less 
            LessList.reset();
            LessList.parse(master);
            LessList.get();

            //检查重复引用或内容相同的文件。
            this.unique();

            LessList.compile(function () {
                LessList.toHtml();
                master = LessList.mix();

                var ids = master.match(/\s+id\s*=\s*["'][\s\S]*?["']/ig);
                ids = $.Array.map(ids, function (item) {
                    var a = item.split(/\s+id\s*=\s*/i);
                    var id = a[1].slice(1, -1);

                    if (id.indexOf('{') >= 0 && id.indexOf('}') > 0) {
                        return null;
                    }

                    return id;
                });

                ids.sort();
                console.log(ids);
                File.writeJSON('ids.json', ids);

                File.write(meta.dest, master);

                done && done();
            });
        },

        /**
        * 根据当前各个资源引用模块生成的结果，混合成最终的 html。
        * 该方法主要给 watch() 使用。
        */
        mix: function (name) {

            var meta = mapper.get(this);
           
            var HtmlList = meta.HtmlList;
            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessList = meta.LessList;

            var name$master = meta.name$master;


            //注意，下面的 switch 各分支里不能有 break; 语句。
            var master = meta.master;
            
            switch (name) {

                case 'HtmlList':
                    master = HtmlList.mix(master);
                    name$master['HtmlList'] = master;

                case 'HtmlLinks':
                    master = name$master['HtmlList'];
                    HtmlLinks.reset();
                    HtmlLinks.parse(master);
                    HtmlLinks.watch();
                    master = HtmlLinks.mix();
                    name$master['HtmlLinks'] = master;

                case 'CssLinks':
                    master = name$master['HtmlLinks'];
                    CssLinks.reset();
                    CssLinks.parse(master);  //所在的行号可能发生了变化，要重新解析
                    master = CssLinks.mix();
                    name$master['CssLinks'] = master;

                case 'JsScripts':
                    master = name$master['CssLinks'];
                    JsScripts.reset();
                    JsScripts.parse(master);  //所在的行号可能发生了变化，要重新解析
                    master = JsScripts.mix();
                    name$master['JsScripts'] = master;

                case 'JsList':
                    master = name$master['JsScripts'];
                    master = JsList.mix(master);
                    name$master['JsList'] = master;

                case 'LessList':
                    master = name$master['JsList'];
                    master = LessList.mix(master);
               
            }

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
            var HtmlList = meta.HtmlList;
            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessList = meta.LessList;

            var self = this;
            var file = meta.file;

            watcher = meta.watcher = new Watcher();
            watcher.set(file); //这里只需要添加一次
            watcher.on('changed', function () {
                self.compile();
               
                HtmlList.watch();
                HtmlLinks.watch();
                CssLinks.watch();
                JsScripts.watch();
                JsList.watch();
                LessList.watch();
            });
            
            HtmlList.watch();
            HtmlList.on('change', function () {
                self.mix('HtmlList');
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


            //https://github.com/kangax/html-minifier
            var minifier = require('html-minifier');
            html = minifier.minify(html, config);

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

            var HtmlList = meta.HtmlList;
            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessList = meta.LessList;

            var master = File.read(meta.file);

            //动态引用 html 
            HtmlList.reset();
            HtmlList.parse(master);
            HtmlList.get();
            HtmlList.toHtml();
            master = HtmlList.mix();

            //静态引用 html 
            HtmlLinks.reset();
            HtmlLinks.parse(master);
            master = HtmlLinks.mix({
                'delete': true,
            });

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

                //动态引用 less 
                LessList.reset();
                LessList.parse(master);
                LessList.get();


                //检查重复引用或内容相同的文件。
                self.unique();

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
                        var minifyHtml = options.minifyHtml;
                        if (minifyHtml) {
                            master = self.minify(master, minifyHtml);
                        }

                        File.write(meta.dest, master);
                        done && done();
                    }
                });
            });

        },

        /**
        * 检查重复的引用或内容相同的 js 文件。
        * 必须在调用 CssLinks.parse()、JsScripts.parse()、JsList.get()、LessList.get() 后使用该方法。
        */
        unique: function () {

            var meta = mapper.get(this);
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var CssLinks = meta.CssLinks;
            var LessList = meta.LessList;

            var stats = [
                JsList.md5(),
                CssLinks.md5(),
                JsScripts.md5(),
                LessList.md5(),
            ];

            var file$stat = stats[0]; //总的 file$stat。

            //合并成一个 file$stat
            stats.slice(1).forEach(function (item) {

                $.Object.each(item, function (file, obj) {

                    var stat = file$stat[file];
                    if (stat) {
                        stat['count'] += obj['count'];
                    }
                    else {
                        file$stat[file] = obj;
                    }
                });
            });


            var md5$files = {};

            $.Object.each(file$stat, function (file, stat) {
                var md5 = stat.md5;
                var files = md5$files[md5];

                if (!files) {
                    files = md5$files[md5] = [];
                }

                files.push(file);

            });


            var file$count = {};    //重复引用同一个文件，根据文件路径识别。
            var md5$list = {};      //内容完全相同的文件，根据文件内容识别。

            $.Object.each(file$stat, function (file, stat) {
                var count = stat['count'];
                if (count > 1) {
                    file$count[file] = count;
                }
            });

           
            $.Object.each(md5$files, function (md5, files) {
                if (files.length > 1) {
                    md5$list[md5] = files;
                }
            });


            var invalid = false;

            if (Object.keys(file$count).length > 0) {
                invalid = true;
                console.log('重复引用同一个文件: '.bgRed);

                $.Object.each(file$count, function (file, count) {
                    console.log('    ' + file.red + ':', count.toString().cyan, '次');
                });
            }

            if (Object.keys(md5$list).length > 0) {
                invalid = true;
                console.log('内容完全相同的文件: '.bgRed);

                $.Object.each(md5$list, function (md5, list) {
                    console.log(md5.yellow, list.length.toString().cyan, '个:');
                    console.log('    ' + list.join('\r\n    ').red);
                });
            }


            if (invalid) {
                console.log(('页面 ' + meta.file + ' 无法通过编译，请修正!').bgRed);
                throw new Error();
            }

        },



        clean: function () {
            var meta = mapper.get(this);

            var HtmlList = meta.HtmlList;
            var HtmlLinks = meta.HtmlLinks;
            var CssLinks = meta.CssLinks;
            var JsScripts = meta.JsScripts;
            var JsList = meta.JsList;
            var LessList = meta.LessList;

       
            //HtmlLinks.delete();
            //CssLinks.delete(); 
            //JsScripts.delete(); 
            //JsList.delete();
            //LessList.delete();

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




