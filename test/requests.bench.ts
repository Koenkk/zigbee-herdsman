import {bench, describe} from "vitest";
import type {Adapter} from "../src/adapter";
import type {ZclPayload} from "../src/adapter/events";
import Database from "../src/controller/database";
import {Device, Entity, Group} from "../src/controller/model";
import {InterviewState} from "../src/controller/model/device";
import {setLogger} from "../src/utils/logger";
import * as Zcl from "../src/zspec/zcl";
import * as Zdo from "../src/zspec/zdo";
import {uint16To8Array} from "./utils/math";

let sendZclFrameToEndpointResponse: ZclPayload | undefined;
let sendZdoResponse: unknown | undefined;

// no-op, makes up for too much of the perf loss (with console logging by default)
setLogger({
    debug: () => {},
    info: () => {},
    warning: () => {},
    error: () => {},
});

const database = Database.open("dummy");
// no-op
database.write = () => {};

const adapter = {
    sendZclFrameToEndpoint: async () => Promise.resolve(sendZclFrameToEndpointResponse),
    sendZclFrameToGroup: async () => Promise.resolve(),
    sendZdo: async () => Promise.resolve(sendZdoResponse),
};

Entity.injectDatabase(database);
Entity.injectAdapter(adapter as unknown as Adapter);

const device = Device.create(
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
const endpoint = device.createEndpoint(1);
const group = Group.create(1);

group.addMember(endpoint);

const IEEE_ADDRESS1 = "0xfe34ac2385ff8311";
const IEEE_ADDRESS1_BYTES = [0x11, 0x83, 0xff, 0x85, 0x23, 0xac, 0x34, 0xfe];
const IEEE_ADDRESS2 = "0x28373fecd834ba37";
const IEEE_ADDRESS2_BYTES = [0x37, 0xba, 0x34, 0xd8, 0xec, 0x3f, 0x37, 0x28];
const NODE_ID1 = 0xfe32;
const NODE_ID1_BYTES = uint16To8Array(NODE_ID1);
const NODE_ID2 = 0xab39;
const NODE_ID2_BYTES = uint16To8Array(NODE_ID2);
const EXT_PAN_ID1 = [3, 43, 56, 23, 65, 23, 67, 23];
const EXT_PAN_ID2 = [253, 231, 21, 3, 0, 44, 24, 46];
const LQI_TABLE_RESPONSE = Buffer.from([
    1,
    Zdo.Status.SUCCESS,
    2,
    3,
    2,
    ...EXT_PAN_ID2,
    ...IEEE_ADDRESS1_BYTES,
    ...NODE_ID2_BYTES,
    0b00100101,
    0b00000001,
    1,
    235,
    ...EXT_PAN_ID1,
    ...IEEE_ADDRESS2_BYTES,
    ...NODE_ID1_BYTES,
    0b01000010,
    0b00000000,
    1,
    179,
]);

const BASIC_RESP = Zcl.Frame.create(
    0,
    1,
    true,
    undefined,
    10,
    "readRsp",
    0,
    [
        {
            attrId: 5,
            dataType: Zcl.DataType.CHAR_STR,
            attrData: device.modelID,
            status: 0,
        },
        {
            attrId: 4,
            dataType: Zcl.DataType.CHAR_STR,
            attrData: device.manufacturerName,
            status: 0,
        },
    ],
    {},
).toBuffer();

describe("Requests", () => {
    bench(
        "device lqi",
        async () => {
            sendZdoResponse = Zdo.Buffalo.readResponse(true, Zdo.ClusterId.LQI_TABLE_RESPONSE, LQI_TABLE_RESPONSE);
            const resp = await device.lqi();

            if (resp.neighbors[0].ieeeAddr !== IEEE_ADDRESS1 || resp.neighbors[1].ieeeAddr !== IEEE_ADDRESS2) {
                throw new Error("Invalid response");
            }
        },
        {throws: true},
    );

    bench(
        "device.endpoint write basic",
        async () => {
            await endpoint.write("genBasic", {modelId: "Herd-02", manufacturerName: "HerdsmanNew"}, {sendPolicy: "immediate"});
        },
        {throws: true},
    );

    bench(
        "device.endpoint read basic",
        async () => {
            sendZclFrameToEndpointResponse = {
                clusterID: 0,
                header: Zcl.Header.fromBuffer(BASIC_RESP),
                address: 0x0001,
                data: BASIC_RESP,
                endpoint: 1,
                linkquality: 200,
                groupID: 0,
                wasBroadcast: false,
                destinationEndpoint: 1,
            };
            const resp = await endpoint.read("genBasic", ["modelId", "manufacturerName"], {sendPolicy: "immediate"});

            if (resp.modelId !== device.modelID || resp.manufacturerName !== device.manufacturerName) {
                throw new Error("Invalid response");
            }
        },
        {throws: true},
    );

    bench(
        "device.endpoint defaultRsp",
        async () => {
            await endpoint.defaultResponse(0, 0, 0, 1);
        },
        {throws: true},
    );

    bench(
        "device.endpoint command",
        async () => {
            await endpoint.command("genOnOff", "offWithEffect", {effectid: 1, effectvariant: 2}, {sendPolicy: "immediate"});
        },
        {throws: true},
    );

    bench(
        "device.endpoint commandResponse",
        async () => {
            await endpoint.commandResponse("genAlarms", "alarm", {alarmcode: 123, clusterid: 456}, {sendPolicy: "immediate"});
        },
        {throws: true},
    );

    bench(
        "group write basic",
        async () => {
            await group.write("genBasic", {modelId: "Herd-02", manufacturerName: "HerdsmanNew"});
        },
        {throws: true},
    );

    bench(
        "group read basic",
        async () => {
            await group.read("genBasic", ["modelId", "manufacturerName"]);
        },
        {throws: true},
    );

    bench(
        "group command",
        async () => {
            await group.command("genRssiLocation", "getDevCfg", {targetaddr: IEEE_ADDRESS1}, {});
        },
        {throws: true},
    );
});
