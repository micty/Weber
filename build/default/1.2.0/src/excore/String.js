

/**
* 字符串工具类
* @namesapce
* @name String
*/
define('String', function (require, module,  exports) {



    function replaceBetween(s, beginTag, endTag, value) {

        //重载 replaceBetween(s, opt);
        if (typeof beginTag == 'object') {
            var opt = beginTag;
            beginTag = opt.begin;
            endTag = opt.end;
            value = opt.value;
        }


        if (s.indexOf(beginTag) < 0 || s.indexOf(endTag) < 0) {
            return s;
        }

        var list = s.split(beginTag).map(function (item) {

            var a = item.split(endTag);

            if (a.length == 1) {
                return a[0];
            }

            return value + a.slice(1).join(endTag);

        });


        s = list.join('');
        return s;

    }


    return /**@lends String*/ {
        'replaceBetween': replaceBetween,

    };


});
