/* v8 ignore start */

import {Buffalo} from "../../../buffalo";
import {Utils as ZSpecUtils} from "../../../zspec";
import type {Eui64} from "../../../zspec/tstypes";
import type {BuffaloZclOptions} from "../../../zspec/zcl/definition/tstype";
import {getMacCapFlags} from "../../../zspec/zdo/utils";
import {LogLevel} from "./constants";
import ParameterType from "./parameterType";

export interface BuffaloZiGateOptions extends BuffaloZclOptions {
    startIndex?: number;
}

class BuffaloZiGate extends Buffalo {
    // biome-ignore lint/suspicious/noExplicitAny: API
    public write(type: ParameterType, value: any, _options: BuffaloZiGateOptions): void {
        switch (type) {
            case ParameterType.UINT8: {
                this.writeUInt8(value);
                break;
            }
            case ParameterType.UINT16: {
                this.writeUInt16BE(value);
                break;
            }
            case ParameterType.UINT32: {
                this.writeUInt32BE(value);
                break;
            }
            case ParameterType.IEEEADDR: {
                this.writeIeeeAddrBE(value);
                break;
            }
            case ParameterType.BUFFER: {
                this.writeBuffer(value, value.length);
                break;
            }
            case ParameterType.BUFFER8: {
                this.writeBuffer(value, 8);
                break;
            }
            case ParameterType.BUFFER16: {
                this.writeBuffer(value, 16);
                break;
            }
            case ParameterType.BUFFER18: {
                this.writeBuffer(value, 18);
                break;
            }
            case ParameterType.BUFFER32: {
                this.writeBuffer(value, 32);
                break;
            }
            case ParameterType.BUFFER42: {
                this.writeBuffer(value, 42);
                break;
            }
            case ParameterType.BUFFER100: {
                this.writeBuffer(value, 100);
                break;
            }
            case ParameterType.LIST_UINT8: {
                this.writeListUInt8(value);
                break;
            }
            case ParameterType.LIST_UINT16: {
                this.writeListUInt16BE(value);
                break;
            }
            case ParameterType.INT8: {
                this.writeInt8(value);
                break;
            }
            case ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY: {
                const addressMode = this.buffer.readUInt8(this.position - 1);
                addressMode === 3 ? this.writeIeeeAddrBE(value) : this.writeUInt16BE(value);
                break;
            }
            case ParameterType.RAW: {
                this.writeRaw(value);
                break;
            }
            default: {
                throw new Error(`Write for '${type}' not available`);
            }
        }
    }

    public read(type: ParameterType, options: BuffaloZiGateOptions): unknown {
        switch (type) {
            case ParameterType.UINT8: {
                return this.readUInt8();
            }
            case ParameterType.UINT16: {
                return this.readUInt16BE();
            }
            case ParameterType.UINT32: {
                return this.readUInt32BE();
            }
            case ParameterType.IEEEADDR: {
                return this.readIeeeAddrBE();
            }
            case ParameterType.BUFFER: {
                // if length option not specified, read the whole buffer
                return this.readBuffer(options.length ?? this.buffer.length);
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
                return this.readListUInt8(options.length ?? 0); // XXX: should always be valid?
            }
            case ParameterType.LIST_UINT16: {
                return this.readListUInt16BE(options.length ?? 0); // XXX: should always be valid?
            }
            case ParameterType.INT8: {
                return this.readInt8();
            }
            case ParameterType.MACCAPABILITY: {
                return getMacCapFlags(this.readUInt8());
            }
            case ParameterType.ADDRESS_WITH_TYPE_DEPENDENCY: {
                const addressMode = this.buffer.readUInt8(this.position - 1);
                return addressMode === 3 ? this.readIeeeAddrBE() : this.readUInt16BE();
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
                return LogLevel[this.readUInt8()];
            }
            case ParameterType.MAYBE_UINT8: {
                return this.isMore() ? this.readUInt8() : null;
            }
        }

        throw new Error(`Read for '${type}' not available`);
    }

    public writeRaw(value: Buffer): void {
        this.buffer.set(value, this.position);
        this.position += value.length;
    }

    public readUInt16BE(): number {
        const value = this.buffer.readUInt16BE(this.position);
        this.position += 2;
        return value;
    }
    public writeUInt16BE(value: number): void {
        this.position = this.buffer.writeUInt16BE(value, this.position);
    }

    public readUInt32BE(): number {
        const value = this.buffer.readUInt32BE(this.position);
        this.position += 4;
        return value;
    }
    public writeUInt32BE(value: number): void {
        this.position = this.buffer.writeUInt32BE(value, this.position);
    }

    public readListUInt16BE(length: number): number[] {
        const value: number[] = [];
        for (let i = 0; i < length; i++) {
            value.push(this.readUInt16BE());
        }

        return value;
    }
    public writeListUInt16BE(values: number[]): void {
        for (const value of values) {
            this.writeUInt16BE(value);
        }
    }

    public readIeeeAddrBE(): Eui64 {
        return ZSpecUtils.eui64BEBufferToHex(this.readBuffer(8));
    }

    public writeIeeeAddrBE(value: string /*TODO: EUI64*/): void {
        this.writeUInt32BE(Number.parseInt(value.slice(2, 10), 16));
        this.writeUInt32BE(Number.parseInt(value.slice(10), 16));
    }
}

export default BuffaloZiGate;
