import {Header as ZclHeader} from '../zspec/zcl';

type DeviceJoinedPayload = {
    networkAddress: number;
    ieeeAddr: string;
};

type DeviceLeavePayload = {networkAddress?: number; ieeeAddr: string} | {networkAddress: number; ieeeAddr?: string};

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

export {DeviceJoinedPayload, ZclPayload, DeviceLeavePayload};
