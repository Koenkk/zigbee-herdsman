/* v8 ignore start */

import {EventEmitter} from 'node:events';
import {Socket} from 'node:net';

import {wait} from '../../../utils';
import {logger} from '../../../utils/logger';
import {SerialPort} from '../../serialPort';
import SocketPortUtils from '../../socketPortUtils';
import {SerialPortOptions} from '../../tstype';
import {EzspStatus} from '../enums';
import {halCommonCrc16, inc8, mod8, withinRange} from '../utils/math';
import {
    ASH_ACKNUM_BIT,
    ASH_ACKNUM_MASK,
    ASH_CRC_LEN,
    ASH_DFRAME_MASK,
    ASH_FLIP,
    ASH_FRAME_LEN_ACK,
    ASH_FRAME_LEN_DATA_MIN,
    ASH_FRAME_LEN_ERROR,
    ASH_FRAME_LEN_NAK,
    ASH_FRAME_LEN_RSTACK,
    ASH_FRMNUM_BIT,
    ASH_FRMNUM_MASK,
    ASH_MAX_DATA_FIELD_LEN,
    ASH_MAX_FRAME_WITH_CRC_LEN,
    ASH_MAX_TIMEOUTS,
    ASH_MIN_DATA_FIELD_LEN,
    ASH_MIN_FRAME_WITH_CRC_LEN,
    ASH_NFLAG_MASK,
    ASH_RFLAG_MASK,
    ASH_SHFRAME_MASK,
    ASH_VERSION,
    ASH_WAKE,
    EZSP_HOST_RX_POOL_SIZE,
    LFSR_POLY,
    LFSR_SEED,
    SH_RX_BUFFER_LEN,
    SH_TX_BUFFER_LEN,
    TX_POOL_BUFFERS,
} from './consts';
import {AshFrameType, AshReservedByte, NcpFailedCode} from './enums';
import {AshParser} from './parser';
import {EzspBuffer, EzspFreeList, EzspQueue} from './queues';
import {AshWriter} from './writer';

const NS = 'zh:ember:uart:ash';

/** ASH get rflag in control byte */
// const ashGetRFlag = (ctrl: number): number => (ctrl & ASH_RFLAG_MASK) >> ASH_RFLAG_BIT;
/** ASH get nflag in control byte */
// const ashGetNFlag = (ctrl: number): number => (ctrl & ASH_NFLAG_MASK) >> ASH_NFLAG_BIT;
/** ASH get frmnum in control byte */
const ashGetFrmNum = (ctrl: number): number => (ctrl & ASH_FRMNUM_MASK) >> ASH_FRMNUM_BIT;
/** ASH get acknum in control byte */
const ashGetACKNum = (ctrl: number): number => (ctrl & ASH_ACKNUM_MASK) >> ASH_ACKNUM_BIT;

type UartAshCounters = {
    /** DATA frame data fields bytes transmitted */
    txData: number;
    /** frames of all types transmitted */
    txAllFrames: number;
    /** DATA frames transmitted */
    txDataFrames: number;
    /** ACK frames transmitted */
    txAckFrames: number;
    /** NAK frames transmitted */
    txNakFrames: number;
    /** DATA frames retransmitted */
    txReDataFrames: number;
    /** ACK and NAK frames with nFlag 0 transmitted */
    // txN0Frames: number,
    /** ACK and NAK frames with nFlag 1 transmitted */
    txN1Frames: number;
    /** frames cancelled (with ASH_CAN byte) */
    txCancelled: number;

    /** DATA frame data fields bytes received */
    rxData: number;
    /** frames of all types received */
    rxAllFrames: number;
    /** DATA frames received */
    rxDataFrames: number;
    /** ACK frames received */
    rxAckFrames: number;
    /** NAK frames received */
    rxNakFrames: number;
    /** retransmitted DATA frames received */
    rxReDataFrames: number;
    /** ACK and NAK frames with nFlag 0 received */
    // rxN0Frames: number,
    /** ACK and NAK frames with nFlag 1 received */
    rxN1Frames: number;
    /** frames cancelled (with ASH_CAN byte) */
    rxCancelled: number;

    /** frames with CRC errors */
    rxCrcErrors: number;
    /** frames with comm errors (with ASH_SUB byte) */
    rxCommErrors: number;
    /** frames shorter than minimum */
    rxTooShort: number;
    /** frames longer than maximum */
    rxTooLong: number;
    /** frames with illegal control byte */
    rxBadControl: number;
    /** frames with illegal length for type of frame */
    rxBadLength: number;
    /** frames with bad ACK numbers */
    rxBadAckNumber: number;
    /** DATA frames discarded due to lack of buffers */
    rxNoBuffer: number;
    /** duplicate retransmitted DATA frames */
    rxDuplicates: number;
    /** DATA frames received out of sequence */
    rxOutOfSequence: number;
    /** received ACK timeouts */
    rxAckTimeouts: number;
};

enum SendState {
    IDLE = 0,
    SHFRAME = 1,
    TX_DATA = 2,
    RETX_DATA = 3,
}

// Bits in ashFlags
enum Flag {
    /** Reject Condition */
    REJ = 0x01,
    /** Retransmit Condition */
    RETX = 0x02,
    /** send NAK */
    NAK = 0x04,
    /** send ACK */
    ACK = 0x08,
    /** send RST */
    RST = 0x10,
    /** send immediate CAN */
    CAN = 0x20,
    /** in CONNECTED state, else ERROR */
    CONNECTED = 0x40,
    /** not ready to receive DATA frames */
    NR = 0x100,
    /** last transmitted NR status */
    NRTX = 0x200,
}

/** max frames sent without being ACKed (1-7) */
export const CONFIG_TX_K = 3;
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
const CONFIG_NR_LOW_LIMIT = 8; // RX_FREE_LW
/** if free buffers > limit, host receiver is ready */
const CONFIG_NR_HIGH_LIMIT = 12; // RX_FREE_HW
/** time until a set nFlag must be resent (max 2032) */
const CONFIG_NR_TIME = 480;
/** Read/write max bytes count at stream level */
const CONFIG_HIGHWATER_MARK = 256;

interface UartAshEventMap {
    fatalError: [status: EzspStatus];
    frame: [];
}

/**
 * ASH Protocol handler.
 */
export class UartAsh extends EventEmitter<UartAshEventMap> {
    private readonly portOptions: SerialPortOptions;
    private serialPort?: SerialPort;
    private socketPort?: Socket;
    private writer: AshWriter;
    private parser: AshParser;

    /** True when serial/socket is currently closing. */
    private closing: boolean;

    /** time ackTimer started: 0 means not ready uint16_t */
    private ackTimer: number;
    /** time used to check ackTimer expiry (msecs) uint16_t */
    private ackPeriod: number;
    /** not ready timer (16 msec units). Set to (now + config.nrTime) when started. uint8_t */
    private nrTimer: number;
    /** frame decode in progress */
    private decodeInProgress: boolean;

    // Variables used in encoding frames
    /** true when preceding byte was escaped */
    private encodeEscFlag: boolean;
    /** byte to send after ASH_ESC uint8_t */
    private encodeFlip: number;
    /** uint16_t */
    private encodeCrc: number;
    /** encoder state: 0 = control/data bytes, 1 = crc low byte, 2 = crc high byte, 3 = flag. uint8_t */
    private encodeState: number;
    /** bytes remaining to encode. uint8_t */
    private encodeCount: number;

    // Variables used in decoding frames
    /** bytes in frame, plus CRC, clamped to limit +1: high values also used to record certain errors. uint8_t */
    private decodeLen: number;
    /** ASH_FLIP if previous byte was ASH_ESC. uint8_t */
    private decodeFlip: number;
    /** a 2 byte queue to avoid outputting crc bytes. uint8_t */
    private decodeByte1: number;
    /** at frame end, they contain the received crc. uint8_t */
    private decodeByte2: number;
    /** uint16_t */
    private decodeCrc: number;

    /** outgoing short frames */
    private txSHBuffer: Buffer;
    /** incoming short frames */
    private rxSHBuffer: Buffer;

    /** bit flags for top-level logic. uint16_t */
    private flags: number;
    /** frame ack'ed from remote peer. uint8_t */
    private ackRx: number;
    /** frame ack'ed to remote peer. uint8_t */
    private ackTx: number;
    /** next frame to be transmitted. uint8_t */
    private frmTx: number;
    /** next frame to be retransmitted. uint8_t */
    private frmReTx: number;
    /** next frame expected to be rec'd. uint8_t */
    private frmRx: number;
    /** frame at retx queue's head. uint8_t */
    private frmReTxHead: number;
    /** consecutive timeout counter. uint8_t */
    private timeouts: number;
    /** rec'd DATA frame buffer. uint8_t */
    private rxDataBuffer?: EzspBuffer;
    /** rec'd frame length. uint8_t */
    private rxLen: number;
    /** tx frame offset. uint8_t */
    private txOffset: number;

