import {Parser, Type} from '../src/types';

describe('Parser', () => {
    it('UINT8 write', () => {
        const parser = Parser[Type.UINT8];
        const buffer = Buffer.alloc(3);
        const length = parser.write(buffer, 1, 240);
        expect(length).toStrictEqual(1);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xF0, 0x00]))
    });

    it('UINT8 read', () => {
        const parser = Parser[Type.UINT8];
        const buffer = Buffer.from([0x00, 0x03, 0x00, 0x00]);
        const result = parser.read(buffer, 1, {});
        expect(result.length).toStrictEqual(1);
        expect(result.value).toStrictEqual(3);
    });

    it('UINT16 write', () => {
        const parser = Parser[Type.UINT16];
        const buffer = Buffer.alloc(3);
        const length = parser.write(buffer, 1, 1020);
        expect(length).toStrictEqual(2);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0xFC, 0x03]))
    });

    it('UINT16 read', () => {
        const parser = Parser[Type.UINT16];
        const buffer = Buffer.from([0x00, 0x03, 0xFF, 0x00]);
        const result = parser.read(buffer, 1, {});
        expect(result.length).toStrictEqual(2);
        expect(result.value).toStrictEqual(65283);
    });

    it('UINT32 write', () => {
        const parser = Parser[Type.UINT32];
        const buffer = Buffer.alloc(6);
        const length = parser.write(buffer, 2, 1065283);
        expect(length).toStrictEqual(4);
        expect(buffer).toStrictEqual(Buffer.from([0x00, 0x00, 0x43, 0x41, 0x10, 0x00]))
    });

    it('UINT32 read', () => {
        const parser = Parser[Type.UINT32];
        const buffer = Buffer.from([0x01, 0x03, 0xFF, 0xFF]);
        const result = parser.read(buffer, 0, {});
        expect(result.length).toStrictEqual(4);
        expect(result.value).toStrictEqual(4294902529);
    });

    // it('BUFFER write', () => {
    //     const parser = Parser[Type.BUFFER8];
    //     const buffer = Buffer.alloc(3);
    //     const payload = Buffer.from([0x00, 0x01, 0x02]);
    //     const length = parser.write(buffer, 1, payload);
    //     expect(length).toStrictEqual(8);
    //     expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload]))
    // });

    it('BUFFER8 read', () => {
        const parser = Parser[Type.BUFFER8];
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const result = parser.read(payload, 2, {});
        expect(result.length).toStrictEqual(8);
        expect(result.value).toStrictEqual(payload.slice(2, 11));
    });

    it('BUFFER8 write', () => {
        const parser = Parser[Type.BUFFER8];
        const buffer = Buffer.alloc(9);
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
        const length = parser.write(buffer, 1, payload);
        expect(length).toStrictEqual(8);
        expect(buffer).toStrictEqual(Buffer.from([0x00, ...payload]))
    });

    it('BUFFER8 read', () => {
        const parser = Parser[Type.BUFFER8];
        const payload = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
        const result = parser.read(payload, 2, {});
        expect(result.length).toStrictEqual(8);
        expect(result.value).toStrictEqual(payload.slice(2, 11));
    });
});