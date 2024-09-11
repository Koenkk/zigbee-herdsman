import assert from 'assert';
import events from 'events';
import fs from 'fs';

import mixinDeep from 'mixin-deep';

import {Adapter, Events as AdapterEvents, TsType as AdapterTsType} from '../adapter';
import {BackupUtils} from '../utils';
import {logger} from '../utils/logger';
import {isNumberArrayOfLength} from '../utils/utils';
import * as Zcl from '../zspec/zcl';
import {FrameControl} from '../zspec/zcl/definition/tstype';
import Database from './database';
import * as Events from './events';
import GreenPower from './greenPower';
import {ZclFrameConverter} from './helpers';
import {Device, Entity} from './model';
import Group from './model/group';
import Touchlink from './touchlink';
import {DeviceType, GreenPowerDeviceJoinedPayload, KeyValue} from './tstype';

const NS = 'zh:controller';

interface Options {
    network: AdapterTsType.NetworkOptions;
    serialPort: AdapterTsType.SerialPortOptions;
    databasePath: string;
    databaseBackupPath: string;
    backupPath: string;
    adapter: AdapterTsType.AdapterOptions;
    /**
     * This lambda can be used by an application to explictly reject or accept an incoming device.
     * When false is returned zigbee-herdsman will not start the interview process and immidiately
     * try to remove the device from the network.
     */
    acceptJoiningDeviceHandler: (ieeeAddr: string) => Promise<boolean>;
}

async function catcho(func: () => Promise<void>, errorMessage: string): Promise<void> {
    try {
        await func();
    } catch (error) {
        logger.error(`${errorMessage}: ${error}`, NS);
    }
}

const DefaultOptions: Pick<Options, 'network' | 'serialPort' | 'adapter'> = {
    network: {
        networkKeyDistribute: false,
        networkKey: [0x01, 0x03, 0x05, 0x07, 0x09, 0x0b, 0x0d, 0x0f, 0x00, 0x02, 0x04, 0x06, 0x08, 0x0a, 0x0c, 0x0d],
        panID: 0x1a62,
        extendedPanID: [0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd, 0xdd],
        channelList: [11],
    },
    serialPort: {},
    adapter: {disableLED: false},
};

export interface ControllerEventMap {
    message: [data: Events.MessagePayload];
    adapterDisconnected: [];
    deviceJoined: [data: Events.DeviceJoinedPayload];
    deviceInterview: [data: Events.DeviceInterviewPayload];
    deviceAnnounce: [data: Events.DeviceAnnouncePayload];
    deviceNetworkAddressChanged: [data: Events.DeviceNetworkAddressChangedPayload];
    deviceLeave: [data: Events.DeviceLeavePayload];
    permitJoinChanged: [data: Events.PermitJoinChangedPayload];
    lastSeenChanged: [data: Events.LastSeenChangedPayload];
}

/**
 * @noInheritDoc
 */
class Controller extends events.EventEmitter<ControllerEventMap> {
    private options: Options;
    // @ts-expect-error assigned and validated in start()
    private database: Database;
    // @ts-expect-error assigned and validated in start()
    private adapter: Adapter;
    // @ts-expect-error assigned and validated in start()
    private greenPower: GreenPower;
    // @ts-expect-error assigned and validated in start()
    private touchlink: Touchlink;

    private permitJoinNetworkClosedTimer: NodeJS.Timeout | undefined;
    private permitJoinTimeoutTimer: NodeJS.Timeout | undefined;
    private permitJoinTimeout: number | undefined;
    private backupTimer: NodeJS.Timeout | undefined;
    private databaseSaveTimer: NodeJS.Timeout | undefined;
    private stopping: boolean;
    private adapterDisconnected: boolean;
    private networkParametersCached: AdapterTsType.NetworkParameters | undefined;

