var controller,
    query = {};

var nvParams = require('../config/nv_start_options.js');

/*************************************************************************************************/
/*** Public APIs                                                                               ***/
/*************************************************************************************************/
query.coordInfo = function (callback) {
    var info = controller.getNetInfo();
    return query.device(info.ieeeAddr, info.nwkAddr, callback);
};

/*************************************************************************************************/
/*** Protected Methods                                                                         ***/
/*************************************************************************************************/
query._network = function (param, callback) {
    var prop = Zsc.SAPI.zbDeviceInfo[param];

    return Q.fcall(function () {
        if (_.isNil(prop))
            return Q.reject(new Error('Unknown network property.'));
        else if (param === 'PAN_ID')
            return controller.request('SYS', 'osalNvRead', nvParams.panId).then(function (rsp) {
                return rsp.value.readUInt16LE();
            });
        else if (param === 'CHANNEL')
            return controller.request('SYS', 'osalNvRead', nvParams.channelList).then(function (rsp) {
                return rsp.value.readUInt32LE();
            });
        else if (param === 'EXT_PAN_ID') {
            return controller.request('SYS', 'osalNvRead', nvParams.extPanId).then(function (rsp) {
                return bufToArray(rsp.value, 'uint8');
            });
        }
        else
            return controller.request('UTIL', 'getDeviceInfo', {});
    }).then(function (rsp) {
        switch (param) {
            case 'DEV_STATE':
                return rsp.devicestate;
            case 'CHANNEL':
                const lookup = {
                    11: 0x00000800,
                    12: 0x00001000,
                    13: 0x00002000,
                    14: 0x00004000,
                    15: 0x00008000,
                    16: 0x00010000,
                    17: 0x00020000,
                    18: 0x00040000,
                    19: 0x00080000,
                    20: 0x00100000,
                    21: 0x00200000,
                    22: 0x00400000,
                    23: 0x00800000,
                    24: 0x01000000,
                    25: 0x02000000,
                    26: 0x04000000,
                };

                return Object.keys(lookup).find(k => lookup[k] === rsp);
            case 'IEEE_ADDR':
                return rsp.ieeeaddr;
            case 'EXT_PAN_ID':
                return rsp;
            case 'SHORT_ADDR':
                return rsp.shortaddr;
            case 'PAN_ID':
                return rsp;
        }
    }).nodeify(callback);
};

query._networkAll = function (callback) {
    var paramsInfo = [
            { param: 'DEV_STATE',  name: 'state'   }, { param: 'IEEE_ADDR',  name: 'ieeeAddr' },
            { param: 'SHORT_ADDR', name: 'nwkAddr' }, { param: 'CHANNEL',    name: 'channel'  },
            { param: 'PAN_ID',     name: 'panId'   }, { param: 'EXT_PAN_ID', name: 'extPanId' }
        ],
        net = {
            state: null,
            channel: null,
            panId: null,
            extPanId: null,
            ieeeAddr: null,
            nwkAddr: null
        },
        steps = [];

    _.forEach(paramsInfo, function (paramInfo) {
        steps.push(function (net) {
            return query._network(paramInfo.param).then(function (value) {
                net[paramInfo.name] = value;
                return net;
            });
        });
    });

    return steps.reduce(function (soFar, fn) {
        return soFar.then(fn);
    }, Q(net)).nodeify(callback);
};


module.exports = function (cntl) {
    controller = cntl;
    return query;
};
