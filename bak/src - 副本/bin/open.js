
/**
* 打开本轻应用在 IIS 上所对应的 url。
* 使用命令:
*   node open
*   node open localhost
*/

var weber = require('auto-weber');

weber.config('./config/defaults.js');

weber.open({
    'host': process.argv[2],
});



