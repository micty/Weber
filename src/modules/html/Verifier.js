
define('Verifier', function (require, module, exports) {

    var $ = require('$');
    var File = require('File');
    var Lines = require('Lines');
    
    

    return {

        /**
        * 检查重复的文件引用。
        */
        'files': function (stats) {

            var file$stat = stats[0]; //总的 file$stat。

            //合并成一个 file$stat
            stats.slice(1).forEach(function (item) {

                $.Object.each(item, function (file, obj) {

                    var stat = file$stat[file];
                    if (stat) {
                        stat['count'] += obj['count'];
                    }
                    else {
                        file$stat[file] = obj;
                    }
                });
            });


            var md5$files = {};

            $.Object.each(file$stat, function (file, stat) {
                var md5 = stat.md5;
                var files = md5$files[md5];

                if (!files) {
                    files = md5$files[md5] = [];
                }

                files.push(file);

            });




            var file$count = {};    //重复引用同一个文件，根据文件路径识别。
            var md5$list = {};      //内容完全相同的文件，根据文件内容识别。

            $.Object.each(file$stat, function (file, stat) {
                var count = stat['count'];
                if (count > 1) {
                    file$count[file] = count;
                }
            });


            $.Object.each(md5$files, function (md5, files) {
                if (files.length > 1) {
                    md5$list[md5] = files;
                }
            });


            var invalid = false;

            if (Object.keys(file$count).length > 0) {
                invalid = true;
                console.log('重复引用同一个文件: '.bgRed);

                $.Object.each(file$count, function (file, count) {
                    console.log('    ' + file.red + ':', count.toString().cyan, '次');
                });
            }

            if (Object.keys(md5$list).length > 0) {
                invalid = true;
                console.log('内容完全相同的文件: '.bgRed);

                $.Object.each(md5$list, function (md5, list) {
                    console.log(md5.yellow, list.length.toString().cyan, '个:');
                    console.log('    ' + list.join('\r\n    ').red);
                });
            }

            return invalid;
        },



        /**
        * 检查重复的 id。
        */
        'ids': function (html) {

            var ids = html.match(/\s+id\s*=\s*["'][\s\S]*?["']/ig);
            if (!ids) { //没有匹配到 id。
                return;
            }


            var id$stat = {};

            ids.forEach(function (item) {
                var a = item.split(/\s+id\s*=\s*/i);
                var id = a[1].slice(1, -1);

                //包含 `{` 和 `}`，可能是模板中的 id，忽略掉。
                if (id.indexOf('{') >= 0 && id.indexOf('}') > 0) {
                    return;
                }

                var stat = id$stat[id];
                if (stat) {
                    stat.count++;
                    stat.items.push(item);

                    return;
                }

                id$stat[id] = {
                    'items': [item],
                    'count': 1,
                };

            });


            id$stat = $.Object.grep(id$stat, function (id, stat) {
                return stat.count > 1;
            });


            if (Object.keys(id$stat).length == 0) {
                return;
            }


            console.log('使用重复的 id: '.bgRed);
            console.log('');

            var lines = Lines.get(html);


            $.Object.each(id$stat, function (id, stat) {

                console.log(id.red + ':', stat.count.toString().cyan, '次');

                //得到一个二维数组
                var htmls = $.Array.keep(stat.items, function (item) {

                    return $.Array.grep(lines, function (line) {
                        return line.indexOf(item) >= 0;
                    });
                });

                //降成一维
                htmls = $.Array.reduceDimension(htmls);

                //去重
                var obj = {};
                htmls.forEach(function (item) {
                    obj[item] = true;
                });

                htmls = Object.keys(obj).map(function (item) {
                    item = item.split(id).join(id.yellow);
                    item = item.trim(); //为了方便显示，去掉首尾空格。

                    return item;
                });

                console.log(htmls.join('\r\n'));
                console.log('');

            });


            return true;

        },
    };



});




