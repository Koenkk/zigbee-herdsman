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

class ZStackAdapter extends Adapter {
    private znp: Znp;
    private transactionID: number;
    private version: {product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string};

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);
        this.znp = new Znp(this.serialPortOptions.path, this.serialPortOptions.baudRate, this.serialPortOptions.rtscts);

        this.transactionID = 0;

        this.onZnpRecieved = this.onZnpRecieved.bind(this);
        this.onZnpClose = this.onZnpClose.bind(this);

        this.znp.on('received', this.onZnpRecieved);
        this.znp.on('close', this.onZnpClose);
    }

    public async start(): Promise<void> {
        // TODO: gracefully close when on error
        await this.znp.open();

        this.version = (await this.znp.request(Subsystem.SYS, 'version', {})).payload;
        debug(`Detected znp version '${ZnpVersion[this.version.product]}' (${JSON.stringify(this.version)})`);

        await StartZnp(this.znp, this.version.product, this.networkOptions, this.backupPath);
    }

    public async stop(): Promise<void> {
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
                const payload: ZclDataPayload = {
                    frame:  ZclFrame.fromBuffer(object.payload.clusterid, object.payload.data),
                    networkAddress: object.payload.srcaddr,
                }

                this.emit(Events.ZclData, payload);
            }
        }
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        return {type: ZnpVersion[this.version.product], meta: this.version};
    }

    public onZnpClose(): void {
        // TODO
    }

    public async softReset(): Promise<void> {
        await this.znp.request(Subsystem.SYS, 'resetReq', {type: Constants.SYS.resetType.SOFT});
    }

    public async disableLED(): Promise<void> {
        await this.znp.request(Subsystem.UTIL, 'ledControl', {ledid: 3, mode: 0});
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
        const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'nodeDescRsp');
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
        const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'activeEpRsp');
        this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: networkAddress, nwkaddrofinterest: networkAddress});
        const activeEp = await response;
        return {endpoints: activeEp.payload.activeeplist};
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        const response = this.znp.waitFor(UnpiConstants.Type.AREQ, Subsystem.ZDO, 'simpleDescRsp');
        this.znp.request(Subsystem.ZDO, 'activeEpReq', {dstaddr: networkAddress, nwkaddrofinterest: networkAddress, endpoint: endpointID});
        const descriptor = await response;
        return {
            profileID: descriptor.payload.profId,
            endpointID: descriptor.payload.endpoint,
            deviceID: descriptor.payload.deviceID,
            inputerClusters: descriptor.payload.inclusterlist,
            outputClusters: descriptor.payload.outclusterlist,
        }
    }

    public async dataRequestEndpoint(networkAddress: number, endpoint: number, clusterID: number) {
        return await this.dataRequest(networkAddress, endpoint, 1, clusterID, )
    }

    private async dataRequest(destinationAddress: number, destinationEndpoint: number, sourceEndpoint: number, clusterID: number, radius: number, data: Buffer): Promise<void> {
        await this.znp.request(Subsystem.AF, 'dataRequest', {
            dstaddr: destinationAddress,
            destendpoint: destinationEndpoint,
            srcendpoint: sourceEndpoint,
            clusterid: clusterID,
            transid: this.nextTransactionID(),
            options: Constants.AF.options.ACK_REQUEST | Constants.AF.options.DISCV_ROUTE,
            radius: radius,
            len: data.length,
            data: data,
        });
    };

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }
}

export default ZStackAdapter;