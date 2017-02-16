/**
* JsScripts 模块的默认配置
* @name JsScripts.defaults
*/
define('JsScripts.defaults', /**@lends JsScripts.defaults*/ {
    
    md5: 4, //填充模板所使用的 md5 的长度。
    exts: { //优先识别的后缀名
        debug: '.debug.js',
        min: '.min.js',
    },

    //用来提取出 script 标签的正则表达式。
    regexp: /<script\s+.*src\s*=\s*[^>]*?>[\s\S]*?<\/script>/gi,

    minify: {
        '.debug.js': {
            ext: '.min.js',
            overwrite: false,    //是否覆盖目标文件。
            write: true,        //写入压缩后的 js。
            delete: true,       //删除源 js 文件。
            outer: true,        //当引用的文件是外部地址时，是否替换成 min 的引用。
        },
    },
});

