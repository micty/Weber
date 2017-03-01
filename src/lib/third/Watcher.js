
/**
* 文件监控器类。
* @class
* @name Watcher
*/
define('Watcher', function (require, module, exports) {

    var Path = require('Path');
    var Defaults = require('Defaults');
    var MD5 = require('MD5');
    var Directory = require('Directory');

    var $ = require('$');
    

    var Emitter = $.require('Emitter');
    
    var mapper = new Map();

    //https://github.com/shama/gaze
    var Gaze = require('gaze').Gaze;



    function Watcher(config) {


        config = Defaults.clone(module.id, config);


        var emitter = new Emitter(this);
        var files = config.files || [];
        var event$desc = config.events;

        var watcher = new Gaze(files, {
            debounceDelay: 0,
            maxListeners: 9999,
        });

        var events = {};        //记录需要绑定的事件类型。
        var file$md5 = {};      //记录文件名与对应的内容的 md5 值。

        var meta = {
            'emitter': emitter,
            'watcher': watcher,
            'events': events,
        };

        mapper.set(this, meta);


        Object.entries(event$desc).forEach(function (keyvalue) {

            (function (event, desc) {
                var tid = null;
                var files = new Set();

                watcher.on(event, function (file) {

                    //没有绑定该类型的事件。 
                    //或是一个目录。
                    if (!events[event] ||
                        Directory.check(file)) {
                        return;
                    }


                    file = Path.relative('./', file);

                    //在某些编辑器里，内容没发生变化也可以保存(只会刷新修改时间)，从而触发 changed 事件。
                    if (event == 'changed') {
                        var md5 = MD5.read(file);
                        if (md5 == file$md5[file]) {
                            return;
                        }

                        file$md5[file] = md5;
                    }

                    clearTimeout(tid);
                    files.add(file);//增加一条记录

                    console.log(desc.cyan, file);

                    tid = setTimeout(function () {

                        var list = Array.from(files);

                        emitter.fire(event, [list]);
                        Watcher.log();

                    }, 500);
                });

            })(keyvalue[0], keyvalue[1]);


        });

    }




    Watcher.prototype = {
        constructor: Watcher,

        /**
        * 设置新的监控文件列表。
        * 该方法会重新设置新的要监控的文件列表，之前的列表则不再监控。
        */
        set: function (dir, filters) {

            var meta = mapper.get(this);
            var watcher = meta.watcher;

            //先清空之前的
            var dir$files = watcher.relative();
            Object.keys(dir$files).forEach(function (dir) {

                var files = dir$files[dir];

                files.forEach(function (file) {
                    file = Path.join(dir, file);
                    watcher.remove(file);
                });
            });
           

            var Patterns = require('Patterns');

            var files = Patterns.combine(dir, filters);
            files = $.Array.unique(files);

            watcher.add(files);
           
        },

        /**
        * 添加新的监控文件列表。
        * 该方法会在原来的列表基础上添加新的要监控的文件列表。
        */
        add: function (dir, filters) {

            var meta = mapper.get(this);
            var watcher = meta.watcher;

            var Patterns = require('Patterns');
            var files = Patterns.combine(dir, filters);
            
            watcher.add(files);

        },

        /**
        * Unwatch all files and reset the watch instance.
        */
        close: function () {
            var meta = mapper.get(this);
            var watcher = meta.watcher;
            watcher.close();
        },


        on: function (name, fn) {
            var meta = mapper.get(this);
            var emitter = meta.emitter;

            var args = [].slice.call(arguments, 0);
            emitter.on.apply(emitter, args);

            //记录绑定的事件类型。
            var events = meta.events;
            if (typeof name == 'object') {
                Object.keys(name).forEach(function (name) {
                    events[name] = true;
                });
            }
            else {
                events[name] = true;
            }

            return this;
        },

        destroy: function () {

            var meta = mapper.get(this);

            meta.watcher.close();


            var emitter = meta.emitter;
            emitter.destroy();

            mapper.delete(this);

        },


    };

   


    var tid = null;

    return $.Object.extend(Watcher, {
        log: function () {
            clearTimeout(tid);
            tid = setTimeout(function () {
                console.log('>>'.cyan + ' Watching...');
            }, 500);
        },
    });


});




