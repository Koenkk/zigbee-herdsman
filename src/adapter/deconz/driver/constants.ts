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
        WriteParameter: 0x0b
    }
}

interface Request {
    parameterId?: number;
    seqNumber?: number;
    resolve?: Function;
    reject?: Function;
    ts?: number;
}

export { Request };

export default {PARAM};
