import events from 'events';
import Database from './database';
import {TsType as AdapterTsType, ZStackAdapter, Adapter, Events as AdapterEvents} from '../adapter';
import {Entity, Device} from './model';
import {ZclFrameConverter} from './helpers';
import * as Events from './events';
import {KeyValue} from './tstype';
import Debug from "debug";
import fs from 'fs';

// @ts-ignore
import mixin from 'mixin-deep';
import Group from './model/group';

interface Options {
    network?: Partial<AdapterTsType.NetworkOptions>;
    serialPort?: Partial<AdapterTsType.SerialPortOptions>;
    databasePath?: string;
    backupPath?: string;
};

interface AllOptions {
    network: AdapterTsType.NetworkOptions;
    serialPort: AdapterTsType.SerialPortOptions;
    databasePath?: string;
    backupPath?: string;
}

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
        path: undefined,
    },
    databasePath: undefined,
    backupPath: undefined,
};

const debug = {
    error: Debug('zigbee-herdsman:controller:error'),
    log: Debug('zigbee-herdsman:controller:log'),
};

const OneJanuary2000 = new Date('January 01, 2000 00:00:00').getTime();

function reviveValue(value: KeyValue): Device | Group {
    if (value.type === 'Group') {
        return Group.fromDatabaseRecord(value);
    }
    return Device.fromDatabaseRecord(value);
}

class Controller extends events.EventEmitter {
    private options: AllOptions;
    private database: Database;
    private adapter: Adapter;
    // eslint-disable-next-line
    private permitJoinTimer: any;
    // eslint-disable-next-line
    private backupTimer: any;

    public constructor(options: Options) {
        super();
        this.options = mixin(DefaultOptions, options);
        this.adapter = new ZStackAdapter(this.options.network, this.options.serialPort, this.options.backupPath);

        this.adapter.on(AdapterEvents.Events.deviceJoined, this.onDeviceJoined.bind(this));
        this.adapter.on(AdapterEvents.Events.zclData, this.onZclData.bind(this));
        this.adapter.on(AdapterEvents.Events.disconnected, this.onAdapterDisconnected.bind(this));
        this.adapter.on(AdapterEvents.Events.deviceAnnounce, this.onDeviceAnnounce.bind(this));
        this.adapter.on(AdapterEvents.Events.deviceLeave, this.onDeviceLeave.bind(this));

        // Validate options
        for (const channel of this.options.network.channelList) {
            if (channel < 11 || channel > 26) {
                throw new Error(`'${channel}' is an invalid channel, use a channel between 11 - 26.`);
            }
        }
    }

    public async start(): Promise<void> {
        debug.log(`Starting with options '${JSON.stringify(this.options)}'`);
        Device.reload();
        Group.reload();
        this.database = await Database.open(this.options.databasePath, reviveValue);
        const startResult = await this.adapter.start();
        debug.log(`Started with result '${startResult}'`);

        // Inject adapter and database in entity
        Entity.injectAdapter(this.adapter);
        Entity.injectDatabse(this.database);

        if (startResult === 'resetted') {
            debug.log('Clearing database...');
            for (const group of Group.all()) {
                group.removeFromDatabase();
            }

            for (const device of Device.all()) {
                device.removeFromDatabase();
            }
        }

        // Add coordinator to the database if it is not there yet.
        if ((Device.byType('Coordinator')) === null) {
            debug.log('No coordinator in database, querying...');
            const coordinator = await this.adapter.getCoordinator();
            Device.create(
                'Coordinator', coordinator.ieeeAddr, coordinator.networkAddress, coordinator.manufacturerID,
                undefined, undefined, undefined, coordinator.endpoints
            );
        }

        // Set backup timer to 1 day.
        await this.backup();
        this.backupTimer = setInterval(() => this.backup(), 86400000);
    }

