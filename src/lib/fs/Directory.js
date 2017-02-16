

/**
* 目录工具
*/
define('Directory', function (require, module, exports) {


    var fs = require('fs');
    var path = require('path');

    /**
    * 格式化指定的路径为一个目录。
    */
    function format(dir) {

        var Path = require('Path');

        dir = Path.format(dir); 

        if (dir.slice(-1) != '/') { //确保以 '/' 结束，统一约定，不易出错
            dir += '/';
        }

        return dir;

    }


    /**
    * 检测指定的路径是否为目录。
    */
    function check(path) {
        var stat = fs.statSync(path);
        return stat.isDirectory();
    }



    /**
    * 递归的获取指定目录下及子目录下的所有文件列表。
    */
    function getFiles(dir, filter) {

        dir = format(dir);


        var isFn = typeof filter == 'function';
        var list = fs.readdirSync(dir);
        var files = [];


        list.forEach(function (item, index) {

            item = dir + item;

            if (check(item)) { // item 还是个目录， 递归
                var fn = isFn ? filter : null; //为回调函数时才需要进一步传到递归函数
                var list = getFiles(item, fn);
                files = files.concat(list);
                return;
            }

            //让回调函数去处理
            if (isFn) {
                item = filter(item); 

                if (item === null) {
                    return;
                }
            }

            files.push(item);
        });


        //最外层的才需要匹配指定模式的文件，递归的不需要。
        if (filter instanceof Array) {

            var Patterns = require('Patterns');

            var patterns = Patterns.combine(dir, filter);

            files = Patterns.match(patterns, files);
        }


        return files;
    }




    /**
    * 递归地删除指定目录及子目录的所有文件。
    */
    function deletes(dir) {

        dir = format(dir);


        var existed = fs.existsSync(dir);
        if (!existed) {
            return;
        }

        var list = fs.readdirSync(dir);

        list.forEach(function (item, index) {

            item = dir + item;

            if (check(item)) {
                deletes(item); //递归
            }
            else {
                fs.unlinkSync(item); //删除文件
            }

        });

        fs.rmdirSync(dir);

    }

    /**
    * 递归地删除指定目录及子目录下的所有空目录。
    */
    function trim(dir) {

        dir = format(dir);

        var existed = fs.existsSync(dir);
        if (!existed) {
            return;
        }

        var list = fs.readdirSync(dir);

        if (list.length == 0) {//空目录
            fs.rmdirSync(dir);
            return;
        }

        list.forEach(function (item, index) {

            item = dir + item;

            if (!check(item)) { //不是目录
                return;
            }

            //是一个目录
            trim(item); //递归

            var list = fs.readdirSync(dir);
            if (list.length == 0) {//空目录
                fs.rmdirSync(dir);
                return;
            }
            
        });

    }



    /**
    * 递归地创建目录及子目录。
    */
    function create(dir) {

        dir = dir.slice(-1) == '/' ?
            dir.slice(0, -1) :
            path.dirname(dir);


        if (fs.existsSync(dir)) { //已经存在该目录
            return;
        }


        var parent = path.dirname(dir) + '/';

        if (!fs.existsSync(parent)) {
            create(parent);
        }

        fs.mkdirSync(dir);
    }


    /**
    * 递归地复制指定目录及子目录的所有文件。
    */
    function copy(srcDir, destDir) {


        create(destDir);

        var Path = require('Path');
        var File = require('File');
        var list = fs.readdirSync(srcDir);
        

        list.forEach(function (item, index) {

            var src = srcDir + '\\' + item;
            var dest = destDir + '\\' + item;

            src = Path.format(src);
            dest = Path.format(dest);

            //是一个目录，递归处理
            if (check(src)) {
                copy(src, dest);
                return;
            }

            File.copy(src, dest);
        });

    }

   
    



    return {
        'getFiles': getFiles,
        'check': check,
        'delete': deletes,
        'trim': trim,
        'format': format,
        'copy': copy,
        'create': create,

    };

});
