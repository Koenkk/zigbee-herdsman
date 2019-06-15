var _ = require('busyman'),
    Ziee = require('ziee'),
    sinon = require('sinon'),
    zclId = require('zcl-id'),
    expect = require('chai').expect;

var Zive = require('../index.js');

var ziee = new Ziee({});

// init lightingColorCtrl cluster
ziee.init('lightingColorCtrl', 'dir', { value: 1 });
ziee.init('lightingColorCtrl', 'attrs', {
    currentHue: 10,
    currentSaturation: {
        read: function (cb) {
            cb(null, 20);
        },
        write: function (val, cb) {
            cb(null, val);
        }
    },
    colorMode: {
        read: function (cb) {
            cb(null, 30);
        }
    }
});

ziee.init('lightingColorCtrl', 'acls', {
    currentHue: 'RW',
    currentSaturation: 'RW',
    colorMode: 'R'
});

ziee.init('lightingColorCtrl', 'cmds', {
    moveToHue: function (zapp, movemode, rate, cb) {
        cb(null, 'xxx');
    },
    stepHue: function (zapp, stepmode, stepsize, transtime, cb) {
    },
    stepColor: {
        exec: function (zapp, stepx, stepy, transtime, cb) {
        }
    }
});

// init genGroups cluster
ziee.init('genGroups', 'dir', { value: 1 });

ziee.init('genGroups', 'cmds', {
    add: function () {}
});

var infos = {
        profId: 260,
        devId: 258
    },
    zive = new Zive(infos, ziee);

zive.foundation = function () {};
zive.functional = function () {};

var afMsg = {
        clusterid: 0x0300,
        srcaddr: '0x124b0012345678',
        srcendpoint: 8,
        dstendpoint: 10,
        zclMsg: {
            frameCntl: {
                frameType: null,
                manufSpec: 0,
                direction: 0,
                disDefaultRsp: 1
            },
            manufCode: null,
            seqNum: 60,
            cmdId: null,
            payload: null
        }
    },
    foundPayloads = {
        read: [
            { attrId: 0x0000 },
            { attrId: 0x0001 },
            { attrId: 0x0008 },
            { attrId: 0x0010 }
        ],
        write: [
            { attrId: 0x0000, dataType: 32, attrData: 20 },
            { attrId: 0x0001, dataType: 48, attrData: 50 },
            { attrId: 0x0008, dataType: 32, attrData: 60 },
            { attrId: 0x0010, dataType: 32, attrData: 60 }
        ],
        writeUndiv: [
            { attrId: 0x0000, dataType: 32, attrData: 20 },
            { attrId: 0x0001, dataType: 48, attrData: 50 },
            { attrId: 0x0008, dataType: 32, attrData: 60 },
            { attrId: 0x0010, dataType: 32, attrData: 60 }
        ],
        writeNoRsp: [
            { attrId: 0x0000, dataType: 32, attrData: 20 },
            { attrId: 0x0001, dataType: 48, attrData: 50 },
            { attrId: 0x0008, dataType: 32, attrData: 60 },
            { attrId: 0x0010, dataType: 32, attrData: 60 }
        ],
        configReport: [
            { direction: 0, attrId: 0x0000, dataType: 32, minRepIntval: 1, maxRepIntval: 3, repChange: 15 },
            { direction: 0, attrId: 0x0001, dataType: 32, minRepIntval: 2, maxRepIntval: 5, repChange: 10 },
            { direction: 1, attrId: 0x0001, timeout: 999 },
            { direction: 1, attrId: 0x0010, timeout: 999 }
        ],
        configReport2: [
            { direction: 0, attrId: 0x0001, dataType: 32, minRepIntval: 10, maxRepIntval: 50, repChange: 5 },
        ],
        readReportConfig: [
            { direction: 0, attrId: 0x0000 },
            { direction: 0, attrId: 0x0001 },
            { direction: 1, attrId: 0x0001 },
            { direction: 0, attrId: 0x0008 },
            { direction: 0, attrId: 0x0010 }
        ],
        discover: {
            startAttrId: 0x0000,
            maxAttrIds: 10
        }
    },
    funcPayloads = {
        moveToHue: {
            movemode: 20,
            rate: 50
        },
        stepHue: {
            stepmode: 1,
            stepsize: 30,
            transtime: 200,
        },
        stepColor: {
            stepx: 60,
            stepy: 80,
            transtime: 100
        }
    };

