import type * as Zcl from "../../zspec/zcl";
import type {SendPolicy} from "../tstype";

// biome-ignore lint/suspicious/noExplicitAny: API
export class Request<Type = any> {
    static defaultSendPolicy: {[key: number]: SendPolicy} = {
        0: "keep-payload", // Read Attributes
        1: "immediate", // Read Attributes Response
        2: "keep-command", // Write Attributes
        3: "keep-cmd-undiv", // Write Attributes Undivided
        4: "immediate", // Write Attributes Response
        5: "keep-command", // Write Attributes No Response
        6: "keep-payload", // Configure Reporting
        7: "immediate", // Configure Reporting Response
        8: "keep-payload", // Read Reporting Configuration
        9: "immediate", // Read Reporting Configuration Response
        10: "keep-payload", // Report attributes
        11: "immediate", // Default Response
        12: "keep-payload", // Discover Attributes
        13: "immediate", // Discover Attributes Response
        14: "keep-payload", // Read Attributes Structured
        15: "keep-payload", // Write Attributes Structured
        16: "immediate", // Write Attributes Structured response
        17: "keep-payload", // Discover Commands Received
        18: "immediate", // Discover Commands Received Response
        19: "keep-payload", // Discover Commands Generated
        20: "immediate", // Discover Commands Generated Response
        21: "keep-payload", // Discover Attributes Extended
        22: "immediate", // Discover Attributes Extended Response
    };

    private func: () => Promise<Type>;
    frame: Zcl.Frame;
    expires: number;
    sendPolicy: SendPolicy | undefined;
    private resolveQueue: Array<(value: Type) => void>;
    private rejectQueue: Array<(error: Error) => void>;
    private lastError: Error;

    constructor(
        func: () => Promise<Type>,
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
        this.resolveQueue = resolve === undefined ? ([] as ((value: Type) => void)[]) : new Array<(value: Type) => void>(resolve);
        this.rejectQueue = reject === undefined ? ([] as ((error: Error) => void)[]) : new Array<(error: Error) => void>(reject);
        this.lastError = lastError ?? Error("Request rejected before first send");
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
        for (const el of this.rejectQueue) {
            el(error ?? this.lastError);
        }
        this.rejectQueue.length = 0;
    }

    resolve(value: Type): void {
        for (const el of this.resolveQueue) {
            el(value);
        }
        this.resolveQueue.length = 0;
    }

    async send(): Promise<Type> {
        try {
            const ret = await this.func();

            return ret;
        } catch (error) {
            this.lastError = error as Error;
            throw error;
        }
    }
}

export default Request;
