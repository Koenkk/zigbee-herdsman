import {BuffaloZdo} from '../../../zspec/zdo/buffaloZdo';

class ZiGateZdoBuffalo extends BuffaloZdo {
    public writeUInt16(value: number): void {
        this.buffer.writeUInt16BE(value, this.position);
        this.position += 2;
    }

    public writeUInt32(value: number): void {
        this.buffer.writeUInt32BE(value, this.position);
        this.position += 4;
    }

    public writeIeeeAddr(value: string /*TODO: EUI64*/): void {
        this.writeUInt32(parseInt(value.slice(2, 10), 16));
        this.writeUInt32(parseInt(value.slice(10), 16));
    }
}

/**
 * Patch BuffaloZdo to use Big Endian variants.
 */
export const patchZdoBuffaloBE = (): void => {
    BuffaloZdo.prototype.writeUInt16 = ZiGateZdoBuffalo.prototype.writeUInt16;
    BuffaloZdo.prototype.writeUInt32 = ZiGateZdoBuffalo.prototype.writeUInt32;
    BuffaloZdo.prototype.writeIeeeAddr = ZiGateZdoBuffalo.prototype.writeIeeeAddr;
};
