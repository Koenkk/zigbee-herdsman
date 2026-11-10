import {EventEmitter} from "node:events";
import {AsyncMutex} from "../../utils/async-mutex";
import {logger} from "../../utils/logger";
import type {AdapterTransport} from "../transport";
import {APS_CONFIRM_TIMEOUT_MS, CommandId, EspZbStatus, FrameType, REQUEST_RETRIES, REQUEST_TIMEOUT_MS} from "./consts";
import {type EspZbFrame, encodeFrame, FrameDecoder} from "./frame";

const NS = "zh:espzb:driver";

/** Printable command name (unknown IDs as hex). */
export const cmdName = (id: number): string => CommandId[id] ?? `0x${id.toString(16).padStart(4, "0")}`;

export class EspZbStatusError extends Error {
    public readonly status: EspZbStatus;
    public readonly commandId: CommandId;

    constructor(commandId: CommandId, status: EspZbStatus) {
        super(`${cmdName(commandId)} failed with status ${EspZbStatus[status] ?? `0x${status.toString(16)}`}`);
        this.status = status;
        this.commandId = commandId;
    }
}

export interface ApsDataRequest {
    dstMode: number;
    /** short / group address (modes 1, 2) or EUI-64 little-endian (mode 3) */
    dst: number | Buffer;
    dstEndpoint: number;
    srcEndpoint: number;
    profileId: number;
    clusterId: number;
    txOptions: number;
    radius: number;
    asdu: Buffer;
}

interface PendingRequest {
    id: number;
    sn: number;
    wire: Buffer;
    resolve: (frame: EspZbFrame) => void;
    reject: (error: Error) => void;
    resend: () => void;
}

interface EspZbDriverEventMap {
    notify: [frame: EspZbFrame];
}

/**
 * Transaction layer on top of the adapter's serial or TCP transport: SLIP framing, one outstanding request at a time,
 * retransmission with the same sequence number (the NCP answers duplicates from its response cache, so execution is
 * at-most-once), sequence numbers of in-flight APS requests are reserved until their confirm arrives.
 */
export class EspZbDriver extends EventEmitter<EspZbDriverEventMap> {
    public requestTimeout = REQUEST_TIMEOUT_MS;
    public requestRetries = REQUEST_RETRIES;

    readonly #transport: AdapterTransport;
    readonly #decoder: FrameDecoder;
    readonly #mutex = new AsyncMutex();
    #pending?: PendingRequest;
    #sn = 0;
    /** sn -> confirm resolver for APS requests awaiting APSDE-DATA.confirm */
    readonly #apsConfirms = new Map<number, {resolve: (status: number) => void; timer: NodeJS.Timeout}>();
    #lastRx = Date.now();
    #lastNotifySn?: number;
    /** notifications lost in transit, detected from gaps in the NCP notification counter */
    public lostNotifications = 0;

