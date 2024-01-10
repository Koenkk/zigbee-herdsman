import {FrameControl} from "../zcl";
import {Device, Endpoint} from "./model";
import {KeyValue} from "./tstype";

enum Events {
    message = "message",
    adapterDisconnected = "adapterDisconnected",
    deviceJoined = "deviceJoined",
    deviceInterview = "deviceInterview",
    deviceAnnounce = "deviceAnnounce",
    deviceNetworkAddressChanged = "deviceNetworkAddressChanged",
    deviceLeave = "deviceLeave",
    permitJoinChanged = "permitJoinChanged",
    lastSeenChanged = "lastSeenChanged",
}

interface DeviceJoinedPayload {
    device: Device;
}

interface DeviceInterviewPayload {
    status: 'started' | 'successful' | 'failed';
    device: Device;
}

interface DeviceNetworkAddressChangedPayload {
    device: Device;
}

interface DeviceAnnouncePayload {
    device: Device;
}

interface DeviceLeavePayload {
    ieeeAddr: string;
}

interface PermitJoinChangedPayload {
    permitted: boolean, reason: 'timer_expired' | 'manual', timeout: number
}

interface LastSeenChangedPayload {
    device: Device;
    reason: 'deviceAnnounce' | 'networkAddress' | 'deviceJoined' | 'messageEmitted' | 'messageNonEmitted';
}

const CommandsLookup: {[s: string]: MessagePayloadType} = {
    'notification': 'commandNotification',
    'commissioningNotification': 'commandCommissioningNotification',
    'on': 'commandOn',
    'offWithEffect': 'commandOffWithEffect',
    'step': 'commandStep',
    'stop': 'commandStop',
    'hueNotification': 'commandHueNotification',
    'off': 'commandOff',
    'stepColorTemp': 'commandStepColorTemp',
    'stepHue': 'commandStepHue',
    'stepSaturation': 'commandStepSaturation',
    'moveWithOnOff': 'commandMoveWithOnOff',
    'move': 'commandMove',
    'moveColorTemp': 'commandMoveColorTemp',
    'moveHue': 'commandMoveHue',
    'moveToSaturation': 'commandMoveToSaturation',
    'stopWithOnOff': 'commandStopWithOnOff',
    'moveToLevel': 'commandMoveToLevel',
    'moveToLevelWithOnOff': 'commandMoveToLevelWithOnOff',
    'toggle': 'commandToggle',
    'tradfriArrowSingle': 'commandTradfriArrowSingle',
    'tradfriArrowHold': 'commandTradfriArrowHold',
    'tradfriArrowRelease': 'commandTradfriArrowRelease',
    'stepWithOnOff': 'commandStepWithOnOff',
    'moveToColorTemp': 'commandMoveToColorTemp',
    'moveToColor': 'commandMoveToColor',
    'onWithTimedOff': 'commandOnWithTimedOff',
    'recall': 'commandRecall',
    'arm': 'commandArm',
    'panic': 'commandPanic',
    'emergency': 'commandEmergency',
    'operationEventNotification': 'commandOperationEventNotification',
    'statusChangeNotification': 'commandStatusChangeNotification',
    'colorLoopSet': 'commandColorLoopSet',
    'enhancedMoveToHueAndSaturation': 'commandEnhancedMoveToHueAndSaturation',
    'downClose': 'commandDownClose',
    'upOpen': 'commandUpOpen',
    'dataResponse': 'commandDataResponse',
    'dataReport': 'commandDataReport',
    'mcuVersionResponse': 'commandMcuVersionResponse',
    'getWeeklyScheduleRsp': 'commandGetWeeklyScheduleRsp',
    'queryNextImageRequest': 'commandQueryNextImageRequest',
    'alertsNotification': 'commandAlertsNotification',
    'programmingEventNotification': 'commandProgrammingEventNotification',
    'getPinCodeRsp': 'commandGetPinCodeRsp',
    'getUserStatusRsp': 'commandGetUserStatusRsp',
    'arrivalSensorNotify': 'commandArrivalSensorNotify',
    'getPanelStatus': 'commandGetPanelStatus',
    'checkin': 'commandCheckIn',
    'moveToHue': 'commandMoveToHue',
    'store': 'commandStore',
    'alarm': 'commandAlarm',                                                  
    'unlockDoorRsp': 'commandUnlockDoorRsp',

    // HEIMAN scenes cluster
    'atHome': 'commandAtHome',
    'goOut': 'commandGoOut',
    'cinema': 'commandCinema',
    'repast': 'commandRepast',
    'sleep': 'commandSleep',

    // HEIMAN IR remote cluster
    'studyKeyRsp': 'commandStudyKeyRsp',
    'createIdRsp': 'commandCreateIdRsp',
    'getIdAndKeyCodeListRsp': 'commandGetIdAndKeyCodeListRsp',

    'mcuGatewayConnectionStatus': 'commandMcuGatewayConnectionStatus', // Tuya gateway connnection status
    'mcuSyncTime': 'commandMcuSyncTime', // Tuya time sync
    'activeStatusReport': 'commandActiveStatusReport', // Tuya active status report (command 0x06)
    'activeStatusReportAlt': 'commandActiveStatusReportAlt', // Tuya active status report (command 0x05)

    // Wiser Smart HVAC Commmands
    'wiserSmartSetSetpoint': 'commandWiserSmartSetSetpoint',
    'wiserSmartCalibrateValve': 'commandWiserSmartCalibrateValve',

    // Dafoss Ally/Hive TRV Commands
    'danfossSetpointCommand': 'commandDanfossSetpointCommand',

    // Siglis zigfred Commands
    'siglisZigfredButtonEvent': 'commandSiglisZigfredButtonEvent',

    // Zosung IR remote cluster commands and responses
    'zosungSendIRCode01': 'commandZosungSendIRCode01',
    'zosungSendIRCode02': 'commandZosungSendIRCode02',
    'zosungSendIRCode04': 'commandZosungSendIRCode04',
    'zosungSendIRCode00': 'commandZosungSendIRCode00',
    'zosungSendIRCode03Resp': 'zosungSendIRCode03Resp',
    'zosungSendIRCode05Resp': 'zosungSendIRCode05Resp',
    'transferDataResp': 'transferDataResp', 
    
    // Schneider
    'schneiderWiserThermostatBoost':'commandSchneiderWiserThermostatBoost',

    // Tradfri
    'action1': 'commandAction1',
    'action2': 'commandAction2',
    'action3': 'commandAction3',
    'action4': 'commandAction4',
    'action6': 'commandAction6',
};

