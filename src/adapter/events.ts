import {ZclHeader} from '../zcl';

enum Events {
    networkAddress = "networkAddress",
    deviceJoined = "deviceJoined",
    data = "data",
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

interface ZclDataPayload {
    clusterID: number;
    address: number | string;
    zclFrameHeader: ZclHeader | undefined;
    // This buffer contains the whole ZclFrame (including the ZclHeader)
    data: Buffer;
    endpoint: number;
    linkquality: number;
    groupID: number;
    wasBroadcast: boolean;
    destinationEndpoint: number;
}

export {
    Events, DeviceJoinedPayload, ZclDataPayload, DeviceAnnouncePayload, NetworkAddressPayload, DeviceLeavePayload,
};