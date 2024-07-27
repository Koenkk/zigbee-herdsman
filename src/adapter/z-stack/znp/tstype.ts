import {ClusterId as ZdoClusterId} from '../../../zspec/zdo';
import ParameterType from './parameterType';

type MtType = number | number[] | string | Buffer | {[s: string]: number | string}[];

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

interface MtCmdZdo extends MtCmd {
    zdo: {cluterId: ZdoClusterId; skip: number};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZpiObjectPayload = any;

interface BuffaloZnpOptions {
    length?: number;
    startIndex?: number;
}

export {ZpiObjectPayload, MtParameter, MtCmd, MtType, BuffaloZnpOptions, MtCmdZdo};
