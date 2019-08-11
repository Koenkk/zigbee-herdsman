/* jshint node: true */
'use strict';

import * as Zsc from '../../zstack-constants';

var Q = require('q'),
    EventEmitter = require('events'),
    _ = require('busyman'),
    Ziee = require('../../deprecated/ziee'),
    debug = {
        shepherd: require('debug')('zigbee-shepherd'),
        init: require('debug')('zigbee-shepherd:init'),
        request: require('debug')('zigbee-shepherd:request'),
    };

var Device = require('../model/device'),
    Endpoint = require('../model/endpoint');

var handlers = {};

handlers.attachEventHandlers = function (shepherd) {
    var controller = shepherd.controller,
        hdls = {};

    _.forEach(handlers, function (hdl, key) {
        if (key !== 'attachEventHandlers')
            hdls[key] = hdl.bind(shepherd);
    });

    controller.removeListener('SYS:resetInd',          hdls.resetInd);
    controller.removeListener('ZDO:endDeviceAnnceInd', hdls.endDeviceAnnceInd);
    controller.removeListener('ZDO:tcDeviceInd',       hdls.tcDeviceInd);
    controller.removeListener('ZDO:stateChangeInd',    hdls.stateChangeInd);
    controller.removeListener('ZDO:matchDescRspSent',  hdls.matchDescRspSent);
    controller.removeListener('ZDO:statusErrorRsp',    hdls.statusErrorRsp);
    controller.removeListener('ZDO:srcRtgInd',         hdls.srcRtgInd);
    controller.removeListener('ZDO:beacon_notify_ind', hdls.beacon_notify_ind);
    controller.removeListener('ZDO:leaveInd',          hdls.leaveInd);
    controller.removeListener('ZDO:msgCbIncoming',     hdls.msgCbIncoming);
    controller.removeListener('ZDO:serverDiscRsp',     hdls.serverDiscRsp);
    // controller.removeListener('ZDO:permitJoinInd',     hdls.permitJoinInd);

    controller.on('SYS:resetInd',          hdls.resetInd);
    controller.on('ZDO:endDeviceAnnceInd', hdls.endDeviceAnnceInd);
    controller.on('ZDO:tcDeviceInd',       hdls.tcDeviceInd);
    controller.on('ZDO:stateChangeInd',    hdls.stateChangeInd);
    controller.on('ZDO:matchDescRspSent',  hdls.matchDescRspSent);
    controller.on('ZDO:statusErrorRsp',    hdls.statusErrorRsp);
    controller.on('ZDO:srcRtgInd',         hdls.srcRtgInd);
    controller.on('ZDO:beacon_notify_ind', hdls.beacon_notify_ind);
    controller.on('ZDO:leaveInd',          hdls.leaveInd);
    controller.on('ZDO:msgCbIncoming',     hdls.msgCbIncoming);
    controller.on('ZDO:serverDiscRsp',     hdls.serverDiscRsp);
    // controller.on('ZDO:permitJoinInd',     hdls.permitJoinInd);
};

/*************************************************************************************************/
/*** Event Handlers                                                                            ***/
/*************************************************************************************************/
handlers.resetInd = function (msg) {
    var self = this;

    if (this.controller.isResetting()) return;

    if (msg !== '_reset')
        debug.shepherd('Starting a software reset...');

    this.stop().then(function () {
        return self.start();
    }).then(function () {
        if (msg === '_reset')
            return self.controller.emit('_reset');
    }).fail(function (err) {
        if (msg === '_reset') {
            return self.controller.emit('_reset', err);
        } else {
            debug.shepherd('Reset had an error', err);
            self.emit('error', err);
        }
    }).done();
};


handlers.endDeviceAnnceInd = function (msg) {
    // { srcaddr, extaddr, request, removechildren, rejoin }
    debug.shepherd('Device: %s endAnnounce.', msg.ieeeaddr);
    var dev = this._findDevByAddr(msg.ieeeaddr);
    if (dev) {
        this.emit('ind:enddeviceannce', dev);
    }
};


handlers.leaveInd = function (msg) {
    // { srcaddr, extaddr, request, removechildren, rejoin }
    var dev = this._findDevByAddr(msg.extaddr);

    if (dev) {
        var ieeeAddr = dev.getIeeeAddr(),
            epList = _.cloneDeep(dev.epList);

        if (msg.request)    // request
            this._unregisterDev(dev);
        else                // indication
            this._devbox.remove(dev._getId(), function () {});
        debug.shepherd('Device: %s leave the network.', ieeeAddr);
        this.emit('ind:leaving', epList, ieeeAddr);
    }
};

handlers.stateChangeInd = function (msg) {
    // { state[, nwkaddr] }
    if (!msg.hasOwnProperty('nwkaddr'))
        return;

    var devStates = msg.state;
    _.forEach(Zsc.COMMON.devStates, function (statesCode, states) {
        if (msg.state === statesCode)
            devStates = states;
    });

    debug.shepherd('Device: %d is now in state: %s', msg.nwkaddr, devStates);
};

handlers.statusErrorRsp = function (msg) {
    // { srcaddr, status }
    debug.shepherd('Device: %d status error: %d', msg.srcaddr, msg.status);
};

handlers.tcDeviceInd = function (msg) {
    // { nwkaddr, extaddr, parentaddr }
};

handlers.matchDescRspSent = function (msg) {
    // { nwkaddr, numinclusters, inclusterlist, numoutclusters, outclusterlist }
};

handlers.srcRtgInd = function (msg) {
    // { dstaddr, relaycount, relaylist }
};

handlers.beacon_notify_ind = function (msg) {
    // { beaconcount, beaconlist }
};

handlers.msgCbIncoming = function (msg) {
    // { srcaddr, wasbroadcast, clusterid, securityuse, seqnum, macdstaddr, msgdata }
};

handlers.serverDiscRsp = function (msg) {
    // { srcaddr, status, servermask }
};

module.exports = handlers;
