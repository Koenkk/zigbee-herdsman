import assert from "node:assert";
import {EventEmitter} from "node:events";
import {Waitress, wait} from "../../../utils";
import {AsyncMutex} from "../../../utils/async-mutex";
import {logger} from "../../../utils/logger";
import {ClusterId as ZdoClusterId} from "../../../zspec/zdo";
import type {AdapterTransport} from "../../transport";
import * as Constants from "../constants";
import {Frame as UnpiFrame} from "../unpi";
import {DataStart, MinMessageLength, PositionDataLength, SOF, Subsystem, Type} from "../unpi/constants";
import Definition from "./definition";
import type {ZpiObjectPayload} from "./tstype";
import {isMtCmdSreqZdo} from "./utils";
import {ZpiObject} from "./zpiObject";

const {
    COMMON: {ZnpCommandStatus},
    Utils: {statusDescription},
} = Constants;

const timeouts = {
    SREQ: 6000,
    reset: 30000,
    default: 10000,
};

const NS = "zh:zstack:znp";

interface WaitressMatcher {
    type: Type;
    subsystem: Subsystem;
    command: string;
    target?: number | string;
    transid?: number;
    state?: number;
}

interface ZnpEventMap {
    received: [obj: ZpiObject<"Response">];
}

export class Znp extends EventEmitter<ZnpEventMap> {
    private readonly transport: AdapterTransport;
    private inputBuffer = Buffer.alloc(0);
    private queue: AsyncMutex;
    private waitress: Waitress<ZpiObject, WaitressMatcher>;

    public constructor(transport: AdapterTransport) {
        super();

        this.transport = transport;
        this.queue = new AsyncMutex();
        this.waitress = new Waitress<ZpiObject, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);

