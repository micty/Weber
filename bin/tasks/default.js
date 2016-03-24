
module.exports = function (grunt) {

    'use strict';

    var $ = require('../lib/MiniQuery');
    var LinearPath = require('../lib/LinearPath');
    var Tasks = require('../lib/Tasks');
    var Banner = require('../lib/Banner');
    var Sample = require('../lib/Sample');
    var Path = require('path');

    var name = 'default';

    var srcFiles = [
        'partial/' + name + '/begin.js',
        {
            dir: 'core',
            files: [
                'Module.js',
                'Node.js',
                '$.js',
                'Weber.js',
            ]
        },
        {
            dir: 'excore',
            files: [
                'Array.js',
                'Config.js',
                'Defaults.js',
                'Config/Data.js',
                'String.js',
                'Url.js',
            ]
        },
        {
            dir: 'crypto',
            files: [
                'MD5.js',
            ],
        },
        {
            dir: 'fs',
            files: [
                'Directory.js',
                'File.js',
                'FileRefs.js',
                'Path.js',
                'Patterns.js',
            ],
        },
        {
            dir: 'html',
            files: [
                'Attribute.js',
                'CssLinks.js',
                'HtmlLinks.js',
                'HtmlList.js',
                'JsList.js',
                'JsScripts.js',
                'LessList.js',
                'Lines.js',
                'MasterPage.js',
                {
                    dir: 'MasterPage',
                    files: [
                        'CssList.js',
                        'HtmlList.js',
                        'JsList.js',
                        'Less.js',
                        'Pages.js',
                        'Patterns.js',
                    ],
                },
                'Tag.js',
                'WebSite.js',
            ],
        },
        {
            dir: 'third',
            files: [
                'Less.js',
                'Watcher.js',
            ],
        },
        
        {
            dir: 'partial/' + name,
            files: [
                {
                    dir: 'defaults',
                    files: [
                        //这里 LinearPath 有个bug，至少需要三项
                        {
                            dir: 'a',
                            files: [
                            ],
                        },
                        {
                            dir: 'excore',
                            files: [
                                'Module.js',
                                'Url.js',
                            ],
                        },
                        {
                            dir: 'html',
                            files: [
                                'CssLinks.js',
                                'HtmlLinks.js',
                                'HtmlList.js',
                                'JsList.js',
                                'JsScripts.js',
                                'LessList.js',
                                'MasterPage.js',
                                'WebSite.js',
                            ],
                        },
                        {
                            dir: 'third',
                            files: [
                                'Watcher.js',
                            ],
                        },
                    ],
                },

                'expose.js',
                'end.js',
            ]
        },
    ];


    var list = LinearPath.linearize({
        dir: '<%=dir.src%>',
        files: srcFiles,
    });



    /*
    * 运行 grunt default 即可调用本任务
    */
    grunt.registerTask(name, function (level) {

        var pkg = grunt.file.readJSON('package.json');
        var home = '<%=dir.build%>' + name + '/<%=pkg.version%>';
        var destSrc = home + '/src/';

        var destList = LinearPath.linearize({
            dir: destSrc,
            files: srcFiles,
        });

        var files = LinearPath.linearize({
            dir: home,
            files: [
                'weber.debug.js',
                'weber.min.js',
                'weber.min.js.map'
            ]
        });

        Tasks.run('clean', name, {
            src: home,
            options: {
                force: true //允许删除当前工作目录外的其他文件
            }
        });

        function replace(content, name, value) {

            if (typeof name == 'object') { // 重载 replace(content, {...})
                $.Object.each(name, function (name, value) {
                    content = replace(content, name, value);
                });

                return content;
            }

            var begin = '/**grunt-' + name + '-begin*/';
            var end = '/**grunt-' + name + '-end*/';
            return $.String.replaceBetween(content, begin, end, value);
        }

       


        var sample = grunt.file.read('partial/sample.js');

        //预处理，插入 grunt 标记相关的信息
        Tasks.run('copy', name, {
            dest: destSrc,
            src: list,
            options: {
               
                process: function (content, file) {
                    file = file.split('\\').join('/');

                    var ext = Path.extname(file).toLowerCase();

                    if (ext == '.html') {
                        return Sample.get(content, file);
                    }

                    // js 文件
                    return replace(content, {
                        'name': "'" + name + "'",
                        'version': "'" + pkg.version + "'",
                    });
                },
            },
        });

        Tasks.run('concat', name, {
            dest: files[0],
            src: destList,
            options: {
                banner: Banner.get(name, list),
            },
        });





        //生成 package.json 到 {home} 目录
        Tasks.run('copy', name + '/package', {
            src: './package.sample.json',
            dest: home + '/package.json',
            options: {
                process: function (s) {
                    var pkg = grunt.file.readJSON('package.json');

                    return $.String.format(s, {
                        'version': pkg.version,
                    });
                },
            }
        });

        //生成 readme.md 到 {home} 目录
        Tasks.run('copy', name + '/readme', {
            src: './readme.md',
            dest: home + '/readme.md',
            options: {
                process: function (s) {
                    var pkg = grunt.file.readJSON('package.json');

                    return $.String.format(s, {
                        'version': pkg.version,
                    });
                },
            }
        });

        //拷贝 readme.md 到 / 根目录
        Tasks.run('copy', name + '/readme.md', {
            src: home + '/readme.md',
            dest: '../readme.md',
        });





        //for test

        //生成到 house/admin 目录
        Tasks.run('copy', name + '/house/admin', {
            files: LinearPath.pair(home, 'E:/Kingdee/house/admin/bin1/node_modules/weber', [
                'package.json',
                'readme.md',
                'weber.debug.js',
            ]),

        });

        //生成到 house/demo 目录
        Tasks.run('copy', name + '/house/demo', {
            files: LinearPath.pair(home, 'E:/Kingdee/house/demo/bin1/node_modules/weber', [
                'package.json',
                'readme.md',
                'weber.debug.js',
            ]),

        });

        //生成到 vGuide 目录
        Tasks.run('copy', name + '/vGuide', {
            files: LinearPath.pair(home, 'E:/Kingdee/vGuide/bin1/node_modules/weber', [
                'package.json',
                'readme.md',
                'weber.debug.js',
            ]),

        });

        //生成到 vCRM-cloud 目录
        Tasks.run('copy', name + '/vCRM-cloud', {
            files: LinearPath.pair(home, 'E:/Kingdee/vCRM-cloud/bin1/node_modules/weber', [
                'package.json',
                'readme.md',
                'weber.debug.js',
            ]),

        });

    });


};