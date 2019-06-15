/* jshint node: true */
'use strict';

var _ = require('busyman');

function Endpoint(device, simpleDesc) { 
    // simpleDesc = { profId, epId, devId, inClusterList, outClusterList }

    this.isLocal = function () {
        return false;    // this is a remote endpoint, always return false
    };

    this.device = device;                               // bind to device
    this.profId = simpleDesc.profId;
    this.epId = simpleDesc.epId;
    this.devId = simpleDesc.devId;
    this.inClusterList = simpleDesc.inClusterList;      // numbered cluster ids
    this.outClusterList = simpleDesc.outClusterList;    // numbered cluster ids

    this.clusters = null;    // instance of ziee

    // this.clusters.dumpSync()
    // {
    //     genBasic: {
    //         dir: { value: 1 },  // 0: 'unknown', 1: 'in', 2: 'out', 3: 'in' and 'out'
    //         attrs: {
    //             hwVersion: 0,
    //             zclVersion: 1
    //         }
    //     }
    // }

    this.onAfDataConfirm = null;
    this.onAfReflectError = null;
    this.onAfIncomingMsg = null;
    this.onAfIncomingMsgExt = null;
    this.onZclFoundation = null;
    this.onZclFunctional = null;
}

/*************************************************************************************************/
/*** Public Methods                                                                            ***/
/*************************************************************************************************/
Endpoint.prototype.getSimpleDesc = function () {
    return {
        profId: this.profId,
        epId: this.epId,
        devId: this.devId,
        inClusterList: _.cloneDeep(this.inClusterList),
        outClusterList: _.cloneDeep(this.outClusterList),
    };
};

Endpoint.prototype.getIeeeAddr = function () {
    return this.getDevice().getIeeeAddr();
};

Endpoint.prototype.getNwkAddr = function () {
    return this.getDevice().getNwkAddr();
};

Endpoint.prototype.dump = function () {
    var dumped = this.getSimpleDesc();

    dumped.clusters = this.clusters.dumpSync();

    return dumped;
};

// zcl and binding methods will be attached in shepherd
// endpoint.foundation = function (cId, cmd, zclData[, cfg], callback) {};
// endpoint.functional = function (cId, cmd, zclData[, cfg], callback) {};
// endpoint.read = function (cId, attrId, callback) {};
// endpoint.bind = function (cId, dstEpOrGrpId[, callback]) {};
// endpoint.unbind = function (cId, dstEpOrGrpId[, callback]) {};

/*************************************************************************************************/
/*** Protected Methods                                                                         ***/
/*************************************************************************************************/
Endpoint.prototype.isZclSupported = function () {
    var zclSupport = false;

    if (this.profId < 0x8000 && this.devId < 0xc000)
        zclSupport = true;

    this.isZclSupported = function () {
        return zclSupport;
    };

    return zclSupport;
};

Endpoint.prototype.getDevice = function () {
    return this.device;
};

Endpoint.prototype.getProfId = function () {
    return this.profId;
};

Endpoint.prototype.getEpId = function () {
    return this.epId;
};

Endpoint.prototype.getDevId = function () {
    return this.devId;
};

Endpoint.prototype.getInClusterList = function () {
    return _.cloneDeep(this.inClusterList);
};

Endpoint.prototype.getOutClusterList = function () {
    return _.cloneDeep(this.outClusterList);
};

Endpoint.prototype.getClusterList = function () {
    var clusterList = this.getInClusterList();

    this.getOutClusterList().forEach(function (cId) {
        if (!_.includes(clusterList, cId)) 
            clusterList.push(cId);
    });

    return clusterList.sort(function (a, b) { return a - b; });
};

Endpoint.prototype.getClusters = function () {
    return this.clusters;
};

Endpoint.prototype.getManufId = function () {
    return this.getDevice().getManufId();
};

Endpoint.prototype.update = function (simpleDesc) {
    var self = this,
        descKeys = [ 'profId', 'epId', 'devId','inClusterList', 'outClusterList' ];

    _.forEach(simpleDesc, function (val, key) {
        if (_.includes(descKeys, key))
            self[key] = val;
    });
};

module.exports = Endpoint;
