/* jshint node: true */
'use strict';
var fs = require('fs'), Enum = require('enum');
var zpiMeta = require('./defs/zpi_meta.json'), zmtDefs = require('./defs/zmt_defs.json');
var zmeta = {
    CmdType: new Enum(zmtDefs.CmdType),
    Subsys: new Enum(zmtDefs.Subsys),
    ParamType: new Enum(zmtDefs.ParamType),
    SYS: new Enum(zmtDefs.SYS),
    MAC: new Enum(zmtDefs.MAC),
    AF: new Enum(zmtDefs.AF),
    ZDO: new Enum(zmtDefs.ZDO),
    SAPI: new Enum(zmtDefs.SAPI),
    UTIL: new Enum(zmtDefs.UTIL),
    DBG: new Enum(zmtDefs.DBG),
    APP: new Enum(zmtDefs.APP),
    APP_CNF: new Enum(zmtDefs.APP_CNF),
    GREENPOWER: new Enum(zmtDefs.GREENPOWER)
};
zmtDefs.CmdType = null;
zmtDefs.Subsys = null;
zmtDefs.ParamType = null;
zmtDefs.SYS = null;
zmtDefs.MAC = null;
zmtDefs.AF = null;
zmtDefs.ZDO = null;
zmtDefs.SAPI = null;
zmtDefs.UTIL = null;
zmtDefs.DBG = null;
zmtDefs.APP = null;
zmtDefs.APP_CNF = null;
zmtDefs.GREENPOWER = null;
zmtDefs = null;
zmeta.get = function (subsys, cmd) {
    var meta = zpiMeta[subsys];
    return meta ? meta[cmd] : undefined;
    // return: {
    //  type,
    //  cmdId,
    //  params:
    //      {
    //          req: [ { name: type }, ... ],
    //          rsp: [ { name: type }, ... ]
    //      }
    // }
};
zmeta.getType = function (subsys, cmd) {
    var meta = this.get(subsys, cmd);
    if (meta)
        meta = this.CmdType.get(meta.type);
    return meta ? meta.key : undefined; // return: "POLL", "SREQ", "AREQ", "SRSP"
};
zmeta.getParams = function (subsys, cmdName) {
    var meta = zmeta.get(subsys, cmdName);
    return meta ? meta.params : meta;
};
zmeta.getReqParams = function (subsys, cmd) {
    var meta = zmeta.getParams(subsys, cmd), params = meta ? meta.req : meta; // [ { name: type }, .... ]
    if (params)
        return zmeta.cloneParamsWithNewFormat(params);
    else
        return;
};
zmeta.getRspParams = function (subsys, cmd) {
    var meta = zmeta.getParams(subsys, cmd), params = meta ? meta.rsp : meta; // [ { name: type }, .... ]
    if (params)
        return zmeta.cloneParamsWithNewFormat(params);
    else
        return;
};
zmeta.cloneParamsWithNewFormat = function (params) {
    var output = [];
    params.forEach(function (item, idx) {
        var newItem = {
            name: Object.keys(item)[0],
            type: null
        };
        newItem.type = item[newItem.name]; // type is a number
        output.push(newItem);
    });
    output = zmeta._paramTypeToString(output);
    return output;
};
zmeta._paramTypeToString = function (params) {
    params.forEach(function (item, idx) {
        var type = zmeta.ParamType.get(item.type); // enum | undefined
        item.type = type ? type.key : item.type; // item.type is a string
    });
    return params;
};
module.exports = zmeta;
//# sourceMappingURL=zmeta.js.map