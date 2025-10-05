import {randomBytes} from "node:crypto";
import {mkdirSync, rmSync} from "node:fs";
import {join} from "node:path";

import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {encodeSpinelFrame, SPINEL_HEADER_FLG_SPINEL} from "zigbee-on-host/dist/spinel/spinel";
import {SpinelStatus} from "zigbee-on-host/dist/spinel/statuses";
import type {MACCapabilities} from "zigbee-on-host/dist/zigbee/mac";
import type {ZigbeeNWKLinkStatus} from "zigbee-on-host/dist/zigbee/zigbee-nwk";

import {bigUInt64ToHexBE} from "../../../src/adapter/zoh/adapter/utils";
import {ZoHAdapter} from "../../../src/adapter/zoh/adapter/zohAdapter";
import * as ZSpec from "../../../src/zspec";
import * as Zcl from "../../../src/zspec/zcl";
import * as Zdo from "../../../src/zspec/zdo";

const TEMP_PATH = "zoh-tmp";
const TEMP_PATH_SAVE = join(TEMP_PATH, "zoh.save");
const DEFAULT_PAN_ID = 0x1a62;
const DEFAULT_EXT_PAN_ID = [0xdd, 0x11, 0x22, 0xdd, 0xdd, 0x33, 0x44, 0xdd];
const DEFAULT_CHANNEL = 11;
const DEFAULT_NETWORK_KEY = [0x11, 0x03, 0x15, 0x07, 0x09, 0x0b, 0x0d, 0x0f, 0x00, 0x02, 0x04, 0x06, 0x08, 0x1a, 0x1c, 0x1d];
const DEFAULT_TX_POWER = 19;
const DEFAULT_STATE: Awaited<ReturnType<ZoHAdapter["driver"]["context"]["readNetworkState"]>> = {
    eui64: Buffer.from([0x5a, 0x6f, 0x48, 0x6f, 0x6e, 0x5a, 0x32, 0x4d]).readBigUInt64LE(0),
    panId: DEFAULT_PAN_ID,
    extendedPanId: Buffer.from(DEFAULT_EXT_PAN_ID).readBigUInt64LE(0),
    channel: DEFAULT_CHANNEL,
    nwkUpdateId: 0,
    txPower: DEFAULT_TX_POWER,
    // ZigBeeAlliance09
    tcKey: Buffer.from([0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39]),
    tcKeyFrameCounter: 0,
    networkKey: Buffer.from(DEFAULT_NETWORK_KEY),
    networkKeyFrameCounter: 0,
    networkKeySequenceNumber: 0,
    deviceEntries: [],
};

// biome-ignore lint/correctness/noUnusedVariables: dev
const randomBigInt = (): bigint => BigInt(`0x${randomBytes(8).toString("hex")}`);

/** SL-OPENTHREAD/2.5.2.0_GitHub-1fceb225b; EFR32; Mar 19 2025 13:45:44 */
const START_FRAMES_SILABS = {
    protocolVersion: "7e8106010403db0a7e",
    ncpVersion:
        "7e820602534c2d4f50454e5448524541442f322e352e322e305f4769744875622d3166636562323235623b2045465233323b204d617220313920323032352031333a34353a343400b5dc7e",
    interfaceType: "7e83060303573a7e",
    rcpAPIVersion: "7e8406b0010a681f7e",
    rcpMinHostAPIVersion: "7e8506b101048ea77e",
    resetPowerOn: "7e80060070ee747e",
};
/** SL-OPENTHREAD/2.5.2.0_GitHub-1fceb225b; EFR32; Mar 19 2025 13:45:44 */
const FORM_FRAMES_SILABS = {
    phyEnabled: "7e87062001f2627e",
    phyChan: "7e88062114ff8e7e",
    phyTxPowerSet: "7e8906257d339b817e",
    mac154LAddr: "7e8a06344d325a6e6f486f5a8f327e",
    mac154SAddr: "7e8b0635000047f67e",
    mac154PANId: "7e8c0636d98579727e",
    macRxOnWhenIdleMode: "7e8d060000e68c7e",
    macRawStreamEnabled: "7e8e06370108437e",
    phyTxPowerGet: "7e8106257d3343647e",
    phyRSSIGet: "7e820626983d517e",
    phyRXSensitivityGet: "7e8306279c7a127e",
    phyCCAThresholdGet: "7e840624b5f0d37e",
};
// /** SL-OPENTHREAD/2.5.2.0_GitHub-1fceb225b; EFR32; Mar 19 2025 13:45:44 */
// const STOP_FRAMES_SILABS = {
//     macRawStreamEnabled: "7e8b063700d63c7e",
//     phyEnabled: "7e8c0620006eb37e",
// }
const COMMON_FFD_MAC_CAP: MACCapabilities = {
    alternatePANCoordinator: false,
    deviceType: 1,
    powerSource: 1,
    rxOnWhenIdle: true,
    securityCapability: false,
    allocateAddress: true,
};
const COMMON_RFD_MAC_CAP: MACCapabilities = {
    alternatePANCoordinator: false,
    deviceType: 0,
    powerSource: 0,
    rxOnWhenIdle: false,
    securityCapability: false,
    allocateAddress: true,
};

