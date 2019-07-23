import {Buffalo} from '../src/buffalo';
import {duplicateArray, ieeeaAddr1, ieeeaAddr2} from './utils';

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
});