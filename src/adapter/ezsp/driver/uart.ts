import * as SerialPort from 'serialport'
import { Deferred, AsyncQueue, crc16ccitt } from './utils';

const FLAG = 0x7E  // Marks end of frame
const ESCAPE = 0x7D
const XON = 0x11  // Resume transmission
const XOFF = 0x13  // Stop transmission
const SUBSTITUTE = 0x18
const CANCEL = 0x1A  // Terminates a frame in progress

const RESERVED = [FLAG, ESCAPE, XON, XOFF, SUBSTITUTE, CANCEL]

class Terminator {
}

enum NcpResetCode {
    RESET_UNKNOWN_REASON = 0x00,
    RESET_EXTERNAL = 0x01,
    RESET_POWER_ON = 0x02,
    RESET_WATCHDOG = 0x03,
    RESET_ASSERT = 0x06,
    RESET_BOOTLOADER = 0x09,
    RESET_SOFTWARE = 0x0B,
    ERROR_EXCEEDED_MAXIMUM_ACK_TIMEOUT_COUNT = 0x51,
    ERROR_UNKNOWN_EM3XX_ERROR = 0x80,
}

export class UartProtocol implements AsyncIterable<Buffer> {

    _send_seq = 0;
    _rec_seq = 0;
    _buffer: Buffer | undefined = Buffer.alloc(256);
    _reset_deferred: Deferred<any>;
    _pending: any;
    _sendq: AsyncQueue<{ data: Buffer, seq: number }>
    _connected_future: Function | undefined
    _readq: AsyncQueue<Buffer>;
    _transport: SerialPort;
    _nextIterator: { next: Function };
    _dataFrameReceived: { next: Function };
    logger: any;

    constructor(private writeCb: (data: Buffer) => Promise<void>, logger: any) {
        this.logger = logger;
        this._pending = [(- 1), null];
        this._sendq = new AsyncQueue<{ data: Buffer, seq: number }>((iter: { next: Function }) => {
            this._nextIterator = iter;
        });
        this._readq = new AsyncQueue<Buffer>((iter: { next: Function }) => {
            this._dataFrameReceived = iter;
        });
        this._send_task();
    }

    data_received(data: Buffer) {
        //console.log('data_received', data.toString('hex'))
        /* Callback when there is data received from the uart */
        var frame;
        if (data.indexOf(CANCEL) >= 0) {
            this._buffer = new Buffer([]);
            data = data.slice((data.lastIndexOf(CANCEL) + 1));
        }
        if (data.indexOf(SUBSTITUTE) >= 0) {
            this._buffer = new Buffer([]);
            data = data.slice((data.indexOf(FLAG) + 1));
        }
        if (this._buffer) {
            this._buffer = Buffer.concat([this._buffer, data]);
        } else {
            this._buffer = data;
        }
        while (this._buffer) {
            let retBuffer;
            [frame, retBuffer] = this._extract_frame(this._buffer);
            this._buffer = retBuffer as any;
            if ((frame === null)) {
                break;
            }
            this.frame_received(frame);
        }
    }

    _extract_frame(data: Buffer) {
        /* Extract a frame from the data buffer */
        var place;
        if (data.indexOf(FLAG) >= 0) {
            place = data.indexOf(FLAG);
            return [this._unstuff(data.slice(0, (place + 1))), data.slice((place + 1))];
        }
        return [null, data];
    }

    frame_received(data: Buffer) {
        /* Frame receive handler */
        if (((data[0] & 128) === 0)) {
            this.data_frame_received(data);
        } else {
            if (((data[0] & 224) === 128)) {
                this.ack_frame_received(data);
            } else {
                if (((data[0] & 224) === 160)) {
                    this.nak_frame_received(data);
                } else {
                    if ((data[0] === 192)) {
                        this.rst_frame_received(data);
                    } else {
                        if ((data[0] === 193)) {
                            this.rstack_frame_received(data);
                        } else {
                            if ((data[0] === 194)) {
                                this.error_frame_received(data);
                            } else {
                                this.logger("UNKNOWN FRAME RECEIVED: %r", data);
                            }
                        }
                    }
                }
            }
        }
    }