    public counters: UartAshCounters;

    /**
     * Errors reported by the NCP.
     * The `NcpFailedCode` from the frame reporting this is logged before this is set to make it clear where it failed:
     * - The NCP sent an ERROR frame during the initial reset sequence (before CONNECTED state)
     * - The NCP sent an ERROR frame
     * - The NCP sent an unexpected RSTACK
     */
    private ncpError: EzspStatus;
    /** Errors reported by the Host. */
    private hostError: EzspStatus;
    /** sendExec() state variable */
    private sendState: SendState;

    /** NCP is enabled to sleep, set by EZSP, not supported atm, always false */
    public ncpSleepEnabled: boolean;
    /**
     * Set when the ncp has indicated it has a pending callback by seting the callback flag in the frame control byte
     * or (uart version only) by sending an an ASH_WAKE byte between frames.
     */
    public ncpHasCallbacks: boolean;

    /** Transmit buffers */
    private readonly txPool: EzspBuffer[];
    public readonly txQueue: EzspQueue;
    public readonly reTxQueue: EzspQueue;
    public readonly txFree: EzspFreeList;

    /** Receive buffers */
    private readonly rxPool: EzspBuffer[];
    public readonly rxQueue: EzspQueue;
    public readonly rxFree: EzspFreeList;

    constructor(options: SerialPortOptions) {
        super();

        this.portOptions = options;
        this.serialPort = undefined;
        this.socketPort = undefined;
        this.writer = new AshWriter({highWaterMark: CONFIG_HIGHWATER_MARK});
        this.parser = new AshParser({readableHighWaterMark: CONFIG_HIGHWATER_MARK});

        this.txPool = new Array<EzspBuffer>(TX_POOL_BUFFERS);
        this.txQueue = new EzspQueue();
        this.reTxQueue = new EzspQueue();
        this.txFree = new EzspFreeList();

        this.rxPool = new Array<EzspBuffer>(EZSP_HOST_RX_POOL_SIZE);
        this.rxQueue = new EzspQueue();
        this.rxFree = new EzspFreeList();

        this.closing = false;

        this.txSHBuffer = Buffer.alloc(SH_TX_BUFFER_LEN);
        this.rxSHBuffer = Buffer.alloc(SH_RX_BUFFER_LEN);
        this.ackTimer = 0;
        this.ackPeriod = 0;
        this.nrTimer = 0;

        this.flags = 0;
        this.decodeInProgress = false;
        this.ackRx = 0;
        this.ackTx = 0;
        this.frmTx = 0;
        this.frmReTx = 0;
        this.frmRx = 0;
        this.frmReTxHead = 0;
        this.timeouts = 0;
        this.rxDataBuffer = undefined;
        this.rxLen = 0;

        // init to "start of frame" default
        this.encodeCount = 0;
        this.encodeState = 0;
        this.encodeEscFlag = false;
        this.encodeFlip = 0;
        this.encodeCrc = 0xffff;
        this.txOffset = 0;

        // init to "start of frame" default
        this.decodeLen = 0;
        this.decodeByte1 = 0;
        this.decodeByte2 = 0;
        this.decodeFlip = 0;
        this.decodeCrc = 0xffff;

        this.ncpError = EzspStatus.NO_ERROR;
        this.hostError = EzspStatus.NO_ERROR;
        this.sendState = SendState.IDLE;

        this.ncpSleepEnabled = false;
        this.ncpHasCallbacks = false;

        this.stopAckTimer();
        this.stopNrTimer();

        this.counters = {
            txData: 0,
            txAllFrames: 0,
            txDataFrames: 0,
            txAckFrames: 0,
            txNakFrames: 0,
            txReDataFrames: 0,
            // txN0Frames: 0,
            txN1Frames: 0,
            txCancelled: 0,

            rxData: 0,
            rxAllFrames: 0,
            rxDataFrames: 0,
            rxAckFrames: 0,
            rxNakFrames: 0,
            rxReDataFrames: 0,
            // rxN0Frames: 0,
            rxN1Frames: 0,
            rxCancelled: 0,

            rxCrcErrors: 0,
            rxCommErrors: 0,
            rxTooShort: 0,
            rxTooLong: 0,
            rxBadControl: 0,
            rxBadLength: 0,
            rxBadAckNumber: 0,
            rxNoBuffer: 0,
            rxDuplicates: 0,
            rxOutOfSequence: 0,
            rxAckTimeouts: 0,
        };

        // All transmit buffers are put into txFree, and txQueue and reTxQueue are empty.
        this.txQueue.tail = undefined;
        this.reTxQueue.tail = undefined;
        this.txFree.link = undefined;

        for (let i = 0; i < TX_POOL_BUFFERS; i++) {
            this.txFree.freeBuffer((this.txPool[i] = new EzspBuffer()));
        }

        // All receive buffers are put into rxFree, and rxQueue is empty.
        this.rxQueue.tail = undefined;
        this.rxFree.link = undefined;

        for (let i = 0; i < EZSP_HOST_RX_POOL_SIZE; i++) {
            this.rxFree.freeBuffer((this.rxPool[i] = new EzspBuffer()));
        }
    }

    /**
     * Check if port is valid, open, and not closing.
     */
    get portOpen(): boolean {
        if (this.closing) {
            return false;
        }

        if (SocketPortUtils.isTcpPath(this.portOptions.path!)) {
            return this.socketPort ? !this.socketPort.closed : false;
        } else {
            return this.serialPort ? this.serialPort.isOpen : false;
        }
    }

    /**
     * Get max wait time before response is considered timed out.
     */
    get responseTimeout(): number {
        return ASH_MAX_TIMEOUTS * CONFIG_ACK_TIME_MAX;
    }

    /**
     * Indicates if the host is in the Connected state.
     * If not, the host and NCP cannot exchange DATA frames.
     * Note that this function does not actively confirm that communication with NCP is healthy, but simply returns its last known status.
     *
     * @returns
     * - true  - host and NCP can exchange DATA frames
     * - false - host and NCP cannot now exchange DATA frames
     */
    get connected(): boolean {
        return (this.flags & Flag.CONNECTED) !== 0;
    }

    /**
     * Has nothing to do...
     */
    get idle(): boolean {
        return (
            !this.decodeInProgress && // don't have a partial frame
            // && (this.serial.readAvailable() === EzspStatus.NO_RX_DATA) // no rx data
            this.rxQueue.empty && // no rx frames to process
            !this.ncpHasCallbacks && // no pending callbacks
            this.flags === Flag.CONNECTED && // no pending ACKs, NAKs, etc.
            this.ackTx === this.frmRx && // do not need to send an ACK
            this.ackRx === this.frmTx && // not waiting to receive an ACK
            this.sendState === SendState.IDLE && // nothing being transmitted now
            this.txQueue.empty // nothing waiting to transmit
            // && this.serial.outputIsIdle()          // nothing in OS buffers or UART FIFO
        );
    }

