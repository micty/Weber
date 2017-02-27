
/**
* 对第三方库 html 的封装。
*/
define('Html', function (require, module, exports) {

    var $ = require('$');
    var Defaults = require('Defaults');

    //https://github.com/kangax/html-minifier
    var Minifier = require('html-minifier');


    var defaults = Defaults.clone(module.id);



    

    return {
   
        /**
        * 对 html 进行压缩。
        */
        minify: function (html, config) {

            config = $.Object.extendDeeply({}, defaults.minify, config);

            html = Minifier.minify(html, config);

            return html;
        },
    };

});




