import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters,
    StartResult, LQINeighbor, RoutingTableEntry, AdapterOptions,
} from '../../tstype';
import {ZnpVersion} from './tstype';
import * as Events from '../../events';
import Adapter from '../../adapter';
import {Znp, ZpiObject} from '../znp';
import StartZnp from './startZnp';
import {Constants as UnpiConstants} from '../unpi';
import {ZclFrame, FrameType, Direction, Foundation} from '../../../zcl';
import {Queue, Waitress, Wait} from '../../../utils';
import * as Constants from '../constants';
import Debug from "debug";
import {Backup} from './backup';

const debug = Debug("zigbee-herdsman:adapter:zStack:adapter");
const Subsystem = UnpiConstants.Subsystem;
const Type = UnpiConstants.Type;

const DataConfirmErrorCodeLookup: {[k: number]: string} = {
    183: 'APS no ack',
    205: 'No network route',
    225: 'MAC channel access failure',
    233: 'MAC no ack',
    240: 'MAC transaction expired',
};

interface WaitressMatcher {
    address: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    frameType: FrameType;
    clusterID: number;
    commandIdentifier: number;
    direction: number;
};

class DataConfirmError extends Error {
    public code: number;
    constructor (code: number) {
        const message = `Data request failed with error: '${DataConfirmErrorCodeLookup[code]}' (${code})`;
        super(message);
        this.code = code;
    }
}

class ZStackAdapter extends Adapter {
    private znp: Znp;
    private transactionID: number;
    private version: {
        product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string;
    };
    private closing: boolean;
    private queue: Queue;
    private waitress: Waitress<Events.ZclDataPayload, WaitressMatcher>;

    public constructor(networkOptions: NetworkOptions,
        serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {

        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.znp = new Znp(this.serialPortOptions.path, this.serialPortOptions.baudRate, this.serialPortOptions.rtscts);

        this.transactionID = 0;
        this.closing = false;
        this.waitress = new Waitress<Events.ZclDataPayload, WaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter
        );

        this.znp.on('received', this.onZnpRecieved.bind(this));
        this.znp.on('close', this.onZnpClose.bind(this));
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        await this.znp.open();

        try {
            await this.znp.request(Subsystem.SYS, 'ping', {capabilities: 1});
        } catch (e) {
            throw new Error(`Failed to connect to the adapter (${e})`);
        }

        // Old firmware did not support version, assume it's Z-Stack 1.2 for now.
        try {
            this.version = (await this.znp.request(Subsystem.SYS, 'version', {})).payload;
        } catch (e) {
            debug(`Failed to get zStack version, assuming 1.2`);
            this.version = {"transportrev":2, "product":0, "majorrel":2, "minorrel":0, "maintrel":0, "revision":""};
        }

        const concurrent = this.adapterOptions && this.adapterOptions.concurrent ?
            this.adapterOptions.concurrent :
            (this.version.product === ZnpVersion.zStack3x0 ? 16 : 2);

        debug(`Adapter concurrent: ${concurrent}`);

        this.queue = new Queue(concurrent);

        debug(`Detected znp version '${ZnpVersion[this.version.product]}' (${JSON.stringify(this.version)})`);

        return StartZnp(this.znp, this.version.product, this.networkOptions, this.backupPath);
    }

    public async stop(): Promise<void> {
        this.closing = true;
        await this.znp.close();
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return Znp.isValidPath(path);
    }

    public static async autoDetectPath(): Promise<string> {
        return Znp.autoDetectPath();
    }

