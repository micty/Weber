

//对 Node 暴露的导出对象。
module.exports = Module.require('Weber');



})(
    global, // 在 Node 中，全局对象是 global；其他环境是 this
    module,
    require, // node 原生 require

    console,
    setTimeout,
    setInterval,

    Array, 
    Boolean,
    Date,
    Error,
    Function,
    Math,
    Number,
    Object,
    RegExp,
    String,

    JSON,

    require('miniquery')

    /*, undefined */
);
