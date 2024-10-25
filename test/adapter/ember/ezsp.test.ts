import {MockBinding, MockPortBinding} from '@serialport/binding-mock';
import {OpenOptions} from '@serialport/stream';

import {EzspStatus} from '../../../src/adapter/ember/enums';
import {Ezsp} from '../../../src/adapter/ember/ezsp/ezsp';
import {logger} from '../../../src/utils/logger';
import {
    adapterSONOFFDongleE,
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
} from './consts';

const emitFromSerial = async (ezsp: Ezsp, data: Buffer, skipAdvanceTimers: boolean = false): Promise<void> => {
    //@ts-expect-error private
    ezsp.ash.serialPort.port.emitData(Buffer.from(data));

    if (!skipAdvanceTimers) {
        await jest.advanceTimersByTimeAsync(1000);
    }
};

const advanceTime100ms = async (times: number): Promise<void> => {
    for (let i = 0; i < times; i++) {
        await jest.advanceTimersByTimeAsync(100);
    }
};

const advanceTimeToRSTACK = async (): Promise<void> => {
    // mock time waited for real RSTACK (avg time of 1100ms)
    await advanceTime100ms(10);
};

const POST_RSTACK_SERIAL_BYTES = Buffer.from([...SEND_RST_BYTES, ...ASH_ACK_FIRST_BYTES]);
const mocks: jest.Mock[] = [];

