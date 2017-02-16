

var $ = require('./f/miniquery');
var Emitter = $.require('Emitter');
var emitter = new Emitter();

var meta = null;


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

        var WebSite = require('WebSite');
        var website = new WebSite();

        meta = {
            'require': require,
            'module': module,
            'website': website,    //必须在调用 config() 后再次构造，以让新的配置生效。
        };

        emitter.fire('ready', [require, module]);
    });
}




module.exports = {

    /**
    * 
    */
    on: function () {
        var args = [].slice.call(arguments);
        emitter.on.apply(emitter, args);
    },


    /**
    * 
    */
    config: function (files) {
        if (meta) {
            config(files);
            return;
        }

        emitter.on('ready', function () {
            config(files);
        });
        run();

        function config(files) {
            if (!Array.isArray(files)) {
                files = [files];
            }

            var path = require('path');
            var Defaults = meta.require('Defaults');
            var File = meta.require('File');

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
            meta.website && meta.website.destroy();
            var WebSite = meta.require('WebSite');
            meta.website = new WebSite();

        }
    },


    /**
    * 
    */
    watch: function () {
        if (meta) {
            watch();
            return;
        }

        emitter.on('ready', watch);
        run();

        function watch() {
            meta.website.watch(function () {
                emitter.fire('watch');
            });
        }
    },

    /**
    * 
    */
    build: function (options) {
        if (meta) {
            build(options);
            return;
        }

        emitter.on('ready', function () {
            build(options);
        });
        run();

        function build(options) {
            meta.website.build(options, function () {
                emitter.fire('build');
            });
        }

    },

    /**
    * 
    */
    open: function (options) {
        if (meta) {
            meta.website.open(options);
            return;
        }

        emitter.on('ready', function () {
            meta.website.open(options);
        });
        run();
    },

    /**
    * 
    */
    openQR: function (options) {
        if (meta) {
            meta.website.openQR(options);
            return;
        }

        emitter.on('ready', function () {
            meta.website.openQR(options);
        });
        run();
    },

};