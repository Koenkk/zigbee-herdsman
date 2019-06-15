var _ = require('busyman'),
    Enum = require('enum');

var _common = require('./definitions/common.json'),
    _clusterDefs = require('./definitions/cluster_defs.json'),
    clusterWithNewFormat = require('./definitions/clusterWithNewFormat');

var zclId = {
    _common: _common,
    profileId: null,
    clusterId: null,
    foundation: null,
    dataType: null,
    deviceId: {
        HA: null
    }
};

/*************************************************************************************************/
/*** Loading Enumerations                                                                      ***/
/*************************************************************************************************/
zclId.profileId = new Enum(_common.profileId);
zclId.clusterId = new Enum(_common.clusterId);
zclId.foundationId = new Enum(_common.foundation);
zclId.dataTypeId = new Enum(_common.dataType);
zclId.statusId = new Enum(_common.status);
zclId.deviceId.HA = new Enum(_common.haDevId);

function isValidArgType(param) {
    var isValid = true;

    if (typeof param !== 'number' && typeof param !== 'string') {
        isValid = false;
    } else if (typeof param === 'number') {
        isValid = !isNaN(param);
    }

    return isValid;
}

/*************************************************************************************************/
/*** zclId Methods                                                                             ***/
/*************************************************************************************************/
zclId._getCluster = function (cluster) {
    if (zclId[cluster]) {
        return zclId[cluster];
    } else if (_clusterDefs[cluster]) {
        zclId[cluster] = clusterWithNewFormat(_clusterDefs[cluster]);
        _clusterDefs[cluster] = null;
        return zclId[cluster];
    }
    // return: {
    //     attr,
    //     attrType,
    //     cmd,
    //     cmdRsp
    // }
};

zclId.profile = function (profId) {
    // profId: String | Number
    if (!isValidArgType(profId))
        throw new TypeError('profId should be a number or a string.');

    var profNumber = parseInt(profId),
        profItem;

    if (!isNaN(profNumber))
        profId = profNumber;

    profItem = zclId.profileId.get(profId);

    if (profItem)
        return { key: profItem.key, value: profItem.value };    // { key: 'HA', value: 260 }
};

zclId.device = function (profId, devId) {
    // profId: String | Number, devId: String | Number
    if (!isValidArgType(profId))
        throw new TypeError('profId should be a number or a string.');

    if (!isValidArgType(devId))
        throw new TypeError('devId should be a number or a string.');

    var profNumber = parseInt(profId),
        devNumber = parseInt(devId),
        profItem,
        devItem;

    if (!isNaN(profNumber))
        profId = profNumber;

    if (!isNaN(devNumber))
        devId = devNumber;

    profItem = zclId.profileId.get(profId);

    if (profItem)
        devItem = zclId.deviceId[profItem.key].get(devId);

    if (devItem)
        return { key: devItem.key, value: devItem.value };      // { key: 'ON_OFF_SWITCH', value: 0 }
};

zclId.cluster = function (cId) {
    // cId: String | Number
    if (!isValidArgType(cId))
        throw new TypeError('cId should be a number or a string.');

    var cNumber = parseInt(cId),
        cItem;

    if (!isNaN(cNumber))
        cId = cNumber;

    cItem = zclId.clusterId.get(cId);

    if (cItem)
        return { key: cItem.key, value: cItem.value };          // { key: 'genBasic', value: 0 }
};

zclId.foundation = function (cmdId) {
    // cmdId: String | Number
    if (!isValidArgType(cmdId))
        throw new TypeError('cmdId should be a number or a string.');

    var cmdNumber = parseInt(cmdId),
        cmdItem;

    if (!isNaN(cmdNumber))
        cmdId = cmdNumber;

    cmdItem = zclId.foundationId.get(cmdId);

    if (cmdItem)
        return { key: cmdItem.key, value: cmdItem.value };      // { key: 'read', value: 0 }
};

zclId.functional = function (cId, cmdId) {
    // cId: String | Number, cmdId: String | Number
    if (!isValidArgType(cId))
        throw new TypeError('cId should be a number or a string.');

    if (!isValidArgType(cmdId))
        throw new TypeError('cmdId should be a number or a string.');

    var cNumber = parseInt(cId),
        cmdNumber = parseInt(cmdId),
        cItem,
        cmdItem,
        cInfo;

    if (!isNaN(cNumber))
        cId = cNumber;

    if (!isNaN(cmdNumber))
        cmdId = cmdNumber;

    cItem = zclId.clusterId.get(cId);

    if (cItem)
        cInfo = zclId._getCluster(cItem.key);

    if (cInfo && !_.isNil(cInfo.cmd))
        cmdItem = cInfo.cmd.get(cmdId);

    if (cmdItem)
        return { key: cmdItem.key, value: cmdItem.value };      // { key: 'view', value: 1 }
};

