import events from 'events';
import Database from './database';
import {TsType as AdapterTsType, Adapter, Events as AdapterEvents} from '../adapter';
import {Entity, Device} from './model';
import {ZclFrameConverter} from './helpers';
import * as Events from './events';
import {KeyValue, DeviceType} from './tstype';
import Debug from "debug";
import fs from 'fs';
import {Utils as ZclUtils, FrameControl} from '../zcl';
import Touchlink from './touchlink';

// @ts-ignore
import mixin from 'mixin-deep';
import Group from './model/group';

interface Options {
    network: AdapterTsType.NetworkOptions;
    serialPort: AdapterTsType.SerialPortOptions;
    databasePath: string;
    databaseBackupPath: string;
    backupPath: string;
    /**
     * This lambda can be used by an application to explictly reject or accept an incoming device.
     * When false is returned zigbee-herdsman will not start the interview process and immidiately
     * try to remove the device from the network.
     */
    acceptJoiningDeviceHandler: (ieeeAddr: string) => Promise<boolean>;
};

const DefaultOptions: Options = {
    network: {
        networkKeyDistribute: false,
        networkKey: [0x01, 0x03, 0x05, 0x07, 0x09, 0x0B, 0x0D, 0x0F, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0A, 0x0C, 0x0D],
        panID: 0x1a62,
        extendedPanID: [0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD, 0xDD],
        channelList: [11],
    },
    serialPort: {
        baudRate: 115200,
        rtscts: true,
        path: null,
    },
    databasePath: null,
    databaseBackupPath: null,
    backupPath: null,
    acceptJoiningDeviceHandler: null,
};

const debug = {
    error: Debug('zigbee-herdsman:controller:error'),
    log: Debug('zigbee-herdsman:controller:log'),
};

/**
 * @ignore
 */
const OneJanuary2000 = new Date('January 01, 2000 00:00:00').getTime();

/**
 * @noInheritDoc
 */
class Controller extends events.EventEmitter {
    private options: Options;
    private database: Database;
    private adapter: Adapter;
    // eslint-disable-next-line
    private permitJoinTimer: any;
    // eslint-disable-next-line
    private backupTimer: any;
    private touchlink: Touchlink;

    /**
     * Create a controller
     *
     * To auto detect the port provide `null` for `options.serialPort.path`
     */
    public constructor(options: Options) {
        super();
        this.options = mixin(DefaultOptions, options);

        // Validate options
        for (const channel of this.options.network.channelList) {
            if (channel < 11 || channel > 26) {
                throw new Error(`'${channel}' is an invalid channel, use a channel between 11 - 26.`);
            }
        }
    }

