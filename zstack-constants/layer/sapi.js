var COMMON = require('./common'),
    SAPI = require('./defs/sapi.json');

SAPI = Object.assign(SAPI, {
    cmdStatus: COMMON.cmdStatus,
    nvItemIds: COMMON.nvItemIds
});

module.exports = SAPI;
