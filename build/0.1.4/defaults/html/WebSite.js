/**
* WebSite 模块的默认配置
* @name WebSite.defaults
*/
define('WebSite.defaults', /**@lends WebSite.defaults*/ {

    cssDir: 'style/css/',
    htdocsDir: '../htdocs/',
    buildDir: '../build/htdocs/',
    files: '**/*.master.html',
    url: 'http://{host}/{dir}index.html{query}',
    qr: {
        width: 380,
        url: 'http://qr.topscan.com/api.php{query}',
    },
});

