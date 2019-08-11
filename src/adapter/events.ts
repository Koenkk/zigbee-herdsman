import {ZclFrame} from '../zcl';

enum Events {
    DeviceJoined = "DeviceJoined",
    ZclData = "ZclData",
}

interface DeviceJoinedPayload {
    networkAddress: number;
    ieeeAddr: string;
}

interface ZclDataPayload {
    networkAddress: number;
    frame: ZclFrame;
    endpoint: number;
    linkQuality: number;
}

export {
    Events, DeviceJoinedPayload, ZclDataPayload,
}