    /**
     * Init the serial or socket port and hook parser/writer.
     * NOTE: This is the only function that throws/rejects in the ASH layer (caught by resetNcp and turned into an EzspStatus).
     */
    private async initPort(): Promise<void> {
        await this.closePort(); // will do nothing if nothing's open

        if (!SocketPortUtils.isTcpPath(this.portOptions.path!)) {
            const serialOpts = {
                path: this.portOptions.path!,
                baudRate: typeof this.portOptions.baudRate === 'number' ? this.portOptions.baudRate : 115200,
                rtscts: typeof this.portOptions.rtscts === 'boolean' ? this.portOptions.rtscts : false,
                autoOpen: false,
                parity: 'none' as const,
                stopBits: 1 as const,
                xon: false,
                xoff: false,
            };

            // enable software flow control if RTS/CTS not enabled in config
            if (!serialOpts.rtscts) {
                logger.info(`RTS/CTS config is off, enabling software flow control.`, NS);
                serialOpts.xon = true;
                serialOpts.xoff = true;
            }

            // @ts-expect-error Jest testing
            if (this.portOptions.binding != undefined) {
                // @ts-expect-error Jest testing
                serialOpts.binding = this.portOptions.binding;
            }

            logger.debug(() => `Opening serial port with ${JSON.stringify(serialOpts)}`, NS);
            this.serialPort = new SerialPort(serialOpts);

            this.writer.pipe(this.serialPort);
            this.serialPort.pipe(this.parser);
            this.parser.on('data', this.onFrame.bind(this));

            try {
                await this.serialPort.asyncOpen();
                logger.info(`Serial port opened`, NS);

                this.serialPort.once('close', this.onPortClose.bind(this));
                this.serialPort.on('error', this.onPortError.bind(this));
            } catch (error) {
                await this.stop();

                throw error;
            }
        } else {
            const info = SocketPortUtils.parseTcpPath(this.portOptions.path!);
            logger.debug(`Opening TCP socket with ${info.host}:${info.port}`, NS);

            this.socketPort = new Socket();

            this.socketPort.setNoDelay(true);
            this.socketPort.setKeepAlive(true, 15000);
            this.writer.pipe(this.socketPort);
            this.socketPort.pipe(this.parser);
            this.parser.on('data', this.onFrame.bind(this));

            return await new Promise((resolve, reject): void => {
                const openError = async (err: Error): Promise<void> => {
                    await this.stop();

                    reject(err);
                };

                this.socketPort!.on('connect', () => {
                    logger.debug(`Socket connected`, NS);
                });
                this.socketPort!.on('ready', (): void => {
                    logger.info(`Socket ready`, NS);
                    this.socketPort!.removeListener('error', openError);
                    this.socketPort!.once('close', this.onPortClose.bind(this));
                    this.socketPort!.on('error', this.onPortError.bind(this));

                    resolve();
                });
                this.socketPort!.once('error', openError);

                this.socketPort!.connect(info.port, info.host);
            });
        }
    }

    /**
     * Handle port closing
     * @param err A boolean for Socket, an Error for serialport
     */
    private async onPortClose(error: boolean | Error): Promise<void> {
        logger.info(`Port closed.`, NS);

        if (error && this.flags !== 0) {
            logger.info(`Port close ${error}`, NS);
            this.flags = 0;
            this.emit('fatalError', EzspStatus.ERROR_SERIAL_INIT);
        }
    }

    /**
     * Handle port error
     * @param error
     */
    private async onPortError(error: Error): Promise<void> {
        logger.error(`Port ${error}`, NS);
        this.flags = 0;
        this.emit('fatalError', EzspStatus.ERROR_SERIAL_INIT);
    }

    /**
     * Handle received frame from AshParser.
     * @param buf
     */
    private onFrame(buffer: Buffer): void {
        const iCAN = buffer.lastIndexOf(AshReservedByte.CANCEL); // should only be one, but just in case...

        if (iCAN !== -1) {
            // ignore the cancel before RSTACK
            if (this.flags & Flag.CONNECTED) {
                this.counters.rxCancelled += 1;

                logger.warning(`Frame(s) in progress cancelled in [${buffer.toString('hex')}]`, NS);
            }

            // get rid of everything up to the CAN flag and start reading frame from there, no need to loop through bytes in vain
            buffer = buffer.subarray(iCAN + 1);
        }

        if (!buffer.length) {
            // skip any CANCEL that results in empty frame (have yet to see one, but just in case...)
            // shouldn't happen for any other reason, unless receiving bad stuff from port?
            logger.debug(`Received empty frame. Skipping.`, NS);
            return;
        }

        const status = this.receiveFrame(buffer);

        this.sendExec(); // always trigger to cover all cases

        if (status !== EzspStatus.SUCCESS && status !== EzspStatus.ASH_IN_PROGRESS && status !== EzspStatus.NO_RX_DATA) {
            logger.error(`Error while parsing received frame, status=${EzspStatus[status]}.`, NS);
            this.emit('fatalError', EzspStatus.HOST_FATAL_ERROR);
            return;
        }
    }

    /**
     * Initializes the ASH protocol, and waits until the NCP finishes rebooting, or a non-recoverable error occurs.
     *
     * @returns
     * - EzspStatus.SUCCESS
     * - EzspStatus.HOST_FATAL_ERROR
     * - EzspStatus.ASH_NCP_FATAL_ERROR)
     */
    public async start(): Promise<EzspStatus> {
        if (!this.portOpen || this.flags & Flag.CONNECTED) {
            return EzspStatus.ERROR_INVALID_CALL;
        }

        logger.info(`======== ASH starting ========`, NS);

        try {
            if (this.serialPort) {
                await this.serialPort.asyncFlush(); // clear read/write buffers
            } else {
                // XXX: Socket equiv?
            }
        } catch (err) {
            logger.error(`Error while flushing before start: ${err}`, NS);
        }

        // block til RSTACK, fatal error or timeout
        // NOTE: on average, this seems to take around 1000ms when successful
        for (let i = 0; i < CONFIG_TIME_RST; i += CONFIG_TIME_RST_CHECK) {
            this.sendExec();

            if (this.flags & Flag.CONNECTED) {
                logger.info(`======== ASH started ========`, NS);

                return EzspStatus.SUCCESS;
            } else if (this.hostError !== EzspStatus.NO_ERROR || this.ncpError !== EzspStatus.NO_ERROR) {
                // don't wait for inevitable fail, bail early, let retry logic in EZSP layer do its thing
                break;
            }

            logger.debug(`Waiting for RSTACK... ${i}/${CONFIG_TIME_RST}`, NS);
            await wait(CONFIG_TIME_RST_CHECK);
        }

        return EzspStatus.HOST_FATAL_ERROR;
    }

    /**
     * Stops the ASH protocol - flushes and closes the serial port, clears all queues, stops timers, etc.
     */
    public async stop(): Promise<void> {
        this.closing = true;

        this.logCounters();
        await this.closePort();

        logger.info(`======== ASH stopped ========`, NS);
    }

    /**
     * Close port and remove listeners.
     * Does nothing if port not defined/open.
     */
    public async closePort(): Promise<void> {
        this.flags = 0;

        if (this.serialPort?.isOpen) {
            try {
                await this.serialPort.asyncFlushAndClose();
            } catch (err) {
                logger.error(`Failed to close serial port ${err}.`, NS);
            }

            this.serialPort.removeAllListeners();
        } else if (this.socketPort != null && !this.socketPort.closed) {
            this.socketPort.destroy();
            this.socketPort.removeAllListeners();
        }
    }

    /**
     * Initializes the ASH serial port and (if enabled) resets the NCP.
     * The method used to do the reset is specified by the the host configuration parameter resetMethod.
     *
     * When the reset method is sending a RST frame, the caller should retry NCP resets a few times if it fails.
     *
     * @returns
     * - EzspStatus.SUCCESS
     * - EzspStatus.HOST_FATAL_ERROR
     */
    public async resetNcp(): Promise<EzspStatus> {
        if (this.closing) {
            return EzspStatus.ERROR_INVALID_CALL;
        }

        logger.info(`======== ASH Adapter reset ========`, NS);

        // ask ncp to reset itself using RST frame
        try {
            if (!this.portOpen) {
                await this.initPort();
            }

            this.flags = Flag.RST | Flag.CAN;

            return EzspStatus.SUCCESS;
        } catch (err) {
            logger.error(`Failed to init port with error ${err}`, NS);

            this.hostError = EzspStatus.HOST_FATAL_ERROR;

            return this.hostError;
        }
    }

    /**
     * Adds a DATA frame to the transmit queue to send to the NCP.
     * Frames that are too long or too short will not be sent, and frames will not be added to the queue
     * if the host is not in the Connected state, or the NCP is not ready to receive a DATA frame or if there
     * is no room in the queue;
     *
     * @param len    length of data field
     * @param inBuf  array containing the data to be sent
     *
     * @returns
     * - EzspStatus.SUCCESS
     * - EzspStatus.NO_TX_SPACE
     * - EzspStatus.DATA_FRAME_TOO_SHORT
     * - EzspStatus.DATA_FRAME_TOO_LONG
     * - EzspStatus.NOT_CONNECTED
     */
    public send(len: number, inBuf: Buffer): EzspStatus {
        // Check for errors that might have been detected
        if (this.hostError !== EzspStatus.NO_ERROR) {
            return EzspStatus.HOST_FATAL_ERROR;
        }

        if (this.ncpError !== EzspStatus.NO_ERROR) {
            return EzspStatus.ASH_NCP_FATAL_ERROR;
        }

        // After verifying that the data field length is within bounds,
        // copies data frame to a buffer and appends it to the transmit queue.
        if (len < ASH_MIN_DATA_FIELD_LEN) {
            return EzspStatus.DATA_FRAME_TOO_SHORT;
        } else if (len > ASH_MAX_DATA_FIELD_LEN) {
            return EzspStatus.DATA_FRAME_TOO_LONG;
        }

        if (!(this.flags & Flag.CONNECTED)) {
            return EzspStatus.NOT_CONNECTED;
        }

        const buffer = this.txFree.allocBuffer();

        if (buffer === undefined) {
            return EzspStatus.NO_TX_SPACE;
        }

        inBuf.copy(buffer.data, 0, 0, len);

        buffer.len = len;

        this.randomizeBuffer(buffer.data, buffer.len); // IN/OUT data
        this.txQueue.addTail(buffer);
        this.sendExec();

        return EzspStatus.SUCCESS;
    }