    /**
     * Create a controller
     *
     * To auto detect the port provide `null` for `options.serialPort.path`
     */
    public constructor(options: Options) {
        super();
        this.stopping = false;
        this.adapterDisconnected = true; // set false after adapter.start() is successfully called
        this.options = mixinDeep(JSON.parse(JSON.stringify(DefaultOptions)), options);

        // Validate options
        for (const channel of this.options.network.channelList) {
            if (channel < 11 || channel > 26) {
                throw new Error(`'${channel}' is an invalid channel, use a channel between 11 - 26.`);
            }
        }

        if (!isNumberArrayOfLength(this.options.network.networkKey, 16)) {
            throw new Error(`Network key must be a 16 digits long array, got ${this.options.network.networkKey}.`);
        }

        if (!isNumberArrayOfLength(this.options.network.extendedPanID, 8)) {
            throw new Error(`ExtendedPanID must be an 8 digits long array, got ${this.options.network.extendedPanID}.`);
        }

        if (this.options.network.panID < 1 || this.options.network.panID >= 0xffff) {
            throw new Error(`PanID must have a value of 0x0001 (1) - 0xFFFE (65534), got ${this.options.network.panID}.`);
        }
    }

    /**
     * Start the Herdsman controller
     */
    public async start(): Promise<AdapterTsType.StartResult> {
        // Database (create end inject)
        this.database = Database.open(this.options.databasePath);
        Entity.injectDatabase(this.database);

        // Adapter (create and inject)
        this.adapter = await Adapter.create(this.options.network, this.options.serialPort, this.options.backupPath, this.options.adapter);

        const stringifiedOptions = JSON.stringify(this.options).replaceAll(JSON.stringify(this.options.network.networkKey), '"HIDDEN"');
        logger.debug(`Starting with options '${stringifiedOptions}'`, NS);
        const startResult = await this.adapter.start();
        logger.debug(`Started with result '${startResult}'`, NS);
        this.adapterDisconnected = false;

        // Check if we have to change the channel, only do this when adapter `resumed` because:
        // - `getNetworkParameters` might be return wrong info because it needs to propogate after backup restore
        // - If result is not `resumed` (`reset` or `restored`), the adapter should comission with the channel from `this.options.network`
        if (startResult === 'resumed') {
            const netParams = await this.getNetworkParameters();
            const configuredChannel = this.options.network.channelList[0];
            const adapterChannel = netParams.channel;

            if (configuredChannel != adapterChannel) {
                logger.info(`Configured channel '${configuredChannel}' does not match adapter channel '${adapterChannel}', changing channel`, NS);
                await this.changeChannel(adapterChannel, configuredChannel);
            }
        }

        Entity.injectAdapter(this.adapter);

        // log injection
        logger.debug(`Injected database: ${this.database != undefined}, adapter: ${this.adapter != undefined}`, NS);

        this.greenPower = new GreenPower(this.adapter);
        this.greenPower.on('deviceJoined', this.onDeviceJoinedGreenPower.bind(this));

        // Register adapter events
        this.adapter.on('deviceJoined', this.onDeviceJoined.bind(this));
        this.adapter.on('zclPayload', this.onZclPayload.bind(this));
        this.adapter.on('disconnected', this.onAdapterDisconnected.bind(this));
        this.adapter.on('deviceAnnounce', this.onDeviceAnnounce.bind(this));
        this.adapter.on('deviceLeave', this.onDeviceLeave.bind(this));
        this.adapter.on('networkAddress', this.onNetworkAddress.bind(this));

        if (startResult === 'reset') {
            if (this.options.databaseBackupPath && fs.existsSync(this.options.databasePath)) {
                fs.copyFileSync(this.options.databasePath, this.options.databaseBackupPath);
            }

            logger.debug('Clearing database...', NS);
            for (const group of Group.allIterator()) {
                group.removeFromDatabase();
            }

            for (const device of Device.allIterator()) {
                device.removeFromDatabase();
            }
        }

        if (startResult === 'reset' || (this.options.backupPath && !fs.existsSync(this.options.backupPath))) {
            await this.backup();
        }

        // Add coordinator to the database if it is not there yet.
        const coordinator = await this.adapter.getCoordinator();

        if (Device.byType('Coordinator').length === 0) {
            logger.debug('No coordinator in database, querying...', NS);
            Device.create(
                'Coordinator',
                coordinator.ieeeAddr,
                coordinator.networkAddress,
                coordinator.manufacturerID,
                undefined,
                undefined,
                undefined,
                true,
                coordinator.endpoints,
            );
        }

        // Update coordinator ieeeAddr if changed, can happen due to e.g. reflashing
        const databaseCoordinator = Device.byType('Coordinator')[0];
        if (databaseCoordinator.ieeeAddr !== coordinator.ieeeAddr) {
            logger.info(`Coordinator address changed, updating to '${coordinator.ieeeAddr}'`, NS);
            databaseCoordinator.changeIeeeAddress(coordinator.ieeeAddr);
        }

        // Set backup timer to 1 day.
        this.backupTimer = setInterval(() => this.backup(), 86400000);

        // Set database save timer to 1 hour.
        this.databaseSaveTimer = setInterval(() => this.databaseSave(), 3600000);

        this.touchlink = new Touchlink(this.adapter);

        return startResult;
    }

