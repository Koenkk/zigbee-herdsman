/* v8 ignore start */
export class int_t {
    static _signed = true;

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static serialize(cls: any, value: number): Buffer {
        const buffer = Buffer.alloc(cls._size, 0);
        if (cls._signed) {
            buffer.writeIntLE(value, 0, cls._size);
        } else {
            buffer.writeUIntLE(value, 0, cls._size);
        }
        return buffer;
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static deserialize(cls: any, data: Buffer): any[] {
        return [cls._signed ? data.readIntLE(0, cls._size) : data.readUIntLE(0, cls._size), data.subarray(cls._size)];
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static valueToName(cls: any, value: any): string {
        for (const prop of Object.getOwnPropertyNames(cls)) {
            const desc = Object.getOwnPropertyDescriptor(cls, prop);
            if (desc !== undefined && desc.enumerable && desc.writable && value == desc.value) {
                return `${cls.name}.${prop}`;
            }
        }
        return '';
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static valueName(cls: any, value: any): string {
        for (const prop of Object.getOwnPropertyNames(cls)) {
            const desc = Object.getOwnPropertyDescriptor(cls, prop);
            if (desc !== undefined && desc.enumerable && desc.writable && value == desc.value) {
                return `${prop}`;
            }
        }
        return '';
    }
}

export class int8s extends int_t {
    static _size = 1;
}

export class int16s extends int_t {
    static _size = 2;
}

export class int24s extends int_t {
    static _size = 3;
}

export class int32s extends int_t {
    static _size = 4;
}

export class int64s extends int_t {
    static _size = 8;
}

export class uint_t extends int_t {
    static override _signed = false;
}

export class uint8_t extends uint_t {
    static _size = 1;
}

export class uint16_t extends uint_t {
    static _size = 2;
}

export class uint24_t extends uint_t {
    static _size = 3;
}

export class uint32_t extends uint_t {
    static _size = 4;
}

export class uint64_t extends uint_t {
    static _size = 8;
}

export class LVBytes {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static serialize(cls: any, value: any[]): Buffer {
        if (Buffer.isBuffer(value)) {
            const ret = Buffer.alloc(1);
            ret.writeUInt8(value.length, 0);
            return Buffer.concat([ret, value]);
        }
        return Buffer.from([value.length].concat(value));
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static deserialize(cls: any, data: Buffer): any[] {
        const l = data.readIntLE(0, 1);
        const s = data.subarray(1, l + 1);
        return [s, data.subarray(l + 1)];
    }
}

export abstract class List {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static serialize(cls: any, value: any[]): Buffer {
        // console.assert(((cls._length === null) || (cls.length === cls._length)));
        return Buffer.from(value.map((i) => i.serialize(cls, i)));
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static deserialize(cls: any, data: Buffer): any[] {
        let item;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        const r: any[] = [];
        while (data) {
            [item, data] = cls.itemtype.deserialize(cls.itemtype, data);
            r.push(item);
        }
        return [r, data];
    }
}

class _LVList extends List {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static override serialize(cls: any, value: any[]): Buffer {
        const head = [cls.length];
        const data = super.serialize(cls, value);
        return Buffer.from(head.concat(data));
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static override deserialize(cls: any, data: Buffer): any[] {
        let item, length;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        const r: any[] = [];
        [length, data] = [data[0], data.subarray(1)];
        for (let i = 0; i < length; i++) {
            [item, data] = cls.itemtype.deserialize(cls.itemtype, data);
            r.push(item);
        }
        return [r, data];
    }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export function list(itemtype: any): List {
    class ConreteList extends List {
        static itemtype = itemtype;
    }

    return ConreteList;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export function LVList(itemtype: any): List {
    class LVList extends _LVList {
        static itemtype = itemtype;
    }

    return LVList;
}

export class WordList extends List {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static override serialize(cls: any, value: any[]): Buffer {
        const data = value.map((i) => Buffer.from(uint16_t.serialize(uint16_t, i)));
        return Buffer.concat(data);
    }
}

class _FixedList extends List {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static override serialize(cls: any, value: any[]): Buffer {
        const data = value.map((i) => cls.itemtype.serialize(cls.itemtype, i)[0]);
        return Buffer.from(data);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static override deserialize(cls: any, data: Buffer): any[] {
        let item;
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        const r: any[] = [];
        for (let i = 0; i < cls._length; i++) {
            [item, data] = cls.itemtype.deserialize(cls.itemtype, data);
            r.push(item);
        }
        return [r, data];
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any*/
export function fixed_list(
    length: number,
    itemtype: any,
): {
    new (): any;
    deserialize(cls: any, data: Buffer): any;
} {
    class FixedList extends _FixedList {
        static itemtype = itemtype;
        static _length = length;
    }

    return FixedList;
}
/* eslint-enable @typescript-eslint/no-explicit-any*/

export class Bytes {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static serialize(cls: any, value: any[]): Buffer {
        return Buffer.from(value);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    static deserialize(cls: any, data: Buffer): any[] {
        return [data];
    }
}
