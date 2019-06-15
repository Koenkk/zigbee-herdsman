/* jshint node: true */
'use strict';

var _ = require('busyman');

function Device(devInfo) {
    // devInfo = { type, ieeeAddr, nwkAddr, manufId, manufName, powerSource, modelId, epList }

    this._id = null;

    this.type = devInfo.type;
    this.ieeeAddr = devInfo.ieeeAddr;
    this.nwkAddr = devInfo.nwkAddr;
    this.manufId = devInfo.manufId;
    this.manufName = devInfo.manufName;
    this.powerSource = devInfo.powerSource;
    this.dateCode = devInfo.dateCode;
    this.modelId = devInfo.modelId;
    this.zclVersion = devInfo.zclVersion;
    this.appVersion = devInfo.appVersion;
    this.stackVersion = devInfo.stackVersion;
    this.hwVersion = devInfo.hwVersion;
    this.swBuildId = devInfo.swBuildId;
    this.epList = devInfo.epList;

    this.status = 'offline';    // 'online', 'offline'
    this.joinTime = null;
    this.endpoints = {};        // key is epId in number, { epId: epInst, epId: epInst, ... }
}

Device.prototype.dump = function () {
    var dumpOfEps = {};

    _.forEach(this.endpoints, function (ep, epId) {
        dumpOfEps[epId] = ep.dump();
    });

    return {
        id: this._id,
        type: this.type,
        ieeeAddr: this.ieeeAddr,
        nwkAddr: this.nwkAddr,
        manufId: this.manufId,
        manufName: this.manufName,
        powerSource: this.powerSource,
        modelId: this.modelId,
        epList: _.cloneDeep(this.epList),
        zclVersion: this.zclVersion,
        appVersion: this.appVersion,
        stackVersion: this.stackVersion,
        hwVersion: this.hwVersion,
        swBuildId: this.swBuildId,
        status: this.status,
        joinTime: this.joinTime,
        endpoints: dumpOfEps,
        dateCode: this.dateCode,
    };
};

Device.prototype.getEndpoint = function (epId) {
    return this.endpoints[epId];
};

Device.prototype.getIeeeAddr = function () {
    return this.ieeeAddr;
};

Device.prototype.getNwkAddr = function () {
    return this.nwkAddr;
};

Device.prototype.getManufId = function () {
    return this.manufId;
};

Device.prototype.update = function (info) {
    var self = this,
        infoKeys = [ 'type', 'ieeeAddr', 'nwkAddr','manufId', 'epList', 'zclVersion', 'appVersion', 'stackVersion', 'hwVersion', 'swBuildId', 'status', 'joinTime', 'manufName', 'modelId', 'powerSource', 'dateCode' ];

    _.forEach(info, function (val, key) {
        if (_.includes(infoKeys, key))
            self[key] = val;
    });
};

Device.prototype._recoverFromRecord = function (rec) {
    this._recovered = true;
    this.status = 'offline';
    this._setId(rec.id);

    return this;
};

Device.prototype._setId = function (id) {
    this._id = id;
};

Device.prototype._getId = function () {
    return this._id;
};

module.exports = Device;
