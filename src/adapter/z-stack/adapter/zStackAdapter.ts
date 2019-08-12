import {NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor, DeviceType, ActiveEndpoints, SimpleDescriptor} from '../../tstype';
import {ZnpVersion} from './tstype';
import {Events, DeviceJoinedPayload, ZclDataPayload} from '../../events';
import Adapter from '../../adapter';
import {Znp, ZpiObject} from '../znp';
import StartZnp from './startZnp';
import {Constants as UnpiConstants} from '../unpi';
import {ZclFrame} from '../../../zcl';
import * as Constants from '../constants';

const debug = require('debug')("zigbee-herdsman:controller:zStack");
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

class ZStackAdapter extends Adapter {
    private znp: Znp;
    private transactionID: number;
    private version: {product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string};
    private incomingMessageWaiter: IncomingMessageWaiter[];
    private closing: boolean;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);
        this.znp = new Znp(this.serialPortOptions.path, this.serialPortOptions.baudRate, this.serialPortOptions.rtscts);

        this.transactionID = 0;
        this.incomingMessageWaiter = [];
        this.closing = false;

        this.onZnpRecieved = this.onZnpRecieved.bind(this);
        this.onZnpClose = this.onZnpClose.bind(this);

        this.znp.on('received', this.onZnpRecieved);
        this.znp.on('close', this.onZnpClose);
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<void> {
        // TODO: gracefully close when on error
        await this.znp.open();

        this.version = (await this.znp.request(Subsystem.SYS, 'version', {})).payload;
        debug(`Detected znp version '${ZnpVersion[this.version.product]}' (${JSON.stringify(this.version)})`);

        await StartZnp(this.znp, this.version.product, this.networkOptions, this.backupPath);
    }

    public async stop(): Promise<void> {
        this.closing = true;
        await this.znp.close();
    }

    public async getCoordinator(): Promise<Coordinator> {
        const activeEpRsp = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
        await this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: 0, nwkaddrofinterest: 0});
        const activeEp = await activeEpRsp;

        const deviceInfo = await this.znp.request(Subsystem.UTIL, 'getDeviceInfo', {});

        const endpoints = [];
        for (let endpoint of activeEp.payload.activeeplist) {
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
    }

    public async permitJoin(seconds: number): Promise<void> {
        const payload = {addrmode: 0x0F, dstaddr: 0xFFFC , duration: seconds, tcsignificance: 0 }
        await this.znp.request(Subsystem.ZDO, 'mgmtPermitJoinReq', payload);
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
        const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'nodeDescRsp', {nwkaddr: networkAddress});
        this.znp.request(Subsystem.ZDO, 'nodeDescReq', {dstaddr: networkAddress, nwkaddrofinterest: networkAddress});
        const descriptor = await response;

        let type: DeviceType = 'Unknown'
        const logicalType = descriptor.payload.logicaltype_cmplxdescavai_userdescavai & 0x07;
        for (let [key, value] of Object.entries(Constants.ZDO.deviceLogicalType)) {
            if (value === logicalType) {
                if (key === 'COORDINATOR') type = 'Coordinator';
                else if (key === 'ROUTER') type = 'Router';
                else if (key === 'ENDDEVICE') type = 'EndDevice';
            }
        }

        return {manufacturerCode: descriptor.payload.manufacturercode, type}
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp', {nwkaddr: networkAddress});
        this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: networkAddress, nwkaddrofinterest: networkAddress});
        const activeEp = await response;
        return {endpoints: activeEp.payload.activeeplist};
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
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
    }

    public async sendZclFrameNetworkAddressWithResponse(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<ZclDataPayload> {
        const response = this.waitForIncomingMessage(networkAddress, endpoint, zclFrame.Header.transactionSequenceNumber);
        await this.sendZclFrameNetworkAddress(networkAddress, endpoint, zclFrame);
        return await response;
    }

    public async sendZclFrameNetworkAddress(networkAddress: number, endpoint: number, zclFrame: ZclFrame): Promise<void> {
        await this.dataRequest(networkAddress, endpoint, 1, zclFrame.ClusterID, Constants.AF.DEFAULT_RADIUS, zclFrame.toBuffer());
    }

    public async bind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddress: string, destinationEndpoint: number): Promise<void> {
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
    }

    public async unbind(destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number, clusterID: number, destinationAddress: string, destinationEndpoint: number): Promise<void> {
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
    }

    /**
     * Event handlers
     */
    public onZnpClose(): void {
        if (!this.closing) {
            this.emit(Events.Disconnected);
        }
    }

    public onZnpRecieved(object: ZpiObject): void {
        if (object.type !== UnpiConstants.Type.AREQ) {
            return;
        }

        if (object.subsystem === Subsystem.ZDO) {
            if (object.command === 'tcDeviceInd') {
                const payload: DeviceJoinedPayload = {
                    networkAddress: object.payload.nwkaddr,
                    ieeeAddr: object.payload.extaddr,
                };

                this.emit(Events.DeviceJoined, payload);
            }
        } else if (object.subsystem === Subsystem.AF) {
            if (object.command === 'incomingMsg') {
                const payload: ZclDataPayload = this.incomingMsgToZclDataPayload(object);
                this.resolveIncomingMessageWaiters(payload);
                this.emit(Events.ZclData, payload);
            }
        }
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

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }

    private incomingMsgToZclDataPayload(object: ZpiObject): ZclDataPayload {
        return {
            frame: ZclFrame.fromBuffer(object.payload.clusterid, object.payload.data),
            networkAddress: object.payload.srcaddr,
            endpoint: object.payload.srcendpoint,
            linkQuality: object.payload.linkquality,
        };
    }

    private resolveIncomingMessageWaiters(payload: ZclDataPayload): void {
        for (let index = 0; index < this.incomingMessageWaiter.length; index++) {
            const waiter = this.incomingMessageWaiter[index];
            const match = payload.networkAddress === waiter.networkAddress && payload.endpoint === waiter.endpoint && payload.frame.Header.transactionSequenceNumber === waiter.transactionSequenceNumber;

            if (waiter.timedout) {
                this.incomingMessageWaiter.splice(index, 1);
            } else if (match) {
                clearTimeout(waiter.timer);
                waiter.resolve(payload);
                this.incomingMessageWaiter.splice(index, 1);
            }
        }
    }

    private waitForIncomingMessage(networkAddress: number, endpoint: number, transactionSequenceNumber: number): Promise<ZclDataPayload> {
        return new Promise((resolve, reject): void => {
            const object: IncomingMessageWaiter = {networkAddress, endpoint, transactionSequenceNumber, resolve, reject, timedout: false};
            const timeout = 10;

            object.timer = setTimeout((): void => {
                const message = `Timeout - ${networkAddress} - ${endpoint} - ${transactionSequenceNumber} after ${timeout}s`;
                object.timedout = true;
                debug(message);
                reject(new Error(message));
            }, timeout * 1000);

            this.incomingMessageWaiter.push(object);
        });
    }
}

export default ZStackAdapter;