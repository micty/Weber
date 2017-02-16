
//使用独立打包的默认配置
module.exports = {

    /**
    * 构建的输出目录。
    */
    dir: '../build/dist-pack/htdocs/',

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
    ],


    //包文件
    packages: {
        compile: {
            html: {
                'write': false,     //写入编译后的 html。
                'delete': true,     //删除编译前的源 html 分文件。
            },
            js: {
                'header': 'partial/begin.js',
                'footer': 'partial/end.js',
                'write': false,     //写入合并后的 js。
                'delete': true,     //删除合并前的源 js 文件。
                'addPath': false,   //添加文件路径的注释。
            },
            less: {
                'write': false,     //写入合并后的 css 文件。
                'delete': true,     //删除编译前源 less 文件。
            },
            json: {
                'delete': true,     //删除合并前的源分 package.json 文件。
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
                'write': true,      //写入压缩后的 css 文件。
            },
            json: {
                'write': true,      //写入合并后的 package.json 文件。
                'minify': false,     //压缩合并后的 package.json 文件。
            },
        },

    },
}