import events from 'events';
import Database from './database';
import {TsType as AdapterTsType, ZStackAdapter, Adapter, Events as AdapterEvents} from '../adapter';
import {Entity, Device} from './model';
import {ZclFrameConverter} from './helpers';
import * as Events from './events';
import {KeyValue, DeviceType} from './tstype';
import Debug from "debug";
import fs from 'fs';
import {Utils as ZclUtils} from '../zcl';

// @ts-ignore
import mixin from 'mixin-deep';
import Group from './model/group';

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
};

const debug = {
    error: Debug('zigbee-herdsman:controller:error'),
    log: Debug('zigbee-herdsman:controller:log'),
};

const OneJanuary2000 = new Date('January 01, 2000 00:00:00').getTime();

/**
 *  Herdsman Controller Class
 */
class Controller extends events.EventEmitter {
    private options: Options;
    private database: Database;
    private adapter: Adapter;
    // eslint-disable-next-line
    private permitJoinTimer: any;
    // eslint-disable-next-line
    private backupTimer: any;

    /**
     * Create a controller
     * @constructs Controller
     * @param {Object} options
     * @param {string} options.databasePath
     * @param {string} options.backupPath
     * @param {Object} options.network
     * @param {boolean} [options.network.networkKeyDistribute=false]
     * @param {number[]} [options.network.networkKey]
     * @param {number} [options.network.panID=0x1a62]
     * @param {number[]} [options.network.channelList=[11]]
     * @param {Object} options.serialPort
     * @param {number} [options.serialPort.baudRate=115200]
     * @param {boolean} [options.serialPort.rtscts=true]
     * @param {string} options.serialPort.path
     */
    public constructor(options: Options) {
        super();
        this.options = mixin(DefaultOptions, options);
        this.adapter = new ZStackAdapter(this.options.network, this.options.serialPort, this.options.backupPath);

        // Validate options
        for (const channel of this.options.network.channelList) {
            if (channel < 11 || channel > 26) {
                throw new Error(`'${channel}' is an invalid channel, use a channel between 11 - 26.`);
            }
        }
    }

    /**
     * Start the Herdsman controller
     * @returns {Promise}
     */
    public async start(): Promise<void> {
        debug.log(`Starting with options '${JSON.stringify(this.options)}'`);
        this.database = Database.open(this.options.databasePath);
        const startResult = await this.adapter.start();
        debug.log(`Started with result '${startResult}'`);

        // Inject adapter and database in entity
        debug.log(`Injected database: ${this.database != null}, adapter: ${this.adapter != null}`);
        Entity.injectAdapter(this.adapter);
        Entity.injectDatabse(this.database);

        // Register adapter events
        this.adapter.on(AdapterEvents.Events.deviceJoined, this.onDeviceJoined.bind(this));
        this.adapter.on(AdapterEvents.Events.zclData, (data) => this.onZclOrRawData('zcl', data));
        this.adapter.on(AdapterEvents.Events.rawData, (data) => this.onZclOrRawData('raw', data));
        this.adapter.on(AdapterEvents.Events.disconnected, this.onAdapterDisconnected.bind(this));
        this.adapter.on(AdapterEvents.Events.deviceAnnounce, this.onDeviceAnnounce.bind(this));
        this.adapter.on(AdapterEvents.Events.deviceLeave, this.onDeviceLeave.bind(this));

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
    }

    /**
     *
     * @param {boolean} permit
     * @returns {Promise}
     */
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

    /**
     * soft-reset the z-stack
     * @returns {Promise}
     */
    public async softReset(): Promise<void> {
        await this.adapter.softReset();
    }

    /**
     * @returns {Promise}
     * @fulfil {AdapterTsType.CoordinatorVersion}
     */
    public async getCoordinatorVersion(): Promise<AdapterTsType.CoordinatorVersion> {
        return this.adapter.getCoordinatorVersion();
    }

