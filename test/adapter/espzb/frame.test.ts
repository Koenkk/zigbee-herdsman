import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe, expect, it, vi} from "vitest";
import {crc16, decodeRawFrame, encodeFrame, FrameDecoder} from "../../../src/adapter/espzb/frame";

/** Shared conformance vectors (espzb-ncp/protocol/test-vectors.json): same bytes for adapter, simulator and firmware. */
const vectors = JSON.parse(readFileSync(join(__dirname, "test-vectors.json"), "utf8")) as {
    crc16: {data: string; crc: number}[];
    frames: {name: string; type: number; id: number; sn: number; payload: string; wire: string}[];
};

describe("espzb frame codec", () => {
    it.each(vectors.crc16)("CRC-16 of $data", ({data, crc}) => {
        expect(crc16(Buffer.from(data, "hex"))).toStrictEqual(crc);
    });

    it.each(vectors.frames)("encodes: $name", (v) => {
        const wire = encodeFrame({version: 0, type: v.type as 0 | 1 | 2, id: v.id, sn: v.sn, payload: Buffer.from(v.payload, "hex")});
        expect(wire.toString("hex")).toStrictEqual(v.wire);
    });

    it.each(vectors.frames)("decodes in 1-byte chunks: $name", (v) => {
        const onFrame = vi.fn();
        const onError = vi.fn();
        const decoder = new FrameDecoder(onFrame, onError);
        const wire = Buffer.from(v.wire, "hex");

        for (const b of wire) {
            decoder.push(Buffer.from([b]));
        }

        expect(onError).not.toHaveBeenCalled();
        expect(onFrame).toHaveBeenCalledTimes(1);
        expect(onFrame.mock.calls[0][0]).toStrictEqual({version: 0, type: v.type, id: v.id, sn: v.sn, payload: Buffer.from(v.payload, "hex")});
    });

    it("decodes several frames in one chunk after line noise", () => {
        const onFrame = vi.fn();
        const onError = vi.fn();
        const decoder = new FrameDecoder(onFrame, onError);
        const all = Buffer.concat([Buffer.from("123456", "hex"), ...vectors.frames.map((v) => Buffer.from(v.wire, "hex"))]);
        decoder.push(all);
        expect(onFrame).toHaveBeenCalledTimes(vectors.frames.length);
        expect(onError).toHaveBeenCalledWith("length"); // the noise before the first END
    });

    it("rejects corrupted frames", () => {
        const onFrame = vi.fn();
        const onError = vi.fn();
        const decoder = new FrameDecoder(onFrame, onError);
        const wire = Buffer.from(vectors.frames[1].wire, "hex");
        wire[wire.length - 2] ^= 0x01; // CRC
        decoder.push(wire);
        expect(onError).toHaveBeenLastCalledWith("crc");
        decoder.push(Buffer.from([0xc0, 0x01, 0xdb, 0x55, 0x02, 0xc0])); // invalid escape
        expect(onError).toHaveBeenLastCalledWith("escape");
        expect(onFrame).not.toHaveBeenCalled();
    });

    it("rejects oversized frames and recovers", () => {
        const onFrame = vi.fn();
        const onError = vi.fn();
        const decoder = new FrameDecoder(onFrame, onError, 4);
        decoder.push(Buffer.concat([Buffer.from([0xc0]), Buffer.alloc(32, 1), Buffer.from([0xc0])]));
        expect(onError).toHaveBeenCalledWith("overflow");
        decoder.push(Buffer.from(vectors.frames[1].wire, "hex"));
        expect(onFrame).toHaveBeenCalledTimes(1);
    });

    it("validates length and type", () => {
        expect(decodeRawFrame(Buffer.from("0000", "hex"))).toStrictEqual("length");
        expect(decodeRawFrame(Buffer.from("00000e00000100bd51", "hex"))).toStrictEqual("length");
        const raw = Buffer.from("30000e000000000000", "hex"); // type 3
        raw.writeUInt16LE(crc16(raw, 0, 7), 7);
        expect(decodeRawFrame(raw)).toStrictEqual("type");
    });
});
