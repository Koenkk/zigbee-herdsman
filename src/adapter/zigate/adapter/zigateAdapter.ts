/* istanbul ignore file */

import * as Models from '../../../models';
import {Queue, Wait, Waitress} from '../../../utils';
import {logger} from '../../../utils/logger';
import * as ZSpec from '../../../zspec';
import {BroadcastAddress} from '../../../zspec/enums';
import {EUI64} from '../../../zspec/tstypes';
import * as Zcl from '../../../zspec/zcl';
import * as Zdo from '../../../zspec/zdo';
import * as ZdoTypes from '../../../zspec/zdo/definition/tstypes';
import Adapter from '../../adapter';
import * as Events from '../../events';
import * as TsType from '../../tstype';
import {RawAPSDataRequestPayload} from '../driver/commandType';
import {ADDRESS_MODE, coordinatorEndpoints, DEVICE_TYPE, ZiGateCommandCode, ZiGateMessageCode, ZPSNwkKeyState} from '../driver/constants';
import Driver from '../driver/zigate';
import ZiGateObject from '../driver/ziGateObject';
import {patchZdoBuffaloBE} from './patchZdoBuffaloBE';

const NS = 'zh:zigate';
const default_bind_group = 901; // https://github.com/Koenkk/zigbee-herdsman-converters/blob/master/lib/constants.js#L3
interface WaitressMatcher {
    address?: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    frameType: Zcl.FrameType;
    clusterID: number;
    commandIdentifier: number;
    direction: number;
}

class ZiGateAdapter extends Adapter {
    private driver: Driver;
    private joinPermitted: boolean;
    private waitress: Waitress<Events.ZclPayload, WaitressMatcher>;
    private closing: boolean;
    private queue: Queue;

    public constructor(
        networkOptions: TsType.NetworkOptions,
        serialPortOptions: TsType.SerialPortOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
    ) {
        patchZdoBuffaloBE();
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.hasZdoMessageOverhead = false; // false for requests, true for responses

        this.joinPermitted = false;
        this.closing = false;
        const concurrent = this.adapterOptions && this.adapterOptions.concurrent ? this.adapterOptions.concurrent : 2;
        logger.debug(`Adapter concurrent: ${concurrent}`, NS);
        this.queue = new Queue(concurrent);
        this.driver = new Driver(serialPortOptions.path!, serialPortOptions);
        this.waitress = new Waitress<Events.ZclPayload, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);

        this.driver.on('received', this.dataListener.bind(this));
        this.driver.on('LeaveIndication', this.leaveIndicationListener.bind(this));
        this.driver.on('DeviceAnnounce', this.deviceAnnounceListener.bind(this));
        this.driver.on('close', this.onZiGateClose.bind(this));
        this.driver.on('zdoResponse', this.onZdoResponse.bind(this));
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<TsType.StartResult> {
        let startResult: TsType.StartResult = 'resumed';
        try {
            await this.driver.open();
            logger.info('Connected to ZiGate adapter successfully.', NS);

            const resetResponse = await this.driver.sendCommand(ZiGateCommandCode.Reset, {}, 5000);
            if (resetResponse.code === ZiGateMessageCode.RestartNonFactoryNew) {
                startResult = 'resumed';
            } else if (resetResponse.code === ZiGateMessageCode.RestartFactoryNew) {
                startResult = 'reset';
            }
            await this.driver.sendCommand(ZiGateCommandCode.RawMode, {enabled: 0x01});
            // @todo check
            await this.driver.sendCommand(ZiGateCommandCode.SetDeviceType, {
                deviceType: DEVICE_TYPE.coordinator,
            });
            await this.initNetwork();

            await this.driver.sendCommand(ZiGateCommandCode.AddGroup, {
                addressMode: ADDRESS_MODE.short,
                shortAddress: ZSpec.COORDINATOR_ADDRESS,
                sourceEndpoint: ZSpec.HA_ENDPOINT,
                destinationEndpoint: ZSpec.HA_ENDPOINT,
                groupAddress: default_bind_group,
            });
        } catch (error) {
            throw new Error('failed to connect to zigate adapter ' + (error as Error).message);
        }

        return startResult; // 'resumed' | 'reset' | 'restored'
    }

