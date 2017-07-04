

//默认配置

module.exports = {

    'WebSite': {
        htdocsDir: '../htdocs/',
        buildDir: '../build/htdocs/',
        cssDir: 'style/css/',
        packageDir: 'package/',
        packageFile: 'package/package.json',    //输出的总包文件。 如果指定此值，则会生成一个空的 package.json 文件。

        masters: '**/*.master.html',
        url: 'http://{host}/{dir}index.html{query}',
        qr: {
            width: 380,
            url: 'http://qr.topscan.com/api.php{query}',
        },
    },


    'Console': {
        file: 'console.log',    //输出的日志文件路径。
        timestamp: true,        //是否自动加上时间戳。
    },

    'LessList': {
        md5: 4, //填充模板所使用的 md5 的长度

        //生成的 html 所使用的模板
        sample: '<link href="{href}" rel="stylesheet" />',

        tags: {
            begin: '<!--weber.css.begin-->',
            end: '<!--weber.css.end-->',
        },
    },

    'JsList': {
        md5: 4, //填充模板所使用的 md5 的长度。

        //生成的 html 所使用的模板。
        sample: '<script src="{href}"></script>',

        tags: {
            begin: '<!--weber.js.begin-->',
            end: '<!--weber.js.end-->',
        },

        max: {
            x: 110000,     //每行最大的长度。
            y: 350000,     //最多的行数。

            //不作检查的文件
            excludes: [
                'data/**/*.js',
            ],
        },
    },

    'HtmlList': {
        //生成的 html 所使用的模板
        sample: '<link rel="html" href="{href}" />', 
        tags: {
            begin: '<!--weber.html.begin-->',
            end: '<!--weber.html.end-->',
        },
    },

    'HtmlLinks': {
        regexp: /<link\s+.*rel\s*=\s*["\']html["\'].*\/>/ig,
    },

    'JsScripts': {
        md5: 4, //填充模板所使用的 md5 的长度。
        exts: { //优先识别的后缀名
            debug: '.debug.js',
            min: '.min.js',
        },
    },

    'CssLinks': {
        md5: 4, //填充模板所使用的 md5 的长度。
        exts: { //优先识别的后缀名
            debug: '.debug.css',
            min: '.min.css',
        },

        //用来提取出 css 标签的正则表达式。
        regexp: /<link\s+.*rel\s*=\s*["\']stylesheet["\'].*\/>/ig,
    },
}