    /**
     * Start the Herdsman controller
     */
    public async start(): Promise<void> {
        this.adapter = await Adapter.create(this.options.network, this.options.serialPort, this.options.backupPath);
        debug.log(`Starting with options '${JSON.stringify(this.options)}'`);
        this.database = Database.open(this.options.databasePath);
        const startResult = await this.adapter.start();
        debug.log(`Started with result '${startResult}'`);

        // Inject adapter and database in entity
        debug.log(`Injected database: ${this.database != null}, adapter: ${this.adapter != null}`);
        Entity.injectAdapter(this.adapter);
        Entity.injectDatabase(this.database);

        // Register adapter events
        this.adapter.on(AdapterEvents.Events.deviceJoined, this.onDeviceJoined.bind(this));
        this.adapter.on(AdapterEvents.Events.zclData, (data) => this.onZclOrRawData('zcl', data));
        this.adapter.on(AdapterEvents.Events.rawData, (data) => this.onZclOrRawData('raw', data));
        this.adapter.on(AdapterEvents.Events.disconnected, this.onAdapterDisconnected.bind(this));
        this.adapter.on(AdapterEvents.Events.deviceAnnounce, this.onDeviceAnnounce.bind(this));
        this.adapter.on(AdapterEvents.Events.deviceLeave, this.onDeviceLeave.bind(this));

        if (startResult === 'reset') {
            if (this.options.databaseBackupPath && fs.existsSync(this.options.databasePath)) {
                fs.copyFileSync(this.options.databasePath, this.options.databaseBackupPath);
            }

            debug.log('Clearing database...');
            for (const group of Group.all()) {
                group.removeFromDatabase();
            }

            for (const device of Device.all()) {
                device.removeFromDatabase();
            }
        }

        // Add coordinator to the database if it is not there yet.
        if (Device.byType('Coordinator').length === 0) {
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

        this.touchlink = new Touchlink(this.adapter);
    }

    public async touchlinkFactoryReset(): Promise<boolean> {
        return this.touchlink.factoryReset();
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
        for (const device of Device.all()) {
            device.save();
        }

        for (const group of Group.all()) {
            group.save();
        }

        // Unregister adapter events
        this.adapter.removeAllListeners(AdapterEvents.Events.deviceJoined);
        this.adapter.removeAllListeners(AdapterEvents.Events.zclData);
        this.adapter.removeAllListeners(AdapterEvents.Events.rawData);
        this.adapter.removeAllListeners(AdapterEvents.Events.disconnected);
        this.adapter.removeAllListeners(AdapterEvents.Events.deviceAnnounce);
        this.adapter.removeAllListeners(AdapterEvents.Events.deviceLeave);

        await this.permitJoin(false);
        clearInterval(this.backupTimer);
        await this.backup();
        await this.adapter.stop();
    }

    private async backup(): Promise<void> {
        if (this.options.backupPath && await this.adapter.supportsBackup()) {
            debug.log('Creating coordinator backup');
            const backup = await this.adapter.backup();
            fs.writeFileSync(this.options.backupPath, JSON.stringify(backup, null, 2));
            debug.log(`Wrote coordinator backup to '${this.options.backupPath}'`);
        }
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        await this.adapter.reset(type);
    }

    public async getCoordinatorVersion(): Promise<AdapterTsType.CoordinatorVersion> {
        return this.adapter.getCoordinatorVersion();
    }

    public async getNetworkParameters(): Promise<AdapterTsType.NetworkParameters> {
        return this.adapter.getNetworkParameters();
    }

    /**
     * Get all devices
     */
    public getDevices(): Device[] {
        return Device.all();
    }

    /**
     * Get all devices with a specific type
     */
    public getDevicesByType(type: DeviceType): Device[] {
        return Device.byType(type);
    }

    /**
     * Get device by ieeeAddr
     */
    public getDeviceByIeeeAddr(ieeeAddr: string): Device {
        return Device.byIeeeAddr(ieeeAddr);
    }

    /**
     * Get group by ID
     */
    public getGroupByID(groupID: number): Group {
        return Group.byGroupID(groupID);
    }

    /**
     * Get all groups
     */
    public getGroups(): Group[] {
        return Group.all();
    }

    /**
     * Create a Group
     */
    public createGroup(groupID: number): Group {
        return Group.create(groupID);
    }

    /**
     *  Check if the adapters supports LED
     */
    public async supportsLED(): Promise<boolean> {
        return this.adapter.supportsLED();
    }

    /**
     *  Set transmit power of the adapter
     */
    public async setTransmitPower(value: number): Promise<void> {
        return this.adapter.setTransmitPower(value);
    }

    /**
     *  Enable/Disable the LED
     */
    public async setLED(enabled: boolean): Promise<void> {
        if (!(await this.supportsLED())) throw new Error(`Adapter doesn't support LED`);
        await this.adapter.setLED(enabled);
    }

    private onDeviceAnnounce(payload: AdapterEvents.DeviceAnnouncePayload): void {
        debug.log(`Device announce '${payload.ieeeAddr}'`);
        const device = Device.byIeeeAddr(payload.ieeeAddr);

        if (!device) {
            debug.log(`Device announce is from unknown device '${payload.ieeeAddr}'`);
            return;
        }

        device.updateLastSeen();

        if (device.networkAddress !== payload.networkAddress) {
            debug.log(`Device '${payload.ieeeAddr}' announced with new networkAddress '${payload.networkAddress}'`);
            device.networkAddress = payload.networkAddress;
            device.save();
        }

        const data: Events.DeviceAnnouncePayload = {device};
        this.emit(Events.Events.deviceAnnounce, data);
    }

    private onDeviceLeave(payload: AdapterEvents.DeviceLeavePayload): void {
        debug.log(`Device leave '${payload.ieeeAddr}'`);

        const device = Device.byIeeeAddr(payload.ieeeAddr);
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
        debug.log(`Device '${payload.ieeeAddr}' joined`);

        if (this.options.acceptJoiningDeviceHandler) {
            if (!(await this.options.acceptJoiningDeviceHandler(payload.ieeeAddr))) {
                debug.log(`Device '${payload.ieeeAddr}' rejected by handler, removing it`);
                await this.adapter.removeDevice(payload.networkAddress, payload.ieeeAddr);
                return;
            } else {
                debug.log(`Device '${payload.ieeeAddr}' accepted by handler`);
            }
        }

        let device = Device.byIeeeAddr(payload.ieeeAddr);
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
            device.networkAddress = payload.networkAddress;
            device.save();
        }

        device.updateLastSeen();

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

    private isZclDataPayload(
        dataPayload: AdapterEvents.ZclDataPayload | AdapterEvents.RawDataPayload, type: 'zcl' | 'raw'
    ): dataPayload is AdapterEvents.ZclDataPayload {
        return type === 'zcl';
    }

    private async onZclOrRawData(
        dataType: 'zcl' | 'raw', dataPayload: AdapterEvents.ZclDataPayload | AdapterEvents.RawDataPayload
    ): Promise<void> {
        const logDataPayload = JSON.parse(JSON.stringify(dataPayload));
        if (dataType === 'zcl') {
            delete logDataPayload.frame.Cluster;
        }
        debug.log(`Received '${dataType}' data '${JSON.stringify(logDataPayload)}'`);

        if (this.isZclDataPayload(dataPayload, 'zcl') && dataPayload.frame &&
            dataPayload.frame.Cluster.name === 'touchlink') {
            // This is handled by touchlink
            return;
        }

        const device = typeof dataPayload.address === 'string' ?
            Device.byIeeeAddr(dataPayload.address) : Device.byNetworkAddress(dataPayload.address);
        if (!device) {
            debug.log(
                `'${dataType}' data is from unknown device with address '${dataPayload.address}', ` +
                `skipping...`
            );
            return;
        }

        device.updateLastSeen();

        let endpoint = device.getEndpoint(dataPayload.endpoint);
        if (!endpoint) {
            debug.log(
                `'${dataType}' data is from unknown endpoint '${dataPayload.endpoint}' from device with ` +
                `network address '${dataPayload.address}', creating it...`
            );
            endpoint = await device.createEndpoint(dataPayload.endpoint);
        }

        // Parse command for event
        let type: Events.MessagePayloadType = undefined;
        let data: KeyValue;
        let clusterName = undefined;
        const meta: {
            zclTransactionSequenceNumber?: number;
            manufacturerCode?: number;
            frameControl?: FrameControl;
        } = {};

        if (this.isZclDataPayload(dataPayload, dataType)) {
            const frame = dataPayload.frame;
            const command = frame.getCommand();
            clusterName = frame.Cluster.name;
            meta.zclTransactionSequenceNumber = frame.Header.transactionSequenceNumber;
            meta.manufacturerCode = frame.Header.manufacturerCode;
            meta.frameControl = frame.Header.frameControl;

            if (frame.isGlobal()) {
                if (frame.isCommand('report')) {
                    type = 'attributeReport';
                    data = ZclFrameConverter.attributeKeyValue(dataPayload.frame);
                } else if (frame.isCommand('read')) {
                    type = 'read';
                    data = ZclFrameConverter.attributeList(dataPayload.frame);
                } else if (frame.isCommand('write')) {
                    type = 'write';
                    data = ZclFrameConverter.attributeKeyValue(dataPayload.frame);
                } else {
                    /* istanbul ignore else */
                    if (frame.isCommand('readRsp')) {
                        type = 'readResponse';
                        data = ZclFrameConverter.attributeKeyValue(dataPayload.frame);
                    }
                }
            } else {
                /* istanbul ignore else */
                if (frame.isSpecific()) {
                    if (Events.CommandsLookup[command.name]) {
                        type = Events.CommandsLookup[command.name];
                        data = dataPayload.frame.Payload;
                    } else {
                        debug.log(`Skipping command '${command.name}' because it is missing from the lookup`);
                    }
                }
            }

            if (type === 'readResponse' || type === 'attributeReport') {
                // Some device report, e.g. it's modelID through a readResponse or attributeReport
                for (const [key, value] of Object.entries(data)) {
                    const property =  Device.ReportablePropertiesMapping[key];
                    if (property && !device[property.key]) {
                        property.set(value, device);
                    }
                }

                endpoint.saveClusterAttributeKeyValue(clusterName, data);
            }
        } else {
            type = 'raw';
            data = dataPayload.data;
            try {
                const cluster = ZclUtils.getCluster(dataPayload.clusterID);
                clusterName = cluster.name;
            } catch (error) {
                clusterName = dataPayload.clusterID;
            }
        }

        if (type && data) {
            const endpoint = device.getEndpoint(dataPayload.endpoint);
            const linkquality = dataPayload.linkquality;
            const groupID = dataPayload.groupID;
            const eventData: Events.MessagePayload = {
                type: type, device, endpoint, data, linkquality, groupID, cluster: clusterName, meta
            };

            this.emit(Events.Events.message, eventData);
        }


        if (this.isZclDataPayload(dataPayload, dataType)) {
            const frame = dataPayload.frame;

            // Reponse to genTime reads
            if (frame.isGlobal() && frame.isCluster('genTime') && frame.isCommand('read')) {
                const time = Math.round(((new Date()).getTime() - OneJanuary2000) / 1000);
                const response: KeyValue = {};
                const values: KeyValue = {
                    timeStatus: 3, // Time-master + synchronised
                    time: time,
                    localTime: time + (new Date()).getTimezoneOffset() * 60
                };

                const cluster = ZclUtils.getCluster('genTime');
                for (const entry of frame.Payload) {
                    const name = cluster.getAttribute(entry.attrId).name;
                    if (values.hasOwnProperty(name)) {
                        response[name] = values[name];
                    } else {
                        debug.error(`'${device.ieeeAddr}' read unsupported attribute from genTime '${name}'`);
                    }
                }

                try {
                    await endpoint.readResponse(frame.Cluster.ID, frame.Header.transactionSequenceNumber, response);
                } catch (error) {
                    debug.error(`genTime response to ${device.ieeeAddr} failed`);
                }
            }

            // Send a default response if necessary.
            if (!frame.Header.frameControl.disableDefaultResponse) {
                try {
                    await endpoint.defaultResponse(
                        frame.getCommand().ID, 0, frame.Cluster.ID, frame.Header.transactionSequenceNumber,
                    );
                } catch (error) {
                    debug.error(`Default response to ${device.ieeeAddr} failed, force route discovery`);
                    await this.adapter.discoverRoute(device.networkAddress);

                    try {
                        await endpoint.defaultResponse(
                            frame.getCommand().ID, 0, frame.Cluster.ID, frame.Header.transactionSequenceNumber,
                        );
                    } catch (error) {
                        debug.error(`Default response to ${device.ieeeAddr} failed, even after route discovery`);
                    }
                }
            }
        }
    }
}

export default Controller;
