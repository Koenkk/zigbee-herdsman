/**
 * espzb / ZNSP framing: SLIP (RFC 1055) around `ctrl(1) reserved(1) id(2) sn(1) len(2) payload(len) crc16(2)`.
 * CRC-16: poly 0x1021 reflected, init 0x0000, xorout 0xFFFF (= ESP ROM `crc16_le(0xFFFF, ...)`), check 0xDE76.
 */
import {FrameType, type FrameTypeValue} from "./consts";

const SLIP_END = 0xc0;
const SLIP_ESC = 0xdb;
const SLIP_ESC_END = 0xdc;
const SLIP_ESC_ESC = 0xdd;

const HEADER_SIZE = 7;
const CRC_SIZE = 2;

export interface EspZbFrame {
    version: number;
    type: FrameTypeValue;
    id: number;
    sn: number;
    payload: Buffer;
}

export type FrameDecodeError = "crc" | "length" | "type" | "escape" | "overflow";

export function crc16(data: Uint8Array, start = 0, end = data.length): number {
    let crc = 0x0000;

    for (let i = start; i < end; i++) {
        crc ^= data[i];

        for (let b = 0; b < 8; b++) {
            crc = crc & 1 ? (crc >>> 1) ^ 0x8408 : crc >>> 1;
        }
    }

    return ~crc & 0xffff;
}

export function encodeFrame(frame: EspZbFrame): Buffer {
    const raw = Buffer.alloc(HEADER_SIZE + frame.payload.length + CRC_SIZE);
    raw[0] = (frame.version & 0x0f) | ((frame.type & 0x0f) << 4);
    raw[1] = 0;
    raw.writeUInt16LE(frame.id, 2);
    raw[4] = frame.sn;
    raw.writeUInt16LE(frame.payload.length, 5);
    frame.payload.copy(raw, HEADER_SIZE);
    raw.writeUInt16LE(crc16(raw, 0, HEADER_SIZE + frame.payload.length), HEADER_SIZE + frame.payload.length);

    const out: number[] = [SLIP_END];

    for (const b of raw) {
        if (b === SLIP_END) {
            out.push(SLIP_ESC, SLIP_ESC_END);
        } else if (b === SLIP_ESC) {
            out.push(SLIP_ESC, SLIP_ESC_ESC);
        } else {
            out.push(b);
        }
    }

    out.push(SLIP_END);

    return Buffer.from(out);
}

export function decodeRawFrame(raw: Buffer): EspZbFrame | FrameDecodeError {
    if (raw.length < HEADER_SIZE + CRC_SIZE) {
        return "length";
    }

    const len = raw.readUInt16LE(5);

    if (raw.length !== HEADER_SIZE + len + CRC_SIZE) {
        return "length";
    }

    if (raw.readUInt16LE(HEADER_SIZE + len) !== crc16(raw, 0, HEADER_SIZE + len)) {
        return "crc";
    }

    const type = raw[0] >> 4;

    if (type > FrameType.NOTIFY) {
        return "type";
    }

    return {
        version: raw[0] & 0x0f,
        type: type as FrameTypeValue,
        id: raw.readUInt16LE(2),
        sn: raw[4],
        payload: Buffer.from(raw.subarray(HEADER_SIZE, HEADER_SIZE + len)),
    };
}

/** Incremental SLIP decoder; tolerant to line noise and arbitrary chunking. */
export class FrameDecoder {
    readonly #maxRawSize: number;
    readonly #onFrame: (frame: EspZbFrame) => void;
    readonly #onError: (reason: FrameDecodeError) => void;
    #buffer: number[] = [];
    #escaped = false;
    #discard = false;

    constructor(onFrame: (frame: EspZbFrame) => void, onError: (reason: FrameDecodeError) => void, maxPayload = 2048) {
        this.#onFrame = onFrame;
        this.#onError = onError;
        this.#maxRawSize = HEADER_SIZE + maxPayload + CRC_SIZE;
    }

    public push(chunk: Uint8Array): void {
        for (const b of chunk) {
            if (b === SLIP_END) {
                this.#flush();
            } else if (this.#discard) {
                // skip until next END
            } else if (this.#escaped) {
                this.#escaped = false;

                if (b === SLIP_ESC_END) {
                    this.#append(SLIP_END);
                } else if (b === SLIP_ESC_ESC) {
                    this.#append(SLIP_ESC);
                } else {
                    this.#discard = true;
                    this.#onError("escape");
                }
            } else if (b === SLIP_ESC) {
                this.#escaped = true;
            } else {
                this.#append(b);
            }
        }
    }

    public reset(): void {
        this.#buffer = [];
        this.#escaped = false;
        this.#discard = false;
    }

    #append(b: number): void {
        if (this.#buffer.length >= this.#maxRawSize) {
            this.#discard = true;
            this.#onError("overflow");
        } else {
            this.#buffer.push(b);
        }
    }

    #flush(): void {
        const discard = this.#discard;
        const data = this.#buffer;
        this.reset();

        if (discard || data.length === 0) {
            return;
        }

        const result = decodeRawFrame(Buffer.from(data));

        if (typeof result === "string") {
            this.#onError(result);
        } else {
            this.#onFrame(result);
        }
    }
}
