import {Header as ZclHeader} from '../zspec/zcl';

export type DeviceJoinedPayload = {
    networkAddress: number;
    ieeeAddr: string;
};

export type DeviceLeavePayload = {networkAddress?: number; ieeeAddr: string} | {networkAddress: number; ieeeAddr?: string};

export interface ZclPayload {
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
