

/**
* 当前页面的 Url 工具类
* @namespace
* @name Url
*/
define('Url', function (require, module, exports) {

    var $ = require('$');
    
    module.exports = exports = /**@lends Url*/ {

        /**
        * 检查给定的 url 是否为完整的 url。
        * 即是否以 'http://' 或 'https://' 开头。
        * @param {string} url 要检查的 url。
        */
        checkFull: function (url) {
            if (typeof url != 'string') {
                return false;
            }


            return url.startsWith('http://')||
                url.startsWith('https://')||
                url.startsWith('//');             //这个也是绝对地址
        },

        /**
        * 获取 url 中的 query 和 hash 部分。
        * @param {string} 要获取的 url 地址。
        * @return {string} 返回 url 中的 query 和 hash 部分。
        * @example
            suffix('test.js?a=1&b=2#hash') => '?a=1&b=2#hash'
            suffix('test.js?a=1&b=2') => '?a=1&b=2'
            suffix('test.js#hash') => '#hash'
            suffix('test.js') => ''
        */
        suffix: function (url) {
            var index = url.indexOf('?');
            if (index < 0) {
                index = url.indexOf('#');
            }

            return index >= 0 ? url.slice(index) : '';
        },
        
    };

});