    public async stop(): Promise<void> {
        this.closing = true;
        await this.driver.close();
    }

    public async getCoordinator(): Promise<TsType.Coordinator> {
        const networkResponse = await this.driver.sendCommand(ZiGateCommandCode.GetNetworkState);

        // @TODO deal hardcoded endpoints, made by analogy with deconz
        // polling the coordinator on some firmware went into a memory leak, so we don't ask this info
        const response: TsType.Coordinator = {
            networkAddress: ZSpec.COORDINATOR_ADDRESS,
            manufacturerID: 0,
            ieeeAddr: networkResponse.payload.extendedAddress,
            endpoints: coordinatorEndpoints.slice(), // copy
        };
        logger.debug(() => `getCoordinator ${JSON.stringify(response)}`, NS);
        return response;
    }

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        const result = await this.driver.sendCommand(ZiGateCommandCode.GetVersion, {});
        const meta = {
            transportrev: 0,
            product: 0,
            majorrel: parseInt(<string>result.payload.major).toString(16),
            minorrel: parseInt(<string>result.payload.minor).toString(16),
            maintrel: parseInt(<string>result.payload.revision).toString(16),
            revision: parseInt(<string>result.payload.revision).toString(16),
        };

        return {
            type: 'zigate',
            meta: meta,
        };
    }

    public async permitJoin(seconds: number, networkAddress?: number): Promise<void> {
        const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;

        if (networkAddress !== undefined) {
            // specific device that is not `Coordinator`
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

            const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

            /* istanbul ignore next */
            if (!Zdo.Buffalo.checkStatus(result)) {
                // TODO: will disappear once moved upstream
                throw new Zdo.StatusError(result[0]);
            }
        } else {
            // broadcast permit joining ZDO
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

            await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.DEFAULT, clusterId, zdoPayload, true);
        }

        this.joinPermitted = seconds !== 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        throw new Error('Add install code is not supported');
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        if (type === 'soft') {
            await this.driver.sendCommand(ZiGateCommandCode.Reset, {}, 5000);
        } else if (type === 'hard') {
            await this.driver.sendCommand(ZiGateCommandCode.ErasePersistentData, {}, 5000);
        }
    }

    public async getNetworkParameters(): Promise<TsType.NetworkParameters> {
        try {
            const result = await this.driver.sendCommand(ZiGateCommandCode.GetNetworkState, {}, 10000);

            return {
                panID: <number>result.payload.PANID,
                extendedPanID: <number>result.payload.ExtPANID,
                channel: <number>result.payload.Channel,
            };
        } catch (error) {
            throw new Error(`Get network parameters failed ${error}`);
        }
    }

    /**
     * https://zigate.fr/documentation/deplacer-le-pdm-de-la-zigate/
     * pdm from host
     */
    public async supportsBackup(): Promise<boolean> {
        return false;
    }

    public async backup(): Promise<Models.Backup> {
        throw new Error('This adapter does not support backup');
    }

    public async changeChannel(newChannel: number): Promise<void> {
        const clusterId = Zdo.ClusterId.NWK_UPDATE_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, [newChannel], 0xfe, undefined, undefined, undefined);

        await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.SLEEPY, clusterId, zdoPayload, true /* handled below */);
        await Wait(12000);
    }

    public async setTransmitPower(value: number): Promise<void> {
        try {
            await this.driver.sendCommand(ZiGateCommandCode.SetTXpower, {value: value});
        } catch (error) {
            throw new Error(`Set transmitpower failed ${error}`);
        }
    }

    public async lqi(networkAddress: number): Promise<TsType.LQI> {
        const clusterId = Zdo.ClusterId.LQI_TABLE_REQUEST;
        const neighbors: TsType.LQINeighbor[] = [];
        const request = async (startIndex: number): Promise<[tableEntries: number, entryCount: number]> => {
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, startIndex);
            const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

            /* istanbul ignore else */
            if (Zdo.Buffalo.checkStatus(result)) {
                const payload = result[1];

                for (const entry of payload.entryList) {
                    neighbors.push({
                        ieeeAddr: entry.eui64,
                        networkAddress: entry.nwkAddress,
                        linkquality: entry.lqi,
                        relationship: entry.relationship,
                        depth: entry.depth,
                    });
                }

                return [payload.neighborTableEntries, payload.entryList.length];
            } else {
                // TODO: will disappear once moved upstream
                throw new Zdo.StatusError(result[0]);
            }
        };

        let [tableEntries, entryCount] = await request(0);

        const size = tableEntries;
        let nextStartIndex = entryCount;

        while (neighbors.length < size) {
            [tableEntries, entryCount] = await request(nextStartIndex);

            nextStartIndex += entryCount;
        }

        return {neighbors};
    }

    public async routingTable(networkAddress: number): Promise<TsType.RoutingTable> {
        const clusterId = Zdo.ClusterId.ROUTING_TABLE_REQUEST;
        const table: TsType.RoutingTableEntry[] = [];
        const request = async (startIndex: number): Promise<[tableEntries: number, entryCount: number]> => {
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, startIndex);
            const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

            /* istanbul ignore else */
            if (Zdo.Buffalo.checkStatus(result)) {
                const payload = result[1];

                for (const entry of payload.entryList) {
                    table.push({
                        destinationAddress: entry.destinationAddress,
                        status: entry.status,
                        nextHop: entry.nextHopAddress,
                    });
                }

                return [payload.routingTableEntries, payload.entryList.length];
            } else {
                // TODO: will disappear once moved upstream
                throw new Zdo.StatusError(result[0]);
            }
        };

        let [tableEntries, entryCount] = await request(0);

        const size = tableEntries;
        let nextStartIndex = entryCount;

        while (table.length < size) {
            [tableEntries, entryCount] = await request(nextStartIndex);

            nextStartIndex += entryCount;
        }

        return {table};
    }

    public async nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor> {
        const clusterId = Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, networkAddress);
        const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

        /* istanbul ignore else */
        if (Zdo.Buffalo.checkStatus(result)) {
            const payload = result[1];
            let type: TsType.DeviceType = 'Unknown';

            switch (payload.logicalType) {
                case 0x0:
                    type = 'Coordinator';
                    break;
                case 0x1:
                    type = 'Router';
                    break;
                case 0x2:
                    type = 'EndDevice';
                    break;
            }

            return {type, manufacturerCode: payload.manufacturerCode};
        } else {
            // TODO: will disappear once moved upstream
            throw new Zdo.StatusError(result[0]);
        }
    }

    public async activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints> {
        const clusterId = Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, networkAddress);
        const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

        /* istanbul ignore else */
        if (Zdo.Buffalo.checkStatus(result)) {
            const payload = result[1];

            return {endpoints: payload.endpointList};
        } else {
            // TODO: will disappear once moved upstream
            throw new Zdo.StatusError(result[0]);
        }
    }

    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor> {
        const clusterId = Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, networkAddress, endpointID);
        const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

        /* istanbul ignore else */
        if (Zdo.Buffalo.checkStatus(result)) {
            const payload = result[1];

            return {
                profileID: payload.profileId,
                endpointID: payload.endpoint,
                deviceID: payload.deviceId,
                inputClusters: payload.inClusterList,
                outputClusters: payload.outClusterList,
            };
        } else {
            // TODO: will disappear once moved upstream
            throw new Zdo.StatusError(result[0]);
        }
    }

    public async bind(
        destinationNetworkAddress: number,
        sourceIeeeAddress: string,
        sourceEndpoint: number,
        clusterID: number,
        destinationAddressOrGroup: string | number,
        type: 'endpoint' | 'group',
        destinationEndpoint?: number,
    ): Promise<void> {
        const clusterId = Zdo.ClusterId.BIND_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(
            this.hasZdoMessageOverhead,
            clusterId,
            sourceIeeeAddress as EUI64,
            sourceEndpoint,
            clusterID,
            type === 'group' ? Zdo.MULTICAST_BINDING : Zdo.UNICAST_BINDING,
            destinationAddressOrGroup as EUI64, // not used with MULTICAST_BINDING
            destinationAddressOrGroup as number, // not used with UNICAST_BINDING
            destinationEndpoint ?? 0, // not used with MULTICAST_BINDING
        );
        const result = await this.sendZdo(ZSpec.BLANK_EUI64, destinationNetworkAddress, clusterId, zdoPayload, false);

        /* istanbul ignore next */
        if (!Zdo.Buffalo.checkStatus(result)) {
            // TODO: will disappear once moved upstream
            throw new Zdo.StatusError(result[0]);
        }
    }

    public async unbind(
        destinationNetworkAddress: number,
        sourceIeeeAddress: string,
        sourceEndpoint: number,
        clusterID: number,
        destinationAddressOrGroup: string | number,
        type: 'endpoint' | 'group',
        destinationEndpoint?: number,
    ): Promise<void> {
        const clusterId = Zdo.ClusterId.UNBIND_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(
            this.hasZdoMessageOverhead,
            clusterId,
            sourceIeeeAddress as EUI64,
            sourceEndpoint,
            clusterID,
            type === 'group' ? Zdo.MULTICAST_BINDING : Zdo.UNICAST_BINDING,
            destinationAddressOrGroup as EUI64, // not used with MULTICAST_BINDING
            destinationAddressOrGroup as number, // not used with UNICAST_BINDING
            destinationEndpoint ?? 0, // not used with MULTICAST_BINDING
        );
        const result = await this.sendZdo(ZSpec.BLANK_EUI64, destinationNetworkAddress, clusterId, zdoPayload, false);

        /* istanbul ignore next */
        if (!Zdo.Buffalo.checkStatus(result)) {
            // TODO: will disappear once moved upstream
            throw new Zdo.StatusError(result[0]);
        }
    }

    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        const clusterId = Zdo.ClusterId.LEAVE_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, ieeeAddr as EUI64, Zdo.LeaveRequestFlags.WITHOUT_REJOIN);
        const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

        /* istanbul ignore next */
        if (!Zdo.Buffalo.checkStatus(result)) {
            // TODO: will disappear once moved upstream
            throw new Zdo.StatusError(result[0]);
        }
    }

    public async sendZdo(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: Zdo.ClusterId,
        payload: Buffer,
        disableResponse: true,
    ): Promise<void>;
    public async sendZdo<K extends keyof ZdoTypes.RequestToResponseMap>(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: K,
        payload: Buffer,
        disableResponse: false,
    ): Promise<ZdoTypes.RequestToResponseMap[K]>;
    public async sendZdo<K extends keyof ZdoTypes.RequestToResponseMap>(
        ieeeAddress: string,
        networkAddress: number,
        clusterId: K,
        payload: Buffer,
        disableResponse: boolean,
    ): Promise<ZdoTypes.RequestToResponseMap[K] | void> {
        return await this.queue.execute(async () => {
            // stack-specific requirements
            // https://zigate.fr/documentation/commandes-zigate/
            switch (clusterId) {
                case Zdo.ClusterId.LEAVE_REQUEST: {
                    const prefixedPayload = Buffer.alloc(payload.length + 3); // extra zero for `removeChildren`
                    prefixedPayload.writeUInt16BE(networkAddress, 0);
                    prefixedPayload.set(payload, 2);

                    payload = prefixedPayload;
                    break;
                }

                case Zdo.ClusterId.BIND_REQUEST:
                case Zdo.ClusterId.UNBIND_REQUEST: {
                    // extra zeroes for endpoint XXX: not needed?
                    const zeroes = 15 - payload.length;
                    const prefixedPayload = Buffer.alloc(payload.length + zeroes);
                    prefixedPayload.set(payload, 0);

                    payload = prefixedPayload;

                    break;
                }

                case Zdo.ClusterId.PERMIT_JOINING_REQUEST:
                case Zdo.ClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST:
                case Zdo.ClusterId.LQI_TABLE_REQUEST:
                case Zdo.ClusterId.ROUTING_TABLE_REQUEST:
                case Zdo.ClusterId.BINDING_TABLE_REQUEST:
                case Zdo.ClusterId.NWK_UPDATE_REQUEST: {
                    const prefixedPayload = Buffer.alloc(payload.length + 2);
                    prefixedPayload.writeUInt16BE(networkAddress, 0);
                    prefixedPayload.set(payload, 2);

                    payload = prefixedPayload;
                    break;
                }
            }

            let waiter;

            if (!disableResponse) {
                const responseClusterId = Zdo.Utils.getResponseClusterId(clusterId);

                if (responseClusterId) {
                    waiter = this.driver.zdoWaitFor({
                        clusterId: responseClusterId,
                        target: responseClusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE ? ieeeAddress : networkAddress,
                    });
                }
            }

            await this.driver.requestZdo(clusterId, payload);

            if (waiter) {
                const result = await waiter.start().promise;

                return result.zdo as ZdoTypes.RequestToResponseMap[K];
            }
        }, networkAddress /* TODO: replace with ieeeAddress once zdo moved upstream */);
    }

    public async sendZclFrameToEndpoint(
        ieeeAddr: string,
        networkAddress: number,
        endpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        disableResponse: boolean,
        disableRecovery: boolean,
        sourceEndpoint?: number,
    ): Promise<Events.ZclPayload | void> {
        return await this.queue.execute<Events.ZclPayload | void>(async () => {
            return await this.sendZclFrameToEndpointInternal(
                ieeeAddr,
                networkAddress,
                endpoint,
                sourceEndpoint || 1,
                zclFrame,
                timeout,
                disableResponse,
                disableRecovery,
                0,
                0,
                false,
                false,
            );
        }, networkAddress);
    }

    private async sendZclFrameToEndpointInternal(
        ieeeAddr: string | undefined,
        networkAddress: number,
        endpoint: number,
        sourceEndpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        disableResponse: boolean,
        disableRecovery: boolean,
        responseAttempt: number,
        dataRequestAttempt: number,
        checkedNetworkAddress: boolean,
        discoveredRoute: boolean,
    ): Promise<Events.ZclPayload | void> {
        logger.debug(
            `sendZclFrameToEndpointInternal ${ieeeAddr}:${networkAddress}/${endpoint} (${responseAttempt},${dataRequestAttempt},${this.queue.count()})`,
            NS,
        );
        let response = null;

        const data = zclFrame.toBuffer();
        const command = zclFrame.command;
        const payload: RawAPSDataRequestPayload = {
            addressMode: ADDRESS_MODE.short, //nwk
            targetShortAddress: networkAddress,
            sourceEndpoint: sourceEndpoint || ZSpec.HA_ENDPOINT,
            destinationEndpoint: endpoint,
            profileID: ZSpec.HA_PROFILE_ID,
            clusterID: zclFrame.cluster.ID,
            securityMode: 0x02,
            radius: 30,
            dataLength: data.length,
            data: data,
        };

        if (command.response != undefined && disableResponse === false) {
            response = this.waitFor(
                networkAddress,
                endpoint,
                zclFrame.header.frameControl.frameType,
                Zcl.Direction.SERVER_TO_CLIENT,
                zclFrame.header.transactionSequenceNumber,
                zclFrame.cluster.ID,
                command.response,
                timeout,
            );
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            response = this.waitFor(
                networkAddress,
                endpoint,
                Zcl.FrameType.GLOBAL,
                Zcl.Direction.SERVER_TO_CLIENT,
                zclFrame.header.transactionSequenceNumber,
                zclFrame.cluster.ID,
                Zcl.Foundation.defaultRsp.ID,
                timeout,
            );
        }

        try {
            await this.driver.sendCommand(ZiGateCommandCode.RawAPSDataRequest, payload, undefined, {}, disableResponse);
        } catch {
            if (responseAttempt < 1 && !disableRecovery) {
                // @todo discover route
                return await this.sendZclFrameToEndpointInternal(
                    ieeeAddr,
                    networkAddress,
                    endpoint,
                    sourceEndpoint,
                    zclFrame,
                    timeout,
                    disableResponse,
                    disableRecovery,
                    responseAttempt + 1,
                    dataRequestAttempt,
                    checkedNetworkAddress,
                    discoveredRoute,
                );
            }
        }

        // @TODO add dataConfirmResult
        // @TODO if error codes route / no_resourses wait and resend
        if (response !== null) {
            try {
                return await response.promise;

                // @todo discover route
            } catch (error) {
                logger.error(`Response error ${(error as Error).message} (${ieeeAddr}:${networkAddress},${responseAttempt})`, NS);
                if (responseAttempt < 1 && !disableRecovery) {
                    return await this.sendZclFrameToEndpointInternal(
                        ieeeAddr,
                        networkAddress,
                        endpoint,
                        sourceEndpoint,
                        zclFrame,
                        timeout,
                        disableResponse,
                        disableRecovery,
                        responseAttempt + 1,
                        dataRequestAttempt,
                        checkedNetworkAddress,
                        discoveredRoute,
                    );
                } else {
                    throw error;
                }
            }
        }
    }

    public async sendZclFrameToAll(endpoint: number, zclFrame: Zcl.Frame, sourceEndpoint: number, destination: BroadcastAddress): Promise<void> {
        return await this.queue.execute<void>(async () => {
            if (sourceEndpoint !== 0x01 /*&& sourceEndpoint !== 242*/) {
                // @todo on zigate firmware without gp causes hang
                logger.error(`source endpoint ${sourceEndpoint}, not supported`, NS);
                return;
            }

            const data = zclFrame.toBuffer();
            const payload: RawAPSDataRequestPayload = {
                addressMode: ADDRESS_MODE.short, //nwk
                targetShortAddress: destination,
                sourceEndpoint: sourceEndpoint,
                destinationEndpoint: endpoint,
                profileID: /*sourceEndpoint === ZSpec.GP_ENDPOINT ? ZSpec.GP_PROFILE_ID :*/ ZSpec.HA_PROFILE_ID,
                clusterID: zclFrame.cluster.ID,
                securityMode: 0x02,
                radius: 30,
                dataLength: data.length,
                data: data,
            };
            logger.debug(() => `sendZclFrameToAll ${JSON.stringify(payload)}`, NS);

            await this.driver.sendCommand(ZiGateCommandCode.RawAPSDataRequest, payload, undefined, {}, true);
            await Wait(200);
        });
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number): Promise<void> {
        return await this.queue.execute<void>(async () => {
            const data = zclFrame.toBuffer();
            const payload: RawAPSDataRequestPayload = {
                addressMode: ADDRESS_MODE.group, //nwk
                targetShortAddress: groupID,
                sourceEndpoint: sourceEndpoint || ZSpec.HA_ENDPOINT,
                destinationEndpoint: 0xff,
                profileID: ZSpec.HA_PROFILE_ID,
                clusterID: zclFrame.cluster.ID,
                securityMode: 0x02,
                radius: 30,
                dataLength: data.length,
                data: data,
            };

            await this.driver.sendCommand(ZiGateCommandCode.RawAPSDataRequest, payload, undefined, {}, true);
            await Wait(200);
        });
    }

    /**
     * Supplementary functions
     */
    private async initNetwork(): Promise<void> {
        logger.debug(`Set channel mask ${this.networkOptions.channelList} key`, NS);
        await this.driver.sendCommand(ZiGateCommandCode.SetChannelMask, {
            channelMask: ZSpec.Utils.channelsToUInt32Mask(this.networkOptions.channelList),
        });

        logger.debug(`Set security key`, NS);
        await this.driver.sendCommand(ZiGateCommandCode.SetSecurityStateKey, {
            keyType: this.networkOptions.networkKeyDistribute
                ? ZPSNwkKeyState.ZPS_ZDO_DISTRIBUTED_LINK_KEY
                : ZPSNwkKeyState.ZPS_ZDO_PRECONFIGURED_LINK_KEY,
            key: this.networkOptions.networkKey,
        });

        try {
            // The block is wrapped in trapping because if the network is already created, the firmware does not accept the new key.
            logger.debug(`Set EPanID ${this.networkOptions.extendedPanID!.toString()}`, NS);
            await this.driver.sendCommand(ZiGateCommandCode.SetExtendedPANID, {
                panId: this.networkOptions.extendedPanID,
            });

            await this.driver.sendCommand(ZiGateCommandCode.StartNetwork, {});
        } catch (error) {
            logger.error((error as Error).stack!, NS);
        }
    }

    public waitFor(
        networkAddress: number | undefined,
        endpoint: number,
        frameType: Zcl.FrameType,
        direction: Zcl.Direction,
        transactionSequenceNumber: number | undefined,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {promise: Promise<Events.ZclPayload>; cancel: () => void} {
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
    }

    public static async isValidPath(path: string): Promise<boolean> {
        return await Driver.isValidPath(path);
    }

    public static async autoDetectPath(): Promise<string | undefined> {
        return await Driver.autoDetectPath();
    }

    /**
     * InterPAN !!! not implemented
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async setChannelInterPAN(channel: number): Promise<void> {
        throw new Error('Not supported');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddress: string): Promise<void> {
        throw new Error('Not supported');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<Events.ZclPayload> {
        throw new Error('Not supported');
    }

    public restoreChannelInterPAN(): Promise<void> {
        throw new Error('Not supported');
    }

    private deviceAnnounceListener(response: ZdoTypes.EndDeviceAnnounce): void {
        // @todo debounce
        const payload: Events.DeviceAnnouncePayload = {networkAddress: response.nwkAddress, ieeeAddr: response.eui64};
        if (this.joinPermitted === true) {
            this.emit('deviceJoined', payload);
        } else {
            // convert to `zdoResponse` to avoid needing extra event upstream
            this.emit('zdoResponse', Zdo.ClusterId.END_DEVICE_ANNOUNCE, [Zdo.Status.SUCCESS, response]);
        }
    }

    private onZdoResponse(clusterId: Zdo.ClusterId, response: ZdoTypes.GenericZdoResponse): void {
        this.emit('zdoResponse', clusterId, response);
    }

    private dataListener(ziGateObject: ZiGateObject): void {
        const payload: Events.ZclPayload = {
            address: <number>ziGateObject.payload.sourceAddress,
            clusterID: ziGateObject.payload.clusterID,
            data: ziGateObject.payload.payload,
            header: Zcl.Header.fromBuffer(ziGateObject.payload.payload),
            endpoint: <number>ziGateObject.payload.sourceEndpoint,
            linkquality: ziGateObject.frame!.readRSSI(), // read: frame valid
            groupID: 0, // @todo
            wasBroadcast: false, // TODO
            destinationEndpoint: <number>ziGateObject.payload.destinationEndpoint,
        };
        this.waitress.resolve(payload);
        this.emit('zclPayload', payload);
    }

    private leaveIndicationListener(ziGateObject: ZiGateObject): void {
        logger.debug(() => `LeaveIndication ${JSON.stringify(ziGateObject)}`, NS);
        const payload: Events.DeviceLeavePayload = {
            networkAddress: <number>ziGateObject.payload.extendedAddress,
            ieeeAddr: <string>ziGateObject.payload.extendedAddress,
        };
        this.emit('deviceLeave', payload);
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return (
            `Timeout - ${matcher.address} - ${matcher.endpoint}` +
            ` - ${matcher.transactionSequenceNumber} - ${matcher.clusterID}` +
            ` - ${matcher.commandIdentifier} after ${timeout}ms`
        );
    }

    private waitressValidator(payload: Events.ZclPayload, matcher: WaitressMatcher): boolean {
        return Boolean(
            payload.header &&
                (!matcher.address || payload.address === matcher.address) &&
                matcher.endpoint === payload.endpoint &&
                (!matcher.transactionSequenceNumber || payload.header.transactionSequenceNumber === matcher.transactionSequenceNumber) &&
                matcher.clusterID === payload.clusterID &&
                matcher.frameType === payload.header.frameControl.frameType &&
                matcher.commandIdentifier === payload.header.commandIdentifier &&
                matcher.direction === payload.header.frameControl.direction,
        );
    }

    private onZiGateClose(): void {
        if (!this.closing) {
            this.emit('disconnected');
        }
    }
}

export default ZiGateAdapter;
