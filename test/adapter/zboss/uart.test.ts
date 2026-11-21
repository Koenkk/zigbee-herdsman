import {EventEmitter} from "node:events";
import {describe, expect, it} from "vitest";
import type {AdapterTransport} from "../../../src/adapter/transport";
import {ZBOSSUart} from "../../../src/adapter/zboss/uart";
import {crc8, crc16} from "../../../src/adapter/zboss/utils";

/** Build a raw NCP packet the way the NCP puts it on the wire. */
function pack(flags: number, body?: Buffer): Buffer {
    const header = Buffer.alloc(7);
    header.writeUInt16BE(0xdead);
    header.writeUInt16LE(5 + (body ? body.length + 2 : 0), 2);
    header.writeUInt8(0x06, 4);
    header.writeUInt8(flags, 5);
    header.writeUInt8(crc8(header.subarray(2, 6)), 6);

    if (!body) {
        return header;
    }

    const bodyCrc = Buffer.alloc(2);
    bodyCrc.writeUInt16LE(crc16(body));

    return Buffer.concat([header, bodyCrc, body]);
}

/** Answers every outgoing DATA packet with one chunk: [unsolicited DATA][ACK for it][response DATA]. */
class InterleavingTransport extends EventEmitter {
    isOpen = true;
    isClosing = false;
    #ncpSeq = 0;

    #data(body: Buffer): Buffer {
        this.#ncpSeq = this.#ncpSeq === 3 ? 1 : this.#ncpSeq + 1;

        return pack(0xc0 | (this.#ncpSeq << 2), body);
    }

    write(data: Buffer): boolean {
        const flags = data.readUInt8(5);

        if ((flags & 0x01) === 0) {
            const hostSeq = (flags >> 2) & 0x03;
            const commandId = data.readUInt16LE(11);
            const tsn = data.readUInt8(13);
            // late ZDO_PERMIT_JOINING_REQ response with a stale tsn, as a real NCP delivers it
            const unsolicited = this.#data(Buffer.from([0x00, 0x01, 0x0b, 0x02, 0x24, 0x05, 0x00]));
            const ack = pack(0x01 | (hostSeq << 4));
            const response = this.#data(Buffer.from([0x00, 0x01, commandId & 0xff, commandId >> 8, tsn, 0x00, 0x00]));

            setImmediate(() => this.emit("data", Buffer.concat([unsolicited, ack, response])));
        }

        return true;
    }
}

describe("ZBOSS uart", () => {
    it("does not wait for the ACK timeout when an unsolicited frame precedes the ACK in the same chunk", async () => {
        const uart = new ZBOSSUart(new InterleavingTransport() as unknown as AdapterTransport);
        const frames: number[] = [];

        uart.on("frame", (frame) => frames.push(frame.commandId));

        const start = Date.now();

        // GET_MODULE_VERSION
        await uart.sendBuffer(Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01]));
        await new Promise((resolve) => setImmediate(resolve));

        // the ACK timeout is 2000ms; without it, the whole exchange takes a few ms
        expect(Date.now() - start).toBeLessThan(1000);
        expect(frames).toStrictEqual([0x020b, 0x0001]);
    });
});
