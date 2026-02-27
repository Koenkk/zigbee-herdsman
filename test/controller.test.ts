import fs from "node:fs";
import path from "node:path";
import equals from "fast-deep-equal/es6";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {ZStackAdapter} from "../src/adapter/z-stack/adapter/zStackAdapter";
import {Controller} from "../src/controller";
import type * as Events from "../src/controller/events";
import GreenPower from "../src/controller/greenPower";
import Request from "../src/controller/helpers/request";
import zclTransactionSequenceNumber from "../src/controller/helpers/zclTransactionSequenceNumber";
import {Device, Endpoint, Group} from "../src/controller/model";
import {InterviewState} from "../src/controller/model/device";
import type * as Models from "../src/models";
import * as Utils from "../src/utils";
import {setLogger} from "../src/utils/logger";
import * as timeService from "../src/utils/timeService";
import * as ZSpec from "../src/zspec";
import {BroadcastAddress} from "../src/zspec/enums";
import * as Zcl from "../src/zspec/zcl";
import type {CustomClusters} from "../src/zspec/zcl/definition/tstype";
import * as Zdo from "../src/zspec/zdo";
import type {IEEEAddressResponse, NetworkAddressResponse} from "../src/zspec/zdo/definition/tstypes";
import {DEFAULT_184_CHECKIN_INTERVAL, LQI_TABLE_ENTRY_DEFAULTS, MOCK_DEVICES, ROUTING_TABLE_ENTRY_DEFAULTS} from "./mockDevices";

const globalSetImmediate = setImmediate;
const flushPromises = () => new Promise(globalSetImmediate);

const mockLogger = {
    debug: vi.fn((messageOrLambda) => {
        if (typeof messageOrLambda === "function") messageOrLambda();
    }),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
};

const mockDummyBackup: Models.Backup = {
    networkOptions: {
        panId: 6755,
        extendedPanId: Buffer.from("deadbeef01020304", "hex"),
        channelList: [11],
        networkKey: Buffer.from("a1a2a3a4a5a6a7a8b1b2b3b4b5b6b7b8", "hex"),
        networkKeyDistribute: false,
    },
    coordinatorIeeeAddress: Buffer.from("0102030405060708", "hex"),
    logicalChannel: 11,
    networkUpdateId: 0,
    securityLevel: 5,
    znp: {
        version: 1,
    },
    networkKeyInfo: {
        sequenceNumber: 0,
        frameCounter: 10000,
    },
    devices: [
        {
            networkAddress: 1001,
            ieeeAddress: Buffer.from("c1c2c3c4c5c6c7c8", "hex"),
            isDirectChild: false,
        },
        {
            networkAddress: 1002,
            ieeeAddress: Buffer.from("d1d2d3d4d5d6d7d8", "hex"),
            isDirectChild: false,
            linkKey: {
                key: Buffer.from("f8f7f6f5f4f3f2f1e1e2e3e4e5e6e7e8", "hex"),
                rxCounter: 10000,
                txCounter: 5000,
            },
        },
    ],
};

type AdapterEvent = "zclPayload" | "deviceJoined" | "deviceLeave" | "zdoResponse" | "disconnected";

const mockAdapterEvents: Record<AdapterEvent, (...args: unknown[]) => void> = {
    zclPayload: () => {},
    deviceJoined: () => {},
    deviceLeave: () => {},
    zdoResponse: () => {},
    disconnected: () => {},
};
const mockAdapterWaitFor = vi.fn();
const mockAdapterSupportsDiscoverRoute = vi.fn();
const mockSetChannelInterPAN = vi.fn();
const mocksendZclFrameInterPANToIeeeAddr = vi.fn();
const mocksendZclFrameInterPANBroadcast = vi.fn();
const mockRestoreChannelInterPAN = vi.fn();
const mockAdapterPermitJoin = vi.fn();
const mockDiscoverRoute = vi.fn();
const mockAdapterSupportsBackup = vi.fn().mockReturnValue(true);
const mockAdapterReset = vi.fn();
const mockAdapterStop = vi.fn();
const mockAdapterStart = vi.fn().mockReturnValue("resumed");
const mockAdapterGetCoordinatorIEEE = vi.fn().mockReturnValue("0x0000012300000000");
const mockAdapterGetNetworkParameters = vi.fn().mockReturnValue({panID: 1, extendedPanID: "0x64c5fd698daf0c00", channel: 15, nwkUpdateID: 0});
const mocksendZclFrameToGroup = vi.fn();
const mocksendZclFrameToAll = vi.fn();
const mockAddInstallCode = vi.fn();
const mocksendZclFrameToEndpoint = vi.fn();
const mockApaterBackup = vi.fn(() => Promise.resolve(mockDummyBackup));
let sendZdoResponseStatus = Zdo.Status.SUCCESS;
const mockAdapterSendZdo = vi
    .fn()
    .mockImplementation(async (_ieeeAddress: string, networkAddress: number, clusterId: Zdo.ClusterId, payload: Buffer, _disableResponse: true) => {
        if (sendZdoResponseStatus !== Zdo.Status.SUCCESS) {
            return [sendZdoResponseStatus, undefined];
        }

        if (ZSpec.BroadcastAddress[networkAddress]) {
            // TODO
        } else {
            const device = MOCK_DEVICES[networkAddress];

            if (!device) {
                throw new Error(`Mock device ${networkAddress} not found`);
            }

            switch (clusterId) {
                case Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST: {
                    if (device.key === "xiaomi") {
                        const frame = Zcl.Frame.create(
                            0,
                            1,
                            true,
                            undefined,
                            10,
                            "readRsp",
                            0,
                            [{attrId: 5, status: 0, dataType: 66, attrData: "lumi.occupancy"}],
                            {},
                        );
                        await mockAdapterEvents.zclPayload({
                            wasBroadcast: false,
                            address: networkAddress,
                            clusterID: frame.cluster.ID,
                            data: frame.toBuffer(),
                            header: frame.header,
                            endpoint: 1,
                            linkquality: 50,
                            groupID: 1,
                        });
                    }

                    if (!device.nodeDescriptor) {
                        throw new Error("NODE_DESCRIPTOR_REQUEST timeout");
                    }

                    return device.nodeDescriptor;
                }

                case Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST: {
                    if (!device.activeEndpoints) {
                        throw new Error("ACTIVE_ENDPOINTS_REQUEST timeout");
                    }

                    return device.activeEndpoints;
                }

                case Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST: {
                    if (!device.simpleDescriptor) {
                        throw new Error("SIMPLE_DESCRIPTOR_REQUEST timeout");
                    }

                    // XXX: only valid if hasZdoMessageOverhead === false
                    const endpoint = payload[2];

                    if (device.simpleDescriptor[endpoint] === undefined) {
                        throw new Error(`SIMPLE_DESCRIPTOR_REQUEST(${endpoint}) timeout`);
                    }

                    return device.simpleDescriptor[endpoint];
                }

                case Zdo.ClusterId.LQI_TABLE_REQUEST: {
                    if (!device.lqiTable) {
                        throw new Error("LQI_TABLE_REQUEST timeout");
                    }

                    return device.lqiTable;
                }

                case Zdo.ClusterId.ROUTING_TABLE_REQUEST: {
                    if (!device.routingTable) {
                        throw new Error("ROUTING_TABLE_REQUEST timeout");
                    }

                    return device.routingTable;
                }

                case Zdo.ClusterId.BINDING_TABLE_REQUEST: {
                    if (!device.bindingTable) {
                        throw new Error("BINDING_TABLE_REQUEST timeout");
                    }

                    return device.bindingTable;
                }

                default: {
                    // Zdo.ClusterId.LEAVE_REQUEST, Zdo.ClusterId.BIND_REQUEST, Zdo.ClusterId.UNBIND_REQUEST
                    return [Zdo.Status.SUCCESS, undefined];
                }
            }
        }
    });

let iasZoneReadState170Count = 0;
let enroll170 = true;
let configureReportStatus = 0;
let configureReportDefaultRsp = false;
let lastSentZclFrameToEndpoint: Buffer | undefined;

const restoreMocksendZclFrameToEndpoint = () => {
    mocksendZclFrameToEndpoint.mockImplementation((_ieeeAddr, networkAddress, endpoint, frame: Zcl.Frame) => {
        lastSentZclFrameToEndpoint = frame.toBuffer();

        if (
            frame.header.isGlobal &&
            frame.isCommand("read") &&
            (frame.isCluster("genBasic") || frame.isCluster("ssIasZone") || frame.isCluster("genPollCtrl") || frame.isCluster("hvacThermostat"))
        ) {
            const payload: {[key: string]: unknown}[] = [];
            const cluster = frame.cluster;
            for (const item of frame.payload) {
                if (item.attrId !== 65314) {
                    const attribute = cluster.getAttribute(item.attrId);

                    if (attribute) {
                        if (frame.isCluster("ssIasZone") && item.attrId === 0) {
                            iasZoneReadState170Count++;
                            payload.push({
                                attrId: item.attrId,
                                dataType: attribute.type,
                                attrData: iasZoneReadState170Count === 2 && enroll170 ? 1 : 0,
                                status: 0,
                            });
                        } else {
                            payload.push({
                                attrId: item.attrId,
                                dataType: attribute.type,
                                attrData: MOCK_DEVICES[networkAddress]!.attributes![endpoint][attribute.name],
                                status: 0,
                            });
                        }
                    }
                }
            }

            const responseFrame = Zcl.Frame.create(0, 1, true, undefined, 10, "readRsp", frame.cluster.ID, payload, {});
            return {clusterID: responseFrame.cluster.ID, header: responseFrame.header, data: responseFrame.toBuffer()};
        }

        if (frame.header.isSpecific && (frame.isCommand("add") || frame.isCommand("remove")) && frame.isCluster("genGroups")) {
            const responseFrame = Zcl.Frame.create(
                1,
                1,
                true,
                undefined,
                10,
                `${frame.command.name}Rsp`,
                frame.cluster.ID,
                {status: 0, groupid: 1},
                {},
            );
            return {clusterID: frame.cluster.ID, header: responseFrame.header, data: responseFrame.toBuffer()};
        }

        if (
            networkAddress === 170 &&
            frame.header.isGlobal &&
            frame.isCluster("ssIasZone") &&
            frame.isCommand("write") &&
            frame.payload[0].attrId === 16
        ) {
            // Write of ias cie address
            const response = Zcl.Frame.create(
                Zcl.FrameType.SPECIFIC,
                Zcl.Direction.SERVER_TO_CLIENT,
                false,
                undefined,
                1,
                "enrollReq",
                Zcl.Utils.getCluster("ssIasZone", undefined, {}).ID,
                {zonetype: 0, manucode: 1},
                {},
            );

            mockAdapterEvents.zclPayload({
                wasBroadcast: false,
                address: 170,
                clusterID: response.cluster.ID,
                data: response.toBuffer(),
                header: response.header,
                endpoint: 1,
                linkquality: 50,
                groupID: 1,
            });
        }

        if (frame.header.isGlobal && frame.isCommand("write")) {
            const payload: {[key: string]: unknown}[] = [];
            for (const item of frame.payload) {
                payload.push({attrId: item.attrId, status: 0});
            }

            const responseFrame = Zcl.Frame.create(0, 1, true, undefined, 10, "writeRsp", 0, payload, {});
            return {clusterID: responseFrame.cluster.ID, header: responseFrame.header, data: responseFrame.toBuffer()};
        }

        if (frame.header.isGlobal && frame.isCommand("configReport")) {
            let payload;
            let cmd;
            if (configureReportDefaultRsp) {
                payload = {cmdId: 1, statusCode: configureReportStatus};
                cmd = "defaultRsp";
            } else {
                payload = [];
                cmd = "configReportRsp";
                for (const item of frame.payload) {
                    payload.push({attrId: item.attrId, status: configureReportStatus, direction: 1});
                }
            }

            const responseFrame = Zcl.Frame.create(0, 1, true, undefined, 10, cmd, 0, payload, {});
            return {clusterID: responseFrame.cluster.ID, header: responseFrame.header, data: responseFrame.toBuffer()};
        }
    });
};

const mocksClear = [
    mockAdapterStart,
    mocksendZclFrameToEndpoint,
    mockAdapterReset,
    mocksendZclFrameToGroup,
    mockSetChannelInterPAN,
    mocksendZclFrameInterPANToIeeeAddr,
    mocksendZclFrameInterPANBroadcast,
    mockRestoreChannelInterPAN,
    mockAddInstallCode,
    mockAdapterGetNetworkParameters,
    mockAdapterSendZdo,
    mockLogger.debug,
    mockLogger.info,
    mockLogger.warning,
    mockLogger.error,
];
const deepClone = (obj: object | undefined) => JSON.parse(JSON.stringify(obj));

const equalsPartial = (objA: object, objB: object) => {
    for (const [key, value] of Object.entries(objB)) {
        if (!equals(objA[key as keyof typeof objA], value)) {
            return false;
        }
    }

    return true;
};

vi.mock("../src/utils/wait", () => ({
    wait: vi.fn(() => {
        return new Promise<void>((resolve) => resolve());
    }),
}));

let dummyBackup: Models.UnifiedBackupStorage | undefined;

vi.mock("../src/adapter/z-stack/adapter/zStackAdapter", () => ({
    ZStackAdapter: vi.fn(() => ({
        hasZdoMessageOverhead: false,
        manufacturerID: 0x0007,
        on: (event: AdapterEvent, handler: (...args: unknown[]) => void) => {
            mockAdapterEvents[event] = handler;
        },
        removeAllListeners: (event: AdapterEvent) => delete mockAdapterEvents[event],
        start: mockAdapterStart,
        getCoordinatorIEEE: mockAdapterGetCoordinatorIEEE,
        reset: mockAdapterReset,
        supportsBackup: mockAdapterSupportsBackup,
        backup: mockApaterBackup,
        getCoordinatorVersion: () => {
            return {type: "zStack", meta: {version: 1}};
        },
        getNetworkParameters: mockAdapterGetNetworkParameters,
        waitFor: mockAdapterWaitFor,
        sendZclFrameToEndpoint: mocksendZclFrameToEndpoint,
        sendZclFrameToGroup: mocksendZclFrameToGroup,
        sendZclFrameToAll: mocksendZclFrameToAll,
        addInstallCode: mockAddInstallCode,
        permitJoin: mockAdapterPermitJoin,
        supportsDiscoverRoute: mockAdapterSupportsDiscoverRoute,
        discoverRoute: mockDiscoverRoute,
        stop: mockAdapterStop,
        setChannelInterPAN: mockSetChannelInterPAN,
        sendZclFrameInterPANToIeeeAddr: mocksendZclFrameInterPANToIeeeAddr,
        sendZclFrameInterPANBroadcast: mocksendZclFrameInterPANBroadcast,
        restoreChannelInterPAN: mockRestoreChannelInterPAN,
        sendZdo: mockAdapterSendZdo,
    })),
}));

const TEMP_PATH = path.resolve("temp");

const getTempFile = (filename: string): string => {
    if (!fs.existsSync(TEMP_PATH)) {
        fs.mkdirSync(TEMP_PATH);
    }

    return path.join(TEMP_PATH, filename);
};

const mocksRestore = [mockAdapterPermitJoin, mockAdapterStop, mocksendZclFrameToAll];

const events: {
    deviceJoined: Events.DeviceJoinedPayload[];
    deviceInterview: Events.DeviceInterviewPayload[];
    deviceInterviewRaw: Events.DeviceInterviewPayload[];
    adapterDisconnected: number[];
    deviceAnnounce: Events.DeviceAnnouncePayload[];
    deviceLeave: Events.DeviceLeavePayload[];
    message: Events.MessagePayload[];
    permitJoinChanged: Events.PermitJoinChangedPayload[];
    lastSeenChanged: Events.LastSeenChangedPayload[];
    deviceNetworkAddressChanged: Events.DeviceNetworkAddressChangedPayload[];
} = {
    deviceJoined: [],
    deviceInterview: [],
    deviceInterviewRaw: [],
    adapterDisconnected: [],
    deviceAnnounce: [],
    deviceLeave: [],
    message: [],
    permitJoinChanged: [],
    lastSeenChanged: [],
    deviceNetworkAddressChanged: [],
};

const backupPath = getTempFile("backup");

const mockAcceptJoiningDeviceHandler = vi.fn((_ieeeAddr: string): Promise<boolean> => Promise.resolve(true));
const options = {
    network: {
        panID: 0x1a63,
        channelList: [15],
    },
    serialPort: {
        baudRate: 115200,
        rtscts: true,
        path: "/dev/ttyUSB0",
        adapter: "zstack" as const,
    },
    adapter: {
        disableLED: false,
    },
    databasePath: getTempFile("database.db"),
    databaseBackupPath: getTempFile("database.db.backup"),
    backupPath,
    acceptJoiningDeviceHandler: mockAcceptJoiningDeviceHandler,
};

const databaseContents = () => fs.readFileSync(options.databasePath).toString();

