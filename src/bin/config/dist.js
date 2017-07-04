
module.exports = {

    /**
    * 构建的输出目录。
    */
    dir: '../build/dist/htdocs/',

    /**
    * 构建前要排除在外的文件或目录。
    */
    exclude: [
        
    ],

    /**
    * 构建完成后需要清理的文件或目录。
    */
    clean: [
        'api/',
        'lib/',
        'modules/',
        'partial/',
        '**/*.debug.js',
        '**/*.debug.css',
        '**/*.less',
        '**/*.map',
        '**/*.md',

        'package/',
    ],


    //母版页
    masters: {
        /**
        * 构建前需要单独处理的文件。
        */
        process: {
            '**/*.js': function (file, content, require) {
                var $String = require('String');
                var $ = require('$');
                var now = $.Date.format(new Date(), 'yyyy-MM-dd HH:mm:ss');

                var tags = [
                    {
                        begin: '/**weber.debug.begin*/',
                        end: '/**weber.debug.end*/',
                        value: [
                            "KISP.require('Edition').set('min');",
                            "KISP.data('build-time', '" + now + "');",
                        ].join('\r\n'),
                    },
                    {
                        begin: '/**weber.test.begin*/',
                        end: '/**weber.test.end*/',
                        value: '',
                    },
                ];

                tags.forEach(function (tag) {
                    content = $String.replaceBetween(content, tag);
                });

                return content;
            },

            'config.js': {
                minify: true,
                inline: 'auto',
                delete: 'auto',
            },
        },


        minifyHtml: {
            collapseWhitespace: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeRedundantAttributes: true,
            minifyJS: false,
            minifyCSS: false,
            minifyURLs: true,
            keepClosingSlash: true,
        },

        //minifyHtml: false,

        minifyCss: {
            '.debug.css': {
                ext: '.min.css',    //生成的扩展名。
                overwrite: false,    //是否覆盖目标文件。
                write: true,        //写入压缩后的 css。
                delete: true,       //删除源 css 文件。
                outer: true,        //当引用的文件是外部地址时，是否替换成 min 的引用。
            },
        },
        minifyJs: {
            '.debug.js': {
                ext: '.min.js',
                overwrite: false,    //是否覆盖目标文件。
                write: true,        //写入压缩后的 js。
                delete: true,       //删除源 js 文件。
                outer: true,        //当引用的文件是外部地址时，替换成 min 的引用。
            },
        },

        jsList: {
            concat: {
                'header': 'partial/begin.js',
                'footer': 'partial/end.js',
                'write': false,     //写入合并后的 js。
                'delete': true,     //删除合并前的源 js 文件。
                'addPath': false,   //添加文件路径的注释。
            },
            minify: {
                'write': true,      //写入压缩后的 js。
                'delete': true,     //删除压缩前的源 js 文件。
            },
            //inline: {
            //    'delete': true,     //删除内联前的源 js 文件。
            //},
        },

        lessList: {
            compile: {
                'write': false,     //写入编译后的 css 文件。
                'delete': true,     //编译完后删除源 less 文件。
            },
            concat: {
                'write': false,     //写入合并后的 css 文件。
                'delete': true,     //删除合并前的源分 css 文件。
            },
            minify: {
                'delete': false,     //删除压缩前的源 css 文件。
            },
        },

        lessLinks: {
            compile: {
                'write': true,      //写入编译后的 css 文件。
                'minify': true,     //使用压缩版。
                'delete': true,     //编译完后删除源 less 文件。
            },
        },

        htmlLinks: {
            'delete': true,         //删除合并前的源分 html 文件。
        },

    },
}