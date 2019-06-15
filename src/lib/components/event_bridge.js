/* jshint node: true */
'use strict';

var zdoHelper = require('./zdo_helper.js'),
    debug = {
        msgHdlr: require('debug')('zigbee-shepherd:msgHdlr')
    };

var bridge = {};

bridge._areqEventBridge = function (controller, msg) {
    // msg: { subsys: 'ZDO', ind: 'endDeviceAnnceInd', data: { srcaddr: 63536, nwkaddr: 63536, ieeeaddr: '0x00124b0001ce3631', ... }
    var mandatoryEvent = msg.subsys + ':' + msg.ind;    // 'SYS:resetInd', 'SYS:osalTimerExpired'

    controller.emit(mandatoryEvent, msg.data);          // bridge to subsystem events, like 'SYS:resetInd', 'SYS:osalTimerExpired'

    if (msg.subsys === 'AF')
        debug.msgHdlr('IND <-- %s, transId: %d', mandatoryEvent, msg.data.transid || msg.data.transseqnumber);
    else
        debug.msgHdlr('IND <-- %s', mandatoryEvent);

    // dispatch to specific event bridge
    if (msg.subsys === 'ZDO')
        bridge._zdoIndicationEventBridge(controller, msg);
    // else: Do nothing. No need to bridge: SYS, MAC, NWK, UTIL, DBG, APP
};

bridge._zdoIndicationEventBridge = function (controller, msg) {
    var payload = msg.data,
        zdoEventHead = 'ZDO:' + msg.ind,
        zdoBridgedEvent;

    if (msg.ind === 'stateChangeInd') {    // this is a special event
        if (!payload.hasOwnProperty('nwkaddr'))    // Coord itself
            zdoBridgedEvent = 'coordStateInd';
        else if (payload.state === 0x83 || payload.state === 'NOT_ACTIVE')
            zdoBridgedEvent = zdoEventHead + ':' + payload.nwkaddr + ':NOT_ACTIVE';
        else if (payload.state === 0x82 || payload.state === 'INVALID_EP')
            zdoBridgedEvent = zdoEventHead + ':' + payload.nwkaddr + ':INVALID_EP';
    } else {
        zdoBridgedEvent = zdoHelper.generateEventOfIndication(msg.ind, payload);
    }

    if (zdoBridgedEvent)
        controller.emit(zdoBridgedEvent, payload);
};

module.exports = bridge;