    /**
     * Manages outgoing communication to the NCP, including DATA frames as well as the frames used for
     * initialization and error detection and recovery.
     */
    public sendExec(): void {
        let outByte: number = 0x00;
        let inByte: number = 0x00;
        let len: number = 0;
        let buffer: EzspBuffer | undefined;

        // Check for received acknowledgement timer expiry
        if (this.ackTimerHasExpired()) {
            if (this.flags & Flag.CONNECTED) {
                const reTx = this.flags & Flag.RETX;
                const expectedFrm = reTx ? this.frmReTx : this.frmTx;

                if (this.ackRx !== expectedFrm) {
                    this.counters.rxAckTimeouts += 1;

                    this.adjustAckPeriod(true);

                    logger.debug(`Timer expired waiting for ACK for ${reTx ? 'frmReTx' : 'frmTx'}=${expectedFrm}, ackRx=${this.ackRx}`, NS);

                    if (++this.timeouts >= ASH_MAX_TIMEOUTS) {
                        this.hostDisconnect(EzspStatus.ASH_ERROR_TIMEOUTS);

                        return;
                    }

                    this.startRetransmission();
                } else {
                    this.stopAckTimer();
                }
            } /* else {
                this.hostDisconnect(EzspStatus.ASH_ERROR_RESET_FAIL);
            }*/
            // let Ezsp layer retry logic handle timeout
        }

        while (this.writer.writeAvailable()) {
            // Send ASH_CAN character immediately, ahead of any other transmit data
            if (this.flags & Flag.CAN) {
                if (this.sendState === SendState.IDLE) {
                    // sending RST or just woke NCP
                    this.writer.writeByte(AshReservedByte.CANCEL);
                } else if (this.sendState === SendState.TX_DATA) {
                    // cancel frame in progress
                    this.counters.txCancelled += 1;

                    this.writer.writeByte(AshReservedByte.CANCEL);

                    this.stopAckTimer();

                    this.sendState = SendState.IDLE;
                }

                this.flags &= ~Flag.CAN;

                continue;
            }

            switch (this.sendState) {
                case SendState.IDLE: {
                    // In between frames - do some housekeeping and decide what to send next
                    // If retransmitting, set the next frame to send to the last ackNum
                    // received, then check to see if retransmission is now complete.
                    if (this.flags & Flag.RETX) {
                        if (withinRange(this.frmReTx, this.ackRx, this.frmTx)) {
                            this.frmReTx = this.ackRx;
                        }

                        if (this.frmReTx === this.frmTx) {
                            this.flags &= ~Flag.RETX;

                            this.scrubReTxQueue();
                        }
                    }

                    // restrain ncp if needed
                    this.dataFrameFlowControl();

                    // See if a short frame is flagged to be sent
                    // The order of the tests below - RST, NAK and ACK -
                    // sets the relative priority of sending these frame types.
                    if (this.flags & Flag.RST) {
                        this.txSHBuffer[0] = AshFrameType.RST;

                        this.setAndStartAckTimer(CONFIG_TIME_RST);

                        len = 1;
                        this.flags &= ~(Flag.RST | Flag.NAK | Flag.ACK);
                        this.sendState = SendState.SHFRAME;
                        logger.debug(`---> [FRAME type=RST]`, NS);
                    } else if (this.flags & (Flag.NAK | Flag.ACK)) {
                        if (this.flags & Flag.NAK) {
                            this.txSHBuffer[0] = AshFrameType.NAK + (this.frmRx << ASH_ACKNUM_BIT);
                            this.flags &= ~(Flag.NRTX | Flag.NAK | Flag.ACK);
                            logger.debug(`---> [FRAME type=NAK frmRx=${this.frmRx}](ackRx=${this.ackRx})`, NS);
                        } else {
                            this.txSHBuffer[0] = AshFrameType.ACK + (this.frmRx << ASH_ACKNUM_BIT);
                            this.flags &= ~(Flag.NRTX | Flag.ACK);
                            logger.debug(`---> [FRAME type=ACK frmRx=${this.frmRx}](ackRx=${this.ackRx})`, NS);
                        }

                        if (this.flags & Flag.NR) {
                            this.txSHBuffer[0] |= ASH_NFLAG_MASK;
                            this.flags |= Flag.NRTX;

                            this.startNrTimer();
                        }

                        this.ackTx = this.frmRx;
                        len = 1;
                        this.sendState = SendState.SHFRAME;
                    } else if (this.flags & Flag.RETX) {
                        // Retransmitting DATA frames for error recovery
                        // buffer assumed valid from loop logic
                        buffer = this.reTxQueue.getNthEntry(mod8(this.frmTx - this.frmReTx))!;
                        len = buffer.len + 1;
                        this.txSHBuffer[0] = AshFrameType.DATA | (this.frmReTx << ASH_FRMNUM_BIT) | (this.frmRx << ASH_ACKNUM_BIT) | ASH_RFLAG_MASK;
                        this.sendState = SendState.RETX_DATA;
                        logger.debug(
                            `---> [FRAME type=DATA_RETX frmReTx=${this.frmReTx} frmRx=${this.frmRx}](ackRx=${this.ackRx} frmTx=${this.frmTx})`,
                            NS,
                        );
                    } else if (this.ackTx != this.frmRx) {
                        // An ACK should be generated
                        this.flags |= Flag.ACK;
                        break;
                    } else if (!this.txQueue.empty && withinRange(this.ackRx, this.frmTx, this.ackRx + CONFIG_TX_K - 1)) {
                        // Send a DATA frame if ready
                        buffer = this.txQueue.head;
                        len = buffer.len + 1;

                        this.counters.txData += len - 1;

                        this.txSHBuffer[0] = AshFrameType.DATA | (this.frmTx << ASH_FRMNUM_BIT) | (this.frmRx << ASH_ACKNUM_BIT);
                        this.sendState = SendState.TX_DATA;
                        logger.debug(`---> [FRAME type=DATA frmTx=${this.frmTx} frmRx=${this.frmRx}](ackRx=${this.ackRx})`, NS);
                    } else {
                        // Otherwise there's nothing to send
                        this.writer.writeFlush();

                        return;
                    }

                    this.countFrame(true);

                    // Start frame - encodeByte() is inited by a non-zero length argument
                    outByte = this.encodeByte(len, this.txSHBuffer[0]);

                    this.writer.writeByte(outByte);
                    break;
                }

                case SendState.SHFRAME: {
                    // sending short frame
                    if (this.txOffset !== 0xff) {
                        inByte = this.txSHBuffer[this.txOffset];
                        outByte = this.encodeByte(0, inByte);

                        this.writer.writeByte(outByte);
                    } else {
                        this.sendState = SendState.IDLE;
                    }
                    break;
                }

                case SendState.TX_DATA:
                case SendState.RETX_DATA: {
                    // sending OR resending data frame
                    if (this.txOffset !== 0xff) {
                        // buffer assumed valid from loop logic
                        inByte = this.txOffset ? buffer!.data[this.txOffset - 1] : this.txSHBuffer[0];
                        outByte = this.encodeByte(0, inByte);

                        this.writer.writeByte(outByte);
                    } else {
                        if (this.sendState === SendState.TX_DATA) {
                            this.frmTx = inc8(this.frmTx);
                            buffer = this.txQueue.removeHead();

                            this.reTxQueue.addTail(buffer);
                        } else {
                            this.frmReTx = inc8(this.frmReTx);
                        }

                        if (this.ackTimerIsNotRunning()) {
                            this.startAckTimer();
                        }

                        this.ackTx = this.frmRx;
                        this.sendState = SendState.IDLE;
                    }
                    break;
                }
            }
        }

        this.writer.writeFlush();
    }

