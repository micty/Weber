
/**
* 整个站点类。
*/
define('WebSite', function (require, module, exports) {

    var Path = require('Path');
    var Directory = require('Directory');
    var Patterns = require('Patterns');
    var FileRefs = require('FileRefs');
    var Defaults = require('Defaults');
    var Tasks = require('Tasks');
    var Package = require('Package');


    var Watcher = require('Watcher');
    var Log = require('Log');

    var Masters = module.require('Masters');
    var Packages = module.require('Packages');
    var Url = module.require('Url');
    var Files = module.require('Files');

    var mapper = new Map();

    
    function WebSite(config) {

        config = Defaults.clone(module.id, config);

        var meta = {
            'masters': config.masters,
            'packages': config.packages,
            'cssDir': config.cssDir,
            'htdocsDir': config.htdocsDir,
            'buildDir': config.buildDir,
            'packageDir': config.packageDir,
            'packageFile': config.packageFile,
            'url': config.url,
            'qr': config.qr,
            'cwd': config.htdocsDir,  //当前工作目录，是 htdocsDir 或 buildDir。


        };

        mapper.set(this, meta);

        WebSite.current = this;

    }


    



    WebSite.prototype = {
        constructor: WebSite,



        /**
        * 构建整个站点。
        */
        build: function (options, done) {
            var meta = mapper.get(this);

            var htdocsDir = meta.htdocsDir;
            var cssDir = meta.cssDir;
            var packageDir = meta.packageDir;
            var cwd = meta.cwd = options.dir || meta.buildDir;

            console.log('删除目录'.bgYellow, cwd.yellow);
            Directory.delete(cwd);

            console.log('复制目录'.bgMagenta, htdocsDir.green, '→', cwd.cyan);
            Directory.copy(htdocsDir, cwd);

            //构建前要排除在外的文件或目录。
            Files.clear(cwd, options.exclude, '排除');

          
            //先删除自动生成的目录，后续会再生成回来。
            Directory.delete(cwd + cssDir);
            Directory.delete(cwd + packageDir);

            var packageFile = meta.packageFile;
            if (packageFile) {
                var dest = Path.join(cwd, packageFile);
                Package.write(dest); //写一个空 {} 入到总包
            }


            var processMasters = Masters.build(meta, options.masters);
            var processPackages = meta.packages ? Packages.build(meta, options.packages) : null;


            //并行处理任务。
            Tasks.parallel({
                data: [ //任务列表。
                    processMasters,
                    processPackages,
                ],  

                each: function (task, index, done) {
                    if (task) {
                        task(done);
                    }
                    else {
                        done();
                    }
                },

                all: function () {
                    FileRefs.clean(); //删除已注册并且引用计数为 0 的物理文件。

                    //构建后需要清理的文件或目录。
                    Files.clear(cwd, options.clean, '清理');


                    //递归删除空目录
                    Directory.trim(cwd);
                    Log.allDone('全部构建完成');
                    done && done();
                },

            });
        },

        /**
        * 编译整个站点，完成后开启监控。
        */
        watch: function (done) {
            var meta = mapper.get(this);
            var cwd = meta.cwd = meta.htdocsDir;
            var packageDir = cwd + meta.packageDir;

            //先清空，避免使用者意外用到。
            Directory.delete(packageDir);
            
            //这里要先创建 package 目录，否则 watcher 会出错，暂未找到根本原因。
            Directory.create(packageDir);

            var packageFile = meta.packageFile;
            if (packageFile) {
                var dest = Path.join(cwd, packageFile);
                Package.write(dest); //写一个空 {} 入到总包
            }

            var processMasters = Masters.watch(meta);
            var processPackages = meta.packages ? Packages.watch(meta) : null;

            //并行处理任务。
            Tasks.parallel({
                data: [ //任务列表。
                    processMasters,
                    processPackages,
                ],

                each: function (task, index, done) {
                    if (task) {
                        task(done);
                    }
                    else {
                        done();
                    }
                },

                all: function () {
                    Log.allDone('全部编译完成');
                    Watcher.log();
                    done && done();
                },

            });
        },

        /**
        * 打开站点页面。
        */
        open: function (options) {
            var meta = mapper.get(this);

            options = Object.assign({}, options, {
                'tips': '打开页面',
                'sample': meta.url,
                'dir': options.dir || meta.cwd,
            });

            Url.open(options);
        },

        /**
        * 打开站点对应的二维码页面以获取二维码。
        */
        openQR: function (options) {
            options = options || {};

            var meta = mapper.get(this);

            var url = Url.get({
                'sample': meta.url,
                'dir': options.dir || meta.cwd,
                'query': options.query,
                'host': options.host,
            });

            var qr = meta.qr;

            options = Object.assign({}, options, {
                'sample': qr.url,
                'query': {
                    'w': options.width || qr.width,
                    'text': url,
                },
            });

            console.log('打开二维码'.bgGreen, url.cyan);

            Url.open(options);
        },


        destroy: function () {
            mapper.delete(this);

            if (WebSite.current === this) {
                WebSite.current = null;
            }
        },

        getFiles: function (patterns) {
            var Patterns = require('Patterns');
            var meta = mapper.get(this);
            var files = Patterns.getFiles(meta.cwd, patterns);

            return files;
        },
    };


    //记录当前正在使用的 WebSite 实例。
    WebSite.current = null;


    return WebSite;


});




