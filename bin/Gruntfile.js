﻿

module.exports = function (grunt) {

    grunt.file.defaultEncoding = 'utf8';

    var pkg = grunt.file.readJSON('../src/package.json');
    var dest = '../build/' + pkg.version;

    grunt.initConfig({
        clean: {
            options: {
                force: true,
            },
            node_modules: [
                '../src/node_modules/',
                //dest + '/node_modules/',
            ],
        },

        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '../src/',
                        src: ['*/**', '*'],
                        dest: dest,
                    },
                    {
                        expand: true,
                        cwd: '../',
                        src: ['readme.md'],
                        dest: dest,
                    },
                ],
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['clean', 'copy']);
};