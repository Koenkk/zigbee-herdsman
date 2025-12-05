/* istanbul ignore file */

import assert from "node:assert";

import * as Models from "../../../models";
import {Queue, wait, Waitress} from "../../../utils";
import {logger} from "../../../utils/logger";
import * as ZSpec from "../../../zspec";
import * as Zcl from "../../../zspec/zcl";
import * as Zdo from "../../../zspec/zdo";
import * as ZdoTypes from "../../../zspec/zdo/definition/tstypes";
import Adapter from "../../adapter";
import {ZclPayload} from "../../events";
import {AdapterOptions, CoordinatorVersion, NetworkOptions, NetworkParameters, SerialPortOptions, StartResult} from "../../tstype";
import {Driver, BlzIncomingMessage} from "../driver";
import {BlzEUI64, BlzStatus, uint64_t} from "../driver/types";

const NS = "zh:blz";

const autoDetectDefinitions = [
    {manufacturer: "wch.cn", vendorId: "1A86", productId: "7523"}, // ThirdReality Zigbee USB Dongle
];

interface WaitressMatcher {
    address?: number | string;
    endpoint: number;
    transactionSequenceNumber?: number;
    clusterID: number;
    commandIdentifier: number;
}

export class BLZAdapter extends Adapter {
    private driver: Driver;
    private waitress: Waitress<ZclPayload, WaitressMatcher>;
    private interpanLock: boolean;
    private queue: Queue;
    private closing: boolean;

