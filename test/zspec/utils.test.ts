import {describe, expect, it} from "vitest";
import * as ZSpec from "../../src/zspec";

describe("ZSpec Utils", () => {
    it("Converts channels number array to uint32 mask", () => {
        expect(ZSpec.Utils.channelsToUInt32Mask(ZSpec.ALL_802_15_4_CHANNELS)).toStrictEqual(ZSpec.ALL_802_15_4_CHANNELS_MASK);
        expect(ZSpec.Utils.channelsToUInt32Mask(ZSpec.PREFERRED_802_15_4_CHANNELS)).toStrictEqual(ZSpec.PREFERRED_802_15_4_CHANNELS_MASK);
    });

    it("Converts channels uint32 mask to number array", () => {
        expect(ZSpec.Utils.uint32MaskToChannels(ZSpec.ALL_802_15_4_CHANNELS_MASK)).toStrictEqual(ZSpec.ALL_802_15_4_CHANNELS);
        expect(ZSpec.Utils.uint32MaskToChannels(ZSpec.PREFERRED_802_15_4_CHANNELS_MASK)).toStrictEqual(ZSpec.PREFERRED_802_15_4_CHANNELS);
    });

    it("Checks if address is broadcast", () => {
        expect(ZSpec.Utils.isBroadcastAddress(ZSpec.BroadcastAddress.DEFAULT)).toBeTruthy();
        expect(ZSpec.Utils.isBroadcastAddress(ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE)).toBeTruthy();
        expect(ZSpec.Utils.isBroadcastAddress(ZSpec.BroadcastAddress.SLEEPY)).toBeTruthy();
        expect(ZSpec.Utils.isBroadcastAddress(ZSpec.BroadcastAddress.LOW_POWER_ROUTERS)).toBeTruthy();
        expect(ZSpec.Utils.isBroadcastAddress(0x0f30)).toBeFalsy();
    });

    it("Converts EUI64 LE buffer to 0x...", () => {
        const buffer = Buffer.from([0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11]);

        expect(ZSpec.Utils.eui64LEBufferToHex(buffer)).toStrictEqual("0x1122334455667788");
        // reference not reversed
        expect(buffer.toString("hex")).toStrictEqual("8877665544332211");
    });

    it("Converts EUI64 BE buffer to 0x...", () => {
        const buffer = Buffer.from([0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11]);

        expect(ZSpec.Utils.eui64BEBufferToHex(buffer)).toStrictEqual("0x8877665544332211");
    });

    it("Calculates CRC variants", () => {
        // see https://www.crccalc.com/
        const val1 = Buffer.from("83FED3407A939723A5C639FF4C12", "hex").subarray(0, -2); // crc-appended

        expect(ZSpec.Utils.crc16X25(val1)).toStrictEqual(0x124c);
        expect(ZSpec.Utils.crc16XMODEM(val1)).toStrictEqual(0xc4b8);
        expect(ZSpec.Utils.crc16CCITT(val1)).toStrictEqual(0x7292);
        expect(ZSpec.Utils.crc16CCITTFALSE(val1)).toStrictEqual(0x4041);

        const val2 = Buffer.from("83FED3407A939723A5C639B26916D505C3B5", "hex").subarray(0, -2); // crc-appended

        expect(ZSpec.Utils.crc16X25(val2)).toStrictEqual(0xb5c3);
        expect(ZSpec.Utils.crc16XMODEM(val2)).toStrictEqual(0xff08);
        expect(ZSpec.Utils.crc16CCITT(val2)).toStrictEqual(0x1a6a);
        expect(ZSpec.Utils.crc16CCITTFALSE(val2)).toStrictEqual(0x9502);
    });

    it("Hashes using AES-128-MMO", () => {
        const val1 = Buffer.from("83FED3407A939723A5C639FF4C12", "hex");
        // Example from Zigbee spec
        const val2 = Buffer.from("83FED3407A939723A5C639B26916D505C3B5", "hex");
        // Example from Zigbee spec C.6.1
        const val3 = Buffer.from("76777475727370717E7F7C7D7A7B7879C0", "hex");
        // Example from Zigbee spec C.6.1
        const val4 = Buffer.from("1C1D1E1F18191A1B14151617101112133C3D537529A7A9A03F669DCD886CB52C", "hex");

        expect(ZSpec.Utils.aes128MmoHash(val1)).toStrictEqual(Buffer.from("58C1828CF7F1C3FE29E7B1024AD84BFA", "hex"));
        expect(ZSpec.Utils.aes128MmoHash(val2)).toStrictEqual(Buffer.from("66B6900981E1EE3CA4206B6B861C02BB", "hex"));
        expect(ZSpec.Utils.aes128MmoHash(val3)).toStrictEqual(Buffer.from("3C3D537529A7A9A03F669DCD886CB52C", "hex"));
        expect(ZSpec.Utils.aes128MmoHash(val4)).toStrictEqual(Buffer.from("4512807BF94CB3400F0E2C25FB76E999", "hex"));
    });
});