    constructor(transport: AdapterTransport) {
        super();
        this.#transport = transport;
        this.#decoder = new FrameDecoder(
            (frame) => this.#onFrame(frame),
            (reason) => logger.debug(`Dropped malformed frame (${reason})`, NS),
        );
        this.#transport.on("data", (data) => this.#decoder.push(data));
        // `Adapter` emits `disconnected` for this
        this.#transport.on("close", () => {
            logger.info("Port closed", NS);
            this.#failAll(new Error("Port closed"));
        });
    }

    /** Milliseconds since the last frame from the NCP. */
    public get idleMs(): number {
        return Date.now() - this.#lastRx;
    }

    public get apsInflight(): number {
        return this.#apsConfirms.size;
    }

    public async connect(): Promise<void> {
        this.#decoder.reset();
        this.resetNotifySequence();
        logger.info(`Opening ${this.#transport.options.path}`, NS);
        // binary SLIP frames: no XON/XOFF software flow control
        await this.#transport.open(true);
    }

    public async disconnect(): Promise<void> {
        this.#failAll(new Error("Driver stopped"));

        try {
            await this.#transport.close();
        } catch (error) {
            logger.debug(`Failed to close transport: ${error}`, NS);
        }
    }

    /** Test hook: feed received bytes. */
    public receive(data: Buffer): void {
        this.#decoder.push(data);
    }

    /** Test hook: override byte output. */
    public writer: (data: Buffer) => void = (data) => {
        this.#transport.write(data);
    };

    #failAll(error: Error): void {
        this.#pending?.reject(error);
        this.#pending = undefined;

        for (const [sn, entry] of this.#apsConfirms) {
            clearTimeout(entry.timer);
            this.#apsConfirms.delete(sn);
            entry.resolve(0xff);
        }
    }

    #nextSn(): number {
        for (let i = 0; i < 255; i++) {
            const sn = this.#sn;
            this.#sn = (this.#sn + 1) % 255;

            if (!this.#apsConfirms.has(sn)) {
                return sn;
            }
        }

        throw new Error("No free sequence number");
    }

    /**
     * Send a request and return the response payload after the status byte.
     * Throws EspZbStatusError on a non-SUCCESS status, Error on timeout.
     */
    public async request(id: CommandId, payload: Buffer = Buffer.alloc(0)): Promise<Buffer> {
        const response = await this.#mutex.run(() => this.#transact(id, this.#nextSn(), payload));

        if (response.payload.length === 0) {
            throw new Error(`${cmdName(id)}: empty response`);
        }

        const status = response.payload[0] as EspZbStatus;

        if (status !== EspZbStatus.SUCCESS) {
            throw new EspZbStatusError(id, status);
        }

        return response.payload.subarray(1);
    }

    /**
     * Submit an APS data request. Resolves once the NCP accepted it, with a promise for the APSDE-DATA.confirm status
     * (wrapped in an object: a returned promise would be flattened and resolve only on confirm).
     * The confirm waiter is registered before sending (a confirm may overtake the response).
     */
    public async apsDataRequest(req: ApsDataRequest): Promise<{confirm: Promise<number>}> {
        return await this.#mutex.run(async () => {
            const sn = this.#nextSn();
            // registered before sending: the confirm may overtake the response
            const confirm = new Promise<number>((resolve) => {
                const timer = setTimeout(() => {
                    this.#apsConfirms.delete(sn);
                    logger.debug(`APS confirm timeout sn=${sn}`, NS);
                    resolve(0xff);
                }, APS_CONFIRM_TIMEOUT_MS);
                this.#apsConfirms.set(sn, {resolve, timer});
            });
            const release = (): void => {
                clearTimeout(this.#apsConfirms.get(sn)?.timer);
                this.#apsConfirms.delete(sn);
            };

            let response: EspZbFrame;

            try {
                response = await this.#transact(CommandId.APS_DATA_REQUEST, sn, encodeApsDataRequest(req));
            } catch (error) {
                release();
                throw error;
            }

            const status = response.payload[0] as EspZbStatus;

            if (status !== EspZbStatus.SUCCESS) {
                release();
                throw new EspZbStatusError(CommandId.APS_DATA_REQUEST, status);
            }

            return {confirm};
        });
    }

    async #transact(id: CommandId, sn: number, payload: Buffer): Promise<EspZbFrame> {
        const wire = encodeFrame({version: 0, type: FrameType.REQUEST, id, sn, payload});

        return await new Promise<EspZbFrame>((resolve, reject) => {
            let attempts = 0;
            let timer: NodeJS.Timeout | undefined;
            const finish = (): void => {
                clearTimeout(timer);

                if (this.#pending === pending) {
                    this.#pending = undefined;
                }
            };
            const send = (): void => {
                clearTimeout(timer);

                if (attempts > this.requestRetries) {
                    finish();
                    reject(new Error(`${cmdName(id)} (sn=${sn}): no response after ${attempts} attempts`));
                    return;
                }

                if (attempts > 0) {
                    logger.debug(`Retransmitting ${cmdName(id)} sn=${sn} (attempt ${attempts + 1})`, NS);
                }

                attempts++;
                timer = setTimeout(send, this.requestTimeout);

                try {
                    this.writer(wire);
                } catch (error) {
                    finish();
                    reject(error as Error);
                }
            };
            const pending: PendingRequest = {
                id,
                sn,
                wire,
                resolve: (frame) => {
                    finish();
                    resolve(frame);
                },
                reject: (error) => {
                    finish();
                    reject(error);
                },
                resend: send,
            };
            this.#pending = pending;
            logger.debug(() => `--> ${cmdName(id)} sn=${sn} ${payload.toString("hex")}`, NS);
            send();
        });
    }

    #onFrame(frame: EspZbFrame): void {
        this.#lastRx = Date.now();

        if (frame.type === FrameType.RESPONSE) {
            const pending = this.#pending;

            if (pending && pending.sn === frame.sn && pending.id === frame.id) {
                logger.debug(() => `<-- ${cmdName(frame.id)} sn=${frame.sn} ${frame.payload.toString("hex")}`, NS);
                pending.resolve(frame);
            } else {
                logger.debug(`Ignoring stale response ${cmdName(frame.id)} sn=${frame.sn}`, NS);
            }

            return;
        }

        if (frame.type !== FrameType.NOTIFY) {
            return;
        }

        if (frame.id !== CommandId.APS_DATA_CONFIRM) {
            this.#checkNotifySequence(frame);
        }

        if (frame.id === CommandId.APS_DATA_CONFIRM) {
            const entry = this.#apsConfirms.get(frame.sn);

            if (entry) {
                clearTimeout(entry.timer);
                this.#apsConfirms.delete(frame.sn);
                entry.resolve(frame.payload.length > 16 ? frame.payload[16] : 0xff);
            } else {
                logger.debug(`APS confirm for unknown sn=${frame.sn}`, NS);
            }

            return;
        }

        if (frame.id === CommandId.EXT_FRAME_ERROR && this.#pending) {
            // the NCP saw a corrupted frame: retransmit the outstanding request right away
            this.#pending.resend();
        }

        this.emit("notify", frame);
    }

    /** Notifications (except APS confirms, which carry the request sn) are numbered 0..254 by the NCP. */
    #checkNotifySequence(frame: EspZbFrame): void {
        if (frame.id === CommandId.EXT_BOOT) {
            this.#lastNotifySn = frame.sn;
            return;
        }

        if (this.#lastNotifySn !== undefined) {
            const expected = (this.#lastNotifySn + 1) % 255;

            if (frame.sn !== expected) {
                const lost = (frame.sn - expected + 255) % 255;
                this.lostNotifications += lost;
                logger.warning(`${lost} notification(s) from the NCP lost (link errors?), total ${this.lostNotifications}`, NS);
            }
        }

        this.#lastNotifySn = frame.sn;
    }

    /** Forget the notification counter (new connection: the NCP may have sent notifications meanwhile). */
    public resetNotifySequence(): void {
        this.#lastNotifySn = undefined;
    }
}

