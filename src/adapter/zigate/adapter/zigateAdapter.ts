/* istanbul ignore file */
/* eslint-disable */
import * as TsType from '../../tstype';
import {DeviceType, LQINeighbor} from '../../tstype';
import * as Events from '../../events';
import Adapter from '../../adapter';
import {Direction, FrameType, ZclFrame} from '../../../zcl';
import {Waitress} from '../../../utils';
import Driver from '../driver/zigate';
import {Debug} from "../debug";
import {
    coordinatorEndpoints,
    DEVICE_TYPE,
    ZiGateCommandCode,
    ZiGateMessageCode,
    ZPSNwkKeyState
} from "../driver/constants";
import {RawAPSDataRequestPayload} from "../driver/commandType";
import ZiGateObject from "../driver/ziGateObject";
import BuffaloZiGate from "../driver/buffaloZiGate";

const debug = Debug('adapter');

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

    public constructor(networkOptions: TsType.NetworkOptions,
                       serialPortOptions: TsType.SerialPortOptions,
                       backupPath: string,
                       adapterOptions: TsType.AdapterOptions
    ) {

        super(networkOptions, serialPortOptions, backupPath, adapterOptions);

        debug.log('construct', arguments);

        this.joinPermitted = false;
        this.driver = new Driver(serialPortOptions.path, serialPortOptions);
        this.waitress = new Waitress<Events.ZclDataPayload, WaitressMatcher>(
            this.waitressValidator, this.waitressTimeoutFormatter
        );

        this.driver.on('received', (data: any) => {
            if (data.zclFrame instanceof ZclFrame) {
                const payload: Events.ZclDataPayload = {
                    address: data.ziGateObject.payload.sourceAddress,
                    frame: data.zclFrame,
                    endpoint: data.ziGateObject.payload.sourceEndpoint,
                    linkquality: data.ziGateObject.frame.readRSSI(),
                    groupID: null,
                };
                this.emit(Events.Events.zclData, payload)
            } else {
                debug.error('msg not zclFrame', data.zclFrame);
            }
        });

        this.driver.on('receivedRaw', (data: any) => {
            const payload: Events.RawDataPayload = {
                clusterID: data.ziGateObject.payload.clusterID,
                data: data.ziGateObject.payload.payload,
                address: data.ziGateObject.payload.sourceAddress,
                endpoint: data.ziGateObject.payload.sourceEndpoint,
                linkquality: data.ziGateObject.frame.readRSSI(),
                groupID: null
            };

            this.emit(Events.Events.rawData, payload);
        });

        this.driver.on('LeaveIndication', (data: any) => {
            debug.log('LeaveIndication %o', data);
            const payload: Events.DeviceLeavePayload = {
                networkAddress: data.ziGateObject.payload.extendedAddress,
                ieeeAddr: data.ziGateObject.payload.extendedAddress
            };
            this.emit(Events.Events.deviceLeave, payload)
        });

        this.driver.on('DeviceAnnounce', (data: any) => {
            const payload: Events.DeviceAnnouncePayload = {
                networkAddress: data.ziGateObject.payload.shortAddress,
                ieeeAddr: data.ziGateObject.payload.ieee
            };

            debug.log('DeviceAnnounce join permit(%s) : %o', this.joinPermitted, data.ziGateObject.payload);
            if (this.joinPermitted === true) {
                this.emit(Events.Events.deviceJoined, payload)
            } else {
                this.emit(Events.Events.deviceAnnounce, payload)
            }
        });

    }

    /**
     * Adapter methods
     */
    public async start(): Promise<TsType.StartResult> {
        debug.log('start', arguments)
        let startResult: TsType.StartResult = 'resumed';
        try {
            debug.log("connected to zigate adapter successfully.", arguments);
            await this.driver.sendCommand(ZiGateCommandCode.SetDeviceType, {deviceType: 0});

            const resetResponse = await this.driver.sendCommand(ZiGateCommandCode.Reset, {}, 5000)
            if (resetResponse.code === ZiGateMessageCode.RestartNonFactoryNew) {
                startResult = 'resumed';
            } else if (resetResponse.code === ZiGateMessageCode.RestartFactoryNew) {
                startResult = 'reset';
            }

            await this.driver.sendCommand(ZiGateCommandCode.SetDeviceType, {
                deviceType: DEVICE_TYPE.coordinator
            });
            await this.driver.sendCommand(ZiGateCommandCode.RawMode, {enabled: 0x01});
            await this.initNetwork();
        } catch(error) {
            throw new Error("failed to connect to zigate adapter\n %o", error);
        }

        return startResult; // 'resumed' | 'reset' | 'restored'
    }

    public async getCoordinator(): Promise<TsType.Coordinator> {
        debug.log('getCoordinator', arguments)
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

    public async stop(): Promise<void> {
        debug.log('stop', arguments)
        this.closing = true;
        await this.driver.close();
    }

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        debug.log('getCoordinatorVersion');

        return this.driver.sendCommand(ZiGateCommandCode.GetVersion, {})
            .then((result) => {
                const formattedVersion = parseInt(<string>result.payload.installerVersion).toString(16);
                const version: TsType.CoordinatorVersion = {
                    type: 'zigate',
                    meta: {
                        'major': formattedVersion
                    }
                };
                return Promise.resolve(version)
            }).catch(() => Promise.reject());
    };

    public async getNetworkParameters(): Promise<TsType.NetworkParameters> {
        debug.log('getNetworkParameters, %o ', arguments)

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

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        debug.log('reset', type, arguments)

        if (type === 'soft') {
            await this.driver.sendCommand(ZiGateCommandCode.Reset, {}, 5000);
            return Promise.resolve();
        } else if (type === 'hard') {
            await this.driver.sendCommand(ZiGateCommandCode.ErasePersistentData, {}, 5000);
            return Promise.resolve();
        }
    };

    public supportsLED(): Promise<boolean> {
        return Promise.reject();
    };

    public setLED(enabled: boolean): Promise<void> {
        return Promise.reject();
    };

    /**
     * https://zigate.fr/documentation/deplacer-le-pdm-de-la-zigate/
     * pdm from host
     */
    public async supportsBackup(): Promise<boolean> {
        return false;
    };

    public async backup(): Promise<TsType.Backup> {
        return Promise.reject();
    };

    public async setTransmitPower(value: number): Promise<void> {
        debug.log('setTransmitPower, %o', arguments);
        return this.driver.sendCommand(ZiGateCommandCode.SetTXpower, {value: value})
            .then(() => Promise.resolve()).catch(() => Promise.reject());
    };

    public async permitJoin(seconds: number, networkAddress: number): Promise<void> {
        await this.driver.sendCommand(ZiGateCommandCode.PermitJoin, {
            targetShortAddress: networkAddress || 0,
            interval: seconds,
            TCsignificance: 0
        });

        const result = await this.driver.sendCommand(ZiGateCommandCode.PermitJoinStatus, {});
        this.joinPermitted = result.payload.status === 1;
    };

    // @TODO
    public async lqi(networkAddress: number): Promise<TsType.LQI> {
        debug.log('lqi, %o', arguments)

        const neighbors: LQINeighbor[] = [];

        const add = (list: any) => {
            for (const entry of list) {
                const relationByte = entry.readUInt8(18);
                const extAddr: Buffer = entry.slice(8, 16);
                neighbors.push({
                    linkquality: entry.readUInt8(21),
                    networkAddress: entry.readUInt16LE(16),
                    ieeeAddr: BuffaloZiGate.addressBufferToStringBE(extAddr),
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
    };

    // @TODO
    public routingTable(networkAddress: number): Promise<TsType.RoutingTable> {
        debug.log('RoutingTable, %o', arguments)
        return Promise.reject();
    };

    public async nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor> {
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
    };

    public async activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints> {
        debug.log('ActiveEndpoints request: %o', arguments);
        const payload = {
            targetShortAddress: networkAddress
        }

        try {
            const result = await this.driver.sendCommand(ZiGateCommandCode.ActiveEndpoint, payload);

            const zclFrame = ZiGateObject.fromBufer(
                ZiGateMessageCode.ActiveEndpointResponse, <Buffer>result.payload.payload);
            const payloadAE: TsType.ActiveEndpoints = {
                endpoints: <number[]>zclFrame.payload.endpoints
            }

            debug.log('ActiveEndpoints response: %o', payloadAE);
            return payloadAE;

        } catch (error) {
            debug.error("RECEIVING ActiveEndpoints FAILED, %o", error);
            return Promise.reject();
        }
    };

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor> {
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

                debug.log(resultPayload);
                return resultPayload;
            }
        } catch (error) {
            debug.error("RECEIVING SIMPLE_DESCRIPTOR FAILED - addr: 0x" + networkAddress.toString(16)
                + " EP:" + endpointID + " " + error);
            return Promise.reject();
        }
    };

    public async bind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint?: number
    ): Promise<void> {
        debug.error('bind', arguments);
        let payload = {
            targetExtendedAddress: sourceIeeeAddress,
            targetEndpoint: sourceEndpoint,
            clusterID: clusterID,
            destinationAddressMode: (type === 'group') ? 0x01 : 0x03,
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
    };

    public async unbind(
        destinationNetworkAddress: number, sourceIeeeAddress: string, sourceEndpoint: number,
        clusterID: number, destinationAddressOrGroup: string | number, type: 'endpoint' | 'group',
        destinationEndpoint: number
    ): Promise<void> {
        debug.error('unbind', arguments);
        let payload = {
            targetExtendedAddress: sourceIeeeAddress,
            targetEndpoint: sourceEndpoint,
            clusterID: clusterID,
            destinationAddressMode: (type === 'group') ? 0x01 : 0x03,
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
    };

    public removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        const payload = {
            targetShortAddress: networkAddress,
            extendedAddress: ieeeAddr
        };

        // @TODO test
        return this.driver.sendCommand(ZiGateCommandCode.RemoveDevice, payload)
            .then(() => Promise.resolve()).catch(() => Promise.reject());
    };

    /**
     * ZCL
     */
    public async sendZclFrameToEndpoint(
        ieeeAddr: string, networkAddress: number, endpoint: number, zclFrame: ZclFrame, timeout: number,
        disableResponse: boolean, disableRecovery: boolean, sourceEndpoint?: number,
    ): Promise<Events.ZclDataPayload> {
        const data = zclFrame.toBuffer();

        // @TODO deal with hardcoded parameters
        const payload: RawAPSDataRequestPayload = {
            addressMode: 0x02, //nwk
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
        debug.log('sendZclFrameToEndpoint: \n %O', payload)

        const extraParameters = {
            transactionSequenceNumber: zclFrame.Header.transactionSequenceNumber
        };
        try {
            const result = await this.driver.sendCommand(
                ZiGateCommandCode.RawAPSDataRequest, payload,
                undefined, extraParameters
            );

            if (result !== null) {
                const frame: ZclFrame = ZclFrame.fromBuffer(zclFrame.Cluster.ID, <Buffer>result.payload.payload);

                const resultPayload: Events.ZclDataPayload = {
                    address: <number | string>result.payload.sourceAddress,
                    frame: frame,
                    endpoint: <number>result.payload.sourceEndpoint,
                    linkquality: result.frame.readRSSI(),
                    groupID: 0
                }
                return resultPayload;
            } else {
                debug.error('no response')
                return null;
            }

        } catch (e) {
            return Promise.reject(e);
        }
    };

    public sendZclFrameToAll(endpoint: number, zclFrame: ZclFrame, sourceEndpoint: number): Promise<void> {
        debug.log('sendZclFrameToAll: \n %o', arguments)

        // @TODO ?? fix zigate GP 242 not supported
        if (sourceEndpoint !== 0x01 && sourceEndpoint !== 0x0A) {
            debug.error('source endpoint %d, not supported', sourceEndpoint);
            return;
        }

        const data = zclFrame.toBuffer();
        const payload: RawAPSDataRequestPayload = {
            addressMode: 2, //nwk
            targetShortAddress: 0xFFFD,
            sourceEndpoint: sourceEndpoint,
            destinationEndpoint: endpoint,
            profileID: 0x0104,
            clusterID: zclFrame.Cluster.ID,
            securityMode: 0x02,
            radius: 30,
            dataLength: data.length,
            data: data,
        }
        debug.log('sendZclFrameToAll', payload)

        return this.driver.sendCommand(ZiGateCommandCode.RawAPSDataRequest, payload)
            .then(() => Promise.resolve()).catch(() => Promise.reject());
    };

    public sendZclFrameToGroup(groupID: number, zclFrame: ZclFrame, sourceEndpoint?: number): Promise<void> {
        debug.log('sendZclFrameToGroup', arguments)
        return
    };

    /**
     * InterPAN
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


        // @TODO
        try {
            // set EPID from config
            debug.log('Set EPanID %h', this.networkOptions.extendedPanID);
            await this.driver.sendCommand(ZiGateCommandCode.SetExtendedPANID, {
                panId: this.networkOptions.extendedPanID,
            });

            await this.driver.sendCommand(ZiGateCommandCode.StartNetwork, {});
        }catch (e) {
            // @TODO
            debug.error(e);
        }

        return Promise.resolve();
    }

    public restoreChannelInterPAN(): Promise<void> {
        debug.log('restoreChannelInterPAN', arguments)
        return Promise.reject();
    };

    public waitFor(
        networkAddress: number, endpoint: number, frameType: FrameType, direction: Direction,
        transactionSequenceNumber: number, clusterID: number, commandIdentifier: number, timeout: number,
    ): { promise: Promise<Events.ZclDataPayload>; cancel: () => void } {
        debug.log('waitFor', arguments)
        const payload = {
            address: networkAddress, endpoint, clusterID, commandIdentifier, frameType, direction,
            transactionSequenceNumber,
        };
        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {promise: waiter.start().promise, cancel};
    };

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        debug.log('waitressTimeoutFormatter', arguments)
        return `Timeout - ${matcher.address} - ${matcher.endpoint}` +
            ` - ${matcher.transactionSequenceNumber} - ${matcher.clusterID}` +
            ` - ${matcher.commandIdentifier} after ${timeout}ms`;
    }

    private waitressValidator(payload: Events.ZclDataPayload, matcher: WaitressMatcher): boolean {
        debug.log('waitressValidator', arguments)
        const transactionSequenceNumber = payload.frame.Header.transactionSequenceNumber;
        return (!matcher.address || payload.address === matcher.address) &&
            payload.endpoint === matcher.endpoint &&
            (!matcher.transactionSequenceNumber || transactionSequenceNumber === matcher.transactionSequenceNumber) &&
            payload.frame.Cluster.ID === matcher.clusterID &&
            matcher.frameType === payload.frame.Header.frameControl.frameType &&
            matcher.commandIdentifier === payload.frame.Header.commandIdentifier &&
            matcher.direction === payload.frame.Header.frameControl.direction;
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return Driver.isValidPath(path);
    }

    public static async autoDetectPath(): Promise<string> {
        return Driver.autoDetectPath();
    }

}

export default ZiGateAdapter;
