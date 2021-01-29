/* istanbul ignore file */
/* eslint-disable */
import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters,
    StartResult, LQINeighbor, RoutingTableEntry, AdapterOptions,
} from '../../tstype';
import Debug from "debug";
import Adapter from '../../adapter';
const debug = Debug("zigbee-herdsman:adapter:ezsp");
import {Ezsp, Driver} from '../driver';
import { EmberApsFrame } from '../driver/types/struct';
import { EmberZDOCmd, EmberApsOption, uint16_t, EmberEUI64 } from '../driver/types';
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
    private transactionID: number;
    
    public constructor(networkOptions: NetworkOptions,
        serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.transactionID = 1;
        this.port = serialPortOptions;
        this.driver = new Driver();
        this.driver.on('deviceJoined', this.handleDeviceJoin.bind(this));
        this.driver.on('deviceLeft', this.handleDeviceLeft.bind(this));
        this.driver.on('incomingMessage', this.processMessage.bind(this));
    }

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }

    private async processMessage(frame: any) {
        // todo
        debug(`processMessage: ${JSON.stringify(frame)}`);
        if (!frame.senderEui64) {
            frame.senderEui64 = await this.driver.networkIdToEUI64(frame.sender)
        }
        if (frame.apsFrame.clusterId == EmberZDOCmd.Device_annce && frame.apsFrame.destinationEndpoint == 0) {
            const [nwk, rest] = uint16_t.deserialize(uint16_t, frame.message.slice(1));
            const [ieee] = EmberEUI64.deserialize(EmberEUI64, rest as Buffer);
            debug("ZDO Device announce: 0x%04x, %s", nwk, ieee);
            this.handleDeviceJoin([nwk, ieee, 0]);
        }
        this.emit('event', frame);
    }

    private async handleDeviceJoin(arr: any[]) {
        // todo
        let [nwk, ieee] = arr;
        debug('Device join request received: %s %s', nwk, ieee);
        const payload: Events.DeviceJoinedPayload = {
            networkAddress: nwk,
            ieeeAddr: ieee,
        };

        if (nwk == 0) {
            const nd = await this.nodeDescriptor(nwk);
        } else {
            this.emit(Events.Events.deviceJoined, payload);
        }
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
        await this.driver.permitJoining(seconds);
        return Promise.resolve();
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
        try {
            debug(`Requesting 'Node Descriptor' for '${networkAddress}'`);
            const result = await this.nodeDescriptorInternal(networkAddress);
            return result;
        } catch (error) {
            debug(`Node descriptor request for '${networkAddress}' failed (${error}), retry`);
            throw error;
        }
    }

    private async nodeDescriptorInternal(networkAddress: number): Promise<NodeDescriptor> {
        const frame = new EmberApsFrame();
        frame.clusterId = EmberZDOCmd.Node_Desc_req;
        frame.profileId = 0;
        frame.sequence = this.nextTransactionID();
        frame.sourceEndpoint = 0;
        frame.destinationEndpoint = 0;
        frame.groupId = 0;
        frame.options = EmberApsOption.APS_OPTION_ENABLE_ROUTE_DISCOVERY|EmberApsOption.APS_OPTION_RETRY;
        const response = this.driver.waitFor(networkAddress, EmberZDOCmd.Node_Desc_rsp);
        const payload = this.driver.make_zdo_frame("Node_Desc_req", frame.sequence, networkAddress);
        await this.driver.request(networkAddress, frame, payload);
        const descriptor = await response.start().promise;
        debug(`nodeDescriptorInternal got descriptor payload: ${JSON.stringify(descriptor.payload)}`);
        const message = this.driver.parse_frame_payload("Node_Desc_rsp", descriptor.payload);
        debug(`nodeDescriptorInternal got descriptor  parsed: ${message}`);
        return {manufacturerCode: message[2].manufacturer_code, type: (message[1] == 0) ? 'Coordinator' : 'EndDevice'};
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
        return Promise.resolve();
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