    public constructor(networkOptions: NetworkOptions, serialPortOptions: SerialPortOptions, backupPath: string, adapterOptions: AdapterOptions) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);
        this.hasZdoMessageOverhead = true;
        this.manufacturerID = Zcl.ManufacturerCode.SILICON_LABORATORIES;

        this.waitress = new Waitress<ZclPayload, WaitressMatcher>(this.waitressValidator, this.waitressTimeoutFormatter);
        this.interpanLock = false;
        this.closing = false;

        const concurrent = adapterOptions?.concurrent ?? 8;
        logger.debug(`Adapter concurrent: ${concurrent}`, NS);
        this.queue = new Queue(concurrent);

        this.driver = new Driver(this.serialPortOptions, this.networkOptions, backupPath);
        this.driver.on("close", this.onDriverClose.bind(this));
        this.driver.on("deviceJoined", this.handleDeviceJoin.bind(this));
        this.driver.on("deviceLeft", this.handleDeviceLeft.bind(this));
        this.driver.on("incomingMessage", this.processMessage.bind(this));
    }

    private async processMessage(frame: BlzIncomingMessage): Promise<void> {
        logger.debug(() => `processMessage: ${JSON.stringify(frame)}`, NS);

        if (frame.apsFrame.profileId === Zdo.ZDO_PROFILE_ID) {
            if (frame.apsFrame.clusterId >= 0x8000 /* response only */) {
                if (frame.zdoResponse) {
                    this.emit("zdoResponse", frame.apsFrame.clusterId, frame.zdoResponse);
                }
            }
        } else if (frame.apsFrame.profileId === ZSpec.HA_PROFILE_ID || frame.apsFrame.profileId === 0xffff) {
            const payload: ZclPayload = {
                clusterID: frame.apsFrame.clusterId,
                header: Zcl.Header.fromBuffer(frame.message),
                data: frame.message,
                address: frame.sender,
                endpoint: frame.apsFrame.sourceEndpoint,
                linkquality: frame.lqi,
                groupID: frame.apsFrame.groupId ?? 0,
                wasBroadcast: false, // TODO
                destinationEndpoint: frame.apsFrame.destinationEndpoint,
            };

            this.waitress.resolve(payload);
            this.emit("zclPayload", payload);
        } else if (frame.apsFrame.profileId === ZSpec.TOUCHLINK_PROFILE_ID && frame.senderEui64) {
            // Touchlink is not supported by BLZ
        } else if (frame.apsFrame.profileId === ZSpec.GP_PROFILE_ID) {
            // Green Power is not supported by BLZ
        }
    }

    private async handleDeviceJoin(nwk: number, ieee: BlzEUI64): Promise<void> {
        logger.debug(() => `Device join request received: ${nwk} ${ieee.toString()}`, NS);

        this.emit("deviceJoined", {
            networkAddress: nwk,
            ieeeAddr: `${ieee.toString()}`,
        });
    }

    private handleDeviceLeft(nwk: number, ieee: BlzEUI64): void {
        logger.debug(() => `Device left network request received: ${nwk} ${ieee.toString()}`, NS);

        this.emit("deviceLeave", {
            networkAddress: nwk,
            ieeeAddr: `0x${ieee.toString()}`,
        });
    }

    /**
     * Adapter methods
     */
    public async start(): Promise<StartResult> {
        const result = await this.driver.startup();
        await wait(1000);
        return result;
    }

    public async stop(): Promise<void> {
        this.closing = true;
        await this.driver.stop();
    }

    public onDriverClose(): void {
        logger.debug("onDriverClose()", NS);

        if (!this.closing) {
            this.emit("disconnected");
        }
    }

    public async getCoordinatorIEEE(): Promise<string> {
        return `0x${this.driver.ieee.toString()}`;
    }

    public async permitJoin(seconds: number, networkAddress?: number): Promise<void> {
        if (!this.driver.blz.isInitialized()) {
            return;
        }

        const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;

        if (networkAddress) {
            // Permit joining for specific devices is handled differently in BLZ
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

            const result = await this.sendZdo(ZSpec.BLANK_EUI64, networkAddress, clusterId, zdoPayload, false);

            /* istanbul ignore next */
            if (!Zdo.Buffalo.checkStatus(result)) {
                // TODO: will disappear once moved upstream
                throw new Zdo.StatusError(result[0]);
            }
        } else {
            const result = await this.driver.permitJoining(seconds);
            if (result.status !== BlzStatus.SUCCESS) {
                throw new Error(`[ZDO] Failed coordinator permit joining request with status=${result.status}.`);
            }

            logger.debug(`Permit joining on coordinator for ${seconds} sec.`, NS);

            // broadcast permit joining ZDO
            if (networkAddress === undefined) {
                // `authentication`: TC significance always 1 (zb specs)
                const zdoPayload = Zdo.Buffalo.buildRequest(this.hasZdoMessageOverhead, clusterId, seconds, 1, []);

                await this.sendZdo(ZSpec.BLANK_EUI64, ZSpec.BroadcastAddress.DEFAULT, clusterId, zdoPayload, true);
            }
        }
    }

    public async getCoordinatorVersion(): Promise<CoordinatorVersion> {
        return {type: `BLZ v${this.driver.blz.version.product}`, meta: this.driver.blz.version};
    }

    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        throw new Error("Not supported");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async reset(type: "soft" | "hard"): Promise<void> {
        return await Promise.reject(new Error("Not supported"));
    }


    /**
     * Send a ZDO request / command frame.
     *
     * NWK_UPDATE_REQUEST (cluster 0x0038) needs special handling on BLZ because we
     * sometimes receive it without the optional `nwkManagerAddr` _and/or_ without
     * the Transaction Sequence Number (TSN) that is required when
     * `hasZdoMessageOverhead === true`.
     */
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
        if (clusterId === Zdo.ClusterId.NWK_UPDATE_REQUEST &&
        ZSpec.Utils.isBroadcastAddress(networkAddress))
            {  
            /*───────────────────────────────────────────────────────────────────────────
            * 0.  Snapshot of the raw incoming frame                                     */
            let buf = Buffer.from(payload);           // safe copy
            logger.debug(
                `[BLZ] NWK_UPDATE_REQUEST raw  len=${buf.length}  ${buf.toString("hex")}`,
                NS);
            // First, determine the expected lengths for different scenarios
            const baseLen = this.hasZdoMessageOverhead ? 9 : 8;  // with TSN and manager addr
            const baseLenNoMgr = this.hasZdoMessageOverhead ? 7 : 6;  // with TSN, no manager addr
            const baseLenNoTsn = this.hasZdoMessageOverhead ? 8 : 7;  // no TSN, with manager addr  
            const baseLenNoTsnNoMgr = this.hasZdoMessageOverhead ? 6 : 5;  // no TSN, no manager addr

            // Determine what's missing based on current length
            let needsTsn = false;
            let needsMgrAddr = false;

            if (this.hasZdoMessageOverhead) {
                // Expected scenarios when hasZdoMessageOverhead is true:
                // 9 bytes: TSN + 4 bytes mask + 1 byte duration + 1 byte updateId + 2 bytes mgr addr
                // 7 bytes: TSN + 4 bytes mask + 1 byte duration + 1 byte updateId (missing mgr addr)
                // 8 bytes: 4 bytes mask + 1 byte duration + 1 byte updateId + 2 bytes mgr addr (missing TSN)
                // 6 bytes: 4 bytes mask + 1 byte duration + 1 byte updateId (missing both TSN and mgr addr)
                
                switch (buf.length) {
                    case 9:
                        // Perfect - has both TSN and manager addr
                        break;
                    case 7:
                        // Has TSN, missing manager addr
                        needsMgrAddr = true;
                        break;
                    case 8:
                        // Missing TSN, has manager addr
                        needsTsn = true;
                        break;
                    case 6:
                        // Missing both TSN and manager addr
                        needsTsn = true;
                        needsMgrAddr = true;
                        break;
                    default:
                        throw new Error(
                            `Unexpected NWK_UPDATE_REQUEST length ${buf.length} bytes. ` +
                            `Expected 6, 7, 8, or 9 bytes when hasZdoMessageOverhead=true`);
                }
            } else {
                // Expected scenarios when hasZdoMessageOverhead is false:
                // 8 bytes: 4 bytes mask + 1 byte duration + 1 byte updateId + 2 bytes mgr addr
                // 6 bytes: 4 bytes mask + 1 byte duration + 1 byte updateId (missing mgr addr)
                
                switch (buf.length) {
                    case 8:
                        // Perfect - has manager addr
                        break;
                    case 6:
                        // Missing manager addr
                        needsMgrAddr = true;
                        break;
                    default:
                        throw new Error(
                            `Unexpected NWK_UPDATE_REQUEST length ${buf.length} bytes. ` +
                            `Expected 6 or 8 bytes when hasZdoMessageOverhead=false`);
                }
            }

            // Add TSN if needed
            if (needsTsn) {
                const tmp = Buffer.alloc(buf.length + 1);
                tmp[0] = 0x00;                // placeholder TSN – overwritten later
                buf.copy(tmp, 1);
                buf = tmp;
                logger.debug(`[BLZ]  +TSN  -> len=${buf.length}  ${buf.toString("hex")}`, NS);
            }

            // Add manager address if needed
            if (needsMgrAddr) {
                const tmp = Buffer.alloc(buf.length + 2);
                buf.copy(tmp, 0);
                tmp.writeUInt16LE(0xFFFF, buf.length);
                buf = tmp;
                logger.debug(`[BLZ]  +mgr -> len=${buf.length}  ${buf.toString("hex")}`, NS);
            }

            // Final length validation
            const expectedFinalLen = this.hasZdoMessageOverhead ? 9 : 8;
            if (buf.length !== expectedFinalLen) {
                throw new Error(
                    `Invalid NWK_UPDATE_REQUEST length ${buf.length} bytes ` +
                    `(expected ${expectedFinalLen}) after normalisation`);
            }
            /*  Canonical buffer is ready – hand it to the parser and keep it for TX. */
            payload = buf;
            logger.debug(`[BLZ] Canonical payload len=${payload.length} ${payload.toString("hex")}`, NS);

            /*───────────────────────────────────────────────────────────────────────────
            * 3.  Parse fields                                                          */
            let offset = this.hasZdoMessageOverhead ? 1 : 0;   // skip TSN if present

            const need = (n: number) => {
                if (payload.length < offset + n) {
                    throw new Error(`Need ${n} bytes at offset ${offset}, only ` +
                                    `${payload.length} available`);
                }
            };

            need(4);
            const scanChannelsMask = payload.readUInt32LE(offset); offset += 4;

            /* Two layouts exist in the wild:
                A) Z‑Stack “channel change”   :  scanDuration (=0xFE)  nwkUpdateId
                B) Ember  “energy scan”       :  scanCount   scanDuration   nwkUpdateId
            Distinguish by checking the first byte after the mask: 0xFE → layout A. */
            need(1);
            let scanDuration: number;
            let scanCount   = 0;           // default when absent
            let nwkUpdateId: number;

            const byte5 = payload.readUInt8(offset);
            if (byte5 === 0xFE) {                          /* Layout A */
                scanDuration = byte5;
                offset += 1;

                need(1);
                nwkUpdateId = payload.readUInt8(offset);   offset += 1;

            } else {                                       /* Layout B */
                scanCount = byte5;
                offset += 1;

                need(1);
                scanDuration = payload.readUInt8(offset);  offset += 1;

                need(1);
                nwkUpdateId = payload.readUInt8(offset);   offset += 1;
            }

            need(2);
            const nwkManagerAddr = payload.readUInt16LE(offset); offset += 2;

            logger.debug(
                `[BLZ] Parsed → mask=0x${scanChannelsMask.toString(16)}, ` +
                `duration=0x${scanDuration.toString(16)}, count=${scanCount}, ` +
                `updateId=${nwkUpdateId}, manager=0x${nwkManagerAddr.toString(16)}`,
                NS);

            /*───────────────────────────────────────────────────────────────────────────
            * 4.  Validate for *channel‑change* requests                                */
            if (scanDuration !== 0xFE) {
                throw new Error(`scanDuration 0x${scanDuration.toString(16)} ≠ 0xFE; ` +
                                `this adapter only handles channel‑change requests.`);
            }
            if (nwkUpdateId === 0) {
                logger.warning(`[BLZ] nwkUpdateId == 0 (unusual but allowed)`, NS);
            }

            /*  Extract the single channel from the mask (must have exactly one bit).  */
            let newChannel = -1;
            for (let i = 0; i < 32; i++) {
                if ((scanChannelsMask >>> i) & 1) {
                    if (newChannel !== -1) {
                        throw new Error(`scanChannelsMask 0x${scanChannelsMask.toString(16)} ` +
                                        `has more than one bit set`);
                    }
                    newChannel = i;
                }
            }
            if (newChannel === -1) {
                throw new Error(`scanChannelsMask 0x${scanChannelsMask.toString(16)} has no bits set`);
            }

            logger.info(`[BLZ] Channel‑change request → channel ${newChannel}, `
                        + `nwkUpdateId=${nwkUpdateId}`, NS);

            /*───────────────────────────────────────────────────────────────────────────
            * 5.  Broadcast the request with the SAME buffer (overwrite TSN now)       */
            await this.queue.execute(async () => {
                this.checkInterpanLock();
                const frame = this.driver.makeApsFrame(clusterId, disableResponse);
                payload[0] = frame.sequence;                       // real TSN

                logger.debug(() =>
                    `~~~> [ZDO NWK_UPDATE_REQUEST BROADCAST to=${networkAddress} ` +
                    `payload=${payload.toString("hex")}]`, NS);

                const ok = await this.driver.brequest(networkAddress, frame, payload);
                if (!ok) throw new Error("Failed to broadcast NWK_UPDATE_REQUEST");
            }, networkAddress);

            /*───────────────────────────────────────────────────────────────────────────
            * 6.  Perform the local channel change on BLZ hardware                     */
            await this.handleChannelChange(newChannel, nwkUpdateId);
            return;
        }


        return await this.queue.execute(async () => {
            this.checkInterpanLock();

            const clusterName = Zdo.ClusterId[clusterId];
            const frame = this.driver.makeApsFrame(clusterId, disableResponse);
            payload[0] = frame.sequence; // Sequence number is required for BLZ APS frame
            let waiter: ReturnType<typeof this.driver.waitFor> | undefined;
            let responseClusterId: number | undefined;

            if (!disableResponse) {
                responseClusterId = Zdo.Utils.getResponseClusterId(clusterId);

                if (responseClusterId) {
                    waiter = this.driver.waitFor(
                        responseClusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE ? ieeeAddress : networkAddress,
                        responseClusterId,
                    );
                }
            }

            if (ZSpec.Utils.isBroadcastAddress(networkAddress)) {
                logger.debug(() => `~~~> [ZDO ${clusterName} BROADCAST to=${networkAddress} payload=${payload.toString('hex')}]`, NS);

                const req = await this.driver.brequest(networkAddress, frame, payload);

                logger.debug("~~~> [SENT ZDO BROADCAST]", NS);

                if (!req) {
                    waiter?.cancel();
                    throw new Error(`~x~> [ZDO ${clusterName} BROADCAST to=${networkAddress}] Failed to send request.`);
                }
            } else {
                logger.debug(() => `~~~> [ZDO ${clusterName} UNICAST to=${ieeeAddress}:${networkAddress} payload=${payload.toString('hex')}]`, NS);

                const req = await this.driver.request(networkAddress, frame, payload);

                logger.debug("~~~> [SENT ZDO UNICAST]", NS);

                if (!req) {
                    waiter?.cancel();
                    throw new Error(`~x~> [ZDO ${clusterName} UNICAST to=${ieeeAddress}:${networkAddress}] Failed to send request.`);
                }
            }

            if (waiter && responseClusterId !== undefined) {
                const response = await waiter.start().promise;

                logger.debug(() => `<~~ [ZDO ${Zdo.ClusterId[responseClusterId]} ${JSON.stringify(response.zdoResponse!)}]`, NS);

                return response.zdoResponse! as ZdoTypes.RequestToResponseMap[K];
            }
        }, networkAddress);
    }

    /**
     * Handle channel change for BLZ adapter
     * Since BLZ doesn't support runtime channel change, we:
     * 1. Wait for broadcast to propagate
     * 2. Leave the network
     * 3. Reform on the new channel
     */
    private async handleChannelChange(newChannel: number, nwkUpdateId: number): Promise<void> {
        logger.info(`[BLZ] Starting channel change to channel ${newChannel} with NWKUpdateID ${nwkUpdateId}`, NS);
        
        // 1. Validate NWKUpdateID
        const currentParams = await this.getNetworkParameters();
        if (nwkUpdateId <= currentParams.nwkUpdateID) {
            throw new Error(`Invalid NWKUpdateID ${nwkUpdateId} - must be greater than current ${currentParams.nwkUpdateID}`);
        }
        
        logger.debug(`[BLZ] Current network parameters:`, NS);
        logger.debug(`[BLZ]   - PanID: 0x${currentParams.panID.toString(16)}`, NS);
        logger.debug(`[BLZ]   - ExtendedPanID: ${currentParams.extendedPanID}`, NS);
        logger.debug(`[BLZ]   - ExtendedPanID type: ${typeof currentParams.extendedPanID}`, NS);
        logger.debug(`[BLZ]   - Channel: ${currentParams.channel}`, NS);
        logger.debug(`[BLZ]   - Current NWKUpdateID: ${currentParams.nwkUpdateID}`, NS);
        logger.debug(`[BLZ]   - New NWKUpdateID: ${nwkUpdateId}`, NS);

        // 2. Get current network state
        const networkKeyInfo = await this.driver.getNetworkKeyInfo();
        const tcLinkKeyInfo = await this.driver.getGlobalTcLinkKey();
        
        // 3. Wait for broadcast to propagate (minimum 15 seconds per Zigbee spec)
        logger.info(`[BLZ] Waiting for broadcast to propagate (15s)...`, NS);
        await wait(15000);
        
        // 4. Leave current network
        logger.info(`[BLZ] Leaving current network...`, NS);
        const leaveStatus = await this.driver.blz.leaveNetwork();
        if (leaveStatus !== BlzStatus.SUCCESS) {
            throw new Error(`[BLZ] Failed to leave network with status=${leaveStatus}`);
        }
        await wait(4000);
        
        // 5. Update network security info with new NWKUpdateID
        logger.info(`[BLZ] Updating network security info...`, NS);
        await this.driver.setNetworkKeyInfo(
            networkKeyInfo.nwkKey,
            networkKeyInfo.outgoingFrameCounter,
            networkKeyInfo.nwkKeySeqNum
        );
        await this.driver.setGlobalTcLinkKey(
            tcLinkKeyInfo.linkKey,
            tcLinkKeyInfo.outgoingFrameCounter
        );
        
        // 6. Reform network on new channel
        logger.info(`[BLZ] Reforming network on channel ${newChannel}...`, NS);
        const extPanIdBuffer = typeof currentParams.extendedPanID === 'string' ?
            Buffer.from(currentParams.extendedPanID.replace('0x', ''), 'hex') :
            Buffer.from(currentParams.extendedPanID);
        
        const [extPanId] = uint64_t.deserialize(uint64_t, extPanIdBuffer);
        const formStatus = await this.driver.blz.formNetwork(
            extPanId,
            currentParams.panID,
            newChannel
        );
        
        if (formStatus !== BlzStatus.SUCCESS) {
            throw new Error(`[BLZ] Failed to form network on channel ${newChannel}`);
        }
        
        // 7. Update driver's network parameters
        this.driver.networkParams.Channel = newChannel;
        this.driver.networkParams.nwkUpdateId = nwkUpdateId;
        
        // 8. Wait for network stabilization
        logger.info(`[BLZ] Waiting for network to stabilize (5s)...`, NS);
        await wait(5000);
        
        logger.info(`[BLZ] Channel change completed successfully`, NS);
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
    ): Promise<ZclPayload | undefined> {
        return await this.queue.execute<ZclPayload | undefined>(async () => {
            this.checkInterpanLock();
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
    ): Promise<ZclPayload | undefined> {
        if (ieeeAddr == null) {
            ieeeAddr = `0x${this.driver.ieee.toString()}`;
        }
        logger.debug(
            `sendZclFrameToEndpointInternal ${ieeeAddr}:${networkAddress}/${endpoint} ` +
                `(${responseAttempt},${dataRequestAttempt},${this.queue.count()}), timeout=${timeout}`,
            NS,
        );
        let response = null;
        const command = zclFrame.command;
        if (command.response != undefined && disableResponse === false) {
            response = this.waitForInternal(
                networkAddress,
                endpoint,
                zclFrame.header.transactionSequenceNumber,
                zclFrame.cluster.ID,
                command.response,
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

        const frame = this.driver.makeApsFrame(zclFrame.cluster.ID, disableResponse || zclFrame.header.frameControl.disableDefaultResponse);
        frame.profileId = ZSpec.HA_PROFILE_ID;
        frame.sourceEndpoint = sourceEndpoint || 0x01;
        frame.destinationEndpoint = endpoint;
        frame.groupId = 0;

        this.driver.setNode(networkAddress, new BlzEUI64(ieeeAddr));
        const dataConfirmResult = await this.driver.request(networkAddress, frame, zclFrame.toBuffer());
        if (!dataConfirmResult) {
            if (response != null) {
                response.cancel();
            }
            throw Error("sendZclFrameToEndpointInternal error");
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
                    );
                } else {
                    throw error;
                }
            }
        }
    }

    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame): Promise<void> {
        return await this.queue.execute<void>(async () => {
            this.checkInterpanLock();
            const frame = this.driver.makeApsFrame(zclFrame.cluster.ID, false);
            frame.profileId = ZSpec.HA_PROFILE_ID;
            frame.sourceEndpoint = 0x01;
            frame.destinationEndpoint = 0x01;
            frame.groupId = groupID;

            await this.driver.mrequest(frame, zclFrame.toBuffer());
            /**
             * As a group command is not confirmed and thus immidiately returns
             * (contrary to network address requests) we will give the
             * command some time to 'settle' in the network.
             */
            await wait(200);
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
            const frame = this.driver.makeApsFrame(zclFrame.cluster.ID, false);
            // Green Power is not supported by BLZ
            if (endpoint === ZSpec.GP_ENDPOINT) {
                return
            }
            frame.profileId = sourceEndpoint === ZSpec.GP_ENDPOINT && endpoint === ZSpec.GP_ENDPOINT ? ZSpec.GP_PROFILE_ID : ZSpec.HA_PROFILE_ID;
            frame.sourceEndpoint = sourceEndpoint;
            frame.destinationEndpoint = endpoint;
            frame.groupId = destination;

            // XXX: should be:
            // await this.driver.brequest(destination, frame, zclFrame.toBuffer())
            await this.driver.mrequest(frame, zclFrame.toBuffer());

            /**
             * As a broadcast command is not confirmed and thus immidiately returns
             * (contrary to network address requests) we will give the
             * command some time to 'settle' in the network.
             */
            await wait(200);
        });
    }

    public async getNetworkParameters(): Promise<NetworkParameters> {
        const extPanId = this.driver.networkParams.extendedPanId;
        const extendedPanID = extPanId instanceof Buffer ? 
            '0x' + extPanId.toString('hex') : 
            '0x0000000000000000';

        return {
            panID: this.driver.networkParams.panId,
            extendedPanID,
            channel: this.driver.networkParams.Channel,
            nwkUpdateID: this.driver.networkParams.nwkUpdateId,
        };
    }

    public async supportsBackup(): Promise<boolean> {
        return true;
    }

    public async backup(): Promise<Models.Backup> {
        assert(this.driver.blz.isInitialized(), "Cannot make backup when blz is not initialized");
        return await this.driver.backupMan.createBackup();
    }

    public async restoreChannelInterPAN(): Promise<void> {
        throw new Error("Not supported");
    }

    private checkInterpanLock(): void {
        if (this.interpanLock) {
            throw new Error(`Cannot execute command, in Inter-PAN mode`);
        }
    }

    public async sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddr: string): Promise<void> {
        throw new Error("Not supported");
    }

    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number, disableResponse: false): Promise<ZclPayload>;
    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number, disableResponse: true): Promise<undefined>;
    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number, disableResponse: boolean): Promise<ZclPayload | undefined> {
        throw new Error("Not supported");
    }

    public async setTransmitPower(value: number): Promise<void> {
        throw new Error("Not supported");
    }

    public async setChannelInterPAN(channel: number): Promise<void> {
        throw new Error("Not supported");
    }

    private waitForInternal(
        networkAddress: number | undefined,
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
        networkAddress: number | undefined,
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
        return Boolean(
            payload.header &&
                (!matcher.address || payload.address === matcher.address) &&
                payload.endpoint === matcher.endpoint &&
                (!matcher.transactionSequenceNumber || payload.header.transactionSequenceNumber === matcher.transactionSequenceNumber) &&
                payload.clusterID === matcher.clusterID &&
                matcher.commandIdentifier === payload.header.commandIdentifier,
        );
    }
}
