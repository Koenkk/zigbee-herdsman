import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters,
    StartResult,
} from '../../tstype';
import Debug from "debug";
import Adapter from '../../adapter';
import {Wait, Queue, Waitress} from '../../../utils';
import * as stream from 'stream';
import * as slip from './slip';
const debug = Debug("zigbee-herdsman:controller:conbee");
import Driver from '../driver/driver';
class Parser extends stream.Transform {
    private buffer: Buffer;

    public constructor() {
        super();
        this.buffer = Buffer.from([]);
    }

    public _transform(chunk: Buffer, _: string, cb: Function): void {
        console.log('bUFFER', chunk);
    }

}

class ConbeeAdapter extends Adapter {
    private driver: any;
    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);

        this.driver = new Driver(serialPortOptions.path);
        // const options = {baudRate: 38400, autoOpen: false};
        // const serialPort = new SerialPort(this.serialPortOptions.path, options);
        // console.log('open serialport');
        // const p = new Parser();
        // serialPort.pipe(p);

        // this.sp = serialPort;
        // serialPort.on('data', (d) => {console.log('DAATAAAA', d)})
        // serialPort.open((e) => {
        //     console.log(e);
        //     console.log('INCONBEE');
        //     console.log('writoo')

        //     const b = [0xC0, 0x0D, 0, 0, 0, 5];

        //     let crc = 0;
        //     for (let i = 0; i < b.length; i++) {
        //         crc += b[i];
        //     }

        //     let crc0 = (~crc + 1) & 0xFF;
        //     let crc1 = ((~crc + 1) >> 8) & 0xFF;

        //     b.push(crc0);
        //     b.push(crc1);
        //     b.push(0xC0);

        //     const k = slip.Encapsulate(b);
        //     console.log(k);
        //     serialPort.write(Buffer.from(k));
        // });



        // this.znp = new Znp(this.serialPortOptions.path, this.serialPortOptions.baudRate, this.serialPortOptions.rtscts);

        // this.transactionID = 0;
        // this.closing = false;
        // this.queue = new Queue(2);
        // this.waitress = new Waitress<Events.ZclDataPayload, WaitressMatcher>(
        //     this.waitressValidator, this.waitressTimeoutFormatter
        // );

        // this.znp.on('received', this.onZnpRecieved.bind(this));
        // this.znp.on('close', this.onZnpClose.bind(this));
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        await this.driver.open();
        this.driver.readParam();
        await Wait(5000);
        //this.sp

        // await this.znp.open();

        // this.version = (await this.znp.request(Subsystem.SYS, 'version', {})).payload;
        // debug(`Detected znp version '${ZnpVersion[this.version.product]}' (${JSON.stringify(this.version)})`);

        // return StartZnp(this.znp, this.version.product, this.networkOptions, this.backupPath);
    }
}

export default ConbeeAdapter;