    public async getCoordinator(): Promise<Coordinator> {
        return this.queue.execute<Coordinator>(async () => {
            const activeEpRsp = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
            await this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0});
            const activeEp = await activeEpRsp.promise;

            const deviceInfo = await this.znp.request(Subsystem.UTIL, 'getDeviceInfo', {});

            const endpoints = [];
            for (const endpoint of activeEp.payload.activeeplist) {
                const simpleDescRsp = this.znp.waitFor(
                    UnpiConstants.Type.AREQ, Subsystem.ZDO, 'simpleDescRsp', {endpoint}
                );

                this.znp.request(Subsystem.ZDO, 'simpleDescReq', {dstaddr: 0, nwkaddrofinterest: 0, endpoint});
                const simpleDesc = await simpleDescRsp.promise;

                endpoints.push({
                    ID: simpleDesc.payload.endpoint,
                    profileID: simpleDesc.payload.profileid,
                    deviceID: simpleDesc.payload.deviceid,
                    inputClusters: simpleDesc.payload.inclusterlist,
                    outputClusters: simpleDesc.payload.outclusterlist,
                });
            }

            return {
                networkAddress: 0,
                manufacturerID: 0,
                ieeeAddr: deviceInfo.payload.ieeeaddr,
                endpoints,
            };
        });
    }

    public async permitJoin(seconds: number, networkAddress: number): Promise<void> {
        const addrmode = networkAddress === null ? 0x0F : 0x02;
        const dstaddr = networkAddress || 0xFFFC;
        await this.queue.execute<void>(async () => {
            const payload = {addrmode, dstaddr , duration: seconds, tcsignificance: 0};
            await this.znp.request(Subsystem.ZDO, 'mgmtPermitJoinReq', payload);
        });
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        return {type: ZnpVersion[this.version.product], meta: this.version};
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        if (type === 'soft') {
            await this.znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
        } else {
            await this.znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.HARD});
        }
    }

    public async supportsLED(): Promise<boolean> {
        return this.version.product !== ZnpVersion.zStack3x0;
    }

    public async setLED(enabled: boolean): Promise<void> {
        await this.znp.request(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: enabled ? 1 : 0});
    }

    private async discoverRoute(networkAddress: number): Promise<void> {
        const payload =  {dstAddr: networkAddress, options: 0, radius: Constants.AF.DEFAULT_RADIUS};
        await this.znp.request(Subsystem.ZDO, 'extRouteDisc', payload);
        await Wait(3000);
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
        return this.queue.execute<NodeDescriptor>(async () => {
            try {
                const result = await this.nodeDescriptorInternal(networkAddress);
                return result;
            } catch (error) {
                debug(`Node descriptor request for '${networkAddress}' failed (${error}), retry`);
                // Doing a route discovery after simple descriptor request fails makes it succeed sometimes.
                // https://github.com/Koenkk/zigbee2mqtt/issues/3276
                await this.discoverRoute(networkAddress);
                const result = await this.nodeDescriptorInternal(networkAddress);
                return result;
            }
        }, networkAddress);
    }

    private async nodeDescriptorInternal(networkAddress: number): Promise<NodeDescriptor> {
        const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'nodeDescRsp', {nwkaddr: networkAddress});
        const payload = {dstaddr: networkAddress, nwkaddrofinterest: networkAddress};
        this.znp.request(Subsystem.ZDO, 'nodeDescReq', payload);
        const descriptor = await response.promise;

        let type: DeviceType = 'Unknown';
        const logicalType = descriptor.payload.logicaltype_cmplxdescavai_userdescavai & 0x07;
        for (const [key, value] of Object.entries(Constants.ZDO.deviceLogicalType)) {
            if (value === logicalType) {
                if (key === 'COORDINATOR') type = 'Coordinator';
                else if (key === 'ROUTER') type = 'Router';
                else if (key === 'ENDDEVICE') type = 'EndDevice';
                break;
            }
        }

        return {manufacturerCode: descriptor.payload.manufacturercode, type};
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        return this.queue.execute<ActiveEndpoints>(async () => {
            const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'activeEpRsp', {nwkaddr: networkAddress});
            const payload = {dstaddr: networkAddress, nwkaddrofinterest: networkAddress};
            this.znp.request(Subsystem.ZDO, 'activeEpReq', payload);
            const activeEp = await response.promise;
            return {endpoints: activeEp.payload.activeeplist};
        }, networkAddress);
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        return this.queue.execute<SimpleDescriptor>(async () => {
            const responsePayload = {nwkaddr: networkAddress, endpoint: endpointID};
            const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'simpleDescRsp', responsePayload);
            const payload = {dstaddr: networkAddress, nwkaddrofinterest: networkAddress, endpoint: endpointID};
            this.znp.request(Subsystem.ZDO, 'simpleDescReq', payload);
            const descriptor = await response.promise;
            return {
                profileID: descriptor.payload.profileid,
                endpointID: descriptor.payload.endpoint,
                deviceID: descriptor.payload.deviceid,
                inputClusters: descriptor.payload.inclusterlist,
                outputClusters: descriptor.payload.outclusterlist,
            };
        }, networkAddress);
    }

    public async sendZclFrameToEndpoint(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        return this.queue.execute<Events.ZclDataPayload>(async () => {
            return this.sendZclFrameToEndpointInternal(
                networkAddress, endpoint, zclFrame, timeout, true
            );
        }, networkAddress);
    }

    private async sendZclFrameToEndpointInternal(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number, firstAttempt: boolean,
    ): Promise<Events.ZclDataPayload> {
        let response = null;
        const command = zclFrame.getCommand();
        if (command.hasOwnProperty('response')) {
            response = this.waitFor(
                networkAddress, endpoint, zclFrame.Header.frameControl.frameType, Direction.SERVER_TO_CLIENT,
                zclFrame.Header.transactionSequenceNumber, zclFrame.Cluster.ID, command.response, timeout
            );
        } else if (!zclFrame.Header.frameControl.disableDefaultResponse) {
            response = this.waitFor(
                networkAddress, endpoint, FrameType.GLOBAL, Direction.SERVER_TO_CLIENT,
                zclFrame.Header.transactionSequenceNumber, zclFrame.Cluster.ID, Foundation.defaultRsp.ID,
                timeout,
            );
        }

        try {
            await this.dataRequest(
                networkAddress, endpoint, 1, zclFrame.Cluster.ID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer(),
                timeout - 1000, 5
            );
        } catch (error) {
            if (response) {
                response.cancel();
            }

            throw error;
        }

        if (response !== null) {
            try {
                const result = await response.promise;
                return result;
            } catch (error) {
                if (firstAttempt) {
                    // Timeout could happen because of invalid route, rediscover and retry.
                    await this.discoverRoute(networkAddress);
                    return this.sendZclFrameToEndpointInternal(
                        networkAddress, endpoint, zclFrame, timeout, false
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
        return this.queue.execute<void>(async () => {
            await this.dataRequestExtended(
                Constants.COMMON.addressMode.ADDR_GROUP, groupID, 0xFF, 0, 1, zclFrame.Cluster.ID,
                Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer(), 3000, true
            );

            /**
             * As a group command is not confirmed and thus immidiately returns
             * (contrary to network address requests) we will give the
             * command some time to 'settle' in the network.
             */
            await Wait(200);
        });
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: ZclFrame, sourceEndpoint: number): Promise<void> {
        return this.queue.execute<void>(async () => {
            await this.dataRequestExtended(
                Constants.COMMON.addressMode.ADDR_16BIT, 0xFFFD, endpoint, 0, sourceEndpoint,
                zclFrame.Cluster.ID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer(), 3000, false, 0
            );

            /**
             * As a broadcast command is not confirmed and thus immidiately returns
             * (contrary to network address requests) we will give the
             * command some time to 'settle' in the network.
             */
            await Wait(200);
        });
    }

    public async lqi(networkAddress: number): Promise<LQI> {
        return this.queue.execute<LQI>(async (): Promise<LQI> => {
            const neighbors: LQINeighbor[] = [];

            // eslint-disable-next-line
            const request = async (startIndex: number): Promise<any> => {
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'mgmtLqiRsp', {srcaddr: networkAddress});
                this.znp.request(Subsystem.ZDO, 'mgmtLqiReq', {dstaddr: networkAddress, startindex: startIndex});
                const result = await response.promise;
                if (result.payload.status !== 0) {
                    throw new Error(`LQI for '${networkAddress}' failed`);
                }

                return result;
            };

            // eslint-disable-next-line
            const add = (list: any) => {
                for (const entry of list) {
                    neighbors.push({
                        linkquality: entry.lqi,
                        networkAddress: entry.nwkAddr,
                        ieeeAddr: entry.extAddr,
                        relationship: entry.relationship,
                        depth: entry.depth,
                    });
                }
            };

            let response = await request(0);
            add(response.payload.neighborlqilist);
            const size = response.payload.neighbortableentries;
            let nextStartIndex = response.payload.neighborlqilist.length;

            while (neighbors.length < size) {
                response = await request(nextStartIndex);
                add(response.payload.neighborlqilist);
                nextStartIndex += response.payload.neighborlqilist.length;
            }

            return {neighbors};
        }, networkAddress);
    }

    public async routingTable(networkAddress: number): Promise<RoutingTable> {
        return this.queue.execute<RoutingTable>(async (): Promise<RoutingTable> => {
            const table: RoutingTableEntry[] = [];

            // eslint-disable-next-line
            const request = async (startIndex: number): Promise<any> => {
                const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'mgmtRtgRsp', {srcaddr: networkAddress});
                this.znp.request(Subsystem.ZDO, 'mgmtRtgReq', {dstaddr: networkAddress, startindex: startIndex});
                const result = await response.promise;
                if (result.payload.status !== 0) {
                    throw new Error(`Routing table for '${networkAddress}' failed`);
                }

                return result;
            };

            // eslint-disable-next-line
            const add = (list: any) => {
                for (const entry of list) {
                    table.push({
                        destinationAddress: entry.destNwkAddr,
                        status: entry.routeStatus,
                        nextHop: entry.nextHopNwkAddr,
                    });
                }
            };

            let response = await request(0);
            add(response.payload.routingtablelist);
            const size = response.payload.routingtableentries;
            let nextStartIndex = response.payload.routingtablelist.length;

            while (table.length < size) {
                response = await request(nextStartIndex);
                add(response.payload.routingtablelist);
                nextStartIndex += response.payload.routingtablelist.length;
            }

            return {table};
        }, networkAddress);
    }

    public async bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void> {
        return this.queue.execute<void>(async () => {
            const responsePayload = {srcaddr: destinationNetworkAddress};
            const response = this.znp.waitFor(Type.AREQ, Subsystem.ZDO, 'bindRsp', responsePayload);
            const payload = {
                dstaddr: destinationNetworkAddress,
                srcaddr: sourceIeeeAddress,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                dstaddrmode: type === 'group' ?
                    Constants.COMMON.addressMode.ADDR_GROUP : Constants.COMMON.addressMode.ADDR_64BIT,
                dstaddress: this.toAddressString(destinationAddressOrGroup),
                dstendpoint: type === 'group' ? 0xFF : destinationEndpoint,
            };

            this.znp.request(Subsystem.ZDO, 'bindReq', payload);
            await response.promise;
        }, destinationNetworkAddress);
    }

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {
        return this.queue.execute<void>(async () => {
            const response = this.znp.waitFor(
                Type.AREQ, Subsystem.ZDO, 'unbindRsp', {srcaddr: destinationNetworkAddress}
            );

            const payload = {
                dstaddr: destinationNetworkAddress,
                srcaddr: sourceIeeeAddress,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                dstaddrmode: type === 'group' ?
                    Constants.COMMON.addressMode.ADDR_GROUP : Constants.COMMON.addressMode.ADDR_64BIT,
                dstaddress: this.toAddressString(destinationAddressOrGroup),
                dstendpoint: type === 'group' ? 0xFF : destinationEndpoint,
            };

            this.znp.request(Subsystem.ZDO, 'unbindReq', payload);
            await response.promise;
        }, destinationNetworkAddress);
    }

    public removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        return this.queue.execute<void>(async () => {
            const response = this.znp.waitFor(
                UnpiConstants.Type.AREQ, Subsystem.ZDO, 'mgmtLeaveRsp', {srcaddr: networkAddress}
            );

            const payload = {
                dstaddr: networkAddress,
                deviceaddress: ieeeAddr,
                removechildrenRejoin: 0,
            };

            this.znp.request(Subsystem.ZDO, 'mgmtLeaveReq', payload);
            await response.promise;
        }, networkAddress);
    }

    /**
     * Event handlers
     */
    public onZnpClose(): void {
        if (!this.closing) {
            this.emit(Events.Events.disconnected);
        }
    }

    public onZnpRecieved(object: ZpiObject): void {
        if (object.type !== UnpiConstants.Type.AREQ) {
            return;
        }

        if (object.subsystem === Subsystem.ZDO) {
            if (object.command === 'tcDeviceInd') {
                const payload: Events.DeviceJoinedPayload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.extaddr,
                };

                this.emit(Events.Events.deviceJoined, payload);
            } else if (object.command === 'endDeviceAnnceInd') {
                const payload: Events.DeviceAnnouncePayload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.ieeeaddr,
                };

                this.emit(Events.Events.deviceAnnounce, payload);
            } else {
                /* istanbul ignore else */
                if (object.command === 'leaveInd') {
                    const payload: Events.DeviceLeavePayload = {
                        networkAddress: object.payload.srcaddr,
                        ieeeAddr: object.payload.extaddr,
                    };

                    this.emit(Events.Events.deviceLeave, payload);
                }
            }
        } else {
            /* istanbul ignore else */
            if (object.subsystem === Subsystem.AF) {
                /* istanbul ignore else */
                if (object.command === 'incomingMsg' || object.command === 'incomingMsgExt') {
                    try {
                        const payload: Events.ZclDataPayload = {
                            frame: ZclFrame.fromBuffer(object.payload.clusterid, object.payload.data),
                            address: object.payload.srcaddr,
                            endpoint: object.payload.srcendpoint,
                            linkquality: object.payload.linkquality,
                            groupID: object.payload.groupid,
                        };

                        this.waitress.resolve(payload);
                        this.emit(Events.Events.zclData, payload);
                    } catch (error) {
                        const payload: Events.RawDataPayload = {
                            clusterID: object.payload.clusterid,
                            data: object.payload.data,
                            address: object.payload.srcaddr,
                            endpoint: object.payload.srcendpoint,
                            linkquality: object.payload.linkquality,
                            groupID: object.payload.groupid,
                        };

                        this.emit(Events.Events.rawData, payload);
                    }
                }
            }
        }
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        const result = await this.znp.request(Subsystem.ZDO, 'extNwkInfo', {});
        return {
            panID: result.payload.panid, extendedPanID: result.payload.extendedpanid,
            channel: result.payload.channel
        };
    }

    public async supportsBackup(): Promise<boolean> {
        return this.version.product !== ZnpVersion.zStack12;
    }

    public async backup(): Promise<BackupType> {
        return Backup(this.znp);
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        return this.queue.execute<void>(async () => {
            await this.znp.request(Subsystem.AF, 'interPanCtl', {cmd: 1, data: [channel]});

            // Make sure that endpoint 12 is registered to proxy the InterPAN messages.
            await this.znp.request(Subsystem.AF, 'interPanCtl', {cmd: 2, data: [12]});
        });
    }

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: ZclFrame, ieeeAddr: string): Promise<void> {
        return this.queue.execute<void>(async () => {
            await this.dataRequestExtended(
                Constants.COMMON.addressMode.ADDR_64BIT, ieeeAddr, 0xFE, 0xFFFF,
                12, zclFrame.Cluster.ID, 30, zclFrame.toBuffer(), 10000, false,
            );
        });
    }

    public async sendZclFrameInterPANBroadcast(
        zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        return this.queue.execute<Events.ZclDataPayload>(async () => {
            const command = zclFrame.getCommand();
            if (!command.hasOwnProperty('response')) {
                throw new Error(`Command '${command.name}' has no response, cannot wait for response`);
            }

            const response = this.waitFor(
                null, 0xFE, zclFrame.Header.frameControl.frameType, Direction.SERVER_TO_CLIENT, null,
                zclFrame.Cluster.ID, command.response, timeout
            );

            try {
                await this.dataRequestExtended(
                    Constants.COMMON.addressMode.ADDR_16BIT, 0xFFFF, 0xFE, 0xFFFF,
                    12, zclFrame.Cluster.ID, 30, zclFrame.toBuffer(), 10000, false,
                );
            } catch (error) {
                response.cancel();
                throw error;
            }

            return response.promise;
        });
    }

    public async restoreChannelInterPAN(): Promise<void> {
        return this.queue.execute<void>(async () => {
            await this.znp.request(Subsystem.AF, 'interPanCtl', {cmd: 0, data: []});
            // Give adapter some time to restore, otherwise stuff crashes
            await Wait(1000);
        });
    }

    public async setTransmitPower(value: number): Promise<void> {
        return this.queue.execute<void>(async () => {
            await this.znp.request(Subsystem.SYS, 'stackTune', {operation: 0, value});
        });
    }

    public waitFor(
        networkAddress: number, endpoint: number, frameType: FrameType, direction: Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): {promise: Promise<Events.ZclDataPayload>; cancel: () => void} {
        const payload = {
            address: networkAddress, endpoint, clusterID, commandIdentifier, frameType, direction,
            transactionSequenceNumber,
        };

        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {promise: waiter.promise, cancel};
    }

    /**
     * Private methods
     */
    private async dataRequest(
        destinationAddress: number, destinationEndpoint: number, sourceEndpoint: number, clusterID: number,
        radius: number, data: Buffer, timeout: number, attemptsLeft: number,
    ): Promise<ZpiObject> {
        const transactionID = this.nextTransactionID();
        const response = this.znp.waitFor(
            Type.AREQ, Subsystem.AF, 'dataConfirm', {transid: transactionID}, timeout
        );

        try {
            await this.znp.request(Subsystem.AF, 'dataRequest', {
                dstaddr: destinationAddress,
                destendpoint: destinationEndpoint,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                transid: transactionID,
                options: 0, // TODO: why was this here? Constants.AF.options.ACK_REQUEST | DISCV_ROUTE,
                radius: radius,
                len: data.length,
                data: data,
            });
        } catch (error) {
            this.znp.removeWaitFor(response.ID);
            throw error;
        }

        const dataConfirm = await response.promise;
        if (dataConfirm.payload.status !== 0) {
            if ([225, 240].includes(dataConfirm.payload.status) && attemptsLeft > 0) {
                /**
                 * 225: When many commands at once are executed we can end up in a MAC channel access failure
                 * error. This is because there is too much traffic on the network.
                 * Retry this command once after a cooling down period.
                 * 240: Mac layer is sleeping, try a few more times
                 */
                await Wait(2000);
                return this.dataRequest(
                    destinationAddress, destinationEndpoint, sourceEndpoint, clusterID, radius, data, timeout,
                    attemptsLeft - 1
                );
            } else if ([205, 233].includes(dataConfirm.payload.status) && attemptsLeft > 0) {
                // 205: no network route => rediscover route
                // 233: route may be corrupted
                await this.discoverRoute(destinationAddress);
                return this.dataRequest(
                    destinationAddress, destinationEndpoint, sourceEndpoint, clusterID, radius, data, timeout, 0
                );
            } else {
                throw new DataConfirmError(dataConfirm.payload.status);
            }
        }

        return dataConfirm;
    };

    private async dataRequestExtended(
        addressMode: number, destinationAddressOrGroupID: number | string, destinationEndpoint: number, panID: number,
        sourceEndpoint: number, clusterID: number, radius: number, data: Buffer, timeout: number, confirmation: boolean,
        attemptsLeft = 5,
    ): Promise<ZpiObject> {
        const transactionID = this.nextTransactionID();
        const response = confirmation ?
            this.znp.waitFor(Type.AREQ, Subsystem.AF, 'dataConfirm', {transid: transactionID}, timeout) : null;

        try {
            await this.znp.request(Subsystem.AF, 'dataRequestExt', {
                dstaddrmode: addressMode,
                dstaddr: this.toAddressString(destinationAddressOrGroupID),
                destendpoint: destinationEndpoint,
                dstpanid: panID,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                transid: transactionID,
                options: 0, // TODO: why was this here? Constants.AF.options.DISCV_ROUTE,
                radius,
                len: data.length,
                data: data,
            });
        } catch (error) {
            if (confirmation) {
                this.znp.removeWaitFor(response.ID);
            }

            throw error;
        }

        if (confirmation) {
            const dataConfirm = await response.promise;
            if (dataConfirm.payload.status !== 0) {
                if (dataConfirm.payload.status === 225 && attemptsLeft > 0) {
                    /**
                     * 225: When many commands at once are executed we can end up in a MAC channel access failure
                     * error. This is because there is too much traffic on the network.
                     * Retry this command once after a cooling down period.
                     */
                    await Wait(2000);
                    return this.dataRequestExtended(
                        addressMode, destinationAddressOrGroupID, destinationEndpoint, panID, sourceEndpoint, clusterID,
                        radius, data, timeout, confirmation, attemptsLeft - 1,
                    );
                } else {
                    throw new DataConfirmError(dataConfirm.payload.status);
                }
            }

            return dataConfirm;
        }
    };

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }

    private toAddressString(address: number | string): string {
        if (typeof address === 'number') {
            let addressString = address.toString(16);

            for (let i = addressString.length; i < 16; i++) {
                addressString = '0' + addressString;
            }

            return `0x${addressString}`;
        } else {
            return address.toString();
        }
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
            matcher.frameType === payload.frame.Header.frameControl.frameType &&
            matcher.commandIdentifier === payload.frame.Header.commandIdentifier &&
            matcher.direction === payload.frame.Header.frameControl.direction;
    }
}

export default ZStackAdapter;
