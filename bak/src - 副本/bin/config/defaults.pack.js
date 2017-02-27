
//使用独立打包的默认配置

module.exports = {
    'WebSite': {
      
        packageFile: 'package/package.json',    //输出的总包文件

        packages: [
            '**/package.json',
            '!package/package.json',            //这个是输出的总文件，要排除掉。
        ],
    },

    'LessList': {
        //额外附加的模式，会跟母版页中的模式合并一起使用。
        extraPatterns: [
            '!<%= dir{ **/package.json } %>**/*.less',
        ],
    },

    'JsList': {
        //额外附加的模式，会跟母版页中的模式合并一起使用。
        extraPatterns: [
            //相对于 htdocs 目录
            '!<%= dir{ **/package.json } %>**/*.js',
        ],
    },

    'HtmlList': {
        //额外附加的模式，会跟母版页中的模式合并一起使用。
        extraPatterns: [
            '!<%= dir{ **/package.json } %>**/view.html',
        ],
    },

    
}