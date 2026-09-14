// biome-ignore-all lint/complexity/useLiteralKeys: Bracket access preserves type checking of private members in tests.

import {expect, it, vi} from "vitest";
import {ZBOSS_FLAG_FIRST_FRAGMENT, ZBOSS_FLAG_LAST_FRAGMENT, ZBOSS_NCP_API_HL} from "../../../src/adapter/zboss/consts";
import {ZBOSSUart} from "../../../src/adapter/zboss/uart";
import {crc8, crc16} from "../../../src/adapter/zboss/utils";
import {logger} from "../../../src/utils/logger";

it("handles cancellation of a queued receive ACK during ZBOSS shutdown", async () => {
    const uart = new ZBOSSUart({path: "/dev/ttyMOCK"});
    const frameReceived = vi.fn();
    uart.on("frame", frameReceived);
    const log = vi.spyOn(logger, "debug");
    let release!: () => void;
    const active = uart["queue"].run(
        () =>
            new Promise<void>((resolve) => {
                release = resolve;
            }),
    );
    // A synthetic ZDO network address response with valid UART checksums.
    const body = Buffer.from("0001010211000088776655443322113412", "hex");
    const packet = Buffer.alloc(7 + body.length);
    packet.writeUInt16LE(packet.length, 0);
    packet[2] = ZBOSS_NCP_API_HL;
    packet[3] = ZBOSS_FLAG_FIRST_FRAGMENT | ZBOSS_FLAG_LAST_FRAGMENT;
    packet[4] = crc8(packet.subarray(0, 4));
    packet.writeUInt16LE(crc16(body), 5);
    body.copy(packet, 7);

    try {
        const received = uart["onPackage"](packet);
        const result = expect(received).resolves.toBeUndefined();
        expect(uart["queue"].count).toBe(1);
        await uart.stop();
        await result;
        expect(log).toHaveBeenCalledWith(expect.stringContaining("Mutex cleared"), "zh:zboss:uart");
        expect(frameReceived).not.toHaveBeenCalled();
    } finally {
        release();
        await active;
        log.mockRestore();
    }
});
