import {ZclFrame} from '../zcl';

enum Events {
    deviceJoined = "deviceJoined",
    zclData = "zclData",
    disconnected = "disconnected",
    deviceAnnounce = "deviceAnnounce",
    deviceLeave = "deviceLeave"
}

interface DeviceJoinedPayload {
    networkAddress: number;
    ieeeAddr: string;
}

interface DeviceAnnouncePayload {
    networkAddress: number;
    ieeeAddr: string;
}

interface DeviceLeavePayload {
    networkAddress: number;
    ieeeAddr: string;
}

interface ZclDataPayload {
    networkAddress: number;
    frame: ZclFrame;
    endpoint: number;
    linkquality: number;
    groupID: number;
}

export {
    Events, DeviceJoinedPayload, ZclDataPayload, DeviceAnnouncePayload, DeviceLeavePayload,
}