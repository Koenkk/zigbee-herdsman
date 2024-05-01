import Status from './definition/status';

class ZclStatusError extends Error {
    public code: number;

    constructor (code: number) {
        super(`Status '${Status[code]}'`);
        this.code = code;
    }
}

export default ZclStatusError;