describe('Ember Ezsp Layer', () => {
    const openOpts: OpenOptions<MockPortBinding> = {path: '/dev/ttyACM0', baudRate: 115200, binding: MockBinding};
    let ezsp: Ezsp;

    beforeAll(async () => {
        jest.useRealTimers();
    });

    afterAll(async () => {});

    beforeEach(async () => {
        for (const mock of mocks) {
            mock.mockClear();
        }

        ezsp = new Ezsp(openOpts);
        MockBinding.createPort('/dev/ttyACM0', {record: true, ...adapterSONOFFDongleE});
        jest.useFakeTimers();
    });

    afterEach(async () => {
        jest.useRealTimers();
        await ezsp.stop();
        MockBinding.reset();
    });

    it('Starts ASH layer normally', async () => {
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it('Starts ASH layer ignoring noise from port', async () => {
        const ashEmitSpy = jest.spyOn(ezsp.ash, 'emit');
        // @ts-expect-error private
        const onAshFatalErrorSpy = jest.spyOn(ezsp, 'onAshFatalError');
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        await emitFromSerial(ezsp, RCED_DATA_WITH_CRC_ERROR, true);
        await advanceTimeToRSTACK();
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ezsp.checkConnection()).toBeTruthy();
        expect(ezsp.ash.counters.rxCrcErrors).toStrictEqual(1);
        expect(ashEmitSpy).not.toHaveBeenCalled();
        expect(onAshFatalErrorSpy).not.toHaveBeenCalled();
    });

    it('Starts ASH layer even when received ERROR from port', async () => {
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        await emitFromSerial(ezsp, Buffer.from(RECD_ERROR_ACK_TIMEOUT_BYTES), true);
        await advanceTimeToRSTACK();
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it('Starts ASH layer when received ERROR RESET_WATCHDOG from port', async () => {
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        await emitFromSerial(ezsp, Buffer.from(RCED_ERROR_WATCHDOG_BYTES), true);
        await advanceTimeToRSTACK();
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it('Starts ASH layer when received duplicate RSTACK from port right after first ACK', async () => {
        const ashEmitSpy = jest.spyOn(ezsp.ash, 'emit');
        let restart: Promise<EzspStatus>;
        // @ts-expect-error private
        const onAshFatalErrorSpy = jest.spyOn(ezsp, 'onAshFatalError').mockImplementationOnce((status: EzspStatus): void => {
            // mimic EmberAdapter onNcpNeedsResetAndInit
            restart = new Promise(async (resolve) => {
                jest.useRealTimers();
                await ezsp.stop();
                jest.useFakeTimers();

                ezsp = new Ezsp(openOpts);
                const startResult = ezsp.start();

                await advanceTimeToRSTACK();
                await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
                resolve(startResult);
            });
        });
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS); // dup is received after this returns
        expect(ezsp.checkConnection()).toBeFalsy();
        // @ts-expect-error set via emit
        expect(restart).toBeDefined();
        // @ts-expect-error set via emit
        await expect(restart).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ashEmitSpy).toHaveBeenCalledWith('fatalError', EzspStatus.HOST_FATAL_ERROR);
        expect(onAshFatalErrorSpy).toHaveBeenCalledWith(EzspStatus.HOST_FATAL_ERROR);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it('Starts ASH layer with messy hardware flow control', async () => {
        // https://github.com/Koenkk/zigbee-herdsman/issues/943
        const ashEmitSpy = jest.spyOn(ezsp.ash, 'emit');
        let restart: Promise<EzspStatus>;
        // @ts-expect-error private
        const onAshFatalErrorSpy = jest.spyOn(ezsp, 'onAshFatalError').mockImplementationOnce((status: EzspStatus): void => {
            // mimic EmberAdapter onNcpNeedsResetAndInit
            restart = new Promise(async (resolve) => {
                jest.useRealTimers();
                await ezsp.stop();
                jest.useFakeTimers();

                ezsp = new Ezsp(openOpts);
                const startResult = ezsp.start();

                await advanceTimeToRSTACK();
                await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
                resolve(startResult);
            });
        });
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        await emitFromSerial(ezsp, Buffer.from(RCED_ERROR_WATCHDOG_BYTES), true);
        await advanceTimeToRSTACK();
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS); // dup is received after this returns
        expect(ezsp.checkConnection()).toBeFalsy();
        // @ts-expect-error set via emit
        expect(restart).toBeDefined();
        // @ts-expect-error set via emit
        await expect(restart).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ashEmitSpy).toHaveBeenCalledWith('fatalError', EzspStatus.HOST_FATAL_ERROR);
        expect(onAshFatalErrorSpy).toHaveBeenCalledWith(EzspStatus.HOST_FATAL_ERROR);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it('Restarts ASH layer when received ERROR from port', async () => {
        let restart: Promise<EzspStatus>;
        // @ts-expect-error private
        const onAshFatalErrorSpy = jest.spyOn(ezsp, 'onAshFatalError').mockImplementationOnce((status: EzspStatus): void => {
            // mimic EmberAdapter onNcpNeedsResetAndInit
            restart = new Promise(async (resolve) => {
                jest.useRealTimers();
                await ezsp.stop();
                jest.useFakeTimers();

                ezsp = new Ezsp(openOpts);
                const startResult = ezsp.start();

                await advanceTimeToRSTACK();
                await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
                resolve(startResult);
            });
        });
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ezsp.checkConnection()).toBeTruthy();
        // started clean

        const version = ezsp.ezspVersion(13);

        await jest.advanceTimersByTimeAsync(1000);
        await emitFromSerial(ezsp, RCED_DATA_VERSION);
        await jest.advanceTimersByTimeAsync(1000);
        await expect(version).resolves.toStrictEqual(RCED_DATA_VERSION_RES);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(
            Buffer.from([...POST_RSTACK_SERIAL_BYTES, ...SEND_DATA_VERSION, ...SEND_ACK_FIRST_BYTES]),
        );

        await jest.advanceTimersByTimeAsync(10000); // any time after startup sequence

        await emitFromSerial(ezsp, Buffer.from(RECD_ERROR_ACK_TIMEOUT_BYTES));
        expect(ezsp.checkConnection()).toBeFalsy();
        // @ts-expect-error set via emit
        expect(restart).toBeDefined();
        // @ts-expect-error set via emit
        await expect(restart).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(onAshFatalErrorSpy).toHaveBeenCalledWith(EzspStatus.HOST_FATAL_ERROR);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it('Throws on send command with ASH connection problem', async () => {
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ezsp.checkConnection()).toBeTruthy();
        // started clean

        // mimic error that doesn't trigger FATAL_ERROR event
        ezsp.ash.stop();

        expect(async () => {
            await ezsp.ezspVersion(13);
        }).rejects.toStrictEqual(EzspStatus[EzspStatus.NOT_CONNECTED]);
    });

    describe('When connected', () => {
        let callbackDispatchSpy: jest.SpyInstance;
        let mockResponseWaiterResolve = jest.fn();
        let ashSendExecSpy: jest.SpyInstance;

        beforeEach(async () => {
            const startResult = ezsp.start();

            await advanceTimeToRSTACK();
            await emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
            await startResult;
            expect(ezsp.checkConnection()).toBeTruthy();

            callbackDispatchSpy = jest.spyOn(ezsp, 'callbackDispatch').mockImplementation(jest.fn());
            ashSendExecSpy = jest.spyOn(ezsp.ash, 'sendExec');

            mockResponseWaiterResolve.mockClear();
        });

        it('Parses successive valid incoming frames', async () => {
            // @ts-expect-error private
            ezsp.responseWaiter = {timer: setTimeout(() => {}, 15000), resolve: mockResponseWaiterResolve};

            await emitFromSerial(ezsp, Buffer.from(SEND_UNICAST_REPLY_FN0_ASH_RAW, 'hex'));
            await jest.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(0);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledWith(EzspStatus.SUCCESS);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(1);

            await emitFromSerial(ezsp, Buffer.from(MESSAGE_SENT_HANDLER_FN1_ASH_RAW, 'hex'));
            await jest.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]`);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(2);

            await emitFromSerial(ezsp, Buffer.from(INCOMING_MESSAGE_HANDLER_FN2_ASH_RAW, 'hex'));
            await jest.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(2);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=69:"INCOMING_MESSAGE_HANDLER" Seq=39 Len=42]`);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(3);
        });

        it('Parses valid incoming callback frame while waiting for response frame', async () => {
            // @ts-expect-error private
            ezsp.responseWaiter = {timer: setTimeout(() => {}, 15000), resolve: mockResponseWaiterResolve};

            await emitFromSerial(ezsp, Buffer.from(MESSAGE_SENT_HANDLER_FN0_ASH_RAW, 'hex'));
            await jest.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(0);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]`);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=0:"VERSION" Seq=0 Len=0]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(1);

            await emitFromSerial(ezsp, Buffer.from(SET_POLICY_REPLY_FN1_ASH_RAW, 'hex'));
            await jest.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledWith(EzspStatus.SUCCESS);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=85:"SET_POLICY" Seq=79 Len=9]`);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(2);
        });

        it('Parses invalid incoming frame', async () => {
            jest.spyOn(ezsp, 'validateReceivedFrame').mockReturnValueOnce(EzspStatus.ERROR_WRONG_DIRECTION);

            // @ts-expect-error private
            ezsp.responseWaiter = {timer: setTimeout(() => {}, 15000), resolve: mockResponseWaiterResolve};

            await emitFromSerial(ezsp, Buffer.from(SEND_UNICAST_REPLY_FN0_ASH_RAW, 'hex'));
            await jest.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(0);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(1);
            expect(mockResponseWaiterResolve).toHaveBeenCalledWith(EzspStatus.ERROR_WRONG_DIRECTION);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=52:"SEND_UNICAST" Seq=39 Len=10]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(1);
        });

        it('Parses invalid incoming callback frame', async () => {
            jest.spyOn(ezsp, 'validateReceivedFrame').mockReturnValueOnce(EzspStatus.ERROR_WRONG_DIRECTION);

            await emitFromSerial(ezsp, Buffer.from(MESSAGE_SENT_HANDLER_FN0_ASH_RAW, 'hex'));
            await jest.advanceTimersByTimeAsync(1000);

            expect(callbackDispatchSpy).toHaveBeenCalledTimes(0);
            expect(mockResponseWaiterResolve).toHaveBeenCalledTimes(0);
            expect(ezsp.callbackFrameToString).toStrictEqual(`[CBFRAME: ID=63:"MESSAGE_SENT_HANDLER" Seq=39 Len=26]`);
            expect(ezsp.frameToString).toStrictEqual(`[FRAME: ID=0:"VERSION" Seq=0 Len=0]`);
            expect(ashSendExecSpy).toHaveBeenCalledTimes(1);
        });
    });
});
