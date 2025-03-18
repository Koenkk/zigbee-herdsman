import assert from 'node:assert';
import {createCipheriv} from 'node:crypto';
import {EventEmitter} from 'node:events';

import {aes128CcmStar} from 'zigbee-on-host/dist/zigbee/zigbee';

import {Adapter, Events as AdapterEvents} from '../adapter';
import {logger} from '../utils/logger';
import {COORDINATOR_ADDRESS, GP_ENDPOINT, GP_GROUP_ID, INTEROPERABILITY_LINK_KEY} from '../zspec/consts';
import {BroadcastAddress} from '../zspec/enums';
import * as Zcl from '../zspec/zcl';
import {GPDChannelConfiguration, GPDCommissioningReply} from '../zspec/zcl/buffaloZcl';
import ZclTransactionSequenceNumber from './helpers/zclTransactionSequenceNumber';
import {Device} from './model';
import {GreenPowerDeviceJoinedPayload} from './tstype';

const NS = 'zh:controller:greenpower';

/** @see Zcl.Clusters.greenPower.commandsResponse.pairing */
type PairingPayload = {
    options: number;
    srcID?: number;
    gpdIEEEAddr?: string;
    gpdEndpoint?: number;
    sinkIEEEAddr?: string;
    sinkNwkAddr?: number;
    sinkGroupID?: number;
    deviceID?: number;
    frameCounter?: number;
    gpdKey?: Buffer;
    assignedAlias?: number;
    groupcastRadius?: number;
};

/** @see Zcl.Clusters.greenPower.commandsResponse.response */
type ResponsePayload<T extends GPDCommissioningReply | GPDChannelConfiguration> = {
    options: number;
    tempMaster: number;
    tempMasterTx: number;
    srcID?: number;
    gpdIEEEAddr?: string;
    gpdEndpoint?: number;
    gpdCmd: number;
    gpdPayload: T;
};

interface GreenPowerEventMap {
    deviceJoined: [payload: GreenPowerDeviceJoinedPayload];
    deviceLeave: [sourceID: number];
}

export class GreenPower extends EventEmitter<GreenPowerEventMap> {
    private adapter: Adapter;

    public constructor(adapter: Adapter) {
        super();
        this.adapter = adapter;
    }

    private encryptSecurityKey(sourceID: number, securityKey: Buffer): Buffer {
        const nonce = Buffer.alloc(13);

        nonce.writeUInt32LE(sourceID, 0);
        nonce.writeUInt32LE(sourceID, 4);
        nonce.writeUInt32LE(sourceID, 8);
        nonce.writeUInt8(0x05, 12);

        const cipher = createCipheriv('aes-128-ccm', Buffer.from(INTEROPERABILITY_LINK_KEY), nonce, {authTagLength: 16});
        const encrypted = cipher.update(securityKey);

        return Buffer.concat([encrypted, cipher.final()]);
    }

    private decryptPayload(sourceID: number, frameCounter: number, securityKey: Buffer, payload: Buffer): Buffer {
        const nonce = Buffer.alloc(13);

        nonce.writeUInt32LE(sourceID, 0);
        nonce.writeUInt32LE(sourceID, 4);
        nonce.writeUInt32LE(frameCounter, 8);
        nonce.writeUInt8(0x05, 12);

        const [, decryptedPayload] = aes128CcmStar(4, securityKey, nonce, payload);

        return decryptedPayload;
    }

