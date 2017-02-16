/**
* CssLinks 模块的默认配置
* @name CssLinks.defaults
*/
define('CssLinks.defaults', /**@lends CssLinks.defaults*/ {
    
    md5: 4, //填充模板所使用的 md5 的长度。
    exts: { //优先识别的后缀名
        debug: '.debug.css',
        min: '.min.css',
    },

    //用来提取出 css 标签的正则表达式。
    regexp: /<link\s+.*rel\s*=\s*["\']stylesheet["\'].*\/>/ig,

    minify: {
        '.debug.css': {
            ext: '.min.css',    //生成的扩展名。
            overwrite: false,    //是否覆盖目标文件。
            write: true,        //写入压缩后的 css。
            delete: true,       //删除源 css 文件。
            outer: true,        //当引用的文件是外部地址时，是否替换成 min 的引用。
        },
    },
});

