const PARAM: {
    [s: string]: {
        [s: string]: number;
    };
} = {
    Network: {
        MAC: 0x01,
        PAN_ID: 0x05,
        NWK_ADDRESS: 0x07,
        EXT_PAN_ID: 0x08,
        CHANNEL_MASK: 0x0a,
        CHANNEL: 0x1c,
        PERMIT_JOIN: 0x21
    },
    FrameType: {
        ReadDeviceState: 0x07,
        ReadParameter: 0x0a,
        WriteParameter: 0x0b,
        ReadFirmwareVersion: 0x0d,
        DeviceStateChanged: 0x0e
    },
    APS: {
        DATA_CONFIRM: 0x04,
        DATA_REQUEST: 0x12,
        DATA_INDICATION: 0x17
    },
    NetworkState: {
        NET_OFFLINE: 0x00,
        NET_JOINING: 0x01,
        NET_CONNECTED: 0x02,
        NET_LEAVING: 0x03,
        CHANGE_NETWORK_STATE: 0x08
    },
    addressMode: {
        GROUP_ADDR: 0x01,
        NWK_ADDR: 0x02,
        IEEE_ADDR: 0x03,
    },
    txRadius: {
        DEFAULT_RADIUS: 30,
        UNLIMITED: 0
    }

}

interface Request {
    commandId?: number;
    networkState?: number;
    parameterId?: number;
    parameter?: parameterT;
    request?: ApsDataRequest;
    seqNumber?: number;
    resolve?: Function;
    reject?: Function;
    ts?: number;
}

interface WaitForDataRequest {
    addr?: number;
    clusterId?: number;
    resolve?: Function;
    reject?: Function;
    ts?: number;
}

interface ReceivedDataResponse {
    commandId?: number;
    seqNr?: number;
    status?: number;
    frameLength?: number;
    payloadLength?: number;
    deviceState?: number;
    destAddrMode?: number;
    destAddr16?: number;
    destAddr64?: string;
    destEndpoint?: number;
    srcAddrMode?: number;
    srcAddr16?: number;
    srcAddr64?: string;
    srcEndpoint?: number;
    profileId?: number;
    clusterId?: number;
    asduLength?: number;
    asduPayload?: number[];
    lqi?: number;
    rssi?: number;
}

interface DataStateResponse {
    commandId?: number;
    seqNr?: number;
    status?: number;
    frameLength?: number;
    payloadLength?: number;
    deviceState?: number;
    requestId?: number;
    destAddrMode?: number;
    destAddr16?: number;
    destAddr64?: string;
    destEndpoint?: number;
    srcEndpoint?: number;
    confirmStatus?: number;
}

interface ApsDataRequest {
    requestId?: number;
    destAddrMode?: number;
    destAddr16?: number;
    destAddr64?: string; //number[];
    destEndpoint?: number;
    profileId?: number;
    clusterId?: number;
    srcEndpoint?: number;
    asduLength?: number;
    asduPayload?: number[];
    txOptions?: number;
    radius?: number;
}

type ParamMac = string;
type ParamPanId = number;
type ParamExtPanId = string;
type ParamNwkAddr = number;
type ParamChannel = number;
type ParamChannelMask = number;
type ParamPermitJoin = number;

type Command = ParamMac | ParamPanId | ParamNwkAddr | ParamExtPanId | ParamChannel | ParamChannelMask | ParamPermitJoin;
type parameterT = number | number[];

export { Request, WaitForDataRequest, ApsDataRequest, ReceivedDataResponse, DataStateResponse, parameterT , Command, ParamMac, ParamPanId, ParamNwkAddr, ParamExtPanId, ParamChannel, ParamChannelMask, ParamPermitJoin };

export default {PARAM};
