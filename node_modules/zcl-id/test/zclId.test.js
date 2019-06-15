var fs = require('fs'),
    expect = require('chai').expect,
    zclId = require('../index');

var clusterDefs = JSON.parse(fs.readFileSync(__dirname + '/../definitions/cluster_defs.json'));

var profIdKeys = [],
    profIdVals = [],
    cIdKeys = [],
    cIdVals = [],
    foundKeys = [],
    foundVals = [],
    dataTypeKeys = [],
    dataTypeVals = [],
    statusKeys = [],
    statusVals = [],
    devIdKeys = {
        HA: []
    },
    devIdVals = {
        HA: []
    },
    k;

for (k in zclId._common.profileId) {
    profIdKeys.push(k);
    profIdVals.push(zclId._common.profileId[k]);
}

for (k in zclId._common.clusterId) {
    cIdKeys.push(k);
    cIdVals.push(zclId._common.clusterId[k]);
}

for (k in zclId._common.foundation) {
    foundKeys.push(k);
    foundVals.push(zclId._common.foundation[k]);
}

for (k in zclId._common.dataType) {
    dataTypeKeys.push(k);
    dataTypeVals.push(zclId._common.dataType[k]);
}

for (k in zclId._common.status) {
    statusKeys.push(k);
    statusVals.push(zclId._common.status[k]);
}

for (k in zclId._common.haDevId) {
    devIdKeys.HA.push(k);
    devIdVals.HA.push(zclId._common.haDevId[k]);
}

