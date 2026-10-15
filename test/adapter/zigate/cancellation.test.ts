// biome-ignore-all lint/complexity/useLiteralKeys: Bracket access preserves type checking of private members in tests.

import {expect, it, vi} from "vitest";
import {ZiGateAdapter} from "../../../src/adapter/zigate/adapter/zigateAdapter";
import {MutexCancelledError} from "../../../src/utils/async-mutex";
import * as Zcl from "../../../src/zspec/zcl";

it("does not retry cancelled ZiGate commands and removes their response waiters", async () => {
    vi.useFakeTimers();
    const adapter = new ZiGateAdapter({panID: 0x1234, channelList: [11]}, {path: "/dev/ttyMOCK"}, "", {disableLED: false});
    const cancelled = new MutexCancelledError();
    const send = vi.spyOn(adapter["driver"], "sendCommand").mockRejectedValue(cancelled);
    const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false, undefined, 1, "on", "genOnOff", {}, {});
    try {
        await expect(adapter.sendZclFrameToEndpoint("0x0000000000001111", 0x1111, 1, frame, 1000, false, false)).rejects.toBe(cancelled);
        expect(send).toHaveBeenCalledTimes(1);
        expect(adapter["waitress"]["waiters"].size).toBe(0);
        expect(adapter["queue"].count()).toBe(0);
        await vi.advanceTimersByTimeAsync(2000);
    } finally {
        vi.useRealTimers();
        vi.restoreAllMocks();
    }
});
