/* jshint node: true */
'use strict';

var _ = require('busyman'),
    util = require('util'),
    Device = require('./device');

function Coordinator(devInfo) {
    // devInfo = { type, ieeeAddr, nwkAddr, manufId, epList }

    Device.call(this, devInfo);

    this.status = 'online';
}

util.inherits(Coordinator, Device);

Coordinator.prototype.getDelegator = function (profId) {
    return _.find(this.endpoints, function (ep) {
        return ep.isDelegator() && (ep.getProfId() === profId);
    });
};

module.exports = Coordinator;
