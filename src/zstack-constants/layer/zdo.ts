var COMMON = require('./common'),
    ZDO = require('./defs/zdo.json');

ZDO = Object.assign(ZDO, {
    cmdStatus: COMMON.cmdStatus,
    capabInfoMask: COMMON.capabInfoMask,
    devStates: COMMON.devStates,
    logicalChannels: COMMON.logicalChannels,
    channelMask: COMMON.channelMask,
    scanDuration: COMMON.scanDuration
});

module.exports = ZDO;
