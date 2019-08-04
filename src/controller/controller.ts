import events from 'events';
// @ts-ignore
import mixin from 'mixin-deep';
import Database from './database';
import {Znp} from '../znp';
import {StartZnp} from './helpers';

interface Options {
    network: {
        panID: number;
        extenedPanID: number[];
        channelList: number[];
        networkKey: number[];
    };
    databasePath: string;
    coordinatorBackupPath: string;
    serialport: {
        baudRate: number;
        rtscts: boolean;
        path: string;
    };
};

const DefaultOptions = {
    serialport: {
        baudRate: 115200,
        rtscts: true,
    }
}

const debug = {
    error: require('debug')('controller:error'),
    log: require('debug')('controller:log'),
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

        await StartZnp(this.znp, this.options.network);
    }

    public async stop(): Promise<void> {
        await this.znp.close();
    }
}

export default Controller;