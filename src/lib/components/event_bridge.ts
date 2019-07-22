import {Subsystem} from '../../unpi/constants';
import ZpiObject from "src/znp/zpiObject";

var zdoHelper = require('./zdo_helper.js'),
    debug = {
        msgHdlr: require('debug')('zigbee-shepherd:msgHdlr')
    };

var bridge = {};

bridge._areqEventBridge = function (controller, msg: ZpiObject) {
    // msg: { subsys: 'ZDO', ind: 'endDeviceAnnceInd', data: { srcaddr: 63536, nwkaddr: 63536, ieeeaddr: '0x00124b0001ce3631', ... }
    var mandatoryEvent = Subsystem[msg.subsystem] + ':' + msg.command;    // 'SYS:resetInd', 'SYS:osalTimerExpired'

    controller.emit(mandatoryEvent, msg.payload);          // bridge to subsystem events, like 'SYS:resetInd', 'SYS:osalTimerExpired'

    if (msg.subsys === 'AF')
        debug.msgHdlr('IND <-- %s, transId: %d', mandatoryEvent, msg.data.transid || msg.data.transseqnumber);
    else
        debug.msgHdlr('IND <-- %s', mandatoryEvent);

    // dispatch to specific event bridge
    if (msg.subsystem === Subsystem.ZDO)
        bridge._zdoIndicationEventBridge(controller, msg);
    // else: Do nothing. No need to bridge: SYS, MAC, NWK, UTIL, DBG, APP
};

bridge._zdoIndicationEventBridge = function (controller, msg) {
    var payload = msg.payload,
        zdoEventHead = 'ZDO:' + msg.command,
        zdoBridgedEvent;

    if (msg.command === 'stateChangeInd') {    // this is a special event
        if (!payload.hasOwnProperty('nwkaddr'))    // Coord itself
            zdoBridgedEvent = 'coordStateInd';
        else if (payload.state === 0x83 || payload.state === 'NOT_ACTIVE')
            zdoBridgedEvent = zdoEventHead + ':' + payload.nwkaddr + ':NOT_ACTIVE';
        else if (payload.state === 0x82 || payload.state === 'INVALID_EP')
            zdoBridgedEvent = zdoEventHead + ':' + payload.nwkaddr + ':INVALID_EP';
    } else {
        zdoBridgedEvent = zdoHelper.generateEventOfIndication(msg.command, payload);
    }

    if (zdoBridgedEvent)
        controller.emit(zdoBridgedEvent, payload);
};

module.exports = bridge;
