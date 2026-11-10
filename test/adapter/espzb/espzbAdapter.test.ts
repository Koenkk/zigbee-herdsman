import {existsSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {EspZbAdapter} from "../../../src/adapter/espzb/adapter/espzbAdapter";
import {AppSignal, CommandId, EspZbStatus, NetworkState} from "../../../src/adapter/espzb/consts";
import {EspZbStatusError} from "../../../src/adapter/espzb/driver";
import {logger} from "../../../src/utils/logger";
import * as ZSpec from "../../../src/zspec";
import * as Zcl from "../../../src/zspec/zcl";
import * as Zdo from "../../../src/zspec/zdo";
import {COORD_IEEE_LE, FakeNcp} from "./fakeNcp";

const TEMP_PATH = "espzb-tmp";
const BACKUP_PATH = join(TEMP_PATH, "coordinator_backup.json");
const NETWORK = {
    panID: 0x1a62,
    extendedPanID: [0xdd, 0x11, 0x22, 0xdd, 0xdd, 0x33, 0x44, 0xdd],
    channelList: [15],
    networkKey: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
};

const flush = async (ms = 0): Promise<void> => await new Promise((r) => setTimeout(r, ms));

describe("espzb adapter", () => {
    let adapter: EspZbAdapter;
    let ncp: FakeNcp;

    const create = (options: Partial<{transmitPower: number}> = {}): EspZbAdapter => {
        const a = new EspZbAdapter(NETWORK, {path: "tcp://127.0.0.1:6638", adapter: "espzb"}, BACKUP_PATH, {disableLED: false, ...options});
        vi.spyOn(a.driver, "connect").mockResolvedValue();
        vi.spyOn(a.driver, "disconnect").mockResolvedValue();
        ncp = new FakeNcp();
        ncp.attach(a);
        return a;
    };

    const startFormed = async (): Promise<void> => {
        adapter = create();
        await adapter.start();
        ncp.requests.length = 0;
    };

    beforeAll(() => {
        mkdirSync(TEMP_PATH, {recursive: true});
    });

    afterAll(() => {
        rmSync(TEMP_PATH, {recursive: true, force: true});
    });

    beforeEach(() => {
        if (existsSync(BACKUP_PATH)) rmSync(BACKUP_PATH);
    });

    afterEach(async () => {
        await adapter?.stop();
    });

    describe("startup", () => {
        it("forms a network on a factory-new NCP (reset)", async () => {
            adapter = create({transmitPower: 20});
            await expect(adapter.start()).resolves.toStrictEqual("reset");
            const ids = ncp.ids();
            expect(ids).toContain(CommandId.NETWORK_START);
            expect(ids.filter((i) => i === CommandId.ZCL_ENDPOINT_ADD)).toHaveLength(2);
            expect(ids.indexOf(CommandId.NETWORK_PRIMARY_KEY_SET)).toBeLessThan(ids.indexOf(CommandId.NETWORK_FORM));
            expect(ncp.panId).toStrictEqual(NETWORK.panID);
            expect([...ncp.extPanId]).toStrictEqual(NETWORK.extendedPanID);
            expect([...ncp.key]).toStrictEqual(NETWORK.networkKey);
            expect(ncp.channel).toStrictEqual(15);
            expect(ncp.txPower).toStrictEqual(19);
            await expect(adapter.getCoordinatorIEEE()).resolves.toStrictEqual("0x7cdfa1fffe5a31c0");
            await expect(adapter.getNetworkParameters()).resolves.toStrictEqual({
                panID: 0x1a62,
                extendedPanID: "0xdd4433dddd2211dd",
                channel: 15,
                nwkUpdateID: 0,
            });
        });

        it("resumes when the NCP runs the configured network", async () => {
            adapter = create();
            ncp.stored = {panId: NETWORK.panID, extPanId: Buffer.from(NETWORK.extendedPanID), channel: 15, key: Buffer.from(NETWORK.networkKey)};
            await expect(adapter.start()).resolves.toStrictEqual("resumed");
            expect(ncp.ids()).not.toContain(CommandId.NETWORK_FORM);
        });

        it("resumes after a host reconnect without restarting the stack", async () => {
            adapter = create();
            Object.assign(ncp, {state: NetworkState.CONNECTED, factoryNew: false, panId: NETWORK.panID, channel: 15});
            ncp.extPanId = Buffer.from(NETWORK.extendedPanID);
            ncp.key = Buffer.from(NETWORK.networkKey);
            await expect(adapter.start()).resolves.toStrictEqual("resumed");
            expect(ncp.ids()).not.toContain(CommandId.NETWORK_START);
        });

        it.each([
            ["network key", {key: Buffer.alloc(16, 9)}],
            ["PAN ID", {panId: 0x1234}],
            ["extended PAN ID", {extPanId: Buffer.alloc(8, 1)}],
        ])("leaves and re-forms when the %s differs (reset)", async (_name, diff) => {
            adapter = create();
            ncp.stored = {
                panId: NETWORK.panID,
                extPanId: Buffer.from(NETWORK.extendedPanID),
                channel: 15,
                key: Buffer.from(NETWORK.networkKey),
                ...diff,
            };
            await expect(adapter.start()).resolves.toStrictEqual("reset");
            expect(ncp.ids()).toContain(CommandId.NETWORK_LEAVE);
            expect(ncp.ids()).toContain(CommandId.NETWORK_FORM);
            expect([...ncp.key]).toStrictEqual(NETWORK.networkKey);
        });

        it("leaves when the NCP is not a coordinator", async () => {
            adapter = create();
            ncp.stored = {panId: NETWORK.panID, extPanId: Buffer.from(NETWORK.extendedPanID), channel: 15, key: Buffer.from(NETWORK.networkKey)};
            ncp.role = 1;
            await expect(adapter.start()).resolves.toStrictEqual("reset");
        });

        it("restores from a matching espzb backup (restored)", async () => {
            writeFileSync(
                BACKUP_PATH,
                JSON.stringify({
                    metadata: {format: "zigpy/open-coordinator-backup", version: 1, source: "test", internal: {date: "", espzbVersion: 1}},
                    stack_specific: {},
                    coordinator_ieee: "00124b0012345678",
                    pan_id: "1a62",
                    extended_pan_id: Buffer.from(NETWORK.extendedPanID).reverse().toString("hex"),
                    nwk_update_id: 3,
                    security_level: 5,
                    channel: 15,
                    channel_mask: [15],
                    network_key: {key: Buffer.from(NETWORK.networkKey).toString("hex"), sequence_number: 2, frame_counter: 1000},
                    devices: [],
                }),
            );
            adapter = create();
            await expect(adapter.start()).resolves.toStrictEqual("restored");
            expect(ncp.ieee.toString("hex")).toStrictEqual("78563412004b1200");
            expect(ncp.frameCounter).toStrictEqual(3500);
            expect(ncp.updateId).toStrictEqual(3);
            expect(ncp.keySeq).toStrictEqual(2);
        });

        it("restores the coordinator IEEE from an ember backup (little-endian)", async () => {
            writeFileSync(
                BACKUP_PATH,
                JSON.stringify({
                    metadata: {format: "zigpy/open-coordinator-backup", version: 1, source: "test", internal: {date: "", ezspVersion: 13}},
                    stack_specific: {ezsp: {hashed_tclk: "00"}},
                    coordinator_ieee: "78563412004b1200",
                    pan_id: "1a62",
                    extended_pan_id: Buffer.from(NETWORK.extendedPanID).toString("hex"),
                    nwk_update_id: 0,
                    security_level: 5,
                    channel: 15,
                    channel_mask: [15],
                    network_key: {key: Buffer.from(NETWORK.networkKey).toString("hex"), sequence_number: 0, frame_counter: 10},
                    devices: [],
                }),
            );
            adapter = create();
            await expect(adapter.start()).resolves.toStrictEqual("restored");
            expect(ncp.ieee.toString("hex")).toStrictEqual("78563412004b1200");
        });

        it("ignores a backup that does not match the configuration", async () => {
            writeFileSync(
                BACKUP_PATH,
                JSON.stringify({
                    metadata: {format: "zigpy/open-coordinator-backup", version: 1, source: "test", internal: {date: "", znpVersion: 2}},
                    coordinator_ieee: "00124b0012345678",
                    pan_id: "9999",
                    extended_pan_id: "0000000000000000",
                    nwk_update_id: 0,
                    security_level: 5,
                    channel: 15,
                    channel_mask: [15],
                    network_key: {key: "00", sequence_number: 0, frame_counter: 0},
                    devices: [],
                }),
            );
            adapter = create();
            await expect(adapter.start()).resolves.toStrictEqual("reset");
        });

        it("ignores a backup in an unknown format", async () => {
            writeFileSync(BACKUP_PATH, JSON.stringify({adapterType: "zStack", data: {}}));
            adapter = create();
            await expect(adapter.start()).resolves.toStrictEqual("reset");
        });

        it("fails when the firmware is not an espzb NCP", async () => {
            adapter = create();
            ncp.statusOverride.set(CommandId.EXT_GET_INFO, EspZbStatus.NOT_SUPPORTED);
            await expect(adapter.start()).rejects.toThrow("does not implement the espzb protocol extensions");
        });

        it("fails on an unsupported protocol major version", async () => {
            adapter = create();
            ncp.extMajor = 2;
            await expect(adapter.start()).rejects.toThrow("Unsupported espzb protocol version 2.0");
        });

        it("fails when the NCP does not answer", async () => {
            adapter = create();
            adapter.driver.requestTimeout = 5;
            adapter.driver.writer = () => {};
            await expect(adapter.start()).rejects.toThrow("No response from NCP");
        });

        it("fails when formation fails", async () => {
            adapter = create();
            const form = ncp.statusOverride;
            form.set(CommandId.NETWORK_FORM, EspZbStatus.INVALID_STATE);
            await expect(adapter.start()).rejects.toThrow(EspZbStatusError);
        });
    });

    describe("operation", () => {
        beforeEach(async () => {
            await startFormed();
        });

        it("reports version and capabilities", async () => {
            await expect(adapter.getCoordinatorVersion()).resolves.toStrictEqual({
                type: "espzb",
                meta: {revision: "espzb-ncp 0.1.0", firmware: "0.1.0", chip: "esp32s31", chipRevision: 0, sdk: "2.0.4", idf: "v6.1", protocol: "1.0"},
            });
            await expect(adapter.supportsBackup()).resolves.toStrictEqual(true);
            await expect(adapter.reset("soft")).rejects.toThrow("not supported");
        });

        it("rejects inter-PAN", async () => {
            const frame = Zcl.Frame.create(
                Zcl.FrameType.SPECIFIC,
                Zcl.Direction.CLIENT_TO_SERVER,
                true,
                undefined,
                1,
                "scanRequest",
                "touchlink",
                {transactionID: 1, zigbeeInformation: 4, touchlinkInformation: 18},
                {},
            );
            await expect(adapter.setChannelInterPAN(11)).rejects.toThrow("Inter-PAN");
            await expect(adapter.sendZclFrameInterPANToIeeeAddr(frame, "0x0011223344556677")).rejects.toThrow("Inter-PAN");
            await expect(adapter.sendZclFrameInterPANBroadcast(frame, 100, true)).rejects.toThrow("Inter-PAN");
            await expect(adapter.restoreChannelInterPAN()).rejects.toThrow("Inter-PAN");
        });

        it("sends ZDO and resolves the response (TSN + sender matching)", async () => {
            ncp.onAps = (req) => {
                ncp.confirm(req.sn, 0);
                const rsp = Buffer.from([req.asdu[0], 0x00, 0x34, 0x12, 0x02, 0x01, 0x02]);
                ncp.indication({src: 0x1234, srcEp: 0, dstEp: 0, profile: 0, cluster: 0x8005, asdu: rsp});
            };
            const payload = Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST, 0x1234);
            const zdoSpy = vi.fn();
            adapter.on("zdoResponse", zdoSpy);
            const result = await adapter.sendZdo("0x00124b0012345678", 0x1234, Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST, payload, false);
            expect(result).toStrictEqual([Zdo.Status.SUCCESS, {nwkAddress: 0x1234, endpointList: [1, 2]}]);
            expect(ncp.aps[0]).toMatchObject({profileId: 0, clusterId: 0x0005, dstEndpoint: 0, srcEndpoint: 0, txOptions: 0x04});
            expect(zdoSpy).toHaveBeenCalledWith(Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE, result);
        });

        it("rejects a ZDO request early on delivery failure", async () => {
            ncp.onAps = (req) => ncp.confirm(req.sn, 0xe9);
            const payload = Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 0x1234);
            await expect(adapter.sendZdo("0x00124b0012345678", 0x1234, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, payload, false)).rejects.toThrow(
                "delivery failed with status 0xe9",
            );
        });

        it("sends ZDO without response and waits for the unicast confirm", async () => {
            const payload = Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.LEAVE_REQUEST, "0x00124b0012345678", Zdo.LeaveRequestFlags.WITHOUT_REJOIN);
            await expect(adapter.sendZdo("0x00124b0012345678", 0x1234, Zdo.ClusterId.LEAVE_REQUEST, payload, true)).resolves.toBeUndefined();
            ncp.onAps = (req) => ncp.confirm(req.sn, 0xa7);
            await expect(adapter.sendZdo("0x00124b0012345678", 0x1234, Zdo.ClusterId.LEAVE_REQUEST, payload, true)).rejects.toThrow("0xa7");
        });

        it("resolves NETWORK_ADDRESS_RESPONSE by IEEE", async () => {
            ncp.onAps = (req) => {
                const rsp = Buffer.concat([Buffer.from([req.asdu[0], 0]), Buffer.from("78563412004b1200", "hex"), Buffer.from([0x34, 0x12])]);
                ncp.indication({src: 0x1234, srcEp: 0, dstEp: 0, profile: 0, cluster: 0x8000, asdu: rsp});
            };
            const payload = Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, "0x00124b0012345678", false, 0);
            const result = await adapter.sendZdo(
                "0x00124b0012345678",
                ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE,
                Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
                payload,
                false,
            );
            expect(Zdo.Buffalo.checkStatus(result)).toStrictEqual(true);
            expect(ncp.aps[0].txOptions).toStrictEqual(0);
        });

        it("changes channel through the NCP (EXT_CHANNEL_CHANGE)", async () => {
            const payload = Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.NWK_UPDATE_REQUEST, [20], 0xfe, undefined, 1, undefined);
            await adapter.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.SLEEPY, Zdo.ClusterId.NWK_UPDATE_REQUEST, payload, true);
            expect(ncp.channel).toStrictEqual(20);
            expect(ncp.updateId).toStrictEqual(1);
            expect(ncp.aps).toHaveLength(0);
        });

        it("permit join: all, coordinator only, specific router", async () => {
            await adapter.permitJoin(60);
            expect(ncp.ids()).toContain(CommandId.NETWORK_PERMIT_JOINING);
            expect(ncp.aps[0]).toMatchObject({dst: 0xfffc, clusterId: 0x0036});
            ncp.aps.length = 0;
            await adapter.permitJoin(0, 0);
            expect(ncp.aps).toHaveLength(0);
            ncp.onAps = (req) => ncp.indication({src: 0x1234, srcEp: 0, dstEp: 0, profile: 0, cluster: 0x8036, asdu: Buffer.from([req.asdu[0], 0])});
            await adapter.permitJoin(60, 0x1234);
            expect(ncp.aps[0]).toMatchObject({dst: 0x1234, clusterId: 0x0036});
            ncp.onAps = (req) =>
                ncp.indication({src: 0x1234, srcEp: 0, dstEp: 0, profile: 0, cluster: 0x8036, asdu: Buffer.from([req.asdu[0], 0x84])});
            await expect(adapter.permitJoin(60, 0x1234)).rejects.toThrow(Zdo.StatusError);
        });

        it("sends ZCL with default response and retries recoverable delivery failures", async () => {
            let attempts = 0;
            ncp.onAps = (req) => {
                attempts++;
                if (attempts === 1) return ncp.confirm(req.sn, 0xe9);
                ncp.confirm(req.sn, 0);
                const dflt = Buffer.from([0x18, req.asdu[1], 0x0b, 0x01, 0x00]);
                ncp.indication({src: 0x1234, srcEp: 1, dstEp: 1, profile: 0x0104, cluster: 6, asdu: dflt});
            };
            const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, false, undefined, 10, "on", "genOnOff", {}, {});
            const result = await adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 1, frame, 1000, false, false);
            expect(result?.header?.commandIdentifier).toStrictEqual(0x0b);
            expect(ncp.aps).toHaveLength(2);
            expect(ncp.aps[0]).toMatchObject({dst: 0x1234, dstEndpoint: 1, srcEndpoint: 1, profileId: 0x0104, clusterId: 6, txOptions: 0x04});
        });

        it("does not retry with disableRecovery or non-recoverable failures", async () => {
            ncp.onAps = (req) => ncp.confirm(req.sn, 0xe9);
            const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 11, "off", "genOnOff", {}, {});
            await expect(adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 1, frame, 1000, true, true)).rejects.toThrow("0xe9");
            expect(ncp.aps).toHaveLength(1);
            ncp.onAps = (req) => ncp.confirm(req.sn, 0xc2);
            await expect(adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 1, frame, 1000, true, false)).rejects.toThrow("0xc2");
            expect(ncp.aps).toHaveLength(2);
        });

        it("resolves ZCL without response once confirmed; GP endpoint uses the GP profile", async () => {
            const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 12, "toggle", "genOnOff", {}, {});
            await expect(adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 242, frame, 1000, true, false, 242)).resolves.toBeUndefined();
            expect(ncp.aps[0].profileId).toStrictEqual(ZSpec.GP_PROFILE_ID);
        });

        it("backs off while the NCP is busy", async () => {
            ncp.statusOverride.set(CommandId.APS_DATA_REQUEST, EspZbStatus.BUSY);
            const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 13, "on", "genOnOff", {}, {});
            await adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 1, frame, 1000, true, false);
            expect(ncp.ids().filter((i) => i === CommandId.APS_DATA_REQUEST)).toHaveLength(2);
        });

        it("sends to groups and broadcasts", async () => {
            const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 14, "on", "genOnOff", {}, {});
            await adapter.sendZclFrameToGroup(7, frame);
            expect(ncp.aps[0]).toMatchObject({dstMode: 1, dst: 7, dstEndpoint: 0xff, txOptions: 0});
            await adapter.sendZclFrameToAll(0xff, frame, 1, ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE);
            expect(ncp.aps[1]).toMatchObject({dstMode: 2, dst: 0xfffd, dstEndpoint: 0xff});
            ncp.onAps = (req) => ncp.confirm(req.sn, 0xe1);
            await expect(adapter.sendZclFrameToGroup(7, frame, 242)).rejects.toThrow("0xe1");
        });

        it("retransmits a request whose response was lost (same sn)", async () => {
            adapter.driver.requestTimeout = 20;
            ncp.dropResponses = 1;
            await expect(adapter.getNetworkParameters()).resolves.toMatchObject({panID: 0x1a62});
            const panGets = ncp.requests.filter((r) => r.id === CommandId.NETWORK_PAN_ID_GET);
            expect(panGets).toHaveLength(2);
            expect(panGets[0].sn).toStrictEqual(panGets[1].sn);
        });

        it("retransmits immediately when the NCP reports a corrupted frame", async () => {
            adapter.driver.requestTimeout = 5000;
            ncp.dropResponses = 1;
            const p = adapter.getNetworkParameters();
            await flush(5);
            ncp.notify(CommandId.EXT_FRAME_ERROR, Buffer.from([1]));
            await expect(p).resolves.toMatchObject({panID: 0x1a62});
        });

        it("emits zclPayload and resolves waitFor", async () => {
            const spy = vi.fn();
            adapter.on("zclPayload", spy);
            const waiter = adapter.waitFor(0x1234, 1, Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, 5, 0x0402, 0x0a, undefined, 1000);
            ncp.indication({src: 0x1234, srcEp: 1, dstEp: 1, profile: 0x0104, cluster: 0x0402, asdu: Buffer.from("18050a000029290900", "hex")});
            const payload = await waiter.promise;
            expect(payload).toMatchObject({clusterID: 0x0402, address: 0x1234, endpoint: 1, linkquality: 180, groupID: 0, wasBroadcast: false});
            expect(spy).toHaveBeenCalledTimes(1);
            const cancelled = adapter.waitFor(0x1234, 1, Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, 6, 0x0402, 0x0a, undefined, 1000);
            cancelled.cancel();
            ncp.indication({
                src: 0x1234,
                srcEp: 1,
                dstEp: 0xff,
                profile: 0x0104,
                cluster: 6,
                asdu: Buffer.from("01060100", "hex"),
                dstMode: 1,
                dst: 7,
            });
            await flush();
            expect(spy.mock.calls[1][0]).toMatchObject({groupID: 7, wasBroadcast: true});
        });

        it("emits zdoResponse for device announce and ignores ZDO requests from devices", async () => {
            const spy = vi.fn();
            adapter.on("zdoResponse", spy);
            ncp.indication({src: 0x1234, srcEp: 0, dstEp: 0, profile: 0, cluster: 0x0002, asdu: Buffer.from([1, 0, 0])});
            const annce = Buffer.concat([Buffer.from([7, 0x34, 0x12]), Buffer.from("78563412004b1200", "hex"), Buffer.from([0x80])]);
            ncp.indication({src: 0x1234, srcEp: 0, dstEp: 0, profile: 0, cluster: 0x0013, asdu: annce});
            ncp.indication({src: 0x1234, srcEp: 0, dstEp: 0, profile: 0, cluster: 0x8002, asdu: Buffer.from([1])}); // malformed
            await flush();
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual(Zdo.ClusterId.END_DEVICE_ANNOUNCE);
        });

        it("maps app signals to deviceJoined / deviceLeave", async () => {
            const joined = vi.fn();
            const left = vi.fn();
            adapter.on("deviceJoined", joined);
            adapter.on("deviceLeave", left);
            const ieee = Buffer.from("78563412004b1200", "hex");
            const update = (status: number, action: number): Buffer => Buffer.concat([ieee, Buffer.from([0x34, 0x12, status, action, 0, 0])]);
            ncp.appSignal(AppSignal.ZDO_DEVICE_UPDATE, update(1, 0));
            ncp.appSignal(AppSignal.ZDO_DEVICE_UPDATE, update(1, 1)); // denied
            ncp.appSignal(AppSignal.ZDO_DEVICE_UPDATE, update(2, 0)); // left
            ncp.appSignal(AppSignal.ZDO_LEAVE_INDICATION, Buffer.concat([Buffer.from([0x34, 0x12]), ieee, Buffer.from([0])]));
            ncp.appSignal(AppSignal.ZDO_LEAVE_INDICATION, Buffer.concat([Buffer.from([0x34, 0x12]), ieee, Buffer.from([1])])); // rejoin
            ncp.appSignal(AppSignal.NWK_PERMIT_JOIN_STATUS, Buffer.from([60]));
            ncp.appSignal(AppSignal.ZDO_DEVICE_UPDATE, Buffer.from([1])); // truncated
            ncp.notify(CommandId.NETWORK_JOIN, Buffer.alloc(11));
            ncp.notify(CommandId.NETWORK_PERMIT_JOINING, Buffer.from([0]));
            ncp.notify(CommandId.EXT_LOG, Buffer.from("\x03hello"));
            ncp.notify(0x0eff, Buffer.alloc(0));
            ncp.notify(CommandId.EXT_APP_SIGNAL, Buffer.from([1]));
            await flush();
            expect(joined).toHaveBeenCalledWith({networkAddress: 0x1234, ieeeAddr: "0x00124b0012345678"});
            expect(joined).toHaveBeenCalledTimes(1);
            expect(left).toHaveBeenCalledTimes(2);
        });

        it("creates a backup with devices known to the NCP", async () => {
            const backup = await adapter.backup(["0x00124b0012345601", "0x00124b0012345602", "0x7cdfa1fffe5a31c0", "0x12"]);
            expect(backup).toMatchObject({
                networkOptions: {panId: 0x1a62, channelList: [15], networkKeyDistribute: false},
                logicalChannel: 15,
                networkKeyInfo: {sequenceNumber: 0, frameCounter: 100},
                networkUpdateId: 0,
                espzb: {version: 1},
            });
            expect(backup.coordinatorIeeeAddress.toString("hex")).toStrictEqual("7cdfa1fffe5a31c0");
            expect(backup.networkOptions.extendedPanId.toString("hex")).toStrictEqual("dd4433dddd2211dd");
            expect(backup.devices).toStrictEqual([
                {networkAddress: 0x1234, ieeeAddress: Buffer.from("00124b0012345601", "hex"), isDirectChild: false},
            ]);
        });

        it("adds install codes", async () => {
            await adapter.addInstallCode("0x00124b0012345678", Buffer.from("83FED3407A939723A5C639B26916D505C3B5", "hex"), false);
            expect(ncp.installCodes[0].toString("hex")).toStrictEqual(
                `${COORD_IEEE_LE.length === 8 ? "78563412004b1200" : ""}0383fed3407a939723a5c639b26916d505c3b5`,
            );
            await adapter.addInstallCode("0x00124b0012345678", Buffer.alloc(16), true); // pre-hashed: skipped
            expect(ncp.installCodes).toHaveLength(1);
            await expect(adapter.addInstallCode("0x00124b0012345678", Buffer.alloc(5), false)).rejects.toThrow("Invalid install code length");
        });

        it("disconnects on NCP reboot, network loss or port close", async () => {
            const spy = vi.fn();
            adapter.on("disconnected", spy);
            ncp.notify(CommandId.EXT_BOOT, Buffer.from([1, 1, 0]));
            await flush();
            expect(spy).toHaveBeenCalledTimes(1);

            await startFormed();
            adapter.on("disconnected", spy);
            ncp.setState(NetworkState.OFFLINE);
            await flush();
            expect(spy).toHaveBeenCalledTimes(2);

            await startFormed();
            adapter.on("disconnected", spy);
            adapter.transport.emit("close");
            // once, from `Adapter`: the espzb adapter only stops its watchdog
            expect(spy).toHaveBeenCalledTimes(3);
        });

        it("detects lost notifications", async () => {
            ncp.notify(CommandId.NETWORK_PERMIT_JOINING, Buffer.from([0]), 100);
            await flush();
            const baseline = adapter.driver.lostNotifications;
            ncp.notify(CommandId.NETWORK_PERMIT_JOINING, Buffer.from([0]), 101);
            ncp.notify(CommandId.NETWORK_PERMIT_JOINING, Buffer.from([0]), 104); // 102, 103 lost
            ncp.notify(CommandId.NETWORK_PERMIT_JOINING, Buffer.from([0]), 105);
            await flush();
            expect(adapter.driver.lostNotifications - baseline).toStrictEqual(2);
        });

        it("pings the NCP when idle and disconnects after repeated failures", async () => {
            await adapter.stop();
            vi.useFakeTimers({toFake: ["setInterval", "Date"]});
            try {
                adapter = create();
                await adapter.start();
                const spy = vi.fn();
                adapter.on("disconnected", spy);
                await vi.advanceTimersByTimeAsync(60000);
                await flush(20);
                expect(ncp.ids()).toContain(CommandId.EXT_PING);
                adapter.driver.requestTimeout = 1;
                adapter.driver.writer = (): void => {};
                const req = vi.spyOn(adapter.driver, "request");
                for (let i = 0; i < 3; i++) {
                    await vi.advanceTimersByTimeAsync(60000);
                    // timer granularity differs per OS (~15 ms on Windows): wait for the ping to actually fail
                    await Promise.allSettled(req.mock.results.map((r) => r.value));
                }
                await flush();
                expect(spy).toHaveBeenCalledTimes(1);
            } finally {
                vi.useRealTimers();
            }
        });
    });

    describe("edge cases", () => {
        const writeBackup = (internal: Record<string, unknown>): void => {
            writeFileSync(
                BACKUP_PATH,
                JSON.stringify({
                    metadata: {format: "zigpy/open-coordinator-backup", version: 1, source: "test", internal: {date: "", ...internal}},
                    coordinator_ieee: "00124b0012345678",
                    pan_id: "1a62",
                    extended_pan_id: Buffer.from(NETWORK.extendedPanID).reverse().toString("hex"),
                    nwk_update_id: 0,
                    security_level: 5,
                    channel: 15,
                    channel_mask: [15],
                    network_key: {key: Buffer.from(NETWORK.networkKey).toString("hex"), sequence_number: 0, frame_counter: 10},
                    devices: [],
                }),
            );
        };

        it("before start: empty version meta, ZNSP leave notification used without APP_SIGNAL, close not handled by espzb", async () => {
            adapter = create();
            await expect(adapter.getCoordinatorVersion()).resolves.toStrictEqual({type: "espzb", meta: {}});
            const left = vi.fn();
            const disconnected = vi.fn();
            adapter.on("deviceLeave", left);
            adapter.on("disconnected", disconnected);
            ncp.notify(CommandId.NETWORK_LEAVE, Buffer.concat([Buffer.from([0x34, 0x12]), Buffer.from("78563412004b1200", "hex"), Buffer.from([0])]));
            adapter.transport.emit("close");
            await flush();
            expect(left).toHaveBeenCalledWith({networkAddress: 0x1234, ieeeAddr: "0x00124b0012345678"});
            // only the one from `Adapter`
            expect(disconnected).toHaveBeenCalledTimes(1);
        });

        it("waits for a commissioning already in progress", async () => {
            adapter = create();
            Object.assign(ncp, {state: NetworkState.JOINING});
            setTimeout(() => ncp.setState(NetworkState.OFFLINE), 10);
            await expect(adapter.start()).resolves.toStrictEqual("reset");
        });

        it("erases a commissioned but offline NCP before forming", async () => {
            adapter = create();
            Object.assign(ncp, {state: NetworkState.OFFLINE, factoryNew: false});
            await expect(adapter.start()).resolves.toStrictEqual("reset");
            expect(ncp.ids()).toContain(CommandId.NETWORK_LEAVE);
        });

        it("polls the state when notifications are missed (and survives a failed poll)", async () => {
            adapter = create();
            ncp.silentState = true;
            ncp.infoTruncated = true;
            const overrides = ncp.statusOverride;
            setTimeout(() => overrides.set(CommandId.NETWORK_STATE, EspZbStatus.BUSY), 20);
            await expect(adapter.start()).resolves.toStrictEqual("reset");
            await expect(adapter.getCoordinatorVersion()).resolves.toMatchObject({meta: {chip: ""}});
        }, 10000);

        it("times out when the stack never reaches the expected state", async () => {
            vi.useFakeTimers({toFake: ["setTimeout", "clearTimeout", "Date"]});
            try {
                adapter = create();
                Object.assign(ncp, {state: NetworkState.JOINING});
                ncp.silentState = true;
                const started = adapter.start();
                const result = expect(started).rejects.toThrow("Timeout waiting for pending commissioning");
                await vi.advanceTimersByTimeAsync(32000);
                await result;
            } finally {
                vi.useRealTimers();
            }
        });

        it("restores from a third-party backup (source other)", async () => {
            writeBackup({});
            adapter = create();
            await expect(adapter.start()).resolves.toStrictEqual("restored");
        });

        it.each([
            // the backup stores 00124b0012345678; ncp.ieee is the NCP's little-endian (wire) EUI-64
            ["legacy ezsp (EZSP < 13, big-endian)", 12, "78563412004b1200", false],
            ["ember (EZSP 13, ambiguous, assumed little-endian)", 13, "00124b0012345678", true],
            ["ember (EZSP > 13, little-endian)", 14, "00124b0012345678", false],
        ])("restores the coordinator IEEE from a %s backup", async (_name, ezspVersion, expectedIeee, warns) => {
            const warning = vi.spyOn(logger, "warning");
            writeBackup({ezspVersion});
            adapter = create();
            await expect(adapter.start()).resolves.toStrictEqual("restored");
            expect(ncp.ieee.toString("hex")).toStrictEqual(expectedIeee);
            expect(warning.mock.calls.some(([msg]) => String(msg).startsWith("EZSP v13 backup"))).toStrictEqual(warns);
        });

        it("restores without IEEE / frame counter when the NCP lacks BACKUP_RESTORE", async () => {
            writeBackup({espzbVersion: 1});
            adapter = create();
            ncp.capabilities = 0x1de;
            await expect(adapter.start()).resolves.toStrictEqual("restored");
            expect(ncp.ids()).not.toContain(CommandId.NETWORK_LONG_ADDRESS_SET);
        });

        it("fails when formation ends offline or on another network", async () => {
            adapter = create();
            ncp.formResult = "fail";
            await expect(adapter.start()).rejects.toThrow("Network formation failed (NCP state OFFLINE)");
            await adapter.stop();
            adapter = create();
            ncp.formResult = "wrongChannel";
            await expect(adapter.start()).rejects.toThrow("NCP formed a different network than requested");
        });

        it("handles unusual notifications while running", async () => {
            await startFormed();
            const joined = vi.fn();
            const disconnected = vi.fn();
            const zcl = vi.fn();
            adapter.on("deviceJoined", joined);
            adapter.on("disconnected", disconnected);
            adapter.on("zclPayload", zcl);
            const ieee = Buffer.from("78563412004b1200", "hex");
            ncp.appSignal(AppSignal.ZDO_DEVICE_UPDATE, Buffer.concat([ieee, Buffer.from([0x34, 0x12, 9, 0, 0, 0])])); // unknown status
            ncp.notify(CommandId.APS_DATA_INDICATION, Buffer.alloc(5)); // invalid
            const ind = Buffer.alloc(36 + 5);
            ind[0] = 5;
            ind[1] = 2;
            ind[11] = 3; // IEEE source
            ieee.copy(ind, 12);
            ind.writeUInt16LE(0x0104, 21);
            ind.writeUInt16LE(6, 23);
            ind.writeUInt32LE(5, 32);
            Buffer.from("18010a0000", "hex").copy(ind, 36);
            ncp.notify(CommandId.APS_DATA_INDICATION, ind);
            ncp.notify(CommandId.NETWORK_STACK_STATUS_HANDLER, Buffer.from([0x55, 0]));
            await flush();
            expect(joined).toHaveBeenCalledTimes(1);
            expect(zcl.mock.calls[0][0].address).toStrictEqual("0x00124b0012345678");
            expect(disconnected).toHaveBeenCalledTimes(1);
        });

        it("gives up when the NCP stays busy and rethrows other request errors", async () => {
            await startFormed();
            vi.useFakeTimers({toFake: ["setTimeout", "clearTimeout"]});
            try {
                ncp.apsStatus = EspZbStatus.BUSY;
                const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 30, "on", "genOnOff", {}, {});
                const sent = adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 1, frame, 1000, true, false);
                const result = expect(sent).rejects.toThrow(EspZbStatusError);
                await vi.advanceTimersByTimeAsync(15000);
                await result;
                ncp.apsStatus = EspZbStatus.NETWORK_DOWN;
                await expect(adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 1, frame, 1000, true, false)).rejects.toThrow(
                    "NETWORK_DOWN",
                );
            } finally {
                vi.useRealTimers();
            }
        });

        it("backup propagates unexpected lookup errors", async () => {
            await startFormed();
            ncp.statusOverride.set(CommandId.NETWORK_IEEE_TO_SHORT, EspZbStatus.ERR_FATAL);
            await expect(adapter.backup(["0x00124b0012345601"])).rejects.toThrow(EspZbStatusError);
        });

        it("channel change without update id, command response, broadcast from the GP endpoint", async () => {
            await startFormed();
            const payload = Buffer.from([0, 0x00, 0x00, 0x10, 0x00, 0xfe]); // channel 20, no nwkUpdateId
            await adapter.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.SLEEPY, Zdo.ClusterId.NWK_UPDATE_REQUEST, payload, true);
            expect(ncp.channel).toStrictEqual(20);
            expect(ncp.updateId).toStrictEqual(0);

            ncp.onAps = (req): void => {
                ncp.confirm(req.sn, 0);
                const rsp = Buffer.from([0x18, req.asdu[1], 0x01, 0x05, 0x00, 0x00, 0x42, 0x03, 0x61, 0x62, 0x63]);
                ncp.indication({src: 0x1234, srcEp: 1, dstEp: 1, profile: 0x0104, cluster: 0, asdu: rsp});
            };
            const read = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.CLIENT_TO_SERVER,
                true,
                undefined,
                31,
                "read",
                "genBasic",
                [{attrId: 5}],
                {},
            );
            const result = await adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 1, read, 1000, false, false);
            expect(result?.header?.commandIdentifier).toStrictEqual(0x01);

            ncp.onAps = (req): void => ncp.confirm(req.sn, 0);
            const gp = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 32, "on", "genOnOff", {}, {});
            await adapter.sendZclFrameToAll(242, gp, 242, ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE);
            expect(ncp.aps.at(-1)?.profileId).toStrictEqual(ZSpec.GP_PROFILE_ID);
        });
        it("uses notified states that overtake the NETWORK_START response", async () => {
            adapter = create();
            ncp.fastStart = true;
            await expect(adapter.start()).resolves.toStrictEqual("reset");
        });

        it("restores from a backup without internal metadata", async () => {
            writeFileSync(
                BACKUP_PATH,
                JSON.stringify({
                    metadata: {format: "zigpy/open-coordinator-backup", version: 1, source: "zigpy"},
                    coordinator_ieee: "00124b0012345678",
                    pan_id: "1a62",
                    extended_pan_id: Buffer.from(NETWORK.extendedPanID).reverse().toString("hex"),
                    nwk_update_id: 0,
                    security_level: 5,
                    channel: 15,
                    channel_mask: [15],
                    network_key: {key: Buffer.from(NETWORK.networkKey).toString("hex"), sequence_number: 0, frame_counter: 10},
                    devices: [],
                }),
            );
            adapter = create();
            await expect(adapter.start()).resolves.toStrictEqual("restored");
        });

        it("logs unparseable ZDO responses of unknown clusters and rethrows transport errors", async () => {
            await startFormed();
            const spy = vi.fn();
            adapter.on("zdoResponse", spy);
            ncp.indication({src: 0x1234, srcEp: 0, dstEp: 0, profile: 0, cluster: 0x80ee, asdu: Buffer.from([1, 2])});
            await flush();
            expect(spy).not.toHaveBeenCalled();
            adapter.driver.requestTimeout = 1;
            ncp.dropResponses = 3;
            const frame = Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 33, "on", "genOnOff", {}, {});
            await expect(adapter.sendZclFrameToEndpoint("0x00124b0012345678", 0x1234, 1, frame, 1000, true, false)).rejects.toThrow(
                "no response after 3 attempts",
            );
        });

        it("skips the watchdog ping while the link is active", async () => {
            await adapter.stop();
            vi.useFakeTimers({toFake: ["setInterval", "Date"]});
            try {
                adapter = create();
                await adapter.start();
                await vi.advanceTimersByTimeAsync(59000);
                ncp.notify(CommandId.NETWORK_PERMIT_JOINING, Buffer.from([0]));
                await flush();
                const pingsBefore = ncp.ids().filter((i) => i === CommandId.EXT_PING).length;
                await vi.advanceTimersByTimeAsync(1000);
                await flush(20);
                expect(ncp.ids().filter((i) => i === CommandId.EXT_PING).length).toStrictEqual(pingsBefore);
            } finally {
                vi.useRealTimers();
            }
        });
    });
});
