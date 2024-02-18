import {OpenOptions} from '@serialport/stream'
import {MockBinding, MockBindingInterface} from '@serialport/binding-mock'
import {
    EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
    EZSP_FRAME_CONTROL_COMMAND,
    EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK,
    EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET,
    EZSP_FRAME_CONTROL_SLEEP_MODE_MASK,
    EZSP_FRAME_ID_INDEX,
    EZSP_MAX_FRAME_LENGTH,
    EZSP_PARAMETERS_INDEX, EZSP_SEQUENCE_INDEX
} from "../../../src/adapter/ember/ezsp/consts";
import {EzspStatus} from "../../../src/adapter/ember/enums";
import {EzspBuffer} from "../../../src/adapter/ember/uart/queues";
import {UartAsh} from "../../../src/adapter/ember/uart/ash";
import {EZSP_HOST_RX_POOL_SIZE, TX_POOL_BUFFERS} from "../../../src/adapter/ember/uart/consts";
import {RECD_RSTACK_BYTES, SEND_RST_BYTES, NCP_ACK_FIRST, adapterSONOFFDongleE} from "./consts";
import {EzspBuffalo} from "../../../src/adapter/ember/ezsp/buffalo.ts";
import {lowByte} from '../../../src/adapter/ember/utils/math';
import {EzspFrameID} from '../../../src/adapter/ember/ezsp/enums.ts';
import {Wait} from '../../../src/utils/';

// XXX: Below are copies from uart>ash.ts, should be kept in sync (avoids export)
/** max frames sent without being ACKed (1-7) */
const CONFIG_TX_K = 3;
/** enables randomizing DATA frame payloads */
const CONFIG_RANDOMIZE = true;
/** adaptive rec'd ACK timeout initial value */
const CONFIG_ACK_TIME_INIT = 800;
/**  "     "     "     "     " minimum value */
const CONFIG_ACK_TIME_MIN = 400;
/**  "     "     "     "     " maximum value */
const CONFIG_ACK_TIME_MAX = 2400;
/** time allowed to receive RSTACK after ncp is reset */
const CONFIG_TIME_RST = 2500;
/** time between checks for received RSTACK (CONNECTED status) */
const CONFIG_TIME_RST_CHECK = 100;
/** if free buffers < limit, host receiver isn't ready, will hold off the ncp from sending normal priority frames */
const CONFIG_NR_LOW_LIMIT = 8;// RX_FREE_LW
/** if free buffers > limit, host receiver is ready */
const CONFIG_NR_HIGH_LIMIT = 12;// RX_FREE_HW
/** time until a set nFlag must be resent (max 2032) */
const CONFIG_NR_TIME = 480;
/** Read/write max bytes count at stream level */
const CONFIG_HIGHWATER_MARK = 256;

const mockSerialPortCloseEvent = jest.fn();
const mockSerialPortErrorEvent = jest.fn();

// todo doesnt reset if closing
// todo doesnt start if closing or connected
// todo doesnt close port if already closed on stop
// todo port error triggers stop
// todo emit `reset` only on port error
// todo emit `close` only when ASH layer stopped
// todo emit `frame` only on valid DATA frame

const mocks = [mockSerialPortCloseEvent, mockSerialPortErrorEvent];