    public async touchlinkIdentify(ieeeAddr: string, channel: number): Promise<void> {
        await this.touchlink.identify(ieeeAddr, channel);
    }

    public async touchlinkScan(): Promise<{ieeeAddr: string; channel: number}[]> {
        return this.touchlink.scan();
    }

    public async touchlinkFactoryReset(ieeeAddr: string, channel: number): Promise<boolean> {
        return this.touchlink.factoryReset(ieeeAddr, channel);
    }

    public async touchlinkFactoryResetFirst(): Promise<boolean> {
        return this.touchlink.factoryResetFirst();
    }

    public async addInstallCode(installCode: string): Promise<void> {
        const aqaraMatch = installCode.match(/^G\$M:.+\$A:(.+)\$I:(.+)$/);
        const pipeMatch = installCode.match(/^(.+)\|(.+)$/);
        let ieeeAddr, key;

        if (aqaraMatch) {
            ieeeAddr = aqaraMatch[1];
            key = aqaraMatch[2];
        } else if (pipeMatch) {
            ieeeAddr = pipeMatch[1];
            key = pipeMatch[2];
        } else {
            assert(
                installCode.length === 95 || installCode.length === 91,
                `Unsupported install code, got ${installCode.length} chars, expected 95 or 91`,
            );
            const keyStart = installCode.length - (installCode.length === 95 ? 36 : 32);
            ieeeAddr = installCode.substring(keyStart - 19, keyStart - 3);
            key = installCode.substring(keyStart, installCode.length);
        }

        ieeeAddr = `0x${ieeeAddr}`;
        // match valid else asserted above
        key = Buffer.from(key.match(/.{1,2}/g)!.map((d) => parseInt(d, 16)));

        await this.adapter.addInstallCode(ieeeAddr, key);
    }

    public async permitJoin(permit: boolean, device?: Device, time?: number): Promise<void> {
        await this.permitJoinInternal(permit, 'manual', device, time);
    }

