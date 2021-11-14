/* istanbul ignore file */
/* eslint-disable */
import * as TsType from '../../tstype';
import {ActiveEndpoints, DeviceType, LQI, LQINeighbor, NodeDescriptor, SimpleDescriptor} from '../../tstype';
import * as Events from '../../events';
import Adapter from '../../adapter';
import {Direction, Foundation, FrameType, ZclFrame} from '../../../zcl';
import {Queue, Wait, Waitress} from '../../../utils';
import Driver from '../driver/zigate';
import {Debug} from "../debug";
import {
    ADDRESS_MODE,
    coordinatorEndpoints,
    DEVICE_TYPE,
    ZiGateCommandCode,
    ZiGateMessageCode,
    ZPSNwkKeyState
} from "../driver/constants";
import {RawAPSDataRequestPayload} from "../driver/commandType";
import ZiGateObject from "../driver/ziGateObject";
import {Buffalo} from "../../../buffalo";
import {LoggerStub} from "../../../controller/logger-stub";
import * as Models from "../../../models";

const debug = Debug('adapter');
const default_bind_group = 901;  // https://github.com/Koenkk/zigbee-herdsman-converters/blob/master/lib/constants.js#L3
interface WaitressMatcher {
    address: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    frameType: FrameType;
    clusterID: number;
    commandIdentifier: number;
    direction: number;
}

const channelsToMask = (channels: number[]): number =>
    channels.map((x) => 2 ** x).reduce(
        (acc, x) => acc + x, 0);


class ZiGateAdapter extends Adapter {
    private driver: Driver;
    private joinPermitted: boolean;
    private waitress: Waitress<Events.ZclDataPayload, WaitressMatcher>;
    private closing: boolean;
    private queue: Queue;

    public constructor(networkOptions: TsType.NetworkOptions,
                       serialPortOptions: TsType.SerialPortOptions,
                       backupPath: string,
                       adapterOptions: TsType.AdapterOptions,
                       logger?: LoggerStub
    ) {

        super(networkOptions, serialPortOptions, backupPath, adapterOptions, logger);

        this.joinPermitted = false;
        this.driver = new Driver(serialPortOptions.path, serialPortOptions);
        this.waitress = new Waitress<Events.ZclDataPayload, WaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter
        );

        this.driver.on('received', this.zclDataListener.bind(this));
        this.driver.on('receivedRaw', this.rawDataListener.bind(this));
        this.driver.on('LeaveIndication', this.leaveIndicationListener.bind(this));
        this.driver.on('DeviceAnnounce', this.deviceAnnounceListener.bind(this));
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<TsType.StartResult> {
        let startResult: TsType.StartResult = 'resumed';
        try {
            await this.driver.open();
            debug.log("Connected to ZiGate adapter successfully.");

            const resetResponse = await this.driver.sendCommand(ZiGateCommandCode.Reset, {}, 5000)
            if (resetResponse.code === ZiGateMessageCode.RestartNonFactoryNew) {
                startResult = 'resumed';
            } else if (resetResponse.code === ZiGateMessageCode.RestartFactoryNew) {
                startResult = 'reset';
            }
            await this.driver.sendCommand(ZiGateCommandCode.RawMode, {enabled: 0x01});
            // @todo check
            await this.driver.sendCommand(ZiGateCommandCode.SetDeviceType, {
                deviceType: DEVICE_TYPE.coordinator
            });
            await this.initNetwork();

            await this.driver.sendCommand(ZiGateCommandCode.AddGroup, {
                addressMode: ADDRESS_MODE.short ,
                shortAddress: 0x0000,
                sourceEndpoint:0x01,
                destinationEndpoint:0x01,
                groupAddress: default_bind_group
            });
        } catch (error) {
            throw new Error("failed to connect to zigate adapter " + error.message);
        }

        const concurrent = this.adapterOptions && this.adapterOptions.concurrent ?
            this.adapterOptions.concurrent : 2;
        debug.log(`Adapter concurrent: ${concurrent}`);
        this.queue = new Queue(concurrent);

        return startResult; // 'resumed' | 'reset' | 'restored'
    }

    public async stop(): Promise<void> {
        this.closing = true;
        await this.driver.close();
    }