describe('Ember UART ASH Protocol', () => {
    const openOpts: OpenOptions<MockBindingInterface> = {path: '/dev/ttyACM0', baudRate: 115200, binding: MockBinding};
    /**
     * Mock binding provides:
     * 
     * uartAsh.serialPort.port.recording => Buffer of all data written if record==true
     * 
     * uartAsh.serialPort.port.lastWrite => Buffer of last write
     */
    let uartAsh: UartAsh;
    let buffalo: EzspBuffalo;
    let frameSequence: number;

    beforeAll(async () => {
        jest.useRealTimers();// messes with serialport promise handling otherwise?
    });
    afterAll(async () => {
        jest.useRealTimers();
    });
    beforeEach(() => {
        for (const mock of mocks) {
            mock.mockClear();
        }

        frameSequence = 0;
        uartAsh = new UartAsh(openOpts);
        buffalo = new EzspBuffalo(Buffer.alloc(EZSP_MAX_FRAME_LENGTH));
        MockBinding.createPort('/dev/ttyACM0', {/*echo: true,*/ record: true, /*readyData: emitRSTACK,*/ ...adapterSONOFFDongleE});

        buffalo.setPosition(0);
    });
    afterEach(async () => {
        await uartAsh.stop();
        MockBinding.reset();
    });

    it('Inits properly and allocates buffers as needed', () => {
        expect(uartAsh.connected).toStrictEqual(false);
        expect(uartAsh.txQueue).toBeDefined();
        expect(uartAsh.reTxQueue).toBeDefined();
        expect(uartAsh.txFree).toBeDefined();
        expect(uartAsh.rxQueue).toBeDefined();
        expect(uartAsh.rxFree).toBeDefined();

        //@ts-expect-error private
        uartAsh.initVariables();

        expect(uartAsh.ncpSleepEnabled).toStrictEqual(false);
        expect(uartAsh.ncpHasCallbacks).toStrictEqual(false);
        expect(uartAsh.txQueue.length).toStrictEqual(0);
        expect(uartAsh.reTxQueue.length).toStrictEqual(0);
        expect(uartAsh.txFree.length).toStrictEqual(TX_POOL_BUFFERS);
        expect(uartAsh.rxQueue.length).toStrictEqual(0);
        expect(uartAsh.rxFree.length).toStrictEqual(EZSP_HOST_RX_POOL_SIZE);
        expect(uartAsh.txQueue.tail).toStrictEqual(null);
        expect(uartAsh.reTxQueue.tail).toStrictEqual(null);
        expect(uartAsh.txFree.link).toBeInstanceOf(EzspBuffer);
        expect(uartAsh.txFree.link.data.length).toStrictEqual(EZSP_MAX_FRAME_LENGTH);
        expect(uartAsh.rxQueue.tail).toStrictEqual(null);
        expect(uartAsh.rxFree.link).toBeInstanceOf(EzspBuffer);
        expect(uartAsh.rxFree.link.data.length).toStrictEqual(EZSP_MAX_FRAME_LENGTH);

        for (const c in uartAsh.counters) {
            expect(uartAsh.counters[c]).toStrictEqual(0);
        }

        // this is mostly Queues testing, but make sure it works in "real" context
        const link = uartAsh.txFree.link;
        const buffer: EzspBuffer = uartAsh.txFree.allocBuffer();

        expect(buffer).toStrictEqual(link);
        expect(uartAsh.txFree.link).toStrictEqual(buffer.link);
        expect(uartAsh.txFree.length).toStrictEqual(TX_POOL_BUFFERS - 1);

        uartAsh.txQueue.addTail(buffer);

        expect(buffer.link).toStrictEqual(null);
        expect(uartAsh.txQueue.tail).toStrictEqual(buffer);
        expect(uartAsh.txQueue.length).toStrictEqual(1);

        const head = uartAsh.txQueue.removeHead();

        expect(head).toStrictEqual(buffer);
        expect(head).toStrictEqual(link);
        expect(uartAsh.txQueue.tail).toStrictEqual(null);
        expect(uartAsh.txQueue.length).toStrictEqual(0);

        uartAsh.txFree.freeBuffer(head);
        
        uartAsh.txQueue.addTail(uartAsh.txFree.allocBuffer());
        uartAsh.txQueue.addTail(uartAsh.txFree.allocBuffer());

        expect(uartAsh.txQueue.length).toStrictEqual(2);
        expect(uartAsh.txFree.length).toStrictEqual(TX_POOL_BUFFERS - 2);
    });
    it('Reaches CONNECTED state', async () => {
        //@ts-expect-error private
        const initVariablesSpy = jest.spyOn(uartAsh, 'initVariables');
        //@ts-expect-error private
        const initPortSpy = jest.spyOn(uartAsh, 'initPort');
        const resetNcpSpy = jest.spyOn(uartAsh, 'resetNcp');
        const sendExecSpy = jest.spyOn(uartAsh, 'sendExec');
        //@ts-expect-error private
        const onPortCloseSpy = jest.spyOn(uartAsh, 'onPortClose');
        //@ts-expect-error private
        const onPortErrorSpy = jest.spyOn(uartAsh, 'onPortError');

        const resetResult = (await uartAsh.resetNcp());

        //@ts-expect-error private
        expect(uartAsh.serialPort.settings.binding).toBe(MockBinding);// just making sure mock was registered
        expect(resetResult).toStrictEqual(EzspStatus.SUCCESS);
        expect(resetNcpSpy).toHaveBeenCalledTimes(1);
        expect(initVariablesSpy).toHaveBeenCalledTimes(1);
        expect(initPortSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(uartAsh.flags).toStrictEqual(48);// RST|CAN
        //@ts-expect-error private
        expect(uartAsh.serialPort).toBeDefined();
        //@ts-expect-error private
        expect(uartAsh.writer).toBeDefined();
        //@ts-expect-error private
        expect(uartAsh.parser).toBeDefined();
        expect(uartAsh.portOpen).toBeTruthy();

        //@ts-expect-error private
        uartAsh.serialPort.port.emitData(Buffer.from(RECD_RSTACK_BYTES));
        const startResult = (await uartAsh.start());

        expect(startResult).toStrictEqual(EzspStatus.SUCCESS);
        expect(sendExecSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(uartAsh.serialPort.port.lastWrite).toStrictEqual(Buffer.from(SEND_RST_BYTES));
        expect(uartAsh.connected).toBeTruthy();
        expect(uartAsh.counters.txAllFrames).toStrictEqual(1);// RST
        expect(uartAsh.counters.rxAllFrames).toStrictEqual(1);// RSTACK

        Object.keys(uartAsh.counters).forEach((key) => {
            if (key !== 'txAllFrames' && key !== 'rxAllFrames') {
                expect(uartAsh.counters[key]).toStrictEqual(0);
            }
        });

        await uartAsh.stop();

        expect(initVariablesSpy).toHaveBeenCalledTimes(2);// always called on stop
        expect(onPortErrorSpy).toHaveBeenCalledTimes(0);
        expect(onPortCloseSpy).toHaveBeenCalledTimes(1);
    });
    it.skip('Resets but failed to start b/c error in RSTACK frame returned by NCP', async () => {
        //@ts-expect-error private
        const rejectFrameSpy = jest.spyOn(uartAsh, 'rejectFrame');
        //@ts-expect-error private
        const receiveFrameSpy = jest.spyOn(uartAsh, 'receiveFrame');
        //@ts-expect-error private
        const decodeByteSpy = jest.spyOn(uartAsh, 'decodeByte');

        const resetResult = (await uartAsh.resetNcp());

        expect(resetResult).toStrictEqual(EzspStatus.SUCCESS);

        const badCrcRSTACK = Buffer.from(RECD_RSTACK_BYTES);
        badCrcRSTACK[badCrcRSTACK.length - 2] = 0;// throw CRC low

        //@ts-expect-error private
        uartAsh.serialPort.port.emitData(badCrcRSTACK);
        const startResult = (await uartAsh.start());

        await Wait(10);

        expect(startResult).toStrictEqual(EzspStatus.HOST_FATAL_ERROR);
        expect(uartAsh.counters.txAllFrames).toStrictEqual(1);
        expect(uartAsh.counters.rxAllFrames).toStrictEqual(0);
        expect(uartAsh.counters.rxCrcErrors).toStrictEqual(1);
        expect(rejectFrameSpy).toHaveBeenCalledTimes(1);// received bad RSTACK
        expect(decodeByteSpy.mock.results[decodeByteSpy.mock.results.length - 1].value[0]).toStrictEqual(EzspStatus.ASH_BAD_CRC);
        expect(receiveFrameSpy).toHaveLastReturnedWith(EzspStatus.NO_RX_DATA);
        expect(uartAsh.connected).toBeFalsy();
    });
    describe('In CONNECTED state...', () => {
        beforeEach(async () => {
            const resetResult = (await uartAsh.resetNcp());
            //@ts-expect-error private
            uartAsh.serialPort.port.emitData(Buffer.from(RECD_RSTACK_BYTES));
            const startResult = (await uartAsh.start());

            expect(resetResult).toStrictEqual(EzspStatus.SUCCESS);
            expect(startResult).toStrictEqual(EzspStatus.SUCCESS);
            expect(uartAsh.connected).toBeTruthy();

            uartAsh.sendExec();// ACK for RSTACK == 8070787e
            expect(uartAsh.idle).toBeTruthy();
            expect(uartAsh.counters.txAckFrames).toStrictEqual(1);// ACK for RSTACK
        });
        afterEach(async () => {
        });

        it('Sends DATA frame to NCP', async () => {
            buffalo.setPosition(EZSP_PARAMETERS_INDEX);
            buffalo.setCommandByte(EZSP_FRAME_ID_INDEX, lowByte(EzspFrameID.VERSION));
            buffalo.setCommandByte(EZSP_SEQUENCE_INDEX, frameSequence++);
            buffalo.setCommandByte(
                EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
                (EZSP_FRAME_CONTROL_COMMAND | (0x00 & EZSP_FRAME_CONTROL_SLEEP_MODE_MASK)
                    | ((0x00 << EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET) & EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK))
            );
            buffalo.writeUInt8(13);// desiredProtocolVersion

            let sendBuf = buffalo.getWritten();

            uartAsh.send(sendBuf.length, sendBuf);

            await Wait(10);

            expect(uartAsh.counters.txDataFrames).toStrictEqual(1);
            //@ts-expect-error private
            expect(uartAsh.serialPort.port.recording).toStrictEqual(Buffer.concat([
                Buffer.from('1ac038bc7e', 'hex'),// RST
                Buffer.from('8070787e', 'hex'),// RSTACK ACK
                Buffer.from('004221a8597c057e', 'hex'),// DATA
            ]));
        })

        it('Sends DATA frame and receives response from NCP', async () => {
            buffalo.setPosition(EZSP_PARAMETERS_INDEX);
            buffalo.setCommandByte(EZSP_FRAME_ID_INDEX, lowByte(EzspFrameID.VERSION));
            buffalo.setCommandByte(EZSP_SEQUENCE_INDEX, frameSequence++);
            buffalo.setCommandByte(
                EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
                (EZSP_FRAME_CONTROL_COMMAND | (0x00 & EZSP_FRAME_CONTROL_SLEEP_MODE_MASK)
                    | ((0x00 << EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET) & EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK))
            );
            buffalo.writeUInt8(2);// desiredProtocolVersion

            let sendBuf = buffalo.getWritten();

            uartAsh.send(sendBuf.length, sendBuf);

            await Wait(10);

            //@ts-expect-error private
            uartAsh.serialPort.port.emitData(Buffer.from(NCP_ACK_FIRST));// just an ACK, doesn't matter what it is

            await Wait(10);// force wait new frame

            expect(uartAsh.counters.txAckFrames).toStrictEqual(1);
            expect(uartAsh.counters.rxAckFrames).toStrictEqual(1);
        });

        it('TODO: Sends DATA frame with NR flags when buffers are low on host', async () => {});

        it('TODO: Sends DATA frame but times out waiting for response', async () => {});

        it('TODO: Resends DATA frame', async () => {});

        it('Allows sending up to TX_K frames before receiving ACK', async () => {
            buffalo.setPosition(EZSP_PARAMETERS_INDEX);
            buffalo.setCommandByte(EZSP_FRAME_ID_INDEX, lowByte(EzspFrameID.VERSION));
            buffalo.setCommandByte(EZSP_SEQUENCE_INDEX, frameSequence++);
            buffalo.setCommandByte(
                EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
                (EZSP_FRAME_CONTROL_COMMAND | (0x00 & EZSP_FRAME_CONTROL_SLEEP_MODE_MASK)
                    | ((0x00 << EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET) & EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK))
            );
            buffalo.writeUInt8(13);// desiredProtocolVersion

            let sendBuf = buffalo.getWritten();

            for (let i = 0; i <= CONFIG_TX_K; i++) {
                uartAsh.send(sendBuf.length, sendBuf);
            }

            await Wait(10);

            expect(uartAsh.counters.txDataFrames).toStrictEqual(3);
            expect(uartAsh.txQueue.length).toStrictEqual(1);

            //@ts-expect-error private
            expect(uartAsh.serialPort.port.recording).toStrictEqual(Buffer.concat([
                Buffer.from('1ac038bc7e', 'hex'),// RST
                Buffer.from('8070787e', 'hex'),// RSTACK ACK
                Buffer.from('004221a8597c057e', 'hex'),// DATA 1
                Buffer.from('104221a859785f7e', 'hex'),// DATA 2
                Buffer.from('204221a85974b17e', 'hex'),// DATA 3
            ]));
        });
    });
});
