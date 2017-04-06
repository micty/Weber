

define('HtmlLinks/LogicFile', function (require, module, exports) {

    var $ = require('$');
    var File = require('File');


    return {
        get: function (selector) {
            var WebSite = require('WebSite');

            var files = WebSite.current.getFiles([
                '**/*.html',
                '!**/index.html',
                '!**/index.master.html',
            ]);

            var file$html = {};

            files.map(function (file) {
                var html = File.read(file);
                file$html[file] = html;
            });


            var matches = files.filter(function (file) {
                var html = file$html[file];
                return html.includes(selector);
            });

            return matches;

        },
    };



});




