import {beforeEach, describe, expect, it, type MockInstance, vi} from "vitest";
import type {ZclPayload} from "../src/adapter/events";
import Database from "../src/controller/database";
import {type Endpoint, Entity} from "../src/controller/model";
import {Device, InterviewState} from "../src/controller/model/device";
import {Clusters, DataType, Direction, FrameType, Status} from "../src/zspec/zcl";
import {ZclFrame} from "../src/zspec/zcl/zclFrame";

const database = Database.open("dummy");
// no-op
vi.spyOn(database, "write").mockImplementation(vi.fn());

Entity.injectDatabase(database);

describe("Device", () => {
    let device: Device;
    let endpoint: Endpoint;
    let readResponseSpy: MockInstance;
    let commandSpy: MockInstance;
    let readSpy: MockInstance;
    let defaultResponseSpy: MockInstance;

    beforeEach(() => {
        database.clear();
        Device.resetCache();

        device = Device.create(
            "Router",
            "0xfe34ac2385ff8311",
            0x0001,
            0x0102,
            "Herdsman",
            "Mains (single phase)",
            "Herd-01",
            InterviewState.Successful,
            undefined,
        );
        endpoint = device.createEndpoint(1);
        readResponseSpy = vi.spyOn(endpoint, "readResponse").mockImplementation(vi.fn());
        commandSpy = vi.spyOn(endpoint, "command").mockImplementation(vi.fn());
        readSpy = vi.spyOn(endpoint, "read").mockImplementation(vi.fn());
        defaultResponseSpy = vi.spyOn(endpoint, "defaultResponse").mockImplementation(vi.fn());
    });

    it("replies to basic read", async () => {
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            1,
            "read",
            "genBasic",
            [{attrId: 0x0000}, {attrId: 0xfffa}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(1);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
        expect(readResponseSpy).toHaveBeenCalledWith(
            Clusters.genBasic.ID,
            frame.header.transactionSequenceNumber,
            {
                zclVersion: Clusters.genBasic.attributes.zclVersion.default,
                65530: {value: undefined, type: DataType.NO_DATA},
            },
            {srcEndpoint: 1},
        );
    });

    it("replies to time read", async () => {
        // time is auto-generated, no saved attrs required
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            1,
            "read",
            "genTime",
            [{attrId: 0x0000}, {attrId: 0xfffa}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(1);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
        expect(readResponseSpy).toHaveBeenCalledWith(
            Clusters.genTime.ID,
            frame.header.transactionSequenceNumber,
            {
                time: expect.any(Number),
                65530: {value: undefined, type: DataType.NO_DATA},
            },
            {srcEndpoint: 1},
        );
    });

    it("replies to unsupported read", async () => {
        const frame = ZclFrame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, undefined, 1, "read", "genGroups", [{attrId: 0x0000}], {});
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(1);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
        expect(readResponseSpy).toHaveBeenCalledWith(
            Clusters.genGroups.ID,
            frame.header.transactionSequenceNumber,
            {
                0: {value: undefined, type: DataType.NO_DATA},
            },
            {srcEndpoint: 1},
        );
    });

    it("replies to read with custom response", async () => {
        device.customReadResponse = (_frame, _endpoint) => false;
        const frame = ZclFrame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, undefined, 1, "read", "genBasic", [{attrId: 0x0000}], {});
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(1);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
    });

    it("replies to read with override custom response", async () => {
        device.customReadResponse = (_frame, _endpoint) => true;
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            1,
            "read",
            "genBasic",
            [{attrId: 0x0000, type: DataType.UINT8}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
    });

    it("does not send default response for default response", async () => {
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            1,
            "defaultRsp",
            "genBasic",
            {cmdId: 0x00, statusCode: Status.SUCCESS},
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
    });

    it("replies to IAS Zone Enroll request", async () => {
        const frame = ZclFrame.create(
            FrameType.SPECIFIC,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            "enrollReq",
            "ssIasZone",
            {zonetype: 0x4567, manucode: 0x1234},
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(1);
        expect(commandSpy).toHaveBeenCalledWith(
            "ssIasZone",
            "enrollRsp",
            {enrollrspcode: 0, zoneid: 23},
            {transactionSequenceNumber: 1, disableDefaultResponse: true},
        );
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
    });

    it("fails to reply to IAS Zone Enroll request", async () => {
        const frame = ZclFrame.create(
            FrameType.SPECIFIC,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            "enrollReq",
            "ssIasZone",
            {zonetype: 0x4567, manucode: 0x1234},
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        commandSpy.mockRejectedValueOnce(new Error("failure"));
        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(1);
        expect(commandSpy).toHaveBeenCalledWith(
            "ssIasZone",
            "enrollRsp",
            {enrollrspcode: 0, zoneid: 23},
            {transactionSequenceNumber: 1, disableDefaultResponse: true},
        );
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(1);
        expect(defaultResponseSpy).toHaveBeenCalledWith(frame.command.ID, Status.FAILURE, frame.cluster.ID, 1, {
            direction: Direction.CLIENT_TO_SERVER,
        });
    });

    it("replies to Poll Control Check-in", async () => {
        device.checkinInterval = undefined;
        const frame = ZclFrame.create(FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, undefined, 1, "checkin", "genPollCtrl", {}, {});
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        readSpy.mockResolvedValueOnce({checkinInterval: 100});
        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(2);
        expect(commandSpy).toHaveBeenNthCalledWith(
            1,
            "genPollCtrl",
            "checkinRsp",
            {startFastPolling: 1, fastPollTimeout: 0},
            {transactionSequenceNumber: 1, disableDefaultResponse: true, sendPolicy: "immediate"},
        );
        expect(commandSpy).toHaveBeenNthCalledWith(2, "genPollCtrl", "fastPollStop", {}, {sendPolicy: "immediate"});
        expect(readSpy).toHaveBeenCalledTimes(1);
        expect(readSpy).toHaveBeenCalledWith("genPollCtrl", ["checkinInterval"], {sendPolicy: "immediate"});
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);

        readResponseSpy.mockClear();
        commandSpy.mockClear();
        commandSpy.mockClear();
        readSpy.mockClear();
        defaultResponseSpy.mockClear();
        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(1);
        expect(commandSpy).toHaveBeenCalledWith(
            "genPollCtrl",
            "checkinRsp",
            {startFastPolling: 0, fastPollTimeout: 0},
            {transactionSequenceNumber: 1, disableDefaultResponse: true, sendPolicy: "immediate"},
        );
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
    });

    it("fails to reply to Poll Control Check-in", async () => {
        device.checkinInterval = undefined;
        const frame = ZclFrame.create(FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, undefined, 1, "checkin", "genPollCtrl", {}, {});
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        commandSpy.mockRejectedValueOnce(new Error("failure"));
        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(1);
        expect(commandSpy).toHaveBeenCalledWith(
            "genPollCtrl",
            "checkinRsp",
            {startFastPolling: 1, fastPollTimeout: 0},
            {transactionSequenceNumber: 1, disableDefaultResponse: true, sendPolicy: "immediate"},
        );
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(1);
        expect(defaultResponseSpy).toHaveBeenCalledWith(frame.command.ID, Status.FAILURE, frame.cluster.ID, 1, {
            direction: Direction.CLIENT_TO_SERVER,
        });
    });

    it("fails to stop fast poll", async () => {
        device.checkinInterval = undefined;
        const frame = ZclFrame.create(FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, undefined, 1, "checkin", "genPollCtrl", {}, {});
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        readSpy.mockResolvedValueOnce({checkinInterval: 100});
        commandSpy.mockImplementationOnce(() => {}).mockRejectedValueOnce(new Error("failure"));
        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(2);
        expect(commandSpy).toHaveBeenCalledWith(
            "genPollCtrl",
            "checkinRsp",
            {startFastPolling: 1, fastPollTimeout: 0},
            {transactionSequenceNumber: 1, disableDefaultResponse: true, sendPolicy: "immediate"},
        );
        expect(commandSpy).toHaveBeenNthCalledWith(2, "genPollCtrl", "fastPollStop", {}, {sendPolicy: "immediate"});
        expect(readSpy).toHaveBeenCalledTimes(1);
        expect(readSpy).toHaveBeenCalledWith("genPollCtrl", ["checkinInterval"], {sendPolicy: "immediate"});
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
    });

    it("replies to GLOBAL with SUCCESS default response by default", async () => {
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            "readRsp",
            "genOnOff",
            [{attrId: 0x0000, status: Status.SUCCESS, dataType: DataType.BOOLEAN, attrData: 1}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(1);
        expect(defaultResponseSpy).toHaveBeenCalledWith(frame.command.ID, Status.SUCCESS, frame.cluster.ID, 1, {
            direction: Direction.CLIENT_TO_SERVER,
        });
    });

    it("replies to SPECIFIC from SERVER with SUCCESS default response by default", async () => {
        const frame = ZclFrame.create(
            FrameType.SPECIFIC,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            "removeRsp",
            "genScenes",
            {status: 0, groupid: 1, sceneid: 2},
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(1);
        expect(defaultResponseSpy).toHaveBeenCalledWith(frame.command.ID, Status.SUCCESS, frame.cluster.ID, 1, {
            direction: Direction.CLIENT_TO_SERVER,
        });
    });

    it("replies to SPECIFIC from CLIENT with SUCCESS default response by default", async () => {
        const frame = ZclFrame.create(
            FrameType.SPECIFIC,
            Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            1,
            "identify",
            "genIdentify",
            {identifytime: 1},
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(1);
        expect(defaultResponseSpy).toHaveBeenCalledWith(frame.command.ID, Status.SUCCESS, frame.cluster.ID, 1, {
            direction: Direction.SERVER_TO_CLIENT,
        });
    });

    it("replies with default response from caller", async () => {
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            "readRsp",
            "genOnOff",
            [{attrId: 0x0000, status: Status.SUCCESS, dataType: DataType.BOOLEAN, attrData: 1}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, Status.INVALID_VALUE);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(1);
        expect(defaultResponseSpy).toHaveBeenCalledWith(frame.command.ID, Status.INVALID_VALUE, frame.cluster.ID, 1, {
            direction: Direction.CLIENT_TO_SERVER,
        });
    });

    it("replies with non-SUCCESS default response even when disable default response is ON", async () => {
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            1,
            "report",
            "genOnOff",
            [{attrId: 0x0000, dataType: DataType.BOOLEAN, attrData: 0}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, Status.INVALID_VALUE);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(1);
        expect(defaultResponseSpy).toHaveBeenCalledWith(frame.command.ID, Status.INVALID_VALUE, frame.cluster.ID, 1, {
            direction: Direction.CLIENT_TO_SERVER,
        });
    });

    it("skips replying with default response when deviced option set", async () => {
        device.skipDefaultResponse = true;
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            "readRsp",
            "genOnOff",
            [{attrId: 0x0000, status: Status.SUCCESS, dataType: DataType.BOOLEAN, attrData: 1}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);
    });

    it("de-duplicates replying with default response", async () => {
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            0,
            "readRsp",
            "genOnOff",
            [{attrId: 0x0000, status: Status.SUCCESS, dataType: DataType.BOOLEAN, attrData: 1}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);
        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(1);
        expect(defaultResponseSpy).toHaveBeenNthCalledWith(1, frame.command.ID, Status.SUCCESS, frame.cluster.ID, 0, {
            direction: Direction.CLIENT_TO_SERVER,
        });

        device.resetTransient(false);
        await device.onZclData(dataPayload, frame, endpoint, undefined);
        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(defaultResponseSpy).toHaveBeenCalledTimes(2);
        expect(defaultResponseSpy).toHaveBeenNthCalledWith(2, frame.command.ID, Status.SUCCESS, frame.cluster.ID, 0, {
            direction: Direction.CLIENT_TO_SERVER,
        });
    });

    it("skips replying with default response when Tuya device option set", async () => {
        process.env.DISABLE_TUYA_DEFAULT_RESPONSE = "1";
        device.manufacturerName = "_TZ1234_5678";
        const frame = ZclFrame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            "readRsp",
            "genOnOff",
            [{attrId: 0x0000, status: Status.SUCCESS, dataType: DataType.BOOLEAN, attrData: 1}],
            {},
        );
        const dataPayload: ZclPayload = {
            clusterID: frame.cluster.ID,
            address: 0x1234,
            header: frame.header,
            data: frame.toBuffer(),
            endpoint: 1,
            linkquality: 150,
            groupID: 0,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        await device.onZclData(dataPayload, frame, endpoint, undefined);

        expect(readResponseSpy).toHaveBeenCalledTimes(0);
        expect(commandSpy).toHaveBeenCalledTimes(0);
        expect(readSpy).toHaveBeenCalledTimes(0);
        expect(defaultResponseSpy).toHaveBeenCalledTimes(0);

        delete process.env.DISABLE_TUYA_DEFAULT_RESPONSE;
    });
});
