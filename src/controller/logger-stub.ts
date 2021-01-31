/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LoggerStub {
    error: (message: string, ...meta: any[]) => void;
    warn: (message: string, ...meta: any[]) => void;
    info: (message: string, ...meta: any[]) => void;
    debug: (message: string, ...meta: any[]) => void;
}
