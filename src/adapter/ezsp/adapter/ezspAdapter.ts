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
    clusterID: number;
    commandIdentifier: number;
}

class EZSPAdapter extends Adapter {
    private driver: Driver;
    private port: SerialPortOptions;
    private transactionID: number;
    private waitress: Waitress<Events.ZclDataPayload, WaitressMatcher>;

    public constructor(networkOptions: NetworkOptions,
        serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.transactionID = 1;
        this.port = serialPortOptions;
        this.waitress = new Waitress<Events.ZclDataPayload, WaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter
        );
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
        if (frame.apsFrame.profileId == 0) {
            if (
                frame.apsFrame.clusterId == EmberZDOCmd.Device_annce &&
                frame.apsFrame.destinationEndpoint == 0) {
                let nwk, rst, ieee;
                [nwk, rst] = uint16_t.deserialize(uint16_t, frame.message.slice(1));
                [ieee, rst] = EmberEUI64.deserialize(EmberEUI64, rst as Buffer);
                ieee = new EmberEUI64(ieee);
                debug("ZDO Device announce: %s, %s", nwk, ieee.toString());
                this.handleDeviceJoin([nwk, ieee]);
            }
        } else if (frame.apsFrame.profileId == 260) {
            try {
                const payload: Events.ZclDataPayload = {
                    frame: ZclFrame.fromBuffer(frame.apsFrame.clusterId, frame.message),
                    address: frame.sender,
                    endpoint: frame.apsFrame.sourceEndpoint,
                    linkquality: frame.lqi,
                    groupID: frame.apsFrame.groupId,
                };

                this.waitress.resolve(payload);
                this.emit(Events.Events.zclData, payload);
            } catch (error) {
                const payload: Events.RawDataPayload = {
                    clusterID: frame.apsFrame.clusterId,
                    data: frame.message,
                    address: frame.sender,
                    endpoint: frame.apsFrame.sourceEndpoint,
                    linkquality: frame.lqi,
                    groupID: frame.apsFrame.groupId,
                };

                this.emit(Events.Events.rawData, payload);
            }
        }
        this.emit('event', frame);
    }

    private async handleDeviceJoin(arr: any[]) {
        // todo
        let [nwk, ieee] = arr;
        debug('Device join request received: %s %s', nwk, ieee.toString('hex'));
        const payload: Events.DeviceJoinedPayload = {
            networkAddress: nwk,
            ieeeAddr: `0x${ieee.toString('hex')}`,
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

        const payload: Events.DeviceLeavePayload = {
            networkAddress: nwk,
            ieeeAddr: `0x${ieee.toString('hex')}`,
        };
        this.emit(Events.Events.deviceLeave, payload);
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
        }, this.networkOptions);
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
        return this.driver.queue.execute<Coordinator>(async () => {
            const networkAddress = 0x0000;
            const frame = new EmberApsFrame();
            frame.clusterId = EmberZDOCmd.Active_EP_req;
            frame.profileId = 0;
            frame.sequence = this.nextTransactionID();
            frame.sourceEndpoint = 0;
            frame.destinationEndpoint = 0;
            frame.groupId = 0;
            frame.options = EmberApsOption.APS_OPTION_ENABLE_ROUTE_DISCOVERY|EmberApsOption.APS_OPTION_RETRY;
            const payload = this.driver.make_zdo_frame("Active_EP_req", frame.sequence, networkAddress);
            const response = this.driver.waitFor(networkAddress, EmberZDOCmd.Active_EP_rsp);
            await this.driver.request(networkAddress, frame, payload);
            const activeEp = await response.start().promise;
            debug(`activeEndpoints got active endpoints payload: ${JSON.stringify(activeEp.payload)}`);
            const message = this.driver.parse_frame_payload("Active_EP_rsp", activeEp.payload);
            debug(`activeEndpoints got active endpoints  parsed: ${JSON.stringify(message)}`);
            const activeEndpoints = [...message[3]];

            const endpoints = [];
            for (const endpoint of activeEndpoints) {
                const frame = new EmberApsFrame();
                frame.clusterId = EmberZDOCmd.Simple_Desc_req;
                frame.profileId = 0;
                frame.sequence = this.nextTransactionID();
                frame.sourceEndpoint = 0;
                frame.destinationEndpoint = 0;
                frame.groupId = 0;
                frame.options = EmberApsOption.APS_OPTION_NONE;
                const payload = this.driver.make_zdo_frame("Simple_Desc_req", frame.sequence, networkAddress, endpoint);
                const response = this.driver.waitFor(networkAddress, EmberZDOCmd.Simple_Desc_rsp);
                await this.driver.request(networkAddress, frame, payload);
                const message = await response.start().promise;
                debug('simpleDescriptor got Simple Descriptor payload %O:', message.payload);
                const descriptor = this.driver.parse_frame_payload("Simple_Desc_rsp", message.payload);
                debug('simpleDescriptor got Simple Descriptor  parsed: %O',descriptor);
                endpoints.push({
                    profileID: descriptor[4].profileid,
                    ID: descriptor[4].endpoint,
                    deviceID: descriptor[4].deviceid,
                    inputClusters: descriptor[4].inclusterlist,
                    outputClusters: descriptor[4].outclusterlist,
                });
            }

            return {
                networkAddress: networkAddress,
                manufacturerID: 0,
                ieeeAddr: this.driver.ieee.toString(),
                endpoints,
            };
        });
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
        return this.driver.queue.execute<NodeDescriptor>(async () => {
            const frame = new EmberApsFrame();
            frame.clusterId = EmberZDOCmd.Node_Desc_req;
            frame.profileId = 0;
            frame.sequence = this.nextTransactionID();
            frame.sourceEndpoint = 0;
            frame.destinationEndpoint = 0;
            frame.groupId = 0;
            frame.options = EmberApsOption.APS_OPTION_ENABLE_ROUTE_DISCOVERY|EmberApsOption.APS_OPTION_RETRY;
            const payload = this.driver.make_zdo_frame("Node_Desc_req", frame.sequence, networkAddress);
            const response = this.driver.waitFor(networkAddress, EmberZDOCmd.Node_Desc_rsp);
            await this.driver.request(networkAddress, frame, payload);
            const descriptor = await response.start().promise;
            debug(`nodeDescriptorInternal got descriptor payload: ${JSON.stringify(descriptor.payload)}`);
            const message = this.driver.parse_frame_payload("Node_Desc_rsp", descriptor.payload);
            debug(`nodeDescriptorInternal got descriptor  parsed: ${message}`);
            return {manufacturerCode: message[2].manufacturer_code, type: (message[1] == 0) ? 'Coordinator' : 'EndDevice'};
        });
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        // todo
        debug(`Requesting 'Active endpoints' for '${networkAddress}'`);
        return this.driver.queue.execute<ActiveEndpoints>(async () => {
            const frame = new EmberApsFrame();
            frame.clusterId = EmberZDOCmd.Active_EP_req;
            frame.profileId = 0;
            frame.sequence = this.nextTransactionID();
            frame.sourceEndpoint = 0;
            frame.destinationEndpoint = 0;
            frame.groupId = 0;
            frame.options = EmberApsOption.APS_OPTION_ENABLE_ROUTE_DISCOVERY|EmberApsOption.APS_OPTION_RETRY;
            const payload = this.driver.make_zdo_frame("Active_EP_req", frame.sequence, networkAddress);
            const response = this.driver.waitFor(networkAddress, EmberZDOCmd.Active_EP_rsp);
            await this.driver.request(networkAddress, frame, payload);
            const activeEp = await response.start().promise;
            debug(`activeEndpoints got active endpoints payload: ${JSON.stringify(activeEp.payload)}`);
            const message = this.driver.parse_frame_payload("Active_EP_rsp", activeEp.payload);
            debug(`activeEndpoints got active endpoints  parsed: ${JSON.stringify(message)}`);
            return {endpoints: [...message[3]]};
        }, networkAddress);
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        // todo
        debug(`Requesting 'Simple Descriptor' for '${networkAddress}' endpoint ${endpointID}`);
        return this.driver.queue.execute<SimpleDescriptor>(async () => {
            const frame = new EmberApsFrame();
            frame.clusterId = EmberZDOCmd.Simple_Desc_req;
            frame.profileId = 0;
            frame.sequence = this.nextTransactionID();
            frame.sourceEndpoint = 0;
            frame.destinationEndpoint = 0;
            frame.groupId = 0;
            frame.options = EmberApsOption.APS_OPTION_NONE;
            const payload = this.driver.make_zdo_frame("Simple_Desc_req", frame.sequence, networkAddress, endpointID);
            const response = this.driver.waitFor(networkAddress, EmberZDOCmd.Simple_Desc_rsp);
            await this.driver.request(networkAddress, frame, payload);
            const message = await response.start().promise;
            debug('simpleDescriptor got Simple Descriptor payload %O:', message.payload);
            const descriptor = this.driver.parse_frame_payload("Simple_Desc_rsp", message.payload);
            debug('simpleDescriptor got Simple Descriptor  parsed: %O',descriptor);
            return {
                profileID: descriptor[4].profileid,
                endpointID: descriptor[4].endpoint,
                deviceID: descriptor[4].deviceid,
                inputClusters: descriptor[4].inclusterlist,
                outputClusters: descriptor[4].outclusterlist,
            };
        }, networkAddress);
    }

    public async sendZclFrameToEndpoint(
        ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number,
    ): Promise<Events.ZclDataPayload> {
        return this.driver.queue.execute<Events.ZclDataPayload>(async () => {
            return this.sendZclFrameToEndpointInternal(
                ieeeAddr, networkAddress, endpoint, sourceEndpoint || 1, zclFrame, timeout, disableResponse,
                disableRecovery, 0, 0, false, false, false, null
            );
        }, networkAddress);
    }

    private async sendZclFrameToEndpointInternal(
        ieeeAddr: string, networkAddress: number, endpoint: number, sourceEndpoint: number, zclFrame: ZclFrame,
        timeout: number, disableResponse: boolean, disableRecovery: boolean, responseAttempt: number,
        dataRequestAttempt: number, checkedNetworkAddress: boolean, discoveredRoute: boolean, assocRemove: boolean,
        assocRestore: {ieeeadr: string, nwkaddr: number, noderelation: number}
    ): Promise<Events.ZclDataPayload> {
        debug('sendZclFrameToEndpointInternal %s:%i/%i (%i,%i,%i)',
            ieeeAddr, networkAddress, endpoint, responseAttempt, dataRequestAttempt, this.driver.queue.count());
        let response = null;
        const command = zclFrame.getCommand();
        if (command.hasOwnProperty('response') && disableResponse === false) {
            response = this.waitForInternal(
                networkAddress, endpoint,
                zclFrame.Header.transactionSequenceNumber, zclFrame.Cluster.ID, command.response, timeout
            );
        } else if (!zclFrame.Header.frameControl.disableDefaultResponse) {
            response = this.waitForInternal(
                networkAddress, endpoint,
                zclFrame.Header.transactionSequenceNumber, zclFrame.Cluster.ID, Foundation.defaultRsp.ID,
                timeout,
            );
        }

        const frame = new EmberApsFrame();
        frame.clusterId = zclFrame.Cluster.ID;
        frame.profileId = 0x0104;
        frame.sequence = this.nextTransactionID();
        frame.sourceEndpoint = sourceEndpoint || 0x01;
        frame.destinationEndpoint = endpoint;
        frame.groupId = 0;
        frame.options = EmberApsOption.APS_OPTION_ENABLE_ROUTE_DISCOVERY|EmberApsOption.APS_OPTION_RETRY;
        // const response = this.driver.waitFor(networkAddress, );
        const dataConfirmResult = await this.driver.request(networkAddress, frame, zclFrame.toBuffer());

        if (response !== null) {
            try {
                const result = await response.start().promise;
                return result;
            } catch (error) {
                debug('Response timeout (%s:%d,%d)', ieeeAddr, networkAddress, responseAttempt);
                if (responseAttempt < 1 && !disableRecovery) {
                    return this.sendZclFrameToEndpointInternal(
                        ieeeAddr, networkAddress, endpoint, sourceEndpoint, zclFrame, timeout, disableResponse,
                        disableRecovery, responseAttempt + 1, dataRequestAttempt, checkedNetworkAddress,
                        discoveredRoute, assocRemove, assocRestore,
                    );
                } else {
                    throw error;
                }
            }
        } else {
            return null;
        }
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

    private waitForInternal(
        networkAddress: number, endpoint: number, transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): {start: () => {promise: Promise<Events.ZclDataPayload>}; cancel: () => void} {
        const payload = {
            address: networkAddress, endpoint, clusterID, commandIdentifier,
            transactionSequenceNumber,
        };

        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {start: waiter.start, cancel};
    }

    public waitFor(
        networkAddress: number, endpoint: number, frameType: FrameType, direction: Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): {promise: Promise<Events.ZclDataPayload>; cancel: () => void} {
        const waiter = this.waitForInternal(
            networkAddress, endpoint, transactionSequenceNumber, clusterID,
            commandIdentifier, timeout,
        );

        return {cancel: waiter.cancel, promise: waiter.start().promise};
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return `Timeout - ${matcher.address} - ${matcher.endpoint}` +
            ` - ${matcher.transactionSequenceNumber} - ${matcher.clusterID}` +
            ` - ${matcher.commandIdentifier} after ${timeout}ms`;
    }

    private waitressValidator(payload: Events.ZclDataPayload, matcher: WaitressMatcher): boolean {
        const transactionSequenceNumber = payload.frame.Header.transactionSequenceNumber;
        return (!matcher.address || payload.address === matcher.address) &&
            payload.endpoint === matcher.endpoint &&
            (!matcher.transactionSequenceNumber || transactionSequenceNumber === matcher.transactionSequenceNumber) &&
            payload.frame.Cluster.ID === matcher.clusterID &&
            matcher.commandIdentifier === payload.frame.Header.commandIdentifier;
    }
}


export default EZSPAdapter;
