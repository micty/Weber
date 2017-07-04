
/**
* 
*/
define('WebSite/Files', function (require, module, exports) {

    var File = require('File');
    var Patterns = require('Patterns');
    var Log = require('Log');




    return {

        clear: function (cwd, patterns, desc) {
            if (!patterns) {
                return;
            }

            desc = desc || '清理';

            var files = Patterns.getFiles(cwd, patterns);

            File.delete(files);

            Log.seperate();
            console.log(desc.bgMagenta, files.length.toString().cyan, '个文件:');

            Log.logArray(files, 'gray');

        },


    };




});




