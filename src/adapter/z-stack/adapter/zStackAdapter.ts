import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters,
    StartResult,
} from '../../tstype';
import {ZnpVersion} from './tstype';
import * as Events from '../../events';
import Adapter from '../../adapter';
import {Znp, ZpiObject} from '../znp';
import StartZnp from './startZnp';
import {Constants as UnpiConstants} from '../unpi';
import {ZclFrame, FrameType} from '../../../zcl';
import {Queue, Waitress} from '../../../utils';
import * as Constants from '../constants';
import Debug from "debug";
import {Backup} from './backup';

const debug = Debug("zigbee-herdsman:controller:zStack");
const Subsystem = UnpiConstants.Subsystem;

interface IncomingMessageWaiter {
    networkAddress: number;
    endpoint: number;
    transactionSequenceNumber: number;
    resolve: Function;
    reject: Function;
    // eslint-disable-next-line
    timer?: any;
    timedout: boolean;
};

const DataConfirmCodeLookup: {[k: number]: string} = {
    205: 'No network route',
    233: 'MAC no ack',
    183: 'APS no ack',
    240: 'MAC transaction expired',
}

const DefaultTimeout = 10000;

interface WaitressMatcher {
    networkAddress: number;
    endpoint: number;
    transactionSequenceNumber: number;
    frameType: FrameType;
    clusterID: number;
};

