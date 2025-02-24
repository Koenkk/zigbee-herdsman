/* v8 ignore start */

import assert from 'node:assert';

import {Adapter, TsType} from '../..';
import {Backup} from '../../../models';
import {Queue, Waitress} from '../../../utils';
import {logger} from '../../../utils/logger';
import * as ZSpec from '../../../zspec';
import * as Zcl from '../../../zspec/zcl';
import * as Zdo from '../../../zspec/zdo';
import * as ZdoTypes from '../../../zspec/zdo/definition/tstypes';
import {ZclPayload} from '../../events';
import {ZBOSSDriver} from '../driver';
import {CommandId, DeviceUpdateStatus} from '../enums';
import {FrameType, ZBOSSFrame} from '../frame';

const NS = 'zh:zboss';

interface WaitressMatcher {
    address: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    clusterID: number;
    commandIdentifier: number;
}

export class ZBOSSAdapter extends Adapter {
    private queue: Queue;
    private readonly driver: ZBOSSDriver;
    private waitress: Waitress<ZclPayload, WaitressMatcher>;

    constructor(
        networkOptions: TsType.NetworkOptions,
        serialPortOptions: TsType.SerialPortOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
    ) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.hasZdoMessageOverhead = false;
        this.manufacturerID = Zcl.ManufacturerCode.NORDIC_SEMICONDUCTOR_ASA;
        const concurrent = adapterOptions && adapterOptions.concurrent ? adapterOptions.concurrent : 8;
        logger.debug(`Adapter concurrent: ${concurrent}`, NS);
        this.queue = new Queue(concurrent);

