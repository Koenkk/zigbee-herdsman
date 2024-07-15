import {EzspStatus} from './enums';

export class EzspError extends Error {
    public code: EzspStatus;

    constructor(code: EzspStatus) {
        super(EzspStatus[code]);
        this.code = code;
    }
}
