import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters,
    StartResult, LQINeighbor, RoutingTableEntry
} from '../../tstype';
import Debug from "debug";
import Adapter from '../../adapter';
const debug = Debug("zigbee-herdsman:deconz:adapter");
import Driver from '../driver/driver';
import {ZclFrame, FrameType, Direction, Foundation} from '../../../zcl';
import * as Events from '../../events';
import * as Zcl from '../../../zcl';
import processFrame from '../driver/frameParser';
import {Queue} from '../../../utils';
import PARAM from '../driver/constants';
import { Command, WaitForDataRequest, ApsDataRequest, ReceivedDataResponse, DataStateResponse } from '../driver/constants';

var frameParser = require('../driver/frameParser');
class DeconzAdapter extends Adapter {
    private driver: Driver;
    private queue: Queue;
    private openRequestsQueue: WaitForDataRequest[];
    private transactionID: number;
    private frameParserEvent = frameParser.frameParserEvents;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string) {
        super(networkOptions, serialPortOptions, backupPath);

        this.driver = new Driver(serialPortOptions.path);
        this.driver.on('rxFrame', (frame) => {processFrame(frame)});
        this.queue = new Queue(2);
        this.transactionID = 0;
        this.openRequestsQueue = [];
        console.log('CREATED DECONZ ADAPTER');

        this.frameParserEvent.on('receivedDataPayload', (data: any) => {this.checkReceivedDataPayload(data)});
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return Driver.isValidPath(path);
    }

    public static async autoDetectPath(): Promise<string> {
        return Driver.autoDetectPath();
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        await this.driver.open();
        return "resumed";
    }

    public async stop(): Promise<void> {
        this.driver.close();
    }

    public async getCoordinator(): Promise<Coordinator> {
        return this.queue.execute<Coordinator>(async () => {
            const ieeeAddr: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.MAC);
            const nwkAddr: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.NWK_ADDRESS);

            const endpoints: any = [{
                    ID: 0x01,
                    profileID: 0x0104,
                    deviceID: 0x0005,
                    inputClusters: [0x0019, 0x000A],
                    outputClusters: [0x0500]
                },
                {
                    ID: 0xF2,
                    profileID: 0xA1E0,
                    deviceID: 0x0064,
                    inputClusters: [],
                    outputClusters: [0x0021]
                }];

            return {
                networkAddress: nwkAddr,
                manufacturerID: 0x1135,
                ieeeAddr: ieeeAddr,
                endpoints,
            };
        });
    }

    public async permitJoin(seconds: number): Promise<void> {
        if (seconds < 0 || seconds > 255) {
            throw new Error(`invalid value ${seconds} for permit join`);
        }

        return this.queue.execute<void>(async () => {
            const transactionID = this.nextTransactionID();
            const request: ApsDataRequest = {};
            const zdpFrame = [transactionID, seconds, 0]; // tc_significance 1 or 0 ?

            request.requestId = transactionID;
            request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
            request.destAddr16 = 0xfffc;
            request.destEndpoint = 0;
            request.profileId = 0;
            request.clusterId = 0x36; // permit join
            request.srcEndpoint = 0;
            request.asduLength = 3;
            request.asduPayload = zdpFrame;
            request.txOptions = 0;
            request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
            //todo timeout

            try {
                await this.driver.enqueueSendDataRequest(request);
                debug("PERMIT_JOIN - " + seconds + " seconds");
                return
            } catch (error) {
                debug("PERMIT_JOIN FAILED - " + error);
            }
        });
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        // product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string;
        const fw = await this.driver.readFirmwareVersionRequest();
        const type: string = (fw[1] === 5) ? "raspbee" : "conbee2";
        const meta = {major: fw[3], minor: fw[2]}
        return {type: type, meta: meta};
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        return Promise.reject();
    }

    public async setLED(enabled: boolean): Promise<void> {
        return Promise.reject();
    }

    public async lqi(networkAddress: number): Promise<LQI> {
        return this.queue.execute<LQI>(async (): Promise<LQI> => {

            const neighbors: LQINeighbor[] = [];

            const add = (list: any) => {
                for (const entry of list) {
                    const relationByte = entry.readUInt8(18);
                    const extAddr: number[] = [];
                    for (let i = 8; i < 16; i++) {
                        extAddr.push(entry[i]);
                    }

                    neighbors.push({
                        linkquality: entry.readUInt8(21),
                        networkAddress: entry.readUInt16LE(16),
                        ieeeAddr: this.driver.macAddrArrayToString(extAddr),
                        relationship: (relationByte >> 1) & ((1 << 3)-1),
                        depth: entry.readUInt8(20)
                    });
                }
            };

            const request = async (startIndex: number): Promise<any> => {
                const transactionID = this.nextTransactionID();
                const req: ApsDataRequest = {};
                req.requestId = transactionID;
                req.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
                req.destAddr16 = networkAddress;
                req.destEndpoint = 0;
                req.profileId = 0;
                req.clusterId = 0x31; // mgmt_lqi_request
                req.srcEndpoint = 0;
                req.asduLength = 2;
                req.asduPayload = [transactionID, startIndex];
                req.txOptions = 0;
                req.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
                //todo timeout

                try {
                    this.driver.enqueueSendDataRequest(req) as ReceivedDataResponse;
                    const data = await this.waitForData(networkAddress, 0x8031);

                    if (data[0] !== 0) { // status
                        throw new Error(`LQI for '${networkAddress}' failed`);
                    }
                    const tableList: Buffer[] = [];
                    const response = {
                        status: data[0],
                        tableEntrys: data[1],
                        startIndex: data[2],
                        tableListCount: data[3],
                        tableList: tableList
                    }

                    let tableEntry: number[] = [];
                    let counter = 0;
                    for (let i = 4; i < ((response.tableListCount * 22) + 4); i++) { // one tableentry = 22 bytes
                        tableEntry.push(data[i]);
                        counter++;
                        if (counter === 22) {
                            response.tableList.push(Buffer.from(tableEntry));
                            tableEntry = [];
                            counter = 0;
                        }
                    }

                    debug("LQI RESPONSE - addr: 0x" + networkAddress.toString(16) + " status: " + response.status + " read " + (response.tableListCount + response.startIndex) + "/" + response.tableEntrys + " entrys");
                    return response;
                } catch (error) {
                    debug("LQI REQUEST FAILED - addr: 0x" + networkAddress.toString(16) + " " + error);
                }
            };

            let response = await request(0);
            add(response.tableList);
            let nextStartIndex = response.tableListCount;

            while (neighbors.length < response.tableEntrys) {
                response = await request(nextStartIndex);
                add(response.tableList);
                nextStartIndex += response.tableListCount;
            }

            return {neighbors};
        }, networkAddress);
    }

    public async routingTable(networkAddress: number): Promise<RoutingTable> {
        return null;
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
        return this.queue.execute<NodeDescriptor>(async () => {
            const transactionID = this.nextTransactionID();
            const nwk1 = networkAddress & 0xff;
            const nwk2 = (networkAddress >> 8) & 0xff;
            const request: ApsDataRequest = {};
            const zdpFrame = [transactionID, nwk1, nwk2];

            request.requestId = transactionID;
            request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
            request.destAddr16 = networkAddress;
            request.destEndpoint = 0;
            request.profileId = 0;
            request.clusterId = 0x02; // node descriptor
            request.srcEndpoint = 0;
            request.asduLength = 3;
            request.asduPayload = zdpFrame;
            request.txOptions = 0;
            request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
            //todo timeout

            try {
                this.driver.enqueueSendDataRequest(request) as ReceivedDataResponse;
                const data = await this.waitForData(networkAddress, 0x8002);

                const buf = Buffer.from(data);
                const logicaltype = (data[3] & 7);
                const type: DeviceType = (logicaltype === 1) ? 'Router' : (logicaltype === 2) ? 'EndDevice' : (logicaltype === 0) ? 'Coordinator' : 'Unknown';
                const manufacturer = buf.readUInt16LE(6);

                debug("RECEIVING NODE_DESCRIPTOR - addr: 0x" + networkAddress.toString(16) + " type: " + type + " manufacturer: 0x" + manufacturer.toString(16));
                return {manufacturerCode: manufacturer, type};
            } catch (error) {
                debug("RECEIVING NODE_DESCRIPTOR FAILED - addr: 0x" + networkAddress.toString(16) + " " + error);
        }

        }, networkAddress);
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
        return this.queue.execute<ActiveEndpoints>(async () => {
            const transactionID = this.nextTransactionID();
            const nwk1 = networkAddress & 0xff;
            const nwk2 = (networkAddress >> 8) & 0xff;
            const request: ApsDataRequest = {};
            const zdpFrame = [transactionID, nwk1, nwk2];

            request.requestId = transactionID;
            request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
            request.destAddr16 = networkAddress;
            request.destEndpoint = 0;
            request.profileId = 0;
            request.clusterId = 0x05; // active endpoints
            request.srcEndpoint = 0;
            request.asduLength = 3;
            request.asduPayload = zdpFrame;
            request.txOptions = 0;
            request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
            //todo timeout

            try {
                this.driver.enqueueSendDataRequest(request) as ReceivedDataResponse;
                const data = await this.waitForData(networkAddress, 0x8005);

                const buf = Buffer.from(data);
                const epCount = buf.readUInt8(3);
                const epList = [];
                for (let i = 4; i < (epCount + 4); i++) {
                    epList.push(buf.readUInt8(i));
                }

                debug("ACTIVE_ENDPOINTS - addr: 0x" + networkAddress.toString(16) + " EP list: " + epList);
                return {endpoints: epList};
            } catch (error) {
                debug("READING ACTIVE_ENDPOINTS FAILED - addr: 0x" + networkAddress.toString(16) + " " + error);
        }


        }, networkAddress);
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
        return this.queue.execute<SimpleDescriptor>(async () => {
            const transactionID = this.nextTransactionID();
            const nwk1 = networkAddress & 0xff;
            const nwk2 = (networkAddress >> 8) & 0xff;
            const request: ApsDataRequest = {};
            const zdpFrame = [transactionID, nwk1, nwk2, endpointID];

            request.requestId = transactionID;
            request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
            request.destAddr16 = networkAddress;
            request.destEndpoint = 0;
            request.profileId = 0;
            request.clusterId = 0x04; // simple descriptor
            request.srcEndpoint = 0;
            request.asduLength = 4;
            request.asduPayload = zdpFrame;
            request.txOptions = 0;
            request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
            //todo timeout

            try {
                this.driver.enqueueSendDataRequest(request) as ReceivedDataResponse;
                const data = await this.waitForData(networkAddress, 0x8004);

                const buf = Buffer.from(data);
                const inCount = buf.readUInt8(10);
                const inClusters = [];
                let cIndex = 11;
                for (let i = 0; i < inCount; i++) {
                    inClusters[i] = buf.readUInt16LE(cIndex);
                    cIndex += 2;
                }
                const outCount = buf.readUInt8(11 + (inCount*2));
                const outClusters = [];
                cIndex = 12 + (inCount*2);
                for (let l = 0; l < outCount; l++) {
                    outClusters[l] = buf.readUInt16LE(cIndex);
                    cIndex += 2;
                }

                const simpleDesc = {
                    profileID: buf.readUInt16LE(5),
                    endpointID: buf.readUInt8(4),
                    deviceID: buf.readUInt16LE(7),
                    inputClusters: inClusters,
                    outputClusters: outClusters
                }

                debug("RECEIVING SIMPLE_DESCRIPTOR - addr: 0x" + networkAddress.toString(16) + " EP:" + endpointID + " inClusters: " + inClusters + " outClusters: " + outClusters);
                return simpleDesc;
            } catch (error) {
                debug("RECEIVING SIMPLE_DESCRIPTOR FAILED - addr: 0x" + networkAddress.toString(16) + " EP:" + endpointID + " " + error);
        }


        }, networkAddress);
    }

    public waitFor(
        networkAddress: number, endpoint: number, frameType: FrameType, direction: Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): {promise: Promise<Events.ZclDataPayload>; cancel: () => void} {
        return null;
    }

    public async sendZclFrameNetworkAddressWithResponse(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame
    ): Promise<Events.ZclDataPayload> {

        const command = zclFrame.getCommand();
        if (!command.hasOwnProperty('response')) {
            throw new Error(`Command '${command.name}' has no response, cannot wait for response`);
        }

        const transactionID = this.nextTransactionID();
        const request: ApsDataRequest = {};
        const data = zclFrame.toBuffer();

        request.requestId = transactionID;
        request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
        request.destAddr16 = networkAddress;
        request.destEndpoint = endpoint;
        request.profileId = 0x104;
        request.clusterId = zclFrame.Cluster.ID;
        request.srcEndpoint = 1;
        request.asduLength = data.length;
        request.asduPayload = [...data];
        request.txOptions = 0;
        request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
        //todo timeout

        try {
            return this.driver.enqueueSendDataRequestWithResponse(request);
        } catch (error) {
            throw error;
        }
    }

    public async sendZclFrameNetworkAddress(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number, defaultResponseTimeout: number
    ): Promise<void> {

        const transactionID = this.nextTransactionID();
        const request: ApsDataRequest = {};
        const data = zclFrame.toBuffer();

        request.requestId = transactionID;
        request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
        request.destAddr16 = networkAddress;
        request.destEndpoint = endpoint;
        request.profileId = 0x104;
        request.clusterId = zclFrame.Cluster.ID;
        request.srcEndpoint = 1;
        request.asduLength = data.length;
        request.asduPayload = [...data];
        request.txOptions = 0;
        request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
        //todo timeout

        try {
            return this.driver.enqueueSendDataRequest(request) as Promise<void>;
        } catch (error) {
            throw error;
        }
    }

    public async sendZclFrameGroup(groupID: number, zclFrame: ZclFrame, timeout: number): Promise<void> {
        //todo
        const transactionID = this.nextTransactionID();
        const request: ApsDataRequest = {};
        const data = zclFrame.toBuffer();

        request.requestId = transactionID;
        request.destAddrMode = PARAM.PARAM.addressMode.GROUP_ADDR;
        request.destAddr16 = groupID;
        request.profileId = 0x104;
        request.clusterId = zclFrame.Cluster.ID;
        request.srcEndpoint = 1;
        request.asduLength = data.length;
        request.asduPayload = [...data];
        request.txOptions = 0;
        request.radius = PARAM.PARAM.txRadius.UNLIMITED;
        //todo timeout

        try {
            return this.driver.enqueueSendDataRequest(request) as Promise<void>;
        } catch (error) {
            throw error;
        }
    }

    public async bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void> {

    }

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {

    }

    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {

    }

    public async supportsBackup(): Promise<boolean> {
        return null;
    }

    public async backup(): Promise<BackupType> {
        return null;
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        const panid: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.PAN_ID);
        const expanid: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.EXT_PAN_ID);
        const channel: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.CHANNEL);

        return {
            panID: panid,
            extendedPanID: expanid,
            channel: channel
        };
    }

    public async supportsLED(): Promise<boolean> {
        return false;
    }

    public async supportsDiscoverRoute(): Promise<boolean> {
        return false;
    }

    public async discoverRoute(networkAddress: number): Promise<void> {
        return Promise.reject();
    }

    public async restoreChannelInterPAN(): Promise<void> {
        return Promise.reject();
    }

    public async sendZclFrameInterPANBroadcastWithResponse(
        zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        return Promise.reject();
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        return Promise.reject();
    }

    public async setTransmitPower(value: number): Promise<void> {
        return Promise.reject();
    }

    public async sendZclFrameInterPANIeeeAddr(zclFrame: ZclFrame, ieeeAddr: any): Promise<void> {
        return Promise.reject();
    }

    private waitForData(addr: number, clusterId: number) : Promise<number[]> {
        return new Promise((resolve, reject): void => {
            const ts = 0;
            const commandId = PARAM.PARAM.APS.DATA_INDICATION;
            const req: WaitForDataRequest = {addr, clusterId, resolve, reject, ts};
            this.openRequestsQueue.push(req);
            //todo: delete not used anymore requests? timeout!
        });
    }

    private checkReceivedDataPayload(resp: ReceivedDataResponse) {
        const srcAddr = (resp.srcAddr16 != null) ? resp.srcAddr16 : resp.srcAddr64;
        let i = this.openRequestsQueue.length;
        while (i--) {
            const req: WaitForDataRequest = this.openRequestsQueue[i];
            if (req.addr === srcAddr && req.clusterId === resp.clusterId) {
                this.openRequestsQueue.splice(i, 1);
                req.resolve(resp.asduPayload);
            }
        }
        //req.reject("TIMEOUT");
    }

    private nextTransactionID(): number {
        this.transactionID++;

        if (this.transactionID > 255) {
            this.transactionID = 1;
        }

        return this.transactionID;
    }
}

export default DeconzAdapter;
