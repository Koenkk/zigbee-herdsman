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
        CHANNEL: 0x1c
    },
    FrameType: {
        ReadParameter: 0x0a,
        WriteParameter: 0x0b,
        ReadFirmwareVersion: 0x0d
    }
}

interface Request {
    commandId?: number;
    parameterId?: number;
    parameter?: parameterT;
    seqNumber?: number;
    resolve?: Function;
    reject?: Function;
    ts?: number;
}

type ParamMac = string;
type ParamPanId = number;
type ParamExtPanId = string;
type ParamNwkAddr = number;
type ParamChannel = number;
type ParamChannelMask = number;

type Command = ParamMac | ParamPanId | ParamNwkAddr | ParamExtPanId | ParamChannel |ParamChannelMask;
type parameterT = number | number[];

export { Request, parameterT , Command, ParamMac, ParamPanId, ParamNwkAddr, ParamExtPanId, ParamChannel, ParamChannelMask };

export default {PARAM};