    /**
     * Retrieve a frame and accept, reTx, reject, fail based on type & validity in current state.
     * @returns
     * - EzspStatus.SUCCESS On valid RSTACK or valid DATA frame.
     * - EzspStatus.ASH_IN_PROGRESS
     * - EzspStatus.NO_RX_DATA
     * - EzspStatus.NO_RX_SPACE
     * - EzspStatus.HOST_FATAL_ERROR
     * - EzspStatus.ASH_NCP_FATAL_ERROR
     */
    private receiveFrame(buffer: Buffer): EzspStatus {
        // Check for errors that might have been detected
        if (this.hostError !== EzspStatus.NO_ERROR) {
            return EzspStatus.HOST_FATAL_ERROR;
        }

        if (this.ncpError !== EzspStatus.NO_ERROR) {
            return EzspStatus.ASH_NCP_FATAL_ERROR;
        }

        let ackNum: number = 0;
        let frmNum: number = 0;
        let frameType: AshFrameType = AshFrameType.INVALID;

        // Read data from serial port and assemble a frame until complete, aborted
        // due to an error, cancelled, or there is no more serial data available.
        const status = this.readFrame(buffer);

        switch (status) {
            case EzspStatus.SUCCESS:
                break;
            case EzspStatus.ASH_IN_PROGRESS:
                // should have a complete frame by now, if not, don't process further
                return EzspStatus.NO_RX_DATA;
            case EzspStatus.ASH_CANCELLED:
                // should have been taken out in onFrame
                return this.hostDisconnect(status);
            case EzspStatus.ASH_BAD_CRC:
                this.counters.rxCrcErrors += 1;

                this.rejectFrame();
                logger.error(`Received frame with CRC error`, NS);
                return EzspStatus.NO_RX_DATA;
            case EzspStatus.ASH_COMM_ERROR:
                this.counters.rxCommErrors += 1;

                this.rejectFrame();
                logger.error(`Received frame with comm error`, NS);
                return EzspStatus.NO_RX_DATA;
            case EzspStatus.ASH_TOO_SHORT:
                this.counters.rxTooShort += 1;

                this.rejectFrame();
                logger.error(`Received frame shorter than minimum`, NS);
                return EzspStatus.NO_RX_DATA;
            case EzspStatus.ASH_TOO_LONG:
                this.counters.rxTooLong += 1;

                this.rejectFrame();
                logger.error(`Received frame longer than maximum`, NS);
                return EzspStatus.NO_RX_DATA;
            case EzspStatus.ASH_ERROR_XON_XOFF:
                return this.hostDisconnect(status);
            default:
                logger.error(`Unhandled error while receiving frame, status=${EzspStatus[status]}.`, NS);
                return this.hostDisconnect(EzspStatus.HOST_FATAL_ERROR);
        }

        // Got a complete frame - validate its control and length.
        // On an error the type returned will be TYPE_INVALID.
        frameType = this.getFrameType(this.rxSHBuffer[0], this.rxLen);

        // Free buffer allocated for a received frame if:
        //    DATA frame, and out of order
        //    DATA frame, and not in the CONNECTED state
        //    not a DATA frame
        if (frameType === AshFrameType.DATA) {
            if (!(this.flags & Flag.CONNECTED) || ashGetFrmNum(this.rxSHBuffer[0]) !== this.frmRx) {
                this.freeAllocatedRxBuffer();
            }
        } else {
            this.freeAllocatedRxBuffer();
        }

        const frameTypeStr = AshFrameType[frameType];

        logger.debug(`<--- [FRAME type=${frameTypeStr}]`, NS);
        this.countFrame(false);

        // Process frames received while not in the connected state -
        // ignore everything except RSTACK and ERROR frames
        if (!(this.flags & Flag.CONNECTED)) {
            if (frameType === AshFrameType.RSTACK) {
                // RSTACK frames have the ncp ASH version in the first data field byte,
                // and the reset reason in the second byte
                if (this.rxSHBuffer[1] !== ASH_VERSION) {
                    return this.hostDisconnect(EzspStatus.ASH_ERROR_VERSION);
                }

                // Ignore a RSTACK if the reset reason doesn't match our reset method
                if (this.rxSHBuffer[2] !== NcpFailedCode.RESET_SOFTWARE) {
                    return EzspStatus.ASH_IN_PROGRESS;
                }

                this.ncpError = EzspStatus.NO_ERROR;

                this.stopAckTimer();

                this.timeouts = 0;

                this.setAckPeriod(CONFIG_ACK_TIME_INIT);

                this.flags = Flag.CONNECTED | Flag.ACK;

                logger.info(`======== ASH connected ========`, NS);

                return EzspStatus.SUCCESS;
            } else if (frameType === AshFrameType.ERROR) {
                logger.error(`Received ERROR from adapter while connecting, with code=${NcpFailedCode[this.rxSHBuffer[2]]}.`, NS);
                // let Ezsp retry logic handle error
                // return this.ncpDisconnect(EzspStatus.ASH_NCP_FATAL_ERROR);
            }

            return EzspStatus.ASH_IN_PROGRESS;
        }

        // Connected - process the ackNum in ACK, NAK and DATA frames
        if (frameType === AshFrameType.DATA || frameType === AshFrameType.ACK || frameType === AshFrameType.NAK) {
            ackNum = ashGetACKNum(this.rxSHBuffer[0]);

            logger.debug(`<--- [FRAME type=${frameTypeStr} ackNum=${ackNum}](ackRx=${this.ackRx} frmTx=${this.frmTx})`, NS);

            if (!withinRange(this.ackRx, ackNum, this.frmTx)) {
                this.counters.rxBadAckNumber += 1;

                logger.debug(`<-x- [FRAME type=${frameTypeStr} ackNum=${ackNum}] Invalid ACK num; not within <${this.ackRx}-${this.frmTx}>`, NS);

                frameType = AshFrameType.INVALID;
            } else if (ackNum !== this.ackRx) {
                // new frame(s) ACK'ed?
                this.ackRx = ackNum;
                this.timeouts = 0;

                if (this.flags & Flag.RETX) {
                    // start timer if unACK'ed frames
                    this.stopAckTimer();

                    if (ackNum !== this.frmReTx) {
                        this.startAckTimer();
                    }
                } else {
                    this.adjustAckPeriod(false); // factor ACK time into period

                    if (ackNum !== this.frmTx) {
                        // if more unACK'ed frames,
                        this.startAckTimer(); // then restart ACK timer
                    }

                    this.scrubReTxQueue(); // free buffer(s) in ReTx queue
                }
            }
        }

        // Process frames received while connected
        switch (frameType) {
            case AshFrameType.DATA: {
                frmNum = ashGetFrmNum(this.rxSHBuffer[0]);
                const frameStr = `[FRAME type=${frameTypeStr} ackNum=${ackNum} frmNum=${frmNum}](frmRx=${this.frmRx})`;

                if (frmNum === this.frmRx) {
                    // is frame in sequence?
                    if (this.rxDataBuffer == null) {
                        // valid frame but no memory?
                        this.counters.rxNoBuffer += 1;

                        logger.debug(`<-x- ${frameStr} No buffer available`, NS);

                        this.rejectFrame();

                        return EzspStatus.NO_RX_SPACE;
                    }

                    if (this.rxSHBuffer[0] & ASH_RFLAG_MASK) {
                        // if retransmitted, force ACK
                        this.flags |= Flag.ACK;
                    }

                    this.flags &= ~(Flag.REJ | Flag.NAK); // clear the REJ condition
                    this.frmRx = inc8(this.frmRx);

                    this.randomizeBuffer(this.rxDataBuffer.data, this.rxDataBuffer.len); // IN/OUT data
                    this.rxQueue.addTail(this.rxDataBuffer); // add frame to receive queue

                    logger.debug(`<--- ${frameStr} Added to rxQueue`, NS);

                    this.counters.rxData += this.rxDataBuffer.len;

                    setImmediate(() => this.emit('frame'));
                    return EzspStatus.SUCCESS;
                } else {
                    // frame is out of sequence
                    if (this.rxSHBuffer[0] & ASH_RFLAG_MASK) {
                        // if retransmitted, force ACK
                        this.counters.rxDuplicates += 1;
                        this.flags |= Flag.ACK;
                    } else {
                        // 1st OOS? then set REJ, send NAK
                        if ((this.flags & Flag.REJ) === 0) {
                            this.counters.rxOutOfSequence += 1;

                            logger.debug(`<-x- ${frameStr} Out of sequence: expected ${this.frmRx}; got ${frmNum}.`, NS);
                        }

                        this.rejectFrame();
                    }
                }
                break;
            }
            case AshFrameType.ACK:
                // already fully processed
                break;
            case AshFrameType.NAK:
                // start retransmission if needed
                this.startRetransmission();

                break;
            case AshFrameType.RSTACK:
                // unexpected ncp reset
                logger.error(`Received unexpected reset from adapter, with reason=${NcpFailedCode[this.rxSHBuffer[2]]}.`, NS);
                this.ncpError = EzspStatus.ASH_NCP_FATAL_ERROR;

                return this.hostDisconnect(EzspStatus.ASH_ERROR_NCP_RESET);
            case AshFrameType.ERROR:
                // ncp error
                logger.error(`Received ERROR from adapter, with code=${NcpFailedCode[this.rxSHBuffer[2]]}.`, NS);
                return this.ncpDisconnect(EzspStatus.ASH_NCP_FATAL_ERROR);
            case AshFrameType.INVALID:
                // reject invalid frames
                logger.debug(`<-x- [FRAME type=${frameTypeStr}] Rejecting. ${this.rxSHBuffer.toString('hex')}`, NS);

                this.rejectFrame();
                break;
        }

        return EzspStatus.ASH_IN_PROGRESS;
    }

