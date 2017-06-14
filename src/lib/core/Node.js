
//NodeJs 的原生模块


var _require = require;


[
    'crypto',
    'fs',
    'path',
    'os',
    'child_process',

    'colors',           //https://github.com/Marak/colors.js
    'gaze',             //文件监控器，https://github.com/shama/gaze
    'html-minifier',
    'iconv-lite',       //https://www.npmjs.com/package/iconv-lite
    'less',
    'minimatch',
    'uglify-js',
    'uglify-es',        //针对 es6 的版本，跟上面的只需要用一个即可。

].forEach(function (name) {

    define(name, function (require, module, exports) {
        return _require(name);
    });

});



//这个要先加载，因为其它模块用的是 string 的原型上的颜色值。
require('colors');
