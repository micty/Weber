
/**
* 打开本轻应用在 IIS 上所对应的 url 的二维码。
* 使用命令:
*   node qr
*   node qr 450
*/

var weber = require('auto-weber');

weber.config('./config/defaults.js');

weber.openQR({
    'width': process.argv[2],
});
