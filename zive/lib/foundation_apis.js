/* jshint node: true */
'use strict';

var _ = require('busyman'),
    zclId = require('zcl-id');

var zApp,
    foundApis = {};

foundApis.read = function (clusters, cId, payload, afMsg, callback) {
    var readFuncs = [];

    _.forEach(payload, function (readRec) {
        var attrId = readRec.attrId,
            attrType = zclId.attrType(cId, attrId).key,
            rptCfg;
        
        readFuncs.push(function (cb) {
            var readStatusRec = {
                    attrId: attrId,
                    status: null
                };

            clusters.read(cId, attrId, function (err, data) {
                var lastRpVal;

                if (err) {
                    if (data === '_notfound_')
                        readStatusRec.status = zclId.status('unsupAttribute').value;
                    else if (data === '_unreadable_' || data === '_exec_')
                        readStatusRec.status = zclId.status('notAuthorized').value;
                    else
                        readStatusRec.status = zclId.status('failure').value;
                } else {
                    readStatusRec.status = zclId.status('success').value;
                    readStatusRec.dataType = zclId.attrType(cId, attrId).value;
                    readStatusRec.attrData = data;

                    if (isAnalog(attrType) && clusters.has(cId, 'rptCfgs', attrId)) {
                        rptCfg = clusters.get(cId, 'rptCfgs', attrId);
                        lastRpVal = rptCfg.lastRpVal;
                        rptCfg.lastRpVal = data;
                        clusters.set(cId, 'rptCfgs', attrId, rptCfg);

                        if (rptCfg.pmax !== 0xffff &&
                            _.isNumber(rptCfg.step) &&
                            Math.abs(data - lastRpVal) > rptCfg.step) {
                            zApp._report(cId, attrId, data, afMsg);
                        }
                    }
                }
                cb(null, readStatusRec);
            });
        });
    });

    execAsyncFuncs(readFuncs, function (err, result) {
        callback(err, result);
    });
};

foundApis.write = function (clusters, cId, payload, afMsg, callback) {
    var writeFuncs = [];

    _.forEach(payload, function (writeRec) {
        var attrId = writeRec.attrId,
            attrType = zclId.attrType(cId, attrId).key,
            rptCfg;

        writeFuncs.push(function (cb) {
            var acl = clusters.get(cId, 'attrs', attrId),
                writeStatusRec = {
                    attrId: attrId,
                    status: null
                };

            if (acl === 'R') {
                writeStatusRec.status = zclId.status('readOnly').value;
                cb(null, writeStatusRec);
            } else if (writeRec.dataType !== zclId.attrType(cId, attrId).value) {
                writeStatusRec.status = zclId.status('invalidValue').value;
                cb(null, writeStatusRec);
            } else {
                clusters.write(cId, attrId, writeRec.attrData, function (err, data) {
                    var lastRpVal;

                    if (err) {
                        if (data === '_notfound_')
                            writeStatusRec.status = zclId.status('unsupAttribute').value;
                        else if (data === '_unwritable_' || data === '_exec_')
                            writeStatusRec.status = zclId.status('notAuthorized').value;
                        else
                            writeStatusRec.status = zclId.status('failure').value;
                    } else {
                        writeStatusRec.status = zclId.status('success').value;

                        if (clusters.has(cId, 'rptCfgs', attrId) && isAnalog(attrType)) {
                            rptCfg = clusters.get(cId, 'rptCfgs', attrId);
                            lastRpVal = rptCfg.lastRpVal;
                            rptCfg.lastRpVal = data;
                            clusters.set(cId, 'rptCfgs', attrId, rptCfg);

                            if (rptCfg.pmax !== 0xffff &&
                                _.isNumber(rptCfg.step) &&
                                Math.abs(data - lastRpVal) > rptCfg.step) {
                                zApp._report(cId, attrId, data, afMsg);
                            }
                        }
                    }
                    cb(null, writeStatusRec);
                });
            }
        });
    });

    execAsyncFuncs(writeFuncs, function (err, result) {
        callback(err, result);
    });
};

