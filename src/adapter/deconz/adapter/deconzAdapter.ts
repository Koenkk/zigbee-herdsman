/* istanbul ignore file */
/* eslint-disable */
import {
    NetworkOptions, SerialPortOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup as BackupType, NetworkParameters,
    StartResult, LQINeighbor, RoutingTableEntry, AdapterOptions,
} from '../../tstype';
import Debug from "debug";
import Adapter from '../../adapter';
const debug = Debug("zigbee-herdsman:deconz:adapter");
import Driver from '../driver/driver';
import {ZclFrame, FrameType, Direction, Foundation} from '../../../zcl';
import * as Events from '../../events';
import * as Zcl from '../../../zcl';
import {GreenPowerEvents, GreenPowerDeviceJoinedPayload} from '../../../controller/tstype';
import processFrame from '../driver/frameParser';
import {Queue, Waitress, Wait} from '../../../utils';
import PARAM from '../driver/constants';
import { Command, WaitForDataRequest, ApsDataRequest, ReceivedDataResponse, DataStateResponse, gpDataInd } from '../driver/constants';
import {LoggerStub} from "../../../controller/logger-stub";
import * as Models from "../../../models";

var frameParser = require('../driver/frameParser');

interface WaitressMatcher {
    address: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    frameType: FrameType;
    clusterID: number;
    commandIdentifier: number;
    direction: number;
};

class DeconzAdapter extends Adapter {
    private driver: Driver;
    private queue: Queue;
    private openRequestsQueue: WaitForDataRequest[];
    private transactionID: number;
    private frameParserEvent = frameParser.frameParserEvents;
    private joinPermitted: boolean;
    private fwVersion: CoordinatorVersion;
    private waitress: Waitress<Events.ZclDataPayload, WaitressMatcher>;
    private TX_OPTIONS = 0x00; // No APS ACKS

    public constructor(networkOptions: NetworkOptions,
        serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions, logger?: LoggerStub) {

        super(networkOptions, serialPortOptions, backupPath, adapterOptions, logger);

        const concurrent = this.adapterOptions && this.adapterOptions.concurrent ?
            this.adapterOptions.concurrent : 2;

        // TODO: https://github.com/Koenkk/zigbee2mqtt/issues/4884#issuecomment-728903121
        const delay = this.adapterOptions && typeof this.adapterOptions.delay === 'number' ?
            this.adapterOptions.delay : 0;

        this.waitress = new Waitress<Events.ZclDataPayload, WaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter
        );

        this.driver = new Driver(serialPortOptions.path);
        this.driver.setDelay(delay);

        if (delay >= 200) {
            this.TX_OPTIONS = 0x04; // activate APS ACKS
        }

        this.driver.on('rxFrame', (frame) => {processFrame(frame)});
        this.queue = new Queue(concurrent);
        this.transactionID = 0;
        this.openRequestsQueue = [];
        this.joinPermitted = false;
        this.fwVersion = null;
        console.log('CREATED DECONZ ADAPTER');

        this.frameParserEvent.on('receivedDataPayload', (data: any) => {this.checkReceivedDataPayload(data)});
        this.frameParserEvent.on('receivedGreenPowerIndication', (data: any) => {this.checkReceivedGreenPowerIndication(data)});

