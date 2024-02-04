/* istanbul ignore file */
import * as stream from 'stream';
import {ASH_ESCAPE, ASH_CANCEL, ASH_FLAG, RESERVED, ASH_FLIP, ASH_WAKE} from './consts';
import Debug from "debug";
import {AshFrame} from './frame';
import {ASH_FRMNUM_BIT, ASH_RFLAG_BIT, AshFrameType} from './consts';

const debug = Debug('zigbee-herdsman:adapter:ezsp:uart');

export class Writer extends stream.Readable {
    public writeBuffer(buffer: Buffer): void {
        debug(`--> [${buffer.toString('hex')}]`);
        this.push(buffer);
    }

    public _read(): void {
    }

    /**
     * Construct & write a acknowledgement (ACK) frame
     */
    public sendACK(ackNum: number): void {
        debug(`--> ACK num=${ackNum}`);
        const ackFrame = this.makeFrame((AshFrameType.ACK | ackNum));

        this.writeBuffer(ackFrame);
    }

    /**
     * Construct & write a negative acknowledgement (NAK) frame
     */
    public sendNAK(ackNum: number): void {
        debug(`--> NAK num=${ackNum}`);
        const nakFrame = this.makeFrame((AshFrameType.NAK | ackNum));

        this.writeBuffer(nakFrame);
    }

    /**
     * Construct & write a reset (RST) frame
     */
    public sendReset(): void {
        debug(`--> RST`);
        const rstFrame = Buffer.concat([Buffer.from([ASH_CANCEL]), this.makeFrame(AshFrameType.RST)]);

        this.writeBuffer(rstFrame);
    }

    /**
     * Construct & write a DATA frame
     */
    public sendData(data: Buffer, seq: number, reTx: number, ackSeq: number): void {
        debug(`--> DATA Seq=${seq}, ACKSeq=${ackSeq} ReTx=${reTx}; data: ${data.toString('hex')}`);
        const control = (((seq << ASH_FRMNUM_BIT) | (reTx << ASH_RFLAG_BIT)) | ackSeq);
        const dataFrame = this.makeFrame(control, data);

        this.writeBuffer(dataFrame);
    }

    /**
     * Wakes up the NCP by sending two 0xFF bytes. When the NCP wakes, it sends back an 0xFF byte.
     * XXX: not supported for now.
     */
    public sendWake(): void {
        debug(`--> WAKE`);

        this.writeBuffer(Buffer.from([ASH_WAKE, ASH_WAKE]));
    }

    /**
     * Byte stuff (escape reserved bytes) a buffer for transmission.
     * @param buf
     */
    private stuff(buf: Buffer): Buffer {
        const out = Buffer.alloc(256);
        let outIdx = 0;

        for (const b of buf) {
            if (RESERVED.includes(b)) {
                out.writeUInt8(ASH_ESCAPE, outIdx++);
                out.writeUInt8(b ^ ASH_FLIP, outIdx++);
            } else {
                out.writeUInt8(b, outIdx++);
            }
        }

        return out.subarray(0, outIdx);
    }

    /**
     * Make a full frame with valid CRC & FLAG from given control and data fields.
     * @param control
     * @param data Omitted in non-data frames
     */
    private makeFrame(control: number, data?: Buffer): Buffer {
        const ctrl = Buffer.from([control]);
        const frm = (data) ? Buffer.concat([ctrl, data]) : ctrl;
        const crcArr = AshFrame.computeCrc(frm);

        return Buffer.concat([this.stuff(Buffer.concat([frm, crcArr])), Buffer.from([ASH_FLAG])]);
    }
}