    private async sendPairingCommand(
        payload: PairingPayload,
        wasBroadcast: boolean,
        gppNwkAddr: number | undefined,
    ): Promise<AdapterEvents.ZclPayload | void> {
        const appId = payload.options & 0x7;
        // const addSink = Boolean(payload.options & 0x8);
        // const removeGpd = Boolean(payload.options & 0x10);
        const communicationMode = (payload.options >> 5) & 0x3;
        // const gpdFixed = Boolean(payload.options & 0x80);
        // const gpdMacSeqNumCapabilities = Boolean(payload.options & 0x100);
        // const securityLevel = (payload.options >> 9) & 0x2;
        // const securityKeyType = (payload.options >> 11) & 0x3;
        // const gpdSecurityFrameCounterPresent = Boolean(payload.options & 0x4000);
        // const gpdSecurityKeyPresent = Boolean(payload.options & 0x8000);
        // const assignedAliasPresent = Boolean(payload.options & 0x10000);
        // const groupcastRadiusPresent = Boolean(payload.options & 0x20000);
        // payload.options bits 18..23 reserved
        logger.debug(
            `[PAIRING] options=${payload.options} (appId=${appId} communicationMode=${communicationMode}) wasBroadcast=${wasBroadcast} gppNwkAddr=${gppNwkAddr}`,
            NS,
        );

        // Set sink address based on communication mode
        switch (communicationMode) {
            // Groupcast forwarding to pre-commissioned GroupID
            // Groupcast forwarding to DGroupID
            case 0b10:
            case 0b01: {
                payload.sinkGroupID = GP_GROUP_ID;
                break;
            }
            // Full unicast forwarding
            // Lightweight unicast forwarding
            /* v8 ignore next */
            case 0b00:
            case 0b11: {
                payload.sinkIEEEAddr = await this.adapter.getCoordinatorIEEE();
                payload.sinkNwkAddr = COORDINATOR_ADDRESS;
                break;
            }
        }

        const replyFrame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            ZclTransactionSequenceNumber.next(),
            'pairing',
            Zcl.Clusters.greenPower.ID,
            payload,
            {},
        );

