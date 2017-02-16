/**
* MasterPage 模块的默认配置
* @name MasterPage.defaults
*/
define('MasterPage.defaults', /**@lends MasterPage.defaults*/ {


    htdocsDir: '../htdocs/',
    cssDir: 'style/css/',

    minifyHtml: {
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

