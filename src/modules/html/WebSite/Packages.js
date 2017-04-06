

define('WebSite/Packages', function (require, module, exports) {

    var $ = require('$');
    var Path = require('Path');
    var Patterns = require('Patterns');
    
    var Package = require('Package');
    var Tasks = require('Tasks');
    var Log = require('Log');



    return {

        /**
        * 构建所有的包文件
        */
        build: function (meta, options) {

            //处理打包。
            return function (done) {

                var packages = meta.packages;
                var cssDir = meta.cssDir;
                var packageDir = meta.packageDir;
                var packageFile = meta.packageFile;
                var cwd = meta.cwd;

                //从模式中获取真实的 package.json 文件列表。
                packages = Patterns.getFiles(cwd, packages);

                var count = packages.length;
                if (count == 0) {
                    done && done();
                    return;
                }

                console.log('匹配到'.bgGreen, count.toString().cyan, '个包文件:');
                Log.logArray(packages, 'magenta');


                //短路径补全
                var opt = (options.compile || {}).js;
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


                Tasks.parallel({
                    data: packages,

                    each: function (file, index, done) {
                        Log.seperate();
                        console.log('>> 开始打包'.cyan, file);

                        var href = Path.relative(cwd, file);

                        var pkg = new Package(href, {
                            'htdocsDir': cwd,
                            'cssDir': cssDir,
                            'packageDir': packageDir,
                        });

                        pkg.build(options, function () {
                            console.log('<< 完成打包'.green, file);
                            done(pkg);
                        });
                    },

                    all: function (pkgs) {

                        
                        //删除源分 package.json 文件。
                        var opt = (options.compile || {}).json;
                        if (opt.delete) {
                            pkgs.forEach(function (pkg) {
                                pkg.clean();
                            });
                        }


                        var opt = (options.minify || {}).json;
                        if (opt.write) {
                            var dest = Path.join(cwd, packageFile);
                            Package.write(dest, pkgs, opt.minify);      //写入到总包

                            done && done();
                        }
                        
                    },
                });
            };

        },



        /**
        * 编译所有包文件，完成后开启监控。
        */
        watch: function (meta) {
            //处理打包。
            return function (done) {
                var packages = meta.packages;
                var cssDir = meta.cssDir;
                var packageDir = meta.packageDir;
                var packageFile = meta.packageFile;
                var cwd = meta.cwd;

                //从模式中获取真实的 package.json 文件列表。
                packages = Patterns.getFiles(cwd, packages);
                var count = packages.length;
                if (count == 0) {
                   

                    done && done();
                    return;
                }

                console.log('匹配到'.bgGreen, count.toString().cyan, '个包文件:');
                Log.logArray(packages, 'magenta');


                var dest = Path.join(cwd, packageFile);

                function write(pkgs) {
                    if (!Array.isArray(pkgs)) {
                        pkgs = [pkgs];
                    }

                    Package.write(dest, pkgs); //写入到总包
                }


                Tasks.parallel({
                    data: packages,
                    each: function (file, index, done) {

                        Log.seperate();
                        console.log('>> 开始打包'.cyan, file);

                        var href = Path.relative(cwd, file);

                        var pkg = new Package(href, {
                            'htdocsDir': cwd,
                            'cssDir': cssDir,
                            'packageDir': packageDir,
                        });

                        //更新 md5 的 query 部分。
                        pkg.on('change', function () {
                            write(pkg);
                        });

                        pkg.parse();

                        pkg.compile(function () {
                            console.log('<< 完成打包'.green, file);
                            pkg.watch();
                            done(pkg);
                        });
                    },

                    all: function (pkgs) {  //已全部完成
                        write(pkgs);
                        done && done();
                    },
                    
                });
                
            };


        },


        /**
        *
        */

    };

});




