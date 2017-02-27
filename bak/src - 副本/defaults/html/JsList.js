/**
* JsList 模块的默认配置
* @name JsList.defaults
*/
define('JsList.defaults', /**@lends JsList.defaults*/ {
    
    htdocsDir: '../htdocs/',

    md5: 4,           //填充模板所使用的 md5 的长度。
    sample: '<script src="{href}"></script>',   //使用的模板。


    tags: {
        begin: '<!--weber.js.begin-->',
        end: '<!--weber.js.end-->',
    },

    extraPatterns: [],      //额外附加的模式。

    max: {
        x: 110,     //每行最大的长度。
        y: 250,     //最多的行数。
        excludes: null,
    },

    //用来提取出静态 script 标签的正则表达式。
    regexp: /<script\s+.*src\s*=\s*[^>]*?>[\s\S]*?<\/script>/gi,

    concat: {
        'header': 'partial/begin.js',
        'footer': 'partial/end.js',
        'write': true,      //写入合并后的 js
        'delete': true,     //删除合并前的源 js 文件。
        'addPath': true,    //添加文件路径的注释

        //输出的合并文件的文件名。
        //为数字时表示以文件内容的 md5 值的指定位数;
        //为字符串时表示固定名称。
        //不指定时，相当于数字 32。
        'name': 32,        
    },

    minify: {
        'write': true,      //写入压缩后的 js
        'delete': true,     //删除压缩前的源 js 文件。
    },

    inline: {
        'delete': true,     //删除内联前的源 js 文件
    },

});

