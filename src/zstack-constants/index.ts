var COMMON = require('./layer/common.js');

var BEACON_MAX_DEPTH = 0x0F,
    DEF_NWK_RADIUS = (2 * BEACON_MAX_DEPTH),
    AF_DEFAULT_RADIUS = DEF_NWK_RADIUS,
    NWK_MAX_DEVICE_LIST = 20;

var ZDEFS = {
    BEACON_MAX_DEPTH: BEACON_MAX_DEPTH,
    DEF_NWK_RADIUS: DEF_NWK_RADIUS,
    AF_DEFAULT_RADIUS: AF_DEFAULT_RADIUS,
    config: {
        'ZDO_MGMT_MAX_NWKDISC_ITEMS': 5,
        'ZDO_MGMT_MAX_RTG_ITEMS': 10,
        'ZDO_MGMT_MAX_BIND_ITEMS': 3,
        'ZDO_MGMT_MAX_LQI_ITEMS': 2,
        'ZDO_MGMT_MAX_LQI_FRAG_NOSECURE_ITEMS': 3,
        'NWK_MAX_DEVICE_LIST': NWK_MAX_DEVICE_LIST,
        'NWK_MAX_DEVICES': NWK_MAX_DEVICE_LIST + 1  // One extra space for parent
    },
    cmdStatus: COMMON.cmdStatus,
    AF: require('./layer/af.js'),
    DBG: require('./layer/dbg.js'),
    MAC: require('./layer/mac.js'),
    SAPI: require('./layer/sapi.js'),
    SYS: require('./layer/sys.js'),
    UTIL: require('./layer/util.js'),
    ZDO: require('./layer/zdo.js')
};

ZDEFS.getStatus = function (code) {
    var result;

    if (typeof code === 'string' && ZDEFS.cmdStatus.hasOwnProperty(code)) {
        result = {
            key: code,
            value: ZDEFS.cmdStatus[code]
        };
    } else if (typeof code === 'number') {
        for (var k in ZDEFS.cmdStatus) {
            if (ZDEFS.cmdStatus[k] === code) {
                result = {
                    key: k,
                    value: code
                };
                break;
            }
        }
    }

    return result;
};

module.exports = ZDEFS;
