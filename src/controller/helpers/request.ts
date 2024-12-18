import * as Zcl from '../../zspec/zcl';
import {SendPolicy} from '../tstype';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export class Request<Type = any> {
    static defaultSendPolicy: {[key: number]: SendPolicy} = {
        0x00: 'keep-payload', // Read Attributes
        0x01: 'immediate', // Read Attributes Response
        0x02: 'keep-command', // Write Attributes
        0x03: 'keep-cmd-undiv', // Write Attributes Undivided
        0x04: 'immediate', // Write Attributes Response
        0x05: 'keep-command', // Write Attributes No Response
        0x06: 'keep-payload', // Configure Reporting
        0x07: 'immediate', // Configure Reporting Response
        0x08: 'keep-payload', // Read Reporting Configuration
        0x09: 'immediate', // Read Reporting Configuration Response
        0x0a: 'keep-payload', // Report attributes
        0x0b: 'immediate', // Default Response
        0x0c: 'keep-payload', // Discover Attributes
        0x0d: 'immediate', // Discover Attributes Response
        0x0e: 'keep-payload', // Read Attributes Structured
        0x0f: 'keep-payload', // Write Attributes Structured
        0x10: 'immediate', // Write Attributes Structured response
        0x11: 'keep-payload', // Discover Commands Received
        0x12: 'immediate', // Discover Commands Received Response
        0x13: 'keep-payload', // Discover Commands Generated
        0x14: 'immediate', // Discover Commands Generated Response
        0x15: 'keep-payload', // Discover Attributes Extended
        0x16: 'immediate', // Discover Attributes Extended Response
    };

    private func: (frame: Zcl.Frame) => Promise<Type>;
    frame: Zcl.Frame;
    expires: number;
    sendPolicy: SendPolicy | undefined;
    private resolveQueue: Array<(value: Type) => void>;
    private rejectQueue: Array<(error: Error) => void>;
    private lastError: Error;

    constructor(
        func: (frame: Zcl.Frame) => Promise<Type>,
        frame: Zcl.Frame,
        timeout: number,
        sendPolicy?: SendPolicy,
        lastError?: Error,
        resolve?: (value: Type) => void,
        reject?: (error: Error) => void,
    ) {
        this.func = func;
        this.frame = frame;
        this.expires = timeout + Date.now();
        this.sendPolicy = sendPolicy ?? (!frame.command ? undefined : Request.defaultSendPolicy[frame.command.ID]);
        this.resolveQueue = resolve === undefined ? new Array<(value: Type) => void>() : new Array<(value: Type) => void>(resolve);
        this.rejectQueue = reject === undefined ? new Array<(error: Error) => void>() : new Array<(error: Error) => void>(reject);
        this.lastError = lastError ?? Error('Request rejected before first send');
    }

    moveCallbacks(from: Request<Type>): void {
        this.resolveQueue = this.resolveQueue.concat(from.resolveQueue);
        this.rejectQueue = this.rejectQueue.concat(from.rejectQueue);
        from.resolveQueue.length = 0;
        from.rejectQueue.length = 0;
    }

    addCallbacks(resolve: (value: Type) => void, reject: (error: Error) => void): void {
        this.resolveQueue.push(resolve);
        this.rejectQueue.push(reject);
    }

    reject(error?: Error): void {
        this.rejectQueue.forEach((el) => el(error ?? this.lastError));
        this.rejectQueue.length = 0;
    }

    resolve(value: Type): void {
        this.resolveQueue.forEach((el) => el(value));
        this.resolveQueue.length = 0;
    }

    async send(): Promise<Type> {
        try {
            return await this.func(this.frame);
        } catch (error) {
            this.lastError = error as Error;
            throw error;
        }
    }
}

export default Request;
