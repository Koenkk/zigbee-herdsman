import {Constants, Frame, Parser, Writer} from '../../../src/adapter/z-stack/unpi';

describe('Parser', () => {
    let parser;
    let parsed = [];

    beforeEach(() => {
        parser = new Parser();
        parser.on('parsed', (result) => parsed.push(result));
        parsed = [];
    });

    it('Parse simple message', () => {
        const buffer = Buffer.from([
            0xfe, 0x0e, 0x61, 0x02, 0x02, 0x00, 0x02, 0x06, 0x03, 0xd9, 0x14, 0x34, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x92,
        ]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(1);
        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(2);
        expect(parsed[0].data).toStrictEqual(Buffer.from([2, 0, 2, 6, 3, 217, 20, 52, 1, 2, 0, 0, 0, 0]));
        expect(parsed[0].length).toBe(14);
        expect(parsed[0].fcs).toBe(0x92);
    });

    it('Parse two messages', () => {
        const buffer = Buffer.from([
            0xfe, 0x0e, 0x61, 0x02, 0x02, 0x00, 0x02, 0x06, 0x03, 0xd9, 0x14, 0x34, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x92, 0xfe, 0x03, 0x61, 0x08,
            0x00, 0x01, 0x55, 0x3e,
        ]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(2);
        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(2);
        expect(parsed[0].data).toStrictEqual(Buffer.from([2, 0, 2, 6, 3, 217, 20, 52, 1, 2, 0, 0, 0, 0]));
        expect(parsed[0].length).toBe(14);
        expect(parsed[0].fcs).toBe(0x92);
        expect(parsed[1].type).toBe(Constants.Type.SRSP);
        expect(parsed[1].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[1].commandID).toBe(8);
        expect(parsed[1].data).toStrictEqual(Buffer.from([0, 1, 85]));
        expect(parsed[1].length).toBe(3);
        expect(parsed[1].fcs).toBe(0x3e);
    });

    it('Dont throw error on fcs mismatch', () => {
        const buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01, 0x55, 0x3f]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(0);
    });

    it('Message in two chunks', () => {
        let buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(0);

        buffer = Buffer.from([0x55, 0x3e]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(1);

        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(8);
        expect(parsed[0].data).toStrictEqual(Buffer.from([0, 1, 85]));
        expect(parsed[0].length).toBe(3);
        expect(parsed[0].fcs).toBe(0x3e);
    });

    it('Message in two chunks, fcs as separate', () => {
        let buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01, 0x55]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(0);

        buffer = Buffer.from([0x3e]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(1);

        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(8);
        expect(parsed[0].data).toStrictEqual(Buffer.from([0, 1, 85]));
        expect(parsed[0].length).toBe(3);
        expect(parsed[0].fcs).toBe(0x3e);
    });

    it('Parse message when it doenst start with SOF and buffer is empty (throw away everything until SOF)', () => {
        const buffer = Buffer.from([
            95, 27, 37, 254, 3, 69, 196, 212, 23, 0, 65, 254, 27, 68, 129, 0, 0, 8, 0, 212, 23, 1, 1, 0, 55, 0, 153, 178, 219, 0, 0, 7, 8, 122, 10, 0,
            0, 32, 243, 212, 23, 29, 160, 254, 7, 69, 196, 111, 244, 2, 122, 155, 246, 95, 87, 254, 27, 68, 129, 0, 0, 6, 0, 111, 244, 1, 1, 0, 118,
            0, 245, 236, 220, 0, 0, 7, 8, 2, 10, 0, 0, 16, 0, 246, 95, 27, 85,
        ]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(4);
        expect(parsed[0].type).toBe(Constants.Type.AREQ);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.ZDO);
        expect(parsed[0].commandID).toBe(196);
        expect(parsed[0].data).toStrictEqual(Buffer.from([0xd4, 0x17, 0x00]));
        expect(parsed[0].length).toBe(3);
        expect(parsed[0].fcs).toBe(65);
        expect(parsed[1].type).toBe(Constants.Type.AREQ);
        expect(parsed[1].subsystem).toBe(Constants.Subsystem.AF);
        expect(parsed[1].commandID).toBe(129);
        expect(parsed[1].data).toStrictEqual(
            Buffer.from([0, 0, 8, 0, 212, 23, 1, 1, 0, 55, 0, 153, 178, 219, 0, 0, 7, 8, 122, 10, 0, 0, 32, 243, 212, 23, 29]),
        );
        expect(parsed[1].length).toBe(27);
        expect(parsed[1].fcs).toBe(160);
    });

    it('Continue parsing on fcs mismatch', () => {
        const buffer1 = Buffer.from([
            0x01,
            0x02,
            0xfe,
            0x03,
            0x61,
            0x08,
            0x00,
            0x01,
            0x55,
            0x3f, // fcs mismatch
            0x08,
            0x09,
            0x12, // Noise
        ]);

        const buffer2 = Buffer.from([
            0x08,
            0x09,
            0x12, // Noise
        ]);

        const buffer3 = Buffer.from([
            0x08,
            0x09,
            0x12, // Noise
            0xfe,
            0x0e,
            0x61,
            0x02, // Valid message part 1
        ]);

        const buffer4 = Buffer.from([
            0x02,
            0x00,
            0x02,
            0x06,
            0x03,
            0xd9,
            0x14,
            0x34,
            0x01,
            0x02,
            0x00,
            0x00,
            0x00,
            0x00,
            0x92, // Valid message part 2
        ]);

        parser._transform(buffer1, '', () => {});
        parser._transform(buffer2, '', () => {});
        parser._transform(buffer3, '', () => {});
        parser._transform(buffer4, '', () => {});

        expect(parsed.length).toBe(1);
        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(2);
        expect(parsed[0].data).toStrictEqual(Buffer.from([2, 0, 2, 6, 3, 217, 20, 52, 1, 2, 0, 0, 0, 0]));
        expect(parsed[0].length).toBe(14);
        expect(parsed[0].fcs).toBe(0x92);
    });
});

describe('Frame', () => {
    it('To buffer', () => {
        const frame = new Frame(Constants.Type.SRSP, Constants.Subsystem.SYS, 3, Buffer.from([0x06, 0x01]));
        const buffer = frame.toBuffer();
        expect(buffer).toStrictEqual(Buffer.from([0xfe, 0x02, 0x61, 0x03, 0x06, 0x01, 0x67]));
    });
});

describe('Writer', () => {
    let writer;

    beforeEach(() => {
        writer = new Writer();
    });

    it('Write frame', () => {
        const frame = new Frame(Constants.Type.SRSP, Constants.Subsystem.SYS, 3, Buffer.from([0x06, 0x01]));
        const push = vi.spyOn(writer, 'push').mockReturnValue(undefined);
        writer.writeFrame(frame);
        expect(push).toHaveBeenCalledTimes(1);
        expect(push.mock.calls[0][0]).toStrictEqual(frame.toBuffer());
    });

    it('Write buffer', () => {
        const buffer = Buffer.from([0x01, 0x02]);
        const push = vi.spyOn(writer, 'push').mockReturnValue(undefined);
        writer.writeBuffer(buffer);
        expect(push).toHaveBeenCalledTimes(1);
        expect(push.mock.calls[0][0]).toStrictEqual(buffer);
    });

    it('Read should do nothing (satisfy coverage)', () => {
        writer.read();
    });
});
