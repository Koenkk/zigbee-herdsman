/* v8 ignore start */

import {GenericZdoResponse} from '../../../zspec/zdo/definition/tstypes';

const PARAM = {
    Network: {
        NET_OFFLINE: 0x00,
        NET_JOINING: 0x01,
        NET_CONNECTED: 0x02,
        NET_LEAVING: 0x03,
        MAC: 0x01,
        PAN_ID: 0x05,
        NWK_ADDRESS: 0x07,
        EXT_PAN_ID: 0x08,
        CHANNEL_MASK: 0x0a,
        APS_EXT_PAN_ID: 0x0b,
        NETWORK_KEY: 0x18,
        LINK_KEY: 0x19,
        CHANNEL: 0x1c,
        PERMIT_JOIN: 0x21,
        WATCHDOG_TTL: 0x26,
    },
    STK: {
        Endpoint: 0x13,
    },
    FrameType: {
        ReadDeviceState: 0x07,
        ReadParameter: 0x0a,
        WriteParameter: 0x0b,
        ReadFirmwareVersion: 0x0d,
        DeviceStateChanged: 0x0e,
        GreenPowerDataInd: 0x19,
    },
    APS: {
        DATA_CONFIRM: 0x04,
        DATA_REQUEST: 0x12,
        DATA_INDICATION: 0x17,
    },
    NetworkState: {
        NET_OFFLINE: 0x00,
        NET_JOINING: 0x01,
        NET_CONNECTED: 0x02,
        NET_LEAVING: 0x03,
        CHANGE_NETWORK_STATE: 0x08,
    },
    addressMode: {
        GROUP_ADDR: 0x01,
        NWK_ADDR: 0x02,
        IEEE_ADDR: 0x03,
    },
    txRadius: {
        DEFAULT_RADIUS: 30,
        UNLIMITED: 0,
    },
};

interface Request {
    commandId: number;
    networkState?: number;
    parameterId?: number;
    parameter?: parameterT;
    request?: ApsDataRequest;
    seqNumber: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: (value: any) => void;
    reject: (value: Error) => void;
    ts?: number;
}

interface WaitForDataRequest {
    addr: number | string;
    profileId: number;
    clusterId: number;
    transactionSequenceNumber?: number;
    resolve: (value: ReceivedDataResponse | PromiseLike<ReceivedDataResponse>) => void;
    reject: (value: Error) => void;
    ts?: number;
    timeout?: number;
}

interface ReceivedDataResponse {
    commandId: number;
    seqNr: number;
    status: number;
    frameLength: number;
    payloadLength: number;
    deviceState: number;
    destAddrMode: number;
    destAddr16?: number;
    destAddr64?: string;
    destEndpoint: number;
    srcAddrMode: number;
    srcAddr16?: number;
    srcAddr64?: string;
    srcEndpoint: number;
    profileId: number;
    clusterId: number;
    asduLength: number;
    asduPayload: Buffer;
    lqi: number;
    rssi: number;
    zdo?: GenericZdoResponse;
}

interface gpDataInd {
    rspId: number;
    seqNr: number;
    id: number;
    options: number;
    srcId: number;
    frameCounter: number;
    commandId: number;
    commandFrameSize: number;
    commandFrame: Buffer;
}

interface DataStateResponse {
    commandId: number;
    seqNr: number;
    status: number;
    frameLength: number;
    payloadLength: number;
    deviceState: number;
    requestId: number;
    destAddrMode: number;
    destAddr16?: number;
    destAddr64?: string;
    destEndpoint?: number;
    srcEndpoint: number;
    confirmStatus: number;
}

interface ApsDataRequest {
    requestId: number;
    destAddrMode: number;
    destAddr16?: number;
    destAddr64?: string; //number[];
    destEndpoint?: number;
    profileId: number;
    clusterId: number;
    srcEndpoint: number;
    asduLength: number;
    asduPayload: Buffer;
    txOptions: number;
    radius: number;
    timeout?: number; // seconds
}

type ParamMac = string;
type ParamPanId = number;
type ParamExtPanId = string;
type ParamNwkAddr = number;
type ParamChannel = number;
type ParamChannelMask = number;
type ParamPermitJoin = number;
type ParamNetworkKey = string;

type Command = ParamMac | ParamPanId | ParamNwkAddr | ParamExtPanId | ParamChannel | ParamChannelMask | ParamPermitJoin | ParamNetworkKey;
type parameterT = number | number[];

export {
    Request,
    WaitForDataRequest,
    ApsDataRequest,
    ReceivedDataResponse,
    DataStateResponse,
    parameterT,
    Command,
    ParamMac,
    ParamPanId,
    ParamNwkAddr,
    ParamExtPanId,
    ParamChannel,
    ParamChannelMask,
    ParamPermitJoin,
    ParamNetworkKey,
    gpDataInd,
};

export default {PARAM};
