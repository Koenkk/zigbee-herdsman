import {Status} from "./definition/status";

export class ZclStatusError extends Error {
    public code: Status;

    constructor(code: Status, details?: string) {
        super(`Status '${Status[code]}'${details ? ` ${details}` : ""}`);
        this.code = code;
    }
}
