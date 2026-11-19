// biome-ignore assist/source/organizeImports: mock
import {emitSerialPortData} from "../../mockSerialPort";

import {describe, expect, it} from "vitest";
import {AdapterTransport} from "../../../src/adapter/transport";
import {ZBOSSUart} from "../../../src/adapter/zboss/uart";
import {flushPromises} from "../../testUtils";

const ADAPTER_PATH = "/dev/ttyACM0";

describe("ZBOSS uart", () => {
    it("does not wait for the ACK timeout when an unsolicited frame precedes the ACK in the same chunk", async () => {
        const transport = new AdapterTransport({path: ADAPTER_PATH, baudRate: 100, rtscts: true});
        const uart = new ZBOSSUart(transport);
        let ncpSeq = 0;
        const data = (body: Buffer): Buffer => {
            ncpSeq = ncpSeq === 3 ? 1 : ncpSeq + 1;

            return uart.makePack(0xc0 | (ncpSeq << 2), body);
        };
        const frames: number[] = [];

        uart.on("frame", (frame) => frames.push(frame.commandId));

        await uart.start();

        const start = Date.now();
        // // late ZDO_PERMIT_JOINING_REQ response with a stale tsn, as a real NCP delivers it
        const unsolicited = data(Buffer.from([0x00, 0x01, 0x0b, 0x02, 0x24, 0x05, 0x00]));
        const ack = uart.makePack(0x01 | (0x00 << 4));
        const response = data(Buffer.from([0x00, 0x01, 0x01 & 0xff, 0x01 >> 8, 0x01, 0x00, 0x00]));

        // GET_MODULE_VERSION
        const p = uart.sendBuffer(Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01]));

        await emitSerialPortData(unsolicited);
        await emitSerialPortData(ack);
        await emitSerialPortData(response);

        await p;
        await flushPromises();

        // the ACK timeout is 2000ms; without it, the whole exchange takes a few ms
        expect(Date.now() - start).toBeLessThan(1000);
        expect(frames).toStrictEqual([0x020b, 0x0001]);
    });
});
