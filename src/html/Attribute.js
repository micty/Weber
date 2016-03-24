
define('Attribute', function (require, module, exports) {

    /**
    * 从指定的标签中提取所有的属性。
    * @param {string} tag 要提取的标签 html。
    * @return {string} 返回指定由所有的属性名称和属性值组成的 Object。
    * @example 
        getAll('<link rel="stylesheet" data-tab="no" />'); 
        //得到 
        { 
            rel: 'stylesheet', 
            'data-tab': 'no', 
        }
    */
    function getAll(tag) {

        var reg = new RegExp('[\\w\\-\\_\\d]*?\\s*=\\s*["\'][\\s\\S]*?["\']', 'gi');
        var a = tag.match(reg);

        if (!a) {
            return {};
        }


        var name$value = {};

        a.forEach(function (item, i) {

            var index = item.indexOf('='); //第一个 '=' 的位置
            var name = item.slice(0, index);
            var value = item.slice(index + 1);

            var s = value[0];
            if (s == '"' || s == "'") { //以双引号或单引号开头的，要去掉
                value = value.slice(1, -1);
            }

            name$value[name] = value;

        });

        return name$value;

    }


    /**
    * 从指定的标签中提取指定的属性值。
    * @param {string} tag 要提取的标签 html。
    * @param {string} name 要提取的属性名称。
    * @return {string} 返回指定的属性值。
        当不存在该属性时，返回 undefined。
    * @example 
        getAttribute('<link rel="stylesheet" data-tab="no" />', 'data-tab'); //得到 'no'
    */
    function get(tag, name) {
        var obj = getAll(tag);
        return name ? obj[name] : obj;

        //var reg = new RegExp(name + '\\s*=\\s*["\'][\\s\\S]*?["\']', 'gi');
        //var a = tag.match(reg);

        //if (!a) {
        //    return;
        //}

        //var s = a[0];
        //reg = new RegExp('^' + name + '\\s*=\\s*["\']');
        //s = s.replace(reg, '')
        //s = s.replace(/["']$/gi, '');
        //return s;
    }






    return {
        get: get,
    };



});