    public async permitJoin(permit: boolean): Promise<void> {
        if (permit && !this.getPermitJoin()) {
            debug.log('Permit joining');
            await this.adapter.permitJoin(254);

            // Zigbee 3 networks automatically close after max 255 seconds, keep network open.
            this.permitJoinTimer = setInterval(async (): Promise<void> => {
                debug.log('Permit joining');
                await this.adapter.permitJoin(254);
            }, 200 * 1000);
        } else if (permit && this.getPermitJoin()) {
            debug.log('Joining already permitted');
        } else {
            debug.log('Disable joining');
            await this.adapter.permitJoin(0);

            if (this.permitJoinTimer) {
                clearInterval(this.permitJoinTimer);
                this.permitJoinTimer = null;
            }
        }
    }

    public getPermitJoin(): boolean {
        return this.permitJoinTimer != null;
    }

    public async stop(): Promise<void> {
        await this.permitJoin(false);
        clearInterval(this.backupTimer);
        await this.backup();
        await this.adapter.stop();
    }

    private async backup(): Promise<void> {
        if (this.options.backupPath && this.adapter.supportsBackup()) {
            debug.log('Creating coordinator backup');
            const backup = await this.adapter.backup();
            fs.writeFileSync(this.options.backupPath, JSON.stringify(backup, null, 2));
            debug.log(`Wrote coordinator backup to '${this.options.backupPath}'`);
        }
    }

    public async softReset(): Promise<void> {
        await this.adapter.softReset();
    }

    public async getCoordinatorVersion(): Promise<AdapterTsType.CoordinatorVersion> {
        return await this.adapter.getCoordinatorVersion();
    }

    public async getNetworkParameters(): Promise<AdapterTsType.NetworkParameters> {
        return await this.adapter.getNetworkParameters();
    }

    public getDeviceByAddress(ieeeAddr: string): Device | undefined {
        return Device.byAddress(ieeeAddr);
    }

    public getDevice(query: {ieeeAddr?: string; type?: AdapterTsType.DeviceType}): Device | undefined {
        return Device.findSingle(query);
    }

    public getDevices(query: {ieeeAddr?: string; type?: AdapterTsType.DeviceType}): Device[] {
        return Device.find(query);
    }

    public createGroup(groupID: number): Group {
        return Group.create(groupID);
    }

    public getGroupByID(groupID: number): Group | undefined {
        return Group.byID(groupID);
    }

    public getGroup(query: {groupID: number}): Group | undefined {
        return Group.findSingle(query);
    }

    public getGroups(query: {groupID?: number}): Group[] {
        return Group.find(query);
    }

    public async disableLED(): Promise<void> {
        await this.adapter.disableLED();
    }

    private async onDeviceAnnounce(payload: AdapterEvents.DeviceAnnouncePayload): Promise<void> {
        debug.log(`Device announce '${payload.ieeeAddr}'`);
        const data: Events.DeviceAnnouncePayload = {device: Device.byAddress(payload.ieeeAddr)};
        this.emit(Events.Events.deviceAnnounce, data);
    }

    private async onDeviceLeave(payload: AdapterEvents.DeviceLeavePayload): Promise<void> {
        debug.log(`Device leave '${payload.ieeeAddr}'`);

        const device = Device.byAddress(payload.ieeeAddr);
        if (device) {
            debug.log(`Removing device from database '${payload.ieeeAddr}'`);
            device.removeFromDatabase();
        }

        const data: Events.DeviceLeavePayload = {ieeeAddr: payload.ieeeAddr};
        this.emit(Events.Events.deviceLeave, data);
    }

    private async onAdapterDisconnected(): Promise<void> {
        debug.log(`Adapter disconnected'`);

        try {
            await this.adapter.stop();
        } catch (error) {
        }

        this.emit(Events.Events.adapterDisconnected);
    }