    data_frame_received(data: Buffer) {
        /* Data frame receive handler */
        var seq;
        this.logger("Data frame: %s", data.toString('hex'));
        seq = ((data[0] & 112) >> 4);
        this._rec_seq = ((seq + 1) % 8);
        this.write(this._ack_frame());
        this._handle_ack(data[0]);
        if (this._dataFrameReceived) {
            this._dataFrameReceived.next(this._randomize(data.slice(1, (- 3))))
        }
    }

    [Symbol.asyncIterator]() {
        return this._readq;
    }

    ack_frame_received(data: Buffer) {
        /* Acknowledgement frame receive handler */
        this.logger("ACK frame: %s", data.toString('hex'));
        this._handle_ack(data[0]);
    }

    nak_frame_received(data: Buffer) {
        /* Negative acknowledgement frame receive handler */
        this.logger("NAK frame: %s", data.toString('hex'));
        this._handle_nak(data[0]);
    }

    rst_frame_received(data: Buffer) {
        /* Reset frame handler */
        this.logger("RST frame: %s", data.toString('hex'));
    }

    rstack_frame_received(data: Buffer) {
        /* Reset acknowledgement frame receive handler */
        var code;
        this._send_seq = 0;
        this._rec_seq = 0;
        try {
            code = NcpResetCode[data[2]];
        } catch (e) {
            code = NcpResetCode.ERROR_UNKNOWN_EM3XX_ERROR;
        }
        this.logger("RSTACK Version: %d Reason: %s frame: %s", data[1], code.toString(), data.toString('hex'));
        if (NcpResetCode[<any>code].toString() !== NcpResetCode.RESET_SOFTWARE.toString()) {
            return;
        }
        if ((!this._reset_deferred)) {
            this.logger("Reset future is None");
            return;
        }
        this._reset_deferred.resolve(true);
    }

    error_frame_received(data: Buffer) {
        /* Error frame receive handler */
        this.logger("Error frame:", data.toString('hex'));
    }

    write(data: Buffer) {
        /* Send data to the uart */
        this.logger("Sending:", data.toString('hex'));
        return this.writeCb(data);
    }

    reset() {
        /* Sends a reset frame */
        if ((this._reset_deferred)) {
            throw new TypeError("reset can only be called on a new connection");
        }
        this.write(this._rst_frame());
        this._reset_deferred = new Deferred<void>();
        return this._reset_deferred.promise;
    }

