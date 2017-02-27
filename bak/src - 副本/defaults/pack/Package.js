/**
* Package 模块的默认配置
* @name Package.defaults
*/
define('Package.defaults', /**@lends Package.defaults*/ {

    htdocsDir: '../htdocs/',
    cssDir: 'style/css/',
    md5: 4,                     //输出到总包的路径中所使用的 md5 的长度。

    compile: {
        'html': {
            write: true,        //写入编译后的 html 文件。
            delete: false,      //删除编译前的源 html 文件。
        },
        'js': {
            write: true,        //写入合并后的 js。
            delete: false,      //删除合并前的源 js 文件。
            addPath: true,      //添加文件路径的注释。
        },
        'less': {
            write: true,        //写入编译后的 css 文件。
            delete: false,      //删除编译前的源 less 文件。
        },
    },

    minify: {
        html: {
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
        js: {
            'write': true,      //写入压缩后的 js。
        },
        less: {
            'write': true,     //写入压缩后的 css 文件。
        },
    },

});

