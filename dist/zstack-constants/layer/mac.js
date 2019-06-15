"use strict";
var COMMON = require('./common'), MAC = require('./defs/mac.json');
MAC = Object.assign(MAC, {
    cmdStatus: COMMON.cmdStatus,
    capabInfoMask: COMMON.capabInfoMask,
    logicalChannels: COMMON.logicalChannels,
    channelMask: COMMON.channelMask,
    securityLevel: COMMON.securityLevel,
    addressMode: COMMON.addressMode,
    scanDuration: COMMON.scanDuration
});
module.exports = MAC;
//# sourceMappingURL=mac.js.map