    public async permitJoinInternal(permit: boolean, reason: 'manual' | 'timer_expired', device?: Device, time?: number): Promise<void> {
        clearInterval(this.permitJoinNetworkClosedTimer);
        clearInterval(this.permitJoinTimeoutTimer);
        this.permitJoinNetworkClosedTimer = undefined;
        this.permitJoinTimeoutTimer = undefined;
        this.permitJoinTimeout = undefined;

        if (permit) {
            await this.adapter.permitJoin(254, device?.networkAddress);
            await this.greenPower.permitJoin(254, device?.networkAddress);

            // Zigbee 3 networks automatically close after max 255 seconds, keep network open.
            this.permitJoinNetworkClosedTimer = setInterval(async (): Promise<void> => {
                await catcho(async () => {
                    await this.adapter.permitJoin(254, device?.networkAddress);
                    await this.greenPower.permitJoin(254, device?.networkAddress);
                }, 'Failed to keep permit join alive');
            }, 200 * 1000);

            if (typeof time === 'number') {
                this.permitJoinTimeout = time;
                this.permitJoinTimeoutTimer = setInterval(async (): Promise<void> => {
                    // assumed valid number while in interval
                    this.permitJoinTimeout!--;

                    if (this.permitJoinTimeout! <= 0) {
                        await this.permitJoinInternal(false, 'timer_expired');
                    } else {
                        this.emit('permitJoinChanged', {permitted: true, timeout: this.permitJoinTimeout, reason});
                    }
                }, 1000);
            }

            this.emit('permitJoinChanged', {permitted: true, reason, timeout: this.permitJoinTimeout});
        } else {
            logger.debug('Disable joining', NS);
            await this.greenPower.permitJoin(0);
            await this.adapter.permitJoin(0);

            this.emit('permitJoinChanged', {permitted: false, reason, timeout: this.permitJoinTimeout});
        }
    }

    public getPermitJoin(): boolean {
        return this.permitJoinNetworkClosedTimer != undefined;
    }

    public getPermitJoinTimeout(): number | undefined {
        return this.permitJoinTimeout;
    }

    public isStopping(): boolean {
        return this.stopping;
    }

    public isAdapterDisconnected(): boolean {
        return this.adapterDisconnected;
    }

    public async stop(): Promise<void> {
        this.stopping = true;

        // Unregister adapter events
        this.adapter.removeAllListeners();

        clearInterval(this.backupTimer);
        clearInterval(this.databaseSaveTimer);

        if (this.adapterDisconnected) {
            this.databaseSave();
        } else {
            await catcho(() => this.permitJoinInternal(false, 'manual'), 'Failed to disable join on stop');
            await this.backup(); // always calls databaseSave()
            await this.adapter.stop();

            this.adapterDisconnected = true;
        }

        Device.resetCache();
        Group.resetCache();
    }

    private databaseSave(): void {
        for (const device of Device.allIterator()) {
            device.save(false);
        }

        for (const group of Group.allIterator()) {
            group.save(false);
        }

        this.database.write();
    }

    public async backup(): Promise<void> {
        this.databaseSave();
        if (this.options.backupPath && (await this.adapter.supportsBackup())) {
            logger.debug('Creating coordinator backup', NS);
            const backup = await this.adapter.backup(this.getDeviceIeeeAddresses());
            const unifiedBackup = await BackupUtils.toUnifiedBackup(backup);
            const tmpBackupPath = this.options.backupPath + '.tmp';
            fs.writeFileSync(tmpBackupPath, JSON.stringify(unifiedBackup, null, 2));
            fs.renameSync(tmpBackupPath, this.options.backupPath);
            logger.info(`Wrote coordinator backup to '${this.options.backupPath}'`, NS);
        }
    }

    public async coordinatorCheck(): Promise<{missingRouters: Device[]}> {
        if (await this.adapter.supportsBackup()) {
            const backup = await this.adapter.backup(this.getDeviceIeeeAddresses());
            const devicesInBackup = backup.devices.map((d) => `0x${d.ieeeAddress.toString('hex')}`);
            const missingRouters = [];

            for (const device of this.getDevicesIterator((d) => d.type === 'Router' && !devicesInBackup.includes(d.ieeeAddr))) {
                missingRouters.push(device);
            }

            return {missingRouters};
        } else {
            throw new Error("Coordinator does not coordinator check because it doesn't support backups");
        }
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        await this.adapter.reset(type);
    }

    public async getCoordinatorVersion(): Promise<AdapterTsType.CoordinatorVersion> {
        return this.adapter.getCoordinatorVersion();
    }

