import Debug from 'debug';
import events from 'events';
import SerialPort from 'serialport';
import Writer from './writer';
import Parser from './parser';
import Frame from './frame';
import SerialPortUtils from '../../serialPortUtils';
import PARAM from './constants';

// @ts-ignore
import slip from 'slip';
import { Request } from './constants';

const debug = Debug('zigbee-herdsman:deconz:driver');

const autoDetectDefinitions = [
    {manufacturer: 'dresden elektronik ingenieurtechnik GmbH', vendorId: '1cf1', productId: '0030'}, // Conbee II
];

var queue: Array<object> = [];
var busyQueue: Array<object> = [];
export { busyQueue };


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
                        const mac = await this.readParameterRequest(PARAM.PARAM.Network.MAC, 1);
                        const panId = await this.readParameterRequest(PARAM.PARAM.Network.PAN_ID, 2);
                        const nwkAddress = await this.readParameterRequest(PARAM.PARAM.Network.NWK_ADDRESS, 3);
                    } catch {
                        debug("Error");
                    }

                    //todo
                    //this.writeParameterRequest(PARAM.PARAM.Network.PAN_ID, 0xaffe);
                    //this.readParameterRequest(PARAM.PARAM.Network.PAN_ID);

                    this.initialized = true;
                    resolve();
                }
            });
        });
    }

    public close(): void {
        this.serialPort.close();
    }

    private readParameterRequest(parameterId: number, seqNumber: number) : Promise<void> {
        return new Promise((resolve, reject): void => {
            debug(`push read parameter request to queue. seqNr: ${seqNumber} paramId: ${parameterId}`);
            const ts = Date.now();
            const req: Request = {parameterId, seqNumber, resolve, reject, ts};
            queue.push(req);
        });
    }

    private sendReadParameterRequest(parameterId: number, seqNumber: number) {
        // command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id
        const requestFrame = [PARAM.PARAM.FrameType.ReadParameter, seqNumber, 0x00, 0x08, 0x00, 0x01, 0x00, parameterId];
        this.sendRequest(requestFrame);
    }

    private sendRequest(buffer: number[]) {
        const crc = this.calcCrc(Buffer.from(buffer));
        const frame = Buffer.from([0xc0].concat(buffer).concat([crc[0], crc[1], 0xc0]));
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
        debug(`send request from queue. seqNr: ${req.seqNumber} paramId: ${req.parameterId}`);
        busyQueue.push(req);
        this.sendReadParameterRequest(req.parameterId, req.seqNumber);
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

    //todo
    private writeParameterRequest(parameterId: number, parameter: number) : boolean {
        /* command id, sequence number, 0, framelength(U16), payloadlength(U16), parameter id, pameter */
        let parameterLength = parameter.toString(16).length;
        let payloadLength = 1 + parameterLength;
        let frameLength = 7 + payloadLength;
        const requestframe = [PARAM.PARAM.FrameType.WriteParameter, 0x01, 0x00, frameLength, 0x00, payloadLength, 0x00, parameterId, parameter];
        console.log("request write Parameter " + parameterId + ": " + parameter);
        //console.log("parameter length: " + parameterLength);
        const crc = this.calcCrc(Buffer.from(requestframe));
        console.log("CRC: " + crc[0].toString(16) + ", " + crc[1].toString(16));
        const k = Buffer.from([0xc0].concat(requestframe).concat([crc[0], crc[1], 0xc0]));
        //console.log(k);
        this.serialPort.write(k);
        return true;
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
