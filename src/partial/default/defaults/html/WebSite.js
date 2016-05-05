/**
* WebSite 模块的默认配置
* @name WebSite.defaults
*/
define('WebSite.defaults', /**@lends WebSite.defaults*/ {

    cssDir: 'style/css/',
    htdocsDir: '../htdocs/',
    buildDir: '../build/htdocs/',
    files: '**/*.master.html',
    url: 'http://{ip}/{dir}index.html{query}',
    qr: 'http://qr.topscan.com/api.php?w=380&text=', 
});

