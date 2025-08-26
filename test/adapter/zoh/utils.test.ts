import {describe, expect, it} from "vitest";
import {bigUInt64ToBufferBE, bigUInt64ToBufferLE, bigUInt64ToHexBE} from "../../../src/adapter/zoh/adapter/utils";

describe("ZoH Utils", () => {
    it("handles bigint conversions", () => {
        const v10x = "0x90395efffec7fd21";
        const v1Buf = Buffer.from([0x21, 0xfd, 0xc7, 0xfe, 0xff, 0x5e, 0x39, 0x90]);
        const v1BigInt = 10392442068718320929n;

        const v20x = "0x9986ffbb4523acef";
        const v2Buf = Buffer.from([0xef, 0xac, 0x23, 0x45, 0xbb, 0xff, 0x86, 0x99]);
        const v2BigInt = 11062810714466135279n;

        const v30x = "0x0322334455667788";
        const v3Buf = Buffer.from([0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x03]);
        const v3BigInt = 225799299905517448n;

        expect(bigUInt64ToHexBE(v1BigInt)).toStrictEqual(v10x.slice(2));
        expect(bigUInt64ToBufferLE(v1BigInt)).toStrictEqual(v1Buf);
        expect(bigUInt64ToBufferBE(v1BigInt)).toStrictEqual(Buffer.from(v1Buf).reverse());
        expect(BigInt(v10x)).toStrictEqual(v1BigInt);
        expect(v1Buf.readBigUInt64LE(0)).toStrictEqual(v1BigInt);

        expect(bigUInt64ToHexBE(v2BigInt)).toStrictEqual(v20x.slice(2));
        expect(bigUInt64ToBufferLE(v2BigInt)).toStrictEqual(v2Buf);
        expect(bigUInt64ToBufferBE(v2BigInt)).toStrictEqual(Buffer.from(v2Buf).reverse());
        expect(BigInt(v20x)).toStrictEqual(v2BigInt);
        expect(v2Buf.readBigUInt64LE(0)).toStrictEqual(v2BigInt);

        expect(bigUInt64ToHexBE(v3BigInt)).toStrictEqual(v30x.slice(2));
        expect(bigUInt64ToBufferLE(v3BigInt)).toStrictEqual(v3Buf);
        expect(bigUInt64ToBufferBE(v3BigInt)).toStrictEqual(Buffer.from(v3Buf).reverse());
        expect(BigInt(v30x)).toStrictEqual(v3BigInt);
        expect(v3Buf.readBigUInt64LE(0)).toStrictEqual(v3BigInt);
    });
});
