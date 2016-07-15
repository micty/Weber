
/**
* 整个站点类。
*/
define('WebSite', function (require, module, exports) {

    var $ = require('$');
    var Path = require('Path');
    var File = require('File');
    var Directory = require('Directory');
    var Patterns = require('Patterns');
    
    var FileRefs = require('FileRefs');
    var MasterPage = require('MasterPage');
    var Defaults = require('Defaults');
    var Tasks = require('Tasks');

    var Watcher = require('Watcher');

    var Mapper = $.require('Mapper');
    var Emitter = $.require('Emitter');

    var Log = require('Log');
    var Url = module.require('Url');

    var mapper = new Mapper();

    var Masters = module.require('Masters');
    var Packages = module.require('Packages');

    
    function WebSite(config) {

        Mapper.setGuid(this);
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
        };

        mapper.set(this, meta);

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
            var buildDir = meta.buildDir = options.dir || meta.buildDir;

            console.log('删除目录'.bgYellow, buildDir.yellow);
            Directory.delete(buildDir);

            console.log('复制目录'.bgMagenta, htdocsDir.green, '→', buildDir.cyan);
            Directory.copy(htdocsDir, buildDir);
          
            //先删除自动生成的目录，后续会再生成回来。
            Directory.delete(buildDir + cssDir);
            Directory.delete(buildDir + packageDir);

            var processMasters = Masters.build(meta, options.masters);
            var processPackages = Packages.build(meta, options.packages);

            //并行处理任务。
            Tasks.parallel({
                data: [ //任务列表。
                    processMasters,
                    processPackages,
                ],  

                each: function (task, index, done) {
                    task(done);
                },

                all: function () {
                    FileRefs.clean(); //删除已注册并且引用计数为 0 的物理文件。

                    //需要清理的文件或目录。
                    var clean = options.clean;
                    if (clean) {
                        var files = Patterns.getFiles(buildDir, clean);
                        File.delete(files);

                        Log.seperate();
                        console.log('清理'.bgMagenta, files.length.toString().cyan, '个文件:');
                        Log.logArray(files, 'gray');
                    }

                    //递归删除空目录
                    Directory.trim(buildDir);
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
            
            //这里要先创建 package 目录，否则 watcher 会出错，暂未找到根本原因。
            Directory.create(meta.htdocsDir + meta.packageDir);

            var processMasters = Masters.watch(meta);
            var processPackages = Packages.watch(meta);

            //并行处理任务。
            Tasks.parallel({
                data: [ //任务列表。
                    processMasters,
                    processPackages,
                ],

                each: function (task, index, done) {
                    task(done);
                },

                all: function () {
                    Log.allDone('全部编译完成');
                    Watcher.log();
                    done && done();
                },

            });
        },



        /**
        * 统计整个站点信息。
        */
        stat: function () {
            var meta = mapper.get(this);
            var htdocsDir = meta.htdocsDir;


            var all = {};
            var file$md5 = {};
            var md5$files = {};

            var MD5 = require('MD5');
            var Patterns = require('Patterns');

            var files = Directory.getFiles(htdocsDir);

            files.forEach(function (file) {
                
                var md5 = MD5.read(file);
                file$md5[file] = md5;

                var files = md5$files[md5];
                if (!files) {
                    files = md5$files[md5] = [];
                }

                files.push(file);
            });

    
            File.writeJSON('file$md5.json', file$md5);
            File.writeJSON('md5$files.json', md5$files);




            return;
            

            var patterns = Patterns.combine(htdocsDir, ['**/*.js']);
            var jsFiles = Patterns.match(patterns, files);

            //console.log(jsFiles);


            var patterns = Patterns.combine(htdocsDir, ['**/*.less']);
            var lessFiles = Patterns.match(patterns, files);
            console.log(lessFiles);


            var patterns = Patterns.combine(htdocsDir, ['**/*.master.html']);
            var masterFiles = Patterns.match(patterns, files);
            console.log(masterFiles);


        },

        /**
        * 打开站点页面。
        * @param
        */
        open: function (options) {
   
            var meta = mapper.get(this);

            options = $.Object.extend({}, options, {
                'tips': '打开页面',
                'sample': meta.url,
                'dir': options.dir || meta.htdocsDir,
            });

            Url.open(options);
        },


        openQR: function (options) {

            options = options || {};


            var meta = mapper.get(this);

            var url = Url.get({
                'sample': meta.url,
                'dir': options.dir || meta.htdocsDir,
                'query': options.query,
                'host': options.host,
            });

            var qr = meta.qr;

            options = $.Object.extend({}, options, {
                'sample': qr.url,
                'query': {
                    'w': options.width || qr.width,
                    'text': url,
                },
            });

            console.log('打开二维码'.bgGreen, url.cyan);

            Url.open(options);
        },

    };


    return WebSite;


});




