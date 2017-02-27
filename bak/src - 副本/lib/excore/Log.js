
define('Log', function (require, module, exports) {


    function seperate() {
        console.log('------------------------------------------------------------------------------'.magenta);
    }

    function allDone(s) {
        console.log(('=================================' + s + '=================================').green);
    }

    function logArray(list, color) {
        color = color || 'green';
        console.log('    ' + list.join('\r\n    ')[color]);
    }



    return {
        'seperate': seperate,
        'allDone': allDone,
        'logArray': logArray,
    };

});




