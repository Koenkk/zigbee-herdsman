/* istanbul ignore file */
/* eslint-disable */
import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters,
    StartResult, LQINeighbor, RoutingTableEntry, AdapterOptions,
} from '../../tstype';
import Debug from "debug";
import Adapter from '../../adapter';
const debug = Debug("zigbee-herdsman:ezsp:adapter");
import {Ezsp, Driver} from '../driver';
import {ZclFrame, FrameType, Direction, Foundation} from '../../../zcl';
import * as Events from '../../events';
import * as Zcl from '../../../zcl';
import {GreenPowerEvents, GreenPowerDeviceJoinedPayload} from '../../../controller/tstype';
import {Queue, Waitress, Wait} from '../../../utils';


interface WaitressMatcher {
    address: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    frameType: FrameType;
    clusterID: number;
    commandIdentifier: number;
    direction: number;
}

class EZSPAdapter extends Adapter {
    private driver: Driver;
    private port: SerialPortOptions;
    
    public constructor(networkOptions: NetworkOptions,
        serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.port = serialPortOptions;
        this.driver = new Driver();
        this.driver.on('deviceJoined', this.handleDeviceJoin.bind(this));
        this.driver.on('deviceLeft', this.handleDeviceLeft.bind(this));
        this.driver.on('incomingMessage', this.processMessage.bind(this));
    }

    private async processMessage(frame: any) {
        // todo
        if (!frame.senderEui64) {
            frame.senderEui64 = await this.driver.networkIdToEUI64(frame.sender)
        }
        this.emit('event', frame);
    }

    private handleDeviceJoin(arr: any[]) {
        // todo
        let [nwk, ieee] = arr;
        debug('Device join request received: %s %s', nwk, ieee);
        // let devices = this.getDevices();
        // if (!devices.some(d => d.nodeId === nwk || d.eui64 === ieee.toString())) {
        //     devices.push({ nodeId: nwk, eui64: ieee.toString() });
        //     writeFileSync(deviceDbPath, JSON.stringify(devices), 'utf8');
        //     log.info('Added device to DB: %s %s', nwk, ieee)
        // }
    }

    private handleDeviceLeft(arr: any[]) {
        // todo
        let [nwk, ieee] = arr;
        debug('Device left network request received: %s %s', nwk, ieee);
        // let devices = this.getDevices();

        // let idx = devices.findIndex(d => d.nodeId === nwk && d.eui64 === ieee.toString());
        // if (idx >= 0) {
        //     devices = devices.splice(idx, 1);
        //     writeFileSync(deviceDbPath, JSON.stringify(devices), 'utf8');
        // }
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        await this.driver.startup(this.port.path, {
            baudRate: this.port.baudRate || 115200,
            parity: 'none',
            stopBits: 1,
            xon: true,
            xoff: true
        }, this.networkOptions, debug);
        return Promise.resolve("resumed");
    }

    public async stop(): Promise<void> {
        await this.driver.stop();
    }

    public static async isValidPath(path: string): Promise<boolean> {
        // todo
        return true;
    }

    public static async autoDetectPath(): Promise<string> {
        // todo
        return '';
    }

    public async getCoordinator(): Promise<Coordinator> {
        // todo
        return {
            networkAddress: 0x0000,
            manufacturerID: 0x1135,
            ieeeAddr: '',
            endpoints: [],
        };
    }

    public async permitJoin(seconds: number, networkAddress: number): Promise<void> {
        // todo
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        // todo
        return {type: '', meta: {}};
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        return Promise.reject();
    }

    public async supportsLED(): Promise<boolean> {
        return false;
    }

    public async setLED(enabled: boolean): Promise<void> {
        return Promise.reject();
    }

    public async lqi(networkAddress: number): Promise<LQI> {
        // todo
        return Promise.reject();
    }

    public async routingTable(networkAddress: number): Promise<RoutingTable> {
        // todo
        return Promise.reject();
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
        // todo
        return Promise.reject();
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        // todo
        return Promise.reject();
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        // todo
        return Promise.reject();
    }

    public waitFor(
        networkAddress: number, endpoint: number, frameType: FrameType, direction: Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): {promise: Promise<Events.ZclDataPayload>; cancel: () => void} {
        // todo
        return {cancel: undefined, promise: undefined};
    }

    public async sendZclFrameToEndpoint(
        ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number,
    ): Promise<Events.ZclDataPayload> {
        // todo
        return Promise.reject();
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: ZclFrame): Promise<void> {
        // todo
        return Promise.reject();
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: ZclFrame, sourceEndpoint: number): Promise<void> {
        // todo
        return Promise.reject();
    }

    public async bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void> {
        // todo
        return Promise.reject();
    }

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {
        // todo
        return Promise.reject();
    }

    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        // todo
        return Promise.reject();
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        return {
            panID: this.driver.networkParams.panId,
            extendedPanID: this.driver.networkParams.extendedPanId[0],
            channel: this.driver.networkParams.radioChannel
        };
    }

    public async supportsBackup(): Promise<boolean> {
        //todo
        return false;
    }

    public async backup(): Promise<BackupType> {
        // todo
        return Promise.reject();
    }

    public async restoreChannelInterPAN(): Promise<void> {
        // todo
        throw new Error("not supported");
    }

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: ZclFrame, ieeeAddr: string): Promise<void> {
        // todo
        throw new Error("not supported");
    }

    public async sendZclFrameInterPANBroadcast(
        zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        // todo
        throw new Error("not supported");
    }

    public async sendZclFrameInterPANBroadcastWithResponse(
        zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        throw new Error("not supported");
    }

    public async sendZclFrameInterPANIeeeAddr(zclFrame: ZclFrame, ieeeAddr: any): Promise<void> {
        throw new Error("not supported");
    }

    public async setTransmitPower(value: number): Promise<void> {
        // todo
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        //todo
    }
}


export default EZSPAdapter;