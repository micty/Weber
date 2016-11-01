
var _require = require; //原生的 require
var meta = null;        //


module.exports = {

    run: function (fn) {
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

            var $ = require('$');
            var Emitter = $.require('Emitter');
            var emitter = new Emitter();

            meta = {
                'require': require,
                'module': module,
                'website': null,
                'emitter': emitter,
            };

            fn(require, module);
        });
    },

    config: function (file) {
        if (!meta) {
            throw new Error('必须放在 run 方法的回调中执行。');
        }


        var defaults = file;

        if (typeof file == 'string') {
            var path = _require('path');
            file = path.resolve(file);
            file = file.replace(/\\/g, '/');

            var ext = path.extname(file).toLowerCase();

            if (ext == '.json') {
                var File = meta.require('File');
                defaults = File.readJSON(file);
            }
            else { // js
                defaults = _require(file);
            }
        }

        var Defaults = meta.require('Defaults');
        Defaults.set(defaults);
    },


    on: function () {
        if (!meta) {
            throw new Error('必须放在 run 方法的回调中执行。');
        }

        var emitter = meta.emitter;
        var args = [].slice.call(arguments);
        emitter.on.apply(emitter, args);
    },
    


    watch: function (fn) {
        if (!meta) {
            throw new Error('必须放在 run 方法的回调中执行。');
        }

        var WebSite = meta.require('WebSite');
        var website = meta.website = new WebSite();

        website.watch(function () {

            var action = process.argv[2];
            var args = [].slice.call(process.argv, 3);

            meta.emitter.fire('watch', action, args);
        });

    },



    build: function (fn) {
        if (!meta) {
            throw new Error('必须放在 run 方法的回调中执行。');
        }
    },

    open: function (options) {
        if (!meta) {
            throw new Error('必须放在 run 方法的回调中执行。');
        }

        meta.website.open(options);
    },
        
    openQR: function () {
        if (!meta) {
            throw new Error('必须放在 run 方法的回调中执行。');
        }

        meta.website.openQR(options);
    },

};