    /**
     * If the last control byte received was a DATA control, and we are connected and not already in the reject condition,
     * then send a NAK and set the reject condition.
     */
    private rejectFrame(): void {
        if ((this.rxSHBuffer[0] & ASH_DFRAME_MASK) === AshFrameType.DATA && (this.flags & (Flag.REJ | Flag.CONNECTED)) === Flag.CONNECTED) {
            this.flags |= Flag.REJ | Flag.NAK;
        }
    }

    /**
     * Retrieve and process serial bytes.
     * @returns
     */
    private readFrame(buffer: Buffer): EzspStatus {
        let status: EzspStatus = EzspStatus.ERROR_INVALID_CALL; // no actual data to read, something's very wrong
        let index: number = 0;
        // let inByte: number = 0x00;
        let outByte: number = 0x00;

        if (!this.decodeInProgress) {
            this.rxLen = 0;
            this.rxDataBuffer = undefined;
        }

        for (const inByte of buffer) {
            // 0xFF byte signals a callback is pending when between frames in synchronous (polled) callback mode.
            if (!this.decodeInProgress && inByte === ASH_WAKE) {
                if (this.ncpSleepEnabled) {
                    this.ncpHasCallbacks = true;
                }

                status = EzspStatus.ASH_IN_PROGRESS;
                continue;
            }

            // Decode next input byte - note that many input bytes do not produce
            // an output byte. Return on any error in decoding.
            index = this.rxLen;
            [status, outByte, this.rxLen] = this.decodeByte(inByte, outByte, this.rxLen);

            // discard an invalid frame
            if (status !== EzspStatus.ASH_IN_PROGRESS && status !== EzspStatus.SUCCESS) {
                this.freeAllocatedRxBuffer();

                break;
            }

            // if input byte produced an output byte
            if (this.rxLen !== index) {
                if (this.rxLen <= SH_RX_BUFFER_LEN) {
                    // if a short frame, return in rxBuffer
                    this.rxSHBuffer[index] = outByte;
                } else {
                    // if a longer DATA frame, allocate an EzspBuffer for it.
                    // (Note the control byte is always returned in shRxBuffer[0].
                    // Even if no buffer can be allocated, the control's ackNum must be processed.)
                    if (this.rxLen === SH_RX_BUFFER_LEN + 1) {
                        // alloc buffer, copy prior data
                        this.rxDataBuffer = this.rxFree.allocBuffer();

                        if (this.rxDataBuffer !== undefined) {
                            // const len = SH_RX_BUFFER_LEN - 1;

                            // (void) memcpy(this.rxDataBuffer.data, this.shRxBuffer + 1, SH_RX_BUFFER_LEN - 1);
                            this.rxSHBuffer.copy(this.rxDataBuffer.data, 0, 1, SH_RX_BUFFER_LEN);

                            this.rxDataBuffer.len = SH_RX_BUFFER_LEN - 1;
                        }
                    }

                    if (this.rxDataBuffer !== undefined) {
                        // copy next byte to buffer
                        this.rxDataBuffer.data[index - 1] = outByte; // -1 since control is omitted
                        this.rxDataBuffer.len = index;
                    }
                }
            }

            if (status !== EzspStatus.ASH_IN_PROGRESS) {
                break;
            }
        }

        return status;
    }

    /**
     *
     */
    private freeAllocatedRxBuffer(): void {
        if (this.rxDataBuffer !== undefined) {
            this.rxFree.freeBuffer(this.rxDataBuffer);

            this.rxDataBuffer = undefined;
        }
    }

    /**
     *
     */
    private scrubReTxQueue(): void {
        let buffer: EzspBuffer;

        while (this.ackRx !== this.frmReTxHead) {
            buffer = this.reTxQueue.removeHead();

            this.txFree.freeBuffer(buffer);

            this.frmReTxHead = inc8(this.frmReTxHead);
        }
    }

    /**
     * If not already retransmitting, and there are unacked frames, start retransmitting after the last frame that was acked.
     */
    private startRetransmission(): void {
        if (!(this.flags & Flag.RETX) && this.ackRx != this.frmTx) {
            this.stopAckTimer();

            this.frmReTx = this.ackRx;
            this.flags |= Flag.RETX | Flag.CAN;
        }
    }

    /**
     * Check free rx buffers to see whether able to receive DATA frames: set or clear NR flag appropriately.
     * Inform ncp of our status using the nFlag in ACKs and NAKs.
     * Note that not ready status must be refreshed if it persists beyond a maximum time limit.
     */
    private dataFrameFlowControl(): void {
        if (this.flags & Flag.CONNECTED) {
            // Set/clear NR flag based on the number of buffers free
            if (this.rxFree.length < CONFIG_NR_LOW_LIMIT) {
                this.flags |= Flag.NR;

                logger.warning(`NOT READY - Signaling adapter`, NS);
            } else if (this.rxFree.length > CONFIG_NR_HIGH_LIMIT) {
                this.flags &= ~Flag.NR;

                this.stopNrTimer(); // needed??
            }

            // Force an ACK (or possibly NAK) if we need to send an updated nFlag
            // due to either a changed NR status or to refresh a set nFlag
            if (this.flags & Flag.NR) {
                if (!(this.flags & Flag.NRTX) || this.nrTimerHasExpired()) {
                    this.flags |= Flag.ACK;

                    this.startNrTimer();
                }
            } else {
                this.nrTimerHasExpired(); // ensure timer checked often

                if (this.flags & Flag.NRTX) {
                    this.flags |= Flag.ACK;

                    this.stopNrTimer(); // needed???
                }
            }
        } else {
            this.stopNrTimer();

            this.flags &= ~(Flag.NRTX | Flag.NR);
        }
    }

    /**
     * Sets a fatal error state at the Host level.
     * @param error
     * @returns EzspStatus.HOST_FATAL_ERROR
     */
    private hostDisconnect(error: EzspStatus): EzspStatus {
        this.flags = 0;
        this.hostError = error;

        logger.error(`ASH disconnected: ${EzspStatus[error]} | Adapter status: ${EzspStatus[this.ncpError]}`, NS);

        return EzspStatus.HOST_FATAL_ERROR;
    }

    /**
     * Sets a fatal error state at the NCP level. Will require a reset.
     * @param error
     * @returns EzspStatus.ASH_NCP_FATAL_ERROR
     */
    private ncpDisconnect(error: EzspStatus): EzspStatus {
        this.flags = 0;
        this.ncpError = error;

        logger.error(`ASH disconnected | Adapter status: ${EzspStatus[this.ncpError]}`, NS);

        return EzspStatus.ASH_NCP_FATAL_ERROR;
    }

    /**
     * Same as randomizeArray(0, buffer, len).
     * Returns buffer as-is if randomize is OFF.
     * @param buffer IN/OUT
     * @param len
     */
    public randomizeBuffer(buffer: Buffer, len: number): void {
        // If enabled, exclusive-OR buffer data with a pseudo-random sequence
        if (CONFIG_RANDOMIZE) {
            this.randomizeArray(0, buffer, len); // zero inits the random sequence
        }
    }

    /**
     * Randomizes array contents by XORing with an 8-bit pseudo random sequence.
     * This reduces the likelihood that byte-stuffing will greatly increase the size of the payload.
     * (This could happen if a DATA frame contained repeated instances of the same reserved byte value.)
     *
     * @param seed  zero initializes the random sequence a non-zero value continues from a previous invocation
     * @param buf IN/OUT pointer to the array whose contents will be randomized
     * @param len  number of bytes in the array to modify
     * @returns  last value of the sequence.
     *           If a buffer is processed in two or more chunks, as with linked buffers,
     *           this value should be passed back as the value of the seed argument
     */
    public randomizeArray(seed: number, buf: Buffer, len: number): number {
        let outIdx = 0;

        if (seed === 0) {
            seed = LFSR_SEED;
        }

        while (len--) {
            // *buf++ ^= seed;
            buf[outIdx++] ^= seed;

            seed = seed & 1 ? (seed >> 1) ^ LFSR_POLY : seed >> 1;
        }

        return seed;
    }

