/* istanbul ignore file */

import assert from 'assert';

import {Adapter, TsType} from '../..';
import {Backup} from '../../../models';
import {Queue, RealpathSync, Waitress} from '../../../utils';
import {logger} from '../../../utils/logger';
import * as ZSpec from '../../../zspec';
import * as Zcl from '../../../zspec/zcl';
import * as Zdo from '../../../zspec/zdo';
import * as ZdoTypes from '../../../zspec/zdo/definition/tstypes';
import {ZclPayload} from '../../events';
import SerialPortUtils from '../../serialPortUtils';
import SocketPortUtils from '../../socketPortUtils';
import {ZBOSSDriver} from '../driver';
import {CommandId, DeviceUpdateStatus} from '../enums';
import {FrameType, ZBOSSFrame} from '../frame';

const NS = 'zh:zboss';

const autoDetectDefinitions = [
    // Nordic Zigbee NCP
    {manufacturer: 'ZEPHYR', vendorId: '2fe3', productId: '0100'},
];

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

    public static async isValidPath(path: string): Promise<boolean> {
        // For TCP paths we cannot get device information, therefore we cannot validate it.
        if (SocketPortUtils.isTcpPath(path)) {
            return false;
        }

        try {
            return await SerialPortUtils.is(RealpathSync(path), autoDetectDefinitions);
        } catch (error) {
            logger.debug(`Failed to determine if path is valid: '${error}'`, NS);
            return false;
        }
    }

    public static async autoDetectPath(): Promise<string | null> {
        const paths = await SerialPortUtils.find(autoDetectDefinitions);
        paths.sort((a, b) => (a < b ? -1 : 1));
        return paths.length > 0 ? paths[0] : null;
    }

    public async start(): Promise<TsType.StartResult> {
        logger.info(`ZBOSS Adapter starting`, NS);

        await this.driver.connect();

        return await this.driver.startup();
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
                extendedPanID: parseInt(Buffer.from(extendedPanID).toString('hex'), 16),
                channel,
            };
        });
    }

    public async setTransmitPower(value: number): Promise<void> {
        if (this.driver.isInitialized()) {
            return await this.queue.execute<void>(async () => {
                await this.driver.execCommand(CommandId.SET_TX_POWER, {txPower: value});
            });
        }
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        logger.error(() => `NOT SUPPORTED: sendZclFrameToGroup(${ieeeAddress},${key.toString('hex')}`, NS);
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

                /* istanbul ignore next */
                if (!Zdo.Buffalo.checkStatus(result)) {
                    // TODO: will disappear once moved upstream
                    throw new Zdo.StatusError(result[0]);
                }
            } else {
                // `coordinator-only` (for `all` too)
                const result = await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.COORDINATOR_ADDRESS, clusterId, zdoPayload, false);

                /* istanbul ignore next */
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
                case Zdo.ClusterId.BIND_REQUEST: // XXX: according to `FRAMES`, might not support group bind?
                case Zdo.ClusterId.UNBIND_REQUEST: // XXX: according to `FRAMES`, might not support group unbind?
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
            response = this.waitFor(
                networkAddress,
                endpoint,
                zclFrame.header.transactionSequenceNumber,
                zclFrame.cluster.ID,
                command.response!,
                timeout,
            );
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            response = this.waitFor(
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
        logger.error(() => `NOT SUPPORTED: sendZclFrameToGroup(${groupID},${JSON.stringify(zclFrame)},${sourceEndpoint})`, NS);
        return;
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
        logger.error(() => `NOT SUPPORTED: sendZclFrameInterPANToIeeeAddr(${JSON.stringify(zclFrame)},${ieeeAddress})`, NS);
        return;
    }

    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<ZclPayload> {
        logger.error(() => `NOT SUPPORTED: sendZclFrameInterPANBroadcast(${JSON.stringify(zclFrame)},${timeout})`, NS);
        throw new Error(`Is not supported for 'zboss' yet`);
    }

    public async restoreChannelInterPAN(): Promise<void> {
        return;
    }

    public waitFor(
        networkAddress: number,
        endpoint: number,
        // frameType: Zcl.FrameType,
        // direction: Zcl.Direction,
        transactionSequenceNumber: number,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {promise: Promise<ZclPayload>; cancel: () => void; start: () => {promise: Promise<ZclPayload>}} {
        const payload = {
            address: networkAddress,
            endpoint,
            clusterID,
            commandIdentifier,
            transactionSequenceNumber,
        };

        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);

        return {cancel: cancel, promise: waiter.start().promise, start: waiter.start};
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
