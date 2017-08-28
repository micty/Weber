
var $ = require('./f/miniquery');
var Emitter = $.require('Emitter');
var emitter = new Emitter();


var ready = false;
var website = null;
var $require = null;


function run() {

    var defineJS = require('defineJS');

    defineJS.config({
        base: __dirname,
        modules: [
            'f/',
            'lib/',
            'modules/',
            'defaults/',
        ],
    });

    defineJS.run(function (require, module) {

        $require = require;

        var Console = require('Console');
        var WebSite = require('WebSite');

        console.log = Console.log;
        website = new WebSite();
        ready = true;

        emitter.fire('ready');
    });
}




//module.exports = 
Object.entries({
    /**
    * 
    */
    config: function (files) {
        if (!Array.isArray(files)) {
            files = [files];
        }

        var path = require('path');
        var Defaults = $require('Defaults');
        var File = $require('File');

        files.forEach(function (file) {
            if (!file) {
                return;
            }

            var defaults = file;

            if (typeof file == 'string') {
                file = path.resolve(file);
                file = file.replace(/\\/g, '/');

                var ext = path.extname(file).toLowerCase();
                if (ext == '.json') {
                    defaults = File.readJSON(file);
                }
                else { // js
                    defaults = require(file);
                }
            }

            Defaults.set(defaults);
        });

        //再次构造，以让新的配置生效。
        website && website.destroy();

        var WebSite = $require('WebSite');
        website = new WebSite();

    },

    /**
    * 
    */
    watch: function (action, args) {
        website.watch(function () {
            emitter.fire('watch', action, args);
        });
    },


    /**
    * 
    */
    build: function (options, action, args) {
        website.build(options, function () {
            emitter.fire('build', action, args);
        });
    },

    /**
    * 
    */
    open: function (options) {
        website.open(options);
    },

    /**
    * 
    */
    openQR: function (options) {
        website.openQR(options);
    },

}).forEach(function (item) {

    //简单包一层，让业务层可以以同步方式调用。
    var key = item[0];
    var fn = item[1];

    module.exports[key] = function () {
        var args = arguments;

        if (ready) {
            return fn(...args); //ES6 语法。
        }

        emitter.on('ready', function () {
            fn(...args);
        });

        run();
    };
});



Object.assign(module.exports, {
    on: emitter.on.bind(emitter),
});


/**
* 解析命令行 `node watch` 后面的参数。
*/
module.exports.watch.getArgs = function (args) {

    args = args || [...process.argv];

    var mode = args[2];
    var action = args[3];
    var value = args[4];

    //单页应用模式。
    if (mode != 'pack') {
        action = args[2];
        value = args[3];
    }

    return {
        'pack': mode == 'pack', //是否使用独立打包的方式。
        'action': action || '', //编译完成的操作，如 `open` 或 `qr`。
        'value': value || '',   //要额外传递给 action 的值。
    };
};


/**
* 解析命令行 `node build` 后面的参数。
*/
module.exports.build.getArgs = function (args) {

    args = args || [...process.argv];


    //完整情况: 
    //node build pack dist open localhost
    //0    1     2    3    4    5

    var index = 2;
    var mode = args[index++];

    if (mode != 'pack') {
        index--;
    }

    var level = args[index++];
    if (level == 'open' || level == 'qr') {
        index--;
        level = '';     //这里要置空
    }

    var action = args[index++];
    var value = args[index++];

    return {
        'pack': mode == 'pack',     //是否使用独立打包的方式。
        'level': level || 'dist',   //配置的方案名称，默认为 `dist`。
        'action': action || '',     //编译完成的操作，如 `open` 或 `qr`。
        'value': value || '',       //要额外传递给 action 的值。
    };
};