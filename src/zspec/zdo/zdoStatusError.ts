import {Status} from './definition/status';

export class ZdoStatusError extends Error {
    public code: number;

    constructor (code: number) {
        super(`Status '${Status[code]}'`);
        this.code = code;
    }
}
