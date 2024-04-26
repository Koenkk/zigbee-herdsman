/* istanbul ignore file */
/* eslint-disable */
import {Buffalo} from '../../../buffalo';
import {BuffaloZclOptions} from '../../../zcl/tstype';
import {LOG_LEVEL} from "./constants";
import ParameterType from './parameterType';

export interface BuffaloZiGateOptions extends BuffaloZclOptions {
    startIndex?: number;
}

class BuffaloZiGate extends Buffalo {
    public static addressBufferToStringBE(buffer: Buffer): string {
        let address = '0x';
        for (let i = 0; i < buffer.length; i++) {
            const value = buffer.readUInt8(i);
            if (value <= 15) {
                address += '0' + value.toString(16);
            } else {
                address += value.toString(16);
            }
        }

        return address;
    }

    public write(type: ParameterType, value: any, options: BuffaloZiGateOptions): void {
        switch (type) {
        case ParameterType.UINT8: {
            return this.writeUInt8(value);
        }
        case ParameterType.UINT16: {
            return this.writeUInt16(value);
        }
        case ParameterType.UINT32: {
            return this.writeUInt32(value);
        }
        case ParameterType.IEEEADDR: {
            return this.writeIeeeAddr(value);
        }
        case ParameterType.BUFFER: {
            return this.writeBuffer(value, options.length);
        }
        case ParameterType.BUFFER8: {
            return this.writeBuffer(value, 8);
        }
        case ParameterType.BUFFER16: {
            return this.writeBuffer(value, 16);
        }
        case ParameterType.BUFFER18: {
            return this.writeBuffer(value, 18);
        }
        case ParameterType.BUFFER32: {
            return this.writeBuffer(value, 32);
        }
        case ParameterType.BUFFER42: {
            return this.writeBuffer(value, 42);
        }
        case ParameterType.BUFFER100: {
            return this.writeBuffer(value, 100);
        }
        case ParameterType.LIST_UINT8: {
            return this.writeListUInt8(value);
        }
        case ParameterType.LIST_UINT16: {
            return this.writeListUInt16(value);
        }
        case ParameterType.INT8: {
            return this.writeInt8(value);
        }
        case ParameterType.MACCAPABILITY: {
            break;
        }
        case ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY: {
            // XXX: read???
            const addressMode = this.buffer.readUInt8(this.position - 1);
            if (addressMode == 3) {
                this.writeIeeeAddr(value)
            } else {
                this.writeUInt16BE(value);
            }
        }
        case ParameterType.RAW: {
            return this.writeRaw(value);
        }
        case ParameterType.UINT16BE: {
           this.writeUInt16BE(value);
        }
        case ParameterType.UINT32BE: {
           this.writeUInt32BE(value);
        }
        }
    }

    public read(type: ParameterType, options: BuffaloZiGateOptions): any {
        switch (type) {
        case ParameterType.UINT8: {
            return this.readUInt8();
        }
        case ParameterType.UINT16: {
            return this.readUInt16();
        }
        case ParameterType.UINT32: {
            return this.readUInt32();
        }
        case ParameterType.IEEEADDR: {
            return this.readIeeeAddr();
        }
        case ParameterType.BUFFER: {
            return this.readBuffer(options.length);
        }
        case ParameterType.BUFFER8: {
            return this.readBuffer(8);
        }
        case ParameterType.BUFFER16: {
            return this.readBuffer(16);
        }
        case ParameterType.BUFFER18: {
            return this.readBuffer(18);
        }
        case ParameterType.BUFFER32: {
            return this.readBuffer(32);
        }
        case ParameterType.BUFFER42: {
            return this.readBuffer(42);
        }
        case ParameterType.BUFFER100: {
            return this.readBuffer(100);
        }
        case ParameterType.LIST_UINT8: {
            return this.readListUInt8(options.length);
        }
        case ParameterType.LIST_UINT16: {
            return this.readListUInt16(options.length);
        }
        case ParameterType.INT8: {
            return this.readInt8();
        }
        case ParameterType.MACCAPABILITY: {
            const result: { [k: string]: boolean | number } = {};
            const mac = this.readUInt8();
            //
            result.alternatePanCoordinator = !!(mac & 0b00000001);
            // bit 0: Alternative PAN Coordinator, always 0
            result.fullFunctionDevice = !!(mac & 0b00000010);
            // bit 1: Device Type, 1 = FFD , 0 = RFD ; cf. https://fr.wikipedia.org/wiki/IEEE_802.15.4
            result.mainsPowerSource = !!(mac & 0b00000100);
            // bit 2: Power Source, 1 = mains power, 0 = other
            result.receiverOnWhenIdle = !!(mac & 0b00001000);
            // bit 3: Receiver on when Idle, 1 = non-sleepy, 0 = sleepy
            result.reserved = (mac & 0b00110000) >> 4;
            // bit 4&5: Reserved
            result.securityCapability = !!(mac & 0b01000000);
            // bit 6: Security capacity, always 0 (standard security)
            result.allocateAddress = !!(mac & 0b10000000);
            // bit 7: 1 = joining device must be issued network address

            return result;
        }
        case ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY: {
            const addressMode = this.buffer.readUInt8(this.position - 1);
            return addressMode == 3 ? this.readIeeeAddr() : this.readUInt16BE();
        }
        case ParameterType.RAW: {
            break;
        }
        case ParameterType.UINT16BE: {
           return this.readUInt16BE();
        }
        case ParameterType.UINT32BE: {
           return this.readUInt32BE();
        }
        case ParameterType.BUFFER_RAW: {
            const buffer = this.buffer.subarray(this.position);
            this.position += buffer.length;
            return buffer;
        }
        case ParameterType.STRING: {
            const buffer = this.buffer.subarray(this.position);
            this.position += buffer.length;
            return unescape(buffer.toString());
        }
        case ParameterType.LOG_LEVEL: {
            return LOG_LEVEL[this.readUInt8()];
        }
        case ParameterType.MAYBE_UINT8: {
            return this.isMore() ? this.readUInt8() : null;
        }
        }
    }

    public writeRaw(value: Buffer): void {
        this.buffer.set(value, this.position);
        this.position++;
    }

    public writeIeeeAddr(value: string): void {
        this.writeUInt32BE(parseInt(value.slice(2, 10), 16));
        this.writeUInt32BE(parseInt(value.slice(10), 16));
    }

    public readIeeeAddr(): string {
        const length = 8;
        const value = this.readBuffer(length);
        return BuffaloZiGate.addressBufferToStringBE(value);
    }

    public readUInt16BE(): number {
        const value = this.buffer.readUInt16BE(this.position);
        this.position += 2;
        return value;
    }

    public readUInt32BE(): number {
        const value = this.buffer.readUInt32BE(this.position);
        this.position += 4;
        return value;
    }

    public writeUInt16BE(value: number): void {
        this.buffer.writeUInt16BE(value, this.position);
        this.position += 2;
    }

    public writeUInt32BE(value: number): void {
        this.buffer.writeUInt32BE(value, this.position);
        this.position += 4;
    }
}

export default BuffaloZiGate;
