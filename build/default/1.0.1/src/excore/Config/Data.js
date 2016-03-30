
/**
* 配置工具的预留数据填充格式化工具。
* @namespace
*/
define('Config/Data', function (require, module, exports) {

    var $ = require('$');


    function fill(sample) {

        return $.String.format(sample, {

            'now': new Date().getTime(),

        });

    }


    /**
    * 递归扫描并填充预留的数据。
    */
    function format(config) {

        return $.Object.map(config, function (key, value) {

            if (typeof value == 'string') {
                return fill(value);
            }

            if (value instanceof Array) {

                return $.Array.keep(value, function (item, index) {

                    if (typeof item == 'string') {
                        return fill(item);
                    }

                    if (typeof item == 'object') {
                        return format(item); //递归
                    }

                    return item;

                }, true);
            }

            return value;

        }, true); //深层次来扫描

    }


    return {
        format: format,
    };


});

