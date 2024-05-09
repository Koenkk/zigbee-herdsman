import ParameterType from './parameterType';

type MtType = number|number[]|string|Buffer|{[s: string]: number|string}[];

interface MtParameter {
    name: string;
    parameterType: ParameterType;
}

interface MtCmd {
    name: string;
    ID: number;
    type: number;
    request?: MtParameter[];
    response?: MtParameter[];
}

// eslint-disable-next-line
type ZpiObjectPayload = any;

interface BuffaloZnpOptions {
    length?: number;
    startIndex?: number;
}

export {ZpiObjectPayload, MtParameter, MtCmd, MtType, BuffaloZnpOptions};
