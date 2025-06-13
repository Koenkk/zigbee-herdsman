/* v8 ignore start */

import type {GenericZdoResponse} from "../../../zspec/zdo/definition/tstypes";

const PARAM = {
    STK: {
        Endpoint: 0x13,
    },
    APS: {
        MAX_SEND_TIMEOUT: 60000,
    },
    addressMode: {
        GROUP_ADDR: 0x01,
        NWK_ADDR: 0x02,
        IEEE_ADDR: 0x03,
        NWK_IEEE_ADDR: 0x04,
    },
    txRadius: {
        DEFAULT_RADIUS: 30,
        UNLIMITED: 0,
    },
};

export enum ApsAddressMode {
    Group = 0x01,
    Nwk = 0x02,
    Ieee = 0x03,
    NwkAndIeee = 0x04,
}

export enum ApsStatusCode {
    Success = 0x00,
    ApsNoAck = 0xa7,
    NwkRouteDiscoveryFailed = 0xd0,
    NwkRouteError = 0xd1,
    NwkBroadcastTableFull = 0xd2,
    MacNoChannelAccess = 0xe1,
    MacInvalidParameterStatus = 0xe8,
    MacNoAck = 0xe9,
    MacNoBeacon = 0xea,
    MacTransactionExpired = 0xf0,
}

export enum NwkBroadcastAddress {
    BroadcastAll = 0xffff,
    BroadcastLowPowerRouters = 0xfffb,
    BroadcastRouters = 0xfffc,
    BroadcastRxOnWhenIdle = 0xfffd,
}

export enum FirmwareCommand {
    Status = 0x07,
    StatusChangeIndication = 0x0e,
    FirmwareVersion = 0x0d,
    ReadParameter = 0x0a,
    WriteParameter = 0x0b,
    ChangeNetworkState = 0x08,
    Feature = 0x11,
    ApsDataRequest = 0x12,
    ApsDataConfirm = 0x04,
    ApsDataIndication = 0x17,
    ZgpDataIndication = 0x19,
    MacPollIndication = 0x1c,
    Reboot = 0x1e,
    Beacon = 0x1f,
}

export enum NetworkState {
    Disconnected = 0,
    Connecting = 1,
    Connected = 2,
    Disconnecting = 3,

    // only internal
    Ignore = 254,
    Unknown = 255,
}

export enum CommandStatus {
    Success = 0x00,
    Failure = 0x01,
    Busy = 0x02,
    Timeout = 0x03,
    Unsupported = 0x04,
    Error = 0x05,
    NoNetwork = 0x06,
    InvalidValue = 0x07,
}

export enum ParamId {
    MAC_ADDRESS = 0x01,
    NWK_PANID = 0x05,
    NWK_NETWORK_ADDRESS = 0x07,
    NWK_EXTENDED_PANID = 0x08,
    APS_DESIGNED_COORDINATOR = 0x09,
    APS_CHANNEL_MASK = 0x0a,
    APS_USE_EXTENDED_PANID = 0x0b,
    APS_TRUST_CENTER_ADDRESS = 0x0e,
    STK_ENDPOINT = 0x13,
    STK_PREDEFINED_PANID = 0x15,
    STK_STATIC_NETWORK_ADDRESS = 0x16,
    STK_NETWORK_KEY = 0x18,
    STK_LINK_KEY = 0x19,
    STK_CURRENT_CHANNEL = 0x1c,
    STK_PERMIT_JOIN = 0x21,
    STK_PROTOCOL_VERSION = 0x22,
    STK_NWK_UPDATE_ID = 0x24,
    DEV_WATCHDOG_TTL = 0x26,
    STK_FRAME_COUNTER = 0x27,
    // internal
    NONE = 0xff,
}

export enum DataType {
    Custom = 0,
    U8 = 1,
    U16 = 2,
    U32 = 3,
    U64 = 4,
    SecKey = 5,
}

export const stackParameters = [
    {id: ParamId.MAC_ADDRESS, type: DataType.U64},
    {id: ParamId.NWK_PANID, type: DataType.U16},
    {id: ParamId.STK_PROTOCOL_VERSION, type: DataType.U16},
    {id: ParamId.NWK_NETWORK_ADDRESS, type: DataType.U16},
    {id: ParamId.STK_NWK_UPDATE_ID, type: DataType.U8},
    {id: ParamId.STK_CURRENT_CHANNEL, type: DataType.U8},
    {id: ParamId.STK_STATIC_NETWORK_ADDRESS, type: DataType.U8},
    {id: ParamId.STK_PREDEFINED_PANID, type: DataType.U8},
    {id: ParamId.STK_NETWORK_KEY, type: [DataType.U8, DataType.SecKey], readArg: 1}, // index, key
    {id: ParamId.STK_LINK_KEY, type: [DataType.U64, DataType.SecKey], readArg: 1}, // mac addess, key
    {id: ParamId.DEV_WATCHDOG_TTL, type: DataType.U32},
    {id: ParamId.STK_PERMIT_JOIN, type: DataType.U8},
    {id: ParamId.NWK_EXTENDED_PANID, type: DataType.U64},
    {id: ParamId.APS_CHANNEL_MASK, type: DataType.U32},
    {id: ParamId.STK_FRAME_COUNTER, type: DataType.U32},
    {id: ParamId.APS_USE_EXTENDED_PANID, type: DataType.U64},
    {id: ParamId.APS_TRUST_CENTER_ADDRESS, type: DataType.U64},
];

interface Request {
    commandId: FirmwareCommand;
    networkState: NetworkState;
    parameterId: ParamId;
    parameter?: Buffer | number | bigint;
    seqNumber: number;
    // biome-ignore lint/suspicious/noExplicitAny: API
    resolve: (value: any) => void;
    reject: (value: Error) => void;
    ts: number; // time sent
}

interface ApsRequest {
    commandId: FirmwareCommand;
    request: ApsDataRequest;
    seqNumber: number;
    // biome-ignore lint/suspicious/noExplicitAny: API
    resolve: (value: any) => void;
    reject: (value: Error) => void;
    ts: number; // time sent
}

interface WaitForDataRequest {
    addr: number | string;
    profileId: number;
    clusterId: number;
    transactionSequenceNumber: number;
    resolve: (value: ReceivedDataResponse | PromiseLike<ReceivedDataResponse>) => void;
    reject: (value: Error) => void;
    ts: number;
    timeout: number;
}

interface ReceivedDataResponse {
    commandId: number;
    seqNr: number;
    status: number;
    frameLength: number;
    payloadLength: number;
    deviceState: number;
    destAddrMode: number;
    destAddr16: number;
    destAddr64?: string;
    destEndpoint: number;
    srcAddrMode: number;
    srcAddr16: number;
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

interface GpDataInd {
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
    timeout: number; // seconds
}

type Command = Buffer | number | bigint;

export type {ApsRequest, Request, WaitForDataRequest, ApsDataRequest, ReceivedDataResponse, DataStateResponse, Command, GpDataInd};

export default {PARAM};
