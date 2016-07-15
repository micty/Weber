
module.exports = [
    'partial/default/begin.js',

    {
        dir: 'core',
        files: [
            'Module.js',
            'Node.js',
            '$.js',
            'Weber.js',
            'console.js',
        ]
    },
    {
        dir: 'excore',
        files: [
            'Config.js',
            'Defaults.js',
            'Log.js',
            'Config/Data.js',
            'String.js',
            'Tasks.js',
            'Url.js',
        ]
    },

    {
        dir: 'crypto',
        files: [
            'MD5.js',
        ],
    },
    {
        dir: 'fs',
        files: [
            'Directory.js',
            'File.js',
            'FileRefs.js',
            'Path.js',
            'Patterns.js',
        ],
    },
    {
        dir: 'html',
        files: [
            'Attribute.js',
            'CssLinks.js',
            'HtmlLinks.js',
            'HtmlList.js',
            'JsList.js',
            'JsScripts.js',
            'LessLinks.js',
            'LessList.js',
            'Lines.js',
            'MasterPage.js',
            {
                dir: 'MasterPage',
                files: [
                    'CssList.js',
                    'HtmlList.js',
                    'JsList.js',
                    'Less.js',
                    'Pages.js',
                    'Patterns.js',
                ],
            },
            'Tag.js',
            'Verifier.js',
            'WebSite.js',
            {
                dir: 'WebSite',
                files: [
                    'Masters.js',
                    'Packages.js',
                    'Url.js',
                ],
            },
        ],
    },
    {
        dir: 'pack',
        files: [
            'HtmlPackage.js',
            'JsPackage.js',
            'LessPackage.js',
            'Package.js',

        ],
    },
    {
        dir: 'third',
        files: [
            'Html.js',
            'JS.js',
            'Less.js',
            'Watcher.js',
        ],
    },

    {
        dir: 'partial/default',
        files: [
            {
                dir: 'defaults',
                files: [
                    //这里 LinearPath 有个bug，至少需要三项
                    {
                        dir: 'a',
                        files: [
                        ],
                    },
                    {
                        dir: 'excore',
                        files: [
                            'Module.js',
                            'Url.js',
                        ],
                    },
                    {
                        dir: 'html',
                        files: [
                            'CssLinks.js',
                            'HtmlLinks.js',
                            'HtmlList.js',
                            'JsList.js',
                            'JsScripts.js',
                            'LessLinks.js',
                            'LessList.js',
                            'MasterPage.js',
                            'WebSite.js',
                        ],
                    },
                    {
                        dir: 'pack',
                        files: [
                            'Package.js',
                        ],
                    },
                    {
                        dir: 'third',
                        files: [
                            'Html.js',
                            'Watcher.js',
                        ],
                    },
                ],
            },

            'expose.js',
            'end.js',
        ]
    },
];