foundApis.configReport = function (clusters, cId, payload, afMsg, callback) {
    var cfgRptRsps = [];

    if (!clusters.has(cId, 'rptCfgs')) {
        clusters.zapp = null;
        clusters.init(cId, 'rptCfgs', {}, false);
        clusters.zapp = zApp;
    }

    _.forEach(payload, function (attrRptCfgRec) {
        var attrId = attrRptCfgRec.attrId,
            attrType = zclId.attrType(cId, attrId).key,
            cfg = clusters.get(cId, 'rptCfgs', attrId),
            attrStatusRec = {
                attrId: attrId,
                direction: attrRptCfgRec.direction,
                status: null
            };

        if (!clusters.has(cId, 'attrs', attrId))
            attrStatusRec.status = zclId.status('unsupAttribute').value;
        else if (attrType === 'array' || attrType === 'struct' || attrType === 'bag')
            attrStatusRec.status = zclId.status('unsupAttribute').value;
        else if (attrStatusRec.direction === 1) {
            if (!cfg) cfg = {};

            cfg.timeout = attrRptCfgRec.timeout;
            clusters.set(cId, 'rptCfgs', attrId, cfg);
            attrStatusRec.status = zclId.status('success').value;
        } else {
            if (attrRptCfgRec.dataType !== zclId.attrType(cId, attrId).value)
                attrStatusRec.status = zclId.status('invalidDataType').value;
            else {
                if (!cfg) cfg = {};
                if (!cfg.rRpt) cfg.rRpt = {};

                cfg.pmin = attrRptCfgRec.minRepIntval;
                cfg.pmax = attrRptCfgRec.maxRepIntval;
                cfg.step = isAnalog(attrType) ? attrRptCfgRec.repChange : null;

                // clear old report config
                if (cfg.rRpt.min) {
                    clearTimeout(cfg.rRpt.min);
                    cfg.rRpt.min = null;
                }

                if (cfg.rRpt.max) {
                    clearInterval(cfg.rRpt.max);
                    cfg.rRpt.max = null;
                }

                // set up new report config
                if (cfg.pmax !== 0xffff) {
                    cfg.rRpt.min = setTimeout(function () {
                        if (cfg.pmin !== 0) {
                            clusters.read(cId, attrId, function (err, data) {
                                if (!err) {
                                    cfg.lastRpVal = data;
                                    zApp._report(cId, attrId, data, afMsg);
                                }
                            });
                        }
                    }, cfg.pmin * 1000);

                    cfg.rRpt.max = setInterval(function () {
                        clusters.read(cId, attrId, function (err, data) {
                            if (!err) {
                                cfg.lastRpVal = data;
                                zApp._report(cId, attrId, data, afMsg);
                            }
                        });

                        if (!_.isNil(cfg.rRpt.min))
                            clearTimeout(cfg.rRpt.min);

                        cfg.rRpt.min = null;

                        cfg.rRpt.min = setTimeout(function () {
                            if (cfg.pmin !== 0) {
                                clusters.read(cId, attrId, function (err, data) {
                                    if (!err) {
                                        cfg.lastRpVal = data;
                                        zApp._report(cId, attrId, data, afMsg);
                                    }
                                });
                            }
                        }, cfg.pmin * 1000);
                    }, cfg.pmax * 1000);
                }

                clusters.set(cId, 'rptCfgs', attrId, cfg);
                attrStatusRec.status = zclId.status('success').value;
            }
        } 
        cfgRptRsps.push(attrStatusRec);
    });
    invokeCbNextTick(cfgRptRsps, callback);
};

foundApis.readReportConfig = function (clusters, cId, payload, afMsg, callback) {
    var readCfgRptRsps = [];

    _.forEach(payload, function (attrRec) {
        var attrId = attrRec.attrId,
            attrType = zclId.attrType(cId, attrId).value,
            direction = attrRec.direction,
            cfg = clusters.get(cId, 'rptCfgs', attrId),
            attrRptCfgRec = {
                attrId: attrId,
                direction: direction,
                status: null
            };

        if (!clusters.has(cId, 'attrs', attrId))
            attrRptCfgRec.status = zclId.status('unsupAttribute').value;
        else if (!cfg)
            attrRptCfgRec.status = zclId.status('unreportableAttribute').value;
        else if (direction === 1) {
            attrRptCfgRec.status = zclId.status('success').value;
            attrRptCfgRec.timeout = cfg.timeout ? cfg.timeout : 0xffff;
        } else {
            attrRptCfgRec.status = zclId.status('success').value;
            attrRptCfgRec.dataType = attrType;
            attrRptCfgRec.minRepIntval = cfg.pmin ? cfg.pmin : 0xffff;
            attrRptCfgRec.maxRepIntval = cfg.pmax ? cfg.pmax : 0xffff;
            if (isAnalog(attrType))
                attrRptCfgRec.repChange = cfg.step ? cfg.step : 0;
        }
        readCfgRptRsps.push(attrRptCfgRec);
    });
    invokeCbNextTick(readCfgRptRsps, callback);
};

foundApis.discover = function (clusters, cId, payload, afMsg, callback) {
    var attrs = clusters.dumpSync(cId, 'attrs'),
        startId = payload.startAttrId,
        maxNums = payload.maxAttrIds,
        discRsp = {
            discComplete: 1,
            attrInfos: []
        };

    _.forEach(attrs, function (info, id) {
        var attrId = zclId.attr(cId, id).value,
            attrInfo = {
                attrId: attrId,
                dataType: null
            };

        if (discRsp.attrInfos.length >= maxNums)
            return false;

        if (attrId >= startId) {
            attrInfo.dataType = zclId.attrType(cId, attrId).value;
            discRsp.attrInfos.push(attrInfo);
        }
    });
    invokeCbNextTick(discRsp, callback);
};

function execAsyncFuncs (funcs, callback) {
    var count = 0,
        flag = false,
        allResult = [];

    if (_.isEmpty(funcs)) return callback(null);

    _.forEach(funcs, function (func) {
        if (flag) return false;

        func(function (err, result) {
            count += 1;

            if (err) {
                callback(err);
                flag = true;
            } else {
                allResult.push(result);
            }

            if (count === funcs.length) callback(null, allResult);
        });
    });
}

function invokeCbNextTick (val, cb) {
    if (_.isFunction(cb)) {
        process.nextTick(function () {
            cb(null, val);
        });
    }
}

function isAnalog(dataType) {
    var type = zclId.dataType(dataType).value,
        analogDigital;

    if ((type > 0x07 && type < 0x20) ||  //GENERAL_DATA, LOGICAL, BITMAP
        (type > 0x2f && type < 0x38) ||  //ENUM
        (type > 0x3f && type < 0x58) ||  //STRING, ORDER_SEQ, COLLECTION
        (type > 0xe7 && type < 0xff))    //IDENTIFIER, MISC
    {
        analogDigital = false;
    } else if (
        (type > 0x1f && type < 0x30) ||  //UNSIGNED_INT, SIGNED_INT
        (type > 0x37 && type < 0x40) ||  //FLOAT
        (type > 0xdf && type < 0xe8))    //TIME
    {
        analogDigital = true;
    }

    return analogDigital;
}

module.exports = function(zive) {
    zApp = zive;
    return foundApis;
};