        // Not sure how correct this is - according to GP spec Pairing command is
        // to be sent as broadcast unless communication mode is 0b11 - in which case
        // the proxy MAY send it as unicast to selected proxy.
        // This attempts to mirror logic from commit 92f77cc5.
        if (wasBroadcast) {
            return await this.adapter.sendZclFrameToAll(GP_ENDPOINT, replyFrame, GP_ENDPOINT, BroadcastAddress.RX_ON_WHEN_IDLE);
        } else {
            const device = Device.byNetworkAddress(gppNwkAddr ?? /* v8 ignore next */ COORDINATOR_ADDRESS);
            assert(device, 'Failed to find green power proxy device');

            return await this.adapter.sendZclFrameToEndpoint(
                device.ieeeAddr,
                device.networkAddress,
                GP_ENDPOINT,
                replyFrame,
                10000,
                false,
                false,
                GP_ENDPOINT,
            );
        }
    }

    public async onZclGreenPowerData(dataPayload: AdapterEvents.ZclPayload, frame: Zcl.Frame, securityKey?: Buffer): Promise<Zcl.Frame> {
        try {
            const fullEncr = ((frame.payload.options >> 6) & 0x3) === 0x3;

            if (fullEncr) {
                if (!securityKey) {
                    logger.error(
                        `[FULLENCR] from=${dataPayload.address} commandIdentifier=${frame.header.commandIdentifier} Unknown security key`,
                        NS,
                    );
                    return frame;
                }

                if (frame.header.commandIdentifier === Zcl.Clusters.greenPower.commands.notification.ID) {
                    /* v8 ignore start */
                    if (frame.payload.srcID === undefined) {
                        // ApplicationID = 0b010 indicates the GPD ID field has the length of 8B and contains the GPD IEEE address; the Endpoint field is present.
                        // Note: no device are currently known to use this (too expensive)
                        logger.error(`[FULLENCR] from=${dataPayload.address} GPD ID containing IEEE address is not supported`, NS);
                        return frame;
                    }
                    /* v8 ignore stop */

                    const hashedKey = this.encryptSecurityKey(frame.payload.srcID, securityKey);
                    const oldHeader = dataPayload.data.subarray(0, 15);
                    // 4 bytes appended for MIC placeholder (just needs the bytes present for decrypt)
                    const payload = Buffer.from([frame.payload.commandID, ...dataPayload.data.subarray(15), 0, 0, 0, 0]);
                    // if the device has a registered security key, we assume it uses encrypted payloads
                    const decrypted = this.decryptPayload(frame.payload.srcID, frame.payload.frameCounter, hashedKey, payload);

                    const newHeader = Buffer.alloc(15);
                    newHeader.set(oldHeader, 0);
                    newHeader.writeUInt8(decrypted[0], oldHeader.byteLength - 2); // commandID
                    newHeader.writeUInt8(decrypted.byteLength - 1, oldHeader.byteLength - 1); // payloadSize

                    // re-parse with decrypted data
                    frame = Zcl.Frame.fromBuffer(dataPayload.clusterID, dataPayload.header, Buffer.concat([newHeader, decrypted.subarray(1)]), {});
                    /* v8 ignore start */
                } else {
                    logger.error(`[FULLENCR] from=${dataPayload.address} commandIdentifier=${frame.header.commandIdentifier} Not supported`, NS);
                    return frame;
                }
                /* v8 ignore stop */
            }

            const commandID = frame.payload.commandID ?? frame.header.commandIdentifier;

            switch (commandID) {
                case 0xe0: {
                    // GP Commissioning
                    logger.info(`[COMMISSIONING] from=${dataPayload.address}`, NS);

                    /* v8 ignore start */
                    if (frame.payload.srcID === undefined) {
                        // ApplicationID = 0b010 indicates the GPD ID field has the length of 8B and contains the GPD IEEE address; the Endpoint field is present.
                        // Note: no device are currently known to use this (too expensive)
                        logger.error(`[COMMISSIONING] from=${dataPayload.address} GPD ID containing IEEE address is not supported`, NS);
                        break;
                    }
                    /* v8 ignore stop */

                    /* v8 ignore start */
                    if (frame.payload.gppGpdLink !== undefined) {
                        const rssi = frame.payload.gppGpdLink & 0x3f;
                        const linkQuality = (frame.payload.gppGpdLink >> 6) & 0x3;
                        let linkQualityStr;

                        switch (linkQuality) {
                            case 0b00:
                                linkQualityStr = 'Poor';
                                break;
                            case 0b01:
                                linkQualityStr = 'Moderate';
                                break;
                            case 0b10:
                                linkQualityStr = 'High';
                                break;
                            case 0b11:
                                linkQualityStr = 'Excellent';
                                break;
                        }

                        logger.info(`[COMMISSIONING] from=${dataPayload.address} rssi=${rssi} linkQuality=${linkQualityStr}`, NS);
                    }
                    /* v8 ignore stop */

                    /* v8 ignore start */
                    if (frame.payload.options & 0x200) {
                        logger.warning(`[COMMISSIONING] from=${dataPayload.address} Security processing marked as failed`, NS);
                    }
                    /* v8 ignore stop */

                    const rxOnCap = frame.payload.commandFrame.options & 0x2;

                    if (rxOnCap) {
                        // RX capable GPD needs GP Commissioning Reply
                        logger.debug(
                            `[COMMISSIONING] from=${dataPayload.address} GPD has receiving capabilities in operational mode (RxOnCapability)`,
                            NS,
                        );
                        // NOTE: currently encryption is disabled for RX capable GPDs

                        const networkParameters = await this.adapter.getNetworkParameters();
                        // Commissioning reply
                        const payloadResponse: ResponsePayload<GPDCommissioningReply> = {
                            options: 0,
                            tempMaster: frame.payload.gppNwkAddr ?? /* v8 ignore next */ COORDINATOR_ADDRESS,
                            tempMasterTx: networkParameters.channel - 11,
                            srcID: frame.payload.srcID,
                            gpdCmd: 0xf0,
                            gpdPayload: {
                                commandID: 0xf0,
                                options: 0b00000000, // Disable encryption
                                // panID: number,
                                // securityKey: frame.payload.commandFrame.securityKey,
                                // keyMic: frame.payload.commandFrame.keyMic,
                                // frameCounter: number,
                            },
                        };

                        const replyFrame = Zcl.Frame.create(
                            Zcl.FrameType.SPECIFIC,
                            Zcl.Direction.SERVER_TO_CLIENT,
                            true,
                            undefined,
                            ZclTransactionSequenceNumber.next(),
                            'response',
                            Zcl.Clusters.greenPower.ID,
                            payloadResponse,
                            {},
                        );

                        await this.adapter.sendZclFrameToAll(GP_ENDPOINT, replyFrame, GP_ENDPOINT, BroadcastAddress.RX_ON_WHEN_IDLE);

                        await this.sendPairingCommand(
                            {
                                options: 0b000000000110101000, // Disable encryption
                                srcID: frame.payload.srcID,
                                deviceID: frame.payload.commandFrame.deviceID,
                            },
                            dataPayload.wasBroadcast,
                            frame.payload.gppNwkAddr,
                        );
                    } else {
                        const gpdKey = this.encryptSecurityKey(frame.payload.srcID, frame.payload.commandFrame.securityKey);

                        await this.sendPairingCommand(
                            {
                                // Communication mode:
                                //  Broadcast: Groupcast to precommissioned ID (0b10)
                                // !Broadcast: Lightweight unicast (0b11)
                                options: dataPayload.wasBroadcast ? 0b001110010101001000 : 0b001110010101101000,
                                srcID: frame.payload.srcID,
                                deviceID: frame.payload.commandFrame.deviceID,
                                frameCounter: frame.payload.commandFrame.outgoingCounter,
                                gpdKey,
                            },
                            dataPayload.wasBroadcast,
                            frame.payload.gppNwkAddr,
                        );
                    }

                    this.emit('deviceJoined', {
                        sourceID: frame.payload.srcID,
                        deviceID: frame.payload.commandFrame.deviceID,
                        networkAddress: frame.payload.srcID & 0xffff,
                        securityKey: frame.payload.commandFrame.securityKey,
                    });

                    break;
                }
                /* v8 ignore start */
                case 0xe1:
                    // GP Success
                    logger.debug(`[DECOMMISSIONING] from=${dataPayload.address}`, NS);

                    this.emit('deviceLeave', frame.payload.srcID);
                    break;
                case 0xe2:
                    // GP Success
                    logger.debug(`[SUCCESS] from=${dataPayload.address}`, NS);
                    break;
                /* v8 ignore stop */
                case 0xe3: {
                    // GP Channel Request
                    logger.debug(`[CHANNEL_REQUEST] from=${dataPayload.address}`, NS);
                    const networkParameters = await this.adapter.getNetworkParameters();
                    // Channel notification
                    const payload: ResponsePayload<GPDChannelConfiguration> = {
                        options: 0,
                        tempMaster: frame.payload.gppNwkAddr ?? /* v8 ignore next */ COORDINATOR_ADDRESS,
                        tempMasterTx: frame.payload.commandFrame.nextChannel,
                        srcID: frame.payload.srcID,
                        gpdCmd: 0xf3,
                        gpdPayload: {
                            commandID: 0xf3,
                            operationalChannel: networkParameters.channel - 11,
                            /** This bit SHALL be set to 0b1 in GPD Channel Configuration commands sent by Basic Combo product. */
                            basic: true,
                        },
                    };

                    const replyFrame = Zcl.Frame.create(
                        Zcl.FrameType.SPECIFIC,
                        Zcl.Direction.SERVER_TO_CLIENT,
                        true,
                        undefined,
                        ZclTransactionSequenceNumber.next(),
                        'response',
                        Zcl.Clusters.greenPower.ID,
                        payload,
                        {},
                    );

                    await this.adapter.sendZclFrameToAll(GP_ENDPOINT, replyFrame, GP_ENDPOINT, BroadcastAddress.RX_ON_WHEN_IDLE);
                    break;
                }
                /* v8 ignore start */
                case 0xe4:
                    // GP Success
                    logger.debug(`[APP_DESCRIPTION] from=${dataPayload.address}`, NS);
                    break;
                case 0xa1:
                    // GP Manufacturer-specific Attribute Reporting
                    break;
                /* v8 ignore stop */
                default:
                    // NOTE: this is spammy because it logs everything that is handed back to Controller without special processing here
                    logger.debug(`[UNHANDLED_CMD/PASSTHROUGH] command=0x${commandID.toString(16)} from=${dataPayload.address}`, NS);
            }
            /* v8 ignore start */
        } catch (error) {
            logger.error((error as Error).stack!, NS);
            return frame;
        }
        /* v8 ignore stop */

        return frame;
    }

    public async permitJoin(time: number, networkAddress?: number): Promise<void> {
        const payload = {
            options: time ? (networkAddress === undefined ? 0x0b : 0x2b) : 0x0a,
            commisioningWindow: time,
        };

        const frame = Zcl.Frame.create(
            Zcl.FrameType.SPECIFIC,
            Zcl.Direction.SERVER_TO_CLIENT,
            true,
            undefined,
            ZclTransactionSequenceNumber.next(),
            'commisioningMode',
            Zcl.Clusters.greenPower.ID,
            payload,
            {},
        );

        if (networkAddress === undefined) {
            await this.adapter.sendZclFrameToAll(GP_ENDPOINT, frame, GP_ENDPOINT, BroadcastAddress.RX_ON_WHEN_IDLE);
        } else {
            const device = Device.byNetworkAddress(networkAddress);
            assert(device, 'Failed to find device to permit GP join on');

            await this.adapter.sendZclFrameToEndpoint(device.ieeeAddr, networkAddress, GP_ENDPOINT, frame, 10000, false, false, GP_ENDPOINT);
        }
    }
}

export default GreenPower;
