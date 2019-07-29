import {Buffalo} from '../src/buffalo';
import {duplicateArray, ieeeaAddr1, ieeeaAddr2} from './testUtils';

describe('Buffalo', () => {
    it('UINT8 write', () => {
        const buffer = Buffer.alloc(3);
        const length = Buffalo.write('UINT8', buffer, 1, 240);
        expect(length).toStrictEqual(1);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xF0, 0x00]))
    });

    it('UINT8 read', () => {
        const buffer = Buffer.from([0x00, 0x03, 0x00, 0x00]);
        const result = Buffalo.read('UINT8', buffer, 1, {});
        expect(result.length).toStrictEqual(1);
        expect(result.value).toStrictEqual(3);
    });

    it('INT8 write', () => {
        const buffer = Buffer.alloc(3);
        const length = Buffalo.write('INT8', buffer, 1, 127);
        expect(length).toStrictEqual(1);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x7F, 0x00]))
    });

    it('INT8 read', () => {
        const buffer = Buffer.from([0x00, 0xF0, 0x00, 0x00]);
        const result = Buffalo.read('INT8', buffer, 1, {});
        expect(result.length).toStrictEqual(1);
        expect(result.value).toStrictEqual(-16);
    });

    it('INT16 write', () => {
        const buffer = Buffer.alloc(3);
        const length = Buffalo.write('INT16', buffer, 1, 256);
        expect(length).toStrictEqual(2);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00, 0x01]))
    });

    it('INT16 read', () => {
        const buffer = Buffer.from([0x00, 0xFF, 0xFF, 0x00]);
        const result = Buffalo.read('INT16', buffer, 1, {});
        expect(result.length).toStrictEqual(2);
        expect(result.value).toStrictEqual(-1);
    });

    it('UINT16 write', () => {
        const buffer = Buffer.alloc(3);
        const length = Buffalo.write('UINT16', buffer, 1, 1020);
        expect(length).toStrictEqual(2);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xFC, 0x03]))
    });

    it('UINT16 read', () => {
        const buffer = Buffer.from([0x00, 0x03, 0xFF, 0x00]);
        const result = Buffalo.read('UINT16', buffer, 1, {});
        expect(result.length).toStrictEqual(2);
        expect(result.value).toStrictEqual(65283);
    });

    it('UINT32 write', () => {
        const buffer = Buffer.alloc(6);
        const length = Buffalo.write('UINT32', buffer, 2, 1065283);
        expect(length).toStrictEqual(4);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]))
    });

    it('UINT32 read', () => {
        const buffer = Buffer.from([0x01, 0x03, 0xFF, 0xFF]);
        const result = Buffalo.read('UINT32', buffer, 0, {});
        expect(result.length).toStrictEqual(4);
        expect(result.value).toStrictEqual(4294902529);
    });

    it('IEEEADDR write', () => {
        const buffer = Buffer.alloc(8);
        const length = Buffalo.write('IEEEADDR', buffer, 0, ieeeaAddr1.string);
        expect(length).toStrictEqual(8);
        expect(buffer).toStrictEqual(Buffer.from(ieeeaAddr1.hex))
    });

    it('IEEEADDR read', () => {
        const buffer = Buffer.from(ieeeaAddr2.hex);
        const result = Buffalo.read('IEEEADDR', buffer, 0, {});
        expect(result.length).toStrictEqual(8);
        expect(result.value).toStrictEqual(ieeeaAddr2.string);
    });

    it('BUFFER write', () => {
        const buffer = Buffer.alloc(5);
        const payload = Buffer.from([0x00, 0x01, 0x02]);
        const length = Buffalo.write('BUFFER', buffer, 1, payload);
        expect(length).toStrictEqual(3);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, 0x00]))
    });

    it('BUFFER write as array', () => {
        const buffer = Buffer.alloc(5);
        const payload = [0x00, 0x01, 0x02];
        const length = Buffalo.write('BUFFER', buffer, 1, payload);
        expect(length).toStrictEqual(3);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, 0x00]))
    });

    it('BUFFER read', () => {
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const result = Buffalo.read('BUFFER', payload, 2, {length: 5});
        expect(result.length).toStrictEqual(5);
        expect(result.value).toStrictEqual(Buffer.from([0x02, 0x03, 0x04, 0x05, 0x06]));
    });

    it('BUFFER8 write', () => {
        const buffer = Buffer.alloc(9);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        const length = Buffalo.write('BUFFER8', buffer, 1, payload);
        expect(length).toStrictEqual(8);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload]))
    });

    it('BUFFER8 write length consistent', () => {
        const buffer = Buffer.alloc(9);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]);
        expect(() => {
            Buffalo.write('BUFFER8', buffer, 1, payload);
        }).toThrow();
    });

    it('BUFFER8 read', () => {
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const result = Buffalo.read('BUFFER8', payload, 2, {});
        expect(result.length).toStrictEqual(8);
        expect(result.value).toStrictEqual(payload.slice(2, 11));
    });

    it('BUFFER16 write', () => {
        const buffer = Buffer.alloc(20);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const length = Buffalo.write('BUFFER16', buffer, 1, Buffer.from([...payload, ...payload]));
        expect(length).toStrictEqual(16);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00, 0x00, 0x00]))
    });

    it('BUFFER16 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const result = Buffalo.read('BUFFER16', Buffer.from([0x00, ...payload, ...payload]), 1, {});
        expect(result.length).toStrictEqual(16);
        expect(result.value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER18 write', () => {
        const buffer = Buffer.alloc(20);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        const length = Buffalo.write('BUFFER18', buffer, 1, Buffer.from([...payload, ...payload]));
        expect(length).toStrictEqual(18);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, 0x00]))
    });

    it('BUFFER18 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08];
        const result = Buffalo.read('BUFFER18', Buffer.from([0x00, ...payload, ...payload]), 1, {});
        expect(result.length).toStrictEqual(18);
        expect(result.value).toStrictEqual(Buffer.from([...payload, ...payload]));
    });

    it('BUFFER32 write', () => {
        const buffer = Buffer.alloc(34);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const length = Buffalo.write('BUFFER32', buffer, 1, Buffer.from([...payload, ...payload, ...payload, ...payload]));
        expect(length).toStrictEqual(32);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, 0x00]))
    });

    it('BUFFER32 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const result = Buffalo.read('BUFFER32', Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload]), 1, {});
        expect(result.length).toStrictEqual(32);
        expect(result.value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload]));
    });

    it('BUFFER42 write', () => {
        const buffer = Buffer.alloc(44);
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const length = Buffalo.write('BUFFER42', buffer, 1, Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xFF]));
        expect(length).toStrictEqual(42);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x01, 0xFF, 0x00]))
    });

    it('BUFFER42 read', () => {
        const payload = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07];
        const result = Buffalo.read('BUFFER42', Buffer.from([0x00, ...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]), 1, {});
        expect(result.length).toStrictEqual(42);
        expect(result.value).toStrictEqual(Buffer.from([...payload, ...payload, ...payload, ...payload, ...payload, 0x08, 0x09]));
    });

    it('BUFFER100 write', () => {
        const buffer = Buffer.alloc(100);
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);

        const length = Buffalo.write('BUFFER100', buffer, 0, Buffer.from(payload));
        expect(length).toStrictEqual(100);
        expect(buffer).toStrictEqual(Buffer.from(payload))
    });

    it('BUFFER100 read', () => {
        let payload = duplicateArray(20, [0x00, 0x01, 0x02, 0x03, 0x04]);

        const result = Buffalo.read('BUFFER100', Buffer.from([0x00, ...payload]), 1, {});
        expect(result.length).toStrictEqual(100);
        expect(result.value).toStrictEqual(Buffer.from(payload));
    });

    it('Non existing type read', () => {
        expect(() => {
            // @ts-ignore
            Buffalo.read('NONEXISTING', Buffer.alloc(0), 1, {});
        }).toThrow(new Error("Read for 'NONEXISTING' not available"));
    });

    it('LIST_UINT8 write', () => {
        const buffer = Buffer.alloc(4);
        const payload = [200, 100];
        const length = Buffalo.write('LIST_UINT8', buffer, 1, payload);
        expect(length).toStrictEqual(2);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xC8, 0x64, 0x00]));
    });

    it('LIST_UINT8 read', () => {
        const result = Buffalo.read('LIST_UINT8', Buffer.from([0x00, 0xC8, 0x64, 0x00]), 1, {length: 2});
        expect(result.length).toStrictEqual(2);
        expect(result.value).toStrictEqual([200, 100]);
    });

    it('LIST_UINT16 write', () => {
        const buffer = Buffer.alloc(5);
        const payload = [1024, 2048];
        const length = Buffalo.write('LIST_UINT16', buffer, 1, payload);
        expect(length).toStrictEqual(4);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]));
    });

    it('LIST_UINT16 read', () => {
        const result = Buffalo.read('LIST_UINT16', Buffer.from([0x00, 0x00, 0x04, 0x00, 0x08]), 1, {length: 2});
        expect(result.length).toStrictEqual(4);
        expect(result.value).toStrictEqual([1024, 2048]);
    });

    it('LIST_UINT24 write', () => {
        const buffer = Buffer.alloc(8);
        const payload = [100000, 110110];
        const length = Buffalo.write('LIST_UINT24', buffer, 1, payload);
        expect(length).toStrictEqual(6);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xA0, 0x86, 0x01, 0x1E, 0xAE, 0x01, 0x00]));
    });

    it('LIST_UINT24 read', () => {
        const result = Buffalo.read('LIST_UINT24', Buffer.from([0x00, 0xA0, 0x86, 0x01, 0x1E, 0xAE, 0x01, 0x00]), 1, {length: 2});
        expect(result.length).toStrictEqual(6);
        expect(result.value).toStrictEqual([100000, 110110]);
    });

    it('LIST_UINT32 write', () => {
        const buffer = Buffer.alloc(8);
        const payload = [4294967295, 10];
        const length = Buffalo.write('LIST_UINT32', buffer, 0, payload);
        expect(length).toStrictEqual(8);
        expect(buffer).toStrictEqual(Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x0A, 0x00, 0x00, 0x00]));
    });

    it('LIST_UINT32 read', () => {
        const result = Buffalo.read('LIST_UINT32', Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0x0A, 0x00, 0x00, 0x00]), 0, {length: 2});
        expect(result.length).toStrictEqual(8);
        expect(result.value).toStrictEqual([4294967295, 10]);
    });

    it('EMPTY write', () => {
        const buffer = Buffer.alloc(2);
        const payload = null;
        const length = Buffalo.write('EMPTY', buffer, 0, payload);
        expect(length).toStrictEqual(0);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00]));
    });

    it('EMPTY read', () => {
        const result = Buffalo.read('EMPTY', Buffer.from([0x00, 0x00]), 0, {});
        expect(result.length).toStrictEqual(0);
        expect(result.value).toStrictEqual(null);
    });

    it('UINT24 write', () => {
        const buffer = Buffer.alloc(4);
        const payload = 16777200;
        const length = Buffalo.write('UINT24', buffer, 1, payload);
        expect(length).toStrictEqual(3);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xF0, 0xFF, 0xFF]));
    });

    it('UINT24 read', () => {
        const result = Buffalo.read('UINT24', Buffer.from([0x01, 0xA0, 0x86, 0x01, 0x02]), 1, {});
        expect(result.length).toStrictEqual(3);
        expect(result.value).toStrictEqual(100000);
    });

    it('INT24 write +', () => {
        const buffer = Buffer.alloc(3);
        const length = Buffalo.write('INT24', buffer, 0, 65536);
        expect(length).toStrictEqual(3);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00, 0x01]))
    });

    it('INT24 read +', () => {
        const buffer = Buffer.from([0x7F, 0xFF, 0xFF, 0x7F]);
        const result = Buffalo.read('INT24', buffer, 1, {});
        expect(result.length).toStrictEqual(3);
        expect(result.value).toStrictEqual(8388607);
    });

    it('INT24 write -', () => {
        const buffer = Buffer.alloc(3);
        const length = Buffalo.write('INT24', buffer, 0, -65536);
        expect(length).toStrictEqual(3);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00, 0xFF]))
    });

    it('INT24 read -', () => {
        const buffer = Buffer.from([0x00, 0x00, 0xFF]);
        const result = Buffalo.read('INT24', buffer, 0, {});
        expect(result.length).toStrictEqual(3);
        expect(result.value).toStrictEqual(-65536);
    });

    it('INT32 write', () => {
        const buffer = Buffer.alloc(4);
        const length = Buffalo.write('INT32', buffer, 0, 2147483647);
        expect(length).toStrictEqual(4);
        expect(buffer).toStrictEqual(Buffer.from([0xFF, 0xFF, 0xFF, 0x7F]))
    });

    it('INT32 read', () => {
        const buffer = Buffer.from([0x08, 0xFF, 0x03, 0xFF]);
        const result = Buffalo.read('INT32', buffer, 0, {});
        expect(result.length).toStrictEqual(4);
        expect(result.value).toStrictEqual(-16515320);
    });

    it('FLOATLE write', () => {
        const buffer = Buffer.alloc(4);
        const length = Buffalo.write('FLOATLE', buffer, 0, 400.50);
        expect(length).toStrictEqual(4);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x40, 0xC8, 0x43]))
    });

    it('FLOATLE read', () => {
        const buffer = Buffer.from([0x00, 0x40, 0xC8, 0x43]);
        const result = Buffalo.read('FLOATLE', buffer, 0, {});
        expect(result.length).toStrictEqual(4);
        expect(result.value).toStrictEqual(400.50);
    });

    it('DOUBLELE write', () => {
        const buffer = Buffer.alloc(8);
        const length = Buffalo.write('DOUBLELE', buffer, 0, 809880.60);
        expect(length).toStrictEqual(8);
        expect(buffer).toStrictEqual(Buffer.from([0x33, 0x33, 0x33, 0x33, 0x31, 0xB7, 0x28, 0x41]))
    });

    it('DOUBLELE read', () => {
        const buffer = Buffer.from([0x33, 0x33, 0x33, 0x33, 0x31, 0xB7, 0x28, 0x41]);
        const result = Buffalo.read('DOUBLELE', buffer, 0, {});
        expect(result.length).toStrictEqual(8);
        expect(result.value).toStrictEqual(809880.60);
    });
});