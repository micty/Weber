/**
* LessLinks 模块的默认配置
* @name LessLinks.defaults
*/
define('LessLinks.defaults', /**@lends LessLinks.defaults*/ {
    
    htdocsDir: '../htdocs/',
    cssDir: '../htdocs/style/css/',

    md5: 4, //填充模板所使用的 md5 的长度。

    //用来提取出 css 标签的正则表达式。
    regexp: /<link\s+.*rel\s*=\s*["\']less["\'].*\/>/ig,


    sample: '<link href="{href}" rel="stylesheet" />',   //使用的模板

    minify: {
        'delete': true,     //删除压缩前的源 css 文件。
    },

});

