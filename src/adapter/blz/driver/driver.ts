/* istanbul ignore file */

import {EventEmitter} from 'events';
import equals from 'fast-deep-equal/es6';
import {wait, Waitress} from '../../../utils';
import {logger} from '../../../utils/logger';
import * as ZSpec from '../../../zspec';
import {Clusters} from '../../../zspec/zcl/definition/cluster';
import * as Zdo from '../../../zspec/zdo';
import {GenericZdoResponse} from '../../../zspec/zdo/definition/tstypes';
import {BLZAdapterBackup} from '../adapter/backup';
import * as TsType from './../../tstype';
import {ParamsDesc} from './commands';
import {Blz, BLZFrameData} from './blz';
import {uint64_t} from './types';
import {BlzApsOption, BlzNodeType, BlzStatus, uint8_t, uint16_t, uint32_t, Bytes} from './types';
import {
    BlzEUI64,
    BlzOutgoingMessageType,
    BlzValueId,
} from './types/named';
import {
    BlzApsFrame,
    BlzNetworkParameters,
} from './types/struct';

const NS = 'zh:blz:driv';

interface AddEndpointParameters {
    endpoint?: number;
    profileId?: number;
    deviceId?: number;
    appFlags?: number;
    inputClusters?: number[];
    outputClusters?: number[];
}

type BlzFrame = {
    address: number | string;
    payload: Buffer;
    frame: BlzApsFrame;
    zdoResponse?: GenericZdoResponse;
};

type BlzWaitressMatcher = {
    address: number | string;
    clusterId: number;
};

type IeeeMfg = {
    mfgId: number;
    prefix: number[];
};

export interface BlzIncomingMessage {
    messageType: number;
    apsFrame: BlzApsFrame;
    lqi: number;
    rssi: number;
    sender: number;
    bindingIndex: number;
    addressIndex: number;
    message: Buffer;
    senderEui64: BlzEUI64;
    zdoResponse?: GenericZdoResponse;
}

const IEEE_PREFIX_MFG_ID: IeeeMfg[] = [
    {mfgId: 0x115f, prefix: [0x04, 0xcf, 0xfc]},
    {mfgId: 0x115f, prefix: [0x54, 0xef, 0x44]},
];
const DEFAULT_MFG_ID = 0x1049;
const REQUEST_ATTEMPT_DELAYS = [500, 1000, 1500];

export class Driver extends EventEmitter {
    // @ts-expect-error XXX: init in startup
    public blz: Blz;
    private nwkOpt: TsType.NetworkOptions;
    // @ts-expect-error XXX: init in startup
    public networkParams: BlzNetworkParameters;
    //// @ts-expect-error XXX: init in startup
    private eui64ToNodeId = new Map<string, number>();
    // @ts-expect-error XXX: init in startup
    public ieee: BlzEUI64;
    private waitress: Waitress<BlzFrame, BlzWaitressMatcher>;
    private transactionID = 1;
    private serialOpt: TsType.SerialPortOptions;
    public backupMan: BLZAdapterBackup;

