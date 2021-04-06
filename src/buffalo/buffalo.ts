import {Options, Value} from './tstype';
import {IsNumberArray} from '../utils';

class Buffalo {
    protected position: number;
    protected buffer: Buffer;

    public constructor(buffer: Buffer, position = 0) {
        this.position = position;
        this.buffer = buffer;
    }

    public getPosition(): number {
        return this.position;
    }

    public getBuffer(): Buffer {
        return this.buffer;
    }

    public getWritten(): Buffer {
        return this.buffer.slice(0, this.position);
    }

    public isMore(): boolean {
        return this.position < this.buffer.length;
    }

    public writeInt8(value: number): void {
        this.buffer.writeInt8(value, this.position);
        this.position++;
    }

    public readInt8(): number {
        const value = this.buffer.readInt8(this.position);
        this.position++;
        return value;
    }

    public writeUInt8(value: number): void {
        this.buffer.writeUInt8(value, this.position);
        this.position++;
    }

    public readUInt8(): number {
        const value = this.buffer.readUInt8(this.position);
        this.position++;
        return value;
    }

    public writeUInt16(value: number): void {
        this.buffer.writeUInt16LE(value, this.position);
        this.position += 2;
    }

    public readUInt24(): number {
        const value = this.buffer.readUIntLE(this.position, 3);
        this.position += 3;
        return value;
    }

    public writeUInt24(value: number): void {
        this.buffer.writeUIntLE(value, this.position, 3);
        this.position += 3;
    }

    public readInt24(): number {
        const value = this.buffer.readIntLE(this.position, 3);
        this.position += 3;
        return value;
    }

    public writeInt24(value: number): void {
        this.buffer.writeIntLE(value, this.position, 3);
        this.position += 3;
    }

    public readUInt16(): number {
        const value = this.buffer.readUInt16LE(this.position);
        this.position += 2;
        return value;
    }

    public writeInt16(value: number): void {
        this.buffer.writeInt16LE(value, this.position);
        this.position += 2;
    }

    public readInt16(): number {
        const value = this.buffer.readInt16LE(this.position);
        this.position += 2;
        return value;
    }

    public writeUInt32(value: number): void {
        this.buffer.writeUInt32LE(value, this.position);
        this.position += 4;
    }

    public readUInt32(): number {
        const value = this.buffer.readUInt32LE(this.position);
        this.position += 4;
        return value;
    }

    public writeInt32(value: number): void {
        this.buffer.writeInt32LE(value, this.position);
        this.position += 4;
    }

    public readInt32(): number {
        const value = this.buffer.readInt32LE(this.position);
        this.position += 4;
        return value;
    }

    public writeFloatLE(value: number): void {
        this.buffer.writeFloatLE(value, this.position);
        this.position += 4;
    }

    public readFloatLE(): number {
        const value = this.buffer.readFloatLE(this.position);
        this.position += 4;
        return value;
    }

    public writeDoubleLE(value: number): void {
        this.buffer.writeDoubleLE(value, this.position);
        this.position += 8;
    }

    public readDoubleLE(): number {
        const value = this.buffer.readDoubleLE(this.position);
        this.position += 8;
        return value;
    }

    public writeIeeeAddr(value: string): void {
        this.writeUInt32(parseInt(value.slice(10), 16));
        this.writeUInt32(parseInt(value.slice(2, 10), 16));
    }

    public readIeeeAddr(): string {
        const octets = Array.from(this.readBuffer(8).reverse());
        return '0x' + octets.map(octet => octet.toString(16).padStart(2, '0')).join("");
    }

    protected readBuffer(length: number): Buffer {
        const value = this.buffer.slice(this.position, this.position + length);
        this.position += length;
        return value;
    }

    protected writeBuffer(values: Buffer | number[], length: number): void {
        if (values.length !== length) {
            throw new Error(`Length of values: '${values}' is not consitent with expected length '${length}'`);
        }

        if (!(values instanceof Buffer)) {
            values = Buffer.from(values);
        }

        this.position += values.copy(this.buffer, this.position);
    }

    public writeListUInt8(values: number[]): void {
        for (const value of values) {
            this.writeUInt8(value);
        }
    }

    public readListUInt8(options: Options): number[] {
        const value = [];
        for (let i = 0; i < options.length; i++) {
            value.push(this.readUInt8());
        }
        return value;
    }

