
/**
* 编译并进行监控。 使用命令:
*
* 单页应用模式:
*   node watch
*   node watch open
*   node watch open localhost
*   node watch qr
*   node watch qr 450
*
* 独立打包模式:
*   node watch pack
*   node watch pack open
*   node watch pack open localhost
*   node watch pack qr
*   node watch pack qr 450
*/

//解析命令行参数。
function getArgs() {
    var mode = process.argv[2];
    var action = process.argv[3];
    var value = process.argv[4];

    if (mode != 'pack') {
        value = action;
        action = mode;
    }

    return {
        'pack': mode == 'pack', //是否使用独立打包的方式。
        'action': action || '',
        'value': value,
    };
}


//规整化主参数。
function getParam() {
    var args = getArgs();
    var defaults = ['./config/defaults.js'];

    if (args.pack) {
        defaults.push('./config/defaults.pack.js');
    }

    return {
        'action': args.action,
        'value': args.value,
        'defaults': defaults,
    };

}


var param = getParam();
var weber = require('auto-weber');

weber.on('watch', function () {
    ({
        '': function () { },

        'open': function (host) {
            weber.open({
                'host': host,
            });
        },

        'qr': function (width) {
            weber.openQR({
                'width': width,
            });
        },
    })[param.action](param.value);
});

weber.config(param.defaults);
weber.watch();





