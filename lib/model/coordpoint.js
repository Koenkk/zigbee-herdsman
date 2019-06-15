/* jshint node: true */
'use strict';

var util = require('util'),
    Endpoint = require('./endpoint');

function Coordpoint(coord, simpleDesc, isDelegator) {
    // simpleDesc = { profId, epId, devId, inClusterList, outClusterList }

    // coordpoint is a endpoint, but a 'LOCAL' endpoint
    // This class is used to create delegators, local applications

    Endpoint.call(this, coord, simpleDesc);

    this.isLocal = function () {
        return true;                      // this is a local endpoint, always return true
    };

    this.isDelegator = function () {
        return !!(isDelegator || false);  // this local endpoint maybe a delegator
    };
}

util.inherits(Coordpoint, Endpoint);

module.exports = Coordpoint;
