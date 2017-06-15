
/**
* JS 文件工具类。
*/
define('JS', function (require, module, exports) {

    var $ = require('$');
    var path = require('path');

    var File = require('File');
    var FileRefs = require('FileRefs');
    var Path = require('Path');
    var MD5 = require('MD5');





    return {
        

        /**
        * 合并 js 文件列表。
        */
        concat: function (list, options) {

            if (list.length == 0) {
                return '';
            }

            var contents = [];
            
            list.forEach(function (src, index) {

                var file = src;

                //添加文件路径的注释
                var addPath = options.addPath;
                if (addPath) { 
                    //如果传入的是字符串，则使用相对于它的地址。
                    if (typeof addPath == 'string') {
                        file = Path.relative(addPath, src);
                    }

                    contents.push('\r\n// ' + file + '\r\n');
                }
                

                var s = File.read(src);
                contents.push(s);

                //删除源分 js 文件
                if (options.delete) {
                    FileRefs.delete(src);
                }

            });

            console.log('合并'.bgGreen, list.length.toString().cyan, '个文件:');
            console.log('    ' + list.join('\r\n    ').gray);


            var content = contents.join('');
            var dest = options.dest;
 
            if (dest) {
                if (typeof dest == 'object') {
                    var name = dest.name;

                    if (typeof name == 'number') {
                        name = MD5.get(content, name);
                        name += '.js';
                    }

                    dest = dest.dir + name;
                }

                File.write(dest, content); //写入合并后的 js 文件
            }

        

            return content;

        },


        
        /**
        * 压缩 js 内容。
        */
        minify: function (content, options) {

            options = options || {};

            //https://github.com/mishoo/UglifyJS2
            //var UglifyJS = require('uglify-js');

            //https://github.com/mishoo/UglifyJS2/tree/harmony
            var UglifyJS = require('uglify-es');

            var code = '';



            try{
                //直接从内容压缩，不读取文件
                //var result = UglifyJS.minify(content, { fromString: true, }); 
                var result = UglifyJS.minify(content);  //针对 es6。

                code = result.code;

                if (!code) {
                    console.log('JS 压缩错误，压缩后的内容为空'.red);
                    console.log(result);
                    File.write('all.error.debug.js', content);
                    throw new Error('JS 压缩错误，压缩后的内容为空');
                }
            }
            catch (ex) {
                console.log('JS 压缩错误'.red);
                console.log(result);
                File.write('all.error.debug.js', content);
                throw ex;
            }
          

            var dest = options.dest;
            if (dest) {

                if (typeof dest == 'object') {
                    var name = dest.name;
                    if (typeof name == 'number') {
                        name = MD5.get(code, name);
                        name += '.js';
                    }

                    dest = dest.dir + name;
                }

                File.write(dest, code); //写入合并后的 js 文件

            }

            return code;
        },

    };



   



});




