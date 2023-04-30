import {SendRequestWhen, SendPolicy} from '../tstype';
import * as Zcl from '../../zcl';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
class Request<Type = any> {

    static defaultSendPolicy: {[key: number]: SendPolicy} = {
        0x00: 'keep-payload',   // Read Attributes
        0x01: 'immediate',      // Read Attributes Response
        0x02: 'keep-command',   // Write Attributes
        0x03: 'keep-cmd-undiv', // Write Attributes Undivided
        0x04: 'immediate',      // Write Attributes Response
        0x05: 'keep-command',   // Write Attributes No Response
        0x06: 'keep-payload',   // Configure Reporting
        0x07: 'immediate',      // Configure Reporting Response
        0x08: 'keep-payload',   // Read Reporting Configuration
        0x09: 'immediate',      // Read Reporting Configuration Response
        0x0a: 'keep-payload',   // Report attributes
        0x0b: 'immediate',      // Default Response
        0x0c: 'keep-payload',   // Discover Attributes
        0x0d: 'immediate',      // Discover Attributes Response
        0x0e: 'keep-payload',   // Read Attributes Structured
        0x0f: 'keep-payload',   // Write Attributes Structured
        0x10: 'immediate',      // Write Attributes Structured response
        0x11: 'keep-payload',   // Discover Commands Received
        0x12: 'immediate',      // Discover Commands Received Response
        0x13: 'keep-payload',   // Discover Commands Generated
        0x14: 'immediate',      // Discover Commands Generated Response
        0x15: 'keep-payload',   // Discover Attributes Extended
        0x16: 'immediate',      // Discover Attributes Extended Response
    };

    private _func: (frame: Zcl.ZclFrame) => Promise<Type>;
    frame: Zcl.ZclFrame;
    expires: number;
    sendPolicy: SendPolicy;
    sendWhen: SendRequestWhen;
    private _resolveQueue: Array<(value: Type) => void>;
    private _rejectQueue: Array <(error: Error) => void>;
    private _lastError: Error;
    constructor (func: (frame: Zcl.ZclFrame) => Promise<Type>, frame: Zcl.ZclFrame, timeout: number,
        sendWhen?: SendRequestWhen, sendPolicy?: SendPolicy, lastError?: Error,
        resolve?:(value: Type) => void, reject?: (error: Error) => void) {
        this._func = func;
        this.frame = frame;
        this.sendWhen = sendWhen ?? 'active',
        this.expires =  timeout + Date.now();
        this.sendPolicy = sendPolicy ?? (typeof frame.getCommand !== 'function' ?
            undefined : Request.defaultSendPolicy[frame.getCommand().ID]);
        this._resolveQueue = resolve === undefined ?
            new Array<(value: Type) => void>() : new Array<(value: Type) => void>(resolve);
        this._rejectQueue = reject === undefined ?
            new Array<(error: Error) => void>() : new Array<(error: Error) => void>(reject);
        this._lastError = lastError ?? Error("Request rejected before first send");
    }

    addCallbacks(resolve: (value: Type) => void, reject: (error: Error) => void): void {
        this._resolveQueue.push(resolve);
        this._rejectQueue.push(reject);
    }

    reject(error?: Error): void {
        this._rejectQueue.forEach(el => el(error ?? this._lastError));
        this._rejectQueue.length = 0;
    }

    resolve(value: Type): void {
        this._resolveQueue.forEach(el => el(value));
        this._resolveQueue.length = 0;
    }

    async send(): Promise<Type> {
        try {
            return await this._func(this.frame);
        } catch (error) {
            this._lastError = error;
            throw (error);
        }
    }
}

export default Request;