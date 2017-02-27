
/**
* 文件引用管理类。
*/
define('FileRefs', function (require, module, exports) {

    'use strict';

    var file$count = {}; //文件计数器。


    function add(file) {
        if (!file) {
            return;
        }

        var count = file$count[file] || 0;
        file$count[file] = count + 1;
    }


    function deletes(file, force) {

        if (!file) {
            return;
        }

        if (force) { //立即强制删除
            var File = require('File');

            file$count[file] = 0;
            File.delete(file);
            return;
        }

        var count = file$count[file] || 0;
        count = count - 1;
        if (count < 0) {
            count = 0;
        }

        file$count[file] = count;

    }


    /**
    * 删除引用计数为 0 的物理文件。
    */
    function clean() {
     
        var files = Object.keys(file$count).filter(function (file) {
            return file$count[file] == 0;
        });

        var File = require('File');
        File.delete(files);

    }
    
    



    return {
        'add': add,
        'delete': deletes,
        'clean': clean,
    };

});