    public async getCoordinator(): Promise<TsType.Coordinator> {
        debug.log('getCoordinator');
        const networkResponse: any = await this.driver.sendCommand(ZiGateCommandCode.GetNetworkState);

        // @TODO deal hardcoded endpoints, made by analogy with deconz
        // polling the coordinator on some firmware went into a memory leak, so we don't ask this info
        const response: TsType.Coordinator = {
            networkAddress: 0,
            manufacturerID: 0,
            ieeeAddr: networkResponse.payload.extendedAddress,
            endpoints: coordinatorEndpoints
        };
        debug.log('getCoordinator %o', response)
        return response;
    };

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        debug.log('getCoordinatorVersion');
        return this.driver.sendCommand(ZiGateCommandCode.GetVersion, {})
            .then((result) => {
                const meta = {
                    "transportrev": 0,
                    "product": 0,
                    "majorrel": parseInt(<string>result.payload.major).toString(16),
                    "minorrel": parseInt(<string>result.payload.minor).toString(16),
                    "maintrel": parseInt(<string>result.payload.revision).toString(16),
                    "revision": parseInt(<string>result.payload.revision).toString(16),
                };
                const version: TsType.CoordinatorVersion = {
                    type: 'zigate',
                    meta: meta,
                };
                return Promise.resolve(version)
            })
            .catch((e) => {
                debug.error(e);
                return Promise.reject()
            });
    };

    public async permitJoin(seconds: number, networkAddress: number): Promise<void> {
        const result = await this.driver.sendCommand(ZiGateCommandCode.PermitJoin, {
            targetShortAddress: networkAddress || 0xFFFC,
            interval: seconds,
            TCsignificance: 0
        });

        // const result = await this.driver.sendCommand(ZiGateCommandCode.PermitJoinStatus, {});
        // Suitable only for the coordinator, not the entire network or point-to-point for routers
        this.joinPermitted = result.payload.status === 0;
    };

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        debug.log('reset %s', type);

        if (type === 'soft') {
            await this.driver.sendCommand(ZiGateCommandCode.Reset, {}, 5000);
        } else if (type === 'hard') {
            await this.driver.sendCommand(ZiGateCommandCode.ErasePersistentData, {}, 5000);
        }
        return Promise.resolve();
    };

    public async getNetworkParameters(): Promise<TsType.NetworkParameters> {
        debug.log('getNetworkParameters');
        return this.driver.sendCommand(ZiGateCommandCode.GetNetworkState, {}, 10000)
            .then((NetworkStateResponse) => {
                const resultPayload: TsType.NetworkParameters = {
                    panID: <number>NetworkStateResponse.payload.PANID,
                    extendedPanID: <number>NetworkStateResponse.payload.ExtPANID,
                    channel: <number>NetworkStateResponse.payload.Channel
                }
                return Promise.resolve(resultPayload)
            }).catch(() => Promise.reject());
    };

    /**
     * https://zigate.fr/documentation/deplacer-le-pdm-de-la-zigate/
     * pdm from host
     */
    public async supportsBackup(): Promise<boolean> {
        return false;
    };

    public async backup(): Promise<Models.Backup> {
        throw new Error("This adapter does not support backup");
    };

    public async setTransmitPower(value: number): Promise<void> {
        debug.log('setTransmitPower, %o', arguments);
        return this.driver.sendCommand(ZiGateCommandCode.SetTXpower, {value: value})
            .then(() => Promise.resolve()).catch(() => Promise.reject());
    };

    public async lqi(networkAddress: number): Promise<TsType.LQI> {

        return this.queue.execute<LQI>(async (): Promise<LQI> => {
            debug.log('lqi, %o', arguments)

            const neighbors: LQINeighbor[] = [];

            const add = (list: any) => {
                for (const entry of list) {
                    const relationByte = entry.readUInt8(18);
                    const extAddr: Buffer = entry.slice(8, 16);
                    neighbors.push({
                        linkquality: entry.readUInt8(21),
                        networkAddress: entry.readUInt16LE(16),
                        ieeeAddr: new Buffalo(extAddr).readIeeeAddr(),
                        relationship: (relationByte >> 1) & ((1 << 3) - 1),
                        depth: entry.readUInt8(20)
                    });
                }
            };

            const request = async (startIndex: number): Promise<any> => {
                try {
                    const resultPayload = await this.driver.sendCommand(ZiGateCommandCode.ManagementLQI,
                        {targetAddress: networkAddress, startIndex: startIndex}
                    );
                    const data = <Buffer>resultPayload.payload.payload;

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

                    debug.log("LQI RESPONSE - addr: " + networkAddress.toString(16) + " status: "
                        + response.status + " read " + (response.tableListCount + response.startIndex)
                        + "/" + response.tableEntrys + " entrys");
                    return response;
                } catch (error) {
                    debug.log("LQI REQUEST FAILED - addr: 0x" + networkAddress.toString(16) + " " + error);
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
        }, networkAddress);
    };

    // @TODO
    public routingTable(networkAddress: number): Promise<TsType.RoutingTable> {
        debug.log('RoutingTable, %o', arguments)
        return;
    };

    public async nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor> {
        return this.queue.execute<NodeDescriptor>(async () => {
            debug.log('nodeDescriptor, \n %o', arguments)

            try {
                const nodeDescriptorResponse = await this.driver.sendCommand(
                    ZiGateCommandCode.NodeDescriptor, {
                        targetShortAddress: networkAddress
                    }
                );

                const data: Buffer = <Buffer>nodeDescriptorResponse.payload.payload;
                const buf = data;
                const logicaltype = (data[4] & 7);
                let type: DeviceType = 'Unknown';
                switch (logicaltype) {
                    case 1:
                        type = 'Router';
                        break;
                    case 2:
                        type = 'EndDevice';
                        break;
                    case 0:
                        type = 'Coordinator';
                        break;

                }
                const manufacturer = buf.readUInt16LE(7);

                debug.log("RECEIVING NODE_DESCRIPTOR - addr: 0x" + networkAddress.toString(16)
                    + " type: " + type + " manufacturer: 0x" + manufacturer.toString(16));

                return {manufacturerCode: manufacturer, type};
            } catch (error) {
                debug.error("RECEIVING NODE_DESCRIPTOR FAILED - addr: 0x"
                    + networkAddress.toString(16) + " " + error);
                return Promise.reject();
            }
        }, networkAddress);
    };

    public async activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints> {
        return this.queue.execute<ActiveEndpoints>(async () => {
            debug.log('ActiveEndpoints request');
            const payload = {
                targetShortAddress: networkAddress
            }
            try {
                const result = await this.driver.sendCommand(ZiGateCommandCode.ActiveEndpoint, payload);
                const buf = Buffer.from(<Buffer>result.payload.payload);
                const epCount = buf.readUInt8(4);
                const epList = [];
                for (let i = 5; i < (epCount + 5); i++) {
                    epList.push(buf.readUInt8(i));
                }

                const payloadAE: TsType.ActiveEndpoints = {
                    endpoints: <number[]>epList
                }

                debug.log('ActiveEndpoints response: %o', payloadAE);
                return payloadAE;

            } catch (error) {
                debug.error("RECEIVING ActiveEndpoints FAILED, %o", error);
                return Promise.reject();
            }
        }, networkAddress);
    };

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor> {
        return this.queue.execute<SimpleDescriptor>(async () => {
            debug.log('SimpleDescriptor request: %o', arguments)

            try {
                const payload = {
                    targetShortAddress: networkAddress,
                    endpoint: endpointID
                }
                const result = await this.driver.sendCommand(ZiGateCommandCode.SimpleDescriptor, payload);

                const buf: Buffer = <Buffer>result.payload.payload;

                if (buf.length > 11) {

                    const inCount = buf.readUInt8(11);
                    const inClusters = [];
                    let cIndex = 12;
                    for (let i = 0; i < inCount; i++) {
                        inClusters[i] = buf.readUInt16LE(cIndex);
                        cIndex += 2;
                    }
                    const outCount = buf.readUInt8(12 + (inCount * 2));
                    const outClusters = [];
                    cIndex = 13 + (inCount * 2);
                    for (let l = 0; l < outCount; l++) {
                        outClusters[l] = buf.readUInt16LE(cIndex);
                        cIndex += 2;
                    }

                    const resultPayload: TsType.SimpleDescriptor = {
                        profileID: buf.readUInt16LE(6),
                        endpointID: buf.readUInt8(5),
                        deviceID: buf.readUInt16LE(8),
                        inputClusters: inClusters,
                        outputClusters: outClusters
                    }

                    return resultPayload;
                }
            } catch (error) {
                debug.error("RECEIVING SIMPLE_DESCRIPTOR FAILED - addr: 0x" + networkAddress.toString(16)
                    + " EP:" + endpointID + " " + error);
                return Promise.reject();
            }

        }, networkAddress);
    };

    public async bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void> {
        return this.queue.execute<void>(async () => {
            debug.log('bind %o', arguments);
            let payload = {
                targetExtendedAddress: sourceIeeeAddress,
                targetEndpoint: sourceEndpoint,
                clusterID: clusterID,
                destinationAddressMode: (type === 'group') ? ADDRESS_MODE.group : ADDRESS_MODE.ieee,
                destinationAddress: destinationAddressOrGroup,
            };

            if (typeof destinationEndpoint !== undefined) {
                // @ts-ignore
                payload['destinationEndpoint'] = destinationEndpoint
            }
            const result = await this.driver.sendCommand(ZiGateCommandCode.Bind, payload,
                null, {destinationNetworkAddress}
            );

            let data = <Buffer>result.payload.payload;
            if (data[1] === 0) {
                debug.log('Bind %s success', sourceIeeeAddress);
                return Promise.resolve();
            } else {
                debug.error('Bind %s failed', sourceIeeeAddress);
                return Promise.reject();
            }
        }, destinationNetworkAddress);
    };

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {
        return this.queue.execute<void>(async () => {
            debug.log('unbind %o', arguments);
            let payload = {
                targetExtendedAddress: sourceIeeeAddress,
                targetEndpoint: sourceEndpoint,
                clusterID: clusterID,
                destinationAddressMode: (type === 'group') ? ADDRESS_MODE.group : ADDRESS_MODE.ieee,
                destinationAddress: destinationAddressOrGroup,
            };

            if (typeof destinationEndpoint !== undefined) {
                // @ts-ignore
                payload['destinationEndpoint'] = destinationEndpoint
            }
            const result = await this.driver.sendCommand(ZiGateCommandCode.UnBind, payload,
                null,
                {destinationNetworkAddress});


            let data = <Buffer>result.payload.payload;
            if (data[1] === 0) {
                debug.log('Unbind %s success', sourceIeeeAddress);
                return Promise.resolve();
            } else {
                debug.error('Unbind %s failed', sourceIeeeAddress);
                return Promise.reject();
            }
        }, destinationNetworkAddress);
    };

    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        return this.queue.execute<void>(async () => {
            const payload = {
                shortAddress: networkAddress,
                extendedAddress: ieeeAddr,
                rejoin: 0,
                removeChildren: 0
            };

            return this.driver.sendCommand(ZiGateCommandCode.ManagementLeaveRequest, payload)
                .then((Response) => {
                    return Promise.resolve()
                }).catch(() => Promise.reject());
        }, networkAddress);
    };

    public async sendZclFrameToEndpoint(
        ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number,
    ): Promise<Events.ZclDataPayload> {
        return this.queue.execute<Events.ZclDataPayload>(async () => {
            return this.sendZclFrameToEndpointInternal(
                ieeeAddr, networkAddress, endpoint, sourceEndpoint || 1, zclFrame, timeout, disableResponse,
                disableRecovery, 0, 0, false, false
            );
        }, networkAddress);
    };

    private async sendZclFrameToEndpointInternal(
        ieeeAddr: string, networkAddress: number, endpoint: number, sourceEndpoint: number, zclFrame: ZclFrame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean,
        responseAttempt: number, dataRequestAttempt: number, checkedNetworkAddress: boolean, discoveredRoute: boolean,
    ): Promise<Events.ZclDataPayload> {
        debug.info('sendZclFrameToEndpointInternal %s:%i/%i (%i,%i,%i)',
            ieeeAddr, networkAddress, endpoint, responseAttempt, dataRequestAttempt, this.queue.count());
        let response = null;

        const data = zclFrame.toBuffer();
        const command = zclFrame.getCommand();
        const payload: RawAPSDataRequestPayload = {
            addressMode: ADDRESS_MODE.short, //nwk
            targetShortAddress: networkAddress,
            sourceEndpoint: sourceEndpoint || 0x01,
            destinationEndpoint: endpoint,
            profileID: 0x0104,
            clusterID: zclFrame.Cluster.ID,
            securityMode: 0x02,
            radius: 30,
            dataLength: data.length,
            data: data,
        }

        if (command.hasOwnProperty('response') && disableResponse === false) {
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
        await this.driver.sendCommand(
            ZiGateCommandCode.RawAPSDataRequest, payload,
            undefined, {},
            disableResponse
        ).catch((e) => {
            if (responseAttempt < 1 && !disableRecovery) {
                // @todo discover route
                return this.sendZclFrameToEndpointInternal(
                    ieeeAddr, networkAddress, endpoint, sourceEndpoint, zclFrame, timeout, disableResponse,
                    disableRecovery, responseAttempt + 1, dataRequestAttempt, checkedNetworkAddress,
                    discoveredRoute,
                );
            }
        });

        // @TODO add dataConfirmResult
        // @TODO if error codes route / no_resourses wait and resend
        if (response !== null) {
            try {
                // @ts-ignore
                return await response.promise;

                // @todo discover route
            } catch (error) {
                debug.error('Response error %s (%s:%d,%d)', error.toString(), ieeeAddr, networkAddress, responseAttempt);
                if (responseAttempt < 1 && !disableRecovery) {
                    return this.sendZclFrameToEndpointInternal(
                        ieeeAddr, networkAddress, endpoint, sourceEndpoint, zclFrame, timeout, disableResponse,
                        disableRecovery, responseAttempt + 1, dataRequestAttempt, checkedNetworkAddress,
                        discoveredRoute,
                    );
                } else {
                    throw error;
                }
            }
        } else {
            return null;
        }
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: ZclFrame, sourceEndpoint: number): Promise<void> {
        return this.queue.execute<void>(async () => {
            if (sourceEndpoint !== 0x01 /*&& sourceEndpoint !== 242*/) { // @todo on zigate firmware without gp causes hang
                debug.error('source endpoint %d, not supported', sourceEndpoint);
                return;
            }

            const data = zclFrame.toBuffer();
            const payload: RawAPSDataRequestPayload = {
                addressMode: ADDRESS_MODE.short, //nwk
                targetShortAddress: 0xFFFD,
                sourceEndpoint: sourceEndpoint,
                destinationEndpoint: endpoint,
                profileID: /*sourceEndpoint === 242 ? 0xa1e0 :*/ 0x0104,
                clusterID: zclFrame.Cluster.ID,
                securityMode: 0x02,
                radius: 30,
                dataLength: data.length,
                data: data,
            }
            debug.log('sendZclFrameToAll %o', payload)

            await this.driver.sendCommand(ZiGateCommandCode.RawAPSDataRequest, payload, undefined, {}, true);
            await Wait(200);
        });
    };

    public async sendZclFrameToGroup(groupID: number, zclFrame: ZclFrame, sourceEndpoint?: number): Promise<void> {
        return this.queue.execute<void>(async () => {
            debug.log('sendZclFrameToGroup %o', arguments);
            const data = zclFrame.toBuffer();
            const payload: RawAPSDataRequestPayload = {
                addressMode: ADDRESS_MODE.group, //nwk
                targetShortAddress: groupID,
                sourceEndpoint: sourceEndpoint || 0x01,
                destinationEndpoint: 0xFF,
                profileID: 0x0104,
                clusterID: zclFrame.Cluster.ID,
                securityMode: 0x02,
                radius: 30,
                dataLength: data.length,
                data: data,
            }
            debug.log('sendZclFrameToGroup: \n %o', payload);

            await this.driver.sendCommand(ZiGateCommandCode.RawAPSDataRequest, payload, undefined, {}, true);
            await Wait(200);
        });
    };

    /**
     * Supplementary functions
     */
    private async initNetwork(): Promise<void> {
        debug.log(`Set channel mask ${this.networkOptions.channelList} key`);
        await this.driver.sendCommand(
            ZiGateCommandCode.SetChannelMask,
            {channelMask: channelsToMask(this.networkOptions.channelList)},
        );

        debug.log(`Set security key`);
        await this.driver.sendCommand(
            ZiGateCommandCode.SetSecurityStateKey,
            {
                keyType: this.networkOptions.networkKeyDistribute ?
                    ZPSNwkKeyState.ZPS_ZDO_DISTRIBUTED_LINK_KEY :
                    ZPSNwkKeyState.ZPS_ZDO_PRECONFIGURED_LINK_KEY,
                key: this.networkOptions.networkKey,
            },
        );

        try {
            // The block is wrapped in trapping because if the network is already created, the firmware does not accept the new key.
            debug.log('Set EPanID %h', this.networkOptions.extendedPanID);
            await this.driver.sendCommand(ZiGateCommandCode.SetExtendedPANID, {
                panId: this.networkOptions.extendedPanID,
            });

            await this.driver.sendCommand(ZiGateCommandCode.StartNetwork, {});
        } catch (e) {
            // @TODO Depending on the type of error, output clear text to the user
            debug.error("%o", e);
        }
        return Promise.resolve();
    }

    public waitFor(
        networkAddress: number, endpoint: number, frameType: FrameType, direction: Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): { promise: Promise<Events.ZclDataPayload>; cancel: () => void } {
        debug.log('waitForInternal %o', arguments)
        const payload = {
            address: networkAddress,
            endpoint,
            clusterID,
            commandIdentifier,
            frameType,
            direction,
            transactionSequenceNumber,
        };
        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {promise: waiter.start().promise, cancel};
    };


    public static async isValidPath(path: string): Promise<boolean> {
        return Driver.isValidPath(path);
    }

    public static async autoDetectPath(): Promise<string> {
        return Driver.autoDetectPath();
    }

    /**
     * InterPAN !!! not implemented
     */
    public async setChannelInterPAN(channel: number): Promise<void> {
        debug.log('setChannelInterPAN', arguments)
        return Promise.reject();
    };

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: ZclFrame, ieeeAddress: string): Promise<void> {
        debug.log('sendZclFrameInterPANToIeeeAddr', arguments)
        return Promise.reject();
    };

    public async sendZclFrameInterPANBroadcast(
        zclFrame: ZclFrame, timeout: number
    ): Promise<Events.ZclDataPayload> {
        debug.log('sendZclFrameInterPANBroadcast', arguments)
        return Promise.reject();
    };

    public restoreChannelInterPAN(): Promise<void> {
        debug.log('restoreChannelInterPAN', arguments)
        return Promise.reject();
    };


    private deviceAnnounceListener(networkAddress: number, ieeeAddr: string): void {
        // @todo debounce
        const payload: Events.DeviceAnnouncePayload = {networkAddress, ieeeAddr};
        if (this.joinPermitted === true) {
            this.emit(Events.Events.deviceJoined, payload)
        } else {
            this.emit(Events.Events.deviceAnnounce, payload)
        }
    }

    private zclDataListener(data: { ziGateObject: ZiGateObject, zclFrame: ZclFrame }): void {
        if (data.zclFrame instanceof ZclFrame) {
            const payload: Events.ZclDataPayload = {
                address: <number>data.ziGateObject.payload.sourceAddress,
                frame: data.zclFrame,
                endpoint: <number>data.ziGateObject.payload.sourceEndpoint,
                linkquality: data.ziGateObject.frame.readRSSI(),
                groupID: null, // @todo
                wasBroadcast: false, // TODO
                destinationEndpoint: <number>data.ziGateObject.payload.destinationEndpoint,
            };
            this.waitress.resolve(payload);
            this.emit(Events.Events.zclData, payload)
        } else {
            debug.error('msg not zclFrame', data.zclFrame);
        }
    }

    private rawDataListener(data: { ziGateObject: ZiGateObject }): void {
        const payload: Events.RawDataPayload = {
            clusterID: <number>data.ziGateObject.payload.clusterID,
            data: <Buffer>data.ziGateObject.payload.payload,
            address: <number>data.ziGateObject.payload.sourceAddress,
            endpoint: <number>data.ziGateObject.payload.sourceEndpoint,
            linkquality: data.ziGateObject.frame.readRSSI(),
            groupID: null,
            wasBroadcast: false, // TODO
            destinationEndpoint: <number>data.ziGateObject.payload.destinationEndpoint,
        };

        this.emit(Events.Events.rawData, payload);
    }

    private leaveIndicationListener(data: { ziGateObject: ZiGateObject }): void {
        debug.log('LeaveIndication %o', data);
        const payload: Events.DeviceLeavePayload = {
            networkAddress: <number>data.ziGateObject.payload.extendedAddress,
            ieeeAddr: <string>data.ziGateObject.payload.extendedAddress
        };
        this.emit(Events.Events.deviceLeave, payload)
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return `Timeout - ${matcher.address} - ${matcher.endpoint}` +
            ` - ${matcher.transactionSequenceNumber} - ${matcher.clusterID}` +
            ` - ${matcher.commandIdentifier} after ${timeout}ms`;
    }

    private waitressValidator(payload: Events.ZclDataPayload, matcher: WaitressMatcher): boolean {
        const transactionSequenceNumber = payload.frame.Header.transactionSequenceNumber;
        return (!matcher.address || payload.address === matcher.address) &&
            matcher.endpoint === payload.endpoint &&
            (!matcher.transactionSequenceNumber || transactionSequenceNumber === matcher.transactionSequenceNumber) &&
            matcher.clusterID === payload.frame.Cluster.ID &&
            matcher.frameType === payload.frame.Header.frameControl.frameType &&
            matcher.commandIdentifier === payload.frame.Header.commandIdentifier &&
            matcher.direction === payload.frame.Header.frameControl.direction;
    }
}

export default ZiGateAdapter;