        const that = this;
        setInterval(() => { that.checkReceivedDataPayload(null); }, 1000);
        setTimeout(() => {that.checkCoordinatorSimpleDescriptor(false);}, 3000);
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
            const ieeeAddr: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.MAC);
            const nwkAddr: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.NWK_ADDRESS);

            const endpoints: any = [{
                    ID: 0x01,
                    profileID: 0x0104,
                    deviceID: 0x0005,
                    inputClusters: [0x0000, 0x000A, 0x0019],
                    outputClusters: [0x0001, 0x0020, 0x0500]
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
    }

    public async permitJoin(seconds: number, networkAddress: number): Promise<void> {
        const transactionID = this.nextTransactionID();
        const request: ApsDataRequest = {};
        const zdpFrame = [transactionID, seconds, 0]; // tc_significance 1 or 0 ?

        request.requestId = transactionID;
        request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
        request.destAddr16 = networkAddress || 0xFFFC;
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
            if (seconds === 0) {
                this.joinPermitted = false;
            } else {
                this.joinPermitted = true;
            }
            this.driver.writeParameterRequest(PARAM.PARAM.Network.PERMIT_JOIN, seconds);

            debug("PERMIT_JOIN - " + seconds + " seconds");
        } catch (error) {
            debug("PERMIT_JOIN FAILED - " + error);
            // try again
            this.permitJoin(seconds, networkAddress);
            //return Promise.reject(); // do not reject
        }
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        // product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string;
        if (this.fwVersion != null) {
            return this.fwVersion;
        } else {
            try {
                const fw = await this.driver.readFirmwareVersionRequest();
                const buf = Buffer.from(fw);
                let fwString = "0x" + buf.readUInt32LE(0).toString(16);
                const type: string = (fw[1] === 5) ? "ConBee/RaspBee" : "ConBee2/RaspBee2";
                const meta = {"transportrev":0, "product":0, "majorrel": fw[3], "minorrel": fw[2], "maintrel":0, "revision":fwString};
                this.fwVersion = {type: type, meta: meta};
                return {type: type, meta: meta};
            } catch (error) {
                debug("Get coordinator version Error: " + error);
            }
        }
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        return Promise.reject();
    }

    public async lqi(networkAddress: number): Promise<LQI> {
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

                this.driver.enqueueSendDataRequest(req)
                .then(result => {})
                .catch(error => {});

                try {
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
                    return Promise.reject();
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
    }

    public async routingTable(networkAddress: number): Promise<RoutingTable> {
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
                req.timeout = 30;

                this.driver.enqueueSendDataRequest(req)
                .then(result => {})
                .catch(error => {});

                try {
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
                    return Promise.reject();
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
    }

    public async nodeDescriptor(networkAddress: number): Promise<NodeDescriptor> {
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
        request.timeout = 30;

        this.driver.enqueueSendDataRequest(request)
            .then(result => {})
            .catch(error => {});

        try {
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
            return Promise.reject();
        }
    }

    public async activeEndpoints(networkAddress: number): Promise<ActiveEndpoints> {
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
        request.timeout = 30;

        this.driver.enqueueSendDataRequest(request)
            .then(result => {})
            .catch(error => {});

        try {
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
            return Promise.reject();
        }
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<SimpleDescriptor> {
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
        request.timeout = 30;

        this.driver.enqueueSendDataRequest(request)
            .then(result => {})
            .catch(error => {});

        try {
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
            debug("RECEIVING SIMPLE_DESCRIPTOR - addr: 0x" + networkAddress.toString(16) + " EP:" + simpleDesc.endpointID + " inClusters: " + inClusters + " outClusters: " + outClusters);
            return simpleDesc;
        } catch (error) {
            debug("RECEIVING SIMPLE_DESCRIPTOR FAILED - addr: 0x" + networkAddress.toString(16) + " " + error);
            return Promise.reject();
        }
    }

    private async checkCoordinatorSimpleDescriptor(skip: boolean): Promise<void> {
        debug("checking coordinator simple descriptor");
        var simpleDesc: any = null;
        if (skip === false) {
            try {
                simpleDesc = await this.simpleDescriptor(0x0, 1);
            } catch (error) {
            }

            if (simpleDesc === null) {
                this.checkCoordinatorSimpleDescriptor(false);
                return;
            }
            debug("EP: " + simpleDesc.endpointID);
            debug("profile ID: " + simpleDesc.profileID);
            debug("device ID: " + simpleDesc.deviceID);
            for (let i = 0; i < simpleDesc.inputClusters.length; i++) {
                debug("input cluster: 0x" + simpleDesc.inputClusters[i].toString(16));
            }

            for (let o = 0; o < simpleDesc.outputClusters.length; o++) {
                debug("output cluster: 0x" + simpleDesc.outputClusters[o].toString(16));
            }

            let ok = true;
            if (simpleDesc.endpointID === 0x1) {
                if (!simpleDesc.inputClusters.includes(0x0) || !simpleDesc.inputClusters.includes(0x0A) || !simpleDesc.inputClusters.includes(0x19) ||
                    !simpleDesc.outputClusters.includes(0x01) || !simpleDesc.outputClusters.includes(0x20) || !simpleDesc.outputClusters.includes(0x500)) {
                    debug("missing cluster");
                    ok = false;
                }

                if (ok === true) {
                    return;
                }
            }
        }

        debug("setting new simple descriptor");
        try {        //[ sd1   ep    proId       devId       vers  #inCl iCl1        iCl2        iCl3        #outC oCl1        oCl2        oCl3      ]
            const sd = [ 0x00, 0x01, 0x04, 0x01, 0x05, 0x00, 0x01, 0x03, 0x00, 0x00, 0x0A, 0x00, 0x19, 0x00, 0x03, 0x01, 0x00, 0x20, 0x00, 0x00, 0x05];
            const sd1 = sd.reverse();
            await this.driver.writeParameterRequest(PARAM.PARAM.STK.Endpoint, sd1);
        } catch (error) {
            debug("error setting simple descriptor - try again");
            this.checkCoordinatorSimpleDescriptor(true);
            return;
        }
        debug("success setting simple descriptor");
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
        return {promise: waiter.start().promise, cancel};
    }

    public async sendZclFrameToEndpoint(
        ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number,
    ): Promise<Events.ZclDataPayload> {

        const transactionID = this.nextTransactionID();
        const request: ApsDataRequest = {};

        let pay = zclFrame.toBuffer();
        //console.log("zclFramte.toBuffer:");
        //console.log(pay);

        request.requestId = transactionID;
        request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
        request.destAddr16 = networkAddress;
        request.destEndpoint = endpoint;
        request.profileId = sourceEndpoint === 242 && endpoint === 242 ? 0xa1e0 : 0x104;
        request.clusterId = zclFrame.Cluster.ID;
        request.srcEndpoint = sourceEndpoint || 1;
        request.asduLength = pay.length;
        request.asduPayload = [... pay];
        request.txOptions = this.TX_OPTIONS; // 0x00 normal; 0x04 APS ACK
        request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
        request.timeout = timeout;

        const command = zclFrame.getCommand();
        this.driver.enqueueSendDataRequest(request)
            .then(result => {
                debug(`sendZclFrameToEndpoint - message send with transSeq Nr.: ${zclFrame.Header.transactionSequenceNumber}`);
                debug(command.hasOwnProperty('response') + ", " + zclFrame.Header.frameControl.disableDefaultResponse + ", " + disableResponse);
                if (!command.hasOwnProperty('response') || zclFrame.Header.frameControl.disableDefaultResponse || !disableResponse) {
                    debug("resolve request");
                    return Promise.resolve();
                }
            })
            .catch(error => {
                debug(`sendZclFrameToEndpoint ERROR`);
                debug(error);
                //return Promise.reject();
            });
        try {
                let data = null;
                if (command.hasOwnProperty('response') && !disableResponse) {
                    data = await this.waitForData(networkAddress, 0x104, zclFrame.Cluster.ID, zclFrame.Header.transactionSequenceNumber);
                } else if (!zclFrame.Header.frameControl.disableDefaultResponse) {
                    data = await this.waitForData(networkAddress, 0x104, zclFrame.Cluster.ID, zclFrame.Header.transactionSequenceNumber);
                }

                if (data !== null) {
                    const asdu = data.asduPayload;
                    const buffer = Buffer.from(asdu);
                    const frame: ZclFrame = ZclFrame.fromBuffer(zclFrame.Cluster.ID, buffer);

                    const response: Events.ZclDataPayload = {
                        address: (data.srcAddrMode === 0x02) ? data.srcAddr16 : null,
                        frame: frame,
                        endpoint: data.srcEndpoint,
                        linkquality: data.lqi,
                        groupID: (data.srcAddrMode === 0x01) ? data.srcAddr16 : null,
                        wasBroadcast: data.srcAddrMode === 0x01 || data.srcAddrMode === 0xF,
                        destinationEndpoint: data.destEndpoint,
                    };
                    debug(`response received`);
                    return response;
                } else {
                    debug(`no response expected`);
                    return null;
                }

            } catch (error) {
                throw new Error("no response received");
            }
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: ZclFrame): Promise<void> {
        const transactionID = this.nextTransactionID();
        const request: ApsDataRequest = {};
        let pay = zclFrame.toBuffer();

        debug("zclFrame to group - zclFrame.payload:");
        debug(zclFrame.Payload);
        //console.log("zclFramte.toBuffer:");
        //console.log(pay);

        request.requestId = transactionID;
        request.destAddrMode = PARAM.PARAM.addressMode.GROUP_ADDR;
        request.destAddr16 = groupID;
        request.profileId = 0x104;
        request.clusterId = zclFrame.Cluster.ID;
        request.srcEndpoint = 1;
        request.asduLength = pay.length;
        request.asduPayload = [... pay];
        request.txOptions = 0;
        request.radius = PARAM.PARAM.txRadius.UNLIMITED;

        try {
            debug(`sendZclFrameToGroup - message send`);
            return this.driver.enqueueSendDataRequest(request) as Promise<void>;
        } catch (error) {
            //debug(`sendZclFrameToGroup ERROR: ${error}`);
            //return Promise.reject();
            throw new Error(error);
        }
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: ZclFrame, sourceEndpoint: number): Promise<void> {
        const transactionID = this.nextTransactionID();
        const request: ApsDataRequest = {};
        let pay = zclFrame.toBuffer();

        debug("zclFrame to all - zclFrame.payload:");
        debug(zclFrame.Payload);

        request.requestId = transactionID;
        request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
        request.destAddr16 = 0xFFFD;
        request.destEndpoint = endpoint;
        request.profileId = sourceEndpoint === 242 && endpoint === 242 ? 0xa1e0 : 0x104;
        request.clusterId = zclFrame.Cluster.ID;
        request.srcEndpoint = sourceEndpoint;
        request.asduLength = pay.length;
        request.asduPayload = [... pay];
        request.txOptions = 0;
        request.radius = PARAM.PARAM.txRadius.UNLIMITED;

        try {
            debug(`sendZclFrameToAll - message send`);
            return this.driver.enqueueSendDataRequest(request) as Promise<void>;
        } catch (error) {
            //debug(`sendZclFrameToAll ERROR: ${error}`);
            //return Promise.reject();
            throw new Error(error);
        }
    }

    public async bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void> {
        const transactionID = this.nextTransactionID();
        const clid1 = clusterID & 0xff;
        const clid2 = (clusterID >> 8) & 0xff;
        const destAddrMode = (type === 'group') ? PARAM.PARAM.addressMode.GROUP_ADDR : PARAM.PARAM.addressMode.IEEE_ADDR;
        let destArray: number[];

        if (type === 'endpoint') {
            destArray = this.driver.macAddrStringToArray(destinationAddressOrGroup as string);
            destArray = destArray.concat([destinationEndpoint]);
        } else {
            destArray = [destinationAddressOrGroup as number & 0xff, ((destinationAddressOrGroup as number) >> 8) & 0xff];
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
        request.asduLength = zdpFrame.length;
        request.asduPayload = zdpFrame;
        request.txOptions = 0x04; // 0x04 use APS ACKS
        request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
        request.timeout = 30;

        this.driver.enqueueSendDataRequest(request)
            .then(result => {})
            .catch(error => {});

        try {
            const d = await this.waitForData(destinationNetworkAddress, 0, 0x8021);
            const data = d.asduPayload;
            debug("BIND RESPONSE - addr: 0x" + destinationNetworkAddress.toString(16) + " status: " + data[1]);
            if (data[1] !== 0) {
                throw new Error("status: " + data[1]);
            }
        } catch (error) {
            debug("BIND FAILED - addr: 0x" + destinationNetworkAddress.toString(16) + " " + error);
            throw new Error(error);
        }
    }

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {
        const transactionID = this.nextTransactionID();
        const clid1 = clusterID & 0xff;
        const clid2 = (clusterID >> 8) & 0xff;
        const destAddrMode = (type === 'group') ? PARAM.PARAM.addressMode.GROUP_ADDR : PARAM.PARAM.addressMode.IEEE_ADDR;
        let destArray: number[];

        if (type === 'endpoint') {
            destArray = this.driver.macAddrStringToArray(destinationAddressOrGroup as string);
            destArray = destArray.concat([destinationEndpoint]);
        } else {
            destArray = [destinationAddressOrGroup as number & 0xff, ((destinationAddressOrGroup as number) >> 8) & 0xff];
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
        request.asduLength = zdpFrame.length;
        request.asduPayload = zdpFrame;
        request.txOptions = 0x04; // 0x04 use APS ACKS
        request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;
        request.timeout = 30;

        this.driver.enqueueSendDataRequest(request)
            .then(result => {})
            .catch(error => {});

        try {
            const d = await this.waitForData(destinationNetworkAddress, 0, 0x8022);
            const data = d.asduPayload;
            debug("UNBIND RESPONSE - addr: 0x" + destinationNetworkAddress.toString(16) + " status: " + data[1]);
            if (data[1] !== 0) {
                throw new Error("status: " + data[1]);
            }
        } catch (error) {
            debug("UNBIND FAILED - addr: 0x" + destinationNetworkAddress.toString(16) + " " + error);
            throw new Error(error);
        }
    }

    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        const transactionID = this.nextTransactionID();
        const nwk1 = networkAddress & 0xff;
        const nwk2 = (networkAddress >> 8) & 0xff;
        const request: ApsDataRequest = {};
        //const zdpFrame = [transactionID].concat(this.driver.macAddrStringToArray(ieeeAddr)).concat([0]);
        const zdpFrame = [transactionID].concat([0,0,0,0,0,0,0,0]).concat([0]);

        request.requestId = transactionID;
        request.destAddrMode = PARAM.PARAM.addressMode.NWK_ADDR;
        request.destAddr16 = networkAddress;
        request.destEndpoint = 0;
        request.profileId = 0;
        request.clusterId = 0x34; // mgmt_leave_request
        request.srcEndpoint = 0;
        request.asduLength = 10;
        request.asduPayload = zdpFrame;
        request.txOptions = 0;
        request.radius = PARAM.PARAM.txRadius.DEFAULT_RADIUS;

        this.driver.enqueueSendDataRequest(request)
            .then(result => {})
            .catch(error => {});

        try {
            const d = await this.waitForData(networkAddress, 0, 0x8034);
            const data = d.asduPayload;
            debug("REMOVE_DEVICE - addr: 0x" + networkAddress.toString(16) + " status: " + data[1]);
            const payload: Events.DeviceLeavePayload = {
                networkAddress: networkAddress,
                ieeeAddr: ieeeAddr,
            };
            if (data[1] !== 0) {
                throw new Error("status: " + data[1]);
            }
            this.emit(Events.Events.deviceLeave, payload);
        } catch (error) {
            debug("REMOVE_DEVICE FAILED - addr: 0x" + networkAddress.toString(16) + " " + error);
            throw new Error(error);
        }
    }

    public async supportsBackup(): Promise<boolean> {
        return false;
    }

    public async backup(): Promise<Models.Backup> {
        throw new Error("This adapter does not support backup");
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        try {
            let panid: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.PAN_ID);
            let expanid: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.APS_EXT_PAN_ID);
            let channel: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.CHANNEL);
            let networkKey: any = await this.driver.readParameterRequest(PARAM.PARAM.Network.NETWORK_KEY);

            // check current channel against configuration.yaml
            if (this.networkOptions.channelList[0] !== channel) {
                debug("Channel in configuration.yaml (" + this.networkOptions.channelList[0] + ") differs from current channel (" + channel + "). Changing channel.");

                let setChannelMask = 0;
                switch (this.networkOptions.channelList[0]) {
                    case 11:
                        setChannelMask = 0x800;
                        break;
                    case 12:
                        setChannelMask = 0x1000;
                        break;
                    case 13:
                        setChannelMask = 0x2000;
                        break;
                    case 14:
                        setChannelMask = 0x4000;
                        break;
                    case 15:
                        setChannelMask = 0x8000;
                        break;
                    case 16:
                        setChannelMask = 0x10000;
                        break;
                    case 17:
                        setChannelMask = 0x20000;
                        break;
                    case 18:
                        setChannelMask = 0x40000;
                        break;
                    case 19:
                        setChannelMask = 0x80000;
                        break;
                    case 20:
                        setChannelMask = 0x100000;
                        break;
                    case 21:
                        setChannelMask = 0x200000;
                        break;
                    case 22:
                        setChannelMask = 0x400000;
                        break;
                    case 23:
                        setChannelMask = 0x800000;
                        break;
                    case 24:
                        setChannelMask = 0x1000000;
                        break;
                    case 25:
                        setChannelMask = 0x2000000;
                        break;
                    case 26:
                        setChannelMask = 0x4000000;
                        break;
                    default:
                        break;
                }

                try {
                    await this.driver.writeParameterRequest(PARAM.PARAM.Network.CHANNEL_MASK, setChannelMask);
                    await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_OFFLINE);
                    await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_CONNECTED);
                    await this.sleep(3000);
                    channel = await this.driver.readParameterRequest(PARAM.PARAM.Network.CHANNEL);
                } catch (error) {
                    debug("Could not set channel: " + error);
                }
            }

            // check current panid against configuration.yaml
            if (this.networkOptions.panID !== panid) {
                debug("panid in configuration.yaml (" + this.networkOptions.panID + ") differs from current panid (" + panid + "). Changing panid.");

                try {
                    await this.driver.writeParameterRequest(PARAM.PARAM.Network.PAN_ID, this.networkOptions.panID);
                    await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_OFFLINE);
                    await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_CONNECTED);
                    await this.sleep(3000);
                    panid = await this.driver.readParameterRequest(PARAM.PARAM.Network.PAN_ID);
                } catch (error) {
                    debug("Could not set panid: " + error);
                }
            }

            // check current extended_panid against configuration.yaml
            if (this.driver.generalArrayToString(this.networkOptions.extendedPanID, 8) !== expanid) {

                debug("extended panid in configuration.yaml (" + this.driver.macAddrArrayToString(this.networkOptions.extendedPanID) + ") differs from current extended panid (" + expanid + "). Changing extended panid.");

                try {
                    //await this.driver.writeParameterRequest(PARAM.PARAM.Network.USE_APS_EXT_PAN_ID, 1);
                    await this.driver.writeParameterRequest(PARAM.PARAM.Network.APS_EXT_PAN_ID, this.networkOptions.extendedPanID);
                    await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_OFFLINE);
                    await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_CONNECTED);
                    await this.sleep(3000);
                    expanid = await this.driver.readParameterRequest(PARAM.PARAM.Network.APS_EXT_PAN_ID);
                } catch (error) {
                    debug("Could not set extended panid: " + error);
                }
            }

            // check current network key against configuration.yaml
            if (this.driver.generalArrayToString(this.networkOptions.networkKey, 16) !== networkKey) {
                debug("network key in configuration.yaml (hidden) differs from current network key (" + networkKey + "). Changing network key.");

                try {
                    await this.driver.writeParameterRequest(PARAM.PARAM.Network.NETWORK_KEY, this.networkOptions.networkKey);
                    await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_OFFLINE);
                    await this.driver.changeNetworkStateRequest(PARAM.PARAM.Network.NET_CONNECTED);
                    await this.sleep(3000);
                } catch (error) {
                    debug("Could not set network key: " + error);
                }
            }

            return {
                panID: panid,
                extendedPanID: expanid,
                channel: channel
            };
        } catch (error) {
            debug("get network parameters Error:" + error);
            return Promise.reject();
        }
    }

    public async restoreChannelInterPAN(): Promise<void> {
        throw new Error("not supported");
    }

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: ZclFrame, ieeeAddr: string): Promise<void> {
        throw new Error("not supported");
    }

    public async sendZclFrameInterPANBroadcast(
        zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        throw new Error("not supported");
    }

    public async sendZclFrameInterPANBroadcastWithResponse(
        zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        throw new Error("not supported");
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        throw new Error("not supported");
    }

    public async setTransmitPower(value: number): Promise<void> {
        throw new Error("not supported");
    }

    public async sendZclFrameInterPANIeeeAddr(zclFrame: ZclFrame, ieeeAddr: any): Promise<void> {
        throw new Error("not supported");
    }

    /**
     * Private methods
     */
    private sleep(ms: number) : Promise<void>{
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private waitForData(addr: number, profileId: number, clusterId: number, transactionSequenceNumber?: number) : Promise<ReceivedDataResponse> {
        return new Promise((resolve, reject): void => {
            const ts = Date.now();
            const commandId = PARAM.PARAM.APS.DATA_INDICATION;
            const req: WaitForDataRequest = {addr, profileId, clusterId, transactionSequenceNumber, resolve, reject, ts};
            this.openRequestsQueue.push(req);
        });
    }

    private checkReceivedGreenPowerIndication(ind: gpDataInd) {
        ind.clusterId = 0x21;

        let gpFrame = [ind.rspId, ind.seqNr, ind.id, ind.options & 0xff, (ind.options >> 8) & 0xff,
        ind.srcId & 0xff, (ind.srcId >> 8) & 0xff, (ind.srcId >> 16) & 0xff, (ind.srcId >> 24) & 0xff,
        ind.frameCounter & 0xff, (ind.frameCounter >> 8) & 0xff, (ind.frameCounter >> 16) & 0xff, (ind.frameCounter >> 24) & 0xff,
        ind.commandId, ind.commandFrameSize].concat(ind.commandFrame);

        const payBuf = Buffer.from(gpFrame);
        const payload: Events.ZclDataPayload = {
            frame: ZclFrame.fromBuffer(ind.clusterId, payBuf),
            address: ind.srcId,
            endpoint: 242, // GP endpoint
            linkquality: 127,
            groupID: 0x0b84,
            wasBroadcast: false,
            destinationEndpoint: 1,
        };

        this.waitress.resolve(payload);
        this.emit(Events.Events.zclData, payload);
    }

    private checkReceivedDataPayload(resp: ReceivedDataResponse) {
        let srcAddr: any = null;
        let frame: ZclFrame = null;

        if (resp != null) {
            srcAddr = (resp.srcAddr16 != null) ? resp.srcAddr16 : resp.srcAddr64;
            if (resp.profileId != 0x00) {
                try {
                    frame = ZclFrame.fromBuffer(resp.clusterId, Buffer.from(resp.asduPayload));
                } catch (error) {
                    debug("could not parse zclFrame: " + error);
                }
            }
        }

        let i = this.openRequestsQueue.length;
        while (i--) {
            const req: WaitForDataRequest = this.openRequestsQueue[i];
            if (srcAddr != null && req.addr === srcAddr && req.clusterId === resp.clusterId &&
                req.profileId === resp.profileId) {
                if (frame !== null && req.transactionSequenceNumber !== null && req.transactionSequenceNumber !== undefined) {
                    if (req.transactionSequenceNumber === frame.Header.transactionSequenceNumber) {
                        debug("resolve data request with transSeq Nr.: " + req.transactionSequenceNumber);
                        this.openRequestsQueue.splice(i, 1);
                        req.resolve(resp);
                    }
                } else {
                    debug("resolve data request without a transSeq Nr.");
                    this.openRequestsQueue.splice(i, 1);
                    req.resolve(resp);
                }
            }

            const now = Date.now();
            if ((now - req.ts) > 60000) { // 60 seconds
                //debug("Timeout for request in openRequestsQueue addr: " + req.addr.toString(16) + " clusterId: " + req.clusterId.toString(16) + " profileId: " + req.profileId.toString(16));
                //remove from busyQueue
                this.openRequestsQueue.splice(i, 1);
                req.reject("waiting for response TIMEOUT");
            }
        }

        // check unattended incomming messages
        if (resp != null && resp.profileId === 0x00 && resp.clusterId === 0x13) {
            // device Annce
            const payBuf = Buffer.from(resp.asduPayload);
            const payload: Events.DeviceJoinedPayload = {
                networkAddress: payBuf.readUInt16LE(1),
                ieeeAddr: this.driver.macAddrArrayToString(resp.asduPayload.slice(3,11)),
            };
            if (this.joinPermitted === true) {
                this.emit(Events.Events.deviceJoined, payload);
            } else {
                this.emit(Events.Events.deviceAnnounce, payload);
            }
        }

        if (resp != null && resp.profileId != 0x00) {
            const payBuf = Buffer.from(resp.asduPayload);
            try {
                const payload: Events.ZclDataPayload = {
                    frame: ZclFrame.fromBuffer(resp.clusterId, payBuf),
                    address: (resp.destAddrMode === 0x03) ? resp.srcAddr64 : resp.srcAddr16,
                    endpoint: resp.srcEndpoint,
                    linkquality: resp.lqi,
                    groupID: (resp.destAddrMode === 0x01) ? resp.destAddr16 : null,
                    wasBroadcast: resp.destAddrMode === 0x01 || resp.destAddrMode === 0xF,
                    destinationEndpoint: resp.destEndpoint,
                };

                this.waitress.resolve(payload);
                this.emit(Events.Events.zclData, payload);
            } catch (error) {
                const payload: Events.RawDataPayload = {
                    clusterID: resp.clusterId,
                    data: payBuf,
                    address: (resp.destAddrMode === 0x03) ? resp.srcAddr64 : resp.srcAddr16,
                    endpoint: resp.srcEndpoint,
                    linkquality: resp.lqi,
                    groupID: (resp.destAddrMode === 0x01) ? resp.destAddr16 : null,
                    wasBroadcast: resp.destAddrMode === 0x01 || resp.destAddrMode === 0xF,
                    destinationEndpoint: resp.destEndpoint,
                };

                this.emit(Events.Events.rawData, payload);
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


export default DeconzAdapter;
