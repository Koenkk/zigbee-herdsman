import {describe, expect, it} from "vitest";
import * as Zcl from "../../../src/zspec/zcl";

const READ_REQ_FRAME = Zcl.Frame.create(
    Zcl.FrameType.GLOBAL,
    Zcl.Direction.CLIENT_TO_SERVER,
    true,
    undefined,
    10,
    "read",
    Zcl.Clusters.genBasic.ID,
    [{attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID}, {attrId: Zcl.Clusters.genBasic.attributes.modelId.ID}],
    {},
);
const READ_RSP_FRAME = Zcl.Frame.create(
    Zcl.FrameType.GLOBAL,
    Zcl.Direction.SERVER_TO_CLIENT,
    true,
    undefined,
    10,
    "readRsp",
    Zcl.Clusters.genBasic.ID,
    [
        {attrId: Zcl.Clusters.genBasic.attributes.zclVersion.ID, dataType: Zcl.DataType.UINT8, attrData: 8, status: Zcl.Status.SUCCESS},
        {attrId: Zcl.Clusters.genBasic.attributes.manufacturerName.ID, dataType: Zcl.DataType.CHAR_STR, attrData: "efgh", status: Zcl.Status.SUCCESS},
    ],
    {},
);

describe("Foundation", () => {
    it("parse read", () => {
        const frame = Zcl.Frame.fromBuffer(READ_REQ_FRAME.cluster.ID, READ_REQ_FRAME.header, READ_REQ_FRAME.toBuffer(), {});
        console.log(frame);
        expect(frame).toMatchObject({
            header: {
                frameControl: {
                    reservedBits: 0,
                    frameType: 0,
                    direction: 0,
                    disableDefaultResponse: true,
                    manufacturerSpecific: false,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 10,
                commandIdentifier: 0,
            },
            payload: [{attrId: 0}, {attrId: 5}],
            cluster: {name: "genBasic"},
        });
    });

    it("write read", () => {
        const frame = READ_REQ_FRAME.toBuffer();
        console.log(frame);
        expect(frame).toStrictEqual(Buffer.from([0x10, 0x0a, 0x00, 0x00, 0x00, 0x05, 0x00]));
    });

    it("parse readRsp", () => {
        const frame = Zcl.Frame.fromBuffer(READ_RSP_FRAME.cluster.ID, READ_RSP_FRAME.header, READ_RSP_FRAME.toBuffer(), {});
        console.log(frame);
        expect(frame).toMatchObject({
            header: {
                frameControl: {
                    reservedBits: 0,
                    frameType: 0,
                    direction: 1,
                    disableDefaultResponse: true,
                    manufacturerSpecific: false,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 10,
                commandIdentifier: 1,
            },
            payload: [
                {attrId: 0, status: 0, dataType: 32, attrData: 8},
                {attrId: 4, status: 0, dataType: 66, attrData: "efgh"},
            ],
            cluster: {name: "genBasic"},
        });
    });

    it("write readRsp", () => {
        const frame = READ_RSP_FRAME.toBuffer();
        console.log(frame);
        expect(frame).toStrictEqual(
            Buffer.from([0x18, 0x0a, 0x01, 0x00, 0x00, 0x00, 0x20, 0x08, 0x04, 0x00, 0x00, 0x42, 0x04, 0x65, 0x66, 0x67, 0x68]),
        );
    });
});