    constructor(serialOpt: TsType.SerialPortOptions, nwkOpt: TsType.NetworkOptions, backupPath: string) {
        super();
        this.nwkOpt = nwkOpt;
        this.serialOpt = serialOpt;
        this.waitress = new Waitress<BlzFrame, BlzWaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);
        this.backupMan = new BLZAdapterBackup(this, backupPath);
    }

    /**
     * Requested by the BLZ watchdog after too many failures, or by UART layer after port closed unexpectedly.
     * Tries to stop the layers below and startup again.
     * @returns
     */
    public async reset(): Promise<void> {
        logger.debug(`Reset connection.`, NS);

        try {
            await this.blz.execCommand('reset');
            await wait(2000);
            // don't emit 'close' on stop since we don't want this to bubble back up as 'disconnected' to the controller.
            await this.stop(false);
        } catch (err) {
            logger.debug(`Stop error ${err}`, NS);
        }
        try {
            await wait(1000);
            logger.debug(`Startup again.`, NS);
            await this.startup();
        } catch (err) {
            logger.debug(`Reset error ${err}`, NS);

            try {
                // here we let emit
                await this.stop();
            } catch (stopErr) {
                logger.debug(`Failed to stop after failed reset ${stopErr}`, NS);
            }
        }
    }

    private async onBlzReset(): Promise<void> {
        logger.debug('onBlzReset()', NS);
        await this.reset();
    }

    private onBlzClose(): void {
        logger.debug('onBlzClose()', NS);
        this.emit('close');
    }

    public async stop(emitClose: boolean = true): Promise<void> {
        logger.debug('Stopping driver', NS);

        if (this.blz) {
            return await this.blz.close(emitClose);
        }
    }

    public async startup(): Promise<TsType.StartResult> {
        let result: TsType.StartResult = 'resumed';
        this.transactionID = 1;
        this.blz = new Blz();
        this.blz.on('close', this.onBlzClose.bind(this));

        try {
            await this.blz.connect(this.serialOpt);
        } catch (error) {
            logger.debug(`BLZ could not connect: ${error}`, NS);
            throw error;
        }

        this.blz.on('reset', this.onBlzReset.bind(this));

        await this.blz.execCommand('reset');
        await wait(2000);

        // TODO: add sleep here to make sure the dongle is connected
        await this.addEndpoint({
            inputClusters: [0x0000, 0x0003, 0x0006, 0x000a, 0x0019, 0x001a],
            outputClusters: [
                0x0000, 0x0003, 0x0004, 0x0005, 0x0006, 0x0008, 0x0020, 0x0300, 0x0400,
            ],
        });

        await this.blz.getVersion();

        if (await this.needsToBeInitialised(this.nwkOpt)) {
            logger.info('The network setup need to be initialized', NS);
            await wait(1000)
            const restore = await this.needsToBeRestore(this.nwkOpt);

            logger.info(`Leaving the current network`, NS);

            const st = await this.blz.leaveNetwork();

            if (st != BlzStatus.SUCCESS) {
                logger.error(`leaveNetwork returned unexpected status: ${st}`, NS);
            }

            await wait(1000)
            logger.info(`Left the current network`, NS);

            if (restore) {
                logger.info('Restore network from backup', NS);
                await this.formNetwork(true);
                result = 'restored';
            } else {
                logger.info('Form a new network', NS);
                await this.formNetwork(false);
                result = 'reset';
            }
        }
        await wait(1000);
        // TODO: make sure the stack is running
        logger.info('The Zigbee network is formed', NS);

        const netParams = await this.blz.execCommand('getNetworkParameters');
        logger.info(`Command (getNetworkParameters) returned: ${netParams.status}`, NS);
        if (netParams.status !== BlzStatus.SUCCESS) {
            logger.error(`Command (getNetworkParameters) returned unexpected state: ${netParams.status}`, NS);
        }
        logger.info(`PanId: ${netParams.panId.toString(16)}`, NS);
        logger.info(`extendedPanId: ${netParams.extPanId.toString(16)}`, NS);
        this.networkParams = new BlzNetworkParameters();
        // Convert number/bigint to 8-byte Buffer in big-endian format
        const buf = Buffer.alloc(8);
        if (typeof netParams.extPanId === 'bigint') {
            buf.writeBigUInt64BE(netParams.extPanId);
        } else {
            buf.writeBigUInt64BE(BigInt(netParams.extPanId));
        }
        this.networkParams.extendedPanId = buf;
        this.networkParams.panId = netParams.panId;
        this.networkParams.Channel = netParams.channel;
        this.networkParams.nwkUpdateId = netParams.nwkUpdateId;
        logger.debug(`Node type: ${netParams.nodeType}, Network parameters: ${this.networkParams}`, NS);

        const ieee = (await this.blz.execCommand('getValue', {valueId: BlzValueId.BLZ_VALUE_ID_MAC_ADDRESS})).value; 
        this.ieee = new BlzEUI64(ieee);
        this.blz.on('frame', this.handleFrame.bind(this));
        logger.debug(`BLZ nodeid=0x0000, IEEE=0x${this.ieee}`, NS);
        logger.debug('Network ready', NS);

        return result;
    }

    private async needsToBeInitialised(options: TsType.NetworkOptions): Promise<boolean> {
        let valid = true;
        valid = valid && (await this.blz.networkInit());
        logger.debug(`needToBeInitialized success stack up: ${valid}`, NS)
        const netParams = await this.blz.execCommand('getNetworkParameters');
        logger.debug(`Current Node type: ${netParams.nodeType}, Network parameters: ${netParams}`, NS);
        valid = valid && netParams.status == BlzStatus.SUCCESS;
        logger.debug(`needToBeInitialized success get parameters: ${valid}`, NS)
        valid = valid && netParams.nodeType == BlzNodeType.COORDINATOR;
        logger.debug(`needToBeInitialized is coordinator: ${valid}`, NS)
        valid = valid && options.panID == netParams.panId;
        logger.debug(`needToBeInitialized same PanID: ${valid}`, NS)
        // valid = valid && options.channelList.includes(netParams.channel); 
        // // try to add support for change channel so if only channel is different, it can still work as resumed
        logger.debug(`needToBeInitialized valid channel (optional, can be false): ${options.channelList.includes(netParams.channel)}`, NS)
        // Convert bigint extPanId to 8-byte array in little-endian order
        const extPanIdArray = [];
        let extPanId = netParams.extPanId;
        for (let i = 0; i < 8; i++) {
            extPanIdArray.push(Number(extPanId & 0xFFn));
            extPanId >>= 8n;
        }
        valid = valid && equals(options.extendedPanID, extPanIdArray);
        logger.debug(`options.extendedPanID: ${options.extendedPanID}`, NS)
        logger.debug(`current extendedPanID: ${extPanIdArray}`, NS)
        logger.debug(`needToBeInitialized same extended PanID: ${valid}`, NS)
        return !valid;
    }

    private async formNetwork(restore: boolean): Promise<void> {
        let backup;
        if (restore) {
            backup = await this.backupMan.getStoredBackup();

            if (!backup) {
                throw new Error(`No valid backup found.`);
            }
            const {sequenceNumber, frameCounter } = backup.networkKeyInfo;
            let networkKey = backup.networkOptions.networkKey;
            // Convert hex string to Buffer if needed
            if (typeof networkKey === 'string') {
                networkKey = Buffer.from(networkKey, 'hex');
            }
            // can only change network key and link key when the stack is on and leave the current network
            await this.setNetworkKeyInfo(networkKey, frameCounter, sequenceNumber);
            // await this.setGlobalTcLinkKey(backup.blz!.tclk!, backup.blz!.tclkFrameCounter!);
            } else {
            if (this.nwkOpt.networkKey) {
                let networkKey = this.nwkOpt.networkKey;
                await this.setNetworkKeyInfo(Buffer.from(networkKey), 0, 0);
            }
        }

        if (restore) {
            const [backupextendedPanID] = uint64_t.deserialize(uint64_t, Buffer.from(backup!.networkOptions.extendedPanId));
            await this.blz.formNetwork(backupextendedPanID, backup!.networkOptions.panId, backup!.logicalChannel);
        } else {
            const [nwkoptextendedPanID] = uint64_t.deserialize(uint64_t, Buffer.from(this.nwkOpt.extendedPanID!));
            await this.blz.formNetwork(nwkoptextendedPanID, this.nwkOpt.panID, this.nwkOpt.channelList[0]);
        }
    }

    private handleFrame(frameName: string, frame: BLZFrameData): void {
        switch (true) {
            case frameName === 'apsDataIndication': {
                const apsFrame: BlzApsFrame = new BlzApsFrame();
                apsFrame.profileId = frame.profileId;
                apsFrame.clusterId = frame.clusterId;
                apsFrame.sourceEndpoint = frame.srcEp;
                apsFrame.destinationEndpoint = frame.dstEp;
                apsFrame.sequence = 0;
                apsFrame.groupId = frame.dstShortAddr

                if (frame.profileId == Zdo.ZDO_PROFILE_ID && frame.clusterId >= 0x8000 /* response only */) {
                    const zdoResponse = Zdo.Buffalo.readResponse(true, frame.clusterId, frame.message);

                    if (frame.clusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE) {
                        // special case to properly resolve a NETWORK_ADDRESS_RESPONSE following a NETWORK_ADDRESS_REQUEST (based on EUI64 from ZDO payload)
                        // NOTE: if response has invalid status (no EUI64 available), response waiter will eventually time out
                        /* istanbul ignore else */
                        if (Zdo.Buffalo.checkStatus<Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE>(zdoResponse)) {
                            const eui64 = zdoResponse[1].eui64;

                            // update cache with new network address
                            this.eui64ToNodeId.set(eui64, frame.srcShortAddr);

                            this.waitress.resolve({
                                address: eui64,
                                payload: frame.message,
                                frame: apsFrame,
                                zdoResponse,
                            });
                        }
                    } else {
                        this.waitress.resolve({
                            address: frame.srcShortAddr,
                            payload: frame.message,
                            frame: apsFrame,
                            zdoResponse,
                        });
                    }

                    // always pass ZDO to bubble up to controller
                    this.emit('incomingMessage', {
                        messageType: frame.msgType,
                        apsFrame,
                        lqi: frame.lqi,
                        rssi: frame.rssi,
                        sender: frame.srcShortAddr,
                        bindingIndex: null,
                        addressIndex: null,
                        message: frame.message,
                        senderEui64: this.eui64ToNodeId.get(frame.srcShortAddr),
                        zdoResponse,
                    });
                } else {
                    const handled = this.waitress.resolve({
                        address: frame.srcShortAddr,
                        payload: frame.message,
                        frame: apsFrame,
                    });

                    if (!handled) {
                        this.emit('incomingMessage', {
                            messageType: frame.msgType,
                            apsFrame,
                            lqi: frame.lqi,
                            rssi: frame.rssi,
                            sender: frame.srcShortAddr,
                            bindingIndex: null,
                            addressIndex: null,
                            message: frame.message,
                            senderEui64: this.eui64ToNodeId.get(frame.srcShortAddr),
                        });
                    }
                }
                break;
            }
            case frameName === 'deviceJoinCallback': {
                logger.debug(`Device joined callback is received`, NS);
                this.handleNodeJoined(frame.nodeId, frame.eui64);
                break;
            }
            case frameName === 'nwkStatusCallback': {
                logger.debug(`Network status callback called is received`, NS);
                this.handleNetworkStatus(frame.status);
                break;
            }
            case frameName === 'apsDataConfirm': {
                if (frame.status === BlzStatus.SUCCESS) {
                    logger.debug(`APS confirmed`, NS);
                } else {
                    logger.warning(`APS Request failed`, NS);
                }
                break;
            }
            case frameName === 'stackStatusHandler': {
                if (frame.status === BlzStatus.SUCCESS) {
                    logger.debug(`Stack status is success`, NS);
                } else {
                    logger.warning(`Stack status failed`, NS);
                }
                break;
            }
            default:
                logger.debug(`Unhandled frame ${frameName}`, NS);
        }
    }

    private handleNetworkStatus(status: BlzStatus): void {
        logger.debug(`handleNetworkStatus: networkStatusCode=${status}`, NS);
    }

    // private handleNodeLeft(nwk: number, ieee: BlzEUI64 | number[]): void {
    //     if (ieee && !(ieee instanceof BlzEUI64)) {
    //         ieee = new BlzEUI64(ieee);
    //     }

    //     this.eui64ToNodeId.delete(ieee.toString());
    //     this.emit('deviceLeft', nwk, ieee);
    // }

    public handleNodeJoined(nwk: number, ieee: number): void {
        const ieeeAddr = `${ieee.toString(16).padStart(16, '0')}`;
        const ieeeAddrstring = `0x${ieee.toString(16).padStart(16, '0')}`;
        logger.debug(`deviceJoined, 0x${nwk.toString(16)}, 0x${ieeeAddr}`, NS);
        this.eui64ToNodeId.set(ieeeAddr, nwk);
        this.emit('deviceJoined', nwk, ieeeAddrstring);
    }

    public setNode(nwk: number, ieee: BlzEUI64 | number[]): void {
        if (ieee && !(ieee instanceof BlzEUI64)) {
            ieee = new BlzEUI64(ieee);
        }

        this.eui64ToNodeId.set(ieee.toString(), nwk);
    }

    public async request(nwk: number | BlzEUI64, apsFrame: BlzApsFrame, data: Buffer, extendedTimeout = false): Promise<boolean> {
        let result = false;

        for (const delay of REQUEST_ATTEMPT_DELAYS) {
            try {
                const seq = (apsFrame.sequence + 1) & 0xff;
                let eui64: BlzEUI64;

                if (typeof nwk !== 'number') {
                    eui64 = nwk as BlzEUI64;
                    const strEui64 = eui64.toString();
                    let nodeId = this.eui64ToNodeId.get(strEui64);

                    if (nodeId === undefined) {
                        nodeId = (await this.blz.execCommand('getNodeIdByEui64', {eui64: eui64})).nodeId;
                        if (nodeId && nodeId !== 0xffff) {
                            this.eui64ToNodeId.set(strEui64, nodeId);
                        } else {
                            throw new Error('Unknown EUI64:' + strEui64);
                        }
                    }
                    nwk = nodeId;
                }

                const sendResult = await this.blz.sendApsData(
                    BlzOutgoingMessageType.BLZ_MSG_TYPE_UNICAST, // msgType
                    nwk,                                        // dstShortAddr
                    apsFrame.profileId,                         // profileId
                    apsFrame.clusterId,                         // clusterId
                    apsFrame.sourceEndpoint,                    // srcEp
                    apsFrame.destinationEndpoint,               // dstEp
                    0,                                          // txOptions
                    5,                                          // radius
                    seq,                                        // messageTag
                    data.length,                                // payloadLen
                    data                                        // payload
                );

                result = sendResult == BlzStatus.SUCCESS;
                break;
            } catch (e) {
                logger.debug(`Request error ${e}`, NS);
                break;
            }
        }

        return result;
    }

    // Modify mrequest to use sendApsData with multicast msgType
    public async mrequest(apsFrame: BlzApsFrame, data: Buffer, timeout = 30000): Promise<boolean> {
        try {
            const seq = (apsFrame.sequence + 1) & 0xff;
            const sendResult = await this.blz.sendApsData(
                BlzOutgoingMessageType.BLZ_MSG_TYPE_MULTICAST, // msgType
                apsFrame.groupId ?? 0,                         // dstShortAddr
                apsFrame.profileId,                            // profileId
                apsFrame.clusterId,                            // clusterId
                apsFrame.sourceEndpoint,                       // srcEp
                apsFrame.destinationEndpoint,                  // dstEp
                0,                                             // txOptions
                5,                                             // radius
                seq,                                           // messageTag
                data.length,                                   // payloadLen
                data                                           // payload
            );
        } catch {
            return false;
        }
        return true;
    }

    // Modify brequest to use sendApsData with broadcast msgType
    public async brequest(destination: number, apsFrame: BlzApsFrame, data: Buffer): Promise<boolean> {
        try {
            const seq = (apsFrame.sequence + 1) & 0xff;
            const sendResult = await this.blz.sendApsData(
                BlzOutgoingMessageType.BLZ_MSG_TYPE_MULTICAST, // msgType
                destination,                         // dstShortAddr
                apsFrame.profileId,                            // profileId
                apsFrame.clusterId,                            // clusterId
                apsFrame.sourceEndpoint,                       // srcEp
                apsFrame.destinationEndpoint,                  // dstEp
                0,                                             // txOptions
                5,                                             // radius
                seq,                                           // messageTag
                data.length,                                   // payloadLen
                data                                           // payload
            );
        } catch {
            return false;
        }
        return true;
    }

    public nextTransactionID(): number {
        this.transactionID = (this.transactionID + 1) & 0xff;
        return this.transactionID;
    }

    public makeApsFrame(clusterId: number, disableResponse: boolean): BlzApsFrame {
        const frame = new BlzApsFrame();
        frame.clusterId = clusterId;
        frame.profileId = 0;
        frame.sequence = this.nextTransactionID();
        frame.sourceEndpoint = 0;
        frame.destinationEndpoint = 0;
        frame.groupId = 0;
        return frame;
    }

    public async networkIdToEUI64(nwk: number): Promise<BlzEUI64> {
        for (const [eui64Str, nodeId] of this.eui64ToNodeId) {
            if (nodeId === nwk) return new BlzEUI64(eui64Str);
        }
    
        const response = await this.blz.execCommand('getEui64ByNodeId', {nodeId: nwk});
    
        if (response.status === BlzStatus.SUCCESS) {
            const eui64 = new BlzEUI64(response.eui64);
            this.eui64ToNodeId.set(eui64.toString(), nwk);
    
            return eui64;
        } else {
            throw new Error('Unrecognized nodeId:' + nwk);
        }
    }

    public async permitJoining(seconds: number): Promise<BLZFrameData> {
        return await this.blz.execCommand('permitJoining', {duration: seconds});
    }

    public async addEndpoint({
        endpoint = 1,
        profileId = 260,
        deviceId = 0xbeef,
        appFlags = 0,
        inputClusters = [],
        outputClusters = [],
    }: AddEndpointParameters): Promise<void> {
        const res = await this.blz.execCommand('addEndpoint', {
            endpoint: endpoint,
            profileId: profileId,
            deviceId: deviceId,
            appFlags: appFlags,
            inputClusterCount: inputClusters.length,
            outputClusterCount: outputClusters.length,
            inputClusterList: inputClusters,
            outputClusterList: outputClusters,
        });
        logger.debug(() => `Blz adding endpoint: ${JSON.stringify(res)}`, NS);
    }

    public waitFor(
        address: number | string,
        clusterId: number,
        timeout = 10000,
    ): ReturnType<typeof this.waitress.waitFor> & {cancel: () => void} {
        const waiter = this.waitress.waitFor({address, clusterId}, timeout);
        return {...waiter, cancel: () => this.waitress.remove(waiter.ID)};
    }

    private waitressTimeoutFormatter(matcher: BlzWaitressMatcher, timeout: number): string {
        return `${JSON.stringify(matcher)} after ${timeout}ms`;
    }

    private waitressValidator(payload: BlzFrame, matcher: BlzWaitressMatcher): boolean {
        logger.debug(`waitressValidator: payload.address=${payload.address}, matcher.address=${matcher.address}, payload.frame.clusterId=${payload.frame?.clusterId}, matcher.clusterId=${matcher.clusterId}`, NS);
        return (
            (!matcher.address || payload.address === matcher.address) &&
            (!payload.frame || payload.frame.clusterId === matcher.clusterId)
        );
    }

    public async getGlobalTcLinkKey(): Promise<BLZFrameData> {
        const frameResponse = await this.blz.execCommand('getGlobalTcLinkKey');
    
        const { status, linkKey, outgoingFrameCounter, trustCenterAddress } = frameResponse;
    
        if (status !== BlzStatus.SUCCESS) {
            logger.error(`getGlobalTcLinkKey() returned unexpected BLZ status: ${status}`, NS);
            throw new Error(`Failed to get global Trust Center key: status ${status}`);
        }
    
        logger.debug(
            `Global TC Key retrieved: Key=${linkKey.toString('hex')}, FrameCounter=${outgoingFrameCounter}, TCAddress=${trustCenterAddress}`,
            NS
        );
    
        return frameResponse;
    }

    public async setGlobalTcLinkKey(
        linkKey: Bytes,
        outgoingFrameCounter: uint32_t
    ): Promise<BlzStatus> {
        const frameRequest = {
            linkKey,
            outgoingFrameCounter,
        };
    
        const frameResponse = await this.blz.execCommand('setGlobalTcLinkKey', frameRequest);
    
        const { status } = frameResponse;
    
        if (status !== BlzStatus.SUCCESS) {
            logger.error(`setGlobalTcLinkKey() failed with status: ${status}`, NS);
            throw new Error(`Failed to set global Trust Center key: status ${status}`);
        }
    
        logger.debug(
            `Global TC Key set successfully: Key=${linkKey}, FrameCounter=${outgoingFrameCounter}`,
            NS
        );
    
        return status;
    }

    public async getNetworkKeyInfo(): Promise<BLZFrameData> {
        const frameResponse = await this.blz.execCommand('getNwkSecurityInfos');
    
        const { status, nwkKey, outgoingFrameCounter, nwkKeySeqNum } = frameResponse;
    
        if (status !== BlzStatus.SUCCESS) {
            logger.error(`getNetworkKeyInfo() returned unexpected BLZ status: ${status}`, NS);
            throw new Error(`Failed to get network key info: status ${status}`);
        }
    
        logger.debug(
            `Network Key Info retrieved: Key=${nwkKey.toString('hex')}, FrameCounter=${outgoingFrameCounter}, SeqNum=${nwkKeySeqNum}`,
            NS
        );
    
        return frameResponse;
    }
    
    public async setNetworkKeyInfo(
        nwkKey: Bytes,
        outgoingFrameCounter: uint32_t,
        nwkKeySeqNum: uint8_t
    ): Promise<BlzStatus> {
        // Validate network key format
        if (!Buffer.isBuffer(nwkKey) || nwkKey.length !== 16) {
            throw new Error(`Invalid network key format - must be 16 byte Buffer`);
        }

        logger.debug(`Setting network key: ${nwkKey.toString('hex')}`, NS);
        logger.debug(`Frame counter: ${outgoingFrameCounter}`, NS);
        logger.debug(`Key seq num: ${nwkKeySeqNum}`, NS);

        const frameRequest = {
            nwkKey,
            outgoingFrameCounter,
            nwkKeySeqNum,
        };
    
        const frameResponse = await this.blz.execCommand('setNwkSecurityInfos', frameRequest);
    
        const { status } = frameResponse;
    
        if (status !== BlzStatus.SUCCESS) {
            logger.error(`setNwkSecurityInfos() failed with status: ${status}`, NS);
            throw new Error(`Failed to set network security infos: status ${status}`);
        }
    
        logger.debug(
            `Network Security Infos set successfully: Key=${nwkKey.toString('hex')}, FrameCounter=${outgoingFrameCounter}, SeqNum=${nwkKeySeqNum}`,
            NS
        );
    
        return status;
    }

    private async needsToBeRestore(options: TsType.NetworkOptions): Promise<boolean> {
        const backup = await this.backupMan.getStoredBackup();
        if (!backup) {
            logger.debug("needToBeRestore no backup found!", NS)
            return false;
        }
        let valid = true;
        valid = valid && options.panID == backup.networkOptions.panId;
        logger.debug(`needsToBeRestore same PanID: ${valid}`, NS)
        valid = valid && options.channelList.includes(backup.logicalChannel);
        logger.debug(`needsToBeRestore valid channel: ${valid}`, NS)
        // Ensure both extendedPanIDs are compared with same endianness
        const currentExtendedPanID = Buffer.from(options.extendedPanID!);
        const backupExtendedPanID = backup.networkOptions.extendedPanId;
        logger.debug(`Configured extendedPanID (raw): ${currentExtendedPanID.toString('hex')}`, NS);
        logger.debug(`Backup extendedPanID (raw): ${backupExtendedPanID.toString('hex')}`, NS);
        
        // Convert both to uint64_t for consistent comparison
        const [currentPanID] = uint64_t.deserialize(uint64_t, currentExtendedPanID);
        const [backupPanID] = uint64_t.deserialize(uint64_t, backupExtendedPanID);
        logger.debug(`Configured extendedPanID (uint64): ${currentPanID.toString(16)}`, NS);
        logger.debug(`Backup extendedPanID (uint64): ${backupPanID.toString(16)}`, NS);
        valid = valid && currentPanID === backupPanID;
        logger.debug(`needsToBeRestore same extendedPanID: ${valid}`, NS);
        const currentNetworkKey = Buffer.from(options.networkKey!);
        const backupNetworkKey = backup.networkOptions.networkKey;
        logger.debug(`Configured networkKey (raw): ${currentNetworkKey.toString('hex')}`, NS);
        logger.debug(`Backup networkKey (raw): ${backupNetworkKey.toString('hex')}`, NS);
        valid = valid && currentNetworkKey.equals(backupNetworkKey);
        logger.debug(`needsToBeRestore same network key: ${valid}`, NS);
        return valid;
    }
}
