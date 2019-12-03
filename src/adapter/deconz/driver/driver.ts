import Debug from 'debug';
import events from 'events';
import SerialPort from 'serialport';
import Writer from './writer';
import Parser from './parser';
import Frame from './frame';
import SerialPortUtils from '../../serialPortUtils';
import PARAM from './constants';
import { Command } from './constants';

// @ts-ignore
import slip from 'slip';
import { Request, parameterT } from './constants';

const debug = Debug('zigbee-herdsman:deconz:driver');

const autoDetectDefinitions = [
    {manufacturer: 'dresden elektronik ingenieurtechnik GmbH', vendorId: '1cf1', productId: '0030'}, // Conbee II
];

var queue: Array<object> = [];
var busyQueue: Array<object> = [];
export { busyQueue };

const littleEndian = true;

class Driver extends events.EventEmitter {
    private path: string;
    private serialPort: SerialPort;
    private initialized: boolean;
    private writer: Writer;
    private parser: Parser;
    private queue: Array<object>;
    private busyQueue: Array<object>;

    public constructor(path: string) {
        super();
        this.path = path;
        this.initialized = false;

        const that = this;
        setInterval(() => { that.processQueue(); }, 10);
        setInterval(() => { that.processBusyQueue(); }, 10);

        this.onParsed = this.onParsed.bind(this);

        // this.onUnpiParsed = this.onUnpiParsed.bind(this);
        // this.onUnpiParsedError = this.onUnpiParsedError.bind(this);
        // this.onSerialPortClose = this.onSerialPortClose.bind(this);
        // this.onSerialPortError = this.onSerialPortError.bind(this);
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return SerialPortUtils.is(path, autoDetectDefinitions);
    }

    public static async autoDetectPath(): Promise<string> {
        const paths = await SerialPortUtils.find(autoDetectDefinitions);
        return paths.length > 0 ? paths[0] : null;
    }

    public open(): Promise<void> {
        debug(`Opening with ${this.path}`);
        this.serialPort = new SerialPort(this.path, {baudRate: 38400, autoOpen: false});

        this.writer = new Writer();
        // @ts-ignore
        this.writer.pipe(this.serialPort);

        this.parser = new Parser();
        this.serialPort.pipe(this.parser);
        this.parser.on('parsed', this.onParsed);
        //this.unpiParser.on('error', this.onUnpiParsedError);

        return new Promise((resolve, reject): void => {
            this.serialPort.open(async (error: object): Promise<void> => {
                if (error) {
                    reject(new Error(`Error while opening serialport '${error}'`));
                    this.initialized = false;
                    if (this.serialPort.isOpen) {
                        this.serialPort.close();
                    }
                } else {
                    debug('Serialport opened');

                    // tests
                    try {
                        //const result1 = await this.writeParameterRequest(PARAM.PARAM.Network.MAC, [0x00,0x21,0x2e,0xff,0xff,0x03,0xd4,0x9a], 3);
                        //const mac = await this.readParameterRequest(PARAM.PARAM.Network.MAC, 1);
                        //const nwkAddress = await this.readParameterRequest(PARAM.PARAM.Network.NWK_ADDRESS, 5);
                        //const result = await this.writeParameterRequest(PARAM.PARAM.Network.PAN_ID, 0xaffe, 4);
                        //const panId = await this.readParameterRequest(PARAM.PARAM.Network.PAN_ID, 2);
                        //const fw = await this.readFirmwareVersionRequest(1);
                    } catch {
                        debug("Error");
                    }

                    this.initialized = true;
                    resolve();
                }
            });
        });
    }

    public close(): void {
        this.serialPort.close();
    }