describe("Zigbee on Host", () => {
    let adapter: ZoHAdapter;
    let nextTidFromStartup = 1;

    const deleteZoHSave = () => {
        rmSync(TEMP_PATH_SAVE, {force: true});
    };

    const makeSpinelLastStatus = (tid: number, status: SpinelStatus = SpinelStatus.OK): Buffer => {
        const respSpinelFrame = {
            header: {
                tid,
                nli: 0,
                flg: SPINEL_HEADER_FLG_SPINEL,
            },
            commandId: 6 /* PROP_VALUE_IS */,
            payload: Buffer.from([0 /* LAST_STATUS */, status]),
        };
        const encRespHdlcFrame = encodeSpinelFrame(respSpinelFrame);

        return Buffer.from(encRespHdlcFrame.data.subarray(0, encRespHdlcFrame.length));
    };

    // biome-ignore lint/correctness/noUnusedVariables: dev
    const makeSpinelStreamRaw = (tid: number, macFrame: Buffer, spinelMeta?: Buffer): Buffer => {
        const spinelFrame = {
            header: {
                tid,
                nli: 0,
                flg: SPINEL_HEADER_FLG_SPINEL,
            },
            commandId: 6 /* PROP_VALUE_IS */,
            payload: Buffer.from([
                113 /* STREAM_RAW */,
                macFrame.byteLength & 0xff,
                (macFrame.byteLength >> 8) & 0xff,
                ...macFrame,
                ...(spinelMeta || []),
            ]),
        };
        const encHdlcFrame = encodeSpinelFrame(spinelFrame);

        return Buffer.from(encHdlcFrame.data.subarray(0, encHdlcFrame.length));
    };

    const mockStart = async (loadState = true, frames = START_FRAMES_SILABS) => {
        if (adapter.driver) {
            let loadStateSpy: ReturnType<typeof vi.spyOn> | undefined;

            if (!loadState) {
                loadStateSpy = vi.spyOn(adapter.driver.context, "loadState").mockResolvedValue(undefined);
            }

            let i = -1;
            const orderedFrames = [
                frames.protocolVersion,
                frames.ncpVersion,
                frames.interfaceType,
                frames.rcpAPIVersion,
                frames.rcpMinHostAPIVersion,
                frames.resetPowerOn,
            ];

            const reply = async () => {
                await vi.advanceTimersByTimeAsync(5);

                // skip cancel byte
                if (i >= 0) {
                    adapter.driver.parser._transform(Buffer.from(orderedFrames[i], "hex"), "utf8", () => {});
                    await vi.advanceTimersByTimeAsync(5);
                }

                i++;

                if (i === orderedFrames.length) {
                    adapter.driver.writer.removeListener("data", reply);
                }
            };

            adapter.driver.writer.on("data", reply);
            await adapter.driver.start();
            loadStateSpy?.mockRestore();
            await vi.advanceTimersByTimeAsync(100); // flush

            nextTidFromStartup = adapter.driver.currentSpinelTID + 1;
        }
    };

    const mockStop = async (expectThrow?: string) => {
        if (adapter.driver) {
            const setPropertySpy = vi.spyOn(adapter.driver, "setProperty").mockResolvedValue();

            if (expectThrow !== undefined) {
                await expect(adapter.driver.stop()).rejects.toThrow();
            } else {
                await adapter.driver.stop();
            }

            setPropertySpy.mockRestore();

            await vi.advanceTimersByTimeAsync(100); // flush
        }

        nextTidFromStartup = 1;
    };

    const mockFormNetwork = async (registerTimers = false, frames = FORM_FRAMES_SILABS) => {
        if (adapter.driver) {
            let i = 0;
            const orderedFrames = [
                frames.phyEnabled,
                frames.phyChan,
                frames.phyTxPowerSet,
                frames.mac154LAddr,
                frames.mac154SAddr,
                frames.mac154PANId,
                frames.macRxOnWhenIdleMode,
                frames.macRawStreamEnabled,
                frames.phyTxPowerGet,
                frames.phyRSSIGet,
                frames.phyRXSensitivityGet,
                frames.phyCCAThresholdGet,
            ];

            const reply = async () => {
                await vi.advanceTimersByTimeAsync(5);
                adapter.driver.parser._transform(Buffer.from(orderedFrames[i], "hex"), "utf8", () => {});
                await vi.advanceTimersByTimeAsync(5);

                i++;

                if (i === orderedFrames.length) {
                    adapter.driver.writer.removeListener("data", reply);
                }
            };

            adapter.driver.writer.on("data", reply);

            let registerTimersSpy: ReturnType<typeof vi.spyOn> | undefined;

            if (registerTimers) {
                await mockStartStack();
            } else {
                registerTimersSpy = vi.spyOn(adapter.driver, "startStack").mockResolvedValue();
            }

            await adapter.driver.formNetwork();

            registerTimersSpy?.mockRestore();

            await vi.advanceTimersByTimeAsync(100); // flush

            nextTidFromStartup = adapter.driver.currentSpinelTID + 1;
        }
    };

    const mockStartStack = async () => {
        if (adapter.driver) {
            let linksSpy: ZigbeeNWKLinkStatus[] | undefined;
            let manyToOneSpy: number | undefined;
            let destination16Spy: number | undefined;

            // creates a bottleneck with vitest & promises, noop it
            const savePeriodicStateSpy = vi.spyOn(adapter.driver.context, "savePeriodicState").mockResolvedValue();
            const sendLinkStatusSpy = vi.spyOn(adapter.driver.nwkHandler, "sendLinkStatus").mockImplementationOnce(async (links) => {
                linksSpy = links;
                const p = adapter.driver.nwkHandler.sendLinkStatus(links);
                // LINK_STATUS => OK
                adapter.driver.parser._transform(makeSpinelLastStatus(nextTidFromStartup), "utf8", () => {});
                await vi.advanceTimersByTimeAsync(10);
                await p;
            });
            const sendRouteReqSpy = vi.spyOn(adapter.driver.nwkHandler, "sendRouteReq").mockImplementationOnce(async (manyToOne, destination16) => {
                manyToOneSpy = manyToOne;
                destination16Spy = destination16;
                const p = adapter.driver.nwkHandler.sendRouteReq(manyToOne, destination16);
                // ROUTE_REQ => OK
                adapter.driver.parser._transform(makeSpinelLastStatus(nextTidFromStartup + 1), "utf8", () => {});
                await vi.advanceTimersByTimeAsync(10);
                return await p;
            });
            await adapter.driver.startStack();
            await vi.advanceTimersByTimeAsync(100); // flush

            expect(savePeriodicStateSpy).toHaveBeenCalledTimes(1);
            expect(sendLinkStatusSpy).toHaveBeenCalledTimes(1 + 1); // *2 by spy mock
            expect(sendRouteReqSpy).toHaveBeenCalledTimes(1 + 1); // *2 by spy mock

            nextTidFromStartup = adapter.driver.currentSpinelTID + 1;

            return [linksSpy, manyToOneSpy, destination16Spy];
        }

        return [undefined, undefined, undefined];
    };

    beforeAll(() => {
        vi.useFakeTimers();

        rmSync(TEMP_PATH, {force: true, recursive: true});
        mkdirSync(TEMP_PATH, {recursive: true});
    });

    afterAll(() => {
        vi.useRealTimers();

        rmSync(TEMP_PATH, {force: true, recursive: true});
    });

    beforeEach(() => {
        deleteZoHSave();

        adapter = new ZoHAdapter(
            {
                panID: DEFAULT_PAN_ID,
                extendedPanID: DEFAULT_EXT_PAN_ID,
                channelList: [DEFAULT_CHANNEL],
                networkKey: DEFAULT_NETWORK_KEY,
                networkKeyDistribute: false,
            },
            {
                baudRate: 921600,
                rtscts: true,
                path: "/dev/serial/by-id/mock-adapter",
                adapter: "zoh",
            },
            join(TEMP_PATH, "ember_coordinator_backup.json"),
            {
                concurrent: 8,
                disableLED: false,
                transmitPower: DEFAULT_TX_POWER,
            },
        );

        vi.spyOn(adapter, "initPort").mockImplementation(async () => {});
        vi.spyOn(adapter.driver, "start").mockImplementationOnce(async () => {
            await mockStart();
        });
        vi.spyOn(adapter.driver, "formNetwork").mockImplementationOnce(async () => {
            await mockFormNetwork();
        });
        vi.spyOn(adapter.driver, "stop").mockImplementationOnce(async () => {
            await mockStop();
        });
        vi.spyOn(adapter.driver.writer, "pipe").mockImplementation(
            // @ts-expect-error mock noop
            () => {},
        );

        adapter.driver.parser.on("data", adapter.driver.onFrame.bind(adapter.driver));
    });

    afterEach(async () => {
        await adapter.stop();
    });

    it("Adapter impl: gets state", async () => {
        await expect(adapter.start()).resolves.toStrictEqual("reset");
        await expect(adapter.getCoordinatorIEEE()).resolves.toStrictEqual("0x4d325a6e6f486f5a");
        await expect(adapter.getCoordinatorVersion()).resolves.toStrictEqual({
            type: "Zigbee on Host",
            meta: {
                major: 4,
                minor: 3,
                apiVersion: 10,
                version: "SL-OPENTHREAD/2.5.2.0_GitHub-1fceb225b; EFR32; Mar 19 2025 13:45:44",
                revision: "https://github.com/Nerivec/zigbee-on-host (using: SL-OPENTHREAD/2.5.2.0_GitHub-1fceb225b; EFR32; Mar 19 2025 13:45:44)",
            },
        });
        await expect(adapter.getNetworkParameters()).resolves.toStrictEqual({
            panID: DEFAULT_PAN_ID,
            extendedPanID: `0x${bigUInt64ToHexBE(Buffer.from(DEFAULT_EXT_PAN_ID).readBigUint64LE())}`,
            channel: DEFAULT_CHANNEL,
            nwkUpdateID: 0,
        });
    });

    it("Adapter impl: sendZdo to device", async () => {
        await adapter.start();

        await adapter.driver.context.associate(0x2211, BigInt("0x0807060504030201"), true, structuredClone(COMMON_FFD_MAC_CAP), true, false, true);

        const p1 = adapter.sendZdo(
            "0x0807060504030201",
            0x2211,
            Zdo.ClusterId.IEEE_ADDRESS_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.IEEE_ADDRESS_REQUEST, 0x2211, false, 0),
            false,
        );

        await vi.advanceTimersByTimeAsync(10);
        adapter.driver.parser._transform(makeSpinelLastStatus(nextTidFromStartup, SpinelStatus.OK), "utf8", () => {});
        await vi.advanceTimersByTimeAsync(10);
        adapter.onFrame(
            0x2211,
            BigInt("0x0807060504030201"),
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0,
                clusterId: Zdo.ClusterId.IEEE_ADDRESS_RESPONSE,
                sourceEndpoint: 0x0,
                destEndpoint: 0x0,
            },
            Buffer.from([1, 0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x11, 0x22]),
            150,
        );
        await vi.advanceTimersByTimeAsync(10);

        await expect(p1).resolves.toStrictEqual([
            0,
            {
                eui64: "0x0807060504030201",
                nwkAddress: 0x2211,
                startIndex: 0,
                assocDevList: [],
            },
        ]);

        const p2 = adapter.sendZdo(
            "0x0807060504030201",
            0x2211,
            Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, "0x0807060504030201", false, 0),
            false,
        );

        await vi.advanceTimersByTimeAsync(10);
        adapter.driver.parser._transform(makeSpinelLastStatus(nextTidFromStartup + 1, SpinelStatus.OK), "utf8", () => {});
        await vi.advanceTimersByTimeAsync(10);
        adapter.onFrame(
            0x2211,
            BigInt("0x0807060504030201"),
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0,
                clusterId: Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE,
                sourceEndpoint: 0x0,
                destEndpoint: 0x0,
            },
            Buffer.from([2, 0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x11, 0x22]),
            150,
        );
        await vi.advanceTimersByTimeAsync(10);

        await expect(p2).resolves.toStrictEqual([
            0,
            {
                eui64: "0x0807060504030201",
                nwkAddress: 0x2211,
                startIndex: 0,
                assocDevList: [],
            },
        ]);
    });

    it("Adapter impl: sendZdo to coordinator", async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, "emit");

        await adapter.sendZdo(
            `0x${bigUInt64ToHexBE(adapter.driver.context.netParams.eui64)}`,
            0x0000,
            Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 0x0000),
            false,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zdoResponse", Zdo.ClusterId.NODE_DESCRIPTOR_RESPONSE, [
            0,
            expect.objectContaining({
                nwkAddress: 0x0000,
                logicalType: 0x00,
                manufacturerCode: Zcl.ManufacturerCode.CONNECTIVITY_STANDARDS_ALLIANCE,
                serverMask: expect.objectContaining({primaryTrustCenter: 1, stackComplianceRevision: 22}),
            }),
        ]);

        await adapter.sendZdo(
            `0x${bigUInt64ToHexBE(adapter.driver.context.netParams.eui64)}`,
            0x0000,
            Zdo.ClusterId.POWER_DESCRIPTOR_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.POWER_DESCRIPTOR_REQUEST, 0x0000),
            false,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zdoResponse", Zdo.ClusterId.POWER_DESCRIPTOR_RESPONSE, [
            0,
            expect.objectContaining({nwkAddress: 0x0000}),
        ]);

        await adapter.sendZdo(
            `0x${bigUInt64ToHexBE(adapter.driver.context.netParams.eui64)}`,
            0x0000,
            Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST, 0x0000, 1),
            false,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zdoResponse", Zdo.ClusterId.SIMPLE_DESCRIPTOR_RESPONSE, [
            0,
            expect.objectContaining({endpoint: 1, profileId: ZSpec.HA_PROFILE_ID}),
        ]);

        await adapter.sendZdo(
            `0x${bigUInt64ToHexBE(adapter.driver.context.netParams.eui64)}`,
            0x0000,
            Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST, 0x0000),
            false,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zdoResponse", Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE, [
            0,
            {nwkAddress: 0, endpointList: [1, 242]},
        ]);

        await expect(
            adapter.sendZdo(
                `0x${bigUInt64ToHexBE(adapter.driver.context.netParams.eui64)}`,
                0x0000,
                Zdo.ClusterId.PARENT_ANNOUNCE,
                Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.PARENT_ANNOUNCE, []),
                false,
            ),
        ).rejects.toThrow(`Coordinator does not support ZDO cluster ${Zdo.ClusterId.PARENT_ANNOUNCE}`);
    });

    it("Adapter impl: permitJoin", async () => {
        await adapter.start();

        const sendZdoSpy = vi.spyOn(adapter, "sendZdo");
        const allowJoinsSpy = vi.spyOn(adapter.driver.context, "allowJoins");
        const gpEnterCommissioningModeSpy = vi.spyOn(adapter.driver.nwkGPHandler, "enterCommissioningMode");

        sendZdoSpy.mockImplementationOnce(async () => [0, undefined]);
        await adapter.permitJoin(254);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(254, true);
        expect(gpEnterCommissioningModeSpy).toHaveBeenLastCalledWith(254);

        sendZdoSpy.mockImplementationOnce(async () => [0, undefined]);
        await adapter.permitJoin(0);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(0, true);
        expect(gpEnterCommissioningModeSpy).toHaveBeenLastCalledWith(0);

        await adapter.permitJoin(200, 0x0000);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(200, true);
        expect(gpEnterCommissioningModeSpy).toHaveBeenLastCalledWith(200);

        sendZdoSpy.mockImplementationOnce(async () => [0, undefined]);
        await adapter.permitJoin(0);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(0, true);
        expect(gpEnterCommissioningModeSpy).toHaveBeenLastCalledWith(0);
        expect(gpEnterCommissioningModeSpy).toHaveBeenCalledTimes(4);

        sendZdoSpy.mockImplementationOnce(async () => [0, undefined]);
        await adapter.permitJoin(150, 0x1234);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(150, false);
        expect(gpEnterCommissioningModeSpy).toHaveBeenCalledTimes(4);

        sendZdoSpy.mockImplementationOnce(async () => [0, undefined]);
        await adapter.permitJoin(0);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(0, true);
        expect(gpEnterCommissioningModeSpy).toHaveBeenLastCalledWith(0);
        expect(gpEnterCommissioningModeSpy).toHaveBeenCalledTimes(5);
    });

    it("Adapter impl: sendZclFrameToEndpoint", async () => {
        await adapter.start();

        await adapter.driver.context.associate(0x9876, BigInt("0x00000000000004d2"), true, structuredClone(COMMON_FFD_MAC_CAP), true, false, true);

        const sendUnicastSpy = vi.spyOn(adapter.driver, "sendUnicast");

        const zclPayload = Buffer.from([16, 123, Zcl.Foundation.read.ID]);
        const zclFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(zclPayload), zclPayload, {});

        const p1 = adapter.sendZclFrameToEndpoint("0x00000000000004d2", 0x9876, 1, zclFrame, 10000, false, false, 2);

        await vi.advanceTimersByTimeAsync(10);
        adapter.driver.parser._transform(makeSpinelLastStatus(nextTidFromStartup, SpinelStatus.OK), "utf8", () => {});
        await vi.advanceTimersByTimeAsync(10);
        adapter.onFrame(
            0x9876,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: ZSpec.HA_PROFILE_ID,
                clusterId: Zcl.Clusters.genGroups.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x2,
            },
            Buffer.from([0, 123, Zcl.Foundation.read.response!, 0x01, 0xff]),
            215,
        );
        await expect(p1).resolves.toStrictEqual({
            address: 0x9876,
            clusterID: Zcl.Clusters.genGroups.ID,
            data: Buffer.from([0, 123, Zcl.Foundation.read.response!, 0x01, 0xff]),
            destinationEndpoint: 2,
            endpoint: 1,
            groupID: undefined,
            header: expect.objectContaining({
                commandIdentifier: 1,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            }),
            linkquality: 215,
            wasBroadcast: false,
        });
        expect(sendUnicastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), ZSpec.HA_PROFILE_ID, Zcl.Clusters.genGroups.ID, 0x9876, undefined, 1, 2);

        sendUnicastSpy.mockResolvedValueOnce(2);

        const p2 = adapter.sendZclFrameToEndpoint("0x00000000000004d2", 0x9876, 1, zclFrame, 10000, true, false);

        await vi.advanceTimersByTimeAsync(10);
        adapter.driver.parser._transform(makeSpinelLastStatus(nextTidFromStartup + 1, SpinelStatus.OK), "utf8", () => {});
        await vi.advanceTimersByTimeAsync(10);
        await expect(p2).resolves.toStrictEqual(undefined);
        expect(sendUnicastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), ZSpec.HA_PROFILE_ID, Zcl.Clusters.genGroups.ID, 0x9876, undefined, 1, 1);

        const zclPayloadDefRsp = Buffer.from([0, 123, Zcl.Foundation.read.ID]);
        const zclFrameDefRsp = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(zclPayloadDefRsp), zclPayloadDefRsp, {});

        sendUnicastSpy.mockResolvedValueOnce(3);

        const p3 = adapter.sendZclFrameToEndpoint("0x00000000000004d2", 0x9876, 1, zclFrameDefRsp, 10000, true, false, 2);

        await vi.advanceTimersByTimeAsync(10);
        adapter.driver.parser._transform(makeSpinelLastStatus(nextTidFromStartup + 2, SpinelStatus.OK), "utf8", () => {});
        await vi.advanceTimersByTimeAsync(10);
        adapter.onFrame(
            0x9876,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: ZSpec.HA_PROFILE_ID,
                clusterId: Zcl.Clusters.genGroups.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x2,
            },
            Buffer.from([0, 123, Zcl.Foundation.defaultRsp.ID, 0x01, 0xff]),
            125,
        );
        await expect(p3).resolves.toStrictEqual({
            address: 0x9876,
            clusterID: Zcl.Clusters.genGroups.ID,
            data: Buffer.from([0, 123, Zcl.Foundation.defaultRsp.ID, 0x01, 0xff]),
            destinationEndpoint: 2,
            endpoint: 1,
            groupID: undefined,
            header: expect.objectContaining({
                commandIdentifier: Zcl.Foundation.defaultRsp.ID,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            }),
            linkquality: 125,
            wasBroadcast: false,
        });
        expect(sendUnicastSpy).toHaveBeenLastCalledWith(
            zclFrameDefRsp.toBuffer(),
            ZSpec.HA_PROFILE_ID,
            Zcl.Clusters.genGroups.ID,
            0x9876,
            undefined,
            1,
            2,
        );

        sendUnicastSpy.mockClear();
        sendUnicastSpy.mockRejectedValueOnce(new Error("Failed")).mockResolvedValueOnce(2);

        const p4 = adapter.sendZclFrameToEndpoint("0x00000000000004d2", 0x9876, 1, zclFrame, 10000, false, false, 2);

        await vi.advanceTimersByTimeAsync(10);
        adapter.driver.parser._transform(makeSpinelLastStatus(nextTidFromStartup + 3, SpinelStatus.OK), "utf8", () => {});
        await vi.advanceTimersByTimeAsync(10);
        adapter.onFrame(
            0x9876,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: ZSpec.HA_PROFILE_ID,
                clusterId: Zcl.Clusters.genGroups.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x2,
            },
            Buffer.from([0, 123, Zcl.Foundation.read.response!, 0x01, 0xff]),
            225,
        );
        await expect(p4).resolves.toStrictEqual({
            address: 0x9876,
            clusterID: Zcl.Clusters.genGroups.ID,
            data: Buffer.from([0, 123, Zcl.Foundation.read.response!, 0x01, 0xff]),
            destinationEndpoint: 2,
            endpoint: 1,
            groupID: undefined,
            header: expect.objectContaining({
                commandIdentifier: 1,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            }),
            linkquality: 225,
            wasBroadcast: false,
        });
        expect(sendUnicastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), ZSpec.HA_PROFILE_ID, Zcl.Clusters.genGroups.ID, 0x9876, undefined, 1, 2);
        expect(sendUnicastSpy).toHaveBeenCalledTimes(2);

        sendUnicastSpy.mockClear();
        sendUnicastSpy.mockRejectedValueOnce(new Error("Failed")).mockRejectedValueOnce(new Error("Failed"));

        await expect(adapter.sendZclFrameToEndpoint("0x00000000000004d2", 0x9876, 1, zclFrame, 10000, false, false, 2)).rejects.toThrow("Failed");
        expect(sendUnicastSpy).toHaveBeenCalledTimes(2);

        const zclFrameGP = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(zclPayload), zclPayload, {});

        sendUnicastSpy.mockClear();

        await expect(
            adapter.sendZclFrameToEndpoint("0xb43a31fffe0f6aae", 57129, ZSpec.GP_ENDPOINT, zclFrameGP, 10000, true, false, ZSpec.GP_ENDPOINT),
        ).rejects.toThrow("Unknown destination");
        expect(sendUnicastSpy).toHaveBeenCalledTimes(2);
    });

    it("Adapter impl: sendZclFrameToGroup", async () => {
        await adapter.start();

        const sendGroupcastSpy = vi.spyOn(adapter.driver, "sendGroupcast").mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(1);

        const zclPayload = Buffer.from([0, 123, Zcl.Foundation.read.ID]);
        const zclFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(zclPayload), zclPayload, {});

        const p1 = adapter.sendZclFrameToGroup(123, zclFrame, 5);

        await vi.advanceTimersByTimeAsync(1000);
        await expect(p1).resolves.toStrictEqual(undefined);
        expect(sendGroupcastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), ZSpec.HA_PROFILE_ID, Zcl.Clusters.genGroups.ID, 123, 5);

        const p2 = adapter.sendZclFrameToGroup(123, zclFrame);

        await vi.advanceTimersByTimeAsync(1000);
        await expect(p2).resolves.toStrictEqual(undefined);
        expect(sendGroupcastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), ZSpec.HA_PROFILE_ID, Zcl.Clusters.genGroups.ID, 123, 1);
    });

    it("Adapter impl: sendZclFrameToAll", async () => {
        await adapter.start();

        const sendBroadcastSpy = vi.spyOn(adapter.driver, "sendBroadcast").mockResolvedValueOnce(1).mockResolvedValueOnce(1);

        const zclPayload = Buffer.from([0, 123, Zcl.Foundation.read.ID]);
        const zclFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.genAlarms.ID, Zcl.Header.fromBuffer(zclPayload), zclPayload, {});

        const p = adapter.sendZclFrameToAll(3, zclFrame, 1, 0xfffc);

        await vi.advanceTimersByTimeAsync(1000);
        await expect(p).resolves.toStrictEqual(undefined);
        expect(sendBroadcastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), ZSpec.HA_PROFILE_ID, Zcl.Clusters.genAlarms.ID, 0xfffc, 3, 1);

        const p2 = adapter.sendZclFrameToAll(ZSpec.GP_ENDPOINT, zclFrame, ZSpec.GP_ENDPOINT, 0xfffc);

        await vi.advanceTimersByTimeAsync(1000);
        await expect(p2).resolves.toStrictEqual(undefined);
        expect(sendBroadcastSpy).toHaveBeenLastCalledWith(
            zclFrame.toBuffer(),
            ZSpec.GP_PROFILE_ID,
            Zcl.Clusters.genAlarms.ID,
            0xfffc,
            ZSpec.GP_ENDPOINT,
            ZSpec.GP_ENDPOINT,
        );
    });

    it("receives ZDO frame", async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, "emit");

        adapter.onFrame(
            0x2211,
            578437695752307201n,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0,
                clusterId: Zdo.ClusterId.IEEE_ADDRESS_RESPONSE,
                sourceEndpoint: 0x0,
                destEndpoint: 0x0,
            },
            Buffer.from([1, 0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x11, 0x22]),
            -50,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zdoResponse", Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, [
            0,
            {
                eui64: "0x0807060504030201",
                nwkAddress: 0x2211,
                startIndex: 0,
                assocDevList: [],
            },
        ]);

        // NETWORK_ADDRESS_RESPONSE codepath
        adapter.onFrame(
            0x2211,
            578437695752307201n,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0,
                clusterId: Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE,
                sourceEndpoint: 0x0,
                destEndpoint: 0x0,
            },
            Buffer.from([1, 0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x11, 0x22]),
            -50,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zdoResponse", Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            0,
            {
                eui64: "0x0807060504030201",
                nwkAddress: 0x2211,
                startIndex: 0,
                assocDevList: [],
            },
        ]);
    });

    it("receives ZCL frame", async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, "emit");

        adapter.onFrame(
            0x9876,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: ZSpec.HA_PROFILE_ID,
                clusterId: Zcl.Clusters.genAlarms.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x1,
            },
            Buffer.from([0, 123, Zcl.Foundation.read.ID, 0x01, 0xff]),
            125,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zclPayload", {
            address: 0x9876,
            clusterID: Zcl.Clusters.genAlarms.ID,
            data: Buffer.from([0, 123, Zcl.Foundation.read.ID, 0x01, 0xff]),
            destinationEndpoint: 1,
            endpoint: 1,
            groupID: undefined,
            header: {
                commandIdentifier: Zcl.Foundation.read.ID,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            },
            linkquality: 125,
            wasBroadcast: false,
        });

        adapter.onFrame(
            0x9876,
            1234n,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: ZSpec.HA_PROFILE_ID,
                clusterId: Zcl.Clusters.genIdentify.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x1,
            },
            Buffer.from([0, 123, 0x00, 0x01, 0xff]),
            155,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zclPayload", {
            address: "0x00000000000004d2",
            clusterID: Zcl.Clusters.genIdentify.ID,
            data: Buffer.from([0, 123, 0x00, 0x01, 0xff]),
            destinationEndpoint: 1,
            endpoint: 1,
            groupID: undefined,
            header: {
                commandIdentifier: 0,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            },
            linkquality: 155,
            wasBroadcast: false,
        });

        adapter.onFrame(
            57129,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: ZSpec.GP_PROFILE_ID,
                clusterId: Zcl.Clusters.greenPower.ID,
                sourceEndpoint: ZSpec.GP_ENDPOINT,
                destEndpoint: ZSpec.GP_ENDPOINT,
            },
            Buffer.from("1102040008d755550114000000e01f0785f256b8e010b32e6921aca5d18ab7b7d44d0f063d4d140300001002050229dfe2", "hex"),
            245,
        );

        expect(emitSpy).toHaveBeenLastCalledWith("zclPayload", {
            address: 57129,
            clusterID: Zcl.Clusters.greenPower.ID,
            data: Buffer.from("1102040008d755550114000000e01f0785f256b8e010b32e6921aca5d18ab7b7d44d0f063d4d140300001002050229dfe2", "hex"),
            destinationEndpoint: ZSpec.GP_ENDPOINT,
            endpoint: ZSpec.GP_ENDPOINT,
            groupID: undefined,
            header: {
                commandIdentifier: 4,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: true,
                    frameType: 1,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 2,
            },
            linkquality: 245,
            wasBroadcast: false,
        });
    });

    it("receives GP frame", async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, "emit");

        adapter.onGPFrame(
            0xe0,
            Buffer.from([
                0x2, 0x85, 0xf2, 0xc9, 0x25, 0x82, 0x1d, 0xf4, 0x6f, 0x45, 0x8c, 0xf0, 0xe6, 0x37, 0xaa, 0xc3, 0xba, 0xb6, 0xaa, 0x45, 0x83, 0x1a,
                0x11, 0x46, 0x23, 0x0, 0x0, 0x4, 0x16, 0x10, 0x11, 0x22, 0x23, 0x18, 0x19, 0x14, 0x15, 0x12, 0x13, 0x64, 0x65, 0x62, 0x63, 0x1e, 0x1f,
                0x1c, 0x1d, 0x1a, 0x1b, 0x16, 0x17,
            ]),
            {
                frameControl: {
                    frameType: 0x1,
                    securityEnabled: false,
                    framePending: false,
                    ackRequest: false,
                    panIdCompression: false,
                    seqNumSuppress: false,
                    iePresent: false,
                    destAddrMode: 0x2,
                    frameVersion: 0,
                    sourceAddrMode: 0x0,
                },
                sequenceNumber: 70,
                destinationPANId: 0xffff,
                destination16: 0xffff,
                sourcePANId: 0xffff,
                fcs: 0xffff,
            },
            {
                frameControl: {
                    frameType: 0x0,
                    protocolVersion: 3,
                    autoCommissioning: false,
                    nwkFrameControlExtension: false,
                },
                sourceId: 0x0155f47a,
                micSize: 0,
                payloadLength: 52,
            },
            0,
        );

        const data = Buffer.from([
            1, 70, 4, 0, 0, 122, 244, 85, 1, 0, 0, 0, 0, 0xe0, 51, 0x2, 0x85, 0xf2, 0xc9, 0x25, 0x82, 0x1d, 0xf4, 0x6f, 0x45, 0x8c, 0xf0, 0xe6, 0x37,
            0xaa, 0xc3, 0xba, 0xb6, 0xaa, 0x45, 0x83, 0x1a, 0x11, 0x46, 0x23, 0x0, 0x0, 0x4, 0x16, 0x10, 0x11, 0x22, 0x23, 0x18, 0x19, 0x14, 0x15,
            0x12, 0x13, 0x64, 0x65, 0x62, 0x63, 0x1e, 0x1f, 0x1c, 0x1d, 0x1a, 0x1b, 0x16, 0x17,
        ]);
        const header = Zcl.Header.fromBuffer(data)!;

        expect(emitSpy).toHaveBeenLastCalledWith("zclPayload", {
            address: 0x0155f47a & 0xffff,
            clusterID: Zcl.Clusters.greenPower.ID,
            data,
            destinationEndpoint: 242,
            endpoint: 242,
            groupID: ZSpec.GP_GROUP_ID,
            header,
            linkquality: 0,
            wasBroadcast: true,
        });

        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, header, data, {});

        expect(frame).toMatchObject({
            header: {
                frameControl: {
                    frameType: 1,
                    manufacturerSpecific: false,
                    direction: 0,
                    disableDefaultResponse: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 70,
                commandIdentifier: 4,
            },
            payload: {
                options: 0,
                srcID: 22410362,
                frameCounter: 0,
                commandID: 0xe0,
                payloadSize: 51,
                commandFrame: {
                    deviceID: 2,
                    options: 133,
                    extendedOptions: 242,
                    securityKey: Buffer.from("c925821df46f458cf0e637aac3bab6aa", "hex"),
                    keyMic: 286950213,
                    outgoingCounter: 9030,
                    applicationInfo: 4,
                    manufacturerID: 0,
                    modelID: 0,
                    numGpdCommands: 22,
                    gpdCommandIdList: Buffer.from("10112223181914151213646562631e1f1c1d1a1b1617", "hex"),
                    numServerClusters: 0,
                    numClientClusters: 0,
                    gpdServerClusters: Buffer.alloc(0),
                    gpdClientClusters: Buffer.alloc(0),
                },
            },
            cluster: {
                ID: 0x21,
                name: "greenPower",
            },
            command: {
                ID: 0x04,
                name: "commissioningNotification",
            },
        });

        adapter.onGPFrame(
            0x10,
            Buffer.from([]),
            {
                frameControl: {
                    frameType: 0x1,
                    securityEnabled: false,
                    framePending: false,
                    ackRequest: false,
                    panIdCompression: false,
                    seqNumSuppress: false,
                    iePresent: false,
                    destAddrMode: 0x2,
                    frameVersion: 0,
                    sourceAddrMode: 0x0,
                },
                sequenceNumber: 185,
                destinationPANId: 0xffff,
                destination16: 0xffff,
                sourcePANId: 0xffff,
                fcs: 0xffff,
            },
            {
                frameControl: {
                    frameType: 0x0,
                    protocolVersion: 3,
                    autoCommissioning: false,
                    nwkFrameControlExtension: true,
                },
                frameControlExt: {
                    appId: 0,
                    direction: 0,
                    rxAfterTx: false,
                    securityKey: true,
                    securityLevel: 2,
                },
                sourceId: 24221335,
                securityFrameCounter: 185,
                micSize: 4,
                payloadLength: 1,
                mic: 3523079166,
            },
            0,
        );

        const data2 = Buffer.from([1, 185, 0, 0b10000000, 0, 151, 150, 113, 1, 185, 0, 0, 0, 0x10, 0]);
        const header2 = Zcl.Header.fromBuffer(data2)!;

        expect(emitSpy).toHaveBeenLastCalledWith("zclPayload", {
            address: 24221335 & 0xffff,
            clusterID: Zcl.Clusters.greenPower.ID,
            data: data2,
            destinationEndpoint: 242,
            endpoint: 242,
            groupID: ZSpec.GP_GROUP_ID,
            header: header2,
            linkquality: 0,
            wasBroadcast: true,
        });

        const frame2 = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, header2, data2, {});

        expect(frame2).toMatchObject({
            header: {
                frameControl: {
                    frameType: 1,
                    manufacturerSpecific: false,
                    direction: 0,
                    disableDefaultResponse: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 185,
                commandIdentifier: 0,
            },
            payload: {
                options: 0b10000000,
                srcID: 24221335,
                frameCounter: 185,
                commandID: 0x10,
                payloadSize: 0,
                commandFrame: {},
            },
            cluster: {
                ID: 0x21,
                name: "greenPower",
            },
            command: {
                ID: 0x00,
                name: "notification",
            },
        });
    });

    it("receives device events", async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, "emit");

        adapter.onDeviceJoined(0x123, 4321n, structuredClone(COMMON_FFD_MAC_CAP));
        expect(emitSpy).toHaveBeenNthCalledWith(1, "deviceJoined", {networkAddress: 0x123, ieeeAddr: "0x00000000000010e1"});

        adapter.onDeviceJoined(0x321, 1234n, structuredClone(COMMON_RFD_MAC_CAP));
        expect(emitSpy).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(5500);
        expect(emitSpy).toHaveBeenNthCalledWith(2, "deviceJoined", {networkAddress: 0x321, ieeeAddr: "0x00000000000004d2"});

        adapter.onDeviceRejoined(0x987, 4321n, structuredClone(COMMON_FFD_MAC_CAP));
        expect(emitSpy).toHaveBeenLastCalledWith("deviceJoined", {networkAddress: 0x987, ieeeAddr: "0x00000000000010e1"});

        adapter.onDeviceLeft(0x123, 4321n);
        expect(emitSpy).toHaveBeenLastCalledWith("deviceLeave", {networkAddress: 0x123, ieeeAddr: "0x00000000000010e1"});

        // adapter.driver.emit('deviceAuthorized', 0x123, 4321n);
    });

    it("resumes network", async () => {
        const defaultExtPanId = Buffer.from(DEFAULT_EXT_PAN_ID).readBigUInt64LE();
        const defaultNetworkKey = Buffer.from(DEFAULT_NETWORK_KEY);
        const readNetworkStateSpy = vi
            .spyOn(adapter.driver.context, "readNetworkState")
            .mockResolvedValueOnce(DEFAULT_STATE)
            .mockResolvedValueOnce(DEFAULT_STATE);

        await expect(adapter.start()).resolves.toStrictEqual("resumed");
        expect(adapter.driver.context.netParams.panId).toStrictEqual(DEFAULT_PAN_ID);
        expect(adapter.driver.context.netParams.extendedPanId).toStrictEqual(defaultExtPanId);
        expect(adapter.driver.context.netParams.networkKey).toStrictEqual(defaultNetworkKey);
        // check against current + populate context
        expect(readNetworkStateSpy).toHaveBeenCalledTimes(2);

        readNetworkStateSpy.mockRestore();
    });

    it("resets network on mismatch PAN ID", async () => {
        const oldPanId = 0x1234;
        const readNetworkStateSpy = vi
            .spyOn(adapter.driver.context, "readNetworkState")
            .mockResolvedValueOnce({...DEFAULT_STATE, panId: oldPanId})
            .mockResolvedValueOnce(DEFAULT_STATE);

        await expect(adapter.start()).resolves.toStrictEqual("reset");
        expect(adapter.driver.context.netParams.panId).toStrictEqual(DEFAULT_PAN_ID);
        expect(readNetworkStateSpy).toHaveBeenCalledTimes(2);

        readNetworkStateSpy.mockRestore();
    });

    it("resets network on mismatch extended PAN ID", async () => {
        const oldExtPanId = 0x1234123412341234n;
        const readNetworkStateSpy = vi
            .spyOn(adapter.driver.context, "readNetworkState")
            .mockResolvedValueOnce({...DEFAULT_STATE, extendedPanId: oldExtPanId})
            .mockResolvedValueOnce(DEFAULT_STATE);

        await expect(adapter.start()).resolves.toStrictEqual("reset");
        expect(adapter.driver.context.netParams.extendedPanId).toStrictEqual(Buffer.from(DEFAULT_EXT_PAN_ID).readBigUInt64LE());
        expect(readNetworkStateSpy).toHaveBeenCalledTimes(2);

        readNetworkStateSpy.mockRestore();
    });

    it("resets network on mismatch network key", async () => {
        const oldNetworkKey = Buffer.from("00110011001100110011001100110011", "hex");
        const readNetworkStateSpy = vi
            .spyOn(adapter.driver.context, "readNetworkState")
            .mockResolvedValueOnce({...DEFAULT_STATE, networkKey: oldNetworkKey})
            .mockResolvedValueOnce(DEFAULT_STATE);

        await expect(adapter.start()).resolves.toStrictEqual("reset");
        expect(adapter.driver.context.netParams.networkKey).toStrictEqual(Buffer.from(DEFAULT_NETWORK_KEY));
        expect(readNetworkStateSpy).toHaveBeenCalledTimes(2);

        readNetworkStateSpy.mockRestore();
    });
});
