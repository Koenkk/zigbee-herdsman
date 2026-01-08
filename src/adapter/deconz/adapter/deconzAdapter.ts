/* v8 ignore start */

//import Device from "../../../controller/model/device";
import {existsSync, readFileSync} from "node:fs";
import {dirname} from "node:path";
import type * as Models from "../../../models";
import type {Backup} from "../../../models";
import {BackupUtils, Waitress} from "../../../utils";
import {logger} from "../../../utils/logger";
import * as ZSpec from "../../../zspec";
import type {BroadcastAddress} from "../../../zspec/enums";
import * as Zcl from "../../../zspec/zcl";
import * as Zdo from "../../../zspec/zdo";
import type * as ZdoTypes from "../../../zspec/zdo/definition/tstypes";
import Adapter from "../../adapter";
import type * as Events from "../../events";
import type {AdapterOptions, CoordinatorVersion, NetworkOptions, NetworkParameters, SerialPortOptions, StartResult} from "../../tstype";
import {readBackup} from "../../utils";
import PARAM, {
    ApsAddressMode,
    type ApsDataRequest,
    type GpDataInd,
    NwkBroadcastAddress,
    ParamId,
    type ReceivedDataResponse,
    type WaitForDataRequest,
} from "../driver/constants";
import Driver from "../driver/driver";
import processFrame, {frameParserEvents} from "../driver/frameParser";

const NS = "zh:deconz";

interface WaitressMatcher {
    address?: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    frameType: Zcl.FrameType;
    clusterID: number;
    commandIdentifier: number;
    direction: number;
}

export class DeconzAdapter extends Adapter {
    private driver: Driver;
    private openRequestsQueue: WaitForDataRequest[];
    private frameParserEvent = frameParserEvents;
    // biome-ignore lint/correctness/noUnusedPrivateClassMembers: ignore
    private fwVersion?: CoordinatorVersion;
    private waitress: Waitress<Events.ZclPayload, WaitressMatcher>;
    private joinPermitted = false;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.hasZdoMessageOverhead = true;
        this.manufacturerID = Zcl.ManufacturerCode.DRESDEN_ELEKTRONIK_INGENIEURTECHNIK_GMBH;