    public writeListUInt16(values: number[]): void {
        for (const value of values) {
            this.writeUInt16(value);
        }
    }

    public readListUInt16(options: Options): number[] {
        const value = [];
        for (let i = 0; i < options.length; i++) {
            value.push(this.readUInt16());
        }

        return value;
    }

    public writeListUInt24(values: number[]): void {
        for (const value of values) {
            this.writeUInt24(value);
        }
    }

    public readListUInt24(options: Options): number[] {
        const value = [];
        for (let i = 0; i < options.length; i++) {
            value.push(this.readUInt24());
        }

        return value;
    }

    public writeListUInt32(values: number[]): void {
        for (const value of values) {
            this.writeUInt32(value);
        }
    }

    public readListUInt32(options: Options): number[] {
        const value = [];
        for (let i = 0; i < options.length; i++) {
            value.push(this.readUInt32());
        }
        return value;
    }

    public readUtf8String(length: number): string {
        const value = this.buffer.toString('utf8', this.position, this.position + length);
        this.position += length;
        return value;
    }

    public writeUtf8String(value: string): void {
        this.position += this.buffer.write(value, this.position, 'utf8');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public write(type: string, value: Value, options: Options): void {
        if (type === 'UINT8') {
            this.writeUInt8(value);
        } else if (type === 'UINT16') {
            this.writeUInt16(value);
        } else if (type === 'UINT32') {
            this.writeUInt32(value);
        }  else if (type === 'IEEEADDR') {
            this.writeIeeeAddr(value);
        } else if (type.startsWith('BUFFER') && (Buffer.isBuffer(value) || IsNumberArray(value))) {
            let length = Number(type.replace('BUFFER', ''));
            length = length != 0 ? length : value.length;
            this.writeBuffer(value, length);
        } else if (type === 'INT8') {
            this.writeInt8(value);
        } else if (type === 'INT16') {
            this.writeInt16(value);
        } else if (type === 'UINT24') {
            this.writeUInt24(value);
        } else if (type === 'INT24') {
            this.writeInt24(value);
        } else if (type === 'INT32') {
            this.writeInt32(value);
        } else if (type === 'FLOATLE') {
            this.writeFloatLE(value);
        } else if (type === 'DOUBLELE') {
            this.writeDoubleLE(value);
        } else if (type === 'EMPTY') {
            /* nothing to write */
        } else if (type === 'LIST_UINT8') {
            this.writeListUInt8(value);
        } else if (type === 'LIST_UINT16') {
            this.writeListUInt16(value);
        } else if (type === 'LIST_UINT24') {
            this.writeListUInt24(value);
        } else if (type === 'LIST_UINT32') {
            this.writeListUInt32(value);
        } else {
            throw new Error(`Write for '${type}' not available`);
        }
    }

    public read(type: string, options: Options): Value {
        if (type === 'UINT8') {
            return this.readUInt8();
        } else if (type === 'UINT16') {
            return this.readUInt16();
        } else if (type === 'UINT32') {
            return this.readUInt32();
        }  else if (type === 'IEEEADDR') {
            return this.readIeeeAddr();
        } else if (type.startsWith('BUFFER')) {
            let length = Number(type.replace('BUFFER', ''));
            length = length != 0 ? length : options.length;
            return this.readBuffer(length);
        } else if (type === 'INT8') {
            return this.readInt8();
        } else if (type === 'INT16') {
            return this.readInt16();
        } else if (type === 'UINT24') {
            return this.readUInt24();
        } else if (type === 'INT24') {
            return this.readInt24();
        } else if (type === 'INT32') {
            return this.readInt32();
        } else if (type === 'FLOATLE') {
            return this.readFloatLE();
        } else if (type === 'DOUBLELE') {
            return this.readDoubleLE();
        } else if (type === 'EMPTY') {
            return null;
        } else if (type === 'LIST_UINT8') {
            return this.readListUInt8(options);
        } else if (type === 'LIST_UINT16') {
            return this.readListUInt16(options);
        } else if (type === 'LIST_UINT24') {
            return this.readListUInt24(options);
        } else if (type === 'LIST_UINT32') {
            return this.readListUInt32(options);
        } else {
            throw new Error(`Read for '${type}' not available`);
        }
    }
}

export default Buffalo;
