import {Device, Endpoint} from "./model";
import {KeyValue} from "./tstype";

enum Events {
    message = "message",
    adapterDisconnected = "adapterDisconnected",
    deviceJoined = "deviceJoined",
    deviceInterview = "deviceInterview",
    deviceAnnounce = "deviceAnnounce",
    deviceLeave = "deviceLeave",
}

interface DeviceJoinedPayload {
    device: Device;
}

interface DeviceInterviewPayload {
    status: 'started' | 'successful' | 'failed';
    device: Device;
}

interface DeviceAnnouncePayload {
    device: Device;
}

interface DeviceLeavePayload {
    ieeeAddr: string;
}

const CommandsLookup: {[s: string]: MessagePayloadType} = {
    'notification': 'commandNotification',
    'commisioningNotification': 'commandCommisioningNotification',
    'on': 'commandOn',
    'offWithEffect': 'commandOffWithEffect',
    'step': 'commandStep',
    'stop': 'commandStop',
    'hueNotification': 'commandHueNotification',
    'off': 'commandOff',
    'stepColorTemp': 'commandStepColorTemp',
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
    'getData': 'commandGetData',
    'setDataResponse': 'commandSetDataResponse',
    'getWeeklyScheduleRsp': 'commandGetWeeklyScheduleRsp',
    'queryNextImageRequest': 'commandQueryNextImageRequest',
    'alertsNotification': 'commandAlertsNotification',
    'programmingEventNotification': 'commandProgrammingEventNotification',
    'getPinCodeRsp': 'commandGetPinCodeRsp',
    'arrivalSensorNotify': 'commandArrivalSensorNotify',
    'addRsp': 'commandSceneAddRsp',
    'viewRsp': 'commandSceneViewRsp',
    'removeRsp': 'commandSceneRemoveRsp',
    'removeAllRsp': 'commandSceneRemoveAllRsp',
    'storeRsp': 'commandSceneStoreRsp',
    'getSceneMembershipRsp': 'commandScenegetSceneMembershipRsp',
};

type MessagePayloadType =
    // Global
    'attributeReport' | 'readResponse' | 'raw' | 'read' | 'write' |
    // Specific
    'commandOn' | 'commandOffWithEffect' | 'commandStep' | 'commandStop' | 'commandHueNotification' |
    'commandOff' | 'commandStepColorTemp' | 'commandMoveWithOnOff' | 'commandMove' | 'commandMoveHue' |
    'commandMoveToSaturation' | 'commandStopWithOnOff' | 'commandMoveToLevelWithOnOff' | 'commandToggle' |
    'commandTradfriArrowSingle' | 'commandTradfriArrowHold' | 'commandTradfriArrowRelease' |
    'commandStepWithOnOff' | 'commandMoveToColorTemp' | 'commandMoveToColor' | 'commandOnWithTimedOff' |
    'commandRecall' | 'commandArm' | 'commandPanic' | 'commandEmergency' | 'commandColorLoopSet' |
    'commandOperationEventNotification' | 'commandStatusChangeNotification' | 'commandEnhancedMoveToHueAndSaturation' |
    'commandUpOpen' | 'commandDownClose' | 'commandMoveToLevel' | 'commandMoveColorTemp' | 'commandGetData' |
    'commandSetDataResponse' | 'commandGetWeeklyScheduleRsp' | 'commandQueryNextImageRequest' | 'commandNotification' |
    'commandAlertsNotification' | 'commandProgrammingEventNotification' | "commandGetPinCodeRsp" |
    "commandArrivalSensorNotify" | 'commandCommisioningNotification';

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
    };
}

export {
    Events, MessagePayload, MessagePayloadType, CommandsLookup, DeviceInterviewPayload, DeviceAnnouncePayload,
    DeviceLeavePayload, DeviceJoinedPayload,
};
