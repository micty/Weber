
/**
* 
*/
define('WebSite/Masters', function (require, module, exports) {

    var $ = require('$');
    var Path = require('Path');
    var File = require('File');
    var Patterns = require('Patterns');
    
    var MasterPage = require('MasterPage');
    var Tasks = require('Tasks');
    var JS = require('JS');
    var Log = require('Log');




    return {


        /**
        * 构建所有模板页。
        */
        build: function (meta, options) {

            //处理模板页。
            return function (done) {

                var masters = meta.masters;
                var cssDir = meta.cssDir;
                var cwd = meta.cwd;


                //从模式中获取真实的 master 文件列表。
                masters = Patterns.getFiles(cwd, masters);
                console.log('匹配到'.bgGreen, masters.length.toString().cyan, '个模板页:');
                Log.logArray(masters);


                //单独处理需要替换的文件，如 config.js。
                var inlines = []; //记录需要内联的文件。
                var process = options.process || {};

                Object.keys(process).forEach(function (pattern) {

                    var item = process[pattern];

                    var files = Patterns.combine(cwd, pattern);
                    files = Patterns.getFiles(files);

                    if (typeof item == 'function') {  //针对 item 为一个回调函数时。
                        files.forEach(function (file) {
                            var content = File.read(file);

                            var href = Path.relative(cwd, file);
                            content = item(href, content, require);

                            if (content == null) {
                                File.delete(file);
                            }
                            else {
                                File.write(file, content, null);
                            }
                        });
                    }
                    else {  //针对 item 为一个对象时。
                        files.forEach(function (file) {
                            if (item.minify) {
                                var content = File.read(file);
                                JS.minify(content, {
                                    'dest': file,
                                });
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
                        });
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
                            opt.header = Path.join(cwd, header);
                        }
                        if (footer) {
                            opt.footer = Path.join(cwd, footer);
                        }
                        if (addPath === true) {
                            opt.addPath = cwd; //添加文件路径的注释所使用的相对路径。
                        }

                    }
                }


                Tasks.parallel({
                    data: masters,

                    each: function (file, index, done) {
                        Log.seperate();
                        console.log('>> 开始构建'.cyan, file);

                        var href = Path.relative(cwd, file);

                        var master = new MasterPage(href, {
                            'htdocsDir': cwd,
                            'cssDir': cssDir,
                        });

                        master.build({
                            'inlines': inlines,
                            'minifyHtml': options.minifyHtml,
                            'minifyCss': options.minifyCss,
                            'minifyJs': options.minifyJs,
                            'jsList': options.jsList,
                            'lessLinks': options.lessLinks,
                            'lessList': options.lessList,
                            'htmlLinks': options.htmlLinks,

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

                        done && done(); //完成当前任务。
                    },

                });

            };

        },



        /**
        * 编译所有模板页，完成后开启监控。
        */
        watch: function (meta) {

            //处理模板页。
            return function (done) {

                var masters = meta.masters;
                var cwd = meta.cwd;
                var cssDir = meta.cssDir;


                //从模式中获取真实的文件列表
                masters = Patterns.getFiles(cwd, masters);
                console.log('匹配到'.bgGreen, masters.length.toString().cyan, '个模板页:');
                Log.logArray(masters);

                Tasks.parallel({
                    data: masters,
                    each: function (file, index, done) {

                        Log.seperate();
                        console.log('>> 开始编译'.cyan, file);

                        var href = Path.relative(cwd, file);
                        var master = new MasterPage(href, {
                            'htdocsDir': cwd,
                            'cssDir': cssDir,
                        });

                        master.compile(function () {
                            console.log('<< 完成编译'.green, file);
                            master.watch();
                            done();
                        });
                    },

                    all: function () {  //已全部完成
                        done && done();
                    },
                });
            };


        },



    };




});




