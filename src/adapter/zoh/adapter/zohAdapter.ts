import {Socket} from 'node:net';
import {dirname} from 'node:path';

import {OTRCPDriver} from 'zigbee-on-host';
import {setLogger} from 'zigbee-on-host/dist/utils/logger';
import {MACHeader} from 'zigbee-on-host/dist/zigbee/mac';
import {ZigbeeAPSHeader, ZigbeeAPSPayload} from 'zigbee-on-host/dist/zigbee/zigbee-aps';
import {ZigbeeNWKGPHeader} from 'zigbee-on-host/dist/zigbee/zigbee-nwkgp';

import {Backup} from '../../../models/backup';
import {logger} from '../../../utils/logger';
import {Queue} from '../../../utils/queue';
import {wait} from '../../../utils/wait';
import {Waitress} from '../../../utils/waitress';
import * as ZSpec from '../../../zspec';
import * as Zcl from '../../../zspec/zcl';
import * as Zdo from '../../../zspec/zdo';
import * as ZdoTypes from '../../../zspec/zdo/definition/tstypes';
import {Adapter} from '../../adapter';
import {ZclPayload} from '../../events';
import {SerialPort} from '../../serialPort';
import {isTcpPath} from '../../socketPortUtils';
import * as TsType from '../../tstype';
import {bigUInt64ToHexBE} from './utils';

const NS = 'zh:zoh';

interface WaitressMatcher {
    sender: number | string;
    clusterId: number;
    endpoint?: number;
    commandId?: number;
    transactionSequenceNumber?: number;
}

type ZdoResponse = {
    sender: number | string;
    clusterId: number;
    response: ZdoTypes.GenericZdoResponse;
};

const DEFAULT_REQUEST_TIMEOUT = 15000;

export class ZoHAdapter extends Adapter {
    private serialPort?: SerialPort;
    private socketPort?: Socket;
    /** True when adapter is currently closing */
    private closing: boolean;

    private interpanLock: boolean;

    public readonly driver: OTRCPDriver;
    private readonly queue: Queue;
    private readonly zclWaitress: Waitress<ZclPayload, WaitressMatcher>;
    private readonly zdoWaitress: Waitress<ZdoResponse, WaitressMatcher>;

