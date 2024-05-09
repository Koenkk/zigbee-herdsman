import {OpenOptions} from '@serialport/stream';
import {MockBinding, MockPortBinding} from '@serialport/binding-mock';
import {Ezsp} from '../../../src/adapter/ember/ezsp/ezsp';
import {
    ASH_ACK_FIRST_BYTES,
    RCED_DATA_WITH_CRC_ERROR,
    RCED_DATA_VERSION,
    RCED_DATA_VERSION_RES,
    RECD_ERROR_ACK_TIMEOUT_BYTES,
    RECD_RSTACK_BYTES,
    SEND_RST_BYTES,
    adapterSONOFFDongleE,
    SEND_DATA_VERSION,
    SEND_ACK_FIRST_BYTES,
    RCED_ERROR_WATCHDOG_BYTES,
} from './consts';
import {EzspStatus} from '../../../src/adapter/ember/enums';
import {AshEvents} from '../../../src/adapter/ember/uart/ash';
import {logger} from '../../../src/utils/logger';

const emitFromSerial = (ezsp: Ezsp, data: Buffer): void => {
    //@ts-expect-error private
    ezsp.ash.serialPort.port.emitData(Buffer.from(data));
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

    afterAll(async () => {
    });

    beforeEach(async () => {
        for (const mock of mocks) {
            mock.mockClear();
        }

        ezsp = new Ezsp(5, openOpts);
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
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
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
        emitFromSerial(ezsp, RCED_DATA_WITH_CRC_ERROR);
        await advanceTimeToRSTACK();
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ezsp.checkConnection()).toBeTruthy();
        expect(ezsp.ash.counters.rxCrcErrors).toStrictEqual(1);
        expect(ashEmitSpy).not.toHaveBeenCalled();
        expect(onAshFatalErrorSpy).not.toHaveBeenCalled();
    });

    it('Starts ASH layer even when received ERROR from port', async () => {
        const ashEmitSpy = jest.spyOn(ezsp.ash, 'emit');
        // @ts-expect-error private
        const onAshFatalErrorSpy = jest.spyOn(ezsp, 'onAshFatalError');
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        emitFromSerial(ezsp, Buffer.from(RECD_ERROR_ACK_TIMEOUT_BYTES));
        await advanceTimeToRSTACK();
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(Buffer.concat([Buffer.from(SEND_RST_BYTES), POST_RSTACK_SERIAL_BYTES]));
        expect(ezsp.checkConnection()).toBeTruthy();
        expect(ashEmitSpy).toHaveBeenCalledWith(AshEvents.FATAL_ERROR, EzspStatus.HOST_FATAL_ERROR);
        expect(onAshFatalErrorSpy).not.toHaveBeenCalled();// ERROR is handled by ezsp layer, not bubbled up to adapter
    });

    it('Starts ASH layer when received ERROR RESET_WATCHDOG from port', async () => {
        const ashEmitSpy = jest.spyOn(ezsp.ash, 'emit');
        // @ts-expect-error private
        const onAshFatalErrorSpy = jest.spyOn(ezsp, 'onAshFatalError');
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        emitFromSerial(ezsp, Buffer.from(RCED_ERROR_WATCHDOG_BYTES));
        await advanceTimeToRSTACK();
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(Buffer.concat([Buffer.from(SEND_RST_BYTES), POST_RSTACK_SERIAL_BYTES]));
        expect(ezsp.checkConnection()).toBeTruthy();
        expect(ashEmitSpy).toHaveBeenCalledWith(AshEvents.FATAL_ERROR, EzspStatus.HOST_FATAL_ERROR);
        expect(onAshFatalErrorSpy).not.toHaveBeenCalled();// ERROR is handled by ezsp layer, not bubbled up to adapter
    });

    it('Starts ASH layer when received duplicate RSTACK from port right after first ACK', async () => {
        const ashEmitSpy = jest.spyOn(ezsp.ash, 'emit');
        let restart: Promise<EzspStatus>;
        // @ts-expect-error private
        const onAshFatalErrorSpy = jest.spyOn(ezsp, 'onAshFatalError').mockImplementationOnce((status: EzspStatus): void => {
            // mimic EmberAdapter onNcpNeedsResetAndInit
            logger.error(`!!! NCP FATAL ERROR reason=${EzspStatus[status]}. ATTEMPTING RESET... !!!`, 'jest:ember:ezsp');

            restart = new Promise(async (resolve) => {
                jest.useRealTimers();
                await ezsp.stop();
                jest.useFakeTimers();

                const startResult = ezsp.start();

                await advanceTimeToRSTACK();
                emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
                await jest.advanceTimersByTimeAsync(1000);
                resolve(startResult);
            });
        });
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);// dup is received after this returns
        expect(ezsp.checkConnection()).toBeFalsy();
        // @ts-expect-error set via emit
        expect(restart).toBeDefined();
        // @ts-expect-error set via emit
        await expect(restart).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ashEmitSpy).toHaveBeenCalledWith(AshEvents.FATAL_ERROR, EzspStatus.HOST_FATAL_ERROR);
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
            logger.error(`!!! NCP FATAL ERROR reason=${EzspStatus[status]}. ATTEMPTING RESET... !!!`, 'jest:ember:ezsp');

            restart = new Promise(async (resolve) => {
                jest.useRealTimers();
                await ezsp.stop();
                jest.useFakeTimers();

                const startResult = ezsp.start();
    
                await advanceTimeToRSTACK();
                emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
                await jest.advanceTimersByTimeAsync(1000);
                resolve(startResult);
            });
        });
        const startResult = ezsp.start();

        await advanceTime100ms(2);
        emitFromSerial(ezsp, Buffer.from(RCED_ERROR_WATCHDOG_BYTES));
        await advanceTimeToRSTACK();
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(Buffer.concat([Buffer.from(SEND_RST_BYTES), POST_RSTACK_SERIAL_BYTES]));
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);// dup is received after this returns
        expect(ezsp.checkConnection()).toBeFalsy();
        // @ts-expect-error set via emit
        expect(restart).toBeDefined();
        // @ts-expect-error set via emit
        await expect(restart).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ashEmitSpy).toHaveBeenCalledWith(AshEvents.FATAL_ERROR, EzspStatus.HOST_FATAL_ERROR);
        expect(onAshFatalErrorSpy).toHaveBeenCalledWith(EzspStatus.HOST_FATAL_ERROR);
        expect(ezsp.checkConnection()).toBeTruthy();
    });

    it('Restarts ASH layer when received ERROR from port', async () => {
        let restart: Promise<EzspStatus>;
        // @ts-expect-error private
        const onAshFatalErrorSpy = jest.spyOn(ezsp, 'onAshFatalError').mockImplementationOnce((status: EzspStatus): void => {
            // mimic EmberAdapter onNcpNeedsResetAndInit
            logger.error(`!!! NCP FATAL ERROR reason=${EzspStatus[status]}. ATTEMPTING RESET... !!!`, 'jest:ember:ezsp');

            restart = new Promise(async (resolve) => {
                jest.useRealTimers();
                await ezsp.stop();
                jest.useFakeTimers();

                const startResult = ezsp.start();
    
                await advanceTimeToRSTACK();
                emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
                await jest.advanceTimersByTimeAsync(1000);
                resolve(startResult);
            });
        });
        const startResult = ezsp.start();

        await advanceTimeToRSTACK();
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
        await expect(startResult).resolves.toStrictEqual(EzspStatus.SUCCESS);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(POST_RSTACK_SERIAL_BYTES);
        expect(ezsp.checkConnection()).toBeTruthy();
        // started clean

        const version = ezsp.ezspVersion(13);

        await jest.advanceTimersByTimeAsync(1000);
        emitFromSerial(ezsp, RCED_DATA_VERSION);
        await jest.advanceTimersByTimeAsync(1000);
        await expect(version).resolves.toStrictEqual(RCED_DATA_VERSION_RES);
        //@ts-expect-error private
        expect(ezsp.ash.serialPort.port.recording).toStrictEqual(
            Buffer.from([...POST_RSTACK_SERIAL_BYTES, ...SEND_DATA_VERSION, ...SEND_ACK_FIRST_BYTES])
        );

        await jest.advanceTimersByTimeAsync(10000);// any time after startup sequence

        emitFromSerial(ezsp, Buffer.from(RECD_ERROR_ACK_TIMEOUT_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
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
        emitFromSerial(ezsp, Buffer.from(RECD_RSTACK_BYTES));
        await jest.advanceTimersByTimeAsync(1000);
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
});
