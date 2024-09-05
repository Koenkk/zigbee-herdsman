import {MtCmd, MtCmdAreqZdo} from './tstype';

export function isMtCmdAreqZdo(cmd: MtCmd): cmd is MtCmdAreqZdo {
    return 'zdo' in cmd;
}
