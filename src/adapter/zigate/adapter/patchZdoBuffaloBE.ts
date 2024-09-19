import {EUI64} from '../../../zspec/tstypes';
import {BuffaloZdo} from '../../../zspec/zdo/buffaloZdo';

class ZiGateZdoBuffalo extends BuffaloZdo {
    public writeUInt16(value: number): void {
        this.buffer.writeUInt16BE(value, this.position);
        this.position += 2;
    }

    public readUInt16(): number {
        const value = this.buffer.readUInt16BE(this.position);
        this.position += 2;
        return value;
    }

    public writeUInt32(value: number): void {
        this.buffer.writeUInt32BE(value, this.position);
        this.position += 4;
    }

    public readUInt32(): number {
        const value = this.buffer.readUInt32BE(this.position);
        this.position += 4;
        return value;
    }

    public writeIeeeAddr(value: string /*TODO: EUI64*/): void {
        this.writeUInt32(parseInt(value.slice(2, 10), 16));
        this.writeUInt32(parseInt(value.slice(10), 16));
    }

    public readIeeeAddr(): EUI64 {
        return `0x${this.readBuffer(8).toString('hex')}`;
    }
}

/**
 * Patch BuffaloZdo to use Big Endian variants.
 */
export const patchZdoBuffaloBE = (): void => {
    BuffaloZdo.prototype.writeUInt16 = ZiGateZdoBuffalo.prototype.writeUInt16;
    BuffaloZdo.prototype.readUInt16 = ZiGateZdoBuffalo.prototype.readUInt16;
    BuffaloZdo.prototype.writeUInt32 = ZiGateZdoBuffalo.prototype.writeUInt32;
    BuffaloZdo.prototype.readUInt32 = ZiGateZdoBuffalo.prototype.readUInt32;
    BuffaloZdo.prototype.writeIeeeAddr = ZiGateZdoBuffalo.prototype.writeIeeeAddr;
    BuffaloZdo.prototype.readIeeeAddr = ZiGateZdoBuffalo.prototype.readIeeeAddr;
};
