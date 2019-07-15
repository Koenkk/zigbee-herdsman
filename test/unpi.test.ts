import {Parser, Constants, Frame, Writer} from '../src/unpi';

describe('Parser', () => {
    let parser;
    let parsed = [];
    let error = [];

    beforeEach(() => {
        parser = new Parser();
        parser.on('parsed', (result) => parsed.push(result));
        parser.on('error', (result) => error.push(result));
        parsed = [];
        error = [];
    });

    it('Parse simple message', () => {
        const buffer = Buffer.from([0xfe, 0x0e, 0x61, 0x02, 0x02, 0x00, 0x02, 0x06, 0x03, 0xd9, 0x14, 0x34, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x92]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(1);
        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(2);
        expect(parsed[0].data).toStrictEqual([2, 0, 2, 6, 3, 217, 20, 52, 1, 2, 0, 0, 0, 0]);
        expect(parsed[0].length).toBe(14);
        expect(parsed[0].fcs).toBe(0x92);
    });

    it('Parse two messages', () => {
        const buffer = Buffer.from([0xfe, 0x0e, 0x61, 0x02, 0x02, 0x00, 0x02, 0x06, 0x03, 0xd9, 0x14, 0x34, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00, 0x92, 0xfe, 0x03, 0x61, 0x08, 0x00, 0x01, 0x55, 0x3e]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(2);
        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(2);
        expect(parsed[0].data).toStrictEqual([2, 0, 2, 6, 3, 217, 20, 52, 1, 2, 0, 0, 0, 0]);
        expect(parsed[0].length).toBe(14);
        expect(parsed[0].fcs).toBe(0x92);
        expect(parsed[1].type).toBe(Constants.Type.SRSP);
        expect(parsed[1].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[1].commandID).toBe(8);
        expect(parsed[1].data).toStrictEqual([0, 1, 85]);
        expect(parsed[1].length).toBe(3);
        expect(parsed[1].fcs).toBe(0x3e);
    });

    it('Throw error on fcs mismatch', () => {
        const buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01, 0x55, 0x3f]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(0);
        expect(error.length).toBe(1);
    });

    it('Message in two buffer steps', () => {
        let buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(0);
        expect(error.length).toBe(0);

        buffer = Buffer.from([0x55, 0x3e]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(1);
        expect(error.length).toBe(0);

        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(8);
        expect(parsed[0].data).toStrictEqual([0, 1, 85]);
        expect(parsed[0].length).toBe(3);
        expect(parsed[0].fcs).toBe(0x3e);
    });

    it('Message in two buffer steps, fcs as separate', () => {
        let buffer = Buffer.from([0xfe, 0x03, 0x61, 0x08, 0x00, 0x01, 0x55]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(0);
        expect(error.length).toBe(0);

        buffer = Buffer.from([0x3e]);
        parser._transform(buffer, '', () => {});
        expect(parsed.length).toBe(1);
        expect(error.length).toBe(0);

        expect(parsed[0].type).toBe(Constants.Type.SRSP);
        expect(parsed[0].subsystem).toBe(Constants.Subsystem.SYS);
        expect(parsed[0].commandID).toBe(8);
        expect(parsed[0].data).toStrictEqual([0, 1, 85]);
        expect(parsed[0].length).toBe(3);
        expect(parsed[0].fcs).toBe(0x3e);
    });
});

describe('Frame', () => {
    it('To buffer', () => {
        const frame = new Frame(Constants.Type.SRSP, Constants.Subsystem.SYS, 3, [0x06, 0x01])
        const buffer = frame.toBuffer();
        expect(buffer).toStrictEqual(Buffer.from([0xfe, 0x02, 0x61, 0x03, 0x06, 0x01, 0x67]))
    });
});

describe('Writer', () => {
    let writer;

    beforeEach(() => {
        writer = new Writer();
    });

    it('Write frame', () => {
        const frame = new Frame(Constants.Type.SRSP, Constants.Subsystem.SYS, 3, [0x06, 0x01])
        const push = jest.spyOn(writer, 'push').mockReturnValue(undefined);
        writer.writeFrame(frame);
        expect(push).toHaveBeenCalledTimes(1);
        expect(push.mock.calls[0][0]).toStrictEqual(frame.toBuffer());
    });

    it('Write buffer', () => {
        const buffer = [0x01, 0x02];
        const push = jest.spyOn(writer, 'push').mockReturnValue(undefined);
        writer.writeBuffer(buffer);
        expect(push).toHaveBeenCalledTimes(1);
        expect(push.mock.calls[0][0]).toStrictEqual(buffer);
    });

    it('Read should do nothing (satisfy coverage)', () => {
        writer.read();
    });
});