import Debug from 'debug';
import events from 'events';
import SerialPort from 'serialport';
import Writer from './writer';
import Parser from './parser';
import Frame from './frame';
import Constants from './constants';
import SerialPortUtils from '../../serialPortUtils';

const debug = {
    log: Debug('zigbee-herdsman:deconz:driver'),
};

const autoDetectDefinitions = [
    {manufacturer: 'dresden elektronik ingenieurtechnik GmbH', vendorId: '1cf1', productId: '0030'}, // Conbee II
];

class Driver extends events.EventEmitter {
    private path: string;
    private serialPort: SerialPort;
    private initialized: boolean;
    private writer: Writer;
    private parser: Parser;

    public constructor(path: string) {
        super();
        this.path = path;
        this.initialized = false;

        // this.queue = new Queue();
        // this.waitress = new Waitress<ZpiObject, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);

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
        debug.log(`Opening with ${this.path}`);
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
                    debug.log('Serialport opened');
                    // this.serialPort.once('close', this.onSerialPortClose);
                    // this.serialPort.once('error', this.onSerialPortError);
                    this.initialized = true;
                    resolve();
                }
            });
        });
    }

    // private readParam() {
    //     const b = [0x0a, 1, 0, 0, 0, 1, 0, 0x01];

    //     b[3] = b.length & 0xff;
    //     b[4] = (b.length >> 8) & 0xff;
    //     b.push(0xEB);
    //     b.push(0xFF)
    //     // const crc = this.calcCrc(b, b.length);

    //     //console.log();

    //     console.log('wrITEEEE');

    //     console.log(slip.Encapsulate(b))

    //     const k = Buffer.from([0xc0, 0x0a, 0x01, 0x00, 0x08, 0x00, 0x01, 0x00, 0x01, 0xeb, 0xff, 0xc0]);
    //     console.log(k);
    //     this.serialPort.write(b);
    // }

    // private calcCrc(buffer, len) {
    //     let crc = 0;
    //     for (let i = 0; i < len; i++) {
    //       crc += buffer[i];
    //     }
    //     return (~crc + 1) & 0xffff;
    //   }

    private onParsed(frame: Frame): void {
        console.log(frame);
    }
}

export default Driver;