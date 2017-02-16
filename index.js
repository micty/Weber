
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

        var WebSite = require('WebSite');
        website = new WebSite();

        ready = true;
        emitter.fire('ready');
    });
}




//module.exports = 
Object.entries({

    on: null,

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
    watch: function () {
        website.watch(function () {
            emitter.fire('watch');
        });
    },

    /**
    * 
    */
    build: function (options) {
        website.build(options, function () {
            emitter.fire('build');
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

    module.exports.on = emitter.on.bind(emitter);
});
