

define('console', function (require, module) {

    var console = global.console;

  


});


//var log = console.log.bind(console);


//console.log = function () {
//    //var now = $.Date.format(new Date(), 'yyyyMMddhhmmss');
//    var args = [].slice.call(arguments, 0);
//    //args = [now].concat(args);

//    var $ = Module.require('$');
//    var File = Module.require('File');
//    var file = 'log.txt';


//    var content = File.exists(file) ? File.read(file) : '';
//    content += args.join(' ') + '\r\n';

//    File.write(file, content, null); //本身不能输出 log


//    log.apply(null, args);

//};