        this.waitress = new Waitress<Events.ZclPayload, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);

        const firmwareLog = [];
        if (backupPath) {
            // optional: get extra logs from the firmware (debug builds)
            const dirPath = dirname(backupPath);
            const configPath = `${dirPath}/deconz_options.json`;
            if (existsSync(configPath)) {
                try {
                    const data = JSON.parse(readFileSync(configPath).toString());
                    const log = data.firmware_log || [];
                    if (Array.isArray(log)) {
                        for (const level of log) {
                            if (level === "APS" || level === "APS_L2") {
                                firmwareLog.push(level);
                            }
                        }
                    }
                } catch (_err) {}
            }
        }

        this.driver = new Driver(serialPortOptions, networkOptions, this.getStoredBackup(), firmwareLog);

        this.driver.on("rxFrame", (frame) => processFrame(frame));
        this.openRequestsQueue = [];
        this.fwVersion = undefined;

        this.frameParserEvent.on("receivedDataPayload", (data) => this.checkReceivedDataPayload(data));
        this.frameParserEvent.on("receivedGreenPowerIndication", (data) => this.checkReceivedGreenPowerIndication(data));

        setInterval(() => {
            // Need to have a try/catch block here since promised can be rejected which don't
            // have a handler waiting for them anymore.
            try {
                this.checkWaitForDataRequestTimeouts();
            } catch (_err) {}
        }, 1000);
    }

    /**
     * Adapter methods
     */
    public start(): Promise<StartResult> {
        // wait here until driver is connected and has queried all firmware parameters
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const iv = setInterval(() => {
                if (this.driver.started()) {
                    clearInterval(iv);
                    if (this.driver.restoredFromBackup) {
                        resolve("restored");
                    } else {
                        resolve("resumed");
                    }
                    return;
                }

                if (20000 < Date.now() - start) {
                    clearInterval(iv);
                    reject(new Error("failed to start adapter connection to firmware"));
                    return;
                }
            }, 50);
        });
    }

    public async stop(): Promise<void> {
        await this.driver.close();
    }

    public getCoordinatorIEEE(): Promise<string> {
        logger.debug("-------- z2m:getCoordinatorIEEE() ----------------", NS);
        if (this.driver.paramMacAddress === 0n) {
            return Promise.reject(new Error("Failed to query coordinator MAC address"));
        }
        return Promise.resolve(`0x${this.driver.paramMacAddress.toString(16).padStart(16, "0")}`);
    }

    public async permitJoin(seconds: number, networkAddress?: number): Promise<void> {
        const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;

        if (networkAddress) {
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

            const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

            if (!Zdo.Buffalo.checkStatus<Zdo.ClusterId.PERMIT_JOINING_RESPONSE>(result)) {
                // TODO: will disappear once moved upstream
                throw new Zdo.StatusError(result[0]);
            }
        } else {
            await this.driver.writeParameterRequest(ParamId.STK_PERMIT_JOIN, seconds);

            logger.debug(`Permit joining on coordinator for ${seconds} sec.`, NS);

            // broadcast permit joining ZDO
            if (networkAddress === undefined) {
                // `authentication`: TC significance always 1 (zb specs)
                const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

                await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.DEFAULT, clusterId, zdoPayload, true);
            }
        }

        this.joinPermitted = seconds !== 0;
    }

    public getCoordinatorVersion(): Promise<CoordinatorVersion> {
        logger.debug("-------- z2m:getCoordinatorVersion() ----------------", NS);

        // product: number; transportrev: number; majorrel: number; minorrel: number; maintrel: number; revision: string;

        const fw = this.driver.paramFirmwareVersion;
        if (fw === 0) {
            return Promise.reject(new Error("Failed to query coordinator firmware version"));
        }

        const fwString = `0x${fw.toString(16).padStart(8, "0")}`;

        logger.debug(`Firmware version: ${fwString}`, NS);

        let type = "Unknown";
        const platform = (fw >> 8) & 0xff;
        if (platform === 5) {
            type = "ConBee/RaspBee";
        } else if (platform === 7) {
            type = "ConBee2/RaspBee2";
        } else if (platform === 9) {
            type = "ConBee3";
        }

        // 0x26780700 -> 2.6.78.7.00
        const major = (fw >> 28) & 0xf;
        const minor = (fw >> 24) & 0xf;
        const patch = (fw >> 16) & 0xff;

        const meta = {transportrev: 0, product: 0, majorrel: major, minorrel: minor, maintrel: patch, revision: fwString};
        this.fwVersion = {type: type, meta: meta};
        return Promise.resolve({type: type, meta: meta});
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer, hashed: boolean): Promise<void> {
        await this.driver.writeLinkKey(ieeeAddress, hashed ? key : ZSpec.Utils.aes128MmoHash(key));
    }
    public async reset(_type: "soft" | "hard"): Promise<void> {
        return await Promise.reject(new Error("Reset is not supported"));
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

        logger.debug(`waitFor() called ${JSON.stringify(payload)}`, NS);

        const waiter = this.waitress.waitFor(payload, timeout);
        const cancel = (): void => this.waitress.remove(waiter.ID);
        return {promise: waiter.start().promise, cancel};
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
    ): Promise<ZdoTypes.RequestToResponseMap[K] | undefined> {
        const transactionID = this.nextTransactionID();
        payload[0] = transactionID;
        const txOptions = 0;

        // TODO(mpi): Disable APS ACKs for now until we find a better solution to not block queues.
        //if (networkAddress < NwkBroadcastAddress.BroadcastLowPowerRouters) {
        //    txOptions = 0x4; // enable APS ACKs for unicast addresses
        //}

        const isNwkAddrRequest = clusterId === Zdo.ClusterId.NETWORK_ADDRESS_REQUEST;
        const req: ApsDataRequest = {
            requestId: transactionID,
            destAddrMode: ApsAddressMode.Nwk,
            destAddr16: networkAddress,
            destAddr64: isNwkAddrRequest ? ieeeAddress : undefined,
            destEndpoint: Zdo.ZDO_ENDPOINT,
            profileId: Zdo.ZDO_PROFILE_ID,
            clusterId,
            srcEndpoint: Zdo.ZDO_ENDPOINT,
            asduLength: payload.length,
            asduPayload: payload,
            txOptions,
            radius: PARAM.PARAM.txRadius.DEFAULT_RADIUS,
            timeout: 10000,
        };

        const responseClusterId = Zdo.Utils.getResponseClusterId(clusterId);
        const confirm = this.driver.enqueueApsDataRequest(req);
        let indication: undefined | Promise<ReceivedDataResponse>;

        if (!disableResponse) {
            if (responseClusterId) {
                indication = this.waitForData(
                    isNwkAddrRequest ? ieeeAddress : networkAddress,
                    Zdo.ZDO_PROFILE_ID,
                    responseClusterId,
                    transactionID,
                    req.timeout,
                );
            }
        }

        try {
            await confirm;

            // biome-ignore lint/nursery/noMisusedPromises: ignore
            if (indication) {
                const indicationIndex = this.openRequestsQueue.findIndex(
                    (x) => x.clusterId === responseClusterId && x.transactionSequenceNumber === transactionID,
                );

                if (indicationIndex !== -1) {
                    this.openRequestsQueue[indicationIndex].confirmed = true;
                }
            }
        } catch (err) {
            // no need to wait for indication, remove waiter from queue
            // biome-ignore lint/nursery/noMisusedPromises: ignore
            if (indication) {
                const indicationIndex = this.openRequestsQueue.findIndex(
                    (x) => x.clusterId === responseClusterId && x.transactionSequenceNumber === transactionID,
                );

                if (indicationIndex !== -1) {
                    this.openRequestsQueue.splice(indicationIndex, 1);
                }
            }

            throw new Error(`failed to send ZDO request seq: (${transactionID}) ${err}`);
        }

        // biome-ignore lint/nursery/noMisusedPromises: ignore
        if (indication) {
            try {
                const data = await indication;
                // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
                return data.zdo! as ZdoTypes.RequestToResponseMap[K];
            } catch (error) {
                if (responseClusterId === Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE && networkAddress === 0) {
                    // TODO(mpi): Check following statement on older firmware versions.
                    // If it is true we can always query firmware parameters for endpoints.

                    logger.warning("Failed to determine active endpoints of coordinator, falling back to [1]", NS);
                    // Some Conbee adapaters don't provide a response to an active endpoint request of the coordinator, always return
                    // an endpoint here. Before an active endpoint request was done to determine the endpoints, they were hardcoded:
                    // https://github.com/Koenkk/zigbee-herdsman/blob/d855b3bf85a066cb7c325fe3ef0006873c735add/src/adapter/deconz/adapter/deconzAdapter.ts#L105
                    const response: ZdoTypes.ResponseMap[Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE] = [
                        Zdo.Status.SUCCESS,
                        {endpointList: [1], nwkAddress: 0},
                    ];
                    return response as ZdoTypes.RequestToResponseMap[K];
                }

                throw error;
            }
        }
    }

    public async sendZclFrameToEndpoint(
        _ieeeAddr: string,
        networkAddress: number,
        endpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        disableResponse: boolean,
        // TODO(mpi): in ember driver this means keep going enqueue request to firmware (up to 3 times).
        // In our case this a little different: The firmware may reject the requests because no free APS slots are available,
        // this is the only case where "recovery" makes sense. Other cases mean the request will never succeed (network offline, invalid request, ...).
        _disableRecovery: boolean,
        sourceEndpoint?: number,
        profileId?: number,
    ): Promise<Events.ZclPayload | undefined> {
        const transactionID = this.nextTransactionID();
        const payload = zclFrame.toBuffer();

        // TODO(mpi): Enable APS ACKs for tricky devices, maintain a list of those, or keep at least a few slots free for non APS ACK requests.
        //const txOptions = 0x4; // 0x00 normal, 0x04 APS ACK
        // TODO(mpi): Disable APS ACKs for now until we find a better solution to not block queues.
        const txOptions = 0;

        const request: ApsDataRequest = {
            requestId: transactionID,
            destAddrMode: ApsAddressMode.Nwk,
            destAddr16: networkAddress,
            destEndpoint: endpoint,
            profileId: profileId ?? (sourceEndpoint === 242 && endpoint === 242 ? 0xa1e0 : 0x104),
            clusterId: zclFrame.cluster.ID,
            srcEndpoint: sourceEndpoint || 1,
            asduLength: payload.length,
            asduPayload: payload,
            // TODO(mpi): This must not be a global option.
            // Since z2m doesn't provide it, ideally the driver figures this out on its own.
            // deCONZ keeps an error count for each device, if devices work fine without APS ACKs don't use them.
            // But if errors occur enable them..
            //
            // ember driver enables ACKs based on 'commandResponseId' which imho doesn't make sense at all:
            //
            //      don't RETRY if no response expected
            //      if (commandResponseId === undefined)
            //         apsFrame.options &= ~EmberApsOption.RETRY;
            //

            txOptions,
            radius: PARAM.PARAM.txRadius.DEFAULT_RADIUS,
            // TODO(mpi): We could treat _disableRecovery = true, to retry if enqueue (valid) requests or APS-confirms fail within timeout period?
            timeout: timeout,
        };

        if (timeout < 1000) {
            throw new Error("Unexpected small timeout");
        }

        const command = zclFrame.command;

        // NOTE(mpi): 'disableResponse' is not working as expected?
        // For now use the same logic as Ember adapter since 'disableResponse === false' alone isn't correct in some cases.
        //
        // E.g. when replying to an Query Next Image Request the following parameters where passed from z2m:
        //     { command.response: undefined, zcl.disableDefaultResponse: true, z2m.disableResponse: false }
        // This resulted in waiting for a response which never arrives and a timeout error thrown.
        let needWaitResponse = false;

        if (command.response !== undefined && disableResponse === false) {
            needWaitResponse = true;
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            needWaitResponse = true;
        }

        const confirm = this.driver.enqueueApsDataRequest(request);

        logger.debug(`ZCL request sent with transactionSequenceNumber.: ${zclFrame.header.transactionSequenceNumber}`, NS);
        logger.debug(
            `command.response: ${command.response}, zcl.disableDefaultResponse: ${zclFrame.header.frameControl.disableDefaultResponse}, z2m.disableResponse: ${disableResponse}, request.timeout: ${request.timeout}`,
            NS,
        );

        let indication: undefined | Promise<ReceivedDataResponse>;

        if (needWaitResponse) {
            indication = this.waitForData(
                networkAddress,
                ZSpec.HA_PROFILE_ID,
                zclFrame.cluster.ID,
                zclFrame.header.transactionSequenceNumber,
                request.timeout,
            );
        }

        try {
            await confirm;

            // biome-ignore lint/nursery/noMisusedPromises: ignore
            if (indication) {
                const indicationIndex = this.openRequestsQueue.findIndex(
                    (x) => x.clusterId === zclFrame.cluster.ID && x.transactionSequenceNumber === zclFrame.header.transactionSequenceNumber,
                );

                if (indicationIndex !== -1) {
                    this.openRequestsQueue[indicationIndex].confirmed = true;
                }
            }
        } catch (err) {
            // no need to wait for indication, remove waiter from queue
            // biome-ignore lint/nursery/noMisusedPromises: ignore
            if (indication) {
                const indicationIndex = this.openRequestsQueue.findIndex(
                    (x) => x.clusterId === zclFrame.cluster.ID && x.transactionSequenceNumber === zclFrame.header.transactionSequenceNumber,
                );

                if (indicationIndex !== -1) {
                    this.openRequestsQueue.splice(indicationIndex, 1);
                }
            }

            throw new Error(`failed to send ZCL request (${zclFrame.header.transactionSequenceNumber}) ${err}`);
        }

        // biome-ignore lint/nursery/noMisusedPromises: ignore
        if (indication) {
            try {
                const data = await indication;

                // TODO(mpi): This is nuts. Need to make sure that srcAddr16 is always valid.
                let addr: string | number;
                if (data.srcAddr16 !== undefined) addr = data.srcAddr16;
                else if (data.srcAddr64 !== undefined) addr = `0x${data.srcAddr64}`;
                else throw new Error("Unexpected waitForData() didn't contain valid address");

                const groupId = 0;
                const wasBroadCast = false;

                const response: Events.ZclPayload = {
                    address: addr,
                    data: data.asduPayload,
                    clusterID: zclFrame.cluster.ID,
                    header: Zcl.Header.fromBuffer(data.asduPayload),
                    endpoint: data.srcEndpoint,
                    linkquality: data.lqi,
                    groupID: groupId,
                    wasBroadcast: wasBroadCast,
                    destinationEndpoint: data.destEndpoint,
                };
                logger.debug(`Response received transactionSequenceNumber: ${zclFrame.header.transactionSequenceNumber}`, NS);
                return response;
            } catch (err) {
                throw new Error(`No ZCL response received for (${zclFrame.header.transactionSequenceNumber}) ${err}`);
            }
        }
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number, profileId?: number): Promise<void> {
        const transactionID = this.nextTransactionID();
        const payload = zclFrame.toBuffer();

        logger.debug(`zclFrame to group - ${groupID}`, NS);

        const request: ApsDataRequest = {
            requestId: transactionID,
            destAddrMode: ApsAddressMode.Group,
            destAddr16: groupID,
            profileId: profileId ?? 0x104,
            clusterId: zclFrame.cluster.ID,
            srcEndpoint: sourceEndpoint ?? 1,
            asduLength: payload.length,
            asduPayload: payload,
            txOptions: 0,
            radius: PARAM.PARAM.txRadius.UNLIMITED,
            timeout: PARAM.PARAM.APS.MAX_SEND_TIMEOUT,
        };

        logger.debug("sendZclFrameToGroup - message send", NS);
        return await (this.driver.enqueueApsDataRequest(request) as Promise<void>);
    }

    public async sendZclFrameToAll(
        endpoint: number,
        zclFrame: Zcl.Frame,
        sourceEndpoint: number,
        destination: BroadcastAddress,
        profileId?: number,
    ): Promise<void> {
        const transactionID = this.nextTransactionID();
        const payload = zclFrame.toBuffer();

        logger.debug(`zclFrame to all - ${endpoint}`, NS);

        const request: ApsDataRequest = {
            requestId: transactionID,
            destAddrMode: ApsAddressMode.Nwk,
            destAddr16: destination,
            destEndpoint: endpoint,
            profileId: profileId ?? (sourceEndpoint === 242 && endpoint === 242 ? 0xa1e0 : 0x104),
            clusterId: zclFrame.cluster.ID,
            srcEndpoint: sourceEndpoint,
            asduLength: payload.length,
            asduPayload: payload,
            txOptions: 0,
            radius: PARAM.PARAM.txRadius.UNLIMITED,
            timeout: PARAM.PARAM.APS.MAX_SEND_TIMEOUT,
        };

        logger.debug("sendZclFrameToAll - message send", NS);
        return await (this.driver.enqueueApsDataRequest(request) as Promise<void>);
    }

    public async supportsBackup(): Promise<boolean> {
        return await Promise.resolve(true);
    }

    /**
     * Loads currently stored backup and returns it in internal backup model.
     */
    private getStoredBackup(): Backup | undefined {
        const data = readBackup(this.backupPath);
        if (!data) return undefined;

        if ("metadata" in data && data.metadata?.format === "zigpy/open-coordinator-backup" && data.metadata?.version) {
            if (data.metadata?.version !== 1) {
                throw new Error(`[BACKUP] Unsupported open coordinator backup version (version=${data.metadata?.version}).`);
            }

            // if (data.metadata.internal.ezspVersion < BACKUP_OLDEST_SUPPORTED_EZSP_VERSION) {
            //     renameSync(this.backupPath, `${this.backupPath}.old`);
            //     logger.warning("[BACKUP] Current backup file is from an unsupported EZSP version. Renaming and ignoring.", NS);
            //     return undefined;
            // }

            return BackupUtils.fromUnifiedBackup(data);
        }

        throw new Error("[BACKUP] Unknown backup format.");
    }

    public async backup(): Promise<Models.Backup> {
        if (!this.driver.started()) {
            throw new Error("Can't create backup while driver isn't connected");
        }

        // NOTE(mpi): The U64 values are put as big endian format into the buffer, same as string (0x001234...)
        const extendedPanId = Buffer.alloc(8);
        extendedPanId.writeBigUint64BE(this.driver.paramApsUseExtPanid);
        const channelList = [this.driver.paramCurrentChannel]; // Utils.unpackChannelList(nib.channelList)
        const networkKey = this.driver.paramNwkKey;
        const coordinatorIeeeAddress = Buffer.alloc(8);
        coordinatorIeeeAddress.writeBigUint64BE(this.driver.paramMacAddress);

        /* return backup structure */
        const backup: Models.Backup = {
            networkOptions: {
                panId: this.driver.paramNwkPanid,
                extendedPanId,
                channelList,
                networkKey,
                networkKeyDistribute: false,
            },
            logicalChannel: this.driver.paramCurrentChannel,
            networkKeyInfo: {
                sequenceNumber: 0, // TODO(mpi): on newer firmware versions we can read it
                frameCounter: this.driver.paramFrameCounter,
            },
            securityLevel: 0x05, // AES-CCM-32 (fixed)
            networkUpdateId: this.driver.paramNwkUpdateId,
            coordinatorIeeeAddress,
            devices: [], // TODO(mpi): we currently don't have this, but it will be added once install codes get a proper interface
        };

        return await Promise.resolve(backup);
    }

    public getNetworkParameters(): Promise<NetworkParameters> {
        // TODO(mpi): This works with 0x26780700, needs more investigation with older firmware versions.
        const panID = this.driver.paramNwkPanid;
        const extendedPanID = this.driver.paramApsUseExtPanid;
        const channel = this.driver.paramCurrentChannel;
        const nwkUpdateID = this.driver.paramNwkUpdateId;

        if (channel === 0 || extendedPanID === 0n) {
            return Promise.reject(new Error("Failed to query network parameters"));
        }
        // TODO(mpi): check this statement, this should work
        // For some reason, reading NWK_UPDATE_ID always returns `null` (tested with `0x26780700` on Conbee II)
        // 0x24 was taken from https://github.com/zigpy/zigpy-deconz/blob/70910bc6a63e607332b4f12754ba470651eb878c/zigpy_deconz/api.py#L152
        // const nwkUpdateId = await this.driver.readParameterRequest(0x24 /*PARAM.PARAM.Network.NWK_UPDATE_ID*/);

        return Promise.resolve({panID, extendedPanID: `0x${extendedPanID.toString(16).padStart(16, "0")}`, channel, nwkUpdateID});
    }

    public async restoreChannelInterPAN(): Promise<void> {
        await Promise.reject(new Error("not supported"));
    }
    public async sendZclFrameInterPANToIeeeAddr(_zclFrame: Zcl.Frame, _ieeeAddr: string): Promise<void> {
        await Promise.reject(new Error("not supported"));
    }
    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number, disableResponse: false): Promise<Events.ZclPayload>;
    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number, disableResponse: true): Promise<undefined>;
    public async sendZclFrameInterPANBroadcast(
        _zclFrame: Zcl.Frame,
        _timeout: number,
        _disableResponse: boolean,
    ): Promise<Events.ZclPayload | undefined> {
        return await Promise.reject(new Error("not supported"));
    }
    public async sendZclFrameInterPANBroadcastWithResponse(_zclFrame: Zcl.Frame, _timeout: number): Promise<Events.ZclPayload> {
        return await Promise.reject(new Error("not supported"));
    }
    public async setChannelInterPAN(_channel: number): Promise<void> {
        await Promise.reject(new Error("not supported"));
    }
    public async sendZclFrameInterPANIeeeAddr(_zclFrame: Zcl.Frame, _ieeeAddr: string): Promise<void> {
        await Promise.reject(new Error("not supported"));
    }

    /**
     * Private methods
     */

    private waitForData(
        addr: number | string,
        profileId: number,
        clusterId: number,
        transactionSequenceNumber: number,
        timeout: number,
    ): Promise<ReceivedDataResponse> {
        return new Promise((resolve, reject): void => {
            const ts = Date.now();
            if (!timeout) {
                timeout = 60000;
            }

            const confirmed = false;
            const req: WaitForDataRequest = {addr, profileId, clusterId, transactionSequenceNumber, resolve, reject, confirmed, ts, timeout};
            this.openRequestsQueue.push(req);
        });
    }

    private checkReceivedGreenPowerIndication(ind: GpDataInd): void {
        const gpdHeader = Buffer.alloc(15); // applicationId === IEEE_ADDRESS ? 20 : 15
        gpdHeader.writeUInt8(0b00000001, 0); // frameControl: FrameType.SPECIFIC + Direction.CLIENT_TO_SERVER + disableDefaultResponse=false
        gpdHeader.writeUInt8(ind.seqNr, 1);
        gpdHeader.writeUInt8(ind.id, 2); // commandIdentifier
        gpdHeader.writeUInt16LE(ind.options, 3); // options
        gpdHeader.writeUInt32LE(ind.srcId, 5);
        // omitted: gpdIEEEAddr (ieeeAddr)
        // omitted: gpdEndpoint (uint8)
        gpdHeader.writeUInt32LE(ind.frameCounter, 9);
        gpdHeader.writeUInt8(ind.commandId, 13);
        gpdHeader.writeUInt8(ind.commandFrameSize, 14);

        const payBuf = Buffer.concat([gpdHeader, ind.commandFrame]);
        const payload: Events.ZclPayload = {
            header: Zcl.Header.fromBuffer(payBuf),
            data: payBuf,
            clusterID: Zcl.Clusters.greenPower.ID,
            address: ind.srcId & 0xffff,
            endpoint: ZSpec.GP_ENDPOINT,
            linkquality: 0xff, // bogus
            groupID: ZSpec.GP_GROUP_ID,
            wasBroadcast: true, // Take the codepath that doesn't require `gppNwkAddr` as its not present in the payload
            destinationEndpoint: ZSpec.GP_ENDPOINT,
        };

        this.waitress.resolve(payload);
        this.emit("zclPayload", payload);
    }

    private checkWaitForDataRequestTimeouts() {
        if (this.openRequestsQueue.length === 0) {
            return;
        }

        const now = Date.now();
        const req: WaitForDataRequest = this.openRequestsQueue[0];

        if (req.confirmed && req.timeout < now - req.ts) {
            this.openRequestsQueue.shift();
            logger.debug(
                `Timeout for request in openRequestsQueue addr: ${req.addr}, clusterId: ${req.clusterId.toString(16)}, profileId: ${req.profileId.toString(16)}, seq: ${req.transactionSequenceNumber}`,
                NS,
            );
            req.reject(new Error("waiting for response TIMEOUT"));
        }
    }

    private checkReceivedDataPayload(resp: ReceivedDataResponse): void {
        //let srcAddr: number | undefined;
        //let srcEUI64: string | undefined;
        let header: Zcl.Header | undefined;

        //srcAddr = resp.srcAddr16;

        // TODO(mpi): The following shouldn't be needed anymore.

        // if (resp.srcAddr16 != null) {
        //
        // } else {
        //     // For some devices srcAddr64 is reported by ConBee 3, even if the frame contains both
        //     // srcAddr16 and srcAddr64. This happens even if the request was sent to a short address.
        //     // At least some parts, e.g. the while loop below, only work with srcAddr16 (i.e. the network
        //     // address) being set. So we try to look up the network address in the list of know devices.
        //     if (resp.srcAddr64 != null) {
        //         logger.debug(`Try to find network address of ${resp.srcAddr64}`, NS);
        //         // Note: Device expects addresses with a 0x prefix...
        //         srcAddr = Device.byIeeeAddr(`0x${resp.srcAddr64}`, false)?.networkAddress;
        //         // apperantly some functions furhter up in the protocol stack expect this to be set.
        //         // so let's make sure they get the network address
        //         // Note: srcAddr16 can be undefined after this and this is intended behavior
        //         // there are zigbee frames which do not contain a 16 bit address, e.g. during joining.
        //         // So any code that relies on srcAddr16 must handle this in some way.
        //         resp.srcAddr16 = srcAddr;
        //     }
        // }
        //
        // ---------------------------------------------------------------------
        // if (resp.srcAddr16) { // temp test
        //     const dev = Device.byNetworkAddress(resp.srcAddr16);
        //
        //     if (dev) {
        //         logger.debug(`APS-DATA.indication from ${dev.ieeeAddr}, ${dev.modelID} ${dev.manufacturerID}`, NS);
        //     }
        // }

        if (resp.profileId === Zdo.ZDO_PROFILE_ID) {
            if (resp.zdo) {
                if (resp.clusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE) {
                    // if (Zdo.Buffalo.checkStatus<Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE>(resp.zdo)) {
                    //     srcEUI64 = resp.zdo[1].eui64;
                    // }
                } else if (resp.clusterId === Zdo.ClusterId.END_DEVICE_ANNOUNCE) {
                    // XXX: using same response for announce (handled by controller) or joined depending on permit join status?
                    // TODO(mpi): Clarify with core devs, I don't think the adapter should do this?!
                    if (this.joinPermitted === true && Zdo.Buffalo.checkStatus<Zdo.ClusterId.END_DEVICE_ANNOUNCE>(resp.zdo)) {
                        const payload = resp.zdo[1];
                        this.emit("deviceJoined", {networkAddress: payload.nwkAddress, ieeeAddr: payload.eui64});
                    }
                }

                // TODO(mpi) it seems that the controller is only interested in NWK, IEEE and DeviceAnnounce command
                // So maybe we should filter here?
                this.emit("zdoResponse", resp.clusterId, resp.zdo);
            }
        } else {
            header = Zcl.Header.fromBuffer(resp.asduPayload);

            if (!header) {
                logger.debug("Failed tp parse ZCL header of non ZDO command", NS);
            }
        }

        let i = this.openRequestsQueue.length;

        while (i--) {
            const req: WaitForDataRequest = this.openRequestsQueue[i];

            if (req.profileId !== resp.profileId) {
                continue;
            }

            if (req.profileId === Zdo.ZDO_PROFILE_ID) {
                if (req.clusterId !== resp.clusterId) {
                    continue;
                }

                if (req.transactionSequenceNumber !== resp.asduPayload[0]) {
                    continue; // ZDP sequence number in first byte
                }
            } else if (header) {
                if (header.transactionSequenceNumber !== req.transactionSequenceNumber) {
                    continue;
                }

                if (req.clusterId !== resp.clusterId) {
                    continue;
                }
            } else {
                continue; // We should always have a valid transactionId (ZDO and ZCL)
            }

            this.openRequestsQueue.splice(i, 1);
            req.resolve(resp);
        }

        if (resp.profileId !== Zdo.ZDO_PROFILE_ID) {
            let groupID = 0;
            let wasBroadCast = false;

            if (resp.destAddrMode === ApsAddressMode.Group) {
                groupID = resp.destAddr16;
                wasBroadCast = true;
            } else if (resp.destAddrMode === ApsAddressMode.Nwk && resp.destAddr16 >= NwkBroadcastAddress.BroadcastLowPowerRouters) {
                wasBroadCast = true;
            }

            const payload: Events.ZclPayload = {
                clusterID: resp.clusterId,
                header,
                data: resp.asduPayload,
                address: resp.srcAddr16,
                endpoint: resp.srcEndpoint,
                linkquality: resp.lqi,
                groupID: groupID,
                wasBroadcast: wasBroadCast,
                destinationEndpoint: resp.destEndpoint,
            };

            this.waitress.resolve(payload);
            this.emit("zclPayload", payload);
        }
    }

    private nextTransactionID(): number {
        return this.driver.nextTransactionID();
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
                payload.endpoint === matcher.endpoint &&
                (matcher.transactionSequenceNumber === undefined || payload.header.transactionSequenceNumber === matcher.transactionSequenceNumber) &&
                payload.clusterID === matcher.clusterID &&
                matcher.frameType === payload.header.frameControl.frameType &&
                matcher.commandIdentifier === payload.header.commandIdentifier &&
                matcher.direction === payload.header.frameControl.direction,
        );
    }
}