describe("Controller", () => {
    let controller: Controller;
    let mockedDate: Date;

    beforeAll(() => {
        mockedDate = new Date();

        vi.useFakeTimers();
        vi.setSystemTime(mockedDate);
        setLogger(mockLogger);
        dummyBackup = Utils.BackupUtils.toUnifiedBackup(mockDummyBackup);
    });

    afterAll(() => {
        vi.useRealTimers();
        fs.rmSync(TEMP_PATH, {recursive: true, force: true});
    });

    beforeEach(() => {
        vi.setSystemTime(mockedDate);
        sendZdoResponseStatus = Zdo.Status.SUCCESS;
        for (const m of mocksRestore) m.mockRestore();
        for (const m of mocksClear) m.mockClear();
        MOCK_DEVICES[174]!.attributes![1].checkinInterval = DEFAULT_184_CHECKIN_INTERVAL;
        // @ts-expect-error mock
        zclTransactionSequenceNumber.sequence = -1;
        iasZoneReadState170Count = 0;
        configureReportStatus = 0;
        configureReportDefaultRsp = false;
        enroll170 = true;
        options.network.channelList = [15];

        for (const event in events) {
            events[event as keyof typeof events] = [];
        }

        Device.resetCache();
        Group.resetCache();

        if (fs.existsSync(options.databasePath)) {
            fs.unlinkSync(options.databasePath);
        }
        controller = new Controller(options);
        controller.on("permitJoinChanged", (data) => events.permitJoinChanged.push(data));
        controller.on("deviceJoined", (data) => events.deviceJoined.push(data));
        controller.on("deviceInterview", (data) => {
            events.deviceInterview.push(deepClone(data));
            events.deviceInterviewRaw.push(data);
        });
        controller.on("adapterDisconnected", () => events.adapterDisconnected.push(1));
        controller.on("deviceAnnounce", (data) => events.deviceAnnounce.push(data));
        controller.on("deviceLeave", (data) => events.deviceLeave.push(data));
        controller.on("message", (data) => events.message.push(data));
        controller.on("lastSeenChanged", (data) => events.lastSeenChanged.push(data));
        controller.on("deviceNetworkAddressChanged", (data) => events.deviceNetworkAddressChanged.push(data));
        restoreMocksendZclFrameToEndpoint();
    });

    it("Call controller constructor options mixed with default options", async () => {
        await controller.start();
        expect(ZStackAdapter).toHaveBeenCalledWith(
            {
                networkKeyDistribute: false,
                networkKey: [1, 3, 5, 7, 9, 11, 13, 15, 0, 2, 4, 6, 8, 10, 12, 13],
                panID: 6755,
                extendedPanID: [221, 221, 221, 221, 221, 221, 221, 221],
                channelList: [15],
            },
            {baudRate: 115200, path: "/dev/ttyUSB0", rtscts: true, adapter: "zstack"},
            backupPath,
            {disableLED: false},
        );
    }, 10000); // randomly times out for some reason

    it("Call controller constructor error on invalid channel", () => {
        options.network.channelList = [10];
        expect(() => {
            new Controller(options);
        }).toThrowError("'10' is an invalid channel, use a channel between 11 - 26.");
    });

    it("Call controller constructor error when network key too small", () => {
        const newOptions = deepClone(options);
        newOptions.network.networkKey = [1, 2, 3];
        expect(() => {
            new Controller(newOptions);
        }).toThrowError(`Network key must be a 16 digits long array, got ${newOptions.network.networkKey}.`);
    });

    it("Call controller constructor error when extendedPanID is too long", () => {
        const newOptions = deepClone(options);
        newOptions.network.extendedPanID = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
        expect(() => {
            new Controller(newOptions);
        }).toThrowError(`ExtendedPanID must be an 8 digits long array, got ${newOptions.network.extendedPanID}.`);
    });

    it("Call controller constructor error with invalid panID", () => {
        const newOptions = deepClone(options);
        newOptions.network.panID = 0xffff;
        expect(() => {
            new Controller(newOptions);
        }).toThrowError("PanID must have a value of 0x0001 (1) - 0xFFFE (65534), got 65535.");

        newOptions.network.panID = 0;
        expect(() => {
            new Controller(newOptions);
        }).toThrowError("PanID must have a value of 0x0001 (1) - 0xFFFE (65534), got 0.");
    });

    it("Controller stop, should create backup", async () => {
        // @ts-expect-error private
        const databaseSaveSpy = vi.spyOn(controller, "databaseSave");
        await controller.start();
        databaseSaveSpy.mockClear();
        if (fs.existsSync(options.backupPath)) fs.unlinkSync(options.backupPath);
        expect(controller.isStopping()).toBeFalsy();
        expect(controller.isAdapterDisconnected()).toBeFalsy();
        await controller.stop();
        expect(controller.isStopping()).toBeTruthy();
        expect(controller.isAdapterDisconnected()).toBeTruthy();
        expect(mockAdapterPermitJoin).toHaveBeenCalledWith(0);
        expect(JSON.parse(fs.readFileSync(options.backupPath).toString())).toStrictEqual(JSON.parse(JSON.stringify(dummyBackup)));
        expect(mockAdapterStop).toHaveBeenCalledTimes(1);
        expect(databaseSaveSpy).toHaveBeenCalledTimes(1);
    });

    it("Syncs runtime lookups", async () => {
        await controller.start();
        // @ts-expect-error private
        Device.devices.clear();
        // @ts-expect-error private
        Device.deletedDevices.clear();
        // @ts-expect-error private
        Group.groups.clear();

        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        // @ts-expect-error private
        expect(Device.devices.size).toStrictEqual(1);
        // @ts-expect-error private
        expect(Device.deletedDevices.size).toStrictEqual(0);
        expect(Device.byIeeeAddr("0x129", false)).toBeInstanceOf(Device);
        expect(Device.byIeeeAddr("0x128", false)).toBeUndefined();

        await mockAdapterEvents.deviceJoined({networkAddress: 128, ieeeAddr: "0x128"});
        await mockAdapterEvents.deviceLeave({networkAddress: 128, ieeeAddr: "0x128"});
        // @ts-expect-error private
        expect(Device.devices.size).toStrictEqual(1);
        // @ts-expect-error private
        expect(Device.deletedDevices.size).toStrictEqual(1);
        expect(Device.byIeeeAddr("0x128", false)).toBeUndefined();
        expect(Device.byIeeeAddr("0x128", true)).toBeInstanceOf(Device);

        await mockAdapterEvents.deviceJoined({networkAddress: 128, ieeeAddr: "0x128"});
        // @ts-expect-error private
        expect(Device.devices.size).toStrictEqual(2);
        // @ts-expect-error private
        expect(Device.deletedDevices.size).toStrictEqual(0);
        const device2 = Device.byIeeeAddr("0x128", false);
        expect(device2).toBeInstanceOf(Device);
        expect(() => {
            device2!.undelete();
        }).toThrow(`Device '0x128' is not deleted`);

        controller.createGroup(1);
        // @ts-expect-error private
        expect(Group.groups.size).toStrictEqual(1);
        expect(Group.byGroupID(1)).toBeInstanceOf(Group);
        expect(Group.byGroupID(2)).toBeUndefined();

        const group2 = controller.createGroup(2);
        group2.removeFromNetwork();
        // @ts-expect-error private
        expect(Group.groups.size).toStrictEqual(1);
        expect(Group.byGroupID(1)).toBeInstanceOf(Group);
        expect(Group.byGroupID(2)).toBeUndefined();

        await controller.stop();

        // @ts-expect-error private
        expect(Device.devices.size).toStrictEqual(0);
        // @ts-expect-error private
        expect(Device.deletedDevices.size).toStrictEqual(0);
        // @ts-expect-error private
        expect(Group.groups.size).toStrictEqual(0);
    });

    it("Controller start", async () => {
        const abortController = new AbortController();
        await controller.start(abortController.signal);
        expect(mockAdapterStart).toHaveBeenCalledTimes(1);
        expect(deepClone(controller.getDevicesByType("Coordinator")[0])).toStrictEqual({
            ID: 1,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _customClusters: {},
            _endpoints: [
                {
                    deviceID: 3,
                    _events: {},
                    _eventsCount: 0,
                    inputClusters: [10],
                    outputClusters: [11],
                    pendingRequests: {
                        id: 1,
                        deviceIeeeAddress: "0x0000012300000000",
                        sendInProgress: false,
                    },
                    profileID: 2,
                    ID: 1,
                    meta: {},
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                },
                {
                    deviceID: 5,
                    _events: {},
                    _eventsCount: 0,
                    inputClusters: [1],
                    outputClusters: [0],
                    pendingRequests: {
                        id: 2,
                        deviceIeeeAddress: "0x0000012300000000",
                        sendInProgress: false,
                    },
                    profileID: 3,
                    meta: {},
                    ID: 2,
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                },
            ],
            _ieeeAddr: "0x0000012300000000",
            _interviewState: InterviewState.Successful,
            _skipDefaultResponse: false,
            _manufacturerID: 0x0007,
            _networkAddress: 0,
            _type: "Coordinator",
            meta: {},
        });
        expect(JSON.parse(fs.readFileSync(options.backupPath).toString())).toStrictEqual(JSON.parse(JSON.stringify(dummyBackup)));
        vi.advanceTimersByTime(86500000);
    });

    it("aborts start on signal", async () => {
        const abortController = new AbortController();
        mockAdapterStart.mockImplementationOnce(async () => {
            abortController.abort();

            return await Promise.resolve("resumed");
        });
        const getNetworkParametersSpy = vi.spyOn(controller, "getNetworkParameters");
        const backupSpy = vi.spyOn(controller, "backup");
        const deviceResetCacheSpy = vi.spyOn(Device, "resetCache");
        const groupResetCacheSpy = vi.spyOn(Group, "resetCache");

        try {
            await expect(controller.start(abortController.signal)).rejects.toThrow("This operation was aborted");
            expect(mockAdapterStart).toHaveBeenCalledTimes(1);
            expect(getNetworkParametersSpy).toHaveBeenCalledTimes(0);
            expect(backupSpy).toHaveBeenCalledTimes(0);
            expect(deviceResetCacheSpy).toHaveBeenCalledTimes(0);
            expect(groupResetCacheSpy).toHaveBeenCalledTimes(0);
        } finally {
            getNetworkParametersSpy.mockRestore();
            backupSpy.mockRestore();
            deviceResetCacheSpy.mockRestore();
            groupResetCacheSpy.mockRestore();
        }
    });

    it("Controller update ieeeAddr if changed", async () => {
        await controller.start();
        expect(controller.getDevicesByType("Coordinator")[0].ieeeAddr).toStrictEqual("0x0000012300000000");
        await controller.stop();
        mockAdapterGetCoordinatorIEEE.mockReturnValueOnce("0x123444");
        await controller.start();
        expect(controller.getDevicesByType("Coordinator")[0].ieeeAddr).toStrictEqual("0x123444");
    });

    it("Touchlink factory reset first", async () => {
        await controller.start();
        let counter = 0;
        mocksendZclFrameInterPANBroadcast.mockImplementation(() => {
            counter++;
            if (counter === 1) {
                throw new Error("no response");
            }

            if (counter === 2) {
                return {address: "0x0000012300000000"};
            }
        });
        const result = await controller.touchlink.factoryResetFirst();
        expect(result).toBeTruthy();

        expect(mockSetChannelInterPAN).toHaveBeenCalledTimes(2);
        expect(mockSetChannelInterPAN).toHaveBeenCalledWith(11);
        expect(mockSetChannelInterPAN).toHaveBeenCalledWith(15);
        expect(mocksendZclFrameInterPANBroadcast).toHaveBeenCalledTimes(2);
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[0][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 0,
            },
            payload: {transactionID: expect.any(Number), zigbeeInformation: 4, touchlinkInformation: 18},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 0,
                response: 1,
                parameters: expect.any(Array),
                name: "scanRequest",
                required: true,
            },
        });
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[1][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 0,
            },
            payload: {transactionID: expect.any(Number), zigbeeInformation: 4, touchlinkInformation: 18},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 0,
                response: 1,
                parameters: expect.any(Array),
                name: "scanRequest",
                required: true,
            },
        });
        expect(mockRestoreChannelInterPAN).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameInterPANToIeeeAddr).toHaveBeenCalledTimes(2);
        expect(deepClone(mocksendZclFrameInterPANToIeeeAddr.mock.calls[0][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 6,
            },
            payload: {transactionID: expect.any(Number), duration: 65535},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 6,
                parameters: expect.any(Array),
                name: "identifyRequest",
                required: true,
            },
        });
        expect(deepClone(mocksendZclFrameInterPANToIeeeAddr.mock.calls[1][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 7,
            },
            payload: {transactionID: expect.any(Number)},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {ID: 7, parameters: expect.any(Array), name: "resetToFactoryNew", required: true},
        });
    });

    it("Touchlink scan", async () => {
        await controller.start();
        let counter = 0;
        mocksendZclFrameInterPANBroadcast.mockImplementation(() => {
            counter++;
            if (counter === 1) {
                throw new Error("no response");
            }

            if (counter === 2) {
                return {address: "0x0000012300000000"};
            }
        });
        const result = await controller.touchlink.scan();
        expect(result).toStrictEqual([{ieeeAddr: "0x0000012300000000", channel: 15}]);

        expect(mockSetChannelInterPAN).toHaveBeenCalledTimes(16);
        expect(mockSetChannelInterPAN).toHaveBeenCalledWith(11);
        expect(mockSetChannelInterPAN).toHaveBeenCalledWith(15);
        expect(mocksendZclFrameInterPANBroadcast).toHaveBeenCalledTimes(16);
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[0][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 0,
            },
            payload: {transactionID: expect.any(Number), zigbeeInformation: 4, touchlinkInformation: 18},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 0,
                response: 1,
                parameters: expect.any(Array),
                name: "scanRequest",
                required: true,
            },
        });
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[1][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 0,
            },
            payload: {transactionID: expect.any(Number), zigbeeInformation: 4, touchlinkInformation: 18},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 0,
                response: 1,
                parameters: expect.any(Array),
                name: "scanRequest",
                required: true,
            },
        });
        expect(mockRestoreChannelInterPAN).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameInterPANToIeeeAddr).toHaveBeenCalledTimes(0);
    });

    it("Touchlink lock", async () => {
        await controller.start();
        let resolve: (() => void) | undefined;
        mockSetChannelInterPAN.mockImplementationOnce(() => {
            return new Promise<void>((r) => {
                resolve = r;
            });
        });
        const r1 = controller.touchlink.scan();

        let error;
        try {
            await controller.touchlink.scan();
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error("Touchlink operation already in progress"));
        resolve?.();
        await r1;
    });

    it("Touchlink factory reset", async () => {
        await controller.start();
        mocksendZclFrameInterPANBroadcast.mockImplementation(() => {
            return {address: "0x0000012300000000"};
        });
        await controller.touchlink.factoryReset("0x0000012300000000", 15);

        expect(mockSetChannelInterPAN).toHaveBeenCalledTimes(1);
        expect(mockSetChannelInterPAN).toHaveBeenCalledWith(15);
        expect(mocksendZclFrameInterPANBroadcast).toHaveBeenCalledTimes(1);
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[0][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 0,
            },
            payload: {transactionID: expect.any(Number), zigbeeInformation: 4, touchlinkInformation: 18},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 0,
                response: 1,
                parameters: expect.any(Array),
                name: "scanRequest",
                required: true,
            },
        });
        expect(mockRestoreChannelInterPAN).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameInterPANToIeeeAddr).toHaveBeenCalledTimes(2);
        expect(deepClone(mocksendZclFrameInterPANToIeeeAddr.mock.calls[0][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 6,
            },
            payload: {transactionID: expect.any(Number), duration: 65535},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 6,
                parameters: expect.any(Array),
                name: "identifyRequest",
                required: true,
            },
        });
        expect(deepClone(mocksendZclFrameInterPANToIeeeAddr.mock.calls[1][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 7,
            },
            payload: {transactionID: expect.any(Number)},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {ID: 7, parameters: expect.any(Array), name: "resetToFactoryNew", required: true},
        });
    });

    it("Touchlink identify", async () => {
        await controller.start();
        mocksendZclFrameInterPANBroadcast.mockImplementation(() => {
            return {address: "0x0000012300000000"};
        });
        await controller.touchlink.identify("0x0000012300000000", 15);

        expect(mockSetChannelInterPAN).toHaveBeenCalledTimes(1);
        expect(mockSetChannelInterPAN).toHaveBeenCalledWith(15);
        expect(mocksendZclFrameInterPANBroadcast).toHaveBeenCalledTimes(1);
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[0][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 0,
            },
            payload: {transactionID: expect.any(Number), zigbeeInformation: 4, touchlinkInformation: 18},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 0,
                response: 1,
                parameters: expect.any(Array),
                name: "scanRequest",
                required: true,
            },
        });
        expect(mockRestoreChannelInterPAN).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameInterPANToIeeeAddr).toHaveBeenCalledTimes(1);
        expect(deepClone(mocksendZclFrameInterPANToIeeeAddr.mock.calls[0][0])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 6,
            },
            payload: {transactionID: expect.any(Number), duration: 65535},
            cluster: {
                ID: 4096,
                attributes: {},
                name: "touchlink",
                commands: expect.any(Object),
                commandsResponse: expect.any(Object),
            },
            command: {
                ID: 6,
                parameters: expect.any(Array),
                name: "identifyRequest",
                required: true,
            },
        });
    });

    it("Controller should ignore touchlink messages", async () => {
        const frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            "scanResponse",
            Zcl.Utils.getCluster("touchlink", undefined, {}).ID,
            {
                transactionID: 1,
                rssiCorrection: 1,
                zigbeeInformation: 1,
                touchlinkInformation: 1,
                keyBitmask: 1,
                responseID: 1,
                extendedPanID: "0x001788010de23e6e",
                networkUpdateID: 1,
                logicalChannel: 1,
                panID: 1,
                networkAddress: 1,
                numberOfSubDevices: 0,
                totalGroupIdentifiers: 1,
            },
            {},
        );

        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            networkAddress: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(0);
    });

    it("Device should update properties when reported", async () => {
        const frame = Zcl.Frame.create(0, 1, true, undefined, 10, "readRsp", 0, [{attrId: 5, status: 0, dataType: 66, attrData: "new.model.id"}], {});
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(Device.byIeeeAddr("0x129")!.modelID).toBe("myModelID");
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(Device.byIeeeAddr("0x129")!.modelID).toBe("new.model.id");
    });

    it("Change channel on start", async () => {
        mockAdapterStart.mockReturnValueOnce("resumed");
        mockAdapterGetNetworkParameters.mockReturnValueOnce({panID: 1, extendedPanID: "0x64c5fd698daf0c00", channel: 25, nwkUpdateID: 0});
        // @ts-expect-error private
        const changeChannelSpy = vi.spyOn(controller, "changeChannel");
        const abortController = new AbortController();
        await controller.start(abortController.signal);
        expect(mockAdapterGetNetworkParameters).toHaveBeenCalledTimes(1);
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NWK_UPDATE_REQUEST, [15], 0xfe, undefined, 1, undefined);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith(
            ZSpec.BLANK_EUI64,
            ZSpec.BroadcastAddress.SLEEPY,
            Zdo.ClusterId.NWK_UPDATE_REQUEST,
            zdoPayload,
            true,
        );
        mockAdapterGetNetworkParameters.mockReturnValueOnce({panID: 1, extendedPanID: "0x64c5fd698daf0c00", channel: 15, nwkUpdateID: 1});
        expect(await controller.getNetworkParameters()).toEqual({panID: 1, channel: 15, extendedPanID: "0x64c5fd698daf0c00", nwkUpdateID: 1});
        expect(changeChannelSpy).toHaveBeenCalledTimes(1);
    });

    it("Change channel on start when nwkUpdateID is 0xff", async () => {
        mockAdapterStart.mockReturnValueOnce("resumed");
        mockAdapterGetNetworkParameters.mockReturnValueOnce({panID: 1, extendedPanID: "0x64c5fd698daf0c00", channel: 25, nwkUpdateID: 0xff});
        // @ts-expect-error private
        const changeChannelSpy = vi.spyOn(controller, "changeChannel");
        await controller.start();
        expect(mockAdapterGetNetworkParameters).toHaveBeenCalledTimes(1);
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NWK_UPDATE_REQUEST, [15], 0xfe, undefined, 0, undefined);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith(
            ZSpec.BLANK_EUI64,
            ZSpec.BroadcastAddress.SLEEPY,
            Zdo.ClusterId.NWK_UPDATE_REQUEST,
            zdoPayload,
            true,
        );
        expect(await controller.getNetworkParameters()).toEqual({panID: 1, channel: 15, extendedPanID: "0x64c5fd698daf0c00", nwkUpdateID: 0});
        expect(changeChannelSpy).toHaveBeenCalledTimes(1);
    });

    it("Does not change channel on start if not changed", async () => {
        mockAdapterStart.mockReturnValueOnce("resumed");
        // @ts-expect-error private
        const changeChannelSpy = vi.spyOn(controller, "changeChannel");
        await controller.start();
        expect(mockAdapterGetNetworkParameters).toHaveBeenCalledTimes(1);
        expect(changeChannelSpy).toHaveBeenCalledTimes(0);
    });

    it("Get coordinator version", async () => {
        await controller.start();
        expect(await controller.getCoordinatorVersion()).toEqual({type: "zStack", meta: {version: 1}});
    });

    it("Get network parameters", async () => {
        await controller.start();
        expect(await controller.getNetworkParameters()).toEqual({panID: 1, channel: 15, extendedPanID: "0x64c5fd698daf0c00", nwkUpdateID: 0});
        // cached
        expect(await controller.getNetworkParameters()).toEqual({panID: 1, channel: 15, extendedPanID: "0x64c5fd698daf0c00", nwkUpdateID: 0});
        expect(mockAdapterGetNetworkParameters).toHaveBeenCalledTimes(1);
    });

    it("Iterates over all devices", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        let devices = 0;

        for (const device of controller.getDevicesIterator()) {
            expect(device).toBeInstanceOf(Device);

            devices += 1;
        }

        expect(devices).toStrictEqual(2); // + coordinator
    });

    it("Iterates over devices with predicate", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        let devices = 0;

        for (const device of controller.getDevicesIterator((d) => d.networkAddress === 129)) {
            expect(device).toBeInstanceOf(Device);

            devices += 1;
        }

        expect(devices).toStrictEqual(1);
    });

    it("Iterates over all groups", async () => {
        await controller.start();
        controller.createGroup(1);
        controller.createGroup(2);

        let groups = 0;

        for (const group of controller.getGroupsIterator()) {
            expect(group).toBeInstanceOf(Group);

            groups += 1;
        }

        expect(groups).toStrictEqual(2);
    });

    it("Iterates over groups with predicate", async () => {
        await controller.start();
        controller.createGroup(1);
        controller.createGroup(2);

        let groups = 0;

        for (const group of controller.getGroupsIterator((d) => d.groupID === 1)) {
            expect(group).toBeInstanceOf(Group);

            groups += 1;
        }

        expect(groups).toStrictEqual(1);
    });

    it("Join a device", async () => {
        await controller.start();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(equalsPartial(events.deviceJoined[0].device, {ID: 2, networkAddress: 129, ieeeAddr: "0x129"})).toBeTruthy();
        expect(events.deviceInterview[0]).toStrictEqual({
            device: {
                _events: {},
                _eventsCount: 0,
                meta: {},
                _skipDefaultResponse: false,
                _lastSeen: Date.now(),
                ID: 2,
                _pendingRequestTimeout: 0,
                _customClusters: {},
                _endpoints: [],
                _type: "Unknown",
                _ieeeAddr: "0x129",
                _interviewState: InterviewState.Pending,
                _networkAddress: 129,
            },
            status: "started",
        });
        const device = {
            ID: 2,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _skipDefaultResponse: false,
            _lastSeen: Date.now(),
            _type: "Router",
            _ieeeAddr: "0x129",
            _networkAddress: 129,
            meta: {},
            _customClusters: {},
            _endpoints: [
                {
                    _events: {},
                    _eventsCount: 0,
                    clusters: {},
                    ID: 1,
                    inputClusters: [0, 1],
                    outputClusters: [2],
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x129", sendInProgress: false},
                    deviceNetworkAddress: 129,
                    deviceIeeeAddress: "0x129",
                    _binds: [],
                    _configuredReportings: [],
                    meta: {},
                    deviceID: 5,
                    profileID: 99,
                },
            ],
            _manufacturerID: 1212,
            _interviewState: InterviewState.Successful,
        };
        const deviceGenBasic = {
            manufacturerName: "KoenAndCo",
            powerSource: Zcl.PowerSource["Mains (single phase)"],
            modelId: "myModelID",
            appVersion: 2,
            stackVersion: 101,
            zclVersion: 1,
            hwVersion: 3,
            dateCode: "201901",
            swBuildId: "1.01",
        };
        expect(events.deviceInterview[1]).toStrictEqual({status: "successful", device: device});
        expect(events.deviceInterviewRaw[1].device.genBasic).toStrictEqual(deviceGenBasic);
        expect(deepClone(controller.getDeviceByNetworkAddress(129))).toStrictEqual(device);
        expect(events.deviceInterview.length).toBe(2);
        expect(databaseContents()).toStrictEqual(
            `
            {"id":1,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":7,"epList":[1,2],"endpoints":{"1":{"profId":2,"epId":1,"devId":3,"inClusterList":[10],"outClusterList":[11],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}},"2":{"profId":3,"epId":2,"devId":5,"inClusterList":[1],"outClusterList":[0],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}}},"interviewCompleted":true,"interviewState":"SUCCESSFUL","meta":{}}
            {"id":2,"type":"Router","ieeeAddr":"0x129","nwkAddr":129,"manufId":1212,"manufName":"KoenAndCo","powerSource":"Mains (single phase)","modelId":"myModelID","epList":[1],"endpoints":{"1":{"profId":99,"epId":1,"devId":5,"inClusterList":[0,1],"outClusterList":[2],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}}},"appVersion":2,"stackVersion":101,"hwVersion":3,"dateCode":"201901","swBuildId":"1.01","zclVersion":1,"interviewCompleted":true,"interviewState":"SUCCESSFUL","meta":{},"lastSeen":${mockedDate.getTime()}}
            `
                .trim()
                .split("\n")
                .map((l) => l.trim())
                .join("\n"),
        );
        expect(controller.getDeviceByNetworkAddress(129)!.lastSeen).toBe(Date.now());
    });

    it("Join a device and explictly accept it", async () => {
        controller = new Controller(options);
        controller.on("deviceJoined", (device) => events.deviceJoined.push(device));
        controller.on("deviceInterview", (data) => {
            events.deviceInterview.push(deepClone(data));
            events.deviceInterviewRaw.push(data);
        });
        await controller.start();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await flushPromises();
        expect(equalsPartial(events.deviceJoined[0].device, {ID: 2, networkAddress: 129, ieeeAddr: "0x129"})).toBeTruthy();
        expect(events.deviceInterview[0]).toStrictEqual({
            device: {
                meta: {},
                _skipDefaultResponse: false,
                _events: {},
                _eventsCount: 0,
                _lastSeen: Date.now(),
                ID: 2,
                _pendingRequestTimeout: 0,
                _customClusters: {},
                _endpoints: [],
                _ieeeAddr: "0x129",
                _interviewState: InterviewState.Pending,
                _networkAddress: 129,
                _type: "Unknown",
            },
            status: "started",
        });
        const device = {
            ID: 2,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _skipDefaultResponse: false,
            _lastSeen: Date.now(),
            _type: "Router",
            _ieeeAddr: "0x129",
            _networkAddress: 129,
            meta: {},
            _customClusters: {},
            _endpoints: [
                {
                    _events: {},
                    _eventsCount: 0,
                    clusters: {},
                    ID: 1,
                    inputClusters: [0, 1],
                    meta: {},
                    outputClusters: [2],
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x129", sendInProgress: false},
                    deviceNetworkAddress: 129,
                    deviceIeeeAddress: "0x129",
                    _binds: [],
                    _configuredReportings: [],
                    deviceID: 5,
                    profileID: 99,
                },
            ],
            _manufacturerID: 1212,
            _interviewState: InterviewState.Successful,
        };
        const deviceGenBasic = {
            manufacturerName: "KoenAndCo",
            powerSource: Zcl.PowerSource["Mains (single phase)"],
            modelId: "myModelID",
            appVersion: 2,
            stackVersion: 101,
            zclVersion: 1,
            hwVersion: 3,
            dateCode: "201901",
            swBuildId: "1.01",
        };
        expect(events.deviceInterview[1]).toStrictEqual({status: "successful", device: device});
        expect(events.deviceInterviewRaw[1].device.genBasic).toStrictEqual(deviceGenBasic);
        expect(deepClone(controller.getDeviceByIeeeAddr("0x129"))).toStrictEqual(device);
        expect(events.deviceInterview.length).toBe(2);
        expect(databaseContents().includes("0x129")).toBeTruthy();
        expect(controller.getDeviceByIeeeAddr("0x129")!.lastSeen).toBe(Date.now());
    });

    it("Join a device and explictly refuses it", async () => {
        mockAcceptJoiningDeviceHandler.mockResolvedValueOnce(false);
        controller = new Controller(options);
        controller.on("deviceJoined", (device) => events.deviceJoined.push(device));
        controller.on("deviceInterview", (device) => events.deviceInterview.push(deepClone(device)));
        await controller.start();
        mockAdapterSendZdo.mockClear();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(events.deviceJoined.length).toBe(0);
        expect(events.deviceInterview.length).toBe(0);
        expect(databaseContents().includes("0x129")).toBeFalsy();
        expect(controller.getDeviceByIeeeAddr("0x129")).toBeUndefined();
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.LEAVE_REQUEST, "0x129", Zdo.LeaveRequestFlags.WITHOUT_REJOIN);
        expect(mockAdapterSendZdo).toHaveBeenNthCalledWith(1, "0x129", 129, Zdo.ClusterId.LEAVE_REQUEST, zdoPayload, false);
    });

    it("Join a device and explictly refuses it but LEAVE request fails", async () => {
        mockAcceptJoiningDeviceHandler.mockResolvedValueOnce(false);
        controller = new Controller(options);
        controller.on("deviceJoined", (device) => events.deviceJoined.push(device));
        controller.on("deviceInterview", (device) => events.deviceInterview.push(deepClone(device)));
        await controller.start();
        mockAdapterSendZdo.mockClear();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        sendZdoResponseStatus = Zdo.Status.NOT_SUPPORTED;
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(events.deviceJoined.length).toBe(0);
        expect(events.deviceInterview.length).toBe(0);
        expect(databaseContents().includes("0x129")).toBeFalsy();
        expect(controller.getDeviceByIeeeAddr("0x129")).toBeUndefined();
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.LEAVE_REQUEST, "0x129", Zdo.LeaveRequestFlags.WITHOUT_REJOIN);
        expect(mockAdapterSendZdo).toHaveBeenNthCalledWith(1, "0x129", 129, Zdo.ClusterId.LEAVE_REQUEST, zdoPayload, false);
        expect(mockLogger.error).toHaveBeenCalledWith(`Failed to remove rejected device: Status 'NOT_SUPPORTED'`, "zh:controller");
    });

    it("Set device powersource by string", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.powerSource = "DC Source";
        expect(device.powerSource).toBe("DC Source");
    });

    it("Get device should return same instance", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByIeeeAddr("0x129")).toBe(controller.getDeviceByIeeeAddr("0x129"));
    });

    it("Device announce event", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(events.deviceAnnounce.length).toBe(0);
        // @ts-expect-error private
        const onDeviceAnnounceSpy = vi.spyOn(controller, "onDeviceAnnounce");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.END_DEVICE_ANNOUNCE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 129, eui64: "0x129", capabilities: Zdo.Utils.getMacCapFlags(0x10)},
        ]);
        expect(onDeviceAnnounceSpy).toHaveBeenCalledTimes(1);
        expect(events.deviceAnnounce.length).toBe(1);
        expect(events.deviceAnnounce[0].device).toBeInstanceOf(Device);
        expect(events.deviceAnnounce[0].device.ieeeAddr).toBe("0x129");
        expect(events.deviceAnnounce[0].device.modelID).toBe("myModelID");
    });

    it("Skip Device announce event from unknown device", async () => {
        await controller.start();
        // @ts-expect-error private
        const onDeviceAnnounceSpy = vi.spyOn(controller, "onDeviceAnnounce");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.END_DEVICE_ANNOUNCE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 12999, eui64: "0x12999", capabilities: Zdo.Utils.getMacCapFlags(0x10)},
        ]);
        expect(onDeviceAnnounceSpy).toHaveBeenCalledTimes(1);
        expect(events.deviceAnnounce.length).toBe(0);
    });

    it("Device announce event should update network address when different", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByNetworkAddress(129)!.ieeeAddr).toStrictEqual("0x129");
        expect(events.deviceAnnounce.length).toBe(0);
        // @ts-expect-error private
        const onDeviceAnnounceSpy = vi.spyOn(controller, "onDeviceAnnounce");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.END_DEVICE_ANNOUNCE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 9999, eui64: "0x129", capabilities: Zdo.Utils.getMacCapFlags(0x10)},
        ]);
        expect(onDeviceAnnounceSpy).toHaveBeenCalledTimes(1);
        expect(controller.getDeviceByIeeeAddr("0x129")!.networkAddress).toBe(9999);
        expect(controller.getDeviceByIeeeAddr("0x129")!.getEndpoint(1)!.deviceNetworkAddress).toBe(9999);
        expect(controller.getDeviceByNetworkAddress(129)).toBeUndefined();
        expect(controller.getDeviceByNetworkAddress(9999)!.ieeeAddr).toStrictEqual("0x129");
    });

    it("Network address event should update network address when different", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByNetworkAddress(129)!.ieeeAddr).toStrictEqual("0x129");
        // @ts-expect-error private
        const onNetworkAddressSpy = vi.spyOn(controller, "onNetworkAddress");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 9999, eui64: "0x129", startIndex: 0, assocDevList: []},
        ]);
        expect(onNetworkAddressSpy).toHaveBeenCalledTimes(1);
        expect(controller.getDeviceByIeeeAddr("0x129")!.networkAddress).toBe(9999);
        expect(controller.getDeviceByIeeeAddr("0x129")!.getEndpoint(1)!.deviceNetworkAddress).toBe(9999);
        expect(controller.getDeviceByNetworkAddress(129)).toBeUndefined();
        expect(controller.getDeviceByNetworkAddress(9999)!.ieeeAddr).toStrictEqual("0x129");
    });

    it("Network address event shouldnt update network address when the same", async () => {
        await controller.start();
        // @ts-expect-error private
        const onNetworkAddressSpy = vi.spyOn(controller, "onNetworkAddress");
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 129, eui64: "0x129", startIndex: 0, assocDevList: []},
        ]);
        expect(onNetworkAddressSpy).toHaveBeenCalledTimes(1);
        expect(controller.getDeviceByIeeeAddr("0x129")?.networkAddress).toBe(129);
        expect(controller.getDeviceByIeeeAddr("0x129")?.getEndpoint(1)?.deviceNetworkAddress).toBe(129);
    });

    it("Network address event from unknown device", async () => {
        await controller.start();
        // @ts-expect-error private
        const onNetworkAddressSpy = vi.spyOn(controller, "onNetworkAddress");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 19321, eui64: "0x19321", startIndex: 0, assocDevList: []},
        ]);
        expect(onNetworkAddressSpy).toHaveBeenCalledTimes(1);
    });

    it("Network address event should update the last seen value", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const updatedMockedDate = new Date();
        vi.setSystemTime(updatedMockedDate);
        // @ts-expect-error private
        const onNetworkAddressSpy = vi.spyOn(controller, "onNetworkAddress");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 129, eui64: "0x129", startIndex: 0, assocDevList: []},
        ]);
        expect(onNetworkAddressSpy).toHaveBeenCalledTimes(1);
        expect(events.lastSeenChanged[1].device.lastSeen).toBe(updatedMockedDate.getTime());
    });

    it("IEEE address event should update network address when different", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByNetworkAddress(129)!.ieeeAddr).toStrictEqual("0x129");
        // @ts-expect-error private
        const onIEEEAddressSpy = vi.spyOn(controller, "onIEEEAddress");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 9999, eui64: "0x129", startIndex: 0, assocDevList: []},
        ]);
        expect(onIEEEAddressSpy).toHaveBeenCalledTimes(1);
        expect(controller.getDeviceByIeeeAddr("0x129")!.networkAddress).toBe(9999);
        expect(controller.getDeviceByIeeeAddr("0x129")!.getEndpoint(1)!.deviceNetworkAddress).toBe(9999);
        expect(controller.getDeviceByNetworkAddress(129)).toBeUndefined();
        expect(controller.getDeviceByNetworkAddress(9999)!.ieeeAddr).toStrictEqual("0x129");
    });

    it("IEEE address event shouldnt update network address when the same", async () => {
        await controller.start();
        // @ts-expect-error private
        const onIEEEAddressSpy = vi.spyOn(controller, "onIEEEAddress");
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 129, eui64: "0x129", startIndex: 0, assocDevList: []},
        ]);
        expect(onIEEEAddressSpy).toHaveBeenCalledTimes(1);
        expect(controller.getDeviceByIeeeAddr("0x129")?.networkAddress).toBe(129);
        expect(controller.getDeviceByIeeeAddr("0x129")?.getEndpoint(1)?.deviceNetworkAddress).toBe(129);
    });

    it("IEEE address event from unknown device", async () => {
        await controller.start();
        // @ts-expect-error private
        const onIEEEAddressSpy = vi.spyOn(controller, "onIEEEAddress");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 19321, eui64: "0x19321", startIndex: 0, assocDevList: []},
        ]);
        expect(onIEEEAddressSpy).toHaveBeenCalledTimes(1);
    });

    it("IEEE address event should update the last seen value", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const updatedMockedDate = new Date();
        vi.setSystemTime(updatedMockedDate);
        // @ts-expect-error private
        const onIEEEAddressSpy = vi.spyOn(controller, "onIEEEAddress");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 129, eui64: "0x129", startIndex: 0, assocDevList: []},
        ]);
        expect(onIEEEAddressSpy).toHaveBeenCalledTimes(1);
        expect(events.lastSeenChanged[1].device.lastSeen).toBe(updatedMockedDate.getTime());
    });

    it("ZDO response for NETWORK_ADDRESS_RESPONSE should update network address when different", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByNetworkAddress(129)?.ieeeAddr).toStrictEqual("0x129");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 9999, eui64: "0x129", assocDevList: [], startIndex: 0},
        ]);
        expect(controller.getDeviceByIeeeAddr("0x129")?.networkAddress).toBe(9999);
        expect(controller.getDeviceByIeeeAddr("0x129")?.getEndpoint(1)?.deviceNetworkAddress).toBe(9999);
        expect(controller.getDeviceByNetworkAddress(129)).toBeUndefined();
        expect(controller.getDeviceByNetworkAddress(9999)?.ieeeAddr).toStrictEqual("0x129");
    });

    it("ZDO response for NETWORK_ADDRESS_RESPONSE shouldnt update network address when the same", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 129, eui64: "0x129", assocDevList: [], startIndex: 0},
        ]);
        expect(controller.getDeviceByIeeeAddr("0x129")?.networkAddress).toBe(129);
        expect(controller.getDeviceByIeeeAddr("0x129")?.getEndpoint(1)?.deviceNetworkAddress).toBe(129);
    });

    it("ZDO response for NETWORK_ADDRESS_RESPONSE from unknown device", async () => {
        await controller.start();
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 19321, eui64: "0x19321", assocDevList: [], startIndex: 0},
        ]);
    });

    it("ZDO response for NETWORK_ADDRESS_RESPONSE should update the last seen value", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const updatedMockedDate = new Date();
        vi.setSystemTime(updatedMockedDate);
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            Zdo.Status.SUCCESS,
            {nwkAddress: 129, eui64: "0x129", assocDevList: [], startIndex: 0},
        ]);
        expect(events.lastSeenChanged[1].device.lastSeen).toBe(updatedMockedDate.getTime());
    });

    it("ZDO response for END_DEVICE_ANNOUNCE should bubble up event", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(events.deviceAnnounce.length).toBe(0);
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.END_DEVICE_ANNOUNCE, [
            Zdo.Status.SUCCESS,
            {
                nwkAddress: 129,
                eui64: "0x129",
                capabilities: {
                    allocateAddress: 0,
                    alternatePANCoordinator: 0,
                    deviceType: 2,
                    powerSource: 0,
                    reserved1: 0,
                    reserved2: 0,
                    rxOnWhenIdle: 0,
                    securityCapability: 0,
                },
            },
        ]);
        expect(events.deviceAnnounce.length).toBe(1);
        expect(events.deviceAnnounce[0].device).toBeInstanceOf(Device);
        expect(events.deviceAnnounce[0].device.ieeeAddr).toBe("0x129");
        expect(events.deviceAnnounce[0].device.modelID).toBe("myModelID");
    });

    it("ZDO response for END_DEVICE_ANNOUNCE should update network address when different", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByNetworkAddress(129)?.ieeeAddr).toStrictEqual("0x129");
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.END_DEVICE_ANNOUNCE, [
            Zdo.Status.SUCCESS,
            {
                nwkAddress: 9999,
                eui64: "0x129",
                capabilities: {
                    allocateAddress: 0,
                    alternatePANCoordinator: 0,
                    deviceType: 2,
                    powerSource: 0,
                    reserved1: 0,
                    reserved2: 0,
                    rxOnWhenIdle: 0,
                    securityCapability: 0,
                },
            },
        ]);
        expect(controller.getDeviceByIeeeAddr("0x129")?.networkAddress).toBe(9999);
        expect(controller.getDeviceByIeeeAddr("0x129")?.getEndpoint(1)?.deviceNetworkAddress).toBe(9999);
        expect(controller.getDeviceByNetworkAddress(129)).toBeUndefined();
        expect(controller.getDeviceByNetworkAddress(9999)?.ieeeAddr).toStrictEqual("0x129");
    });

    it("ZDO response for END_DEVICE_ANNOUNCE from unknown device", async () => {
        await controller.start();
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.END_DEVICE_ANNOUNCE, [
            Zdo.Status.SUCCESS,
            {
                nwkAddress: 12999,
                eui64: "0x12999",
                capabilities: {
                    allocateAddress: 0,
                    alternatePANCoordinator: 0,
                    deviceType: 2,
                    powerSource: 0,
                    reserved1: 0,
                    reserved2: 0,
                    rxOnWhenIdle: 0,
                    securityCapability: 0,
                },
            },
        ]);
        expect(events.deviceAnnounce.length).toBe(0);
    });

    it("ZDO response for cluster ID with no extra processing", async () => {
        await controller.start();
        await mockAdapterEvents.zdoResponse(Zdo.ClusterId.BIND_RESPONSE, [Zdo.Status.SUCCESS, undefined]);
    });

    it("Emit lastSeenChanged event even when no message is emitted from it", async () => {
        // Default response
        const buffer = Buffer.from([0x18, 0x04, 0x0b, 0x0c, 0x82]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        events.lastSeenChanged = [];
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x129",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.lastSeenChanged.length).toBe(1);
        expect(events.lastSeenChanged[0].device.ieeeAddr).toBe("0x129");
        expect(events.message.length).toBe(0);
    });

    it("Device leave event and remove from database", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByIeeeAddr("0x129")).toBeInstanceOf(Device);
        expect(events.deviceLeave.length).toBe(0);
        await mockAdapterEvents.deviceLeave({networkAddress: 129, ieeeAddr: "0x129"});
        expect(events.deviceLeave.length).toBe(1);
        expect(events.deviceLeave[0]).toStrictEqual({ieeeAddr: "0x129"});
        expect(controller.getDeviceByIeeeAddr("0x129")).toBeUndefined();

        // leaves another time when not in database
        await mockAdapterEvents.deviceLeave({networkAddress: 129, ieeeAddr: "0x129"});
        expect(events.deviceLeave.length).toBe(1);
    });

    it("Device leave event with only nwk addr and remove from database", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByNetworkAddress(129)).toBeInstanceOf(Device);
        expect(events.deviceLeave.length).toBe(0);
        await mockAdapterEvents.deviceLeave({networkAddress: 129, ieeeAddr: undefined});
        expect(events.deviceLeave.length).toBe(1);
        expect(events.deviceLeave[0]).toStrictEqual({ieeeAddr: "0x129"});
        expect(controller.getDeviceByNetworkAddress(129)).toBeUndefined();
        expect(Device.byNetworkAddress(129, true)).toBeInstanceOf(Device);

        // leaves another time when not in database
        await mockAdapterEvents.deviceLeave({networkAddress: 129, ieeeAddr: undefined});
        expect(events.deviceLeave.length).toBe(1);
    });

    it("Start with reset should clear database", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await controller.createGroup(1);
        expect(controller.getGroupByID(1)).toBeInstanceOf(Group);
        expect(controller.getDeviceByIeeeAddr("0x129")).toBeInstanceOf(Device);
        expect(controller.getDevices().length).toBe(2);
        expect(controller.getDevicesByType("Coordinator")[0].type).toBe("Coordinator");
        expect(controller.getDevicesByType("Coordinator")[0].ieeeAddr).toBe("0x0000012300000000");
        expect(controller.getDevicesByType("Router")[0].ieeeAddr).toBe("0x129");
        expect(databaseContents().includes("0x129")).toBeTruthy();
        expect(databaseContents().includes("groupID")).toBeTruthy();
        await controller.stop();

        mockAdapterStart.mockReturnValueOnce("reset");
        const abortController = new AbortController();
        await controller.start(abortController.signal);
        expect(controller.getDevices().length).toBe(1);
        expect(controller.getGroupsIterator().next().value).toBeUndefined();
        expect(controller.getDevicesByType("Coordinator")[0].type).toBe("Coordinator");
        expect(controller.getDeviceByIeeeAddr("0x129")).toBeUndefined();
        expect(controller.getGroupByID(1)).toBeUndefined();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        expect(databaseContents().includes("groupID")).toBeFalsy();
    });

    it("Existing database.tmp should not be overwritten", async () => {
        const databaseTmpPath = `${options.databasePath}.tmp`;
        fs.writeFileSync(databaseTmpPath, "Hello, World!");

        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        controller.createGroup(1);

        // The old database.db.tmp should be gone
        expect(fs.existsSync(databaseTmpPath)).toBeFalsy();

        // There should still be a database.db.tmp.<something>
        const dbtmp = fs.readdirSync(TEMP_PATH).filter((value) => value.startsWith("database.db.tmp"));
        expect(dbtmp.length).toBe(1);

        // The database.db.tmp.<something> should still have our "Hello, World!"
        expect(fs.readFileSync(getTempFile(dbtmp[0])).toString().startsWith("Hello, World!")).toBeTruthy();
    });

    it("Should create backup of databse before clearing when datbaseBackupPath is provided", async () => {
        const databaseBackupPath = getTempFile("database.backup");
        if (fs.existsSync(databaseBackupPath)) fs.unlinkSync(databaseBackupPath);
        controller = new Controller({...options, databaseBackupPath});
        expect(fs.existsSync(databaseBackupPath)).toBeFalsy();
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await controller.createGroup(1);
        await controller.stop();
        mockAdapterStart.mockReturnValueOnce("reset");
        await controller.start();
        expect(fs.existsSync(databaseBackupPath)).toBeTruthy();
    });

    it("Add install code 18 byte", async () => {
        await controller.start();
        const code = "RB01SG0D831018264800400000000000000000009035EAFFFE424783DLKAE3B287281CF16F550733A0CEC38AA31E802";
        await controller.addInstallCode(code);
        expect(mockAddInstallCode).toHaveBeenCalledTimes(1);
        expect(mockAddInstallCode).toHaveBeenCalledWith(
            "0x9035eafffe424783",
            Buffer.from([0xae, 0x3b, 0x28, 0x72, 0x81, 0xcf, 0x16, 0xf5, 0x50, 0x73, 0x3a, 0x0c, 0xec, 0x38, 0xaa, 0x31, 0xe8, 0x02]),
            false,
        );
    });

    it("Add install code 16 byte - missing CRC is appended", async () => {
        await controller.start();
        const code = "RB01SG0D836591B3CC0010000000000000000000000D6F00179F2BC9DLKD0F471C9BBA2C0208608E91EED17E2B1";
        await controller.addInstallCode(code);
        expect(mockAddInstallCode).toHaveBeenCalledTimes(2);
        expect(mockAddInstallCode).toHaveBeenCalledWith(
            "0x000d6f00179f2bc9",
            Buffer.from([0xd0, 0xf4, 0x71, 0xc9, 0xbb, 0xa2, 0xc0, 0x20, 0x86, 0x08, 0xe9, 0x1e, 0xed, 0x17, 0xe2, 0xb1, 0x9a, 0xec]),
            false,
        );
        expect(mockAddInstallCode).toHaveBeenCalledWith(
            "0x000d6f00179f2bc9",
            Buffer.from([0xd0, 0xf4, 0x71, 0xc9, 0xbb, 0xa2, 0xc0, 0x20, 0x86, 0x08, 0xe9, 0x1e, 0xed, 0x17, 0xe2, 0xb1]),
            true,
        );
        expect(mockLogger.info).toHaveBeenCalledWith(`Install code was adjusted for reason 'missing CRC'.`, "zh:controller");
    });

    it("Add install code widely adopted format", async () => {
        await controller.start();
        // inovelli
        const code = "Z:6C5CB1FFFE44FDFD$I:5492072F8DE72829FEE139CF8ACA4F43EF21";
        await controller.addInstallCode(code);
        expect(mockAddInstallCode).toHaveBeenNthCalledWith(
            1,
            "0x6c5cb1fffe44fdfd",
            Buffer.from([
                0x54, 0x92, 0x07, 0x2f, 0x8d, 0xe7, 0x28, 0x29, 0xfe, 0xe1, 0x39, 0xcf, 0x8a, 0xca, 0x4f, 0x43, /*0xef, 0x21 bad CRC?*/ 0x85, 0x44,
            ]),
            false,
        );
        // danfoss
        const code2 = "G$M:IC2%Z:540F57FFFE599FAA$I:D79CB21C6D197CE7A3339A683A90DFF2442A%M:1246";
        await controller.addInstallCode(code2);
        expect(mockAddInstallCode).toHaveBeenNthCalledWith(
            2,
            "0x540f57fffe599faa",
            Buffer.from([0xd7, 0x9c, 0xb2, 0x1c, 0x6d, 0x19, 0x7c, 0xe7, 0xa3, 0x33, 0x9a, 0x68, 0x3a, 0x90, 0xdf, 0xf2, 0x44, 0x2a]),
            false,
        );
        // ??
        const code3 = "Z:4CC206FFFE306C43$I:150A1A57D11A1A01362622DBA97ACF0F9185$D:202%B:4CC206306C43$P:983639%M:1220$F:002D";
        await controller.addInstallCode(code3);
        expect(mockAddInstallCode).toHaveBeenNthCalledWith(
            3,
            "0x4cc206fffe306c43",
            Buffer.from([
                0x15, 0x0a, 0x1a, 0x57, 0xd1, 0x1a, 0x1a, 0x01, 0x36, 0x26, 0x22, 0xdb, 0xa9, 0x7a, 0xcf, 0x0f, /*0x91, 0x85 bad CRC?*/ 0x0c, 0xca,
            ]),
            false,
        );
        // ubisys
        const code4 = "Z:0102030405060708$I:0102030405060708090A0B0C0D0E0F1090FD%G$M:S1-R%M:10F2";
        await controller.addInstallCode(code4);
        expect(mockAddInstallCode).toHaveBeenNthCalledWith(
            4,
            "0x0102030405060708",
            Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x90, 0xfd]),
            false,
        );
        // ledvance
        const code5 = "Z:F0D1B8000017389A$I:6AB6973274EE6F720200530162754044C930%M:1189$D:008B452720";
        await controller.addInstallCode(code5);
        expect(mockAddInstallCode).toHaveBeenNthCalledWith(
            5,
            "0xf0d1b8000017389a",
            Buffer.from([0x6a, 0xb6, 0x97, 0x32, 0x74, 0xee, 0x6f, 0x72, 0x02, 0x00, 0x53, 0x01, 0x62, 0x75, 0x40, 0x44, 0xc9, 0x30]),
            false,
        );
    });

    it("Add install code Aqara", async () => {
        await controller.start();
        const code = "G$M:69775$S:680S00003915$D:0000000017B2335C%Z$A:54EF44100006E7DF$I:3313A005E177A647FC7925620AB207C4BEF5";
        await controller.addInstallCode(code);
        expect(mockAddInstallCode).toHaveBeenCalledTimes(1);
        expect(mockAddInstallCode).toHaveBeenCalledWith(
            "0x54ef44100006e7df",
            Buffer.from([0x33, 0x13, 0xa0, 0x05, 0xe1, 0x77, 0xa6, 0x47, 0xfc, 0x79, 0x25, 0x62, 0x0a, 0xb2, 0x07, 0xc4, 0xbe, 0xf5]),
            false,
        );
    });

    it("Add install code Hue", async () => {
        await controller.start();
        const code = "HUE:Z:0123456789ABCDEF0123456789ABCDEF0123 M:0123456789ABCDEF D:L3B A:1184";
        await controller.addInstallCode(code);
        expect(mockAddInstallCode).toHaveBeenCalledTimes(1);
        expect(mockAddInstallCode).toHaveBeenCalledWith(
            "0x0123456789abcdef",
            Buffer.from([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0xe7, 0xb8]),
            false,
        );
    });

    it("Add install code pipe", async () => {
        await controller.start();
        const code = "54EF44100006E7DF|3313A005E177A647FC7925620AB207C4BEF5";
        await controller.addInstallCode(code);
        expect(mockAddInstallCode).toHaveBeenCalledTimes(1);
        expect(mockAddInstallCode).toHaveBeenCalledWith(
            "0x54ef44100006e7df",
            Buffer.from([0x33, 0x13, 0xa0, 0x05, 0xe1, 0x77, 0xa6, 0x47, 0xfc, 0x79, 0x25, 0x62, 0x0a, 0xb2, 0x07, 0xc4, 0xbe, 0xf5]),
            false,
        );
    });

    it("Add install code invalid", async () => {
        await controller.start();

        const code = "54EF44100006E7DF|3313A005E177A647FC7925620AB207";

        await expect(controller.addInstallCode(code)).rejects.toThrow("Install code 3313a005e177a647fc7925620ab207 has invalid size");

        expect(mockAddInstallCode).toHaveBeenCalledTimes(0);
    });

    it("Add install code unknown format", async () => {
        await controller.start();

        const code = "54EF44100006E7DF`3313A005E177A647FC7925620AB207";

        await expect(controller.addInstallCode(code)).rejects.toThrow(
            "Unsupported install code, got 47 chars, expected 95 or 91 chars, or known format",
        );

        expect(mockAddInstallCode).toHaveBeenCalledTimes(0);
    });

    it("Controller permit joining all, disabled automatically", async () => {
        await controller.start();

        expect(controller.getPermitJoin()).toStrictEqual(false);
        expect(controller.getPermitJoinEnd()).toBeUndefined();

        const updatedMockedDate = new Date();
        vi.setSystemTime(updatedMockedDate);
        await controller.permitJoin(254);

        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(mockAdapterPermitJoin).toHaveBeenNthCalledWith(1, 254, undefined);
        expect(events.permitJoinChanged.length).toStrictEqual(1);
        expect(events.permitJoinChanged[0]).toStrictEqual({permitted: true, time: 254});
        expect(controller.getPermitJoin()).toStrictEqual(true);
        expect(controller.getPermitJoinEnd()).toStrictEqual(updatedMockedDate.getTime() + 254 * 1000);

        // Green power
        const commisionFrameEnable = Zcl.Frame.create(1, 1, true, undefined, 0, "commisioningMode", 33, {options: 0x0b, commisioningWindow: 254}, {});

        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToAll).toHaveBeenNthCalledWith(
            1,
            ZSpec.GP_ENDPOINT,
            expect.any(Object),
            ZSpec.GP_ENDPOINT,
            ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE,
        );
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(commisionFrameEnable));

        await vi.advanceTimersByTimeAsync(250 * 1000);

        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(controller.getPermitJoin()).toStrictEqual(true);
        expect(controller.getPermitJoinEnd()).toStrictEqual(updatedMockedDate.getTime() + 254 * 1000);

        // Timer expired
        await vi.advanceTimersByTimeAsync(10 * 1000);

        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(events.permitJoinChanged.length).toStrictEqual(2);
        expect(events.permitJoinChanged[1]).toStrictEqual({permitted: false});
        expect(controller.getPermitJoin()).toStrictEqual(false);
        expect(controller.getPermitJoinEnd()).toBeUndefined();

        // Green power
        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
    });

    it("Controller permit joining all, disabled manually", async () => {
        await controller.start();

        expect(controller.getPermitJoin()).toStrictEqual(false);
        expect(controller.getPermitJoinEnd()).toBeUndefined();

        const updatedMockedDate = new Date();
        vi.setSystemTime(updatedMockedDate);
        await controller.permitJoin(254);

        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(mockAdapterPermitJoin).toHaveBeenNthCalledWith(1, 254, undefined);
        expect(events.permitJoinChanged.length).toStrictEqual(1);
        expect(events.permitJoinChanged[0]).toStrictEqual({permitted: true, time: 254});
        expect(controller.getPermitJoin()).toStrictEqual(true);
        expect(controller.getPermitJoinEnd()).toStrictEqual(updatedMockedDate.getTime() + 254 * 1000);

        // Green power
        const commisionFrameEnable = Zcl.Frame.create(1, 1, true, undefined, 0, "commisioningMode", 33, {options: 0x0b, commisioningWindow: 254}, {});

        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToAll).toHaveBeenNthCalledWith(
            1,
            ZSpec.GP_ENDPOINT,
            expect.any(Object),
            ZSpec.GP_ENDPOINT,
            ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE,
        );
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(commisionFrameEnable));

        await vi.advanceTimersByTimeAsync(250 * 1000);

        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(controller.getPermitJoin()).toStrictEqual(true);
        expect(controller.getPermitJoinEnd()).toStrictEqual(updatedMockedDate.getTime() + 254 * 1000);

        // Disable
        await controller.permitJoin(0);

        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(2);
        expect(mockAdapterPermitJoin).toHaveBeenNthCalledWith(2, 0);
        expect(events.permitJoinChanged.length).toStrictEqual(2);
        expect(events.permitJoinChanged[1]).toStrictEqual({permitted: false});
        expect(controller.getPermitJoin()).toStrictEqual(false);
        expect(controller.getPermitJoinEnd()).toBeUndefined();

        // Green power
        const commissionFrameDisable = Zcl.Frame.create(1, 1, true, undefined, 1, "commisioningMode", 33, {options: 0x0a, commisioningWindow: 0}, {});

        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(2);
        expect(mocksendZclFrameToAll).toHaveBeenNthCalledWith(
            2,
            ZSpec.GP_ENDPOINT,
            expect.any(Object),
            ZSpec.GP_ENDPOINT,
            ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE,
        );
        expect(deepClone(mocksendZclFrameToAll.mock.calls[1][1])).toStrictEqual(deepClone(commissionFrameDisable));
    });

    it("Controller permit joining through specific device", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await controller.permitJoin(254, controller.getDeviceByIeeeAddr("0x129"));

        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(mockAdapterPermitJoin).toHaveBeenCalledWith(254, 129);
        expect(events.permitJoinChanged.length).toStrictEqual(1);
        expect(events.permitJoinChanged[0]).toStrictEqual({permitted: true, time: 254});
        expect(controller.getPermitJoin()).toStrictEqual(true);
        expect(controller.getPermitJoinEnd()).toBeGreaterThan(0);

        await vi.advanceTimersByTimeAsync(120 * 1000);

        expect(controller.getPermitJoin()).toStrictEqual(true);
        expect(controller.getPermitJoinEnd()).toBeGreaterThan(0);

        // Timer expired
        await vi.advanceTimersByTimeAsync(300 * 1000);

        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(events.permitJoinChanged.length).toStrictEqual(2);
        expect(events.permitJoinChanged[1]).toStrictEqual({permitted: false});
        expect(controller.getPermitJoin()).toStrictEqual(false);
        expect(controller.getPermitJoinEnd()).toBeUndefined();
    });

    it("Controller permit joining for specific time", async () => {
        await controller.start();
        await controller.permitJoin(10);

        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(mockAdapterPermitJoin).toHaveBeenCalledWith(10, undefined);
        expect(events.permitJoinChanged.length).toStrictEqual(1);
        expect(events.permitJoinChanged[0]).toStrictEqual({permitted: true, time: 10});
        expect(controller.getPermitJoin()).toStrictEqual(true);

        await vi.advanceTimersByTimeAsync(5 * 1000);

        expect(controller.getPermitJoin()).toStrictEqual(true);
        expect(controller.getPermitJoinEnd()).toBeGreaterThan(0);

        // Timer expired
        await vi.advanceTimersByTimeAsync(7 * 1000);

        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(1);
        expect(events.permitJoinChanged.length).toStrictEqual(2);
        expect(events.permitJoinChanged[1]).toStrictEqual({permitted: false});
        expect(controller.getPermitJoin()).toStrictEqual(false);
        expect(controller.getPermitJoinEnd()).toBeUndefined();
    });

    it("Controller permit joining for too long time throws", async () => {
        await controller.start();

        await expect(controller.permitJoin(255)).rejects.toThrow("Cannot permit join for more than 254 seconds.");
        expect(mockAdapterPermitJoin).toHaveBeenCalledTimes(0);
        expect(events.permitJoinChanged.length).toStrictEqual(0);
    });

    it("Shouldnt create backup when adapter doesnt support it", async () => {
        mockAdapterSupportsBackup.mockReturnValue(false);
        if (fs.existsSync(options.backupPath)) fs.unlinkSync(options.backupPath);
        await controller.start();
        await controller.stop();
        expect(fs.existsSync(options.backupPath)).toBeFalsy();
    });

    it("Soft reset", async () => {
        await controller.start();
        await controller.reset("soft");
        expect(mockAdapterReset).toHaveBeenCalledTimes(1);
        expect(mockAdapterReset).toHaveBeenCalledWith("soft");
    });

    it("Hard reset", async () => {
        await controller.start();
        await controller.reset("hard");
        expect(mockAdapterReset).toHaveBeenCalledTimes(1);
        expect(mockAdapterReset).toHaveBeenCalledWith("hard");
    });

    it("Adapter disconnected event", async () => {
        // @ts-expect-error private
        const databaseSaveSpy = vi.spyOn(controller, "databaseSave");
        const backupSpy = vi.spyOn(controller, "backup");
        await controller.start();
        databaseSaveSpy.mockClear();
        backupSpy.mockClear();
        expect(controller.isStopping()).toBeFalsy();
        expect(controller.isAdapterDisconnected()).toBeFalsy();

        await mockAdapterEvents.disconnected();
        expect(events.adapterDisconnected.length).toBe(1);
        expect(controller.isAdapterDisconnected()).toBeTruthy();

        // mock z2m layer responding to disconnected event
        await controller.stop();
        expect(controller.isStopping()).toBeTruthy();
        expect(mockAdapterStop).toHaveBeenCalledTimes(1); // once in event only (with catcho)
        expect(mockAdapterPermitJoin).not.toHaveBeenCalled();
        expect(backupSpy).not.toHaveBeenCalled();
        expect(databaseSaveSpy).toHaveBeenCalledTimes(1);
    });

    it("Device joins another time with different network address", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(controller.getDeviceByNetworkAddress(129)?.ieeeAddr).toStrictEqual("0x129");
        expect(events.deviceJoined.length).toBe(1);
        expect(equalsPartial(events.deviceJoined[0].device, {ID: 2, networkAddress: 129, ieeeAddr: "0x129"})).toBeTruthy();
        expect(controller.getDeviceByIeeeAddr("0x129")?.networkAddress).toBe(129);

        await mockAdapterEvents.deviceJoined({networkAddress: 130, ieeeAddr: "0x129"});
        expect(events.deviceJoined.length).toBe(1);
        expect(controller.getDeviceByIeeeAddr("0x129")?.networkAddress).toBe(130);
        expect(controller.getDeviceByNetworkAddress(129)).toBeUndefined();
        expect(controller.getDeviceByNetworkAddress(130)?.ieeeAddr).toStrictEqual("0x129");
    });

    it("Device joins and interview succeeds", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x129");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x129");
    });

    it("Device joins and interview fails", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x140");
        expect(events.deviceInterview[1].status).toBe("failed");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x140");
        expect(controller.getDeviceByIeeeAddr("0x140")!.type).toStrictEqual("Unknown");
    });

    it("Device joins with endpoints [4,1], should read modelID from 1", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 161, ieeeAddr: "0x161"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x161");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x161");
        expect(events.deviceInterviewRaw[1].device.genBasic.modelId).toBe("myDevice9123");
    });

    it("Device joins with endpoints [2,1], as 2 is the only endpoint supporting genBasic it should read modelID from that", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 162, ieeeAddr: "0x162"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x162");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x162");
        expect(events.deviceInterviewRaw[1].device.genBasic.modelId).toBe("myDevice9124");
    });

    it("Device joins and interview iAs enrollment succeeds", async () => {
        await controller.start();
        const event = mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        await event;
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x170");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x170");

        const write = mocksendZclFrameToEndpoint.mock.calls[10];
        expect(write[0]).toBe("0x170");
        expect(write[1]).toBe(170);
        expect(write[2]).toBe(1);
        expect(deepClone(write[3])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 0, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 10,
                commandIdentifier: 2,
            },
            payload: [{attrId: 16, attrData: "0x0000012300000000", dataType: 240}],
            cluster: expect.objectContaining({
                ID: 1280,
                name: "ssIasZone",
            }),
            command: {
                ID: 2,
                name: "write",
                parameters: expect.any(Array),
                response: 4,
            },
        });

        const enrollRsp = mocksendZclFrameToEndpoint.mock.calls[11];
        expect(enrollRsp[0]).toBe("0x170");
        expect(enrollRsp[1]).toBe(170);
        expect(enrollRsp[2]).toBe(1);
        expect(deepClone(enrollRsp[3])).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 11,
                commandIdentifier: 0,
            },
            payload: {enrollrspcode: 0, zoneid: 23},
            cluster: expect.objectContaining({
                ID: 1280,
                name: "ssIasZone",
            }),
            command: {
                ID: 0,
                parameters: expect.any(Array),
                name: "enrollRsp",
                required: true,
            },
        });
    });

    it("Device joins and interview iAs enrollment fails", async () => {
        MOCK_DEVICES["170"]!.attributes!["1"].zoneState = 0;
        enroll170 = false;
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x170");
        expect(events.deviceInterview[1].status).toBe("failed");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x170");
    });

    it("Device joins, shouldnt enroll when already enrolled", async () => {
        await controller.start();
        iasZoneReadState170Count = 1;
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x170");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x170");
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(10);
    });

    it("Receive zclData occupancy report", async () => {
        const buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x129",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            cluster: "msOccupancySensing",
            type: "attributeReport",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: {
                occupancy: 1,
            },
            linkquality: 50,
            groupID: 1,
            meta: {
                zclTransactionSequenceNumber: 169,
                frameControl: {
                    reservedBits: 0,
                    direction: 1,
                    disableDefaultResponse: true,
                    frameType: 0,
                    manufacturerSpecific: false,
                },
                manufacturerCode: undefined,
                rawData: expect.any(Buffer),
            },
        };
        expect(events.message[0]).toStrictEqual(expected);
        expect(controller.getDeviceByIeeeAddr("0x129")!.linkquality).toEqual(50);
    });

    it("Receive raw data", async () => {
        await controller.start();
        mocksendZclFrameToAll.mockClear();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zclPayload({
            clusterID: 9,
            address: 129,
            data: Buffer.from([0, 1]),
            header: new Zcl.Header(
                {direction: 0, disableDefaultResponse: false, frameType: 1, manufacturerSpecific: false, reservedBits: 0},
                0,
                1,
                0,
            ),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
            wasBroadcast: false,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            cluster: "genAlarms",
            type: "raw",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: Buffer.from([0, 1]),
            linkquality: 50,
            groupID: 1,
            meta: {
                rawData: expect.any(Buffer),
            },
        };
        expect(events.message[0]).toStrictEqual(expected);
    });

    it("Receive raw data from unknown cluster", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zclPayload({
            clusterID: 99999999,
            address: 129,
            data: Buffer.from([0, 1, 2, 3]),
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
            wasBroadcast: false,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            cluster: 99999999,
            type: "raw",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: Buffer.from([0, 1, 2, 3]),
            linkquality: 50,
            groupID: 1,
            meta: {
                rawData: Buffer.from([0, 1, 2, 3]),
            },
        };
        expect(events.message[0]).toStrictEqual(expected);
    });

    it("Receive zclData from unkonwn device shouldnt emit anything", async () => {
        const buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            networkAddress: 130,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(0);
    });

    it("Receive zclData with device deleted during processing (prevent race condition)", async () => {
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            40,
            "read",
            "genTime",
            [{attrId: 0}, {attrId: 1}, {attrId: 2}, {attrId: 3}, {attrId: 4}, {attrId: 5}, {attrId: 6}, {attrId: 7}, {attrId: 8}, {attrId: 9}],
            {},
        );
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const deviceOnZclDataSpy = vi.spyOn(device, "onZclData");
        const endpointCommandSpy = vi.spyOn(endpoint, "command");
        const endpointReadResponseSpy = vi.spyOn(endpoint, "readResponse");
        const endpointReadSpy = vi.spyOn(endpoint, "read");
        const endpointDefaultResponseSpy = vi.spyOn(endpoint, "defaultResponse");

        deviceOnZclDataSpy.mockImplementationOnce(async (a, b, c) => {
            await mockAdapterEvents.deviceLeave({networkAddress: 129, ieeeAddr: undefined});
            await device.onZclData(a, b, c);
        });

        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x129",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(deviceOnZclDataSpy).toHaveBeenCalledTimes(2); // once for wrapper mock, once for real
        expect(endpointCommandSpy).toHaveBeenCalledTimes(0);
        expect(endpointReadResponseSpy).toHaveBeenCalledTimes(0);
        expect(endpointReadSpy).toHaveBeenCalledTimes(0);
        expect(endpointDefaultResponseSpy).toHaveBeenCalledTimes(0);
    });

    it("Receive readResponse from unknown endpoint", async () => {
        const buffer = Buffer.from([8, 1, 1, 1, 0, 0, 32, 3]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("genBasic", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 3,
            linkquality: 52,
            groupID: undefined,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            cluster: "genBasic",
            type: "readResponse",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            groupID: undefined,
            data: {
                appVersion: 3,
            },
            linkquality: 52,
            meta: {
                zclTransactionSequenceNumber: 1,
                frameControl: {
                    reservedBits: 0,
                    direction: 1,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                },
                manufacturerCode: undefined,
                rawData: expect.any(Buffer),
            },
        };
        expect(events.message[0]).toStrictEqual(expected);
        expect(controller.getDeviceByIeeeAddr("0x129")!.endpoints.length).toBe(2);
    });

    it("Receive cluster command", async () => {
        const buffer = Buffer.from([0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00]);
        const frame = Zcl.Frame.fromBuffer(5, Zcl.Header.fromBuffer(buffer), buffer, {});
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            cluster: "genScenes",
            type: "commandTradfriArrowSingle",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: {
                value: 256,
                value2: 13,
            },
            linkquality: 19,
            groupID: 10,
            meta: {
                zclTransactionSequenceNumber: 29,
                manufacturerCode: 4476,
                frameControl: {
                    reservedBits: 0,
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 1,
                    manufacturerSpecific: true,
                },
                rawData: expect.any(Buffer),
            },
        };
        expect(events.message[0]).toStrictEqual(expected);
    });

    it("Receive cluster command from unknown cluster", async () => {
        const frame = Zcl.Frame.create(
            1,
            1,
            false,
            4476,
            29,
            1,
            5,
            {
                groupid: 1,
                sceneid: 1,
                status: 0,
                transtime: 0,
                scenename: "",
                extensionfieldsets: [],
            },
            {},
        );
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            networkAddress: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(events.message.length).toBe(0);
    });

    it("Receive zclData send default response", async () => {
        const frame = Zcl.Frame.create(
            1,
            1,
            false,
            4476,
            29,
            1,
            5,
            {
                groupid: 1,
                sceneid: 1,
                status: 0,
                transtime: 0,
                scenename: "",
                extensionfieldsets: [],
            },
            {},
        );
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    29,
                    "defaultRsp",
                    5,
                    {cmdId: 1, statusCode: 0},
                    {},
                ),
            ),
        );
    });

    it("Receive zclData dont send default resopnse with skipDefaultResponse", async () => {
        const frame = Zcl.Frame.create(
            1,
            1,
            false,
            4476,
            29,
            1,
            5,
            {
                groupid: 1,
                sceneid: 1,
                status: 0,
                transtime: 0,
                scenename: "",
                extensionfieldsets: [],
            },
            {},
        );
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        expect(device.skipDefaultResponse).toBeFalsy();
        device.skipDefaultResponse = true;

        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });
        expect(device.skipDefaultResponse).toBeTruthy();
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Receive zclData dont send default resopnse when broadcast", async () => {
        const frame = Zcl.Frame.create(
            1,
            1,
            false,
            4476,
            29,
            1,
            5,
            {
                groupid: 1,
                sceneid: 1,
                status: 0,
                transtime: 0,
                scenename: "",
                extensionfieldsets: [],
            },
            {},
        );
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        expect(device.skipDefaultResponse).toBeFalsy();
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Receive zclData send default response fails should NOT attempt route discover when adapter does not support it", async () => {
        const frame = Zcl.Frame.create(
            1,
            1,
            false,
            4476,
            29,
            1,
            5,
            {
                groupid: 1,
                sceneid: 1,
                status: 0,
                transtime: 0,
                scenename: "",
                extensionfieldsets: [],
            },
            {},
        );
        mockAdapterSupportsDiscoverRoute.mockReturnValueOnce(false);
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        mockDiscoverRoute.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValue("");
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mockDiscoverRoute).toHaveBeenCalledTimes(0);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
    });

    it("Respond to genTime read", async () => {
        const expectedTime = 825789852;
        const expectedTimeStatus = 0b1101;
        const expectedTimeZone = 3600;
        const expectedDstStart = 828061200;
        const expectedDstEnd = 846205199;
        const expectedDstShift = 3600;
        const expectedStandardTime = 825793452;
        const expectedLocalTime = 825793452;
        const expectedValidUntilTime = expectedTime + 24 * 60 * 60;

        // Mock the timeService response, as we don't want to test that
        const getTimeClusterAttributesSpy = vi.spyOn(timeService, "getTimeClusterAttributes").mockReturnValue({
            time: expectedTime,
            timeStatus: expectedTimeStatus,
            timeZone: expectedTimeZone,
            dstStart: expectedDstStart,
            dstEnd: expectedDstEnd,
            dstShift: expectedDstShift,
            standardTime: expectedStandardTime,
            localTime: expectedLocalTime,
            lastSetTime: expectedTime,
            validUntilTime: expectedValidUntilTime,
        });

        const frame = Zcl.Frame.create(
            0,
            0,
            true,
            undefined,
            40,
            0,
            10,
            [{attrId: 0}, {attrId: 1}, {attrId: 2}, {attrId: 3}, {attrId: 4}, {attrId: 5}, {attrId: 6}, {attrId: 7}, {attrId: 8}, {attrId: 9}],
            {},
        );
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][0]).toStrictEqual("0x129");
        expect(mocksendZclFrameToEndpoint.mock.calls[0][1]).toStrictEqual(129);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][2]).toStrictEqual(1);
        const message = mocksendZclFrameToEndpoint.mock.calls[0][3];
        expect(message.payload.length).toStrictEqual(10);
        // Time
        expect(message.payload[0].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.time.ID);
        expect(message.payload[0].attrData).toStrictEqual(expectedTime);
        // TimeStatus
        expect(message.payload[1].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.timeStatus.ID);
        expect(message.payload[1].attrData).toStrictEqual(expectedTimeStatus);
        // TimeZone
        expect(message.payload[2].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.timeZone.ID);
        expect(message.payload[2].attrData).toStrictEqual(expectedTimeZone);
        // DstStart
        expect(message.payload[3].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.dstStart.ID);
        expect(message.payload[3].attrData).toStrictEqual(expectedDstStart);
        // DstEnd
        expect(message.payload[4].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.dstEnd.ID);
        expect(message.payload[4].attrData).toStrictEqual(expectedDstEnd);
        // DstShift
        expect(message.payload[5].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.dstShift.ID);
        expect(message.payload[5].attrData).toStrictEqual(expectedDstShift);
        // StandardTime
        expect(message.payload[6].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.standardTime.ID);
        expect(message.payload[6].attrData).toStrictEqual(expectedStandardTime);
        // LocalTime
        expect(message.payload[7].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.localTime.ID);
        expect(message.payload[7].attrData).toStrictEqual(expectedLocalTime);
        // LastSetTime
        expect(message.payload[8].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.lastSetTime.ID);
        expect(message.payload[8].attrData).toStrictEqual(expectedTime);
        // ValidUntilTime
        expect(message.payload[9].attrId).toStrictEqual(Zcl.Clusters.genTime.attributes.validUntilTime.ID);
        expect(message.payload[9].attrData).toStrictEqual(expectedValidUntilTime);

        for (const p of message.payload) {
            expect(p.status).toStrictEqual(Zcl.Status.SUCCESS);
        }

        delete message.payload;
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toStrictEqual("0x129");
        expect(call[1]).toStrictEqual(129);
        expect(call[2]).toStrictEqual(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.SERVER_TO_CLIENT, true, undefined, 40, "readRsp", 10, undefined, {})),
        );
        expect(getTimeClusterAttributesSpy).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).not.toHaveBeenCalled();

        getTimeClusterAttributesSpy.mockRestore();
    });

    it("Allow to override read response through `device.customReadResponse", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();

        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.customReadResponse = vi.fn().mockReturnValue(true);

        const frame = Zcl.Frame.create(0, 0, true, undefined, 40, 0, 10, [{attrId: 0}, {attrId: 1}, {attrId: 7}, {attrId: 9}], {});
        const payload = {
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        };

        await mockAdapterEvents.zclPayload(payload);

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
        expect(device.customReadResponse).toHaveBeenCalledTimes(1);
        expect(device.customReadResponse).toHaveBeenCalledWith(expect.any(Zcl.Frame), device.getEndpoint(1));
        expect((device.customReadResponse as ReturnType<typeof vi.fn>).mock.calls[0][0].header).toBe(payload.header);
    });

    it("Respond to read of attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        endpoint.saveClusterAttributeKeyValue("hvacThermostat", {systemMode: 3});
        mocksendZclFrameToEndpoint.mockClear();
        const frame = Zcl.Frame.create(0, 0, true, undefined, 40, 0, 513, [{attrId: 28}, {attrId: 290}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone({...call[3], cluster: null})).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 0, direction: 1, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 40,
                commandIdentifier: 1,
            },
            payload: [{attrId: 28, attrData: 3, dataType: 48, status: 0}],
            cluster: null,
            command: expect.objectContaining({
                ID: 1,
                name: "readRsp",
            }),
        });
    });

    it("Respond to genTime read fails", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error(""));
        const frame = Zcl.Frame.create(0, 0, true, undefined, 40, 0, 10, [{attrId: 0}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
    });

    it("Tuya end devices joins, stops responding after 1 requests, should read modelID and manufacturerName immediately on second pair", async () => {
        // https://github.com/Koenkk/zigbee2mqtt/issues/7553
        await controller.start();

        // Joins
        await mockAdapterEvents.deviceJoined({networkAddress: 173, ieeeAddr: "0x173"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x173");
        expect(events.deviceInterview[1].status).toBe("failed");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x173");
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        expect(controller.getDeviceByIeeeAddr("0x173")!.modelID).toBe(undefined);
        expect(controller.getDeviceByIeeeAddr("0x173")!.manufacturerName).toBe(undefined);

        // Second pair attempt
        await mockAdapterEvents.deviceLeave({networkAddress: 173, ieeeAddr: "0x173"});
        // backup
        const descriptor173 = MOCK_DEVICES[173]!.nodeDescriptor;
        const attributes173 = MOCK_DEVICES[173]!.attributes;
        MOCK_DEVICES[173]!.nodeDescriptor = undefined;
        MOCK_DEVICES[173]!.attributes![1] = {modelId: "TS0203", manufacturerName: "_TYZB01_xph99wvr"};

        await mockAdapterEvents.deviceJoined({networkAddress: 173, ieeeAddr: "0x173"});
        expect(events.deviceInterview.length).toBe(4);
        expect(events.deviceInterview[2].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[2].device._ieeeAddr).toBe("0x173");
        expect(events.deviceInterview[3].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[3].device._ieeeAddr).toBe("0x173");
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(2);

        expect(controller.getDeviceByIeeeAddr("0x173")!.modelID).toBe("TS0203");
        expect(controller.getDeviceByIeeeAddr("0x173")!.manufacturerName).toBe("_TYZB01_xph99wvr");
        expect(controller.getDeviceByIeeeAddr("0x173")!.powerSource).toBe("Battery");

        // restore
        MOCK_DEVICES[173]!.nodeDescriptor = descriptor173;
        MOCK_DEVICES[173]!.attributes = attributes173;
    });

    it("Xiaomi WXCJKG11LM join (get simple descriptor for endpoint 2 fails)", async () => {
        // https://github.com/koenkk/zigbee2mqtt/issues/2844
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 171, ieeeAddr: "0x171"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x171");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x171");
        expect(controller.getDeviceByIeeeAddr("0x171")!.modelID).toBe("lumi.remote.b286opcn01");
    });

    it("Gledopto GL-C-007/GL-C-008 join (all endpoints support genBasic but only 12 responds)", async () => {
        //  - https://github.com/Koenkk/zigbee2mqtt/issues/2872
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 172, ieeeAddr: "0x172"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x172");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x172");
        expect(controller.getDeviceByIeeeAddr("0x172")!.modelID).toBe("GL-C-008");
    });

    it("Xiaomi end device joins (node descriptor fails)", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 150, ieeeAddr: "0x150"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x150");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x150");
        expect(deepClone(controller.getDeviceByIeeeAddr("0x150"))).toStrictEqual({
            ID: 2,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _ieeeAddr: "0x150",
            _networkAddress: 150,
            _lastSeen: Date.now(),
            _linkquality: 50,
            _skipDefaultResponse: false,
            _customClusters: {},
            _endpoints: [
                {
                    ID: 1,
                    _events: {},
                    _eventsCount: 0,
                    clusters: {
                        genBasic: {
                            attributes: {
                                modelId: "lumi.occupancy",
                            },
                        },
                    },
                    inputClusters: [],
                    outputClusters: [],
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x150", sendInProgress: false},
                    deviceNetworkAddress: 150,
                    deviceIeeeAddress: "0x150",
                    _binds: [],
                    _configuredReportings: [],
                    meta: {},
                },
            ],
            _type: "EndDevice",
            _manufacturerID: 4151,
            meta: {},
            _interviewState: InterviewState.Successful,
        });
        expect(controller.getDeviceByIeeeAddr("0x150")?.genBasic).toStrictEqual({
            appVersion: undefined,
            dateCode: undefined,
            hwVersion: undefined,
            manufacturerName: "LUMI",
            modelId: "lumi.occupancy",
            powerSource: Zcl.PowerSource.Battery,
            stackVersion: undefined,
            swBuildId: undefined,
            zclVersion: undefined,
        });
    });

    it("Xiaomi end device joins (node descriptor succeeds, but active endpoint response fails)", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 151, ieeeAddr: "0x151"});
        expect(events.deviceInterview.length).toBe(2);
        expect(events.deviceInterview[0].status).toBe("started");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[0].device._ieeeAddr).toBe("0x151");
        expect(events.deviceInterview[1].status).toBe("successful");
        // @ts-expect-error private but deep cloned
        expect(events.deviceInterview[1].device._ieeeAddr).toBe("0x151");
        expect(deepClone(controller.getDeviceByIeeeAddr("0x151"))).toStrictEqual({
            ID: 2,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _ieeeAddr: "0x151",
            _networkAddress: 151,
            _lastSeen: Date.now(),
            _linkquality: 50,
            _skipDefaultResponse: false,
            _customClusters: {},
            _endpoints: [
                {
                    ID: 1,
                    _events: {},
                    _eventsCount: 0,
                    clusters: {
                        genBasic: {
                            attributes: {
                                modelId: "lumi.occupancy",
                            },
                        },
                    },
                    inputClusters: [],
                    outputClusters: [],
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x151", sendInProgress: false},
                    deviceNetworkAddress: 151,
                    deviceIeeeAddress: "0x151",
                    _binds: [],
                    _configuredReportings: [],
                    meta: {},
                },
            ],
            _type: "EndDevice",
            _manufacturerID: 1219,
            meta: {},
            _interviewState: InterviewState.Successful,
        });
        expect(controller.getDeviceByIeeeAddr("0x151")?.genBasic).toStrictEqual({
            appVersion: undefined,
            dateCode: undefined,
            hwVersion: undefined,
            manufacturerName: "LUMI",
            modelId: "lumi.occupancy",
            powerSource: Zcl.PowerSource.Battery,
            stackVersion: undefined,
            swBuildId: undefined,
            zclVersion: undefined,
        });
    });

    it("Should use cached node descriptor when device is re-interviewed, but retrieve it when ignoreCache=true", async () => {
        await controller.start();
        mockAdapterSendZdo.mockClear();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(3); // nodeDesc + activeEp + simpleDesc x1

        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const deviceNodeDescSpy = vi.spyOn(device, "updateNodeDescriptor");

        // Interview with ignoreCache=false should use cached node descriptor
        await device.interview(false);
        expect(deviceNodeDescSpy).toHaveBeenCalledTimes(0);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(5); // activeEp + simpleDesc x1

        // Interview with ignoreCache=true should read node descriptor
        await device.interview(true);
        expect(deviceNodeDescSpy).toHaveBeenCalledTimes(1);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(8); // nodeDesc + activeEp + simpleDesc x1
    });

    it("Should remove disappeared endpoints on updateActiveEndpoints", async () => {
        await controller.start();
        mockAdapterSendZdo.mockClear();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});

        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.endpoints.push(Endpoint.create(2, undefined, undefined, [], [], device.networkAddress, device.ieeeAddr));
        expect(device.endpoints.map((e) => e.ID)).toStrictEqual([1, 2]);
        await device.updateActiveEndpoints();
        expect(device.endpoints.map((e) => e.ID)).toStrictEqual([1]);
    });

    it("Receive zclData report from unkown attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const buffer = Buffer.from([
            28, 95, 17, 3, 10, 5, 0, 66, 21, 108, 117, 109, 105, 46, 115, 101, 110, 115, 111, 114, 95, 119, 108, 101, 97, 107, 46, 97, 113, 49, 1,
            255, 66, 34, 1, 33, 213, 12, 3, 40, 33, 4, 33, 168, 19, 5, 33, 43, 0, 6, 36, 0, 0, 5, 0, 0, 8, 33, 4, 2, 10, 33, 0, 0, 100, 16, 0,
        ]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("genBasic", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(frame); // Mock because no Buffalo write isn't supported for this payload
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: null, // null intentionally
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            cluster: "genBasic",
            type: "attributeReport",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: {
                "65281": {
                    "1": 3285,
                    "3": 33,
                    "4": 5032,
                    "5": 43,
                    "6": 327680,
                    "8": 516,
                    "10": 0,
                    "100": 0,
                },
                modelId: "lumi.sensor_wleak.aq1",
            },
            linkquality: 50,
            groupID: 1,
            meta: {
                zclTransactionSequenceNumber: 3,
                manufacturerCode: 4447,
                frameControl: {
                    reservedBits: 0,
                    direction: 1,
                    disableDefaultResponse: true,
                    frameType: 0,
                    manufacturerSpecific: true,
                },
                rawData: null,
            },
        };
        expect(events.message[0]).toStrictEqual(expected);
    });

    it("Should allow to specify custom attributes for existing cluster", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.addCustomCluster("genBasic", {
            ID: 0,
            commands: {},
            commandsResponse: {},
            attributes: {
                customAttr: {ID: 256, type: Zcl.DataType.UINT8},
                aDifferentZclVersion: {ID: 0, type: Zcl.DataType.UINT8},
            },
        });
        const buffer = Buffer.from([24, 169, 10, 0, 1, 24, 3, 0, 0, 24, 1, 2, 0, 24, 1]);
        const header = Zcl.Header.fromBuffer(buffer);
        const payload = {wasBroadcast: false, address: 129, clusterID: 0, data: buffer, header, endpoint: 1, linkquality: 50, groupID: 1};
        await mockAdapterEvents.zclPayload(payload);
        expect(events.message.length).toBe(1);
        expect(events.message[0].data).toStrictEqual({customAttr: 3, aDifferentZclVersion: 1, stackVersion: 1});
        expect(events.message[0].cluster).toBe("genBasic");

        // Should allow to extend an already extended cluster again.
        device.addCustomCluster("genBasic", {
            ID: 0,
            commands: {},
            commandsResponse: {},
            attributes: {
                customAttrSecondOverride: {ID: 256, type: Zcl.DataType.UINT8},
            },
        });
        await mockAdapterEvents.zclPayload(payload);
        expect(events.message.length).toBe(2);
        expect(events.message[1].data).toStrictEqual({customAttrSecondOverride: 3, aDifferentZclVersion: 1, stackVersion: 1});
        expect(events.message[1].cluster).toBe("genBasic");
    });

    it("Should allow to specify custom cluster", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.addCustomCluster("myCustomCluster", {
            ID: 9123,
            commands: {},
            commandsResponse: {},
            attributes: {superAttribute: {ID: 0, type: Zcl.DataType.UINT8}},
        });
        const buffer = Buffer.from([24, 169, 10, 0, 1, 24, 3, 0, 0, 24, 1]);
        const header = Zcl.Header.fromBuffer(buffer);
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: 9123,
            data: buffer,
            header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });
        expect(events.message.length).toBe(1);
        expect(events.message[0].data).toStrictEqual({superAttribute: 1, "256": 3});
        expect(events.message[0].cluster).toBe("myCustomCluster");
    });

    it("Should allow to specify custom cluster as override for Zcl cluster", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.addCustomCluster("myCustomCluster", {
            ID: Zcl.Clusters.genBasic.ID,
            commands: {},
            commandsResponse: {},
            attributes: {customAttr: {ID: 256, type: Zcl.DataType.UINT8}},
        });
        const buffer = Buffer.from([24, 169, 10, 0, 1, 24, 3, 0, 0, 24, 1]);
        const header = Zcl.Header.fromBuffer(buffer);
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: Zcl.Clusters.genBasic.ID,
            data: buffer,
            header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });
        expect(events.message.length).toBe(1);
        expect(events.message[0].data).toStrictEqual({customAttr: 3, 0: 1 /*zclVersion no longer recognized, cluster is overridden*/});
        expect(events.message[0].cluster).toBe("myCustomCluster");
    });

    it("merges added custom clusters definitions", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.endpoints[0]!;

        interface BoschThermostatCluster {
            attributes: {
                /** ID: 16391 | Type: ENUM8 */
                operatingMode: number;
                /** ID: 16416 | Type: ENUM8 | Only used on BTH-RA */
                heatingDemand: number;
                /** ID: 16418 | Type: ENUM8 | Only used on BTH-RA */
                valveAdaptStatus: number;
                /** ID: 16421 | Type: ENUM8 | Only used on BTH-RM230Z with value depending on heaterType */
                unknownAttribute0: number;
                /** ID: 16448 | Type: INT16 | Only used on BTH-RA */
                remoteTemperature: number;
                /** ID: 16449 | Type: ENUM8 | Only used on BTH-RA with default value 0x01 */
                unknownAttribute1: number;
                /** ID: 16450 | Type: ENUM8 */
                windowOpenMode: number;
                /** ID: 16451 | Type: ENUM8 */
                boostHeating: number;
                /** ID: 16466 | Type: INT16 | Only used on BTH-RM and BTH-RM230Z */
                cableSensorTemperature: number;
                /** ID: 16480 | Type: ENUM8 | Only used on BTH-RM230Z */
                valveType: number;
                /** ID: 16481 | Type: ENUM8 | Read-only on BTH-RM230Z with value depending on heaterType */
                unknownAttribute2: number;
                /** ID: 16482 | Type: ENUM8 | Only used on BTH-RM and BTH-RM230Z */
                cableSensorMode: number;
                /** ID: 16483 | Type: ENUM8 | Only used on BTH-RM230Z */
                heaterType: number;
                /** ID: 20480 | Type: BITMAP8 */
                errorState: number;
                /** ID: 20496 | Type: ENUM8 | Only used on BTH-RA */
                automaticValveAdapt: number;
            };
            commands: {
                /** ID: 65 | Only used on BTH-RA */
                calibrateValve: Record<string, never>;
            };
            commandResponses: never;
        }

        device.addCustomCluster("hvacThermostat", {
            ID: 0x0201,
            attributes: {
                localTemperatureCalibration: {ID: 0x0010, type: Zcl.DataType.INT8, write: true, min: -50, max: 50, default: 0},
            },
            commands: {},
            commandsResponse: {},
        });
        device.addCustomCluster("hvacThermostat", {
            ID: Zcl.Clusters.hvacThermostat.ID,
            attributes: {
                operatingMode: {
                    ID: 0x4007,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                heatingDemand: {
                    ID: 0x4020,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                valveAdaptStatus: {
                    ID: 0x4022,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                unknownAttribute0: {
                    ID: 0x4025,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                remoteTemperature: {
                    ID: 0x4040,
                    type: Zcl.DataType.INT16,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    min: -32768,
                },
                unknownAttribute1: {
                    ID: 0x4041,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                windowOpenMode: {
                    ID: 0x4042,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                boostHeating: {
                    ID: 0x4043,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                cableSensorTemperature: {
                    ID: 0x4052,
                    type: Zcl.DataType.INT16,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    min: -32768,
                },
                valveType: {ID: 0x4060, type: Zcl.DataType.ENUM8, manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH, write: true, max: 0xff},
                unknownAttribute2: {
                    ID: 0x4061,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                cableSensorMode: {
                    ID: 0x4062,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
                heaterType: {ID: 0x4063, type: Zcl.DataType.ENUM8, manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH, write: true, max: 0xff},
                errorState: {ID: 0x5000, type: Zcl.DataType.BITMAP8, manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH, write: true},
                automaticValveAdapt: {
                    ID: 0x5010,
                    type: Zcl.DataType.ENUM8,
                    manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                    write: true,
                    max: 0xff,
                },
            },
            commands: {
                calibrateValve: {ID: 0x41, parameters: []},
            },
            commandsResponse: {},
        });

        await expect(
            endpoint.write<"hvacThermostat", BoschThermostatCluster>(
                "hvacThermostat",
                {localTemperatureCalibration: -47, cableSensorMode: 0x02},
                {manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH},
            ),
        ).resolves.toStrictEqual(undefined);

        await expect(
            endpoint.write<"hvacThermostat", BoschThermostatCluster>(
                "hvacThermostat",
                {localTemperatureCalibration: 50, heatingDemand: 0x01},
                {manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH},
            ),
        ).resolves.toStrictEqual(undefined);

        await expect(
            endpoint.write<"hvacThermostat", BoschThermostatCluster>(
                "hvacThermostat",
                {localTemperatureCalibration: 51},
                {manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH},
            ),
        ).rejects.toThrow("localTemperatureCalibration requires max of 50");

        await expect(
            endpoint.read<"hvacThermostat", BoschThermostatCluster>("hvacThermostat", ["boostHeating", "operatingMode"], {
                manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
            }),
        ).resolves.toStrictEqual({16391: 0, 16451: 0});
    });

    it("Send zcl command to all no options", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.getEndpoint(1)!.zclCommandBroadcast(255, BroadcastAddress.SLEEPY, Zcl.Clusters.ssIasZone.ID, "initTestMode", {});
        const sentFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            zclTransactionSequenceNumber.current,
            "initTestMode",
            Zcl.Clusters.ssIasZone.ID,
            {},
            device.customClusters,
        );
        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(255);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(sentFrame));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(1);
        expect(mocksendZclFrameToAll.mock.calls[0][3]).toBe(BroadcastAddress.SLEEPY);
        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
    });

    it("Send zcl command to all with manufacturer option", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.addCustomCluster("ssIasZone", {
            ID: Zcl.Clusters.ssIasZone.ID,
            commands: {boschSmokeAlarmSiren: {ID: 0x80, parameters: [{name: "data", type: Zcl.DataType.UINT16, max: 0xffff}]}},
            commandsResponse: {},
            attributes: {},
        });
        const options = {manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH};
        device
            .getEndpoint(1)!
            .zclCommandBroadcast(255, BroadcastAddress.SLEEPY, Zcl.Clusters.ssIasZone.ID, "boschSmokeAlarmSiren", {data: 0x0000}, options);
        const sentFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
            zclTransactionSequenceNumber.current,
            "boschSmokeAlarmSiren",
            Zcl.Clusters.ssIasZone.ID,
            {data: 0x0000},
            device.customClusters,
        );
        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(255);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(sentFrame));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(1);
        expect(mocksendZclFrameToAll.mock.calls[0][3]).toBe(BroadcastAddress.SLEEPY);
        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
    });

    it("Should roll-over transaction ID", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        expect(endpoint.supportsOutputCluster("genDeviceTempCfg")).toBeTruthy();
        expect(endpoint.supportsOutputCluster("genBasic")).toBeFalsy();
        for (let i = 0; i < 300; i++) {
            await endpoint.read("genBasic", ["modelId"]);
        }
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(300);

        const ids: number[] = [];
        for (let i = 0; i < 300; i++) {
            ids.push(mocksendZclFrameToEndpoint.mock.calls[i][3].header.transactionSequenceNumber);
        }

        expect(ids.includes(255)).toBeTruthy();
        expect(ids.includes(256)).toBeFalsy();
    });

    it("Throw error when creating endpoint which already exists", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        let error;
        try {
            await device.createEndpoint(1);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error("Device '0x129' already has an endpoint '1'"));
    });

    it("Throw error when device with IEEE address already exists", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x129"});
        let error;
        try {
            Device.create("Router", "0x129", 140, undefined, undefined, undefined, undefined, InterviewState.Pending, undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error("Device with IEEE address '0x129' already exists"));
    });

    it("Should allow to set type", async () => {
        await controller.start();
        const device = Device.create("Router", "0x129", 140, undefined, undefined, undefined, undefined, InterviewState.Pending, undefined);
        device.type = "EndDevice";
        expect(device.type).toStrictEqual("EndDevice");
    });

    it("Return device from databse when not in lookup", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x129"});
        Device.resetCache();
        expect(controller.getDeviceByIeeeAddr("0x129")).toBeInstanceOf(Device);
    });

    it("Throw error when interviewing and calling interview again", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const firstInterview = device.interview();
        let error;
        try {
            await device.interview();
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error("Interview - interview already in progress for '0x129'"));
        try {
            await firstInterview;
        } catch {
            /* empty */
        }
    });

    it("Remove device from network", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        await device.removeFromNetwork();
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.LEAVE_REQUEST, "0x140", Zdo.LeaveRequestFlags.WITHOUT_REJOIN);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x140", 140, Zdo.ClusterId.LEAVE_REQUEST, zdoPayload, false);
        expect(controller.getDeviceByIeeeAddr("0x140")).toBeUndefined();
        // shouldn't throw when removing from database when not in
        await device.removeFromDatabase();
    });

    it("Remove group from network", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const group = await controller.createGroup(4);
        const endpoint = device.getEndpoint(1)!;
        await endpoint.addToGroup(group);
        mocksendZclFrameToEndpoint.mockClear();

        await group.removeFromNetwork();

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 10, "remove", 4, {groupid: 4}, {})),
        );
    });

    it("Remove group from database", async () => {
        await controller.start();
        const group = await controller.createGroup(4);
        await group.removeFromDatabase();
        expect(controller.getGroupByID(4)).toStrictEqual(undefined);
        // shouldn't throw when removing from database when not in
        await group.removeFromDatabase();
    });

    it("Device lqi", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        const result = await device.lqi();
        expect(result).toStrictEqual([
            {eui64: "0x160", nwkAddress: 160, lqi: 20, relationship: 2, depth: 5, ...LQI_TABLE_ENTRY_DEFAULTS},
            {eui64: "0x170", nwkAddress: 170, lqi: 21, relationship: 4, depth: 8, ...LQI_TABLE_ENTRY_DEFAULTS},
        ]);
    });

    it("Device routing table", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        const result = await device.routingTable();
        expect(result).toStrictEqual([
            {destinationAddress: 120, status: "ACTIVE", nextHopAddress: 1, ...ROUTING_TABLE_ENTRY_DEFAULTS},
            {destinationAddress: 130, status: "DISCOVERY_FAILED", nextHopAddress: 2, ...ROUTING_TABLE_ENTRY_DEFAULTS},
        ]);
    });

    it("Device binding table", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        const result = await device.bindingTable();
        expect(result).toStrictEqual([
            {
                sourceEui64: "0xf1f2f3f5f6f7f8",
                sourceEndpoint: 1,
                clusterId: Zcl.Clusters.genBasic.ID,
                destAddrMode: 0x03,
                dest: "0xa1a2a3a4a5a6a7a8",
                destEndpoint: 2,
            },
            {
                sourceEui64: "0xe1e2e3e5e6e7e8",
                sourceEndpoint: 3,
                clusterId: Zcl.Clusters.genAlarms.ID,
                destAddrMode: 0x01,
                dest: 0x1234,
            },
        ]);
    });

    it("Device updates endpoint bindings from binding table", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 162, ieeeAddr: "0x00000000000162"});
        await mockAdapterEvents.deviceJoined({networkAddress: 161, ieeeAddr: "0x00000000000161"});
        const group = controller.createGroup(0x1234);
        const targetDevice = controller.getDeviceByIeeeAddr("0x00000000000162")!;
        const device = controller.getDeviceByIeeeAddr("0x00000000000161")!;
        const ep1 = device.endpoints.find((ep) => ep.ID === 1)!;
        const ep4 = device.endpoints.find((ep) => ep.ID === 4)!;

        mockAdapterSendZdo.mockImplementationOnce(() => {
            return [
                Zdo.Status.SUCCESS,
                {
                    bindingTableEntries: 2,
                    startIndex: 0,
                    entryList: [
                        {
                            sourceEui64: "0x00000000000161",
                            sourceEndpoint: 1,
                            clusterId: Zcl.Clusters.genBasic.ID,
                            destAddrMode: 0x03,
                            dest: "0x00000000000162",
                            destEndpoint: 2,
                        },
                        {
                            sourceEui64: "0x00000000000161",
                            sourceEndpoint: 4,
                            clusterId: Zcl.Clusters.genAlarms.ID,
                            destAddrMode: 0x01,
                            dest: 0x1234,
                        },
                    ],
                },
            ];
        });

        const result = await device.bindingTable();

        expect(result).toStrictEqual([
            {
                sourceEui64: "0x00000000000161",
                sourceEndpoint: 1,
                clusterId: Zcl.Clusters.genBasic.ID,
                destAddrMode: 0x03,
                dest: "0x00000000000162",
                destEndpoint: 2,
            },
            {
                sourceEui64: "0x00000000000161",
                sourceEndpoint: 4,
                clusterId: Zcl.Clusters.genAlarms.ID,
                destAddrMode: 0x01,
                dest: 0x1234,
            },
        ]);

        expect(ep1.binds).toStrictEqual([
            {target: targetDevice.endpoints.find((e) => e.ID === 2), cluster: expect.objectContaining({ID: Zcl.Clusters.genBasic.ID})},
        ]);
        expect(ep4.binds).toStrictEqual([{target: group, cluster: expect.objectContaining({ID: Zcl.Clusters.genAlarms.ID})}]);
    });

    it("Device updates existing endpoint bindings from binding table", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 162, ieeeAddr: "0x00000000000162"});
        await mockAdapterEvents.deviceJoined({networkAddress: 161, ieeeAddr: "0x00000000000161"});
        const group = controller.createGroup(0x1234);
        const targetDevice = controller.getDeviceByIeeeAddr("0x00000000000162")!;
        const device = controller.getDeviceByIeeeAddr("0x00000000000161")!;
        const ep1 = device.endpoints.find((ep) => ep.ID === 1)!;
        const ep4 = device.endpoints.find((ep) => ep.ID === 4)!;

        ep1.addBinding(Zcl.Clusters.genAlarms.ID, 0x1234);

        expect(ep1.binds).toStrictEqual([{target: group, cluster: expect.objectContaining({ID: Zcl.Clusters.genAlarms.ID})}]);

        mockAdapterSendZdo.mockImplementationOnce(() => {
            return [
                Zdo.Status.SUCCESS,
                {
                    bindingTableEntries: 2,
                    startIndex: 0,
                    entryList: [
                        {
                            sourceEui64: "0x00000000000161",
                            sourceEndpoint: 1,
                            clusterId: Zcl.Clusters.genBasic.ID,
                            destAddrMode: 0x03,
                            dest: "0x00000000000162",
                            destEndpoint: 2,
                        },
                        {
                            sourceEui64: "0x00000000000161",
                            sourceEndpoint: 4,
                            clusterId: Zcl.Clusters.genAlarms.ID,
                            destAddrMode: 0x01,
                            dest: 0x1234,
                        },
                    ],
                },
            ];
        });

        const result = await device.bindingTable();

        expect(result).toStrictEqual([
            {
                sourceEui64: "0x00000000000161",
                sourceEndpoint: 1,
                clusterId: Zcl.Clusters.genBasic.ID,
                destAddrMode: 0x03,
                dest: "0x00000000000162",
                destEndpoint: 2,
            },
            {
                sourceEui64: "0x00000000000161",
                sourceEndpoint: 4,
                clusterId: Zcl.Clusters.genAlarms.ID,
                destAddrMode: 0x01,
                dest: 0x1234,
            },
        ]);

        expect(ep1.binds).toStrictEqual([
            {target: targetDevice.endpoints.find((e) => e.ID === 2), cluster: expect.objectContaining({ID: Zcl.Clusters.genBasic.ID})},
        ]);
        expect(ep4.binds).toStrictEqual([{target: group, cluster: expect.objectContaining({ID: Zcl.Clusters.genAlarms.ID})}]);
    });

    it("Device clears all bindings", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 161, ieeeAddr: "0x00000000000161"});
        const group = controller.createGroup(0x1234);
        const device = controller.getDeviceByIeeeAddr("0x00000000000161")!;
        const ep1 = device.endpoints.find((ep) => ep.ID === 1)!;

        ep1.addBinding(Zcl.Clusters.genAlarms.ID, 0x1234);

        expect(ep1.binds).toStrictEqual([{target: group, cluster: expect.objectContaining({ID: Zcl.Clusters.genAlarms.ID})}]);

        await expect(device.clearAllBindings(["0xffffffffffffffff"])).resolves.toStrictEqual(undefined);

        expect(ep1.binds).toStrictEqual([]);
    });

    it("Device selectively clears target bindings", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 161, ieeeAddr: "0x00000000000161"});
        const group = controller.createGroup(0x1234);
        const device = controller.getDeviceByIeeeAddr("0x00000000000161")!;
        const ep1 = device.endpoints.find((ep) => ep.ID === 1)!;

        ep1.addBinding(Zcl.Clusters.genAlarms.ID, 0x1234);

        expect(ep1.binds).toStrictEqual([{target: group, cluster: expect.objectContaining({ID: Zcl.Clusters.genAlarms.ID})}]);

        await expect(device.clearAllBindings(["0xf1f1f1f1f1f1f1f1"])).resolves.toStrictEqual(undefined);

        expect(ep1.binds).toStrictEqual([{target: group, cluster: expect.objectContaining({ID: Zcl.Clusters.genAlarms.ID})}]);
    });

    it("Device selectively clears multi-target bindings", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 161, ieeeAddr: "0x00000000000161"});
        const group = controller.createGroup(0x1234);
        const device = controller.getDeviceByIeeeAddr("0x00000000000161")!;
        const ep1 = device.endpoints.find((ep) => ep.ID === 1)!;

        ep1.addBinding(Zcl.Clusters.genAlarms.ID, 0x1234);

        expect(ep1.binds).toStrictEqual([{target: group, cluster: expect.objectContaining({ID: Zcl.Clusters.genAlarms.ID})}]);

        await expect(device.clearAllBindings(["0xf1f1f1f1f1f1f1f1", "0xa9a9a9a9a9a9a9a9"])).resolves.toStrictEqual(undefined);

        expect(ep1.binds).toStrictEqual([{target: group, cluster: expect.objectContaining({ID: Zcl.Clusters.genAlarms.ID})}]);
    });

    it("Device ping", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 176, ieeeAddr: "0x176"});
        const device = controller.getDeviceByIeeeAddr("0x176")!;
        mocksendZclFrameToEndpoint.mockClear();
        await device.ping();
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x176");
        expect(call[1]).toBe(176);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 0, "read", 0, [{attrId: 0}], {})),
        );
        expect(call[4]).toBe(10000);
        expect(call[5]).toBe(false);
        expect(call[6]).toBe(true);
        expect(call[7]).toBeUndefined();
    });

    it("Poll control supported", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 174, ieeeAddr: "0x174"});
        const device = controller.getDeviceByIeeeAddr("0x174")!;
        await device.interview();
        const endpoint = device.getEndpoint(1)!;
        const coordinator = Device.byType("Coordinator")[0];
        const target = coordinator.getEndpoint(1);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster("genPollCtrl", undefined, {}), target}]));

        device.checkinInterval = undefined;
        expect(device.checkinInterval).toBeUndefined();
        expect(device.pendingRequestTimeout).toStrictEqual(0);
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);
        mocksendZclFrameToEndpoint.mockImplementationOnce((_ieeeAddr, _networkAddress, _endpoint, frame: Zcl.Frame) => {
            const payload = [{attrId: 0, status: 0, dataType: 35, attrData: 204}];
            const responseFrame = Zcl.Frame.create(0, 1, true, undefined, 10, "readRsp", frame.cluster.ID, payload, {});
            return {header: responseFrame.header, data: responseFrame.toBuffer(), clusterID: frame.cluster.ID};
        });
        mocksendZclFrameToEndpoint.mockImplementationOnce(() => vi.advanceTimersByTime(10));
        let frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            1,
            1,
            "checkin",
            Zcl.Utils.getCluster("genPollCtrl", undefined, {}).ID,
            {},
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 174,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 52,
            groupID: undefined,
        });
        await flushPromises();
        expect(device.checkinInterval).toStrictEqual(51);
        expect(device.pendingRequestTimeout).toStrictEqual(51000);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(3);
        device.checkinInterval = 50;

        mocksendZclFrameToEndpoint.mockClear();
        frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            1,
            1,
            "checkin",
            Zcl.Utils.getCluster("genPollCtrl", undefined, {}).ID,
            {},
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 174,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 52,
            groupID: undefined,
        });
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x174");
        expect(call[1]).toBe(174);
        expect(call[2]).toBe(1);
        expect(call[3].cluster.name).toBe("genPollCtrl");
        expect(call[3].command.name).toBe("checkinRsp");
        expect(call[3].payload).toStrictEqual({startFastPolling: 0, fastPollTimeout: 0});
    });

    it("Poll control unsupported", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        await device.interview();
        const endpoint = device.getEndpoint(1)!;
        expect(deepClone(endpoint.binds)).toStrictEqual([]);
    });

    it("Endpoint get id", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        expect(device.getEndpoint(1)!.ID).toBe(1);
    });

    it("Endpoint get id by endpoint device type", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 172, ieeeAddr: "0x172"});
        const device = controller.getDeviceByIeeeAddr("0x172")!;
        expect(device.getEndpointByDeviceType("ZLLOnOffPluginUnit")).toBeUndefined();
        expect(device.getEndpointByDeviceType("ZLLExtendedColorLight")!.ID).toBe(11);
    });

    it("Endpoint bind", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const target = controller.getDeviceByIeeeAddr("0x170")!.getEndpoint(1)!;
        const endpoint = device.getEndpoint(1)!;
        mockAdapterSendZdo.mockClear();
        await endpoint.bind("genBasic", target);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(0, undefined, {}), target}]));
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.BIND_REQUEST, "0x129", 1, 0, Zdo.UNICAST_BINDING, "0x170", 0, 1);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.BIND_REQUEST, zdoPayload, false);

        // Should bind another time but not add it to the binds
        mockAdapterSendZdo.mockClear();
        await endpoint.bind("genBasic", target);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(0, undefined, {}), target}]));
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.BIND_REQUEST, zdoPayload, false);
    });

    it("Endpoint addBinding", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const target = controller.getDeviceByIeeeAddr("0x170")!.getEndpoint(1)!;
        const endpoint = device.getEndpoint(1)!;
        endpoint.addBinding("genPowerCfg", target);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(1, undefined, {}), target}]));

        // Should bind another time but not add it to the binds
        endpoint.addBinding("genPowerCfg", target);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(1, undefined, {}), target}]));
    });

    it("Endpoint get binds non-existing device", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        // @ts-expect-error private
        endpoint._binds.push({
            type: "endpoint",
            deviceIeeeAddress: "notexisting",
            endpointID: 1,
            cluster: 2,
        });
        expect(endpoint.binds).toStrictEqual([]);
    });

    it("Group bind", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const group = await controller.createGroup(4);
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.bind("genPowerCfg", group);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(1, undefined, {}), target: group}]));
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            Zdo.ClusterId.BIND_REQUEST,
            "0x129",
            1,
            1,
            Zdo.MULTICAST_BINDING,
            ZSpec.BLANK_EUI64,
            4,
            0xff,
        );
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.BIND_REQUEST, zdoPayload, false);
    });

    it("Group addBinding", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const group = await controller.createGroup(4);
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        endpoint.addBinding("genBasic", group);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(0, undefined, {}), target: group}]));
    });

    it("Group bind by number (should create group)", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(Group.byGroupID(11)).toBeUndefined();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.bind("genPowerCfg", 11);
        const group = Group.byGroupID(11);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(1, undefined, {}), target: group}]));
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            Zdo.ClusterId.BIND_REQUEST,
            "0x129",
            1,
            1,
            Zdo.MULTICAST_BINDING,
            ZSpec.BLANK_EUI64,
            11,
            0xff,
        );
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.BIND_REQUEST, zdoPayload, false);
    });

    it("Group addBinding by number (should create group)", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(Group.byGroupID(11)).toBeUndefined();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        endpoint.addBinding("genBasic", 11);
        const group = Group.byGroupID(11);
        expect(deepClone(endpoint.binds)).toStrictEqual(deepClone([{cluster: Zcl.Utils.getCluster(0, undefined, {}), target: group}]));
    });

    it("Endpoint unbind", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const target = controller.getDeviceByIeeeAddr("0x170")!.getEndpoint(1)!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.bind("genBasic", target);
        await endpoint.unbind("genBasic", target);
        expect(endpoint.binds).toStrictEqual([]);
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.UNBIND_REQUEST, "0x129", 1, 0, Zdo.UNICAST_BINDING, "0x170", 0, 1);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.UNBIND_REQUEST, zdoPayload, false);

        // Should unbind another time when not in binds
        await endpoint.unbind("genBasic", target);
        expect(endpoint.binds).toStrictEqual([]);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.UNBIND_REQUEST, zdoPayload, false);
    });

    it("Group unbind", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const group = await controller.createGroup(5);
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        expect(endpoint.binds.length).toBe(0);
        await endpoint.bind("genPowerCfg", group);
        expect(endpoint.binds.length).toBe(1);
        await endpoint.unbind("genPowerCfg", group);
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            Zdo.ClusterId.UNBIND_REQUEST,
            "0x129",
            1,
            1,
            Zdo.MULTICAST_BINDING,
            ZSpec.BLANK_EUI64,
            5,
            0xff,
        );
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.UNBIND_REQUEST, zdoPayload, false);
        expect(endpoint.binds.length).toBe(0);
    });

    it("Group unbind by number", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const group = await controller.createGroup(5);
        const endpoint = device.getEndpoint(1)!;
        expect(endpoint.binds.length).toBe(0);
        await endpoint.bind("genPowerCfg", group);
        expect(endpoint.binds.length).toBe(1);
        await endpoint.unbind("genPowerCfg", 5);
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            Zdo.ClusterId.UNBIND_REQUEST,
            "0x129",
            1,
            1,
            Zdo.MULTICAST_BINDING,
            ZSpec.BLANK_EUI64,
            5,
            0xff,
        );
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.UNBIND_REQUEST, zdoPayload, false);
        expect(endpoint.binds.length).toBe(0);
    });

    it("Group unbind by number, non-existing group and non-existing bind with force=true", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        expect(endpoint.binds.length).toBe(0);
        await endpoint.unbind("genPowerCfg", 5, true);
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            Zdo.ClusterId.UNBIND_REQUEST,
            "0x129",
            1,
            1,
            Zdo.MULTICAST_BINDING,
            ZSpec.BLANK_EUI64,
            5,
            0xff,
        );
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.UNBIND_REQUEST, zdoPayload, false);
        expect(endpoint.binds.length).toBe(0);
    });

    it("Endpoint configure reporting", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.configureReporting("genPowerCfg", [
            {
                attribute: "mainsFrequency",
                minimumReportInterval: 1,
                maximumReportInterval: 10,
                reportableChange: 1,
            },
        ]);

        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    9,
                    "configReport",
                    1,
                    [{direction: 0, attrId: 1, dataType: 32, minRepIntval: 1, maxRepIntval: 10, repChange: 1}],
                    {},
                ),
            ),
        );
    });

    it("handles configure reporting with non-Analog data type", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.configureReporting("genOnOff", [
            {
                attribute: "onOff",
                minimumReportInterval: 1,
                maximumReportInterval: 10,
            },
        ]);

        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    9,
                    "configReport",
                    Zcl.Clusters.genOnOff.ID,
                    [{direction: 0, attrId: 0, dataType: 16, minRepIntval: 1, maxRepIntval: 10}],
                    {},
                ),
            ),
        );
    });

    it("throws when trying to configure reporting on endpoint with bad attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();

        await expect(async () => {
            await endpoint.configureReporting("genPowerCfg", [
                {
                    attribute: "doesnotexist",
                    minimumReportInterval: 1,
                    maximumReportInterval: 10,
                    reportableChange: 1,
                },
            ]);
        }).rejects.toThrow(`Invalid attribute 'doesnotexist' for cluster 'genPowerCfg'`);

        await expect(async () => {
            await endpoint.configureReporting("genBasic", [
                {
                    attribute: 99999,
                    minimumReportInterval: 1,
                    maximumReportInterval: 10,
                    reportableChange: 1,
                },
            ]);
        }).rejects.toThrow(`Invalid attribute '99999' for cluster 'genBasic'`);
    });

    it("Should replace legacy configured reportings without manufacturerCode", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();

        // @ts-expect-error private
        endpoint._configuredReportings = [{cluster: 65281, attrId: 269, minRepIntval: 60, maxRepIntval: 900, repChange: 1}];

        await endpoint.configureReporting("manuSpecificSinope", [
            {
                attribute: "roomTemperature",
                minimumReportInterval: 1,
                maximumReportInterval: 10,
                reportableChange: 1,
            },
        ]);

        expect(endpoint.configuredReportings.length).toBe(1);
        expect(endpoint.configuredReportings[0].attribute.name).toBe("roomTemperature");
        expect(endpoint.configuredReportings[0].cluster.name).toBe("manuSpecificSinope");
    });

    it("Endpoint configure reporting for manufacturer specific attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        // @ts-expect-error private
        device._manufacturerID = 4641;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.configureReporting(
            "hvacThermostat",
            [
                {
                    attribute: "viessmannWindowOpenInternal",
                    minimumReportInterval: 1,
                    maximumReportInterval: 10,
                    reportableChange: 1,
                },
            ],
            {manufacturerCode: 0x1221},
        );

        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    4641,
                    9,
                    "configReport",
                    513,
                    [{attrId: 16384, dataType: 48, direction: 0, maxRepIntval: 10, minRepIntval: 1, repChange: 1}],
                    {},
                ),
            ),
        );

        expect(endpoint.configuredReportings.length).toBe(1);
        expect({...endpoint.configuredReportings[0], cluster: undefined}).toStrictEqual({
            attribute: expect.objectContaining({ID: 16384, type: 48, manufacturerCode: 4641, name: "viessmannWindowOpenInternal"}),
            minimumReportInterval: 1,
            maximumReportInterval: 10,
            reportableChange: 1,
            cluster: undefined,
        });
    });

    it("Endpoint configure reporting for manufacturer specific attribute from definition", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        // @ts-expect-error private
        device._manufacturerID = Zcl.ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.configureReporting("hvacThermostat", [
            {
                attribute: "viessmannWindowOpenInternal",
                minimumReportInterval: 1,
                maximumReportInterval: 10,
                reportableChange: 1,
            },
        ]);

        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    4641,
                    9,
                    "configReport",
                    513,
                    [{attrId: 16384, dataType: 48, direction: 0, maxRepIntval: 10, minRepIntval: 1, repChange: 1}],
                    {},
                ),
            ),
        );

        expect(endpoint.configuredReportings.length).toBe(1);
        expect({...endpoint.configuredReportings[0], cluster: undefined}).toStrictEqual({
            attribute: expect.objectContaining({ID: 16384, type: 48, manufacturerCode: 4641, name: "viessmannWindowOpenInternal"}),
            minimumReportInterval: 1,
            maximumReportInterval: 10,
            reportableChange: 1,
            cluster: undefined,
        });
    });

    it("Save endpoint configure reporting", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const genPowerCfg = Zcl.Utils.getCluster("genPowerCfg", undefined, {});
        const msOccupancySensing = Zcl.Utils.getCluster("msOccupancySensing", undefined, {});

        await endpoint.configureReporting("genPowerCfg", [
            {attribute: "mainsFrequency", minimumReportInterval: 1, maximumReportInterval: 10, reportableChange: 1},
        ]);
        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(genPowerCfg),
                attribute: genPowerCfg.getAttribute("mainsFrequency"),
                minimumReportInterval: 1,
                maximumReportInterval: 10,
                reportableChange: 1,
            },
        ]);

        await endpoint.configureReporting("genPowerCfg", [
            {attribute: "mainsFrequency", minimumReportInterval: 3, maximumReportInterval: 100, reportableChange: 2},
        ]);
        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(genPowerCfg),
                attribute: genPowerCfg.getAttribute("mainsFrequency"),
                minimumReportInterval: 3,
                maximumReportInterval: 100,
                reportableChange: 2,
            },
        ]);

        await endpoint.configureReporting("msOccupancySensing", [
            {attribute: "occupancy", minimumReportInterval: 3, maximumReportInterval: 100, reportableChange: 2},
        ]);
        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(genPowerCfg),
                attribute: genPowerCfg.getAttribute("mainsFrequency"),
                minimumReportInterval: 3,
                maximumReportInterval: 100,
                reportableChange: 2,
            },
            {
                cluster: deepClone(msOccupancySensing),
                attribute: msOccupancySensing.getAttribute("occupancy"),
                minimumReportInterval: 3,
                maximumReportInterval: 100,
                reportableChange: 2,
            },
        ]);

        await endpoint.configureReporting("msOccupancySensing", [
            {attribute: "occupancy", minimumReportInterval: 3, maximumReportInterval: 0xffff, reportableChange: 2},
        ]);
        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(genPowerCfg),
                attribute: genPowerCfg.getAttribute("mainsFrequency"),
                minimumReportInterval: 3,
                maximumReportInterval: 100,
                reportableChange: 2,
            },
        ]);
    });

    it("Endpoint configure reporting fails when status code is not 0", async () => {
        configureReportStatus = 1;
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        let error;
        try {
            await endpoint.configureReporting("genPowerCfg", [
                {
                    attribute: "mainsFrequency",
                    minimumReportInterval: 1,
                    maximumReportInterval: 10,
                    reportableChange: 1,
                },
            ]);
        } catch (e) {
            error = e;
        }
        expect(error instanceof Zcl.StatusError).toBeTruthy();
        expect((error as Zcl.StatusError).message).toStrictEqual(
            `ZCL command 0x129/1 genPowerCfg.configReport([{"attribute":"mainsFrequency","minimumReportInterval":1,"maximumReportInterval":10,"reportableChange":1}], {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (Status 'FAILURE')`,
        );
        expect((error as Zcl.StatusError).code).toBe(1);
    });

    it("Endpoint configure reporting fails when status code is not 0 default rsp", async () => {
        configureReportStatus = 1;
        configureReportDefaultRsp = true;
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        let error;
        try {
            await endpoint.configureReporting("genPowerCfg", [
                {
                    attribute: "mainsFrequency",
                    minimumReportInterval: 1,
                    maximumReportInterval: 10,
                    reportableChange: 1,
                },
            ]);
        } catch (e) {
            error = e;
        }
        expect(error instanceof Zcl.StatusError).toBeTruthy();
        expect((error as Zcl.StatusError).message).toStrictEqual(
            `ZCL command 0x129/1 genPowerCfg.configReport([{"attribute":"mainsFrequency","minimumReportInterval":1,"maximumReportInterval":10,"reportableChange":1}], {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (Status 'FAILURE')`,
        );
        expect((error as Zcl.StatusError).code).toBe(1);
    });

    it("Endpoint configure reporting with disable response", async () => {
        configureReportStatus = 1;
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);

        await endpoint.configureReporting(
            "genPowerCfg",
            [
                {
                    attribute: "mainsFrequency",
                    minimumReportInterval: 1,
                    maximumReportInterval: 10,
                    reportableChange: 1,
                },
            ],
            {disableResponse: true},
        );
    });

    it("Endpoint read reporting config", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const saveClusterAttributeReportConfigSpy = vi.spyOn(endpoint, "saveClusterAttributeReportConfig");
        const genPowerCfg = Zcl.Utils.getCluster("genPowerCfg", undefined, {});

        endpoint.saveClusterAttributeReportConfig(genPowerCfg.ID, undefined, [
            {
                status: Zcl.Status.SUCCESS,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                attrId: genPowerCfg.attributes.mainsFrequency.ID,
                dataType: Zcl.DataType.UINT8,
                minRepIntval: 60,
                maxRepIntval: 3600,
                repChange: 10,
            },
            {
                status: Zcl.Status.SUCCESS,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                attrId: genPowerCfg.attributes.batteryAHrRating.ID,
                dataType: Zcl.DataType.UINT16,
                minRepIntval: 10,
                maxRepIntval: 1800,
                repChange: 1,
            },
        ]);

        saveClusterAttributeReportConfigSpy.mockClear();
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockImplementationOnce((_ieeeAddr, _networkAddress, _endpoint, frame: Zcl.Frame) => {
            const payload = [
                {
                    status: Zcl.Status.SUCCESS,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: genPowerCfg.attributes.mainsVoltage.ID,
                    dataType: Zcl.DataType.UINT16,
                    minRepIntval: 0,
                    maxRepIntval: 30,
                    repChange: 10,
                },
                {
                    status: Zcl.Status.SUCCESS,
                    direction: Zcl.Direction.SERVER_TO_CLIENT,
                    attrId: genPowerCfg.attributes.mainsFrequency.ID,
                    dataType: Zcl.DataType.UINT8,
                    timeout: 0xffff,
                },
                {
                    status: Zcl.Status.SUCCESS,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: genPowerCfg.attributes.mainsFrequency.ID,
                    dataType: Zcl.DataType.UINT8,
                    minRepIntval: 30,
                    maxRepIntval: 600,
                    repChange: 2,
                },
                {
                    status: Zcl.Status.UNREPORTABLE_ATTRIBUTE,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: genPowerCfg.attributes.batteryManufacturer.ID,
                },
                {
                    status: Zcl.Status.NOT_FOUND,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: genPowerCfg.attributes.batteryAHrRating.ID,
                },
            ];
            const responseFrame = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.CLIENT_TO_SERVER,
                true,
                undefined,
                9,
                "readReportConfigRsp",
                frame.cluster.ID,
                payload,
                {},
            );
            return {header: responseFrame.header, data: responseFrame.toBuffer(), clusterID: frame.cluster.ID};
        });

        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(genPowerCfg),
                attribute: expect.objectContaining({ID: genPowerCfg.attributes.mainsFrequency.ID, name: "mainsFrequency", type: Zcl.DataType.UINT8}),
                minimumReportInterval: 60,
                maximumReportInterval: 3600,
                reportableChange: 10,
            },
            {
                cluster: deepClone(genPowerCfg),
                attribute: expect.objectContaining({
                    ID: genPowerCfg.attributes.batteryAHrRating.ID,
                    name: "batteryAHrRating",
                    type: Zcl.DataType.UINT16,
                }),
                minimumReportInterval: 10,
                maximumReportInterval: 1800,
                reportableChange: 1,
            },
        ]);

        await endpoint.readReportingConfig("genPowerCfg", [
            {attribute: "mainsVoltage"},
            {direction: Zcl.Direction.SERVER_TO_CLIENT, attribute: "mainsFrequency"}, // coverage
            {attribute: "mainsFrequency"},
            {attribute: "batteryManufacturer"},
            {attribute: {ID: genPowerCfg.attributes.batteryAHrRating.ID}}, // coverage
        ]);

        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    9,
                    "readReportConfig",
                    genPowerCfg.ID,
                    [
                        {direction: Zcl.Direction.CLIENT_TO_SERVER, attrId: genPowerCfg.attributes.mainsVoltage.ID},
                        {direction: Zcl.Direction.SERVER_TO_CLIENT, attrId: genPowerCfg.attributes.mainsFrequency.ID},
                        {direction: Zcl.Direction.CLIENT_TO_SERVER, attrId: genPowerCfg.attributes.mainsFrequency.ID},
                        {direction: Zcl.Direction.CLIENT_TO_SERVER, attrId: genPowerCfg.attributes.batteryManufacturer.ID},
                        {direction: Zcl.Direction.CLIENT_TO_SERVER, attrId: genPowerCfg.attributes.batteryAHrRating.ID},
                    ],
                    {},
                ),
            ),
        );
        expect(saveClusterAttributeReportConfigSpy).toHaveBeenCalledTimes(1);

        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(genPowerCfg),
                attribute: expect.objectContaining({ID: genPowerCfg.attributes.mainsFrequency.ID, name: "mainsFrequency", type: Zcl.DataType.UINT8}),
                minimumReportInterval: 30,
                maximumReportInterval: 600,
                reportableChange: 2,
            },
            {
                cluster: deepClone(genPowerCfg),
                attribute: expect.objectContaining({ID: genPowerCfg.attributes.mainsVoltage.ID, name: "mainsVoltage", type: Zcl.DataType.UINT16}),
                minimumReportInterval: 0,
                maximumReportInterval: 30,
                reportableChange: 10,
            },
        ]);

        saveClusterAttributeReportConfigSpy.mockRestore();
    });

    it("Endpoint throws without response to read reporting config", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();

        await expect(endpoint.readReportingConfig("genPowerCfg", [{attribute: "mainsVoltage"}])).rejects.toThrow("No response received");
    });

    it("Endpoint ignores unknown attributes for read reporting config", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const genBasic = Zcl.Utils.getCluster("genBasic", undefined, {});
        const saveClusterAttributeReportConfigSpy = vi.spyOn(endpoint, "saveClusterAttributeReportConfig");

        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockImplementationOnce((_ieeeAddr, _networkAddress, _endpoint, frame: Zcl.Frame) => {
            const payload = [
                {
                    status: Zcl.Status.UNREPORTABLE_ATTRIBUTE,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: genBasic.attributes.zclVersion.ID,
                },
            ];
            const responseFrame = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.CLIENT_TO_SERVER,
                true,
                undefined,
                9,
                "readReportConfigRsp",
                frame.cluster.ID,
                payload,
                {},
            );
            return {header: responseFrame.header, data: responseFrame.toBuffer(), clusterID: frame.cluster.ID};
        });
        await endpoint.readReportingConfig("genBasic", [{attribute: "zclVersion"}, {attribute: "notanattr"}], {});

        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    9,
                    "readReportConfig",
                    genBasic.ID,
                    [{direction: Zcl.Direction.CLIENT_TO_SERVER, attrId: genBasic.attributes.zclVersion.ID}],
                    {},
                ),
            ),
        );
        expect(saveClusterAttributeReportConfigSpy).toHaveBeenCalledTimes(1);
        expect(mockLogger.warning).toHaveBeenCalledWith("Ignoring unknown attribute notanattr in cluster genBasic", "zh:controller:endpoint");

        saveClusterAttributeReportConfigSpy.mockRestore();
    });

    it("Endpoint manuf-spec read reporting config", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const genBasic = Zcl.Utils.getCluster("genBasic", undefined, {});
        const saveClusterAttributeReportConfigSpy = vi.spyOn(endpoint, "saveClusterAttributeReportConfig");

        endpoint.saveClusterAttributeReportConfig(genBasic.ID, Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC, [
            {
                status: Zcl.Status.SUCCESS,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                attrId: genBasic.attributes.schneiderMeterRadioPower.ID,
                dataType: Zcl.DataType.INT8,
                minRepIntval: 80,
                maxRepIntval: 300,
                repChange: 10,
            },
        ]);

        mocksendZclFrameToEndpoint.mockClear();
        saveClusterAttributeReportConfigSpy.mockClear();
        mocksendZclFrameToEndpoint.mockImplementationOnce((_ieeeAddr, _networkAddress, _endpoint, frame: Zcl.Frame) => {
            const payload = [
                {
                    status: Zcl.Status.SUCCESS,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: genBasic.attributes.schneiderMeterRadioPower.ID,
                    dataType: Zcl.DataType.INT8,
                    minRepIntval: 15,
                    maxRepIntval: 213,
                    repChange: 3,
                },
            ];
            const responseFrame = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.CLIENT_TO_SERVER,
                true,
                Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC,
                9,
                "readReportConfigRsp",
                frame.cluster.ID,
                payload,
                {},
            );
            return {header: responseFrame.header, data: responseFrame.toBuffer(), clusterID: frame.cluster.ID};
        });

        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(genBasic),
                attribute: expect.objectContaining({
                    ID: genBasic.attributes.schneiderMeterRadioPower.ID,
                    name: "schneiderMeterRadioPower",
                    type: Zcl.DataType.INT8,
                    manufacturerCode: Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC,
                }),
                minimumReportInterval: 80,
                maximumReportInterval: 300,
                reportableChange: 10,
            },
        ]);

        await endpoint.readReportingConfig("genBasic", [{attribute: "schneiderMeterRadioPower"}], {
            manufacturerCode: Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC,
        });

        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC,
                    9,
                    "readReportConfig",
                    genBasic.ID,
                    [{direction: Zcl.Direction.CLIENT_TO_SERVER, attrId: genBasic.attributes.schneiderMeterRadioPower.ID}],
                    {},
                ),
            ),
        );
        expect(saveClusterAttributeReportConfigSpy).toHaveBeenCalledTimes(1);

        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(genBasic),
                attribute: expect.objectContaining({
                    ID: genBasic.attributes.schneiderMeterRadioPower.ID,
                    name: "schneiderMeterRadioPower",
                    type: Zcl.DataType.INT8,
                    manufacturerCode: Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC,
                }),
                minimumReportInterval: 15,
                maximumReportInterval: 213,
                reportableChange: 3,
            },
        ]);

        saveClusterAttributeReportConfigSpy.mockRestore();
    });

    it("Return group from databse when not in lookup", async () => {
        await controller.start();
        await controller.createGroup(2);
        Group.resetCache();
        expect(controller.getGroupByID(2)).toBeInstanceOf(Group);
    });

    it("Throw error when creating group already exists", async () => {
        await controller.start();
        await controller.createGroup(2);
        let error;
        try {
            await controller.createGroup(2);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error("Group with groupID '2' already exists"));
    });

    it("Add endpoint to group", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const group = await controller.createGroup(2);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.addToGroup(group);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.SPECIFIC,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    9,
                    "add",
                    4,
                    {groupid: 2, groupname: ""},
                    {},
                ),
            ),
        );
        expect(group.members).toContain(endpoint);
        expect(databaseContents()).toContain(
            `
            {"id":1,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":7,"epList":[1,2],"endpoints":{"1":{"profId":2,"epId":1,"devId":3,"inClusterList":[10],"outClusterList":[11],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}},"2":{"profId":3,"epId":2,"devId":5,"inClusterList":[1],"outClusterList":[0],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}}},"interviewCompleted":true,"interviewState":"SUCCESSFUL","meta":{}}
            {"id":2,"type":"Router","ieeeAddr":"0x129","nwkAddr":129,"manufId":1212,"manufName":"KoenAndCo","powerSource":"Mains (single phase)","modelId":"myModelID","epList":[1],"endpoints":{"1":{"profId":99,"epId":1,"devId":5,"inClusterList":[0,1],"outClusterList":[2],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}}},"appVersion":2,"stackVersion":101,"hwVersion":3,"dateCode":"201901","swBuildId":"1.01","zclVersion":1,"interviewCompleted":true,"interviewState":"SUCCESSFUL","meta":{},"lastSeen":${mockedDate.getTime()}}\n{"id":3,"type":"Group","groupID":2,"members":[{"deviceIeeeAddr":"0x129","endpointID":1}],"meta":{}}
            `
                .trim()
                .split("\n")
                .map((l) => l.trim())
                .join("\n"),
        );
    });

    it("Remove endpoint from group", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const group = await controller.createGroup(2);
        await group.addMember(endpoint);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.removeFromGroup(group);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 9, "remove", 4, {groupid: 2}, {})),
        );
        expect(group.members).toStrictEqual([]);
    });

    it("Remove endpoint from group by number", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.removeFromGroup(4);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 9, "remove", 4, {groupid: 4}, {})),
        );
    });

    it("Try to get deleted device from endpoint", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await mockAdapterEvents.deviceLeave({networkAddress: 129, ieeeAddr: "0x129"});
        // @ts-expect-error private
        expect(Device.devices.size).toStrictEqual(1);
        // @ts-expect-error private
        expect(Device.deletedDevices.size).toStrictEqual(1);
        const delDevice = endpoint.getDevice();

        expect(delDevice).toBeUndefined();
        expect(mockLogger.error).toHaveBeenCalledWith("Tried to get unknown/deleted device 0x129 from endpoint 1.", "zh:controller:endpoint");
    });

    it("Command response", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const response = await endpoint.command("genGroups", "add", {groupid: 1, groupname: ""});
        expect(response).toStrictEqual({groupid: 1, status: 0});
    });

    it("Group command", async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        await group.command("genOnOff", "offWithEffect", {effectid: 9, effectvariant: 10});
        const call = mocksendZclFrameToGroup.mock.calls[0];
        expect(call[0]).toBe(2);
        expect({...deepClone(call[1]), cluster: null}).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 0,
                commandIdentifier: 64,
            },
            payload: {effectid: 9, effectvariant: 10},
            cluster: null,
            command: {
                ID: 64,
                parameters: expect.any(Array),
                name: "offWithEffect",
            },
        });
    });

    it("Endpoint command with options", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.command("genOnOff", "off", {}, {manufacturerCode: 100, disableDefaultResponse: true});
        expect(mocksendZclFrameToEndpoint.mock.calls[0][0]).toBe("0x129");
        expect(mocksendZclFrameToEndpoint.mock.calls[0][1]).toBe(129);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][2]).toBe(1);
        expect({...deepClone(mocksendZclFrameToEndpoint.mock.calls[0][3]), cluster: null}).toStrictEqual({
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: true},
                transactionSequenceNumber: 9,
                manufacturerCode: 100,
                commandIdentifier: 0,
            },
            payload: {},
            cluster: null,
            command: {ID: 0, parameters: expect.any(Array), name: "off", required: true},
        });
        expect(mocksendZclFrameToEndpoint.mock.calls[0][4]).toBe(10000);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][5]).toBe(false);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][6]).toBe(false);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][7]).toBeUndefined();
    });

    it("Endpoint command with duplicate cluster ID", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        device.addCustomCluster("manuSpecificAssaDoorLock", {
            ID: 0xfc00,
            attributes: {},
            commands: {
                getBatteryLevel: {ID: 0x12, parameters: []},
            },
            commandsResponse: {},
        });
        await endpoint.command("manuSpecificAssaDoorLock", "getBatteryLevel", {});
        expect(mocksendZclFrameToEndpoint.mock.calls[0][0]).toBe("0x129");
        expect(mocksendZclFrameToEndpoint.mock.calls[0][1]).toBe(129);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][2]).toBe(1);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][3].toBuffer()).toStrictEqual(Buffer.from([1, 9, 18]));
    });

    it("Endpoint command with duplicate identifier", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.command("lightingColorCtrl", "tuyaMoveToHueAndSaturationBrightness", {hue: 1, saturation: 1, transtime: 0, brightness: 22});
        expect(mocksendZclFrameToEndpoint.mock.calls[0][0]).toBe("0x129");
        expect(mocksendZclFrameToEndpoint.mock.calls[0][1]).toBe(129);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][2]).toBe(1);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][3].toBuffer()).toStrictEqual(Buffer.from([1, 9, 6, 1, 1, 0, 0, 22]));
    });

    it("Endpoint commandResponse", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint.commandResponse("genOta", "imageNotify", {payloadType: 0, queryJitter: 1}, undefined, undefined);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][0]).toBe("0x129");
        expect(mocksendZclFrameToEndpoint.mock.calls[0][1]).toBe(129);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][2]).toBe(1);
        const expected = {
            header: {
                frameControl: {reservedBits: 0, frameType: 1, direction: 1, disableDefaultResponse: true, manufacturerSpecific: false},
                transactionSequenceNumber: 9,
                commandIdentifier: 0,
            },
            payload: {payloadType: 0, queryJitter: 1},
            cluster: expect.objectContaining({name: "genOta"}),
            command: expect.objectContaining({
                ID: 0,
                name: "imageNotify",
            }),
        };
        expect(deepClone(mocksendZclFrameToEndpoint.mock.calls[0][3])).toStrictEqual(expected);
        expect(mocksendZclFrameToEndpoint.mock.calls[0][4]).toBe(10000);
    });

    it("Device without meta should set meta to {}", async () => {
        Device.resetCache();
        const line = JSON.stringify({
            id: 3,
            type: "EndDevice",
            ieeeAddr: "0x90fd9ffffe4b64ae",
            nwkAddr: 19468,
            manufId: 4476,
            manufName: "IKEA of Sweden",
            powerSource: "Battery",
            modelId: "TRADFRI remote control",
            epList: [1],
            endpoints: {
                "1": {
                    profId: 49246,
                    epId: 1,
                    devId: 2096,
                    inClusterList: [0, 1, 3, 9, 2821, 4096],
                    outClusterList: [3, 4, 5, 6, 8, 25, 4096],
                    clusters: {},
                },
            },
            appVersion: 17,
            stackVersion: 87,
            hwVersion: 1,
            dateCode: "20170302",
            swBuildId: "1.2.214",
            zclVersion: 1,
            interviewState: InterviewState.Successful,
            _id: "fJ5pmjqKRYbNvslK",
        });
        fs.writeFileSync(options.databasePath, `${line}\n`);
        await controller.start();
        const expected = {
            ID: 3,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _skipDefaultResponse: false,
            _customClusters: {},
            _endpoints: [
                {
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    clusters: {},
                    ID: 1,
                    deviceID: 2096,
                    _binds: [],
                    _configuredReportings: [],
                    deviceIeeeAddress: "0x90fd9ffffe4b64ae",
                    deviceNetworkAddress: 19468,
                    inputClusters: [0, 1, 3, 9, 2821, 4096],
                    outputClusters: [3, 4, 5, 6, 8, 25, 4096],
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x90fd9ffffe4b64ae", sendInProgress: false},
                    profileID: 49246,
                },
            ],
            _ieeeAddr: "0x90fd9ffffe4b64ae",
            _interviewState: InterviewState.Successful,
            _manufacturerID: 4476,
            meta: {},
            _networkAddress: 19468,
            _type: "EndDevice",
        };
        expect(deepClone(controller.getDeviceByIeeeAddr("0x90fd9ffffe4b64ae"))).toStrictEqual(expected);
        expect(controller.getDeviceByIeeeAddr("0x90fd9ffffe4b64ae")?.genBasic).toStrictEqual({
            manufacturerName: "IKEA of Sweden",
            modelId: "TRADFRI remote control",
            powerSource: Zcl.PowerSource.Battery,
            swBuildId: "1.2.214",
            stackVersion: 87,
            zclVersion: 1,
            appVersion: 17,
            dateCode: "20170302",
            hwVersion: 1,
        });
    });

    it("Read from group", async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        await group.read("genBasic", ["modelId", 0x01], {});
        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToGroup.mock.calls[0][0]).toBe(2);
        expect(deepClone(mocksendZclFrameToGroup.mock.calls[0][1])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 0, "read", 0, [{attrId: 5}, {attrId: 1}], {}),
            ),
        );
        expect(mocksendZclFrameToGroup.mock.calls[0][2]).toBeUndefined();
    });

    it("Read from group ignores unknown attributes", async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        await group.read("genBasic", ["modelId", 0x01, "notanattr"], {});
        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToGroup.mock.calls[0][0]).toBe(2);
        expect(deepClone(mocksendZclFrameToGroup.mock.calls[0][1])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 0, "read", 0, [{attrId: 5}, {attrId: 1}], {}),
            ),
        );
        expect(mocksendZclFrameToGroup.mock.calls[0][2]).toBeUndefined();
        expect(mockLogger.warning).toHaveBeenCalledWith("Ignoring unknown attribute notanattr in cluster genBasic", "zh:controller:group");
    });

    it("Read from group fails", async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        mocksendZclFrameToGroup.mockRejectedValueOnce(new Error("timeout"));
        let error;
        try {
            await group.read("genBasic", ["modelId", 0x01], {});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Read 2 genBasic(["modelId",1], {"direction":0,"reservedBits":0}) failed (timeout)`));
    });

    it("Write to group", async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        await group.write("genBasic", {49: {value: 0x000b, type: 0x19}, deviceEnabled: 1}, {});
        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToGroup.mock.calls[0][0]).toBe(2);
        expect(deepClone(mocksendZclFrameToGroup.mock.calls[0][1])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    0,
                    "write",
                    0,
                    [
                        {attrData: 11, attrId: 49, dataType: 25},
                        {attrData: 1, attrId: 18, dataType: 16},
                    ],
                    {},
                ),
            ),
        );
        expect(mocksendZclFrameToGroup.mock.calls[0][2]).toBeUndefined();
    });

    it("Write to group with unknown attribute should fail", async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        let error;
        try {
            await group.write("genBasic", {UNKNOWN: {value: 0x000b, type: 0x19}, deviceEnabled: 1}, {});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Unknown attribute 'UNKNOWN', specify either an existing attribute or a number`));
    });

    it("Write to group fails", async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        mocksendZclFrameToGroup.mockRejectedValueOnce(new Error("timeout"));
        let error;
        try {
            await group.write("genBasic", {49: {value: 0x000b, type: 0x19}}, {});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Write 2 genBasic({"49":{"value":11,"type":25}}, {"direction":0,"reservedBits":0}) failed (timeout)`));
    });

    it("Write to endpoint custom attributes", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const options = {manufacturerCode: 0x100b, disableDefaultResponse: true, timeout: 12, defaultResponseTimeout: 16};
        await endpoint.write("genBasic", {49: {value: 0x000b, type: 0x19}}, options);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    4107,
                    9,
                    "write",
                    0,
                    [{attrId: 49, attrData: 11, dataType: 25}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(12);
    });

    it("Write to endpoint custom attributes without specifying manufacturerCode", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        // @ts-expect-error private
        device._manufacturerID = Zcl.ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.write("hvacThermostat", {viessmannWindowOpenInternal: 1});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    4641,
                    9,
                    "write",
                    513,
                    [{attrId: 16384, attrData: 1, dataType: 48}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(10000);
    });

    it("WriteUndiv to endpoint custom attributes without response", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const options = {
            manufacturerCode: 0x100b,
            disableDefaultResponse: true,
            timeout: 12,
            defaultResponseTimeout: 16,
            writeUndiv: true,
            disableResponse: true,
        };
        await endpoint.write("genBasic", {49: {value: 0x000b, type: 0x19}}, options);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    4107,
                    9,
                    "writeUndiv",
                    0,
                    [{attrId: 49, attrData: 11, dataType: 25}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(12);
    });

    it("Write to endpoint with unknown string attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        let error;
        try {
            await endpoint.write("genBasic", {UNKNOWN: {value: 0x000b, type: 0x19}});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Unknown attribute 'UNKNOWN', specify either an existing attribute or a number`));
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Write response to endpoint with non ZCL attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.writeResponse("genBasic", 99, {85: {status: 0x01}});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.SERVER_TO_CLIENT,
                    true,
                    undefined,
                    99,
                    "writeRsp",
                    0,
                    [{attrId: 85, status: 1}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(10000);
    });

    it("Write response to endpoint with unknown string attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        let error;
        try {
            await endpoint.writeResponse("genBasic", 99, {UNKNOWN: {status: 0x01}});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Unknown attribute 'UNKNOWN', specify either an existing attribute or a number`));
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Write response to endpoint throw when transaction sequence number provided through options", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        let error;
        try {
            await endpoint.writeResponse("genBasic", 99, {UNKNOWN: {status: 0x01}}, {transactionSequenceNumber: 5});
        } catch (e) {
            error = e;
        }
        expect((error as Error).message).toStrictEqual("Use parameter");
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Write response to endpoint with no status attribute specified", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        let error;
        try {
            await endpoint.writeResponse("genBasic", 99, {1: {value: 0x55}});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Missing attribute 'status'`));
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Write response to endpoint with ZCL attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.writeResponse("genBasic", 99, {zclVersion: {status: 0x01}});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.SERVER_TO_CLIENT,
                    true,
                    undefined,
                    99,
                    "writeRsp",
                    0,
                    [{attrId: 0, status: 1}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(10000);
    });

    it("WriteResponse error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.writeResponse("genBasic", 99, {zclVersion: {status: 0x01}});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genBasic.writeRsp({"zclVersion":{"status":1}}, {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":1,"reservedBits":0,"transactionSequenceNumber":99,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Write response to endpoint with options", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.writeResponse("genBasic", 99, {zclVersion: {status: 0x03}}, {manufacturerCode: Zcl.ManufacturerCode.INOVELLI});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.SERVER_TO_CLIENT,
                    true,
                    Zcl.ManufacturerCode.INOVELLI,
                    99,
                    "writeRsp",
                    0,
                    [{attrId: 0, status: 0x03}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(10000);
    });

    it("Read from endpoint with string", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.read("genBasic", ["stackVersion"]);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 9, "read", 0, [{attrId: 2}], {})),
        );
        expect(call[4]).toBe(10000);
    });

    it("Read from endpoint with string ignores unknown", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.read("genBasic", ["stackVersion", "notanattr"]);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 9, "read", 0, [{attrId: 2}], {})),
        );
        expect(call[4]).toBe(10000);
        expect(mockLogger.warning).toHaveBeenCalledWith("Ignoring unknown attribute notanattr in cluster genBasic", "zh:controller:endpoint");
    });

    it("Read from endpoint with custom attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        // @ts-expect-error private
        device._manufacturerID = Zcl.ManufacturerCode.VIESSMANN_ELEKTRONIK_GMBH;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.read("hvacThermostat", ["viessmannWindowOpenInternal"]);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, 4641, 9, "read", 513, [{attrId: 16384}], {})),
        );
        expect(call[4]).toBe(10000);
    });

    it("Read from endpoint unknown attribute with options", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.read("genBasic", [0xff22], {manufacturerCode: 0x115f, disableDefaultResponse: true});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, 4447, 9, "read", 0, [{attrId: 65314}], {})),
        );
        expect(call[4]).toBe(10000);
    });

    it("Read response to endpoint with non ZCL attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.readResponse("genBasic", 99, {85: {value: 0x000b, type: 0x19}});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.SERVER_TO_CLIENT,
                    true,
                    undefined,
                    99,
                    "readRsp",
                    0,
                    [{attrId: 85, attrData: 11, dataType: 25, status: 0}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(10000);
    });

    it("Read response to endpoint with unknown string attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        let error;
        try {
            await endpoint.readResponse("genBasic", 99, {UNKNOWN: {value: 0x000b, type: 0x19}});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Unknown attribute 'UNKNOWN', specify either an existing attribute or a number`));
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Read response to endpoint throw when transaction sequence number provided through options", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        let error;
        try {
            await endpoint.readResponse("genBasic", 99, {UNKNOWN: {value: 0x000b, type: 0x19}}, {transactionSequenceNumber: 5});
        } catch (e) {
            error = e;
        }
        expect((error as Error).message).toStrictEqual("Use parameter");
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Configure reporting endpoint custom attributes", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        await endpoint.configureReporting("hvacThermostat", [
            {
                attribute: {ID: 0x4004, type: 41},
                minimumReportInterval: 0,
                maximumReportInterval: 3600,
                reportableChange: 25,
            },
        ]);

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    9,
                    "configReport",
                    513,
                    [{attrId: 16388, dataType: 41, direction: 0, maxRepIntval: 3600, minRepIntval: 0, repChange: 25}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(10000);

        const hvacThermostat = Zcl.Utils.getCluster("hvacThermostat", undefined, {});
        expect(deepClone(endpoint.configuredReportings)).toStrictEqual([
            {
                cluster: deepClone(hvacThermostat),
                attribute: {ID: 0x4004, name: "attr0", type: Zcl.DataType.UNKNOWN},
                minimumReportInterval: 0,
                maximumReportInterval: 3600,
                reportableChange: 25,
            },
        ]);
    });

    it("Remove endpoint from all groups", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device1 = controller.getDeviceByIeeeAddr("0x129")!;
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        const device2 = controller.getDeviceByIeeeAddr("0x170")!;
        const group1 = await controller.createGroup(1);
        const group6 = await controller.createGroup(6);
        const group7 = await controller.createGroup(7);
        const endpoint1 = device1.getEndpoint(1)!;
        await group1.addMember(endpoint1);
        await group6.addMember(endpoint1);
        await group6.addMember(device2.getEndpoint(1)!);
        await group7.addMember(device2.getEndpoint(1)!);
        mocksendZclFrameToEndpoint.mockClear();
        await endpoint1.removeFromAllGroups();
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(group1.members).toStrictEqual([]);
        expect(Array.from(group6.members)).toStrictEqual([device2.getEndpoint(1)]);
        expect(Array.from(group7.members)).toStrictEqual([device2.getEndpoint(1)]);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(Zcl.Frame.create(Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 23, "removeAll", 4, {}, {})),
        );
    });

    it("Load database", async () => {
        const database = `
        {"id":1,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":0,"epList":[11,6,5,4,3,2,1],"endpoints":{"1":{"profId":260,"epId":1,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"2":{"profId":257,"epId":2,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"3":{"profId":261,"epId":3,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"4":{"profId":263,"epId":4,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"5":{"profId":264,"epId":5,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"6":{"profId":265,"epId":6,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"11":{"profId":260,"epId":11,"devId":1024,"inClusterList":[],"meta":{},"outClusterList":[1280],"clusters":{}}},"interviewCompleted":false,"meta":{},"_id":"aM341ldunExFmJ3u"}
        {"id":2,"type":"Group","groupID":1,"members":[],"meta":{},"_id":"kiiAEst4irEEqG8T"}
        {"id":3,"type":"Router","ieeeAddr":"0x000b57fffec6a5b2","nwkAddr":40369,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"meta":{},"outClusterList":[5,25,32,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"reporting":1},"_id":"pagvP2f9Bbj3o9TM"}
        {"id":4,"type":"EndDevice","ieeeAddr":"0x0017880104e45517","nwkAddr":6535,"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"meta":{},"outClusterList":[0,3,4,6,8,5],"clusters":{}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,64512],"meta":{},"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z"}
        {"$$indexCreated":{"fieldName":"id","unique":true,"sparse":false}}
        {"id":4,"type":"EndDevice","ieeeAddr":"0x0017880104e45517","nwkAddr":6536,"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"meta":{},"outClusterList":[0,3,4,6,8,5],"clusters":{}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,64512],"meta":{},"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z"}
        {"id":4,"type":"EndDevice","ieeeAddr":"0x0017880104e45517","lastSeen":123,"nwkAddr":6538,"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"meta":{},"outClusterList":[0,3,4,6,8,5],"binds":[{"type":"endpoint","endpointID":1,"deviceIeeeAddr":"0x000b57fffec6a5b2"}],"configuredReportings":[{"cluster":1,"attrId":0,"minRepIntval":1,"maxRepIntval":20,"repChange":2}],"clusters":{"genBasic":{"dir":{"value":3},"attrs":{"modelId":"RWL021"}}}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,64512],"meta":{},"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z"}
        {"id":5,"type":"Group","groupID":2,"members":[{"deviceIeeeAddr": "0x000b57fffec6a5b2", "endpointID": 1}, {"deviceIeeeAddr": "notExisting", "endpointID": 1}],"meta":{},"_id":"kiiAEst4irEEqG8K"}
        {"id":6,"type":"EndDevice","ieeeAddr":"0x0017880104e45518","nwkAddr":6536,"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"meta":{},"outClusterList":[0,3,4,6,8,5],"clusters":{}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,32,64512],"meta":{},"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z", "checkinInterval": 123456}
        `;
        fs.writeFileSync(options.databasePath, database);
        await controller.start();
        expect(controller.getDevices().length).toBe(4);
        expect(deepClone(controller.getDeviceByIeeeAddr("0x0000012300000000"))).toStrictEqual({
            ID: 1,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _customClusters: {},
            _endpoints: [
                {
                    deviceID: 5,
                    _events: {},
                    _eventsCount: 0,
                    inputClusters: [],
                    outputClusters: [],
                    profileID: 260,
                    ID: 1,
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                    meta: {},
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x0000012300000000", sendInProgress: false},
                },
                {
                    deviceID: 5,
                    inputClusters: [],
                    outputClusters: [],
                    profileID: 257,
                    ID: 2,
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    pendingRequests: {id: 2, deviceIeeeAddress: "0x0000012300000000", sendInProgress: false},
                },
                {
                    deviceID: 5,
                    inputClusters: [],
                    outputClusters: [],
                    profileID: 261,
                    ID: 3,
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    pendingRequests: {id: 3, deviceIeeeAddress: "0x0000012300000000", sendInProgress: false},
                },
                {
                    deviceID: 5,
                    inputClusters: [],
                    outputClusters: [],
                    profileID: 263,
                    ID: 4,
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    pendingRequests: {id: 4, deviceIeeeAddress: "0x0000012300000000", sendInProgress: false},
                },
                {
                    deviceID: 5,
                    inputClusters: [],
                    outputClusters: [],
                    profileID: 264,
                    ID: 5,
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    pendingRequests: {id: 5, deviceIeeeAddress: "0x0000012300000000", sendInProgress: false},
                },
                {
                    deviceID: 5,
                    inputClusters: [],
                    outputClusters: [],
                    profileID: 265,
                    ID: 6,
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    pendingRequests: {id: 6, deviceIeeeAddress: "0x0000012300000000", sendInProgress: false},
                },
                {
                    deviceID: 1024,
                    inputClusters: [],
                    outputClusters: [1280],
                    profileID: 260,
                    ID: 11,
                    clusters: {},
                    deviceIeeeAddress: "0x0000012300000000",
                    deviceNetworkAddress: 0,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    pendingRequests: {id: 11, deviceIeeeAddress: "0x0000012300000000", sendInProgress: false},
                },
            ],
            _ieeeAddr: "0x0000012300000000",
            _interviewState: InterviewState.Failed,
            _manufacturerID: 0,
            _networkAddress: 0,
            _type: "Coordinator",
            _skipDefaultResponse: false,
            meta: {},
        });
        expect(deepClone(controller.getDeviceByIeeeAddr("0x000b57fffec6a5b2"))).toStrictEqual({
            ID: 3,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _skipDefaultResponse: false,
            _customClusters: {},
            _endpoints: [
                {
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    _binds: [],
                    _configuredReportings: [],
                    clusters: {},
                    ID: 1,
                    deviceID: 544,
                    deviceIeeeAddress: "0x000b57fffec6a5b2",
                    deviceNetworkAddress: 40369,
                    inputClusters: [0, 3, 4, 5, 6, 8, 768, 2821, 4096],
                    outputClusters: [5, 25, 32, 4096],
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x000b57fffec6a5b2", sendInProgress: false},
                    profileID: 49246,
                },
            ],
            _ieeeAddr: "0x000b57fffec6a5b2",
            _interviewState: InterviewState.Successful,
            _manufacturerID: 4476,
            meta: {reporting: 1},
            _networkAddress: 40369,
            _type: "Router",
        });
        expect(controller.getDeviceByIeeeAddr("0x000b57fffec6a5b2")?.genBasic).toStrictEqual({
            appVersion: 17,
            dateCode: "20170331",
            hwVersion: 1,
            manufacturerName: "IKEA of Sweden",
            modelId: "TRADFRI bulb E27 WS opal 980lm",
            powerSource: Zcl.PowerSource["Mains (single phase)"],
            swBuildId: "1.2.217",
            stackVersion: 87,
            zclVersion: 1,
        });
        expect(deepClone(controller.getDeviceByIeeeAddr("0x0017880104e45517"))).toStrictEqual({
            ID: 4,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _customClusters: {},
            _endpoints: [
                {
                    deviceID: 2096,
                    _events: {},
                    _eventsCount: 0,
                    inputClusters: [0],
                    outputClusters: [0, 3, 4, 6, 8, 5],
                    profileID: 49246,
                    ID: 1,
                    clusters: {genBasic: {dir: {value: 3}, attributes: {modelId: "RWL021"}}},
                    deviceIeeeAddress: "0x0017880104e45517",
                    deviceNetworkAddress: 6538,
                    _binds: [{type: "endpoint", endpointID: 1, deviceIeeeAddr: "0x000b57fffec6a5b2"}],
                    _configuredReportings: [{cluster: 1, attrId: 0, minRepIntval: 1, maxRepIntval: 20, repChange: 2}],
                    meta: {},
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x0017880104e45517", sendInProgress: false},
                },
                {
                    deviceID: 12,
                    inputClusters: [0, 1, 3, 15, 64512],
                    outputClusters: [25],
                    profileID: 260,
                    ID: 2,
                    clusters: {},
                    deviceIeeeAddress: "0x0017880104e45517",
                    deviceNetworkAddress: 6538,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    pendingRequests: {id: 2, deviceIeeeAddress: "0x0017880104e45517", sendInProgress: false},
                },
            ],
            _ieeeAddr: "0x0017880104e45517",
            _interviewState: InterviewState.Successful,
            _lastSeen: 123,
            _manufacturerID: 4107,
            _networkAddress: 6538,
            _type: "EndDevice",
            _skipDefaultResponse: false,
            meta: {configured: 1},
        });
        expect(controller.getDeviceByIeeeAddr("0x0017880104e45517")?.genBasic).toStrictEqual({
            appVersion: 2,
            dateCode: "20160302",
            hwVersion: 1,
            manufacturerName: "Philips",
            modelId: "RWL021",
            powerSource: Zcl.PowerSource.Battery,
            swBuildId: "5.45.1.17846",
            stackVersion: 1,
            zclVersion: 1,
        });
        expect(deepClone(controller.getDeviceByIeeeAddr("0x0017880104e45518"))).toStrictEqual({
            ID: 6,
            _checkinInterval: 123456,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 123456000,
            _customClusters: {},
            _endpoints: [
                {
                    deviceID: 2096,
                    _events: {},
                    _eventsCount: 0,
                    inputClusters: [0],
                    outputClusters: [0, 3, 4, 6, 8, 5],
                    profileID: 49246,
                    ID: 1,
                    clusters: {},
                    deviceIeeeAddress: "0x0017880104e45518",
                    deviceNetworkAddress: 6536,
                    _binds: [],
                    _configuredReportings: [],
                    meta: {},
                    pendingRequests: {id: 1, deviceIeeeAddress: "0x0017880104e45518", sendInProgress: false},
                },
                {
                    deviceID: 12,
                    inputClusters: [0, 1, 3, 15, 32, 64512],
                    outputClusters: [25],
                    profileID: 260,
                    ID: 2,
                    clusters: {},
                    deviceIeeeAddress: "0x0017880104e45518",
                    deviceNetworkAddress: 6536,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    meta: {},
                    pendingRequests: {id: 2, deviceIeeeAddress: "0x0017880104e45518", sendInProgress: false},
                },
            ],
            _ieeeAddr: "0x0017880104e45518",
            _interviewState: InterviewState.Successful,
            _manufacturerID: 4107,
            _networkAddress: 6536,
            _type: "EndDevice",
            _skipDefaultResponse: false,
            meta: {configured: 1},
        });
        expect(controller.getDeviceByIeeeAddr("0x0017880104e45518")?.genBasic).toStrictEqual({
            appVersion: 2,
            dateCode: "20160302",
            hwVersion: 1,
            manufacturerName: "Philips",
            modelId: "RWL021",
            powerSource: Zcl.PowerSource.Battery,
            swBuildId: "5.45.1.17846",
            stackVersion: 1,
            zclVersion: 1,
        });
        expect((await controller.getGroups()).length).toBe(2);

        const group1 = controller.getGroupByID(1)!;
        expect(deepClone(group1)).toStrictEqual(deepClone({_events: {}, _eventsCount: 0, databaseID: 2, groupID: 1, _members: [], meta: {}}));
        const group2 = controller.getGroupByID(2)!;
        expect(deepClone(group2)).toStrictEqual(
            deepClone({
                _events: {},
                _eventsCount: 0,
                databaseID: 5,
                groupID: 2,
                _members: [
                    {
                        meta: {},
                        _binds: [],
                        _configuredReportings: [],
                        clusters: {},
                        ID: 1,
                        _events: {},
                        _eventsCount: 0,
                        deviceID: 544,
                        deviceIeeeAddress: "0x000b57fffec6a5b2",
                        deviceNetworkAddress: 40369,
                        inputClusters: [0, 3, 4, 5, 6, 8, 768, 2821, 4096],
                        outputClusters: [5, 25, 32, 4096],
                        pendingRequests: {id: 1, deviceIeeeAddress: "0x000b57fffec6a5b2", sendInProgress: false},
                        profileID: 49246,
                    },
                ],
                meta: {},
            }),
        );
    });

    it("Load database: interviewState migration and reset IN_PROGRESS", async () => {
        const database =
            // interviewState=undefined, interviewCompleted=false -> interviewState=FAILED
            '{"id":3,"type":"Router","ieeeAddr":"0x000b57fffec6a5b2","nwkAddr":40369,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"meta":{},"outClusterList":[5,25,32,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewCompleted":false,"meta":{"reporting":1},"_id":"pagvP2f9Bbj3o9TM"}\n' +
            // interviewState=undefined, interviewCompleted=true -> interviewState=SUCCESSFUL
            '{"id":4,"type":"Router","ieeeAddr":"0x000b57fffec6a5b3","nwkAddr":40369,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"meta":{},"outClusterList":[5,25,32,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewCompleted":true,"meta":{"reporting":1},"_id":"pagvP2f9Bbj3o9TM"}\n';
        fs.writeFileSync(options.databasePath, database);
        await controller.start();

        expect(controller.getDeviceByIeeeAddr("0x000b57fffec6a5b2")?.interviewState).toStrictEqual(InterviewState.Failed);
        expect(controller.getDeviceByIeeeAddr("0x000b57fffec6a5b3")?.interviewState).toStrictEqual(InterviewState.Successful);

        // Check serialization to database
        // Pending -> InProgress (as Pending should never end up in the database)
        // Failed maps to interviewCompleted=false
        // @ts-expect-error: private property
        controller.getDeviceByIeeeAddr("0x000b57fffec6a5b3")._interviewState = InterviewState.InProgress;

        // @ts-expect-error: private property
        controller.databaseSave();
        expect(databaseContents()).toStrictEqual(
            '{"id":3,"type":"Router","ieeeAddr":"0x000b57fffec6a5b2","nwkAddr":40369,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"outClusterList":[5,25,32,4096],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewCompleted":false,"interviewState":"FAILED","meta":{"reporting":1}}\n' +
                '{"id":4,"type":"Router","ieeeAddr":"0x000b57fffec6a5b3","nwkAddr":40369,"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"outClusterList":[5,25,32,4096],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewCompleted":false,"interviewState":"PENDING","meta":{"reporting":1}}\n' +
                '{"id":5,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":7,"epList":[1,2],"endpoints":{"1":{"profId":2,"epId":1,"devId":3,"inClusterList":[10],"outClusterList":[11],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}},"2":{"profId":3,"epId":2,"devId":5,"inClusterList":[1],"outClusterList":[0],"clusters":{},"binds":[],"configuredReportings":[],"meta":{}}},"interviewCompleted":true,"interviewState":"SUCCESSFUL","meta":{}}',
        );
    });

    it("Shouldnt load device from group databaseentry", () => {
        expect(() => {
            // @ts-expect-error
            Device.fromDatabaseEntry({type: "Group", endpoints: []});
        }).toThrow("Cannot load device from group");
    });

    it("Should throw datbase basic crud errors", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        expect(() => {
            // @ts-expect-error mock
            controller.database.insert({id: 2});
        }).toThrow(`DatabaseEntry with ID '2' already exists`);

        expect(() => {
            // @ts-expect-error mock
            controller.database.remove(3);
        }).toThrow(`DatabaseEntry with ID '3' does not exist`);

        expect(() => {
            // @ts-expect-error mock
            controller.database.update({id: 3});
        }).toThrow(`DatabaseEntry with ID '3' does not exist`);
    });

    it("Should save received attributes", async () => {
        let buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        let frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.endpoints[0];
        expect(endpoint.getClusterAttributeValue("msOccupancySensing", "occupancy")).toBe(1);
        expect(endpoint.getClusterAttributeValue("genBasic", "modelId")).toBeUndefined();

        buffer = Buffer.from([24, 169, 10, 0, 0, 24, 0]);
        frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(endpoint.getClusterAttributeValue("msOccupancySensing", "occupancy")).toBe(0);
    });

    it("Emit read from device", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const frame = Zcl.Frame.create(0, 0, true, undefined, 40, 0, 1, [{attrId: 0}, {attrId: 9999}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            // Attrid 9999 does not exist in ZCL
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        const expected = {
            type: "read",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: ["mainsVoltage", 9999],
            linkquality: 19,
            groupID: 10,
            cluster: "genPowerCfg",
            meta: {
                zclTransactionSequenceNumber: 40,
                frameControl: {
                    reservedBits: 0,
                    direction: 0,
                    disableDefaultResponse: true,
                    frameType: 0,
                    manufacturerSpecific: false,
                },
                manufacturerCode: undefined,
                rawData: expect.any(Buffer),
            },
        };

        expect(events.message.length).toBe(1);
        expect(events.message[0]).toStrictEqual(expected);
    });

    it("Emit write from device", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const frame = Zcl.Frame.create(0, 0, true, undefined, 40, 2, 10, [{attrId: 16389, dataType: 32, attrData: 3}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            // Attrid 9999 does not exist in ZCL
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 10,
        });

        const expected = {
            type: "write",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: {
                "16389": 3,
            },
            linkquality: 19,
            groupID: 10,
            cluster: "genTime",
            meta: {
                zclTransactionSequenceNumber: 40,
                frameControl: {
                    reservedBits: 0,
                    direction: 0,
                    disableDefaultResponse: true,
                    frameType: 0,
                    manufacturerSpecific: false,
                },
                manufacturerCode: undefined,
                rawData: expect.any(Buffer),
            },
        };

        expect(events.message.length).toBe(1);
        expect(events.message[0]).toStrictEqual(expected);
    });

    it("Endpoint command error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.command("genOnOff", "toggle", {});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genOnOff.toggle({}, {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":false,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Endpoint commandResponse error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.commandResponse("genOta", "imageNotify", {payloadType: 0, queryJitter: 1}, undefined, undefined);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `CommandResponse 0x129/1 genOta.imageNotify({"payloadType":0,"queryJitter":1}, {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":1,"reservedBits":0,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Endpoint commandResponse error when transactionSequenceNumber provided through options", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.commandResponse("genOta", "imageNotify", {payloadType: 0, queryJitter: 1}, {transactionSequenceNumber: 10}, undefined);
        } catch (e) {
            error = e;
        }
        expect((error as Error).message).toStrictEqual("Use parameter");
    });

    it("ConfigureReporting error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.configureReporting("genOnOff", [
                {attribute: "onOff", minimumReportInterval: 0, maximumReportInterval: 2, reportableChange: 10},
            ]);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genOnOff.configReport([{"attribute":"onOff","minimumReportInterval":0,"maximumReportInterval":2,"reportableChange":10}], {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("DefaultResponse error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.defaultResponse(1, 0, 1, 3);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genPowerCfg.defaultRsp({"cmdId":1,"statusCode":0}, {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":1,"reservedBits":0,"transactionSequenceNumber":3,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("DefaultResponse error when transactionSequenceNumber provided through options", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.defaultResponse(1, 0, 1, 3, {transactionSequenceNumber: 10});
        } catch (e) {
            error = e;
        }
        expect((error as Error).message).toStrictEqual("Use parameter");
    });

    it("Skip unbind if not bound", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        const endpoint = controller.getDeviceByIeeeAddr("0x129")?.getEndpoint(1);
        const target = controller.getDeviceByIeeeAddr("0x170")?.getEndpoint(1);
        mockAdapterSendZdo.mockClear();
        await endpoint!.unbind("genOnOff", target!);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(0);
    });

    it("Handle unbind with number not matching any group", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const endpoint = controller.getDeviceByIeeeAddr("0x129")!.getEndpoint(1)!;
        let error;
        try {
            await endpoint.unbind("genOnOff", 1);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Unbind 0x129/1 genOnOff invalid target '1' (no group with this ID exists).`));
    });

    it("Unbind against unbound cluster", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        const endpoint = controller.getDeviceByIeeeAddr("0x129")!.getEndpoint(1)!;
        const target = controller.getDeviceByIeeeAddr("0x170")!.getEndpoint(1)!;
        await endpoint.bind("genOnOff", target);
        mockAdapterSendZdo.mockClear();

        sendZdoResponseStatus = Zdo.Status.NO_ENTRY;

        await endpoint.unbind("genOnOff", target);

        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            Zdo.ClusterId.UNBIND_REQUEST,
            "0x129",
            1,
            Zcl.Clusters.genOnOff.ID,
            Zdo.UNICAST_BINDING,
            "0x170",
            0,
            1,
        );
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.UNBIND_REQUEST, zdoPayload, false);
        expect(endpoint.binds).toStrictEqual([]);
    });

    it("Unbind error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        const endpoint = controller.getDeviceByIeeeAddr("0x129")!.getEndpoint(1)!;
        const target = controller.getDeviceByIeeeAddr("0x170")!.getEndpoint(1)!;
        await endpoint.bind("genOnOff", target);
        mockAdapterSendZdo.mockClear();

        sendZdoResponseStatus = Zdo.Status.INVALID_INDEX;

        await expect(endpoint.unbind("genOnOff", target)).rejects.toThrow(`Unbind 0x129/1 genOnOff from '0x170/1' failed (Status 'INVALID_INDEX')`);

        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            Zdo.ClusterId.UNBIND_REQUEST,
            "0x129",
            1,
            Zcl.Clusters.genOnOff.ID,
            Zdo.UNICAST_BINDING,
            "0x170",
            0,
            1,
        );
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.UNBIND_REQUEST, zdoPayload, false);
    });

    it("Bind error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: 170, ieeeAddr: "0x170"});
        const endpoint = controller.getDeviceByIeeeAddr("0x129")!.getEndpoint(1)!;
        const target = controller.getDeviceByIeeeAddr("0x170")!.getEndpoint(1)!;
        mockAdapterSendZdo.mockClear();

        sendZdoResponseStatus = Zdo.Status.INVALID_INDEX;

        await expect(endpoint.bind("genOnOff", target)).rejects.toThrow(`Bind 0x129/1 genOnOff from '0x170/1' failed (Status 'INVALID_INDEX')`);

        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            Zdo.ClusterId.BIND_REQUEST,
            "0x129",
            1,
            Zcl.Clusters.genOnOff.ID,
            Zdo.UNICAST_BINDING,
            "0x170",
            0,
            1,
        );
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x129", 129, Zdo.ClusterId.BIND_REQUEST, zdoPayload, false);
    });

    it("ReadResponse error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.readResponse("genOnOff", 1, {onOff: 1});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genOnOff.readRsp({"onOff":1}, {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":1,"reservedBits":0,"transactionSequenceNumber":1,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Read error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.read("genOnOff", ["onOff"]);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genOnOff.read(["onOff"], {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Read with disable response", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);

        await endpoint.read("genOnOff", ["onOff"], {disableResponse: true});
    });

    it("Write error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.write("genOnOff", {onTime: 1});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genOnOff.write({"onTime":1}, {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Write with disable response", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);

        await endpoint.write("genOnOff", {onTime: 1}, {disableResponse: true});
    });

    it("Group command error", async () => {
        await controller.start();
        const group = await controller.createGroup(2);
        mocksendZclFrameToGroup.mockRejectedValueOnce(new Error("timeout"));
        let error;
        try {
            await group.command("genOnOff", "toggle", {});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error("Command 2 genOnOff.toggle({}) failed (timeout)"));
    });

    it("Write structured", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);

        await endpoint.writeStructured("genPowerCfg", []);
    });

    it("Write structured with disable response", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);

        await endpoint.writeStructured("genPowerCfg", [], {disableResponse: true});
    });

    it("Write structured error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.writeStructured("genPowerCfg", []);
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genPowerCfg.writeStructured([], {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Write with custom payload", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;

        const writeOptions = {
            frameType: 0,
            manufacturerCode: 0x1ad2,
            disableDefaultResponse: true,
            disableResponse: true,
            reservedBits: 3,
            direction: 1,
            writeUndiv: true,
            transactionSequenceNumber: 0xe9,
        };

        await endpoint.writeStructured(
            "genPowerCfg",
            [
                {
                    attrId: 0x0000,
                    // @ts-expect-error workaround write custom payload, special case "do not write anything"
                    selector: null,
                    elementData: [0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
                    // dataType: undefined,
                },
            ],
            writeOptions,
        );

        expect(lastSentZclFrameToEndpoint).toStrictEqual(
            // Note: 0x00 before start of payload is from having dataType=undefined (gets written as zero)
            Buffer.from([0x7c, 0xd2, 0x1a, 0xe9, 0x0f, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        );

        await endpoint.write(
            "genPowerCfg",
            {
                // @ts-expect-error workaround write custom payload
                4865: {
                    value: [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
                    // type: undefined,
                },
            },
            writeOptions,
        );

        expect(lastSentZclFrameToEndpoint).toStrictEqual(
            // Note: 0x00 before start of payload is from having dataType=undefined (gets written as zero)
            Buffer.from([0x7c, 0xd2, 0x1a, 0xe9, 0x03, 0x01, 0x13, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        );
    });

    it("Green power", async () => {
        await controller.start();
        const data = {
            options: 0,
            srcID: 0x0046f4fe,
            frameCounter: 228,
            commandID: 0xe0,
            payloadSize: 27,
            commandFrame: {
                deviceID: 0x02,
                options: 0x81,
                extendedOptions: 0xf2,
                securityKey: Buffer.from([0xf1, 0xec, 0x92, 0xab, 0xff, 0x8f, 0x13, 0x63, 0xe1, 0x46, 0xbe, 0xb5, 0x18, 0xc9, 0x0c, 0xab]),
                keyMic: 0xd5d446a4,
                outgoingCounter: 0x000004e4,
            },
        };
        const frame = Zcl.Frame.create(1, 0, true, undefined, 10, "commissioningNotification", 33, data, {});
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(frame); // Mock because no Buffalo write for 0xe0 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: 0x0046f4fe & 0xffff,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        const dataPairing = {
            options: GreenPower.encodePairingOptions({
                appId: 0,
                addSink: true,
                removeGpd: false,
                communicationMode: 0b10,
                gpdFixed: false,
                gpdMacSeqNumCapabilities: true,
                securityLevel: 2,
                securityKeyType: 4,
                gpdSecurityFrameCounterPresent: true,
                gpdSecurityKeyPresent: true,
                assignedAliasPresent: false,
                groupcastRadiusPresent: false,
            }),
            srcID: 0x0046f4fe,
            sinkGroupID: 0x0b84,
            deviceID: 2,
            frameCounter: 1252,
            gpdKey: Buffer.from([29, 213, 18, 52, 213, 52, 152, 88, 183, 49, 101, 110, 209, 248, 244, 140]),
        };
        const frameResponse = Zcl.Frame.create(1, 1, true, undefined, 0, "pairing", 33, dataPairing, {});

        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(ZSpec.GP_ENDPOINT);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(frameResponse));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(ZSpec.GP_ENDPOINT);
        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);

        // When joins again, shouldnt emit duplicate event
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(frame); // Mock because no Buffalo write for 0xe0 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: 0x0046f4fe & 0xffff,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.deviceJoined.length).toBe(1);
        expect(deepClone(events.deviceJoined[0])).toStrictEqual({
            device: {
                ID: 2,
                _pendingRequestTimeout: 0,
                _skipDefaultResponse: false,
                _customClusters: {},
                _endpoints: [
                    {
                        inputClusters: [],
                        outputClusters: [],
                        pendingRequests: {id: ZSpec.GP_ENDPOINT, deviceIeeeAddress: "0x000000000046f4fe", sendInProgress: false},
                        ID: ZSpec.GP_ENDPOINT,
                        clusters: {},
                        deviceIeeeAddress: "0x000000000046f4fe",
                        deviceNetworkAddress: 0xf4fe,
                        _binds: [],
                        _configuredReportings: [],
                        _events: {},
                        _eventsCount: 0,
                        meta: {},
                    },
                ],
                _events: {},
                _eventsCount: 0,
                _ieeeAddr: "0x000000000046f4fe",
                _interviewState: InterviewState.Successful,
                _lastSeen: Date.now(),
                _linkquality: 50,
                _networkAddress: 0xf4fe,
                _type: "GreenPower",
                meta: {},
                _gpSecurityKey: [0xf1, 0xec, 0x92, 0xab, 0xff, 0x8f, 0x13, 0x63, 0xe1, 0x46, 0xbe, 0xb5, 0x18, 0xc9, 0x0c, 0xab],
            },
        });
        expect(events.deviceInterview.length).toBe(1);
        expect(deepClone(events.deviceInterview[0])).toStrictEqual({
            status: "successful",
            device: {
                ID: 2,
                _pendingRequestTimeout: 0,
                _skipDefaultResponse: false,
                _customClusters: {},
                _endpoints: [],
                _events: {},
                _eventsCount: 0,
                _ieeeAddr: "0x000000000046f4fe",
                _interviewState: InterviewState.Successful,
                _networkAddress: 0xf4fe,
                _type: "GreenPower",
                meta: {},
                _gpSecurityKey: [0xf1, 0xec, 0x92, 0xab, 0xff, 0x8f, 0x13, 0x63, 0xe1, 0x46, 0xbe, 0xb5, 0x18, 0xc9, 0x0c, 0xab],
            },
        });
        expect(deepClone(events.deviceInterviewRaw[0].device.genBasic)).toStrictEqual({
            modelId: "GreenPower_2",
            powerSource: 0,
        });
        expect(controller.getDeviceByIeeeAddr("0x000000000046f4fe")!.networkAddress).toBe(0xf4fe);
        expect(events.message.length).toBe(2);

        // Green power device send message
        events.message = [];
        expect(events.message.length).toBe(0);
        const dataToggle = {
            options: 0,
            srcID: 0x0046f4fe,
            frameCounter: 228,
            commandID: 0x22,
            payloadSize: 255,
            commandFrame: {},
        };
        const frameToggle = Zcl.Frame.create(1, 0, true, undefined, 10, "notification", 33, dataToggle, {});
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(frameToggle); // Mock because no Buffalo write for 0x22 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 0x0046f4fe & 0xffff,
            clusterID: frameToggle.cluster.ID,
            data: frameToggle.toBuffer(),
            header: frameToggle.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            type: "commandNotification",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: {options: 0, srcID: 0x46f4fe, frameCounter: 228, commandID: 34, payloadSize: 255, commandFrame: {}},
            linkquality: 50,
            groupID: 1,
            cluster: "greenPower",
            meta: {
                zclTransactionSequenceNumber: 10,
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                manufacturerCode: undefined,
                rawData: expect.any(Buffer),
            },
        };
        expect(events.message[0]).toStrictEqual(expected);

        const identifyUnknownDeviceSpy = vi.spyOn(controller, "identifyUnknownDevice");

        mocksendZclFrameToAll.mockClear();

        const dataDecommission = {
            srcID: 0x0046f4fe,
            options: 384,
            frameCounter: 254,
            payloadSize: 1,
            commandID: 0xe1,
            commandFrame: Buffer.from([]),
        };
        const frameDecommission = Zcl.Frame.create(1, 0, true, undefined, 10, "notification", 33, dataDecommission, {});

        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(frameDecommission); // Mock because no Buffalo write for 0xe1 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: 0x0046f4fe & 0xffff,
            clusterID: frameDecommission.cluster.ID,
            data: frameDecommission.toBuffer(),
            header: frameDecommission.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.deviceLeave.length).toBe(1);
        expect(deepClone(events.deviceLeave[0])).toStrictEqual({ieeeAddr: "0x000000000046f4fe"});

        const decommDataPairing = {
            options: GreenPower.encodePairingOptions({
                appId: 0,
                addSink: false,
                removeGpd: true,
                communicationMode: 0b01,
                gpdFixed: false,
                gpdMacSeqNumCapabilities: false,
                securityLevel: 0,
                securityKeyType: 0,
                gpdSecurityFrameCounterPresent: false,
                gpdSecurityKeyPresent: false,
                assignedAliasPresent: false,
                groupcastRadiusPresent: false,
            }),
            srcID: 0x0046f4fe,
            sinkGroupID: 0x0b84,
        };
        const decommFrameResponse = Zcl.Frame.create(1, 1, true, undefined, 2, "pairing", 33, decommDataPairing, {});

        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(ZSpec.GP_ENDPOINT);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(decommFrameResponse));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(ZSpec.GP_ENDPOINT);
        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);

        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(frameDecommission); // Mock because no Buffalo write for 0xe1 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: 0x0046f4fe & 0xffff,
            clusterID: frameDecommission.cluster.ID,
            data: frameDecommission.toBuffer(),
            header: frameDecommission.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        expect(events.deviceLeave.length).toBe(1);
        expect(identifyUnknownDeviceSpy).toHaveBeenCalledTimes(0); // deviceLeave passthrough allows to test this here
    });

    it("Should handle green power responses gracefully", async () => {
        await controller.start();

        const gpdNwkAddress = 1518266219 & 0xffff;
        const gpdIeeeAddress = `0x${(1518266219).toString(16).padStart(16, "0")}`;

        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        await mockAdapterEvents.deviceJoined({networkAddress: gpdNwkAddress, ieeeAddr: gpdIeeeAddress});

        const gppDevice = controller.getDeviceByIeeeAddr("0x129")!;
        const processCommandSpy = vi.spyOn(controller.greenPower, "processCommand");
        mockLogger.error.mockClear();
        const commModeBuffer = Buffer.from([25, 10, 2, 11, 254, 0]);
        const commModeFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(commModeBuffer)!, commModeBuffer, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: gpdNwkAddress,
            clusterID: commModeFrame.cluster.ID,
            data: commModeBuffer,
            header: commModeFrame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: ZSpec.GP_GROUP_ID,
        });
        const defaultRspBuffer = Buffer.from([0, 116, 11, 1, 137]);
        const defaultRspFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(defaultRspBuffer)!, defaultRspBuffer, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: gppDevice.networkAddress,
            clusterID: defaultRspFrame.cluster.ID,
            data: defaultRspBuffer,
            header: defaultRspFrame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: ZSpec.GP_GROUP_ID,
        });

        expect(mockLogger.error).toHaveBeenCalledTimes(0);
        expect(processCommandSpy).toHaveBeenCalledTimes(0);
    });

    it("Should handle green power broadcast commissioning", async () => {
        await controller.start();
        mockLogger.error.mockClear();

        const gpdNwkAddress = 22410362 & 0xffff;
        const buffer = Buffer.from(
            "11020400087af455012e000000e0330285f2c925821df46f458cf0e637aac3bab6aa45831a112e280000041610112223181914151213646562631e1f1c1d1a1b1617966fd7",
            "hex",
        );
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});

        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: gpdNwkAddress,
            clusterID: frame.cluster.ID,
            data: buffer,
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        expect(mockLogger.error).toHaveBeenCalledTimes(0);
        expect(mockLogger.debug).toHaveBeenCalledWith(
            "[PAIRING] srcID=22410362 gpp=28566 options=58696 (addSink=true commMode=2)",
            "zh:controller:greenpower",
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            "[COMMISSIONING] srcID=22410362 gpp=28566 rssi=23 linkQuality=Excellent",
            "zh:controller:greenpower",
        );

        const gpDevice = controller.getDeviceByNetworkAddress(gpdNwkAddress)!;

        expect(gpDevice).toBeDefined();
        expect(gpDevice.type).toStrictEqual("GreenPower");
    });

    it("Should handle green power unicast commissioning success", async () => {
        await controller.start();

        await mockAdapterEvents.deviceJoined({networkAddress: 53934, ieeeAddr: "0x129"});

        const gpdNwkAddress = 22410362 & 0xffff;
        // const gppDevice = controller.getDeviceByIeeeAddr("0x129")!;

        mockLogger.error.mockClear();

        const buffer = Buffer.from("11770400087af45501e2000000e01f0785f2c925821df46f458cf0e637aac3bab6aa45831a11e22c000010020508aed2dd", "hex");
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});

        mocksendZclFrameToEndpoint.mockImplementationOnce((_ieeeAddr, networkAddress, _endpoint, _frame: Zcl.Frame) => {
            const rspBuffer = Buffer.from("00060b0100", "hex");
            const rspFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(rspBuffer)!, rspBuffer, {});

            return {
                wasBroadcast: false,
                address: networkAddress,
                clusterID: rspFrame.cluster.ID,
                data: rspFrame.toBuffer(),
                header: rspFrame.header,
                endpoint: ZSpec.GP_ENDPOINT,
                linkquality: 50,
                groupID: 0,
            };
        });

        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: gpdNwkAddress,
            clusterID: frame.cluster.ID,
            data: buffer,
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 0,
        });

        expect(mockLogger.info).toHaveBeenCalledWith(
            "[COMMISSIONING] srcID=22410362 gpp=53934 rssi=29 linkQuality=Excellent",
            "zh:controller:greenpower",
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
            "[PAIRING] srcID=22410362 gpp=53934 options=58728 (addSink=true commMode=3)",
            "zh:controller:greenpower",
        );

        const gpDevice = controller.getDeviceByNetworkAddress(gpdNwkAddress)!;

        expect(gpDevice).toBeDefined();
        expect(gpDevice.type).toStrictEqual("GreenPower");
        expect(mockLogger.error).toHaveBeenCalledTimes(0);
    });

    it("Should handle green power unicast commissioning failure", async () => {
        await controller.start();

        await mockAdapterEvents.deviceJoined({networkAddress: 53934, ieeeAddr: "0x129"});

        const gpdNwkAddress = 22410362 & 0xffff;
        // const gppDevice = controller.getDeviceByIeeeAddr("0x129")!;

        mockLogger.error.mockClear();

        const buffer = Buffer.from("11770400087af45501e2000000e01f0785f2c925821df46f458cf0e637aac3bab6aa45831a11e22c000010020508aed2dd", "hex");
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});

        mocksendZclFrameToEndpoint.mockImplementationOnce((_ieeeAddr, networkAddress, _endpoint, _frame: Zcl.Frame) => {
            const rspBuffer = Buffer.from("00060b0189", "hex");
            const rspFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(rspBuffer)!, rspBuffer, {});

            return {
                wasBroadcast: false,
                address: networkAddress,
                clusterID: rspFrame.cluster.ID,
                data: rspFrame.toBuffer(),
                header: rspFrame.header,
                endpoint: ZSpec.GP_ENDPOINT,
                linkquality: 50,
                groupID: 0,
            };
        });

        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: gpdNwkAddress,
            clusterID: frame.cluster.ID,
            data: buffer,
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 0,
        });

        expect(mockLogger.info).toHaveBeenCalledWith(
            "[COMMISSIONING] srcID=22410362 gpp=53934 rssi=29 linkQuality=Excellent",
            "zh:controller:greenpower",
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
            "[PAIRING] srcID=22410362 gpp=53934 options=58728 (addSink=true commMode=3)",
            "zh:controller:greenpower",
        );

        const gpDevice = controller.getDeviceByNetworkAddress(gpdNwkAddress)!;

        expect(gpDevice).toBeUndefined();
        expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining("Status 'INSUFFICIENT_SPACE'"), "zh:controller:greenpower");
    });

    it("Should handle green power commissioning frame with IEEE addressing gracefully", async () => {
        await controller.start();
        mockLogger.error.mockClear();

        const processCommandSpy = vi.spyOn(controller.greenPower, "processCommand");

        const buffer = Buffer.from(
            "11020402087af4550100000000012e000000e0330285f2c925821df46f458cf0e637aac3bab6aa45831a112e280000041610112223181914151213646562631e1f1c1d1a1b1617966fd7",
            "hex",
        );
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: 0xf4fe,
            clusterID: frame.cluster.ID,
            data: buffer,
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        expect(mockLogger.error).toHaveBeenCalledTimes(0);
        expect(processCommandSpy).toHaveBeenCalledTimes(0);
    });

    it("Should handle green power commissioning frame with switch info", async () => {
        await controller.start();
        mockLogger.error.mockClear();
        const buffer = Buffer.from("1102040008d755550114000000e01f0785f256b8e010b32e6921aca5d18ab7b7d44d0f063d4d140300001002050229dfe2", "hex");
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: 57129,
            clusterID: frame.cluster.ID,
            data: buffer,
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        expect(frame.payload.commandFrame.genericSwitchConfig).toStrictEqual(5);
        expect(frame.payload.commandFrame.currentContactStatus).toStrictEqual(2);
        expect(mockLogger.error).toHaveBeenCalledTimes(0);
        expect(mockLogger.debug).toHaveBeenCalledWith(
            "[PAIRING] srcID=22369751 gpp=57129 options=58696 (addSink=true commMode=2)",
            "zh:controller:greenpower",
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            "[COMMISSIONING] srcID=22369751 gpp=57129 rssi=34 linkQuality=Excellent",
            "zh:controller:greenpower",
        );
    });

    it("Should ignore invalid green power frame", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.addCustomCluster("myCustomCluster", {
            ID: 9123,
            commands: {},
            commandsResponse: {},
            attributes: {superAttribute: {ID: 0, type: Zcl.DataType.UINT8}},
        });
        const buffer = Buffer.from([24, 169, 99, 0, 1, 24, 3, 0, 0, 24, 1]);
        const header = Zcl.Header.fromBuffer(buffer);
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: 33,
            data: buffer,
            header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });
        expect(events.message.length).toBe(0);
    });

    it("Green power channel request", async () => {
        await controller.start();
        const srcID = 0x0046f4fe;
        // mock device as already joined to avoid zclPayload triggering unknown device identification
        await mockAdapterEvents.deviceJoined({ieeeAddr: "0x000000000046f4fe", networkAddress: srcID & 0xffff});

        // Channel Request
        const data = {
            options: 0,
            srcID,
            frameCounter: 228,
            commandID: 0xe3,
            gppNwkAddr: 0x1234,
            payloadSize: 27,
            commandFrame: {
                nextChannel: 10,
                nextNextChannel: 15,
            },
        };
        const frame = Zcl.Frame.create(1, 0, true, undefined, 10, "commissioningNotification", 33, data, {});
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(frame); // Mock because no Buffalo write for 0xe3 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: srcID & 0xffff,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        const commissioningReply = {
            options: 0,
            tempMaster: 0x1234,
            tempMasterTx: 10,
            srcID,
            gpdCmd: 0xf3,
            gpdPayload: {
                commandID: 0xf3,
                operationalChannel: 4,
                basic: true,
            },
        };

        const frameResponse = Zcl.Frame.create(1, 1, true, undefined, 0, "response", 33, commissioningReply, {});

        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(ZSpec.GP_ENDPOINT);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(frameResponse));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(ZSpec.GP_ENDPOINT);
    });

    it("Green power rxOnCap", async () => {
        await controller.start();
        const data = {
            options: 0,
            srcID: 0x0046f4fe,
            frameCounter: 228,
            commandID: 0xe0,
            gppNwkAddr: 0x1234,
            payloadSize: 27,
            commandFrame: {
                deviceID: 0x02,
                options: 0x83,
                extendedOptions: 0xf2,
                securityKey: Buffer.from([0xf1, 0xec, 0x92, 0xab, 0xff, 0x8f, 0x13, 0x63, 0xe1, 0x46, 0xbe, 0xb5, 0x18, 0xc9, 0x0c, 0xab]),
                keyMic: 0xd5d446a4,
                outgoingCounter: 0x000004e4,
            },
        };
        const frame = Zcl.Frame.create(1, 0, true, undefined, 10, "commissioningNotification", 33, data, {});
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(frame); // Mock because no Buffalo write for 0xe0 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: true,
            address: 0x46f4fe,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 1,
        });

        const device = controller.getDeviceByIeeeAddr("0x000000000046f4fe")!;
        const networkParameters = await controller.getNetworkParameters();

        const commissioningReply = {
            options: 0,
            tempMaster: 0x1234,
            tempMasterTx: networkParameters.channel - 11,
            srcID: 0x0046f4fe,
            gpdCmd: 0xf0,
            gpdPayload: {
                commandID: 0xf0,
                options: 0b00000000, // Disable encryption
            },
        };

        const frameResponse = Zcl.Frame.create(1, 1, true, undefined, 0, "response", 33, commissioningReply, {});

        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(2);
        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(ZSpec.GP_ENDPOINT);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(frameResponse));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(ZSpec.GP_ENDPOINT);

        const pairingData = {
            options: GreenPower.encodePairingOptions({
                appId: 0,
                addSink: true,
                removeGpd: false,
                communicationMode: 0b01,
                gpdFixed: false,
                gpdMacSeqNumCapabilities: true,
                securityLevel: 0,
                securityKeyType: 0,
                gpdSecurityFrameCounterPresent: false,
                gpdSecurityKeyPresent: false,
                assignedAliasPresent: false,
                groupcastRadiusPresent: false,
            }),
            srcID: 0x0046f4fe,
            sinkGroupID: 0x0b84,
            deviceID: 2,
        };
        const pairing = Zcl.Frame.create(1, 1, true, undefined, 1, "pairing", 33, pairingData, {});

        expect(mocksendZclFrameToAll.mock.calls[1][0]).toBe(ZSpec.GP_ENDPOINT);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[1][1])).toStrictEqual(deepClone(pairing));
        expect(mocksendZclFrameToAll.mock.calls[1][2]).toBe(ZSpec.GP_ENDPOINT);

        mocksendZclFrameToAll.mockClear();
        // Test green power response on endpoint object
        const payload = {
            options: 0b000,
            tempMaster: 0x1234,
            tempMasterTx: networkParameters.channel - 11,
            srcID: 0x0046f4fe,
            gpdCmd: 0xfe,
            gpdPayload: {
                commandID: 0xfe,
                buffer: Buffer.alloc(1),
            },
        };

        await device.getEndpoint(ZSpec.GP_ENDPOINT)!.commandResponse("greenPower", "response", payload, {
            srcEndpoint: ZSpec.GP_ENDPOINT,
            disableDefaultResponse: true,
        });

        const response = Zcl.Frame.create(1, 1, true, undefined, 2, "response", 33, payload, {});

        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(ZSpec.GP_ENDPOINT);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(response));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(ZSpec.GP_ENDPOINT);
    });

    it("Green power unicast", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const srcID = 0x017171f8;
        const gppDevice = controller.getDeviceByIeeeAddr("0x129")!;
        const data = {
            options: 0x800, // Proxy info present
            srcID,
            frameCounter: 248,
            commandID: 0xe0,
            payloadSize: 46,
            commandFrame: {
                deviceID: 0x02,
                options: 0xc5,
                extendedOptions: 0xf2,
                gpdClientClusters: Buffer.alloc(0),
                gpdServerClusters: Buffer.alloc(0),
                manufacturerID: 0,
                modelID: 0,
                numClientClusters: 0,
                numServerClusters: 0,
                securityKey: Buffer.from([0x21, 0x7f, 0x8c, 0xb2, 0x90, 0xd9, 0x90, 0x14, 0x15, 0xd0, 0x5c, 0xb1, 0x64, 0x7c, 0x44, 0x6c]),
                keyMic: 0xf80547fa,
                outgoingCounter: 0x000011f8,
                applicationInfo: 0x04,
                numGpdCommands: 17,
                gpdCommandIdList: Buffer.from([0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x22, 0x60, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68]),
                genericSwitchConfig: 0,
                currentContactStatus: 0,
            },
            gppNwkAddr: gppDevice.networkAddress,
            gppGpdLink: 0xd8,
        };

        const expectedFrame = Zcl.Frame.create(1, 0, true, undefined, 100, "commissioningNotification", 33, data, {});

        const buffer = Buffer.from([
            0x11, 0x64, 0x04, 0x00, 0x08, 0xf8, 0x71, 0x71, 0x01, 0xf8, 0x00, 0x00, 0x00, 0xe0, 0x2e, 0x02, 0xc5, 0xf2, 0x21, 0x7f, 0x8c, 0xb2, 0x90,
            0xd9, 0x90, 0x14, 0x15, 0xd0, 0x5c, 0xb1, 0x64, 0x7c, 0x44, 0x6c, 0xfa, 0x47, 0x05, 0xf8, 0xf8, 0x11, 0x00, 0x00, 0x04, 0x11, 0x10, 0x11,
            0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x22, 0x60, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x81, 0x00, 0xd8,
        ]);
        const receivedFrame = Zcl.Frame.fromBuffer(33, Zcl.Header.fromBuffer(buffer), buffer, {});

        expect(deepClone(receivedFrame)).toStrictEqual(deepClone(expectedFrame));
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(expectedFrame); // Mock because no Buffalo write for 0xe0 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: gppDevice.networkAddress,
            clusterID: expectedFrame.cluster.ID,
            data: expectedFrame.toBuffer(),
            header: expectedFrame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 0,
        });

        const dataPairing = {
            options: GreenPower.encodePairingOptions({
                appId: 0,
                addSink: true,
                removeGpd: false,
                communicationMode: 0b11,
                gpdFixed: true,
                gpdMacSeqNumCapabilities: true,
                securityLevel: 2,
                securityKeyType: 4,
                gpdSecurityFrameCounterPresent: true,
                gpdSecurityKeyPresent: true,
                assignedAliasPresent: false,
                groupcastRadiusPresent: false,
            }),
            srcID,
            sinkIEEEAddr: "0x0000012300000000",
            sinkNwkAddr: 0,
            deviceID: 2,
            frameCounter: 4600,
            gpdKey: Buffer.from([0x09, 0x3c, 0xed, 0x1d, 0xbf, 0x25, 0x63, 0xf9, 0x29, 0x5c, 0x0d, 0x3d, 0x9f, 0xc5, 0x76, 0xe1]),
        };
        const frameResponse = Zcl.Frame.create(1, 1, true, undefined, 9, "pairing", 33, dataPairing, {});

        expect(mocksendZclFrameToEndpoint).toHaveBeenLastCalledWith(
            gppDevice.ieeeAddr,
            gppDevice.networkAddress,
            ZSpec.GP_ENDPOINT,
            expect.any(Object),
            10000,
            false,
            false,
            ZSpec.GP_ENDPOINT,
        );
        expect(deepClone(mocksendZclFrameToEndpoint.mock.calls[mocksendZclFrameToEndpoint.mock.calls.length - 1][3])).toStrictEqual(
            deepClone(frameResponse),
        );

        // When joins again, shouldnt emit duplicate event
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(expectedFrame); // Mock because no Buffalo write for 0xe0 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: expectedFrame.cluster.ID,
            data: expectedFrame.toBuffer(),
            header: expectedFrame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 0,
        });

        expect(events.deviceJoined.length).toBe(2); // gpp + gpd
        expect(deepClone(events.deviceJoined[1])).toStrictEqual({
            device: {
                ID: 3,
                _events: {},
                _eventsCount: 0,
                _pendingRequestTimeout: 0,
                _skipDefaultResponse: false,
                _customClusters: {},
                _endpoints: [
                    {
                        ID: ZSpec.GP_ENDPOINT,
                        _binds: [],
                        _configuredReportings: [],
                        _events: {},
                        _eventsCount: 0,
                        clusters: {},
                        deviceIeeeAddress: "0x00000000017171f8",
                        deviceNetworkAddress: 0x71f8,
                        inputClusters: [],
                        meta: {},
                        outputClusters: [],
                        pendingRequests: {id: ZSpec.GP_ENDPOINT, deviceIeeeAddress: "0x00000000017171f8", sendInProgress: false},
                    },
                ],
                _ieeeAddr: "0x00000000017171f8",
                _interviewState: InterviewState.Successful,
                _lastSeen: Date.now(),
                _linkquality: 50,
                _networkAddress: 0x71f8,
                _type: "GreenPower",
                meta: {},
                _gpSecurityKey: [0x21, 0x7f, 0x8c, 0xb2, 0x90, 0xd9, 0x90, 0x14, 0x15, 0xd0, 0x5c, 0xb1, 0x64, 0x7c, 0x44, 0x6c],
            },
        });
        expect(controller.getDeviceByIeeeAddr("0x00000000017171f8")?.genBasic.modelId).toStrictEqual("GreenPower_2");
        expect(events.deviceInterview.length).toBe(3); // gpp[started] + gpp[successful] + gpd
        expect(deepClone(events.deviceInterview[2])).toStrictEqual({
            status: "successful",
            device: {
                ID: 3,
                _events: {},
                _eventsCount: 0,
                _pendingRequestTimeout: 0,
                _skipDefaultResponse: false,
                _customClusters: {},
                _endpoints: [],
                _ieeeAddr: "0x00000000017171f8",
                _interviewState: InterviewState.Successful,
                _networkAddress: 0x71f8,
                _type: "GreenPower",
                meta: {},
                _gpSecurityKey: [0x21, 0x7f, 0x8c, 0xb2, 0x90, 0xd9, 0x90, 0x14, 0x15, 0xd0, 0x5c, 0xb1, 0x64, 0x7c, 0x44, 0x6c],
            },
        });
        expect(deepClone(events.deviceInterviewRaw[2].device.genBasic)).toStrictEqual({
            modelId: "GreenPower_2",
            powerSource: Zcl.PowerSource.Unknown,
        });
        expect(controller.getDeviceByIeeeAddr("0x00000000017171f8")!.networkAddress).toBe(0x71f8);
        expect(events.message.length).toBe(2);

        // Green power device send message
        events.message = [];
        expect(events.message.length).toBe(0);
        const dataScene = {
            options: 0x5488,
            srcID,
            frameCounter: 4601,
            commandID: 0x13,
            payloadSize: 0,
            commandFrame: {},
            gppNwkAddr: 129,
            gppGpdLink: 0xd8,
        };
        const frameScene = Zcl.Frame.create(1, 0, true, undefined, 10, "notification", 33, dataScene, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: srcID & 0xffff,
            clusterID: frameScene.cluster.ID,
            data: frameScene.toBuffer(),
            header: frameScene.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 0,
        });

        expect(events.message.length).toBe(1);
        const expected = {
            type: "commandNotification",
            device: expect.any(Device),
            endpoint: expect.any(Endpoint),
            data: {
                options: 21640,
                srcID: 24211960,
                frameCounter: 4601,
                commandID: 19,
                payloadSize: 0,
                commandFrame: {},
                gppNwkAddr: 129,
                gppGpdLink: 216,
            },
            linkquality: 50,
            groupID: 0,
            cluster: "greenPower",
            meta: {
                zclTransactionSequenceNumber: 10,
                frameControl: {reservedBits: 0, frameType: 1, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                manufacturerCode: undefined,
                rawData: expect.any(Buffer),
            },
        };
        expect(events.message[0]).toStrictEqual(expected);

        // Remove green power device from network
        const removeCommand = {
            options: 0x002550,
            srcID,
        };
        const removeFrame = Zcl.Frame.create(1, 1, true, undefined, 11, "pairing", 33, removeCommand, {});

        events.message = [];
        const device = controller.getDeviceByIeeeAddr("0x00000000017171f8")!;
        await device.removeFromNetwork();
        expect(mocksendZclFrameToAll.mock.calls[0][0]).toBe(ZSpec.GP_ENDPOINT);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(removeFrame));
        expect(mocksendZclFrameToAll.mock.calls[0][2]).toBe(ZSpec.GP_ENDPOINT);
        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
        expect(controller.getDeviceByIeeeAddr("0x00000000017171f8")).toBeUndefined();

        expect(Device.byIeeeAddr("0x00000000017171f8")).toBeUndefined();
        expect(deepClone(Device.byIeeeAddr("0x00000000017171f8", true))).toStrictEqual({
            ID: 3,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _skipDefaultResponse: false,
            _customClusters: {},
            _endpoints: [
                {
                    ID: ZSpec.GP_ENDPOINT,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    clusters: {},
                    deviceIeeeAddress: "0x00000000017171f8",
                    deviceNetworkAddress: 0x71f8,
                    inputClusters: [],
                    meta: {},
                    outputClusters: [],
                    pendingRequests: {id: ZSpec.GP_ENDPOINT, deviceIeeeAddress: "0x00000000017171f8", sendInProgress: false},
                },
            ],
            _ieeeAddr: "0x00000000017171f8",
            _interviewState: InterviewState.Successful,
            _lastSeen: Date.now(),
            _linkquality: 50,
            _networkAddress: 0x71f8,
            _type: "GreenPower",
            meta: {},
            _gpSecurityKey: [0x21, 0x7f, 0x8c, 0xb2, 0x90, 0xd9, 0x90, 0x14, 0x15, 0xd0, 0x5c, 0xb1, 0x64, 0x7c, 0x44, 0x6c],
        });
        expect(Device.byIeeeAddr("0x00000000017171f8", true)?.genBasic.modelId).toStrictEqual("GreenPower_2");

        // Re-add device
        vi.spyOn(Zcl.Frame, "fromBuffer").mockReturnValueOnce(expectedFrame); // Mock because no Buffalo write for 0xe0 is implemented
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 129,
            clusterID: expectedFrame.cluster.ID,
            data: expectedFrame.toBuffer(),
            header: expectedFrame.header,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 50,
            groupID: 0,
        });

        expect(deepClone(Device.byIeeeAddr("0x00000000017171f8"))).toStrictEqual({
            ID: 3,
            _events: {},
            _eventsCount: 0,
            _pendingRequestTimeout: 0,
            _skipDefaultResponse: false,
            _customClusters: {},
            _endpoints: [
                {
                    ID: ZSpec.GP_ENDPOINT,
                    _binds: [],
                    _configuredReportings: [],
                    _events: {},
                    _eventsCount: 0,
                    clusters: {},
                    deviceIeeeAddress: "0x00000000017171f8",
                    deviceNetworkAddress: 0x71f8,
                    inputClusters: [],
                    meta: {},
                    outputClusters: [],
                    pendingRequests: {id: ZSpec.GP_ENDPOINT, deviceIeeeAddress: "0x00000000017171f8", sendInProgress: false},
                },
            ],
            _ieeeAddr: "0x00000000017171f8",
            _interviewState: InterviewState.Successful,
            _lastSeen: Date.now(),
            _linkquality: 50,
            _networkAddress: 0x71f8,
            _type: "GreenPower",
            meta: {},
            _gpSecurityKey: [0x21, 0x7f, 0x8c, 0xb2, 0x90, 0xd9, 0x90, 0x14, 0x15, 0xd0, 0x5c, 0xb1, 0x64, 0x7c, 0x44, 0x6c],
        });
        expect(Device.byIeeeAddr("0x00000000017171f8")?.genBasic.modelId).toStrictEqual("GreenPower_2");
    });

    it("Get input/ouptut clusters", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 172, ieeeAddr: "0x172"});
        const device = controller.getDeviceByIeeeAddr("0x172")!;
        const endpoint = device.getEndpoint(11)!;
        expect(endpoint.getInputClusters().map((c) => c.name)).toStrictEqual([
            "genBasic",
            "genIdentify",
            "genGroups",
            "genScenes",
            "genOnOff",
            "genLevelCtrl",
            "lightingColorCtrl",
            "62301",
        ]);
        expect(endpoint.getOutputClusters().map((c) => c.name)).toStrictEqual(["genDeviceTempCfg"]);
    });

    it("Report to endpoint custom attributes", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const options = {manufacturerCode: 0x100b, disableDefaultResponse: true, timeout: 12, defaultResponseTimeout: 16};
        await endpoint.report("genBasic", {49: {value: 0x000b, type: 0x19}}, options);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        const call = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(call[0]).toBe("0x129");
        expect(call[1]).toBe(129);
        expect(call[2]).toBe(1);
        expect(deepClone(call[3])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    4107,
                    9,
                    "report",
                    0,
                    [{attrId: 49, attrData: 11, dataType: 25}],
                    {},
                ),
            ),
        );
        expect(call[4]).toBe(12);
    });

    it("Report to endpoint with unknown string attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mocksendZclFrameToEndpoint.mockClear();
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        let error;
        try {
            await endpoint.report("genBasic", {UNKNOWN: {value: 0x000b, type: 0x19}});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Unknown attribute 'UNKNOWN', specify either an existing attribute or a number`));
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);
    });

    it("Report error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.report("genOnOff", {onOff: 1});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genOnOff.report({"onOff":1}, {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Write to device with pendingRequestTimeout > 0", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 174, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.pendingRequestTimeout = 10000;
        const endpoint = device.getEndpoint(1)!;
        const buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        const data = {
            wasBroadcast: false,
            address: "0x129",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        };
        // We need to wait for the data to be queued
        // @ts-expect-error private
        const origQueueRequest = endpoint.pendingRequests.queue;
        // @ts-expect-error private
        endpoint.pendingRequests.queue = (req) => {
            // @ts-expect-error private
            const f = origQueueRequest.call(endpoint.pendingRequests, req);
            vi.advanceTimersByTime(10);
            return f;
        };
        // @ts-expect-error private
        endpoint.pendingRequests.add(new Request(async () => {}, frame, 100));
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Dogs barking too hard"));
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);
        const nextTick = new Promise(process.nextTick);
        const result = endpoint.write("genOnOff", {onTime: 1}, {disableResponse: true});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);

        await nextTick;
        await mockAdapterEvents.zclPayload(data);
        await result;
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(2);
        expect(await result).toBe(undefined);
        await mockAdapterEvents.zclPayload(data);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(2);
    });

    it("Write to device with pendingRequestTimeout > 0, override default sendPolicy", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 174, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.pendingRequestTimeout = 10000;
        const endpoint = device.getEndpoint(1)!;

        // @ts-expect-error private
        endpoint.pendingRequests.add(
            // @ts-expect-error mock
            new Request(async () => {}, {}, 100),
        );
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Dogs barking too hard"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Cats barking too hard"));
        try {
            await endpoint.write("genOnOff", {onTime: 1}, {disableResponse: true, sendPolicy: "immediate"});
        } catch (error) {
            expect((error as Error).message).toStrictEqual(
                `ZCL command 0x129/1 genOnOff.write({"onTime":1}, {"timeout":10000,"disableResponse":true,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false,"sendPolicy":"immediate"}) failed (Dogs barking too hard)`,
            );
        }
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toStrictEqual(1);
    });

    it("Write to device with pendingRequestTimeout > 0, error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.checkinInterval = 10;
        const buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        const data = {
            wasBroadcast: false,
            address: "0x129",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        };
        expect(device.pendingRequestTimeout).toStrictEqual(10000);
        const endpoint = device.getEndpoint(1)!;
        // We need to wait for the data to be queued
        // @ts-expect-error private
        const origQueueRequest = endpoint.pendingRequests.queue;
        // @ts-expect-error private
        endpoint.pendingRequests.queue = (req) => {
            // @ts-expect-error private
            const f = origQueueRequest.call(endpoint.pendingRequests, req);
            vi.advanceTimersByTime(10);
            return f;
        };
        const origSendPendingRequests = endpoint.sendPendingRequests;
        endpoint.sendPendingRequests = async (fastpoll) => {
            const f = await origSendPendingRequests.call(endpoint, fastpoll);
            vi.advanceTimersByTime(10);
            return f;
        };
        // @ts-expect-error private
        endpoint.pendingRequests.add(
            new Request(
                async () => {},
                frame,
                100,
                undefined,
                undefined,
                () => {},
                () => {},
            ),
        );

        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Cats barking too hard"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Dogs barking too hard"));
        let nextTick = new Promise(process.nextTick);
        const result = endpoint.write("genOnOff", {onTime: 1}, {disableResponse: true});
        await nextTick;
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);

        nextTick = new Promise(process.nextTick);
        await mockAdapterEvents.zclPayload(data);
        await nextTick;
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(100000);
        let error;
        try {
            await mockAdapterEvents.zclPayload(data);
            await result;
        } catch (e) {
            error = e;
        }
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(2);
        expect((error as Error).message).toStrictEqual(
            `ZCL command 0x129/1 genOnOff.write({"onTime":1}, {"timeout":10000,"disableResponse":true,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (Dogs barking too hard)`,
        );
    });

    it("Write to device with pendingRequestTimeout > 0, replace queued messages", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        device.pendingRequestTimeout = 10000;
        const endpoint = device.getEndpoint(1)!;

        // We need to wait for the data to be queued, but not for the promise to resolve
        // @ts-expect-error private
        const origQueueRequest = endpoint.pendingRequests.queue;
        // @ts-expect-error private
        endpoint.pendingRequests.queue = (req) => {
            // @ts-expect-error private
            const f = origQueueRequest.call(endpoint.pendingRequests, req);
            vi.advanceTimersByTime(10);
            return f;
        };

        //add a request with empty data and a ZclFrame to the queue
        // @ts-expect-error private
        endpoint.pendingRequests.add(
            // @ts-expect-error mock
            new Request(async () => {}, {}, 100),
        );
        // Queue content:
        // 1. empty request
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Error one"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Error two"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Error three"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Error four"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Error five"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Error six"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Error seven"));
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Error eight"));
        mocksendZclFrameToEndpoint.mockImplementationOnce(async () => {});
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Dogs barking too hard"));

        const createResponse = (attrData: number) => {
            const frame = Zcl.Frame.create(
                0,
                1,
                true,
                undefined,
                10,
                "readRsp",
                "genOnOff",
                [{attrId: 16385, dataType: 33, attrData, status: 0}],
                {},
            );
            return {clusterID: frame.cluster.ID, header: frame.header, data: frame.toBuffer()};
        };
        mocksendZclFrameToEndpoint.mockResolvedValueOnce(createResponse(1));
        mocksendZclFrameToEndpoint.mockResolvedValueOnce(createResponse(2));
        mocksendZclFrameToEndpoint.mockResolvedValueOnce(createResponse(3));
        mocksendZclFrameToEndpoint.mockResolvedValueOnce(createResponse(4));

        let result1;
        // biome-ignore lint/correctness/noUnusedVariables: test
        let result2;
        const nextTick = new Promise(process.nextTick);
        endpoint.write("genOnOff", {onTime: 0, startUpOnOff: 0}, {disableResponse: true});
        await nextTick;
        // Queue content:
        // 1. empty
        // 2. ZCL write 'genOnOff' {onTime: 0, startUpOnOff: 0}
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toStrictEqual(2);
        result1 = endpoint.write("genOnOff", {onTime: 0}, {disableResponse: true});
        await new Promise(process.nextTick);
        // Queue content:
        // 1. empty
        // 2. ZCL write 'genOnOff' {startUpOnOff: 0}
        // 3. ZCL write 'genOnOff' {onTime: 0} --> result1
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toStrictEqual(3);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(2);

        //add another non-ZCL request, should go directly to queue without errors
        // @ts-expect-error private
        endpoint.sendRequest(
            // @ts-expect-error mock
            5,
            [],
            () => {
                throw new Error("1");
            },
        );
        await new Promise(process.nextTick);
        // Queue content:
        // 1. empty
        // 2. ZCL write 'genOnOff' {startUpOnOff: 0}
        // 3. ZCL write 'genOnOff' {onTime: 0}
        // 4. add 1
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toStrictEqual(4);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(2);

        try {
            // Add the same ZCL request with different payload again, the first one should be rejected and removed from the queue
            result2 = endpoint.write("genOnOff", {onTime: 1}, {disableResponse: true});
            await expect(await result1).rejects.toBe("asas");
        } catch {
            // Queue content:
            // 1. empty
            // 2. ZCL write 'genOnOff' {startUpOnOff: 0}
            // 3. add 1
            // 4. ZCL write 'genOnOff' {onTime: 1} --> result2
            // @ts-expect-error private
            expect(endpoint.pendingRequests.size).toStrictEqual(4);
        }
        // Now add the same ZCL request with same payload again. The previous one should *not* be rejected but removed from the queue
        endpoint.write("genOnOff", {onTime: 1}, {disableResponse: true});
        await new Promise(process.nextTick);
        // Queue content:
        // 1. empty
        // 2. ZCL write 'genOnOff' {startUpOnOff: 0}
        // 3. add 1
        // 4. ZCL write 'genOnOff' {onTime: 1} --> result2, result3
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toStrictEqual(4);

        // writeUndiv request should not be divided, so both should go to the queue
        endpoint.write("genOnOff", {onTime: 0, startUpOnOff: 0}, {disableResponse: true, writeUndiv: true});
        await new Promise(process.nextTick);
        endpoint.write("genOnOff", {startUpOnOff: 1}, {disableResponse: true, writeUndiv: true});
        await new Promise(process.nextTick);
        // Queue content:
        // 1. empty
        // 2. ZCL write 'genOnOff' {startUpOnOff: 0}
        // 3. add 1
        // 4. ZCL write 'genOnOff' {onTime: 1} --> result2, result3
        // 5. ZCL writeUndiv 'genOnOff' {onTime: 0, startUpOnOff: 0}
        // 6. ZCL writeUndiv 'genOnOff' {startUpOnOff: 1}
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toStrictEqual(6);

        // read requests should be combined to one
        const result4 = endpoint.read("genOnOff", ["onTime"], {disableResponse: false});
        await new Promise(process.nextTick);
        const result5 = endpoint.read("genOnOff", ["onTime"], {disableResponse: false});
        await new Promise(process.nextTick);
        // Queue content:
        // 1. empty
        // 2. ZCL write 'genOnOff' {startUpOnOff: 0}
        // 3. add 1
        // 4. ZCL write 'genOnOff' {onTime: 1} --> result2, result3
        // 5. ZCL writeUndiv 'genOnOff' {onTime: 0, startUpOnOff: 0}
        // 6. ZCL writeUndiv 'genOnOff' {startUpOnOff: 1}
        // 7. ZCL read 'genOnOff' --> result4, result5
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toStrictEqual(7);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(8);

        // Implicit checkin, there are 5 ZclFrames and 2 other requests left in the queue:
        const buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x129",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        await expect(result4).resolves.toStrictEqual({onTime: 3});
        await expect(result5).resolves.toStrictEqual({onTime: 3});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(13);
        expect(mocksendZclFrameToEndpoint.mock.calls[8][3].payload).toStrictEqual([{attrData: 0, attrId: 16387, dataType: 48}]);
        expect(mocksendZclFrameToEndpoint.mock.calls[9][3].payload).toStrictEqual([{attrData: 1, attrId: 16385, dataType: 33}]);
        expect(mocksendZclFrameToEndpoint.mock.calls[10][3].payload).toStrictEqual([
            {attrData: 0, attrId: 16385, dataType: 33},
            {attrData: 0, attrId: 16387, dataType: 48},
        ]);
        expect(mocksendZclFrameToEndpoint.mock.calls[11][3].payload).toStrictEqual([{attrData: 1, attrId: 16387, dataType: 48}]);
    });

    it("Write to device with pendingRequestTimeout > 0, discard messages after expiration", async () => {
        const updatedMockedDate = new Date(mockedDate);
        updatedMockedDate.setSeconds(updatedMockedDate.getSeconds() + 1000);
        vi.setSystemTime(updatedMockedDate);
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 174, ieeeAddr: "0x174"});
        const device = controller.getDeviceByIeeeAddr("0x174")!;
        MOCK_DEVICES[174]!.attributes![1].checkinInterval = 3996; //999 seconds

        await device.interview();
        const endpoint = device.getEndpoint(1)!;
        expect(device.checkinInterval).toBe(999);
        expect(device.pendingRequestTimeout).toBe(999000);
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("Dogs barking too hard"));

        // We need to send the data after it's been queued, but before we await
        // the promise. Hijacking queueRequest seems easiest.
        // @ts-expect-error private
        const origQueueRequest = endpoint.pendingRequests.queue;
        // @ts-expect-error private
        endpoint.pendingRequests.queue = async (req) => {
            // @ts-expect-error private
            const f = origQueueRequest.call(endpoint.pendingRequests, req);
            const buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
            const frame = Zcl.Frame.fromBuffer(
                Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID,
                Zcl.Header.fromBuffer(buffer),
                buffer,
                {},
            );
            await mockAdapterEvents.zclPayload({
                wasBroadcast: false,
                address: 174,
                clusterID: frame.cluster.ID,
                data: frame.toBuffer(),
                header: frame.header,
                endpoint: 1,
                linkquality: 50,
                groupID: 1,
            });
            return f;
        };

        // @ts-expect-error private
        endpoint.pendingRequests.add(
            // @ts-expect-error mock
            new Request(async () => {}, {}, 100),
        );
        const result = endpoint.write("genOnOff", {onTime: 10}, {disableResponse: true});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);

        updatedMockedDate.setSeconds(updatedMockedDate.getSeconds() + 1001000);
        vi.setSystemTime(updatedMockedDate);
        try {
            await result;
        } catch {
            /* empty */
        }
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toBe(0);
    });

    it("Implicit checkin while send already in progress", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 174, ieeeAddr: "0x174"});
        const device = controller.getDeviceByIeeeAddr("0x174")!;
        await device.interview();
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockImplementationOnce(() => {
            throw new Error("dogs barking too hard");
        });
        const endpoint = device.getEndpoint(1)!;
        // @ts-expect-error private
        const origQueueRequest = endpoint.pendingRequests.queue;
        // @ts-expect-error private
        endpoint.pendingRequests.queue = (req) => {
            // @ts-expect-error private
            const f = origQueueRequest.call(endpoint.pendingRequests, req);
            vi.advanceTimersByTime(10);
            return f;
        };
        // @ts-expect-error private
        endpoint.pendingRequests.add(
            new Request(
                async () => {
                    await endpoint.sendPendingRequests(false);
                },
                // @ts-expect-error mock
                {},
                100,
            ),
        );
        const nextTick = new Promise(process.nextTick);
        const result = endpoint.write("genOnOff", {onTime: 10}, {disableResponse: true});
        await nextTick;
        await endpoint.sendPendingRequests(false);
        await result;
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(2);
        // @ts-expect-error private
        expect(endpoint.pendingRequests.size).toBe(0);
    });

    it("Write to device with pendingRequestTimeout > 0, send bulk messages", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 174, ieeeAddr: "0x174"});
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x174")!;
        await device.interview();
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockClear();
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);

        // onZclData is called via mockAdapterEvents, but we need to wait until it has finished
        const origOnZclData = device.onZclData;
        device.onZclData = (a, b, c) => {
            const f = origOnZclData.call(device, a, b, c);
            vi.advanceTimersByTime(10);
            return f;
        };
        const nextTick = new Promise(process.nextTick);

        const result = endpoint.write("genOnOff", {onTime: 1}, {disableResponse: true, sendPolicy: "bulk"});
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);

        const buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
        let frame = Zcl.Frame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing", undefined, {}).ID, Zcl.Header.fromBuffer(buffer), buffer, {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 174,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(0);

        frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            1,
            1,
            "checkin",
            Zcl.Utils.getCluster("genPollCtrl", undefined, {}).ID,
            {},
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 174,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 52,
            groupID: undefined,
        });

        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(3);

        const checkinrsp = mocksendZclFrameToEndpoint.mock.calls[0];
        expect(checkinrsp[0]).toBe("0x174");
        expect(checkinrsp[1]).toBe(174);
        expect(checkinrsp[2]).toBe(1);
        expect(checkinrsp[3].cluster.name).toBe("genPollCtrl");
        expect(checkinrsp[3].command.name).toBe("checkinRsp");
        expect(checkinrsp[3].payload).toStrictEqual({startFastPolling: 1, fastPollTimeout: 0});

        expect(await result).toBe(undefined);

        const cmd = mocksendZclFrameToEndpoint.mock.calls[1];
        expect(cmd[0]).toBe("0x174");
        expect(cmd[1]).toBe(174);
        expect(cmd[2]).toBe(1);
        expect(cmd[3].cluster.name).toBe("genOnOff");

        await nextTick;
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(3);
        const fastpollstop = mocksendZclFrameToEndpoint.mock.calls[2];
        expect(fastpollstop[0]).toBe("0x174");
        expect(fastpollstop[1]).toBe(174);
        expect(fastpollstop[2]).toBe(1);
        expect(fastpollstop[3].cluster.name).toBe("genPollCtrl");
        expect(fastpollstop[3].command.name).toBe("fastPollStop");
        expect(fastpollstop[3].payload).toStrictEqual({});
    });

    it("Handle retransmitted Xiaomi messages", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 175, ieeeAddr: "0x175"});
        await mockAdapterEvents.deviceJoined({networkAddress: 171, ieeeAddr: "0x171"});

        const frame = Zcl.Frame.create(0, 0, true, undefined, 40, 0, 1, [{attrId: 0}, {attrId: 9999}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: 175,
            // Attrid 9999 does not exist in ZCL
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 19,
            groupID: 171,
        });

        const expected = {
            type: "read",
            device: expect.objectContaining({_ieeeAddr: "0x171"}),
            endpoint: expect.objectContaining({deviceIeeeAddress: "0x171"}),
            data: ["mainsVoltage", 9999],
            linkquality: 19,
            groupID: 171,
            cluster: "genPowerCfg",
            meta: {
                zclTransactionSequenceNumber: 40,
                frameControl: {reservedBits: 0, frameType: 0, direction: 0, disableDefaultResponse: true, manufacturerSpecific: false},
                manufacturerCode: undefined,
                rawData: expect.any(Buffer),
            },
        };
        expect(events.message.length).toBe(1);
        expect(events.message[0]).toStrictEqual(expected);
    });

    it("Shouldnt throw error on coordinatorCheck when adapter doesnt support backups", async () => {
        mockAdapterSupportsBackup.mockReturnValue(false);
        await controller.start();
        await expect(controller.coordinatorCheck()).rejects.toHaveProperty(
            "message",
            `Coordinator does not coordinator check because it doesn't support backups`,
        );
    });

    it("Should do a coordinator check", async () => {
        mockAdapterSupportsBackup.mockReturnValue(true);
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const result = await controller.coordinatorCheck();
        expect(result.missingRouters.length).toBe(1);
        expect(result.missingRouters[0].ieeeAddr).toBe("0x129");
    });

    // ZCLFrame with manufacturer specific flag and manufacturer code defined, to generic device
    // ZCLFrameConverter should not modify specific frames!
    it("Should resolve manufacturer specific cluster attribute names on specific ZCL frames: generic target device", async () => {
        const buffer = Buffer.from([28, 33, 16, 13, 1, 2, 240, 0, 48, 4]);
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});

        const frame = Zcl.Frame.fromBuffer(
            Zcl.Utils.getCluster("closuresWindowCovering", undefined, {}).ID,
            Zcl.Header.fromBuffer(buffer),
            buffer,
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x129",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 0,
        });
        expect(events.message.length).toBe(1);
        expect(events.message[0].data).toMatchObject({calibrationMode: 4});
        expect(events.message[0].data).not.toMatchObject({tuyaMotorReversal: 4});
    });

    // ZCLFrame with manufacturer specific flag and manufacturer code defined, to specific device
    // ZCLFrameConverter should not modify specific frames!
    it("Should resolve manufacturer specific cluster attribute names on specific ZCL frames: specific target device", async () => {
        const buffer = Buffer.from([28, 33, 16, 13, 1, 2, 240, 0, 48, 4]);
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 177, ieeeAddr: "0x177"});
        const frame = Zcl.Frame.fromBuffer(
            Zcl.Utils.getCluster("closuresWindowCovering", undefined, {}).ID,
            Zcl.Header.fromBuffer(buffer),
            buffer,
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x177",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 0,
        });
        expect(events.message.length).toBe(1);
        expect(events.message[0].data).toMatchObject({calibrationMode: 4});
        expect(events.message[0].data).not.toMatchObject({tuyaMotorReversal: 4});
    });

    // ZCLFrame without manufacturer specific flag or manufacturer code set, to generic device
    it("Should resolve generic cluster attribute names on generic ZCL frames: generic target device", async () => {
        const buffer = Buffer.from([24, 242, 10, 2, 240, 48, 4]);
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const frame = Zcl.Frame.fromBuffer(
            Zcl.Utils.getCluster("closuresWindowCovering", undefined, {}).ID,
            Zcl.Header.fromBuffer(buffer),
            buffer,
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x129",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 0,
        });
        expect(events.message.length).toBe(1);
        expect(events.message[0].data).toMatchObject({tuyaMotorReversal: 4});
        expect(events.message[0].data).not.toMatchObject({calibrationMode: 4});
    });

    // ZCLFrame without manufacturer specific flag set or manufacturer code set, to specific device (Legrand only)
    it("Should resolve manufacturer specific cluster attribute names on generic ZCL frames: Legrand target device", async () => {
        const buffer = Buffer.from([24, 242, 10, 2, 240, 48, 4]);
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 177, ieeeAddr: "0x177"});
        const frame = Zcl.Frame.fromBuffer(
            Zcl.Utils.getCluster("closuresWindowCovering", undefined, {}).ID,
            Zcl.Header.fromBuffer(buffer),
            buffer,
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x177",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 0,
        });
        expect(events.message.length).toBe(1);
        expect(events.message[0].data).toMatchObject({calibrationMode: 4});
        expect(events.message[0].data).not.toMatchObject({tuyaMotorReversal: 4});
    });

    it("zclCommand", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);

        await endpoint.zclCommand("genOnOff", "discover", {startAttrId: 1, maxAttrIds: 255});
    });

    it("zclCommand with cluster/command objects", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const cluster = Zcl.Utils.getCluster("genOnOff", undefined, {});
        const command = Zcl.Utils.getGlobalCommand("discover");
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        mocksendZclFrameToEndpoint.mockReturnValueOnce(null);

        await endpoint.zclCommand(cluster, command, {startAttrId: 1, maxAttrIds: 255});
    });

    it("zclCommand with error", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        console.log(endpoint);
        mocksendZclFrameToEndpoint.mockRejectedValueOnce(new Error("timeout occurred"));
        let error;
        try {
            await endpoint.zclCommand("genOnOff", "discover", {startAttrId: 1, maxAttrIds: 255});
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(
            new Error(
                `ZCL command 0x129/1 genOnOff.discover({"startAttrId":1,"maxAttrIds":255}, {"timeout":10000,"disableResponse":false,"disableRecovery":false,"disableDefaultResponse":true,"direction":0,"reservedBits":0,"writeUndiv":false}) failed (timeout occurred)`,
            ),
        );
    });

    it("Interview on coordinator", async () => {
        await controller.start();
        mockAdapterSendZdo.mockClear();
        const device = controller.getDeviceByNetworkAddress(ZSpec.COORDINATOR_ADDRESS)!;
        const deviceNodeDescSpy = vi.spyOn(device, "updateNodeDescriptor");

        await device.interview(true);

        expect(deviceNodeDescSpy).toHaveBeenCalledTimes(1);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(4); // nodeDesc + activeEp + simpleDesc x2
    });

    it("Device node descriptor fails", async () => {
        await controller.start();
        mockAdapterSendZdo.mockClear();
        const device = controller.getDeviceByNetworkAddress(ZSpec.COORDINATOR_ADDRESS)!;
        sendZdoResponseStatus = Zdo.Status.INSUFFICIENT_SPACE;

        await expect(device.updateNodeDescriptor()).rejects.toThrow(`Status 'INSUFFICIENT_SPACE'`);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
    });

    it("Device active endpoints fails", async () => {
        await controller.start();
        mockAdapterSendZdo.mockClear();
        const device = controller.getDeviceByNetworkAddress(ZSpec.COORDINATOR_ADDRESS)!;
        sendZdoResponseStatus = Zdo.Status.INSUFFICIENT_SPACE;

        await expect(device.updateActiveEndpoints()).rejects.toThrow(`Status 'INSUFFICIENT_SPACE'`);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
    });

    it("Endpoint simple descriptor fails", async () => {
        await controller.start();
        mockAdapterSendZdo.mockClear();
        const device = controller.getDeviceByNetworkAddress(ZSpec.COORDINATOR_ADDRESS)!;
        const endpoint = device.getEndpoint(1)!;
        sendZdoResponseStatus = Zdo.Status.INSUFFICIENT_SPACE;

        await expect(endpoint.updateSimpleDescriptor()).rejects.toThrow(`Status 'INSUFFICIENT_SPACE'`);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
    });

    it("Node Descriptor on R21 device", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 162, ieeeAddr: "0x162"});

        expect(mockLogger.info).toHaveBeenCalledWith(
            `Device '0x162' is only compliant to revision '21' of the Zigbee specification (current revision: ${ZSpec.ZIGBEE_REVISION}).`,
            "zh:controller:device",
        );
    });

    it("Node Descriptor on R pre-21 device", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 161, ieeeAddr: "0x161"});

        expect(mockLogger.info).toHaveBeenCalledWith(
            `Device '0x161' is only compliant to revision 'pre-21' of the Zigbee specification (current revision: ${ZSpec.ZIGBEE_REVISION}).`,
            "zh:controller:device",
        );
    });

    it("Device requests network address - unchanged", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mockAdapterSendZdo.mockClear();
        const device = controller.getDeviceByNetworkAddress(129)!;
        expect(device.ieeeAddr).toStrictEqual("0x129");

        mockAdapterSendZdo.mockImplementationOnce(async () => {
            const zdoResponse = [
                Zdo.Status.SUCCESS,
                {
                    eui64: "0x129",
                    nwkAddress: 129,
                    startIndex: 0,
                    assocDevList: [],
                } as NetworkAddressResponse,
            ];

            await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, zdoResponse);
            return zdoResponse;
        });

        await device.requestNetworkAddress();

        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, "0x129", false, 0);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith(
            "0x129",
            ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE,
            Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            zdoPayload,
            true,
        );

        expect(controller.getDeviceByIeeeAddr("0x129")!.networkAddress).toBe(129);
    });

    it("Device requests network address - changed", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        mockAdapterSendZdo.mockClear();
        const device = controller.getDeviceByNetworkAddress(129)!;
        expect(device.ieeeAddr).toStrictEqual("0x129");

        mockAdapterSendZdo.mockImplementationOnce(async () => {
            const zdoResponse = [
                Zdo.Status.SUCCESS,
                {
                    eui64: "0x129",
                    nwkAddress: 9999,
                    startIndex: 0,
                    assocDevList: [],
                } as NetworkAddressResponse,
            ];

            await mockAdapterEvents.zdoResponse(Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, zdoResponse);
            return zdoResponse;
        });

        await device.requestNetworkAddress();

        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, "0x129", false, 0);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith(
            "0x129",
            ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE,
            Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            zdoPayload,
            true,
        );

        expect(controller.getDeviceByIeeeAddr("0x129")!.networkAddress).toBe(9999);
        expect(controller.getDeviceByIeeeAddr("0x129")!.getEndpoint(1)!.deviceNetworkAddress).toBe(9999);
        expect(controller.getDeviceByNetworkAddress(129)).toBeUndefined();
        expect(controller.getDeviceByNetworkAddress(9999)!.ieeeAddr).toStrictEqual("0x129");
    });

    it("Device remove from network fails", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        sendZdoResponseStatus = Zdo.Status.INVALID_INDEX;

        await expect(device.removeFromNetwork()).rejects.toThrow(`Status 'INVALID_INDEX'`);

        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.LEAVE_REQUEST, "0x140", Zdo.LeaveRequestFlags.WITHOUT_REJOIN);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x140", 140, Zdo.ClusterId.LEAVE_REQUEST, zdoPayload, false);
        expect(controller.getDeviceByIeeeAddr("0x140")).toBeDefined();
    });

    it("Device LQI table fails", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        sendZdoResponseStatus = Zdo.Status.INVALID_INDEX;

        await expect(device.lqi()).rejects.toThrow(`Status 'INVALID_INDEX'`);

        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.LQI_TABLE_REQUEST, 0);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x140", 140, Zdo.ClusterId.LQI_TABLE_REQUEST, zdoPayload, false);
        expect(controller.getDeviceByIeeeAddr("0x140")).toBeDefined();
    });

    it("Device routing table fails", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        sendZdoResponseStatus = Zdo.Status.INVALID_INDEX;

        await expect(device.routingTable()).rejects.toThrow(`Status 'INVALID_INDEX'`);

        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.ROUTING_TABLE_REQUEST, 0);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x140", 140, Zdo.ClusterId.ROUTING_TABLE_REQUEST, zdoPayload, false);
        expect(controller.getDeviceByIeeeAddr("0x140")).toBeDefined();
    });

    it("Device binding table fails", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        sendZdoResponseStatus = Zdo.Status.INVALID_INDEX;

        await expect(device.bindingTable()).rejects.toThrow(`Status 'INVALID_INDEX'`);

        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.BINDING_TABLE_REQUEST, 0);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x140", 140, Zdo.ClusterId.BINDING_TABLE_REQUEST, zdoPayload, false);
        expect(controller.getDeviceByIeeeAddr("0x140")).toBeDefined();
    });

    it("Device clear all bindings fails", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        sendZdoResponseStatus = Zdo.Status.INV_REQUESTTYPE;

        await expect(device.clearAllBindings(["0xffffffffffffffff"])).rejects.toThrow(`Status 'INV_REQUESTTYPE'`);

        const zdoPayload = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.CLEAR_ALL_BINDINGS_REQUEST, {eui64List: ["0xffffffffffffffff"]});
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0x140", 140, Zdo.ClusterId.CLEAR_ALL_BINDINGS_REQUEST, zdoPayload, false);
        expect(controller.getDeviceByIeeeAddr("0x140")).toBeDefined();
    });

    it("Device LQI table with more than 1 request", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        mockAdapterSendZdo
            .mockImplementationOnce(() => {
                return [
                    Zdo.Status.SUCCESS,
                    {
                        neighborTableEntries: 3,
                        startIndex: 0,
                        entryList: [
                            {...LQI_TABLE_ENTRY_DEFAULTS, eui64: "0x160", nwkAddress: 160, lqi: 20, relationship: 2, depth: 5},
                            {...LQI_TABLE_ENTRY_DEFAULTS, eui64: "0x170", nwkAddress: 170, lqi: 21, relationship: 4, depth: 8},
                        ],
                    },
                ];
            })
            .mockImplementationOnce(() => {
                return [
                    Zdo.Status.SUCCESS,
                    {
                        neighborTableEntries: 3,
                        startIndex: 2,
                        entryList: [{...LQI_TABLE_ENTRY_DEFAULTS, eui64: "0x180", nwkAddress: 180, lqi: 200, relationship: 4, depth: 2}],
                    },
                ];
            });

        const result = await device.lqi();
        expect(result).toStrictEqual([
            {...LQI_TABLE_ENTRY_DEFAULTS, eui64: "0x160", nwkAddress: 160, lqi: 20, relationship: 2, depth: 5},
            {...LQI_TABLE_ENTRY_DEFAULTS, eui64: "0x170", nwkAddress: 170, lqi: 21, relationship: 4, depth: 8},
            {...LQI_TABLE_ENTRY_DEFAULTS, eui64: "0x180", nwkAddress: 180, lqi: 200, relationship: 4, depth: 2},
        ]);
    });

    it("Device routing table with more than 1 request", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        mockAdapterSendZdo
            .mockImplementationOnce(() => {
                return [
                    Zdo.Status.SUCCESS,
                    {
                        routingTableEntries: 3,
                        startIndex: 0,
                        entryList: [
                            {...ROUTING_TABLE_ENTRY_DEFAULTS, destinationAddress: 120, status: "ACTIVE", nextHopAddress: 1},
                            {...ROUTING_TABLE_ENTRY_DEFAULTS, destinationAddress: 130, status: "DISCOVERY_FAILED", nextHopAddress: 2},
                        ],
                    },
                ];
            })
            .mockImplementationOnce(() => {
                return [
                    Zdo.Status.SUCCESS,
                    {
                        routingTableEntries: 3,
                        startIndex: 2,
                        entryList: [{...ROUTING_TABLE_ENTRY_DEFAULTS, destinationAddress: 140, status: "INACTIVE", nextHopAddress: 3}],
                    },
                ];
            });

        const result = await device.routingTable();
        expect(result).toStrictEqual([
            {...ROUTING_TABLE_ENTRY_DEFAULTS, destinationAddress: 120, status: "ACTIVE", nextHopAddress: 1},
            {...ROUTING_TABLE_ENTRY_DEFAULTS, destinationAddress: 130, status: "DISCOVERY_FAILED", nextHopAddress: 2},
            {...ROUTING_TABLE_ENTRY_DEFAULTS, destinationAddress: 140, status: "INACTIVE", nextHopAddress: 3},
        ]);
    });

    it("Device binding table with more than 1 request", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 140, ieeeAddr: "0x140"});
        const device = controller.getDeviceByIeeeAddr("0x140")!;
        mockAdapterSendZdo
            .mockImplementationOnce(() => {
                return [
                    Zdo.Status.SUCCESS,
                    {
                        bindingTableEntries: 3,
                        startIndex: 0,
                        entryList: [
                            {
                                sourceEui64: "0xf1f2f3f5f6f7f8",
                                sourceEndpoint: 1,
                                clusterId: Zcl.Clusters.genBasic.ID,
                                destAddrMode: 0x03,
                                dest: "0xa1a2a3a4a5a6a7a8",
                                destEndpoint: 2,
                            },
                            {
                                sourceEui64: "0xe1e2e3e5e6e7e8",
                                sourceEndpoint: 3,
                                clusterId: Zcl.Clusters.genAlarms.ID,
                                destAddrMode: 0x01,
                                dest: 0x1234,
                            },
                        ],
                    },
                ];
            })
            .mockImplementationOnce(() => {
                return [
                    Zdo.Status.SUCCESS,
                    {
                        bindingTableEntries: 3,
                        startIndex: 2,
                        entryList: [
                            {
                                sourceEui64: "0xc1c2c3c5c6c7c8",
                                sourceEndpoint: 2,
                                clusterId: Zcl.Clusters.genLevelCtrl.ID,
                                destAddrMode: 0x03,
                                dest: "0xa1a2a3a4a5a6a7a8",
                                destEndpoint: 3,
                            },
                        ],
                    },
                ];
            });

        const result = await device.bindingTable();
        expect(result).toStrictEqual([
            {
                sourceEui64: "0xf1f2f3f5f6f7f8",
                sourceEndpoint: 1,
                clusterId: Zcl.Clusters.genBasic.ID,
                destAddrMode: 0x03,
                dest: "0xa1a2a3a4a5a6a7a8",
                destEndpoint: 2,
            },
            {
                sourceEui64: "0xe1e2e3e5e6e7e8",
                sourceEndpoint: 3,
                clusterId: Zcl.Clusters.genAlarms.ID,
                destAddrMode: 0x01,
                dest: 0x1234,
            },
            {
                sourceEui64: "0xc1c2c3c5c6c7c8",
                sourceEndpoint: 2,
                clusterId: Zcl.Clusters.genLevelCtrl.ID,
                destAddrMode: 0x03,
                dest: "0xa1a2a3a4a5a6a7a8",
                destEndpoint: 3,
            },
        ]);
    });

    it("Touchlink stops during stop", async () => {
        await controller.start();
        controller.touchlink.lock(true);
        await controller.stop();

        expect(mockRestoreChannelInterPAN).toHaveBeenCalledTimes(1);
    });

    it("Touchlink fails to stop during stop", async () => {
        await controller.start();
        vi.spyOn(controller.touchlink, "stop").mockRejectedValueOnce(new Error("timeout"));
        await controller.stop();

        expect(mockLogger.error).toHaveBeenCalledWith("Failed to stop Touchlink: Error: timeout", "zh:controller");
    });

    it("Adapter permitJoin fails during stop", async () => {
        await controller.start();
        mockAdapterPermitJoin.mockRejectedValueOnce(new Error("timeout"));
        await controller.stop();

        expect(mockLogger.error).toHaveBeenCalledWith("Failed to disable join on stop: Error: timeout", "zh:controller");
    });

    it("Adapter stop fails after adapter disconnected", async () => {
        await controller.start();
        mockAdapterStop.mockRejectedValueOnce(new Error("timeout"));
        await mockAdapterEvents.disconnected();

        expect(mockLogger.error).toHaveBeenCalledWith("Failed to stop adapter on disconnect: Error: timeout", "zh:controller");
    });

    it("Device network address changed while Z2M was offline, received no notification on start", async () => {
        const oldNwkAddress = 40369;
        const newNwkAddress = 12345;
        const database = `
        {"id":1,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":0,"epList":[11,6,5,4,3,2,1],"endpoints":{"1":{"profId":260,"epId":1,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"2":{"profId":257,"epId":2,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"3":{"profId":261,"epId":3,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"4":{"profId":263,"epId":4,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"5":{"profId":264,"epId":5,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"6":{"profId":265,"epId":6,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"11":{"profId":260,"epId":11,"devId":1024,"inClusterList":[],"meta":{},"outClusterList":[1280],"clusters":{}}},"interviewCompleted":false,"meta":{},"_id":"aM341ldunExFmJ3u"}
        {"id":3,"type":"Router","ieeeAddr":"0x000b57fffec6a5b2","nwkAddr":${oldNwkAddress},"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"meta":{},"outClusterList":[5,25,32,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"reporting":1},"_id":"pagvP2f9Bbj3o9TM"}
        `;
        fs.writeFileSync(options.databasePath, database);
        await controller.start();
        events.lastSeenChanged = [];
        events.deviceNetworkAddressChanged = [];

        const device = controller.getDeviceByIeeeAddr("0x000b57fffec6a5b2")!;
        expect(device.networkAddress).toStrictEqual(oldNwkAddress);

        mockAdapterSendZdo.mockImplementationOnce(async () => {
            const zdoResponse = [
                Zdo.Status.SUCCESS,
                {
                    eui64: "0x000b57fffec6a5b2",
                    nwkAddress: newNwkAddress,
                    startIndex: 0,
                    assocDevList: [],
                } as IEEEAddressResponse,
            ];

            await mockAdapterEvents.zdoResponse(Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, zdoResponse);
            return zdoResponse;
        });

        const frame = Zcl.Frame.create(0, 1, true, undefined, 10, "readRsp", 0, [{attrId: 5, status: 0, dataType: 66, attrData: "new.model.id"}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: newNwkAddress,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(device.networkAddress).toStrictEqual(newNwkAddress);
        expect(device.modelID).toBe("new.model.id");
        expect(events.lastSeenChanged.length).toBe(2); // zdoResponse + zclPayload
        expect(events.lastSeenChanged[0].device.networkAddress).toBe(newNwkAddress);
        expect(events.deviceNetworkAddressChanged.length).toBe(1);
        expect(events.deviceNetworkAddressChanged[0].device.networkAddress).toBe(newNwkAddress);
    });

    it("Device network address changed while Z2M was running, received no notification", async () => {
        const oldNwkAddress = 40369;
        const newNwkAddress = 12345;
        const database = `
        {"id":1,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":0,"epList":[11,6,5,4,3,2,1],"endpoints":{"1":{"profId":260,"epId":1,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"2":{"profId":257,"epId":2,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"3":{"profId":261,"epId":3,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"4":{"profId":263,"epId":4,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"5":{"profId":264,"epId":5,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"6":{"profId":265,"epId":6,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"11":{"profId":260,"epId":11,"devId":1024,"inClusterList":[],"meta":{},"outClusterList":[1280],"clusters":{}}},"interviewCompleted":false,"meta":{},"_id":"aM341ldunExFmJ3u"}
        {"id":4,"type":"EndDevice","ieeeAddr":"0x0017880104e45517","lastSeen":123,"nwkAddr":${oldNwkAddress},"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"meta":{},"outClusterList":[0,3,4,6,8,5],"binds":[{"type":"endpoint","endpointID":1,"deviceIeeeAddr":"0x000b57fffec6a5b2"}],"configuredReportings":[{"cluster":1,"attrId":0,"minRepIntval":1,"maxRepIntval":20,"repChange":2}],"clusters":{"genBasic":{"dir":{"value":3},"attrs":{"modelId":"RWL021"}}}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,64512],"meta":{},"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z"}
        `;
        fs.writeFileSync(options.databasePath, database);
        await controller.start();
        events.lastSeenChanged = [];
        events.deviceNetworkAddressChanged = [];

        const device = controller.getDeviceByIeeeAddr("0x0017880104e45517")!;
        expect(device.networkAddress).toStrictEqual(oldNwkAddress);

        mockAdapterSendZdo.mockImplementationOnce(async () => {
            const zdoResponse = [
                Zdo.Status.SUCCESS,
                {
                    eui64: "0x0017880104e45517",
                    nwkAddress: newNwkAddress,
                    startIndex: 0,
                    assocDevList: [],
                } as IEEEAddressResponse,
            ];

            await mockAdapterEvents.zdoResponse(Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, zdoResponse);
            return zdoResponse;
        });

        const frame = Zcl.Frame.create(0, 1, true, undefined, 10, "readRsp", 0, [{attrId: 5, status: 0, dataType: 66, attrData: "new.model.id"}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: oldNwkAddress,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(device.networkAddress).toStrictEqual(oldNwkAddress);
        expect(device.modelID).toBe("new.model.id");

        const frame2 = Zcl.Frame.create(
            0,
            1,
            true,
            undefined,
            10,
            "readRsp",
            0,
            [{attrId: 5, status: 0, dataType: 66, attrData: "new.model.id2"}],
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: newNwkAddress,
            clusterID: frame2.cluster.ID,
            data: frame2.toBuffer(),
            header: frame2.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(device.networkAddress).toStrictEqual(newNwkAddress);
        expect(device.modelID).toBe("new.model.id2");
        expect(events.lastSeenChanged.length).toBe(3); // zdoResponse + zclPayload x2
        expect(events.lastSeenChanged[0].device.networkAddress).toBe(newNwkAddress);
        expect(events.deviceNetworkAddressChanged.length).toBe(1);
        expect(events.deviceNetworkAddressChanged[0].device.networkAddress).toBe(newNwkAddress);
    });

    it("Device network address changed while Z2M was offline - fails to retrieve new one", async () => {
        const oldNwkAddress = 40369;
        const newNwkAddress = 12345;
        const database = `
        {"id":1,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":0,"epList":[11,6,5,4,3,2,1],"endpoints":{"1":{"profId":260,"epId":1,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"2":{"profId":257,"epId":2,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"3":{"profId":261,"epId":3,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"4":{"profId":263,"epId":4,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"5":{"profId":264,"epId":5,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"6":{"profId":265,"epId":6,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"11":{"profId":260,"epId":11,"devId":1024,"inClusterList":[],"meta":{},"outClusterList":[1280],"clusters":{}}},"interviewCompleted":false,"meta":{},"_id":"aM341ldunExFmJ3u"}
        {"id":3,"type":"Router","ieeeAddr":"0x000b57fffec6a5b2","nwkAddr":${oldNwkAddress},"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"meta":{},"outClusterList":[5,25,32,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"reporting":1},"_id":"pagvP2f9Bbj3o9TM"}
        `;
        fs.writeFileSync(options.databasePath, database);
        await controller.start();
        events.lastSeenChanged = [];
        events.deviceNetworkAddressChanged = [];

        const device = controller.getDeviceByIeeeAddr("0x000b57fffec6a5b2")!;
        expect(device.networkAddress).toStrictEqual(oldNwkAddress);

        mockAdapterSendZdo.mockImplementationOnce(async () => {
            const zdoResponse = [Zdo.Status.INV_REQUESTTYPE, undefined];

            await mockAdapterEvents.zdoResponse(Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, zdoResponse);
            return zdoResponse;
        });

        const frame = Zcl.Frame.create(0, 1, true, undefined, 10, "readRsp", 0, [{attrId: 5, status: 0, dataType: 66, attrData: "new.model.id"}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: newNwkAddress,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(device.networkAddress).toStrictEqual(oldNwkAddress);
        expect(device.modelID).toBe("TRADFRI bulb E27 WS opal 980lm");
        expect(mockLogger.debug).toHaveBeenCalledWith(
            `Failed to retrieve IEEE address for device '${newNwkAddress}': Error: Status 'INV_REQUESTTYPE'`,
            "zh:controller",
        );
        expect(events.lastSeenChanged.length).toBe(0);
        expect(events.deviceNetworkAddressChanged.length).toBe(0);
    });

    it("Device network address changed while Z2M was offline, no duplicate triggering of IEEE request", async () => {
        const oldNwkAddress = 40369;
        const newNwkAddress = 12345;
        const database = `
        {"id":1,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":0,"epList":[11,6,5,4,3,2,1],"endpoints":{"1":{"profId":260,"epId":1,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"2":{"profId":257,"epId":2,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"3":{"profId":261,"epId":3,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"4":{"profId":263,"epId":4,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"5":{"profId":264,"epId":5,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"6":{"profId":265,"epId":6,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"11":{"profId":260,"epId":11,"devId":1024,"inClusterList":[],"meta":{},"outClusterList":[1280],"clusters":{}}},"interviewCompleted":false,"meta":{},"_id":"aM341ldunExFmJ3u"}
        {"id":3,"type":"Router","ieeeAddr":"0x000b57fffec6a5b2","nwkAddr":${oldNwkAddress},"manufId":4476,"manufName":"IKEA of Sweden","powerSource":"Mains (single phase)","modelId":"TRADFRI bulb E27 WS opal 980lm","epList":[1],"endpoints":{"1":{"profId":49246,"epId":1,"devId":544,"inClusterList":[0,3,4,5,6,8,768,2821,4096],"meta":{},"outClusterList":[5,25,32,4096],"clusters":{}}},"appVersion":17,"stackVersion":87,"hwVersion":1,"dateCode":"20170331","swBuildId":"1.2.217","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"reporting":1},"_id":"pagvP2f9Bbj3o9TM"}
        `;
        fs.writeFileSync(options.databasePath, database);
        await controller.start();
        events.lastSeenChanged = [];
        events.deviceNetworkAddressChanged = [];
        mockAdapterSendZdo.mockClear();
        const identifyUnknownDeviceSpy = vi.spyOn(controller, "identifyUnknownDevice");

        const device = controller.getDeviceByIeeeAddr("0x000b57fffec6a5b2")!;
        expect(device.networkAddress).toStrictEqual(oldNwkAddress);

        const frame = Zcl.Frame.create(0, 1, true, undefined, 10, "readRsp", 0, [{attrId: 5, status: 0, dataType: 66, attrData: "new.model.id"}], {});
        const zclPayload = {
            wasBroadcast: false,
            address: newNwkAddress,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        };

        mockAdapterSendZdo.mockImplementationOnce(async () => {
            await mockAdapterEvents.zclPayload(zclPayload);

            const zdoResponse = [
                Zdo.Status.SUCCESS,
                {
                    eui64: "0x000b57fffec6a5b2",
                    nwkAddress: newNwkAddress,
                    startIndex: 0,
                    assocDevList: [],
                } as IEEEAddressResponse,
            ];

            await mockAdapterEvents.zdoResponse(Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, zdoResponse);
            return zdoResponse;
        });

        await mockAdapterEvents.zclPayload(zclPayload);

        expect(device.networkAddress).toStrictEqual(newNwkAddress);
        expect(device.modelID).toBe("new.model.id");
        expect(identifyUnknownDeviceSpy).toHaveBeenCalledTimes(2);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
        expect(events.lastSeenChanged.length).toBe(2); // zdoResponse + zclPayload (second ignored)
        expect(events.lastSeenChanged[0].device.networkAddress).toBe(newNwkAddress);
        expect(events.deviceNetworkAddressChanged.length).toBe(1);
        expect(events.deviceNetworkAddressChanged[0].device.networkAddress).toBe(newNwkAddress);
    });

    it("Device network address changed while Z2M was offline, no spamming of IEEE request when device doesnt respond", async () => {
        const nwkAddress = 40369;
        await controller.start();
        events.lastSeenChanged = [];
        events.deviceNetworkAddressChanged = [];
        mockAdapterSendZdo.mockClear();
        mockAdapterSendZdo.mockRejectedValueOnce(new Error("timeout"));
        const identifyUnknownDeviceSpy = vi.spyOn(controller, "identifyUnknownDevice");

        const frame = Zcl.Frame.create(0, 1, true, undefined, 10, "readRsp", 0, [{attrId: 5, status: 0, dataType: 66, attrData: "new.model.id"}], {});
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: nwkAddress,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
        expect(identifyUnknownDeviceSpy).toHaveBeenCalledTimes(1);
        expect(mockLogger.debug).toHaveBeenCalledWith(`Failed to retrieve IEEE address for device '${nwkAddress}': Error: timeout`, "zh:controller");

        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: nwkAddress,
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
        expect(identifyUnknownDeviceSpy).toHaveBeenCalledTimes(2);
        expect(events.lastSeenChanged.length).toBe(0);
        expect(events.deviceNetworkAddressChanged.length).toBe(0);
    });

    it("does not try to identify unknown device when deleted", async () => {
        const nwkAddr = 40369;
        const database = `
        {"id":1,"type":"Coordinator","ieeeAddr":"0x0000012300000000","nwkAddr":0,"manufId":0,"epList":[11,6,5,4,3,2,1],"endpoints":{"1":{"profId":260,"epId":1,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"2":{"profId":257,"epId":2,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"3":{"profId":261,"epId":3,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"4":{"profId":263,"epId":4,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"5":{"profId":264,"epId":5,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"6":{"profId":265,"epId":6,"devId":5,"inClusterList":[],"meta":{},"outClusterList":[],"clusters":{}},"11":{"profId":260,"epId":11,"devId":1024,"inClusterList":[],"meta":{},"outClusterList":[1280],"clusters":{}}},"interviewCompleted":false,"meta":{},"_id":"aM341ldunExFmJ3u"}
        {"id":4,"type":"EndDevice","ieeeAddr":"0x0017880104e45517","lastSeen":123,"nwkAddr":${nwkAddr},"manufId":4107,"manufName":"Philips","powerSource":"Battery","modelId":"RWL021","epList":[1,2],"endpoints":{"1":{"profId":49246,"epId":1,"devId":2096,"inClusterList":[0],"meta":{},"outClusterList":[0,3,4,6,8,5],"binds":[{"type":"endpoint","endpointID":1,"deviceIeeeAddr":"0x000b57fffec6a5b2"}],"configuredReportings":[{"cluster":1,"attrId":0,"minRepIntval":1,"maxRepIntval":20,"repChange":2}],"clusters":{"genBasic":{"dir":{"value":3},"attrs":{"modelId":"RWL021"}}}},"2":{"profId":260,"epId":2,"devId":12,"inClusterList":[0,1,3,15,64512],"meta":{},"outClusterList":[25],"clusters":{}}},"appVersion":2,"stackVersion":1,"hwVersion":1,"dateCode":"20160302","swBuildId":"5.45.1.17846","zclVersion":1,"interviewState":"SUCCESSFUL","meta":{"configured":1},"_id":"qxhymbX6H2GXDw8Z"}
        `;
        fs.writeFileSync(options.databasePath, database);
        await controller.start();
        events.lastSeenChanged = [];
        events.deviceNetworkAddressChanged = [];
        const identifyUnknownDeviceSpy = vi.spyOn(controller, "identifyUnknownDevice");

        const device = controller.getDeviceByIeeeAddr("0x0017880104e45517")!;
        expect(device.networkAddress).toStrictEqual(nwkAddr);

        device.removeFromDatabase();
        expect(device.isDeleted).toStrictEqual(true);
        expect(Device.isDeletedByIeeeAddr("0x0017880104e45517")).toStrictEqual(true);
        expect(Device.isDeletedByNetworkAddress(nwkAddr)).toStrictEqual(true);

        const frame2 = Zcl.Frame.create(
            0,
            1,
            true,
            undefined,
            10,
            "readRsp",
            0,
            [{attrId: 5, status: 0, dataType: 66, attrData: "new.model.id2"}],
            {},
        );
        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: nwkAddr,
            clusterID: frame2.cluster.ID,
            data: frame2.toBuffer(),
            header: frame2.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 1,
        });

        expect(identifyUnknownDeviceSpy).toHaveBeenCalledTimes(0);
        expect(mockLogger.debug).toHaveBeenCalledWith(`Data is from unknown device with address '${nwkAddr}', skipping...`, "zh:controller");
    });

    it("reads/writes to group with custom cluster when common to all members", async () => {
        interface CustomManuHerdsman {
            attributes: {customAttr: number};
            commands: never;
            commandResponses: never;
        }

        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 177, ieeeAddr: "0x177"});

        const device = controller.getDeviceByIeeeAddr("0x177")!;

        device.addCustomCluster("manuHerdsman", {
            ID: 64513,
            commands: {},
            commandsResponse: {},
            attributes: {customAttr: {ID: 0, type: Zcl.DataType.UINT8, write: true}},
        });

        const group = controller.createGroup(34);

        group.addMember(device.getEndpoint(1)!);

        await group.write<"manuHerdsman", CustomManuHerdsman>("manuHerdsman", {customAttr: 15}, {});
        await group.read<"manuHerdsman", CustomManuHerdsman>("manuHerdsman", ["customAttr"], {});

        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(2);
        expect(mocksendZclFrameToGroup.mock.calls[0][0]).toBe(34);
        expect(deepClone(mocksendZclFrameToGroup.mock.calls[0][1])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    9,
                    "write",
                    64513,
                    [{attrData: 15, attrId: 0, dataType: 32}],
                    device.customClusters,
                ),
            ),
        );
        expect(mocksendZclFrameToGroup.mock.calls[0][2]).toBeUndefined();
        expect(mocksendZclFrameToGroup.mock.calls[1][0]).toBe(34);
        expect(deepClone(mocksendZclFrameToGroup.mock.calls[1][1])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.GLOBAL,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    undefined,
                    10,
                    "read",
                    64513,
                    [{attrId: 0}],
                    device.customClusters,
                ),
            ),
        );
        expect(mocksendZclFrameToGroup.mock.calls[1][2]).toBeUndefined();
        expect(group.customClusters).toStrictEqual([device.customClusters, device.customClusters]);

        // add member with endpoints providing variable custom cluster support
        await mockAdapterEvents.deviceJoined({networkAddress: 178, ieeeAddr: "0x178"});

        const device2 = controller.getDeviceByIeeeAddr("0x178")!;
        device2.addCustomCluster("manuHerdsman", {
            ID: 64513,
            commands: {},
            commandsResponse: {},
            attributes: {customAttr: {ID: 0, type: Zcl.DataType.UINT8}},
        });
        group.addMember(device2.getEndpoint(2)!);

        await expect(async () => {
            await group.write("manuHerdsman", {customAttr: 14}, {});
        }).rejects.toThrow(new Error(`Cluster with name 'manuHerdsman' does not exist`));

        await expect(async () => {
            await group.read("manuHerdsman", ["customAttr"], {});
        }).rejects.toThrow(new Error(`Cluster with name 'manuHerdsman' does not exist`));

        await group.write<"manuHerdsman", CustomManuHerdsman>("manuHerdsman", {customAttr: 14}, {direction: Zcl.Direction.SERVER_TO_CLIENT});
        await group.read<"manuHerdsman", CustomManuHerdsman>("manuHerdsman", ["customAttr"], {direction: Zcl.Direction.SERVER_TO_CLIENT});

        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(4);

        group.removeMember(device2.getEndpoint(2)!);

        await group.write<"manuHerdsman", CustomManuHerdsman>("manuHerdsman", {customAttr: 16}, {});
        await group.read<"manuHerdsman", CustomManuHerdsman>("manuHerdsman", ["customAttr"], {});

        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(6);

        group.addMember(device2.getEndpoint(1)!);

        await group.write<"manuHerdsman", CustomManuHerdsman>("manuHerdsman", {customAttr: 8}, {});
        await group.read<"manuHerdsman", CustomManuHerdsman>("manuHerdsman", ["customAttr"], {});

        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(8);

        // add member with no endpoint providing custom cluster support
        await mockAdapterEvents.deviceJoined({networkAddress: 176, ieeeAddr: "0x176"});

        const device3 = controller.getDeviceByIeeeAddr("0x176")!;
        device3.addCustomCluster("manuHerdsman", {
            ID: 64513,
            commands: {},
            commandsResponse: {},
            attributes: {customAttr: {ID: 0, type: Zcl.DataType.UINT8}},
        });
        group.addMember(device3.getEndpoint(1)!);

        await expect(async () => {
            await group.write("manuHerdsman", {customAttr: 56}, {});
        }).rejects.toThrow(new Error(`Cluster with name 'manuHerdsman' does not exist`));

        await expect(async () => {
            await group.read("manuHerdsman", ["customAttr"], {});
        }).rejects.toThrow(new Error(`Cluster with name 'manuHerdsman' does not exist`));
    });

    it("does not read/write to group with non-common custom clusters", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 177, ieeeAddr: "0x177"});

        const device = controller.getDeviceByIeeeAddr("0x177")!;

        device.addCustomCluster("manuHerdsman", {
            ID: 64513,
            commands: {},
            commandsResponse: {},
            attributes: {customAttr: {ID: 0, type: Zcl.DataType.UINT8}},
        });

        const group = controller.createGroup(34);

        group.addMember(device.getEndpoint(1)!);
        await mockAdapterEvents.deviceJoined({networkAddress: 178, ieeeAddr: "0x178"});

        const device2 = controller.getDeviceByIeeeAddr("0x178")!;

        group.addMember(device2.getEndpoint(1)!);

        await expect(async () => {
            await group.write("manuHerdsman", {customAttr: 34}, {});
        }).rejects.toThrow(new Error(`Cluster with name 'manuHerdsman' does not exist`));

        await expect(async () => {
            await group.read("manuHerdsman", ["customAttr"], {});
        }).rejects.toThrow(new Error(`Cluster with name 'manuHerdsman' does not exist`));
    });

    it("sends & receives command to group with custom cluster when common to all members", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 179, ieeeAddr: "0x179"});

        const device = controller.getDeviceByIeeeAddr("0x179")!;

        device.addCustomCluster("manuSpecificInovelli", {
            ID: 64561,
            manufacturerCode: Zcl.ManufacturerCode.V_MARK_ENTERPRISES_INC,
            // omitted for brevity (unused here)
            attributes: {},
            commands: {
                ledEffect: {
                    ID: 1,
                    parameters: [
                        {name: "effect", type: Zcl.DataType.UINT8},
                        {name: "color", type: Zcl.DataType.UINT8},
                        {name: "level", type: Zcl.DataType.UINT8},
                        {name: "duration", type: Zcl.DataType.UINT8},
                    ],
                },
                individualLedEffect: {
                    ID: 3,
                    parameters: [
                        {name: "led", type: Zcl.DataType.UINT8},
                        {name: "effect", type: Zcl.DataType.UINT8},
                        {name: "color", type: Zcl.DataType.UINT8},
                        {name: "level", type: Zcl.DataType.UINT8},
                        {name: "duration", type: Zcl.DataType.UINT8},
                    ],
                },
            },
            commandsResponse: {
                bogus: {
                    ID: 1,
                    parameters: [{name: "xyz", type: Zcl.DataType.UINT8}],
                },
            },
        });

        const group = controller.createGroup(33);

        group.addMember(device.getEndpoint(1)!);

        await group.command("manuSpecificInovelli", "individualLedEffect", {led: 3, effect: 8, color: 100, level: 200, duration: 15});

        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToGroup.mock.calls[0][0]).toBe(33);
        expect(deepClone(mocksendZclFrameToGroup.mock.calls[0][1])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.SPECIFIC,
                    Zcl.Direction.CLIENT_TO_SERVER,
                    true,
                    Zcl.ManufacturerCode.V_MARK_ENTERPRISES_INC,
                    12,
                    "individualLedEffect",
                    64561,
                    {led: 3, effect: 8, color: 100, level: 200, duration: 15},
                    device.customClusters,
                ),
            ),
        );

        await group.command("manuSpecificInovelli", "bogus", {xyz: 12}, {direction: Zcl.Direction.SERVER_TO_CLIENT});

        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(2);
        expect(mocksendZclFrameToGroup.mock.calls[1][0]).toBe(33);
        expect(deepClone(mocksendZclFrameToGroup.mock.calls[1][1])).toStrictEqual(
            deepClone(
                Zcl.Frame.create(
                    Zcl.FrameType.SPECIFIC,
                    Zcl.Direction.SERVER_TO_CLIENT,
                    true,
                    Zcl.ManufacturerCode.V_MARK_ENTERPRISES_INC,
                    13,
                    "bogus",
                    64561,
                    {xyz: 12},
                    device.customClusters,
                ),
            ),
        );

        const messageContents = Buffer.from("118a0305010064ff", "hex");

        await mockAdapterEvents.zclPayload({
            clusterID: 64561,
            header: Zcl.Header.fromBuffer(messageContents),
            address: 179,
            data: messageContents,
            endpoint: 1,
            linkquality: 200,
            groupID: 33,
            wasBroadcast: false,
            destinationEndpoint: 1,
        });

        expect(events.message.length).toBe(1);
        expect(deepClone(events.message[0])).toMatchObject({
            cluster: "manuSpecificInovelli",
            type: "commandIndividualLedEffect",
            data: {
                color: 0,
                duration: null,
                effect: 1,
                led: 5,
                level: 100,
            },
            device: {
                _ieeeAddr: "0x179",
            },
            groupID: 33,
        });

        await mockAdapterEvents.deviceJoined({networkAddress: 178, ieeeAddr: "0x178"});

        const device2 = controller.getDeviceByIeeeAddr("0x178")!;

        group.addMember(device2.getEndpoint(1)!);

        await expect(async () => {
            await group.command("manuSpecificInovelli", "individualLedEffect", {
                led: 3,
                effect: 8,
                color: 100,
                level: 200,
                duration: 15,
            });
        }).rejects.toThrow(new Error(`Cluster with name 'manuSpecificInovelli' does not exist`));
    });

    it("Updates a device genBasic properties", async () => {
        await controller.start();
        expect(databaseContents().includes("0x129")).toBeFalsy();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});

        const device = controller.getDeviceByIeeeAddr("0x129")!;

        expect(device.applicationVersion).toStrictEqual(2);
        expect(device.dateCode).toStrictEqual("201901");
        expect(device.hardwareVersion).toStrictEqual(3);
        expect(device.manufacturerName).toStrictEqual("KoenAndCo");
        expect(device.modelID).toStrictEqual("myModelID");
        expect(device.powerSource).toStrictEqual("Mains (single phase)");
        expect(device.softwareBuildID).toStrictEqual("1.01");
        expect(device.stackVersion).toStrictEqual(101);
        expect(device.zclVersion).toStrictEqual(1);

        device.applicationVersion = 3;
        device.dateCode = "202501";
        device.hardwareVersion = 4;
        device.manufacturerName = "Test";
        device.modelID = "Me";
        device.powerSource = "DC Source";
        device.softwareBuildID = "2.01";
        device.stackVersion = 202;
        device.zclVersion = 2;

        expect(device.applicationVersion).toStrictEqual(3);
        expect(device.dateCode).toStrictEqual("202501");
        expect(device.hardwareVersion).toStrictEqual(4);
        expect(device.manufacturerName).toStrictEqual("Test");
        expect(device.modelID).toStrictEqual("Me");
        expect(device.powerSource).toStrictEqual("DC Source");
        expect(device.softwareBuildID).toStrictEqual("2.01");
        expect(device.stackVersion).toStrictEqual(202);
        expect(device.zclVersion).toStrictEqual(2);

        expect(device.genBasic.appVersion).toStrictEqual(3);
        expect(device.genBasic.dateCode).toStrictEqual("202501");
        expect(device.genBasic.hwVersion).toStrictEqual(4);
        expect(device.genBasic.manufacturerName).toStrictEqual("Test");
        expect(device.genBasic.modelId).toStrictEqual("Me");
        expect(device.genBasic.powerSource).toStrictEqual(Zcl.PowerSource["DC Source"]);
        expect(device.genBasic.swBuildId).toStrictEqual("2.01");
        expect(device.genBasic.stackVersion).toStrictEqual(202);
        expect(device.genBasic.zclVersion).toStrictEqual(2);
    });

    it("triggers sendZdo on sendRaw", async () => {
        await controller.start();
        mockAdapterSendZdo.mockClear();

        controller.sendRaw({
            profileId: Zdo.ZDO_PROFILE_ID,
            ieeeAddress: "0xf1f2f3f4f5f6f7f8",
            networkAddress: 129,
            clusterKey: Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            zdoParams: ["0xa1a2a3a4a5a6a7a8", false, 0],
        });

        const expectedFrame = Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, "0xa1a2a3a4a5a6a7a8", false, 0);
        expect(mockAdapterSendZdo).toHaveBeenCalledTimes(1);
        expect(mockAdapterSendZdo).toHaveBeenCalledWith("0xf1f2f3f4f5f6f7f8", 129, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, expectedFrame, false);
    });

    it("triggers sendZclFrameInterPANToIeeeAddr on sendRaw", async () => {
        await controller.start();
        mocksendZclFrameInterPANToIeeeAddr.mockClear();

        controller.sendRaw({
            interPan: true,
            ieeeAddress: "0xf1f2f3f4f5f6f7f8",
            networkAddress: 129,
            clusterKey: Zcl.Clusters.touchlink.ID,
            zcl: {
                commandKey: "identifyRequest",
                payload: {transactionID: 0, duration: 0xffff},
            },
            disableResponse: true,
        });

        const expectedFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            0,
            "identifyRequest",
            Zcl.Clusters.touchlink.ID,
            {transactionID: 0, duration: 0xffff},
            {},
        );
        expect(mocksendZclFrameInterPANToIeeeAddr).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameInterPANToIeeeAddr).toHaveBeenCalledWith(expect.any(Object), "0xf1f2f3f4f5f6f7f8");
        expect(deepClone(mocksendZclFrameInterPANToIeeeAddr.mock.calls[0][0])).toStrictEqual(deepClone(expectedFrame));
    });

    it("triggers sendZclFrameInterPANBroadcast on sendRaw", async () => {
        await controller.start();
        mocksendZclFrameInterPANBroadcast.mockClear();

        controller.sendRaw({
            interPan: true,
            zcl: {
                commandKey: "scanRequest",
                payload: {transactionID: 0, zigbeeInformation: 5, touchlinkInformation: 20},
            },
            disableResponse: true,
        });

        const expectedFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            0,
            "scanRequest",
            Zcl.Clusters.touchlink.ID,
            {transactionID: 0, zigbeeInformation: 5, touchlinkInformation: 20},
            {},
        );
        expect(mocksendZclFrameInterPANBroadcast).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameInterPANBroadcast).toHaveBeenCalledWith(expect.any(Object), 10000, true);
        expect(deepClone(mocksendZclFrameInterPANBroadcast.mock.calls[0][0])).toStrictEqual(deepClone(expectedFrame));
    });

    it("triggers sendZclFrameToGroup on sendRaw", async () => {
        await controller.start();
        mocksendZclFrameToGroup.mockClear();

        controller.sendRaw({
            groupId: 123,
            clusterKey: "genScenes",
            srcEndpoint: 2,
            zcl: {
                frameType: Zcl.FrameType.SPECIFIC,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                commandKey: "recall",
                payload: {groupid: 3, sceneid: 10},
                tsn: 10,
            },
            profileId: 0x0105,
        });

        const expectedFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            10,
            "recall",
            "genScenes",
            {groupid: 3, sceneid: 10},
            {},
        );
        expect(mocksendZclFrameToGroup).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToGroup).toHaveBeenCalledWith(123, expect.any(Object), 2, 0x0105);
        expect(deepClone(mocksendZclFrameToGroup.mock.calls[0][1])).toStrictEqual(deepClone(expectedFrame));
    });

    it("triggers sendZclFrameToAll on sendRaw", async () => {
        await controller.start();
        mocksendZclFrameToAll.mockClear();

        controller.sendRaw({
            networkAddress: 0xfff8,
            clusterKey: Zcl.Clusters.genIdentify.ID,
            srcEndpoint: 1,
            dstEndpoint: 10,
            zcl: {
                frameType: Zcl.FrameType.SPECIFIC,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                commandKey: "identify",
                payload: {identifytime: 30},
            },
        });

        const expectedFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            0,
            "identify",
            Zcl.Clusters.genIdentify.ID,
            {identifytime: 30},
            {},
        );
        expect(mocksendZclFrameToAll).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToAll).toHaveBeenCalledWith(10, expect.any(Object), 1, 0xfff8, ZSpec.HA_PROFILE_ID);
        expect(deepClone(mocksendZclFrameToAll.mock.calls[0][1])).toStrictEqual(deepClone(expectedFrame));
    });

    it("triggers sendZclFrameToEndpoint on sendRaw", async () => {
        await controller.start();
        mocksendZclFrameToEndpoint.mockClear();

        controller.sendRaw({
            ieeeAddress: "0xf1f2f3f4f5f6f7f8",
            networkAddress: 129,
            clusterKey: Zcl.Clusters.genIdentify.ID,
            srcEndpoint: 1,
            dstEndpoint: 3,
            zcl: {
                frameType: Zcl.FrameType.SPECIFIC,
                direction: Zcl.Direction.CLIENT_TO_SERVER,
                commandKey: "identify",
                payload: {identifytime: 60},
            },
        });

        const expectedFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            0,
            "identify",
            Zcl.Clusters.genIdentify.ID,
            {identifytime: 60},
            {},
        );
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledWith(
            "0xf1f2f3f4f5f6f7f8",
            129,
            3,
            expect.any(Object),
            10000,
            false,
            false,
            1,
            ZSpec.HA_PROFILE_ID,
        );
        expect(deepClone(mocksendZclFrameToEndpoint.mock.calls[0][3])).toStrictEqual(deepClone(expectedFrame));
    });

    it("triggers sendZclFrameToEndpoint with custom cluster on sendRaw", async () => {
        await controller.start();
        mocksendZclFrameToEndpoint.mockClear();

        const myCustomClusters: CustomClusters = {
            zhSpe: {
                ID: 0xffc1,
                attributes: {},
                commands: {
                    readMe: {
                        ID: 0,
                        parameters: [{name: "size", type: Zcl.DataType.UINT8}],
                    },
                },
                commandsResponse: {},
            },
        };

        controller.sendRaw(
            {
                ieeeAddress: "0xf1f2f3f4f5f6f7f8",
                networkAddress: 129,
                clusterKey: "zhSpe",
                srcEndpoint: 1,
                dstEndpoint: 2,
                zcl: {
                    frameType: Zcl.FrameType.SPECIFIC,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    commandKey: "readMe",
                    payload: {size: 10},
                },
            },
            myCustomClusters,
        );

        const expectedFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            0,
            "readMe",
            "zhSpe",
            {size: 10},
            myCustomClusters,
        );
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledTimes(1);
        expect(mocksendZclFrameToEndpoint).toHaveBeenCalledWith(
            "0xf1f2f3f4f5f6f7f8",
            129,
            2,
            expect.any(Object),
            10000,
            false,
            false,
            1,
            ZSpec.HA_PROFILE_ID,
        );
        expect(deepClone(mocksendZclFrameToEndpoint.mock.calls[0][3])).toStrictEqual(deepClone(expectedFrame));
    });

    it("ignores invalid attributes when processing ZCL attribute", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 178, ieeeAddr: "0x178"});
        mockLogger.debug.mockClear();

        const device = controller.getDeviceByIeeeAddr("0x178")!;
        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            10,
            "readRsp",
            Zcl.Foundation.read.ID,
            [{attrId: 0x0005, status: 0, dataType: 66, attrData: "a model id that is too long for spec"}],
            {},
        );

        await mockAdapterEvents.zclPayload({
            wasBroadcast: false,
            address: "0x178",
            clusterID: frame.cluster.ID,
            data: frame.toBuffer(),
            header: frame.header,
            endpoint: 1,
            linkquality: 50,
            groupID: 0,
        });

        // coverage: prevent crash in onZclPayload when ZCL metadata validation fails
        expect(mockLogger.debug).toHaveBeenCalledWith(
            "Ignoring attribute modelId from response: Error: modelId requires max length of 32",
            "zh:controller:zcl",
        );
        expect(device.genBasic.modelId).toStrictEqual(" other multi-endpoint device");
    });

    it("ensures manufacturer code is always unique in a single call", async () => {
        await controller.start();
        await mockAdapterEvents.deviceJoined({networkAddress: 129, ieeeAddr: "0x129"});
        const device = controller.getDeviceByIeeeAddr("0x129")!;
        const endpoint = device.getEndpoint(1)!;
        const zclCommandSpy = vi.spyOn(endpoint, "zclCommand");

        const writePayload = {occupiedHeatingSetpoint: 2000, viessmannWindowOpenInternal: 1};
        const writePayloadRaw = {viessmannWindowOpenInternal: 1, 0: {value: 1, type: Zcl.DataType.UINT16}};
        const readPayload = ["localTemp" as const, "viessmannWindowOpenInternal" as const];
        const readPayloadRaw = ["viessmannWindowOpenInternal" as const, 0];
        const configureReportingPayload = [
            {attribute: "localTemp" as const, minimumReportInterval: 1, maximumReportInterval: 10, reportableChange: 1},
            {attribute: "viessmannWindowOpenInternal" as const, minimumReportInterval: 1, maximumReportInterval: 10, reportableChange: 1},
        ];
        const configureReportingPayloadRaw = [
            {attribute: "viessmannWindowOpenInternal" as const, minimumReportInterval: 1, maximumReportInterval: 10, reportableChange: 1},
            {attribute: {ID: 0, type: Zcl.DataType.UINT16}, minimumReportInterval: 1, maximumReportInterval: 10, reportableChange: 1},
        ];
        const readReportingConfigPayload = [{attribute: "localTemp" as const}, {attribute: "viessmannWindowOpenInternal" as const}];
        const readReportingConfigPayloadRaw = [{attribute: "viessmannWindowOpenInternal" as const}, {attribute: {ID: 0}}];

        //-- with internal manufacturer codes

        await expect(endpoint.write("hvacThermostat", writePayload)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'write' call",
        );
        await expect(endpoint.write("hvacThermostat", writePayloadRaw)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'write' call",
        );
        await expect(endpoint.read("hvacThermostat", readPayload)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'read' call",
        );
        await expect(endpoint.read("hvacThermostat", readPayloadRaw)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'read' call",
        );
        await expect(endpoint.configureReporting("hvacThermostat", configureReportingPayload)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'configureReporting' call",
        );
        await expect(endpoint.configureReporting("hvacThermostat", configureReportingPayloadRaw)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'configureReporting' call",
        );
        await expect(endpoint.readReportingConfig("hvacThermostat", readReportingConfigPayload)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'readReportingConfig' call",
        );
        await expect(endpoint.readReportingConfig("hvacThermostat", readReportingConfigPayloadRaw)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'readReportingConfig' call",
        );

        //-- with override manufacturer code

        const manufOpts = {manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH};

        await expect(endpoint.write("hvacThermostat", writePayload, manufOpts)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'write' call",
        );
        await expect(endpoint.write("hvacThermostat", writePayloadRaw, manufOpts)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'write' call",
        );
        await expect(endpoint.read("hvacThermostat", readPayload, manufOpts)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'read' call",
        );
        await expect(endpoint.read("hvacThermostat", readPayloadRaw, manufOpts)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'read' call",
        );
        await expect(endpoint.configureReporting("hvacThermostat", configureReportingPayload, manufOpts)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'configureReporting' call",
        );
        await expect(endpoint.configureReporting("hvacThermostat", configureReportingPayloadRaw, manufOpts)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'configureReporting' call",
        );
        await expect(endpoint.readReportingConfig("hvacThermostat", readReportingConfigPayload, manufOpts)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'readReportingConfig' call",
        );
        await expect(endpoint.readReportingConfig("hvacThermostat", readReportingConfigPayloadRaw, manufOpts)).rejects.toThrow(
            "Cannot have attributes with different manufacturerCode in single 'readReportingConfig' call",
        );

        expect(zclCommandSpy).toHaveBeenCalledTimes(0);
    });
});
