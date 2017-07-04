


define('Console', function (require, module, exports) {

    var File = require('File');
    var Defaults = require('Defaults');
    var $ = require('$');

    var log = console.log.bind(console);
    var defaults = Defaults.get(module.id);
    var file = defaults.file;
    var tag = String.fromCharCode(27); //console ×ÖÌå²ÊÉ«»¯µ¼ÖÂµÄ¿ØÖÆ×Ö·û¡£

    File.delete(file);

    var now = '';
    var RN = '\r\n';


    return {
        /**
        * ´øÊä³öµ½ÎÄ¼şÈÕÖ¾µÄ¿ØÖÆÌ¨ log ·½·¨¡£
        */
        log: function () {
            log(...arguments);

            var s = [...arguments].join(' ');

            //Ìæ»»µôËùÓĞ¿ÉÄÜµÄ¿ØÖÆ×Ö·û¡£
            for (var i = 10; i <= 100; i++) {
                var old = tag + '[' + i + 'm';

                s = s.split(old).join('');
            }

            //Ò»´Î¾ÍÊÇÒ»ĞĞ¡£
            s = s + RN;


            //Ö¸¶¨ÁËÒªÌí¼ÓÊ±¼ä´Á¡£
            if (defaults.timestamp) {
                var dt = $.Date.format(new Date(), 'yyyy-MM-dd HH:mm:ss');

                if (dt != now) {
                    now = dt;
                    s = RN + dt + RN + s;
                }
            }
          


            File.append(file, s, null);

        },
    };
});


''



