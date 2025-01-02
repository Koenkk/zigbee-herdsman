/* v8 ignore start */

import EventEmitter from 'node:events';

import {Queue} from '../../../utils';
import {logger} from '../../../utils/logger';
import * as ZSpec from '../../../zspec';
import {EUI64, ExtendedPanId, NodeId, PanId} from '../../../zspec/tstypes';
import * as Zcl from '../../../zspec/zcl';
import {Clusters} from '../../../zspec/zcl/definition/cluster';
import * as Zdo from '../../../zspec/zdo';
import {SerialPortOptions} from '../../tstype';
import {FIXED_ENDPOINTS} from '../adapter/endpoints';
import {
    INTERPAN_APS_FRAME_CONTROL_NO_DELIVERY_MODE,
    INTERPAN_APS_FRAME_DELIVERY_MODE_MASK,
    INTERPAN_APS_FRAME_SECURITY,
    INTERPAN_APS_MULTICAST_SIZE,
    INTERPAN_APS_UNICAST_BROADCAST_SIZE,
    LONG_DEST_FRAME_CONTROL,
    MAC_ACK_REQUIRED,
    MIN_STUB_APS_SIZE,
    SHORT_DEST_FRAME_CONTROL,
    STUB_NWK_FRAME_CONTROL,
    STUB_NWK_SIZE,
} from '../consts';
import {
    EmberApsOption,
    EmberCounterType,
    EmberDeviceUpdate,
    EmberDutyCycleState,
    EmberEntropySource,
    EmberEventUnits,
    EmberExtendedSecurityBitmask,
    EmberGpApplicationId,
    EmberGpKeyType,
    EmberGpSecurityLevel,
    EmberGPStatus,
    EmberIncomingMessageType,
    EmberInterpanMessageType,
    EmberJoinDecision,
    EmberKeyStatus,
    EmberLeaveNetworkOption,
    EmberLibraryId,
    EmberLibraryStatus,
    EmberMacPassthroughType,
    EmberMultiPhyNwkConfig,
    EmberNetworkStatus,
    EmberNodeType,
    EmberOutgoingMessageType,
    EmberSourceRouteDiscoveryMode,
    EmberStackError,
    EmberTransmitPriority,
    EmberTXPowerMode,
    EzspNetworkScanType,
    EzspStatus,
    EzspZllNetworkOperation,
    IEEE802154CcaMode,
    SecManFlag,
    SecManKeyType,
    SLStatus,
} from '../enums';
import {EzspError} from '../ezspError';
import {
    Ember802154RadioPriorities,
    EmberAesMmoHashContext,
    EmberApsFrame,
    EmberBeaconClassificationParams,
    EmberBeaconData,
    EmberBindingTableEntry,
    EmberCertificate283k1Data,
    EmberCertificateData,
    EmberChildData,
    EmberCurrentSecurityState,
    EmberDutyCycleLimits,
    EmberEndpointDescription,
    EmberGpAddress,
    EmberGpProxyTableEntry,
    EmberGpSinkTableEntry,
    EmberInitialSecurityState,
    EmberKeyData,
    EmberMessageDigest,
    EmberMulticastTableEntry,
    EmberMultiPhyRadioParameters,
    EmberMultiprotocolPriorities,
    EmberNeighborTableEntry,
    EmberNetworkInitStruct,
    EmberNetworkParameters,
    EmberPerDeviceDutyCycle,
    EmberPrivateKeyData,
    EmberPublicKey283k1Data,
    EmberPublicKeyData,
    EmberRouteTableEntry,
    EmberRxPacketInfo,
    EmberSignature283k1Data,
    EmberSignatureData,
    EmberSmacData,
    EmberTokenData,
    EmberTokenInfo,
    EmberTokTypeStackZllData,
    EmberTokTypeStackZllSecurity,
    EmberVersion,
    EmberZigbeeNetwork,
    EmberZllAddressAssignment,
    EmberZllDeviceInfoRecord,
    EmberZllInitialSecurityState,
    EmberZllNetwork,
    SecManAPSKeyMetadata,
    SecManContext,
    SecManKey,
    SecManNetworkKeyInfo,
} from '../types';
import {UartAsh} from '../uart/ash';
import {initSecurityManagerContext} from '../utils/initters';
import {highByte, highLowToInt, lowByte} from '../utils/math';
import {EzspBuffalo} from './buffalo';
import {
    EMBER_ENCRYPTION_KEY_SIZE,
    EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX,
    EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
    EZSP_EXTENDED_FRAME_FORMAT_VERSION,
    EZSP_EXTENDED_FRAME_ID_HB_INDEX,
    EZSP_EXTENDED_FRAME_ID_LB_INDEX,
    EZSP_EXTENDED_PARAMETERS_INDEX,
    EZSP_FRAME_CONTROL_ASYNCH_CB,
    EZSP_FRAME_CONTROL_COMMAND,
    EZSP_FRAME_CONTROL_DIRECTION_MASK,
    EZSP_FRAME_CONTROL_INDEX,
    EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK,
    EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET,
    EZSP_FRAME_CONTROL_OVERFLOW,
    EZSP_FRAME_CONTROL_OVERFLOW_MASK,
    EZSP_FRAME_CONTROL_PENDING_CB,
    EZSP_FRAME_CONTROL_PENDING_CB_MASK,
    EZSP_FRAME_CONTROL_RESPONSE,
    EZSP_FRAME_CONTROL_SLEEP_MODE_MASK,
    EZSP_FRAME_CONTROL_TRUNCATED,
    EZSP_FRAME_CONTROL_TRUNCATED_MASK,
    EZSP_FRAME_ID_INDEX,
    EZSP_MAX_FRAME_LENGTH,
    EZSP_PARAMETERS_INDEX,
    EZSP_SEQUENCE_INDEX,
} from './consts';
import {
    EmberLeaveReason,
    EmberRejoinReason,
    EzspConfigId,
    EzspEndpointFlag,
    EzspExtendedValueId,
    EzspFrameID,
    EzspMfgTokenId,
    EzspPolicyId,
    EzspSleepMode,
    EzspValueId,
} from './enums';

const NS = 'zh:ember:ezsp';

/**
 * Simple object to resolve/timeout on command waiting for response.
 */
type EzspWaiter = {
    timer: NodeJS.Timeout;
    resolve: (value: EzspStatus | PromiseLike<EzspStatus>) => void;
};

/** no multi-network atm, so just use const */
const DEFAULT_NETWORK_INDEX = FIXED_ENDPOINTS[0].networkIndex;
/** other values not supported atm */
const DEFAULT_SLEEP_MODE = EzspSleepMode.IDLE;
/** Maximum number of times we attempt to reset the NCP and start the ASH protocol. */
const MAX_INIT_ATTEMPTS = 5;
/**
 * This is the max hops that the network can support - used to determine the max source route overhead
 * and broadcast radius if we havent defined MAX_HOPS then define based on profile ID
 */
// #ifdef HAS_SECURITY_PROFILE_SE
// export const ZA_MAX_HOPS = 6;
// #else
const ZA_MAX_HOPS = 12;
// #endif
/**
 * The mask applied to generated message tags used by the framework when sending messages via EZSP.
 * Customers who call ezspSend functions directly must use message tags outside this mask.
 */
const MESSAGE_TAG_MASK = 0x7f;

export interface EmberEzspEventMap {
    /** An error was detected that requires resetting the NCP. */
    ncpNeedsResetAndInit: [status: EzspStatus];
    /** @see Ezsp.ezspIncomingMessageHandler */
    zdoResponse: [apsFrame: EmberApsFrame, sender: NodeId, messageContents: Buffer];
    /** ezspIncomingMessageHandler */
    incomingMessage: [type: EmberIncomingMessageType, apsFrame: EmberApsFrame, lastHopLqi: number, sender: NodeId, messageContents: Buffer];
    /** @see Ezsp.ezspMacFilterMatchMessageHandler */
    touchlinkMessage: [sourcePanId: PanId, sourceAddress: EUI64, groupId: number, lastHopLqi: number, messageContents: Buffer];
    /** @see Ezsp.ezspStackStatusHandler */
    stackStatus: [status: SLStatus];
    /** @see Ezsp.ezspTrustCenterJoinHandler */
    trustCenterJoin: [
        newNodeId: NodeId,
        newNodeEui64: EUI64,
        status: EmberDeviceUpdate,
        policyDecision: EmberJoinDecision,
        parentOfNewNodeId: NodeId,
    ];
    /** @see Ezsp.ezspMessageSentHandler */
    messageSent: [status: SLStatus, type: EmberOutgoingMessageType, indexOrDestination: number, apsFrame: EmberApsFrame, messageTag: number];
    /** @see Ezsp.ezspGpepIncomingMessageHandler */
    greenpowerMessage: [
        sequenceNumber: number,
        commandIdentifier: number,
        sourceId: number,
        frameCounter: number,
        gpdCommandId: number,
        gpdCommandPayload: Buffer,
        gpdLink: number,
    ];
}

/**
 * Host EZSP layer.
 *
 * Provides functions that allow the Host application to send every EZSP command to the NCP.
 *
 * Commands to send to the serial>ASH layers all are named `ezsp${CommandName}`.
 * They do nothing but build the command, send it and return the value(s).
 * Callers are expected to handle errors appropriately.
 *   - They will throw `EzspStatus` if `sendCommand` fails or the returned value(s) by NCP are invalid (wrong length, etc).
 *   - Most will return `EmberStatus` given by NCP (some `EzspStatus`, some `SLStatus`...).
 */
export class Ezsp extends EventEmitter<EmberEzspEventMap> {
    private version: number;
    public readonly ash: UartAsh;
    private readonly buffalo: EzspBuffalo;
    /** The contents of the current EZSP frame. CAREFUL using this guy, it's pre-allocated. */
    private readonly frameContents: Buffer;
    /** The total Length of the incoming frame */
    private frameLength: number;
    private readonly callbackBuffalo: EzspBuffalo;
    /** The contents of the current EZSP frame. CAREFUL using this guy, it's pre-allocated. */
    private readonly callbackFrameContents: Buffer;
    /** The total Length of the incoming frame */
    private callbackFrameLength: number;

    private initialVersionSent: boolean;
    /** EZSP frame sequence number. Used in EZSP_SEQUENCE_INDEX byte. */
    private frameSequence: number;
    /** Sequence used for EZSP send() tagging. static uint8_t */
    private sendSequence: number;
    private readonly queue: Queue;
    /** Awaiting response resolve/timer struct. undefined if not waiting for response. */
    private responseWaiter?: EzspWaiter;

    /** Counter for Queue Full errors */
    public counterErrQueueFull: number;

    constructor(options: SerialPortOptions) {
        super();

        this.frameContents = Buffer.alloc(EZSP_MAX_FRAME_LENGTH);
        this.buffalo = new EzspBuffalo(this.frameContents, 0);
        this.callbackFrameContents = Buffer.alloc(EZSP_MAX_FRAME_LENGTH);
        this.callbackBuffalo = new EzspBuffalo(this.callbackFrameContents, 0);

        this.queue = new Queue(1);
        this.ash = new UartAsh(options);

        this.version = 0;
        this.frameLength = 0;
        this.callbackFrameLength = 0;
        this.initialVersionSent = false;
        this.frameSequence = -1; // start at 0
        this.sendSequence = 0; // start at 1
        this.counterErrQueueFull = 0;
    }

    /**
     * Returns the number of EZSP responses that have been received by the serial
     * protocol and are ready to be collected by the EZSP layer via
     * responseReceived().
     */
    get pendingResponseCount(): number {
        return this.ash.rxQueue.length;
    }

    /**
     * Create a string representation of the last received frame in storage.
     */
    get frameToString(): string {
        const id = this.buffalo.getFrameId();
        return `[FRAME: ID=${id}:"${EzspFrameID[id]}" Seq=${this.frameContents[EZSP_SEQUENCE_INDEX]} Len=${this.frameLength}]`;
    }

    /**
     * Create a string representation of the last received callback frame in storage.
     */
    get callbackFrameToString(): string {
        const id = this.callbackBuffalo.getFrameId();
        return `[CBFRAME: ID=${id}:"${EzspFrameID[id]}" Seq=${this.callbackFrameContents[EZSP_SEQUENCE_INDEX]} Len=${this.callbackFrameLength}]`;
    }

    public async start(): Promise<EzspStatus> {
        logger.info(`======== EZSP starting ========`, NS);

        let status: EzspStatus = EzspStatus.HOST_FATAL_ERROR;

        for (let i = 0; i < MAX_INIT_ATTEMPTS; i++) {
            status = await this.ash.resetNcp();

            // fail early if we couldn't even get the port set up
            if (status !== EzspStatus.SUCCESS) {
                return status;
            }

            status = await this.ash.start();

            if (status === EzspStatus.SUCCESS) {
                logger.info(`======== EZSP started ========`, NS);
                // registered after reset sequence
                this.ash.on('frame', this.onAshFrame.bind(this));
                this.ash.on('fatalError', this.onAshFatalError.bind(this));

                return status;
            }
        }

        return status;
    }

    /**
     * Cleanly close down the serial protocol (UART).
     * After this function has been called, init() must be called to resume communication with the NCP.
     */
    public async stop(): Promise<void> {
        await this.ash.stop();
        this.ash.removeAllListeners();

        logger.info(`======== EZSP stopped ========`, NS);
    }

    /**
     * Must be called immediately after `ezspVersion` to sync the Host protocol version.
     * @param version Version for the Host to use.
     */
    public setProtocolVersion(version: number): void {
        this.version = version;
    }

    /**
     * Check if connected.
     * If not, attempt to restore the connection.
     *
     * @returns
     */
    public checkConnection(): boolean {
        return this.ash.connected;
    }

    /**
     * Triggered by @see 'FATAL_ERROR'
     */
    private onAshFatalError(status: EzspStatus): void {
        this.emit('ncpNeedsResetAndInit', status);
    }

    /**
     * Triggered by @see 'FRAME'
     */
    private onAshFrame(): void {
        const buffer = this.ash.rxQueue.getPrecedingEntry();

        if (buffer == null) {
            // something is seriously wrong
            logger.error(`Found no buffer in queue but ASH layer sent signal that one was available.`, NS);
            return;
        }

        this.ash.rxQueue.removeEntry(buffer);

        // logger.debug(`<<<< ${buffer.data.subarray(0, buffer.len).toString('hex')}`, NS);

        if (buffer.data[EZSP_FRAME_CONTROL_INDEX] & EZSP_FRAME_CONTROL_ASYNCH_CB) {
            // take only what len tells us is actual content
            buffer.data.copy(this.callbackFrameContents, 0, 0, buffer.len);

            this.callbackFrameLength = buffer.len;

            logger.debug(`<=== ${this.callbackFrameToString}`, NS);

            this.ash.rxFree.freeBuffer(buffer);

            const status = this.validateReceivedFrame(this.callbackBuffalo);

            if (status === EzspStatus.SUCCESS) {
                this.callbackDispatch();
            } else {
                logger.debug(`<=x= ${this.callbackFrameToString} Invalid, status=${EzspStatus[status]}.`, NS);
            }
        } else {
            // take only what len tells us is actual content
            buffer.data.copy(this.frameContents, 0, 0, buffer.len);

            this.frameLength = buffer.len;

            logger.debug(`<=== ${this.frameToString}`, NS);

            this.ash.rxFree.freeBuffer(buffer); // always

            if (this.responseWaiter !== undefined) {
                const status = this.validateReceivedFrame(this.buffalo);

                clearTimeout(this.responseWaiter.timer);
                this.responseWaiter.resolve(status);

                this.responseWaiter = undefined; // done, gc
            } else {
                logger.debug(`Received response while not expecting one. Ignoring.`, NS);
            }
        }
    }

    /**
     * Event from the EZSP layer indicating that the transaction with the NCP could not be completed due to a
     * serial protocol error or that the response received from the NCP reported an error.
     * The status parameter provides more information about the error.
     *
     * @param status
     */
    public ezspErrorHandler(status: EzspStatus): void {
        const lastFrameStr = `Last Frame: ${this.frameToString}.`;

        if (status === EzspStatus.ERROR_QUEUE_FULL) {
            this.counterErrQueueFull += 1;

            logger.error(`Adapter queue full (counter: ${this.counterErrQueueFull}). ${lastFrameStr}`, NS);
        } else if (status === EzspStatus.ERROR_OVERFLOW) {
            logger.error(
                `The adapter has run out of buffers, causing general malfunction. Remediate network congestion, if present. ${lastFrameStr}`,
                NS,
            );
        } else {
            logger.error(`ERROR Transaction failure; status=${EzspStatus[status]}. ${lastFrameStr}`, NS);
        }

        // Do not reset if improper frame control direction flag (XXX: certain devices appear to trigger this somehow, without reason?)
        // Do not reset if this is a decryption failure, as we ignored the packet
        // Do not reset for a callback overflow or error queue, as we don't want the device to reboot under stress;
        // resetting under these conditions does not solve the problem as the problem is external to the NCP.
        // Throttling the additional traffic and staggering things might make it better instead.
        // For all other errors, we reset the NCP
        if (
            status !== EzspStatus.ERROR_SECURITY_PARAMETERS_INVALID &&
            status !== EzspStatus.ERROR_OVERFLOW &&
            status !== EzspStatus.ERROR_QUEUE_FULL &&
            status !== EzspStatus.ERROR_WRONG_DIRECTION
        ) {
            this.emit('ncpNeedsResetAndInit', status);
        }
    }

    private nextFrameSequence(): number {
        return (this.frameSequence = ++this.frameSequence & 0xff);
    }

    private startCommand(command: number): EzspBuffalo {
        const sendBuffalo = new EzspBuffalo(Buffer.alloc(EZSP_MAX_FRAME_LENGTH));

        // Send initial EZSP_VERSION command with old packet format for old Hosts/NCPs
        if (command === EzspFrameID.VERSION && !this.initialVersionSent) {
            sendBuffalo.setPosition(EZSP_PARAMETERS_INDEX);

            sendBuffalo.setCommandByte(EZSP_FRAME_ID_INDEX, lowByte(command));
        } else {
            // convert to extended frame format
            sendBuffalo.setPosition(EZSP_EXTENDED_PARAMETERS_INDEX);

            sendBuffalo.setCommandByte(EZSP_EXTENDED_FRAME_ID_LB_INDEX, lowByte(command));
            sendBuffalo.setCommandByte(EZSP_EXTENDED_FRAME_ID_HB_INDEX, highByte(command));
        }

        return sendBuffalo;
    }

    /**
     * Sends the current EZSP command frame. Returns EZSP_SUCCESS if the command was sent successfully.
     * Any other return value means that an error has been detected by the serial protocol layer.
     *
     * if ezsp.sendCommand fails early, this will be:
     *   - EzspStatus.ERROR_INVALID_CALL
     *   - EzspStatus.NOT_CONNECTED
     *   - EzspStatus.ERROR_COMMAND_TOO_LONG
     *
     * if ezsp.sendCommand fails, this will be whatever ash.send returns:
     *   - EzspStatus.SUCCESS
     *   - EzspStatus.NO_TX_SPACE
     *   - EzspStatus.DATA_FRAME_TOO_SHORT
     *   - EzspStatus.DATA_FRAME_TOO_LONG
     *   - EzspStatus.NOT_CONNECTED
     *
     * if ezsp.sendCommand times out, this will be EzspStatus.ASH_ERROR_TIMEOUTS
     *
     * if ezsp.sendCommand resolves, this will be whatever ezsp.responseReceived returns:
     *   - EzspStatus.NO_RX_DATA (should not happen if command was sent (since we subscribe to frame event to trigger function))
     *   - status from EzspFrameID.INVALID_COMMAND status byte
     *   - EzspStatus.ERROR_UNSUPPORTED_CONTROL
     *   - EzspStatus.ERROR_WRONG_DIRECTION
     *   - EzspStatus.ERROR_TRUNCATED
     *   - EzspStatus.SUCCESS
     */
    private async sendCommand(sendBuffalo: EzspBuffalo): Promise<EzspStatus> {
        if (!this.checkConnection()) {
            logger.debug(`[SEND COMMAND] NOT CONNECTED`, NS);
            return EzspStatus.NOT_CONNECTED;
        }

        const sequence = this.nextFrameSequence();

        sendBuffalo.setCommandByte(EZSP_SEQUENCE_INDEX, sequence);
        // we always set the network index in the ezsp frame control.
        sendBuffalo.setCommandByte(
            EZSP_EXTENDED_FRAME_CONTROL_LB_INDEX,
            EZSP_FRAME_CONTROL_COMMAND |
                (DEFAULT_SLEEP_MODE & EZSP_FRAME_CONTROL_SLEEP_MODE_MASK) |
                ((DEFAULT_NETWORK_INDEX << EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET) & EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK),
        );

        // Send initial EZSP_VERSION command with old packet format for old Hosts/NCPs
        if (!this.initialVersionSent && sendBuffalo.getCommandByte(EZSP_FRAME_ID_INDEX) === EzspFrameID.VERSION) {
            this.initialVersionSent = true;
        } else {
            sendBuffalo.setCommandByte(EZSP_EXTENDED_FRAME_CONTROL_HB_INDEX, EZSP_EXTENDED_FRAME_FORMAT_VERSION);
        }

        // might have tried to write more than allocated EZSP_MAX_FRAME_LENGTH for frameContents
        // use write index to detect broken frames cases (inc'ed every time a byte is supposed to have been written)
        // since index is always inc'ed on setCommandByte, this should always end at 202 max
        const length: number = sendBuffalo.getPosition();

        if (length > EZSP_MAX_FRAME_LENGTH) {
            // this.ezspErrorHandler(EzspStatus.ERROR_COMMAND_TOO_LONG);// XXX: this forces a NCP reset??
            return EzspStatus.ERROR_COMMAND_TOO_LONG;
        }

        return await this.queue.execute<EzspStatus>(async () => {
            let status: EzspStatus = EzspStatus.ASH_ERROR_TIMEOUTS; // will be overwritten below as necessary
            const frameId = sendBuffalo.getFrameId();
            const frameString = `[FRAME: ID=${frameId}:"${EzspFrameID[frameId]}" Seq=${sequence} Len=${length}]`;
            logger.debug(`===> ${frameString}`, NS);

            try {
                status = await new Promise<EzspStatus>((resolve, reject: (reason: EzspError) => void): void => {
                    const sendStatus = this.ash.send(length, sendBuffalo.getBuffer());

                    if (sendStatus !== EzspStatus.SUCCESS) {
                        reject(new EzspError(sendStatus));
                        return;
                    }

                    this.responseWaiter = {
                        timer: setTimeout(() => reject(new EzspError(EzspStatus.ASH_ERROR_TIMEOUTS)), this.ash.responseTimeout),
                        resolve,
                    };
                });

                if (status !== EzspStatus.SUCCESS) {
                    throw new EzspError(status);
                }
            } catch (error) {
                this.responseWaiter = undefined;

                logger.debug(`=x=> ${frameString} ${error}`, NS);

                if (error instanceof EzspError) {
                    status = error.code;

                    this.ezspErrorHandler(status);
                }
            }

            return status;
        });
    }

    /**
     * Sets the stage for parsing if valid (indexes buffalo to params index).
     * @returns
     */
    public validateReceivedFrame(buffalo: EzspBuffalo): EzspStatus {
        let status: EzspStatus = EzspStatus.SUCCESS;
        let frameControl: number, frameId: number, parametersIndex: number;
        // eslint-disable-next-line prefer-const
        [status, frameControl, frameId, parametersIndex] = buffalo.getResponseMetadata();

        if (frameId === EzspFrameID.INVALID_COMMAND) {
            status = buffalo.getResponseByte(parametersIndex);
        }

        if ((frameControl & EZSP_FRAME_CONTROL_DIRECTION_MASK) !== EZSP_FRAME_CONTROL_RESPONSE) {
            status = EzspStatus.ERROR_WRONG_DIRECTION;
        }

        if ((frameControl & EZSP_FRAME_CONTROL_TRUNCATED_MASK) === EZSP_FRAME_CONTROL_TRUNCATED) {
            status = EzspStatus.ERROR_TRUNCATED;
        }

        if ((frameControl & EZSP_FRAME_CONTROL_OVERFLOW_MASK) === EZSP_FRAME_CONTROL_OVERFLOW) {
            status = EzspStatus.ERROR_OVERFLOW;
        }

        if ((frameControl & EZSP_FRAME_CONTROL_PENDING_CB_MASK) === EZSP_FRAME_CONTROL_PENDING_CB) {
            this.ash.ncpHasCallbacks = true;
        } else {
            this.ash.ncpHasCallbacks = false;
        }

        // Set the callback network
        //this.callbackNetworkIndex = (frameControl & EZSP_FRAME_CONTROL_NETWORK_INDEX_MASK) >> EZSP_FRAME_CONTROL_NETWORK_INDEX_OFFSET;

        if (status !== EzspStatus.SUCCESS) {
            this.ezspErrorHandler(status);
        }

        buffalo.setPosition(parametersIndex);

        // An overflow does not indicate a comms failure;
        // The system can still communicate but buffers are running critically low.
        // This is almost always due to network congestion and goes away when the network becomes quieter.
        if (status === EzspStatus.ERROR_OVERFLOW) {
            status = EzspStatus.SUCCESS;
        }

        return status;
    }

