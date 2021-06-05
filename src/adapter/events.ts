import {ZclFrame} from '../zcl';

enum Events {
    networkAddress = "networkAddress",
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

interface NetworkAddressPayload {
    networkAddress: number;
    ieeeAddr: string;
}

interface DeviceLeavePayload {
    networkAddress: number;
    ieeeAddr: string;
}

interface ZclDataPayload {
    address: number | string;
    frame: ZclFrame;
    endpoint: number;
    linkquality: number;
    groupID: number;
    wasBroadcast: boolean;
    destinationEndpoint: number;
}

interface RawDataPayload {
    clusterID: number;
    address: number | string;
    data: Buffer;
    endpoint: number;
    linkquality: number;
    groupID: number;
    wasBroadcast: boolean;
    destinationEndpoint: number;
}

export {
    Events, DeviceJoinedPayload, ZclDataPayload, DeviceAnnouncePayload, NetworkAddressPayload, DeviceLeavePayload,
    RawDataPayload,
};