    public readParameterRequest(parameterId: number, seqNumber: number) : Promise<Command> {
        return new Promise((resolve, reject): void => {
            debug(`push read parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId}`);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.ReadParameter;
            const req: Request = {commandId, parameterId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    public writeParameterRequest(parameterId: number, parameter: parameterT, seqNumber: number) : Promise<void> {
        return new Promise((resolve, reject): void => {
            debug(`push write parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId} parameter: ${parameter}`);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.WriteParameter;
            const req: Request = {commandId, parameterId, parameter, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    public readFirmwareVersionRequest(seqNumber: number) : Promise<number[]> {
        return new Promise((resolve, reject): void => {
            debug(`push read firmware version request to queue. seqNr: ${seqNumber}`);
            const ts = 0;
            const commandId = PARAM.PARAM.FrameType.ReadFirmwareVersion;
            const req: Request = {commandId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendReadParameterRequest(parameterId: number, seqNumber: number) {
        /* command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id */
        const requestFrame = [PARAM.PARAM.FrameType.ReadParameter, seqNumber, 0x00, 0x08, 0x00, 0x01, 0x00, parameterId];
        this.sendRequest(requestFrame);
    }

    private sendWriteParameterRequest(parameterId: number, parameter: parameterT, seqNumber: number) {
        /* command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id, pameter */
        const parameterLength = this.getLengthOfParameter(parameterId);
        debug("parameter: " + parameter.toString(16) + " length: " + parameterLength);

        const payloadLength = 1 + parameterLength;
        const frameLength = 7 + payloadLength;

        const fLength1 = frameLength & 0xff;
        const fLength2 = frameLength >> 8;

        const pLength1 = payloadLength & 0xff;
        const pLength2 = payloadLength >> 8;

        const requestframe = [PARAM.PARAM.FrameType.WriteParameter, seqNumber, 0x00, fLength1, fLength2, pLength1, pLength2, parameterId].concat(this.parameterBuffer(parameter, parameterLength));
        this.sendRequest(requestframe);

    }

    private getLengthOfParameter(parameterId: number) : number {
        switch (parameterId) {
            case 9: case 16: case 21: case 28: case 36:
                return 1;
            case 5: case 7: case 34:
                return 2;
            case 10: case 38:
                return 4;
            case 1: case 8: case 11: case 14:
                return 8;
            case 24: case 25:
                return 16;
            default:
                return 0;
        }
    }

    private parameterBuffer(parameter: parameterT, parameterLength: number) : Array<number> {
        const paramArray = new Array();

        if (typeof parameter === 'number') {
            // for parameter <= 4 Byte
            if (parameterLength > 4)
                throw new Error("parameter to big for type number");

            for (let i = 0; i < parameterLength; i++) {
                paramArray[i] = (parameter >> (8 * i)) & 0xff;
            }
        } else {
            return parameter.reverse();
        }

        return paramArray;
    }

    private sendReadFirmwareVersionRequest(seqNumber: number) {
        /* command id, sequence number, 0, framelength(U16) */
        const requestFrame = [PARAM.PARAM.FrameType.ReadFirmwareVersion, seqNumber, 0x00, 0x05, 0x00];
        this.sendRequest(requestFrame);
    }

    private sendRequest(buffer: number[]) {
        const crc = this.calcCrc(Buffer.from(buffer));
        const frame = Buffer.from([0xc0].concat(buffer).concat([crc[0], crc[1], 0xc0]));
        debug(frame);
        this.serialPort.write(frame);
    }

    private processQueue() {
        if (queue.length === 0) {
            return;
        }
        if (busyQueue.length > 0) {
            debug("don't process queue. Request pending");
            return;
        }
        const req: Request = queue.shift();
        req.ts = Date.now();

        switch (req.commandId) {
            case PARAM.PARAM.FrameType.ReadParameter:
                debug(`send read parameter request from queue. seqNr: ${req.seqNumber} paramId: ${req.parameterId}`);
                this.sendReadParameterRequest(req.parameterId, req.seqNumber);
                break;
            case PARAM.PARAM.FrameType.WriteParameter:
                debug(`send write parameter request from queue. seqNr: ${req.seqNumber} paramId: ${req.parameterId} param: ${req.parameter}`);
                this.sendWriteParameterRequest(req.parameterId, req.parameter, req.seqNumber);
                break;
            case PARAM.PARAM.FrameType.ReadFirmwareVersion:
                debug(`send read firmware version request from queue. seqNr: ${req.seqNumber}`);
                this.sendReadFirmwareVersionRequest(req.seqNumber);
                break;
            default:
                throw new Error("process queue - unknown command id");
                break;
        }

        busyQueue.push(req);
    }

    private processBusyQueue() {
        let i = busyQueue.length;
        while (i--) {
            const req: Request = busyQueue[i];
            const now = Date.now();

            if ((now - req.ts) > 1000) {
                debug(`Timeout for request paramId: ${req.parameterId} seq: ${req.seqNumber}`);
                //remove from busyQueue
                busyQueue.splice(i, 1);
                req.reject("TIMEOUT");
            }
        }
    }

    private calcCrc(buffer: Uint8Array) : Array<number>{
        let crc = 0;
        for (let i=0; i < buffer.length; i++) {
           crc += buffer[i];
        }
        const crc0 = (~crc + 1) & 0xff;
        const crc1 = ((~crc + 1) >> 8) & 0xff;
        return [crc0, crc1];
    }

    private onParsed(frame: Uint8Array): void {
        this.emit('rxFrame', frame);
    }
}

export default Driver;