    /**
     * Get the frame type from the control byte and validate it against the frame length.
     * @param control
     * @param len Frame length
     * @returns AshFrameType.INVALID if bad control/length otherwise the frame type.
     */
    public getFrameType(control: number, len: number): AshFrameType {
        if (control === AshFrameType.RSTACK) {
            if (len === ASH_FRAME_LEN_RSTACK) {
                return AshFrameType.RSTACK;
            }
        } else if (control === AshFrameType.ERROR) {
            if (len === ASH_FRAME_LEN_ERROR) {
                return AshFrameType.ERROR;
            }
        } else if ((control & ASH_DFRAME_MASK) === AshFrameType.DATA) {
            if (len >= ASH_FRAME_LEN_DATA_MIN) {
                return AshFrameType.DATA;
            }
        } else if ((control & ASH_SHFRAME_MASK) === AshFrameType.ACK) {
            if (len === ASH_FRAME_LEN_ACK) {
                return AshFrameType.ACK;
            }
        } else if ((control & ASH_SHFRAME_MASK) === AshFrameType.NAK) {
            if (len === ASH_FRAME_LEN_NAK) {
                return AshFrameType.NAK;
            }
        } else {
            this.counters.rxBadControl += 1;
            logger.debug(`Frame illegal control ${control}.`, NS); // EzspStatus.ASH_BAD_CONTROL

            return AshFrameType.INVALID;
        }

        this.counters.rxBadLength += 1;
        logger.debug(`Frame illegal length ${len} for control ${control}.`, NS); // EzspStatus.ASH_BAD_LENGTH

        return AshFrameType.INVALID;
    }

    /**
     * Encode byte for sending.
     * @param len Start a new frame if non-zero
     * @param byte
     * @returns outByte
     */
    private encodeByte(len: number, byte: number): number {
        // start a new frame if len is non-zero
        if (len) {
            this.encodeCount = len;
            this.txOffset = 0;
            this.encodeState = 0;
            this.encodeEscFlag = false;
            this.encodeCrc = 0xffff;
        }

        // was an escape last time?
        if (this.encodeEscFlag) {
            this.encodeEscFlag = false;

            // send data byte with bit flipped
            return this.encodeFlip;
        }

        // control and data field bytes
        if (this.encodeState === 0) {
            this.encodeCrc = halCommonCrc16(byte, this.encodeCrc);

            if (--this.encodeCount === 0) {
                this.encodeState = 1;
            } else {
                ++this.txOffset;
            }

            return this.encodeStuffByte(byte);
        } else if (this.encodeState === 1) {
            // CRC high byte
            this.encodeState = 2;

            return this.encodeStuffByte(this.encodeCrc >> 8);
        } else if (this.encodeState === 2) {
            // CRC low byte
            this.encodeState = 3;

            return this.encodeStuffByte(this.encodeCrc & 0xff);
        }

        this.txOffset = 0xff;

        return AshReservedByte.FLAG;
    }

    /**
     * Stuff byte as defined by ASH protocol.
     * @param byte
     * @returns
     */
    private encodeStuffByte(byte: number): number {
        if (AshReservedByte[byte] != null) {
            // is special byte
            this.encodeEscFlag = true;
            this.encodeFlip = byte ^ ASH_FLIP;

            return AshReservedByte.ESCAPE;
        } else {
            return byte;
        }
    }

    /**
     * Decode received byte.
     * @param byte
     * @param inByte IN/OUT
     * @param inLen IN/OUT
     * @returns  [EzspStatus, outByte, outLen]
     * - EzspStatus.ASH_IN_PROGRESS
     * - EzspStatus.ASH_COMM_ERROR
     * - EzspStatus.ASH_BAD_CRC
     * - EzspStatus.ASH_TOO_SHORT
     * - EzspStatus.ASH_TOO_LONG
     * - EzspStatus.SUCCESS
     * - EzspStatus.ASH_CANCELLED
     * - EzspStatus.ASH_ERROR_XON_XOFF
     */
    private decodeByte(byte: number, inByte: number, inLen: number): [EzspStatus, outByte: number, outLen: number] {
        let status: EzspStatus = EzspStatus.ASH_IN_PROGRESS;

        if (!this.decodeInProgress) {
            this.decodeLen = 0;
            this.decodeByte1 = 0;
            this.decodeByte2 = 0;
            this.decodeFlip = 0;
            this.decodeCrc = 0xffff;
        }

        switch (byte) {
            case AshReservedByte.FLAG:
                // flag byte (frame delimiter)
                if (this.decodeLen === 0) {
                    // if no frame data, not end flag, so ignore it
                    this.decodeFlip = 0; // ignore isolated data escape between flags
                    break;
                } else if (this.decodeLen === 0xff) {
                    status = EzspStatus.ASH_COMM_ERROR;
                } else if (this.decodeCrc !== (this.decodeByte2 << 8) + this.decodeByte1) {
                    status = EzspStatus.ASH_BAD_CRC;
                } else if (this.decodeLen < ASH_MIN_FRAME_WITH_CRC_LEN) {
                    status = EzspStatus.ASH_TOO_SHORT;
                } else if (this.decodeLen > ASH_MAX_FRAME_WITH_CRC_LEN) {
                    status = EzspStatus.ASH_TOO_LONG;
                } else {
                    status = EzspStatus.SUCCESS;
                }
                break;
            case AshReservedByte.ESCAPE:
                // byte stuffing escape byte
                this.decodeFlip = ASH_FLIP;
                break;
            case AshReservedByte.CANCEL:
                // cancel frame without an error
                status = EzspStatus.ASH_CANCELLED;
                break;
            case AshReservedByte.SUBSTITUTE:
                // discard remainder of frame
                this.decodeLen = 0xff; // special value flags low level comm error
                break;
            case AshReservedByte.XON:
            case AshReservedByte.XOFF:
                // If host is using RTS/CTS, ignore any XON/XOFFs received from the NCP.
                // If using XON/XOFF, the host driver must remove them from the input stream.
                // If it doesn't, it probably means the driver isn't setup for XON/XOFF,
                // so issue an error to flag the serial port driver problem.
                if (this.serialPort != null && !this.serialPort.settings.rtscts) {
                    status = EzspStatus.ASH_ERROR_XON_XOFF;
                }
                break;
            default:
                // a normal byte
                byte ^= this.decodeFlip;
                this.decodeFlip = 0;

                if (this.decodeLen <= ASH_MAX_FRAME_WITH_CRC_LEN) {
                    // limit length to max + 1
                    ++this.decodeLen;
                }

                if (this.decodeLen > ASH_CRC_LEN) {
                    // compute frame CRC even if too long
                    this.decodeCrc = halCommonCrc16(this.decodeByte2, this.decodeCrc);

                    if (this.decodeLen <= ASH_MAX_FRAME_WITH_CRC_LEN) {
                        // store to only max len
                        inByte = this.decodeByte2;
                        inLen = this.decodeLen - ASH_CRC_LEN; // CRC is not output, reduce length
                    }
                }

                this.decodeByte2 = this.decodeByte1;
                this.decodeByte1 = byte;
                break;
        }

        this.decodeInProgress = status === EzspStatus.ASH_IN_PROGRESS;

        return [status, inByte, inLen];
    }

    /**
     * Starts the Not Ready timer
     *
     * On the host, this times nFlag refreshing when the host doesn't have room for callbacks for a prolonged period.
     *
     * On the NCP, if this times out the NCP resumes sending callbacks.
     */
    private startNrTimer(): void {
        this.nrTimer = Date.now() + CONFIG_NR_TIME;
    }

    /**
     * Stop Not Ready timer (set to 0).
     */
    private stopNrTimer(): void {
        this.nrTimer = 0;
    }

    /**
     * Tests whether the Not Ready timer has expired or has stopped. If expired, it is stopped.
     *
     * @returns  true if the Not Ready timer has expired or stopped
     */
    private nrTimerHasExpired(): boolean {
        if (this.nrTimer) {
            if (Date.now() - this.nrTimer >= 0) {
                this.nrTimer = 0;
            }
        }

        return !this.nrTimer;
    }

    /**
     * Indicates whether or not Not Ready timer is currently running.
     *
     * @return True if nrTime == 0
     */
    private nrTimerIsNotRunning(): boolean {
        return this.nrTimer === 0;
    }

