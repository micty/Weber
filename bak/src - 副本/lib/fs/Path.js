

/**
* 路径解析器。
*/
define('Path', function (require, module, exports) {

    'use strict';


    var path = require('path');
    var $ = require('$');



    /**
    * 进行标准化处理，以得到格式统一的路径。
    */
    function format(url) {
     
        var Url = require('Url');

        //以 http:// 等开头的，不要处理。
        if (!Url.checkFull(url)) {
            url = url.replace(/\\/g, '/');    //把 '\' 换成 '/'
            url = url.replace(/\/+/g, '/');   //把多个 '/' 合成一个
        }


        url = url.split('#')[0]; //去掉带 hash 部分的
        url = url.split('?')[0]; //去掉带 query 部分的

        return url;
    }

    function dirname(src) {
        var dir = path.dirname(src) + '/';
        return format(dir);
    }


    /**
    * 解析路径，获取基本信息。
    */
    function parse(src) {

        var dir = path.dirname(src) + '/';
        var ext = path.extname(src);
        var filename = path.basename(src);
        var basename = path.basename(src, ext);

        return {
            'dir': dir,
            'name': dir + basename,
            'fullname': src,
            'filename': filename,
            'basename': basename,
            'ext': ext,
        };

    }






    /**
    * 内部方法
    * @inner
    */
    function combine(dir, files, state) {

        if (dir && dir.slice(-1) != '/') { //确保以 '/' 结束，统一约定，不易出错
            dir += '/';
        }

        var depth = 1;

        return $.Array.keep(files, function (item, index) {

            if (typeof item == 'string') {
                return dir + item;
            }

            depth++;

            if (state) {
                state.depth = depth;
            }

            return combine(dir + item.dir, item.files, state); //递归
        });
    }

    /**
    * 把一个对象/数组表示的路径结构线性化成一个一维的数组。
    */
    function linearize(dir, files) {

        if (dir instanceof Array) { //重载 linearize([ ]);
            files = dir;
            dir = '';
        }
        else if (typeof dir == 'object') { //重载 linearize( { dir: '', files: [] } );
            files = dir.files;
            dir = dir.dir;
        }

        var state = { depth: 0 };

        var a = combine(dir, files, state);
        var b = $.Array.reduceDimension(a, state.depth); //降维

        return b;
    }



   

    function join(a, b) {

        var args = [].slice.call(arguments, 0);
        var all = path.join.apply(path, args);

        return format(all);
    }


    function relative(a, b) {
        return format(path.relative(a, b));
    }
 

    return {
        dirname: dirname,
        format: format,
        //parse: parse,
        linearize: linearize,
        join: join,
        relative: relative,


        resolve: function (file) {
            file = path.resolve(file);
            file = file.replace(/\\/g, '/');
            return file;
        },
    };

});
