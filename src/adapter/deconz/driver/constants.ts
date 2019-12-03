const PARAM: {
    [s: string]: {
        [s: string]: number;
    };
} = {
    Network: {
        MAC: 0x01,
        PAN_ID: 0x05,
        NWK_ADDRESS: 0x07
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
type ParamNwkAddr = number;

type Command = ParamMac | ParamPanId | ParamNwkAddr;
type parameterT = number | number[];

export { Request, parameterT , Command, ParamMac, ParamPanId, ParamNwkAddr};

export default {PARAM};
