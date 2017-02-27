/**
* Url 模块的默认配置。
* 字符串中的 {~} 表示站头的根地址；{@} 表示使用的文件版本 debug 或 min。
* @name Url.defaults
*/
define('Url.defaults', /**@lends Url.defaults*/ {

    root: '',

    replacer: {
        root: '~',
        edition: '@'
    },

});

