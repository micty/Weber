/**
* Html 模块的默认配置
* @name Html.defaults
*/
define('Html.defaults', /**@lends Html.defaults*/ {
    
    'minify': {
        //removeAttributeQuotes: true, //引号不能去掉，否则可能会出错。
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
});

