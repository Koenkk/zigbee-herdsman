import type {MockInstance} from "vitest";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {OcbBackup} from "../../../src/adapter/zigate/adapter/ocbBackup";
import {OcbFieldResult, OcbLinkKeyAvailableBit, OcbLinkKeyKind, ZiGateCommandCode} from "../../../src/adapter/zigate/driver/constants";
import type ZiGateObject from "../../../src/adapter/zigate/driver/ziGateObject";
import Driver from "../../../src/adapter/zigate/driver/zigate";
import type * as Models from "../../../src/models";

function hexToBuffer(hex: string): Buffer {
    return Buffer.from(hex.startsWith("0x") ? hex.slice(2) : hex, "hex");
}

function bitmapBuffer(bits: bigint): Buffer {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(bits);
    return buffer;
}

function mockResponse(payload: Record<string, unknown>): Promise<ZiGateObject> {
    return Promise.resolve({payload} as unknown as ZiGateObject);
}

const COORD_IEEE = "0x0011223344556677";
const EXT_PAN_ID = "0x1122334455667788";
const NWK_KEY = Buffer.alloc(16, 1);
const TC_KEY = Buffer.alloc(16, 2);
const DEVICE_IEEE = "0xaabbccddeeff0011";
const DEVICE_KEY = Buffer.alloc(16, 3);