var dstAddr = afMsg.srcaddr,
    dstEpId = afMsg.srcendpoint,
    cId = afMsg.clusterid,
    cfg = {
        manufSpec: afMsg.zclMsg.frameCntl.manufSpec,
        direction: 1,
        disDefaultRsp: afMsg.zclMsg.frameCntl.disDefaultRsp,
        seqNum: afMsg.zclMsg.seqNum
    };

describe('Module Method Check', function() {
    describe('#.foundationHandler', function () {
        afMsg.zclMsg.frameCntl.frameType = 0;

        it('foundation cmd - read', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {}),
                readRspPayloads = [
                    { status: 0, attrId: 0x0000, dataType: 32, attrData: 10 },
                    { status: 0, attrId: 0x0001, dataType: 32, attrData: 20 }, 
                    { status: 0, attrId: 0x0008, dataType: 48, attrData: 30 },
                    { status: 134, attrId: 0x0010 }
                ];

            afMsg.zclMsg.cmdId = zclId.foundation('read').value;
            afMsg.zclMsg.payload = foundPayloads.read;

            zive.foundationHandler(afMsg);
            setTimeout(function () {
                var foundArgs = [ dstAddr, dstEpId, cId, 'readRsp', readRspPayloads, cfg ];

                if (foundationStub.calledOnce &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('foundation cmd - write', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {}),
                writeRspPayloads = [
                    { status: 0, attrId: 0x0000 },
                    { status: 135, attrId: 0x0001 },
                    { status: 135, attrId: 0x0008 },
                    { status: 134, attrId: 0x0010 }
                ];

            afMsg.zclMsg.cmdId = zclId.foundation('write').value;
            afMsg.zclMsg.payload = foundPayloads.write;

            zive.foundationHandler(afMsg);
            setTimeout(function () {
                var foundArgs = [ dstAddr, dstEpId, cId, 'writeRsp', writeRspPayloads, cfg ];

                foundationStub.firstCall.args[4].sort(function (x, y) {
                    return x.attrId > y.attrId;
                });

                if (foundationStub.calledOnce &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('foundation cmd - writeUndiv', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {}),
                writeRspPayloads = [
                    { status: 0, attrId: 0x0000 },
                    { status: 135, attrId: 0x0001 }, 
                    { status: 135, attrId: 0x0008 },
                    { status: 134, attrId: 0x0010 }
                ];

            afMsg.zclMsg.cmdId = zclId.foundation('writeUndiv').value;
            afMsg.zclMsg.payload = foundPayloads.writeUndiv;

            zive.foundationHandler(afMsg);
            setTimeout(function () {
                var foundArgs = [ dstAddr, dstEpId, cId, 'writeRsp', writeRspPayloads, cfg ];

                foundationStub.firstCall.args[4].sort(function (x, y) {
                    return x.attrId > y.attrId;
                });

                if (foundationStub.calledOnce &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('foundation cmd - writeNoRsp', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {});

            afMsg.zclMsg.cmdId = zclId.foundation('writeNoRsp').value;
            afMsg.zclMsg.payload = foundPayloads.writeNoRsp;

            zive.foundationHandler(afMsg);
            setTimeout(function () {
                if (!foundationStub.calledOnce) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        this.timeout(3000);
        it('foundation cmd - configReport', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {}),
                configReportRspPayloads = [
                    { status: 0, attrId: 0x0000, direction: 0 },
                    { status: 0, attrId: 0x0001, direction: 0 }, 
                    { status: 0, attrId: 0x0001, direction: 1 },
                    { status: 134, attrId: 0x0010, direction: 1 }
                ];

            afMsg.zclMsg.cmdId = zclId.foundation('configReport').value;
            afMsg.zclMsg.payload = foundPayloads.configReport;

            zive.foundationHandler(afMsg);
            setTimeout(function () {
                var foundArgs = [ dstAddr, dstEpId, cId, 'configReportRsp', configReportRspPayloads, cfg ],
                    attr1RptCfg = ziee.get(cId, 'rptCfgs', 0x0000),
                    attr1Rpt = { attrId: 0x0000, dataType: 32, attrData: 20 },
                    attr1RptArgs = [ dstAddr, dstEpId, cId, 'report', attr1Rpt, { manufSpec: 0, direction: 1, disDefaultRsp: 1 } ],
                    attr2RptCfg = ziee.get(cId, 'rptCfgs', 0x0001),
                    attr2Rpt = { attrId: 0x0001, dataType: 32, attrData: 20 },
                    attr2RptArgs = [ dstAddr, dstEpId, cId, 'report', attr2Rpt, { manufSpec: 0, direction: 1, disDefaultRsp: 1 } ],
                    attr1RptCfgResult = {
                        pmin: 1,
                        pmax: 3,
                        step: 15,
                        lastRpVal: 20
                    },
                    attr2RptCfgResult = {
                        pmin: 2,
                        pmax: 5,
                        step: 10,
                        timeout: 999,
                        lastRpVal: 20
                    };

                attr1RptCfg = { pmin: attr1RptCfg.pmin, pmax: attr1RptCfg.pmax, step: attr1RptCfg.step, lastRpVal: attr1RptCfg.lastRpVal };
                attr2RptCfg = { pmin: attr2RptCfg.pmin, pmax: attr2RptCfg.pmax, step: attr2RptCfg.step, lastRpVal: attr2RptCfg.lastRpVal, timeout: attr2RptCfg.timeout };

                foundationStub.firstCall.args[4].sort(function (x, y) {
                    return x.attrId > y.attrId;
                });

                if (_.isEqual(attr1RptCfg, attr1RptCfgResult) &&
                    _.isEqual(attr2RptCfg, attr2RptCfgResult) &&
                    foundationStub.callCount === 3 &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs) &&
                    _.isEqual(foundationStub.secondCall.args, attr1RptArgs) &&
                    _.isEqual(foundationStub.thirdCall.args, attr2RptArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 2500);
        });

        it('foundation cmd - configReport again', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {}),
                configReportRspPayloads = [ { status: 0, attrId: 0x0001, direction: 0 } ];

            afMsg.zclMsg.cmdId = zclId.foundation('configReport').value;
            afMsg.zclMsg.payload = foundPayloads.configReport2;

            zive.foundationHandler(afMsg);
            setTimeout(function () {
                var foundArgs = [ dstAddr, dstEpId, cId, 'configReportRsp', configReportRspPayloads, cfg ],
                    attrRptCfg = ziee.get(cId, 'rptCfgs', 0x0001),
                    attrRptCfgResult = {
                        pmin: 10,
                        pmax: 50,
                        step: 5,
                        timeout: 999,
                        lastRpVal: 20
                    };

                attrRptCfg = { pmin: attrRptCfg.pmin, pmax: attrRptCfg.pmax, step: attrRptCfg.step, lastRpVal: attrRptCfg.lastRpVal, timeout: attrRptCfg.timeout };

                foundationStub.firstCall.args[4].sort(function (x, y) {
                    return x.attrId > y.attrId;
                });

                if (_.isEqual(attrRptCfg, attrRptCfgResult) &&
                    foundationStub.callCount === 1 &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('foundation cmd - configReport, step report', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {});

            afMsg.zclMsg.cmdId = zclId.foundation('write').value;
            afMsg.zclMsg.payload = [ { attrId: 0x0000, dataType: 32, attrData: 50 } ];

            zive.foundationHandler(afMsg);

            setTimeout(function () {
                var attrRpt = { attrId: 0x0000, dataType: 32, attrData: 50 },
                    attrRptArgs = [ dstAddr, dstEpId, cId, 'report', attrRpt, { manufSpec: 0, direction: 1, disDefaultRsp: 1 } ],
                    attrRptCfg = ziee.get(cId, 'rptCfgs', 0x0000),
                    attrRptCfgResult = {
                        pmin: 1,
                        pmax: 3,
                        step: 15,
                        lastRpVal: 50
                    };

                attrRptCfg = { pmin: attrRptCfg.pmin, pmax: attrRptCfg.pmax, step: attrRptCfg.step, lastRpVal: attrRptCfg.lastRpVal };

                if (_.isEqual(attrRptCfg, attrRptCfgResult) &&
                    _.isEqual(foundationStub.firstCall.args, attrRptArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('foundation cmd - readReportConfig', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {}),
                readReportConfigRspPayloads = [
                    { status: 0, attrId: 0x0000, direction: 0, dataType: 32, minRepIntval: 1, maxRepIntval: 3, repChange: 15 },
                    { status: 0, attrId: 0x0001, direction: 0, dataType: 32, minRepIntval: 10, maxRepIntval: 50, repChange: 5 },
                    { status: 0, attrId: 0x0001, direction: 1, timeout: 999 },
                    { status: 140, attrId: 0x0008, direction: 0 },
                    { status: 134, attrId: 0x0010, direction: 0 }
                ];

            afMsg.zclMsg.cmdId = zclId.foundation('readReportConfig').value;
            afMsg.zclMsg.payload = foundPayloads.readReportConfig;

            zive.foundationHandler(afMsg);
            setTimeout(function () {
                var foundArgs = [ dstAddr, dstEpId, cId, 'readReportConfigRsp', readReportConfigRspPayloads, cfg ];

                foundationStub.firstCall.args[4].sort(function (x, y) {
                    return x.attrId > y.attrId;
                });

                if (foundationStub.calledOnce &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('foundation cmd - discover', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {}),
                discoverRspPayloads = {
                    discComplete: 1,
                    attrInfos: [
                        { attrId: 0, dataType: 32 },
                        { attrId: 1, dataType: 32 },
                        { attrId: 8, dataType: 48 }
                    ]
                };

            afMsg.zclMsg.cmdId = zclId.foundation('discover').value;
            afMsg.zclMsg.payload = foundPayloads.discover;

            zive.foundationHandler(afMsg);
            setTimeout(function () {
                var foundArgs = [ dstAddr, dstEpId, cId, 'discoverRsp', discoverRspPayloads, cfg ];

                if (foundationStub.calledOnce &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });
    });

    describe('#.functionalHandler', function () {
        afMsg.zclMsg.frameCntl.frameType = 1;

        it('unsupport cmd', function (done) {
            var foundationStub = sinon.stub(zive, 'foundation', function () {});

            afMsg.zclMsg.cmdId = zclId.functional('lightingColorCtrl', 'moveToSaturation').value;
            afMsg.zclMsg.payload = {};

            zive.functionalHandler(afMsg);

            setTimeout(function () {
                var defaultRspPayload = {
                        cmdId: zclId.functional('lightingColorCtrl', 'moveToSaturation').value,
                        statusCode: 129
                    },
                    foundArgs = [ dstAddr, dstEpId, cId, 'defaultRsp', defaultRspPayload, cfg ];

                if (foundationStub.calledOnce &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('execution failed', function (done) {
            var cmdObj = ziee.get(cId, 'cmds', 'moveToHue'),
                argObj = { a: 'xxx' },
                moveToHueStub = sinon.stub(cmdObj, 'exec', function (zapp, argObj, callback) {
                    callback(new Error(''));
                }),
                foundationStub = sinon.stub(zive, 'foundation', function () {});

            afMsg.zclMsg.cmdId = zclId.functional('lightingColorCtrl', 'moveToHue').value;
            afMsg.zclMsg.payload = argObj;

            zive.functionalHandler(afMsg);

            setTimeout(function () {
                var defaultRspPayload = {
                        cmdId: zclId.functional('lightingColorCtrl', 'moveToHue').value,
                        statusCode: 1
                    },
                    foundArgs = [ dstAddr, dstEpId, cId, 'defaultRsp', defaultRspPayload, cfg ];

                if (moveToHueStub.calledOnce &&
                    foundationStub.calledOnce &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    moveToHueStub.restore();
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('has response command but not return data (disDefaultRsp equal to 1)', function (done) {
            var cmdObj = ziee.get('genGroups', 'cmds', 'add'),
                argObj = { groupid: 1, groupname: 'xxx' },
                addStub = sinon.stub(cmdObj, 'exec', function (zapp, argObj, callback) {
                    callback(null);
                }),
                foundationStub = sinon.stub(zive, 'foundation', function () {});

            afMsg.clusterid = zclId.cluster('genGroups').value;
            afMsg.zclMsg.cmdId = zclId.functional('genGroups', 'add').value;
            afMsg.zclMsg.payload = argObj;

            zive.functionalHandler(afMsg);

            setTimeout(function () {
                if (addStub.calledOnce &&
                    foundationStub.callCount === 0) {
                    addStub.restore();
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('has response command but not return data (disDefaultRsp equal to 0)', function (done) {
            var cmdObj = ziee.get('genGroups', 'cmds', 'add'),
                argObj = { groupid: 1, groupname: 'xxx' },
                addStub = sinon.stub(cmdObj, 'exec', function (zapp, argObj, callback) {
                    callback(null);
                }),
                foundationStub = sinon.stub(zive, 'foundation', function () {});

            afMsg.clusterid = zclId.cluster('genGroups').value;
            afMsg.zclMsg.frameCntl.disDefaultRsp = 0;
            afMsg.zclMsg.cmdId = zclId.functional('genGroups', 'add').value;
            afMsg.zclMsg.payload = argObj;

            cfg.disDefaultRsp = 0;

            zive.functionalHandler(afMsg);

            setTimeout(function () {
                var defaultRspPayload = {
                        cmdId: zclId.functional('genGroups', 'add').value,
                        statusCode: 0
                    },
                    foundArgs = [ dstAddr, dstEpId, zclId.cluster('genGroups').value, 'defaultRsp', defaultRspPayload, cfg ];

                if (addStub.calledOnce &&
                    foundationStub.calledOnce &&
                    _.isEqual(foundationStub.firstCall.args, foundArgs)) {
                    addStub.restore();
                    foundationStub.restore();
                    done();
                }
            }, 50);
        });

        it('has response command and return data', function (done) {
            var cmdObj = ziee.get('genGroups', 'cmds', 'add'),
                argObj = { groupid: 1, groupname: 'xxx' },
                addStub = sinon.stub(cmdObj, 'exec', function (zapp, argObj, callback) {
                    callback(null, { status: 0, groupid: 1 });
                }),
                functionalStub = sinon.stub(zive, 'functional', function () {});

            afMsg.clusterid = zclId.cluster('genGroups').value;
            afMsg.zclMsg.cmdId = zclId.functional('genGroups', 'add').value;
            afMsg.zclMsg.payload = argObj;

            zive.functionalHandler(afMsg);

            setTimeout(function () {
                var addRspPayload = { status: 0, groupid: 1 },
                    funcArgs = [ dstAddr, dstEpId, zclId.cluster('genGroups').value, 'addRsp', addRspPayload, cfg ];

                if (addStub.calledOnce &&
                    functionalStub.calledOnce &&
                    _.isEqual(functionalStub.firstCall.args, funcArgs)) {
                    addStub.restore();
                    functionalStub.restore();
                    done();
                }
            }, 50);
        });
    });
});
