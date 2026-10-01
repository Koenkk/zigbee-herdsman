import type {MockInstance} from "vitest";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {ZiGateAdapter} from "../../../src/adapter/zigate/adapter/zigateAdapter";
import type * as Models from "../../../src/models";

describe("ZiGate backup wiring", () => {
    let adapter: ZiGateAdapter;

    beforeEach(() => {
        adapter = new ZiGateAdapter({panID: 0, channelList: [11]}, {}, "tmp.db.backup", {disableLED: false});
    });

    it("supportsBackup() reflects whether OCB experimental key support was detected", async () => {
        await expect(adapter.supportsBackup()).resolves.toBe(false);

        // @ts-expect-error private
        adapter.hasOcbBackupSupport = true;

        await expect(adapter.supportsBackup()).resolves.toBe(true);
    });

    it("backup() rejects when OCB experimental key support was not detected", async () => {
        await expect(adapter.backup([])).rejects.toThrow("This adapter does not support backup");
    });

    it("backup() delegates to OcbBackup.createBackup() when supported", async () => {
        // @ts-expect-error private
        adapter.hasOcbBackupSupport = true;

        const fakeBackup = {} as Models.Backup;
        const createBackupSpy: MockInstance = vi
            .spyOn(
                // @ts-expect-error private
                adapter.ocbBackup,
                "createBackup",
            )
            .mockResolvedValue(fakeBackup);

        const result = await adapter.backup(["0x1122334455667788"]);

        expect(result).toBe(fakeBackup);
        expect(createBackupSpy).toHaveBeenCalledWith(["0x1122334455667788"], false);
    });
});