    /**
     * Sets the acknowledgement timer period (in msec) and stops the timer.
     */
    private setAckPeriod(msec: number): void {
        this.ackPeriod = msec;
        this.ackTimer = 0;
    }

    /**
     * Sets the acknowledgement timer period (in msec), and starts the timer running.
     */
    private setAndStartAckTimer(msec: number): void {
        this.setAckPeriod(msec);
        this.startAckTimer();
    }

    /**
     * Adapts the acknowledgement timer period to the observed ACK delay.
     * If the timer is not running, it does nothing.
     * If the timer has expired, the timeout period is doubled.
     * If the timer has not expired, the elapsed time is fed into simple
     *
     * IIR filter:
     *          T[n+1] = (7*T[n] + elapsedTime) / 8
     *
     * The timeout period, ackPeriod, is limited such that:
     * config.ackTimeMin <= ackPeriod <= config.ackTimeMax.
     *
     * The acknowledgement timer is always stopped by this function.
     *
     * @param expired true if timer has expired
     */
    private adjustAckPeriod(expired: boolean): void {
        if (expired) {
            // if expired, double the period
            this.ackPeriod += this.ackPeriod;
        } else if (this.ackTimer) {
            // adjust period only if running
            // time elapsed since timer was started
            let temp: number = this.ackPeriod;
            // compute time to receive acknowledgement, then stop timer
            const lastAckTime: number = Date.now() - this.ackTimer;
            temp = (temp << 3) - temp;
            temp += lastAckTime << 2;
            temp >>= 3;
            this.ackPeriod = temp & 0xffff;
        }

        // keep ackPeriod within limits
        if (this.ackPeriod > CONFIG_ACK_TIME_MAX) {
            this.ackPeriod = CONFIG_ACK_TIME_MAX;
        } else if (this.ackPeriod < CONFIG_ACK_TIME_MIN) {
            this.ackPeriod = CONFIG_ACK_TIME_MIN;
        }

        this.ackTimer = 0; // always stop the timer
    }

    /**
     * Sets ACK Timer to the specified period and starts it running.
     */
    private startAckTimer(): void {
        this.ackTimer = Date.now();
    }

    /**
     * Stops and clears ACK Timer.
     */
    private stopAckTimer(): void {
        this.ackTimer = 0;
    }

    /**
     * Indicates whether or not ACK Timer has expired.
     * If the timer is stopped (0) then it is not expired.
     *
     * @returns
     */
    private ackTimerHasExpired(): boolean {
        if (this.ackTimer === 0) {
            // if timer is not running, return false
            return false;
        }

        // return ((halCommonGetInt16uMillisecondTick() - this.ackTimer) >= this.ackPeriod);
        return Date.now() - this.ackTimer >= this.ackPeriod;
    }

    /**
     * Indicates whether or not ACK Timer is currently running (!= 0).
     * The timer may be running even if expired.
     */
    private ackTimerIsNotRunning(): boolean {
        return this.ackTimer === 0;
    }

    /**
     * Increase counters based on frame type and direction.
     * @param sent True if frame being sent, false if being received.
     */
    private countFrame(sent: boolean): void {
        let control: number;

        if (sent) {
            control = this.txSHBuffer[0];
            this.counters.txAllFrames += 1;
        } else {
            control = this.rxSHBuffer[0];
            this.counters.rxAllFrames += 1;
        }

        if ((control & ASH_DFRAME_MASK) === AshFrameType.DATA) {
            if (sent) {
                if (control & ASH_RFLAG_MASK) {
                    this.counters.txReDataFrames += 1;
                } else {
                    this.counters.txDataFrames += 1;
                }
            } else {
                if (control & ASH_RFLAG_MASK) {
                    this.counters.rxReDataFrames += 1;
                } else {
                    this.counters.rxDataFrames += 1;
                }
            }
        } else if ((control & ASH_SHFRAME_MASK) === AshFrameType.ACK) {
            if (sent) {
                this.counters.txAckFrames += 1;

                if (control & ASH_NFLAG_MASK) {
                    this.counters.txN1Frames += 1;
                } /* else {
                    this.counters.txN0Frames += 1;
                }*/
            } else {
                this.counters.rxAckFrames += 1;

                if (control & ASH_NFLAG_MASK) {
                    this.counters.rxN1Frames += 1;
                } /* else {
                    this.counters.rxN0Frames += 1;
                }*/
            }
        } else if ((control & ASH_SHFRAME_MASK) === AshFrameType.NAK) {
            if (sent) {
                this.counters.txNakFrames += 1;

                if (control & ASH_NFLAG_MASK) {
                    this.counters.txN1Frames += 1;
                } /* else {
                    this.counters.txN0Frames += 1;
                }*/
            } else {
                this.counters.rxNakFrames += 1;

                if (control & ASH_NFLAG_MASK) {
                    this.counters.rxN1Frames += 1;
                } /* else {
                    this.counters.rxN0Frames += 1;
                }*/
            }
        }
    }

    /**
     * Read and clear ASH layer counters in the same manner as the NCP ones.
     * @returns
     */
    public readAndClearCounters(): number[] {
        const counters = [
            this.counters.txData,
            this.counters.txAllFrames,
            this.counters.txDataFrames,
            this.counters.txAckFrames,
            this.counters.txNakFrames,
            this.counters.txReDataFrames,
            this.counters.txN1Frames,
            this.counters.txCancelled,

            this.counters.rxData,
            this.counters.rxAllFrames,
            this.counters.rxDataFrames,
            this.counters.rxAckFrames,
            this.counters.rxNakFrames,
            this.counters.rxReDataFrames,
            this.counters.rxN1Frames,
            this.counters.rxCancelled,

            this.counters.rxCrcErrors,
            this.counters.rxCommErrors,
            this.counters.rxTooShort,
            this.counters.rxTooLong,
            this.counters.rxBadControl,
            this.counters.rxBadLength,
            this.counters.rxBadAckNumber,
            this.counters.rxNoBuffer,
            this.counters.rxDuplicates,
            this.counters.rxOutOfSequence,
            this.counters.rxAckTimeouts,
        ];

        for (const c in this.counters) {
            this.counters[c as keyof UartAshCounters] = 0;
        }

        return counters;
    }

    /**
     * Log counters (pretty-formatted) as they are since last time they were cleared.
     * Used on ASH layer stop to get 'pre-stop state'.
     */
    private logCounters(): void {
        logger.info(`ASH COUNTERS since last clear:`, NS);
        logger.info(`  Total frames: RX=${this.counters.rxAllFrames}, TX=${this.counters.txAllFrames}`, NS);
        logger.info(`  Cancelled   : RX=${this.counters.rxCancelled}, TX=${this.counters.txCancelled}`, NS);
        logger.info(`  DATA frames : RX=${this.counters.rxDataFrames}, TX=${this.counters.txDataFrames}`, NS);
        logger.info(`  DATA bytes  : RX=${this.counters.rxData}, TX=${this.counters.txData}`, NS);
        logger.info(`  Retry frames: RX=${this.counters.rxReDataFrames}, TX=${this.counters.txReDataFrames}`, NS);
        logger.info(`  ACK frames  : RX=${this.counters.rxAckFrames}, TX=${this.counters.txAckFrames}`, NS);
        logger.info(`  NAK frames  : RX=${this.counters.rxNakFrames}, TX=${this.counters.txNakFrames}`, NS);
        logger.info(`  nRdy frames : RX=${this.counters.rxN1Frames}, TX=${this.counters.txN1Frames}`, NS);

        logger.info(`  CRC errors      : RX=${this.counters.rxCrcErrors}`, NS);
        logger.info(`  Comm errors     : RX=${this.counters.rxCommErrors}`, NS);
        logger.info(`  Length < minimum: RX=${this.counters.rxTooShort}`, NS);
        logger.info(`  Length > maximum: RX=${this.counters.rxTooLong}`, NS);
        logger.info(`  Bad controls    : RX=${this.counters.rxBadControl}`, NS);
        logger.info(`  Bad lengths     : RX=${this.counters.rxBadLength}`, NS);
        logger.info(`  Bad ACK numbers : RX=${this.counters.rxBadAckNumber}`, NS);
        logger.info(`  Out of buffers  : RX=${this.counters.rxNoBuffer}`, NS);
        logger.info(`  Retry dupes     : RX=${this.counters.rxDuplicates}`, NS);
        logger.info(`  Out of sequence : RX=${this.counters.rxOutOfSequence}`, NS);
        logger.info(`  ACK timeouts    : RX=${this.counters.rxAckTimeouts}`, NS);
    }
}