zclId.getCmdRsp = function (cId, rspId) {    // TODO
    // cId: String | Number, rspId: String | Number
    if (!isValidArgType(cId))
        throw new TypeError('cId should be a number or a string.');

    if (!isValidArgType(rspId))
        throw new TypeError('rspId should be a number or a string.');

    var cNumber = parseInt(cId),
        cmdNumber = parseInt(rspId),
        cItem,
        cmdItem,
        cInfo;

    if (!isNaN(cNumber))
        cId = cNumber;

    if (!isNaN(cmdNumber))
        rspId = cmdNumber;

    cItem = zclId.clusterId.get(cId);

    if (cItem)
        cInfo = zclId._getCluster(cItem.key);

    if (cInfo && !_.isNil(cInfo.cmdRsp))
        cmdItem = cInfo.cmdRsp.get(rspId);

    if (cmdItem)
        return { key: cmdItem.key, value: cmdItem.value };      // { key: 'viewRsp', value: 1 }
};

zclId.attr = function (cId, attrId) {
    // cId: String | Number, attrId: String | Number
    if (!isValidArgType(cId))
        throw new TypeError('cId should be a number or a string.');

    if (!isValidArgType(attrId))
        throw new TypeError('attrId should be a number or a string.');

    var cNumber = parseInt(cId),
        attrNumber = parseInt(attrId),
        cItem,
        attrItem,
        cInfo;

    if (!isNaN(cNumber))
        cId = cNumber;

    if (!isNaN(attrNumber))
        attrId = attrNumber;

    cItem = zclId.clusterId.get(cId);

    if (cItem)
        cInfo = zclId._getCluster(cItem.key);

    if (cInfo && !_.isNil(cInfo.attr))
        attrItem = cInfo.attr.get(attrId);

    if (attrItem)
        return { key: attrItem.key, value: attrItem.value };    // { key: 'modelId', value: 5 }
};

zclId.attrType = function (cId, attrId) {
    // cId: String | Number, attrId: String | Number
    if (!isValidArgType(cId))
        throw new TypeError('cId should be a number or a string.');

    if (!isValidArgType(attrId))
        throw new TypeError('attrId should be a number or a string.');

    var cNumber = parseInt(cId),
        attrNumber = parseInt(attrId),
        cItem,
        attrItem,
        attrName,
        attrType,
        cInfo;

    if (!isNaN(cNumber))
        cId = cNumber;

    if (!isNaN(attrNumber))
        attrId = attrNumber;

    cItem = zclId.clusterId.get(cId);

    if (cItem)
        cInfo = zclId._getCluster(cItem.key);

    attrName = zclId.attr(cId, attrId);

    if (cInfo && !_.isNil(cInfo.attrType) && attrName) {
        attrItem = cInfo.attrType.get(attrName.key);
        attrType = zclId.dataType(attrItem.value);
    }

    if (attrType)
        return { key: attrType.key, value: attrType.value };    // { key: 'CHAR_STR', value: 66 }
};

zclId.dataType = function (type) {
    // type: String | Number
    if (!isValidArgType(type))
        throw new TypeError('dataType should be a number or a string.');

    var typeNumber = parseInt(type),
        typeItem;

    if (!isNaN(typeNumber))
        type = typeNumber;

    typeItem = zclId.dataTypeId.get(type);

    if (typeItem)
        return { key: typeItem.key, value: typeItem.value };    // { key: 'DATA8', value: 8 }
};

zclId.status = function (status) {
    // status: String | Number
    if (!isValidArgType(status))
        throw new TypeError('status should be a number or a string.');

    var statusNumber = parseInt(status),
        statusItem;

    if (!isNaN(statusNumber))
        status = statusNumber;

    statusItem = zclId.statusId.get(status);

    if (statusItem)
        return { key: statusItem.key, value: statusItem.value };    // { key: 'DATA8', value: 8 }
};

module.exports = zclId;
