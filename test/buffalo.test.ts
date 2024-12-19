import {Buffalo} from '../src/buffalo';
import {ieeeaAddr1, ieeeaAddr2} from './testUtils';

describe('Buffalo', () => {
    it('is more', () => {
        const buffalo = new Buffalo(Buffer.from([0, 1, 2]), 1);
        expect(buffalo.getPosition()).toEqual(1);
        expect(buffalo.isMore()).toStrictEqual(true);
        buffalo.readUInt16();
        expect(buffalo.isMore()).toStrictEqual(false);
    });

    it('gets written', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.writeUInt8(240);
        expect(buffalo.getWritten()).toStrictEqual(Buffer.from([0, 240]));
    });

    it('UINT8 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.writeUInt8(240);
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xf0, 0x00]));
    });

    it('UINT8 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x03, 0x00, 0x00]), 1);
        const value = buffalo.readUInt8();
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(3);
    });

    it('INT8 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.writeInt8(127);
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x7f, 0x00]));
    });

    it('INT8 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0xf0, 0x00, 0x00]), 1);
        const value = buffalo.readInt8();
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(-16);
    });

    it('INT16 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.writeInt16(256);
        expect(buffalo.getPosition()).toEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x01]));
    });

    it('INT16 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0xff, 0xff, 0x00]), 1);
        const value = buffalo.readInt16();
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(-1);
    });

    it('UINT16 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.writeUInt16(1020);
        expect(buffalo.getPosition()).toEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xfc, 0x03]));
    });

    it('UINT16 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x03, 0xff, 0x00]), 1);
        const value = buffalo.readUInt16();
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(65283);
    });

    it('INT32 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(6), 2);
        buffalo.writeInt32(1065283);
        expect(buffalo.getPosition()).toEqual(6);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]));
    });

    it('INT32 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x01, 0x03, 0xff, 0xff]));
        const value = buffalo.readInt32();
        expect(buffalo.getPosition()).toEqual(4);
        expect(value).toStrictEqual(-64767);
    });

    it('UINT32 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(6), 2);
        buffalo.writeUInt32(1065283);
        expect(buffalo.getPosition()).toEqual(6);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]));
    });

    it('UINT32 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x01, 0x03, 0xff, 0xff]));
        const value = buffalo.readUInt32();
        expect(buffalo.getPosition()).toEqual(4);
        expect(value).toStrictEqual(4294902529);
    });

    it('INT40 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(7), 2);
        buffalo.writeInt40(21542142465);
        expect(buffalo.getPosition()).toEqual(7);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0, 0, 1, 2, 3, 4, 5]));
    });

    it('INT40 read', () => {
        const buffalo = new Buffalo(Buffer.from([1, 2, 3, 4, 5]));
        const value = buffalo.readInt40();
        expect(buffalo.getPosition()).toEqual(5);
        expect(value).toStrictEqual(21542142465);
    });

    it('UINT40 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(7), 2);
        buffalo.writeUInt40(21542142465);
        expect(buffalo.getPosition()).toEqual(7);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0, 0, 1, 2, 3, 4, 5]));
    });

    it('UINT40 read', () => {
        const buffalo = new Buffalo(Buffer.from([1, 2, 3, 4, 5]));
        const value = buffalo.readUInt40();
        expect(buffalo.getPosition()).toEqual(5);
        expect(value).toStrictEqual(21542142465);
    });

    it('INT48 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8), 2);
        buffalo.writeInt48(6618611909121);
        expect(buffalo.getPosition()).toEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0, 0, 1, 2, 3, 4, 5, 6]));
    });

    it('INT48 read', () => {
        const buffalo = new Buffalo(Buffer.from([1, 2, 3, 4, 5, 6]));
        const value = buffalo.readInt48();
        expect(buffalo.getPosition()).toEqual(6);
        expect(value).toStrictEqual(6618611909121);
    });

    it('UINT48 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8), 2);
        buffalo.writeUInt48(6618611909121);
        expect(buffalo.getPosition()).toEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0, 0, 1, 2, 3, 4, 5, 6]));
    });

    it('UINT48 read', () => {
        const buffalo = new Buffalo(Buffer.from([1, 2, 3, 4, 5, 6]));
        const value = buffalo.readUInt48();
        expect(buffalo.getPosition()).toEqual(6);
        expect(value).toStrictEqual(6618611909121);
    });

    it('UINT56 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(9), 2);
        buffalo.writeUInt56(72057594037927934n);
        expect(buffalo.getPosition()).toEqual(9);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0, 0, 254, 255, 255, 255, 255, 255, 255]));
    });

    it('UINT56 read', () => {
        const buffalo = new Buffalo(Buffer.from([254, 255, 255, 255, 255, 255, 255]));
        const value = buffalo.readUInt56();
        expect(buffalo.getPosition()).toEqual(7);
        expect(value).toStrictEqual(72057594037927934n);
    });

    it.each([
        [36028797018963964n, [0, 0, 252, 255, 255, 255, 255, 255, 127]],
        [-36028797018963964n, [0, 0, 4, 0, 0, 0, 0, 0, 128]],
    ])('INT56 write', (value: bigint, expectedValues: number[]) => {
        const buffalo = new Buffalo(Buffer.alloc(9), 2);
        buffalo.writeInt56(value);
        expect(buffalo.getPosition()).toEqual(9);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(expectedValues));
    });

    it.each([
        [36028797018963964n, [252, 255, 255, 255, 255, 255, 127]],
        [-36028797018963964n, [4, 0, 0, 0, 0, 0, 128]],
    ])('INT56 read', (expectedValue: bigint, values: number[]) => {
        const buffalo = new Buffalo(Buffer.from(values));
        const value = buffalo.readInt56();
        expect(buffalo.getPosition()).toEqual(7);
        expect(value).toStrictEqual(expectedValue);
    });

    it('UINT64 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(10), 2);
        buffalo.writeUInt64(18446744073709551613n);
        expect(buffalo.getPosition()).toEqual(10);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0, 0, 253, 255, 255, 255, 255, 255, 255, 255]));
    });

    it('UINT64 read', () => {
        const buffalo = new Buffalo(Buffer.from([253, 255, 255, 255, 255, 255, 255, 255]));
        const value = buffalo.readUInt64();
        expect(buffalo.getPosition()).toEqual(8);
        expect(value).toStrictEqual(18446744073709551613n);
    });

    it('INT64 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(10), 2);
        buffalo.writeInt64(9223372036854775806n);
        expect(buffalo.getPosition()).toEqual(10);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0, 0, 254, 255, 255, 255, 255, 255, 255, 127]));
    });

    it('INT64 read', () => {
        const buffalo = new Buffalo(Buffer.from([254, 255, 255, 255, 255, 255, 255, 127]));
        const value = buffalo.readInt64();
        expect(buffalo.getPosition()).toEqual(8);
        expect(value).toStrictEqual(9223372036854775806n);
    });

    it('IEEEADDR write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8));
        buffalo.writeIeeeAddr(ieeeaAddr1.string);
        expect(buffalo.getPosition()).toEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(ieeeaAddr1.hex));
    });

    it('IEEEADDR read', () => {
        const buffalo = new Buffalo(Buffer.from(ieeeaAddr2.hex));
        const value = buffalo.readIeeeAddr();
        expect(buffalo.getPosition()).toEqual(8);
        expect(value).toStrictEqual(ieeeaAddr2.string);
    });

    it('BUFFER write', () => {
        const buffalo = new Buffalo(Buffer.alloc(5), 1);
        const payload = Buffer.from([0x00, 0x01, 0x02]);
        buffalo.writeBuffer(payload, payload.length);
        expect(buffalo.getPosition()).toEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, 0x00]));
    });

    it('BUFFER write as array', () => {
        const buffalo = new Buffalo(Buffer.alloc(5), 1);
        const payload = [0x00, 0x01, 0x02];
        buffalo.writeBuffer(payload, payload.length);
        expect(buffalo.getPosition()).toEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, 0x00]));
    });

    it('BUFFER read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]), 2);
        const value = buffalo.readBuffer(5);
        expect(buffalo.getPosition()).toEqual(7);
        expect(value).toStrictEqual(Buffer.from([0x02, 0x03, 0x04, 0x05, 0x06]));
    });

    it('LIST_UINT8 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4), 1);
        const payload = [200, 100];
        buffalo.writeListUInt8(payload);
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xc8, 0x64, 0x00]));
    });

    it('LIST_UINT8 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x00, 0x04, 0x08]), 2);
        const value = buffalo.readListUInt8(2);
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual([4, 8]);
    });

    it('LIST_UINT16 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(5), 1);
        const payload = [1024, 2048];
        buffalo.writeListUInt16(payload);
        expect(buffalo.getPosition()).toStrictEqual(5);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]));
    });

    it('LIST_UINT16 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]), 1);
        const value = buffalo.readListUInt16(2);
        expect(buffalo.getPosition()).toStrictEqual(5);
        expect(value).toStrictEqual([1024, 2048]);
    });

    it('LIST_UINT24 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8), 1);
        const payload = [100000, 110110];
        buffalo.writeListUInt24(payload);
        expect(buffalo.getPosition()).toStrictEqual(7);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xa0, 0x86, 0x01, 0x1e, 0xae, 0x01, 0x00]));
    });

    it('LIST_UINT24 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0xa0, 0x86, 0x01, 0x1e, 0xae, 0x01, 0x00]), 1);
        const value = buffalo.readListUInt24(2);
        expect(buffalo.getPosition()).toStrictEqual(7);
        expect(value).toStrictEqual([100000, 110110]);
    });

    it('LIST_UINT32 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8));
        const payload = [4294967295, 10];
        buffalo.writeListUInt32(payload);
        expect(buffalo.getPosition()).toStrictEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0xff, 0xff, 0xff, 0xff, 0x0a, 0x00, 0x00, 0x00]));
    });

    it('LIST_UINT32 read', () => {
        const buffalo = new Buffalo(Buffer.from([0xff, 0xff, 0xff, 0xff, 0x0a, 0x00, 0x00, 0x00]));
        const value = buffalo.readListUInt32(2);
        expect(buffalo.getPosition()).toStrictEqual(8);
        expect(value).toStrictEqual([4294967295, 10]);
    });

    it('UINT24 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4), 1);
        const payload = 16777200;
        buffalo.writeUInt24(payload);
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xf0, 0xff, 0xff]));
    });

    it('UINT24 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x01, 0xa0, 0x86, 0x01, 0x02]), 1);
        const value = buffalo.readUInt24();
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual(100000);
    });

    it('INT24 write +', () => {
        const buffalo = new Buffalo(Buffer.alloc(3));
        buffalo.writeInt24(65536);
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x01]));
    });

    it('INT24 read +', () => {
        const buffalo = new Buffalo(Buffer.from([0x7f, 0xff, 0xff, 0x7f]), 1);
        const value = buffalo.readInt24();
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual(8388607);
    });

    it('INT24 write -', () => {
        const buffalo = new Buffalo(Buffer.alloc(3));
        buffalo.writeInt24(-65536);
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0xff]));
    });

    it('INT24 read -', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x00, 0xff]));
        const value = buffalo.readInt24();
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(value).toStrictEqual(-65536);
    });

    it('INT32 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4));
        buffalo.writeInt32(2147483647);
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0xff, 0xff, 0xff, 0x7f]));
    });

    it('INT32 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x08, 0xff, 0x03, 0xff]));
        const value = buffalo.readInt32();
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual(-16515320);
    });

    it('INT48 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(6));
        buffalo.writeInt48(-1082348273920);
        expect(buffalo.getPosition()).toStrictEqual(6);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xff, 0x03, 0xff, 0x03, 0xff]));
    });

    it('INT48 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0xff, 0x03, 0xff, 0x03, 0xff]));
        const value = buffalo.readInt48();
        expect(buffalo.getPosition()).toStrictEqual(6);
        expect(value).toStrictEqual(-1082348273920);
    });

    it('FLOATLE write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4));
        buffalo.writeFloatLE(400.5);
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x40, 0xc8, 0x43]));
    });

    it('FLOATLE read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x40, 0xc8, 0x43]));
        const value = buffalo.readFloatLE();
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual(400.5);
    });

    it('DOUBLELE write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8));
        buffalo.writeDoubleLE(809880.6);
        expect(buffalo.getPosition()).toStrictEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x33, 0x33, 0x33, 0x33, 0x31, 0xb7, 0x28, 0x41]));
    });

    it('DOUBLELE read', () => {
        const buffalo = new Buffalo(Buffer.from([0x33, 0x33, 0x33, 0x33, 0x31, 0xb7, 0x28, 0x41]), 0);
        const value = buffalo.readDoubleLE();
        expect(buffalo.getPosition()).toStrictEqual(8);
        expect(value).toStrictEqual(809880.6);
    });

    it('UTF8 STRING write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4));
        buffalo.writeUtf8String('abcd');
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x61, 0x62, 0x63, 0x64]));
    });

    it('UTF8 STRING read', () => {
        const buffalo = new Buffalo(Buffer.from([0x61, 0x62, 0x63, 0x64]), 0);
        const value = buffalo.readUtf8String(4);
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual('abcd');
    });
});
