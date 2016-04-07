
module.exports = function (grunt) {

    'use strict';

    var $ = require('./lib/MiniQuery');
    var LinearPath = require('./lib/LinearPath');
    var Banner = require('./lib/Banner');
    var Tasks = require('./lib/Tasks');

    var pkg = grunt.file.readJSON('package.json');

    Tasks.setConfig({
        pkg: pkg,
        dir: pkg.dir
    });

    Tasks.load();
    Tasks.register();




    var name = 'default';

    grunt.registerTask(name, function () {

       
        var srcFiles = require('./task/' + name + '.js');

        var home = '<%=dir.build%>' + name + '/<%=pkg.version%>';
        var destSrc = home + '/src/';
        var destFile = home + '/weber/weber.debug.js';


        var list = LinearPath.linearize({
            dir: '<%=dir.src%>',
            files: srcFiles,
        });

        var destList = LinearPath.linearize({
            dir: destSrc,
            files: srcFiles,
        });


        //清空目标目录。
        Tasks.run('clean', name, {
            src: home,
            options: {
                force: true //允许删除当前工作目录外的其他文件
            }
        });

        //预处理，插入 grunt 标记相关的信息
        Tasks.run('copy', name, {
            dest: destSrc,
            src: list,
            options: {
                process: function (content, file) {
                    return replace(content, {
                        'name': "'" + name + "'",
                        'version': "'" + pkg.version + "'",
                    });
                },
            },
        });

        Tasks.run('concat', name, {
            src: destList,
            dest: destFile,
            options: {
                'banner': Banner.get(name, list),
            },
        });

        //拷贝
        [
            {    //生成 package.json 到 {home} 目录
                src: './package.sample.json',
                dest: home + '/weber/package.json',
            },
            {   //生成 readme.md 到 {home} 目录
                src: './readme.md',
                dest: home + '/weber/readme.md',
            },
            {   //拷贝 readme.md 到 / 根目录
                src: home + '/weber/readme.md',
                dest: '../readme.md',
                process: false,
            },
            {
                //生成 miniquery 到 {home} 目录
                src: '<%=dir.src%>/f/miniquery/miniquery.debug.js',
                dest: home + '/miniquery/miniquery.debug.js',
                process: false,
            },
            {
                //生成 miniquery 到 {home} 目录
                src: '<%=dir.src%>/f/miniquery/package.json',
                dest: home + '/miniquery/package.json',
                process: false,
            },

        ].forEach(function (item) {

            var target = $.String.random();

          
            Tasks.run('copy', target, {
                src: item.src,
                dest: item.dest,
                options: {
                    process: 'process' in item ? item.process : function (s) {
                        return $.String.format(s, {
                            'version': pkg.version,
                        });
                    },
                }
            });

        });


        //test
        //需要顺便拷到其它项目中试用的。
        [
            'E:/Kingdee/message/bin/f',
            'E:/Kingdee/vCRM-cloud/bin/f',
            'E:/Kingdee/vGuide/bin/f',
            'E:/Kingdee/house/demo/bin/f',
            'E:/Kingdee/house/admin/bin/f',
            'E:/Kingdee/house/permit/bin/f',

        ].forEach(function (dest) {

            var target = $.String.random();

            Tasks.run('copy', target, {
                files: LinearPath.pair(home, dest, [

                    'miniquery/miniquery.debug.js',
                    'miniquery/package.json',

                    'weber/package.json',
                    'weber/readme.md',
                    'weber/weber.debug.js',
                ]),
            });


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


    });











};