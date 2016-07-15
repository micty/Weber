
/**
* 对第三方库 less 的封装。
*/
define('Less', function (require, module, exports) {

    var $ = require('$');
    var path = require('path');

    //https://github.com/Marak/colors.js
    var colors = require('colors');

    var File = require('File');
    var FileRefs = require('FileRefs');
    var MD5 = require('MD5');
    var Less = require('less');

    var md5$debug = {}; //记录 debug 版的信息
    var md5$min = {};   //记录 min 版的信息


    function compile(options) {

        //内部的共用方法，执行最后的操作。
        function done(css, dest) {

            if (options.delete) {
                FileRefs.delete(src);
            }

            if (dest) {    //写入 css 文件
                if (overwrite || !existed) {
                    File.write(dest, css);
                }
            }

            var done = options.done;
            done && done(css);
        }




        var src = options.src;
        var dest = options.dest;
        var compress = options.compress;
        var overwrite = options.overwrite;
       
        if (overwrite === undefined) { 
            overwrite = true;  //修正一下。 当未指定时，则默认为覆盖写入。
        }

        var existed = dest ? File.exists(dest) : false;
        var md5$item = compress ? md5$min : md5$debug;


        var less = File.read(src);
        var md5 = MD5.get(less);
        var item = md5$item[md5];

        if (!item) {
            item = md5$item[md5] = {
                css: '',
                md5: '',
            };
        }


        //指定了要写入目标 css 文件，并且已经存在该目标文件。
        if (dest && existed) {

            var css = File.read(dest);
            var md5css = MD5.get(css);

            if (item.md5 == md5css) { //要编译生成的 css 与之前存在的一致
                console.log('已编译过'.yellow, dest.gray);
                return done(css);
            }
        }

        
        var css = item.css;
        if (css) {
            console.log('已编译过'.yellow, src.gray);
            return done(css, dest);
        }



        //首次编译。

        //详见: http://lesscss.org/usage/#programmatic-usage

        Less.render(less, {
            paths: ['.'],           // Specify search paths for @import directives
            filename: src,          // Specify a filename, for better error messages
            compress: compress,     // Minify CSS output

        }, function (error, output) {

            if (error) {
                console.log('less 编译错误:'.bgRed, error.message.bgRed);
                console.log('所在文件: '.bgMagenta, src.bgMagenta);

                console.log(error);
                throw error;
            }

            var css = output.css;

            //less 输出的 css 是两个空格缩进的，此处用这种方式换成4个空格缩进，不知是否安全。
            if (!compress) {
                css = css.split('\n  ').join('\r\n    ');
            }
            

            item.css = css;
            item.md5 = MD5.get(css);

            console.log('编译'.green, src.cyan);

            done(css, dest);
        });
    }


    
    /**
    * 压缩合并后的 css 文件。
    */
    function minify (content, fn) {
         
        if (!content) {
            fn && fn('');
            return;
        }

        Less.render(content, {
            compress: true,

        }, function (error, output) {

            if (error) {
                console.log('less 压缩错误:'.bgRed, error.message.bgRed);
                console.log(error);
                throw error;
            }

            var css = output.css;

            fn && fn(css);

        });

    }



    return {
        'compile': compile,
        'minify': minify,
    };

});




