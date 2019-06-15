var COMMON = require('./common'),
    AF = require('./defs/af.json');

AF = Object.assign(AF, {
    cmdStatus: COMMON.cmdStatus,
    addressMode: COMMON.addressMode
});

module.exports = AF;
