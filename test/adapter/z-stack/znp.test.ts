import {MockBinding, type MockPortBinding} from "@serialport/binding-mock";
import type {Mock, MockInstance} from "vitest";
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {AdapterTransport} from "../../../src/adapter";
import {Constants, Constants as UnpiConstants, Frame as UnpiFrame} from "../../../src/adapter/z-stack/unpi";
import {Znp, ZpiObject} from "../../../src/adapter/z-stack/znp";
import BuffaloZnp from "../../../src/adapter/z-stack/znp/buffaloZnp";
import ParameterType from "../../../src/adapter/z-stack/znp/parameterType";
import * as Zdo from "../../../src/zspec/zdo";
import {duplicateArray, flushPromises, ieeeaAddr1, ieeeaAddr2} from "../../testUtils";

vi.mock("../../../src/utils/wait", () => ({
    wait: vi.fn(() => {
        return new Promise<void>((resolve) => resolve());
    }),
}));

let requestSpy: MockInstance;

const ADAPTER_PATH = "/dev/ttyACM0";

describe("ZNP", () => {
    let transport: AdapterTransport;
    let znp: Znp;

    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        MockBinding.createPort(ADAPTER_PATH, {record: false});

        transport = new AdapterTransport({path: ADAPTER_PATH, baudRate: 100, rtscts: true});
        transport.serialPortBinding = MockBinding;
        znp = new Znp(transport);
        requestSpy = vi.spyOn(znp, "request").mockImplementation(async () => undefined);
    });

    afterEach(() => {
        MockBinding.reset();
        requestSpy.mockRestore();
    });

    it("first ping fails should send reset bootloader", async () => {
        requestSpy.mockImplementation(() => {
            throw new Error("failed");
        });
        const transportSetSpy = vi
            .spyOn(transport, "set")
            .mockImplementationOnce(async () => {})
            .mockImplementationOnce(async () => {})
            .mockImplementationOnce(async () => {});
        await znp.open();

        expect(transportSetSpy).toHaveBeenCalledTimes(3);
    });

    it("open and close", async () => {
        const transportClose = vi.spyOn(transport, "close");
        await znp.open();
        await znp.close();

        expect(transportClose).toHaveBeenCalledTimes(1);
    });

    it("znp receive", async () => {
        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);

        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.SYS,
                0x02,
                Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x01, 0x01, 0x01, 0x01]),
            ).toBuffer(),
        );
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(1);

        const obj = received.mock.calls[0][0];
        expect(obj.command.name).toBe("version");
        expect(obj.command.ID).toBe(2);
        expect(obj.payload).toStrictEqual({maintrel: 5, majorrel: 3, minorrel: 4, product: 2, revision: 16843009, transportrev: 1});
        expect(obj.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(obj.type).toBe(UnpiConstants.Type.SRSP);
    });

    it("znp receive malformed", async () => {
        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);

        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x02, Buffer.from([0x01, 0x02, 0x03, 0x04])).toBuffer(),
        );
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(0);
    });

    it("znp request SREQ", async () => {
        const portWriteSpy = vi.spyOn(transport, "write").mockImplementationOnce(() => {
            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])).toBuffer(),
            );

            return false;
        });

        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.requestWithReply(UnpiConstants.Subsystem.SYS, "osalNvRead", {id: 1, offset: 2});

        expect(portWriteSpy).toHaveBeenCalledTimes(1);
        expect(portWriteSpy).toHaveBeenCalledWith(
            new UnpiFrame(UnpiConstants.Type.SREQ, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x01, 0x00, 0x02])).toBuffer(),
        );

        expect(result.command.name).toBe("osalNvRead");
        expect(result.command.ID).toBe(0x08);
        expect(result.payload).toStrictEqual({status: 0, len: 2, value: Buffer.from([0x01, 0x02])});
        expect(result.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(result.type).toBe(UnpiConstants.Type.SRSP);
    });

    it("znp request SREQ failed", async () => {
        vi.spyOn(transport, "write").mockImplementationOnce(() => {
            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x01, 0x02, 0x01, 0x02])).toBuffer(),
            );

            return false;
        });

        await znp.open();
        requestSpy.mockRestore();

        expect(znp.waitress.waiters.size).toBe(0);

        let error;
        try {
            await znp.request(UnpiConstants.Subsystem.SYS, "osalNvRead", {id: 1, offset: 2});
        } catch (e) {
            expect(znp.waitress.waiters.size).toBe(0);
            error = e;
        }

        expect(error).toStrictEqual(
            new Error("--> 'SREQ: SYS - osalNvRead - {\"id\":1,\"offset\":2}' failed with status '(0x01: FAILURE)' (expected '(0x00: SUCCESS)')"),
        );
    });

    it("znp request SREQ failed should cancel waiter when provided", async () => {
        vi.spyOn(transport, "write").mockImplementationOnce(() => {
            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x01, 0x02, 0x01, 0x02])).toBuffer(),
            );

            return false;
        });

        await znp.open();
        requestSpy.mockRestore();

        expect(znp.waitress.waiters.size).toBe(0);
        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, "osalNvRead", undefined, undefined, undefined);
        expect(znp.waitress.waiters.size).toBe(1);

        let error;
        try {
            await znp.request(UnpiConstants.Subsystem.SYS, "osalNvRead", {id: 1, offset: 2}, waiter.ID);
        } catch (e) {
            expect(znp.waitress.waiters.size).toBe(0);
            error = e;
        }

        expect(error).toStrictEqual(
            new Error("--> 'SREQ: SYS - osalNvRead - {\"id\":1,\"offset\":2}' failed with status '(0x01: FAILURE)' (expected '(0x00: SUCCESS)')"),
        );
    });

    it("znp request SREQ with parsed in between", async () => {
        const portWriteSpy = vi.spyOn(transport, "write").mockImplementationOnce(() => {
            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.AF, 0x00, Buffer.from([0x00])).toBuffer(),
            );

            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])).toBuffer(),
            );

            return false;
        });

        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.request(UnpiConstants.Subsystem.SYS, "osalNvRead", {id: 1, offset: 2});

        expect(portWriteSpy).toHaveBeenCalledTimes(1);
        expect(portWriteSpy).toHaveBeenCalledWith(
            new UnpiFrame(UnpiConstants.Type.SREQ, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x01, 0x00, 0x02])).toBuffer(),
        );

        expect(result.command.name).toBe("osalNvRead");
        expect(result.command.ID).toBe(0x08);
        expect(result.payload).toStrictEqual({status: 0, len: 2, value: Buffer.from([0x01, 0x02])});
        expect(result.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(result.type).toBe(UnpiConstants.Type.SRSP);
    });

    it("znp request AREQ reset", async () => {
        const portWriteSpy = vi.spyOn(transport, "write").mockImplementationOnce(() => {
            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(
                    UnpiConstants.Type.AREQ,
                    UnpiConstants.Subsystem.SYS,
                    0x80,
                    Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]),
                ).toBuffer(),
            );

            return false;
        });

        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.request(UnpiConstants.Subsystem.SYS, "resetReq", {type: 1});

        expect(portWriteSpy).toHaveBeenCalledTimes(1);
        expect(portWriteSpy).toHaveBeenCalledWith(
            new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.SYS, 0x00, Buffer.from([0x01])).toBuffer(),
        );

        expect(result.command.name).toBe("resetInd");
        expect(result.command.ID).toBe(0x80);
        expect(result.payload).toStrictEqual({reason: 1, transportrev: 2, productid: 3, majorrel: 4, minorrel: 5, hwrev: 6});
        expect(result.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(result.type).toBe(UnpiConstants.Type.AREQ);
    });

    it("znp request AREQ", async () => {
        const portWriteSpy = vi.spyOn(transport, "write");
        await znp.open();
        requestSpy.mockRestore();

        const result = await znp.request(UnpiConstants.Subsystem.SAPI, "startConfirm", {status: 1});

        expect(portWriteSpy).toHaveBeenCalledTimes(1);
        expect(portWriteSpy).toHaveBeenCalledWith(
            new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.SAPI, 0x80, Buffer.from([0x01])).toBuffer(),
        );

        expect(result).toBe(undefined);
    });

    it("znp request without init", async () => {
        let error;
        requestSpy.mockRestore();

        try {
            await znp.request(UnpiConstants.Subsystem.SAPI, "startConfirm", {status: 1});
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(new Error("Cannot request when znp has not been initialized yet"));
    });

    it("znp request with non-existing subsystem", async () => {
        await znp.open();
        requestSpy.mockRestore();
        let error;

        try {
            await znp.request(999, "startConfirm", {status: 1});
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(new Error("Subsystem '999' does not exist"));
    });

    it("znp request with non-existing cmd", async () => {
        await znp.open();
        requestSpy.mockRestore();
        let error;

        try {
            await znp.request(UnpiConstants.Subsystem.SAPI, "nonExisting", {status: 1});
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(new Error("Command request 'nonExisting' from subsystem '6' not found"));
    });

    it("znp request timeout", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const result = znp.request(UnpiConstants.Subsystem.SYS, "osalNvRead", {id: 1, offset: 2});
        vi.runOnlyPendingTimers();

        let error;
        try {
            await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error("SRSP - SYS - osalNvRead after 6000ms"));
    });

    it("znp request timeout for startupFromApp is longer", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const result = znp.request(UnpiConstants.Subsystem.ZDO, "startupFromApp", {startdelay: 100});
        vi.advanceTimersByTime(30000);

        let error;
        try {
            vi.advanceTimersByTime(15000);
            await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error("SRSP - ZDO - startupFromApp after 40000ms"));
    });

    it("znp request, responses comes after timeout", async () => {
        await znp.open();
        requestSpy.mockRestore();

        let result = znp.request(UnpiConstants.Subsystem.SYS, "osalNvRead", {id: 1, offset: 2});
        vi.runOnlyPendingTimers();

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])).toBuffer(),
        );

        let error;
        try {
            result = await result;
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(new Error("SRSP - SYS - osalNvRead after 6000ms"));
    });

    it("znp request, waitFor", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, "osalNvRead", undefined, undefined, undefined);
        // biome-ignore lint/nursery/noFloatingPromises: ignore
        znp.request(UnpiConstants.Subsystem.SYS, "osalNvRead", {id: 1, offset: 2});

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])).toBuffer(),
        );

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({len: 2, status: 0, value: Buffer.from([1, 2])});
    });

    it("znp request ZDO", async () => {
        const portWriteSpy = vi.spyOn(transport, "write").mockImplementationOnce(() => {
            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 2, Buffer.from([0x00])).toBuffer(),
            );

            return false;
        });

        await znp.open();

        const zdoPayload = Buffer.from([2 & 0xff, (2 >> 8) & 0xff, ...Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 2)]);
        const result = await znp.requestZdo(Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, zdoPayload, 1);

        expect(portWriteSpy).toHaveBeenCalledTimes(1);
        expect(portWriteSpy).toHaveBeenCalledWith(new UnpiFrame(UnpiConstants.Type.SREQ, UnpiConstants.Subsystem.ZDO, 0x02, zdoPayload).toBuffer());

        expect(result).toBe(undefined);
    });

    it("znp request ZDO SUCCESS", async () => {
        await znp.open();

        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, "nodeDescReq", undefined, undefined, undefined);
        const zdoPayload = Buffer.from([2 & 0xff, (2 >> 8) & 0xff, ...Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 2)]);
        // biome-ignore lint/nursery/noFloatingPromises: ignore
        znp.requestZdo(Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, zdoPayload, 1);

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 2, Buffer.from([0x00])).toBuffer(),
        );

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({status: 0x00});
    });

    it("znp request ZDO FAILURE", async () => {
        vi.spyOn(transport, "write").mockImplementationOnce(() => {
            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 2, Buffer.from([0x01])).toBuffer(),
            );

            return false;
        });

        await znp.open();

        const zdoPayload = Buffer.from([2 & 0xff, (2 >> 8) & 0xff, ...Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 2)]);
        let error;
        try {
            await znp.requestZdo(Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, zdoPayload, undefined);
        } catch (e) {
            error = e;
        }

        expect(error).toStrictEqual(
            new Error(`--> 'SREQ: ZDO - NODE_DESCRIPTOR_REQUEST - ${zdoPayload.toString("hex")}' failed with status '(0x01: FAILURE)'`),
        );
    });

    it("znp request ZDO failed should cancel waiter when provided", async () => {
        vi.spyOn(transport, "write").mockImplementationOnce(() => {
            (transport.serialPortInstance!.port as MockPortBinding).emitData(
                new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.ZDO, 2, Buffer.from([0x01])).toBuffer(),
            );

            return false;
        });

        await znp.open();

        expect(znp.waitress.waiters.size).toBe(0);
        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, "nodeDescRsp", undefined, undefined, undefined);
        expect(znp.waitress.waiters.size).toBe(1);

        const zdoPayload = Buffer.from([2 & 0xff, (2 >> 8) & 0xff, ...Zdo.Buffalo.buildRequest(false, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 2)]);
        let error;
        try {
            await znp.requestZdo(Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, zdoPayload, waiter.ID);
        } catch (e) {
            expect(znp.waitress.waiters.size).toBe(0);
            error = e;
        }

        expect(error).toStrictEqual(
            new Error(`--> 'SREQ: ZDO - NODE_DESCRIPTOR_REQUEST - ${zdoPayload.toString("hex")}' failed with status '(0x01: FAILURE)'`),
        );
    });

    it("znp waitFor with transid", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.AF, "dataConfirm", undefined, 123, undefined);

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.AF, 128, Buffer.from([0, 1, 123])).toBuffer(),
        );

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({status: 0, endpoint: 1, transid: 123});
    });

    it("znp waitFor with target as network address", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, "activeEpRsp", 0x1234, undefined, undefined);

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 133, Buffer.from([0x34, 0x12, 0x00, 0x34, 0x12, 0x00])).toBuffer(),
        );

        const object = await waiter.start().promise;
        expect(object.payload.zdo).toStrictEqual([
            Zdo.Status.SUCCESS,
            {
                nwkAddress: 0x1234,
                endpointList: [],
            },
        ]);
    });

    it("znp waitFor with target as IEEE", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, "nwkAddrRsp", "0x0807060504030201", undefined, undefined);

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(
                UnpiConstants.Type.AREQ,
                UnpiConstants.Subsystem.ZDO,
                128,
                Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x01, 0x01, 0x00, 0x02, 0x10, 0x10, 0x11, 0x11]),
            ).toBuffer(),
        );

        const object = await waiter.start().promise;
        expect(object.payload.zdo).toStrictEqual([
            Zdo.Status.SUCCESS,
            {
                assocDevList: [4112, 4369],
                eui64: "0x0807060504030201",
                // numassocdev: 2,
                nwkAddress: 257,
                startIndex: 0,
            },
        ]);
    });

    it("znp waitFor with target as IEEE forced to timeout because invalid ZDO status (no payload to match against)", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp
            .waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, "nwkAddrRsp", "0x0807060504030201", undefined, undefined)
            .start();

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 128, Buffer.from([Zdo.Status.INVALID_INDEX])).toBuffer(),
        );

        vi.advanceTimersByTime(11000);
        await expect(waiter.promise).rejects.toThrow("AREQ - ZDO - nwkAddrRsp after 10000ms");
    });

    it("znp waitFor with state", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, "stateChangeInd", undefined, undefined, 9);

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 192, Buffer.from([9])).toBuffer(),
        );

        const object = await waiter.start().promise;
        expect(object.payload).toStrictEqual({state: 9});
    });

    it("znp waitFor with payload mismatch", async () => {
        await znp.open();
        requestSpy.mockRestore();

        const waiter = znp.waitFor(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, "osalNvRead", "abcd", undefined, undefined).start();

        (transport.serialPortInstance!.port as MockPortBinding).emitData(
            new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.SYS, 0x08, Buffer.from([0x00, 0x02, 0x01, 0x02])).toBuffer(),
        );

        vi.advanceTimersByTime(11000);
        await expect(waiter.promise).rejects.toThrow("SRSP - SYS - osalNvRead after 10000ms");
    });

    it("znp requestWithReply should throw error when request as no reply", async () => {
        await znp.open();

        try {
            await znp.requestWithReply(UnpiConstants.Subsystem.ZDO, "autoFindDestination", {});
        } catch (error) {
            expect(error).toStrictEqual(new Error("Command autoFindDestination has no reply"));
        }
    });

    it("ZpiObject throw error on missing write parser", () => {
        // @ts-expect-error; make sure we always get a new instance
        const obj = new ZpiObject(0, 0, "dummy", 0, {}, [{name: "nonExisting", parameterType: 9999999}]);
        expect(() => {
            obj.createPayloadBuffer();
        }).toThrow();
    });

    it("ZpiObject throw error on unknown command", () => {
        const frame = new UnpiFrame(UnpiConstants.Type.SREQ, UnpiConstants.Subsystem.AF, 99999, Buffer.alloc(0));
        expect(() => {
            ZpiObject.fromUnpiFrame(frame);
        }).toThrow();
    });

    it("ZpiObject throw error on unknown parameters", () => {
        const frame = new UnpiFrame(UnpiConstants.Type.SRSP, UnpiConstants.Subsystem.AF, 128, Buffer.alloc(0));
        expect(() => {
            ZpiObject.fromUnpiFrame(frame);
        }).toThrow();
    });

    it("ZpiObject with cmd and non sapi is not reset command", () => {
        // @ts-expect-error; make sure we always get a new instance
        const obj = new ZpiObject(UnpiConstants.Type.SREQ, UnpiConstants.Subsystem.AF, "systemReset", 0, {}, []);
        expect(obj.isResetCommand()).toBeFalsy();
    });

    it("ZpiObject parse payload for endDeviceAnnceInd", () => {
        const buffer = Buffer.from([0, 0, 0, 1, 1, 2, 3, 4, 5, 6, 7, 8, 5]);
        const frame = new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 193, buffer);
        const obj = ZpiObject.fromUnpiFrame(frame);
        expect(obj.payload.zdo).toStrictEqual([
            Zdo.Status.SUCCESS,
            {
                capabilities: {
                    allocateAddress: 0,
                    alternatePANCoordinator: 1,
                    deviceType: 0,
                    powerSource: 1,
                    reserved1: 0,
                    reserved2: 0,
                    rxOnWhenIdle: 0,
                    securityCapability: 0,
                },
                eui64: "0x0807060504030201",
                nwkAddress: 256,
            },
        ]);
    });

    it("ZpiObject parse payload for nwkAddrRsp", () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x01, 0x01, 0x00, 0x02, 0x10, 0x10, 0x11, 0x11]);
        const frame = new UnpiFrame(UnpiConstants.Type.AREQ, UnpiConstants.Subsystem.ZDO, 128, buffer);
        const obj = ZpiObject.fromUnpiFrame(frame);
        expect(obj.payload.zdo).toStrictEqual([
            Zdo.Status.SUCCESS,
            {
                assocDevList: [4112, 4369],
                eui64: "0x0807060504030201",
                // numassocdev: 2,
                nwkAddress: 257,
                startIndex: 0,
            },
        ]);
    });

    it("Cant read unsupported type", () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(0));
            // @ts-expect-error invalid typing
            buffalo.read(9999, {});
        }).toThrow(new Error("Read for '9999' not available"));
    });

    it("UINT8 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(3), 1);
        buffalo.write(ParameterType.UINT8, 240, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xf0, 0x00]));
    });

    it("UINT8 read", () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x03, 0x00, 0x00]), 1);
        const value = buffalo.read(ParameterType.UINT8, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(3);
    });

    it("INT8 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(3), 1);
        buffalo.write(ParameterType.INT8, 127, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x7f, 0x00]));
    });

    it("INT8 read", () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0xf0, 0x00, 0x00]), 1);
        const value = buffalo.read(ParameterType.INT8, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(-16);
    });

    it("UINT16 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(3), 1);
        buffalo.write(ParameterType.UINT16, 1020, {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xfc, 0x03]));
    });

    it("UINT16 read", () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x03, 0xff, 0x00]), 1);
        const value = buffalo.read(ParameterType.UINT16, {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(65283);
    });

    it("UINT32 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(6), 2);
        buffalo.write(ParameterType.UINT32, 1065283, {});
        expect(buffalo.getPosition()).toEqual(6);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]));
    });

    it("UINT32 read", () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x01, 0x03, 0xff, 0xff]));
        const value = buffalo.read(ParameterType.UINT32, {});
        expect(buffalo.getPosition()).toEqual(4);
        expect(value).toStrictEqual(4294902529);
    });

    it("LIST_UINT8 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(4), 1);
        const payload = [200, 100];
        buffalo.write(ParameterType.LIST_UINT8, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xc8, 0x64, 0x00]));
    });

    it("LIST_UINT8 read", () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x00, 0x04, 0x08]), 2);
        const value = buffalo.read(ParameterType.LIST_UINT8, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual([4, 8]);
    });

    it("LIST_UINT16 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(5), 1);
        const payload = [1024, 2048];
        buffalo.write(ParameterType.LIST_UINT16, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(5);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]));
    });

    it("LIST_UINT16 read", () => {
        const buffalo = new BuffaloZnp(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]), 1);
        const value = buffalo.read(ParameterType.LIST_UINT16, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(5);
        expect(value).toStrictEqual([1024, 2048]);
    });

    it("LIST_NETWORK write", () => {
        expect(() => {
            const buffalo = new BuffaloZnp(Buffer.alloc(10));
            buffalo.write(ParameterType.LIST_NETWORK, [], {});
        }).toThrow();
    });

    it("LIST_NETWORK read", () => {
        const buffer = Buffer.from([0x05, 0x10, 0x10, 0x09, 0x31, 0x13, 0x01, 0x10, 0x10, 0x09, 0x31, 0x13, 0x00, 0x01]);

        const buffalo = new BuffaloZnp(buffer, 1);
        const value = buffalo.read(ParameterType.LIST_NETWORK, {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(13);
        expect(value).toStrictEqual([
            {
                beaconOrder: 3,
                logicalChannel: 9,
                neightborPanId: 4112,
                permitJoin: 1,
                stackProfile: 1,
                superFrameOrder: 1,
                zigbeeVersion: 3,
            },
            {
                beaconOrder: 3,
                logicalChannel: 9,
                neightborPanId: 4112,
                permitJoin: 0,
                stackProfile: 1,
                superFrameOrder: 1,
                zigbeeVersion: 3,
            },
        ]);
    });

    it("BUFFER8 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(9), 1);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        buffalo.write(ParameterType.BUFFER8, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(9);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload]));
    });

    it("BUFFER8 write length consistent", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(9));
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
        expect(() => {
            buffalo.write(ParameterType.BUFFER8, payload, {});
        }).toThrow();
    });

    it("BUFFER8 read", () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const buffalo = new BuffaloZnp(buffer, 2);
        const value = buffalo.read(ParameterType.BUFFER8, {});
        expect(buffalo.getPosition()).toEqual(10);
        expect(value).toStrictEqual(buffer.subarray(2, 11));
    });

    it("BUFFER16 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(20), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write(ParameterType.BUFFER16, Buffer.from([...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(17);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00, 0x00, 0x00]));
    });

    it("BUFFER16 read", () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload]), 1);
        const value = buffalo.read(ParameterType.BUFFER16, {});
        expect(buffalo.getPosition()).toEqual(17);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it("BUFFER18 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(20), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        buffalo.write(ParameterType.BUFFER18, Buffer.from([...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(19);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00]));
    });

    it("BUFFER18 read", () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload]), 1);
        const value = buffalo.read(ParameterType.BUFFER18, {});
        expect(buffalo.getPosition()).toStrictEqual(19);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it("BUFFER32 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(34), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write(ParameterType.BUFFER32, Buffer.from([...payload, ...payload, ...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(33);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, 0x00]));
    });

    it("BUFFER32 read", () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload]), 1);
        const value = buffalo.read(ParameterType.BUFFER32, {});
        expect(buffalo.getPosition()).toStrictEqual(33);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload]));
    });

    it("BUFFER42 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(44), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write(ParameterType.BUFFER42, Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xff]), {});
        expect(buffalo.getPosition()).toStrictEqual(43);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xff, 0x00]));
    });

    it("BUFFER42 read", () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]), 1);
        const value = buffalo.read(ParameterType.BUFFER42, {});
        expect(buffalo.getPosition()).toStrictEqual(43);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]));
    });

    it("BUFFER100 write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(100), 0);
        const payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);
        buffalo.write(ParameterType.BUFFER100, Buffer.from(payload), {});
        expect(buffalo.getPosition()).toStrictEqual(100);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(payload));
    });

    it("BUFFER100 read", () => {
        const payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);
        const buffalo = new BuffaloZnp(Buffer.from([0x00, ...payload]), 1);
        const value = buffalo.read(ParameterType.BUFFER100, {});
        expect(buffalo.getPosition()).toStrictEqual(101);
        expect(value).toStrictEqual(Buffer.from(payload));
    });

    it("BUFFER write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(9), 1);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        buffalo.write(ParameterType.BUFFER, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(9);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload]));
    });

    it("BUFFER read", () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const buffalo = new BuffaloZnp(buffer, 2);
        const value = buffalo.read(ParameterType.BUFFER, {length: 1});
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(buffer.subarray(2, 3));
    });

    it("IEEEADDR write", () => {
        const buffalo = new BuffaloZnp(Buffer.alloc(8));
        buffalo.write(ParameterType.IEEEADDR, ieeeaAddr1.string, {});
        expect(buffalo.getPosition()).toEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(ieeeaAddr1.hex));
    });

    it("IEEEADDR read", () => {
        const buffalo = new BuffaloZnp(Buffer.from(ieeeaAddr2.hex));
        const value = buffalo.read(ParameterType.IEEEADDR, {});
        expect(buffalo.getPosition()).toEqual(8);
        expect(value).toStrictEqual(ieeeaAddr2.string);
    });

    it.each([ParameterType.BUFFER, ParameterType.LIST_UINT8, ParameterType.LIST_UINT16, ParameterType.LIST_NETWORK])(
        "Throws when read is missing required length option - param %s",
        (type) => {
            expect(() => {
                const buffalo = new BuffaloZnp(Buffer.alloc(1));
                buffalo.read(type, {});
            }).toThrow(`Cannot read ${ParameterType[type]} without length option specified`);
        },
    );

    it("Parse simple message", async () => {
        const buffer = Buffer.from([
            0xfe, 0x0e, 0x61, 0x02, 0x02, 0x00, 0x02, 0x06, 0x03, 0xd9, 0x14, 0x34, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x92,
        ]);
        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);
        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer);
        await flushPromises();
        expect(received).toHaveBeenCalledTimes(1);

        const obj = received.mock.calls[0][0];
        expect(obj.type).toBe(Constants.Type.SRSP);
        expect(obj.subsystem).toBe(Constants.Subsystem.SYS);
        expect(obj.command.ID).toBe(2);
        expect(obj.payload).toStrictEqual({transportrev: 2, product: 0, majorrel: 2, minorrel: 6, maintrel: 3, revision: 20190425});
    });

    it("Parse two messages", async () => {
        const buffer = Buffer.from([
            0xfe, 0x0e, 0x61, 0x02, 0x02, 0x00, 0x02, 0x06, 0x03, 0xd9, 0x14, 0x34, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x92, 0xfe, 0x03, 0x61, 0x08,
            0x00, 0x01, 0x55, 0x3e,
        ]);
        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);
        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer);
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(2);
        const obj1 = received.mock.calls[0][0];
        const obj2 = received.mock.calls[1][0];
        expect(obj1.type).toBe(Constants.Type.SRSP);
        expect(obj1.subsystem).toBe(Constants.Subsystem.SYS);
        expect(obj1.command.ID).toBe(2);
        expect(obj1.payload).toStrictEqual({transportrev: 2, product: 0, majorrel: 2, minorrel: 6, maintrel: 3, revision: 20190425});
        expect(obj2.type).toBe(Constants.Type.SRSP);
        expect(obj2.subsystem).toBe(Constants.Subsystem.SYS);
        expect(obj2.command.ID).toBe(8);
        expect(obj2.payload).toStrictEqual({status: 0, len: 1, value: Buffer.from([0x55])});
    });

    it("Dont throw error on fcs mismatch", async () => {
        const buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01, 0x55, 0x3f]);
        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);
        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer);
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(0);
    });

    it("Message in two chunks", async () => {
        let buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01]);
        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);
        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer);
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(0);

        buffer = Buffer.from([0x55, 0x3e]);

        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer);
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(1);

        const obj = received.mock.calls[0][0];

        expect(obj.type).toBe(Constants.Type.SRSP);
        expect(obj.subsystem).toBe(Constants.Subsystem.SYS);
        expect(obj.command.ID).toBe(8);
        expect(obj.payload).toStrictEqual({status: 0, len: 1, value: Buffer.from([0x55])});
    });

    it("Message in two chunks, fcs as separate", async () => {
        let buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01, 0x55]);
        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);
        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer);
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(0);

        buffer = Buffer.from([0x3e]);

        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer);
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(1);

        const obj = received.mock.calls[0][0];

        expect(obj.type).toBe(Constants.Type.SRSP);
        expect(obj.subsystem).toBe(Constants.Subsystem.SYS);
        expect(obj.command.ID).toBe(8);
        expect(obj.payload).toStrictEqual({status: 0, len: 1, value: Buffer.from([0x55])});
    });

    it("Parse message when it doenst start with SOF and buffer is empty (throw away everything until SOF)", async () => {
        const buffer = Buffer.from([
            95, 27, 37, 254, 3, 69, 196, 212, 23, 0, 65, 254, 27, 68, 129, 0, 0, 8, 0, 212, 23, 1, 1, 0, 55, 0, 153, 178, 219, 0, 0, 7, 8, 122, 10, 0,
            0, 32, 243, 212, 23, 29, 160, 254, 7, 69, 196, 111, 244, 2, 122, 155, 246, 95, 87, 254, 27, 68, 129, 0, 0, 6, 0, 111, 244, 1, 1, 0, 118,
            0, 245, 236, 220, 0, 0, 7, 8, 2, 10, 0, 0, 16, 0, 246, 95, 27, 85,
        ]);
        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);
        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer);
        await flushPromises();

        const obj1 = received.mock.calls[0][0];
        const obj2 = received.mock.calls[1][0];

        expect(received).toHaveBeenCalledTimes(4);

        expect(obj1.type).toBe(Constants.Type.AREQ);
        expect(obj1.subsystem).toBe(Constants.Subsystem.ZDO);
        expect(obj1.command.ID).toBe(196);
        expect(obj1.payload).toStrictEqual({dstaddr: 6100, relaycount: 0, relaylist: []});
        expect(obj2.type).toBe(Constants.Type.AREQ);
        expect(obj2.subsystem).toBe(Constants.Subsystem.AF);
        expect(obj2.command.ID).toBe(129);
        expect(obj2.payload).toStrictEqual({
            groupid: 0,
            clusterid: 8,
            srcaddr: 6100,
            srcendpoint: 1,
            dstendpoint: 1,
            wasbroadcast: 0,
            linkquality: 55,
            securityuse: 0,
            timestamp: 14398105,
            transseqnumber: 0,
            len: 7,
            data: Buffer.from([0x08, 0x7a, 0x0a, 0x00, 0x00, 0x20, 0xf3]),
        });
    });

    it("Continue parsing on fcs mismatch", async () => {
        const buffer1 = Buffer.from([
            0x01,
            0x02,
            0xfe,
            0x03,
            0x61,
            0x08,
            0x00,
            0x01,
            0x55,
            0x3f, // fcs mismatch
            0x08,
            0x09,
            0x12, // Noise
        ]);
        const buffer2 = Buffer.from([
            0x08,
            0x09,
            0x12, // Noise
        ]);
        const buffer3 = Buffer.from([
            0x08,
            0x09,
            0x12, // Noise
            0xfe,
            0x0e,
            0x61,
            0x02, // Valid message part 1
        ]);
        const buffer4 = Buffer.from([
            0x02,
            0x00,
            0x02,
            0x06,
            0x03,
            0xd9,
            0x14,
            0x34,
            0x01,
            0x02,
            0x00,
            0x00,
            0x00,
            0x00,
            0x92, // Valid message part 2
        ]);

        const received: Mock<(obj: ZpiObject<"Response">) => void> = vi.fn();

        znp.on("received", received);
        await znp.open();
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer1);
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer2);
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer3);
        (transport.serialPortInstance!.port as MockPortBinding).emitData(buffer4);
        await flushPromises();

        expect(received).toHaveBeenCalledTimes(1);

        const obj = received.mock.calls[0][0];

        expect(obj.type).toBe(Constants.Type.SRSP);
        expect(obj.subsystem).toBe(Constants.Subsystem.SYS);
        expect(obj.command.ID).toBe(2);
        expect(obj.payload).toStrictEqual({transportrev: 2, product: 0, majorrel: 2, minorrel: 6, maintrel: 3, revision: 20190425});
    });

    it("To buffer", () => {
        const frame = new UnpiFrame(Constants.Type.SRSP, Constants.Subsystem.SYS, 3, Buffer.from([0x06, 0x01]));
        const buffer = frame.toBuffer();
        expect(buffer).toStrictEqual(Buffer.from([0xfe, 0x02, 0x61, 0x03, 0x06, 0x01, 0x67]));
        expect(frame.toString()).toStrictEqual("undefined - 3 - 1 - 3 - [6,1] - undefined");
    });
});
