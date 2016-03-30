
//NodeJs 的原生模块
(function ($require) {

    [
        'crypto',
        'fs',
        'path',

        'colors',           //https://github.com/Marak/colors.js
        'gaze',             //文件监控器，https://github.com/shama/gaze
        'html-minifier',
        'iconv-lite',       //https://www.npmjs.com/package/iconv-lite
        'less',
        'minimatch',
        'uglify-js',

    ].forEach(function (name) {

        define(name, function (require, module, exports) {
            return $require(name);
        });
    });

    //这个要先加载，因为其它模块用的是 string 的原型上的颜色值。
    $require('colors');

})($require);