class ZStackAdapter extends Adapter {
    private znp: Znp;
    private transactionID: number;
    private version: {product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string};
    private closing: boolean;
    private queue: Queue;
    private waitress: Waitress<Events.ZclDataPayload, WaitressMatcher>;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);
        this.znp = new Znp(this.serialPortOptions.path, this.serialPortOptions.baudRate, this.serialPortOptions.rtscts);

        this.transactionID = 0;
        this.closing = false;
        this.queue = new Queue(2);
        this.waitress = new Waitress<Events.ZclDataPayload, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);

        this.znp.on('received', this.onZnpRecieved.bind(this));
        this.znp.on('close', this.onZnpClose.bind(this));
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        await this.znp.open();

        this.version = (await this.znp.request(Subsystem.SYS, 'version', {})).payload;
        debug(`Detected znp version '${ZnpVersion[this.version.product]}' (${JSON.stringify(this.version)})`);

        return await StartZnp(this.znp, this.version.product, this.networkOptions, this.backupPath);
    }

    public async stop(): Promise<void> {
        this.closing = true;
        await this.znp.close();
    }

    public async getCoordinator(): Promise<Coordinator> {
        return this.queue.execute<Coordinator>(async () => {
            const activeEpRsp = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
            await this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0});
            const activeEp = await activeEpRsp;

            const deviceInfo = await this.znp.request(Subsystem.UTIL, 'getDeviceInfo', {});

            const endpoints = [];
            for (const endpoint of activeEp.payload.activeeplist) {
                const simpleDescRsp = this.znp.waitFor(
                    UnpiConstants.Type.AREQ, Subsystem.ZDO, 'simpleDescRsp'
                );

                this.znp.request(Subsystem.ZDO, 'simpleDescReq', {dstaddr: 0, nwkaddrofinterest: 0, endpoint});
                const simpleDesc = await simpleDescRsp;

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
            }
        });
    }

    public async permitJoin(seconds: number): Promise<void> {
        this.queue.execute<void>(async () => {
            const payload = {addrmode: 0x0F, dstaddr: 0xFFFC , duration: seconds, tcsignificance: 0 }
            await this.znp.request(Subsystem.ZDO, 'mgmtPermitJoinReq', payload);
        });
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        return {type: ZnpVersion[this.version.product], meta: this.version};
    }

    public async softReset(): Promise<void> {
        await this.znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
    }

    public async disableLED(): Promise<void> {
        await this.znp.request(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0});
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
        return this.queue.execute<NodeDescriptor>(async () => {
            const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'nodeDescRsp', {nwkaddr: networkAddress});
            this.znp.request(Subsystem.ZDO, 'nodeDescReq', {dstaddr: networkAddress, nwkaddrofinterest: networkAddress});
            const descriptor = await response;

            let type: DeviceType = 'Unknown'
            const logicalType = descriptor.payload.logicaltype_cmplxdescavai_userdescavai & 0x07;
            for (const [key, value] of Object.entries(Constants.ZDO.deviceLogicalType)) {
                if (value === logicalType) {
                    if (key === 'COORDINATOR') type = 'Coordinator';
                    else if (key === 'ROUTER') type = 'Router';
                    else if (key === 'ENDDEVICE') type = 'EndDevice';
                    break;
                }
            }

            return {manufacturerCode: descriptor.payload.manufacturercode, type}
        }, networkAddress);
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        return this.queue.execute<ActiveEndpoints>(async () => {
            const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp', {nwkaddr: networkAddress});
            this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: networkAddress, nwkaddrofinterest: networkAddress});
            const activeEp = await response;
            return {endpoints: activeEp.payload.activeeplist};
        }, networkAddress);
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        return this.queue.execute<SimpleDescriptor>(async () => {
            const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'simpleDescRsp', {nwkaddr: networkAddress, endpoint: endpointID});
            this.znp.request(Subsystem.ZDO, 'simpleDescReq', {dstaddr: networkAddress, nwkaddrofinterest: networkAddress, endpoint: endpointID});
            const descriptor = await response;
            return {
                profileID: descriptor.payload.profId,
                endpointID: descriptor.payload.endpoint,
                deviceID: descriptor.payload.deviceID,
                inputerClusters: descriptor.payload.inclusterlist,
                outputClusters: descriptor.payload.outclusterlist,
            }
        }, networkAddress);
    }

    public async sendZclFrameNetworkAddressWithResponse(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<Events.ZclDataPayload> {
        return this.queue.execute<Events.ZclDataPayload>(async () => {
            const response = this.waitress.waitFor({networkAddress, endpoint, transactionSequenceNumber: zclFrame.Header.transactionSequenceNumber, clusterID: zclFrame.ClusterID, frameType: zclFrame.Header.frameControl.frameType}, DefaultTimeout);
            await this.dataRequest(networkAddress, endpoint, 1, zclFrame.ClusterID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer());
            return await response;
        }, networkAddress);
    }

    public async sendZclFrameNetworkAddress(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<void> {
        return this.queue.execute<void>(async () => {
            await this.dataRequest(networkAddress, endpoint, 1, zclFrame.ClusterID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer());
        }, networkAddress);
    }

    public async sendZclFrameGroup(groupID: number, zclFrame: ZclFrame): Promise<void> {
        return this.queue.execute<void>(async () => {
            await this.dataRequestExtended(Constants.COMMON.addressMode.ADDR_GROUP, groupID, 0xFF, 1, zclFrame.ClusterID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer());
        });
    }

    public async lqi(networkAddress: number): Promise<LQI> {
        return this.queue.execute<LQI>(async (): Promise<LQI> => {
            const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'mgmtLqiRsp', {srcaddr: networkAddress});
            this.znp.request(Subsystem.ZDO, 'mgmtLqiReq', {dstaddr: networkAddress, startindex: 0});
            const result = await response;
            if (result.payload.status !== 0) {
                throw new Error(`LQI for '${networkAddress}' failed`);
            }

            const neighbors: {ieeeAddr: string; networkAddress: number; linkquality: number}[] = [];
            for (const entry of result.payload.neighborlqilist) {
                neighbors.push({
                    linkquality: entry.lqi,
                    networkAddress: entry.nwkAddr,
                    ieeeAddr: entry.extAddr,
                });
            }

            return {neighbors};
        }, networkAddress);
    }

    public async routingTable(networkAddress: number): Promise<RoutingTable> {
        return this.queue.execute<RoutingTable>(async (): Promise<RoutingTable> => {
            const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'mgmtRtgRsp', {srcaddr: networkAddress});
            this.znp.request(Subsystem.ZDO, 'mgmtRtgReq', {dstaddr: networkAddress, startindex: 0});
            const result = await response;
            if (result.payload.status !== 0) {
                throw new Error(`Routing table for '${networkAddress}' failed`);
            }

            const table: {destinationAddress: number; status: string; nextHop: number}[] = [];
            for (const entry of result.payload.routingtablelist) {
                table.push({
                    destinationAddress: entry.destNwkAddr,
                    status: entry.routeStatus,
                    nextHop: entry.nextHopNwkAddr,
                });
            }

            return {table};
        }, networkAddress);
    }

    public async bind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddress: string, destinationEndpoint: number): Promise<void> {
        return this.queue.execute<void>(async () => {
            const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'bindRsp', {srcaddr: destinationNetworkAddress});
            const payload = {
                dstaddr: destinationNetworkAddress,
                srcaddr: sourceIeeeAddress,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                dstaddrmode: Constants.COMMON.addressMode.ADDR_64BIT,
                dstaddress: destinationAddress,
                dstendpoint: destinationEndpoint,
            };

            this.znp.request(Subsystem.ZDO, 'bindReq', payload);
            await response;
        }, destinationNetworkAddress);
    }

    public async unbind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddress: string, destinationEndpoint: number): Promise<void> {
        return this.queue.execute<void>(async () => {
            const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'unbindRsp', {srcaddr: destinationNetworkAddress});
            const payload = {
                dstaddr: destinationNetworkAddress,
                srcaddr: sourceIeeeAddress,
                srcendpoint: sourceEndpoint,
                clusterid: clusterID,
                dstaddrmode: Constants.COMMON.addressMode.ADDR_64BIT,
                dstaddress: destinationAddress,
                dstendpoint: destinationEndpoint,
            };

            this.znp.request(Subsystem.ZDO, 'unbindReq', payload);
            await response;
        }, destinationNetworkAddress);
    }

    public removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        return this.queue.execute<void>(async () => {
            const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'mgmtLeaveRsp', {srcaddr: networkAddress});
            const payload = {
                dstaddr: networkAddress,
                deviceaddress: ieeeAddr,
                removechildrenRejoin: 0,
            };

            this.znp.request(Subsystem.ZDO, 'mgmtLeaveReq', payload);
            await response;
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
            } else if (object.command === 'leaveInd') {
                const payload: Events.DeviceLeavePayload = {
                    networkAddress: object.payload.srcaddr,
                    ieeeAddr: object.payload.extaddr,
                };

                this.emit(Events.Events.deviceLeave, payload);
            }
        } else if (object.subsystem === Subsystem.AF) {
            if (object.command === 'incomingMsg' || object.command === 'incomingMsgExt') {
                const payload: Events.ZclDataPayload = this.incomingMsgToZclDataPayload(object);
                this.waitress.resolve(payload);
                this.emit(Events.Events.zclData, payload);
            }
        }
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        const result = await this.znp.request(Subsystem.ZDO, 'extNwkInfo', {});
        return {panID: result.payload.panid, extendedPanID: result.payload.extendedpanid, channel: result.payload.channel};
    }

    public async supportsBackup(): Promise<boolean> {
        return this.version.product !== ZnpVersion.zStack12;
    }

    public async backup(): Promise<BackupType> {
        return Backup(this.znp);
    }

    /**
     * Private methods
     */
    private async dataRequest(destinationAddress: number, destinationEndpoint: number, sourceEndpoint: number, clusterID: number, radius: number, data: Buffer): Promise<ZpiObject> {
        const transactionID = this.nextTransactionID()
        const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.AF, 'dataConfirm', {transid: transactionID});

        await this.znp.request(Subsystem.AF, 'dataRequest', {
            dstaddr: destinationAddress,
            destendpoint: destinationEndpoint,
            srcendpoint: sourceEndpoint,
            clusterid: clusterID,
            transid: transactionID,
            options: 0, // TODO: why was this here? Constants.AF.options.ACK_REQUEST | Constants.AF.options.DISCV_ROUTE,
            radius: radius,
            len: data.length,
            data: data,
        });

        const dataConfirm =  await response;

        if (dataConfirm.payload.status !== 0) {
            throw new Error(`Data request failed with error: '${DataConfirmCodeLookup[dataConfirm.payload.status] || 'unknown'}' (${dataConfirm.payload.status})`)
        }

        return dataConfirm;
    };

    private async dataRequestExtended(addressMode: number, destinationAddressOrGroupID: number | string, destinationEndpoint: number, sourceEndpoint: number, clusterID: number, radius: number, data: Buffer): Promise<ZpiObject> {
        const transactionID = this.nextTransactionID()
        const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.AF, 'dataConfirm', {transid: transactionID});

        await this.znp.request(Subsystem.AF, 'dataRequestExt', {
            dstaddrmode: addressMode,
            dstaddr: this.toAddressString(destinationAddressOrGroupID),
            destendpoint: destinationEndpoint,
            dstpanid: 0,
            srcendpoint: sourceEndpoint,
            clusterid: clusterID,
            transid: transactionID,
            options: 0, // TODO: why was this here? Constants.AF.options.DISCV_ROUTE,
            radius,
            len: data.length,
            data: data,
        });

        const dataConfirm =  await response;

        if (dataConfirm.payload.status !== 0) {
            throw new Error(`Data request failed with error: '${DataConfirmCodeLookup[dataConfirm.payload.status] || 'unknown'}' (${dataConfirm.payload.status})`)
        }

        return dataConfirm;
    };

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }

    private toAddressString(address: number | string): string {
        let addressString;

        if (typeof address === 'string') {
            if (address.toLowerCase().startsWith('0x')) {
                addressString = address.slice(2, address.length).toLowerCase();
            } else {
                addressString = address.toLowerCase();
            }
        } else {
            addressString = address.toString(16);
        }

        for (let i = addressString.length; i < 16; i++) {
            addressString = '0' + addressString;
        }

        return `0x${addressString}`;
    }

    private incomingMsgToZclDataPayload(object: ZpiObject): Events.ZclDataPayload {
        return {
            frame: ZclFrame.fromBuffer(object.payload.clusterid, object.payload.data),
            networkAddress: object.payload.srcaddr,
            endpoint: object.payload.srcendpoint,
            linkquality: object.payload.linkquality,
            groupID: object.payload.groupid,
        };
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return `Timeout - ${matcher.networkAddress} - ${matcher.endpoint} - ${matcher.transactionSequenceNumber} after ${timeout}ms`;
    }

    private waitressValidator(payload: Events.ZclDataPayload, matcher: WaitressMatcher): boolean {
        return payload.networkAddress === matcher.networkAddress && payload.endpoint === matcher.endpoint && payload.frame.Header.transactionSequenceNumber === matcher.transactionSequenceNumber &&
            payload.frame.ClusterID === matcher.clusterID && matcher.frameType === payload.frame.Header.frameControl.frameType;
    }
}

export default ZStackAdapter;