        this.transport.on("data", this.onTransportData.bind(this));
    }

    private onTransportData(chunk: Buffer): void {
        this.inputBuffer = Buffer.concat([this.inputBuffer, chunk]);

        if (this.inputBuffer.length > 0 && this.inputBuffer[0] !== SOF) {
            // Buffer doesn't start with SOF, skip till SOF.
            const start = this.inputBuffer.indexOf(SOF);

            if (start > -1) {
                this.inputBuffer = this.inputBuffer.subarray(start);
            }
        }

        while (this.inputBuffer.length >= MinMessageLength && this.inputBuffer[0] === SOF) {
            const dataLength = this.inputBuffer[PositionDataLength];
            const fcsPosition = DataStart + dataLength;
            const frameLength = fcsPosition + 1;

            if (this.inputBuffer.length < frameLength) {
                return;
            }

            this.onFrame(this.inputBuffer.subarray(0, frameLength), dataLength, fcsPosition);

            this.inputBuffer = this.inputBuffer.subarray(frameLength);

            if (this.inputBuffer.length > 0 && this.inputBuffer[0] !== SOF) {
                // Buffer doesn't start with SOF, skip till SOF.
                const start = this.inputBuffer.indexOf(SOF);

                if (start > -1) {
                    this.inputBuffer = this.inputBuffer.subarray(start);
                }
            }
        }
    }

    private onFrame(buffer: Buffer, dataLength: number, fcsPosition: number) {
        try {
            const frame = UnpiFrame.fromBuffer(dataLength, fcsPosition, buffer);

            try {
                const object = ZpiObject.fromUnpiFrame(frame);

                logger.debug(() => `<-- ${object.toString(object.subsystem !== Subsystem.ZDO)}`, NS);
                this.waitress.resolve(object);
                this.emit("received", object);
            } catch (error) {
                logger.error(`Error while parsing to ZpiObject '${error}'`, NS);
            }
        } catch (error) {
            logger.debug(() => `--> error ${error}`, NS);
        }
    }

    public async open(): Promise<void> {
        await this.transport.open(true);
        await this.skipBootloader();
    }

    private async skipBootloader(): Promise<void> {
        try {
            await this.request(Subsystem.SYS, "ping", {capabilities: 1}, undefined, 250);
        } catch {
            // Skip bootloader on CC2530/CC2531
            // Send magic byte: https://github.com/Koenkk/zigbee2mqtt/issues/1343 to bootloader
            // and give ZNP 1 second to start.
            try {
                logger.info("Writing CC2530/CC2531 skip bootloader payload", NS);
                this.transport.write(Buffer.from([0xef]));
                await wait(1000);
                await this.request(Subsystem.SYS, "ping", {capabilities: 1}, undefined, 250 /* v8 ignore next */);
            } catch {
                // Skip bootloader on some CC2652 devices (e.g. zzh-p)
                logger.info("Skip bootloader for CC2652/CC1352", NS);
                if (this.transport.isSerial) {
                    await this.transport.set({dtr: false, rts: false});
                    await wait(150);
                    await this.transport.set({dtr: false, rts: true});
                    await wait(150);
                    await this.transport.set({dtr: false, rts: false});
                    await wait(150);
                }
            }
        }
    }

    public async close(): Promise<void> {
        logger.info("closing", NS);
        this.queue.clear();
        await this.transport.close();
    }

    public async requestWithReply(
        subsystem: Subsystem,
        command: string,
        payload: ZpiObjectPayload,
        waiterID?: number,
        timeout?: number,
        expectedStatuses: Constants.COMMON.ZnpCommandStatus[] = [ZnpCommandStatus.SUCCESS],
    ): Promise<ZpiObject> {
        const reply = await this.request(subsystem, command, payload, waiterID, timeout, expectedStatuses);
        if (reply === undefined) {
            throw new Error(`Command ${command} has no reply`);
        }
        return reply;
    }

    public request(
        subsystem: Subsystem,
        command: string,
        payload: ZpiObjectPayload,
        waiterID?: number,
        timeout?: number,
        expectedStatuses: Constants.COMMON.ZnpCommandStatus[] = [ZnpCommandStatus.SUCCESS],
    ): Promise<ZpiObject | undefined> {
        if (!this.transport.isOpen) {
            throw new Error("Cannot request when znp has not been initialized yet");
        }

        const object = ZpiObject.createRequest(subsystem, command, payload);

        return this.queue.run<ZpiObject | undefined>(async () => {
            logger.debug(() => `--> ${object}`, NS);

            if (object.type === Type.SREQ) {
                const t = object.command.name === "bdbStartCommissioning" || object.command.name === "startupFromApp" ? 40000 : timeouts.SREQ;
                const waiter = this.waitress.waitFor({type: Type.SRSP, subsystem: object.subsystem, command: object.command.name}, timeout || t);
                this.transport.write(object.unpiFrame.toBuffer());
                const result = await waiter.start().promise;
                if (result?.payload.status !== undefined && !expectedStatuses.includes(result.payload.status)) {
                    if (typeof waiterID === "number") {
                        this.waitress.remove(waiterID);
                    }

                    throw new Error(
                        `--> '${object}' failed with status '${statusDescription(
                            result.payload.status,
                        )}' (expected '${expectedStatuses.map(statusDescription)}')`,
                    );
                }

                return result;
            }

            if (object.type === Type.AREQ && object.isResetCommand()) {
                const waiter = this.waitress.waitFor({type: Type.AREQ, subsystem: Subsystem.SYS, command: "resetInd"}, timeout || timeouts.reset);
                this.queue.clear();
                this.transport.write(object.unpiFrame.toBuffer());
                return await waiter.start().promise;
            }

            if (object.type === Type.AREQ) {
                this.transport.write(object.unpiFrame.toBuffer());
                /* v8 ignore start */
            } else {
                throw new Error(`Unknown type '${object.type}'`);
            }
            /* v8 ignore stop */
        });
    }

    public requestZdo(clusterId: ZdoClusterId, payload: Buffer, waiterID?: number): Promise<void> {
        return this.queue.run(async () => {
            const cmd = Definition[Subsystem.ZDO].find((c) => isMtCmdSreqZdo(c) && c.zdoClusterId === clusterId);
            assert(cmd, `Command for ZDO cluster ID '${clusterId}' not supported.`);

            const unpiFrame = new UnpiFrame(Type.SREQ, Subsystem.ZDO, cmd.ID, payload);
            const waiter = this.waitress.waitFor({type: Type.SRSP, subsystem: Subsystem.ZDO, command: cmd.name}, timeouts.SREQ);

            this.transport.write(unpiFrame.toBuffer());

            const result = await waiter.start().promise;

            if (result?.payload.status !== undefined && result.payload.status !== ZnpCommandStatus.SUCCESS) {
                if (waiterID !== undefined) {
                    this.waitress.remove(waiterID);
                }

                throw new Error(
                    `--> 'SREQ: ZDO - ${ZdoClusterId[clusterId]} - ${payload.toString("hex")}' failed with status '${statusDescription(result.payload.status)}'`,
                );
            }
        });
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return `${Type[matcher.type]} - ${Subsystem[matcher.subsystem]} - ${matcher.command} after ${timeout}ms`;
    }

    public waitFor(
        type: Type,
        subsystem: Subsystem,
        command: string,
        target: number | string | undefined,
        transid: number | undefined,
        state: number | undefined,
        timeout: number = timeouts.default,
    ): {start: () => {promise: Promise<ZpiObject>; ID: number}; ID: number} {
        return this.waitress.waitFor({type, subsystem, command, target, transid, state}, timeout);
    }

    private waitressValidator(zpiObject: ZpiObject, matcher: WaitressMatcher): boolean {
        return (
            matcher.type === zpiObject.type &&
            matcher.subsystem === zpiObject.subsystem &&
            matcher.command === zpiObject.command.name &&
            (matcher.target === undefined ||
                (typeof matcher.target === "number"
                    ? matcher.target === zpiObject.payload.srcaddr
                    : matcher.target === zpiObject.payload.zdo?.[1]?.eui64)) &&
            (matcher.transid === undefined || matcher.transid === zpiObject.payload.transid) &&
            (matcher.state === undefined || matcher.state === zpiObject.payload.state)
        );
    }
}