export function encodeApsDataRequest(req: ApsDataRequest): Buffer {
    const buf = Buffer.alloc(31 + req.asdu.length);

    if (typeof req.dst === "number") {
        buf.writeUInt16LE(req.dst, 0);
    } else {
        req.dst.copy(buf, 0, 0, 8);
    }

    buf[8] = req.dstEndpoint;
    buf[9] = req.srcEndpoint;
    buf[10] = req.dstMode;
    buf.writeUInt16LE(req.profileId, 11);
    buf.writeUInt16LE(req.clusterId, 13);
    buf[15] = req.txOptions;
    buf[16] = 0; // use alias
    // 17..24 alias src addr, 25 alias seq: zero
    buf[26] = req.radius;
    buf.writeUInt32LE(req.asdu.length, 27);
    req.asdu.copy(buf, 31);

    return buf;
}

export interface ApsDataIndication {
    dstMode: number;
    dstAddr: number;
    dstEndpoint: number;
    srcMode: number;
    srcShort: number;
    srcIeee?: Buffer;
    srcEndpoint: number;
    profileId: number;
    clusterId: number;
    status: number;
    lqi: number;
    rssi: number;
    asdu: Buffer;
}

export function decodeApsDataIndication(p: Buffer): ApsDataIndication {
    if (p.length < 36) {
        throw new Error(`APS indication too short (${p.length})`);
    }

    const asduLength = p.readUInt32LE(32);

    if (p.length < 36 + asduLength) {
        throw new Error(`APS indication truncated (${p.length} < ${36 + asduLength})`);
    }

    const srcMode = p[11];

    return {
        dstMode: p[1],
        dstAddr: p.readUInt16LE(2),
        dstEndpoint: p[10],
        srcMode,
        srcShort: srcMode === 3 ? 0xfffe : p.readUInt16LE(12),
        srcIeee: srcMode === 3 ? Buffer.from(p.subarray(12, 20)) : undefined,
        srcEndpoint: p[20],
        profileId: p.readUInt16LE(21),
        clusterId: p.readUInt16LE(23),
        status: p[25],
        lqi: p[27],
        rssi: p.readInt8(28),
        asdu: Buffer.from(p.subarray(36, 36 + asduLength)),
    };
}
