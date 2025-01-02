import * as Zcl from '../../../src/zspec/zcl';
import {BuffaloZcl} from '../../../src/zspec/zcl/buffaloZcl';
import {uint16To8Array, uint32To8Array} from '../../utils/math';

describe('ZCL Buffalo', () => {
    it('Writes invalida data type as buffer if buffer-like', () => {
        const value = [1, 2, 3];
        const buffer = Buffer.alloc(3);
        const buffalo = new BuffaloZcl(buffer);
        const writeSpy = vi.spyOn(buffalo, 'writeBuffer');
        // @ts-expect-error invalid on purpose
        buffalo.write(99999, value, {});
        expect(writeSpy).toHaveBeenCalledWith(value, value.length);
        expect(writeSpy).toHaveBeenCalledTimes(1);

        // @ts-expect-error private
        buffalo.position = 0;

        // @ts-expect-error invalid on purpose
        buffalo.write(99999, Buffer.from(value), {});
        expect(writeSpy).toHaveBeenLastCalledWith(Buffer.from(value), value.length);
        expect(writeSpy).toHaveBeenCalledTimes(2);
    });

    it('Throws when write/read invalid data type, except for write if buffer-like', () => {
        expect(() => {
            const buffer = Buffer.alloc(1);
            const buffalo = new BuffaloZcl(buffer);
            // @ts-expect-error invalid on purpose
            buffalo.write(99999, 127, {});
        }).toThrow();
        expect(() => {
            const buffer = Buffer.alloc(1);
            const buffalo = new BuffaloZcl(buffer);
            // @ts-expect-error invalid on purpose
            buffalo.read(99999, {});
        }).toThrow();
    });

    it('Writes nothing', () => {
        for (const type of [Zcl.DataType.NO_DATA, Zcl.DataType.UNKNOWN]) {
            const buffer = Buffer.alloc(3);
            const buffalo = new BuffaloZcl(buffer);

            buffalo.write(type, 123, {});
            expect(buffer).toStrictEqual(Buffer.from([0, 0, 0]));
            expect(buffalo.getPosition()).toStrictEqual(0);
        }

        {
            const buffer = Buffer.alloc(3);
            const buffalo = new BuffaloZcl(buffer);

            buffalo.write(Zcl.BuffaloZclDataType.STRUCTURED_SELECTOR, null, {});
            expect(buffer).toStrictEqual(Buffer.from([0, 0, 0]));
            expect(buffalo.getPosition()).toStrictEqual(0);
        }
    });

    it('Reads nothing', () => {
        for (const type of [Zcl.DataType.NO_DATA, Zcl.DataType.UNKNOWN]) {
            const buffer = Buffer.from([1, 2]);
            const buffalo = new BuffaloZcl(buffer);
            expect(buffalo.read(type, {})).toStrictEqual(undefined);
            expect(buffalo.getPosition()).toStrictEqual(0);
        }
    });

    it.each([
        [
            'uint8-like',
            {value: 250, types: [Zcl.DataType.DATA8, Zcl.DataType.BOOLEAN, Zcl.DataType.BITMAP8, Zcl.DataType.UINT8, Zcl.DataType.ENUM8]},
            {position: 1, write: 'writeUInt8', read: 'readUInt8'},
        ],
        [
            'uint16-like',
            {
                value: 65530,
                types: [
                    Zcl.DataType.DATA16,
                    Zcl.DataType.BITMAP16,
                    Zcl.DataType.UINT16,
                    Zcl.DataType.ENUM16,
                    Zcl.DataType.CLUSTER_ID,
                    Zcl.DataType.ATTR_ID,
                ],
            },
            {position: 2, write: 'writeUInt16', read: 'readUInt16'},
        ],
        [
            'uint24-like',
            {value: 16777210, types: [Zcl.DataType.DATA24, Zcl.DataType.BITMAP24, Zcl.DataType.UINT24]},
            {position: 3, write: 'writeUInt24', read: 'readUInt24'},
        ],
        [
            'uint32-like',
            {value: 4294967290, types: [Zcl.DataType.DATA32, Zcl.DataType.BITMAP32, Zcl.DataType.UINT32, Zcl.DataType.UTC, Zcl.DataType.BAC_OID]},
            {position: 4, write: 'writeUInt32', read: 'readUInt32'},
        ],
        ['int8-like', {value: -120, types: [Zcl.DataType.INT8]}, {position: 1, write: 'writeInt8', read: 'readInt8'}],
        ['int16-like', {value: -32760, types: [Zcl.DataType.INT16]}, {position: 2, write: 'writeInt16', read: 'readInt16'}],
        ['int24-like', {value: -8388600, types: [Zcl.DataType.INT24]}, {position: 3, write: 'writeInt24', read: 'readInt24'}],
        ['int32-like', {value: -2147483640, types: [Zcl.DataType.INT32]}, {position: 4, write: 'writeInt32', read: 'readInt32'}],
        ['int48-like', {value: -140737488355320, types: [Zcl.DataType.INT48]}, {position: 6, write: 'writeInt48', read: 'readInt48'}],
        ['float-like', {value: 1.539989614439558e-36, types: [Zcl.DataType.SINGLE_PREC]}, {position: 4, write: 'writeFloatLE', read: 'readFloatLE'}],
        [
            'double-like',
            {value: 5.447603722011605e-270, types: [Zcl.DataType.DOUBLE_PREC]},
            {position: 8, write: 'writeDoubleLE', read: 'readDoubleLE'},
        ],
        ['IEEE address', {value: '0xfe1234abcd9876ff', types: [Zcl.DataType.IEEE_ADDR]}, {position: 8, write: 'writeIeeeAddr', read: 'readIeeeAddr'}],
        [
            'uint8-like list',
            {value: [250, 25, 50], types: [Zcl.BuffaloZclDataType.LIST_UINT8]},
            {position: 3, write: 'writeListUInt8', read: 'readListUInt8'},
        ],
        [
            'uint16-like list',
            {value: [65530, 6553, 5530], types: [Zcl.BuffaloZclDataType.LIST_UINT16]},
            {position: 6, write: 'writeListUInt16', read: 'readListUInt16'},
        ],
        [
            'uint24-like list',
            {value: [16777210, 1677721, 6777210], types: [Zcl.BuffaloZclDataType.LIST_UINT24]},
            {position: 9, write: 'writeListUInt24', read: 'readListUInt24'},
        ],
        [
            'uint32-like list',
            {value: [4294967290, 429496729, 294967290], types: [Zcl.BuffaloZclDataType.LIST_UINT32]},
            {position: 12, write: 'writeListUInt32', read: 'readListUInt32'},
        ],
        [
            'buffer',
            {value: Buffer.from([1, 2, 3, 4]), types: [Zcl.BuffaloZclDataType.BUFFER]},
            {position: 4, write: 'writeBuffer', read: 'readBuffer'},
        ],
        [
            'security key',
            {value: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]), types: [Zcl.DataType.SEC_KEY]},
            {position: 16, write: 'writeBuffer', read: 'readBuffer'},
        ],
    ])('Writes & Reads using base class for %s', (_name, payload, expected) => {
        const readOptions: {length?: number} = {};

        if (Array.isArray(payload.value) || payload.value instanceof Buffer) {
            readOptions.length = payload.value.length;
        }

        for (const type of payload.types) {
            const buffer = Buffer.alloc(255);
            const buffalo = new BuffaloZcl(buffer);
            // @ts-expect-error dynamic
            const writeSpy = vi.spyOn(buffalo, expected.write);
            // @ts-expect-error dynamic
            const readSpy = vi.spyOn(buffalo, expected.read);

            buffalo.write(type, payload.value, {});
            expect(writeSpy).toHaveBeenCalledTimes(1);
            expect(buffalo.getPosition()).toStrictEqual(expected.position);

            // @ts-expect-error private
            buffalo.position = 0;

            expect(buffalo.read(type, readOptions)).toStrictEqual(payload.value);
            expect(readSpy).toHaveBeenCalledTimes(1);
            expect(buffalo.getPosition()).toStrictEqual(expected.position);
        }
    });

    it('Reads whole buffer without length option', () => {
        const value = [1, 2, 3, 4];
        const buffer = Buffer.alloc(4);
        const buffalo = new BuffaloZcl(buffer);
        const writeSpy = vi.spyOn(buffalo, 'writeBuffer');
        const readSpy = vi.spyOn(buffalo, 'readBuffer');

        buffalo.write(Zcl.BuffaloZclDataType.BUFFER, Buffer.from(value), {});
        expect(writeSpy).toHaveBeenCalledTimes(1);
        // XXX: inconsistent with read, write is always "whole"
        expect(writeSpy).toHaveBeenCalledWith(Buffer.from(value), value.length);
        expect(buffalo.getPosition()).toStrictEqual(value.length);

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.BUFFER, {})).toStrictEqual(Buffer.from(value));
        expect(readSpy).toHaveBeenCalledTimes(1);
        expect(readSpy).toHaveBeenCalledWith(value.length);
        expect(buffalo.getPosition()).toStrictEqual(value.length);
    });

    it('Reads partial buffer with length option', () => {
        const value = [1, 2, 3, 4];
        const length = 2;
        const buffer = Buffer.alloc(255);
        const buffalo = new BuffaloZcl(buffer);
        const writeSpy = vi.spyOn(buffalo, 'writeBuffer');
        const readSpy = vi.spyOn(buffalo, 'readBuffer');

        buffalo.write(Zcl.BuffaloZclDataType.BUFFER, Buffer.from(value), {length});
        expect(writeSpy).toHaveBeenCalledTimes(1);
        // XXX: inconsistent with read, write is always "whole"
        expect(writeSpy).toHaveBeenCalledWith(Buffer.from(value), value.length);
        expect(buffalo.getPosition()).toStrictEqual(value.length);

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.BUFFER, {length})).toStrictEqual(Buffer.from([value[0], value[1]]));
        expect(readSpy).toHaveBeenCalledTimes(1);
        expect(readSpy).toHaveBeenCalledWith(length);
        expect(buffalo.getPosition()).toStrictEqual(length);
    });

    it('Writes & Reads octet str', () => {
        const value = [0xfe, 0x01, 0xab, 0x98];
        const expectedPosition = 5;
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.OCTET_STR, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from([value.length, ...value]));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.DataType.OCTET_STR, {})).toStrictEqual(Buffer.from(value));
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
    });

    it('Writes & Reads long octet str', () => {
        const value = [0xfe, 0x01, 0xab, 0x98];
        const expectedPosition = 6;
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.LONG_OCTET_STR, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from([value.length, 0 /*length uint16*/, ...value]));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.DataType.LONG_OCTET_STR, {})).toStrictEqual(Buffer.from(value));
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
    });

    it('Writes char str from number array', () => {
        const value = [0x61, 0x62, 0x63, 0x64];
        const expectedValue = 'abcd';
        const expectedPosition = 4; // value.length not written when number array given
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.CHAR_STR, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(value)); // see above comment
    });

    it('Writes & Reads char str from string', () => {
        const value = 'abcd';
        const expectedValue = [value.length, 0x61, 0x62, 0x63, 0x64];
        const expectedPosition = 5;
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.CHAR_STR, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expectedValue));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.DataType.CHAR_STR, {})).toStrictEqual(value);
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
    });

    it('[workaround] Reads char str as Mi struct for Xiaomi attridId=65281', () => {
        const expectedValue = {'1': 3285, '3': 33, '4': 5032, '5': 43, '6': 327680, '8': 516, '10': 0, '100': 0};
        const buffer = Buffer.from([
            34,
            1,
            Zcl.DataType.UINT16,
            ...uint16To8Array(3285),
            3,
            Zcl.DataType.INT8,
            33,
            4,
            Zcl.DataType.UINT16,
            ...uint16To8Array(5032),
            5,
            Zcl.DataType.UINT16,
            ...uint16To8Array(43),
            6,
            Zcl.DataType.UINT40,
            ...uint32To8Array(327680),
            0,
            8,
            Zcl.DataType.UINT16,
            ...uint16To8Array(516),
            10,
            Zcl.DataType.UINT16,
            ...uint16To8Array(0),
            100,
            Zcl.DataType.BOOLEAN,
            0,
        ]);
        const buffalo = new BuffaloZcl(buffer);

        expect(buffalo.read(Zcl.BuffaloZclDataType.MI_STRUCT, {})).toStrictEqual(expectedValue);
        expect(buffalo.getPosition()).toStrictEqual(buffer.length);
    });

    it('Writes & Reads long char str', () => {
        const value = 'abcd';
        const expectedValue = [value.length, 0 /*length uint16*/, 0x61, 0x62, 0x63, 0x64];
        const expectedPosition = 6;
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.LONG_CHAR_STR, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expectedValue));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.DataType.LONG_CHAR_STR, {})).toStrictEqual(value);
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
    });

    it.each([
        [
            'uint16',
            {value: {elementType: Zcl.DataType.UINT16, elements: [256, 1, 65530, 0]}},
            {
                written: [
                    Zcl.DataType.UINT16,
                    4,
                    0 /*length uint16*/,
                    ...uint16To8Array(256),
                    ...uint16To8Array(1),
                    ...uint16To8Array(65530),
                    ...uint16To8Array(0),
                ],
            },
        ],
        [
            'char str',
            {value: {elementType: Zcl.DataType.CHAR_STR, elements: ['abcd', 'cd', 'a']}},
            {written: [Zcl.DataType.CHAR_STR, 3, 0 /*length uint16*/, 4, 0x61, 0x62, 0x63, 0x64, 2, 0x63, 0x64, 1, 0x61]},
        ],
        [
            'uint16 with element type passed as string key of Zcl.DataType',
            {value: {elementType: 'UINT16', elements: [256, 1, 65530, 0]}},
            {
                written: [
                    Zcl.DataType.UINT16,
                    4,
                    0 /*length uint16*/,
                    ...uint16To8Array(256),
                    ...uint16To8Array(1),
                    ...uint16To8Array(65530),
                    ...uint16To8Array(0),
                ],
            },
        ],
    ])('Writes & Reads array of %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(50);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.ARRAY, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected.written));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.DataType.ARRAY, {})).toStrictEqual(payload.value.elements);
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
    });

    it.each([
        [
            'uint16',
            {
                value: [
                    {elmType: Zcl.DataType.UINT16, elmVal: 256},
                    {elmType: Zcl.DataType.UINT16, elmVal: 1},
                    {elmType: Zcl.DataType.UINT16, elmVal: 65530},
                    {elmType: Zcl.DataType.UINT16, elmVal: 0},
                ],
            },
            {
                written: [
                    4,
                    0 /*length uint16*/,
                    Zcl.DataType.UINT16,
                    ...uint16To8Array(256),
                    Zcl.DataType.UINT16,
                    ...uint16To8Array(1),
                    Zcl.DataType.UINT16,
                    ...uint16To8Array(65530),
                    Zcl.DataType.UINT16,
                    ...uint16To8Array(0),
                ],
            },
        ],
        [
            'char str',
            {
                value: [
                    {elmType: Zcl.DataType.CHAR_STR, elmVal: 'abcd'},
                    {elmType: Zcl.DataType.CHAR_STR, elmVal: 'cd'},
                    {elmType: Zcl.DataType.CHAR_STR, elmVal: 'a'},
                ],
            },
            {
                written: [
                    3,
                    0 /*length uint16*/,
                    Zcl.DataType.CHAR_STR,
                    4,
                    0x61,
                    0x62,
                    0x63,
                    0x64,
                    Zcl.DataType.CHAR_STR,
                    2,
                    0x63,
                    0x64,
                    Zcl.DataType.CHAR_STR,
                    1,
                    0x61,
                ],
            },
        ],
        [
            'mixed',
            {
                value: [
                    {elmType: Zcl.DataType.UINT16, elmVal: 256},
                    {elmType: Zcl.DataType.CHAR_STR, elmVal: 'abcd'},
                    {elmType: Zcl.DataType.BITMAP8, elmVal: 3},
                ],
            },
            {
                written: [
                    3,
                    0 /*length uint16*/,
                    Zcl.DataType.UINT16,
                    ...uint16To8Array(256),
                    Zcl.DataType.CHAR_STR,
                    4,
                    0x61,
                    0x62,
                    0x63,
                    0x64,
                    Zcl.DataType.BITMAP8,
                    3,
                ],
            },
        ],
    ])('Writes & Reads struct of %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(50);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.STRUCT, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected.written));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.DataType.STRUCT, {})).toStrictEqual(payload.value);
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
    });

    it('Writes & Reads Time of Day', () => {
        const value = {hours: 0, minutes: 59, seconds: 34, hundredths: 88};
        const expectedWritten = [0, 59, 34, 88];
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.TOD, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedWritten.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expectedWritten));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.DataType.TOD, {})).toStrictEqual(value);
        expect(buffalo.getPosition()).toStrictEqual(expectedWritten.length);
    });

    it('Writes & Reads Date', () => {
        const value = {year: 2000, month: 8, dayOfMonth: 31, dayOfWeek: 3};
        const expectedWritten = [100, 8, 31, 3];
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.DataType.DATE, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedWritten.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expectedWritten));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.DataType.DATE, {})).toStrictEqual(value);
        expect(buffalo.getPosition()).toStrictEqual(expectedWritten.length);
    });

    it.each([
        ['octet str', {type: Zcl.DataType.OCTET_STR, position: 1, returned: Buffer.from([])}],
        ['char str', {type: Zcl.DataType.CHAR_STR, position: 1, returned: ''}],
        ['long octet str', {type: Zcl.DataType.LONG_OCTET_STR, position: 2, returned: Buffer.from([])}],
        ['long char str', {type: Zcl.DataType.LONG_CHAR_STR, position: 2, returned: ''}],
        ['array', {type: Zcl.DataType.ARRAY, position: 3, returned: []}],
        ['struct', {type: Zcl.DataType.STRUCT, position: 2, returned: []}],
        [
            'time of day',
            {type: Zcl.DataType.TOD, position: 4, returned: {hours: undefined, minutes: undefined, seconds: undefined, hundredths: undefined}},
        ],
        ['date', {type: Zcl.DataType.DATE, position: 4, returned: {year: undefined, month: undefined, dayOfMonth: undefined, dayOfWeek: undefined}}],
        ['mi struct', {type: Zcl.BuffaloZclDataType.MI_STRUCT, position: 1, returned: {}}],
    ])('Reads Non-Value for %s', (_name, payload) => {
        const buffalo = new BuffaloZcl(Buffer.alloc(50, 0xff));
        expect(buffalo.read(payload.type, {})).toStrictEqual(payload.returned);
        expect(buffalo.getPosition()).toStrictEqual(payload.position);
    });

    it.each([
        // TODO: others not yet supported
        [
            'time of day',
            {
                type: Zcl.DataType.TOD,
                position: 4,
                value: {hours: undefined, minutes: undefined, seconds: undefined, hundredths: undefined},
                written: [0xff, 0xff, 0xff, 0xff],
            },
        ],
        [
            'date',
            {
                type: Zcl.DataType.DATE,
                position: 4,
                value: {year: undefined, month: undefined, dayOfMonth: undefined, dayOfWeek: undefined},
                written: [0xff, 0xff, 0xff, 0xff],
            },
        ],
    ])('Writes Non-Value for %s', (_name, payload) => {
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(payload.type, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(payload.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(payload.written));
    });

    it.each([
        ['time of day', {type: Zcl.DataType.TOD, value: {hours: 1, minutes: 2, seconds: undefined, hundredths: 3}, written: [1, 2, 0xff, 3]}],
        ['date', {type: Zcl.DataType.DATE, value: {year: 1901, month: 2, dayOfMonth: undefined, dayOfWeek: 3}, written: [1, 2, 0xff, 3]}],
    ])('Writes & Reads partial Non-Value for %s', (_name, payload) => {
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(payload.type, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(payload.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(payload.written));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(payload.type, {})).toStrictEqual(payload.value);
        expect(buffalo.getPosition()).toStrictEqual(payload.written.length);
    });

    it.each([
        ['uint32', {type: Zcl.DataType.UINT32, value: 32902534}, {position: 4, write: 'writeUInt32', read: 'readUInt32'}],
        ['single prec', {type: Zcl.DataType.SINGLE_PREC, value: 1.539989614439558e-36}, {position: 4, write: 'writeFloatLE', read: 'readFloatLE'}],
        ['IEEE address', {type: Zcl.DataType.IEEE_ADDR, value: '0xfe1234abcd9876ff'}, {position: 8, write: 'writeIeeeAddr', read: 'readIeeeAddr'}],
    ])('Writes & Reads Use Data Type for %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(255);
        const buffalo = new BuffaloZcl(buffer);
        // @ts-expect-error dynamic
        const writeSpy = vi.spyOn(buffalo, expected.write);
        // @ts-expect-error dynamic
        const readSpy = vi.spyOn(buffalo, expected.read);

        buffalo.write(Zcl.BuffaloZclDataType.USE_DATA_TYPE, payload.value, {dataType: payload.type});
        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(buffalo.getPosition()).toStrictEqual(expected.position);

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.USE_DATA_TYPE, {dataType: payload.type})).toStrictEqual(payload.value);
        expect(readSpy).toHaveBeenCalledTimes(1);
        expect(buffalo.getPosition()).toStrictEqual(expected.position);
    });

    it('Writes & Reads Use Data Type as buffer when missing dataType option', () => {
        const value = [12, 34];
        const buffer = Buffer.alloc(2);
        const buffalo = new BuffaloZcl(buffer);
        const writeSpy = vi.spyOn(buffalo, 'writeBuffer');
        const readSpy = vi.spyOn(buffalo, 'readBuffer');
        buffalo.write(Zcl.BuffaloZclDataType.USE_DATA_TYPE, value, {});
        expect(writeSpy).toHaveBeenCalledTimes(1);
        expect(writeSpy).toHaveBeenCalledWith(value, value.length);

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.USE_DATA_TYPE, {})).toStrictEqual(Buffer.from(value));
        expect(readSpy).toHaveBeenCalledTimes(1);
        expect(readSpy).toHaveBeenCalledWith(value.length);

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.USE_DATA_TYPE, {length: 1})).toStrictEqual(Buffer.from([value[0]]));
        expect(readSpy).toHaveBeenCalledTimes(2);
        expect(readSpy).toHaveBeenCalledWith(1);
    });

    it('Throws when write Use Data Type is missing dataType option and value isnt buffer or number array', () => {
        expect(() => {
            const payload = 1;
            const buffalo = new BuffaloZcl(Buffer.alloc(2));
            buffalo.write(Zcl.BuffaloZclDataType.USE_DATA_TYPE, payload, {});
        }).toThrow();
    });

    it.each([
        Zcl.BuffaloZclDataType.LIST_UINT8,
        Zcl.BuffaloZclDataType.LIST_UINT16,
        Zcl.BuffaloZclDataType.LIST_UINT24,
        Zcl.BuffaloZclDataType.LIST_UINT32,
        Zcl.BuffaloZclDataType.LIST_ZONEINFO,
    ])('Throws when read %s is missing required length option', (type) => {
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(type, {});
        }).toThrow();
    });

    it('Writes & Reads zone info list', () => {
        const value = [
            {zoneID: 1, zoneStatus: 5},
            {zoneID: 2, zoneStatus: 6},
        ];
        const expectedWritten = [1, 5, 0 /*uint16*/, 2, 6, 0 /*uint16*/];
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.BuffaloZclDataType.LIST_ZONEINFO, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedWritten.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expectedWritten));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.LIST_ZONEINFO, {length: value.length})).toStrictEqual(value);
        expect(buffalo.getPosition()).toStrictEqual(expectedWritten.length);
    });

    it.each([
        ['6' /*uint8 x1*/, {value: [{clstId: 6, len: 1, extField: [1]}]}, {written: [...uint16To8Array(6), 1, 1]}],
        ['8' /*uint8 x1*/, {value: [{clstId: 8, len: 1, extField: [2]}]}, {written: [...uint16To8Array(8), 1, 2]}],
        ['258' /*uint8 x2*/, {value: [{clstId: 258, len: 2, extField: [1, 2]}]}, {written: [...uint16To8Array(258), 2, 1, 2]}],
        [
            '768' /*uint16 x3, uint8 x3, uint16 x2*/,
            {value: [{clstId: 768, len: 13, extField: [1, 2, 3, 4, 5, 6, 7, 8]}]},
            {
                written: [
                    ...uint16To8Array(768),
                    13,
                    ...uint16To8Array(1),
                    ...uint16To8Array(2),
                    ...uint16To8Array(3),
                    4,
                    5,
                    6,
                    ...uint16To8Array(7),
                    ...uint16To8Array(8),
                ],
            },
        ],
    ])('Writes & Reads Extension Field Sets for data type %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(expected.written.length); // XXX: can't be arbitrary atm, see impl for identified issue
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.BuffaloZclDataType.EXTENSION_FIELD_SETS, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected.written));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.EXTENSION_FIELD_SETS, {})).toStrictEqual(payload.value);
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
    });

    it.each([
        [
            'single all options',
            {value: [{transitionTime: 3, heatSetpoint: 20, coolSetpoint: 15}], readOptions: {payload: {mode: 0b11, numoftrans: 1}}},
            {written: [...uint16To8Array(3), ...uint16To8Array(20), ...uint16To8Array(15)]},
        ],
        [
            'single heat-only',
            {value: [{transitionTime: 60, heatSetpoint: 25}], readOptions: {payload: {mode: 0b01, numoftrans: 1}}},
            {written: [...uint16To8Array(60), ...uint16To8Array(25)]},
        ],
        [
            'single cool-only',
            {value: [{transitionTime: 256, coolSetpoint: 15}], readOptions: {payload: {mode: 0b10, numoftrans: 1}}},
            {written: [...uint16To8Array(256), ...uint16To8Array(15)]},
        ],
        [
            'multiple all options',
            {
                value: [
                    {transitionTime: 3, heatSetpoint: 20, coolSetpoint: 15},
                    {transitionTime: 7, heatSetpoint: 8, coolSetpoint: 3},
                    {transitionTime: 257, heatSetpoint: 256, coolSetpoint: 0},
                ],
                readOptions: {payload: {mode: 0b11, numoftrans: 3}},
            },
            {
                written: [
                    ...uint16To8Array(3),
                    ...uint16To8Array(20),
                    ...uint16To8Array(15),
                    ...uint16To8Array(7),
                    ...uint16To8Array(8),
                    ...uint16To8Array(3),
                    ...uint16To8Array(257),
                    ...uint16To8Array(256),
                    ...uint16To8Array(0),
                ],
            },
        ],
        [
            'multiple heat-only',
            {
                value: [
                    {transitionTime: 3, heatSetpoint: 20},
                    {transitionTime: 70, heatSetpoint: 8},
                ],
                readOptions: {payload: {mode: 0b01, numoftrans: 2}},
            },
            {written: [...uint16To8Array(3), ...uint16To8Array(20), ...uint16To8Array(70), ...uint16To8Array(8)]},
        ],
        [
            'multiple cool-only',
            {
                value: [
                    {transitionTime: 3, coolSetpoint: 15},
                    {transitionTime: 65000, coolSetpoint: 3},
                ],
                readOptions: {payload: {mode: 0b10, numoftrans: 2}},
            },
            {written: [...uint16To8Array(3), ...uint16To8Array(15), ...uint16To8Array(65000), ...uint16To8Array(3)]},
        ],
    ])('Writes & Reads Thermo Transitions List', (_name, payload, expected) => {
        const buffer = Buffer.alloc(50);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.BuffaloZclDataType.LIST_THERMO_TRANSITIONS, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected.written));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.LIST_THERMO_TRANSITIONS, payload.readOptions)).toStrictEqual(payload.value);
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
    });

    it('Throws when read Thermo Transitions List is missing required payload options', () => {
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(Zcl.BuffaloZclDataType.LIST_THERMO_TRANSITIONS, {});
        }).toThrow();
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(Zcl.BuffaloZclDataType.LIST_THERMO_TRANSITIONS, {payload: {}});
        }).toThrow();
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(Zcl.BuffaloZclDataType.LIST_THERMO_TRANSITIONS, {payload: {mode: 1}});
        }).toThrow();
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(Zcl.BuffaloZclDataType.LIST_THERMO_TRANSITIONS, {payload: {numoftrans: 1}});
        }).toThrow();
    });

    describe('GPD Frame', () => {
        it('Reads unhandled command as object[raw] if buffer still has bytes to read', () => {
            const value = [0xff, 0x00];
            const buffalo = new BuffaloZcl(Buffer.from(value));

            expect(buffalo.read(Zcl.BuffaloZclDataType.GDP_FRAME, {payload: {commandID: 0x1ff}})).toStrictEqual({raw: Buffer.from(value)});
        });

        it('Reads unhandled command as empty object if buffer finished reading', () => {
            const value = [0xff, 0x00];
            const buffalo = new BuffaloZcl(Buffer.from(value), value.length /* pos at end*/);

            expect(buffalo.read(Zcl.BuffaloZclDataType.GDP_FRAME, {payload: {commandID: 0x1ff}})).toStrictEqual({});
        });

        it('Writes commissioning', () => {
            const expected = [1 /*length*/, 0 /*options*/];
            const buffalo = new BuffaloZcl(Buffer.alloc(2));

            buffalo.write(
                Zcl.BuffaloZclDataType.GDP_FRAME,
                {
                    commandID: 0xf0,
                    options: 0,
                    panID: 0,
                    securityKey: Buffer.alloc(16),
                    keyMic: 0,
                    frameCounter: 0,
                },
                {},
            );

            expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected));
        });

        it('Reads commissioning', () => {
            const value = [0xff /*device*/, 0x00 /*options*/];
            const buffalo = new BuffaloZcl(Buffer.from(value));

            expect(buffalo.read(Zcl.BuffaloZclDataType.GDP_FRAME, {payload: {commandID: 0xe0}})).toStrictEqual({
                deviceID: 0xff,
                options: 0x00,
                extendedOptions: 0x00,
                securityKey: Buffer.alloc(16),
                keyMic: 0,
                outgoingCounter: 0,
                manufacturerID: 0,
                modelID: 0,
                numGdpCommands: 0,
                gpdCommandIdList: Buffer.alloc(0),
                numServerClusters: 0,
                numClientClusters: 0,
                gpdServerClusters: Buffer.alloc(0),
                gpdClientClusters: Buffer.alloc(0),
                applicationInfo: 0x00,
            });
        });

        it('Writes commissioning all options', () => {
            const expected = [
                27, // length
                0b11111, // options
                0xff,
                0xff, // PAN ID
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0, // security key
                0,
                0,
                0,
                0, // key mic
                0,
                0,
                0,
                0, // frame counter
            ];
            const buffalo = new BuffaloZcl(Buffer.alloc(28));

            buffalo.write(
                Zcl.BuffaloZclDataType.GDP_FRAME,
                {
                    commandID: 0xf0,
                    options: 0b11111,
                    panID: 0xffff,
                    securityKey: Buffer.alloc(16),
                    keyMic: 0,
                    frameCounter: 0,
                },
                {},
            );

            expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected));
        });

        it('Reads commissioning all options', () => {
            const value = [
                0xff, // device
                0x80 | 0x04, // options
                0x20 | 0x40 | 0x80, // extended options
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0, // security key
                0,
                0,
                0,
                0, // key mic
                0,
                0,
                0,
                0, // outgoing counter
                0x01 | 0x02 | 0x04 | 0x08, // application info
                0,
                0, // manufacturer ID
                0,
                0, // model ID
                0, // num GDP commands + commands
                0, // clusters
            ];
            const buffalo = new BuffaloZcl(Buffer.from(value));

            expect(buffalo.read(Zcl.BuffaloZclDataType.GDP_FRAME, {payload: {commandID: 0xe0}})).toStrictEqual({
                deviceID: 0xff,
                options: 0x80 | 0x04,
                extendedOptions: 0x20 | 0x40 | 0x80,
                securityKey: Buffer.alloc(16),
                keyMic: 0,
                outgoingCounter: 0,
                manufacturerID: 0,
                modelID: 0,
                numGdpCommands: 0,
                gpdCommandIdList: Buffer.alloc(0),
                numServerClusters: 0,
                numClientClusters: 0,
                gpdServerClusters: Buffer.alloc(0),
                gpdClientClusters: Buffer.alloc(0),
                applicationInfo: 0x01 | 0x02 | 0x04 | 0x08,
            });
        });

        it('Writes channel configuration', () => {
            const expected = [1 /*length*/, 0xf /*Channel 26*/];
            const buffalo = new BuffaloZcl(Buffer.alloc(2));
            buffalo.write(
                Zcl.BuffaloZclDataType.GDP_FRAME,
                {
                    commandID: 0xf3,
                    operationalChannel: 0xf,
                    basic: false,
                },
                {},
            );

            expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected));
        });

        it('Writes channel configuration basic', () => {
            const expected = [1 /*length*/, 0x1f /*Channel 26 + Basic*/];
            const buffalo = new BuffaloZcl(Buffer.alloc(2));
            buffalo.write(
                Zcl.BuffaloZclDataType.GDP_FRAME,
                {
                    commandID: 0xf3,
                    operationalChannel: 0xf,
                    basic: true,
                },
                {},
            );

            expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected));
        });

        it('Reads channel request', () => {
            const value = [0xfa];
            const buffalo = new BuffaloZcl(Buffer.from(value));

            expect(buffalo.read(Zcl.BuffaloZclDataType.GDP_FRAME, {payload: {commandID: 0xe3}})).toStrictEqual({
                nextChannel: 0xa,
                nextNextChannel: 0xf,
            });
        });

        it('Reads attribute report', () => {
            const value = [
                0x12,
                0x34, // Manufacturer ID
                0xff,
                0xff, // Cluster ID
                0x00,
                0x00, // Attribute ID
                Zcl.DataType.UINT32, // Attribute Type
                0x00,
                0x01,
                0x02,
                0x03,
                0x01,
                0x00,
                Zcl.DataType.CHAR_STR,
                0x06,
                0x5a,
                0x49,
                0x47,
                0x42,
                0x45,
                0x45,
                0x02,
                0x00,
                Zcl.DataType.BOOLEAN,
                0x01,
            ];
            const buffalo = new BuffaloZcl(Buffer.from(value));

            expect(buffalo.read(Zcl.BuffaloZclDataType.GDP_FRAME, {payload: {commandID: 0xa1, payloadSize: value.length}})).toStrictEqual({
                manufacturerCode: 13330,
                clusterID: 65535,
                attributes: {'0': 50462976, '1': 'ZIGBEE', '2': 1},
            });
        });

        it('Writes custom reply', () => {
            const expected = [
                6, // length
                90,
                73,
                71,
                66,
                69,
                69, // ZIGBEE
            ];

            const buffalo = new BuffaloZcl(Buffer.alloc(7));
            buffalo.write(Zcl.BuffaloZclDataType.GDP_FRAME, {commandID: 0xf4, buffer: Buffer.from('ZIGBEE')}, {});

            expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected));
        });

        it('Writes nothing for unhandled command', () => {
            const buffalo = new BuffaloZcl(Buffer.alloc(7));
            buffalo.write(Zcl.BuffaloZclDataType.GDP_FRAME, {commandID: 0x1ff}, {});

            expect(buffalo.getWritten()).toStrictEqual(Buffer.alloc(0));
        });

        it('Throws when read is missing payload.payloadSize option when payload.commandID is 0xA1', () => {
            expect(() => {
                const buffalo = new BuffaloZcl(Buffer.alloc(1));
                buffalo.read(Zcl.BuffaloZclDataType.GDP_FRAME, {payload: {commandID: 0xa1}});
            }).toThrow(`Cannot read GDP_FRAME with commandID=0xA1 without payloadSize options specified`);
        });
    });

    it.each([
        ['whole', {value: {indicatorType: Zcl.StructuredIndicatorType.Whole}}, {written: [Zcl.StructuredIndicatorType.Whole]}],
        [
            'indexes only',
            {value: {indexes: [3, 4, 5, 256]}},
            {written: [4, ...uint16To8Array(3), ...uint16To8Array(4), ...uint16To8Array(5), ...uint16To8Array(256)]},
        ],
    ])('Writes & Reads Structured Selector for %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(50);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.BuffaloZclDataType.STRUCTURED_SELECTOR, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected.written));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.STRUCTURED_SELECTOR, {})).toStrictEqual(payload.value);
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
    });

    it.each([
        ['Add', {value: {indicatorType: Zcl.StructuredIndicatorType.WriteAdd}}, {written: [Zcl.StructuredIndicatorType.WriteAdd]}],
        ['Remove', {value: {indicatorType: Zcl.StructuredIndicatorType.WriteRemove}}, {written: [Zcl.StructuredIndicatorType.WriteRemove]}],
    ])('Writes Structured Selector for %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(50);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.BuffaloZclDataType.STRUCTURED_SELECTOR, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected.written));
    });

    it('Throws when read Strctured Select indicator is outside range', () => {
        expect(() => {
            const buffer = Buffer.from([17]);
            const buffalo = new BuffaloZcl(buffer);
            buffalo.read(Zcl.BuffaloZclDataType.STRUCTURED_SELECTOR, {});
        }).toThrow();
        expect(() => {
            const buffer = Buffer.from([17, 1, 2, 3]);
            const buffalo = new BuffaloZcl(buffer);
            buffalo.read(Zcl.BuffaloZclDataType.STRUCTURED_SELECTOR, {});
        }).toThrow();
    });

    it.each([
        [
            'single',
            {value: [{dp: 254, datatype: 125, data: Buffer.from([1, 3, 5])}]},
            {written: [254, 125, ...uint16To8Array(3).reverse() /*BE*/, 1, 3, 5]},
        ],
        [
            'multiple',
            {
                value: [
                    {dp: 254, datatype: 125, data: Buffer.from([1, 3, 5])},
                    {dp: 125, datatype: 254, data: Buffer.from([5, 0, 1, 5])},
                ],
            },
            {written: [254, 125, ...uint16To8Array(3).reverse() /*BE*/, 1, 3, 5, 125, 254, ...uint16To8Array(4).reverse() /*BE*/, 5, 0, 1, 5]},
        ],
    ])('Writes & Reads Tuya Data Point Values List %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(expected.written.length); // XXX: can't be arbitrary atm, see impl for identified issue
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES, payload.value, {});
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expected.written));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES, {})).toStrictEqual(payload.value);
        expect(buffalo.getPosition()).toStrictEqual(expected.written.length);
    });

    it('Reads invalid Tuya Data Point Values List as empty array', () => {
        // incomplete
        const buffer = Buffer.from([254, 125]);
        const buffalo = new BuffaloZcl(buffer);
        expect(buffalo.read(Zcl.BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES, {})).toStrictEqual([]);
    });

    it('Writes & Reads Mi Boxer Zones List', () => {
        const value = [
            {zoneNum: 1, groupId: 0x2b84},
            {zoneNum: 2, groupId: 0x2b98},
            {zoneNum: 3, groupId: 0x2bac},
            {zoneNum: 4, groupId: 0x2bc0},
            {zoneNum: 5, groupId: 0x2bd4},
            {zoneNum: 6, groupId: 0x2be8},
            {zoneNum: 7, groupId: 0x2bfc},
            {zoneNum: 8, groupId: 0x2c10},
        ];
        const expectedWritten = [
            value.length,
            ...uint16To8Array(value[0].groupId),
            value[0].zoneNum,
            ...uint16To8Array(value[1].groupId),
            value[1].zoneNum,
            ...uint16To8Array(value[2].groupId),
            value[2].zoneNum,
            ...uint16To8Array(value[3].groupId),
            value[3].zoneNum,
            ...uint16To8Array(value[4].groupId),
            value[4].zoneNum,
            ...uint16To8Array(value[5].groupId),
            value[5].zoneNum,
            ...uint16To8Array(value[6].groupId),
            value[6].zoneNum,
            ...uint16To8Array(value[7].groupId),
            value[7].zoneNum,
        ];
        const buffer = Buffer.alloc(50);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.BuffaloZclDataType.LIST_MIBOXER_ZONES, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedWritten.length);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expectedWritten));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.LIST_MIBOXER_ZONES, {length: value.length})).toStrictEqual(value);
        expect(buffalo.getPosition()).toStrictEqual(expectedWritten.length);
    });

    it('Writes & Reads big endian uint24', () => {
        const value = 16777200;
        const expectedWritten = [0xff, 0xff, 0xf0];
        const expectedPosition = 3;
        const buffer = Buffer.alloc(10);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(Zcl.BuffaloZclDataType.BIG_ENDIAN_UINT24, value, {});
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from(expectedWritten));

        // @ts-expect-error private
        buffalo.position = 0;

        expect(buffalo.read(Zcl.BuffaloZclDataType.BIG_ENDIAN_UINT24, {})).toStrictEqual(value);
        expect(buffalo.getPosition()).toStrictEqual(expectedPosition);
    });
});
