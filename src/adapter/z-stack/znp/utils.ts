import {Type} from '../unpi/constants';
import {MtCmd, MtCmdAreqZdo, MtCmdSreqZdo} from './tstype';

export function isMtCmdAreqZdo(cmd: MtCmd): cmd is MtCmdAreqZdo {
    return cmd.type === Type.AREQ && 'zdoClusterId' in cmd;
}

export function isMtCmdSreqZdo(cmd: MtCmd): cmd is MtCmdSreqZdo {
    return cmd.type === Type.SREQ && 'zdoClusterId' in cmd;
}
