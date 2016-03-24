
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
    var $Array = require('Array');

    var Watcher = require('Watcher');

    var Mapper = $.require('Mapper');
    var Emitter = $.require('Emitter');
    var Url = $.require('Url');

    var mapper = new Mapper();


    function seperate() {
        console.log('------------------------------------------------------------------------------'.magenta);
    }

    function allDone(s) {
        console.log(('=================================' + s + '=================================').green);
    }

    function logArray(list, color) {
        color = color || 'green';
        console.log('    ' + list.join('\r\n    ')[color]);
    }



    
    function WebSite(config) {

        Mapper.setGuid(this);
        config = Defaults.clone(module.id, config);

        var meta = {
            'masters': config.masters,
            'cssDir': config.cssDir,
            'htdocsDir': config.htdocsDir,
            'buildDir': config.buildDir,
        };

        mapper.set(this, meta);

    }



    WebSite.prototype = {

        constructor: WebSite,


        /**
        * 构建整个站点。
        */
        build: function (options) {
            var meta = mapper.get(this);

            var masters = options.masters || meta.masters;
            var htdocsDir = options.htdocsDir || meta.htdocsDir;
            var buildDir = options.dir || meta.buildDir;
            var cssDir = options.cssDir || meta.cssDir;

            console.log('删除目录'.bgYellow, buildDir.yellow);
            Directory.delete(buildDir);

            console.log('复制目录'.bgMagenta, htdocsDir.green, '→', buildDir.cyan);
            Directory.copy(htdocsDir, buildDir);
          
            Directory.delete(buildDir + cssDir);


            //从模式中获取真实的 master 文件列表。
            masters = Patterns.getFiles(buildDir, masters);
            masters = masters.map(function (file) {
                file = Path.relative(buildDir, file);
                return file;
            });

            console.log('匹配到'.bgGreen, masters.length.toString().cyan, '个模板页:');
            logArray(masters);


            //单独处理需要替换的文件，如 config.js。

            var inlines = []; //记录需要内联的文件。

            $.Object.each(options.process || {}, function (pattern, item) {

                var files = Patterns.combine(buildDir, pattern);
                files = Patterns.getFiles(files);

                var each = typeof item == 'function' ? fnManual : fnAuto;
                files.forEach(each);

                //针对 item 为一个回调函数时。
                function fnManual(file) {
                    var content = File.read(file);

                    var href = Path.relative(buildDir, file);
                    content = item(href, content, require);

                    if (content == null) {
                        File.delete(file);
                    }
                    else {
                        File.write(file, content, null);
                    }
                }

                //针对 item 为一个对象时。
                function fnAuto(file) {

                    if (item.minify) {
                        var content = File.read(file);

                        var UglifyJS = require('uglify-js');
                        content = UglifyJS.minify(content, { fromString: true, });
                        content = content.code;
                        File.write(file, content);
                    }


                    var inline = item.inline;
                    if (inline == 'auto') { //当指定为 auto 时，则根据 master 页的个数决定是否内联。
                        inline = masters.length == 1;
                    }

                    var deleted = item.delete;
                    if (deleted == 'auto') { //当指定为 auto 时，则根据 inline 决定是否删除。
                        deleted = inline;
                    }

                    if (inline) {
                        inlines.push({
                            'file': file,
                            'delete': deleted,
                        });
                    }
                }

            });

            //短路径补全
            var jsList = options.jsList;
            if (jsList) {
                var opt = jsList.concat;

                if (opt) {
                    var header = opt.header;
                    var footer = opt.footer;
                    var addPath = opt.addPath;

                    if (header) {
                        opt.header = Path.join(buildDir, header);
                    }
                    if (footer) {
                        opt.footer = Path.join(buildDir, footer);
                    }
                    if (addPath === true) {
                        opt.addPath = buildDir; //添加文件路径的注释所使用的相对路径。
                    }

                }
            }
           

            $Array.parallel({
                data: masters,

                each: function (file, index, done) {
                    seperate();

                    console.log('>> 开始构建'.cyan, file);

                    var master = new MasterPage(file, {
                        'htdocsDir': buildDir,
                        'cssDir': cssDir,
                    });

                    master.build({
                        'inlines': inlines,
                        'minifyHtml': options.minifyHtml,
                        'minifyCss': options.minifyCss,
                        'minifyJs': options.minifyJs,
                        'jsList': options.jsList,
                        'lessList': options.lessList,

                        'done': function () {
                            console.log('<< 完成构建'.green, file);
                            done(master);
                        },
                    });
                },

                all: function (masters) {

                    //console.log('>> 开始执行清理操作...'.yellow);

                    masters.forEach(function (master) {
                        master.clean();
                    });
                    
                    FileRefs.clean(); //删除已注册并且引用计数为 0 的物理文件。

                    
                    //需要清理的文件或目录。
                    var clean = options.clean;
                    if (clean) {
                        var files = Patterns.getFiles(buildDir, clean);
                        File.delete(files);

                        seperate();
                        console.log('清理'.bgMagenta, files.length.toString().cyan, '个文件:');
                        logArray(files, 'gray');
                    }
                    

                    //递归删除空目录
                    Directory.trim(buildDir);

                    allDone('全部构建完成');


                }
            });

        },

        /**
        * 编译整个站点，完成后开启监控。
        */
        watch: function (done) {

            var meta = mapper.get(this);
            var masters = meta.masters;
            var htdocsDir = meta.htdocsDir;
            var cssDir = meta.cssDir;

            //从模式中获取真实的文件列表
            masters = Patterns.getFiles(htdocsDir, masters);
            masters = masters.map(function (file) {
                file = Path.relative(htdocsDir, file);
                return file;
            });

            console.log('匹配到'.bgGreen, masters.length.toString().cyan, '个模板页:');
            logArray(masters);


            var $Array = require('Array');
            $Array.parallel({
                data: masters,
                each: function (file, index, done) {

                    seperate();
                    console.log('>> 开始编译'.cyan, file);

                    var master = new MasterPage(file, {
                        'htdocsDir': htdocsDir,
                        'cssDir': cssDir,
                    });

                    master.compile(function () {
                        console.log('<< 完成编译'.green, file);
                        master.watch();
                        done();
                    });
                },

                all: function () {  //已全部完成
                   
                    allDone('全部编译完成');
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

    };


    return WebSite;


});




