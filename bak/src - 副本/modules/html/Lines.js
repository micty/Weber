

/**
* 把 HTML 文本分裂成行的工具。
*/
define('Lines', function (require, module, exports) {

    var $ = require('$');

    /**
    * 查找指定字符串在行列表中所在的索引值(行号)。
    */
    function getIndex(list, s, startIndex) {
        var len = list.length;

        for (var i = startIndex || 0; i < len; i++) {
            var item = list[i];
            if (item.indexOf(s) >= 0) {
                return i;
            }
        }

        //这样写为了更容易发现 bug，以防万一。
        throw Error('无法找到所在 index!');

        //return -1;
    }


    //在某些操作系统下，换行符不一致时会出错。
    function get(content) {

        content = content.split('\r\n').join('\n');
        content = content.split('\r').join('\n');
        var lines = content.split('\n');

        return lines;
    }


    function join(lines) {
        return lines.join('\r\n');
    }


    //判断所在的行是否给注释掉了
    function commented(line, item) {
        return $.String.between(line, '<!--', '-->').indexOf(item) >= 0;
    }

    //统计指定内容中的行数和最大列数。
    function stat(content) {
        
        var lines = get(content);

        var x = 0;
        var y = 0;
        var no = 0;


        lines.forEach(function (line, index) {

            var s = line.trim();        //移除前后空格后。
            if (!s ||                   //没内容。
                s.startsWith('//') ||   //以 `//` 开始的注释，在单行注释里。
                s.startsWith('/*') ||   //以 `/*` 开始的注释，在多行注释里。
                s.startsWith('*')) {    //以 `*` 和 `*/` 开始的注释，在多行注释里。

                return;
            }


            y++;

            var len = line.length;
            if (len > x) {
                x = len;
                no = index;
            }
        });

        
        return {
            'x': x,             //最长的一行的长度。           
            'y': y,             //有效的行数，即去掉空行、注释行后的行数。
            'y0': lines.length, //原始行数。
            'no': no + 1,       //最最长的一行所在的行号，从 1 开始。
        };
    }
 

    return {
        get: get,
        join: join,
        getIndex: getIndex,
        commented: commented,
        seperator: '\r\n',
        'stat': stat,
    };



});




