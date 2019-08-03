/* jshint node: true */
'use strict';

import * as Zcl from '../../../zcl';

var _ = require('busyman');

var zApp,
    foundApis = {};

foundApis.read = function (clusters, cId, payload, afMsg, callback) {
    var readFuncs = [];

    _.forEach(payload, function (readRec) {
        var attrId = readRec.attrId,
            attrType = Zcl.getAttributeTypeLegacy(cId, attrId).value,
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
                        readStatusRec.status = Zcl.Status.UNSUP_ATTRIBUTE;
                    else if (data === '_unreadable_' || data === '_exec_')
                        readStatusRec.status = Zcl.Status.NOT_AUTHORIZED;
                    else
                        readStatusRec.status = Zcl.Status.FAILURE;
                } else {
                    readStatusRec.status = Zcl.Status.SUCCESS;
                    readStatusRec.dataType = Zcl.getAttributeTypeLegacy(cId, attrId).value;
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
            attrType = Zcl.getAttributeTypeLegacy(cId, attrId).value,
            rptCfg;

        writeFuncs.push(function (cb) {
            var acl = clusters.get(cId, 'attrs', attrId),
                writeStatusRec = {
                    attrId: attrId,
                    status: null
                };

            if (acl === 'R') {
                writeStatusRec.status = Zcl.Status.READ_ONLY;
                cb(null, writeStatusRec);
            } else if (writeRec.dataType !== Zcl.getAttributeTypeLegacy(cId, attrId).value) {
                writeStatusRec.status = Zcl.Status.INVALID_VALUE;
                cb(null, writeStatusRec);
            } else {
                clusters.write(cId, attrId, writeRec.attrData, function (err, data) {
                    var lastRpVal;

                    if (err) {
                        if (data === '_notfound_')
                            writeStatusRec.status = Zcl.Status.UNSUP_ATTRIBUTE;
                        else if (data === '_unwritable_' || data === '_exec_')
                            writeStatusRec.status = Zcl.Status.NOT_AUTHORIZED;
                        else
                            writeStatusRec.status = Zcl.Status.FAILURE;
                    } else {
                        writeStatusRec.status = Zcl.Status.SUCCESS;

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
            attrType = Zcl.getAttributeTypeLegacy(cId, attrId).value,
            cfg = clusters.get(cId, 'rptCfgs', attrId),
            attrStatusRec = {
                attrId: attrId,
                direction: attrRptCfgRec.direction,
                status: null
            };

        if (!clusters.has(cId, 'attrs', attrId))
            attrStatusRec.status = Zcl.Status.UNSUP_ATTRIBUTE;
        else if (attrType === Zcl.DataType.array || attrType === Zcl.DataType.struct  || attrType === Zcl.DataType.bag )
            attrStatusRec.status = Zcl.Status.UNSUP_ATTRIBUTE;
        else if (attrStatusRec.direction === 1) {
            if (!cfg) cfg = {};

            cfg.timeout = attrRptCfgRec.timeout;
            clusters.set(cId, 'rptCfgs', attrId, cfg);
            attrStatusRec.status = Zcl.Status.SUCCESS;
        } else {
            if (attrRptCfgRec.dataType !== Zcl.getAttributeTypeLegacy(cId, attrId).value)
                attrStatusRec.status = Zcl.Status.INVALID_DATA_TYPE;
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
                attrStatusRec.status = Zcl.Status.SUCCESS;
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
            attrType = Zcl.getAttributeTypeLegacy(cId, attrId).value,
            direction = attrRec.direction,
            cfg = clusters.get(cId, 'rptCfgs', attrId),
            attrRptCfgRec = {
                attrId: attrId,
                direction: direction,
                status: null
            };

        if (!clusters.has(cId, 'attrs', attrId))
            attrRptCfgRec.status = Zcl.Status.UNSUP_ATTRIBUTE;
        else if (!cfg)
            attrRptCfgRec.status = Zcl.Status.UNREPORTABLE_ATTRIBUTE;
        else if (direction === 1) {
            attrRptCfgRec.status = Zcl.Status.SUCCESS;
            attrRptCfgRec.timeout = cfg.timeout ? cfg.timeout : 0xffff;
        } else {
            attrRptCfgRec.status = Zcl.Status.SUCCESS;
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
        var attrId = Zcl.getAttributeLegacy(cId, id).value,
            attrInfo = {
                attrId: attrId,
                dataType: null
            };

        if (discRsp.attrInfos.length >= maxNums)
            return false;

        if (attrId >= startId) {
            attrInfo.dataType = Zcl.getAttributeTypeLegacy(cId, attrId).value;
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

function isAnalog(type) {
    var analogDigital;

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