    private sleep(ms: number) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }

    async _send_task() {
        for await (const item of this._sendq) {
            let data, rxmit, seq, success;
            //console.log('IteratorResult', item);
            if ((item instanceof Terminator)) {
                return;
            }
            if (!item) {
                await this.sleep(5000);
                continue;
            }
            data = (item as any).data;
            seq = (item as any).seq;
            success = false;
            rxmit = 0;
            while ((!success)) {
                this._pending = { seq };
                try {
                    await this.write(this._data_frame(data, seq, rxmit));
                    success = true;
                } catch (e) {
                    rxmit = 1;
                    success = false;
                }
            }
        }
    }

    _handle_ack(control: number) {
        /* Handle an acknowledgement frame */
        var ack, pending;
        ack = (((control & 7) - 1) % 8);
        if ((ack === this._pending[0])) {
            [pending, this._pending] = [this._pending, [(- 1), null]];
            pending[1].set_result(true);
        }
    }

    _handle_nak(control: number) {
        /* Handle negative acknowledgment frame */
        let nak = (control & 7);
        if ((nak === this._pending[0])) {
            this._pending[1].set_result(false);
        }
    }

    data(data: Buffer) {
        /* Send a data frame */
        let seq = this._send_seq;
        this._send_seq = ((seq + 1) % 8);
        this._nextIterator.next({ data, seq });
    }

    _data_frame(data: Buffer, seq: number, rxmit: number) {
        /* Construct a data frame */
        let control;
        console.assert(((0 <= seq) && (seq <= 7)));
        console.assert(((0 <= rxmit) && (rxmit <= 1)));
        control = (((seq << 4) | (rxmit << 3)) | this._rec_seq);
        return this._frame([control], this._randomize(data));
    }

    _ack_frame() {
        /* Construct a acknowledgement frame */
        let control;
        console.assert(((0 <= this._rec_seq) && (this._rec_seq < 8)));

        control = [(0b10000000 | (this._rec_seq & 0b00000111))];
        return this._frame(control);
    }

    _rst_frame() {
        /* Construct a reset frame */
        return Buffer.concat([Buffer.from([CANCEL]), this._frame([0xC0])]);
    }

    _frame(control: ArrayLike<number>, data?: ArrayLike<number>) {
        /* Construct a frame */
        const ctrlArr: Array<number> = Array.from(control);
        const dataArr: Array<number> = (data && Array.from(data)) || [];

        const sum = ctrlArr.concat(dataArr);

        let crc = crc16ccitt(Buffer.from(sum), 65535);
        let crcArr = [(crc >> 8), (crc % 256)];
        return Buffer.concat([this._stuff(sum.concat(crcArr)), Buffer.from([FLAG])]);
    }

    _randomize(s: Buffer) {
        /*XOR s with a pseudo-random sequence for transmission
        Used only in data frames
        */
        let rand = 66;
        let out = new Buffer(s.length);
        let outIdx = 0;
        for (let c of s){
            out.writeUInt8(c ^ rand, outIdx++);
            if ((rand % 2)) {
                rand = ((rand >> 1) ^ 0xB8);
            } else {
                rand = (rand >> 1);
            }
        }
        return out;
    }

    _stuff(s: Iterable<number>): Buffer {
        /* Byte stuff (escape) a string for transmission */
        let out = Buffer.alloc(256);
        let outIdx = 0;
        for (const c of s) {
            if (RESERVED.includes(c)) {
                out.writeUInt8(ESCAPE, outIdx++);
                out.writeUInt8(c ^ 0x20, outIdx++);
            } else {
                out.writeUInt8(c, outIdx++);
            }
        }
        return out.slice(0, outIdx);
    }

    _unstuff(s: Buffer) {
        /* Unstuff (unescape) a string after receipt */
        let escaped = false;
        let out = new Buffer(s.length);
        let outIdx = 0;
        for (let idx = 0; idx < s.length; idx += 1) {
            const c = s[idx];
            if (escaped) {
                out.writeUInt8(c ^ 0x20, outIdx++);
                escaped = false;
            } else {
                if ((c === 0x7D)) {
                    escaped = true;
                } else {
                    out.writeUInt8(c, outIdx++);
                }
            }
        }
        return out;
    }

    static connect(portAddress: string, connectionOptions: {}, logger: any): Promise<[UartProtocol, SerialPort]> {
        const SerialPort = require('serialport');
        const port = new SerialPort(portAddress, connectionOptions);
        const protocol = new UartProtocol((data: Buffer) => {
                //console.log('Writing to port', portAddress, data.toString('hex'));
                return new Promise<void>((resolve, reject) => {
                    port.write(data, (err: Error) => {
                        if (!err) {
                            resolve();
                        } else {
                            reject(err)
                        }
                    });
                })
            },
            logger
        );

        port.on('data', (data: any) => protocol.data_received(data))

        return new Promise((resolve, reject) => {
            port.on('open', () => {
                logger('port open. resetting');
                protocol.reset().then(
                    () => {
                        logger('successfully reset');
                        resolve([protocol, port]);
                    }, (err) => {
                        logger(err); 
                        reject()
                    }
                );
            }, (err: any) => {
                logger(err);
                reject()
            });
        })
    }
}
