
define('Tag', function (require, module, exports) {


    //自闭合标签，如 <link />
    var name$selfClosed = {
        'link': true,
        'meta': true,
    };




    /**
    * 从 html 中提取出指定名称的标签 html。
    */
    function get(html, name) {

        name = name.toLowerCase();
        

        var reg = name$selfClosed[name] ?
            '<' + name + '.*\\/>' :
            '<' + name + '[^>]*?>[\\s\\S]*?<\\/' + name + '>';

        reg = new RegExp(reg);


        var tags = html.match(reg);

        return tags || [];

    }


  


    return {
        get: get,
    };



});




