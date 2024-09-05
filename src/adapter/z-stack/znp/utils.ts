import assert from 'assert';

import {MtCmd, MtCmdAreqZdo} from './tstype';

export function isMtCmdAreqZdo(cmd: MtCmd): cmd is MtCmdAreqZdo {
    return 'zdo' in cmd;
}

export function assertIsMtCmdAreqZdo(cmd: MtCmd): asserts cmd is MtCmdAreqZdo {
    assert('zdo' in cmd, `'${cmd.name}' is not a MtCmdAreqZdo`);
}
