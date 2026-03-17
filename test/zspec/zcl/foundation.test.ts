import {describe, expect, it} from "vitest";
import * as Zcl from "../../../src/zspec/zcl";

describe("Foundation", () => {
    it.each([
        ["read", {a: 1}],
        ["readRsp", {a: 1}],
        ["write", {a: 1}],
        ["writeUndiv", {a: 1}],
        ["writeRsp", {a: 1}],
        ["writeNoRsp", {a: 1}],
        ["configReport", {a: 1}],
        ["configReportRsp", {a: 1}],
        ["readReportConfig", {a: 1}],
        ["readReportConfigRsp", {a: 1}],
        ["report", {a: 1}],
        ["defaultRsp", [{a: 1}]],
        ["discover", [{a: 1}]],
        ["discoverRsp", [{a: 1}]],
        ["readStructured", {a: 1}],
        ["writeStructured", {a: 1}],
        ["writeStructuredRsp", {a: 1}],
        ["discoverCommands", [{a: 1}]],
        ["discoverCommandsRsp", [{a: 1}]],
        ["discoverCommandsGen", [{a: 1}]],
        ["discoverCommandsGenRsp", [{a: 1}]],
        ["discoverExt", [{a: 1}]],
        ["discoverExtRsp", [{a: 1}]],
    ])("throws on invalid payload type when writing %s", (cmd, payload) => {
        const frame = Zcl.Frame.create(Zcl.FrameType.GLOBAL, Zcl.Direction.CLIENT_TO_SERVER, true, undefined, 10, cmd, "genBasic", payload, {});

        expect(() => {
            frame.toBuffer();
        }).toThrow(new Zcl.StatusError(Zcl.Status.MALFORMED_COMMAND));
    });

    describe("read", () => {
        const READ_REQ_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            10,
            "read",
            "genBasic",
            [{attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID}, {attrId: Zcl.Clusters.genBasic.attributes.modelId.ID}],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = READ_REQ_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x10, 0x0a, 0x00, 0x00, 0x00, 0x05, 0x00]));

            const frame = Zcl.Frame.fromBuffer(READ_REQ_FRAME.cluster.ID, READ_REQ_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: READ_REQ_FRAME.header,
                payload: READ_REQ_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("readRsp", () => {
        const READ_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "readRsp",
            "genBasic",
            [
                {
                    attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID,
                    status: Zcl.Status.SUCCESS,
                    dataType: Zcl.Clusters.genBasic.attributes.zclVersion.type,
                    attrData: 8,
                },
                {
                    attrId: Zcl.Clusters.genBasic.attributes.manufacturerName.ID,
                    status: Zcl.Status.SUCCESS,
                    dataType: Zcl.Clusters.genBasic.attributes.manufacturerName.type,
                    attrData: "efgh",
                },
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = READ_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(
                Buffer.from([0x18, 0x0a, 0x01, 0x00, 0x00, 0x00, 0x20, 0x08, 0x04, 0x00, 0x00, 0x42, 0x04, 0x65, 0x66, 0x67, 0x68]),
            );

            const frame = Zcl.Frame.fromBuffer(READ_RSP_FRAME.cluster.ID, READ_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: READ_RSP_FRAME.header,
                payload: READ_RSP_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });

        it("[WORKAROUND] parses CHAR_STR as MI_STRUCT for attribute 0xff01", () => {
            const rawFrame = Buffer.from([
                0x18, 0x0a, 0x01, 0x01, 0xff, 0x00, 0x42, 34, 1, 33, 213, 12, 3, 40, 33, 4, 33, 168, 19, 5, 33, 43, 0, 6, 36, 0, 0, 5, 0, 0, 8, 33, 4,
                2, 10, 33, 0, 0, 100, 16, 0,
            ]);

            const frame = Zcl.Frame.fromBuffer(0x0000, Zcl.Header.fromBuffer(rawFrame), rawFrame, {});

            expect(frame).toMatchObject({
                payload: [
                    {
                        attrId: 0xff01,
                        status: Zcl.Status.SUCCESS,
                        dataType: Zcl.DataType.CHAR_STR,
                        attrData: {"1": 3285, "3": 33, "4": 5032, "5": 43, "6": 327680, "8": 516, "10": 0, "100": 0},
                    },
                ],
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("write", () => {
        const WRITE_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "write",
            "genOnOff",
            [
                {attrId: Zcl.Clusters.genOnOff.attributes.onTime.ID, dataType: Zcl.Clusters.genOnOff.attributes.onTime.type, attrData: 8},
                {attrId: Zcl.Clusters.genOnOff.attributes.offWaitTime.ID, dataType: Zcl.Clusters.genOnOff.attributes.offWaitTime.type, attrData: 4},
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = WRITE_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x02, 0x01, 0x40, 0x21, 0x08, 0x00, 0x02, 0x40, 0x21, 0x04, 0x00]));

            const frame = Zcl.Frame.fromBuffer(WRITE_FRAME.cluster.ID, WRITE_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: WRITE_FRAME.header,
                payload: WRITE_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("writeUndiv", () => {
        const WRITE_UNDIV_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "writeUndiv",
            "genOnOff",
            [
                {attrId: Zcl.Clusters.genOnOff.attributes.onTime.ID, dataType: Zcl.Clusters.genOnOff.attributes.onTime.type, attrData: 8},
                {attrId: Zcl.Clusters.genOnOff.attributes.offWaitTime.ID, dataType: Zcl.Clusters.genOnOff.attributes.offWaitTime.type, attrData: 4},
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = WRITE_UNDIV_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x03, 0x01, 0x40, 0x21, 0x08, 0x00, 0x02, 0x40, 0x21, 0x04, 0x00]));

            const frame = Zcl.Frame.fromBuffer(WRITE_UNDIV_FRAME.cluster.ID, WRITE_UNDIV_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: WRITE_UNDIV_FRAME.header,
                payload: WRITE_UNDIV_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("writeRsp", () => {
        const WRITE_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "writeRsp",
            "genOnOff",
            [
                {status: Zcl.Status.UNSUPPORTED_ATTRIBUTE, attrId: Zcl.Clusters.genOnOff.attributes.onTime.ID},
                {status: Zcl.Status.NOT_AUTHORIZED, attrId: Zcl.Clusters.genOnOff.attributes.offWaitTime.ID},
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = WRITE_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x04, 0x86, 0x01, 0x40, 0x7e, 0x02, 0x40]));

            const frame = Zcl.Frame.fromBuffer(WRITE_RSP_FRAME.cluster.ID, WRITE_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: WRITE_RSP_FRAME.header,
                payload: WRITE_RSP_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });

        it("handles SUCCESS payload", () => {
            const WRITE_RSP_SUCCESS_FRAME = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.SERVER_TO_CLIENT,
                true,
                undefined,
                10,
                "writeRsp",
                "genOnOff",
                [{status: Zcl.Status.SUCCESS}],
                {},
            );
            const rawFrame = WRITE_RSP_SUCCESS_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x04, 0x00]));

            const frame = Zcl.Frame.fromBuffer(WRITE_RSP_SUCCESS_FRAME.cluster.ID, WRITE_RSP_SUCCESS_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: WRITE_RSP_SUCCESS_FRAME.header,
                payload: WRITE_RSP_SUCCESS_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("writeNoRsp", () => {
        const WRITE_NO_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "writeNoRsp",
            "genOnOff",
            [
                {attrId: Zcl.Clusters.genOnOff.attributes.onTime.ID, dataType: Zcl.Clusters.genOnOff.attributes.onTime.type, attrData: 8},
                {attrId: Zcl.Clusters.genOnOff.attributes.offWaitTime.ID, dataType: Zcl.Clusters.genOnOff.attributes.offWaitTime.type, attrData: 4},
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = WRITE_NO_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x05, 0x01, 0x40, 0x21, 0x08, 0x00, 0x02, 0x40, 0x21, 0x04, 0x00]));

            const frame = Zcl.Frame.fromBuffer(WRITE_NO_RSP_FRAME.cluster.ID, WRITE_NO_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: WRITE_NO_RSP_FRAME.header,
                payload: WRITE_NO_RSP_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("configReport", () => {
        const CONFIG_REPORT_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "configReport",
            "genOnOff",
            [
                {
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: Zcl.Clusters.genOnOff.attributes.onTime.ID,
                    dataType: Zcl.Clusters.genOnOff.attributes.onTime.type,
                    minRepIntval: 300,
                    maxRepIntval: 4000,
                    repChange: 3,
                },
                {
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: Zcl.Clusters.genOnOff.attributes.onOff.ID,
                    dataType: Zcl.Clusters.genOnOff.attributes.onOff.type,
                    minRepIntval: 250,
                    maxRepIntval: 5290,
                },
                {
                    direction: Zcl.Direction.SERVER_TO_CLIENT,
                    attrId: Zcl.Clusters.genOnOff.attributes.startUpOnOff.ID,
                    timeout: 3000,
                },
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = CONFIG_REPORT_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(
                Buffer.from([
                    0x18, 0x0a, 0x06, 0x00, 0x01, 0x40, 0x21, 0x2c, 0x01, 0xa0, 0x0f, 0x03, 0x00, 0x00, 0x00, 0x00, 0x10, 0xfa, 0x00, 0xaa, 0x14,
                    0x01, 0x03, 0x40, 0xb8, 0x0b,
                ]),
            );

            const frame = Zcl.Frame.fromBuffer(CONFIG_REPORT_FRAME.cluster.ID, CONFIG_REPORT_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: CONFIG_REPORT_FRAME.header,
                payload: CONFIG_REPORT_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("configReportRsp", () => {
        const CONFIG_REPORT_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "configReportRsp",
            "genOnOff",
            [
                {
                    status: Zcl.Status.UNSUPPORTED_ATTRIBUTE,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: Zcl.Clusters.genOnOff.attributes.onTime.ID,
                },
                {
                    status: Zcl.Status.NOT_AUTHORIZED,
                    direction: Zcl.Direction.SERVER_TO_CLIENT,
                    attrId: Zcl.Clusters.genOnOff.attributes.offWaitTime.ID,
                },
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = CONFIG_REPORT_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x07, 0x86, 0x00, 0x01, 0x40, 0x7e, 0x01, 0x02, 0x40]));

            const frame = Zcl.Frame.fromBuffer(CONFIG_REPORT_RSP_FRAME.cluster.ID, CONFIG_REPORT_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: CONFIG_REPORT_RSP_FRAME.header,
                payload: CONFIG_REPORT_RSP_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });

        it("handles SUCCESS payload", () => {
            const CONFIG_REPORT_RSP_SUCCESS_FRAME = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.SERVER_TO_CLIENT,
                true,
                undefined,
                10,
                "configReportRsp",
                "genOnOff",
                [{status: Zcl.Status.SUCCESS}],
                {},
            );
            const rawFrame = CONFIG_REPORT_RSP_SUCCESS_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x07, 0x00]));

            const frame = Zcl.Frame.fromBuffer(CONFIG_REPORT_RSP_SUCCESS_FRAME.cluster.ID, CONFIG_REPORT_RSP_SUCCESS_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: CONFIG_REPORT_RSP_SUCCESS_FRAME.header,
                payload: CONFIG_REPORT_RSP_SUCCESS_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("readReportConfig", () => {
        const READ_REPORT_CONFIG_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            10,
            "readReportConfig",
            "genBasic",
            [
                {direction: Zcl.Direction.CLIENT_TO_SERVER, attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID},
                {direction: Zcl.Direction.SERVER_TO_CLIENT, attrId: Zcl.Clusters.genBasic.attributes.modelId.ID},
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = READ_REPORT_CONFIG_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x10, 0x0a, 0x08, 0x00, 0x00, 0x00, 0x01, 0x05, 0x00]));

            const frame = Zcl.Frame.fromBuffer(READ_REPORT_CONFIG_FRAME.cluster.ID, READ_REPORT_CONFIG_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: READ_REPORT_CONFIG_FRAME.header,
                payload: READ_REPORT_CONFIG_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("readReportConfigRsp", () => {
        const READ_REPORT_CONFIG_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            10,
            "readReportConfigRsp",
            "genBasic",
            [
                {
                    status: Zcl.Status.SUCCESS,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID,
                    dataType: Zcl.Clusters.genBasic.attributes.zclVersion.type,
                    minRepIntval: 10,
                    maxRepIntval: 100,
                    repChange: 60,
                },
                {
                    status: Zcl.Status.NOT_AUTHORIZED,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: Zcl.Clusters.genBasic.attributes.modelId.ID,
                },
                {
                    status: Zcl.Status.SUCCESS,
                    direction: Zcl.Direction.CLIENT_TO_SERVER,
                    attrId: Zcl.Clusters.genBasic.attributes.powerSource.ID,
                    dataType: Zcl.Clusters.genBasic.attributes.powerSource.type,
                    minRepIntval: 3500,
                    maxRepIntval: 45000,
                },
                {
                    status: Zcl.Status.SUCCESS,
                    direction: Zcl.Direction.SERVER_TO_CLIENT,
                    attrId: Zcl.Clusters.genBasic.attributes.alarmMask.ID,
                    timeout: 4500,
                },
                {
                    status: Zcl.Status.UNSUPPORTED_ATTRIBUTE,
                    direction: Zcl.Direction.SERVER_TO_CLIENT,
                    attrId: Zcl.Clusters.genBasic.attributes.physicalEnv.ID,
                },
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = READ_REPORT_CONFIG_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(
                Buffer.from([
                    0x10, 0x0a, 0x09, 0x00, 0x00, 0x00, 0x00, 0x20, 0x0a, 0x00, 0x64, 0x00, 0x3c, 0x7e, 0x00, 0x05, 0x00, 0x00, 0x00, 0x07, 0x00,
                    0x30, 0xac, 0x0d, 0xc8, 0xaf, 0x00, 0x01, 0x13, 0x00, 0x94, 0x11, 0x86, 0x01, 0x11, 0x00,
                ]),
            );

            const frame = Zcl.Frame.fromBuffer(READ_REPORT_CONFIG_RSP_FRAME.cluster.ID, READ_REPORT_CONFIG_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: READ_REPORT_CONFIG_RSP_FRAME.header,
                payload: READ_REPORT_CONFIG_RSP_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("report", () => {
        const REPORT_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "report",
            "genBasic",
            [
                {
                    attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID,
                    dataType: Zcl.Clusters.genBasic.attributes.zclVersion.type,
                    attrData: 8,
                },
                {
                    attrId: Zcl.Clusters.genBasic.attributes.manufacturerName.ID,
                    dataType: Zcl.Clusters.genBasic.attributes.manufacturerName.type,
                    attrData: "efgh",
                },
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = REPORT_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x0a, 0x00, 0x00, 0x20, 0x08, 0x04, 0x00, 0x42, 0x04, 0x65, 0x66, 0x67, 0x68]));

            const frame = Zcl.Frame.fromBuffer(REPORT_FRAME.cluster.ID, REPORT_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: REPORT_FRAME.header,
                payload: REPORT_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });

        it("[WORKAROUND] parses CHAR_STR as MI_STRUCT for attribute 0xff01", () => {
            const rawFrame = Buffer.from([
                0x18, 0x0a, 0x01, 0x01, 0xff, 0x00, 0x42, 34, 1, 33, 213, 12, 3, 40, 33, 4, 33, 168, 19, 5, 33, 43, 0, 6, 36, 0, 0, 5, 0, 0, 8, 33, 4,
                2, 10, 33, 0, 0, 100, 16, 0,
            ]);

            const frame = Zcl.Frame.fromBuffer(0x0000, Zcl.Header.fromBuffer(rawFrame), rawFrame, {});

            expect(frame).toMatchObject({
                payload: [
                    {
                        attrId: 0xff01,
                        dataType: Zcl.DataType.CHAR_STR,
                        attrData: {"1": 3285, "3": 33, "4": 5032, "5": 43, "6": 327680, "8": 516, "10": 0, "100": 0},
                    },
                ],
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("defaultRsp", () => {
        const DEFAULT_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "defaultRsp",
            "genBasic",
            {
                cmdId: Zcl.Clusters.genBasic.commands.resetFactDefault.ID,
                statusCode: Zcl.Status.SUCCESS,
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DEFAULT_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x0b, 0x00, 0x00]));

            const frame = Zcl.Frame.fromBuffer(DEFAULT_RSP_FRAME.cluster.ID, DEFAULT_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DEFAULT_RSP_FRAME.header,
                payload: DEFAULT_RSP_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("discover", () => {
        const DISCOVER_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "discover",
            "genBasic",
            {
                startAttrId: 0x0012,
                maxAttrIds: 8,
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DISCOVER_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x0c, 0x12, 0x00, 0x08]));

            const frame = Zcl.Frame.fromBuffer(DISCOVER_FRAME.cluster.ID, DISCOVER_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DISCOVER_FRAME.header,
                payload: DISCOVER_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("discoverRsp", () => {
        const DISCOVER_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "discoverRsp",
            "genOnOff",
            {
                discComplete: 1,
                attrInfos: [
                    {attrId: Zcl.Clusters.genOnOff.attributes.onOff.ID, dataType: Zcl.Clusters.genOnOff.attributes.onOff.type},
                    {attrId: Zcl.Clusters.genOnOff.attributes.globalSceneCtrl.ID, dataType: Zcl.Clusters.genOnOff.attributes.globalSceneCtrl.type},
                ],
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DISCOVER_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x0d, 0x01, 0x00, 0x00, 0x10, 0x00, 0x40, 0x10]));

            const frame = Zcl.Frame.fromBuffer(DISCOVER_RSP_FRAME.cluster.ID, DISCOVER_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DISCOVER_RSP_FRAME.header,
                payload: DISCOVER_RSP_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("readStructured", () => {
        const READ_STRUCTURED_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            10,
            "readStructured",
            "genBasic",
            [
                {
                    attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID,
                    selector: {indicatorType: Zcl.StructuredIndicatorType.Whole},
                },
                {
                    attrId: Zcl.Clusters.genBasic.attributes.modelId.ID,
                    selector: {indicatorType: Zcl.StructuredIndicatorType.Whole},
                },
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = READ_STRUCTURED_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x10, 0x0a, 0x0e, 0x00, 0x00, 0x00, 0x05, 0x00, 0x00]));

            const frame = Zcl.Frame.fromBuffer(READ_STRUCTURED_FRAME.cluster.ID, READ_STRUCTURED_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: READ_STRUCTURED_FRAME.header,
                payload: READ_STRUCTURED_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("writeStructured", () => {
        const WRITE_STRUCTURED_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            10,
            "writeStructured",
            "genBasic",
            [
                {
                    attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID,
                    selector: {indicatorType: Zcl.StructuredIndicatorType.Whole},
                    dataType: Zcl.Clusters.genBasic.attributes.zclVersion.type,
                    elementData: 0x08,
                },
                {
                    attrId: Zcl.Clusters.genBasic.attributes.modelId.ID,
                    selector: {indicatorType: Zcl.StructuredIndicatorType.Whole},
                    dataType: Zcl.Clusters.genBasic.attributes.modelId.type,
                    elementData: "abcd",
                },
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = WRITE_STRUCTURED_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(
                Buffer.from([0x10, 0x0a, 0x0f, 0x00, 0x00, 0x00, 0x20, 0x08, 0x05, 0x00, 0x00, 0x42, 0x04, 0x61, 0x62, 0x63, 0x64]),
            );

            const frame = Zcl.Frame.fromBuffer(WRITE_STRUCTURED_FRAME.cluster.ID, WRITE_STRUCTURED_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: WRITE_STRUCTURED_FRAME.header,
                payload: WRITE_STRUCTURED_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("writeStructuredRsp", () => {
        const WRITE_STRUCTURED_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            10,
            "writeStructuredRsp",
            "genBasic",
            [
                {
                    status: Zcl.Status.UNSUPPORTED_ATTRIBUTE,
                    attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID,
                    selector: {indicatorType: Zcl.StructuredIndicatorType.Whole},
                },
                {
                    status: Zcl.Status.NOT_AUTHORIZED,
                    attrId: Zcl.Clusters.genBasic.attributes.modelId.ID,
                    selector: {indicatorType: Zcl.StructuredIndicatorType.Whole},
                },
            ],
            {},
        );

        it("parses & writes", () => {
            const rawFrame = WRITE_STRUCTURED_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x10, 0x0a, 0x10, 0x86, 0x00, 0x00, 0x00, 0x7e, 0x05, 0x00, 0x00]));

            const frame = Zcl.Frame.fromBuffer(WRITE_STRUCTURED_RSP_FRAME.cluster.ID, WRITE_STRUCTURED_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: WRITE_STRUCTURED_RSP_FRAME.header,
                payload: WRITE_STRUCTURED_RSP_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });

        it("handles SUCCESS payload", () => {
            const WRITE_STRUCTURED_RSP_SUCCESS_FRAME = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.SERVER_TO_CLIENT,
                true,
                undefined,
                10,
                "writeStructuredRsp",
                "genOnOff",
                [{status: Zcl.Status.SUCCESS}],
                {},
            );
            const rawFrame = WRITE_STRUCTURED_RSP_SUCCESS_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x10, 0x00]));

            const frame = Zcl.Frame.fromBuffer(
                WRITE_STRUCTURED_RSP_SUCCESS_FRAME.cluster.ID,
                WRITE_STRUCTURED_RSP_SUCCESS_FRAME.header,
                rawFrame,
                {},
            );

            expect(frame).toMatchObject({
                header: WRITE_STRUCTURED_RSP_SUCCESS_FRAME.header,
                payload: WRITE_STRUCTURED_RSP_SUCCESS_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("discoverCommands", () => {
        const DISCOVER_COMMANDS_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "discoverCommands",
            "genOnOff",
            {
                startCmdId: 0x0010,
                maxCmdIds: 3,
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DISCOVER_COMMANDS_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x11, 0x10, 0x03]));

            const frame = Zcl.Frame.fromBuffer(DISCOVER_COMMANDS_FRAME.cluster.ID, DISCOVER_COMMANDS_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DISCOVER_COMMANDS_FRAME.header,
                payload: DISCOVER_COMMANDS_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("discoverCommandsRsp", () => {
        const DISCOVER_COMMANDS_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "discoverCommandsRsp",
            "genOnOff",
            {
                discComplete: 1,
                commandIds: [Zcl.Clusters.genOnOff.commands.off.ID, Zcl.Clusters.genOnOff.commands.on.ID],
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DISCOVER_COMMANDS_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x12, 0x01, 0x00, 0x01]));

            const frame = Zcl.Frame.fromBuffer(DISCOVER_COMMANDS_RSP_FRAME.cluster.ID, DISCOVER_COMMANDS_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DISCOVER_COMMANDS_RSP_FRAME.header,
                payload: DISCOVER_COMMANDS_RSP_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("discoverCommandsGen", () => {
        const DISCOVER_COMMANDS_GEN_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "discoverCommandsGen",
            "genOnOff",
            {
                startCmdId: 0x0010,
                maxCmdIds: 3,
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DISCOVER_COMMANDS_GEN_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x13, 0x10, 0x03]));

            const frame = Zcl.Frame.fromBuffer(DISCOVER_COMMANDS_GEN_FRAME.cluster.ID, DISCOVER_COMMANDS_GEN_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DISCOVER_COMMANDS_GEN_FRAME.header,
                payload: DISCOVER_COMMANDS_GEN_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("discoverCommandsGenRsp", () => {
        const DISCOVER_COMMANDS_GEN_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "discoverCommandsGenRsp",
            "genOnOff",
            {
                discComplete: 1,
                commandIds: [Zcl.Clusters.genOnOff.commands.off.ID, Zcl.Clusters.genOnOff.commands.on.ID],
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DISCOVER_COMMANDS_GEN_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x14, 0x01, 0x00, 0x01]));

            const frame = Zcl.Frame.fromBuffer(DISCOVER_COMMANDS_GEN_RSP_FRAME.cluster.ID, DISCOVER_COMMANDS_GEN_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DISCOVER_COMMANDS_GEN_RSP_FRAME.header,
                payload: DISCOVER_COMMANDS_GEN_RSP_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });

    describe("discoverExt", () => {
        const DISCOVER_EXT_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "discoverExt",
            "genBasic",
            {
                startAttrId: 0x0012,
                maxAttrIds: 8,
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DISCOVER_EXT_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x15, 0x12, 0x00, 0x08]));

            const frame = Zcl.Frame.fromBuffer(DISCOVER_EXT_FRAME.cluster.ID, DISCOVER_EXT_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DISCOVER_EXT_FRAME.header,
                payload: DISCOVER_EXT_FRAME.payload,
                cluster: {name: "genBasic"},
            });
        });
    });

    describe("discoverExtRsp", () => {
        const DISCOVER_EXT_RSP_FRAME = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            10,
            "discoverExtRsp",
            "genOnOff",
            {
                discComplete: 1,
                attrInfos: [
                    {attrId: Zcl.Clusters.genOnOff.attributes.onOff.ID, dataType: Zcl.Clusters.genOnOff.attributes.onOff.type, access: 1},
                    {
                        attrId: Zcl.Clusters.genOnOff.attributes.globalSceneCtrl.ID,
                        dataType: Zcl.Clusters.genOnOff.attributes.globalSceneCtrl.type,
                        access: 2,
                    },
                ],
            },
            {},
        );

        it("parses & writes", () => {
            const rawFrame = DISCOVER_EXT_RSP_FRAME.toBuffer();

            expect(rawFrame).toStrictEqual(Buffer.from([0x18, 0x0a, 0x16, 0x01, 0x00, 0x00, 0x10, 0x01, 0x00, 0x40, 0x10, 0x02]));

            const frame = Zcl.Frame.fromBuffer(DISCOVER_EXT_RSP_FRAME.cluster.ID, DISCOVER_EXT_RSP_FRAME.header, rawFrame, {});

            expect(frame).toMatchObject({
                header: DISCOVER_EXT_RSP_FRAME.header,
                payload: DISCOVER_EXT_RSP_FRAME.payload,
                cluster: {name: "genOnOff"},
            });
        });
    });
});
