import {afterEach, describe, expect, it, vi} from "vitest";
import {ZBOSSAdapter} from "../../../src/adapter/zboss/adapter/zbossAdapter";
import {logger} from "../../../src/utils/logger";

describe("ZBOSS adapter permitJoin", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("is loud, not silent, when the driver is not initialized", async () => {
        const error = vi.spyOn(logger, "error");
        // The guard sits in front of everything permitJoin does; a driver that
        // is not initialized must not turn the request into a silent no-op.
        const fake = {driver: {isInitialized: (): boolean => false}};

        await expect(ZBOSSAdapter.prototype.permitJoin.call(fake, 254, undefined)).resolves.toStrictEqual(undefined);
        expect(error).toHaveBeenCalledWith(expect.stringContaining("permitJoin(254) ignored"), expect.any(String));
    });
});
