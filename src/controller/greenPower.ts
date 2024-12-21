import assert from 'node:assert';
import crypto from 'node:crypto';
import events from 'node:events';

import {Adapter, Events as AdapterEvents} from '../adapter';
import {logger} from '../utils/logger';
import {COORDINATOR_ADDRESS, GP_ENDPOINT, GP_GROUP_ID} from '../zspec/consts';
import {BroadcastAddress} from '../zspec/enums';
import * as Zcl from '../zspec/zcl';
import ZclTransactionSequenceNumber from './helpers/zclTransactionSequenceNumber';
import {Device} from './model';
import {GreenPowerDeviceJoinedPayload} from './tstype';

const NS = 'zh:controller:greenpower';

const zigBeeLinkKey = Buffer.from([0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39]);

interface GreenPowerEventMap {
    deviceJoined: [payload: GreenPowerDeviceJoinedPayload];
}

export class GreenPower extends events.EventEmitter<GreenPowerEventMap> {
    private adapter: Adapter;

    public constructor(adapter: Adapter) {
        super();
        this.adapter = adapter;
    }

    private encryptSecurityKey(sourceID: number, securityKey: Buffer): Buffer {
        const sourceIDInBytes = Buffer.from([
            sourceID & 0x000000ff,
            (sourceID & 0x0000ff00) >> 8,
            (sourceID & 0x00ff0000) >> 16,
            (sourceID & 0xff000000) >> 24,
        ]);

        const nonce = Buffer.alloc(13);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                nonce[4 * i + j] = sourceIDInBytes[j];
            }
        }
        nonce[12] = 0x05;

        const cipher = crypto.createCipheriv('aes-128-ccm', zigBeeLinkKey, nonce, {authTagLength: 16});
        const encrypted = cipher.update(securityKey);
        return Buffer.concat([encrypted, cipher.final()]);
    }

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    private async sendPairingCommand(payload: any, dataPayload: AdapterEvents.ZclPayload, frame: Zcl.Frame): Promise<any> {
        logger.debug(`Payload.Options: ${payload.options} wasBroadcast: ${dataPayload.wasBroadcast}`, NS);

        // Set sink address based on communication mode
        switch ((payload.options >> 5) & 3) {
            case 0b10: // Groupcast to pre-commissioned GroupID
            case 0b01: // Groupcast to DGroupID
                payload.sinkGroupID = GP_GROUP_ID;
                break;
            /* v8 ignore next */
            case 0b00: // Full unicast forwarding
            case 0b11: {
                // Lightweight unicast forwarding
                const coordinatorIEEE = await this.adapter.getCoordinatorIEEE();
                payload.sinkIEEEAddr = coordinatorIEEE;
                payload.sinkNwkAddr = COORDINATOR_ADDRESS;
                break;
            }
            /* v8 ignore start */
            default:
                logger.error(`Unhandled applicationID: ${payload.options & 7}`, NS);
                return;
            /* v8 ignore stop */
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
        if (dataPayload.wasBroadcast) {
            return await this.adapter.sendZclFrameToAll(GP_ENDPOINT, replyFrame, GP_ENDPOINT, BroadcastAddress.RX_ON_WHEN_IDLE);
        } else {
            const device = Device.byNetworkAddress(frame.payload.gppNwkAddr);
            assert(device, 'Failed to find green power proxy device');
            return await this.adapter.sendZclFrameToEndpoint(
                device.ieeeAddr,
                frame.payload.gppNwkAddr,
                GP_ENDPOINT,
                replyFrame,
                10000,
                false,
                false,
                GP_ENDPOINT,
            );
        }
    }

    public async onZclGreenPowerData(dataPayload: AdapterEvents.ZclPayload, frame: Zcl.Frame): Promise<void> {
        try {
            const commandID = frame.payload.commandID ?? frame.header.commandIdentifier;
            switch (commandID) {
                /* v8 ignore start */
                case undefined:
                    logger.error(`Received undefined command from '${dataPayload.address}'`, NS);
                    break;
                /* v8 ignore stop */
                case 0xe0: {
                    // GP Commissioning
                    logger.info(`Received commissioning from '${dataPayload.address}'`, NS);

                    /* v8 ignore start */
                    if (typeof dataPayload.address !== 'number') {
                        logger.error(`Commissioning request with string type address unsupported for '${dataPayload.address}'`, NS);
                        break;
                    }
                    /* v8 ignore stop */

                    const rxOnCap = frame.payload.commandFrame.options & 0b10;

                    const key = this.encryptSecurityKey(frame.payload.srcID, frame.payload.commandFrame.securityKey);

                    // RX capable GPD needs GP Commissioning Reply
                    if (rxOnCap) {
                        logger.debug('RxOnCap set -> supports bidirectional communication', NS);
                        // NOTE: currently encryption is disabled for RX capable GPDs

                        const networkParameters = await this.adapter.getNetworkParameters();
                        // Commissioning reply
                        const payloadReply = {
                            options: 0,
                            tempMaster: frame.payload.gppNwkAddr,
                            tempMasterTx: networkParameters.channel - 11,
                            srcID: frame.payload.srcID,
                            gpdCmd: 0xf0,
                            gpdPayload: {
                                commandID: 0xf0,
                                options: 0b00000000, // Disable encryption
                                // securityKey: [...frame.payload.commandFrame.securityKey],
                                // keyMic: frame.payload.commandFrame.keyMic,
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
                            payloadReply,
                            {},
                        );
                        await this.adapter.sendZclFrameToAll(GP_ENDPOINT, replyFrame, GP_ENDPOINT, BroadcastAddress.RX_ON_WHEN_IDLE);

                        const payloadPairing = {
                            options: 0b0000000110101000, // Disable encryption
                            srcID: frame.payload.srcID,
                            deviceID: frame.payload.commandFrame.deviceID,
                        };

                        await this.sendPairingCommand(payloadPairing, dataPayload, frame);
                    } else {
                        // Communication mode:
                        //  Broadcast: Groupcast to precommissioned ID (0b10)
                        // !Broadcast: Lightweight unicast (0b11)
                        let opt = 0b1110010101101000;
                        if (dataPayload.wasBroadcast) {
                            opt = 0b1110010101001000;
                        }

                        const payload = {
                            options: opt,
                            srcID: frame.payload.srcID,
                            deviceID: frame.payload.commandFrame.deviceID,
                            frameCounter: frame.payload.commandFrame.outgoingCounter,

                            gpdKey: [...key],
                        };

                        await this.sendPairingCommand(payload, dataPayload, frame);
                    }

                    this.emit('deviceJoined', {
                        sourceID: frame.payload.srcID,
                        deviceID: frame.payload.commandFrame.deviceID,
                        networkAddress: frame.payload.srcID & 0xffff,
                    });

                    break;
                }
                /* v8 ignore start */
                case 0xe2: // GP Success
                    logger.debug(`Received success from '${dataPayload.address}'`, NS);
                    break;
                /* v8 ignore stop */
                case 0xe3: {
                    // GP Channel Request
                    logger.debug(`Received channel request from '${dataPayload.address}'`, NS);
                    const networkParameters = await this.adapter.getNetworkParameters();
                    // Channel notification
                    const payload = {
                        options: 0,
                        tempMaster: frame.payload.gppNwkAddr,
                        tempMasterTx: frame.payload.commandFrame.nextChannel,
                        srcID: frame.payload.srcID,
                        gpdCmd: 0xf3,

                        gpdPayload: {
                            commandID: 0xf3,
                            options: networkParameters.channel - 11,
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
                case 0xa1: // GP Manufacturer-specific Attribute Reporting
                    break;
                /* v8 ignore stop */
                default:
                    // NOTE: this is spammy because it logs everything that is handed back to Controller without special processing here
                    logger.debug(`Received unhandled command '0x${commandID.toString(16)}' from '${dataPayload.address}'`, NS);
            }
            /* v8 ignore start */
        } catch (error) {
            logger.error((error as Error).stack!, NS);
        }
        /* v8 ignore stop */
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