    public async getNetworkParameters(): Promise<AdapterTsType.NetworkParameters> {
        // Cache network parameters as they don't change anymore after start.
        if (!this.networkParametersCached) {
            this.networkParametersCached = await this.adapter.getNetworkParameters();
        }

        return this.networkParametersCached;
    }

    /**
     * Get all devices
     * @deprecated use getDevicesIterator()
     */
    public getDevices(): Device[] {
        return Device.all();
    }

    /**
     * Get iterator for all devices
     */
    public getDevicesIterator(predicate?: (value: Device) => boolean): Generator<Device> {
        return Device.allIterator(predicate);
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
    public getDeviceByIeeeAddr(ieeeAddr: string): Device | undefined {
        return Device.byIeeeAddr(ieeeAddr);
    }

    /**
     * Get device by networkAddress
     */
    public getDeviceByNetworkAddress(networkAddress: number): Device | undefined {
        return Device.byNetworkAddress(networkAddress);
    }

    /**
     * Get IEEE address for all devices
     */
    public getDeviceIeeeAddresses(): string[] {
        const deviceIeeeAddresses = [];

        for (const device of Device.allIterator()) {
            deviceIeeeAddresses.push(device.ieeeAddr);
        }

        return deviceIeeeAddresses;
    }

    /**
     * Get group by ID
     */
    public getGroupByID(groupID: number): Group | undefined {
        return Group.byGroupID(groupID);
    }

    /**
     * Get all groups
     * @deprecated use getGroupsIterator()
     */
    public getGroups(): Group[] {
        return Group.all();
    }

    /**
     * Get iterator for all groups
     */
    public getGroupsIterator(predicate?: (value: Group) => boolean): Generator<Group> {
        return Group.allIterator(predicate);
    }

    /**
     * Create a Group
     */
    public createGroup(groupID: number): Group {
        return Group.create(groupID);
    }

    /**
     * Broadcast a network-wide channel change.
     */
    private async changeChannel(oldChannel: number, newChannel: number): Promise<void> {
        logger.warning(`Changing channel from '${oldChannel}' to '${newChannel}'`, NS);
        await this.adapter.changeChannel(newChannel);
        logger.info(`Channel changed to '${newChannel}'`, NS);

        this.networkParametersCached = undefined; // invalidate cache
    }

    /**
     *  Set transmit power of the adapter
     */
    public async setTransmitPower(value: number): Promise<void> {
        return this.adapter.setTransmitPower(value);
    }

    private onNetworkAddress(payload: AdapterEvents.NetworkAddressPayload): void {
        logger.debug(`Network address '${payload.ieeeAddr}'`, NS);
        const device = Device.byIeeeAddr(payload.ieeeAddr);

        if (!device) {
            logger.debug(`Network address is from unknown device '${payload.ieeeAddr}'`, NS);
            return;
        }

        device.updateLastSeen();
        this.selfAndDeviceEmit(device, 'lastSeenChanged', {device, reason: 'networkAddress'});

        if (device.networkAddress !== payload.networkAddress) {
            logger.debug(`Device '${payload.ieeeAddr}' got new networkAddress '${payload.networkAddress}'`, NS);
            device.networkAddress = payload.networkAddress;
            device.save();

            this.selfAndDeviceEmit(device, 'deviceNetworkAddressChanged', {device});
        }
    }

    private onDeviceAnnounce(payload: AdapterEvents.DeviceAnnouncePayload): void {
        logger.debug(`Device announce '${payload.ieeeAddr}'`, NS);
        const device = Device.byIeeeAddr(payload.ieeeAddr);

        if (!device) {
            logger.debug(`Device announce is from unknown device '${payload.ieeeAddr}'`, NS);
            return;
        }

        device.updateLastSeen();
        this.selfAndDeviceEmit(device, 'lastSeenChanged', {device, reason: 'deviceAnnounce'});
        device.implicitCheckin();

        if (device.networkAddress !== payload.networkAddress) {
            logger.debug(`Device '${payload.ieeeAddr}' announced with new networkAddress '${payload.networkAddress}'`, NS);
            device.networkAddress = payload.networkAddress;
            device.save();
        }

        this.selfAndDeviceEmit(device, 'deviceAnnounce', {device});
    }

    private onDeviceLeave(payload: AdapterEvents.DeviceLeavePayload): void {
        logger.debug(`Device leave '${payload.ieeeAddr}'`, NS);

        // XXX: seems type is not properly detected?
        const device = payload.ieeeAddr ? Device.byIeeeAddr(payload.ieeeAddr) : Device.byNetworkAddress(payload.networkAddress!);

        if (!device) {
            logger.debug(`Device leave is from unknown or already deleted device '${payload.ieeeAddr ?? payload.networkAddress}'`, NS);
            return;
        }

        logger.debug(`Removing device from database '${device.ieeeAddr}'`, NS);
        device.removeFromDatabase();

        this.selfAndDeviceEmit(device, 'deviceLeave', {ieeeAddr: device.ieeeAddr});
    }

    private async onAdapterDisconnected(): Promise<void> {
        logger.debug(`Adapter disconnected`, NS);

        this.adapterDisconnected = true;

        await catcho(() => this.adapter.stop(), 'Failed to stop adapter on disconnect');

        this.emit('adapterDisconnected');
    }

    private async onDeviceJoinedGreenPower(payload: GreenPowerDeviceJoinedPayload): Promise<void> {
        logger.debug(() => `Green power device '${JSON.stringify(payload)}' joined`, NS);

        // Green power devices don't have an ieeeAddr, the sourceID is unique and static so use this.
        let ieeeAddr = payload.sourceID.toString(16);
        ieeeAddr = `0x${'0'.repeat(16 - ieeeAddr.length)}${ieeeAddr}`;

        // Green power devices dont' have a modelID, create a modelID based on the deviceID (=type)
        const modelID = `GreenPower_${payload.deviceID}`;

        let device = Device.byIeeeAddr(ieeeAddr, true);
        if (!device) {
            logger.debug(`New green power device '${ieeeAddr}' joined`, NS);
            logger.debug(`Creating device '${ieeeAddr}'`, NS);
            device = Device.create('GreenPower', ieeeAddr, payload.networkAddress, undefined, undefined, undefined, modelID, true, []);
            device.save();

            this.selfAndDeviceEmit(device, 'deviceJoined', {device});
            this.selfAndDeviceEmit(device, 'deviceInterview', {status: 'successful', device});
        } else if (device.isDeleted) {
            logger.debug(`Deleted green power device '${ieeeAddr}' joined, undeleting`, NS);

            device.undelete(true);

            this.selfAndDeviceEmit(device, 'deviceJoined', {device});
            this.selfAndDeviceEmit(device, 'deviceInterview', {status: 'successful', device});
        }
    }

    private selfAndDeviceEmit<K extends keyof ControllerEventMap>(
        device: Device,
        event: K,
        ...args: K extends keyof ControllerEventMap ? ControllerEventMap[K] : never
    ): void {
        device.emit(event, ...args);
        this.emit(event, ...args);
    }

    private async onDeviceJoined(payload: AdapterEvents.DeviceJoinedPayload): Promise<void> {
        logger.debug(`Device '${payload.ieeeAddr}' joined`, NS);

        if (this.options.acceptJoiningDeviceHandler) {
            if (!(await this.options.acceptJoiningDeviceHandler(payload.ieeeAddr))) {
                logger.debug(`Device '${payload.ieeeAddr}' rejected by handler, removing it`, NS);
                await catcho(() => this.adapter.removeDevice(payload.networkAddress, payload.ieeeAddr), 'Failed to remove rejected device');
                return;
            } else {
                logger.debug(`Device '${payload.ieeeAddr}' accepted by handler`, NS);
            }
        }

        let device = Device.byIeeeAddr(payload.ieeeAddr, true);
        if (!device) {
            logger.debug(`New device '${payload.ieeeAddr}' joined`, NS);
            logger.debug(`Creating device '${payload.ieeeAddr}'`, NS);
            device = Device.create('Unknown', payload.ieeeAddr, payload.networkAddress, undefined, undefined, undefined, undefined, false, []);
            this.selfAndDeviceEmit(device, 'deviceJoined', {device});
        } else if (device.isDeleted) {
            logger.debug(`Deleted device '${payload.ieeeAddr}' joined, undeleting`, NS);
            device.undelete();
            this.selfAndDeviceEmit(device, 'deviceJoined', {device});
        }

        if (device.networkAddress !== payload.networkAddress) {
            logger.debug(`Device '${payload.ieeeAddr}' is already in database with different network address, updating network address`, NS);
            device.networkAddress = payload.networkAddress;
            device.save();
        }

        device.updateLastSeen();
        this.selfAndDeviceEmit(device, 'lastSeenChanged', {device, reason: 'deviceJoined'});
        device.implicitCheckin();

        if (!device.interviewCompleted && !device.interviewing) {
            logger.info(`Interview for '${device.ieeeAddr}' started`, NS);
            this.selfAndDeviceEmit(device, 'deviceInterview', {status: 'started', device});

            try {
                await device.interview();
                logger.info(`Succesfully interviewed '${device.ieeeAddr}'`, NS);
                this.selfAndDeviceEmit(device, 'deviceInterview', {status: 'successful', device});
            } catch (error) {
                logger.error(`Interview failed for '${device.ieeeAddr} with error '${error}'`, NS);
                this.selfAndDeviceEmit(device, 'deviceInterview', {status: 'failed', device});
            }
        } else {
            logger.debug(
                `Not interviewing '${payload.ieeeAddr}', completed '${device.interviewCompleted}', in progress '${device.interviewing}'`,
                NS,
            );
        }
    }

    private async onZclPayload(payload: AdapterEvents.ZclPayload): Promise<void> {
        let frame: Zcl.Frame | undefined;
        let device: Device | undefined;

        if (payload.clusterID === Zcl.Clusters.touchlink.ID) {
            // This is handled by touchlink
            return;
        } else if (payload.clusterID === Zcl.Clusters.greenPower.ID) {
            try {
                // Custom clusters are not supported for Green Power since we need to parse the frame to get the device.
                frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            } catch (error) {
                logger.debug(`Failed to parse frame green power frame, ignoring it: ${error}`, NS);
                return;
            }

            await this.greenPower.onZclGreenPowerData(payload, frame);

            // lookup encapsulated gpDevice for further processing
            device = Device.byNetworkAddress(frame.payload.srcID & 0xffff);
        } else {
            /**
             * Handling of re-transmitted Xiaomi messages.
             * https://github.com/Koenkk/zigbee2mqtt/issues/1238
             * https://github.com/Koenkk/zigbee2mqtt/issues/3592
             *
             * Some Xiaomi router devices re-transmit messages from Xiaomi end devices.
             * The network address of these message is set to the one of the Xiaomi router.
             * Therefore it looks like if the message came from the Xiaomi router, while in
             * fact it came from the end device.
             * Handling these message would result in false state updates.
             * The group ID attribute of these message defines the network address of the end device.
             */
            device = Device.find(payload.address);

            if (device?.manufacturerName === 'LUMI' && device?.type == 'Router' && payload.groupID) {
                logger.debug(`Handling re-transmitted Xiaomi message ${device.networkAddress} -> ${payload.groupID}`, NS);
                device = Device.byNetworkAddress(payload.groupID);
            }

            try {
                frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, device ? device.customClusters : {});
            } catch (error) {
                logger.debug(`Failed to parse frame: ${error}`, NS);
            }
        }

        if (!device) {
            logger.debug(`Data is from unknown device with address '${payload.address}', skipping...`, NS);
            return;
        }

        logger.debug(
            `Received payload: clusterID=${payload.clusterID}, address=${payload.address}, groupID=${payload.groupID}, ` +
                `endpoint=${payload.endpoint}, destinationEndpoint=${payload.destinationEndpoint}, wasBroadcast=${payload.wasBroadcast}, ` +
                `linkQuality=${payload.linkquality}, frame=${frame?.toString()}`,
            NS,
        );

        device.updateLastSeen();

        //no implicit checkin for genPollCtrl data because it might interfere with the explicit checkin
        if (!frame?.isCluster('genPollCtrl')) {
            device.implicitCheckin();
        }

        device.linkquality = payload.linkquality;
        let endpoint = device.getEndpoint(payload.endpoint);

        if (!endpoint) {
            logger.debug(
                `Data is from unknown endpoint '${payload.endpoint}' from device with network address '${payload.address}', creating it...`,
                NS,
            );

            endpoint = device.createEndpoint(payload.endpoint);
        }

        // Parse command for event
        let type: Events.MessagePayload['type'] | undefined;
        let data: Events.MessagePayload['data'] = {};
        let clusterName: Events.MessagePayload['cluster'];
        const meta: {
            zclTransactionSequenceNumber?: number;
            manufacturerCode?: number;
            frameControl?: FrameControl;
        } = {};

        if (frame) {
            const command = frame.command;
            clusterName = frame.cluster.name;
            meta.zclTransactionSequenceNumber = frame.header.transactionSequenceNumber;
            meta.manufacturerCode = frame.header.manufacturerCode;
            meta.frameControl = frame.header.frameControl;

            if (frame.header.isGlobal) {
                switch (frame.command.name) {
                    case 'report': {
                        type = 'attributeReport';
                        data = ZclFrameConverter.attributeKeyValue(frame, device.manufacturerID, device.customClusters);
                        break;
                    }

                    case 'read': {
                        type = 'read';
                        data = ZclFrameConverter.attributeList(frame, device.manufacturerID, device.customClusters);
                        break;
                    }

                    case 'write': {
                        type = 'write';
                        data = ZclFrameConverter.attributeKeyValue(frame, device.manufacturerID, device.customClusters);
                        break;
                    }

                    case 'readRsp': {
                        type = 'readResponse';
                        data = ZclFrameConverter.attributeKeyValue(frame, device.manufacturerID, device.customClusters);
                        break;
                    }
                }
            } else {
                /* istanbul ignore else */
                if (frame.header.isSpecific) {
                    type = `command${command.name.charAt(0).toUpperCase()}${command.name.slice(1)}`;
                    data = frame.payload;
                }
            }

            if (type === 'readResponse' || type === 'attributeReport') {
                // Some device report, e.g. it's modelID through a readResponse or attributeReport
                for (const key in data) {
                    const property = Device.ReportablePropertiesMapping[key];

                    if (property && !device[property.key]) {
                        // XXX: data technically can be `KeyValue | (string | number)[]`
                        property.set((data as KeyValue)[key], device);
                    }
                }

                endpoint.saveClusterAttributeKeyValue(frame.cluster.ID, data);
            }
        } else {
            type = 'raw';
            data = payload.data;
            const name = Zcl.Utils.getCluster(payload.clusterID, device.manufacturerID, device.customClusters).name;
            clusterName = Number.isNaN(Number(name)) ? name : Number(name);
        }

        if (type && data) {
            const linkquality = payload.linkquality;
            const groupID = payload.groupID;

            this.selfAndDeviceEmit(device, 'message', {
                type,
                device,
                endpoint,
                data,
                linkquality,
                groupID,
                cluster: clusterName,
                meta,
            });
            this.selfAndDeviceEmit(device, 'lastSeenChanged', {device, reason: 'messageEmitted'});
        } else {
            this.selfAndDeviceEmit(device, 'lastSeenChanged', {device, reason: 'messageNonEmitted'});
        }

        if (frame) {
            await device.onZclData(payload, frame, endpoint);
        }
    }
}

export default Controller;
