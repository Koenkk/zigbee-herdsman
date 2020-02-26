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
            request.timeout = 5;

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
        try {
            const fw = await this.driver.readFirmwareVersionRequest();
            const buf = Buffer.from(fw);
            let fwString = "0x" + buf.readUInt32LE(0).toString(16);
            const type: string = (fw[1] === 5) ? "RaspBee" : "ConBee2";
            const meta = {"transportrev":0, "product":0, "majorrel": fw[3], "minorrel": fw[2], "maintrel":0, "revision":fwString};
            return {type: type, meta: meta};
        } catch (error) {
            debug("Get coordinator version error: " + error);
        }
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
                    const d = await this.waitForData(networkAddress, 0, 0x8031);
                    const data = d.asduPayload;

                    if (data[1] !== 0) { // status
                        throw new Error(`LQI for '${networkAddress}' failed`);
                    }
                    const tableList: Buffer[] = [];
                    const response = {
                        status: data[1],
                        tableEntrys: data[2],
                        startIndex: data[3],
                        tableListCount: data[4],
                        tableList: tableList
                    }

                    let tableEntry: number[] = [];
                    let counter = 0;
                    for (let i = 5; i < ((response.tableListCount * 22) + 5); i++) { // one tableentry = 22 bytes
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
        return this.queue.execute<RoutingTable>(async (): Promise<RoutingTable> => {

            const table: RoutingTableEntry[] = [];
            const statusLookup: {[n: number]: string} = {
                0: 'ACTIVE',
                1: 'DISCOVERY_UNDERWAY',
                2: 'DISCOVERY_FAILED',
                3: 'INACTIVE',
            };
            const add = (list: any) => {
                for (const entry of list) {
                    const statusByte = entry.readUInt8(2);
                    const extAddr: number[] = [];
                    for (let i = 8; i < 16; i++) {
                        extAddr.push(entry[i]);
                    }

                    table.push({
                        destinationAddress: entry.readUInt16LE(0),
                        status: statusLookup[(statusByte >> 5) & ((1 << 3)-1)],
                        nextHop: entry.readUInt16LE(3)
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
                req.clusterId = 0x32; // mgmt_rtg_request
                req.srcEndpoint = 0;
                req.asduLength = 2;
                req.asduPayload = [transactionID, startIndex];
                req.txOptions = 0;
                req.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
                //todo timeout

                try {
                    this.driver.enqueueSendDataRequest(req) as ReceivedDataResponse;
                    const d = await this.waitForData(networkAddress, 0, 0x8032);
                    const data = d.asduPayload;

                    if (data[1] !== 0) { // status
                        throw new Error(`Routingtables for '${networkAddress}' failed`);
                    }
                    const tableList: Buffer[] = [];
                    const response = {
                        status: data[1],
                        tableEntrys: data[2],
                        startIndex: data[3],
                        tableListCount: data[4],
                        tableList: tableList
                    }

                    let tableEntry: number[] = [];
                    let counter = 0;
                    for (let i = 5; i < ((response.tableListCount * 5) + 5); i++) { // one tableentry = 5 bytes
                        tableEntry.push(data[i]);
                        counter++;
                        if (counter === 5) {
                            response.tableList.push(Buffer.from(tableEntry));
                            tableEntry = [];
                            counter = 0;
                        }
                    }

                    debug("ROUTING_TABLE RESPONSE - addr: 0x" + networkAddress.toString(16) + " status: " + response.status + " read " + (response.tableListCount + response.startIndex) + "/" + response.tableEntrys + " entrys");
                    return response;
                } catch (error) {
                    debug("ROUTING_TABLE REQUEST FAILED - addr: 0x" + networkAddress.toString(16) + " " + error);
                }
            };

            let response = await request(0);
            add(response.tableList);
            let nextStartIndex = response.tableListCount;

            while (table.length < response.tableEntrys) {
                response = await request(nextStartIndex);
                add(response.tableList);
                nextStartIndex += response.tableListCount;
            }

            return {table};
        }, networkAddress);
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
                const d = await this.waitForData(networkAddress, 0, 0x8002);
                const data = d.asduPayload;

                const buf = Buffer.from(data);
                const logicaltype = (data[4] & 7);
                const type: DeviceType = (logicaltype === 1) ? 'Router' : (logicaltype === 2) ? 'EndDevice' : (logicaltype === 0) ? 'Coordinator' : 'Unknown';
                const manufacturer = buf.readUInt16LE(7);
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
                const d = await this.waitForData(networkAddress, 0, 0x8005);
                const data = d.asduPayload;

                const buf = Buffer.from(data);
                const epCount = buf.readUInt8(4);
                const epList = [];
                for (let i = 5; i < (epCount + 5); i++) {
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
                const d = await this.waitForData(networkAddress, 0, 0x8004);
                const data = d.asduPayload;

                const buf = Buffer.from(data);
                const inCount = buf.readUInt8(11);
                const inClusters = [];
                let cIndex = 12;
                for (let i = 0; i < inCount; i++) {
                    inClusters[i] = buf.readUInt16LE(cIndex);
                    cIndex += 2;
                }
                const outCount = buf.readUInt8(12 + (inCount*2));
                const outClusters = [];
                cIndex = 13 + (inCount*2);
                for (let l = 0; l < outCount; l++) {
                    outClusters[l] = buf.readUInt16LE(cIndex);
                    cIndex += 2;
                }

                const simpleDesc = {
                    profileID: buf.readUInt16LE(6),
                    endpointID: buf.readUInt8(5),
                    deviceID: buf.readUInt16LE(8),
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

    public async sendZclFrameNetworkAddress(
        networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number, defaultResponseTimeout: number
    ): Promise<Events.ZclDataPayload> {
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
        return this.queue.execute<void>(async () => {
            const transactionID = this.nextTransactionID();
            const clid1 = clusterID & 0xff;
            const clid2 = (clusterID >> 8) & 0xff;
            const destAddrMode = (type === 'group') ? PARAM.PARAM.addressMode.GROUP_ADDR : PARAM.PARAM.addressMode.IEEE_ADDR;
            let asduLength = 14;
            let destArray: number[];
            if (type === 'endpoint') {
                destArray = this.driver.macAddrStringToArray(destinationAddressOrGroup as string);
                destArray.concat([destinationEndpoint]);
                asduLength = 21;
            } else {
                destArray = [destinationAddressOrGroup as number & 0xff, (destinationAddressOrGroup as number >> 8) & 0xff];
            }
            const request: ApsDataRequest = {};
            const zdpFrame = [transactionID].concat(this.driver.macAddrStringToArray(sourceIeeeAddress)).concat(
                [sourceEndpoint,clid1,clid2,destAddrMode]).concat(destArray);

            request.requestId = transactionID;
            request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
            request.destAddr16 = destinationNetworkAddress;
            request.destEndpoint = 0;
            request.profileId = 0;
            request.clusterId = 0x21; // bind_request
            request.srcEndpoint = 0;
            request.asduLength = asduLength;
            request.asduPayload = zdpFrame;
            request.txOptions = 0;
            request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
            //todo timeout

            try {
                this.driver.enqueueSendDataRequest(request) as ReceivedDataResponse;
                const d = await this.waitForData(destinationNetworkAddress, 0, 0x8021);
                const data = d.asduPayload;
                debug("BIND RESPONSE - addr: 0x" + destinationNetworkAddress.toString(16) + " status: " + data[0]);
            } catch (error) {
                debug("BIND FAILED - addr: 0x" + destinationNetworkAddress.toString(16) + " " + error);
            }
        }, destinationNetworkAddress);
    }

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {
        return this.queue.execute<void>(async () => {
            const transactionID = this.nextTransactionID();
            const clid1 = clusterID & 0xff;
            const clid2 = (clusterID >> 8) & 0xff;
            const destAddrMode = (type === 'group') ? PARAM.PARAM.addressMode.GROUP_ADDR : PARAM.PARAM.addressMode.IEEE_ADDR;
            let asduLength = 14;
            let destArray: number[];
            if (type === 'endpoint') {
                destArray = this.driver.macAddrStringToArray(destinationAddressOrGroup as string);
                destArray.concat([destinationEndpoint]);
                asduLength = 21;
            } else {
                destArray = [destinationAddressOrGroup as number & 0xff, (destinationAddressOrGroup as number >> 8) & 0xff];
            }
            const request: ApsDataRequest = {};
            const zdpFrame = [transactionID].concat(this.driver.macAddrStringToArray(sourceIeeeAddress)).concat(
                [sourceEndpoint,clid1,clid2,destAddrMode]).concat(destArray);

            request.requestId = transactionID;
            request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
            request.destAddr16 = destinationNetworkAddress;
            request.destEndpoint = 0;
            request.profileId = 0;
            request.clusterId = 0x22; // unbind_request
            request.srcEndpoint = 0;
            request.asduLength = asduLength;
            request.asduPayload = zdpFrame;
            request.txOptions = 0;
            request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
            //todo timeout

            try {
                this.driver.enqueueSendDataRequest(request) as ReceivedDataResponse;
                const d = await this.waitForData(destinationNetworkAddress, 0, 0x8022);
                const data = d.asduPayload;
                debug("UNBIND RESPONSE - addr: 0x" + destinationNetworkAddress.toString(16) + " status: " + data[0]);
            } catch (error) {
                debug("UNBIND FAILED - addr: 0x" + destinationNetworkAddress.toString(16) + " " + error);
            }
        }, destinationNetworkAddress);
    }

    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        return this.queue.execute<void>(async () => {
            const transactionID = this.nextTransactionID();
            const nwk1 = networkAddress & 0xff;
            const nwk2 = (networkAddress >> 8) & 0xff;
            const request: ApsDataRequest = {};
            const zdpFrame = [transactionID].concat(this.driver.macAddrStringToArray(ieeeAddr)).concat([0]);

            request.requestId = transactionID;
            request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
            request.destAddr16 = networkAddress;
            request.destEndpoint = 0;
            request.profileId = 0;
            request.clusterId = 0x34; // mgmt_leave_request
            request.srcEndpoint = 0;
            request.asduLength = 4;
            request.asduPayload = zdpFrame;
            request.txOptions = 0;
            request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
            //todo timeout

            try {
                this.driver.enqueueSendDataRequest(request) as ReceivedDataResponse;
                const d = await this.waitForData(networkAddress, 0, 0x8034);
                const data = d.asduPayload;
                debug("REMOVE_DEVICE - addr: 0x" + networkAddress.toString(16) + " status: " + data[0]);
            } catch (error) {
                debug("REMOVE_DEVICE FAILED - addr: 0x" + networkAddress.toString(16) + " " + error);
            }
        }, networkAddress);
    }

    public async supportsBackup(): Promise<boolean> {
        return false;
    }

    public async backup(): Promise<BackupType> {
        return Promise.reject();
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

    /**
     * Private methods
     */
    private waitForData(addr: number, profileId: number, clusterId: number) : Promise<ReceivedDataResponse> {
        return new Promise((resolve, reject): void => {
            const ts = Date.now();
            const commandId = PARAM.PARAM.APS.DATA_INDICATION;
            const req: WaitForDataRequest = {addr, profileId, clusterId, resolve, reject, ts};
            this.openRequestsQueue.push(req);
        });
    }

    private checkReceivedDataPayload(resp: ReceivedDataResponse) {
        const srcAddr = (resp.srcAddr16 != null) ? resp.srcAddr16 : resp.srcAddr64;
        let i = this.openRequestsQueue.length;

        while (i--) {
            const req: WaitForDataRequest = this.openRequestsQueue[i];
            if (req.addr === srcAddr && req.clusterId === resp.clusterId && req.profileId === resp.profileId) {
                this.openRequestsQueue.splice(i, 1);
                req.resolve(resp);
            }

            const now = Date.now();
            if ((now - req.ts) > 60000) { // 60 seconds
                debug(`Timeout for request in openRequestsQueue addr: ${req.addr} clusterId: ${req.clusterId} profileId: ${req.profileId}`);
                //remove from busyQueue
                this.openRequestsQueue.splice(i, 1);
                req.reject("openRequest TIMEOUT");
            }
        }
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
