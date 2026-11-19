// biome-ignore assist/source/organizeImports: mock
import {currentMockPort, emitSerialPortData} from "../../mockSerialPort";

import type {MockInstance} from "vitest";
import {afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {EzspStatus} from "../../../src/adapter/ember/enums";
import {Ezsp} from "../../../src/adapter/ember/ezsp/ezsp";
import {AdapterTransport} from "../../../src/adapter/transport";
import {
    ASH_ACK_FIRST_BYTES,
    INCOMING_MESSAGE_HANDLER_FN2_ASH_RAW,
    MESSAGE_SENT_HANDLER_FN0_ASH_RAW,
    MESSAGE_SENT_HANDLER_FN1_ASH_RAW,
    RCED_DATA_VERSION,
    RCED_DATA_VERSION_RES,
    RCED_DATA_WITH_CRC_ERROR,
    RCED_ERROR_WATCHDOG_BYTES,
    RECD_ERROR_ACK_TIMEOUT_BYTES,
    RECD_RSTACK_BYTES,
    SEND_ACK_FIRST_BYTES,
    SEND_DATA_VERSION,
    SEND_RST_BYTES,
    SEND_UNICAST_REPLY_FN0_ASH_RAW,
    SET_POLICY_REPLY_FN1_ASH_RAW,
} from "./consts";

const advanceTime100ms = async (times: number): Promise<void> => {
    for (let i = 0; i < times; i++) {
        await vi.advanceTimersByTimeAsync(100);
    }
};

const advanceTimeToRSTACK = async (): Promise<void> => {
    // mock time waited for real RSTACK (avg time of 1100ms)
    await advanceTime100ms(10);
};

const ADAPTER_PATH = "/dev/ttyACM0";

describe("Ember Ezsp Layer", () => {
    let transport: AdapterTransport;
    let ezsp: Ezsp;

    beforeAll(() => {
        vi.useRealTimers();
    });

    afterAll(() => {});

    beforeEach(() => {
        transport = new AdapterTransport({path: ADAPTER_PATH, baudRate: 100, rtscts: true});
        ezsp = new Ezsp(transport);
        vi.useFakeTimers();
    });

    afterEach(async () => {
        vi.useRealTimers();
        await ezsp.stop();
    });

    it("Starts ASH layer normally", async () => {
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
        await vi.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);

        const port = currentMockPort();
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it("Starts ASH layer ignoring noise from port", async () => {
        const ashEmitSpy = vi.spyOn(ezsp.ash, "emit");
        // @ts-expect-error private
        const onAshFatalErrorSpy = vi.spyOn(ezsp, "onAshFatalError");
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        await emitSerialPortData(RCED_DATA_WITH_CRC_ERROR);
        await advanceTimeToRSTACK();
        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
        await vi.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);

        const port = currentMockPort();
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(ezsp.checkConnection()).toBeTruthy();
        expect(ezsp.ash.counters.rxCrcErrors).toStrictEqual(1);
        expect(ashEmitSpy).not.toHaveBeenCalled();
        expect(onAshFatalErrorSpy).not.toHaveBeenCalled();
    });

    it("Starts ASH layer even when received ERROR from port", async () => {
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        await emitSerialPortData(Buffer.from(RECD_ERROR_ACK_TIMEOUT_BYTES));
        await advanceTimeToRSTACK();
        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
        await vi.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        const port = currentMockPort();
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it("Starts ASH layer when received ERROR RESET_WATCHDOG from port", async () => {
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        await emitSerialPortData(Buffer.from(RCED_ERROR_WATCHDOG_BYTES));
        await advanceTimeToRSTACK();
        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
        await vi.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        const port = currentMockPort();
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it("Starts ASH layer when received duplicate RSTACK from port right after first ACK", async () => {
        const ashEmitSpy = vi.spyOn(ezsp.ash, "emit");
        let restart: (() => Promise<EzspStatus>) | undefined;
        // @ts-expect-error private
        const onAshFatalErrorSpy = vi.spyOn(ezsp, "onAshFatalError").mockImplementationOnce((_status: EzspStatus): void => {
            // mimic EmberAdapter onNcpNeedsResetAndInit
            restart = async () => {
                vi.useRealTimers();
                await ezsp.stop();
                vi.useFakeTimers();

                ezsp = new Ezsp(transport);
                const startResult = ezsp.start();

                await advanceTimeToRSTACK();
                await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
                await vi.advanceTimersByTimeAsync(1000);
                return await Promise.resolve(startResult);
            };
        });
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
        await vi.advanceTimersByTimeAsync(1000);

        const port = currentMockPort();
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        expect(ezsp.checkConnection()).toBeTruthy();

        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES)); // dup is received
        await vi.advanceTimersByTimeAsync(1000);
        expect(ezsp.checkConnection()).toBeFalsy();
        expect(restart).toBeDefined();
        await expect(restart?.()).resolves.toStrictEqual(EzspStatus.SUCCESS);
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(ashEmitSpy).toHaveBeenCalledWith("fatalError", EzspStatus.HOST_FATAL_ERROR);
        expect(onAshFatalErrorSpy).toHaveBeenCalledWith(EzspStatus.HOST_FATAL_ERROR);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it("Starts ASH layer with messy hardware flow control", async () => {
        // https://github.com/Koenkk/zigbee-herdsman/issues/943
        const ashEmitSpy = vi.spyOn(ezsp.ash, "emit");
        let restart: (() => Promise<EzspStatus>) | undefined;
        // @ts-expect-error private
        const onAshFatalErrorSpy = vi.spyOn(ezsp, "onAshFatalError").mockImplementationOnce((_status: EzspStatus): void => {
            // mimic EmberAdapter onNcpNeedsResetAndInit
            restart = async () => {
                vi.useRealTimers();
                await ezsp.stop();
                vi.useFakeTimers();

                ezsp = new Ezsp(transport);
                const startResult = ezsp.start();

                await advanceTimeToRSTACK();
                await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
                await vi.advanceTimersByTimeAsync(1000);
                return await Promise.resolve(startResult);
            };
        });
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        await emitSerialPortData(Buffer.from(RCED_ERROR_WATCHDOG_BYTES));
        await advanceTimeToRSTACK();
        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
        await vi.advanceTimersByTimeAsync(1000);

        const port = currentMockPort();
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));

        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        expect(ezsp.checkConnection()).toBeTruthy();

        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES)); // dup is received
        await vi.advanceTimersByTimeAsync(1000);
        expect(ezsp.checkConnection()).toBeFalsy();
        expect(restart).toBeDefined();
        await expect(restart?.()).resolves.toStrictEqual(EzspStatus.SUCCESS);
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(ashEmitSpy).toHaveBeenCalledWith("fatalError", EzspStatus.HOST_FATAL_ERROR);
        expect(onAshFatalErrorSpy).toHaveBeenCalledWith(EzspStatus.HOST_FATAL_ERROR);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it("Restarts ASH layer when received ERROR from port", async () => {
        let restart: (() => Promise<EzspStatus>) | undefined;
        const emitSpy = vi.spyOn(ezsp, "emit");
        // @ts-expect-error private
        const onAshFatalErrorSpy = vi.spyOn(ezsp, "onAshFatalError").mockImplementationOnce((status: EzspStatus): void => {
            // mimic EmberAdapter onNcpNeedsResetAndInit
            restart = async () => {
                vi.useRealTimers();
                await ezsp.stop();
                vi.useFakeTimers();

                ezsp = new Ezsp(transport);
                const startResult = ezsp.start();

                await advanceTimeToRSTACK();
                await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
                await vi.advanceTimersByTimeAsync(1000);
                return await Promise.resolve(startResult);
            };
            // @ts-expect-error private
            ezsp.onAshFatalError(status);
        });
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
        await vi.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        const port = currentMockPort();
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(ezsp.checkConnection()).toBeTruthy();
        // started clean

        const version = ezsp.ezspVersion(13);

        await vi.advanceTimersByTimeAsync(1000);
        await emitSerialPortData(RCED_DATA_VERSION);
        await vi.advanceTimersByTimeAsync(1000);
        await expect(version).resolves.toStrictEqual(RCED_DATA_VERSION_RES);
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(3, Buffer.from(SEND_DATA_VERSION));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(4, Buffer.from(SEND_ACK_FIRST_BYTES));

        await vi.advanceTimersByTimeAsync(10000); // any time after startup sequence

        await emitSerialPortData(Buffer.from(RECD_ERROR_ACK_TIMEOUT_BYTES));
        await vi.advanceTimersByTimeAsync(1000);
        expect(ezsp.checkConnection()).toBeFalsy();
        expect(restart).toBeDefined();
        await expect(restart?.()).resolves.toStrictEqual(EzspStatus.SUCCESS);
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(onAshFatalErrorSpy).toHaveBeenCalledWith(EzspStatus.ASH_NCP_FATAL_ERROR);
        expect(emitSpy).toHaveBeenCalledWith("ncpNeedsResetAndInit", EzspStatus.ASH_NCP_FATAL_ERROR);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it("Throws on send command with ASH connection problem", async () => {
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
        await vi.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        const port = currentMockPort();
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(1, Buffer.from(SEND_RST_BYTES));
        expect(vi.mocked(port.write)).toHaveBeenNthCalledWith(2, Buffer.from(ASH_ACK_FIRST_BYTES));
        expect(ezsp.checkConnection()).toBeTruthy();
        // started clean

        // mimic error that doesn't trigger FATAL_ERROR event
        await ezsp.ash.stop();

        await expect(ezsp.ezspVersion(13)).rejects.toThrow(EzspStatus[EzspStatus.NOT_CONNECTED]);
    });

    describe("When connected", () => {
        let callbackDispatchSpy: MockInstance;
        const mockResponseWaiterResolve = vi.fn();
        let ashSendExecSpy: MockInstance;

        beforeEach(async () => {
            const startResult = ezsp.start();

            await advanceTimeToRSTACK();
            await emitSerialPortData(Buffer.from(RECD_RSTACK_BYTES));
            await vi.advanceTimersByTimeAsync(1000);
            await startResult;
            expect(ezsp.checkConnection()).toBeTruthy();

            callbackDispatchSpy = vi.spyOn(ezsp, "callbackDispatch").mockImplementation(vi.fn());
            ashSendExecSpy = vi.spyOn(ezsp.ash, "sendExec");

            mockResponseWaiterResolve.mockClear();
        });

        it("Parses successive valid incoming frames", async () => {
            // @ts-expect-error private
            ezsp.responseWaiter = {timer: setTimeout(() => {}, 15000), resolve: mockResponseWaiterResolve};

            await emitSerialPortData(Buffer.from(SEND_UNICAST_REPLY_FN0_ASH_RAW, "hex"));
            await vi.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(0);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledWith(EzspStatus.SUCCESS);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(1);

            await emitSerialPortData(Buffer.from(MESSAGE_SENT_HANDLER_FN1_ASH_RAW, "hex"));
            await vi.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]`);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(2);

            await emitSerialPortData(Buffer.from(INCOMING_MESSAGE_HANDLER_FN2_ASH_RAW, "hex"));
            await vi.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(2);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=69:"INCOMING_MESSAGE_HANDLER" Seq=39 Len=42]`);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(3);
        });

        it("Parses valid incoming callback frame while waiting for response frame", async () => {
            // @ts-expect-error private
            ezsp.responseWaiter = {timer: setTimeout(() => {}, 15000), resolve: mockResponseWaiterResolve};

            await emitSerialPortData(Buffer.from(MESSAGE_SENT_HANDLER_FN0_ASH_RAW, "hex"));
            await vi.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(0);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]`);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=0:"VERSION" Seq=0 Len=0]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(1);

            await emitSerialPortData(Buffer.from(SET_POLICY_REPLY_FN1_ASH_RAW, "hex"));
            await vi.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledWith(EzspStatus.SUCCESS);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=85:"SET_POLICY" Seq=79 Len=9]`);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(2);
        });

        it("Parses invalid incoming frame", async () => {
            vi.spyOn(ezsp, "validateReceivedFrame").mockReturnValueOnce(EzspStatus.ERROR_WRONG_DIRECTION);

            // @ts-expect-error private
            ezsp.responseWaiter = {timer: setTimeout(() => {}, 15000), resolve: mockResponseWaiterResolve};

            await emitSerialPortData(Buffer.from(SEND_UNICAST_REPLY_FN0_ASH_RAW, "hex"));
            await vi.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(0);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledWith(EzspStatus.ERROR_WRONG_DIRECTION);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(1);
        });

        it("Parses invalid incoming callback frame", async () => {
            vi.spyOn(ezsp, "validateReceivedFrame").mockReturnValueOnce(EzspStatus.ERROR_WRONG_DIRECTION);

            await emitSerialPortData(Buffer.from(MESSAGE_SENT_HANDLER_FN0_ASH_RAW, "hex"));
            await vi.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(0);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(0);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]`);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=0:"VERSION" Seq=0 Len=0]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(1);
        });
    });
});
