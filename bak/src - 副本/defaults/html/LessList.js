/**
* LessList 模块的默认配置
* @name LessList.defaults
*/
define('LessList.defaults', /**@lends LessList.defaults*/ {
    
    htdocsDir: '../htdocs/',
    cssDir: '../htdocs/style/css/',


    md5: 4,           //填充模板所使用的 md5 的长度
    sample: '<link href="{href}" rel="stylesheet" />',   //使用的模板


    tags: {
        begin: '<!--weber.css.begin-->',
        end: '<!--weber.css.end-->',
    },

    extraPatterns: [],      //额外附加的模式。

    concat: {
        'write': true,      //写入合并后的 css 文件。
        'delete': true,     //删除合并前的源分 css 文件

        //输出的合并文件的文件名。
        //为数字时表示以文件内容的 md5 值的指定位数;
        //为字符串时表示固定名称。
        //不指定时，相当于数字 32。
        'name': 32,
    },

    minify: {
        'delete': true,     //删除压缩前的源 css 文件。
    },
});

