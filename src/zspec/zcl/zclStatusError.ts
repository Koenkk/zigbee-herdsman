import {Status} from './definition/status';

export class ZclStatusError extends Error {
    public code: Status;

    constructor(code: Status) {
        super(`Status '${Status[code]}'`);
        this.code = code;
    }
}
