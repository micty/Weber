
/**
* 构建生产环境的代码。 使用命令:
*
* 单页应用模式:
*   node build
*   node build dist
*   node build dist open
*   node build dist open localhost
*   node build open
*   node build open localhost
*   node build qr
*   node build qr 450
*   node build dist qr
*   node build dist qr 450
*
* 独立打包模式:
*   node build pack
*   node build pack dist
*   node build pack dist open
*   node build pack dist open localhost
*   node build pack open
*   node build pack open localhost
*   node build pack qr
*   node build pack qr 450
*   node build pack dist qr
*   node build pack dist qr 450
*/


//解析命令行参数。
function getArgs() {

    //完整情况: 
    //node build pack dist open localhost
    //0    1     2    3    4    5

    var index = 2;
    var mode = process.argv[index++];

    if (mode != 'pack') {
        index--;
    }

    var level = process.argv[index++];
    if (level == 'open' || level == 'qr') {
        index--;
        level = '';     //这里要置空
    }

    var action = process.argv[index++];
    var value = process.argv[index++];

    return {
        'pack': mode == 'pack',     //是否使用独立打包的方式。
        'level': level || 'dist',   //配置的方案名称，默认为 `dist`。
        'action': action || '',     //编译完成的操作，如 `open` 或 `qr`。
        'value': value,             //要额外传递给 action 的值。
    };
}


//规整化主参数。
function getParam() {
    var args = getArgs();
    var defaults = ['./config/defaults.js'];

    if (args.pack) {
        defaults.push('./config/defaults.pack.js');
    }

    var options = require('./config/' + args.level);

    //合并
    if (args.pack) {
        var obj = require('./config/' + args.level + '.pack.js');

        for (var key in obj) {
            options[key] = obj[key];
        }
    }

    return {
        'action': args.action,
        'value': args.value,
        'defaults': defaults,
        'options': options,
    };

}





var param = getParam();
var weber = require('auto-weber');

weber.on('build', function () {
    ({
        '': function () { },

        'open': function (host) {
            weber.open({
                'dir': param.options.dir,
                'host': host,
            });
        },

        'qr': function (width) {
            weber.openQR({
                'dir': param.options.dir,
                'width': width,
            });
        },
    })[param.action](param.value);
});


weber.config(param.defaults);
weber.build(param.options);