    private async onDeviceJoined(payload: AdapterEvents.DeviceJoinedPayload): Promise<void> {
        let device = Device.byAddress(payload.ieeeAddr);
        debug.log(`Device joined '${payload.ieeeAddr}'`);

        if (!device) {
            debug.log(`New device '${payload.ieeeAddr}' joined`);
            debug.log(`Creating device '${payload.ieeeAddr}'`);
            device = Device.create(
                undefined, payload.ieeeAddr, payload.networkAddress, undefined,
                undefined, undefined, undefined, []
            );

            const eventData: Events.DeviceJoinedPayload = {device};
            this.emit(Events.Events.deviceJoined, eventData);
        } else if (device.networkAddress !== payload.networkAddress) {
            debug.log(
                `Device '${payload.ieeeAddr}' is already in database with different networkAddress, ` +
                `updating networkAddress`
            );
            device.set('networkAddress', payload.networkAddress);
        }

        if (!device.interviewCompleted && !device.interviewing) {
            const payloadStart: Events.DeviceInterviewPayload = {status: 'started', device};
            debug.log(`Interview '${device.ieeeAddr}' start`);
            this.emit(Events.Events.deviceInterview, payloadStart);

            try {
                await device.interview();
                debug.log(`Succesfully interviewed '${device.ieeeAddr}'`);
                const event: Events.DeviceInterviewPayload = {status: 'successful', device};
                this.emit(Events.Events.deviceInterview, event);
            } catch (error) {
                debug.error(`Interview failed for '${device.ieeeAddr} with error '${error}'`);
                const event: Events.DeviceInterviewPayload = {status: 'failed', device};
                this.emit(Events.Events.deviceInterview, event);
            }
        } else {
            debug.log(
                `Not interviewing '${payload.ieeeAddr}', completed '${device.interviewCompleted}', ` +
                `in progress '${device.interviewing}'`
            );
        }
    }

    private async onZclData(zclData: AdapterEvents.ZclDataPayload): Promise<void> {
        debug.log(`Received ZCL data '${JSON.stringify(zclData)}'`);

        const device = Device.byNetworkAddress(zclData.networkAddress);
        if (!device) {
            debug.log(`ZCL data is from unknown device with network adress '${zclData.networkAddress}', skipping...`);
            return;
        }

        let endpoint = device.getEndpoint(zclData.endpoint);
        if (!endpoint) {
            debug.log(
                `ZCL data is from unknown endpoint '${zclData.endpoint}' from device with network adress` +
                `'${zclData.networkAddress}', creating it...`
            );
            endpoint = device.createEndpoint(zclData.endpoint);
        }

        // Parse command for event
        const frame = zclData.frame;
        const command = frame.getCommand();

        let type: Events.MessagePayloadType = undefined;
        let data: KeyValue;
        if (frame.isGlobal()) {
            if (frame.isCommand('report')) {
                type = 'attributeReport';
                data = ZclFrameConverter.attributeList(zclData.frame);
            } else {
                /* istanbul ignore else */
                if (frame.isCommand('readRsp')) {
                    type = 'readResponse';
                    data = ZclFrameConverter.attributeList(zclData.frame);
                }
            }
        } else {
            /* istanbul ignore else */
            if (frame.isSpecific()) {
                if (Events.CommandsLookup[command.name]) {
                    type = Events.CommandsLookup[command.name];
                    data = zclData.frame.Payload;
                } else {
                    debug.log(`Skipping command '${command.name}' because it is missing from the lookup`);
                }
            }
        }

        // Some device report it's modelID through a readResponse or attributeReport
        if ((type === 'readResponse' || type === 'attributeReport') && data.modelId && !device.modelID) {
            device.set('modelID', data.modelId);
        }

        if (type && data) {
            const endpoint = device.getEndpoint(zclData.endpoint);
            const linkquality = zclData.linkquality;
            const groupID = zclData.groupID;
            const cluster = frame.getCluster().name;
            const eventData: Events.MessagePayload = {
                type: type, device, endpoint, data, linkquality, groupID, cluster
            };
            this.emit(Events.Events.message, eventData);
        }

        // Send a default response if necessary.
        if (!zclData.frame.Header.frameControl.disableDefaultResponse) {
            try {
                await endpoint.defaultResponse(
                    zclData.frame.getCommand().ID, 0, zclData.frame.ClusterID,
                    zclData.frame.Header.transactionSequenceNumber,
                );
            } catch (error) {
                debug.error(`Default response to ${zclData.networkAddress} failed`);
            }
        }

        // Reponse to time reads
        if (frame.isGlobal() && frame.isCluster('genTime') && frame.isCommand('read')) {
            const time = Math.round(((new Date()).getTime() - OneJanuary2000) / 1000);
            endpoint.readResponse(frame.getCluster().ID, frame.Header.transactionSequenceNumber, {time});
        }
    }
}

export default Controller;