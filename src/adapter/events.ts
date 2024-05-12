import {Header as ZclHeader} from '../zspec/zcl';

enum Events {
    networkAddress = "networkAddress",
    deviceJoined = "deviceJoined",
    zclPayload = "zclPayload",
    disconnected = "disconnected",
    deviceAnnounce = "deviceAnnounce",
    deviceLeave = "deviceLeave"
}

type DeviceJoinedPayload = {
    networkAddress: number;
    ieeeAddr: string;
};

type DeviceAnnouncePayload = {
    networkAddress: number;
    ieeeAddr: string;
};

type NetworkAddressPayload = {
    networkAddress: number;
    ieeeAddr: string;
};

type DeviceLeavePayload = {
    networkAddress?: number;
    ieeeAddr: string;
} | {
    networkAddress: number;
    ieeeAddr?: string;
};

interface ZclPayload {
    clusterID: number;
    address: number | string;
    header: ZclHeader | undefined;
    // This buffer contains the whole Zcl.Frame (including the ZclHeader)
    data: Buffer;
    endpoint: number;
    linkquality: number;
    groupID: number;
    wasBroadcast: boolean;
    destinationEndpoint: number;
}

export {
    Events, DeviceJoinedPayload, ZclPayload, DeviceAnnouncePayload, NetworkAddressPayload, DeviceLeavePayload,
};