describe('Module Methods Check', function() {
    describe('#.profile', function() {
        it('should get right item by profId string', function () {
            profIdKeys.forEach(function (pkey) {
                var hitA = zclId.profile(pkey),
                    hitB = zclId.profileId.get(pkey);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get right item by profId number', function () {
            profIdVals.forEach(function (pval) {
                var hitA = zclId.profile(pval),
                    hitB = zclId.profileId.get(pval);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get undefined if profId not found', function () {
            expect(zclId.profile('xxx')).to.be.undefined;
            expect(zclId.profile(12345)).to.be.undefined;
        });
    });

    describe('#.device', function() {
        it('should get right item by profId string and devId string', function () {
            profIdKeys.forEach(function (pkey) {
                if (!devIdKeys[pkey]) return;

                devIdKeys[pkey].forEach(function (dkey) {
                    var hitA = zclId.device(pkey, dkey),
                        hitB = zclId.deviceId[pkey].get(dkey);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by profId string and devId number', function () {
            profIdKeys.forEach(function (pkey) {
                if (!devIdKeys[pkey]) return;

                devIdVals[pkey].forEach(function (dval) {
                    var hitA = zclId.device(pkey, dval),
                        hitB = zclId.deviceId[pkey].get(dval);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by profId number and devId string', function () {
            profIdVals.forEach(function (pval) {
                var profId = zclId.profile(pval);

                if (!devIdKeys[profId.key]) return;

                devIdKeys[profId.key].forEach(function (dkey) {
                    var hitA = zclId.device(pval, dkey),
                        hitB = zclId.deviceId[profId.key].get(dkey);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by profId number and devId number', function () {
            profIdVals.forEach(function (pval) {
                var profId = zclId.profile(pval);

                if (!devIdKeys[profId.key]) return;

                devIdVals[profId.key].forEach(function (dval) {
                    var hitA = zclId.device(pval, dval),
                        hitB = zclId.deviceId[profId.key].get(dval);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get undefined if target not found', function () {
            expect(zclId.device('HA', 'dddd')).to.be.undefined;
            expect(zclId.device('HA', 12345)).to.be.undefined;
            expect(zclId.device(3, 'dddd')).to.be.undefined;
            expect(zclId.device(3, 12345)).to.be.undefined;
        });

        it('should get an item if target is found', function () {
            expect(zclId.device('HA', 'doorLock')).not.to.be.undefined;
            expect(zclId.device('HA', 4)).not.to.be.undefined;
            expect(zclId.device(260, 'doorLock')).not.to.be.undefined;
            expect(zclId.device(260, 4)).not.to.be.undefined;
        });
    });

    describe('#.cluster', function() {
        it('should get right item by cId string', function () {
            cIdKeys.forEach(function (ckey) {
                var hitA = zclId.cluster(ckey),
                    hitB = zclId.clusterId.get(ckey);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get right item by cId number', function () {
            cIdVals.forEach(function (cval) {
                var hitA = zclId.cluster(cval),
                    hitB = zclId.clusterId.get(cval);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get undefined if cId not found', function () {
            expect(zclId.cluster('xxx')).to.be.undefined;
            expect(zclId.cluster(12345)).to.be.undefined;
        });
    });

    describe('#.foundation', function() {
        it('should get right item by cmdId string', function () {
            foundKeys.forEach(function (fkey) {
                var hitA = zclId.foundation(fkey),
                    hitB = zclId.foundationId.get(fkey);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get right item by cmdId number', function () {
            foundVals.forEach(function (fval) {
                var hitA = zclId.foundation(fval),
                    hitB = zclId.foundationId.get(fval);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get undefined if cmdId not found', function () {
            expect(zclId.foundation('xxx')).to.be.undefined;
            expect(zclId.foundation(12345)).to.be.undefined;
        });
    });

    describe('#.functional', function() {
        it('should get right item by cId string and cmdId string', function () {
            cIdKeys.forEach(function (ckey) {
                if (!clusterDefs[ckey]) return;

                var cmdIdKeys = [];

                for (k in clusterDefs[ckey].cmd) {
                    cmdIdKeys.push(k);
                }

                cmdIdKeys.forEach(function (cmdkey) {
                    var hitA = zclId.functional(ckey, cmdkey),
                        hitB = zclId[ckey].cmd.get(cmdkey);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId string and cmdId number', function () {
            cIdKeys.forEach(function (ckey) {
                if (!clusterDefs[ckey]) return;

                var cmdIdVals = [];

                for (k in clusterDefs[ckey].cmd) {
                    cmdIdVals.push(clusterDefs[ckey].cmd[k]);
                }

                cmdIdVals.forEach(function (cmdval) {
                    var hitA = zclId.functional(ckey, cmdval),
                        hitB = zclId[ckey].cmd.get(cmdval);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId number and cmdId string', function () {
            cIdVals.forEach(function (cval) {
                var cId = zclId.cluster(cval);

                if (!clusterDefs[cId.key]) return;

                var cmdIdKeys = [];

                for (k in clusterDefs[cId.key].cmd) {
                    cmdIdKeys.push(k);
                }

                cmdIdKeys.forEach(function (cmdkey) {
                    var hitA = zclId.functional(cval, cmdkey),
                        hitB = zclId[cId.key].cmd.get(cmdkey);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId number and cmdId number', function () {
            cIdVals.forEach(function (cval) {
                var cId = zclId.cluster(cval);

                if (!clusterDefs[cId.key]) return;

                var cmdIdVals = [];

                for (k in clusterDefs[cId.key].cmd) {
                    cmdIdVals.push(clusterDefs[cId.key].cmd[k]);
                }

                cmdIdVals.forEach(function (cmdval) {
                    var hitA = zclId.functional(cval, cmdval),
                        hitB = zclId[cId.key].cmd.get(cmdval);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get undefined if target not found', function () {
            expect(zclId.functional('genOnOff', 'dddd')).to.be.undefined;
            expect(zclId.functional('genOnOff', 12345)).to.be.undefined;
            expect(zclId.functional(3, 'dddd')).to.be.undefined;
            expect(zclId.functional(3, 12345)).to.be.undefined;
        });

        it('should get an item if target is found', function () {
            expect(zclId.functional('genOnOff', 'toggle')).not.to.be.undefined;
            expect(zclId.functional('genOnOff', 2)).not.to.be.undefined;
            expect(zclId.functional(6, 'toggle')).not.to.be.undefined;
            expect(zclId.functional(6, 2)).not.to.be.undefined;
        });
    });

    describe('#.getCmdRsp', function() {
        it('should get right item by cId string and cmdId string', function () {
            cIdKeys.forEach(function (ckey) {
                if (!clusterDefs[ckey]) return;

                var cmdIdKeys = [];

                for (k in clusterDefs[ckey].cmdRsp) {
                    cmdIdKeys.push(k);
                }

                cmdIdKeys.forEach(function (cmdkey) {
                    var hitA = zclId.getCmdRsp(ckey, cmdkey),
                        hitB = zclId[ckey].cmdRsp.get(cmdkey);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId string and cmdId number', function () {
            cIdKeys.forEach(function (ckey) {
                if (!clusterDefs[ckey]) return;

                var cmdIdVals = [];

                for (k in clusterDefs[ckey].cmdRsp) {
                    cmdIdVals.push(clusterDefs[ckey].cmdRsp[k]);
                }

                cmdIdVals.forEach(function (cmdval) {
                    var hitA = zclId.getCmdRsp(ckey, cmdval),
                        hitB = zclId[ckey].cmdRsp.get(cmdval);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId number and cmdId string', function () {
            cIdVals.forEach(function (cval) {
                var cId = zclId.cluster(cval);

                if (!clusterDefs[cId.key]) return;

                var cmdIdKeys = [];

                for (k in clusterDefs[cId.key].cmdRsp) {
                    cmdIdKeys.push(k);
                }

                cmdIdKeys.forEach(function (cmdkey) {
                    var hitA = zclId.getCmdRsp(cval, cmdkey),
                        hitB = zclId[cId.key].cmdRsp.get(cmdkey);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId number and cmdId number', function () {
            cIdVals.forEach(function (cval) {
                var cId = zclId.cluster(cval);

                if (!clusterDefs[cId.key]) return;

                var cmdIdVals = [];

                for (k in clusterDefs[cId.key].cmdRsp) {
                    cmdIdVals.push(clusterDefs[cId.key].cmdRsp[k]);
                }

                cmdIdVals.forEach(function (cmdval) {
                    var hitA = zclId.getCmdRsp(cval, cmdval),
                        hitB = zclId[cId.key].cmdRsp.get(cmdval);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get undefined if target not found', function () {
            expect(zclId.getCmdRsp('ssIasZone', 'dddd')).to.be.undefined;
            expect(zclId.getCmdRsp('ssIasZone', 12345)).to.be.undefined;
            expect(zclId.getCmdRsp(1280, 'dddd')).to.be.undefined;
            expect(zclId.getCmdRsp(1280, 12345)).to.be.undefined;
        });

        it('should get an item if target is found', function () {
            expect(zclId.getCmdRsp('ssIasZone', 'enrollReq')).not.to.be.undefined;
            expect(zclId.getCmdRsp('ssIasZone', 1)).not.to.be.undefined;
            expect(zclId.getCmdRsp(1280, 'enrollReq')).not.to.be.undefined;
            expect(zclId.getCmdRsp(1280, 1)).not.to.be.undefined;
        });
    });

    describe('#.attr', function() {
        it('should get right item by cId string and attrId string', function () {
            cIdKeys.forEach(function (ckey) {
                if (!clusterDefs[ckey]) return;

                var attrIdKeys = [];

                for (k in clusterDefs[ckey].attrId) {
                    attrIdKeys.push(k);
                }

                attrIdKeys.forEach(function (akey) {
                    var hitA = zclId.attr(ckey, akey),
                        hitB = zclId[ckey].attr.get(akey);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId string and attrId number', function () {
            cIdKeys.forEach(function (ckey) {
                if (!clusterDefs[ckey]) return;

                var attrIdVals = [];

                for (k in clusterDefs[ckey].attrId) {
                    attrIdVals.push(clusterDefs[ckey].attrId[k].id);
                }

                attrIdVals.forEach(function (aval) {
                    var hitA = zclId.attr(ckey, aval),
                        hitB = zclId[ckey].attr.get(aval);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId number and attrId string', function () {
            cIdVals.forEach(function (cval) {
                var cId = zclId.cluster(cval);

                if (!clusterDefs[cId.key]) return;

                var attrIdKeys = [];

                for (k in clusterDefs[cId.key].attrId) {
                    attrIdKeys.push(k);
                }

                attrIdKeys.forEach(function (akey) {
                    var hitA = zclId.attr(cval, akey),
                        hitB = zclId[cId.key].attr.get(akey);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId number and attrId number', function () {
            cIdVals.forEach(function (cval) {
                var cId = zclId.cluster(cval);

                if (!clusterDefs[cId.key]) return;

                var attrIdVals = [];

                for (k in clusterDefs[cId.key].attrId) {
                    attrIdVals.push(clusterDefs[cId.key].attrId[k].id);
                }

                attrIdVals.forEach(function (aval) {
                    var hitA = zclId.attr(cval, aval),
                        hitB = zclId[cId.key].attr.get(aval);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get undefined if target not found', function () {
            expect(zclId.attr('genBasic', 'dddd')).to.be.undefined;
            expect(zclId.attr('genBasic', 12345)).to.be.undefined;
            expect(zclId.attr(3, 'dddd')).to.be.undefined;
            expect(zclId.attr(3, 12345)).to.be.undefined;
        });

        it('should get an item if target is found', function () {
            expect(zclId.attr('genBasic', 'zclVersion')).not.to.be.undefined;
            expect(zclId.attr('genBasic', 0)).not.to.be.undefined;
            expect(zclId.attr(0, 'zclVersion')).not.to.be.undefined;
            expect(zclId.attr(0, 0)).not.to.be.undefined;
        });
    });

    describe('#.attrType', function() {
        it('should get right item by cId string and attrId string', function () {
            cIdKeys.forEach(function (ckey) {
                if (!clusterDefs[ckey]) return;

                var attrIdKeys = [];

                for (k in clusterDefs[ckey].attrId) {
                    attrIdKeys.push(k);
                }

                attrIdKeys.forEach(function (akey) {
                    var dataType = zclId[ckey].attrType.get(akey),
                        hitA = zclId.attrType(ckey, akey),
                        hitB = zclId.dataType(dataType.value);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId string and attrId number', function () {
            cIdKeys.forEach(function (ckey) {
                if (!clusterDefs[ckey]) return;

                var attrIdVals = [];

                for (k in clusterDefs[ckey].attrId) {
                    attrIdVals.push(clusterDefs[ckey].attrId[k].id);
                }

                attrIdVals.forEach(function (aval) {
                    var attrId = zclId.attr(ckey, aval),
                        dataType = zclId[ckey].attrType.get(attrId.key),
                        hitA = zclId.attrType(ckey, aval),
                        hitB = zclId.dataType(dataType.value);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId number and attrId string', function () {
            cIdVals.forEach(function (cval) {
                var cId = zclId.cluster(cval);

                if (!clusterDefs[cId.key]) return;

                var attrIdKeys = [];

                for (k in clusterDefs[cId.key].attrId) {
                    attrIdKeys.push(k);
                }

                attrIdKeys.forEach(function (akey) {
                    var dataType = zclId[cId.key].attrType.get(akey),
                        hitA = zclId.attrType(cval, akey),
                        hitB = zclId.dataType(dataType.value);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get right item by cId number and attrId number', function () {
            cIdVals.forEach(function (cval) {
                var cId = zclId.cluster(cval);

                if (!clusterDefs[cId.key]) return;

                var attrIdVals = [];

                for (k in clusterDefs[cId.key].attrId) {
                    attrIdVals.push(clusterDefs[cId.key].attrId[k].id);
                }

                attrIdVals.forEach(function (aval) {
                    var attrId = zclId.attr(cval, aval),
                        dataType = zclId[cId.key].attrType.get(attrId.key),
                        hitA = zclId.attrType(cval, aval),
                        hitB = zclId.dataType(dataType.value);

                    expect(hitA).not.to.be.undefined;
                    expect(hitA.key).to.be.eql(hitB.key);
                    expect(hitA.value).to.be.eql(hitB.value);
                });
            });
        });

        it('should get undefined if target not found', function () {
            expect(zclId.attrType('genBasic', 'dddd')).to.be.undefined;
            expect(zclId.attrType('genBasic', 12345)).to.be.undefined;
            expect(zclId.attrType(3, 'dddd')).to.be.undefined;
            expect(zclId.attrType(3, 12345)).to.be.undefined;
        });

        it('should get an item if target is found', function () {
            expect(zclId.attr('genBasic', 'zclVersion')).not.to.be.undefined;
            expect(zclId.attr('genBasic', 0)).not.to.be.undefined;
            expect(zclId.attr(0, 'zclVersion')).not.to.be.undefined;
            expect(zclId.attr(0, 0)).not.to.be.undefined;
        });
    });

    describe('#.dataType', function() {
        it('should get right item by type string', function () {
            dataTypeKeys.forEach(function (dkey) {
                var hitA = zclId.dataType(dkey),
                    hitB = zclId.dataTypeId.get(dkey);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get right item by type number', function () {
            dataTypeVals.forEach(function (dval) {
                var hitA = zclId.dataType(dval),
                    hitB = zclId.dataTypeId.get(dval);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get undefined if type not found', function () {
            expect(zclId.dataType('xxx')).to.be.undefined;
            expect(zclId.dataType(12345)).to.be.undefined;
        });
    });

    describe('#.status', function () {
        it('should get right item by type string', function () {
            statusKeys.forEach(function (dkey) {
                var hitA = zclId.status(dkey),
                    hitB = zclId.statusId.get(dkey);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get right item by type number', function () {
            statusVals.forEach(function (dval) {
                var hitA = zclId.status(dval),
                    hitB = zclId.statusId.get(dval);

                expect(hitA).not.to.be.undefined;
                expect(hitA.key).to.be.eql(hitB.key);
                expect(hitA.value).to.be.eql(hitB.value);
            });
        });

        it('should get undefined if type not found', function () {
            expect(zclId.status('xxx')).to.be.undefined;
            expect(zclId.status(12345)).to.be.undefined;
        });
    });
});