    /**
     * @returns {Promise}
     * @fulfil {AdapterTsType.NetworkParameters}
     */
    public async getNetworkParameters(): Promise<AdapterTsType.NetworkParameters> {
        return this.adapter.getNetworkParameters();
    }

    /**
     * Get all devices
     * @returns {Device[]}
     */
    public getDevices(): Device[] {
        return Device.all();
    }

    /**
     * Get all devices with a specific type
     * @returns {Device[]}
     */
    public getDevicesByType(type: DeviceType): Device[] {
        return Device.byType(type);
    }

    /**
     * Get device by ieeeAddr
     * @param {string} ieeeAddr
     * @returns {Device}
     */
    public getDeviceByIeeeAddr(ieeeAddr: string): Device {
        return Device.byIeeeAddr(ieeeAddr);
    }

    /**
     * Get group by ID
     * @param {number} groupID
     * @returns {Group}
     */
    public getGroupByID(groupID: number): Group {
        return Group.byGroupID(groupID);
    }

    /**
     * Get all groups
     * @returns {Group[]}
     */
    public getGroups(): Group[] {
        return Group.all();
    }

    /**
     * Create a Group
     * @param {number} groupID
     * @returns {Group}
     */
    public createGroup(groupID: number): Group {
        return Group.create(groupID);
    }

    /**
     *  Disable the LED
     *  @returns {Promise}
     */
    public async disableLED(): Promise<void> {
        await this.adapter.disableLED();
    }

    private onDeviceAnnounce(payload: AdapterEvents.DeviceAnnouncePayload): void {
        debug.log(`Device announce '${payload.ieeeAddr}'`);
        const device = Device.byIeeeAddr(payload.ieeeAddr);
        device.updateLastSeen();
        const data: Events.DeviceAnnouncePayload = {device};
        /**
         * @event Controller#deviceAnnounce
         * @type Object
         * @property {Device} device
         */
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
        /**
         * @event Controller#deviceLeave
         *
         */
        this.emit(Events.Events.deviceLeave, data);
    }

    private async onAdapterDisconnected(): Promise<void> {
        debug.log(`Adapter disconnected'`);

        try {
            await this.adapter.stop();
        } catch (error) {
        }

        /**
         * @event Controller#adapterDisconnected
         */
        this.emit(Events.Events.adapterDisconnected);
    }