    /**
     * Dispatches callback frames handlers.
     */
    public callbackDispatch(): void {
        switch (this.callbackBuffalo.getExtFrameId()) {
            case EzspFrameID.NO_CALLBACKS: {
                this.ezspNoCallbacks();
                break;
            }
            case EzspFrameID.STACK_TOKEN_CHANGED_HANDLER: {
                const tokenAddress = this.callbackBuffalo.readUInt16();
                this.ezspStackTokenChangedHandler(tokenAddress);
                break;
            }
            case EzspFrameID.TIMER_HANDLER: {
                const timerId = this.callbackBuffalo.readUInt8();
                this.ezspTimerHandler(timerId);
                break;
            }
            case EzspFrameID.COUNTER_ROLLOVER_HANDLER: {
                const type: EmberCounterType = this.callbackBuffalo.readUInt8();
                this.ezspCounterRolloverHandler(type);
                break;
            }
            case EzspFrameID.CUSTOM_FRAME_HANDLER: {
                const payload = this.callbackBuffalo.readPayload();
                this.ezspCustomFrameHandler(payload);
                break;
            }
            case EzspFrameID.STACK_STATUS_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                this.ezspStackStatusHandler(status);
                break;
            }
            case EzspFrameID.ENERGY_SCAN_RESULT_HANDLER: {
                const channel = this.callbackBuffalo.readUInt8();
                const maxRssiValue = this.callbackBuffalo.readInt8();
                this.ezspEnergyScanResultHandler(channel, maxRssiValue);
                break;
            }
            case EzspFrameID.NETWORK_FOUND_HANDLER: {
                const networkFound: EmberZigbeeNetwork = this.callbackBuffalo.readEmberZigbeeNetwork();
                const lastHopLqi = this.callbackBuffalo.readUInt8();
                const lastHopRssi = this.callbackBuffalo.readInt8();
                this.ezspNetworkFoundHandler(networkFound, lastHopLqi, lastHopRssi);
                break;
            }
            case EzspFrameID.SCAN_COMPLETE_HANDLER: {
                const channel = this.callbackBuffalo.readUInt8();
                const status = this.callbackBuffalo.readStatus(this.version);
                this.ezspScanCompleteHandler(channel, status);
                break;
            }
            case EzspFrameID.UNUSED_PAN_ID_FOUND_HANDLER: {
                const panId: PanId = this.callbackBuffalo.readUInt16();
                const channel = this.callbackBuffalo.readUInt8();
                this.ezspUnusedPanIdFoundHandler(panId, channel);
                break;
            }
            case EzspFrameID.CHILD_JOIN_HANDLER: {
                const index = this.callbackBuffalo.readUInt8();
                const joining = this.callbackBuffalo.readUInt8() !== 0;
                const childId: NodeId = this.callbackBuffalo.readUInt16();
                const childEui64 = this.callbackBuffalo.readIeeeAddr();
                const childType: EmberNodeType = this.callbackBuffalo.readUInt8();
                this.ezspChildJoinHandler(index, joining, childId, childEui64, childType);
                break;
            }
            case EzspFrameID.DUTY_CYCLE_HANDLER: {
                const channelPage = this.callbackBuffalo.readUInt8();
                const channel = this.callbackBuffalo.readUInt8();
                const state: EmberDutyCycleState = this.callbackBuffalo.readUInt8();
                const totalDevices = this.callbackBuffalo.readUInt8();
                const arrayOfDeviceDutyCycles: EmberPerDeviceDutyCycle[] = this.callbackBuffalo.readEmberPerDeviceDutyCycle();
                this.ezspDutyCycleHandler(channelPage, channel, state, totalDevices, arrayOfDeviceDutyCycles);
                break;
            }
            case EzspFrameID.REMOTE_SET_BINDING_HANDLER: {
                const entry: EmberBindingTableEntry = this.callbackBuffalo.readEmberBindingTableEntry();
                const index = this.callbackBuffalo.readUInt8();
                const policyDecision = this.callbackBuffalo.readStatus(this.version);
                this.ezspRemoteSetBindingHandler(entry, index, policyDecision);
                break;
            }
            case EzspFrameID.REMOTE_DELETE_BINDING_HANDLER: {
                const index = this.callbackBuffalo.readUInt8();
                const policyDecision = this.callbackBuffalo.readStatus(this.version);
                this.ezspRemoteDeleteBindingHandler(index, policyDecision);
                break;
            }
            case EzspFrameID.MESSAGE_SENT_HANDLER: {
                if (this.version < 0x0e) {
                    const type: EmberOutgoingMessageType = this.callbackBuffalo.readUInt8();
                    const indexOrDestination = this.callbackBuffalo.readUInt16();
                    const apsFrame: EmberApsFrame = this.callbackBuffalo.readEmberApsFrame();
                    const messageTag = this.callbackBuffalo.readUInt8();
                    const status = this.callbackBuffalo.readStatus(this.version);
                    // EzspPolicyId.MESSAGE_CONTENTS_IN_CALLBACK_POLICY set to messageTag only, so skip parsing entirely
                    // const messageContents = this.callbackBuffalo.readPayload();

                    this.ezspMessageSentHandler(status, type, indexOrDestination, apsFrame, messageTag);
                } else {
                    const status = this.callbackBuffalo.readUInt32();
                    const type: EmberOutgoingMessageType = this.callbackBuffalo.readUInt8();
                    const indexOrDestination = this.callbackBuffalo.readUInt16();
                    const apsFrame: EmberApsFrame = this.callbackBuffalo.readEmberApsFrame();
                    const messageTag = this.callbackBuffalo.readUInt16();
                    // EzspPolicyId.MESSAGE_CONTENTS_IN_CALLBACK_POLICY set to messageTag only, so skip parsing entirely
                    // const messageContents = this.callbackBuffalo.readPayload();

                    this.ezspMessageSentHandler(status, type, indexOrDestination, apsFrame, messageTag);
                }
                break;
            }
            case EzspFrameID.POLL_COMPLETE_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                this.ezspPollCompleteHandler(status);
                break;
            }
            case EzspFrameID.POLL_HANDLER: {
                const childId: NodeId = this.callbackBuffalo.readUInt16();
                const transmitExpected = this.callbackBuffalo.readUInt8() !== 0;
                this.ezspPollHandler(childId, transmitExpected);
                break;
            }
            case EzspFrameID.INCOMING_MESSAGE_HANDLER: {
                if (this.version < 0x0e) {
                    const type: EmberIncomingMessageType = this.callbackBuffalo.readUInt8();
                    const apsFrame = this.callbackBuffalo.readEmberApsFrame();
                    const lastHopLqi = this.callbackBuffalo.readUInt8();
                    const lastHopRssi = this.callbackBuffalo.readInt8();
                    const senderShortId = this.callbackBuffalo.readUInt16();
                    const bindingIndex = this.callbackBuffalo.readUInt8();
                    const addressIndex = this.callbackBuffalo.readUInt8();
                    const packetInfo: EmberRxPacketInfo = {
                        senderShortId,
                        senderLongId: ZSpec.BLANK_EUI64,
                        bindingIndex,
                        addressIndex,
                        lastHopLqi,
                        lastHopRssi,
                        lastHopTimestamp: 0,
                    };
                    const messageContents = this.callbackBuffalo.readPayload();
                    this.ezspIncomingMessageHandler(type, apsFrame, packetInfo, messageContents);
                } else {
                    const type: EmberIncomingMessageType = this.callbackBuffalo.readUInt8();
                    const apsFrame = this.callbackBuffalo.readEmberApsFrame();
                    const packetInfo = this.callbackBuffalo.readEmberRxPacketInfo();
                    const messageContents = this.callbackBuffalo.readPayload();
                    this.ezspIncomingMessageHandler(type, apsFrame, packetInfo, messageContents);
                }
                break;
            }
            case EzspFrameID.INCOMING_MANY_TO_ONE_ROUTE_REQUEST_HANDLER: {
                const source: NodeId = this.callbackBuffalo.readUInt16();
                const longId = this.callbackBuffalo.readIeeeAddr();
                const cost = this.callbackBuffalo.readUInt8();
                this.ezspIncomingManyToOneRouteRequestHandler(source, longId, cost);
                break;
            }
            case EzspFrameID.INCOMING_ROUTE_ERROR_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                const target: NodeId = this.callbackBuffalo.readUInt16();
                this.ezspIncomingRouteErrorHandler(status, target);
                break;
            }
            case EzspFrameID.INCOMING_NETWORK_STATUS_HANDLER: {
                const errorCode = this.callbackBuffalo.readUInt8();
                const target: NodeId = this.callbackBuffalo.readUInt16();
                this.ezspIncomingNetworkStatusHandler(errorCode, target);
                break;
            }
            case EzspFrameID.INCOMING_ROUTE_RECORD_HANDLER: {
                const source: NodeId = this.callbackBuffalo.readUInt16();
                const sourceEui = this.callbackBuffalo.readIeeeAddr();
                const lastHopLqi = this.callbackBuffalo.readUInt8();
                const lastHopRssi = this.callbackBuffalo.readInt8();
                const relayCount = this.callbackBuffalo.readUInt8();
                const relayList = this.callbackBuffalo.readListUInt16(relayCount); //this.callbackBuffalo.readListUInt8(relayCount * 2);
                this.ezspIncomingRouteRecordHandler(source, sourceEui, lastHopLqi, lastHopRssi, relayCount, relayList);
                break;
            }
            case EzspFrameID.ID_CONFLICT_HANDLER: {
                const id: NodeId = this.callbackBuffalo.readUInt16();
                this.ezspIdConflictHandler(id);
                break;
            }
            case EzspFrameID.MAC_PASSTHROUGH_MESSAGE_HANDLER: {
                if (this.version < 0x0e) {
                    const messageType: EmberMacPassthroughType = this.callbackBuffalo.readUInt8();
                    const lastHopLqi = this.callbackBuffalo.readUInt8();
                    const lastHopRssi = this.callbackBuffalo.readInt8();
                    const packetInfo: EmberRxPacketInfo = {
                        senderShortId: ZSpec.NULL_NODE_ID,
                        senderLongId: ZSpec.BLANK_EUI64,
                        bindingIndex: ZSpec.NULL_BINDING,
                        addressIndex: 0xff,
                        lastHopLqi,
                        lastHopRssi,
                        lastHopTimestamp: 0,
                    };
                    const messageContents = this.callbackBuffalo.readPayload();
                    this.ezspMacPassthroughMessageHandler(messageType, packetInfo, messageContents);
                } else {
                    const messageType: EmberMacPassthroughType = this.callbackBuffalo.readUInt8();
                    const packetInfo = this.callbackBuffalo.readEmberRxPacketInfo();
                    const messageContents = this.callbackBuffalo.readPayload();
                    this.ezspMacPassthroughMessageHandler(messageType, packetInfo, messageContents);
                }
                break;
            }
            case EzspFrameID.MAC_FILTER_MATCH_MESSAGE_HANDLER: {
                if (this.version < 0x0e) {
                    const filterIndexMatch = this.callbackBuffalo.readUInt8();
                    const legacyPassthroughType: EmberMacPassthroughType = this.callbackBuffalo.readUInt8();
                    const lastHopLqi = this.callbackBuffalo.readUInt8();
                    const lastHopRssi = this.callbackBuffalo.readInt8();
                    const packetInfo: EmberRxPacketInfo = {
                        senderShortId: ZSpec.NULL_NODE_ID,
                        senderLongId: ZSpec.BLANK_EUI64,
                        bindingIndex: ZSpec.NULL_BINDING,
                        addressIndex: 0xff,
                        lastHopLqi,
                        lastHopRssi,
                        lastHopTimestamp: 0,
                    };
                    const messageContents = this.callbackBuffalo.readPayload();
                    this.ezspMacFilterMatchMessageHandler(filterIndexMatch, legacyPassthroughType, packetInfo, messageContents);
                } else {
                    const filterIndexMatch = this.callbackBuffalo.readUInt8();
                    const legacyPassthroughType: EmberMacPassthroughType = this.callbackBuffalo.readUInt8();
                    const packetInfo = this.callbackBuffalo.readEmberRxPacketInfo();
                    const messageContents = this.callbackBuffalo.readPayload();
                    this.ezspMacFilterMatchMessageHandler(filterIndexMatch, legacyPassthroughType, packetInfo, messageContents);
                }
                break;
            }
            case EzspFrameID.RAW_TRANSMIT_COMPLETE_HANDLER: {
                if (this.version < 0x0e) {
                    const status = this.callbackBuffalo.readStatus(this.version);
                    this.ezspRawTransmitCompleteHandler(Buffer.alloc(0), status);
                } else {
                    const messageContents = this.callbackBuffalo.readPayload();
                    const status = this.callbackBuffalo.readUInt32();
                    this.ezspRawTransmitCompleteHandler(messageContents, status);
                }
                break;
            }
            case EzspFrameID.SWITCH_NETWORK_KEY_HANDLER: {
                const sequenceNumber = this.callbackBuffalo.readUInt8();
                this.ezspSwitchNetworkKeyHandler(sequenceNumber);
                break;
            }
            case EzspFrameID.ZIGBEE_KEY_ESTABLISHMENT_HANDLER: {
                const partner = this.callbackBuffalo.readIeeeAddr();
                const status: EmberKeyStatus = this.callbackBuffalo.readUInt8();
                this.ezspZigbeeKeyEstablishmentHandler(partner, status);
                break;
            }
            case EzspFrameID.TRUST_CENTER_JOIN_HANDLER: {
                const newNodeId: NodeId = this.callbackBuffalo.readUInt16();
                const newNodeEui64 = this.callbackBuffalo.readIeeeAddr();
                const status: EmberDeviceUpdate = this.callbackBuffalo.readUInt8();
                const policyDecision: EmberJoinDecision = this.callbackBuffalo.readUInt8();
                const parentOfNewNodeId: NodeId = this.callbackBuffalo.readUInt16();
                this.ezspTrustCenterJoinHandler(newNodeId, newNodeEui64, status, policyDecision, parentOfNewNodeId);
                break;
            }
            case EzspFrameID.GENERATE_CBKE_KEYS_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                const ephemeralPublicKey: EmberPublicKeyData = this.callbackBuffalo.readEmberPublicKeyData();
                this.ezspGenerateCbkeKeysHandler(status, ephemeralPublicKey);
                break;
            }
            case EzspFrameID.CALCULATE_SMACS_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                const initiatorSmac: EmberSmacData = this.callbackBuffalo.readEmberSmacData();
                const responderSmac: EmberSmacData = this.callbackBuffalo.readEmberSmacData();
                this.ezspCalculateSmacsHandler(status, initiatorSmac, responderSmac);
                break;
            }
            case EzspFrameID.GENERATE_CBKE_KEYS_HANDLER283K1: {
                const status = this.callbackBuffalo.readStatus(this.version);
                const ephemeralPublicKey: EmberPublicKey283k1Data = this.callbackBuffalo.readEmberPublicKey283k1Data();
                this.ezspGenerateCbkeKeysHandler283k1(status, ephemeralPublicKey);
                break;
            }
            case EzspFrameID.CALCULATE_SMACS_HANDLER283K1: {
                const status = this.callbackBuffalo.readStatus(this.version);
                const initiatorSmac: EmberSmacData = this.callbackBuffalo.readEmberSmacData();
                const responderSmac: EmberSmacData = this.callbackBuffalo.readEmberSmacData();
                this.ezspCalculateSmacsHandler283k1(status, initiatorSmac, responderSmac);
                break;
            }
            case EzspFrameID.DSA_SIGN_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                const messageContents = this.callbackBuffalo.readPayload();
                this.ezspDsaSignHandler(status, messageContents);
                break;
            }
            case EzspFrameID.DSA_VERIFY_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                this.ezspDsaVerifyHandler(status);
                break;
            }
            case EzspFrameID.MFGLIB_RX_HANDLER: {
                const linkQuality = this.callbackBuffalo.readUInt8();
                const rssi = this.callbackBuffalo.readInt8();
                const packetContents = this.callbackBuffalo.readPayload();
                this.ezspMfglibRxHandler(linkQuality, rssi, packetContents);
                break;
            }
            case EzspFrameID.INCOMING_BOOTLOAD_MESSAGE_HANDLER: {
                if (this.version < 0x0e) {
                    const longId = this.callbackBuffalo.readIeeeAddr();
                    const lastHopLqi = this.callbackBuffalo.readUInt8();
                    const lastHopRssi = this.callbackBuffalo.readInt8();
                    const packetInfo: EmberRxPacketInfo = {
                        senderShortId: ZSpec.NULL_NODE_ID,
                        senderLongId: ZSpec.BLANK_EUI64,
                        bindingIndex: ZSpec.NULL_BINDING,
                        addressIndex: 0xff,
                        lastHopLqi,
                        lastHopRssi,
                        lastHopTimestamp: 0,
                    };
                    const messageContents = this.callbackBuffalo.readPayload();
                    this.ezspIncomingBootloadMessageHandler(longId, packetInfo, messageContents);
                } else {
                    const longId = this.callbackBuffalo.readIeeeAddr();
                    const packetInfo = this.callbackBuffalo.readEmberRxPacketInfo();
                    const messageContents = this.callbackBuffalo.readPayload();
                    this.ezspIncomingBootloadMessageHandler(longId, packetInfo, messageContents);
                }
                break;
            }
            case EzspFrameID.BOOTLOAD_TRANSMIT_COMPLETE_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                const messageContents = this.callbackBuffalo.readPayload();
                this.ezspBootloadTransmitCompleteHandler(status, messageContents);
                break;
            }
            case EzspFrameID.INCOMING_MFG_TEST_MESSAGE_HANDLER: {
                const messageType = this.callbackBuffalo.readUInt8();
                const messageContents = this.callbackBuffalo.readPayload();
                this.ezspIncomingMfgTestMessageHandler(messageType, messageContents);
                break;
            }
            case EzspFrameID.ZLL_NETWORK_FOUND_HANDLER: {
                if (this.version < 0x0e) {
                    const networkInfo = this.callbackBuffalo.readEmberZllNetwork();
                    const isDeviceInfoNull = this.callbackBuffalo.readUInt8() !== 0;
                    const deviceInfo = this.callbackBuffalo.readEmberZllDeviceInfoRecord();
                    const lastHopLqi = this.callbackBuffalo.readUInt8();
                    const lastHopRssi = this.callbackBuffalo.readInt8();
                    const packetInfo: EmberRxPacketInfo = {
                        senderShortId: ZSpec.NULL_NODE_ID,
                        senderLongId: ZSpec.BLANK_EUI64,
                        bindingIndex: ZSpec.NULL_BINDING,
                        addressIndex: 0xff,
                        lastHopLqi,
                        lastHopRssi,
                        lastHopTimestamp: 0,
                    };
                    this.ezspZllNetworkFoundHandler(networkInfo, isDeviceInfoNull, deviceInfo, packetInfo);
                } else {
                    const networkInfo = this.callbackBuffalo.readEmberZllNetwork();
                    const isDeviceInfoNull = this.callbackBuffalo.readUInt8() !== 0;
                    const deviceInfo = this.callbackBuffalo.readEmberZllDeviceInfoRecord();
                    const packetInfo = this.callbackBuffalo.readEmberRxPacketInfo();
                    this.ezspZllNetworkFoundHandler(networkInfo, isDeviceInfoNull, deviceInfo, packetInfo);
                }
                break;
            }
            case EzspFrameID.ZLL_SCAN_COMPLETE_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                this.ezspZllScanCompleteHandler(status);
                break;
            }
            case EzspFrameID.ZLL_ADDRESS_ASSIGNMENT_HANDLER: {
                if (this.version < 0x0e) {
                    const addressInfo = this.callbackBuffalo.readEmberZllAddressAssignment();
                    const lastHopLqi = this.callbackBuffalo.readUInt8();
                    const lastHopRssi = this.callbackBuffalo.readInt8();
                    const packetInfo: EmberRxPacketInfo = {
                        senderShortId: ZSpec.NULL_NODE_ID,
                        senderLongId: ZSpec.BLANK_EUI64,
                        bindingIndex: ZSpec.NULL_BINDING,
                        addressIndex: 0xff,
                        lastHopLqi,
                        lastHopRssi,
                        lastHopTimestamp: 0,
                    };
                    this.ezspZllAddressAssignmentHandler(addressInfo, packetInfo);
                } else {
                    const addressInfo = this.callbackBuffalo.readEmberZllAddressAssignment();
                    const packetInfo = this.callbackBuffalo.readEmberRxPacketInfo();
                    this.ezspZllAddressAssignmentHandler(addressInfo, packetInfo);
                }
                break;
            }
            case EzspFrameID.ZLL_TOUCH_LINK_TARGET_HANDLER: {
                const networkInfo = this.callbackBuffalo.readEmberZllNetwork();
                this.ezspZllTouchLinkTargetHandler(networkInfo);
                break;
            }
            case EzspFrameID.D_GP_SENT_HANDLER: {
                const status = this.callbackBuffalo.readStatus(this.version);
                const gpepHandle = this.callbackBuffalo.readUInt8();
                this.ezspDGpSentHandler(status, gpepHandle);
                break;
            }
            case EzspFrameID.GPEP_INCOMING_MESSAGE_HANDLER: {
                const gpStatus = this.callbackBuffalo.readUInt8();
                const gpdLink = this.callbackBuffalo.readUInt8();
                const sequenceNumber = this.callbackBuffalo.readUInt8();
                const addr = this.callbackBuffalo.readEmberGpAddress();
                const gpdfSecurityLevel: EmberGpSecurityLevel = this.callbackBuffalo.readUInt8();
                const gpdfSecurityKeyType: EmberGpKeyType = this.callbackBuffalo.readUInt8();
                const autoCommissioning = this.callbackBuffalo.readUInt8() !== 0;
                const bidirectionalInfo = this.callbackBuffalo.readUInt8();
                const gpdSecurityFrameCounter = this.callbackBuffalo.readUInt32();
                const gpdCommandId = this.callbackBuffalo.readUInt8();
                const mic = this.callbackBuffalo.readUInt32();
                const proxyTableIndex = this.callbackBuffalo.readUInt8();
                const gpdCommandPayload = this.callbackBuffalo.readPayload();
                let packetInfo: EmberRxPacketInfo;

                if (this.version < 0x10) {
                    packetInfo = {
                        senderShortId: ZSpec.NULL_NODE_ID,
                        senderLongId: ZSpec.BLANK_EUI64,
                        bindingIndex: ZSpec.NULL_BINDING,
                        addressIndex: 0xff,
                        lastHopLqi: gpdLink,
                        lastHopRssi: 0,
                        lastHopTimestamp: 0,
                    };
                } else {
                    packetInfo = this.callbackBuffalo.readEmberRxPacketInfo();
                }

                this.ezspGpepIncomingMessageHandler(
                    gpStatus,
                    gpdLink,
                    sequenceNumber,
                    addr,
                    gpdfSecurityLevel,
                    gpdfSecurityKeyType,
                    autoCommissioning,
                    bidirectionalInfo,
                    gpdSecurityFrameCounter,
                    gpdCommandId,
                    mic,
                    proxyTableIndex,
                    gpdCommandPayload,
                    packetInfo,
                );
                break;
            }
            default:
                logger.debug(`<=x= Ignored unused/unknown ${this.callbackFrameToString}`, NS);
        }
    }

    /**
     *
     * @returns uint8_t
     */
    private nextSendSequence(): number {
        return (this.sendSequence = ++this.sendSequence & MESSAGE_TAG_MASK);
    }

    /**
     * Calls ezspSend${x} based on type and takes care of tagging message.
     *
     * Alias types expect `alias` & `sequence` params, along with `apsFrame.radius`.
     *
     * @param type Specifies the outgoing message type.
     * @param indexOrDestination uint16_t Depending on the type of addressing used, this is either the NodeId of the destination,
     *     an index into the address table, or an index into the binding table.
     *     Unused for multicast types.
     *     This must be one of the three ZigBee broadcast addresses for broadcast.
     * @param apsFrame [IN/OUT] EmberApsFrame * The APS frame which is to be added to the message.
     *        Sequence set in OUT as returned by ezspSend${x} command
     * @param message uint8_t * Content of the message.
     * @param alias The alias source address
     * @param sequence uint8_t The alias sequence number
     * @returns Result of the ezspSend${x} call or EmberStatus.INVALID_PARAMETER if type not supported.
     * @returns messageTag Tag used for ezspSend${x} command
     */
    public async send(
        type: EmberOutgoingMessageType,
        indexOrDestination: number,
        apsFrame: EmberApsFrame,
        message: Buffer,
        alias: NodeId,
        sequence: number,
    ): Promise<[SLStatus, messageTag: number]> {
        let status: SLStatus = SLStatus.INVALID_PARAMETER;
        let apsSequence: number;
        const messageTag = this.nextSendSequence();
        let nwkRadius = ZA_MAX_HOPS;
        let nwkAlias: NodeId = ZSpec.NULL_NODE_ID;

        switch (type) {
            case EmberOutgoingMessageType.VIA_BINDING:
            case EmberOutgoingMessageType.VIA_ADDRESS_TABLE:
            case EmberOutgoingMessageType.DIRECT: {
                [status, apsSequence] = await this.ezspSendUnicast(type, indexOrDestination, apsFrame, messageTag, message);
                break;
            }
            case EmberOutgoingMessageType.MULTICAST:
            case EmberOutgoingMessageType.MULTICAST_WITH_ALIAS: {
                if (
                    type === EmberOutgoingMessageType.MULTICAST_WITH_ALIAS ||
                    (apsFrame.sourceEndpoint === ZSpec.GP_ENDPOINT &&
                        apsFrame.destinationEndpoint === ZSpec.GP_ENDPOINT &&
                        apsFrame.options & EmberApsOption.USE_ALIAS_SEQUENCE_NUMBER)
                ) {
                    nwkRadius = apsFrame.radius ?? nwkRadius;
                    nwkAlias = alias;
                }

                [status, apsSequence] = await this.ezspSendMulticast(
                    apsFrame,
                    nwkRadius,
                    0, // broadcast addr
                    nwkAlias,
                    sequence,
                    messageTag,
                    message,
                );
                break;
            }
            case EmberOutgoingMessageType.BROADCAST:
            case EmberOutgoingMessageType.BROADCAST_WITH_ALIAS: {
                if (
                    type == EmberOutgoingMessageType.BROADCAST_WITH_ALIAS ||
                    (apsFrame.sourceEndpoint == ZSpec.GP_ENDPOINT &&
                        apsFrame.destinationEndpoint == ZSpec.GP_ENDPOINT &&
                        apsFrame.options & EmberApsOption.USE_ALIAS_SEQUENCE_NUMBER)
                ) {
                    nwkRadius = apsFrame.radius ?? nwkRadius;
                    nwkAlias = alias;
                }

                [status, apsSequence] = await this.ezspSendBroadcast(
                    nwkAlias,
                    indexOrDestination,
                    sequence,
                    apsFrame,
                    nwkRadius,
                    messageTag,
                    message,
                );
                break;
            }
        }

        apsFrame.sequence = apsSequence;

        // NOTE: match `~~~>` from adapter since this is just a wrapper for it
        logger.debug(
            `~~~> [SENT type=${EmberOutgoingMessageType[type]} apsSequence=${apsSequence} messageTag=${messageTag} status=${SLStatus[status]}]`,
            NS,
        );
        return [status, messageTag];
    }

    /**
     * Retrieving the new version info.
     * Wrapper for `ezspGetValue`.
     * @returns Send status
     * @returns EmberVersion*, null if status not SUCCESS.
     */
    public async ezspGetVersionStruct(): Promise<[SLStatus, version: EmberVersion]> {
        const [status, outValueLength, outValue] = await this.ezspGetValue(EzspValueId.VERSION_INFO, 7); // sizeof(EmberVersion)

        if (outValueLength !== 7) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        return [
            status,
            {
                build: outValue[0] + (outValue[1] << 8),
                major: outValue[2],
                minor: outValue[3],
                patch: outValue[4],
                special: outValue[5],
                type: outValue[6],
            },
        ];
    }

    /**
     * Function for manipulating the endpoints flags on the NCP.
     * Wrapper for `ezspGetExtendedValue`
     * @param endpoint uint8_t
     * @param flags EzspEndpointFlags
     * @returns EzspStatus
     */
    public async ezspSetEndpointFlags(endpoint: number, flags: EzspEndpointFlag): Promise<SLStatus> {
        return await this.ezspSetValue(EzspValueId.ENDPOINT_FLAGS, 3, [endpoint, lowByte(flags), highByte(flags)]);
    }

    /**
     * Function for manipulating the endpoints flags on the NCP.
     * Wrapper for `ezspGetExtendedValue`.
     * @param endpoint uint8_t
     * @returns EzspStatus
     * @returns flags
     */
    public async ezspGetEndpointFlags(endpoint: number): Promise<[SLStatus, flags: EzspEndpointFlag]> {
        const [status, outValLen, outVal] = await this.ezspGetExtendedValue(EzspExtendedValueId.ENDPOINT_FLAGS, endpoint, 2);

        if (outValLen < 2) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        const returnFlags = highLowToInt(outVal[1], outVal[0]);

        return [status, returnFlags];
    }

    /**
     * Wrapper for `ezspGetExtendedValue`.
     * @param NodeId
     * @param destination
     * @returns EzspStatus
     * @returns overhead uint8_t
     */
    public async ezspGetSourceRouteOverhead(destination: NodeId): Promise<[SLStatus, overhead: number]> {
        const [status, outValLen, outVal] = await this.ezspGetExtendedValue(EzspExtendedValueId.GET_SOURCE_ROUTE_OVERHEAD, destination, 1);

        if (outValLen < 1) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        return [status, outVal[0]];
    }

    /**
     * Wrapper for `ezspGetExtendedValue`.
     * @returns EzspStatus
     * @returns reason
     * @returns nodeId NodeId*
     */
    public async ezspGetLastLeaveReason(): Promise<[SLStatus, reason: EmberLeaveReason, nodeId: NodeId]> {
        const [status, outValLen, outVal] = await this.ezspGetExtendedValue(EzspExtendedValueId.LAST_LEAVE_REASON, 0, 3);

        if (outValLen < 3) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        return [status, outVal[0], highLowToInt(outVal[2], outVal[1])];
    }

    /**
     * Wrapper for `ezspGetValue`.
     * @returns EzspStatus
     * @returns reason
     */
    public async ezspGetLastRejoinReason(): Promise<[SLStatus, reason: EmberRejoinReason]> {
        const [status, outValLen, outVal] = await this.ezspGetValue(EzspValueId.LAST_REJOIN_REASON, 1);

        if (outValLen < 1) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        return [status, outVal[0]];
    }

    /**
     * Wrapper for `ezspSetValue`.
     * @param mask
     * @returns
     */
    public async ezspSetExtendedSecurityBitmask(mask: EmberExtendedSecurityBitmask): Promise<SLStatus> {
        return await this.ezspSetValue(EzspValueId.EXTENDED_SECURITY_BITMASK, 2, [lowByte(mask), highByte(mask)]);
    }

    /**
     * Wrapper for `ezspGetValue`.
     * @returns
     */
    public async ezspGetExtendedSecurityBitmask(): Promise<[SLStatus, mask: EmberExtendedSecurityBitmask]> {
        const [status, outValLen, outVal] = await this.ezspGetValue(EzspValueId.EXTENDED_SECURITY_BITMASK, 2);

        if (outValLen < 2) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        return [status, highLowToInt(outVal[1], outVal[0])];
    }

    /**
     * Wrapper for `ezspSetValue`.
     * @returns
     */
    public async ezspStartWritingStackTokens(): Promise<SLStatus> {
        return await this.ezspSetValue(EzspValueId.STACK_TOKEN_WRITING, 1, [1]);
    }

    /**
     * Wrapper for `ezspSetValue`.
     * @returns
     */
    public async ezspStopWritingStackTokens(): Promise<SLStatus> {
        return await this.ezspSetValue(EzspValueId.STACK_TOKEN_WRITING, 1, [0]);
    }

    /**
     * Wrapper for `ezspSetValue`.
     *
     * Set NWK layer outgoing frame counter (intended for device restoration purposes).
     * Caveats:
     *   - Can only be called before NetworkInit / FormNetwork / JoinNetwork, when sl_zigbee_network_state()==SL_ZIGBEE_NO_NETWORK.
     *   - This function should be called before ::sl_zigbee_set_initial_security_state, and the SL_ZIGBEE_NO_FRAME_COUNTER_RESET
     *     bitmask should be added to the initial security bitmask when ::emberSetInitialSecurityState is called.
     *   - If used in multi-network context, be sure to call ::sl_zigbee_set_current_network() prior to calling this function.
     *
     * @param desiredValue The desired outgoing NWK frame counter value.
     *        This should needs to be less than MAX_INT32U_VALUE to ensure that rollover does not occur on the next encrypted transmission.
     * @returns
     * - SL_STATUS_OK if calling context is valid (sl_zigbee_network_state() == SL_ZIGBEE_NO_NETWORK) and desiredValue < MAX_INT32U_VALUE.
     * - SL_STATUS_INVALID_STATE.
     */
    public async ezspSetNWKFrameCounter(frameCounter: number): Promise<SLStatus> {
        return await this.ezspSetValue(EzspValueId.NWK_FRAME_COUNTER, 4, [
            frameCounter & 0xff,
            (frameCounter >> 8) & 0xff,
            (frameCounter >> 16) & 0xff,
            (frameCounter >> 24) & 0xff,
        ]);
    }

    /**
     * Wrapper for `ezspSetValue`.
     *
     * Function to set APS layer outgoing frame counter for Trust Center Link Key (intended for device restoration purposes).
     * Caveats:
     *    - Can only be called before NetworkInit / FormNetwork / JoinNetwork, when sl_zigbee_network_state()==SL_ZIGBEE_NO_NETWORK.
     *    - This function should be called before ::sl_zigbee_set_initial_security_state, and the SL_ZIGBEE_NO_FRAME_COUNTER_RESET
     *      bitmask should be added to the initial security bitmask when ::emberSetInitialSecurityState is called.
     *    - If used in multi-network context, be sure to call ::sl_zigbee_set_current_network() prior to calling this function.
     *
     * @param desiredValue The desired outgoing APS frame counter value.
     *        This should needs to be less than MAX_INT32U_VALUE to ensure that rollover does not occur on the next encrypted transmission.
     * @returns
     * - SL_STATUS_OK if calling context is valid (sl_zigbee_network_state() == SL_ZIGBEE_NO_NETWORK) and desiredValue < MAX_INT32U_VALUE.
     * - SL_STATUS_INVALID_STATE.
     */
    public async ezspSetAPSFrameCounter(frameCounter: number): Promise<SLStatus> {
        return await this.ezspSetValue(EzspValueId.APS_FRAME_COUNTER, 4, [
            frameCounter & 0xff,
            (frameCounter >> 8) & 0xff,
            (frameCounter >> 16) & 0xff,
            (frameCounter >> 24) & 0xff,
        ]);
    }

    //-----------------------------------------------------------------------------//
    //---------------------------- START EZSP COMMANDS ----------------------------//
    //-----------------------------------------------------------------------------//

    //-----------------------------------------------------------------------------
    // Configuration Frames
    //-----------------------------------------------------------------------------

    /**
     * The command allows the Host to specify the desired EZSP version and must be
     * sent before any other command. The response provides information about the
     * firmware running on the NCP.
     *
     * @param desiredProtocolVersion uint8_t The EZSP version the Host wishes to use.
     *        To successfully set the version and allow other commands, this must be same as EZSP_PROTOCOL_VERSION.
     * @returns uint8_t The EZSP version the NCP is using.
     * @returns uint8_t * The type of stack running on the NCP (2).
     * @returns uint16_t * The version number of the stack.
     */
    async ezspVersion(desiredProtocolVersion: number): Promise<[protocolVersion: number, stackType: number, stackVersion: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.VERSION);
        sendBuffalo.writeUInt8(desiredProtocolVersion);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const protocolVersion = this.buffalo.readUInt8();
        const stackType = this.buffalo.readUInt8();
        const stackVersion = this.buffalo.readUInt16();

        return [protocolVersion, stackType, stackVersion];
    }

    /**
     * Reads a configuration value from the NCP.
     *
     * @param configId Identifies which configuration value to read.
     * @returns
     * - SLStatus.OK if the value was read successfully,
     * - SLStatus.ZIGBEE_EZSP_ERROR (for SL_ZIGBEE_EZSP_ERROR_INVALID_ID) if the NCP does not recognize configId.
     * @returns uint16_t * The configuration value.
     */
    async ezspGetConfigurationValue(configId: EzspConfigId): Promise<[SLStatus, value: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_CONFIGURATION_VALUE);
        sendBuffalo.writeUInt8(configId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version, false);
        const value = this.buffalo.readUInt16();

        return [status, value];
    }

    /**
     * Writes a configuration value to the NCP. Configuration values can be modified
     * by the Host after the NCP has reset. Once the status of the stack changes to
     * EMBER_NETWORK_UP, configuration values can no longer be modified and this
     * command will respond with EzspStatus.ERROR_INVALID_CALL.
     *
     * @param configId Identifies which configuration value to change.
     * @param value uint16_t The new configuration value.
     * @returns EzspStatus
     * - SLStatus.OK if the configuration value was changed,
     * - SLStatus.ZIGBEE_EZSP_ERROR if the new value exceeded the available memory,
     *                               if the new value was out of bounds,
     *                               if the NCP does not recognize configId,
     *                               if configuration values can no longer be modified.
     */
    async ezspSetConfigurationValue(configId: EzspConfigId, value: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_CONFIGURATION_VALUE);
        sendBuffalo.writeUInt8(configId);
        sendBuffalo.writeUInt16(value);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version, false);

        return status;
    }

    /**
     * Read attribute data on NCP endpoints.
     * @param endpoint uint8_t Endpoint
     * @param cluster uint16_t Cluster.
     * @param attributeId uint16_t Attribute ID.
     * @param mask uint8_t Mask.
     * @param manufacturerCode uint16_t Manufacturer code.
     * @returns An sl_zigbee_af_status_t value indicating success or the reason for failure, handled by the EZSP layer as a uint8_t.
     * @returns uint8_t * Attribute data type.
     * @returns uint8_t * Length of attribute data.
     * @returns uint8_t * Attribute data.
     */
    async ezspReadAttribute(
        endpoint: number,
        cluster: number,
        attributeId: number,
        mask: number,
        manufacturerCode: number,
        readLength: number,
    ): Promise<[SLStatus, dataType: number, outReadLength: number, data: number[]]> {
        const sendBuffalo = this.startCommand(EzspFrameID.READ_ATTRIBUTE);
        sendBuffalo.writeUInt8(endpoint);
        sendBuffalo.writeUInt16(cluster);
        sendBuffalo.writeUInt16(attributeId);
        sendBuffalo.writeUInt8(mask);
        sendBuffalo.writeUInt16(manufacturerCode);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const maxReadLength = readLength;
        const status = this.buffalo.readStatus(0); // XXX: not yet switched to uint32 in v14, trick with 0 version for proper mapping
        const dataType = this.buffalo.readUInt8();
        readLength = this.buffalo.readUInt8();

        if (readLength > maxReadLength) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        const data = this.buffalo.readListUInt8(readLength);

        return [status, dataType, readLength, data];
    }

    /**
     * Write attribute data on NCP endpoints.
     * @param endpoint uint8_t Endpoint
     * @param cluster uint16_t Cluster.
     * @param attributeId uint16_t Attribute ID.
     * @param mask uint8_t Mask.
     * @param manufacturerCode uint16_t Manufacturer code.
     * @param overrideReadOnlyAndDataType Override read only and data type.
     * @param justTest Override read only and data type.
     * @param dataType uint8_t Attribute data type.
     * @param data uint8_t * Attribute data.
     * @returns An sl_zigbee_af_status_t value indicating success or the reason for failure.
     */
    async ezspWriteAttribute(
        endpoint: number,
        cluster: number,
        attributeId: number,
        mask: number,
        manufacturerCode: number,
        overrideReadOnlyAndDataType: boolean,
        justTest: boolean,
        dataType: number,
        data: Buffer,
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.WRITE_ATTRIBUTE);
        sendBuffalo.writeUInt8(endpoint);
        sendBuffalo.writeUInt16(cluster);
        sendBuffalo.writeUInt16(attributeId);
        sendBuffalo.writeUInt8(mask);
        sendBuffalo.writeUInt16(manufacturerCode);
        sendBuffalo.writeUInt8(overrideReadOnlyAndDataType ? 1 : 0);
        sendBuffalo.writeUInt8(justTest ? 1 : 0);
        sendBuffalo.writeUInt8(dataType);
        sendBuffalo.writePayload(data);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(0); // XXX: not yet switched to uint32 in v14, trick with 0 version for proper mapping

        return status;
    }

    /**
     * Configures endpoint information on the NCP. The NCP does not remember these
     * settings after a reset. Endpoints can be added by the Host after the NCP has
     * reset. Once the status of the stack changes to EMBER_NETWORK_UP, endpoints
     * can no longer be added and this command will respond with EzspStatus.ERROR_INVALID_CALL.
     * @param endpoint uint8_t The application endpoint to be added.
     * @param profileId uint16_t The endpoint's application profile.
     * @param deviceId uint16_t The endpoint's device ID within the application profile.
     * @param deviceVersion uint8_t The endpoint's device version.
     * @param inputClusterList uint16_t * Input cluster IDs the endpoint will accept.
     * @param outputClusterList uint16_t * Output cluster IDs the endpoint may send.
     * @returns
     * - SLStatus.OK if the endpoint was added,
     * - SLStatus.ZIGBEE_EZSP_ERROR if there is not enough memory available to add the endpoint,
     *                               if the endpoint already exists,
     *                               if endpoints can no longer be added.
     */
    async ezspAddEndpoint(
        endpoint: number,
        profileId: number,
        deviceId: number,
        deviceVersion: number,
        inputClusterList: number[],
        outputClusterList: number[],
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.ADD_ENDPOINT);
        sendBuffalo.writeUInt8(endpoint);
        sendBuffalo.writeUInt16(profileId);
        sendBuffalo.writeUInt16(deviceId);
        sendBuffalo.writeUInt8(deviceVersion);
        sendBuffalo.writeUInt8(inputClusterList.length);
        sendBuffalo.writeUInt8(outputClusterList.length);
        sendBuffalo.writeListUInt16(inputClusterList);
        sendBuffalo.writeListUInt16(outputClusterList);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version, false);

        return status;
    }

    /**
     * Allows the Host to change the policies used by the NCP to make fast
     * decisions.
     * @param policyId Identifies which policy to modify.
     * @param decisionId The new decision for the specified policy.
     * @returns
     * - SLStatus.OK if the policy was changed,
     * - SLStatus.ZIGBEE_EZSP_ERROR if the NCP does not recognize policyId.
     */
    async ezspSetPolicy(policyId: EzspPolicyId, decisionId: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_POLICY);
        sendBuffalo.writeUInt8(policyId);
        sendBuffalo.writeUInt8(decisionId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version, false);

        return status;
    }

    /**
     * Allows the Host to read the policies used by the NCP to make fast decisions.
     * @param policyId Identifies which policy to read.
     * @returns
     * - SLStatus.OK if the policy was read successfully,
     * - SLStatus.ZIGBEE_EZSP_ERROR if the NCP does not recognize policyId.
     * @returns EzspDecisionId * The current decision for the specified policy.
     */
    async ezspGetPolicy(policyId: EzspPolicyId): Promise<[SLStatus, number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_POLICY);
        sendBuffalo.writeUInt8(policyId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version, false);
        const decisionId = this.buffalo.readUInt8();

        return [status, decisionId];
    }

    /**
     * Triggers a pan id update message.
     * @param The new Pan Id
     * @returns true if the request was successfully handed to the stack, false otherwise
     */
    async ezspSendPanIdUpdate(newPan: PanId): Promise<boolean> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_PAN_ID_UPDATE);
        sendBuffalo.writeUInt16(newPan);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt8() !== 0;

        return status;
    }

    /**
     * Reads a value from the NCP.
     * @param valueId Identifies which value to read.
     * @returns
     * - SLStatus.OK if the value was read successfully,
     * - SLStatus.ZIGBEE_EZSP_ERROR if the NCP does not recognize valueId,
     *                               if the length of the returned value exceeds the size of local storage allocated to receive it.
     * @returns uint8_t * Both a command and response parameter.
     *   On command, the maximum in bytes of local storage allocated to receive the returned value.
     *   On response, the actual length in bytes of the returned value.
     * @returns uint8_t * The value.
     */
    async ezspGetValue(valueId: EzspValueId, valueLength: number): Promise<[SLStatus, outValueLength: number, outValue: number[]]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_VALUE);
        sendBuffalo.writeUInt8(valueId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const maxValueLength = valueLength;
        const status = this.buffalo.readStatus(this.version, false);
        valueLength = this.buffalo.readUInt8();

        if (valueLength > maxValueLength) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        const value = this.buffalo.readListUInt8(valueLength);

        return [status, valueLength, value];
    }

    /**
     * Reads a value from the NCP but passes an extra argument specific to the value
     * being retrieved.
     * @param valueId Identifies which extended value ID to read.
     * @param characteristics uint32_t Identifies which characteristics of the extended value ID to read. These are specific to the value being read.
     * @returns
     * - SLStatus.OK if the value was read successfully,
     * - SLStatus.ZIGBEE_EZSP_ERROR if the NCP does not recognize valueId,
     *                               if the length of the returned value exceeds the size of local storage allocated to receive it.
     * @returns uint8_t * Both a command and response parameter.
     *   On command, the maximum in bytes of local storage allocated to receive the returned value.
     *   On response, the actual length in bytes of the returned value.
     * @returns uint8_t * The value.
     */
    async ezspGetExtendedValue(
        valueId: EzspExtendedValueId,
        characteristics: number,
        valueLength: number,
    ): Promise<[SLStatus, outValueLength: number, outValue: number[]]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_EXTENDED_VALUE);
        sendBuffalo.writeUInt8(valueId);
        sendBuffalo.writeUInt32(characteristics);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        // let value: number[] = null;

        const maxValueLength = valueLength;
        const status = this.buffalo.readStatus(this.version, false);
        valueLength = this.buffalo.readUInt8();

        if (valueLength > maxValueLength) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        const value = this.buffalo.readListUInt8(valueLength);

        return [status, valueLength, value];
    }

    /**
     * Writes a value to the NCP.
     * @param valueId Identifies which value to change.
     * @param valueLength uint8_t The length of the value parameter in bytes.
     * @param value uint8_t * The new value.
     * @returns
     * - SLStatus.OK if the value was changed,
     * - SLStatus.ZIGBEE_EZSP_ERROR if the new value was out of bounds,
     *                               if the NCP does not recognize valueId,
     *                               if the value could not be modified.
     */
    async ezspSetValue(valueId: EzspValueId, valueLength: number, value: number[]): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_VALUE);
        sendBuffalo.writeUInt8(valueId);
        sendBuffalo.writeUInt8(valueLength);
        sendBuffalo.writeListUInt8(value);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version, false);

        return status;
    }

    /**
     * Allows the Host to control the broadcast behaviour of a routing device used by the NCP.
     * @param config uint8_t Passive ack config enum.
     * @param minAcksNeeded uint8_t The minimum number of acknowledgments (re-broadcasts) to wait for until
     *        deeming the broadcast transmission complete.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetPassiveAckConfig(config: number, minAcksNeeded: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_PASSIVE_ACK_CONFIG);
        sendBuffalo.writeUInt8(config);
        sendBuffalo.writeUInt8(minAcksNeeded);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Set the PAN ID to be accepted by the device in a NLME Network Update command.
     * If this is set to a different value than its default 0xFFFF, NLME network update messages will be ignored if they do not match this PAN ID.
     * @param panId uint16_t PAN ID to be accepted in a network update.
     */
    async ezspSetPendingNetworkUpdatePanId(panId: PanId): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_PENDING_NETWORK_UPDATE_PAN_ID);
        sendBuffalo.writeUInt16(panId);
        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Retrieve the endpoint number located at the specified index.
     * @param index uint8_t Index to retrieve the endpoint number for.
     * @returns uint8_t Endpoint number at the index.
     */
    async ezspGetEndpoint(index: number): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_ENDPOINT);
        sendBuffalo.writeUInt8(index);
        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const endpoint = this.buffalo.readUInt8();

        return endpoint;
    }

    /**
     * Get the number of configured endpoints.
     * @returns uint8_t Number of configured endpoints.
     */
    async ezspGetEndpointCount(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_ENDPOINT_COUNT);
        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const count = this.buffalo.readUInt8();

        return count;
    }

    /**
     * Retrieve the endpoint description for the given endpoint number.
     * @param endpoint Endpoint number to get the description of.
     * @returns Description of this endpoint.
     */
    async ezspGetEndpointDescription(endpoint: number): Promise<EmberEndpointDescription> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_ENDPOINT_DESCRIPTION);
        sendBuffalo.writeUInt8(endpoint);
        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const endpointDescription = this.buffalo.readEmberEndpointDescription();

        return endpointDescription;
    }

    /**
     * Retrieve one of the cluster IDs associated with the given endpoint.
     * @param endpoint Endpoint number to get a cluster ID for.
     * @param listId Which list to get the cluster ID from.  (0 for input, 1 for output).
     * @param listIndex Index from requested list to look at the cluster ID of.
     * @returns ID of the requested cluster.
     */
    async ezspGetEndpointCluster(endpoint: number, listId: number, listIndex: number): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_ENDPOINT_CLUSTER);
        sendBuffalo.writeUInt8(endpoint);
        sendBuffalo.writeUInt8(listId);
        sendBuffalo.writeUInt8(listIndex);
        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const endpointCluster = this.buffalo.readUInt16();

        return endpointCluster;
    }

    //-----------------------------------------------------------------------------
    // Utilities Frames
    //-----------------------------------------------------------------------------
    /**
     * A command which does nothing. The Host can use this to set the sleep mode or to check the status of the NCP.
     */
    async ezspNop(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.NOP);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Variable length data from the Host is echoed back by the NCP.
     * This command has no other effects and is designed for testing the link between the Host and NCP.
     * @param data uint8_t * The data to be echoed back.
     * @returns uint8_t * The echo of the data.
     */
    async ezspEcho(data: Buffer): Promise<Buffer> {
        const sendBuffalo = this.startCommand(EzspFrameID.ECHO);
        sendBuffalo.writePayload(data);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const echo = this.buffalo.readPayload();

        if (echo.length > data.length) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        return echo;
    }

    /**
     * Allows the NCP to respond with a pending callback.
     */
    async ezspCallback(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.CALLBACK);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        this.callbackDispatch();
    }

    /**
     * Callback
     * Indicates that there are currently no pending callbacks.
     */
    ezspNoCallbacks(): void {
        logger.debug(`ezspNoCallbacks(): callback called`, NS);
    }

    /**
     * Sets a token (8 bytes of non-volatile storage) in the Simulated EEPROM of the NCP.
     * @param tokenId uint8_t Which token to set
     * @param tokenData uint8_t * The data to write to the token.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetToken(tokenId: number, tokenData: number[]): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_TOKEN);
        sendBuffalo.writeUInt8(tokenId);
        sendBuffalo.writeListUInt8(tokenData);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Retrieves a token (8 bytes of non-volatile storage) from the Simulated EEPROM of the NCP.
     * @param tokenId uint8_t Which token to read
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns uint8_t * The contents of the token.
     */
    async ezspGetToken(tokenId: number): Promise<[SLStatus, tokenData: number[]]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_TOKEN);
        sendBuffalo.writeUInt8(tokenId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const tokenData = this.buffalo.readListUInt8(8);

        return [status, tokenData];
    }

    /**
     * Retrieves a manufacturing token from the Flash Information Area of the NCP
     * (except for EZSP_STACK_CAL_DATA which is managed by the stack).
     * @param tokenId Which manufacturing token to read.
     * @returns uint8_t The length of the tokenData parameter in bytes.
     * @returns uint8_t * The manufacturing token data.
     */
    async ezspGetMfgToken(tokenId: EzspMfgTokenId): Promise<[number, tokenData: number[]]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_MFG_TOKEN);
        sendBuffalo.writeUInt8(tokenId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const tokenDataLength = this.buffalo.readUInt8();
        let expectedTokenDataLength: number = 0;

        // the size of corresponding the EZSP Mfg token, please refer to app/util/ezsp/ezsp-enum.h
        switch (tokenId) {
            // 2 bytes
            case EzspMfgTokenId.CUSTOM_VERSION:
            case EzspMfgTokenId.MANUF_ID:
            case EzspMfgTokenId.PHY_CONFIG:
            case EzspMfgTokenId.CTUNE:
                expectedTokenDataLength = 2;
                break;
            // 8 bytes
            case EzspMfgTokenId.EZSP_STORAGE:
            case EzspMfgTokenId.CUSTOM_EUI_64:
                expectedTokenDataLength = 8;
                break;
            // 16 bytes
            case EzspMfgTokenId.STRING:
            case EzspMfgTokenId.BOARD_NAME:
            case EzspMfgTokenId.BOOTLOAD_AES_KEY:
                expectedTokenDataLength = 16;
                break;
            // 20 bytes
            case EzspMfgTokenId.INSTALLATION_CODE:
                expectedTokenDataLength = 20;
                break;
            // 40 bytes
            case EzspMfgTokenId.ASH_CONFIG:
                expectedTokenDataLength = 40;
                break;
            // 92 bytes
            case EzspMfgTokenId.CBKE_DATA:
                expectedTokenDataLength = 92;
                break;
            default:
                break;
        }

        if (tokenDataLength != expectedTokenDataLength) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        const tokenData = this.buffalo.readListUInt8(tokenDataLength);

        return [tokenDataLength, tokenData];
    }

    /**
     * Sets a manufacturing token in the Customer Information Block (CIB) area of
     * the NCP if that token currently unset (fully erased). Cannot be used with
     * EZSP_STACK_CAL_DATA, EZSP_STACK_CAL_FILTER, EZSP_MFG_ASH_CONFIG, or
     * EZSP_MFG_CBKE_DATA token.
     * @param tokenId Which manufacturing token to set.
     * @param tokenData uint8_t * The manufacturing token data.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetMfgToken(tokenId: EzspMfgTokenId, tokenData: Buffer): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_MFG_TOKEN);
        sendBuffalo.writeUInt8(tokenId);
        sendBuffalo.writePayload(tokenData);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback invoked to inform the application that a stack token has changed.
     * @param tokenAddress uint16_t The address of the stack token that has changed.
     */
    ezspStackTokenChangedHandler(tokenAddress: number): void {
        logger.debug(`ezspStackTokenChangedHandler(): callback called with: [tokenAddress=${tokenAddress}]`, NS);
    }

    /**
     * Returns a pseudorandom number.
     * @returns Always returns SLStatus.OK.
     * @returns uint16_t * A pseudorandom number.
     */
    async ezspGetRandomNumber(): Promise<[SLStatus, value: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_RANDOM_NUMBER);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const value = this.buffalo.readUInt16();

        return [status, value];
    }

    /**
     * Sets a timer on the NCP. There are 2 independent timers available for use by the Host.
     * A timer can be cancelled by setting time to 0 or units to EMBER_EVENT_INACTIVE.
     * @param timerId uint8_t Which timer to set (0 or 1).
     * @param time uint16_t The delay before the timerHandler callback will be generated.
     *        Note that the timer clock is free running and is not synchronized with this command.
     *        This means that the actual delay will be between time and (time - 1). The maximum delay is 32767.
     * @param units The units for time.
     * @param repeat If true, a timerHandler callback will be generated repeatedly. If false, only a single timerHandler callback will be generated.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetTimer(timerId: number, time: number, units: EmberEventUnits, repeat: boolean): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_TIMER);
        sendBuffalo.writeUInt8(timerId);
        sendBuffalo.writeUInt16(time);
        sendBuffalo.writeUInt8(units);
        sendBuffalo.writeUInt8(repeat ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Gets information about a timer. The Host can use this command to find out how
     * much longer it will be before a previously set timer will generate a
     * callback.
     * @param timerId uint8_t Which timer to get information about (0 or 1).
     * @returns uint16_t The delay before the timerHandler callback will be generated.
     * @returns EmberEventUnits * The units for time.
     * @returns bool * True if a timerHandler callback will be generated repeatedly. False if only a single timerHandler callback will be generated.
     */
    async ezspGetTimer(timerId: number): Promise<[number, units: EmberEventUnits, repeat: boolean]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_TIMER);
        sendBuffalo.writeUInt8(timerId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const time = this.buffalo.readUInt16();
        const units = this.buffalo.readUInt8();
        const repeat = this.buffalo.readUInt8() !== 0;

        return [time, units, repeat];
    }

    /**
     * Callback
     * A callback from the timer.
     * @param timerId uint8_t Which timer generated the callback (0 or 1).
     */
    ezspTimerHandler(timerId: number): void {
        logger.debug(`ezspTimerHandler(): callback called with: [timerId=${timerId}]`, NS);
    }

    /**
     * Sends a debug message from the Host to the Network Analyzer utility via the NCP.
     * @param binaryMessage true if the message should be interpreted as binary data, false if the message should be interpreted as ASCII text.
     * @param messageContents uint8_t * The binary message.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspDebugWrite(binaryMessage: boolean, messageContents: Buffer): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.DEBUG_WRITE);
        sendBuffalo.writeUInt8(binaryMessage ? 1 : 0);
        sendBuffalo.writePayload(messageContents);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Retrieves and clears Ember counters. See the EmberCounterType enumeration for the counter types.
     * @returns uint16_t * A list of all counter values ordered according to the EmberCounterType enumeration.
     */
    async ezspReadAndClearCounters(): Promise<number[]> {
        const sendBuffalo = this.startCommand(EzspFrameID.READ_AND_CLEAR_COUNTERS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const values = this.buffalo.readListUInt16(EmberCounterType.COUNT);

        return values;
    }

    /**
     * Retrieves Ember counters. See the EmberCounterType enumeration for the counter types.
     * @returns uint16_t * A list of all counter values ordered according to the EmberCounterType enumeration.
     */
    async ezspReadCounters(): Promise<number[]> {
        const sendBuffalo = this.startCommand(EzspFrameID.READ_COUNTERS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const values = this.buffalo.readListUInt16(EmberCounterType.COUNT);

        return values;
    }

    /**
     * Callback
     * This call is fired when a counter exceeds its threshold
     * @param type Type of Counter
     */
    ezspCounterRolloverHandler(type: EmberCounterType): void {
        logger.debug(`ezspCounterRolloverHandler(): callback called with: [type=${EmberCounterType[type]}]`, NS);
        logger.info(`NCP Counter ${EmberCounterType[type]} rolled over.`, NS);
    }

    /**
     * Used to test that UART flow control is working correctly.
     * @param delay uint16_t Data will not be read from the host for this many milliseconds.
     */
    async ezspDelayTest(delay: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.DELAY_TEST);
        sendBuffalo.writeUInt16(delay);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * This retrieves the status of the passed library ID to determine if it is compiled into the stack.
     * @param libraryId The ID of the library being queried.
     * @returns The status of the library being queried.
     */
    async ezspGetLibraryStatus(libraryId: EmberLibraryId): Promise<EmberLibraryStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_LIBRARY_STATUS);
        sendBuffalo.writeUInt8(libraryId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt8();

        return status;
    }

    /**
     * Allows the HOST to know whether the NCP is running the XNCP library. If so,
     * the response contains also the manufacturer ID and the version number of the
     * XNCP application that is running on the NCP.
     * @returns
     * - SLStatus.OK if the NCP is running the XNCP library.
     * - SLStatus.INVALID_STATE otherwise.
     * @returns manufacturerId uint16_t * The manufactured ID the user has defined in the XNCP application.
     * @returns versionNumber uint16_t * The version number of the XNCP application.
     */
    async ezspGetXncpInfo(): Promise<[SLStatus, manufacturerId: number, versionNumber: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_XNCP_INFO);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const manufacturerId = this.buffalo.readUInt16();
        const versionNumber = this.buffalo.readUInt16();

        return [status, manufacturerId, versionNumber];
    }

    /**
     * Provides the customer a custom EZSP frame. On the NCP, these frames are only
     * handled if the XNCP library is included. On the NCP side these frames are
     * handled in the emberXNcpIncomingCustomEzspMessageCallback() callback
     * function.
     * @param uint8_t * The payload of the custom frame (maximum 119 bytes).
     * @param uint8_t The expected length of the response.
     * @returns The status returned by the custom command.
     * @returns uint8_t *The response.
     */
    async ezspCustomFrame(payload: Buffer, replyLength: number): Promise<[SLStatus, outReply: Buffer]> {
        const sendBuffalo = this.startCommand(EzspFrameID.CUSTOM_FRAME);
        sendBuffalo.writePayload(payload);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const reply = this.buffalo.readPayload();

        if (reply.length > replyLength) {
            throw new EzspError(EzspStatus.ERROR_INVALID_VALUE);
        }

        return [status, reply];
    }

    /**
     * Callback
     * A callback indicating a custom EZSP message has been received.
     * @param payload uint8_t * The payload of the custom frame.
     */
    ezspCustomFrameHandler(payload: Buffer): void {
        logger.debug(`ezspCustomFrameHandler(): callback called with: [payload=${payload.toString('hex')}]`, NS);
    }

    /**
     * Returns the EUI64 ID of the local node.
     * @returns The 64-bit ID.
     */
    async ezspGetEui64(): Promise<EUI64> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_EUI64);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const eui64 = this.buffalo.readIeeeAddr();

        return eui64;
    }

    /**
     * Returns the 16-bit node ID of the local node.
     * @returns The 16-bit ID.
     */
    async ezspGetNodeId(): Promise<NodeId> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_NODE_ID);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const nodeId = this.buffalo.readUInt16();

        return nodeId;
    }

    /**
     * Returns number of phy interfaces present.
     * @returns uint8_t Value indicate how many phy interfaces present.
     */
    async ezspGetPhyInterfaceCount(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_PHY_INTERFACE_COUNT);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const interfaceCount = this.buffalo.readUInt8();

        return interfaceCount;
    }

    /**
     * Returns the entropy source used for true random number generation.
     * @returns Value indicates the used entropy source.
     */
    async ezspGetTrueRandomEntropySource(): Promise<EmberEntropySource> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_TRUE_RANDOM_ENTROPY_SOURCE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const entropySource = this.buffalo.readUInt8();

        return entropySource;
    }

    /**
     * Extend a joiner's timeout to wait for the network key on the joiner default key timeout is 3 sec,
     * and only values greater equal to 3 sec are accepted.
     * @param networkKeyTimeoutS Network key timeout
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetupDelayedJoin(networkKeyTimeoutS: number): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SETUP_DELAYED_JOIN);
        sendBuffalo.writeUInt8(networkKeyTimeoutS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Get the current scheduler priorities for multiprotocol apps.
     * @returns The current priorities.
     */
    async ezspRadioGetSchedulerPriorities(): Promise<Ember802154RadioPriorities | EmberMultiprotocolPriorities> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.RADIO_GET_SCHEDULER_PRIORITIES);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const priorities = this.version < 0x10 ? this.buffalo.readEmberMultiprotocolPriorities() : this.buffalo.readEmber802154RadioPriorities();

        return priorities;
    }

    /**
     * Set the current scheduler priorities for multiprotocol apps.
     * @param priorities The current priorities.
     */
    async ezspRadioSetSchedulerPriorities(priorities: Ember802154RadioPriorities | EmberMultiprotocolPriorities): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.RADIO_SET_SCHEDULER_PRIORITIES);

        if (this.version < 0x10) {
            sendBuffalo.writeEmberMultiprotocolPriorities(priorities as EmberMultiprotocolPriorities);
        } else {
            sendBuffalo.writeEmber802154RadioPriorities(priorities as Ember802154RadioPriorities);
        }

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Get the current multiprotocol sliptime
     * @returns Value of the current slip time.
     */
    async ezspRadioGetSchedulerSliptime(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.RADIO_GET_SCHEDULER_SLIPTIME);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const slipTime = this.buffalo.readUInt32();

        return slipTime;
    }

    /**
     * Set the current multiprotocol sliptime
     * @param slipTime Value of the current slip time.
     */
    async ezspRadioSetSchedulerSliptime(slipTime: number): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.RADIO_SET_SCHEDULER_SLIPTIME);
        sendBuffalo.writeUInt32(slipTime);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Check if a particular counter is one that could report from either a 2.4GHz or sub-GHz interface.
     * @param counter The counter to be checked.
     * @returns Whether this counter requires a PHY index when operating on a dual-PHY system.
     */
    async ezspCounterRequiresPhyIndex(counter: EmberCounterType): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.COUNTER_REQUIRES_PHY_INDEX);
        sendBuffalo.writeUInt8(counter);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const requires = this.buffalo.readUInt8() !== 0;

        return requires;
    }

    /**
     * Check if a particular counter can report on the destination node ID they have been triggered from.
     * @param counter The counter to be checked.
     * @returns Whether this counter requires the destination node ID.
     */
    async ezspCounterRequiresDestinationNodeId(counter: EmberCounterType): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.COUNTER_REQUIRES_DESTINATION_NODE_ID);
        sendBuffalo.writeUInt8(counter);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const requires = this.buffalo.readUInt8() !== 0;

        return requires;
    }

    //-----------------------------------------------------------------------------
    // Networking Frames
    //-----------------------------------------------------------------------------

    /**
     * Sets the manufacturer code to the specified value.
     * The manufacturer code is one of the fields of the node descriptor.
     * @param code uint16_t The manufacturer code for the local node.
     */
    async ezspSetManufacturerCode(code: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_MANUFACTURER_CODE);
        sendBuffalo.writeUInt16(code);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Gets the manufacturer code to the specified value.
     * The manufacturer code is one of the fields of the node descriptor.
     * @returns The manufacturer code for the local node.
     */
    async ezspGetManufacturerCode(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_MANUFACTURER_CODE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const code = this.buffalo.readUInt16();

        return code;
    }

    /**
     * Sets the power descriptor to the specified value. The power descriptor is a
     * dynamic value. Therefore, you should call this function whenever the value
     * changes.
     * @param descriptor uint16_t The new power descriptor for the local node.
     * @returns An SLStatus value indicating success or the reason for failure. Always `OK` in v13-.
     */
    async ezspSetPowerDescriptor(descriptor: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_POWER_DESCRIPTOR);
        sendBuffalo.writeUInt16(descriptor);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            return SLStatus.OK;
        } else {
            const status = this.buffalo.readUInt32();

            return status;
        }
    }

    /**
     * Resume network operation after a reboot. The node retains its original type.
     * This should be called on startup whether or not the node was previously part
     * of a network. EMBER_NOT_JOINED is returned if the node is not part of a
     * network. This command accepts options to control the network initialization.
     * @param networkInitStruct EmberNetworkInitStruct * An EmberNetworkInitStruct containing the options for initialization.
     * @returns
     * - SLStatus.OK if successful initialization,
     * - SLStatus.NOT_JOINED if the node is not part of a network
     * - or the reason for failure.
     */
    async ezspNetworkInit(networkInitStruct: EmberNetworkInitStruct): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.NETWORK_INIT);
        sendBuffalo.writeEmberNetworkInitStruct(networkInitStruct);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Returns a value indicating whether the node is joining, joined to, or leaving a network.
     * @returns Command send status.
     * @returns An EmberNetworkStatus value indicating the current join status.
     */
    async ezspNetworkState(): Promise<EmberNetworkStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.NETWORK_STATE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt8();

        return status;
    }

    /**
     * Callback
     * A callback invoked when the status of the stack changes. If the status
     * parameter equals EMBER_NETWORK_UP, then the getNetworkParameters command can
     * be called to obtain the new network parameters. If any of the parameters are
     * being stored in nonvolatile memory by the Host, the stored values should be
     * updated.
     * @param status Stack status
     */
    ezspStackStatusHandler(status: SLStatus): void {
        logger.debug(`ezspStackStatusHandler(): callback called with: [status=${SLStatus[status]}]`, NS);

        this.emit('stackStatus', status);
    }

    /**
     * This function will start a scan.
     * @param scanType Indicates the type of scan to be performed. Possible values are: EZSP_ENERGY_SCAN and EZSP_ACTIVE_SCAN.
     *        For each type, the respective callback for reporting results is: energyScanResultHandler and networkFoundHandler.
     *        The energy scan and active scan report errors and completion via the scanCompleteHandler.
     * @param channelMask uint32_t Bits set as 1 indicate that this particular channel should be scanned.
     *        Bits set to 0 indicate that this particular channel should not be scanned. For example, a channelMask value of 0x00000001
     *        would indicate that only channel 0 should be scanned. Valid channels range from 11 to 26 inclusive.
     *        This translates to a channel mask value of 0x07FFF800.
     *        As a convenience, a value of 0 is reinterpreted as the mask for the current channel.
     * @param duration uint8_t Sets the exponent of the number of scan periods, where a scan period is 960 symbols.
     *        The scan will occur for ((2^duration) + 1) scan periods.
     * @returns
     * - SLStatus.OK signals that the scan successfully started. Possible error responses and their meanings:
     * - SLStatus.MAC_SCANNING, we are already scanning;
     * - SLStatus.BAD_SCAN_DURATION, we have set a duration value that is not 0..14 inclusive;
     * - SLStatus.MAC_INCORRECT_SCAN_TYPE, we have requested an undefined scanning type;
     * - SLStatus.INVALID_CHANNEL_MASK, our channel mask did not specify any valid channels.
     */
    async ezspStartScan(scanType: EzspNetworkScanType, channelMask: number, duration: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.START_SCAN);
        sendBuffalo.writeUInt8(scanType);
        sendBuffalo.writeUInt32(channelMask);
        sendBuffalo.writeUInt8(duration);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status: SLStatus = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Callback
     * Reports the result of an energy scan for a single channel. The scan is not
     * complete until the scanCompleteHandler callback is called.
     * @param channel uint8_t The 802.15.4 channel number that was scanned.
     * @param maxRssiValue int8_t The maximum RSSI value found on the channel.
     */
    ezspEnergyScanResultHandler(channel: number, maxRssiValue: number): void {
        logger.debug(`ezspEnergyScanResultHandler(): callback called with: [channel=${channel}], [maxRssiValue=${maxRssiValue}]`, NS);
        logger.info(`Energy scan for channel ${channel} reports max RSSI value at ${maxRssiValue} dBm.`, NS);
    }

    /**
     * Callback
     * Reports that a network was found as a result of a prior call to startScan.
     * Gives the network parameters useful for deciding which network to join.
     * @param networkFound EmberZigbeeNetwork * The parameters associated with the network found.
     * @param lastHopLqi uint8_t The link quality from the node that generated this beacon.
     * @param lastHopRssi int8_t The energy level (in units of dBm) observed during the reception.
     */
    ezspNetworkFoundHandler(networkFound: EmberZigbeeNetwork, lastHopLqi: number, lastHopRssi: number): void {
        logger.debug(
            () =>
                `ezspNetworkFoundHandler(): callback called with: [networkFound=${JSON.stringify(networkFound)}], [lastHopLqi=${lastHopLqi}], [lastHopRssi=${lastHopRssi}]`,
            NS,
        );
    }

    /**
     * Callback
     * @param channel uint8_t The channel on which the current error occurred. Undefined for the case of EMBER_SUCCESS.
     * @param status The error condition that occurred on the current channel. Value will be SLStatus.OK when the scan has completed.
     *               Other error conditions signify a failure to scan on the channel specified.
     */
    ezspScanCompleteHandler(channel: number, status: SLStatus): void {
        logger.debug(`ezspScanCompleteHandler(): callback called with: [channel=${channel}], [status=${SLStatus[status]}]`, NS);
    }

    /**
     * Callback
     * This function returns an unused panID and channel pair found via the find
     * unused panId scan procedure.
     * @param panId The unused panID which has been found.
     * @param channel uint8_t The channel that the unused panID was found on.
     */
    ezspUnusedPanIdFoundHandler(panId: PanId, channel: number): void {
        logger.debug(`ezspUnusedPanIdFoundHandler(): callback called with: [panId=${panId}], [channel=${channel}]`, NS);
    }

    /**
     * This function starts a series of scans which will return an available panId.
     * @param channelMask uint32_t The channels that will be scanned for available panIds.
     * @param duration uint8_t The duration of the procedure.
     * @returns The error condition that occurred during the scan. Value will be SLStatus.OK if there are no errors.
     */
    async ezspFindUnusedPanId(channelMask: number, duration: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.FIND_UNUSED_PAN_ID);
        sendBuffalo.writeUInt32(channelMask);
        sendBuffalo.writeUInt8(duration);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Terminates a scan in progress.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspStopScan(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.STOP_SCAN);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Forms a new network by becoming the coordinator.
     * @param parameters EmberNetworkParameters * Specification of the new network.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspFormNetwork(parameters: EmberNetworkParameters): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.FORM_NETWORK);
        sendBuffalo.writeEmberNetworkParameters(parameters);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Causes the stack to associate with the network using the specified network
     * parameters. It can take several seconds for the stack to associate with the
     * local network. Do not send messages until the stackStatusHandler callback
     * informs you that the stack is up.
     * @param nodeType Specification of the role that this node will have in the network.
     *        This role must not be EMBER_COORDINATOR. To be a coordinator, use the formNetwork command.
     * @param parameters EmberNetworkParameters * Specification of the network with which the node should associate.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspJoinNetwork(nodeType: EmberNodeType, parameters: EmberNetworkParameters): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.JOIN_NETWORK);
        sendBuffalo.writeUInt8(nodeType);
        sendBuffalo.writeEmberNetworkParameters(parameters);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Causes the stack to associate with the network using the specified network
     * parameters in the beacon parameter. It can take several seconds for the stack
     * to associate with the local network. Do not send messages until the
     * stackStatusHandler callback informs you that the stack is up. Unlike
     * ::emberJoinNetwork(), this function does not issue an active scan before
     * joining. Instead, it will cause the local node to issue a MAC Association
     * Request directly to the specified target node. It is assumed that the beacon
     * parameter is an artifact after issuing an active scan. (For more information,
     * see emberGetBestBeacon and emberGetNextBeacon.)
     * @param localNodeType Specifies the role that this node will have in the network. This role must not be EMBER_COORDINATOR.
     *        To be a coordinator, use the formNetwork command.
     * @param beacon EmberBeaconData * Specifies the network with which the node should associate.
     * @param radioTxPower int8_t The radio transmit power to use, specified in dBm.
     * @param clearBeaconsAfterNetworkUp If true, clear beacons in cache upon join success. If join fail, do nothing.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspJoinNetworkDirectly(
        localNodeType: EmberNodeType,
        beacon: EmberBeaconData,
        radioTxPower: number,
        clearBeaconsAfterNetworkUp: boolean,
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.JOIN_NETWORK_DIRECTLY);
        sendBuffalo.writeUInt8(localNodeType);
        sendBuffalo.writeEmberBeaconData(beacon);
        sendBuffalo.writeInt8(radioTxPower);
        sendBuffalo.writeUInt8(clearBeaconsAfterNetworkUp ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Causes the stack to leave the current network. This generates a
     * stackStatusHandler callback to indicate that the network is down. The radio
     * will not be used until after sending a formNetwork or joinNetwork command.
     * @param options This parameter gives options when leave network
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspLeaveNetwork(options: EmberLeaveNetworkOption = EmberLeaveNetworkOption.WITH_NO_OPTION): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.LEAVE_NETWORK);

        if (this.version >= 0x0e) {
            sendBuffalo.writeUInt8(options);
        }

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * The application may call this function when contact with the network has been
     * lost. The most common usage case is when an end device can no longer
     * communicate with its parent and wishes to find a new one. Another case is
     * when a device has missed a Network Key update and no longer has the current
     * Network Key.  The stack will call ezspStackStatusHandler to indicate that the
     * network is down, then try to re-establish contact with the network by
     * performing an active scan, choosing a network with matching extended pan id,
     * and sending a ZigBee network rejoin request. A second call to the
     * ezspStackStatusHandler callback indicates either the success or the failure
     * of the attempt. The process takes approximately 150 milliseconds per channel
     * to complete.
     * @param haveCurrentNetworkKey This parameter tells the stack whether to try to use the current network key.
     *        If it has the current network key it will perform a secure rejoin (encrypted). If this fails the device should try an unsecure rejoin.
     *        If the Trust Center allows the rejoin then the current Network Key will be sent encrypted using the device's Link Key.
     * @param channelMask uint32_t A mask indicating the channels to be scanned. See emberStartScan for format details.
     *        A value of 0 is reinterpreted as the mask for the current channel.
     * @param reason uint8_t A sl_zigbee_rejoin_reason_t variable which could be passed in if there is actually a reason for rejoin,
     *        or could be left at 0xFF
     * @param nodeType uint8_t The rejoin could be triggered with a different nodeType.
     *        This value could be set to 0 or SL_ZIGBEE_DEVICE_TYPE_UNCHANGED if not needed.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspFindAndRejoinNetwork(
        haveCurrentNetworkKey: boolean,
        channelMask: number,
        reason: number = 0xff,
        nodeType: number = 0,
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.FIND_AND_REJOIN_NETWORK);
        sendBuffalo.writeUInt8(haveCurrentNetworkKey ? 1 : 0);
        sendBuffalo.writeUInt32(channelMask);

        if (this.version >= 0x0e) {
            sendBuffalo.writeUInt8(reason);
            sendBuffalo.writeUInt8(nodeType);
        }

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Tells the stack to allow other nodes to join the network with this node as
     * their parent. Joining is initially disabled by default.
     * @param duration uint8_t A value of 0x00 disables joining. A value of 0xFF enables joining.
     *        Any other value enables joining for that number of seconds.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspPermitJoining(duration: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.PERMIT_JOINING);
        sendBuffalo.writeUInt8(duration);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * Indicates that a child has joined or left.
     * @param index uint8_t The index of the child of interest.
     * @param joining True if the child is joining. False the child is leaving.
     * @param childId The node ID of the child.
     * @param childEui64 The EUI64 of the child.
     * @param childType The node type of the child.
     */
    ezspChildJoinHandler(index: number, joining: boolean, childId: NodeId, childEui64: EUI64, childType: EmberNodeType): void {
        logger.debug(
            `ezspChildJoinHandler(): callback called with: [index=${index}], [joining=${joining}], [childId=${childId}], [childEui64=${childEui64}], [childType=${childType}]`,
            NS,
        );
    }

    /**
     * Sends a ZDO energy scan request. This request may only be sent by the current
     * network manager and must be unicast, not broadcast. See ezsp-utils.h for
     * related macros emberSetNetworkManagerRequest() and
     * emberChangeChannelRequest().
     * @param target The network address of the node to perform the scan.
     * @param scanChannels uint32_t A mask of the channels to be scanned
     * @param scanDuration uint8_t How long to scan on each channel.
     *        Allowed values are 0..5, with the scan times as specified by 802.15.4 (0 = 31ms, 1 = 46ms, 2 = 77ms, 3 = 138ms, 4 = 261ms, 5 = 507ms).
     * @param scanCount uint16_t The number of scans to be performed on each channel (1..8).
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspEnergyScanRequest(target: NodeId, scanChannels: number, scanDuration: number, scanCount: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.ENERGY_SCAN_REQUEST);
        sendBuffalo.writeUInt16(target);
        sendBuffalo.writeUInt32(scanChannels);
        sendBuffalo.writeUInt8(scanDuration);
        sendBuffalo.writeUInt16(scanCount);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Returns the current network parameters.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns EmberNodeType * An EmberNodeType value indicating the current node type.
     * @returns EmberNetworkParameters * The current network parameters.
     */
    async ezspGetNetworkParameters(): Promise<[SLStatus, nodeType: EmberNodeType, parameters: EmberNetworkParameters]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_NETWORK_PARAMETERS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const nodeType = this.buffalo.readUInt8();
        const parameters = this.buffalo.readEmberNetworkParameters();

        return [status, nodeType, parameters];
    }

    /**
     * Returns the current radio parameters based on phy index.
     * @param phyIndex uint8_t Desired index of phy interface for radio parameters.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns EmberMultiPhyRadioParameters * The current radio parameters based on provided phy index.
     */
    async ezspGetRadioParameters(phyIndex: number): Promise<[SLStatus, parameters: EmberMultiPhyRadioParameters]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_RADIO_PARAMETERS);
        sendBuffalo.writeUInt8(phyIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const parameters = this.buffalo.readEmberMultiPhyRadioParameters();

        return [status, parameters];
    }

    /**
     * Returns information about the children of the local node and the parent of
     * the local node.
     * @returns uint8_t The number of children the node currently has.
     * @returns The parent's EUI64. The value is undefined for nodes without parents (coordinators and nodes that are not joined to a network).
     * @returns NodeId * The parent's node ID. The value is undefined for nodes without parents
     *          (coordinators and nodes that are not joined to a network).
     */
    async ezspGetParentChildParameters(): Promise<[number, parentEui64: EUI64, parentNodeId: NodeId]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_PARENT_CHILD_PARAMETERS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const childCount = this.buffalo.readUInt8();
        const parentEui64 = this.buffalo.readIeeeAddr();
        const parentNodeId = this.buffalo.readUInt16();

        return [childCount, parentEui64, parentNodeId];
    }

    /**
     * Return the number of router children that the node currently has.
     * @returns The number of router children.
     */
    async ezspRouterChildCount(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.ROUTER_CHILD_COUNT);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const routerChildCount = this.buffalo.readUInt8();

        return routerChildCount;
    }

    /**
     * Return the maximum number of children for this node.
     * The return value is undefined for nodes that are not joined to a network.
     * @returns The maximum number of children.
     */
    async ezspMaxChildCount(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.MAX_CHILD_COUNT);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const maxChildCount = this.buffalo.readUInt8();

        return maxChildCount;
    }

    /**
     * Return the maximum number of router children for this node.
     * The return value is undefined for nodes that are not joined to a network.
     * @returns The maximum number of router children.
     */
    async ezspMaxRouterChildCount(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.MAX_ROUTER_CHILD_COUNT);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const maxRouterChildCount = this.buffalo.readUInt8();

        return maxRouterChildCount;
    }

    /**
     *
     * @returns
     */
    async ezspGetParentIncomingNwkFrameCounter(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_PARENT_INCOMING_NWK_FRAME_COUNTER);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const parentIncomingNwkFrameCounter = this.buffalo.readUInt32();

        return parentIncomingNwkFrameCounter;
    }

    /**
     *
     * @param value uint32_t
     * @returns
     */
    async ezspSetParentIncomingNwkFrameCounter(value: number): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_PARENT_INCOMING_NWK_FRAME_COUNTER);
        sendBuffalo.writeUInt32(value);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Return a bitmask indicating the stack's current tasks.
     * The mask ::SL_ZIGBEE_HIGH_PRIORITY_TASKS defines which tasks are high priority.
     * Devices should not sleep if any high priority tasks are active.
     * Active tasks that are not high priority are waiting for messages to arrive from other devices.
     * If there are active tasks, but no high priority ones, the device may sleep but should periodically wake up
     * and call ::emberPollForData() in order to receive messages.
     * Parents will hold messages for ::SL_ZIGBEE_INDIRECT_TRANSMISSION_TIMEOUT milliseconds before discarding them.
     * @returns A bitmask of the stack's active tasks.
     */
    async ezspCurrentStackTasks(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.CURRENT_STACK_TASKS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const activeTasks = this.buffalo.readUInt16();

        return activeTasks;
    }

    /**
     * Indicate whether the stack is currently in a state where there are no high-priority tasks, allowing the device to sleep.
     * There may be tasks expecting incoming messages, in which case the device should periodically wake up
     * and call ::emberPollForData() in order to receive messages.
     * This function can only be called when the node type is ::SL_ZIGBEE_SLEEPY_END_DEVICE
     * @returns True if the application may sleep but the stack may be expecting incoming messages.
     */
    async ezspOkToNap(): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.OK_TO_NAP);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const value = this.buffalo.readUInt8() !== 0;

        return value;
    }

    /**
     * Indicate whether the parent token has been set by association.
     * @returns True if the parent token has been set.
     */
    async ezspParentTokenSet(): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.PARENT_TOKEN_SET);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const indicator = this.buffalo.readUInt8() !== 0;

        return indicator;
    }

    /**
     * Indicate whether the stack currently has any tasks pending.
     * If no tasks are pending, ::emberTick() does not need to be called until the next time a stack API function is called.
     * This function can only be called when the node type is ::SL_ZIGBEE_SLEEPY_END_DEVICE.
     * @returns True if the application may sleep for as long as it wishes.
     */
    async ezspOkToHibernate(): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.OK_TO_HIBERNATE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const indicator = this.buffalo.readUInt8() !== 0;

        return indicator;
    }

    /**
     * Indicate whether the stack is currently in a state that does not require the application to periodically poll.
     * @returns True if the device may poll less frequently.
     */
    async ezspOkToLongPoll(): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.OK_TO_LONG_POLL);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const indicator = this.buffalo.readUInt8() !== 0;

        return indicator;
    }

    /**
     * Calling this function will render all other stack functions except ezspStackPowerUp() non-functional until the radio is powered back on.
     */
    async ezspStackPowerDown(): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.STACK_POWER_DOWN);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Initialize the radio. Typically called coming out of deep sleep.
     * For non-sleepy devices, also turns the radio on and leaves it in RX mode.
     */
    async ezspStackPowerUp(): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.STACK_POWER_UP);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Returns information about a child of the local node.
     * @param uint8_t The index of the child of interest in the child table. Possible indexes range from zero to EMBER_CHILD_TABLE_SIZE.
     * @returns
     * - SLStatus.OK if there is a child at index.
     * - SLStatus.NOT_JOINED if there is no child at index.
     * @returns EmberChildData * The data of the child.
     */
    async ezspGetChildData(index: number): Promise<[SLStatus, childData: EmberChildData]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_CHILD_DATA);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const childData = this.buffalo.readEmberChildData();

        return [status, childData];
    }

    /**
     * Sets child data to the child table token.
     * @param index uint8_t The index of the child of interest in the child table. Possible indexes range from zero to (EMBER_CHILD_TABLE_SIZE - 1).
     * @param childData EmberChildData * The data of the child.
     * @returns
     * - SLStatus.OK if the child data is set successfully at index.
     * - SLStatus.INVALID_INDEX if provided index is out of range.
     */
    async ezspSetChildData(index: number, childData: EmberChildData): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_CHILD_DATA);
        sendBuffalo.writeUInt8(index);
        sendBuffalo.writeEmberChildData(childData);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Convert a child index to a node ID
     * @param childIndex uint8_t The index of the child of interest in the child table. Possible indexes range from zero to EMBER_CHILD_TABLE_SIZE.
     * @returns The node ID of the child or EMBER_NULL_NODE_ID if there isn't a child at the childIndex specified
     */
    async ezspChildId(childIndex: number): Promise<NodeId> {
        const sendBuffalo = this.startCommand(EzspFrameID.CHILD_ID);
        sendBuffalo.writeUInt8(childIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const childId: NodeId = this.buffalo.readUInt16();

        return childId;
    }

    /**
     * Return radio power value of the child from the given childIndex
     * @param childIndex uint8_t The index of the child of interest in the child table.
     *        Possible indexes range from zero to SL_ZIGBEE_CHILD_TABLE_SIZE.
     * @returns The power of the child or maximum radio power, which is the power value provided by the user
     *          while forming/joining a network if there isn't a child at the childIndex specified
     */
    async ezspChilPower(childIndex: number): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.CHILD_POWER);
        sendBuffalo.writeUInt8(childIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const childPower = this.buffalo.readInt8();

        return childPower;
    }

    /**
     * Set the radio power value for a given child index.
     * @param childIndex uint8_t
     * @param newPower int8_t
     */
    async ezspSetChildPower(childIndex: number, newPower: number): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_CHILD_POWER);
        sendBuffalo.writeUInt8(childIndex);
        sendBuffalo.writeInt8(newPower);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Convert a node ID to a child index
     * @param childId The node ID of the child
     * @returns uint8_t The child index or 0xFF if the node ID doesn't belong to a child
     */
    async ezspChildIndex(childId: NodeId): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.CHILD_INDEX);
        sendBuffalo.writeUInt16(childId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const childIndex = this.buffalo.readUInt8();

        return childIndex;
    }

    /**
     * Returns the source route table total size.
     * @returns uint8_t Total size of source route table.
     */
    async ezspGetSourceRouteTableTotalSize(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_SOURCE_ROUTE_TABLE_TOTAL_SIZE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const sourceRouteTableTotalSize = this.buffalo.readUInt8();

        return sourceRouteTableTotalSize;
    }

    /**
     * Returns the number of filled entries in source route table.
     * @returns uint8_t The number of filled entries in source route table.
     */
    async ezspGetSourceRouteTableFilledSize(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_SOURCE_ROUTE_TABLE_FILLED_SIZE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const sourceRouteTableFilledSize = this.buffalo.readUInt8();

        return sourceRouteTableFilledSize;
    }

    /**
     * Returns information about a source route table entry
     * @param index uint8_t The index of the entry of interest in the source route table.
     *        Possible indexes range from zero to SOURCE_ROUTE_TABLE_FILLED_SIZE.
     * @returns
     * - SLStatus.OK if there is source route entry at index.
     * - SLStatus.NOT_FOUND if there is no source route at index.
     * @returns NodeId * The node ID of the destination in that entry.
     * @returns uint8_t * The closer node index for this source route table entry
     */
    async ezspGetSourceRouteTableEntry(index: number): Promise<[SLStatus, destination: NodeId, closerIndex: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_SOURCE_ROUTE_TABLE_ENTRY);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const destination = this.buffalo.readUInt16();
        const closerIndex = this.buffalo.readUInt8();

        return [status, destination, closerIndex];
    }

    /**
     * Returns the neighbor table entry at the given index. The number of active
     * neighbors can be obtained using the neighborCount command.
     * @param index uint8_t The index of the neighbor of interest. Neighbors are stored in ascending order by node id,
     *        with all unused entries at the end of the table.
     * @returns
     * - SLStatus.FAIL if the index is greater or equal to the number of active neighbors, or if the device is an end device.
     * - SLStatus.OK otherwise.
     * @returns EmberNeighborTableEntry * The contents of the neighbor table entry.
     */
    async ezspGetNeighbor(index: number): Promise<[SLStatus, value: EmberNeighborTableEntry]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_NEIGHBOR);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const value = this.buffalo.readEmberNeighborTableEntry();

        return [status, value];
    }

    /**
     * Return EmberStatus depending on whether the frame counter of the node is
     * found in the neighbor or child table. This function gets the last received
     * frame counter as found in the Network Auxiliary header for the specified
     * neighbor or child
     * @param eui64 eui64 of the node
     * @returns
     * - SLStatus.NOT_FOUND if the node is not found in the neighbor or child table.
     * - SLStatus.OK otherwise
     * @returns uint32_t * Return the frame counter of the node from the neighbor or child table
     */
    async ezspGetNeighborFrameCounter(eui64: EUI64): Promise<[SLStatus, returnFrameCounter: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_NEIGHBOR_FRAME_COUNTER);
        sendBuffalo.writeIeeeAddr(eui64);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const returnFrameCounter = this.buffalo.readUInt32();

        return [status, returnFrameCounter];
    }

    /**
     * Sets the frame counter for the neighbour or child.
     * @param eui64 eui64 of the node
     * @param frameCounter uint32_t Return the frame counter of the node from the neighbor or child table
     * @returns
     * - SLStatus.NOT_FOUND if the node is not found in the neighbor or child table.
     * - SLStatus.OK otherwise
     */
    async ezspSetNeighborFrameCounter(eui64: EUI64, frameCounter: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_NEIGHBOR_FRAME_COUNTER);
        sendBuffalo.writeIeeeAddr(eui64);
        sendBuffalo.writeUInt32(frameCounter);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sets the routing shortcut threshold to directly use a neighbor instead of
     * performing routing.
     * @param costThresh uint8_t The routing shortcut threshold to configure.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetRoutingShortcutThreshold(costThresh: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_ROUTING_SHORTCUT_THRESHOLD);
        sendBuffalo.writeUInt8(costThresh);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Gets the routing shortcut threshold used to differentiate between directly
     * using a neighbor vs. performing routing.
     * @returns uint8_t The routing shortcut threshold
     */
    async ezspGetRoutingShortcutThreshold(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_ROUTING_SHORTCUT_THRESHOLD);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const routingShortcutThresh = this.buffalo.readUInt8();

        return routingShortcutThresh;
    }

    /**
     * Returns the number of active entries in the neighbor table.
     * @returns uint8_t The number of active entries in the neighbor table.
     */
    async ezspNeighborCount(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.NEIGHBOR_COUNT);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const value = this.buffalo.readUInt8();

        return value;
    }

    /**
     * Returns the route table entry at the given index. The route table size can be
     * obtained using the getConfigurationValue command.
     * @param index uint8_t The index of the route table entry of interest.
     * @returns
     * - SLStatus.FAIL if the index is out of range or the device is an end
     * - SLStatus.OK otherwise.
     * @returns EmberRouteTableEntry * The contents of the route table entry.
     */
    async ezspGetRouteTableEntry(index: number): Promise<[SLStatus, value: EmberRouteTableEntry]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_ROUTE_TABLE_ENTRY);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const value = this.buffalo.readEmberRouteTableEntry();

        return [status, value];
    }

    /**
     * Sets the radio output power at which a node is operating. Ember radios have
     * discrete power settings. For a list of available power settings, see the
     * technical specification for the RF communication module in your Developer
     * Kit. Note: Care should be taken when using this API on a running network, as
     * it will directly impact the established link qualities neighboring nodes have
     * with the node on which it is called. This can lead to disruption of existing
     * routes and erratic network behavior.
     * @param power int8_t Desired radio output power, in dBm.
     * @returns An SLStatus value indicating the success or failure of the command.
     */
    async ezspSetRadioPower(power: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_RADIO_POWER);
        sendBuffalo.writeInt8(power);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sets the channel to use for sending and receiving messages. For a list of
     * available radio channels, see the technical specification for the RF
     * communication module in your Developer Kit. Note: Care should be taken when
     * using this API, as all devices on a network must use the same channel.
     * @param channel uint8_t Desired radio channel.
     * @returns An SLStatus value indicating the success or failure of the command.
     */
    async ezspSetRadioChannel(channel: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_RADIO_CHANNEL);
        sendBuffalo.writeUInt8(channel);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Gets the channel in use for sending and receiving messages.
     * @returns uint8_t Current radio channel.
     */
    async ezspGetRadioChannel(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_RADIO_CHANNEL);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const channel = this.buffalo.readUInt8();

        return channel;
    }

    /**
     * Set the configured 802.15.4 CCA mode in the radio.
     * @param ccaMode uint8_t A RAIL_IEEE802154_CcaMode_t value.
     * @returns An SLStatus value indicating the success or failure of the command.
     */
    async ezspSetRadioIeee802154CcaMode(ccaMode: IEEE802154CcaMode): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_RADIO_IEEE802154_CCA_MODE);
        sendBuffalo.writeUInt8(ccaMode);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Enable/disable concentrator support.
     * @param on If this bool is true the concentrator support is enabled. Otherwise is disabled.
     *        If this bool is false all the other arguments are ignored.
     * @param concentratorType uint16_t Must be either EMBER_HIGH_RAM_CONCENTRATOR or EMBER_LOW_RAM_CONCENTRATOR.
     *        The former is used when the caller has enough memory to store source routes for the whole network.
     *        In that case, remote nodes stop sending route records once the concentrator has successfully received one.
     *        The latter is used when the concentrator has insufficient RAM to store all outbound source routes.
     *        In that case, route records are sent to the concentrator prior to every inbound APS unicast.
     * @param minTime uint16_t The minimum amount of time that must pass between MTORR broadcasts.
     * @param maxTime uint16_t The maximum amount of time that can pass between MTORR broadcasts.
     * @param routeErrorThreshold uint8_t The number of route errors that will trigger a re-broadcast of the MTORR.
     * @param deliveryFailureThreshold uint8_t The number of APS delivery failures that will trigger a re-broadcast of the MTORR.
     * @param maxHops uint8_t The maximum number of hops that the MTORR broadcast will be allowed to have.
     *        A value of 0 will be converted to the EMBER_MAX_HOPS value set by the stack.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetConcentrator(
        on: boolean,
        concentratorType: number,
        minTime: number,
        maxTime: number,
        routeErrorThreshold: number,
        deliveryFailureThreshold: number,
        maxHops: number,
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_CONCENTRATOR);
        sendBuffalo.writeUInt8(on ? 1 : 0);
        sendBuffalo.writeUInt16(concentratorType);
        sendBuffalo.writeUInt16(minTime);
        sendBuffalo.writeUInt16(maxTime);
        sendBuffalo.writeUInt8(routeErrorThreshold);
        sendBuffalo.writeUInt8(deliveryFailureThreshold);
        sendBuffalo.writeUInt8(maxHops);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Starts periodic many-to-one route discovery.
     * Periodic discovery is started by default on bootup, but this function may be used if discovery
     * has been stopped by a call to ::ezspConcentratorStopDiscovery().
     */
    async ezspConcentratorStartDiscovery(): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.CONCENTRATOR_START_DISCOVERY);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Stops periodic many-to-one route discovery.
     */
    async ezspConcentratorStopDiscovery(): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.CONCENTRATOR_STOP_DISCOVERY);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Notes when a route error has occurred.
     * @param status
     * @param nodeId
     */
    async ezspConcentratorNoteRouteError(status: SLStatus, nodeId: NodeId): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.CONCENTRATOR_NOTE_ROUTE_ERROR);
        sendBuffalo.writeUInt32(status);
        sendBuffalo.writeUInt16(nodeId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Sets the error code that is sent back from a router with a broken route.
     * @param errorCode uint8_t Desired error code.
     * @returns An SLStatus value indicating the success or failure of the command.
     */
    async ezspSetBrokenRouteErrorCode(errorCode: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_BROKEN_ROUTE_ERROR_CODE);
        sendBuffalo.writeUInt8(errorCode);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This causes to initialize the desired radio interface other than native and
     * form a new network by becoming the coordinator with same panId as native
     * radio network.
     * @param phyIndex uint8_t Index of phy interface. The native phy index would be always zero hence valid phy index starts from one.
     * @param page uint8_t Desired radio channel page.
     * @param channel uint8_t Desired radio channel.
     * @param power int8_t Desired radio output power, in dBm.
     * @param bitmask Network configuration bitmask.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspMultiPhyStart(phyIndex: number, page: number, channel: number, power: number, bitmask: EmberMultiPhyNwkConfig): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MULTI_PHY_START);
        sendBuffalo.writeUInt8(phyIndex);
        sendBuffalo.writeUInt8(page);
        sendBuffalo.writeUInt8(channel);
        sendBuffalo.writeInt8(power);
        sendBuffalo.writeUInt8(bitmask);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This causes to bring down the radio interface other than native.
     * @param phyIndex uint8_t Index of phy interface. The native phy index would be always zero hence valid phy index starts from one.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspMultiPhyStop(phyIndex: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MULTI_PHY_STOP);
        sendBuffalo.writeUInt8(phyIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sets the radio output power for desired phy interface at which a node is
     * operating. Ember radios have discrete power settings. For a list of available
     * power settings, see the technical specification for the RF communication
     * module in your Developer Kit. Note: Care should be taken when using this api
     * on a running network, as it will directly impact the established link
     * qualities neighboring nodes have with the node on which it is called. This
     * can lead to disruption of existing routes and erratic network behavior.
     * @param phyIndex uint8_t Index of phy interface. The native phy index would be always zero hence valid phy index starts from one.
     * @param power int8_t Desired radio output power, in dBm.
     * @returns An SLStatus value indicating the success or failure of the command.
     */
    async ezspMultiPhySetRadioPower(phyIndex: number, power: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MULTI_PHY_SET_RADIO_POWER);
        sendBuffalo.writeUInt8(phyIndex);
        sendBuffalo.writeInt8(power);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Send Link Power Delta Request from a child to its parent
     * @returns An SLStatus value indicating the success or failure of the command.
     */
    async ezspSendLinkPowerDeltaRequest(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_LINK_POWER_DELTA_REQUEST);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sets the channel for desired phy interface to use for sending and receiving
     * messages. For a list of available radio pages and channels, see the technical
     * specification for the RF communication module in your Developer Kit. Note:
     * Care should be taken when using this API, as all devices on a network must
     * use the same page and channel.
     * @param phyIndex uint8_t Index of phy interface. The native phy index would be always zero hence valid phy index starts from one.
     * @param page uint8_t Desired radio channel page.
     * @param channel uint8_t Desired radio channel.
     * @returns An SLStatus value indicating the success or failure of the command.
     */
    async ezspMultiPhySetRadioChannel(phyIndex: number, page: number, channel: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MULTI_PHY_SET_RADIO_CHANNEL);
        sendBuffalo.writeUInt8(phyIndex);
        sendBuffalo.writeUInt8(page);
        sendBuffalo.writeUInt8(channel);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Obtains the current duty cycle state.
     * @returns An SLStatus value indicating the success or failure of the command.
     * @returns EmberDutyCycleState * The current duty cycle state in effect.
     */
    async ezspGetDutyCycleState(): Promise<[SLStatus, returnedState: EmberDutyCycleState]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_DUTY_CYCLE_STATE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const returnedState = this.buffalo.readUInt8();

        return [status, returnedState];
    }

    /**
     * Set the current duty cycle limits configuration. The Default limits set by
     * stack if this call is not made.
     * @param limits EmberDutyCycleLimits * The duty cycle limits configuration to utilize.
     * @returns
     * - SLStatus.OK if the duty cycle limit configurations set successfully,
     * - SLStatus.INVALID_PARAMETER if set illegal value such as setting only one of the limits to default
     *   or violates constraints Susp > Crit > Limi,
     * - SLStatus.INVALID_STATE if device is operating on 2.4Ghz
     */
    async ezspSetDutyCycleLimitsInStack(limits: EmberDutyCycleLimits): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_DUTY_CYCLE_LIMITS_IN_STACK);
        sendBuffalo.writeEmberDutyCycleLimits(limits);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Obtains the current duty cycle limits that were previously set by a call to emberSetDutyCycleLimitsInStack(),
     * or the defaults set by the stack if no set call was made.
     * @returns An SLStatus value indicating the success or failure of the command.
     * @returns EmberDutyCycleLimits * Return current duty cycle limits if returnedLimits is not NULL
     */
    async ezspGetDutyCycleLimits(): Promise<[SLStatus, returnedLimits: EmberDutyCycleLimits]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_DUTY_CYCLE_LIMITS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const returnedLimits = this.buffalo.readEmberDutyCycleLimits();

        return [status, returnedLimits];
    }

    /**
     * Returns the duty cycle of the stack's connected children that are being
     * monitored, up to maxDevices. It indicates the amount of overall duty cycle
     * they have consumed (up to the suspend limit). The first entry is always the
     * local stack's nodeId, and thus the total aggregate duty cycle for the device.
     * The passed pointer arrayOfDeviceDutyCycles MUST have space for maxDevices.
     * @param maxDevices uint8_t Number of devices to retrieve consumed duty cycle.
     * @returns
     * - SLStatus.OK  if the duty cycles were read successfully,
     * - SLStatus.INVALID_PARAMETER maxDevices is greater than SL_ZIGBEE_MAX_END_DEVICE_CHILDREN + 1.
     * @returns uint8_t * Consumed duty cycles up to maxDevices. When the number of children that are being monitored is less than maxDevices,
     *          the NodeId element in the EmberPerDeviceDutyCycle will be 0xFFFF.
     */
    async ezspGetCurrentDutyCycle(maxDevices: number): Promise<[SLStatus, arrayOfDeviceDutyCycles: number[]]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_CURRENT_DUTY_CYCLE);
        sendBuffalo.writeUInt8(maxDevices);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const arrayOfDeviceDutyCycles = this.buffalo.readListUInt8(134);

        return [status, arrayOfDeviceDutyCycles];
    }

    /**
     * Callback
     * Callback fires when the duty cycle state has changed
     * @param channelPage uint8_t The channel page whose duty cycle state has changed.
     * @param channel uint8_t The channel number whose duty cycle state has changed.
     * @param state The current duty cycle state.
     * @param totalDevices uint8_t The total number of connected end devices that are being monitored for duty cycle.
     * @param arrayOfDeviceDutyCycles EmberPerDeviceDutyCycle * Consumed duty cycles of end devices that are being monitored.
     *        The first entry always be the local stack's nodeId, and thus the total aggregate duty cycle for the device.
     */
    ezspDutyCycleHandler(
        channelPage: number,
        channel: number,
        state: EmberDutyCycleState,
        totalDevices: number,
        arrayOfDeviceDutyCycles: EmberPerDeviceDutyCycle[],
    ): void {
        logger.debug(
            `ezspDutyCycleHandler(): callback called with: [channelPage=${channelPage}], [channel=${channel}], [state=${state}], [totalDevices=${totalDevices}], [arrayOfDeviceDutyCycles=${arrayOfDeviceDutyCycles}]`,
            NS,
        );
    }

    /**
     * Configure the number of beacons to store when issuing active scans for networks.
     * @param numBeacons uint8_t The number of beacons to cache when scanning.
     * @returns
     * - SLStatus.INVALID_PARAMETER if numBeacons is greater than SL_ZIGBEE_MAX_BEACONS_TO_STORE
     * - SLStatus.OK
     */
    async ezspSetNumBeaconToStore(numBeacons: number): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_NUM_BEACONS_TO_STORE);
        sendBuffalo.writeUInt8(numBeacons);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Fetches the specified beacon in the cache. Beacons are stored in cache after issuing an active scan.
     * @param beaconNumber uint8_t The beacon index to fetch. Valid values range from 0 to ezspGetNumStoredBeacons-1.
     * @returns An appropriate SLStatus status code.
     * @returns EmberBeaconData * The beacon to populate upon success.
     */
    async ezspGetStoredBeacon(beaconNumber: number): Promise<[SLStatus, beacon: EmberBeaconData]> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_STORED_BEACON);
        sendBuffalo.writeUInt8(beaconNumber);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();
        const beacon = this.buffalo.readEmberBeaconData();

        return [status, beacon];
    }

    /**
     * Returns the number of cached beacons that have been collected from a scan.
     * @returns uint8_t The number of cached beacons that have been collected from a scan.
     */
    async ezspGetNumStoredBeacons(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_NUM_STORED_BEACONS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const numBeacons = this.buffalo.readUInt8();

        return numBeacons;
    }

    /**
     * Clears all cached beacons that have been collected from a scan.
     * @returns An SLStatus value indicating success or the reason for failure. Always `OK` in v13-.
     */
    async ezspClearStoredBeacons(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.CLEAR_STORED_BEACONS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            return SLStatus.OK;
        } else {
            const status = this.buffalo.readUInt32();

            return status;
        }
    }

    /**
     * This call sets the radio channel in the stack and propagates the information
     * to the hardware.
     * @param radioChannel uint8_t The radio channel to be set.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetLogicalAndRadioChannel(radioChannel: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_LOGICAL_AND_RADIO_CHANNEL);
        sendBuffalo.writeUInt8(radioChannel);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Form a new sleepy-to-sleepy network.
     * If the network is using security, the device must call sli_zigbee_stack_set_initial_security_state() first.
     * @param parameters Specification of the new network.
     * @param initiator Whether this device is initiating or joining the network.
     * @returns An SLStatus value indicating success or a reason for failure.
     */
    async ezspSleepyToSleepyNetworkStart(parameters: EmberNetworkParameters, initiator: boolean): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SLEEPY_TO_SLEEPY_NETWORK_START);
        sendBuffalo.writeEmberNetworkParameters(parameters);
        sendBuffalo.writeUInt8(initiator ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Send a Zigbee NWK Leave command to the destination.
     * @param destination Node ID of the device being told to leave.
     * @param flags Bitmask indicating additional considerations for the leave request.
     * @returns Status indicating success or a reason for failure. Call is invalid if destination is on network or is the local node.
     */
    async ezspSendZigbeeLeave(destination: PanId, flags: Zdo.LeaveRequestFlags): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SEND_ZIGBEE_LEAVE);
        sendBuffalo.writeUInt16(destination);
        sendBuffalo.writeUInt8(flags);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Indicate the state of permit joining in MAC.
     * @returns Whether the current network permits joining.
     */
    async ezspGetPermitJoining(): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_PERMIT_JOINING);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const joiningPermitted = this.buffalo.readUInt8() !== 0;

        return joiningPermitted;
    }

    /**
     * Get the 8-byte extended PAN ID of this node.
     * @returns Extended PAN ID of this node. Valid only if it is currently on a network.
     */
    async ezspGetExtendedPanId(): Promise<ExtendedPanId> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_EXTENDED_PAN_ID);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const extendedPanId = this.buffalo.readListUInt8(ZSpec.EXTENDED_PAN_ID_SIZE);

        return extendedPanId;
    }

    /**
     * Get the current network.
     * @returns Return the current network index.
     */
    async ezspGetCurrentNetwork(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_CURRENT_NETWORK);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const index = this.buffalo.readUInt8();

        return index;
    }

    /**
     * Set initial outgoing link cost for neighbor.
     * @param cost The new default cost. Valid values are 0, 1, 3, 5, and 7.
     * @returns Whether or not initial cost was successfully set.
     */
    async ezspSetInitialNeighborOutgoingCost(cost: number): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_INITIAL_NEIGHBOR_OUTGOING_COST);
        sendBuffalo.writeUInt8(cost);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Get initial outgoing link cost for neighbor.
     * @returns The default cost associated with new neighbor's outgoing links.
     */
    async ezspGetInitialNeighborOutgoingCost(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_INITIAL_NEIGHBOR_OUTGOING_COST);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const cost = this.buffalo.readUInt8();

        return cost;
    }

    /**
     * Indicate whether a rejoining neighbor should have its incoming frame counter reset.
     * @param reset
     */
    async ezspResetRejoiningNeighborsFrameCounter(reset: boolean): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.RESET_REJOINING_NEIGHBORS_FRAME_COUNTER);
        sendBuffalo.writeUInt8(reset ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Check whether a rejoining neighbor will have its incoming frame counter reset based on the currently set policy.
     * @returns Whether or not a rejoining neighbor's incoming FC gets reset (true or false).
     */
    async ezspIsResetRejoiningNeighborsFrameCounterEnabled(): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.IS_RESET_REJOINING_NEIGHBORS_FRAME_COUNTER_ENABLED);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const getsReset = this.buffalo.readUInt8() !== 0;

        return getsReset;
    }

    //-----------------------------------------------------------------------------
    // Binding Frames
    //-----------------------------------------------------------------------------

    /**
     * Deletes all binding table entries.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspClearBindingTable(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.CLEAR_BINDING_TABLE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sets an entry in the binding table.
     * @param index uint8_t The index of a binding table entry.
     * @param value EmberBindingTableEntry * The contents of the binding entry.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetBinding(index: number, value: EmberBindingTableEntry): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_BINDING);
        sendBuffalo.writeUInt8(index);
        sendBuffalo.writeEmberBindingTableEntry(value);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Gets an entry from the binding table.
     * @param index uint8_t The index of a binding table entry.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns EmberBindingTableEntry * The contents of the binding entry.
     */
    async ezspGetBinding(index: number): Promise<[SLStatus, value: EmberBindingTableEntry]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_BINDING);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const value = this.buffalo.readEmberBindingTableEntry();

        return [status, value];
    }

    /**
     * Deletes a binding table entry.
     * @param index uint8_t The index of a binding table entry.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspDeleteBinding(index: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.DELETE_BINDING);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Indicates whether any messages are currently being sent using this binding
     * table entry. Note that this command does not indicate whether a binding is
     * clear. To determine whether a binding is clear, check whether the type field
     * of the EmberBindingTableEntry has the value EMBER_UNUSED_BINDING.
     * @param index uint8_t The index of a binding table entry.
     * @returns True if the binding table entry is active, false otherwise.
     */
    async ezspBindingIsActive(index: number): Promise<boolean> {
        const sendBuffalo = this.startCommand(EzspFrameID.BINDING_IS_ACTIVE);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const active = this.buffalo.readUInt8() !== 0;

        return active;
    }

    /**
     * Returns the node ID for the binding's destination, if the ID is known. If a
     * message is sent using the binding and the destination's ID is not known, the
     * stack will discover the ID by broadcasting a ZDO address request. The
     * application can avoid the need for this discovery by using
     * setBindingRemoteNodeId when it knows the correct ID via some other means. The
     * destination's node ID is forgotten when the binding is changed, when the
     * local node reboots or, much more rarely, when the destination node changes
     * its ID in response to an ID conflict.
     * @param index uint8_t The index of a binding table entry.
     * @returns The short ID of the destination node or EMBER_NULL_NODE_ID if no destination is known.
     */
    async ezspGetBindingRemoteNodeId(index: number): Promise<NodeId> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_BINDING_REMOTE_NODE_ID);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const nodeId: NodeId = this.buffalo.readUInt16();

        return nodeId;
    }

    /**
     * Set the node ID for the binding's destination. See getBindingRemoteNodeId for
     * a description.
     * @param index uint8_t The index of a binding table entry.
     * @param The short ID of the destination node.
     */
    async ezspSetBindingRemoteNodeId(index: number, nodeId: NodeId): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_BINDING_REMOTE_NODE_ID);
        sendBuffalo.writeUInt8(index);
        sendBuffalo.writeUInt16(nodeId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Callback
     * The NCP used the external binding modification policy to decide how to handle
     * a remote set binding request. The Host cannot change the current decision,
     * but it can change the policy for future decisions using the setPolicy
     * command.
     * @param entry EmberBindingTableEntry * The requested binding.
     * @param index uint8_t The index at which the binding was added.
     * @param policyDecision SLStatus.OK if the binding was added to the table and any other status if not.
     */
    ezspRemoteSetBindingHandler(entry: EmberBindingTableEntry, index: number, policyDecision: SLStatus): void {
        logger.debug(
            () =>
                `ezspRemoteSetBindingHandler(): callback called with: [entry=${JSON.stringify(entry)}], [index=${index}], [policyDecision=${SLStatus[policyDecision]}]`,
            NS,
        );
    }

    /**
     * Callback
     * The NCP used the external binding modification policy to decide how to handle
     * a remote delete binding request. The Host cannot change the current decision,
     * but it can change the policy for future decisions using the setPolicy
     * command.
     * @param index uint8_t The index of the binding whose deletion was requested.
     * @param policyDecision SLStatus.OK if the binding was removed from the table and any other status if not.
     */
    ezspRemoteDeleteBindingHandler(index: number, policyDecision: SLStatus): void {
        logger.debug(`ezspRemoteDeleteBindingHandler(): callback called with: [index=${index}], [policyDecision=${SLStatus[policyDecision]}]`, NS);
    }

    //-----------------------------------------------------------------------------
    // Messaging Frames
    //-----------------------------------------------------------------------------

    /**
     * Returns the maximum size of the payload. The size depends on the security level in use.
     * @returns uint8_t The maximum APS payload length.
     */
    async ezspMaximumPayloadLength(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.MAXIMUM_PAYLOAD_LENGTH);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const apsLength = this.buffalo.readUInt8();

        return apsLength;
    }

    /**
     * Sends a unicast message as per the ZigBee specification.
     * The message will arrive at its destination only if there is a known route to the destination node.
     * Setting the ENABLE_ROUTE_DISCOVERY option will cause a route to be discovered if none is known.
     * Setting the FORCE_ROUTE_DISCOVERY option will force route discovery.
     * Routes to end-device children of the local node are always known.
     * Setting the APS_RETRY option will cause the message to be retransmitted until either a matching acknowledgement is received
     * or three transmissions have been made.
     * Note: Using the FORCE_ROUTE_DISCOVERY option will cause the first transmission to be consumed by a route request as part of discovery,
     * so the application payload of this packet will not reach its destination on the first attempt. If you want the packet to reach its destination,
     * the APS_RETRY option must be set so that another attempt is made to transmit the message with its application payload
     * after the route has been constructed.
     * Note: When sending fragmented messages, the stack will only assign a new APS sequence number for the first fragment of the message
     * (i.e., SL_ZIGBEE_APS_OPTION_FRAGMENT is set and the low-order byte of the groupId field in the APS frame is zero).
     * For all subsequent fragments of the same message, the application must set the sequence number field in the APS frame
     * to the sequence number assigned by the stack to the first fragment.
     * @param type Specifies the outgoing message type.
     *        Must be one of EMBER_OUTGOING_DIRECT, EMBER_OUTGOING_VIA_ADDRESS_TABLE, or EMBER_OUTGOING_VIA_BINDING.
     * @param indexOrDestination Depending on the type of addressing used, this is either the NodeId of the destination,
     *        an index into the address table, or an index into the binding table.
     * @param apsFrame EmberApsFrame * The APS frame which is to be added to the message.
     * @param messageTag uint8_t (v14+: uint16_t) A value chosen by the Host.
     *        This value is used in the ezspMessageSentHandler response to refer to this message.
     * @param messageContents uint8_t * Content of the message.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns uint8_t * The sequence number that will be used when this message is transmitted.
     */
    async ezspSendUnicast(
        type: EmberOutgoingMessageType,
        indexOrDestination: NodeId,
        apsFrame: EmberApsFrame,
        messageTag: number,
        messageContents: Buffer,
    ): Promise<[SLStatus, apsSequence: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_UNICAST);
        sendBuffalo.writeUInt8(type);
        sendBuffalo.writeUInt16(indexOrDestination);
        sendBuffalo.writeEmberApsFrame(apsFrame);

        if (this.version < 0x0e) {
            sendBuffalo.writeUInt8(messageTag);
        } else {
            sendBuffalo.writeUInt16(messageTag);
        }

        sendBuffalo.writePayload(messageContents);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const apsSequence = this.buffalo.readUInt8();

        return [status, apsSequence];
    }

    /**
     * Sends a broadcast message as per the ZigBee specification.
     * @param alias uint16_t (unused in v13-) The aliased source from which we send the broadcast.
     *        This must be SL_ZIGBEE_NULL_NODE_ID if we do not need an aliased source
     * @param destination The destination to which to send the broadcast. This must be one of the three ZigBee broadcast addresses.
     * @param nwkSequence uint8_t (unused in v13-) The alias nwk sequence number. This won't be used if there is no aliased source.
     * @param apsFrame EmberApsFrame * The APS frame for the message.
     * @param radius uint8_t The message will be delivered to all nodes within radius hops of the sender.
     *        A radius of zero is converted to EMBER_MAX_HOPS.
     * @param messageTag uint8_t (v14+: uint16_t) A value chosen by the Host.
     *        This value is used in the ezspMessageSentHandler response to refer to this message.
     * @param messageContents uint8_t * The broadcast message.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns uint8_t * The sequence number that will be used when this message is transmitted.
     */
    async ezspSendBroadcast(
        alias: NodeId,
        destination: NodeId,
        nwkSequence: number,
        apsFrame: EmberApsFrame,
        radius: number,
        messageTag: number,
        messageContents: Buffer,
    ): Promise<[SLStatus, apsSequence: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_BROADCAST);

        if (this.version < 0x0e) {
            sendBuffalo.writeUInt16(destination);
            sendBuffalo.writeEmberApsFrame(apsFrame);
            sendBuffalo.writeUInt8(radius);
            sendBuffalo.writeUInt8(messageTag);
        } else {
            sendBuffalo.writeUInt16(alias);
            sendBuffalo.writeUInt16(destination);
            sendBuffalo.writeUInt8(nwkSequence);
            sendBuffalo.writeEmberApsFrame(apsFrame);
            sendBuffalo.writeUInt8(radius);
            sendBuffalo.writeUInt16(messageTag);
        }

        sendBuffalo.writePayload(messageContents);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const apsSequence = this.buffalo.readUInt8();

        return [status, apsSequence];
    }

    /**
     * Sends proxied broadcast message for another node in conjunction with sl_zigbee_proxy_broadcast
     * where a long source is also specified in the NWK frame control.
     * @param euiSource The long source from which to send the broadcast
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspProxyNextBroadcastFromLong(euiSource: EUI64): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.PROXY_NEXT_BROADCAST_FROM_LONG);
        sendBuffalo.writeIeeeAddr(euiSource);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Sends a multicast message to all endpoints that share a specific multicast ID and are within a specified number of hops of the sender.
     * @param apsFrame EmberApsFrame * The APS frame for the message. The multicast will be sent to the groupId in this frame.
     * @param hops uint8_t The message will be delivered to all nodes within this number of hops of the sender.
     *        A value of zero is converted to EMBER_MAX_HOPS.
     * @param broadcastAddr uint16_t (unused in v13-) The number of hops that the message will be forwarded by devices
     *        that are not members of the group.
     *        A value of 7 or greater is treated as infinite.
     * @param alias uint16_t (unused in v13-) The alias source address. This must be SL_ZIGBEE_NULL_NODE_ID if we do not need an aliased source
     * @param nwkSequence uint8_t (unused in v13-) The alias sequence number. This won't be used if there is no aliased source.
     * @param messageTag uint8_t (v14+: uint16_t) A value chosen by the Host.
     *        This value is used in the ezspMessageSentHandler response to refer to this message.
     * @param messageContents uint8_t * The multicast message.
     * @returns An SLStatus value. For any result other than SLStatus.OK, the message will not be sent.
     * - SLStatus.OK - The message has been submitted for transmission.
     * - SLStatus.INVALID_INDEX - The bindingTableIndex refers to a non-multicast binding.
     * - SLStatus.NETWORK_DOWN - The node is not part of a network.
     * - SLStatus.MESSAGE_TOO_LONG - The message is too large to fit in a MAC layer frame.
     * - SLStatus.ALLOCATION_FAILED - The free packet buffer pool is empty.
     * - SLStatus.BUSY - Insufficient resources available in Network or MAC layers to send message.
     * @returns uint8_t * The sequence number that will be used when this message is transmitted.
     */
    async ezspSendMulticast(
        apsFrame: EmberApsFrame,
        hops: number,
        broadcastAddr: number,
        alias: NodeId,
        nwkSequence: number,
        messageTag: number,
        messageContents: Buffer,
    ): Promise<[SLStatus, apsSequence: number]> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_MULTICAST);
        sendBuffalo.writeEmberApsFrame(apsFrame);
        sendBuffalo.writeUInt8(hops);

        if (this.version < 0x0e) {
            sendBuffalo.writeUInt8(ZA_MAX_HOPS); // nonMemberRadius
            sendBuffalo.writeUInt8(messageTag);
        } else {
            sendBuffalo.writeUInt16(broadcastAddr);
            sendBuffalo.writeUInt16(alias);
            sendBuffalo.writeUInt8(nwkSequence);
            sendBuffalo.writeUInt16(messageTag);
        }

        sendBuffalo.writePayload(messageContents);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const apsSequence = this.buffalo.readUInt8();

        return [status, apsSequence];
    }

    /**
     * Sends a reply to a received unicast message. The incomingMessageHandler
     * callback for the unicast being replied to supplies the values for all the
     * parameters except the reply itself.
     * @param sender Value supplied by incoming unicast.
     * @param apsFrame EmberApsFrame * Value supplied by incoming unicast.
     * @param uint8_t The length of the messageContents parameter in bytes.
     * @param uint8_t * The reply message.
     * @returns
     * - SLStatus.INVALID_STATE - The SL_ZIGBEE_EZSP_UNICAST_REPLIES_POLICY is set to SL_ZIGBEE_EZSP_HOST_WILL_NOT_SUPPLY_REPLY.
     *   This means the NCP will automatically send an empty reply. The Host must change
     *   the policy to SL_ZIGBEE_EZSP_HOST_WILL_SUPPLY_REPLY before it can supply the reply.
     *   There is one exception to this rule: In the case of responses to message
     *   fragments, the host must call sendReply when a message fragment is received.
     *   In this case, the policy set on the NCP does not matter. The NCP expects a
     *   sendReply call from the Host for message fragments regardless of the current
     *   policy settings.
     * - SLStatus.ALLOCATION_FAILED - Not enough memory was available to send the reply.
     * - SLStatus.BUSY - Either no route or insufficient resources available.
     * - SLStatus.OK - The reply was successfully queued for transmission.
     */
    async ezspSendReply(sender: NodeId, apsFrame: EmberApsFrame, messageContents: Buffer): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_REPLY);
        sendBuffalo.writeUInt16(sender);
        sendBuffalo.writeEmberApsFrame(apsFrame);
        sendBuffalo.writePayload(messageContents);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback indicating the stack has completed sending a message.
     * @param status
     * - SL_STATUS_OK if an ACK was received from the destination
     * - SL_STATUS_ZIGBEE_DELIVERY_FAILED if no ACK was received.
     * @param type The type of message sent.
     * @param indexOrDestination uint16_t The destination to which the message was sent, for direct unicasts,
     *        or the address table or binding index for other unicasts. The value is unspecified for multicasts and broadcasts.
     * @param apsFrame EmberApsFrame * The APS frame for the message.
     * @param messageTag uint8_t The value supplied by the Host in the ezspSendUnicast, ezspSendBroadcast or ezspSendMulticast command.
     * @param messageContents uint8_t * The unicast message supplied by the Host. The message contents are only included here if the decision
     *        for the messageContentsInCallback policy is messageTagAndContentsInCallback.
     */
    ezspMessageSentHandler(
        status: SLStatus,
        type: EmberOutgoingMessageType,
        indexOrDestination: number,
        apsFrame: EmberApsFrame,
        messageTag: number,
        messageContents?: Buffer,
    ): void {
        logger.debug(
            () =>
                `ezspMessageSentHandler(): callback called with: [status=${SLStatus[status]}], [type=${EmberOutgoingMessageType[type]}], ` +
                `[indexOrDestination=${indexOrDestination}], [apsFrame=${JSON.stringify(apsFrame)}], [messageTag=${messageTag}]` +
                (messageContents ? `, [messageContents=${messageContents.toString('hex')}]` : ''),
            NS,
        );

        this.emit('messageSent', status, type, indexOrDestination, apsFrame, messageTag);
    }

    /**
     * Sends a route request packet that creates routes from every node in the
     * network back to this node. This function should be called by an application
     * that wishes to communicate with many nodes, for example, a gateway, central
     * monitor, or controller. A device using this function was referred to as an
     * 'aggregator' in EmberZNet 2.x and earlier, and is referred to as a
     * 'concentrator' in the ZigBee specification and EmberZNet 3.  This function
     * enables large scale networks, because the other devices do not have to
     * individually perform bandwidth-intensive route discoveries. Instead, when a
     * remote node sends an APS unicast to a concentrator, its network layer
     * automatically delivers a special route record packet first, which lists the
     * network ids of all the intermediate relays. The concentrator can then use
     * source routing to send outbound APS unicasts. (A source routed message is one
     * in which the entire route is listed in the network layer header.) This allows
     * the concentrator to communicate with thousands of devices without requiring
     * large route tables on neighboring nodes.  This function is only available in
     * ZigBee Pro (stack profile 2), and cannot be called on end devices. Any router
     * can be a concentrator (not just the coordinator), and there can be multiple
     * concentrators on a network.  Note that a concentrator does not automatically
     * obtain routes to all network nodes after calling this function. Remote
     * applications must first initiate an inbound APS unicast.  Many-to-one routes
     * are not repaired automatically. Instead, the concentrator application must
     * call this function to rediscover the routes as necessary, for example, upon
     * failure of a retried APS message. The reason for this is that there is no
     * scalable one-size-fits-all route repair strategy. A common and recommended
     * strategy is for the concentrator application to refresh the routes by calling
     * this function periodically.
     * @param concentratorType uint16_t Must be either EMBER_HIGH_RAM_CONCENTRATOR or EMBER_LOW_RAM_CONCENTRATOR.
     *        The former is used when the caller has enough memory to store source routes for the whole network.
     *        In that case, remote nodes stop sending route records once the concentrator has successfully received one.
     *        The latter is used when the concentrator has insufficient RAM to store all outbound source routes.
     *        In that case, route records are sent to the concentrator prior to every inbound APS unicast.
     * @param radius uint8_t The maximum number of hops the route request will be relayed. A radius of zero is converted to EMBER_MAX_HOPS
     * @returns
     * - SLStatus.OK if the route request was successfully submitted to the transmit queue,
     * - SLStatus.FAIL otherwise.
     */
    async ezspSendManyToOneRouteRequest(concentratorType: number, radius: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_MANY_TO_ONE_ROUTE_REQUEST);
        sendBuffalo.writeUInt16(concentratorType);
        sendBuffalo.writeUInt8(radius);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Periodically request any pending data from our parent. Setting interval to 0
     * or units to EMBER_EVENT_INACTIVE will generate a single poll.
     * @param interval uint16_t The time between polls. Note that the timer clock is free running and is not synchronized with this command.
     *        This means that the time will be between interval and (interval - 1). The maximum interval is 32767.
     * @param units The units for interval.
     * @param failureLimit uint8_t The number of poll failures that will be tolerated before a pollCompleteHandler callback is generated.
     *        A value of zero will result in a callback for every poll. Any status value apart from EMBER_SUCCESS
     *        and EMBER_MAC_NO_DATA is counted as a failure.
     * @returns The result of sending the first poll.
     */
    async ezspPollForData(interval: number, units: EmberEventUnits, failureLimit: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.POLL_FOR_DATA);
        sendBuffalo.writeUInt16(interval);
        sendBuffalo.writeUInt8(units);
        sendBuffalo.writeUInt8(failureLimit);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * Indicates the result of a data poll to the parent of the local node.
     * @param status An SLStatus value:
     * - SLStatus.OK - Data was received in response to the poll.
     * - SLStatus.MAC_NO_DATA - No data was pending.
     * - SLStatus.ZIGBEE_DELIVERY_FAILED - The poll message could not be sent.
     * - SLStatus.MAC_NO_ACK_RECEIVED - The poll message was sent but not acknowledged by the parent.
     */
    ezspPollCompleteHandler(status: SLStatus): void {
        logger.debug(`ezspPollCompleteHandler(): callback called with: [status=${SLStatus[status]}]`, NS);
    }

    /**
     * Set a flag to indicate that a message is pending for a child.
     * The next time that the child polls, it will be informed that it has a pending message.
     * The message is sent from emberPollHandler, which is called when the child requests data.
     * @param childId The ID of the child that just polled for data.
     * @returns
     * - SLStatus.OK - The next time that the child polls, it will be informed that it has pending data.
     * - SLStatus.NOT_JOINED - The child identified by childId is not our child.
     */
    async ezspSetMessageFlag(childId: NodeId): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_MESSAGE_FLAG);
        sendBuffalo.writeUInt16(childId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Clear a flag to indicate that there are no more messages for a child.
     * The next time the child polls, it will be informed that it does not have any pending messages.
     * @param childId The ID of the child that no longer has pending messages.
     * @returns
     * - SLStatus.OK - The next time that the child polls, it will be informed that it does not have any pending messages.
     * - SLStatus.NOT_JOINED - The child identified by childId is not our child.
     */
    async ezspClearMessageFlag(childId: NodeId): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.CLEAR_MESSAGE_FLAG);
        sendBuffalo.writeUInt16(childId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Callback
     * Indicates that the local node received a data poll from a child.
     * @param childId The node ID of the child that is requesting data.
     * @param transmitExpected True if transmit is expected, false otherwise.
     */
    ezspPollHandler(childId: NodeId, transmitExpected: boolean): void {
        logger.debug(`ezspPollHandler(): callback called with:  [childId=${childId}], [transmitExpected=${transmitExpected}]`, NS);
    }

    /**
     * Add a child to the child/neighbor table only on SoC, allowing direct manipulation of these tables by the application.
     * This can affect the network functionality, and needs to be used wisely.
     * If used appropriately, the application can maintain more than the maximum of children provided by the stack.
     * @param shortId The preferred short ID of the node.
     * @param longId The long ID of the node.
     * @param nodeType The nodetype e.g., SL_ZIGBEE_ROUTER defining, if this would be added to the child table or neighbor table.
     * @returns
     * - SLStatus.OK - This node has been successfully added.
     * - SLStatus.FAIL - The child was not added to the child/neighbor table.
     */
    async ezspAddChild(shortId: NodeId, longId: EUI64, nodeType: EmberNodeType): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.ADD_CHILD);
        sendBuffalo.writeUInt16(shortId);
        sendBuffalo.writeIeeeAddr(longId);
        sendBuffalo.writeUInt8(nodeType);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Remove a node from child/neighbor table only on SoC, allowing direct manipulation of these tables by the application.
     * This can affect the network functionality, and needs to be used wisely.
     * @param childEui64 The long ID of the node.
     * @returns
     * - SLStatus.OK - This node has been successfully removed.
     * - SLStatus.FAIL - The node was not found in either of the child or neighbor tables.
     */
    async ezspRemoveChild(childEui64: EUI64): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.REMOVE_CHILD);
        sendBuffalo.writeIeeeAddr(childEui64);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Remove a neighbor from neighbor table only on SoC, allowing direct manipulation of neighbor table by the application.
     * This can affect the network functionality, and needs to be used wisely.
     * @param shortId The short ID of the neighbor.
     * @param longId The long ID of the neighbor.
     */
    async ezspRemoveNeighbor(shortId: NodeId, longId: EUI64): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.REMOVE_NEIGHBOR);
        sendBuffalo.writeUInt16(shortId);
        sendBuffalo.writeIeeeAddr(longId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        // XXX: watchout for update here, Silabs likely forgot status return
    }

    /**
     * Callback
     * A callback indicating a message has been received.
     * @param type The type of the incoming message. One of the following: EMBER_INCOMING_UNICAST, EMBER_INCOMING_UNICAST_REPLY,
     *        EMBER_INCOMING_MULTICAST, EMBER_INCOMING_MULTICAST_LOOPBACK, EMBER_INCOMING_BROADCAST, EMBER_INCOMING_BROADCAST_LOOPBACK
     * @param apsFrame EmberApsFrame * The APS frame from the incoming message.
     * @param packetInfo Miscellanous message information.
     * @param messageContents uint8_t * The incoming message.
     */
    ezspIncomingMessageHandler(
        type: EmberIncomingMessageType,
        apsFrame: EmberApsFrame,
        packetInfo: EmberRxPacketInfo,
        messageContents: Buffer,
    ): void {
        logger.debug(
            () =>
                `ezspIncomingMessageHandler(): callback called with: [type=${EmberIncomingMessageType[type]}], [apsFrame=${JSON.stringify(apsFrame)}], ` +
                `[packetInfo:${JSON.stringify(packetInfo)}], [messageContents=${messageContents.toString('hex')}]`,
            NS,
        );

        if (apsFrame.profileId === Zdo.ZDO_PROFILE_ID) {
            this.emit('zdoResponse', apsFrame, packetInfo.senderShortId, messageContents);
        } else if (
            apsFrame.profileId === ZSpec.HA_PROFILE_ID ||
            apsFrame.profileId === ZSpec.WILDCARD_PROFILE_ID ||
            (apsFrame.profileId === ZSpec.GP_PROFILE_ID && type !== EmberIncomingMessageType.BROADCAST_LOOPBACK)
        ) {
            this.emit('incomingMessage', type, apsFrame, packetInfo.lastHopLqi, packetInfo.senderShortId, messageContents);
        }
    }

    /**
     * Sets source route discovery(MTORR) mode to on, off, reschedule
     * @param mode uint8_t Source route discovery mode: off:0, on:1, reschedule:2
     * @returns uint32_t Remaining time(ms) until next MTORR broadcast if the mode is on, MAX_INT32U_VALUE if the mode is off
     */
    async ezspSetSourceRouteDiscoveryMode(mode: EmberSourceRouteDiscoveryMode): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_SOURCE_ROUTE_DISCOVERY_MODE);
        sendBuffalo.writeUInt8(mode);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const remainingTime = this.buffalo.readUInt32();

        return remainingTime;
    }

    /**
     * Callback
     * A callback indicating that a many-to-one route to the concentrator with the given short and long id is available for use.
     * @param NodeId The short id of the concentrator.
     * @param longId The EUI64 of the concentrator.
     * @param cost uint8_t The path cost to the concentrator. The cost may decrease as additional route request packets
     *        for this discovery arrive, but the callback is made only once.
     */
    ezspIncomingManyToOneRouteRequestHandler(source: NodeId, longId: EUI64, cost: number): void {
        logger.debug(`ezspIncomingManyToOneRouteRequestHandler(): callback called with: [source=${source}], [longId=${longId}], [cost=${cost}]`, NS);
    }

    /**
     * Callback
     * A callback invoked when a route error message is received.
     * The error indicates that a problem routing to or from the target node was encountered.
     *
     * A status of ::EMBER_SOURCE_ROUTE_FAILURE indicates that a source-routed unicast sent from this node encountered a broken link.
     * Note that this case occurs only if this node is a concentrator using many-to-one routing for inbound messages and source-routing for
     * outbound messages. The node prior to the broken link generated the route error message and returned it to us along the many-to-one route.
     *
     * A status of ::EMBER_MANY_TO_ONE_ROUTE_FAILURE also occurs only if the local device is a concentrator, and indicates that a unicast sent
     * to the local device along a many-to-one route encountered a broken link. The node prior to the broken link generated the route error
     * message and forwarded it to the local device via a randomly chosen neighbor, taking advantage of the many-to-one nature of the route.
     *
     * A status of ::EMBER_MAC_INDIRECT_TIMEOUT indicates that a message sent to the target end device could not be delivered by the parent
     * because the indirect transaction timer expired. Upon receipt of the route error, the stack sets the extended timeout for the target node
     * in the address table, if present. It then calls this handler to indicate receipt of the error.
     *
     * Note that if the original unicast data message is sent using the ::EMBER_APS_OPTION_RETRY option, a new route error message is generated
     * for each failed retry. Therefore, it is not unusual to receive three route error messages in succession for a single failed retried APS
     * unicast. On the other hand, it is also not guaranteed that any route error messages will be delivered successfully at all.
     * The only sure way to detect a route failure is to use retried APS messages and to check the status of the ::emberMessageSentHandler().
     *
     * @param status ::EMBER_SOURCE_ROUTE_FAILURE, ::EMBER_MANY_TO_ONE_ROUTE_FAILURE, ::EMBER_MAC_INDIRECT_TIMEOUT
     * @param target The short id of the remote node.
     */
    ezspIncomingRouteErrorHandler(status: SLStatus, target: NodeId): void {
        logger.debug(`ezspIncomingRouteErrorHandler(): callback called with: [status=${SLStatus[status]}], [target=${target}]`, NS);
        // NOTE: This can trigger immediately after removal of a device with status MAC_INDIRECT_TIMEOUT
    }

    /**
     * Callback
     * A callback invoked when a network status/route error message is received.
     * The error indicates that there was a problem sending/receiving messages from the target node.
     *
     * Note: Network analyzer may flag this message as "route error" which is the old name for the "network status" command.
     *
     * This handler is a superset of ezspIncomingRouteErrorHandler. The old API was only invoking the handler for a couple of the possible
     * error codes and these were being translated into EmberStatus.
     *
     * @param errorCode uint8_t One byte over-the-air error code from network status message
     * @param target The short ID of the remote node
     */
    ezspIncomingNetworkStatusHandler(errorCode: EmberStackError, target: NodeId): void {
        logger.debug(`ezspIncomingNetworkStatusHandler(): callback called with: [errorCode=${EmberStackError[errorCode]}], [target=${target}]`, NS);
        logger.info(`Received network/route error ${EmberStackError[errorCode]} for "${target}".`, NS);
    }

    /**
     * Callback
     * Reports the arrival of a route record command frame.
     * @param NodeId The source of the route record.
     * @param EUI64 The EUI64 of the source.
     * @param lastHopLqi uint8_t The link quality from the node that last relayed the route record.
     * @param lastHopRssi int8_t The energy level (in units of dBm) observed during the reception.
     * @param uint8_t The number of relays in relayList.
     * @param relayList uint8_t * The route record. Each relay in the list is an uint16_t node ID.
     *        The list is passed as uint8_t * to avoid alignment problems.
     */
    ezspIncomingRouteRecordHandler(
        source: NodeId,
        sourceEui: EUI64,
        lastHopLqi: number,
        lastHopRssi: number,
        relayCount: number,
        relayList: number[],
    ): void {
        logger.debug(
            `ezspIncomingRouteRecordHandler(): callback called with: [source=${source}], [sourceEui=${sourceEui}], [lastHopLqi=${lastHopLqi}], [lastHopRssi=${lastHopRssi}], [relayCount=${relayCount}], [relayList=${relayList}]`,
            NS,
        );
        // XXX: could at least trigger a `Events.lastSeenChanged` but this is not currently being listened to at the adapter level
    }

    /**
     * Send the network key to a destination.
     * @param targetShort The destination node of the key.
     * @param targetLong The long address of the destination node.
     * @param parentShortId The parent node of the destination node.
     * @returns SLStatus.OK if send was successful
     */
    async ezspUnicastCurrentNetworkKey(targetShort: NodeId, targetLong: EUI64, parentShortId: NodeId): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.UNICAST_CURRENT_NETWORK_KEY);
        sendBuffalo.writeUInt16(targetShort);
        sendBuffalo.writeIeeeAddr(targetLong);
        sendBuffalo.writeUInt16(parentShortId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Indicates whether any messages are currently being sent using this address
     * table entry. Note that this function does not indicate whether the address
     * table entry is unused. To determine whether an address table entry is unused,
     * check the remote node ID. The remote node ID will have the value
     * EMBER_TABLE_ENTRY_UNUSED_NODE_ID when the address table entry is not in use.
     * @param uint8_tThe index of an address table entry.
     * @returns True if the address table entry is active, false otherwise.
     */
    async ezspAddressTableEntryIsActive(addressTableIndex: number): Promise<boolean> {
        const sendBuffalo = this.startCommand(EzspFrameID.ADDRESS_TABLE_ENTRY_IS_ACTIVE);
        sendBuffalo.writeUInt8(addressTableIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const active = this.buffalo.readUInt8() !== 0;

        return active;
    }

    /**
     * Sets the EUI64 and short ID of an address table entry.
     * Usually the application will not need to set the short ID in the address table.
     * Once the remote EUI64 is set the stack is capable of figuring out the short ID on its own.
     * However, in cases where the application does set the short ID, the application must set the remote EUI64 prior to setting the short ID.
     * This function will also check other address table entries, the child table and the neighbor table to see
     * if the node ID for the given EUI64 is already known.
     * If known then this function will set node ID. If not known it will set the node ID to SL_ZIGBEE_UNKNOWN_NODE_ID.
     * @param addressTableIndex
     * @param eui64
     * @param id
     * @returns
     * - SLStatus.OK if the information was successfully set,
     * - SLStatus.ZIGBEE_ADDRESS_TABLE_ENTRY_IS_ACTIVE otherwise.
     */
    async ezspSetAddressTableInfo(addressTableIndex: number, eui64: EUI64, id: NodeId): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_ADDRESS_TABLE_INFO);
        sendBuffalo.writeUInt8(addressTableIndex);
        sendBuffalo.writeIeeeAddr(eui64);
        sendBuffalo.writeUInt16(id);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Gets the EUI64 and short ID of an address table entry.
     * @param addressTableIndex
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns One of the following:
     * - The short ID corresponding to the remote node whose EUI64 is stored in the address table at the given index.
     * - SL_ZIGBEE_UNKNOWN_NODE_ID:
     *   Indicates that the EUI64 stored in the address table at the given index is valid but the short ID is currently unknown.
     * - SL_ZIGBEE_DISCOVERY_ACTIVE_NODE_ID:
     *   Indicates that the EUI64 stored in the address table at the given location is valid and network address discovery is underway.
     * - SL_ZIGBEE_TABLE_ENTRY_UNUSED_NODE_ID:
     *   Indicates that the entry stored in the address table at the given index is not in use.
     * @returns The EUI64 of the address table entry is copied to this location.
     */
    async ezspGetAddressTableInfo(addressTableIndex: number): Promise<[SLStatus, nodeId: NodeId, eui64: EUI64]> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_ADDRESS_TABLE_INFO);
        sendBuffalo.writeUInt8(addressTableIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();
        const nodeId = this.buffalo.readUInt16();
        const eui64 = this.buffalo.readIeeeAddr();

        return [status, nodeId, eui64];
    }

    /**
     * Tells the stack whether or not the normal interval between retransmissions of a retried unicast message should
     * be increased by EMBER_INDIRECT_TRANSMISSION_TIMEOUT.
     * The interval needs to be increased when sending to a sleepy node so that the message is not retransmitted until the destination
     * has had time to wake up and poll its parent.
     * The stack will automatically extend the timeout:
     * - For our own sleepy children.
     * - When an address response is received from a parent on behalf of its child.
     * - When an indirect transaction expiry route error is received.
     * - When an end device announcement is received from a sleepy node.
     * @param remoteEui64 The address of the node for which the timeout is to be set.
     * @param extendedTimeout true if the retry interval should be increased by EMBER_INDIRECT_TRANSMISSION_TIMEOUT.
     *        false if the normal retry interval should be used.
     * @returns An SLStatus value indicating success or the reason for failure. Always `OK` in v13-.
     */
    async ezspSetExtendedTimeout(remoteEui64: EUI64, extendedTimeout: boolean): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_EXTENDED_TIMEOUT);
        sendBuffalo.writeIeeeAddr(remoteEui64);
        sendBuffalo.writeUInt8(extendedTimeout ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            return SLStatus.OK;
        } else {
            const status = this.buffalo.readUInt32();

            return status;
        }
    }

    /**
     * Indicates whether or not the stack will extend the normal interval between
     * retransmissions of a retried unicast message by
     * EMBER_INDIRECT_TRANSMISSION_TIMEOUT.
     * @param remoteEui64 The address of the node for which the timeout is to be returned.
     * @returns
     * - SLStatus.OK if the retry interval will be increased by SL_ZIGBEE_INDIRECT_TRANSMISSION_TIMEOUT
     * - SLStatus.FAIL if the normal retry interval will be used.
     */
    async ezspGetExtendedTimeout(remoteEui64: EUI64): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_EXTENDED_TIMEOUT);
        sendBuffalo.writeIeeeAddr(remoteEui64);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            const extendedTimeout = this.buffalo.readUInt8() !== 0;

            return extendedTimeout ? SLStatus.OK : SLStatus.FAIL;
        } else {
            const status = this.buffalo.readUInt32();

            return status;
        }
    }

    /**
     * Replaces the EUI64, short ID and extended timeout setting of an address table
     * entry. The previous EUI64, short ID and extended timeout setting are
     * returned.
     * @param addressTableIndex uint8_t The index of the address table entry that will be modified.
     * @param newEui64 The EUI64 to be written to the address table entry.
     * @param newId One of the following: The short ID corresponding to the new EUI64.
     *        SL_ZIGBEE_UNKNOWN_NODE_ID if the new EUI64 is valid but the short ID is unknown and should be discovered by the stack.
     *        SL_ZIGBEE_TABLE_ENTRY_UNUSED_NODE_ID if the address table entry is now unused.
     * @param newExtendedTimeout true if the retry interval should be increased by SL_ZIGBEE_INDIRECT_TRANSMISSION_TIMEOUT.
     *        false if the normal retry interval should be used.
     * @returns
     * - SLStatus.OK if the EUI64, short ID and extended timeout setting were successfully modified,
     * - SLStatus.ZIGBEE_ADDRESS_TABLE_ENTRY_IS_ACTIVE otherwise.
     * @returns oldEui64 The EUI64 of the address table entry before it was modified.
     * @returns oldId NodeId * One of the following: The short ID corresponding to the EUI64 before it was modified.
     *          SL_ZIGBEE_UNKNOWN_NODE_ID if the short ID was unknown. SL_ZIGBEE_DISCOVERY_ACTIVE_NODE_ID if discovery of the short ID was underway.
     *          SL_ZIGBEE_TABLE_ENTRY_UNUSED_NODE_ID if the address table entry was unused.
     * @returns oldExtendedTimeouttrue bool * if the retry interval was being increased by SL_ZIGBEE_INDIRECT_TRANSMISSION_TIMEOUT.
     *          false if the normal retry interval was being used.
     */
    async ezspReplaceAddressTableEntry(
        addressTableIndex: number,
        newEui64: EUI64,
        newId: NodeId,
        newExtendedTimeout: boolean,
    ): Promise<[SLStatus, oldEui64: EUI64, oldId: NodeId, oldExtendedTimeout: boolean]> {
        const sendBuffalo = this.startCommand(EzspFrameID.REPLACE_ADDRESS_TABLE_ENTRY);
        sendBuffalo.writeUInt8(addressTableIndex);
        sendBuffalo.writeIeeeAddr(newEui64);
        sendBuffalo.writeUInt16(newId);
        sendBuffalo.writeUInt8(newExtendedTimeout ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const oldEui64 = this.buffalo.readIeeeAddr();
        const oldId = this.buffalo.readUInt16();
        const oldExtendedTimeout = this.buffalo.readUInt8() !== 0;

        return [status, oldEui64, oldId, oldExtendedTimeout];
    }

    /**
     * Returns the node ID that corresponds to the specified EUI64. The node ID is
     * found by searching through all stack tables for the specified EUI64.
     * @param eui64 The EUI64 of the node to look up.
     * @returns The short ID of the node or SL_ZIGBEE_NULL_NODE_ID if the short ID is not known.
     */
    async ezspLookupNodeIdByEui64(eui64: EUI64): Promise<NodeId> {
        const sendBuffalo = this.startCommand(EzspFrameID.LOOKUP_NODE_ID_BY_EUI64);
        sendBuffalo.writeIeeeAddr(eui64);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const nodeId: NodeId = this.buffalo.readUInt16();

        return nodeId;
    }

    /**
     * Returns the EUI64 that corresponds to the specified node ID. The EUI64 is
     * found by searching through all stack tables for the specified node ID.
     * @param nodeId The short ID of the node to look up.
     * @returns
     * - SLStatus.OK if the EUI64 was found,
     * - SLStatus.FAIL if the EUI64 is not known.
     * @returns eui64 The EUI64 of the node.
     */
    async ezspLookupEui64ByNodeId(nodeId: NodeId): Promise<[SLStatus, eui64: EUI64]> {
        const sendBuffalo = this.startCommand(EzspFrameID.LOOKUP_EUI64_BY_NODE_ID);
        sendBuffalo.writeUInt16(nodeId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const eui64 = this.buffalo.readIeeeAddr();

        return [status, eui64];
    }

    /**
     * Gets an entry from the multicast table.
     * @param uint8_t The index of a multicast table entry.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns EmberMulticastTableEntry * The contents of the multicast entry.
     */
    async ezspGetMulticastTableEntry(index: number): Promise<[SLStatus, value: EmberMulticastTableEntry]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_MULTICAST_TABLE_ENTRY);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const value = this.buffalo.readEmberMulticastTableEntry();

        return [status, value];
    }

    /**
     * Sets an entry in the multicast table.
     * @param index uint8_t The index of a multicast table entry
     * @param EmberMulticastTableEntry * The contents of the multicast entry.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetMulticastTableEntry(index: number, value: EmberMulticastTableEntry): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_MULTICAST_TABLE_ENTRY);
        sendBuffalo.writeUInt8(index);
        sendBuffalo.writeEmberMulticastTableEntry(value);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback invoked by the EmberZNet stack when an id conflict is discovered,
     * that is, two different nodes in the network were found to be using the same
     * short id. The stack automatically removes the conflicting short id from its
     * internal tables (address, binding, route, neighbor, and child tables). The
     * application should discontinue any other use of the id.
     * @param id The short id for which a conflict was detected
     */
    ezspIdConflictHandler(id: NodeId): void {
        logger.debug(`ezspIdConflictHandler(): callback called with: [id=${id}]`, NS);
        logger.warning(`An ID conflict was detected for network address '${id}'. Corresponding devices kicked from the network.`, NS);

        // XXX: this is currently causing more problems than not doing it, so disabled for now.
        //      devices should rejoin on ID conflict anyway, so the database isn't out of sync for very long.
        // hijacking the event from `ezspTrustCenterJoinHandler`, and forging a DEVICE_LEFT to avoid another event ending up doing the same logic
        // this.emit('trustCenterJoin', id, null, EmberDeviceUpdate.DEVICE_LEFT, EmberJoinDecision.NO_ACTION, NULL_NODE_ID);
    }

    /**
     * Write the current node Id, PAN ID, or Node type to the tokens
     * @param erase Erase the node type or not
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspWriteNodeData(erase: boolean): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.WRITE_NODE_DATA);
        sendBuffalo.writeUInt8(erase ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Transmits the given message without modification. The MAC header is assumed
     * to be configured in the message at the time this function is called.
     * @param messageContents uint8_t * The raw message.
     * @param priority uint8_t transmit priority.
     * @param useCca Should we enable CCA or not.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSendRawMessage(messageContents: Buffer, priority: EmberTransmitPriority, useCca: boolean): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_RAW_MESSAGE);
        sendBuffalo.writePayload(messageContents);
        sendBuffalo.writeUInt8(priority);
        sendBuffalo.writeUInt8(useCca ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback invoked by the EmberZNet stack when a MAC passthrough message is
     * received.
     * @param messageType The type of MAC passthrough message received.
     * @param packetInfo Information about the incoming packet.
     * @param messageContents uint8_t * The raw message that was received.
     */
    ezspMacPassthroughMessageHandler(messageType: EmberMacPassthroughType, packetInfo: EmberRxPacketInfo, messageContents: Buffer): void {
        logger.debug(
            () =>
                `ezspMacPassthroughMessageHandler(): callback called with: [messageType=${messageType}], [packetInfo=${JSON.stringify(packetInfo)}], [messageContents=${messageContents.toString('hex')}]`,
            NS,
        );
    }

    /**
     * Callback
     * A callback invoked by the EmberZNet stack when a raw MAC message that has
     * matched one of the application's configured MAC filters.
     * @param filterIndexMatch uint8_t The index of the filter that was matched.
     * @param legacyPassthroughType The type of MAC passthrough message received.
     * @param packetInfo Information about the incoming packet.
     * @param messageContents uint8_t * The raw message that was received.
     */
    ezspMacFilterMatchMessageHandler(
        filterIndexMatch: number,
        legacyPassthroughType: EmberMacPassthroughType,
        packetInfo: EmberRxPacketInfo,
        messageContents: Buffer,
    ): void {
        logger.debug(
            () =>
                `ezspMacFilterMatchMessageHandler(): callback called with: [filterIndexMatch=${filterIndexMatch}], [legacyPassthroughType=${legacyPassthroughType}], ` +
                `[packetInfo=${JSON.stringify(packetInfo)}], [messageContents=${messageContents.toString('hex')}]`,
            NS,
        );

        // TODO: needs triple-checking, this is only valid for InterPAN messages
        const msgBuffalo = new EzspBuffalo(messageContents, 0);

        const macFrameControl = msgBuffalo.readUInt16() & ~MAC_ACK_REQUIRED;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const sequence = msgBuffalo.readUInt8();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const destPanId: PanId = msgBuffalo.readUInt16();
        let destAddress: EUI64 | NodeId;

        if (macFrameControl === LONG_DEST_FRAME_CONTROL) {
            destAddress = msgBuffalo.readIeeeAddr();
        } else if (macFrameControl === SHORT_DEST_FRAME_CONTROL) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            destAddress = msgBuffalo.readUInt16();
        } else {
            logger.debug(`ezspMacFilterMatchMessageHandler INVALID InterPAN macFrameControl '${macFrameControl}'.`, NS);
            return;
        }

        const sourcePanId: PanId = msgBuffalo.readUInt16();
        const sourceAddress: EUI64 = msgBuffalo.readIeeeAddr();

        // Now that we know the correct MAC length, verify the interpan frame is the correct length.
        let remainingLength = msgBuffalo.getBufferLength() - msgBuffalo.getPosition();

        if (remainingLength < STUB_NWK_SIZE + MIN_STUB_APS_SIZE) {
            logger.debug(`ezspMacFilterMatchMessageHandler INVALID InterPAN length '${remainingLength}'.`, NS);
            return;
        }

        const nwkFrameControl = msgBuffalo.readUInt16();
        remainingLength -= 2; // read 2 more bytes before APS stuff

        if (nwkFrameControl !== STUB_NWK_FRAME_CONTROL) {
            logger.debug(`ezspMacFilterMatchMessageHandler INVALID InterPAN nwkFrameControl '${nwkFrameControl}'.`, NS);
            return;
        }

        const apsFrameControl = msgBuffalo.readUInt8();

        if (
            (apsFrameControl & ~INTERPAN_APS_FRAME_DELIVERY_MODE_MASK & ~INTERPAN_APS_FRAME_SECURITY) !==
            INTERPAN_APS_FRAME_CONTROL_NO_DELIVERY_MODE
        ) {
            logger.debug(`ezspMacFilterMatchMessageHandler INVALID InterPAN apsFrameControl '${apsFrameControl}'.`, NS);
            return;
        }

        const messageType = apsFrameControl & INTERPAN_APS_FRAME_DELIVERY_MODE_MASK;
        let groupId: number = 0; // XXX: looks fine from z2m code?

        switch (messageType) {
            case EmberInterpanMessageType.UNICAST:
            case EmberInterpanMessageType.BROADCAST: {
                if (remainingLength < INTERPAN_APS_UNICAST_BROADCAST_SIZE) {
                    logger.debug(`ezspMacFilterMatchMessageHandler INVALID InterPAN length '${remainingLength}'.`, NS);
                    return;
                }
                break;
            }
            case EmberInterpanMessageType.MULTICAST: {
                if (remainingLength < INTERPAN_APS_MULTICAST_SIZE) {
                    logger.debug(`ezspMacFilterMatchMessageHandler INVALID InterPAN length '${remainingLength}'.`, NS);
                    return;
                }

                groupId = msgBuffalo.readUInt16();
                break;
            }
            default: {
                logger.debug(`ezspMacFilterMatchMessageHandler INVALID InterPAN messageType '${messageType}'.`, NS);
                return;
            }
        }

        const clusterId = msgBuffalo.readUInt16();
        const profileId = msgBuffalo.readUInt16();
        const payload = msgBuffalo.readRest();

        if (profileId === ZSpec.TOUCHLINK_PROFILE_ID && clusterId === Clusters.touchlink.ID) {
            this.emit('touchlinkMessage', sourcePanId, sourceAddress, groupId, packetInfo.lastHopLqi, payload);
        }
    }

    /**
     * Callback
     * A callback invoked by the EmberZNet stack when the MAC has finished
     * transmitting a raw message.
     * @param messageContents (v14+)
     * @param status
     * - SLStatus.OK if the transmission was successful,
     * - SLStatus.ZIGBEE_DELIVERY_FAILED if not
     */
    ezspRawTransmitCompleteHandler(messageContents: Buffer, status: SLStatus): void {
        logger.debug(
            `ezspRawTransmitCompleteHandler(): callback called with: [messageContents=${messageContents.toString('hex')}], [status=${SLStatus[status]}]`,
            NS,
        );
    }

    /**
     * This function is useful to sleepy end devices.
     * This function will set the retry interval (in milliseconds) for mac data poll.
     * This interval is the time in milliseconds the device waits before retrying a data poll when a MAC level
     * data poll fails for any reason.
     * @param waitBeforeRetryIntervalMs uint32_t Time in milliseconds the device waits before retrying
     *        a data poll when a MAC level data poll fails for any reason.
     */
    async ezspSetMacPollFailureWaitTime(waitBeforeRetryIntervalMs: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_MAC_POLL_FAILURE_WAIT_TIME);
        sendBuffalo.writeUInt32(waitBeforeRetryIntervalMs);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Returns the maximum number of no-ack retries that will be attempted
     * @returns Max MAC retries
     */
    async ezspGetMaxMacRetries(): Promise<number> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.GET_MAX_MAC_RETRIES);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const retries = this.buffalo.readUInt32();

        return retries;
    }

    /**
     * Sets the priority masks and related variables for choosing the best beacon.
     * @param param EmberBeaconClassificationParams * The beacon prioritization related variable
     * @returns The attempt to set the parameters returns SLStatus.OK
     */
    async ezspSetBeaconClassificationParams(param: EmberBeaconClassificationParams): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_BEACON_CLASSIFICATION_PARAMS);
        sendBuffalo.writeEmberBeaconClassificationParams(param);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Gets the priority masks and related variables for choosing the best beacon.
     * @returns The attempt to get the parameters returns SLStatus.OK
     * @returns EmberBeaconClassificationParams * Gets the beacon prioritization related variable
     */
    async ezspGetBeaconClassificationParams(): Promise<[SLStatus, param: EmberBeaconClassificationParams]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_BEACON_CLASSIFICATION_PARAMS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const param = this.buffalo.readEmberBeaconClassificationParams();

        return [status, param];
    }

    /**
     * Indicate whether there are pending messages in the APS retry queue.
     * @returns True if there is a pending message for this network in the APS retry queue, false if not.
     */
    async ezspPendingAckedMessages(): Promise<boolean> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.PENDING_ACKED_MESSAGES);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const pendingMessages = this.buffalo.readUInt8() !== 0;

        return pendingMessages;
    }

    /**
     * Reschedule sending link status message, with first one being sent immediately.
     * @returns
     */
    async ezspRescheduleLinkStatusMsg(): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.RESCHEDULE_LINK_STATUS_MSG);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Set the network update ID to the desired value. Must be called before joining or forming the network.
     * @param nwkUpdateId uint8_t Desired value of the network update ID.
     * @param setWhenOnNetwork Set to true in case change should also apply when on network.
     * @returns Status of set operation for the network update ID.
     */
    async ezspSetNwkUpdateId(nwkUpdateId: number, setWhenOnNetwork: boolean): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_NWK_UPDATE_ID);
        sendBuffalo.writeUInt8(nwkUpdateId);
        sendBuffalo.writeUInt8(setWhenOnNetwork ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    //-----------------------------------------------------------------------------
    // Security Frames
    //-----------------------------------------------------------------------------

    /**
     * Sets the security state that will be used by the device when it forms or
     * joins the network. This call should not be used when restoring saved network
     * state via networkInit as this will result in a loss of security data and will
     * cause communication problems when the device re-enters the network.
     * @param state EmberInitialSecurityState * The security configuration to be set.
     * @returns The success or failure code of the operation.
     */
    async ezspSetInitialSecurityState(state: EmberInitialSecurityState): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_INITIAL_SECURITY_STATE);
        sendBuffalo.writeEmberInitialSecurityState(state);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Gets the current security state that is being used by a device that is joined
     * in the network.
     * @returns The success or failure code of the operation.
     * @returns EmberCurrentSecurityState * The security configuration in use by the stack.
     */
    async ezspGetCurrentSecurityState(): Promise<[SLStatus, state: EmberCurrentSecurityState]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_CURRENT_SECURITY_STATE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const state = this.buffalo.readEmberCurrentSecurityState();

        return [status, state];
    }

    /**
     * Exports a key from security manager based on passed context.
     * @param context sl_zb_sec_man_context_t * Metadata to identify the requested key.
     * @returns sl_zb_sec_man_key_t * Data to store the exported key in.
     * @returns SLStatus * The success or failure code of the operation.
     */
    async ezspExportKey(context: SecManContext): Promise<[SLStatus, key: SecManKey]> {
        /**
         * Export a key from storage. Certain keys are indexed, while others are not, as described here.
         *
         * If context->core_key_type is..
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_NETWORK, then context->key_index dictates whether to
         * export the current (active) network key (index 0) or the alternate network
         * key (index 1).
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_TC_LINK, then context->eui64 is checked if
         * context->flags is set to ZB_SEC_MAN_FLAG_EUI_IS_VALID. If the EUI supplied
         * does not match the TC EUI stored on the local device (if it is known), then
         * an error is thrown.
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_TC_LINK_WITH_TIMEOUT, then keys may be searched by
         * context->eui64 or context->key_index. context->flags determines how to search
         * (see ::sl_zigbee_sec_man_flags_t).
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_APP_LINK, then keys may be searched by
         * context->eui64 or context->key_index. context->flags determines how to search
         * (see ::sl_zigbee_sec_man_flags_t).
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_GREEN_POWER_PROXY_TABLE_KEY or
         * SL_ZB_SEC_MAN_KEY_TYPE_GREEN_POWER_SINK_TABLE_KEY, then context->key_index
         * dictates which key entry to export. These Green Power keys are indexed keys,
         * and there are EMBER_GP_PROXY_TABLE_SIZE/EMBER_GP_SINK_TABLE_SIZE many of them.
         *
         * For all other key types, both context->key_index and context->eui64 are not used.
         *
         * @param context sl_zb_sec_man_context_t* [IN/OUT] The context to set. The context dictates which key
         * type to export, which key_index (if applicable) into the relevant key
         * storage, which eui64 (if applicable), etc.
         * @param plaintext_key sl_zb_sec_man_key_t* [OUT] The key to export.
         *
         * @note The context->derived_type must be SL_ZB_SEC_MAN_DERIVED_KEY_TYPE_NONE.
         * Other values are ignored.
         *
         * @return SLStatus.OK upon success, a valid error code otherwise.
         */
        // NOTE: added for good measure
        if (context.coreKeyType === SecManKeyType.INTERNAL) {
            logger.error(`ezspExportKey cannot use INTERNAL key type.`, NS);
            throw new EzspError(EzspStatus.ERROR_INVALID_CALL);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.EXPORT_KEY);
        sendBuffalo.writeSecManContext(context);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            const key = this.buffalo.readSecManKey();
            const status = this.buffalo.readUInt32();

            return [status, key];
        } else {
            const status = this.buffalo.readUInt32();
            const key = this.buffalo.readSecManKey();
            context = this.buffalo.readSecManContext();

            return [status, key];
        }
    }

    /**
     * Imports a key into security manager based on passed context.
     * @param context sl_zb_sec_man_context_t * Metadata to identify where the imported key should be stored.
     * @param key sl_zb_sec_man_key_t * The key to be imported.
     * @returns The success or failure code of the operation.
     */
    async ezspImportKey(context: SecManContext, key: SecManKey): Promise<SLStatus> {
        /**
         * Import a key into storage. Certain keys are
         * indexed, while others are not, as described here.
         *
         * If context->core_key_type is..
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_NETWORK, then context->key_index dictates whether to
         * import the current (active) network key (index 0) or the alternate network
         * key (index 1).
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_TC_LINK_WITH_TIMEOUT, then context->eui64 must be
         * set. context->key_index is unused.
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_APP_LINK, then context->key_index determines which
         * index in the persisted key table that the entry should be stored to.
         * context->eui64 must also be set.
         * If context->key_index is 0xFF, a suitable key index will be found (either one
         * storing an existing key with address of context->eui64, or an open entry),
         * and context->key_index will be updated with where the entry was stored.
         *
         * ..SL_ZB_SEC_MAN_KEY_TYPE_GREEN_POWER_PROXY_TABLE_KEY or
         * SL_ZB_SEC_MAN_KEY_TYPE_GREEN_POWER_SINK_TABLE_KEY, then context->key_index
         * dictates which key entry to import. These Green Power keys are indexed keys,
         * and there are EMBER_GP_PROXY_TABLE_SIZE/EMBER_GP_SINK_TABLE_SIZE many of them.
         *
         * For all other key types, both context->key_index and context->eui64 are not
         * used.
         *
         * @param context sl_zb_sec_man_context_t* [IN] The context to set. The context dictates which key type
         * to save, key_index (if applicable) into the relevant key storage, eui64 (if
         * applicable), etc.
         * @param plaintext_key sl_zb_sec_man_key_t*  [IN] The key to import.
         * @note The context->derived_type must be SL_ZB_SEC_MAN_DERIVED_KEY_TYPE_NONE,
         * else, an error will be thrown. Key derivations, which are used in crypto
         * operations, are performed using the ::sl_zb_sec_man_load_key_context routine.
         * @return SLStatus.OK upon success, a valid error code otherwise.
         */
        // NOTE: added for good measure
        if (context.coreKeyType === SecManKeyType.INTERNAL) {
            logger.error(`ezspImportKey cannot use INTERNAL key type.`, NS);
            throw new EzspError(EzspStatus.ERROR_INVALID_CALL);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.IMPORT_KEY);
        sendBuffalo.writeSecManContext(context);
        sendBuffalo.writeSecManKey(key);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();
        context = this.buffalo.readSecManContext();

        return status;
    }

    /**
     * Callback
     * A callback to inform the application that the Network Key has been updated
     * and the node has been switched over to use the new key. The actual key being
     * used is not passed up, but the sequence number is.
     * @param sequenceNumber uint8_t The sequence number of the new network key.
     */
    ezspSwitchNetworkKeyHandler(sequenceNumber: number): void {
        logger.debug(`ezspSwitchNetworkKeyHandler(): callback called with: [sequenceNumber=${sequenceNumber}]`, NS);
    }

    /**
     * This function searches through the Key Table and tries to find the entry that
     * matches the passed search criteria.
     * @param address The address to search for. Alternatively, all zeros may be passed in to search for the first empty entry.
     * @param linkKey This indicates whether to search for an entry that contains a link key or a master key.
     *        true means to search for an entry with a Link Key.
     * @returns uint8_t This indicates the index of the entry that matches the search criteria.
     *          A value of 0xFF is returned if not matching entry is found.
     */
    async ezspFindKeyTableEntry(address: EUI64, linkKey: boolean): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.FIND_KEY_TABLE_ENTRY);
        sendBuffalo.writeIeeeAddr(address);
        sendBuffalo.writeUInt8(linkKey ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const index = this.buffalo.readUInt8();

        return index;
    }

    /**
     * This function sends an APS TransportKey command containing the current trust
     * center link key. The node to which the command is sent is specified via the
     * short and long address arguments.
     * @param destinationNodeId The short address of the node to which this command will be sent
     * @param destinationEui64 The long address of the node to which this command will be sent
     * @returns An SLStatus value indicating success of failure of the operation
     */
    async ezspSendTrustCenterLinkKey(destinationNodeId: NodeId, destinationEui64: EUI64): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_TRUST_CENTER_LINK_KEY);
        sendBuffalo.writeUInt16(destinationNodeId);
        sendBuffalo.writeIeeeAddr(destinationEui64);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This function erases the data in the key table entry at the specified index.
     * If the index is invalid, false is returned.
     * @param index uint8_t This indicates the index of entry to erase.
     * @returns The success or failure of the operation.
     */
    async ezspEraseKeyTableEntry(index: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.ERASE_KEY_TABLE_ENTRY);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This function clears the key table of the current network.
     * @returns The success or failure of the operation.
     */
    async ezspClearKeyTable(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.CLEAR_KEY_TABLE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * A function to request a Link Key from the Trust Center with another device on
     * the Network (which could be the Trust Center). A Link Key with the Trust
     * Center is possible but the requesting device cannot be the Trust Center. Link
     * Keys are optional in ZigBee Standard Security and thus the stack cannot know
     * whether the other device supports them. If EMBER_REQUEST_KEY_TIMEOUT is
     * non-zero on the Trust Center and the partner device is not the Trust Center,
     * both devices must request keys with their partner device within the time
     * period. The Trust Center only supports one outstanding key request at a time
     * and therefore will ignore other requests. If the timeout is zero then the
     * Trust Center will immediately respond and not wait for the second request.
     * The Trust Center will always immediately respond to requests for a Link Key
     * with it. Sleepy devices should poll at a higher rate until a response is
     * received or the request times out. The success or failure of the request is
     * returned via ezspZigbeeKeyEstablishmentHandler(...)
     * @param partner This is the IEEE address of the partner device that will share the link key.
     * @returns The success or failure of sending the request.
     *          This is not the final result of the attempt. ezspZigbeeKeyEstablishmentHandler(...) will return that.
     */
    async ezspRequestLinkKey(partner: EUI64): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.REQUEST_LINK_KEY);
        sendBuffalo.writeIeeeAddr(partner);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Requests a new link key from the Trust Center. This function starts by
     * sending a Node Descriptor request to the Trust Center to verify its R21+
     * stack version compliance. A Request Key message will then be sent, followed
     * by a Verify Key Confirm message.
     * @param maxAttempts uint8_t The maximum number of attempts a node should make when sending the Node Descriptor,
     *        Request Key, and Verify Key Confirm messages. The number of attempts resets for each message type sent
     *        (e.g., if maxAttempts is 3, up to 3 Node Descriptors are sent, up to 3 Request Keys, and up to 3 Verify Key Confirm messages are sent).
     * @returns The success or failure of sending the request.
     *          If the Node Descriptor is successfully transmitted, ezspZigbeeKeyEstablishmentHandler(...)
     *          will be called at a later time with a final status result.
     */
    async ezspUpdateTcLinkKey(maxAttempts: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.UPDATE_TC_LINK_KEY);
        sendBuffalo.writeUInt8(maxAttempts);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * This is a callback that indicates the success or failure of an attempt to establish a key with a partner device.
     * @param partner This is the IEEE address of the partner that the device successfully established a key with.
     *        This value is all zeros on a failure.
     * @param status This is the status indicating what was established or why the key establishment failed.
     */
    ezspZigbeeKeyEstablishmentHandler(partner: EUI64, status: EmberKeyStatus): void {
        logger.debug(`ezspZigbeeKeyEstablishmentHandler(): callback called with: [partner=${partner}], [status=${EmberKeyStatus[status]}]`, NS);
        // NOTE: For security reasons, any valid `partner` (not wildcard) that return with a status=TC_REQUESTER_VERIFY_KEY_TIMEOUT
        //       are kicked off the network for posing a risk, unless HA devices allowed (as opposed to Z3)
        //       and always if status=TC_REQUESTER_VERIFY_KEY_FAILURE
    }

    /**
     * Clear all of the transient link keys from RAM.
     */
    async ezspClearTransientLinkKeys(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.CLEAR_TRANSIENT_LINK_KEYS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Retrieve information about the current and alternate network key, excluding their contents.
     * @returns Success or failure of retrieving network key info.
     * @returns sl_zb_sec_man_network_key_info_t * Information about current and alternate network keys.
     */
    async ezspGetNetworkKeyInfo(): Promise<[SLStatus, networkKeyInfo: SecManNetworkKeyInfo]> {
        /**
         * Retrieve information about the network key and alternate network key.
         * It will not retrieve the actual network key contents.
         *
         * @param network_key_info sl_zb_sec_man_network_key_info_t* [OUT] The network key info struct used to store network key metadata,
         * containing information about whether the current and next network keys are set, and the
         * sequence numbers associated with each key.
         *
         * @return SLStatus SLStatus.OK
         *
         */
        const sendBuffalo = this.startCommand(EzspFrameID.GET_NETWORK_KEY_INFO);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();
        const networkKeyInfo = this.buffalo.readSecManNetworkKeyInfo();

        return [status, networkKeyInfo];
    }

    /**
     * Retrieve metadata about an APS link key.  Does not retrieve contents.
     * @param context sl_zb_sec_man_context_t * Context used to input information about key.
     * @returns Status of metadata retrieval operation.
     * @returns sl_zb_sec_man_aps_key_metadata_t * Metadata about the referenced key.
     */
    async ezspGetApsKeyInfo(context: SecManContext): Promise<[status: SLStatus, keyData: SecManAPSKeyMetadata]> {
        /**
         * Retrieve metadata about an APS key.
         * It does not retrieve the actual key contents.
         *
         * @param context sl_zb_sec_man_context_t* [IN/OUT] The context to use to look up a key entry. If the
         *  user calls this function with the ::ZB_SEC_MAN_FLAG_KEY_INDEX_IS_VALID bit
         *  set in the context->flag field, then the key_index field in the context
         *  argument dictates which entry to retrieve. For keys with timeout and
         *  application link keys, the key_index retrieves the indexed entry into the
         *  respective table. Upon success, the eui64 field in the context is updated.
         *  If the user calls this function with the
         *  ::ZB_SEC_MAN_FLAG_EUI_IS_VALID bit set in the
         *  context->flag field, then the eui64 field in the context argument
         *  dictates which entry to retrieve. If the context->core_key_type argument is
         *  set to SL_ZB_SEC_MAN_KEY_TYPE_NETWORK, an error is returned as network keys
         *  are not tied to any specific EUI.
         *  If neither the ::ZB_SEC_MAN_FLAG_KEY_INDEX_IS_VALID bit nor the
         *  ::ZB_SEC_MAN_FLAG_EUI_IS_VALID bit is set in context->flags, then an error
         *  will be returned by this function.
         *  Upon success in fetching a key, the other fields in this argument are
         *  updated (e.g. a successful search by key_index will update the euii64
         *  field).
         *
         * @returns keyData sl_zb_sec_man_aps_key_metadata_t* [OUT] Metadata to fill in.
         *
         * @returns SLStatus.OK if successful, SLStatus.NOT_FOUND if
         *  the key_index or eui64 does not result in a found entry,
         *  SLStatus.INVALID_TYPE if the core key type is not an APS layer key (e.g.
         *  SL_ZB_SEC_MAN_KEY_TYPE_NETWORK), or SLStatus.INVALID_MODE if core_key_type
         *  is SL_ZB_SEC_MAN_KEY_TYPE_TC_LINK and the initial security state does not
         *  indicate the a preconfigured key has been set (that is, both
         *  EMBER_HAVE_PRECONFIGURED_KEY and
         *  EMBER_GET_PRECONFIGURED_KEY_FROM_INSTALL_CODE have not been set in the
         *  initial security state).
         */
        const sendBuffalo = this.startCommand(EzspFrameID.GET_APS_KEY_INFO);
        sendBuffalo.writeSecManContext(context);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            context.eui64 = this.buffalo.readIeeeAddr();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();
            const status = this.buffalo.readUInt32();

            return [status, keyData];
        } else {
            const status = this.buffalo.readUInt32();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();
            context = this.buffalo.readSecManContext();

            return [status, keyData];
        }
    }

    /**
     * Import an application link key into the key table.
     * @param index uint8_t Index where this key is to be imported to.
     * @param address EUI64 this key is associated with.
     * @param plaintextKey sl_zb_sec_man_key_t * The key data to be imported.
     * @returns Status of key import operation.
     */
    async ezspImportLinkKey(index: number, address: EUI64, plaintextKey: SecManKey): Promise<SLStatus> {
        /**
         * Import a link key, or SL_ZB_SEC_MAN_KEY_TYPE_APP_LINK key, into storage.
         *
         * @param index uint8_t [IN] The index to set or overwrite in the key table for keys of
         * type SL_ZB_SEC_MAN_KEY_TYPE_APP_LINK.  If index is set to 0xFF (255), then
         * the key will either overwrite whichever key table entry has an EUI of address
         * (if one exists) or write to the first available key table entry.  The index
         * that the key was placed into will not be returned by this API.
         * @param address EUI64 [IN] The EUI belonging to the key.
         * @param plaintext_key sl_zb_sec_man_key_t* [IN] A pointer to the key to import.
         *
         * @return SLStatus.OK upon success, a valid error code otherwise.
         *
         */
        const sendBuffalo = this.startCommand(EzspFrameID.IMPORT_LINK_KEY);
        sendBuffalo.writeUInt8(index);
        sendBuffalo.writeIeeeAddr(address);
        sendBuffalo.writeSecManKey(plaintextKey);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Export the link key at given index from the key table.
     * @param uint8_t  Index of key to export.
     * @returns Status of key export operation.
     * @returns sl_zigbee_sec_man_context_t * Context referencing the exported key. Contains information like the EUI64 address it is associated with.
     * @returns sl_zb_sec_man_key_t * The exported key.
     * @returns sl_zb_sec_man_aps_key_metadata_t * Metadata about the key.
     */
    async ezspExportLinkKeyByIndex(
        index: number,
    ): Promise<[SLStatus, context: SecManContext, plaintextKey: SecManKey, keyData: SecManAPSKeyMetadata]> {
        /**
         * Export an APS link key by index.
         *
         * @param index uint8_t
         * @param address EUI64
         * @param plaintext_key sl_zb_sec_man_key_t*
         * @param key_data sl_zb_sec_man_aps_key_metadata_t*
         */
        const sendBuffalo = this.startCommand(EzspFrameID.EXPORT_LINK_KEY_BY_INDEX);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            const context = initSecurityManagerContext();
            context.coreKeyType = SecManKeyType.APP_LINK;
            context.keyIndex = index;
            context.eui64 = this.buffalo.readIeeeAddr();
            const plaintextKey = this.buffalo.readSecManKey();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();
            const status = this.buffalo.readUInt32();

            return [status, context, plaintextKey, keyData];
        } else {
            const status = this.buffalo.readUInt32();
            const context = this.buffalo.readSecManContext();
            const plaintextKey = this.buffalo.readSecManKey();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();

            return [status, context, plaintextKey, keyData];
        }
    }

    /**
     * Export the link key associated with the given EUI from the key table.
     * @param eui EUI64 associated with the key to export.
     * @returns Status of key export operation.
     * @returns sl_zb_sec_man_key_t * The exported key.
     * @returns sl_zigbee_sec_man_context_t * Context referencing the exported key. Contains information like the EUI64 address it is associated with.
     * @returns sl_zb_sec_man_aps_key_metadata_t * Metadata about the key.
     */
    async ezspExportLinkKeyByEui(eui: EUI64): Promise<[SLStatus, context: SecManContext, plaintextKey: SecManKey, keyData: SecManAPSKeyMetadata]> {
        /**
         * Search through the Key table to find an entry that has the same EUI address as the passed value.
         * If NULL is passed in for the address then it finds the first unused entry and sets the index in the context.
         * It is valid to pass in NULL to plaintext_key or key_data in case the index of the referenced key is desired
         * but not its value or other metadata.
         * @param eui EUI64
         * @param context sl_zb_sec_man_context_t*
         * @param plaintext_key sl_zb_sec_man_key_t*
         * @param key_data sl_zb_sec_man_aps_key_metadata_t*
         */
        const sendBuffalo = this.startCommand(EzspFrameID.EXPORT_LINK_KEY_BY_EUI);
        sendBuffalo.writeIeeeAddr(eui);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            const plaintextKey = this.buffalo.readSecManKey();
            const context = initSecurityManagerContext();
            context.coreKeyType = SecManKeyType.APP_LINK;
            context.keyIndex = this.buffalo.readUInt8();
            context.eui64 = eui;
            const keyData = this.buffalo.readSecManAPSKeyMetadata();
            const status = this.buffalo.readUInt32();

            return [status, context, plaintextKey, keyData];
        } else {
            const status = this.buffalo.readUInt32();
            const context = this.buffalo.readSecManContext();
            const plaintextKey = this.buffalo.readSecManKey();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();

            return [status, context, plaintextKey, keyData];
        }
    }

    /**
     * Check whether a key context can be used to load a valid key.
     * @param context sl_zb_sec_man_context_t * Context struct to check the validity of.
     * @returns Validity of the checked context.
     */
    async ezspCheckKeyContext(context: SecManContext): Promise<SLStatus> {
        /**
         * Check that the passed key exists and can be successfully loaded.
         * This function does not actually load the context, but only checks that it can be loaded.
         *
         * @param context sl_zb_sec_man_context_t* [IN] The context to check for validity. The fields that must be set depend
         * on the key type set in the context, as enough information is needed to identify the key.
         *
         * @return SLStatus SLStatus.OK upon success, SLStatus.NOT_FOUND otherwise.
         */
        const sendBuffalo = this.startCommand(EzspFrameID.CHECK_KEY_CONTEXT);
        sendBuffalo.writeSecManContext(context);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Import a transient link key.
     * @param eui64 EUI64 associated with this transient key.
     * @param plaintextKey sl_zb_sec_man_key_t * The key to import.
     * @param flags sl_zigbee_sec_man_flags_t (unused in v14+) Flags associated with this transient key.
     * @returns Status of key import operation.
     */
    async ezspImportTransientKey(eui64: EUI64, plaintextKey: SecManKey, flags: SecManFlag = SecManFlag.NONE): Promise<SLStatus> {
        /**
         * @brief Add a transient or temporary key entry to key storage.
         * A key entry added with this API is timed out after
         * ::EMBER_TRANSIENT_KEY_TIMEOUT_S seconds, unless the key entry was added using
         * the Network Creator Security component, in which case the key will time out
         * after the longer between
         * ::EMBER_AF_PLUGIN_NETWORK_CREATOR_SECURITY_NETWORK_OPEN_TIME_S seconds and
         * ::EMBER_TRANSIENT_KEY_TIMEOUT_S seconds.
         */
        const sendBuffalo = this.startCommand(EzspFrameID.IMPORT_TRANSIENT_KEY);
        sendBuffalo.writeIeeeAddr(eui64);
        sendBuffalo.writeSecManKey(plaintextKey);

        if (this.version < 0x0e) {
            sendBuffalo.writeUInt8(flags);
        }

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * Export a transient link key from a given table index.
     * @param uint8_t Index to export from.
     * @returns Status of key export operation.
     * @returns sl_zb_sec_man_context_t * Context struct for export operation.
     * @returns sl_zb_sec_man_key_t * The exported key.
     * @returns sl_zb_sec_man_aps_key_metadata_t * Metadata about the key.
     */
    async ezspExportTransientKeyByIndex(
        index: number,
    ): Promise<[SLStatus, context: SecManContext, plaintextKey: SecManKey, key_data: SecManAPSKeyMetadata]> {
        const sendBuffalo = this.startCommand(EzspFrameID.EXPORT_TRANSIENT_KEY_BY_INDEX);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            const context = this.buffalo.readSecManContext();
            const plaintextKey = this.buffalo.readSecManKey();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();
            const status = this.buffalo.readUInt32();

            return [status, context, plaintextKey, keyData];
        } else {
            const status = this.buffalo.readUInt32();
            const context = this.buffalo.readSecManContext();
            const plaintextKey = this.buffalo.readSecManKey();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();

            return [status, context, plaintextKey, keyData];
        }
    }

    /**
     * Export a transient link key associated with a given EUI64
     * @param eui Index to export from.
     * @returns Status of key export operation.
     * @returns sl_zb_sec_man_context_t * Context struct for export operation.
     * @returns sl_zb_sec_man_key_t * The exported key.
     * @returns sl_zb_sec_man_aps_key_metadata_t * Metadata about the key.
     */
    async ezspExportTransientKeyByEui(
        eui: EUI64,
    ): Promise<[SLStatus, context: SecManContext, plaintextKey: SecManKey, key_data: SecManAPSKeyMetadata]> {
        const sendBuffalo = this.startCommand(EzspFrameID.EXPORT_TRANSIENT_KEY_BY_EUI);
        sendBuffalo.writeIeeeAddr(eui);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        if (this.version < 0x0e) {
            const context = this.buffalo.readSecManContext();
            const plaintextKey = this.buffalo.readSecManKey();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();
            const status = this.buffalo.readUInt32();

            return [status, context, plaintextKey, keyData];
        } else {
            const status = this.buffalo.readUInt32();
            const context = this.buffalo.readSecManContext();
            const plaintextKey = this.buffalo.readSecManKey();
            const keyData = this.buffalo.readSecManAPSKeyMetadata();

            return [status, context, plaintextKey, keyData];
        }
    }

    /**
     * Set the incoming TC link key frame counter to desired value.
     * @param frameCounter Value to set the frame counter to.
     */
    async ezspSetIncomingTcLinkKeyFrameCounter(frameCounter: number): Promise<void> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.SET_INCOMING_TC_LINK_KEY_FRAME_COUNTER);
        sendBuffalo.writeUInt32(frameCounter);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Encrypt/decrypt a message in-place using APS.
     * @param encrypt Encrypt (true) or decrypt (false) the message.
     * @param lengthCombinedArg uint8_t Length of the array containing message, needs to be long enough to include the auxiliary header and MIC.
     * @param message uint8_t * The message to be en/de-crypted.
     * @param apsHeaderEndIndex uint8_t Index just past the APS frame.
     * @param remoteEui64 IEEE address of the device this message is associated with.
     * @returns Status of the encryption/decryption call.
     */
    async ezspApsCryptMessage(
        encrypt: boolean,
        lengthCombinedArg: number,
        message: Buffer,
        apsHeaderEndIndex: number,
        remoteEui64: EUI64,
    ): Promise<[SLStatus, cryptedMessage: Buffer]> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.APS_CRYPT_MESSAGE);
        sendBuffalo.writeUInt8(encrypt ? 1 : 0);
        sendBuffalo.writeUInt8(lengthCombinedArg);
        sendBuffalo.writeBuffer(message, lengthCombinedArg);
        sendBuffalo.writeUInt8(apsHeaderEndIndex);
        sendBuffalo.writeIeeeAddr(remoteEui64);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();
        const cryptedMessage = this.buffalo.readBuffer(lengthCombinedArg);

        return [status, cryptedMessage];
    }

    //-----------------------------------------------------------------------------
    // Trust Center Frames
    //-----------------------------------------------------------------------------

    /**
     * Callback
     * The NCP used the trust center behavior policy to decide whether to allow a
     * new node to join the network. The Host cannot change the current decision,
     * but it can change the policy for future decisions using the setPolicy
     * command.
     * @param newNodeId The Node Id of the node whose status changed
     * @param newNodeEui64 The EUI64 of the node whose status changed.
     * @param status The status of the node: Secure Join/Rejoin, Unsecure Join/Rejoin, Device left.
     * @param policyDecision An EmberJoinDecision reflecting the decision made.
     * @param parentOfNewNodeId The parent of the node whose status has changed.
     */
    ezspTrustCenterJoinHandler(
        newNodeId: NodeId,
        newNodeEui64: EUI64,
        status: EmberDeviceUpdate,
        policyDecision: EmberJoinDecision,
        parentOfNewNodeId: NodeId,
    ): void {
        logger.debug(
            `ezspTrustCenterJoinHandler(): callback called with: [newNodeId=${newNodeId}], [newNodeEui64=${newNodeEui64}], ` +
                `[status=${EmberDeviceUpdate[status]}], [policyDecision=${EmberJoinDecision[policyDecision]}], [parentOfNewNodeId=${parentOfNewNodeId}]`,
            NS,
        );
        // NOTE: this is mostly just passing stuff up to Z2M, so use only one emit for all, let adapter do the rest, no parsing needed
        this.emit('trustCenterJoin', newNodeId, newNodeEui64, status, policyDecision, parentOfNewNodeId);
    }

    /**
     * This function broadcasts a new encryption key, but does not tell the nodes in
     * the network to start using it. To tell nodes to switch to the new key, use
     * ezspBroadcastNetworkKeySwitch(). This is only valid for the Trust
     * Center/Coordinator. It is up to the application to determine how quickly to
     * send the Switch Key after sending the alternate encryption key.
     * @param key EmberKeyData * An optional pointer to a 16-byte encryption key (EMBER_ENCRYPTION_KEY_SIZE).
     *        An all zero key may be passed in, which will cause the stack to randomly generate a new key.
     * @returns SLStatus value that indicates the success or failure of the command.
     */
    async ezspBroadcastNextNetworkKey(key: EmberKeyData): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.BROADCAST_NEXT_NETWORK_KEY);
        sendBuffalo.writeEmberKeyData(key);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This function broadcasts a switch key message to tell all nodes to change to
     * the sequence number of the previously sent Alternate Encryption Key.
     * @returns SLStatus value that indicates the success or failure of the command.
     */
    async ezspBroadcastNetworkKeySwitch(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.BROADCAST_NETWORK_KEY_SWITCH);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This routine processes the passed chunk of data and updates the hash context
     * based on it. If the 'finalize' parameter is not set, then the length of the
     * data passed in must be a multiple of 16. If the 'finalize' parameter is set
     * then the length can be any value up 1-16, and the final hash value will be
     * calculated.
     * @param context EmberAesMmoHashContext * The hash context to update.
     * @param finalize This indicates whether the final hash value should be calculated
     * @param data uint8_t * The data to hash.
     * @returns The result of the operation
     * @returns EmberAesMmoHashContext * The updated hash context.
     */
    async ezspAesMmoHash(
        context: EmberAesMmoHashContext,
        finalize: boolean,
        data: Buffer,
    ): Promise<[SLStatus, returnContext: EmberAesMmoHashContext]> {
        const sendBuffalo = this.startCommand(EzspFrameID.AES_MMO_HASH);
        sendBuffalo.writeEmberAesMmoHashContext(context);
        sendBuffalo.writeUInt8(finalize ? 1 : 0);
        sendBuffalo.writePayload(data);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const returnContext = this.buffalo.readEmberAesMmoHashContext();

        return [status, returnContext];
    }

    /**
     * This command sends an APS remove device using APS encryption to the
     * destination indicating either to remove itself from the network, or one of
     * its children.
     * @param destShort The node ID of the device that will receive the message
     * @param destLong The long address (EUI64) of the device that will receive the message.
     * @param targetLong The long address (EUI64) of the device to be removed.
     * @returns An SLStatus value indicating success, or the reason for failure
     */
    async ezspRemoveDevice(destShort: NodeId, destLong: EUI64, targetLong: EUI64): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.REMOVE_DEVICE);
        sendBuffalo.writeUInt16(destShort);
        sendBuffalo.writeIeeeAddr(destLong);
        sendBuffalo.writeIeeeAddr(targetLong);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This command will send a unicast transport key message with a new NWK key to
     * the specified device. APS encryption using the device's existing link key
     * will be used.
     * @param destShort The node ID of the device that will receive the message
     * @param destLong The long address (EUI64) of the device that will receive the message.
     * @param key EmberKeyData * The NWK key to send to the new device.
     * @returns An SLStatus value indicating success, or the reason for failure
     */
    async ezspUnicastNwkKeyUpdate(destShort: NodeId, destLong: EUI64, key: EmberKeyData): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.UNICAST_NWK_KEY_UPDATE);
        sendBuffalo.writeUInt16(destShort);
        sendBuffalo.writeIeeeAddr(destLong);
        sendBuffalo.writeEmberKeyData(key);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    //-----------------------------------------------------------------------------
    // Certificate Based Key Exchange (CBKE) Frames
    //-----------------------------------------------------------------------------

    /**
     * This call starts the generation of the ECC Ephemeral Public/Private key pair.
     * When complete it stores the private key. The results are returned via
     * ezspGenerateCbkeKeysHandler().
     */
    async ezspGenerateCbkeKeys(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.GENERATE_CBKE_KEYS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback by the Crypto Engine indicating that a new ephemeral
     * public/private key pair has been generated. The public/private key pair is
     * stored on the NCP, but only the associated public key is returned to the
     * host. The node's associated certificate is also returned.
     * @param status The result of the CBKE operation.
     * @param ephemeralPublicKey EmberPublicKeyData * The generated ephemeral public key.
     */
    ezspGenerateCbkeKeysHandler(status: SLStatus, ephemeralPublicKey: EmberPublicKeyData): void {
        logger.debug(
            `ezspGenerateCbkeKeysHandler(): callback called with: [status=${SLStatus[status]}], [ephemeralPublicKey=${ephemeralPublicKey}]`,
            NS,
        );
    }

    /**
     * Calculates the SMAC verification keys for both the initiator and responder
     * roles of CBKE using the passed parameters and the stored public/private key
     * pair previously generated with ezspGenerateKeysRetrieveCert(). It also stores
     * the unverified link key data in temporary storage on the NCP until the key
     * establishment is complete.
     * @param amInitiator The role of this device in the Key Establishment protocol.
     * @param partnerCertificate EmberCertificateData * The key establishment partner's implicit certificate.
     * @param partnerEphemeralPublicKey EmberPublicKeyData * The key establishment partner's ephemeral public key
     */
    async ezspCalculateSmacs(
        amInitiator: boolean,
        partnerCertificate: EmberCertificateData,
        partnerEphemeralPublicKey: EmberPublicKeyData,
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.CALCULATE_SMACS);
        sendBuffalo.writeUInt8(amInitiator ? 1 : 0);
        sendBuffalo.writeEmberCertificateData(partnerCertificate);
        sendBuffalo.writeEmberPublicKeyData(partnerEphemeralPublicKey);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback to indicate that the NCP has finished calculating the Secure
     * Message Authentication Codes (SMAC) for both the initiator and responder. The
     * associated link key is kept in temporary storage until the host tells the NCP
     * to store or discard the key via emberClearTemporaryDataMaybeStoreLinkKey().
     * @param status The Result of the CBKE operation.
     * @param initiatorSmac EmberSmacData * The calculated value of the initiator's SMAC
     * @param responderSmac EmberSmacData * The calculated value of the responder's SMAC
     */
    ezspCalculateSmacsHandler(status: SLStatus, initiatorSmac: EmberSmacData, responderSmac: EmberSmacData): void {
        logger.debug(
            `ezspCalculateSmacsHandler(): callback called with: [status=${SLStatus[status]}], [initiatorSmac=${initiatorSmac}], [responderSmac=${responderSmac}]`,
            NS,
        );
    }

    /**
     * This call starts the generation of the ECC 283k1 curve Ephemeral
     * Public/Private key pair. When complete it stores the private key. The results
     * are returned via ezspGenerateCbkeKeysHandler283k1().
     */
    async ezspGenerateCbkeKeys283k1(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.GENERATE_CBKE_KEYS283K1);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback by the Crypto Engine indicating that a new 283k1 ephemeral
     * public/private key pair has been generated. The public/private key pair is
     * stored on the NCP, but only the associated public key is returned to the
     * host. The node's associated certificate is also returned.
     * @param status The result of the CBKE operation.
     * @param ephemeralPublicKey EmberPublicKey283k1Data * The generated ephemeral public key.
     */
    ezspGenerateCbkeKeysHandler283k1(status: SLStatus, ephemeralPublicKey: EmberPublicKey283k1Data): void {
        logger.debug(
            `ezspGenerateCbkeKeysHandler283k1(): callback called with: [status=${SLStatus[status]}], [ephemeralPublicKey=${ephemeralPublicKey}]`,
            NS,
        );
    }

    /**
     * Calculates the SMAC verification keys for both the initiator and responder
     * roles of CBKE for the 283k1 ECC curve using the passed parameters and the
     * stored public/private key pair previously generated with
     * ezspGenerateKeysRetrieveCert283k1(). It also stores the unverified link key
     * data in temporary storage on the NCP until the key establishment is complete.
     * @param amInitiator The role of this device in the Key Establishment protocol.
     * @param partnerCertificate EmberCertificate283k1Data * The key establishment partner's implicit certificate.
     * @param partnerEphemeralPublicKey EmberPublicKey283k1Data * The key establishment partner's ephemeral public key
     */
    async ezspCalculateSmacs283k1(
        amInitiator: boolean,
        partnerCertificate: EmberCertificate283k1Data,
        partnerEphemeralPublicKey: EmberPublicKey283k1Data,
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.CALCULATE_SMACS283K1);
        sendBuffalo.writeUInt8(amInitiator ? 1 : 0);
        sendBuffalo.writeEmberCertificate283k1Data(partnerCertificate);
        sendBuffalo.writeEmberPublicKey283k1Data(partnerEphemeralPublicKey);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback to indicate that the NCP has finished calculating the Secure
     * Message Authentication Codes (SMAC) for both the initiator and responder for
     * the CBKE 283k1 Library. The associated link key is kept in temporary storage
     * until the host tells the NCP to store or discard the key via
     * emberClearTemporaryDataMaybeStoreLinkKey().
     * @param status The Result of the CBKE operation.
     * @param initiatorSmac EmberSmacData * The calculated value of the initiator's SMAC
     * @param responderSmac EmberSmacData * The calculated value of the responder's SMAC
     */
    ezspCalculateSmacsHandler283k1(status: SLStatus, initiatorSmac: EmberSmacData, responderSmac: EmberSmacData): void {
        logger.debug(
            `ezspCalculateSmacsHandler283k1(): callback called with: [status=${SLStatus[status]}], [initiatorSmac=${initiatorSmac}], [responderSmac=${responderSmac}]`,
            NS,
        );
    }

    /**
     * Clears the temporary data associated with CBKE and the key establishment,
     * most notably the ephemeral public/private key pair. If storeLinKey is true it
     * moves the unverified link key stored in temporary storage into the link key
     * table. Otherwise it discards the key.
     * @param storeLinkKey A bool indicating whether to store (true) or discard (false) the unverified link
     *        key derived when ezspCalculateSmacs() was previously called.
     */
    async ezspClearTemporaryDataMaybeStoreLinkKey(storeLinkKey: boolean): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.CLEAR_TEMPORARY_DATA_MAYBE_STORE_LINK_KEY);
        sendBuffalo.writeUInt8(storeLinkKey ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Clears the temporary data associated with CBKE and the key establishment,
     * most notably the ephemeral public/private key pair. If storeLinKey is true it
     * moves the unverified link key stored in temporary storage into the link key
     * table. Otherwise it discards the key.
     * @param storeLinkKey A bool indicating whether to store (true) or discard (false) the unverified link
     *        key derived when ezspCalculateSmacs() was previously called.
     */
    async ezspClearTemporaryDataMaybeStoreLinkKey283k1(storeLinkKey: boolean): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.CLEAR_TEMPORARY_DATA_MAYBE_STORE_LINK_KEY283K1);
        sendBuffalo.writeUInt8(storeLinkKey ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Retrieves the certificate installed on the NCP.
     * @returns EmberCertificateData * The locally installed certificate.
     */
    async ezspGetCertificate(): Promise<[SLStatus, localCert: EmberCertificateData]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_CERTIFICATE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const localCert = this.buffalo.readEmberCertificateData();

        return [status, localCert];
    }

    /**
     * Retrieves the 283k certificate installed on the NCP.
     * @returns EmberCertificate283k1Data * The locally installed certificate.
     */
    async ezspGetCertificate283k1(): Promise<[SLStatus, localCert: EmberCertificate283k1Data]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_CERTIFICATE283K1);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const localCert = this.buffalo.readEmberCertificate283k1Data();

        return [status, localCert];
    }

    /**
     * Callback
     * The handler that returns the results of the signing operation. On success,
     * the signature will be appended to the original message (including the
     * signature type indicator that replaced the startIndex field for the signing)
     * and both are returned via this callback.
     * @param status The result of the DSA signing operation.
     * @param messageLength uint8_t The length of the messageContents parameter in bytes.
     * @param messageContents uint8_t *The message and attached which includes the original message and the appended signature.
     */
    ezspDsaSignHandler(status: SLStatus, messageContents: Buffer): void {
        logger.debug(
            `ezspDsaSignHandler(): callback called with: [status=${SLStatus[status]}], [messageContents=${messageContents.toString('hex')}]`,
            NS,
        );
    }

    /**
     * Verify that signature of the associated message digest was signed by the
     * private key of the associated certificate.
     * @param digest EmberMessageDigest * The AES-MMO message digest of the signed data.
     *        If dsaSign command was used to generate the signature for this data, the final byte (replaced by signature type of 0x01)
     *        in the messageContents array passed to dsaSign is included in the hash context used for the digest calculation.
     * @param signerCertificate EmberCertificateData * The certificate of the signer. Note that the signer's certificate and the verifier's
     *        certificate must both be issued by the same Certificate Authority, so they should share the same CA Public Key.
     * @param receivedSig EmberSignatureData * The signature of the signed data.
     */
    async ezspDsaVerify(digest: EmberMessageDigest, signerCertificate: EmberCertificateData, receivedSig: EmberSignatureData): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.DSA_VERIFY);
        sendBuffalo.writeEmberMessageDigest(digest);
        sendBuffalo.writeEmberCertificateData(signerCertificate);
        sendBuffalo.writeEmberSignatureData(receivedSig);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * This callback is executed by the stack when the DSA verification has
     * completed and has a result. If the result is EMBER_SUCCESS, the signature is
     * valid. If the result is EMBER_SIGNATURE_VERIFY_FAILURE then the signature is
     * invalid. If the result is anything else then the signature verify operation
     * failed and the validity is unknown.
     * @param status The result of the DSA verification operation.
     */
    ezspDsaVerifyHandler(status: SLStatus): void {
        logger.debug(`ezspDsaVerifyHandler(): callback called with: [status=${SLStatus[status]}]`, NS);
    }

    /**
     * Verify that signature of the associated message digest was signed by the
     * private key of the associated certificate.
     * @param digest EmberMessageDigest * The AES-MMO message digest of the signed data.
     *        If dsaSign command was used to generate the signature for this data, the final byte (replaced by signature type of 0x01)
     *        in the messageContents array passed to dsaSign is included in the hash context used for the digest calculation.
     * @param signerCertificate EmberCertificate283k1Data * The certificate of the signer. Note that the signer's certificate and the verifier's
     *        certificate must both be issued by the same Certificate Authority, so they should share the same CA Public Key.
     * @param receivedSig EmberSignature283k1Data * The signature of the signed data.
     */
    async ezspDsaVerify283k1(
        digest: EmberMessageDigest,
        signerCertificate: EmberCertificate283k1Data,
        receivedSig: EmberSignature283k1Data,
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.DSA_VERIFY283K1);
        sendBuffalo.writeEmberMessageDigest(digest);
        sendBuffalo.writeEmberCertificate283k1Data(signerCertificate);
        sendBuffalo.writeEmberSignature283k1Data(receivedSig);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sets the device's CA public key, local certificate, and static private key on
     * the NCP associated with this node.
     * @param caPublic EmberPublicKeyData * The Certificate Authority's public key.
     * @param myCert EmberCertificateData * The node's new certificate signed by the CA.
     * @param myKey EmberPrivateKeyData *The node's new static private key.
     */
    async ezspSetPreinstalledCbkeData(caPublic: EmberPublicKeyData, myCert: EmberCertificateData, myKey: EmberPrivateKeyData): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_PREINSTALLED_CBKE_DATA);
        sendBuffalo.writeEmberPublicKeyData(caPublic);
        sendBuffalo.writeEmberCertificateData(myCert);
        sendBuffalo.writeEmberPrivateKeyData(myKey);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sets the device's 283k1 curve CA public key, local certificate, and static
     * private key on the NCP associated with this node.
     * @returns Status of operation
     */
    async ezspSavePreinstalledCbkeData283k1(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SAVE_PREINSTALLED_CBKE_DATA283K1);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    //-----------------------------------------------------------------------------
    // Mfglib Frames
    //-----------------------------------------------------------------------------

    /**
     * Activate use of mfglib test routines and enables the radio receiver to report
     * packets it receives to the mfgLibRxHandler() callback. These packets will not
     * be passed up with a CRC failure. All other mfglib functions will return an
     * error until the mfglibStart() has been called
     * @param rxCallback true to generate a mfglibRxHandler callback when a packet is received.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalStart(rxCallback: boolean): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_START);
        sendBuffalo.writeUInt8(rxCallback ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Deactivate use of mfglib test routines; restores the hardware to the state it
     * was in prior to mfglibStart() and stops receiving packets started by
     * mfglibStart() at the same time.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalEnd(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_END);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Starts transmitting an unmodulated tone on the currently set channel and
     * power level. Upon successful return, the tone will be transmitting. To stop
     * transmitting tone, application must call mfglibStopTone(), allowing it the
     * flexibility to determine its own criteria for tone duration (time, event,
     * etc.)
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalStartTone(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_START_TONE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Stops transmitting tone started by mfglibStartTone().
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalStopTone(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_STOP_TONE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Starts transmitting a random stream of characters. This is so that the radio
     * modulation can be measured.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalStartStream(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_START_STREAM);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Stops transmitting a random stream of characters started by
     * mfglibStartStream().
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalStopStream(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_STOP_STREAM);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sends a single packet consisting of the following bytes: packetLength,
     * packetContents[0], ... , packetContents[packetLength - 3], CRC[0], CRC[1].
     * The total number of bytes sent is packetLength + 1. The radio replaces the
     * last two bytes of packetContents[] with the 16-bit CRC for the packet.
     * @param packetLength uint8_t The length of the packetContents parameter in bytes. Must be greater than 3 and less than 123.
     * @param packetContents uint8_t * The packet to send. The last two bytes will be replaced with the 16-bit CRC.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalSendPacket(packetContents: Buffer): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_SEND_PACKET);
        sendBuffalo.writePayload(packetContents);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Sets the radio channel. Calibration occurs if this is the first time the
     * channel has been used.
     * @param channel uint8_t The channel to switch to. Valid values are 11 - 26.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalSetChannel(channel: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_SET_CHANNEL);
        sendBuffalo.writeUInt8(channel);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Returns the current radio channel, as previously set via mfglibSetChannel().
     * @returns uint8_t The current channel.
     */
    async mfglibInternalGetChannel(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_GET_CHANNEL);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const channel = this.buffalo.readUInt8();

        return channel;
    }

    /**
     * First select the transmit power mode, and then include a method for selecting
     * the radio transmit power. The valid power settings depend upon the specific
     * radio in use. Ember radios have discrete power settings, and then requested
     * power is rounded to a valid power setting; the actual power output is
     * available to the caller via mfglibGetPower().
     * @param txPowerMode uint16_t Power mode. Refer to txPowerModes in stack/include/ember-types.h for possible values.
     * @param power int8_t Power in units of dBm. Refer to radio data sheet for valid range.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async mfglibInternalSetPower(txPowerMode: EmberTXPowerMode, power: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_SET_POWER);
        sendBuffalo.writeUInt16(txPowerMode);
        sendBuffalo.writeInt8(power);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Returns the current radio power setting, as previously set via mfglibSetPower().
     * @returns int8_t Power in units of dBm. Refer to radio data sheet for valid range.
     */
    async mfglibInternalGetPower(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.MFGLIB_INTERNAL_GET_POWER);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const power = this.buffalo.readInt8();

        return power;
    }

    /**
     * Callback
     * A callback indicating a packet with a valid CRC has been received.
     * @param linkQuality uint8_t The link quality observed during the reception
     * @param rssi int8_t The energy level (in units of dBm) observed during the reception.
     * @param packetContents uint8_t * The received packet (last 2 bytes are not FCS / CRC and may be discarded)
     *        Length will be greater than 3 and less than 123.
     */
    ezspMfglibRxHandler(linkQuality: number, rssi: number, packetContents: Buffer): void {
        logger.debug(
            `ezspMfglibRxHandler(): callback called with: [linkQuality=${linkQuality}], [rssi=${rssi}], [packetContents=${packetContents.toString('hex')}]`,
            NS,
        );
    }

    //-----------------------------------------------------------------------------
    // Bootloader Frames
    //-----------------------------------------------------------------------------

    /**
     * Quits the current application and launches the standalone bootloader (if installed).
     * The function returns an error if the standalone bootloader is not present.
     * @param enabled If true, launch the standalone bootloader. If false, do nothing.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspLaunchStandaloneBootloader(enabled: boolean): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.LAUNCH_STANDALONE_BOOTLOADER);
        sendBuffalo.writeUInt8(enabled ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        // XXX: SDK says this is SLStatus, but received frame has just 1 byte, so, still EmberStatus
        const status = this.buffalo.readStatus(0);

        return status;
    }

    /**
     * Transmits the given bootload message to a neighboring node using a specific
     * 802.15.4 header that allows the EmberZNet stack as well as the bootloader to
     * recognize the message, but will not interfere with other ZigBee stacks.
     * @param broadcast If true, the destination address and pan id are both set to the broadcast address.
     * @param destEui64 The EUI64 of the target node. Ignored if the broadcast field is set to true.
     * @param messageLength uint8_t The length of the messageContents parameter in bytes.
     * @param messageContents uint8_t * The multicast message.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSendBootloadMessage(broadcast: boolean, destEui64: EUI64, messageContents: Buffer): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SEND_BOOTLOAD_MESSAGE);
        sendBuffalo.writeUInt8(broadcast ? 1 : 0);
        sendBuffalo.writeIeeeAddr(destEui64);
        sendBuffalo.writePayload(messageContents);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Detects if the standalone bootloader is installed, and if so returns the
     * installed version. If not return 0xffff. A returned version of 0x1234 would
     * indicate version 1.2 build 34. Also return the node's version of PLAT, MICRO
     * and PHY.
     * @returns uint16_t BOOTLOADER_INVALID_VERSION if the standalone bootloader is not present,
     *          or the version of the installed standalone bootloader.
     * @returns uint8_t * The value of PLAT on the node
     * @returns uint8_t * The value of MICRO on the node
     * @returns uint8_t * The value of PHY on the node
     */
    async ezspGetStandaloneBootloaderVersionPlatMicroPhy(): Promise<
        [bootloaderVersion: number, nodePlat: number, nodeMicro: number, nodePhy: number]
    > {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_STANDALONE_BOOTLOADER_VERSION_PLAT_MICRO_PHY);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const bootloaderVersion = this.buffalo.readUInt16();
        const nodePlat = this.buffalo.readUInt8();
        const nodeMicro = this.buffalo.readUInt8();
        const nodePhy = this.buffalo.readUInt8();

        return [bootloaderVersion, nodePlat, nodeMicro, nodePhy];
    }

    /**
     * Callback
     * A callback invoked by the EmberZNet stack when a bootload message is
     * received.
     * @param longId The EUI64 of the sending node.
     * @param packetInfo Information about the incoming packet.
     * @param messageContents uint8_t *The bootload message that was sent.
     */
    ezspIncomingBootloadMessageHandler(longId: EUI64, packetInfo: EmberRxPacketInfo, messageContents: Buffer): void {
        logger.debug(
            () =>
                `ezspIncomingBootloadMessageHandler(): callback called with: [longId=${longId}], [packetInfo=${JSON.stringify(packetInfo)}], [messageContents=${messageContents.toString('hex')}]`,
            NS,
        );
    }

    /**
     * Callback
     * A callback invoked by the EmberZNet stack when the MAC has finished
     * transmitting a bootload message.
     * @param status An EmberStatus value of SLStatus.OK if an ACK was received from the destination
     *        or SLStatus.ZIGBEE_DELIVERY_FAILED if no ACK was received.
     * @param messageLength uint8_t  The length of the messageContents parameter in bytes.
     * @param messageContents uint8_t * The message that was sent.
     */
    ezspBootloadTransmitCompleteHandler(status: SLStatus, messageContents: Buffer): void {
        logger.debug(
            `ezspBootloadTransmitCompleteHandler(): callback called with: [status=${SLStatus[status]}], [messageContents=${messageContents.toString('hex')}]`,
            NS,
        );
    }

    /**
     * Perform AES encryption on plaintext using key.
     * @param uint8_t * 16 bytes of plaintext.
     * @param uint8_t * The 16-byte encryption key to use.
     * @returns uint8_t * 16 bytes of ciphertext.
     */
    async ezspAesEncrypt(plaintext: number[], key: number[]): Promise<number[]> {
        const sendBuffalo = this.startCommand(EzspFrameID.AES_ENCRYPT);
        sendBuffalo.writeListUInt8(plaintext);
        sendBuffalo.writeListUInt8(key);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const ciphertext = this.buffalo.readListUInt8(EMBER_ENCRYPTION_KEY_SIZE);

        return ciphertext;
    }

    /**
     * Callback
     * A callback to be implemented on the Golden Node to process acknowledgements.
     * If you supply a custom version of this handler, you must define SL_ZIGBEE_APPLICATION_HAS_INCOMING_MFG_TEST_MESSAGE_HANDLER
     * in your application's CONFIGURATION_HEADER
     * @param messageType uint8_t The type of the incoming message. Currently, the only possibility is MFG_TEST_TYPE_ACK.
     * @param data uint8_t * A pointer to the data received in the current message.
     */
    ezspIncomingMfgTestMessageHandler(messageType: number, messageContents: Buffer): void {
        logger.debug(
            `ezspIncomingMfgTestMessageHandler(): callback called with: [messageType=${messageType}], [messageContents=${messageContents.toString('hex')}]`,
            NS,
        );
    }

    /**
     * A function used on the Golden Node to switch between normal network operation (for testing) and manufacturing configuration.
     * Like emberSleep(), it may not be possible to execute this command due to pending network activity.
     * For the transition from normal network operation to manufacturing configuration, it is customary to loop,
     * calling this function alternately with emberTick() until the mode change succeeds.
     * @param beginConfiguration Determines the new mode of operation.
     *        true causes the node to enter manufacturing configuration.
     *        false causes the node to return to normal network operation.
     * @returns An SLStatus value indicating success or failure of the command.
     */
    async ezspMfgTestSetPacketMode(beginConfiguration: boolean): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.MFG_TEST_SET_PACKET_MODE);
        sendBuffalo.writeUInt8(beginConfiguration ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * A function used during manufacturing configuration on the Golden Node to send the DUT a reboot command.
     * The usual practice is to execute this command at the end of manufacturing configuration,
     * to place the DUT into normal network operation for testing.
     * This function executes only during manufacturing configuration mode and returns an error otherwise.
     * If successful, the DUT acknowledges the reboot command within 20 milliseconds and then reboots.
     * @returns An SLStatus value indicating success or failure of the command.
     */
    async ezspMfgTestSendRebootCommand(): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.MFG_TEST_SEND_REBOOT_COMMAND);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * A function used during manufacturing configuration on the Golden Node to set the DUT's 8-byte EUI ID.
     * This function executes only during manufacturing configuration mode and returns an error otherwise.
     * If successful, the DUT acknowledges the new EUI ID within 150 milliseconds.
     * @param newId The 8-byte EUID for the DUT.
     * @returns An SLStatus value indicating success or failure of the command.
     */
    async ezspMfgTestSendEui64(newId: EUI64): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.MFG_TEST_SEND_EUI64);
        sendBuffalo.writeIeeeAddr(newId);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * A function used during manufacturing configuration on the Golden Node to set the DUT's 16-byte configuration string.
     * This function executes only during manufacturing configuration mode and will return an error otherwise.
     * If successful, the DUT will acknowledge the new string within 150 milliseconds.
     * @param newString The 16-byte manufacturing string.
     * @returns An SLStatus value indicating success or failure of the command.
     */
    async ezspMfgTestSendManufacturingString(newString: number[]): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.MFG_TEST_SEND_MANUFACTURING_STRING);
        sendBuffalo.writeListUInt16(newString); // expects 16 bytes

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * A function used during manufacturing configuration on the Golden Node to set the DUT's radio parameters.
     * This function executes only during manufacturing configuration mode and returns an error otherwise.
     * If successful, the DUT acknowledges the new parameters within 25 milliseconds.
     * @param supportedBands Sets the radio band for the DUT. See ember-common.h for possible values.
     * @param crystalOffset Sets the CC1020 crystal offset. This parameter has no effect on the EM2420, and it may safely be set to 0 for this RFIC.
     * @returns An SLStatus value indicating success or failure of the command.
     */
    async ezspMfgTestSendRadioParameters(supportedBands: number, crystalOffset: number): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.MFG_TEST_SEND_RADIO_PARAMETERS);
        sendBuffalo.writeUInt8(supportedBands);
        sendBuffalo.writeInt8(crystalOffset);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    /**
     * A function used in each of the manufacturing configuration API calls.
     * Most implementations will not need to call this function directly. See mfg-test.c for more detail.
     * This function executes only during manufacturing configuration mode and returns an error otherwise.
     * @param command A pointer to the outgoing command string.
     * @returns An SLStatus value indicating success or failure of the command.
     */
    async ezspMfgTestSendCommand(command: number): Promise<SLStatus> {
        if (this.version < 0x0e) {
            throw new EzspError(EzspStatus.ERROR_INVALID_FRAME_ID);
        }

        const sendBuffalo = this.startCommand(EzspFrameID.MFG_TEST_SEND_COMMAND);
        sendBuffalo.writeUInt8(command);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readUInt32();

        return status;
    }

    //-----------------------------------------------------------------------------
    // ZLL Frames
    //-----------------------------------------------------------------------------

    /**
     * A consolidation of ZLL network operations with similar signatures;
     * specifically, forming and joining networks or touch-linking.
     * @param networkInfo EmberZllNetwork * Information about the network.
     * @param op Operation indicator.
     * @param radioTxPower int8_t Radio transmission power.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspZllNetworkOps(networkInfo: EmberZllNetwork, op: EzspZllNetworkOperation, radioTxPower: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_NETWORK_OPS);
        sendBuffalo.writeEmberZllNetwork(networkInfo);
        sendBuffalo.writeUInt8(op);
        sendBuffalo.writeInt8(radioTxPower);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This call will cause the device to setup the security information used in its
     * network. It must be called prior to forming, starting, or joining a network.
     * @param networkKey EmberKeyData * ZLL Network key.
     * @param securityState EmberZllInitialSecurityState * Initial security state of the network.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspZllSetInitialSecurityState(networkKey: EmberKeyData, securityState: EmberZllInitialSecurityState): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_SET_INITIAL_SECURITY_STATE);
        sendBuffalo.writeEmberKeyData(networkKey);
        sendBuffalo.writeEmberZllInitialSecurityState(securityState);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This call will update ZLL security token information. Unlike
     * emberZllSetInitialSecurityState, this can be called while a network is
     * already established.
     * @param securityState EmberZllInitialSecurityState * Security state of the network.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspZllSetSecurityStateWithoutKey(securityState: EmberZllInitialSecurityState): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_SET_SECURITY_STATE_WITHOUT_KEY);
        sendBuffalo.writeEmberZllInitialSecurityState(securityState);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This call will initiate a ZLL network scan on all the specified channels.
     * @param channelMask uint32_t The range of channels to scan.
     * @param radioPowerForScan int8_t The radio output power used for the scan requests.
     * @param nodeType The node type of the local device.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspZllStartScan(channelMask: number, radioPowerForScan: number, nodeType: EmberNodeType): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_START_SCAN);
        sendBuffalo.writeUInt32(channelMask);
        sendBuffalo.writeInt8(radioPowerForScan);
        sendBuffalo.writeUInt8(nodeType);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * This call will change the mode of the radio so that the receiver is on for a
     * specified amount of time when the device is idle.
     * @param durationMs uint32_t The duration in milliseconds to leave the radio on.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspZllSetRxOnWhenIdle(durationMs: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_SET_RX_ON_WHEN_IDLE);
        sendBuffalo.writeUInt32(durationMs);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * This call is fired when a ZLL network scan finds a ZLL network.
     * @param networkInfo EmberZllNetwork * Information about the network.
     * @param isDeviceInfoNull Used to interpret deviceInfo field.
     * @param deviceInfo EmberZllDeviceInfoRecord * Device specific information.
     * @param packetInfo Information about the incoming packet received from this network.
     */
    ezspZllNetworkFoundHandler(
        networkInfo: EmberZllNetwork,
        isDeviceInfoNull: boolean,
        deviceInfo: EmberZllDeviceInfoRecord,
        packetInfo: EmberRxPacketInfo,
    ): void {
        logger.debug(
            () =>
                `ezspZllNetworkFoundHandler(): callback called with: [networkInfo=${networkInfo}], [isDeviceInfoNull=${isDeviceInfoNull}], [deviceInfo=${deviceInfo}], [packetInfo=${JSON.stringify(packetInfo)}]`,
            NS,
        );
    }

    /**
     * Callback
     * This call is fired when a ZLL network scan is complete.
     * @param status Status of the operation.
     */
    ezspZllScanCompleteHandler(status: SLStatus): void {
        logger.debug(`ezspZllScanCompleteHandler(): callback called with: [status=${SLStatus[status]}]`, NS);
    }

    /**
     * Callback
     * This call is fired when network and group addresses are assigned to a remote
     * mode in a network start or network join request.
     * @param addressInfo EmberZllAddressAssignment * Address assignment information.
     * @param packetInfo Information about the incoming packet received from this network.
     */
    ezspZllAddressAssignmentHandler(addressInfo: EmberZllAddressAssignment, packetInfo: EmberRxPacketInfo): void {
        logger.debug(
            () => `ezspZllAddressAssignmentHandler(): callback called with: [addressInfo=${addressInfo}], [packetInfo=${JSON.stringify(packetInfo)}]`,
            NS,
        );
    }

    /**
     * Callback
     * This call is fired when the device is a target of a touch link.
     * @param networkInfo EmberZllNetwork * Information about the network.
     */
    ezspZllTouchLinkTargetHandler(networkInfo: EmberZllNetwork): void {
        logger.debug(`ezspZllTouchLinkTargetHandler(): callback called with: [networkInfo=${networkInfo}]`, NS);
    }

    /**
     * Get the ZLL tokens.
     * @returns EmberTokTypeStackZllData * Data token return value.
     * @returns EmberTokTypeStackZllSecurity * Security token return value.
     */
    async ezspZllGetTokens(): Promise<[data: EmberTokTypeStackZllData, security: EmberTokTypeStackZllSecurity]> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_GET_TOKENS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const data = this.buffalo.readEmberTokTypeStackZllData();
        const security = this.buffalo.readEmberTokTypeStackZllSecurity();

        return [data, security];
    }

    /**
     * Set the ZLL data token.
     * @param data EmberTokTypeStackZllData * Data token to be set.
     */
    async ezspZllSetDataToken(data: EmberTokTypeStackZllData): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_SET_DATA_TOKEN);
        sendBuffalo.writeEmberTokTypeStackZllData(data);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Set the ZLL data token bitmask to reflect the ZLL network state.
     */
    async ezspZllSetNonZllNetwork(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_SET_NON_ZLL_NETWORK);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Is this a ZLL network?
     * @returns ZLL network?
     */
    async ezspIsZllNetwork(): Promise<boolean> {
        const sendBuffalo = this.startCommand(EzspFrameID.IS_ZLL_NETWORK);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const isZllNetwork = this.buffalo.readUInt8() !== 0;

        return isZllNetwork;
    }

    /**
     * This call sets the radio's default idle power mode.
     * @param mode The power mode to be set.
     */
    async ezspZllSetRadioIdleMode(mode: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_SET_RADIO_IDLE_MODE);
        sendBuffalo.writeUInt8(mode);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * This call gets the radio's default idle power mode.
     * @returns uint8_t The current power mode.
     */
    async ezspZllGetRadioIdleMode(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_GET_RADIO_IDLE_MODE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const radioIdleMode = this.buffalo.readUInt8();

        return radioIdleMode;
    }

    /**
     * This call sets the default node type for a factory new ZLL device.
     * @param nodeType The node type to be set.
     */
    async ezspSetZllNodeType(nodeType: EmberNodeType): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_ZLL_NODE_TYPE);
        sendBuffalo.writeUInt8(nodeType);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * This call sets additional capability bits in the ZLL state.
     * @param uint16_t A mask with the bits to be set or cleared.
     */
    async ezspSetZllAdditionalState(state: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_ZLL_ADDITIONAL_STATE);
        sendBuffalo.writeUInt16(state);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Is there a ZLL (Touchlink) operation in progress?
     * @returns ZLL operation in progress? false on error
     */
    async ezspZllOperationInProgress(): Promise<boolean> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_OPERATION_IN_PROGRESS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const zllOperationInProgress = this.buffalo.readUInt8() !== 0;
        return zllOperationInProgress;
    }

    /**
     * Is the ZLL radio on when idle mode is active?
     * @returns ZLL radio on when idle mode is active? false on error
     */
    async ezspZllRxOnWhenIdleGetActive(): Promise<boolean> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_RX_ON_WHEN_IDLE_GET_ACTIVE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const zllRxOnWhenIdleGetActive = this.buffalo.readUInt8() !== 0;

        return zllRxOnWhenIdleGetActive;
    }

    /**
     * Informs the ZLL API that application scanning is complete
     */
    async ezspZllScanningComplete(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_SCANNING_COMPLETE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Get the primary ZLL (touchlink) channel mask.
     * @returns uint32_t The primary ZLL channel mask
     */
    async ezspGetZllPrimaryChannelMask(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_ZLL_PRIMARY_CHANNEL_MASK);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const zllPrimaryChannelMask = this.buffalo.readUInt32();

        return zllPrimaryChannelMask;
    }

    /**
     * Get the secondary ZLL (touchlink) channel mask.
     * @returns uint32_t The secondary ZLL channel mask
     */
    async ezspGetZllSecondaryChannelMask(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_ZLL_SECONDARY_CHANNEL_MASK);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const zllSecondaryChannelMask = this.buffalo.readUInt32();

        return zllSecondaryChannelMask;
    }

    /**
     * Set the primary ZLL (touchlink) channel mask
     * @param uint32_t The primary ZLL channel mask
     */
    async ezspSetZllPrimaryChannelMask(zllPrimaryChannelMask: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_ZLL_PRIMARY_CHANNEL_MASK);
        sendBuffalo.writeUInt32(zllPrimaryChannelMask);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Set the secondary ZLL (touchlink) channel mask.
     * @param uint32_t The secondary ZLL channel mask
     */
    async ezspSetZllSecondaryChannelMask(zllSecondaryChannelMask: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_ZLL_SECONDARY_CHANNEL_MASK);
        sendBuffalo.writeUInt32(zllSecondaryChannelMask);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Clear ZLL stack tokens.
     */
    async ezspZllClearTokens(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.ZLL_CLEAR_TOKENS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    //-----------------------------------------------------------------------------
    // Green Power Frames
    //-----------------------------------------------------------------------------

    /**
     * Update the GP Proxy table based on a GP pairing.
     * @param options uint32_t The options field of the GP Pairing command.
     * @param addr EmberGpAddress * The target GPD.
     * @param commMode uint8_t The communication mode of the GP Sink.
     * @param sinkNetworkAddress uint16_t The network address of the GP Sink.
     * @param sinkGroupId uint16_t The group ID of the GP Sink.
     * @param assignedAlias uint16_t The alias assigned to the GPD.
     * @param sinkIeeeAddress uint8_t * The IEEE address of the GP Sink.
     * @param gpdKey EmberKeyData * The key to use for the target GPD.
     * @param gpdSecurityFrameCounter uint32_t The GPD security frame counter.
     * @param forwardingRadius uint8_t The forwarding radius.
     * @returns Whether a GP Pairing has been created or not.
     */
    async ezspGpProxyTableProcessGpPairing(
        options: number,
        addr: EmberGpAddress,
        commMode: number,
        sinkNetworkAddress: number,
        sinkGroupId: number,
        assignedAlias: number,
        sinkIeeeAddress: EUI64,
        gpdKey: EmberKeyData,
        gpdSecurityFrameCounter: number,
        forwardingRadius: number,
    ): Promise<boolean> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_PROXY_TABLE_PROCESS_GP_PAIRING);
        sendBuffalo.writeUInt32(options);
        sendBuffalo.writeEmberGpAddress(addr);
        sendBuffalo.writeUInt8(commMode);
        sendBuffalo.writeUInt16(sinkNetworkAddress);
        sendBuffalo.writeUInt16(sinkGroupId);
        sendBuffalo.writeUInt16(assignedAlias);
        sendBuffalo.writeIeeeAddr(sinkIeeeAddress);
        sendBuffalo.writeEmberKeyData(gpdKey);
        sendBuffalo.writeUInt32(gpdSecurityFrameCounter);
        sendBuffalo.writeUInt8(forwardingRadius);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const gpPairingAdded = this.buffalo.readUInt8() !== 0;

        return gpPairingAdded;
    }

    /**
     * Adds/removes an entry from the GP Tx Queue.
     * @param action The action to perform on the GP TX queue (true to add, false to remove).
     * @param useCca Whether to use ClearChannelAssessment when transmitting the GPDF.
     * @param addr EmberGpAddress * The Address of the destination GPD.
     * @param gpdCommandId uint8_t The GPD command ID to send.
     * @param gpdAsdu uint8_t * The GP command payload.
     * @param gpepHandle uint8_t The handle to refer to the GPDF.
     * @param gpTxQueueEntryLifetimeMs uint16_t How long to keep the GPDF in the TX Queue.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspDGpSend(
        action: boolean,
        useCca: boolean,
        addr: EmberGpAddress,
        gpdCommandId: number,
        gpdAsdu: Buffer,
        gpepHandle: number,
        gpTxQueueEntryLifetimeMs: number,
    ): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.D_GP_SEND);
        sendBuffalo.writeUInt8(action ? 1 : 0);
        sendBuffalo.writeUInt8(useCca ? 1 : 0);
        sendBuffalo.writeEmberGpAddress(addr);
        sendBuffalo.writeUInt8(gpdCommandId);
        sendBuffalo.writePayload(gpdAsdu);
        sendBuffalo.writeUInt8(gpepHandle);
        sendBuffalo.writeUInt16(gpTxQueueEntryLifetimeMs);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Callback
     * A callback to the GP endpoint to indicate the result of the GPDF
     * transmission.
     * @param status An SLStatus value indicating success or the reason for failure.
     * @param gpepHandle uint8_t The handle of the GPDF.
     */
    ezspDGpSentHandler(status: SLStatus, gpepHandle: number): void {
        logger.debug(`ezspDGpSentHandler(): callback called with: [status=${SLStatus[status]}], [gpepHandle=${gpepHandle}]`, NS);
    }

    /**
     * Callback
     * A callback invoked by the ZigBee GP stack when a GPDF is received.
     * @param status The status of the GPDF receive.
     * @param gpdLink uint8_t The gpdLink value of the received GPDF.
     * @param sequenceNumber uint8_t The GPDF sequence number.
     * @param addr EmberGpAddress *The address of the source GPD.
     * @param gpdfSecurityLevel The security level of the received GPDF.
     * @param gpdfSecurityKeyType The securityKeyType used to decrypt/authenticate the incoming GPDF.
     * @param autoCommissioning Whether the incoming GPDF had the auto-commissioning bit set.
     * @param bidirectionalInfo uint8_t Bidirectional information represented in bitfields,
     *        where bit0 holds the rxAfterTx of incoming gpdf and bit1 holds if tx queue is available for outgoing gpdf.
     * @param gpdSecurityFrameCounter uint32_t The security frame counter of the incoming GDPF.
     * @param gpdCommandId uint8_t The gpdCommandId of the incoming GPDF.
     * @param mic uint32_t The received MIC of the GPDF.
     * @param proxyTableIndex uint8_tThe proxy table index of the corresponding proxy table entry to the incoming GPDF.
     * @param gpdCommandPayload uint8_t * The GPD command payload.
     */
    ezspGpepIncomingMessageHandler(
        status: EmberGPStatus,
        gpdLink: number,
        sequenceNumber: number,
        addr: EmberGpAddress,
        gpdfSecurityLevel: EmberGpSecurityLevel,
        gpdfSecurityKeyType: EmberGpKeyType,
        autoCommissioning: boolean,
        bidirectionalInfo: number,
        gpdSecurityFrameCounter: number,
        gpdCommandId: number,
        mic: number,
        proxyTableIndex: number,
        gpdCommandPayload: Buffer,
        packetInfo: EmberRxPacketInfo,
    ): void {
        logger.debug(
            () =>
                `ezspGpepIncomingMessageHandler(): callback called with: [status=${EmberGPStatus[status] ?? status}], [gpdLink=${gpdLink}], ` +
                `[sequenceNumber=${sequenceNumber}], [addr=${JSON.stringify(addr)}], [gpdfSecurityLevel=${EmberGpSecurityLevel[gpdfSecurityLevel]}], ` +
                `[gpdfSecurityKeyType=${EmberGpKeyType[gpdfSecurityKeyType]}], [autoCommissioning=${autoCommissioning}], ` +
                `[bidirectionalInfo=${bidirectionalInfo}], [gpdSecurityFrameCounter=${gpdSecurityFrameCounter}], [gpdCommandId=${gpdCommandId}], ` +
                `[mic=${mic}], [proxyTableIndex=${proxyTableIndex}], [gpdCommandPayload=${gpdCommandPayload.toString('hex')}], [packetInfo=${JSON.stringify(packetInfo)}]`,
            NS,
        );

        if (addr.applicationId === EmberGpApplicationId.IEEE_ADDRESS) {
            // XXX: don't bother parsing for upstream for now, since it will be rejected
            logger.error(`<=x= [GP] Received IEEE address type in message. Support not implemented upstream. Dropping.`, NS);
            return;
        }

        let commandIdentifier = Clusters.greenPower.commands.notification.ID;

        if (gpdCommandId === 0xe0) {
            if (!gpdCommandPayload.length) {
                // XXX: seem to be receiving duplicate commissioningNotification from some devices, second one with empty payload?
                //      this will mess with the process no doubt, so dropping them
                logger.debug(`<=x= [GP] Received commissioning notification with empty payload. Dropping.`, NS);
                return;
            }

            commandIdentifier = Clusters.greenPower.commands.commissioningNotification.ID;
        }

        const apsFrame: EmberApsFrame = {
            profileId: ZSpec.GP_PROFILE_ID,
            clusterId: Zcl.Clusters.greenPower.ID,
            sourceEndpoint: ZSpec.GP_ENDPOINT,
            destinationEndpoint: ZSpec.GP_ENDPOINT,
            options: 0, // not used
            groupId: ZSpec.GP_GROUP_ID,
            sequence: 0, // not used
        };
        // this stuff is already parsed by EmberZNet stack, but Z2M expects the full buffer, so combine it back
        const gpdHeader = Buffer.alloc(15); // addr.applicationId === EmberGpApplicationId.IEEE_ADDRESS ? 20 : 15
        gpdHeader.writeUInt8(0b00000001, 0); // frameControl: FrameType.SPECIFIC + Direction.CLIENT_TO_SERVER + disableDefaultResponse=false
        gpdHeader.writeUInt8(sequenceNumber, 1);
        gpdHeader.writeUInt8(commandIdentifier, 2); // commandIdentifier
        gpdHeader.writeUInt16LE(0, 3); // options, only srcID present
        gpdHeader.writeUInt32LE(addr.sourceId, 5);
        // omitted: gpdIEEEAddr (ieeeAddr)
        // omitted: gpdEndpoint (uint8)
        gpdHeader.writeUInt32LE(gpdSecurityFrameCounter, 9);
        gpdHeader.writeUInt8(gpdCommandId, 13);
        gpdHeader.writeUInt8(gpdCommandPayload.length, 14);

        const messageContents = Buffer.concat([gpdHeader, gpdCommandPayload]); // omitted: gppNwkAddr (uint16), gppGddLink (uint8)

        // XXX: BROADCAST currently hardcoded to match upstream codepath
        this.emit('incomingMessage', EmberIncomingMessageType.BROADCAST, apsFrame, gpdLink, addr.sourceId & 0xffff, messageContents);
    }

    /**
     * Retrieves the proxy table entry stored at the passed index.
     * @param proxyIndex uint8_t The index of the requested proxy table entry.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns EmberGpProxyTableEntry * An EmberGpProxyTableEntry struct containing a copy of the requested proxy entry.
     */
    async ezspGpProxyTableGetEntry(proxyIndex: number): Promise<[SLStatus, entry: EmberGpProxyTableEntry]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_PROXY_TABLE_GET_ENTRY);
        sendBuffalo.writeUInt8(proxyIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const entry = this.buffalo.readEmberGpProxyTableEntry();

        return [status, entry];
    }

    /**
     * Finds the index of the passed address in the gp table.
     * @param addr EmberGpAddress * The address to search for
     * @returns uint8_t The index, or 0xFF for not found
     */
    async ezspGpProxyTableLookup(addr: EmberGpAddress): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_PROXY_TABLE_LOOKUP);
        sendBuffalo.writeEmberGpAddress(addr);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const index = this.buffalo.readUInt8();

        return index;
    }

    /**
     * Retrieves the sink table entry stored at the passed index.
     * @param sinkIndex uint8_t The index of the requested sink table entry.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns EmberGpSinkTableEntry * An EmberGpSinkTableEntry struct containing a copy of the requested sink entry.
     */
    async ezspGpSinkTableGetEntry(sinkIndex: number): Promise<[SLStatus, entry: EmberGpSinkTableEntry]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_GET_ENTRY);
        sendBuffalo.writeUInt8(sinkIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const entry = this.buffalo.readEmberGpSinkTableEntry();

        return [status, entry];
    }

    /**
     * Finds the index of the passed address in the gp table.
     * @param addr EmberGpAddress *The address to search for.
     * @returns uint8_t The index, or 0xFF for not found
     */
    async ezspGpSinkTableLookup(addr: EmberGpAddress): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_LOOKUP);
        sendBuffalo.writeEmberGpAddress(addr);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const index = this.buffalo.readUInt8();

        return index;
    }

    /**
     * Retrieves the sink table entry stored at the passed index.
     * @param sinkIndex uint8_t The index of the requested sink table entry.
     * @param entry EmberGpSinkTableEntry * An EmberGpSinkTableEntry struct containing a copy of the sink entry to be updated.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspGpSinkTableSetEntry(sinkIndex: number, entry: EmberGpSinkTableEntry): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_SET_ENTRY);
        sendBuffalo.writeUInt8(sinkIndex);
        sendBuffalo.writeEmberGpSinkTableEntry(entry);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Removes the sink table entry stored at the passed index.
     * @param uint8_t The index of the requested sink table entry.
     */
    async ezspGpSinkTableRemoveEntry(sinkIndex: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_REMOVE_ENTRY);
        sendBuffalo.writeUInt8(sinkIndex);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Finds or allocates a sink entry
     * @param addr EmberGpAddress * An EmberGpAddress struct containing a copy of the gpd address to be found.
     * @returns uint8_t An index of found or allocated sink or 0xFF if failed.
     */
    async ezspGpSinkTableFindOrAllocateEntry(addr: EmberGpAddress): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_FIND_OR_ALLOCATE_ENTRY);
        sendBuffalo.writeEmberGpAddress(addr);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const index = this.buffalo.readUInt8();

        return index;
    }

    /**
     * Clear the entire sink table
     */
    async ezspGpSinkTableClearAll(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_CLEAR_ALL);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Iniitializes Sink Table
     */
    async ezspGpSinkTableInit(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_INIT);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Sets security framecounter in the sink table
     * @param index uint8_t Index to the Sink table
     * @param sfc uint32_t Security Frame Counter
     */
    async ezspGpSinkTableSetSecurityFrameCounter(index: number, sfc: number): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_SET_SECURITY_FRAME_COUNTER);
        sendBuffalo.writeUInt8(index);
        sendBuffalo.writeUInt32(sfc);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Puts the GPS in commissioning mode.
     * @param uint8_t commissioning options
     * @param uint16_t gpm address for security.
     * @param uint16_t gpm address for pairing.
     * @param uint8_t sink endpoint.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspGpSinkCommission(options: number, gpmAddrForSecurity: number, gpmAddrForPairing: number, sinkEndpoint: number): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_COMMISSION);
        sendBuffalo.writeUInt8(options);
        sendBuffalo.writeUInt16(gpmAddrForSecurity);
        sendBuffalo.writeUInt16(gpmAddrForPairing);
        sendBuffalo.writeUInt8(sinkEndpoint);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Clears all entries within the translation table.
     */
    async ezspGpTranslationTableClear(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_TRANSLATION_TABLE_CLEAR);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Return number of active entries in sink table.
     * @returns uint8_t Number of active entries in sink table. 0 if error.
     */
    async ezspGpSinkTableGetNumberOfActiveEntries(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SINK_TABLE_GET_NUMBER_OF_ACTIVE_ENTRIES);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const numberOfEntries = this.buffalo.readUInt8();

        return numberOfEntries;
    }

    //-----------------------------------------------------------------------------
    // Token Interface Frames
    //-----------------------------------------------------------------------------

    /**
     * Gets the total number of tokens.
     * @returns uint8_t Total number of tokens.
     */
    async ezspGetTokenCount(): Promise<number> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_TOKEN_COUNT);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const count = this.buffalo.readUInt8();

        return count;
    }

    /**
     * Gets the token information for a single token at provided index
     * @param index uint8_t Index of the token in the token table for which information is needed.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns EmberTokenInfo * Token information.
     */
    async ezspGetTokenInfo(index: number): Promise<[SLStatus, tokenInfo: EmberTokenInfo]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_TOKEN_INFO);
        sendBuffalo.writeUInt8(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const tokenInfo = this.buffalo.readEmberTokenInfo();

        return [status, tokenInfo];
    }

    /**
     * Gets the token data for a single token with provided key
     * @param token uint32_t Key of the token in the token table for which data is needed.
     * @param index uint32_t Index in case of the indexed token.
     * @returns An SLStatus value indicating success or the reason for failure.
     * @returns EmberTokenData * Token Data
     */
    async ezspGetTokenData(token: number, index: number): Promise<[SLStatus, tokenData: EmberTokenData]> {
        const sendBuffalo = this.startCommand(EzspFrameID.GET_TOKEN_DATA);
        sendBuffalo.writeUInt32(token);
        sendBuffalo.writeUInt32(index);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        const tokenData = this.buffalo.readEmberTokenData();

        return [status, tokenData];
    }

    /**
     * Sets the token data for a single token with provided key
     * @param token uint32_t Key of the token in the token table for which data is to be set.
     * @param index uint32_t Index in case of the indexed token.
     * @param EmberTokenData * Token Data
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspSetTokenData(token: number, index: number, tokenData: EmberTokenData): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.SET_TOKEN_DATA);
        sendBuffalo.writeUInt32(token);
        sendBuffalo.writeUInt32(index);
        sendBuffalo.writeEmberTokenData(tokenData);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);
        return status;
    }

    /**
     * Reset the node by calling halReboot.
     */
    async ezspResetNode(): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.RESET_NODE);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }

    /**
     * Run GP security test vectors.
     * @returns An SLStatus value indicating success or the reason for failure.
     */
    async ezspGpSecurityTestVectors(): Promise<SLStatus> {
        const sendBuffalo = this.startCommand(EzspFrameID.GP_SECURITY_TEST_VECTORS);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }

        const status = this.buffalo.readStatus(this.version);

        return status;
    }

    /**
     * Factory reset all configured zigbee tokens
     * @param excludeOutgoingFC Exclude network and APS outgoing frame counter tokens.
     * @param excludeBootCounter Exclude stack boot counter token.
     */
    async ezspTokenFactoryReset(excludeOutgoingFC: boolean, excludeBootCounter: boolean): Promise<void> {
        const sendBuffalo = this.startCommand(EzspFrameID.TOKEN_FACTORY_RESET);
        sendBuffalo.writeUInt8(excludeOutgoingFC ? 1 : 0);
        sendBuffalo.writeUInt8(excludeBootCounter ? 1 : 0);

        const sendStatus = await this.sendCommand(sendBuffalo);

        if (sendStatus !== EzspStatus.SUCCESS) {
            throw new EzspError(sendStatus);
        }
    }
}
