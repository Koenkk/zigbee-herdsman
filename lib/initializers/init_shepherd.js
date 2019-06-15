/* jshint node: true */
'use strict';

var Q = require('q'),
    debug = require('debug')('zigbee-shepherd:init');

var af = require('../components/af'),
    loader = require('../components/loader');

var init = {};

init.setupShepherd = function (shepherd, callback) {
    var deferred = Q.defer(),
        controller = shepherd.controller,
        netInfo;

    debug('zigbee-shepherd booting...');

    controller.start().then(function () {
        shepherd.af = af(controller);
        return controller.request('ZDO', 'mgmtPermitJoinReq', { addrmode: 0x02, dstaddr: 0 , duration: 0, tcsignificance: 0 });
    }).then(function () {
        return shepherd._registerDev(controller._coord);
    }).then(function () {
        return loader.reload(shepherd);    // reload all devices from database
    }).then(function() {
    debug('Loading devices from database done.');
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

module.exports = init;
