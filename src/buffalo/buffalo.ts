import {Options} from './tstype';

class Buffalo {
    private static write_UINT8(buffer: Buffer, offset: number, value: number) {
        buffer.writeUInt8(value, offset);
        return 1;
    }

    private static read_UINT8(buffer: Buffer, offset: number) {
        return {value: buffer.readUInt8(offset), length: 1};
    }

    private static write_UINT16(buffer: Buffer, offset: number, value: number) {
        buffer.writeUInt16LE(value, offset);
        return 2;
    }

    private static read_UINT16(buffer: Buffer, offset: number) {
        return {value: buffer.readUInt16LE(offset), length: 2};
    }

    private static write_UINT32(buffer: Buffer, offset: number, value: number) {
        buffer.writeUInt32LE(value, offset);
        return 4;
    }

    private static read_UINT32(buffer: Buffer, offset: number) {
        return {value: buffer.readUInt32LE(offset), length: 4};
    }

    private static write_IEEEADDR(buffer: Buffer, offset: number, value: string) {
        buffer.writeUInt32LE(parseInt(value.slice(10), 16), offset);
        buffer.writeUInt32LE(parseInt(value.slice(2, 10), 16), offset + 4);
        return 8;
    }

    private static read_IEEEADDR(buffer: Buffer, offset: number) {
        const length = 8;
        const value = buffer.slice(offset, offset + length)
        return {value: Buffalo.addressBufferToString(value), length};
    }

    private static write_BUFFER(buffer: Buffer, offset: number, values: number[]) {
        return Buffalo.writeBuffer(buffer, offset, values, values.length);
    }

    private static read_BUFFER(buffer: Buffer, offset: number, options: {length: number}) {
        return Buffalo.readBuffer(buffer, offset, options.length);
    }

    private static write_BUFFER8(buffer: Buffer, offset: number, values: number[]) {
        return Buffalo.writeBuffer(buffer, offset, values, 8);
    }

    private static read_BUFFER8(buffer: Buffer, offset: number) {
        return Buffalo.readBuffer(buffer, offset, 8);
    }

    private static write_BUFFER16(buffer: Buffer, offset: number, values: number[]) {
        return Buffalo.writeBuffer(buffer, offset, values, 16);
    }

    private static read_BUFFER16(buffer: Buffer, offset: number) {
        return Buffalo.readBuffer(buffer, offset, 16);
    }

    private static write_BUFFER18(buffer: Buffer, offset: number, values: number[]) {
        return Buffalo.writeBuffer(buffer, offset, values, 18);
    }

    private static read_BUFFER18(buffer: Buffer, offset: number) {
        return Buffalo.readBuffer(buffer, offset, 18);
    }

    private static write_BUFFER32(buffer: Buffer, offset: number, values: number[]) {
        return Buffalo.writeBuffer(buffer, offset, values, 32);
    }

    private static read_BUFFER32(buffer: Buffer, offset: number) {
        return Buffalo.readBuffer(buffer, offset, 32);
    }

    private static write_BUFFER42(buffer: Buffer, offset: number, values: number[]) {
        return Buffalo.writeBuffer(buffer, offset, values, 42);
    }

    private static read_BUFFER42(buffer: Buffer, offset: number) {
        return Buffalo.readBuffer(buffer, offset, 42);
    }

    private static write_BUFFER100(buffer: Buffer, offset: number, values: number[]) {
        return Buffalo.writeBuffer(buffer, offset, values, 100);
    }

    private static read_BUFFER100(buffer: Buffer, offset: number) {
        return Buffalo.readBuffer(buffer, offset, 100);
    }

    protected static addressBufferToString(buffer: Buffer): string {
        let address = '0x';
        for (let i = 0; i < buffer.length; i++) {
            const value = buffer.readUInt8(buffer.length - i - 1);
            if (value <= 15) {
                address += '0' + value.toString(16);
            } else {
                address += value.toString(16);
            }
        }

        return address;
    }

    protected static readBuffer(buffer: Buffer, offset: number, length: number) {
        return {value: buffer.slice(offset, offset + length), length};
    }

    protected static writeBuffer(buffer: Buffer, offset: number, values: number[], length: number): number {
        if (values.length !== length) {
            throw new Error(`Length of values: '${values}' is not consitent with expected length '${length}'`);
        }

        for (let value of values) {
            buffer.writeUInt8(value, offset);
            offset += 1;
        }

        return values.length;
    }

    public static write(type: string, buffer: Buffer, offset: number, value: number|number[]|string|Buffer|{[s: string]: number|string}[]) {
        const key = `write_${type}`;

        //@ts-ignore
        if (!this[key]) {
            throw new Error(`Write for '${type}' not available`);
        }

        //@ts-ignore
        return this[key](buffer, offset, value);
    }

    public static read(type: string, buffer: Buffer, offset: number, options: Options) {
        const key = `read_${type}`;

        //@ts-ignore
        if (!this[key]) {
            throw new Error(`Read for '${type}' not available`);
        }

        //@ts-ignore
        return this[key](buffer, offset, options);
    }
}

export default Buffalo;