    constructor(
        networkOptions: TsType.NetworkOptions,
        serialPortOptions: TsType.SerialPortOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
    ) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);

        this.hasZdoMessageOverhead = true;
        this.manufacturerID = Zcl.ManufacturerCode.CONNECTIVITY_STANDARDS_ALLIANCE;
        this.closing = false;

        const channel = networkOptions.channelList[0];
        this.driver = new OTRCPDriver(
            {
                txChannel: channel,
                ccaBackoffAttempts: 1,
                ccaRetries: 4,
                enableCSMACA: true,
                headerUpdated: true,
                reTx: false,
                securityProcessed: true,
                txDelay: 0,
                txDelayBaseTime: 0,
                rxChannelAfterTxDone: channel,
            },
            // NOTE: this information is overwritten on `start` if a save exists
            {
                // TODO: make this configurable
                eui64: Buffer.from([0x5a, 0x6f, 0x48, 0x6f, 0x6e, 0x5a, 0x32, 0x4d]).readBigUInt64LE(0),
                panId: this.networkOptions.panID,
                extendedPANId: Buffer.from(this.networkOptions.extendedPanID!).readBigUInt64LE(0),
                channel,
                nwkUpdateId: 0,
                txPower: this.adapterOptions.transmitPower ?? /* v8 ignore next */ 5,
                // ZigBeeAlliance09
                tcKey: Buffer.from([0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39]),
                tcKeyFrameCounter: 0,
                networkKey: Buffer.from(this.networkOptions.networkKey!),
                networkKeyFrameCounter: 0,
                networkKeySequenceNumber: 0,
            },
            dirname(this.backupPath),
        );
        this.queue = new Queue(this.adapterOptions.concurrent || /* v8 ignore next */ 8); // ORed to avoid 0 (not checked in settings/queue constructor)
        this.zclWaitress = new Waitress(this.zclWaitressValidator, this.waitressTimeoutFormatter);
        this.zdoWaitress = new Waitress(this.zdoWaitressValidator, this.waitressTimeoutFormatter);

        this.interpanLock = false;
    }

    /**
     * Init the serial or socket port and hook parser/writer.
     */
    /* v8 ignore start */
    public async initPort(): Promise<void> {
        await this.closePort(); // will do nothing if nothing's open

        if (isTcpPath(this.serialPortOptions.path!)) {
            const pathUrl = new URL(this.serialPortOptions.path!);
            const hostname = pathUrl.hostname;
            const port = Number.parseInt(pathUrl.port, 10);

            logger.debug(`Opening TCP socket with ${hostname}:${port}`, NS);

            this.socketPort = new Socket();

            this.socketPort.setNoDelay(true);
            this.socketPort.setKeepAlive(true, 15000);
            this.driver.writer.pipe(this.socketPort);
            this.socketPort.pipe(this.driver.parser);
            this.driver.parser.on('data', this.driver.onFrame.bind(this.driver));

            return await new Promise((resolve, reject): void => {
                const openError = async (err: Error): Promise<void> => {
                    await this.stop();

                    reject(err);
                };

                this.socketPort!.on('connect', () => {
                    logger.debug('Socket connected', NS);
                });
                this.socketPort!.on('ready', (): void => {
                    logger.info('Socket ready', NS);
                    this.socketPort!.removeListener('error', openError);
                    this.socketPort!.once('close', this.onPortClose.bind(this));
                    this.socketPort!.on('error', this.onPortError.bind(this));

                    resolve();
                });
                this.socketPort!.once('error', openError);

                this.socketPort!.connect(port, hostname);
            });
        }

        const serialOpts = {
            path: this.serialPortOptions.path!,
            baudRate: typeof this.serialPortOptions.baudRate === 'number' ? this.serialPortOptions.baudRate : 115200,
            rtscts: typeof this.serialPortOptions.rtscts === 'boolean' ? this.serialPortOptions.rtscts : false,
            autoOpen: false,
            parity: 'none' as const,
            stopBits: 1 as const,
            xon: false,
            xoff: false,
        };

        // enable software flow control if RTS/CTS not enabled in config
        if (!serialOpts.rtscts) {
            logger.info('RTS/CTS config is off, enabling software flow control.', NS);
            serialOpts.xon = true;
            serialOpts.xoff = true;
        }

        logger.debug(() => `Opening serial port with [path=${serialOpts.path} baudRate=${serialOpts.baudRate} rtscts=${serialOpts.rtscts}]`, NS);
        this.serialPort = new SerialPort(serialOpts);

        this.driver.writer.pipe(this.serialPort);
        this.serialPort.pipe(this.driver.parser);
        this.driver.parser.on('data', this.driver.onFrame.bind(this.driver));

        try {
            await this.serialPort!.asyncOpen();
            await this.serialPort!.asyncFlush();

            logger.info('Serial port opened', NS);

            this.serialPort.once('close', this.onPortClose.bind(this));
            this.serialPort.on('error', this.onPortError.bind(this));
        } catch (error) {
            await this.stop();

            throw error;
        }
    }
    /* v8 ignore stop */

    /**
     * Handle port closing
     * @param err A boolean for Socket, an Error for serialport
     */
    /* v8 ignore start */
    private async onPortClose(error: boolean | Error): Promise<void> {
        if (error) {
            logger.error('Port closed unexpectedly.', NS);
        } else {
            logger.info('Port closed.', NS);
        }
    }
    /* v8 ignore stop */

    /**
     * Handle port error
     * @param error
     */
    /* v8 ignore start */
    private async onPortError(error: Error): Promise<void> {
        logger.error(`Port ${error}`, NS);

        this.emit('disconnected');
    }
    /* v8 ignore stop */

    /* v8 ignore start */
    public async closePort(): Promise<void> {
        if (this.serialPort?.isOpen) {
            try {
                await this.serialPort!.asyncFlushAndClose();
            } catch (err) {
                logger.error(`Failed to close serial port ${err}.`, NS);
            }

            this.serialPort.removeAllListeners();

            this.serialPort = undefined;
        } else if (this.socketPort != null && !this.socketPort.closed) {
            this.socketPort.destroy();
            this.socketPort.removeAllListeners();

            this.socketPort = undefined;
        }
    }
    /* v8 ignore stop */

    public async start(): Promise<TsType.StartResult> {
        setLogger(logger); // pass the logger to ZoH
        await this.initPort();

        let result: TsType.StartResult = 'resumed';
        const currentNetParams = await this.driver.readNetworkState();

        if (currentNetParams) {
            // Note: channel change is handled by Controller
            if (
                // TODO: add eui64 whenever added as configurable
                this.networkOptions.panID !== currentNetParams.panId ||
                Buffer.from(this.networkOptions.extendedPanID!).readBigUInt64LE(0) != currentNetParams.extendedPANId ||
                !Buffer.from(this.networkOptions.networkKey!).equals(currentNetParams.networkKey)
            ) {
                await this.driver.resetNetwork();

                result = 'reset';
            }
        } else {
            // no save detected, brand new network
            result = 'reset';
        }

        await this.driver.start();
        await this.driver.formNetwork();

        this.driver.on('frame', this.onFrame.bind(this));
        this.driver.on('gpFrame', this.onGPFrame.bind(this));
        this.driver.on('deviceJoined', this.onDeviceJoined.bind(this));
        this.driver.on('deviceRejoined', this.onDeviceRejoined.bind(this));
        this.driver.on('deviceLeft', this.onDeviceLeft.bind(this));
        this.driver.on('deviceAuthorized', this.onDeviceAuthorized.bind(this));

        return result;
    }

    public async stop(): Promise<void> {
        this.closing = true;

        this.driver.removeAllListeners();
        this.queue.clear();
        this.zclWaitress.clear();
        this.zdoWaitress.clear();
        await this.driver.stop();
    }

    public async getCoordinatorIEEE(): Promise<string> {
        return `0x${bigUInt64ToHexBE(this.driver.netParams.eui64)}`;
    }

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        return {
            type: 'ZigBee on Host',
            meta: {revision: 'https://github.com/Nerivec/zigbee-on-host'},
        };
    }

    /* v8 ignore start */
    public async reset(type: 'soft' | 'hard'): Promise<void> {
        throw new Error(`Reset ${type} not support`);
    }
    /* v8 ignore stop */

    /* v8 ignore start */
    public async supportsBackup(): Promise<boolean> {
        return false;
    }
    /* v8 ignore stop */

    /* v8 ignore start */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async backup(ieeeAddressesInDatabase: string[]): Promise<Backup> {
        throw new Error('ZigBee on Host handles backup internally');
    }
    /* v8 ignore stop */

    public async getNetworkParameters(): Promise<TsType.NetworkParameters> {
        return {
            panID: this.driver.netParams.panId,
            extendedPanID: `0x${bigUInt64ToHexBE(this.driver.netParams.extendedPANId)}`,
            channel: this.driver.netParams.channel,
            nwkUpdateID: this.driver.netParams.nwkUpdateId,
        };
    }

    /* v8 ignore start */
    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        throw new Error(`not supported ${ieeeAddress}, ${key.toString('hex')}`);
    }
    /* v8 ignore stop */

    /* v8 ignore start */
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
        const waiter = this.zclWaitress.waitFor(
            {
                sender: networkAddress,
                endpoint,
                clusterId: clusterID,
                commandId: commandIdentifier,
                transactionSequenceNumber,
            },
            timeout,
        );
        const cancel = (): void => this.zclWaitress.remove(waiter.ID);

        return {cancel, promise: waiter.start().promise};
    }
    /* v8 ignore stop */

    // #region ZDO

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
        if (networkAddress === ZSpec.COORDINATOR_ADDRESS) {
            // mock ZDO response using driver layer data for coordinator
            // seqNum doesn't matter since waitress bypassed, so don't bother doing any logic for it
            switch (clusterId) {
                case Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST: {
                    const respClusterId = Zdo.ClusterId.NODE_DESCRIPTOR_RESPONSE;
                    const result = Zdo.Buffalo.readResponse(
                        this.hasZdoMessageOverhead,
                        respClusterId,
                        Buffer.from(this.driver.configAttributes.nodeDescriptor),
                    ) as ZdoTypes.RequestToResponseMap[K];

                    this.emit('zdoResponse', respClusterId, result);
                    return result;
                }
                case Zdo.ClusterId.POWER_DESCRIPTOR_REQUEST: {
                    const respClusterId = Zdo.ClusterId.POWER_DESCRIPTOR_RESPONSE;
                    const result = Zdo.Buffalo.readResponse(
                        this.hasZdoMessageOverhead,
                        respClusterId,
                        Buffer.from(this.driver.configAttributes.powerDescriptor),
                    ) as ZdoTypes.RequestToResponseMap[K];

                    this.emit('zdoResponse', respClusterId, result);
                    return result;
                }
                case Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST: {
                    const respClusterId = Zdo.ClusterId.SIMPLE_DESCRIPTOR_RESPONSE;
                    const result = Zdo.Buffalo.readResponse(
                        this.hasZdoMessageOverhead,
                        respClusterId,
                        Buffer.from(this.driver.configAttributes.simpleDescriptors),
                    ) as ZdoTypes.RequestToResponseMap[K];

                    this.emit('zdoResponse', respClusterId, result);
                    return result;
                }
                case Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST: {
                    const respClusterId = Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE;
                    const result = Zdo.Buffalo.readResponse(
                        this.hasZdoMessageOverhead,
                        respClusterId,
                        Buffer.from(this.driver.configAttributes.activeEndpoints),
                    ) as ZdoTypes.RequestToResponseMap[K];

                    this.emit('zdoResponse', respClusterId, result);
                    return result;
                }
                // TODO:
                // case Zdo.ClusterId.LQI_TABLE_REQUEST: {
                //     break;
                // }
                // case Zdo.ClusterId.ROUTING_TABLE_REQUEST: {
                //     break;
                // }
                /* v8 ignore start */
                default: {
                    throw new Error(`ZDO cluster ${clusterId} not supported for ${networkAddress}:${ieeeAddress}`);
                }
                /* v8 ignore stop */
            }
        }

        return await this.queue.execute(async () => {
            this.checkInterpanLock();

            logger.debug(() => `~~~> [ZDO to=${ieeeAddress}:${networkAddress} clusterId=${clusterId} disableResponse=${disableResponse}]`, NS);

            await this.driver.sendZDO(
                payload,
                networkAddress, // nwkDest16
                undefined, // nwkDest64 XXX: avoid passing EUI64 whenever not absolutely necessary
                clusterId, // clusterId
            );

            if (!disableResponse) {
                const responseClusterId = Zdo.Utils.getResponseClusterId(clusterId);

                if (responseClusterId) {
                    const resp = await this.zdoWaitress
                        .waitFor(
                            {
                                sender: responseClusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE ? ieeeAddress : networkAddress,
                                clusterId: responseClusterId,
                            },
                            DEFAULT_REQUEST_TIMEOUT,
                        )
                        .start().promise;

                    return resp.response as ZdoTypes.RequestToResponseMap[K];
                }
            }
        }, networkAddress);
    }

    public async permitJoin(seconds: number, networkAddress?: number): Promise<void> {
        if (networkAddress === undefined) {
            // send ZDO BCAST
            this.driver.allowJoins(seconds, true);

            const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

            await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.DEFAULT, clusterId, zdoPayload, true);
        } else if (networkAddress === ZSpec.COORDINATOR_ADDRESS) {
            this.driver.allowJoins(seconds, true);
        } else {
            // send ZDO to networkAddress
            this.driver.allowJoins(seconds, false);

            const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);
            const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

            /* v8 ignore start */
            if (!Zdo.Buffalo.checkStatus(result)) {
                throw new Zdo.StatusError(result[0]);
            }
            /* v8 ignore stop */
        }
    }

    // #endregion

    // #region ZCL

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
        let commandResponseId: number | undefined;

        if (zclFrame.command.response !== undefined && disableResponse === false) {
            commandResponseId = zclFrame.command.response;
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            commandResponseId = Zcl.Foundation.defaultRsp.ID;
        }

        return await this.queue.execute<ZclPayload | void>(async () => {
            this.checkInterpanLock();

            logger.debug(
                () => `~~~> [ZCL to=${ieeeAddr}:${networkAddress} clusterId=${zclFrame.cluster.ID} destEp=${endpoint} sourceEp=${sourceEndpoint}]`,
                NS,
            );

            for (let i = 0; i < 2; i++) {
                try {
                    await this.driver.sendUnicast(
                        zclFrame.toBuffer(),
                        ZSpec.HA_PROFILE_ID,
                        zclFrame.cluster.ID,
                        networkAddress, // nwkDest16
                        undefined, // nwkDest64 XXX: avoid passing EUI64 whenever not absolutely necessary
                        endpoint, // destEp
                        sourceEndpoint ?? 1, // sourceEp
                    );

                    if (commandResponseId !== undefined) {
                        const resp = await this.zclWaitress
                            .waitFor(
                                {
                                    sender: networkAddress,
                                    clusterId: zclFrame.cluster.ID,
                                    endpoint,
                                    commandId: commandResponseId,
                                    transactionSequenceNumber: zclFrame.header.transactionSequenceNumber,
                                },
                                timeout,
                            )
                            .start().promise;

                        return resp;
                    }

                    return;
                } catch (error) {
                    if (disableRecovery || i == 1) {
                        throw error;
                    } // else retry
                }
                /* v8 ignore start */
            } // coverage detection failure
            /* v8 ignore stop */
        });
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number): Promise<void> {
        return await this.queue.execute<void>(async () => {
            this.checkInterpanLock();

            logger.debug(() => `~~~> [ZCL GROUP to=${groupID} clusterId=${zclFrame.cluster.ID} sourceEp=${sourceEndpoint}]`, NS);

            await this.driver.sendMulticast(zclFrame.toBuffer(), ZSpec.HA_PROFILE_ID, zclFrame.cluster.ID, groupID, 0xff, sourceEndpoint ?? 1);
            // settle
            await wait(500);
        });
    }

    public async sendZclFrameToAll(
        endpoint: number,
        zclFrame: Zcl.Frame,
        sourceEndpoint: number,
        destination: ZSpec.BroadcastAddress,
    ): Promise<void> {
        return await this.queue.execute<void>(async () => {
            this.checkInterpanLock();

            logger.debug(() => `~~~> [ZCL BROADCAST to=${destination} destEp=${endpoint} sourceEp=${sourceEndpoint}]`, NS);

            await this.driver.sendBroadcast(zclFrame.toBuffer(), ZSpec.HA_PROFILE_ID, zclFrame.cluster.ID, destination, endpoint, sourceEndpoint);
            // settle
            await wait(500);
        });
    }

    // #endregion

    // #region InterPAN

    /* v8 ignore start */
    public async setChannelInterPAN(channel: number): Promise<void> {
        throw new Error(`not supported ${channel}`);
    }
    /* v8 ignore stop */

    /* v8 ignore start */
    public async sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddress: string): Promise<void> {
        throw new Error(`not supported ${JSON.stringify(zclFrame)}, ${ieeeAddress}`);
    }
    /* v8 ignore stop */

    /* v8 ignore start */
    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<ZclPayload> {
        throw new Error(`not supported ${JSON.stringify(zclFrame)}, ${timeout}`);
    }
    /* v8 ignore stop */

    /* v8 ignore start */
    public async restoreChannelInterPAN(): Promise<void> {
        throw new Error(`not supported`);
    }
    /* v8 ignore stop */

    // #endregion

    // #region Implementation-Specific

    /* v8 ignore start */
    private checkInterpanLock(): void {
        if (this.interpanLock) {
            throw new Error(`[INTERPAN MODE] Cannot execute non-InterPAN commands.`);
        }
    }
    /* v8 ignore stop */

    /**
     * @param sender16 If undefined, sender64 is expected defined
     * @param sender64 If undefined, sender16 is expected defined
     * @param apsHeader
     * @param apsPayload
     */
    private onFrame(
        sender16: number | undefined,
        sender64: bigint | undefined,
        apsHeader: ZigbeeAPSHeader,
        apsPayload: ZigbeeAPSPayload,
        rssi: number,
    ): void {
        const data = Buffer.from(apsPayload);

        if (apsHeader.profileId === Zdo.ZDO_PROFILE_ID) {
            logger.debug(() => `<~~~ APS ZDO[sender=${sender16}:${sender64} clusterId=${apsHeader.clusterId}]`, NS);

            const result = Zdo.Buffalo.readResponse(this.hasZdoMessageOverhead, apsHeader.clusterId!, data);

            if (apsHeader.clusterId! === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE) {
                // special case to properly resolve a NETWORK_ADDRESS_RESPONSE following a NETWORK_ADDRESS_REQUEST (based on EUI64 from ZDO payload)
                // NOTE: if response has invalid status (no EUI64 available), response waiter will eventually time out
                if (Zdo.Buffalo.checkStatus<Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE>(result)) {
                    this.zdoWaitress.resolve({sender: result[1].eui64, clusterId: apsHeader.clusterId, response: result});
                }
            } else {
                this.zdoWaitress.resolve({sender: sender16!, clusterId: apsHeader.clusterId!, response: result});
            }

            this.emit('zdoResponse', apsHeader.clusterId!, result);
        } else {
            logger.debug(() => `<~~~ APS[sender=${sender16}:${sender64} profileId=${apsHeader.profileId} clusterId=${apsHeader.clusterId}]`, NS);

            const payload: ZclPayload = {
                clusterID: apsHeader.clusterId!,
                header: Zcl.Header.fromBuffer(data),
                address: sender64 !== undefined ? `0x${bigUInt64ToHexBE(sender64)}` : sender16!,
                data,
                endpoint: apsHeader.sourceEndpoint!,
                linkquality: rssi, // TODO: convert RSSI to LQA
                groupID: apsHeader.group!,
                wasBroadcast: apsHeader.frameControl.deliveryMode === 2 /* BCAST */,
                destinationEndpoint: apsHeader.destEndpoint!,
            };

            this.zclWaitress.resolve(payload);
            this.emit('zclPayload', payload);
        }
    }

    private onGPFrame(cmdId: number, payload: Buffer, macHeader: MACHeader, nwkHeader: ZigbeeNWKGPHeader, rssi: number): void {
        // transform into a ZCL frame
        const data = Buffer.alloc((nwkHeader.frameControlExt?.appId === 0x02 /* ZGP */ ? /* v8 ignore next */ 20 : 15) + payload.byteLength);
        let offset = 0;
        data.writeUInt8(0b00000001, offset); // frameControl: FrameType.SPECIFIC + Direction.CLIENT_TO_SERVER + disableDefaultResponse=false
        offset += 1;
        data.writeUInt8(macHeader.sequenceNumber ?? /* v8 ignore next */ 0, offset);
        offset += 1;
        data.writeUInt8(cmdId === 0xe0 ? 0x04 /* commissioning notification */ : 0x00 /* notification */, offset);
        offset += 1;
        data.writeUInt16LE(0, offset); // options, only srcID present
        offset += 2;

        /* v8 ignore start */
        if (nwkHeader.frameControlExt?.appId === 0x02 /* ZGP */) {
            data.writeBigUInt64LE(macHeader.source64!, offset);
            offset += 8;
            data.writeUInt8(nwkHeader.endpoint!, offset);
            offset += 1;
            /* v8 ignore stop */
        } else {
            data.writeUInt32LE(nwkHeader.sourceId!, offset);
            offset += 4;
        }

        data.writeUInt32LE(nwkHeader.securityFrameCounter ?? 0, offset);
        offset += 4;
        data.writeUInt8(cmdId, offset);
        offset += 1;
        data.writeUInt8(payload.byteLength, offset);
        offset += 1;
        data.set(payload, offset);

        const zclPayload: ZclPayload = {
            clusterID: 0x21 /* Green Power */,
            header: Zcl.Header.fromBuffer(data),
            address:
                macHeader.source64 !== undefined ? /* v8 ignore next */ `0x${bigUInt64ToHexBE(macHeader.source64)}` : nwkHeader.sourceId! & 0xffff,
            data,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: rssi, // TODO: convert RSSI to LQA
            groupID: ZSpec.GP_GROUP_ID,
            wasBroadcast: macHeader.destination64 === undefined && macHeader.destination16! >= 0xfff8,
            destinationEndpoint: ZSpec.GP_ENDPOINT,
        };

        this.zclWaitress.resolve(zclPayload);
        this.emit('zclPayload', zclPayload);
    }

    private onDeviceJoined(source16: number, source64: bigint): void {
        this.emit('deviceJoined', {networkAddress: source16, ieeeAddr: `0x${bigUInt64ToHexBE(source64)}`});
    }

    private onDeviceRejoined(source16: number, source64: bigint): void {
        this.emit('deviceJoined', {networkAddress: source16, ieeeAddr: `0x${bigUInt64ToHexBE(source64)}`});
    }

    private onDeviceLeft(source16: number, source64: bigint): void {
        this.emit('deviceLeave', {networkAddress: source16, ieeeAddr: `0x${bigUInt64ToHexBE(source64)}`});
    }

    /* v8 ignore start */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private onDeviceAuthorized(source16: number, source64: bigint): void {}
    /* v8 ignore stop */

    private waitressTimeoutFormatter(matcher: WaitressMatcher, timeout: number): string {
        return `Timeout after ${timeout}ms [sender=${matcher.sender} clusterId=${matcher.clusterId} cmdId=${matcher.commandId}]`;
    }

    private zclWaitressValidator(payload: ZclPayload, matcher: WaitressMatcher): boolean {
        return (
            // no sender in Touchlink
            (matcher.sender === undefined || payload.address === matcher.sender) &&
            payload.clusterID === matcher.clusterId &&
            payload.endpoint === matcher.endpoint &&
            payload.header!.commandIdentifier === matcher.commandId &&
            (matcher.transactionSequenceNumber === undefined || payload.header!.transactionSequenceNumber === matcher.transactionSequenceNumber)
        );
    }

    private zdoWaitressValidator(payload: ZdoResponse, matcher: WaitressMatcher): boolean {
        return payload.sender === matcher.sender && payload.clusterId === matcher.clusterId;
    }
    // #endregion
}