    private async onDeviceJoined(payload: AdapterEvents.DeviceJoinedPayload): Promise<void> {
        let device = Device.byIeeeAddr(payload.ieeeAddr);
        debug.log(`Device joined '${payload.ieeeAddr}'`);

        if (!device) {
            debug.log(`New device '${payload.ieeeAddr}' joined`);
            debug.log(`Creating device '${payload.ieeeAddr}'`);
            device = Device.create(
                undefined, payload.ieeeAddr, payload.networkAddress, undefined,
                undefined, undefined, undefined, []
            );

            const eventData: Events.DeviceJoinedPayload = {device};
            /**
             * @event Controller#deviceJoined
             *
             */
            this.emit(Events.Events.deviceJoined, eventData);
        } else if (device.get('networkAddress') !== payload.networkAddress) {
            debug.log(
                `Device '${payload.ieeeAddr}' is already in database with different networkAddress, ` +
                `updating networkAddress`
            );
            device.set('networkAddress', payload.networkAddress);
        }

        device.updateLastSeen();

        if (!device.get('interviewCompleted') && !device.get('interviewing')) {
            const payloadStart: Events.DeviceInterviewPayload = {status: 'started', device};
            debug.log(`Interview '${device.get('ieeeAddr')}' start`);
            /**
             * @event Controller#deviceInterview
             */
            this.emit(Events.Events.deviceInterview, payloadStart);

            try {
                await device.interview();
                debug.log(`Succesfully interviewed '${device.get('ieeeAddr')}'`);
                const event: Events.DeviceInterviewPayload = {status: 'successful', device};
                this.emit(Events.Events.deviceInterview, event);
            } catch (error) {
                debug.error(`Interview failed for '${device.get('ieeeAddr')} with error '${error}'`);
                const event: Events.DeviceInterviewPayload = {status: 'failed', device};
                this.emit(Events.Events.deviceInterview, event);
            }
        } else {
            debug.log(
                `Not interviewing '${payload.ieeeAddr}', completed '${device.get('interviewCompleted')}', ` +
                `in progress '${device.get('interviewing')}'`
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
        debug.log(`Received '${dataType}' data '${JSON.stringify(dataPayload)}'`);

        const device = Device.byNetworkAddress(dataPayload.networkAddress);
        if (!device) {
            debug.log(
                `'${dataType}' data is from unknown device with network adress '${dataPayload.networkAddress}', ` +
                `skipping...`
            );
            return;
        }

        device.updateLastSeen();

        let endpoint = device.getEndpoint(dataPayload.endpoint);
        if (!endpoint) {
            debug.log(
                `'${dataType}' data is from unknown endpoint '${dataPayload.endpoint}' from device with ` +
                `network adress '${dataPayload.networkAddress}', creating it...`
            );
            endpoint = await device.createEndpoint(dataPayload.endpoint);
        }

        // Parse command for event
        let type: Events.MessagePayloadType = undefined;
        let data: KeyValue;
        let cluster = undefined;

        if (this.isZclDataPayload(dataPayload, dataType)) {
            const frame = dataPayload.frame;
            const command = frame.getCommand();
            cluster = frame.Cluster.name;

            if (frame.isGlobal()) {
                if (frame.isCommand('report')) {
                    type = 'attributeReport';
                    data = ZclFrameConverter.attributeList(dataPayload.frame);
                } else {
                    /* istanbul ignore else */
                    if (frame.isCommand('readRsp')) {
                        type = 'readResponse';
                        data = ZclFrameConverter.attributeList(dataPayload.frame);
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
                    const setKey = Device.ReportablePropertiesMapping[key];
                    if (setKey && !device.get(setKey)) {
                        await device.set(setKey, value);
                    }
                }

                endpoint.saveClusterAttributeList(cluster, data);
            }
        } else {
            type = 'raw';
            data = dataPayload.data;
            cluster = ZclUtils.getCluster(dataPayload.clusterID).name;
        }

        if (type && data) {
            const endpoint = device.getEndpoint(dataPayload.endpoint);
            const linkquality = dataPayload.linkquality;
            const groupID = dataPayload.groupID;
            const eventData: Events.MessagePayload = {
                type: type, device, endpoint, data, linkquality, groupID, cluster
            };

            /**
             * @event Controller#message
             * @type {Object}
             * @property {string} type - 'attributeReport', 'readResponse', 'command*', 'raw'
             * @property {Device} device
             * @property {Endpoint} endpoint
             * @property {Object} data
             * @property {number} linkquality
             * @property {number} groupID
             * @property {string} cluster
             */
            this.emit(Events.Events.message, eventData);
        }


        if (this.isZclDataPayload(dataPayload, dataType)) {
            const frame = dataPayload.frame;

            // Send a default response if necessary.
            if (!frame.Header.frameControl.disableDefaultResponse) {
                try {
                    await endpoint.defaultResponse(
                        frame.getCommand().ID, 0, frame.Cluster.ID, frame.Header.transactionSequenceNumber,
                    );
                } catch (error) {
                    debug.error(`Default response to ${endpoint.get('deviceIeeeAddress')} failed`);
                }
            }

            // Reponse to time reads
            if (frame.isGlobal() && frame.isCluster('genTime') && frame.isCommand('read')) {
                const time = Math.round(((new Date()).getTime() - OneJanuary2000) / 1000);
                try {
                    await endpoint.readResponse(frame.Cluster.ID, frame.Header.transactionSequenceNumber, {time});
                } catch (error) {
                    debug.error(`genTime response to ${endpoint.get('deviceIeeeAddress')} failed`);
                }
            }
        }
    }
}

export default Controller;