type MessagePayloadType =
    // Global
    'attributeReport' | 'readResponse' | 'raw' | 'read' | 'write' |
    // Specific
    'commandOn' | 'commandOffWithEffect' | 'commandStep' | 'commandStop' | 'commandHueNotification' |
    'commandOff' | 'commandStepColorTemp' | 'commandMoveWithOnOff' |
    'commandMove' | 'commandMoveHue' | 'commandStepHue' | 'commandStepSaturation' |
    'commandMoveToSaturation' | 'commandStopWithOnOff' | 'commandMoveToLevelWithOnOff' | 'commandToggle' |
    'commandTradfriArrowSingle' | 'commandTradfriArrowHold' | 'commandTradfriArrowRelease' |
    'commandStepWithOnOff' | 'commandMoveToColorTemp' | 'commandMoveToColor' | 'commandOnWithTimedOff' |
    'commandRecall' | 'commandArm' | 'commandPanic' | 'commandEmergency' | 'commandColorLoopSet' |
    'commandOperationEventNotification' | 'commandStatusChangeNotification' | 'commandEnhancedMoveToHueAndSaturation' |
    'commandUpOpen' | 'commandDownClose' | 'commandMoveToLevel' | 'commandMoveColorTemp' | 'commandDataResponse' |
    'commandDataReport' | 'commandGetWeeklyScheduleRsp' | 'commandQueryNextImageRequest' | 'commandNotification' |
    'commandAlertsNotification' | 'commandProgrammingEventNotification' | 'commandGetPinCodeRsp' |
    'commandArrivalSensorNotify' | 'commandCommissioningNotification' | 'commandGetUserStatusRsp' |
    'commandAlarm' | 'commandUnlockDoorRsp' | 'commandMcuVersionResponse' |
    'commandAtHome' | 'commandGoOut' | 'commandCinema' | 'commandRepast' | 'commandSleep' |
    'commandStudyKeyRsp' | 'commandCreateIdRsp' | 'commandGetIdAndKeyCodeListRsp' | 'commandMcuSyncTime' |
    'commandGetPanelStatus' | 'commandCheckIn' | 'commandActiveStatusReport' | 'commandActiveStatusReportAlt' |
    'commandMoveToHue' | 'commandStore'| 'commandWiserSmartSetSetpoint' | 'commandWiserSmartCalibrateValve' |
    'commandSiglisZigfredButtonEvent' | 'commandDanfossSetpointCommand' | 'commandZosungSendIRCode00' |
    'commandZosungSendIRCode01' | 'commandZosungSendIRCode02'|'commandZosungSendIRCode04' | 'zosungSendIRCode03Resp' | 
    'zosungSendIRCode05Resp' | 'commandMcuGatewayConnectionStatus' | 'commandSchneiderWiserThermostatBoost' | 
	'transferDataResp' | 'commandAction1' | 'commandAction2' | 'commandAction3' | 'commandAction4' | 'commandAction6';

interface MessagePayload {
    type: MessagePayloadType;
    device: Device;
    endpoint: Endpoint;
    linkquality: number;
    groupID: number;
    cluster: string | number;
    data: KeyValue | Array<string | number>;
    meta: {
        zclTransactionSequenceNumber?: number;
        manufacturerCode?: number;
        frameControl?: FrameControl;
    };
}

export {
    Events, MessagePayload, MessagePayloadType, CommandsLookup, DeviceInterviewPayload, DeviceAnnouncePayload,
    DeviceLeavePayload, DeviceJoinedPayload, PermitJoinChangedPayload, DeviceNetworkAddressChangedPayload,
    LastSeenChangedPayload,
};
