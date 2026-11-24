import {MockBinding, type MockPortBinding} from "@serialport/binding-mock";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {CommandId, EspZbStatus, FrameType} from "../../../src/adapter/espzb/consts";
import {decodeApsDataIndication, EspZbDriver, EspZbStatusError, encodeApsDataRequest} from "../../../src/adapter/espzb/driver";
import {type EspZbFrame, encodeFrame, FrameDecoder} from "../../../src/adapter/espzb/frame";
import {AdapterTransport} from "../../../src/adapter/transport";
import {logger} from "../../../src/utils/logger";

/** Driver wired to a scripted responder. */
function setup(respond: (req: EspZbFrame, driver: EspZbDriver) => void): {driver: EspZbDriver; requests: EspZbFrame[]} {
    const driver = new EspZbDriver(new AdapterTransport({path: "tcp://127.0.0.1:6638", adapter: "espzb"}));
    const requests: EspZbFrame[] = [];
    const decoder = new FrameDecoder(
        (f) => {
            requests.push(f);
            respond(f, driver);
        },
        () => {},
    );
    driver.writer = (data): void => decoder.push(data);
    return {driver, requests};
}

const reply = (driver: EspZbDriver, type: number, id: number, sn: number, payload: Buffer): void => {
    const wire = encodeFrame({version: 0, type: type as 0 | 1 | 2, id, sn, payload});
    queueMicrotask(() => driver.receive(wire));
};

const apsReq = {
    dstMode: 2,
    dst: 0x1234,
    dstEndpoint: 1,
    srcEndpoint: 1,
    profileId: 0x0104,
    clusterId: 6,
    txOptions: 4,
    radius: 0,
    asdu: Buffer.from([1]),
};

describe("espzb driver", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("reports link state", () => {
        const {driver} = setup(() => {});
        expect(driver.apsInflight).toStrictEqual(0);
        driver.resetNotifySequence();
    });

    it("names unknown commands and statuses in errors", async () => {
        expect(new EspZbStatusError(0x7777 as CommandId, 0x77 as EspZbStatus).message).toStrictEqual("0x7777 failed with status 0x77");
        const {driver} = setup(() => {});
        driver.requestTimeout = 1;
        await expect(driver.request(0x7777 as CommandId)).rejects.toThrow("0x7777 (sn=0): no response after 3 attempts");
    });

    it("fails requests when the port is not open", async () => {
        const driver = new EspZbDriver(new AdapterTransport({path: "tcp://127.0.0.1:6638"}));
        await expect(driver.request(CommandId.EXT_PING)).rejects.toThrow("Cannot write while transport is closed");
    });

    it("rejects an empty response and non-SUCCESS statuses", async () => {
        const {driver} = setup((req, d) =>
            reply(d, FrameType.RESPONSE, req.id, req.sn, req.id === CommandId.EXT_PING ? Buffer.alloc(0) : Buffer.from([EspZbStatus.BUSY])),
        );
        await expect(driver.request(CommandId.EXT_PING)).rejects.toThrow("empty response");
        await expect(driver.request(CommandId.NETWORK_STATE)).rejects.toThrow(EspZbStatusError);
    });

    it("ignores stale responses, frames of unknown direction and confirms for unknown sn", async () => {
        const {driver} = setup((req, d) => {
            reply(d, FrameType.RESPONSE, req.id, (req.sn + 1) % 255, Buffer.from([0])); // stale sn
            reply(d, FrameType.REQUEST, req.id, req.sn, Buffer.from([0])); // NCP must not send requests
            reply(d, FrameType.NOTIFY, CommandId.APS_DATA_CONFIRM, 200, Buffer.alloc(21));
            reply(d, FrameType.RESPONSE, req.id, req.sn, Buffer.from([0, 7]));
        });
        await expect(driver.request(CommandId.NETWORK_CHANNEL_GET)).resolves.toStrictEqual(Buffer.from([7]));
    });

    it("tracks APS confirms by sn, including a confirm without status byte", async () => {
        const {driver} = setup((req, d) => {
            reply(d, FrameType.NOTIFY, CommandId.APS_DATA_CONFIRM, req.sn, Buffer.alloc(4)); // truncated confirm, before the response
            reply(d, FrameType.RESPONSE, req.id, req.sn, Buffer.from([0]));
        });
        const {confirm} = await driver.apsDataRequest(apsReq);
        await expect(confirm).resolves.toStrictEqual(0xff);
        expect(driver.apsInflight).toStrictEqual(0);
    });

    it("completes an unconfirmed APS request after the confirm timeout", async () => {
        vi.useFakeTimers({toFake: ["setTimeout", "clearTimeout"]});
        const {driver} = setup((req, d) => reply(d, FrameType.RESPONSE, req.id, req.sn, Buffer.from([0])));
        const {confirm} = await driver.apsDataRequest(apsReq);
        expect(driver.apsInflight).toStrictEqual(1);
        await vi.advanceTimersByTimeAsync(36000);
        await expect(confirm).resolves.toStrictEqual(0xff);
        expect(driver.apsInflight).toStrictEqual(0);
    });

    it("releases the APS sn when the request is not answered", async () => {
        const {driver} = setup(() => {});
        driver.requestTimeout = 1;
        await expect(driver.apsDataRequest(apsReq)).rejects.toThrow("no response after 3 attempts");
        expect(driver.apsInflight).toStrictEqual(0);
    });

    it("never reuses the sn of an in-flight APS request and fails when all are in flight", async () => {
        const {driver} = setup((req, d) => reply(d, FrameType.RESPONSE, req.id, req.sn, Buffer.from([0])));
        for (let i = 0; i < 255; i++) {
            await driver.apsDataRequest(apsReq);
        }
        expect(driver.apsInflight).toStrictEqual(255);
        await expect(driver.request(CommandId.EXT_PING)).rejects.toThrow("No free sequence number");
    });

    it("fails pending work on disconnect", async () => {
        const {driver} = setup((req, d) => {
            if (req.id === CommandId.APS_DATA_REQUEST) reply(d, FrameType.RESPONSE, req.id, req.sn, Buffer.from([0]));
        });
        const {confirm} = await driver.apsDataRequest(apsReq);
        const pending = driver.request(CommandId.EXT_PING);
        await driver.disconnect();
        await expect(pending).rejects.toThrow("Driver stopped");
        await expect(confirm).resolves.toStrictEqual(0xff);
    });
});