describe("ZiGate OcbBackup", () => {
    let driver: Driver;
    let sendCommandSpy: MockInstance;
    let ocb: OcbBackup;

    beforeEach(() => {
        driver = new Driver("tmp", {});
        sendCommandSpy = vi.spyOn(driver, "sendCommand");
        ocb = new OcbBackup(driver);
    });

    describe("detectCapability", () => {
        it("reports capabilities present in the bitmap", async () => {
            sendCommandSpy.mockResolvedValueOnce(await mockResponse({capBitmap: bitmapBuffer((1n << 16n) | (1n << 15n))}));

            const capability = await ocb.detectCapability();

            expect(capability).toEqual({metadataExport: true, experimentalKeys: true});
        });

        it("reports metadata-only when bit 16 is clear", async () => {
            sendCommandSpy.mockResolvedValueOnce(await mockResponse({capBitmap: bitmapBuffer(1n << 15n)}));

            const capability = await ocb.detectCapability();

            expect(capability).toEqual({metadataExport: true, experimentalKeys: false});
        });

        it("treats a failed/timed-out probe as fully unsupported", async () => {
            sendCommandSpy.mockRejectedValueOnce(new Error("timeout"));

            const capability = await ocb.detectCapability();

            expect(capability).toEqual({metadataExport: false, experimentalKeys: false});
        });
    });

    describe("createBackup", () => {
        type Responder = (code: ZiGateCommandCode, payload?: Record<string, unknown>) => Promise<ZiGateObject>;

        function happyResponder(overrides: Partial<Record<ZiGateCommandCode, Responder>> = {}): Responder {
            return async (code, payload) => {
                if (overrides[code]) {
                    return await overrides[code]!(code, payload);
                }

                switch (code) {
                    case ZiGateCommandCode.OcbExportBegin:
                        return await mockResponse({status: 0, session: 42});
                    case ZiGateCommandCode.OcbExportCore:
                        return await mockResponse({
                            status: 0,
                            fields: 0xffff,
                            coordinatorIeee: COORD_IEEE,
                            panId: 0x1234,
                            extendedPanId: EXT_PAN_ID,
                            channel: 15,
                            channelMask: 0,
                            nwkUpdateId: 0,
                            securityLevel: 5,
                            nwkKeySequence: 3,
                            nwkOutgoingCounter: 0,
                            apsTrustCenterIeee: COORD_IEEE,
                            apsFlags: 0,
                            apsKeyType: 0,
                        });
                    case ZiGateCommandCode.OcbExportEnd:
                        return await mockResponse({status: 0, recordCount: 1, digest: 0});
                    case ZiGateCommandCode.OcbChallenge:
                        return await mockResponse({status: 0, nonce: 0x11223344, ttl: 30, limitations: 0});
                    case ZiGateCommandCode.OcbUnlock:
                        return await mockResponse({status: 0, ttl: 30, limitations: 0});
                    case ZiGateCommandCode.OcbSecretCore:
                        return await mockResponse({
                            status: 0,
                            available: 0,
                            limitations: 0,
                            nwkSeq: 3,
                            nwkKey: NWK_KEY,
                            nwkOut: 1000,
                            tcType: 1,
                            tcKey: TC_KEY,
                            tcOut: 0,
                            tcIn: 0,
                        });
                    case ZiGateCommandCode.OcbLinkKey: {
                        if (payload?.kind === OcbLinkKeyKind.FlashTclk && payload?.index === 5) {
                            return await mockResponse({
                                status: 0,
                                kind: payload.kind,
                                index: payload.index,
                                eui64: DEVICE_IEEE,
                                available: (1 << OcbLinkKeyAvailableBit.TcOrApsLinkKey) | (1 << OcbLinkKeyAvailableBit.Eui64),
                                keyType: 3,
                                key: DEVICE_KEY,
                                apsOut: 5,
                                apsIn: 7,
                            });
                        }

                        if (payload?.kind === OcbLinkKeyKind.ApsTable) {
                            // present but missing the EUI availability bit - should be skipped, not treated as a device
                            return await mockResponse({
                                status: 0,
                                kind: payload.kind,
                                index: payload.index,
                                eui64: "0x0000000000000000",
                                available: 1 << OcbLinkKeyAvailableBit.TcOrApsLinkKey,
                                keyType: 0,
                                key: Buffer.alloc(16),
                                apsOut: 0,
                                apsIn: 0,
                            });
                        }

                        return await mockResponse({status: 3}); // NOT_FOUND, empty slot
                    }
                    default:
                        throw new Error(`Unexpected command in test: ${code}`);
                }
            };
        }

        beforeEach(() => {
            sendCommandSpy.mockImplementation(happyResponder());
        });

        it("assembles a Models.Backup from the export + secret core + link key responses", async () => {
            const backup = await ocb.createBackup([], false);

            expect(backup.networkOptions.panId).toBe(0x1234);
            expect(backup.networkOptions.extendedPanId).toEqual(hexToBuffer(EXT_PAN_ID));
            expect(backup.networkOptions.channelList).toEqual([15]);
            expect(backup.networkOptions.networkKey).toEqual(NWK_KEY);
            expect(backup.logicalChannel).toBe(15);
            expect(backup.networkKeyInfo).toEqual({sequenceNumber: 3, frameCounter: 1000});
            expect(backup.securityLevel).toBe(5);
            expect(backup.coordinatorIeeeAddress).toEqual(hexToBuffer(COORD_IEEE));
            expect(backup.zigate?.tcLinkKey).toEqual(TC_KEY);
            expect(backup.zigate?.tcKeyType).toBe(1);

            expect(backup.devices).toHaveLength(1);
            expect(backup.devices[0].ieeeAddress).toEqual(hexToBuffer(DEVICE_IEEE));
            expect(backup.devices[0].linkKey?.key).toEqual(DEVICE_KEY);
            expect(backup.zigate?.deviceLinkKeyTypes?.[DEVICE_IEEE]).toBe(3);
        });

        it("throws when the export core reports a mandatory field as invalid", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbExportCore]: async () => await mockResponse({status: 0, fields: 0})}),
            );

            await expect(ocb.createBackup([], false)).rejects.toThrow(/valid 'coordinatorIeee' field/);
        });

        it("throws when export begin is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbExportBegin]: async () => await mockResponse({status: 5, session: 0})}),
            );

            await expect(ocb.createBackup([], false)).rejects.toThrow(/export begin rejected with status 5/);
        });

        it("throws when export core is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbExportCore]: async () => await mockResponse({status: 5, fields: 0})}),
            );

            await expect(ocb.createBackup([], false)).rejects.toThrow(/export core rejected with status 5/);
        });

        it("does not fail the backup when export end is rejected (non-fatal)", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbExportEnd]: async () => await mockResponse({status: 5, recordCount: 0, digest: 0})}),
            );

            await expect(ocb.createBackup([], false)).resolves.toBeDefined();
        });

        it("does not fail the backup when export end itself throws (non-fatal)", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({
                    [ZiGateCommandCode.OcbExportEnd]: () => {
                        throw new Error("transport error");
                    },
                }),
            );

            await expect(ocb.createBackup([], false)).resolves.toBeDefined();
        });

        it("throws when the challenge is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbChallenge]: async () => await mockResponse({status: 2, nonce: 0, ttl: 0, limitations: 0})}),
            );

            await expect(ocb.createBackup([], false)).rejects.toThrow(/challenge rejected with status 2/);
        });

        it("throws when unlock is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbUnlock]: async () => await mockResponse({status: 2, ttl: 0, limitations: 0})}),
            );

            await expect(ocb.createBackup([], false)).rejects.toThrow(/unlock rejected with status 2/);
        });

        it("throws when secret core is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({
                    [ZiGateCommandCode.OcbSecretCore]: async () =>
                        await mockResponse({status: 5, available: 0, limitations: 0, nwkSeq: 0, nwkOut: 0, tcType: 0, tcOut: 0, tcIn: 0}),
                }),
            );

            await expect(ocb.createBackup([], false)).rejects.toThrow(/secret core rejected with status 5/);
        });
    });

    describe("restoreBackup", () => {
        const backup: Models.Backup = {
            networkOptions: {
                panId: 0x1234,
                extendedPanId: hexToBuffer(EXT_PAN_ID),
                channelList: [15],
                networkKey: NWK_KEY,
                networkKeyDistribute: false,
            },
            logicalChannel: 15,
            networkKeyInfo: {sequenceNumber: 3, frameCounter: 1000},
            securityLevel: 5,
            networkUpdateId: 0,
            coordinatorIeeeAddress: hexToBuffer(COORD_IEEE),
            devices: [
                {
                    networkAddress: null,
                    ieeeAddress: hexToBuffer(DEVICE_IEEE),
                    isDirectChild: false,
                    linkKey: {key: DEVICE_KEY, rxCounter: 0, txCounter: 0},
                },
                {
                    // no linkKey: should be skipped when restoring per-device link keys
                    networkAddress: null,
                    ieeeAddress: hexToBuffer("0x1111222233334444"),
                    isDirectChild: false,
                },
                {
                    // has a linkKey but no matching deviceLinkKeyTypes entry: keyType should default to 0
                    networkAddress: null,
                    ieeeAddress: hexToBuffer("0x5555666677778888"),
                    isDirectChild: false,
                    linkKey: {key: Buffer.alloc(16, 9), rxCounter: 0, txCounter: 0},
                },
            ],
            zigate: {tcLinkKey: TC_KEY, tcKeyType: 1, deviceLinkKeyTypes: {[DEVICE_IEEE]: 3}},
        };

        type Responder = (code: ZiGateCommandCode) => Promise<ZiGateObject>;

        function happyResponder(overrides: Partial<Record<ZiGateCommandCode, Responder>> = {}): Responder {
            return async (code) => {
                if (overrides[code]) {
                    return await overrides[code]!(code);
                }

                switch (code) {
                    case ZiGateCommandCode.OcbChallenge:
                        return await mockResponse({status: 0, nonce: 0x1234, ttl: 30, limitations: 0});
                    case ZiGateCommandCode.OcbUnlock:
                        return await mockResponse({status: 0, ttl: 30, limitations: 0});
                    case ZiGateCommandCode.OcbRestoreBegin:
                        return await mockResponse({status: 0, restoreCaps: 0xff, limitations: 0});
                    case ZiGateCommandCode.OcbRestoreField:
                        return await mockResponse({status: 0, result: 0});
                    case ZiGateCommandCode.OcbRestoreLink:
                        return await mockResponse({status: 0, result: 0, apsCounterLost: 0});
                    case ZiGateCommandCode.OcbValidate:
                        return await mockResponse({status: 0, present: 0xffffffff, mandatoryOk: 1});
                    case ZiGateCommandCode.OcbCommit:
                        return await mockResponse({status: 0, present: 0xffffffff});
                    case ZiGateCommandCode.OcbAbort:
                        return await mockResponse({status: 0, limitations: 0});
                    default:
                        throw new Error(`Unexpected command in test: ${code}`);
                }
            };
        }

        it("runs challenge/unlock, restores fields and link keys, then validates and commits", async () => {
            sendCommandSpy.mockImplementation(happyResponder());

            await ocb.restoreBackup(backup);

            expect(sendCommandSpy).toHaveBeenCalledWith(ZiGateCommandCode.OcbCommit, expect.anything());
            expect(sendCommandSpy).not.toHaveBeenCalledWith(ZiGateCommandCode.OcbAbort, expect.anything());
        });

        it("aborts and throws when VALIDATE reports mandatory fields missing", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbValidate]: async () => await mockResponse({status: 0, present: 0, mandatoryOk: 0})}),
            );

            await expect(ocb.restoreBackup(backup)).rejects.toThrow(/mandatory fields/);
            expect(sendCommandSpy).toHaveBeenCalledWith(ZiGateCommandCode.OcbAbort, expect.anything());
            expect(sendCommandSpy).not.toHaveBeenCalledWith(ZiGateCommandCode.OcbCommit, expect.anything());
        });

        it("throws when the challenge is rejected before restore even begins", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbChallenge]: async () => await mockResponse({status: 2, nonce: 0, ttl: 0, limitations: 0})}),
            );

            await expect(ocb.restoreBackup(backup)).rejects.toThrow(/challenge rejected with status 2/);
        });

        it("throws when restore begin is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbRestoreBegin]: async () => await mockResponse({status: 5, restoreCaps: 0, limitations: 0})}),
            );

            await expect(ocb.restoreBackup(backup)).rejects.toThrow(/restore begin rejected with status 5/);
            expect(sendCommandSpy).toHaveBeenCalledWith(ZiGateCommandCode.OcbAbort, expect.anything());
        });

        it("throws when a restore field is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbRestoreField]: async () => await mockResponse({status: 5, fieldId: 1, result: 0})}),
            );

            await expect(ocb.restoreBackup(backup)).rejects.toThrow(/restore field .* rejected with status 5/);
        });

        it("logs a warning but does not throw when a restore field is skipped as unknown", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({
                    [ZiGateCommandCode.OcbRestoreField]: async () =>
                        await mockResponse({status: 0, fieldId: 1, result: OcbFieldResult.SkippedUnknown}),
                }),
            );

            await ocb.restoreBackup(backup);

            expect(sendCommandSpy).toHaveBeenCalledWith(ZiGateCommandCode.OcbCommit, expect.anything());
        });

        it("logs a warning with the raw code when a restore field result is unrecognized", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbRestoreField]: async () => await mockResponse({status: 0, fieldId: 1, result: 99})}),
            );

            await ocb.restoreBackup(backup);

            expect(sendCommandSpy).toHaveBeenCalledWith(ZiGateCommandCode.OcbCommit, expect.anything());
        });

        it("throws when a restore link is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({
                    [ZiGateCommandCode.OcbRestoreLink]: async () => await mockResponse({status: 5, result: 0, apsCounterLost: 0}),
                }),
            );

            await expect(ocb.restoreBackup(backup)).rejects.toThrow(/restore link for .* rejected with status 5/);
        });

        it("logs a warning but does not throw when a restore link result is not applied", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({
                    [ZiGateCommandCode.OcbRestoreLink]: async () =>
                        await mockResponse({status: 0, result: OcbFieldResult.Unavailable, apsCounterLost: 0}),
                }),
            );

            await ocb.restoreBackup(backup);

            expect(sendCommandSpy).toHaveBeenCalledWith(ZiGateCommandCode.OcbCommit, expect.anything());
        });

        it("throws when commit is rejected", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({[ZiGateCommandCode.OcbCommit]: async () => await mockResponse({status: 5, present: 0})}),
            );

            await expect(ocb.restoreBackup(backup)).rejects.toThrow(/commit rejected with status 5/);
            expect(sendCommandSpy).toHaveBeenCalledWith(ZiGateCommandCode.OcbAbort, expect.anything());
        });

        it("still throws the original error when the abort itself also fails", async () => {
            sendCommandSpy.mockImplementation(
                happyResponder({
                    [ZiGateCommandCode.OcbCommit]: async () => await mockResponse({status: 5, present: 0}),
                    [ZiGateCommandCode.OcbAbort]: () => {
                        throw new Error("abort transport error");
                    },
                }),
            );

            await expect(ocb.restoreBackup(backup)).rejects.toThrow(/commit rejected with status 5/);
        });
    });
});