        this.waitress = new Waitress<ZclPayload, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);
        this.driver = new ZBOSSDriver(serialPortOptions, networkOptions);
        this.driver.on('frame', this.processMessage.bind(this));
    }

    private async processMessage(frame: ZBOSSFrame): Promise<void> {
        logger.debug(() => `processMessage: ${JSON.stringify(frame)}`, NS);

        if (frame.payload.zdoClusterId !== undefined) {
            this.emit('zdoResponse', frame.payload.zdoClusterId, frame.payload.zdo!);
        } else if (frame.type == FrameType.INDICATION) {
            switch (frame.commandId) {
                case CommandId.ZDO_DEV_UPDATE_IND: {
                    logger.debug(`Device ${frame.payload.ieee}:${frame.payload.nwk} ${DeviceUpdateStatus[frame.payload.status]}.`, NS);

                    if (frame.payload.status === DeviceUpdateStatus.LEFT) {
                        this.emit('deviceLeave', {
                            networkAddress: frame.payload.nwk,
                            ieeeAddr: frame.payload.ieee,
                        });
                    } else {
                        // SECURE_REJOIN, UNSECURE_JOIN, TC_REJOIN
                        this.emit('deviceJoined', {
                            networkAddress: frame.payload.nwk,
                            ieeeAddr: frame.payload.ieee,
                        });
                    }
                    break;
                }

                case CommandId.NWK_LEAVE_IND: {
                    this.emit('deviceLeave', {
                        networkAddress: frame.payload.nwk,
                        ieeeAddr: frame.payload.ieee,
                    });
                    break;
                }

                case CommandId.APSDE_DATA_IND: {
                    const payload: ZclPayload = {
                        clusterID: frame.payload.clusterID,
                        header: Zcl.Header.fromBuffer(frame.payload.data),
                        data: frame.payload.data,
                        address: frame.payload.srcNwk,
                        endpoint: frame.payload.srcEndpoint,
                        linkquality: frame.payload.lqi,
                        groupID: frame.payload.grpNwk,
                        wasBroadcast: false,
                        destinationEndpoint: frame.payload.dstEndpoint,
                    };

                    this.waitress.resolve(payload);
                    this.emit('zclPayload', payload);
                    break;
                }
            }
        }
    }

    public async start(): Promise<TsType.StartResult> {
        logger.info(`ZBOSS Adapter starting`, NS);

        await this.driver.connect();

        return await this.driver.startup(this.adapterOptions.transmitPower);
    }

    public async stop(): Promise<void> {
        await this.driver.stop();

        logger.info(`ZBOSS Adapter stopped`, NS);
    }

    public async getCoordinatorIEEE(): Promise<string> {
        return this.driver.netInfo.ieeeAddr;
    }

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        return await this.queue.execute<TsType.CoordinatorVersion>(async () => {
            const ver = await this.driver.execCommand(CommandId.GET_MODULE_VERSION, {});
            const cver = await this.driver.execCommand(CommandId.GET_COORDINATOR_VERSION, {});
            const ver2str = (version: number): string => {
                const major = (version >> 24) & 0xff;
                const minor = (version >> 16) & 0xff;
                const revision = (version >> 8) & 0xff;
                const commit = version & 0xff;
                return `${major}.${minor}.${revision}.${commit}`;
            };

            return {
                type: `zboss`,
                meta: {
                    coordinator: cver.payload.version,
                    stack: ver2str(ver.payload.stackVersion),
                    protocol: ver2str(ver.payload.protocolVersion),
                    revision: ver2str(ver.payload.fwVersion),
                },
            };
        });
    }

    public async reset(type: 'soft' | 'hard'): Promise<void> {
        throw new Error(`This adapter does not reset '${type}'`);
    }

    public async supportsBackup(): Promise<boolean> {
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async backup(ieeeAddressesInDatabase: string[]): Promise<Backup> {
        throw new Error('This adapter does not support backup');
    }

    public async getNetworkParameters(): Promise<TsType.NetworkParameters> {
        return await this.queue.execute<TsType.NetworkParameters>(async () => {
            const channel = this.driver.netInfo!.network.channel;
            const panID = this.driver.netInfo!.network.panID!;
            const extendedPanID = this.driver.netInfo!.network.extendedPanID;

            return {
                panID,
                extendedPanID: ZSpec.Utils.eui64LEBufferToHex(Buffer.from(extendedPanID)),
                channel,
                nwkUpdateID: 0,
            };
        });
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer, hashed: boolean): Promise<void> {
        logger.error(`NOT SUPPORTED: sendZclFrameToGroup(${ieeeAddress},${key.toString('hex')},${hashed}`, NS);
        throw new Error(`Install code is not supported for 'zboss' yet`);
    }

    public async permitJoin(seconds: number, networkAddress?: number): Promise<void> {
        if (this.driver.isInitialized()) {
            const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

            if (networkAddress) {
                // `device-only`
                const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

                if (!Zdo.Buffalo.checkStatus(result)) {
                    // TODO: will disappear once moved upstream
                    throw new Zdo.StatusError(result[0]);
                }
            } else {
                // `coordinator-only` (for `all` too)
                const result = await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.COORDINATOR_ADDRESS, clusterId, zdoPayload, false);

                if (!Zdo.Buffalo.checkStatus(result)) {
                    // TODO: will disappear once moved upstream
                    throw new Zdo.StatusError(result[0]);
                }

                if (networkAddress === undefined) {
                    // `all`: broadcast
                    await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.DEFAULT, clusterId, zdoPayload, true);
                }
            }
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
            switch (clusterId) {
                case Zdo.ClusterId.NETWORK_ADDRESS_REQUEST:
                case Zdo.ClusterId.IEEE_ADDRESS_REQUEST:
                case Zdo.ClusterId.BIND_REQUEST:
                case Zdo.ClusterId.UNBIND_REQUEST:
                case Zdo.ClusterId.LQI_TABLE_REQUEST:
                case Zdo.ClusterId.ROUTING_TABLE_REQUEST:
                case Zdo.ClusterId.BINDING_TABLE_REQUEST:
                case Zdo.ClusterId.LEAVE_REQUEST:
                case Zdo.ClusterId.PERMIT_JOINING_REQUEST: {
                    const prefixedPayload = Buffer.alloc(payload.length + 2);
                    prefixedPayload.writeUInt16LE(networkAddress, 0);
                    prefixedPayload.set(payload, 2);

                    payload = prefixedPayload;
                    break;
                }
            }
            switch (clusterId) {
                case Zdo.ClusterId.BIND_REQUEST:
                case Zdo.ClusterId.UNBIND_REQUEST: {
                    // use fixed size address
                    const addrType = payload.readUInt8(13); // address type
                    if (addrType == Zdo.MULTICAST_BINDING) {
                        payload = Buffer.concat([payload, Buffer.alloc(7)]);
                    }
                    break;
                }
            }

            const zdoResponseClusterId = Zdo.Utils.getResponseClusterId(clusterId);
            const frame = await this.driver.requestZdo(clusterId, payload, disableResponse || zdoResponseClusterId === undefined);

            if (!disableResponse && zdoResponseClusterId !== undefined) {
                assert(frame, `ZDO ${Zdo.ClusterId[clusterId]} expected response ${Zdo.ClusterId[zdoResponseClusterId]}.`);

                return frame.payload.zdo as ZdoTypes.RequestToResponseMap[K];
            }
        }, networkAddress);
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
    ): Promise<ZclPayload | void> {
        return await this.queue.execute<ZclPayload | void>(async () => {
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
                false,
                null,
            );
        }, networkAddress);
    }

    private async sendZclFrameToEndpointInternal(
        ieeeAddr: string,
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
        assocRemove: boolean,
        assocRestore: {ieeeadr: string; nwkaddr: number; noderelation: number} | null,
    ): Promise<ZclPayload | void> {
        if (ieeeAddr == null) {
            ieeeAddr = this.driver.netInfo.ieeeAddr;
        }
        logger.debug(
            `sendZclFrameToEndpointInternal ${ieeeAddr}:${networkAddress}/${endpoint} ` +
                `(${responseAttempt},${dataRequestAttempt},${this.queue.count()}), timeout=${timeout}`,
            NS,
        );
        let response = null;
        const command = zclFrame.command;
        if (command.response && disableResponse === false) {
            response = this.waitForInternal(
                networkAddress,
                endpoint,
                zclFrame.header.transactionSequenceNumber,
                zclFrame.cluster.ID,
                command.response!,
                timeout,
            );
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            response = this.waitForInternal(
                networkAddress,
                endpoint,
                zclFrame.header.transactionSequenceNumber,
                zclFrame.cluster.ID,
                Zcl.Foundation.defaultRsp.ID,
                timeout,
            );
        }
        try {
            const dataConfirmResult = await this.driver.request(
                ieeeAddr,
                0x0104,
                zclFrame.cluster.ID,
                endpoint,
                sourceEndpoint || 0x01,
                zclFrame.toBuffer(),
            );
            if (!dataConfirmResult) {
                if (response != null) {
                    response.cancel();
                }
                throw Error('sendZclFrameToEndpointInternal error');
            }
            if (response !== null) {
                try {
                    const result = await response.start().promise;
                    return result;
                } catch (error) {
                    logger.debug(`Response timeout (${ieeeAddr}:${networkAddress},${responseAttempt})`, NS);
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
                            assocRemove,
                            assocRestore,
                        );
                    } else {
                        throw error;
                    }
                }
            } else {
                return;
            }
        } catch (error) {
            if (response != null) {
                response.cancel();
            }
            throw error;
        }
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number): Promise<void> {
        await this.driver.grequest(
            groupID,
            sourceEndpoint === ZSpec.GP_ENDPOINT ? ZSpec.GP_PROFILE_ID : ZSpec.HA_PROFILE_ID,
            zclFrame.cluster.ID,
            sourceEndpoint || 0x01,
            zclFrame.toBuffer(),
        );
    }

    public async sendZclFrameToAll(
        endpoint: number,
        zclFrame: Zcl.Frame,
        sourceEndpoint: number,
        destination: ZSpec.BroadcastAddress,
    ): Promise<void> {
        await this.driver.brequest(
            destination,
            sourceEndpoint === ZSpec.GP_ENDPOINT && endpoint === ZSpec.GP_ENDPOINT ? ZSpec.GP_PROFILE_ID : ZSpec.HA_PROFILE_ID,
            zclFrame.cluster.ID,
            endpoint,
            sourceEndpoint || 0x01,
            zclFrame.toBuffer(),
        );
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        logger.error(`NOT SUPPORTED: setChannelInterPAN(${channel})`, NS);
        return;
    }

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddress: string): Promise<void> {
        logger.error(`NOT SUPPORTED: sendZclFrameInterPANToIeeeAddr(${JSON.stringify(zclFrame)},${ieeeAddress})`, NS);
        return;
    }

    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<ZclPayload> {
        logger.error(`NOT SUPPORTED: sendZclFrameInterPANBroadcast(${JSON.stringify(zclFrame)},${timeout})`, NS);
        throw new Error(`Is not supported for 'zboss' yet`);
    }

    public async restoreChannelInterPAN(): Promise<void> {
        return;
    }

    private waitForInternal(
        networkAddress: number,
        endpoint: number,
        transactionSequenceNumber: number | undefined,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {start: () => {promise: Promise<ZclPayload>}; cancel: () => void} {
        const waiter = this.waitress.waitFor(
            {
                address: networkAddress,
                endpoint,
                clusterID,
                commandIdentifier,
                transactionSequenceNumber,
            },
            timeout,
        );
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {start: waiter.start, cancel};
    }

    public waitFor(
        networkAddress: number,
        endpoint: number,
        frameType: Zcl.FrameType,
        direction: Zcl.Direction,
        transactionSequenceNumber: number | undefined,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {promise: Promise<ZclPayload>; cancel: () => void} {
        const waiter = this.waitForInternal(networkAddress, endpoint, transactionSequenceNumber, clusterID, commandIdentifier, timeout);

        return {cancel: waiter.cancel, promise: waiter.start().promise};
    }

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return (
            `Timeout - ${matcher.address} - ${matcher.endpoint}` +
            ` - ${matcher.transactionSequenceNumber} - ${matcher.clusterID}` +
            ` - ${matcher.commandIdentifier} after ${timeout}ms`
        );
    }

    private waitressValidator(payload: ZclPayload, matcher: WaitressMatcher): boolean {
        return (
            (payload.header &&
                (!matcher.address || payload.address === matcher.address) &&
                payload.endpoint === matcher.endpoint &&
                (!matcher.transactionSequenceNumber || payload.header.transactionSequenceNumber === matcher.transactionSequenceNumber) &&
                payload.clusterID === matcher.clusterID &&
                matcher.commandIdentifier === payload.header.commandIdentifier) ||
            false
        );
    }
}
