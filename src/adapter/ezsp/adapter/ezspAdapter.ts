/* istanbul ignore file */
import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, NetworkParameters,
    StartResult, LQINeighbor, RoutingTableEntry, AdapterOptions
} from '../../tstype';
import Adapter from '../../adapter';

import {Driver, EmberIncomingMessage} from '../driver';
import {EmberZDOCmd, uint16_t, EmberEUI64, EmberStatus} from '../driver/types';
import * as Zcl from '../../../zspec/zcl';
import * as Events from '../../events';
import {Queue, Waitress, Wait, RealpathSync} from '../../../utils';
import * as Models from "../../../models";
import SerialPortUtils from '../../serialPortUtils';
import SocketPortUtils from '../../socketPortUtils';
import {EZSPZDOResponseFrameData} from '../driver/ezsp';
import {logger} from '../../../utils/logger';
import {BroadcastAddress} from '../../../zspec/enums';

const NS = 'zh:ezsp';

const autoDetectDefinitions = [
    {manufacturer: 'ITEAD', vendorId: '1a86', productId: '55d4'},  // Sonoff ZBDongle-E
    {manufacturer: 'Nabu Casa', vendorId: '10c4', productId: 'ea60'},  // Home Assistant SkyConnect
];


interface WaitressMatcher {
    address: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    clusterID: number;
    commandIdentifier: number;
}

class EZSPAdapter extends Adapter {
    private driver: Driver;
    private waitress: Waitress<Events.ZclPayload, WaitressMatcher>;
    private interpanLock: boolean;
    private queue: Queue;
    private closing: boolean;
    private deprecatedTimer: NodeJS.Timeout;


    public constructor(networkOptions: NetworkOptions,
        serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);

