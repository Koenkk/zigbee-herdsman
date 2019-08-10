import events from 'events';
import Database from './database';
import {TsType as AdapterTsType, ZStackAdapter, Adapter} from '../adapter';
import {Entity, Device} from './model';
import {Events as AdapterEvents, DeviceJoinedPayload, ZclDataPayload} from '../adapter/events'
import {ZclFrameToEvent} from './helpers';
import {FrameType, Foundation, Cluster} from '../zcl';
import {Events, MessagePayload} from './events';

// @ts-ignore
import mixin from 'mixin-deep';

interface Options {
    network: AdapterTsType.NetworkOptions;
    serialPort: AdapterTsType.SerialPortOptions;
    databasePath: string;
    backupPath: string;
};

const DefaultOptions: Options = {
    network: {
        networkKeyDistribute: false,
        networkKey: [0x01, 0x03, 0x05, 0x07, 0x09, 0x0B, 0x0D, 0x0F, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0D],
        panID: 0x1a62,
        extenedPanID: [0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD],
        channelList: [11],
    },
    serialPort: {
        baudRate: 115200,
        rtscts: true,
        path: null,
    },
    databasePath: null,
    backupPath: null,
}

const debug = {
    error: require('debug')('zigbee-herdsman:controller:error'),
    log: require('debug')('zigbee-herdsman:controller:log'),
};

class Controller extends events.EventEmitter {
    private options: Options;
    private database: Database;
    private adapter: Adapter;
    // eslint-disable-next-line
    private permitJoinTimer: any;

    public constructor(options: Options) {
        super();
        this.options = mixin(DefaultOptions, options);
        this.adapter = new ZStackAdapter(options.network, options.serialPort, options.backupPath);

        this.onDeviceJoined = this.onDeviceJoined.bind(this);
        this.adapter.on(AdapterEvents.DeviceJoined, this.onDeviceJoined);
        this.onZclData = this.onZclData.bind(this);
        this.adapter.on(AdapterEvents.ZclData, this.onZclData);
    }

    public async start(): Promise<void> {
        debug.log(`Starting with options '${JSON.stringify(this.options)}'`);
        this.database = await Database.open(this.options.databasePath);
        await this.adapter.start();

        // Inject adapter and database in entity
        Entity.injectAdapter(this.adapter);
        Entity.injectDatabse(this.database);

        // Add coordinator to the database if it is not there yet.
        if ((await Device.findByType('Coordinator')).length === 0) {
            debug.log('No coordinator in database, querying...');
            const coordinator = await this.adapter.getCoordinator();
            Device.create(
                'Coordinator', coordinator.ieeeAddr, coordinator.networkAddress, coordinator.manufacturerID,
                undefined, undefined, undefined, coordinator.endpoints
            );
        }
    }

    public async permitJoin(permit: boolean): Promise<void> {
        if (permit && !this.permitJoinTimer) {
            debug.log('Permit joining')
            await this.adapter.permitJoin(254);

            // Zigbee 3 networks automatically close after max 255 seconds, keep network open.
            this.permitJoinTimer = setInterval(async (): Promise<void> => {
                debug.log('Permit joining')
                await this.adapter.permitJoin(254);
            }, 200 * 1000);
        } else if (permit && this.permitJoinTimer) {
            debug.log('Joining already permitted')
        } else {
            debug.log('Disable joining');
            this.adapter.permitJoin(0);

            if (this.permitJoinTimer) {
                clearInterval(this.permitJoinTimer);
                this.permitJoinTimer = null;
            }
        }
    }

    public getPermitJoin(): boolean {
        return this.permitJoin != null;
    }

    public async stop(): Promise<void> {
        await this.permitJoin(false);
        await this.adapter.stop();
    }

    public async softReset(): Promise<void> {
        await this.adapter.softReset();
    }

    public async getCoordinatorVersion(): Promise<AdapterTsType.CoordinatorVersion> {
        return await this.adapter.getCoordinatorVersion();
    }

    public async getDevices(): Promise<Device[]> {
        return Device.all();
    }

    public async getDevice(ieeeAddr: string): Promise<Device> {
        return Device.findByIeeeAddr(ieeeAddr);
    }

    public async disableLED(): Promise<void> {
        await this.adapter.disableLED();
    }

    private async onDeviceJoined(payload: DeviceJoinedPayload): Promise<void> {
        debug.log(`New device '${payload.ieeeAddr}' joined`);

        let device = await Device.findByIeeeAddr(payload.ieeeAddr)
        if (!device) {
            debug.log(`Creating device '${payload.ieeeAddr}'`);
            device = await Device.create(
                undefined, payload.ieeeAddr, payload.networkAddress, undefined,
                undefined, undefined, undefined, []
            );

            await device.interview();
        } else {
            debug.log(`Device '${payload.ieeeAddr}' is already in database, updating networkAddress`);
            await device.update('networkAddress', payload.networkAddress);
        }
    }


    private async onZclData(zclData: ZclDataPayload): Promise<void> {
        return;
        debug.log(`Received ZCL data '${JSON.stringify(zclData)}'`);

        const device = await Device.findByNetworkAddress(zclData.networkAddress);

        if (!device) {
            debug.log(`ZCL data is from unknown device with network adress '${zclData.networkAddress}', skipping...`)
            return;
        }

        const frame = zclData.frame;
        const event = ZclFrameToEvent(zclData.frame);
        const command = frame.getCommand();
        const cluster = frame.getCluster();
        const frameType = frame.Header.frameControl.frameType;
        const payload: MessagePayload = {data: null};

        if (frameType === FrameType.GLOBAL) {
            if (cluster.ID === Cluster.genBasic.ID) {
                if (command.ID === Foundation.report.ID || command.ID === Foundation.readRsp.ID ) {
                    if (event.data.data.hasOwnProperty('modelId')) {
                        await device.update('modelID', event.data.data.modelId);
                    }
                }
            }
        }

        this.emit(Events.message, payload);
    }
}

export default Controller;