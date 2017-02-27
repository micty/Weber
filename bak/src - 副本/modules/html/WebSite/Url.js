
define('WebSite/Url', function (require, module, exports) {

    var $ = require('$');
   

    function getHost() {

        var os = require('os');
        var name$list = os.networkInterfaces();
        var all = [];

        for (var name in name$list) {
            var list = name$list[name];
            all = all.concat(list);
        }

        var item = all.find(function (item, index) {
            return !item.internal &&
                item.family == 'IPv4' &&
                item.address !== '127.0.0.1'
        });

        return item ? item.address : '';

    }


    function getDir(dir) {
        var path = require('path');
        var cwd = process.cwd();

        dir = path.join(cwd, dir);
        dir = dir.split('\\').join('/');
        dir = dir.split(':/')[1];

        return dir;
    }

    function getQuery(query) {

        if (typeof query == 'object') {
            query = $.Object.toQueryString(query);
        }

        query = '?' + query;
        return query;
    }


    function getUrl(options) {

        var host = options.host;
        var dir = options.dir;
        var query = options.query;
        var sample = options.sample;

        var url = $.String.format(sample, {
            'host': host || getHost(),
            'dir': dir ? getDir(dir) : '',
            'query': query ? getQuery(query) : '',
        });


        return url;

    }


    function open(options) {

        var child = require('child_process')
        var url = getUrl(options);
        var tips = options.tips;

        if (tips) {
            console.log(tips.bgGreen, url.cyan);
        }

        url = url.split('&').join('^&'); //用于命令行中的 & 必须转义为 ^&
        child.exec('start ' + url);
    }



    return {
        'open': open,
        'get': getUrl,
    };

});




