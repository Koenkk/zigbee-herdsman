import {ZclFrame} from '../zcl';

enum Events {
    deviceJoined = "deviceJoined",
    zclData = "zclData",
    rawData = "rawData",
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

interface RawDataPayload {
    clusterID: number;
    networkAddress: number;
    data: Buffer;
    endpoint: number;
    linkquality: number;
    groupID: number;
}

export {
    Events, DeviceJoinedPayload, ZclDataPayload, DeviceAnnouncePayload, DeviceLeavePayload, RawDataPayload,
};