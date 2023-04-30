import "regenerator-runtime/runtime";
import {Buffalo} from '../src/buffalo';
import {duplicateArray, ieeeaAddr1, ieeeaAddr2} from './testUtils';

describe('helloworld', () => {
    it('UINT8 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.write('UINT8', 240, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xF0, 0x00]))
    });

    it('UINT8 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x03, 0x00, 0x00]), 1);
        const value = buffalo.read('UINT8', {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(3);
    });

    it('INT8 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.write('INT8', 127, {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x7F, 0x00]))
    });

    it('INT8 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0xF0, 0x00, 0x00]), 1);
        const value = buffalo.read('INT8', {});
        expect(buffalo.getPosition()).toEqual(2);
        expect(value).toStrictEqual(-16);
    });

    it('INT16 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.write('INT16', 256, {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x01]))
    });

    it('INT16 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0xFF, 0xFF, 0x00]), 1);
        const value = buffalo.read('INT16', {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(-1);
    });

    it('UINT16 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(3), 1);
        buffalo.write('UINT16', 1020, {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xFC, 0x03]))
    });

    it('UINT16 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x03, 0xFF, 0x00]), 1);
        const value = buffalo.read('UINT16', {});
        expect(buffalo.getPosition()).toEqual(3);
        expect(value).toStrictEqual(65283);
    });

    it('UINT32 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(6), 2);
        buffalo.write('UINT32', 1065283, {});
        expect(buffalo.getPosition()).toEqual(6);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]))
    });

    it('UINT32 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x01, 0x03, 0xFF, 0xFF]));
        const value = buffalo.read('UINT32', {});
        expect(buffalo.getPosition()).toEqual(4);
        expect(value).toStrictEqual(4294902529);
    });

    it('IEEEADDR write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8));
        buffalo.write('IEEEADDR', ieeeaAddr1.string, {});
        expect(buffalo.getPosition()).toEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(ieeeaAddr1.hex))
    });

    it('IEEEADDR read', () => {
        const buffalo = new Buffalo(Buffer.from(ieeeaAddr2.hex));
        const value = buffalo.read('IEEEADDR', {});
        expect(buffalo.getPosition()).toEqual(8);
        expect(value).toStrictEqual(ieeeaAddr2.string);
    });

    it('BUFFER write', () => {
        const buffalo = new Buffalo(Buffer.alloc(5), 1);
        const payload = Buffer.from([0x00, 0x01, 0x02]);
        buffalo.write('BUFFER', payload, {});
        expect(buffalo.getPosition()).toEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, 0x00]))
    });

    it('BUFFER write as array', () => {
        const buffalo = new Buffalo(Buffer.alloc(5), 1);
        const payload = [0x00, 0x01, 0x02];
        buffalo.write('BUFFER', payload, {});
        expect(buffalo.getPosition()).toEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, 0x00]))
    });

    it('BUFFER read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]), 2);
        const value = buffalo.read('BUFFER', {length: 5});
        expect(buffalo.getPosition()).toEqual(7);
        expect(value).toStrictEqual(Buffer.from([0x02, 0x03, 0x04, 0x05, 0x06]));
    });

    it('BUFFER8 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(9), 1);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        buffalo.write('BUFFER8', payload, {});
        expect(buffalo.getPosition()).toStrictEqual(9);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload]))
    });

    it('BUFFER8 write length consistent', () => {
        const buffalo = new Buffalo(Buffer.alloc(9));
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
        expect(() => {
            buffalo.write('BUFFER8', payload, {});
        }).toThrow();
    });

    it('BUFFER8 read', () => {
        const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const buffalo = new Buffalo(buffer, 2);
        const value = buffalo.read('BUFFER8', {});
        expect(buffalo.getPosition()).toEqual(10);
        expect(value).toStrictEqual(buffer.slice(2, 11));
    });

    it('BUFFER16 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(20), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write('BUFFER16', Buffer.from([...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(17);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00, 0x00, 0x00]))
    });

    it('BUFFER16 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new Buffalo(Buffer.from([0x00, ...payload, ...payload]), 1);
        const value = buffalo.read('BUFFER16', {});
        expect(buffalo.getPosition()).toEqual(17);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER18 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(20), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        buffalo.write('BUFFER18', Buffer.from([...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(19);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00]))
    });

    it('BUFFER18 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        const buffalo = new Buffalo(Buffer.from([0x00, ...payload, ...payload]), 1)
        const value = buffalo.read('BUFFER18', {});
        expect(buffalo.getPosition()).toStrictEqual(19);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER32 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(34), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write('BUFFER32', Buffer.from([...payload, ...payload, ...payload, ...payload]), {});
        expect(buffalo.getPosition()).toStrictEqual(33);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, 0x00]))
    });

    it('BUFFER32 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new Buffalo(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload]), 1)
        const value = buffalo.read('BUFFER32', {});
        expect(buffalo.getPosition()).toStrictEqual(33);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload]));
    });

    it('BUFFER42 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(44), 1);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        buffalo.write('BUFFER42', Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xFF]), {});
        expect(buffalo.getPosition()).toStrictEqual(43);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xFF, 0x00]))
    });

    it('BUFFER42 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const buffalo = new Buffalo(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]), 1)
        const value = buffalo.read('BUFFER42', {});
        expect(buffalo.getPosition()).toStrictEqual(43);
        expect(value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]));
    });

    it('BUFFER100 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(100), 0);
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);
        buffalo.write('BUFFER100', Buffer.from(payload), {});
        expect(buffalo.getPosition()).toStrictEqual(100);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from(payload))
    });

    it('BUFFER100 read', () => {
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);
        const buffalo = new Buffalo(Buffer.from([0x00, ...payload]), 1);
        const value = buffalo.read('BUFFER100', {});
        expect(buffalo.getPosition()).toStrictEqual(101);
        expect(value).toStrictEqual(Buffer.from(payload));
    });

    it('Non existing type read', () => {
        expect(() => {
            // @ts-ignore
            const buffalo = new Buffalo(Buffer.alloc(0));
            buffalo.read('NONEXISTING', {});
        }).toThrow(new Error("Read for 'NONEXISTING' not available"));
    });

    it('LIST_UINT8 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4), 1);
        const payload = [200, 100];
        buffalo.write('LIST_UINT8', payload, {});
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xC8, 0x64, 0x00]));
    });

    it('LIST_UINT8 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x00, 0x04, 0x08]), 2);
        const value = buffalo.read('LIST_UINT8', {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual([4, 8]);
    });

    it('LIST_UINT16 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(5), 1);
        const payload = [1024, 2048];
        buffalo.write('LIST_UINT16', payload, {});
        expect(buffalo.getPosition()).toStrictEqual(5);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]));
    });

    it('LIST_UINT16 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]), 1);
        const value = buffalo.read('LIST_UINT16', {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(5);
        expect(value).toStrictEqual([1024, 2048]);
    });

    it('LIST_UINT24 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8), 1);
        const payload = [100000, 110110];
        buffalo.write('LIST_UINT24', payload, {});
        expect(buffalo.getPosition()).toStrictEqual(7);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xA0, 0x86, 0x01, 0x1E, 0xAE, 0x01, 0x00]));
    });

    it('LIST_UINT24 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0xA0, 0x86, 0x01, 0x1E, 0xAE, 0x01, 0x00]), 1);
        const value = buffalo.read('LIST_UINT24', {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(7);
        expect(value).toStrictEqual([100000, 110110]);
    });

    it('LIST_UINT32 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8));
        const payload = [4294967295, 10];
        buffalo.write('LIST_UINT32', payload, {});
        expect(buffalo.getPosition()).toStrictEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x0A, 0x00, 0x00, 0x00]));
    });

    it('LIST_UINT32 read', () => {
        const buffalo = new Buffalo(Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x0A, 0x00, 0x00, 0x00]));
        const value = buffalo.read('LIST_UINT32', {length: 2});
        expect(buffalo.getPosition()).toStrictEqual(8);
        expect(value).toStrictEqual([4294967295, 10]);
    });

    it('EMPTY write', () => {
        const buffalo = new Buffalo(Buffer.alloc(2));
        const payload = null;
        buffalo.write('EMPTY', payload, {});
        expect(buffalo.getPosition()).toStrictEqual(0);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00]));
    });

    it('EMPTY read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x00]), 1);
        const value = buffalo.read('EMPTY', {});
        expect(buffalo.getPosition()).toStrictEqual(1);
        expect(value).toStrictEqual(null);
    });

    it('UINT24 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4), 1);
        const payload = 16777200;
        buffalo.write('UINT24', payload, {});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xF0, 0xFF, 0xFF]));
    });

    it('UINT24 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x01, 0xA0, 0x86, 0x01, 0x02]), 1);
        const value = buffalo.read('UINT24', {});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual(100000);
    });

    it('INT24 write +', () => {
        const buffalo = new Buffalo(Buffer.alloc(3));
        buffalo.write('INT24', 65536, {});
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0x01]))
    });

    it('INT24 read +', () => {
        const buffalo = new Buffalo(Buffer.from([0x7F, 0xFF, 0xFF, 0x7F]), 1);
        const value = buffalo.read('INT24', {});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual(8388607);
    });

    it('INT24 write -', () => {
        const buffalo = new Buffalo(Buffer.alloc(3));
        buffalo.write('INT24', -65536, {});
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00, 0xFF]))
    });

    it('INT24 read -', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x00, 0xFF]));
        const value = buffalo.read('INT24', {});
        expect(buffalo.getPosition()).toStrictEqual(3);
        expect(value).toStrictEqual(-65536);
    });

    it('INT32 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4));
        buffalo.write('INT32', 2147483647, {});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0xFF, 0xFF, 0xFF, 0x7F]))
    });

    it('INT32 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x08, 0xFF, 0x03, 0xFF]));
        const value = buffalo.read('INT32', {});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual(-16515320);
    });

    it('INT48 write', () => {
        const buffalo = new Buffalo(Buffer.alloc(6));
        buffalo.write('INT48', -1082348273920, {});
        expect(buffalo.getPosition()).toStrictEqual(6);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0xFF, 0x03, 0xFF, 0x03, 0xFF]))
    });


    it('INT48 read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0xFF, 0x03, 0xFF, 0x03, 0xFF]));
        const value = buffalo.read('INT48', {});
        expect(buffalo.getPosition()).toStrictEqual(6);
        expect(value).toStrictEqual(-1082348273920);
    });

    it('FLOATLE write', () => {
        const buffalo = new Buffalo(Buffer.alloc(4));
        buffalo.write('FLOATLE', 400.50, {});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x40, 0xC8, 0x43]))
    });

    it('FLOATLE read', () => {
        const buffalo = new Buffalo(Buffer.from([0x00, 0x40, 0xC8, 0x43]));
        const value = buffalo.read('FLOATLE', {});
        expect(buffalo.getPosition()).toStrictEqual(4);
        expect(value).toStrictEqual(400.50);
    });

    it('DOUBLELE write', () => {
        const buffalo = new Buffalo(Buffer.alloc(8));
        buffalo.write('DOUBLELE', 809880.60, {});
        expect(buffalo.getPosition()).toStrictEqual(8);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x33, 0x33, 0x33, 0x33, 0x31, 0xB7, 0x28, 0x41]))
    });

    it('DOUBLELE read', () => {
        const buffalo = new Buffalo(Buffer.from([0x33, 0x33, 0x33, 0x33, 0x31, 0xB7, 0x28, 0x41]), 0);
        const value = buffalo.read('DOUBLELE', {});
        expect(buffalo.getPosition()).toStrictEqual(8);
        expect(value).toStrictEqual(809880.60);
    });
});