        this.waitress = new Waitress<Events.ZclPayload, WaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter
        );
        this.interpanLock = false;
        this.closing = false;

        const concurrent = adapterOptions && adapterOptions.concurrent ? adapterOptions.concurrent : 8;
        logger.debug(`Adapter concurrent: ${concurrent}`, NS);
        this.queue = new Queue(concurrent);

        this.driver = new Driver(this.serialPortOptions, this.networkOptions, this.greenPowerGroup, backupPath);
        this.driver.on('close', this.onDriverClose.bind(this));
        this.driver.on('deviceJoined', this.handleDeviceJoin.bind(this));
        this.driver.on('deviceLeft', this.handleDeviceLeft.bind(this));
        this.driver.on('incomingMessage', this.processMessage.bind(this));
    }

    private async processMessage(frame: EmberIncomingMessage): Promise<void> {
        logger.debug(`processMessage: ${JSON.stringify(frame)}`, NS);
        if (frame.apsFrame.profileId == 0) {
            if (
                frame.apsFrame.clusterId == EmberZDOCmd.Device_annce &&
                frame.apsFrame.destinationEndpoint == 0) {
                let nwk, rst, ieee;
                // eslint-disable-next-line prefer-const
                [nwk, rst] = uint16_t.deserialize(uint16_t, frame.message.subarray(1));
                [ieee, rst] = EmberEUI64.deserialize(EmberEUI64, rst as Buffer);
                ieee = new EmberEUI64(ieee);
                logger.debug(`ZDO Device announce: ${nwk}, ${ieee.toString()}`, NS);
                this.driver.handleNodeJoined(nwk, ieee);
            }
        } else if (frame.apsFrame.profileId == 260 || frame.apsFrame.profileId == 0xFFFF) {
            const payload: Events.ZclPayload = {
                clusterID: frame.apsFrame.clusterId,
                header: Zcl.Header.fromBuffer(frame.message),
                data: frame.message,
                address: frame.sender,
                endpoint: frame.apsFrame.sourceEndpoint,
                linkquality: frame.lqi,
                groupID: frame.apsFrame.groupId,
                wasBroadcast: false, // TODO
                destinationEndpoint: frame.apsFrame.destinationEndpoint,
            };

            this.waitress.resolve(payload);
            this.emit(Events.Events.zclPayload, payload);
        } else if (frame.apsFrame.profileId == 0xc05e && frame.senderEui64) {  // ZLL Frame
            const payload: Events.ZclPayload = {
                clusterID: frame.apsFrame.clusterId,
                header: Zcl.Header.fromBuffer(frame.message),
                data: frame.message,
                address: `0x${frame.senderEui64.toString()}`,
                endpoint: 0xFE,
                linkquality: frame.lqi,
                groupID: null,
                wasBroadcast: false,
                destinationEndpoint: null,
            };

            this.waitress.resolve(payload);
            this.emit(Events.Events.zclPayload, payload);
        } else if (frame.apsFrame.profileId == 0xA1E0) {  // GP Frame
            // Only handle when clusterId == 33 (greenPower), some devices send messages with this profileId
            // while the cluster is not greenPower
            // https://github.com/Koenkk/zigbee2mqtt/issues/20838
            if (frame.apsFrame.clusterId === 33) {
                const payload: Events.ZclPayload = {
                    header: Zcl.Header.fromBuffer(frame.message),
                    clusterID: frame.apsFrame.clusterId,
                    data: frame.message,
                    address: frame.sender,
                    endpoint: frame.apsFrame.sourceEndpoint,
                    linkquality: frame.lqi,
                    groupID: null,
                    wasBroadcast: true,
                    destinationEndpoint: frame.apsFrame.sourceEndpoint,
                };
    
                this.waitress.resolve(payload);
                this.emit(Events.Events.zclPayload, payload);
            } else {
                logger.debug(`Ignoring GP frame because clusterId is not greenPower`, NS);
            }
        }
        this.emit('event', frame);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async handleDeviceJoin(arr: any[]): Promise<void> {
        const [nwk, ieee] = arr;
        logger.debug(`Device join request received: ${nwk} ${ieee.toString('hex')}`, NS);
        const payload: Events.DeviceJoinedPayload = {
            networkAddress: nwk,
            ieeeAddr: `0x${ieee.toString('hex')}`,
        };

        if (nwk == 0) {
            await this.nodeDescriptor(nwk);
        } else {
            this.emit(Events.Events.deviceJoined, payload);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleDeviceLeft(arr: any[]): void {
        const [nwk, ieee] = arr;
        logger.debug(`Device left network request received: ${nwk} ${ieee}`, NS);

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
        const logEzspDeprecated = (): void => {
            const message = `Deprecated driver 'ezsp' currently in use, 'ember' will become the officially supported EmberZNet ` +
                `driver in next release. If using Zigbee2MQTT see https://github.com/Koenkk/zigbee2mqtt/discussions/21462`;
            logger.warning(message, NS);
        };
        logEzspDeprecated();
        this.deprecatedTimer = setInterval(logEzspDeprecated, 60 * 60 * 1000); // Every 60 mins
        return this.driver.startup();
    }

    public async stop(): Promise<void> {
        this.closing = true;
        clearInterval(this.deprecatedTimer);
        await this.driver.stop();
    }

    public async onDriverClose(): Promise<void> {
        logger.debug(`onDriverClose()`, NS);

        if (!this.closing) {
            this.emit(Events.Events.disconnected);
        }
    }

    public static async isValidPath(path: string): Promise<boolean> {
        // For TCP paths we cannot get device information, therefore we cannot validate it.
        if (SocketPortUtils.isTcpPath(path)) {
            return false;
        }

        try {
            return SerialPortUtils.is(RealpathSync(path), autoDetectDefinitions);
        } catch (error) {
            logger.debug(`Failed to determine if path is valid: '${error}'`, NS);
            return false;
        }
    }

    public static async autoDetectPath(): Promise<string> {
        const paths = await SerialPortUtils.find(autoDetectDefinitions);
        paths.sort((a, b) => (a < b) ? -1 : 1);
        return paths.length > 0 ? paths[0] : null;
    }

    public async getCoordinator(): Promise<Coordinator> {
        return this.queue.execute<Coordinator>(async () => {
            this.checkInterpanLock();
            const networkAddress = 0x0000;
            const message = await this.driver.zdoRequest(
                networkAddress, EmberZDOCmd.Active_EP_req, EmberZDOCmd.Active_EP_rsp,
                {dstaddr: networkAddress}
            );
            const activeEndpoints = message.activeeplist;

            const endpoints = [];
            for (const endpoint of activeEndpoints) {
                const descriptor = await this.driver.zdoRequest(
                    networkAddress, EmberZDOCmd.Simple_Desc_req, EmberZDOCmd.Simple_Desc_rsp,
                    {dstaddr: networkAddress, targetEp: endpoint}
                );
                endpoints.push({
                    profileID: descriptor.descriptor.profileid,
                    ID: descriptor.descriptor.endpoint,
                    deviceID: descriptor.descriptor.deviceid,
                    inputClusters: descriptor.descriptor.inclusterlist,
                    outputClusters: descriptor.descriptor.outclusterlist,
                });
            }

            return {
                networkAddress: networkAddress,
                manufacturerID: 0,
                ieeeAddr: `0x${this.driver.ieee.toString()}`,
                endpoints,
            };
        });
    }

    public async permitJoin(seconds: number, networkAddress: number): Promise<void> {
        if (this.driver.ezsp.isInitialized()) {
            return this.queue.execute<void>(async () => {
                this.checkInterpanLock();

                await this.driver.preJoining(seconds);

                if (networkAddress) {
                    const result = await this.driver.zdoRequest(
                        networkAddress, EmberZDOCmd.Mgmt_Permit_Joining_req,
                        EmberZDOCmd.Mgmt_Permit_Joining_rsp,
                        {duration: seconds, tcSignificant: false}
                    );
                    if (result.status !== EmberStatus.SUCCESS) {
                        throw new Error(`permitJoin for '${networkAddress}' failed`);
                    }
                } else {
                    await this.driver.permitJoining(seconds);
                }
            });
        }
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        return {type: `EZSP v${this.driver.version.product}`, meta: this.driver.version};
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        if ([8, 10, 14, 16, 18].indexOf(key.length) === -1) {
            throw new Error('Wrong install code length');
        }
        await this.driver.addInstallCode(ieeeAddress, key);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async reset(type: 'soft' | 'hard'): Promise<void> {
        return Promise.reject(new Error("Not supported"));
    }

    public async lqi(networkAddress: number): Promise<LQI> {
        return this.queue.execute<LQI>(async (): Promise<LQI> => {
            this.checkInterpanLock();
            const neighbors: LQINeighbor[] = [];

            const request = async (startIndex: number): Promise<EZSPZDOResponseFrameData> => {
                const result = await this.driver.zdoRequest(
                    networkAddress, EmberZDOCmd.Mgmt_Lqi_req, EmberZDOCmd.Mgmt_Lqi_rsp,
                    {startindex: startIndex}
                );
                if (result.status !== EmberStatus.SUCCESS) {
                    throw new Error(`LQI for '${networkAddress}' failed with with status code ${result.status}`);
                }

                return result;
            };

            // eslint-disable-next-line
            const add = (list: any) => {
                for (const entry of list) {
                    this.driver.setNode(entry.nodeid, entry.ieee);
                    neighbors.push({
                        linkquality: entry.lqi,
                        networkAddress: entry.nodeid,
                        ieeeAddr: `0x${new EmberEUI64(entry.ieee).toString()}`,
                        relationship: (entry.packed >> 4) & 0x7,
                        depth: entry.depth,
                    });
                }
            };

            let response = await request(0);
            add(response.neighborlqilist.neighbors);
            const size = response.neighborlqilist.entries;
            let nextStartIndex = response.neighborlqilist.neighbors.length;

            while (neighbors.length < size) {
                response = await request(nextStartIndex);
                add(response.neighborlqilist.neighbors);
                nextStartIndex += response.neighborlqilist.neighbors.length;
            }

            return {neighbors};
        }, networkAddress);
    }

    public async routingTable(networkAddress: number): Promise<RoutingTable> {
        return this.queue.execute<RoutingTable>(async (): Promise<RoutingTable> => {
            this.checkInterpanLock();
            const table: RoutingTableEntry[] = [];

            const request = async (startIndex: number): Promise<EZSPZDOResponseFrameData> => {
                const result = await this.driver.zdoRequest(
                    networkAddress, EmberZDOCmd.Mgmt_Rtg_req, EmberZDOCmd.Mgmt_Rtg_rsp,
                    {startindex: startIndex}
                );
                if (result.status !== EmberStatus.SUCCESS) {
                    throw new Error(`Routing table for '${networkAddress}' failed with status code ${result.status}`);
                }

                return result;
            };

            // eslint-disable-next-line
            const add = (list: any) => {
                for (const entry of list) {
                    table.push({
                        destinationAddress: entry.destination,
                        status: entry.status,
                        nextHop: entry.nexthop
                    });
                }
            };

            let response = await request(0);
            add(response.routingtablelist.table);
            const size = response.routingtablelist.entries;
            let nextStartIndex = response.routingtablelist.table.length;

            while (table.length < size) {
                response = await request(nextStartIndex);
                add(response.routingtablelist.table);
                nextStartIndex += response.routingtablelist.table.length;
            }

            return {table};
        }, networkAddress);
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
        return this.queue.execute<NodeDescriptor>(async () => {
            this.checkInterpanLock();
            try {
                logger.debug(`Requesting 'Node Descriptor' for '${networkAddress}'`, NS);
                const result = await this.nodeDescriptorInternal(networkAddress);
                return result;
            } catch (error) {
                logger.debug(`Node descriptor request for '${networkAddress}' failed (${error}), retry`, NS);
                throw error;
            }
        });
    }

    private async nodeDescriptorInternal(networkAddress: number): Promise<NodeDescriptor> {
        const descriptor = await this.driver.zdoRequest(
            networkAddress, EmberZDOCmd.Node_Desc_req, EmberZDOCmd.Node_Desc_rsp,
            {dstaddr: networkAddress}
        );
        const logicaltype = descriptor.descriptor.byte1 & 0x07;
        return {
            manufacturerCode: descriptor.descriptor.manufacturer_code,
            type: (logicaltype == 0) ? 'Coordinator' : (logicaltype == 1) ? 'Router' : 'EndDevice'
        };
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        logger.debug(`Requesting 'Active endpoints' for '${networkAddress}'`, NS);
        return this.queue.execute<ActiveEndpoints>(async () => {
            const endpoints = await this.driver.zdoRequest(
                networkAddress, EmberZDOCmd.Active_EP_req, EmberZDOCmd.Active_EP_rsp,
                {dstaddr: networkAddress}
            );
            return {endpoints: [...endpoints.activeeplist]};
        }, networkAddress);
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        logger.debug(`Requesting 'Simple Descriptor' for '${networkAddress}' endpoint ${endpointID}`, NS);
        return this.queue.execute<SimpleDescriptor>(async () => {
            this.checkInterpanLock();
            const descriptor = await this.driver.zdoRequest(
                networkAddress, EmberZDOCmd.Simple_Desc_req, EmberZDOCmd.Simple_Desc_rsp,
                {dstaddr: networkAddress, targetEp: endpointID}
            );
            return {
                profileID: descriptor.descriptor.profileid,
                endpointID: descriptor.descriptor.endpoint,
                deviceID: descriptor.descriptor.deviceid,
                inputClusters: descriptor.descriptor.inclusterlist,
                outputClusters: descriptor.descriptor.outclusterlist,
            };
        }, networkAddress);
    }

    public async sendZclFrameToEndpoint(
        ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: Zcl.Frame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number,
    ): Promise<Events.ZclPayload> {
        return this.queue.execute<Events.ZclPayload>(async () => {
            this.checkInterpanLock();
            return this.sendZclFrameToEndpointInternal(
                ieeeAddr, networkAddress, endpoint, sourceEndpoint || 1, zclFrame, timeout, disableResponse,
                disableRecovery, 0, 0, false, false, false, null
            );
        }, networkAddress);
    }

    private async sendZclFrameToEndpointInternal(
        ieeeAddr: string, networkAddress: number, endpoint: number, sourceEndpoint: number, zclFrame: Zcl.Frame,
        timeout: number, disableResponse: boolean, disableRecovery: boolean, responseAttempt: number,
        dataRequestAttempt: number, checkedNetworkAddress: boolean, discoveredRoute: boolean, assocRemove: boolean,
        assocRestore: { ieeeadr: string, nwkaddr: number, noderelation: number }
    ): Promise<Events.ZclPayload> {
        if (ieeeAddr == null) {
            ieeeAddr = `0x${this.driver.ieee.toString()}`;
        }
        logger.debug(`sendZclFrameToEndpointInternal ${ieeeAddr}:${networkAddress}/${endpoint} `
            + `(${responseAttempt},${dataRequestAttempt},${this.queue.count()}), timeout=${timeout}`, NS);
        let response = null;
        const command = zclFrame.command;
        if (command.hasOwnProperty('response') && disableResponse === false) {
            response = this.waitForInternal(
                networkAddress, endpoint,
                zclFrame.header.transactionSequenceNumber, zclFrame.cluster.ID, command.response, timeout
            );
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            response = this.waitForInternal(
                networkAddress, endpoint,
                zclFrame.header.transactionSequenceNumber, zclFrame.cluster.ID, Zcl.Foundation.defaultRsp.ID,
                timeout,
            );
        }

        const frame = this.driver.makeApsFrame(zclFrame.cluster.ID, disableResponse || zclFrame.header.frameControl.disableDefaultResponse);
        frame.profileId = 0x0104;
        frame.sourceEndpoint = sourceEndpoint || 0x01;
        frame.destinationEndpoint = endpoint;
        frame.groupId = 0;

        this.driver.setNode(networkAddress, new EmberEUI64(ieeeAddr));
        const dataConfirmResult = await this.driver.request(networkAddress, frame, zclFrame.toBuffer());
        if (!dataConfirmResult) {
            if (response != null) {
                response.cancel();
            }
            throw Error('sendZclFrameToEndpointInternal error');
        }
        if (response !== null) {
            try {
                const result = await response.start().promise;
                return result;
            } catch (error) {
                logger.debug(`Response timeout (${ieeeAddr}:${networkAddress},${responseAttempt})`, NS);
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

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame): Promise<void> {
        return this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const frame = this.driver.makeApsFrame(zclFrame.cluster.ID, false);
            frame.profileId = 0x0104;
            frame.sourceEndpoint =  0x01;
            frame.destinationEndpoint = 0x01;
            frame.groupId = groupID;
            
            await this.driver.mrequest(frame, zclFrame.toBuffer());
            /**
             * As a group command is not confirmed and thus immidiately returns
             * (contrary to network address requests) we will give the
             * command some time to 'settle' in the network.
             */
            await Wait(200);
        });
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: Zcl.Frame, sourceEndpoint: number, destination: BroadcastAddress): Promise<void> {
        return this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const frame = this.driver.makeApsFrame(zclFrame.cluster.ID, false);
            frame.profileId = sourceEndpoint === 242 && endpoint === 242 ? 0xA1E0 : 0x0104;
            frame.sourceEndpoint =  sourceEndpoint;
            frame.destinationEndpoint = endpoint;
            frame.groupId = destination;
            
            await this.driver.mrequest(frame, zclFrame.toBuffer());

            /**
             * As a broadcast command is not confirmed and thus immidiately returns
             * (contrary to network address requests) we will give the
             * command some time to 'settle' in the network.
             */
            await Wait(200);
        });
    }

    public async bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void> {
        return this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const ieee = new EmberEUI64(sourceIeeeAddress);
            let destAddr;
            if (type === 'group') {
                // 0x01 = 16-bit group address for DstAddr and DstEndpoint not present
                destAddr = {
                    addrmode: 0x01,
                    nwk: destinationAddressOrGroup,
                };
            } else {
                // 0x03 = 64-bit extended address for DstAddr and DstEndpoint present
                destAddr = {
                    addrmode: 0x03,
                    ieee: new EmberEUI64(destinationAddressOrGroup as string),
                    endpoint: destinationEndpoint,
                };
                this.driver.setNode(destinationNetworkAddress, destAddr.ieee);
            }
            await this.driver.zdoRequest(
                destinationNetworkAddress, EmberZDOCmd.Bind_req, EmberZDOCmd.Bind_rsp,
                {sourceEui: ieee, sourceEp: sourceEndpoint, clusterId: clusterID, destAddr: destAddr}
            );
        }, destinationNetworkAddress);
    }

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {
        return this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const ieee = new EmberEUI64(sourceIeeeAddress);
            let destAddr;
            if (type === 'group') {
                // 0x01 = 16-bit group address for DstAddr and DstEndpoint not present
                destAddr = {
                    addrmode: 0x01,
                    nwk: destinationAddressOrGroup,
                };
            } else {
                // 0x03 = 64-bit extended address for DstAddr and DstEndpoint present
                destAddr = {
                    addrmode: 0x03,
                    ieee: new EmberEUI64(destinationAddressOrGroup as string),
                    endpoint: destinationEndpoint,
                };
                this.driver.setNode(destinationNetworkAddress, destAddr.ieee);
            }
            await this.driver.zdoRequest(
                destinationNetworkAddress, EmberZDOCmd.Unbind_req, EmberZDOCmd.Unbind_rsp,
                {sourceEui: ieee, sourceEp: sourceEndpoint, clusterId: clusterID, destAddr: destAddr}
            );
        }, destinationNetworkAddress);
    }

    public removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        return this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const ieee = new EmberEUI64(ieeeAddr);
            this.driver.setNode(networkAddress, ieee);
            await this.driver.zdoRequest(
                networkAddress, EmberZDOCmd.Mgmt_Leave_req, EmberZDOCmd.Mgmt_Leave_rsp,
                {destAddr: ieee, removechildrenRejoin: 0x00}
            );
        }, networkAddress);
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        return {
            panID: this.driver.networkParams.panId,
            extendedPanID: this.driver.networkParams.extendedPanId[0],
            channel: this.driver.networkParams.radioChannel
        };
    }

    public async supportsBackup(): Promise<boolean> {
        return true;
    }

    public async backup(): Promise<Models.Backup> {
        if (this.driver.ezsp.isInitialized()) {
            return this.driver.backupMan.createBackup();
        }
    }

    public async restoreChannelInterPAN(): Promise<void> {
        return this.queue.execute<void>(async () => {
            const channel = (await this.getNetworkParameters()).channel;
            await this.driver.setChannel(channel);
            // Give adapter some time to restore, otherwise stuff crashes
            await Wait(3000);
            this.interpanLock = false;
        });
    }

    private checkInterpanLock(): void {
        if (this.interpanLock) {
            throw new Error(`Cannot execute command, in Inter-PAN mode`);
        }
    }

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddr: string): Promise<void> {
        return this.queue.execute<void>(async () => {
            logger.debug(`sendZclFrameInterPANToIeeeAddr to ${ieeeAddr}`, NS);
            try {
                const frame = this.driver.makeEmberIeeeRawFrame();
                frame.ieeeFrameControl = 0xcc21;
                frame.destPanId = 0xFFFF;
                frame.destAddress = new EmberEUI64(ieeeAddr);
                frame.sourcePanId = this.driver.networkParams.panId;
                frame.sourceAddress = this.driver.ieee;
                frame.nwkFrameControl = 0x000b;
                frame.appFrameControl = 0x03;
                frame.clusterId = zclFrame.cluster.ID;
                frame.profileId = 0xc05e;

                await this.driver.ieeerawrequest(frame, zclFrame.toBuffer());
            } catch (error) {
                throw error;
            }
        });
    }

    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<Events.ZclPayload> {
        return this.queue.execute<Events.ZclPayload>(async () => {
            logger.debug(`sendZclFrameInterPANBroadcast`, NS);
            const command = zclFrame.command;
            if (!command.hasOwnProperty('response')) {
                throw new Error(`Command '${command.name}' has no response, cannot wait for response`);
            }

            const response = this.waitForInternal(
                null, 0xFE, null, zclFrame.cluster.ID, command.response, timeout
            );

            try {
                const frame = this.driver.makeEmberRawFrame();
                frame.ieeeFrameControl = 0xc801;
                frame.destPanId = 0xFFFF;
                frame.destNodeId = 0xFFFF;
                frame.sourcePanId = this.driver.networkParams.panId;
                frame.ieeeAddress = this.driver.ieee;
                frame.nwkFrameControl = 0x000b;
                frame.appFrameControl = 0x0b;
                frame.clusterId = zclFrame.cluster.ID;
                frame.profileId = 0xc05e;

                await this.driver.rawrequest(frame, zclFrame.toBuffer());
            } catch (error) {
                response.cancel();
                throw error;
            }

            return response.start().promise;
        });
    }

    public async supportsChangeChannel(): Promise<boolean> {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async changeChannel(newChannel: number): Promise<void> {
        return Promise.reject(new Error("Not supported"));
    }

    public async setTransmitPower(value: number): Promise<void> {
        logger.debug(`setTransmitPower to ${value}`, NS);
        return this.queue.execute<void>(async () => {
            await this.driver.setRadioPower(value);
        });
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        return this.queue.execute<void>(async () => {
            this.interpanLock = true;
            await this.driver.setChannel(channel);
        });
    }

    private waitForInternal(
        networkAddress: number, endpoint: number, transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): { start: () => { promise: Promise<Events.ZclPayload> }; cancel: () => void } {
        const payload = {
            address: networkAddress, endpoint, clusterID, commandIdentifier,
            transactionSequenceNumber,
        };

        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {start: waiter.start, cancel};
    }

    public waitFor(
        networkAddress: number, endpoint: number, frameType: Zcl.FrameType, direction: Zcl.Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): { promise: Promise<Events.ZclPayload>; cancel: () => void } {
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

    private waitressValidator(payload: Events.ZclPayload, matcher: WaitressMatcher): boolean {
        return payload.header &&
            (!matcher.address || payload.address === matcher.address) &&
            payload.endpoint === matcher.endpoint &&
            (!matcher.transactionSequenceNumber || payload.header.transactionSequenceNumber === matcher.transactionSequenceNumber) &&
            payload.clusterID === matcher.clusterID &&
            matcher.commandIdentifier === payload.header.commandIdentifier;
    }
}


export default EZSPAdapter;
