import events from 'events';
// @ts-ignore
import mixin from 'mixin-deep';
import Database from './database';
import {Znp} from '../znp';
import {StartZnp} from './helpers';
import * as TsType from './tstype';

interface Options {
    network: TsType.NetworkOptions;
    databasePath: string;
    coordinatorBackupPath: string;
    serialport: {
        baudRate: number;
        rtscts: boolean;
        path: string;
    };
};

const DefaultOptions: Options = {
    network: {
        networkKeyDistribute: false,
        networkKey: [0x01, 0x03, 0x05, 0x07, 0x09, 0x0B, 0x0D, 0x0F, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0D],
    },
    serialport: {
        baudRate: 115200,
        rtscts: true,
    },
    coordinatorBackupPath: null,
    databasePath: null,
}

const debug = {
    error: require('debug')('zigbee-herdsman:controller:error'),
    log: require('debug')('zigbee-herdsman:controller:log'),
};

class Controller extends events.EventEmitter {
    private options: Options;
    private database: Database;
    private znp: Znp;

    public constructor(options: Options) {
        super();
        this.options = mixin(DefaultOptions, options);
    }

    public async start(): Promise<void> {
        debug.log(`Starting with options '${JSON.stringify(this.options)}'`);
        this.database = await Database.open(this.options.databasePath);

        const spOptions = this.options.serialport;
        this.znp = Znp.getInstance();
        await this.znp.open(spOptions.path, {rtscts: spOptions.rtscts, baudRate: spOptions.baudRate});

        await StartZnp(this.znp, this.options.network, this.options.coordinatorBackupPath);
    }

    public async stop(): Promise<void> {
        await this.znp.close();
    }
}

export default Controller;