describe("espzb driver over the adapter transport", () => {
    const PATH = "/dev/ttyESPZB";
    let transport: AdapterTransport;

    const mockPort = (): MockPortBinding => transport.serialPortInstance?.port as MockPortBinding;

    beforeEach(() => {
        MockBinding.createPort(PATH, {record: true});
        transport = new AdapterTransport({path: PATH, adapter: "espzb"});
        transport.serialPortBinding = MockBinding;
    });

    afterEach(async () => {
        await transport.close();
        MockBinding.reset();
    });

    it("opens the port without software flow control and exchanges frames through it", async () => {
        const driver = new EspZbDriver(transport);
        await driver.connect();
        expect(transport.isOpen).toStrictEqual(true);
        expect(mockPort().openOptions.xon).toStrictEqual(false);
        expect(mockPort().openOptions.xoff).toStrictEqual(false);

        const pending = driver.request(CommandId.NETWORK_CHANNEL_GET);
        mockPort().emitData(
            encodeFrame({version: 0, type: FrameType.RESPONSE, id: CommandId.NETWORK_CHANNEL_GET, sn: 0, payload: Buffer.from([0, 11])}),
        );
        await expect(pending).resolves.toStrictEqual(Buffer.from([11]));
        expect(mockPort().recording).toStrictEqual(
            encodeFrame({version: 0, type: FrameType.REQUEST, id: CommandId.NETWORK_CHANNEL_GET, sn: 0, payload: Buffer.alloc(0)}),
        );
    });

    it("fails pending work when the port closes", async () => {
        const driver = new EspZbDriver(transport);
        await driver.connect();
        const pending = driver.request(CommandId.EXT_PING);
        transport.serialPortInstance?.emit("close");
        await expect(pending).rejects.toThrow("Port closed");
    });

    it("closes the port on disconnect and only logs a failure to close", async () => {
        const driver = new EspZbDriver(transport);
        await driver.connect();
        await driver.disconnect();
        expect(transport.isOpen).toStrictEqual(false);

        await driver.connect();
        vi.spyOn(transport, "close").mockRejectedValueOnce(new Error("busy"));
        const debug = vi.spyOn(logger, "debug");
        await expect(driver.disconnect()).resolves.toBeUndefined();
        expect(debug).toHaveBeenCalledWith("Failed to close transport: Error: busy", "zh:espzb:driver");
    });
});

describe("espzb APS codec", () => {
    it("encodes an IEEE destination", () => {
        const ieee = Buffer.from("78563412004b1200", "hex");
        const buf = encodeApsDataRequest({...apsReq, dstMode: 3, dst: ieee});
        expect(buf.subarray(0, 8)).toStrictEqual(ieee);
        expect(buf[10]).toStrictEqual(3);
        expect(buf.readUInt32LE(27)).toStrictEqual(1);
    });

    it("decodes an IEEE source and rejects malformed indications", () => {
        const p = Buffer.alloc(37);
        p[11] = 3;
        Buffer.from("78563412004b1200", "hex").copy(p, 12);
        p.writeUInt32LE(1, 32);
        const ind = decodeApsDataIndication(p);
        expect(ind.srcShort).toStrictEqual(0xfffe);
        expect(ind.srcIeee?.toString("hex")).toStrictEqual("78563412004b1200");
        expect(() => decodeApsDataIndication(Buffer.alloc(10))).toThrow("too short");
        p.writeUInt32LE(5, 32);
        expect(() => decodeApsDataIndication(p)).toThrow("truncated");
    });
});
