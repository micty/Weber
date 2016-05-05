
/**
* Weber 框架命名空间
* @namespace
* @name Weber
*/
define('Weber', function (require, module, exports) {

    var cfg = null; //for data

    module.exports = exports = /**@lends Weber*/ {

        /**
        * 名称。 
        */
        name: 'default',

        /**
        * 版本号。 (由 grunt 自动插入)
        */
        version: '1.2.0',


        /**
        * 获取已经定义的所有模块的描述信息。
        * @function
        */
        modules: Module.modules,

        /**
        * 加载 Weber 框架内公开的模块。
        * @param {string} id 模块的名称(id)。
        * @return {Object} 返回模块的导出对象。
        * @example
        *   var API = Weber.require('API');    
        */
        require: function (id) {
            return Module.expose(id) ? require(id) : null;
        },

       
        /**
        * 获取或 设置 Weber 内部模块的默认配置。
        * @function
        * @example
        *   Weber.config({});    
        */
        config: function (name, value) {

            var Defaults = require('Defaults');

            //get(name)
            if (typeof name == 'string' && arguments.length == 1) { 
                return Defaults.get(name);
            }

            //set
            Defaults.set(name, value);

        },

        /**
        * 提供 website.buid 的快捷方式，用于构建整个站点。
        */
        build: function (options) {
            var WebSite = require('WebSite');
            var website = new WebSite();
            website.build(options);
        },

        /**
        * 提供 website.watch 的快捷方式，用于编译并监控整个站点。
        */
        watch: function (fn) {
            var WebSite = require('WebSite');
            var website = new WebSite();
            website.watch(fn);
        },
        

    };
});