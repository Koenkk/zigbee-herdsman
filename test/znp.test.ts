import "regenerator-runtime/runtime";
import {Znp} from '../src/znp';
import SerialPort from 'serialport';
import {Frame as UnpiFrame, Constants as UnpiConstants} from '../src/unpi';
import {wait} from '../src/utils';

const mockSerialPortClose = jest.fn();
const mockSerialPortPipe = jest.fn();
const mockSerialPortOpen = jest.fn().mockImplementation((cb) => cb());
const mockSerialPortConstructor = jest.fn();
const mockSerialPortOnce = jest.fn();
const mockSerialPortWrite = jest.fn((buffer, cb) => cb());

jest.mock('serialport', () => {
    return jest.fn().mockImplementation(() => {
        return {
            close: mockSerialPortClose,
            constructor: mockSerialPortConstructor,
            emit: () => {},
            on: () => {},
            once: mockSerialPortOnce,
            open: mockSerialPortOpen,
            pipe: mockSerialPortPipe,
            write: mockSerialPortWrite,
        };
    });
});

const mockUnpiParserOn = jest.fn();

jest.mock('../src/unpi/parser', () => {
    return jest.fn().mockImplementation(() => {
        return {
            on: mockUnpiParserOn,
        };
    });
});

const mockUnpiWriterWriteFrame = jest.fn();

jest.mock('../src/unpi/writer', () => {
    return jest.fn().mockImplementation(() => {
        return {
            writeFrame: mockUnpiWriterWriteFrame,
            pipe: jest.fn(),
        };
    });
});

const mocks = [
    mockSerialPortClose, mockSerialPortPipe, mockSerialPortConstructor, mockSerialPortOpen,
    mockSerialPortOnce, mockSerialPortWrite, SerialPort, mockUnpiParserOn, mockUnpiWriterWriteFrame,
];

describe('ZNP', () => {
    let znp;

    beforeEach(() => {
        for (let mock of mocks) {
            // @ts-ignore
            mock.mockClear();
        }

        // @ts-ignore; make sure we always get a new instance
        znp = new Znp();
    });

    it('Open', async () => {
        await znp.open("/dev/ttyACM0", {baudRate: 100, rtscts: true});

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith(
            "/dev/ttyACM0",
            {"autoOpen": false, "baudRate": 100, "rtscts": true},
        );

        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortWrite).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(2);
    });

    it('Open with error', async () => {
        mockSerialPortOpen.mockImplementationOnce((cb) => cb('failed!'));

        let error = false;

        try {
            await znp.open("/dev/ttyACM0", {baudRate: 100, rtscts: true});
        } catch (e) {
            error = e;
        }

        expect(SerialPort).toHaveBeenCalledTimes(1);
        expect(SerialPort).toHaveBeenCalledWith(
            "/dev/ttyACM0",
            {"autoOpen": false, "baudRate": 100, "rtscts": true},
        );

        expect(error).toEqual(new Error("Error while opening serialport 'failed!'"));
        expect(mockSerialPortPipe).toHaveBeenCalledTimes(1);
        expect(mockSerialPortOpen).toHaveBeenCalledTimes(1);
        expect(mockSerialPortWrite).toHaveBeenCalledTimes(0);
        expect(mockSerialPortOnce).toHaveBeenCalledTimes(0);
    });

    it('znp receive', async () => {
        let parsedCb;
        const received = jest.fn();

        znp.on('received', received);

        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        znp.open("/dev/ttyACM0", {baudRate: 100, rtscts: true});
        parsedCb(new UnpiFrame(
            UnpiConstants.Type.SRSP,
            UnpiConstants.Subsystem.SYS,
            0x02,
            Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x01, 0x01, 0x01, 0x01])
        ));

        expect(received).toHaveBeenCalledTimes(1);

        const obj = received.mock.calls[0][0];
        expect(obj.command).toBe('version');
        expect(obj.commandID).toBe(2);
        expect(obj.payload).toStrictEqual({"maintrel": 5, "majorrel": 3, "minorrel": 4, "product": 2, "revision": 16843009, "transportrev": 1});
        expect(obj.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(obj.type).toBe(UnpiConstants.Type.SRSP);
    });

    it('znp request SREQ', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(
                UnpiConstants.Type.SRSP,
                UnpiConstants.Subsystem.SYS,
                0x08,
                Buffer.from([0x00, 0x02, 0x01, 0x02])
            ));
        });

        await znp.open("/dev/ttyACM0", {baudRate: 100, rtscts: true});

        const result = await znp.request(UnpiConstants.Subsystem.SYS, 'osalNvRead', {id: 1, offset: 2});

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(8);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(frame.type).toBe(UnpiConstants.Type.SREQ);
        expect(frame.data).toStrictEqual(Buffer.from([0x01, 0x00, 0x02]));

        expect(result.command).toBe('osalNvRead');
        expect(result.commandID).toBe(0x08);
        expect(result.payload).toStrictEqual({status: 0, len: 2, value: Buffer.from([0x01, 0x02])});
        expect(result.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(result.type).toBe(UnpiConstants.Type.SRSP);
    });

    it('znp request AREQ reset', async () => {
        let parsedCb;
        mockUnpiParserOn.mockImplementationOnce((event, cb) => {
            if (event === 'parsed') {
                parsedCb = cb;
            }
        });

        mockUnpiWriterWriteFrame.mockImplementationOnce(() => {
            parsedCb(new UnpiFrame(
                UnpiConstants.Type.AREQ,
                UnpiConstants.Subsystem.SYS,
                0x80,
                Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06])
            ));
        });

        await znp.open("/dev/ttyACM0", {baudRate: 100, rtscts: true});

        const result = await znp.request(UnpiConstants.Subsystem.SYS, 'resetReq', {type: 1});

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(0);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(frame.type).toBe(UnpiConstants.Type.AREQ);
        expect(frame.data).toStrictEqual(Buffer.from([1]));

        expect(result.command).toBe('resetInd');
        expect(result.commandID).toBe(0x80);
        expect(result.payload).toStrictEqual({reason: 1, transportrev: 2, productid: 3, majorrel: 4, minorrel: 5, hwrev: 6});
        expect(result.subsystem).toBe(UnpiConstants.Subsystem.SYS);
        expect(result.type).toBe(UnpiConstants.Type.AREQ);
    });

    it('znp request AREQ', async () => {
        await znp.open("/dev/ttyACM0", {baudRate: 100, rtscts: true});

        const result = await znp.request(UnpiConstants.Subsystem.SAPI, 'startConfirm', {status: 1});

        const frame = mockUnpiWriterWriteFrame.mock.calls[0][0];
        expect(mockUnpiWriterWriteFrame).toHaveBeenCalledTimes(1);
        expect(frame.commandID).toBe(128);
        expect(frame.subsystem).toBe(UnpiConstants.Subsystem.SAPI);
        expect(frame.type).toBe(UnpiConstants.Type.AREQ);
        expect(frame.data).toStrictEqual(Buffer.from([1]));

        expect(result).toBe(undefined);
    });

    it('znp request without init', async () => {
        let error;

        try {
            await znp.request(UnpiConstants.Subsystem.SAPI, 'startConfirm', {status: 1});
        } catch (e) {
            error = e;
        }

        expect(error).toEqual(new Error("Cannot request when znp has not been initialized yet"));
    });
});