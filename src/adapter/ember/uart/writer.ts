/* v8 ignore start */

import {Readable} from "node:stream";
import {ASH_MAX_FRAME_WITH_CRC_LEN} from "./consts";

// import {logger} from '../../../utils/logger';

// const NS = 'zh:ember:uart:ash:writer';

export class AshWriter extends Readable {
    #writtenLen = 0;
    #bytesToWrite = Buffer.alloc(ASH_MAX_FRAME_WITH_CRC_LEN);

    private writeBytes(): void {
        // expensive and very verbose, enable locally only if necessary
        // logger.debug(`>>>> [FRAME raw=${buffer.toString('hex')}]`, NS);

        // copy, can't use ref
        const buffer = Buffer.from(this.#bytesToWrite.subarray(0, this.#writtenLen));
        this.#writtenLen = 0;

        // this.push(buffer);
        this.emit("data", buffer);
    }

    public writeByte(byte: number): void {
        this.#writtenLen = this.#bytesToWrite.writeUInt8(byte, this.#writtenLen);
    }

    public writeAvailable(): boolean {
        if (this.readableLength < this.readableHighWaterMark) {
            return true;
        }

        this.writeFlush();

        return false;
    }

    /**
     * If there is anything to send, send to the port.
     */
    public writeFlush(): void {
        if (this.#writtenLen > 0) {
            this.writeBytes();
        }
    }

    public override _read(): void {}
}
