import {ClusterId as ZdoClusterId} from '../../../zspec/zdo';
import {Type as CommandType} from '../unpi/constants';
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

interface MtCmdZdoReq extends MtCmd {
    type: CommandType.SREQ;
}

interface MtCmdZdoResp extends Omit<MtCmd, 'request'> {
    zdo: {cluterId: ZdoClusterId; convert: (buffer: Buffer) => Buffer};
    type: CommandType.AREQ;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZpiObjectPayload = any;

interface BuffaloZnpOptions {
    length?: number;
    startIndex?: number;
}

export {ZpiObjectPayload, MtParameter, MtCmd, MtType, BuffaloZnpOptions, MtCmdZdoReq, MtCmdZdoResp};
