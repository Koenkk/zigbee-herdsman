/* istanbul ignore file */
import {randomBytes} from 'crypto';
import equals from 'fast-deep-equal/es6';
import {existsSync, readFileSync, renameSync} from 'fs';
import path from 'path';

import {Adapter, TsType} from '../..';
import {Backup, UnifiedBackupStorage} from '../../../models';
import {BackupUtils, RealpathSync, Wait} from '../../../utils';
import {logger} from '../../../utils/logger';
import * as ZSpec from '../../../zspec';
import {EUI64, ExtendedPanId, NodeId, PanId} from '../../../zspec/tstypes';
import * as Zcl from '../../../zspec/zcl';
import * as Zdo from '../../../zspec/zdo';
import {BuffaloZdo} from '../../../zspec/zdo/buffaloZdo';
import * as ZdoTypes from '../../../zspec/zdo/definition/tstypes';
import {DeviceAnnouncePayload, DeviceJoinedPayload, DeviceLeavePayload, Events, NetworkAddressPayload, ZclPayload} from '../../events';
import SerialPortUtils from '../../serialPortUtils';
import SocketPortUtils from '../../socketPortUtils';
import {
    EMBER_INSTALL_CODE_CRC_SIZE,
    EMBER_INSTALL_CODE_SIZES,
    EMBER_NUM_802_15_4_CHANNELS,
    EMBER_MIN_802_15_4_CHANNEL_NUMBER,
    UNKNOWN_NETWORK_STATE,
    LONG_DEST_FRAME_CONTROL,
    MAC_ACK_REQUIRED,
    MAXIMUM_INTERPAN_LENGTH,
    STUB_NWK_FRAME_CONTROL,
    INTERPAN_APS_FRAME_TYPE,
    SHORT_DEST_FRAME_CONTROL,
    EMBER_HIGH_RAM_CONCENTRATOR,
    EMBER_LOW_RAM_CONCENTRATOR,
    STACK_PROFILE_ZIGBEE_PRO,
    SECURITY_LEVEL_Z3,
    INVALID_RADIO_CHANNEL,
    EMBER_ALL_802_15_4_CHANNELS_MASK,
    ZIGBEE_PROFILE_INTEROPERABILITY_LINK_KEY,
    EMBER_MIN_BROADCAST_ADDRESS,
} from '../consts';
import {
    EmberApsOption,
    EmberOutgoingMessageType,
    EzspStatus,
    EmberVersionType,
    SLStatus,
    EmberNodeType,
    EmberNetworkStatus,
    SecManKeyType,
    EmberInterpanMessageType,
    EmberSourceRouteDiscoveryMode,
    EmberJoinDecision,
    EmberExtendedSecurityBitmask,
    EmberInitialSecurityBitmask,
    EmberJoinMethod,
    EmberNetworkInitBitmask,
    EmberDeviceUpdate,
    EzspNetworkScanType,
    EmberIncomingMessageType,
    EmberTransmitPriority,
} from '../enums';
import {EzspBuffalo} from '../ezsp/buffalo';
import {
    EMBER_ENCRYPTION_KEY_SIZE,
    EZSP_MAX_FRAME_LENGTH,
    EZSP_MIN_PROTOCOL_VERSION,
    EZSP_PROTOCOL_VERSION,
    EZSP_STACK_TYPE_MESH,
} from '../ezsp/consts';
import {EzspConfigId, EzspDecisionBitmask, EzspDecisionId, EzspPolicyId, EzspValueId} from '../ezsp/enums';
import {Ezsp, EzspEvents} from '../ezsp/ezsp';
import {EzspError} from '../ezspError';
import {
    EmberAesMmoHashContext,
    EmberApsFrame,
    EmberInitialSecurityState,
    EmberKeyData,
    EmberMulticastId,
    EmberMulticastTableEntry,
    EmberNetworkInitStruct,
    EmberNetworkParameters,
    EmberVersion,
    SecManAPSKeyMetadata,
    SecManContext,
    SecManKey,
} from '../types';
import {aesMmoHashInit, initNetworkCache, initSecurityManagerContext} from '../utils/initters';
import {halCommonCrc16, highByte, highLowToInt, lowByte, lowHighBytes} from '../utils/math';
import {FIXED_ENDPOINTS} from './endpoints';
import {EmberOneWaitress, OneWaitressEvents} from './oneWaitress';
import {EmberRequestQueue} from './requestQueue';
// import {EmberTokensManager} from './tokensManager';

const NS = 'zh:ember';

export type NetworkCache = {
    //-- basic network info
    eui64: EUI64;
    parameters: EmberNetworkParameters;
    status: EmberNetworkStatus;
    /** uint8_t */
};

/**
 * Use for a link key backup.
 *
 * Each entry notes the EUI64 of the device it is paired to and the key data.
 *   This key may be hashed and not the actual link key currently in use.
 */
type LinkKeyBackupData = {
    deviceEui64: EUI64;
    key: EmberKeyData;
    outgoingFrameCounter: number;
    incomingFrameCounter: number;
};

/** Enum to pass strings from numbers up to Z2M. */
enum RoutingTableStatus {
    ACTIVE = 0x0,
    DISCOVERY_UNDERWAY = 0x1,
    DISCOVERY_FAILED = 0x2,
    INACTIVE = 0x3,
    VALIDATION_UNDERWAY = 0x4,
    RESERVED1 = 0x5,
    RESERVED2 = 0x6,
    RESERVED3 = 0x7,
}

enum NetworkInitAction {
    /** Ain't that nice! */
    DONE,
    /** Config mismatch, must leave network. */
    LEAVE,
    /** Config mismatched, left network. Will evaluate forming from backup or config next. */
    LEFT,
    /** Form the network using config. No backup, or backup mismatch. */
    FORM_CONFIG,
    /** Re-form the network using full backed-up data. */
    FORM_BACKUP,
}

/** NOTE: Drivers can override `manufacturer`. Verify logic doesn't work in most cases anyway. */
const autoDetectDefinitions = [
    /** NOTE: Manuf code "0x1321" for "Shenzhen Sonoff Technologies Co., Ltd." */
    {manufacturer: 'ITEAD', vendorId: '1a86', productId: '55d4'}, // Sonoff ZBDongle-E
    /** NOTE: Manuf code "0x134B" for "Nabu Casa, Inc." */
    {manufacturer: 'Nabu Casa', vendorId: '10c4', productId: 'ea60'}, // Home Assistant SkyConnect
];

/**
 * Application generated ZDO messages use sequence numbers 0-127, and the stack
 * uses sequence numbers 128-255.  This simplifies life by eliminating the need
 * for coordination between the two entities, and allows both to send ZDO
 * messages with non-conflicting sequence numbers.
 */
const APPLICATION_ZDO_SEQUENCE_MASK = 0x7f;
/** Current revision of the spec by zigbee alliance supported by Z2M. */
const CURRENT_ZIGBEE_SPEC_REVISION = 22;
/** Each scan period is 15.36ms. Scan for at least 200ms (2^4 + 1 periods) to pick up WiFi beacon frames. */
const ENERGY_SCAN_DURATION = 4;
/** Oldest supported EZSP version for backups. Don't take the risk to restore a broken network until older backup versions can be investigated. */
const BACKUP_OLDEST_SUPPORTED_EZSP_VERSION = 12;
/**
 * 9sec is minimum recommended for `ezspBroadcastNextNetworkKey` to have propagated throughout network.
 * NOTE: This is blocking the request queue, so we shouldn't go crazy high.
 */
const BROADCAST_NETWORK_KEY_SWITCH_WAIT_TIME = 15000;

type StackConfig = {
    CONCENTRATOR_RAM_TYPE: 'high' | 'low';
    /**
     * Minimum Time between broadcasts (in seconds) <1-60>
     * Default: 10
     * The minimum amount of time that must pass between MTORR broadcasts.
     */
    CONCENTRATOR_MIN_TIME: number;
    /**
     * Maximum Time between broadcasts (in seconds) <30-300>
     * Default: 60
     * The maximum amount of time that can pass between MTORR broadcasts.
     */
    CONCENTRATOR_MAX_TIME: number;
    /**
     * Route Error Threshold <1-100>
     * Default: 3
     * The number of route errors that will trigger a re-broadcast of the MTORR.
     */
    CONCENTRATOR_ROUTE_ERROR_THRESHOLD: number;
    /**
     * Delivery Failure Threshold <1-100>
     * Default: 1
     * The number of APS delivery failures that will trigger a re-broadcast of the MTORR.
     */
    CONCENTRATOR_DELIVERY_FAILURE_THRESHOLD: number;
    /**
     * Maximum number of hops for Broadcast <0-30>
     * Default: 0
     * The maximum number of hops that the MTORR broadcast will be allowed to have.
     * A value of 0 will be converted to the EMBER_MAX_HOPS value set by the stack.
     */
    CONCENTRATOR_MAX_HOPS: number;
    /** <6-64> (Default: 6) @see EzspConfigId.MAX_END_DEVICE_CHILDREN */
    MAX_END_DEVICE_CHILDREN: number;
    /** <-> (Default: 10000) @see EzspValueId.TRANSIENT_DEVICE_TIMEOUT */
    TRANSIENT_DEVICE_TIMEOUT: number;
    /** <0-14> (Default: 8) @see EzspConfigId.END_DEVICE_POLL_TIMEOUT */
    END_DEVICE_POLL_TIMEOUT: number;
    /** <0-65535> (Default: 300) @see EzspConfigId.TRANSIENT_KEY_TIMEOUT_S */
    TRANSIENT_KEY_TIMEOUT_S: number;
};

/**
 * Default stack configuration values.
 * @see https://www.silabs.com/documents/public/user-guides/ug100-ezsp-reference-guide.pdf 2.3.1 for descriptions/RAM costs
 *
 * https://github.com/darkxst/silabs-firmware-builder/tree/main/manifests
 * https://github.com/NabuCasa/silabs-firmware/wiki/Zigbee-EmberZNet-NCP-firmware-configuration#skyconnect
 * https://github.com/SiliconLabs/UnifySDK/blob/main/applications/zigbeed/project_files/zigbeed.slcp
 */
const DEFAULT_STACK_CONFIG: Readonly<StackConfig> = {
    CONCENTRATOR_RAM_TYPE: 'high',
    CONCENTRATOR_MIN_TIME: 5, // zigpc: 10
    CONCENTRATOR_MAX_TIME: 60, // zigpc: 60
    CONCENTRATOR_ROUTE_ERROR_THRESHOLD: 3, // zigpc: 3
    CONCENTRATOR_DELIVERY_FAILURE_THRESHOLD: 1, // zigpc: 1, ZigbeeMinimalHost: 3
    CONCENTRATOR_MAX_HOPS: 0, // zigpc: 0
    MAX_END_DEVICE_CHILDREN: 32, // zigpc: 6, nabucasa: 32, Dongle-E (Sonoff firmware): 32
    TRANSIENT_DEVICE_TIMEOUT: 10000,
    END_DEVICE_POLL_TIMEOUT: 8, // zigpc: 8
    TRANSIENT_KEY_TIMEOUT_S: 300, // zigpc: 65535
};
/** Default behavior is to disable app key requests */
const ALLOW_APP_KEY_REQUESTS = false;

/**
 * NOTE: This from SDK is currently ignored here because of issues in below links:
 * - BUGZID 12261: Concentrators use MTORRs for route discovery and should not enable route discovery in the APS options.
 * - https://community.silabs.com/s/question/0D58Y00008DRfDCSA1/coordinator-cant-send-unicast-to-sleepy-node-after-reboot
 * - https://community.silabs.com/s/question/0D58Y0000B4nTb7SQE/largedense-network-communication-problem-source-route-table-not-big-enough
 *
 * Removing `ENABLE_ROUTE_DISCOVERY` leads to devices that won't reconnect/go offline, and various other issues. Keeping it for now.
 */
const DEFAULT_APS_OPTIONS = EmberApsOption.RETRY | EmberApsOption.ENABLE_ROUTE_DISCOVERY | EmberApsOption.ENABLE_ADDRESS_DISCOVERY;
/** Time for a ZDO request to get a callback response. ASH is 2400*6 for ACK timeout. */
const DEFAULT_ZDO_REQUEST_TIMEOUT = 15000; // msec
/** Time for a ZCL request to get a callback response. ASH is 2400*6 for ACK timeout. */
const DEFAULT_ZCL_REQUEST_TIMEOUT = 15000; //msec
/** Time for a network-related request to get a response (usually via event). */
const DEFAULT_NETWORK_REQUEST_TIMEOUT = 10000; // nothing on the network to bother requests, should be much faster than this
/** Time between watchdog counters reading/clearing */
const WATCHDOG_COUNTERS_FEED_INTERVAL = 3600000; // every hour...
/** Default manufacturer code reported by coordinator. */
const DEFAULT_MANUFACTURER_CODE = Zcl.ManufacturerCode.SILICON_LABORATORIES;
/**
 * Workaround for devices that require a specific manufacturer code to be reported by coordinator while interviewing...
 * - Lumi/Aqara devices do not work properly otherwise (missing features): https://github.com/Koenkk/zigbee2mqtt/issues/9274
 */
const WORKAROUND_JOIN_MANUF_IEEE_PREFIX_TO_CODE: {[ieeePrefix: string]: Zcl.ManufacturerCode} = {
    // NOTE: Lumi has a new prefix registered since 2021, in case they start using that one with new devices, it might need to be added here too...
    //       "0x18c23c" https://maclookup.app/vendors/lumi-united-technology-co-ltd
    '0x54ef44': Zcl.ManufacturerCode.LUMI_UNITED_TECHOLOGY_LTD_SHENZHEN,
};

/**
 * Relay calls between Z2M and EZSP-layer and handle any error that might occur via queue & waitress.
 *
 * Anything post `start` that requests anything from the EZSP layer must run through the request queue for proper execution flow.
 */
export class EmberAdapter extends Adapter {
    /** Current manufacturer code assigned to the coordinator. Used for join workarounds... */
    private manufacturerCode: Zcl.ManufacturerCode;
    public readonly stackConfig: StackConfig;

    private readonly ezsp: Ezsp;
    private version: {ezsp: number; revision: string} & EmberVersion;

    private readonly requestQueue: EmberRequestQueue;
    private readonly oneWaitress: EmberOneWaitress;
    /** Periodically retrieve counters then clear them. */
    private watchdogCountersHandle: NodeJS.Timeout;

    /** Sequence number used for ZDO requests. static uint8_t  */
    private zdoRequestSequence: number;
    /** Default radius used for broadcast ZDO requests. uint8_t */
    private zdoRequestRadius: number;

    private interpanLock: boolean;

    /**
     * Cached network params to avoid NCP calls. Prevents frequent EZSP transactions.
     * NOTE: Do not use directly, use getter functions for it that check if valid or need retrieval from NCP.
     */
    private networkCache: NetworkCache;
    private multicastTable: EmberMulticastId[];

    constructor(
        networkOptions: TsType.NetworkOptions,
        serialPortOptions: TsType.SerialPortOptions,
        backupPath: string,
        adapterOptions: TsType.AdapterOptions,
    ) {
        super(networkOptions, serialPortOptions, backupPath, adapterOptions);

        this.stackConfig = this.loadStackConfig();
        const delay = typeof this.adapterOptions.delay === 'number' ? Math.min(Math.max(this.adapterOptions.delay, 5), 60) : 5;

        logger.debug(`Using delay=${delay}.`, NS);

        this.requestQueue = new EmberRequestQueue(delay);
        this.oneWaitress = new EmberOneWaitress();

        this.ezsp = new Ezsp(serialPortOptions);

        this.ezsp.on(EzspEvents.ZDO_RESPONSE, this.onZDOResponse.bind(this));
        this.ezsp.on(EzspEvents.INCOMING_MESSAGE, this.onIncomingMessage.bind(this));
        this.ezsp.on(EzspEvents.TOUCHLINK_MESSAGE, this.onTouchlinkMessage.bind(this));
        this.ezsp.on(EzspEvents.STACK_STATUS, this.onStackStatus.bind(this));
        this.ezsp.on(EzspEvents.TRUST_CENTER_JOIN, this.onTrustCenterJoin.bind(this));
        this.ezsp.on(EzspEvents.MESSAGE_SENT, this.onMessageSent.bind(this));
        this.ezsp.on(EzspEvents.GREENPOWER_MESSAGE, this.onGreenpowerMessage.bind(this));
    }

    private loadStackConfig(): StackConfig {
        // store stack config in same dir as backup
        const configPath = path.join(path.dirname(this.backupPath), 'stack_config.json');

        try {
            const customConfig: StackConfig = JSON.parse(readFileSync(configPath, 'utf8'));
            // set any undefined config to default
            const config: StackConfig = {...DEFAULT_STACK_CONFIG, ...customConfig};

            const inRange = (value: number, min: number, max: number): boolean => (value == undefined || value < min || value > max ? false : true);

            if (!['high', 'low'].includes(config.CONCENTRATOR_RAM_TYPE)) {
                config.CONCENTRATOR_RAM_TYPE = DEFAULT_STACK_CONFIG.CONCENTRATOR_RAM_TYPE;
                logger.error(`[STACK CONFIG] Invalid CONCENTRATOR_RAM_TYPE, using default.`, NS);
            }

            if (!inRange(config.CONCENTRATOR_MIN_TIME, 1, 60) || config.CONCENTRATOR_MIN_TIME >= config.CONCENTRATOR_MAX_TIME) {
                config.CONCENTRATOR_MIN_TIME = DEFAULT_STACK_CONFIG.CONCENTRATOR_MIN_TIME;
                logger.error(`[STACK CONFIG] Invalid CONCENTRATOR_MIN_TIME, using default.`, NS);
            }

            if (!inRange(config.CONCENTRATOR_MAX_TIME, 30, 300) || config.CONCENTRATOR_MAX_TIME <= config.CONCENTRATOR_MIN_TIME) {
                config.CONCENTRATOR_MAX_TIME = DEFAULT_STACK_CONFIG.CONCENTRATOR_MAX_TIME;
                logger.error(`[STACK CONFIG] Invalid CONCENTRATOR_MAX_TIME, using default.`, NS);
            }

            if (!inRange(config.CONCENTRATOR_ROUTE_ERROR_THRESHOLD, 1, 100)) {
                config.CONCENTRATOR_ROUTE_ERROR_THRESHOLD = DEFAULT_STACK_CONFIG.CONCENTRATOR_ROUTE_ERROR_THRESHOLD;
                logger.error(`[STACK CONFIG] Invalid CONCENTRATOR_ROUTE_ERROR_THRESHOLD, using default.`, NS);
            }

            if (!inRange(config.CONCENTRATOR_DELIVERY_FAILURE_THRESHOLD, 1, 100)) {
                config.CONCENTRATOR_DELIVERY_FAILURE_THRESHOLD = DEFAULT_STACK_CONFIG.CONCENTRATOR_DELIVERY_FAILURE_THRESHOLD;
                logger.error(`[STACK CONFIG] Invalid CONCENTRATOR_DELIVERY_FAILURE_THRESHOLD, using default.`, NS);
            }

            if (!inRange(config.CONCENTRATOR_MAX_HOPS, 0, 30)) {
                config.CONCENTRATOR_MAX_HOPS = DEFAULT_STACK_CONFIG.CONCENTRATOR_MAX_HOPS;
                logger.error(`[STACK CONFIG] Invalid CONCENTRATOR_MAX_HOPS, using default.`, NS);
            }

            if (!inRange(config.MAX_END_DEVICE_CHILDREN, 6, 64)) {
                config.MAX_END_DEVICE_CHILDREN = DEFAULT_STACK_CONFIG.MAX_END_DEVICE_CHILDREN;
                logger.error(`[STACK CONFIG] Invalid MAX_END_DEVICE_CHILDREN, using default.`, NS);
            }

            if (!inRange(config.TRANSIENT_DEVICE_TIMEOUT, 0, 65535)) {
                config.TRANSIENT_DEVICE_TIMEOUT = DEFAULT_STACK_CONFIG.TRANSIENT_DEVICE_TIMEOUT;
                logger.error(`[STACK CONFIG] Invalid TRANSIENT_DEVICE_TIMEOUT, using default.`, NS);
            }

            if (!inRange(config.END_DEVICE_POLL_TIMEOUT, 0, 14)) {
                config.END_DEVICE_POLL_TIMEOUT = DEFAULT_STACK_CONFIG.END_DEVICE_POLL_TIMEOUT;
                logger.error(`[STACK CONFIG] Invalid END_DEVICE_POLL_TIMEOUT, using default.`, NS);
            }

            if (!inRange(config.TRANSIENT_KEY_TIMEOUT_S, 0, 65535)) {
                config.TRANSIENT_KEY_TIMEOUT_S = DEFAULT_STACK_CONFIG.TRANSIENT_KEY_TIMEOUT_S;
                logger.error(`[STACK CONFIG] Invalid TRANSIENT_KEY_TIMEOUT_S, using default.`, NS);
            }

            logger.info(`Using stack config ${JSON.stringify(config)}.`, NS);
            return config;
        } catch {}

        logger.info(`Using default stack config.`, NS);
        return DEFAULT_STACK_CONFIG;
    }

    /**
     * Emitted from @see Ezsp.ezspStackStatusHandler
     * @param status
     */
    private async onStackStatus(status: SLStatus): Promise<void> {
        // to be extra careful, should clear network cache upon receiving this.
        this.clearNetworkCache();

        switch (status) {
            case SLStatus.NETWORK_UP: {
                this.oneWaitress.resolveEvent(OneWaitressEvents.STACK_STATUS_NETWORK_UP);
                logger.info(`[STACK STATUS] Network up.`, NS);
                break;
            }
            case SLStatus.NETWORK_DOWN: {
                this.oneWaitress.resolveEvent(OneWaitressEvents.STACK_STATUS_NETWORK_DOWN);
                logger.info(`[STACK STATUS] Network down.`, NS);
                break;
            }
            case SLStatus.ZIGBEE_NETWORK_OPENED: {
                this.oneWaitress.resolveEvent(OneWaitressEvents.STACK_STATUS_NETWORK_OPENED);
                logger.info(`[STACK STATUS] Network opened.`, NS);
                break;
            }
            case SLStatus.ZIGBEE_NETWORK_CLOSED: {
                this.oneWaitress.resolveEvent(OneWaitressEvents.STACK_STATUS_NETWORK_CLOSED);
                logger.info(`[STACK STATUS] Network closed.`, NS);
                break;
            }
            case SLStatus.ZIGBEE_CHANNEL_CHANGED: {
                this.oneWaitress.resolveEvent(OneWaitressEvents.STACK_STATUS_CHANNEL_CHANGED);
                // invalidate cache
                this.networkCache.parameters.radioChannel = INVALID_RADIO_CHANNEL;
                logger.info(`[STACK STATUS] Channel changed.`, NS);
                break;
            }
            default: {
                logger.debug(`[STACK STATUS] ${SLStatus[status]}.`, NS);
                break;
            }
        }
    }

    /**
     * Emitted from @see Ezsp.ezspMessageSentHandler
     * WARNING: Cannot rely on `ezspMessageSentHandler` > `ezspIncomingMessageHandler` order, some devices mix it up!
     *
     * @param type
     * @param indexOrDestination
     * @param apsFrame
     * @param messageTag
     * @param status
     */
    private async onMessageSent(
        status: SLStatus,
        type: EmberOutgoingMessageType,
        indexOrDestination: number,
        apsFrame: EmberApsFrame,
        messageTag: number,
    ): Promise<void> {
        if (status === SLStatus.ZIGBEE_DELIVERY_FAILED) {
            // no ACK was received from the destination
            switch (type) {
                case EmberOutgoingMessageType.BROADCAST:
                case EmberOutgoingMessageType.BROADCAST_WITH_ALIAS:
                case EmberOutgoingMessageType.MULTICAST:
                case EmberOutgoingMessageType.MULTICAST_WITH_ALIAS: {
                    // BC/MC not checking for message sent, avoid unnecessary waitress lookups
                    logger.error(
                        `Delivery of ${EmberOutgoingMessageType[type]} failed for "${indexOrDestination}" ` +
                            `[apsFrame=${JSON.stringify(apsFrame)} messageTag=${messageTag}]`,
                        NS,
                    );
                    break;
                }
                default: {
                    // reject any waitress early (don't wait for timeout if we know we're gonna get there eventually)
                    this.oneWaitress.deliveryFailedFor(indexOrDestination, apsFrame);
                    break;
                }
            }
        } else if (status === SLStatus.OK) {
            if (
                type === EmberOutgoingMessageType.MULTICAST &&
                apsFrame.destinationEndpoint === 0xff &&
                apsFrame.groupId < EMBER_MIN_BROADCAST_ADDRESS &&
                !this.multicastTable.includes(apsFrame.groupId)
            ) {
                // workaround for devices using multicast for state update (coordinator passthrough)
                const tableIdx = this.multicastTable.length;
                const multicastEntry: EmberMulticastTableEntry = {
                    multicastId: apsFrame.groupId,
                    endpoint: FIXED_ENDPOINTS[0].endpoint,
                    networkIndex: FIXED_ENDPOINTS[0].networkIndex,
                };
                // set immediately to avoid potential race
                this.multicastTable.push(multicastEntry.multicastId);

                await new Promise<void>((resolve, reject): void => {
                    this.requestQueue.enqueue(
                        async (): Promise<SLStatus> => {
                            const status = await this.ezsp.ezspSetMulticastTableEntry(tableIdx, multicastEntry);

                            if (status !== SLStatus.OK) {
                                logger.error(
                                    `Failed to register group "${multicastEntry.multicastId}" in multicast table with status=${SLStatus[status]}.`,
                                    NS,
                                );
                                return status;
                            }

                            logger.debug(`Registered multicast table entry (${tableIdx}): ${JSON.stringify(multicastEntry)}.`, NS);
                            resolve();
                            return SLStatus.OK;
                        },
                        (reason: Error) => {
                            // remove to allow retry on next occurrence
                            this.multicastTable.splice(tableIdx, 1);
                            reject(reason);
                        },
                        true /*prioritize*/,
                    );
                });
            }
        }
        // shouldn't be any other status
    }

    /**
     * Emitted from @see Ezsp.ezspIncomingMessageHandler
     *
     * @param apsFrame The APS frame associated with the response.
     * @param sender The sender of the response. Should match `payload.nodeId` in many responses.
     * @param messageContents The content of the response.
     */
    private async onZDOResponse(apsFrame: EmberApsFrame, sender: NodeId, messageContents: Buffer): Promise<void> {
        try {
            const payload = BuffaloZdo.readResponse(apsFrame.clusterId, messageContents);

            logger.debug(`<~~~ [ZDO ${Zdo.ClusterId[apsFrame.clusterId]} from=${sender} ${payload ? JSON.stringify(payload) : 'OK'}]`, NS);
            this.oneWaitress.resolveZDO(sender, apsFrame, payload);

            if (apsFrame.clusterId === Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE) {
                this.emit(Events.networkAddress, {
                    networkAddress: (payload as ZdoTypes.NetworkAddressResponse).nwkAddress,
                    ieeeAddr: (payload as ZdoTypes.NetworkAddressResponse).eui64,
                } as NetworkAddressPayload);
            } else if (apsFrame.clusterId === Zdo.ClusterId.END_DEVICE_ANNOUNCE) {
                this.emit(Events.deviceAnnounce, {
                    networkAddress: (payload as ZdoTypes.EndDeviceAnnounce).nwkAddress,
                    ieeeAddr: (payload as ZdoTypes.EndDeviceAnnounce).eui64,
                } as DeviceAnnouncePayload);
            }
        } catch (error) {
            this.oneWaitress.resolveZDO(sender, apsFrame, error);
        }
    }

    /**
     * Emitted from @see Ezsp.ezspIncomingMessageHandler
     *
     * @param type
     * @param apsFrame
     * @param lastHopLqi
     * @param sender
     * @param messageContents
     */
    private async onIncomingMessage(
        type: EmberIncomingMessageType,
        apsFrame: EmberApsFrame,
        lastHopLqi: number,
        sender: NodeId,
        messageContents: Buffer,
    ): Promise<void> {
        const payload: ZclPayload = {
            clusterID: apsFrame.clusterId,
            header: Zcl.Header.fromBuffer(messageContents),
            address: sender,
            data: messageContents,
            endpoint: apsFrame.sourceEndpoint,
            linkquality: lastHopLqi,
            groupID: apsFrame.groupId,
            wasBroadcast: type === EmberIncomingMessageType.BROADCAST || type === EmberIncomingMessageType.BROADCAST_LOOPBACK,
            destinationEndpoint: apsFrame.destinationEndpoint,
        };

        this.oneWaitress.resolveZCL(payload);
        this.emit(Events.zclPayload, payload);
    }

    /**
     * Emitted from @see Ezsp.ezspMacFilterMatchMessageHandler when the message is a valid InterPAN touchlink message.
     *
     * @param sourcePanId
     * @param sourceAddress
     * @param groupId
     * @param lastHopLqi
     * @param messageContents
     */
    private async onTouchlinkMessage(
        sourcePanId: PanId,
        sourceAddress: EUI64,
        groupId: number | null,
        lastHopLqi: number,
        messageContents: Buffer,
    ): Promise<void> {
        const payload: ZclPayload = {
            clusterID: Zcl.Clusters.touchlink.ID,
            data: messageContents,
            header: Zcl.Header.fromBuffer(messageContents),
            address: sourceAddress,
            endpoint: 1, // arbitrary since not sent over-the-air
            linkquality: lastHopLqi,
            groupID: groupId,
            wasBroadcast: true, // XXX: since always sent broadcast atm...
            destinationEndpoint: FIXED_ENDPOINTS[0].endpoint,
        };

        this.oneWaitress.resolveZCL(payload);
        this.emit(Events.zclPayload, payload);
    }

    /**
     * Emitted from @see Ezsp.ezspGpepIncomingMessageHandler
     *
     * @param sequenceNumber
     * @param commandIdentifier
     * @param sourceId
     * @param frameCounter
     * @param gpdCommandId
     * @param gpdCommandPayload
     * @param gpdLink
     */
    private async onGreenpowerMessage(
        sequenceNumber: number,
        commandIdentifier: number,
        sourceId: number,
        frameCounter: number,
        gpdCommandId: number,
        gpdCommandPayload: Buffer,
        gpdLink: number,
    ): Promise<void> {
        try {
            const gpdHeader = Buffer.alloc(15);
            gpdHeader.writeUInt8(0b00000001, 0); // frameControl: FrameType.SPECIFIC + Direction.CLIENT_TO_SERVER + disableDefaultResponse=false
            gpdHeader.writeUInt8(sequenceNumber, 1); // transactionSequenceNumber
            gpdHeader.writeUInt8(commandIdentifier, 2); // commandIdentifier
            gpdHeader.writeUInt16LE(0, 3); // options XXX: bypassed, same as deconz https://github.com/Koenkk/zigbee-herdsman/pull/536
            gpdHeader.writeUInt32LE(sourceId, 5); // srcID
            // omitted: gpdIEEEAddr ieeeAddr
            // omitted: gpdEndpoint uint8
            gpdHeader.writeUInt32LE(frameCounter, 9); // frameCounter
            gpdHeader.writeUInt8(gpdCommandId, 13); // commandID
            gpdHeader.writeUInt8(gpdCommandPayload.length, 14); // payloadSize

            const data = Buffer.concat([gpdHeader, gpdCommandPayload]);
            const payload: ZclPayload = {
                header: Zcl.Header.fromBuffer(data),
                data,
                clusterID: Zcl.Clusters.greenPower.ID,
                address: sourceId,
                endpoint: ZSpec.GP_ENDPOINT,
                linkquality: gpdLink,
                groupID: this.greenPowerGroup,
                wasBroadcast: true,
                destinationEndpoint: ZSpec.GP_ENDPOINT,
            };

            this.oneWaitress.resolveZCL(payload);
            this.emit(Events.zclPayload, payload);
        } catch (err) {
            logger.error(`<~x~ [GP] Failed creating ZCL payload. Skipping. ${err}`, NS);
            return;
        }
    }

    /**
     * Emitted from @see Ezsp.ezspTrustCenterJoinHandler
     * Also from @see Ezsp.ezspIdConflictHandler as a DEVICE_LEFT
     *
     * @param newNodeId
     * @param newNodeEui64
     * @param status
     * @param policyDecision
     * @param parentOfNewNodeId
     */
    private async onTrustCenterJoin(
        newNodeId: NodeId,
        newNodeEui64: EUI64,
        status: EmberDeviceUpdate,
        policyDecision: EmberJoinDecision,
        parentOfNewNodeId: NodeId,
    ): Promise<void> {
        if (status === EmberDeviceUpdate.DEVICE_LEFT) {
            const payload: DeviceLeavePayload = {
                networkAddress: newNodeId,
                ieeeAddr: newNodeEui64,
            };

            this.emit(Events.deviceLeave, payload);
        } else {
            if (policyDecision !== EmberJoinDecision.DENY_JOIN) {
                const payload: DeviceJoinedPayload = {
                    networkAddress: newNodeId,
                    ieeeAddr: newNodeEui64,
                };

                // set workaround manuf code if necessary, or revert to default if previous joined device required workaround and new one does not
                const joinManufCode = WORKAROUND_JOIN_MANUF_IEEE_PREFIX_TO_CODE[newNodeEui64.substring(0, 8)] ?? DEFAULT_MANUFACTURER_CODE;

                if (this.manufacturerCode !== joinManufCode) {
                    await new Promise<void>((resolve, reject): void => {
                        this.requestQueue.enqueue(
                            async (): Promise<SLStatus> => {
                                logger.debug(`[WORKAROUND] Setting coordinator manufacturer code to ${Zcl.ManufacturerCode[joinManufCode]}.`, NS);
                                await this.ezsp.ezspSetManufacturerCode(joinManufCode);

                                this.manufacturerCode = joinManufCode;

                                this.emit(Events.deviceJoined, payload);
                                resolve();
                                return SLStatus.OK;
                            },
                            reject,
                            true /*prioritize*/,
                        );
                    });
                } else {
                    this.emit(Events.deviceJoined, payload);
                }
            } else {
                logger.warning(`[TRUST CENTER] Device ${newNodeId}:${newNodeEui64} was denied joining via ${parentOfNewNodeId}.`, NS);
            }
        }
    }

    private async watchdogCounters(): Promise<void> {
        await new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                // listed as per EmberCounterType
                const ncpCounters = await this.ezsp.ezspReadAndClearCounters();

                logger.info(`[NCP COUNTERS] ${ncpCounters.join(',')}`, NS);

                const ashCounters = this.ezsp.ash.readAndClearCounters();

                logger.info(`[ASH COUNTERS] ${ashCounters.join(',')}`, NS);

                resolve();
                return SLStatus.OK;
            }, reject);
        });
    }

    private initVariables(): void {
        this.ezsp.removeAllListeners(EzspEvents.NCP_NEEDS_RESET_AND_INIT);

        clearInterval(this.watchdogCountersHandle);

        this.zdoRequestSequence = 0; // start at 1
        this.zdoRequestRadius = 255;

        this.interpanLock = false;

        this.networkCache = initNetworkCache();
        this.manufacturerCode = DEFAULT_MANUFACTURER_CODE; // will be set in NCP in initEzsp
        this.multicastTable = [];

        this.ezsp.once(EzspEvents.NCP_NEEDS_RESET_AND_INIT, this.onNcpNeedsResetAndInit.bind(this));
    }

    /**
     * Proceed to execute the long list of commands required to setup comms between Host<>NCP.
     * This is called by start and on internal reset.
     */
    private async initEzsp(): Promise<TsType.StartResult> {
        let result: TsType.StartResult = 'resumed';

        // NOTE: something deep in this call can throw too
        const startResult = await this.ezsp.start();

        if (startResult !== EzspStatus.SUCCESS) {
            throw new Error(`Failed to start EZSP layer with status=${EzspStatus[startResult]}.`);
        }

        // call before any other command, else fails
        await this.emberVersion();

        /** MAC indirect timeout should be 7.68 secs (STACK_PROFILE_ZIGBEE_PRO) */
        await this.emberSetEzspConfigValue(EzspConfigId.INDIRECT_TRANSMISSION_TIMEOUT, 7680);
        /** Max hops should be 2 * nwkMaxDepth, where nwkMaxDepth is 15 (STACK_PROFILE_ZIGBEE_PRO) */
        await this.emberSetEzspConfigValue(EzspConfigId.MAX_HOPS, 30);
        await this.emberSetEzspConfigValue(EzspConfigId.SUPPORTED_NETWORKS, 1);
        // allow other devices to modify the binding table
        await this.emberSetEzspPolicy(
            EzspPolicyId.BINDING_MODIFICATION_POLICY,
            EzspDecisionId.CHECK_BINDING_MODIFICATIONS_ARE_VALID_ENDPOINT_CLUSTERS,
        );
        // return message tag only in ezspMessageSentHandler()
        await this.emberSetEzspPolicy(EzspPolicyId.MESSAGE_CONTENTS_IN_CALLBACK_POLICY, EzspDecisionId.MESSAGE_TAG_ONLY_IN_CALLBACK);
        await this.emberSetEzspValue(EzspValueId.TRANSIENT_DEVICE_TIMEOUT, 2, lowHighBytes(this.stackConfig.TRANSIENT_DEVICE_TIMEOUT));
        await this.ezsp.ezspSetManufacturerCode(this.manufacturerCode);
        // network security init
        await this.emberSetEzspConfigValue(EzspConfigId.STACK_PROFILE, STACK_PROFILE_ZIGBEE_PRO);
        await this.emberSetEzspConfigValue(EzspConfigId.SECURITY_LEVEL, SECURITY_LEVEL_Z3);
        // common configs
        await this.emberSetEzspConfigValue(EzspConfigId.MAX_END_DEVICE_CHILDREN, this.stackConfig.MAX_END_DEVICE_CHILDREN);
        await this.emberSetEzspConfigValue(EzspConfigId.END_DEVICE_POLL_TIMEOUT, this.stackConfig.END_DEVICE_POLL_TIMEOUT);
        await this.emberSetEzspConfigValue(EzspConfigId.TRANSIENT_KEY_TIMEOUT_S, this.stackConfig.TRANSIENT_KEY_TIMEOUT_S);

        // WARNING: From here on EZSP commands that affect memory allocation on the NCP should no longer be called (like resizing tables)

        await this.registerFixedEndpoints();
        this.clearNetworkCache();

        result = await this.initTrustCenter();

        // after network UP, as per SDK, ensures clean slate
        await this.initNCPConcentrator();

        // populate network cache info
        const [status, , parameters] = await this.ezsp.ezspGetNetworkParameters();

        if (status !== SLStatus.OK) {
            throw new Error(`Failed to get network parameters with status=${SLStatus[status]}.`);
        }

        this.networkCache.parameters = parameters;
        this.networkCache.status = await this.ezsp.ezspNetworkState();
        this.networkCache.eui64 = await this.ezsp.ezspGetEui64();

        logger.debug(`[INIT] Network Ready! ${JSON.stringify(this.networkCache)}`, NS);

        this.watchdogCountersHandle = setInterval(this.watchdogCounters.bind(this), WATCHDOG_COUNTERS_FEED_INTERVAL);

        this.requestQueue.startDispatching();

        return result;
    }

    /**
     * NCP concentrator init. Also enables source route discovery mode with RESCHEDULE.
     *
     * From AN1233:
     * To function correctly in a Zigbee PRO network, a trust center also requires that:
     *
     * 1. The trust center application must act as a concentrator (either high or low RAM).
     * 2. The trust center application must have support for source routing.
     *    It must record the source routes and properly handle requests by the stack for a particular source route.
     * 3. The trust center application must use an address cache for security, in order to maintain a mapping of IEEE address to short ID.
     *
     * Failure to satisfy all of the above requirements may result in failures when joining/rejoining devices to the network across multiple hops
     * (through a target node that is neither the trust center nor one of its neighboring routers.)
     */
    private async initNCPConcentrator(): Promise<void> {
        const status = await this.ezsp.ezspSetConcentrator(
            true,
            this.stackConfig.CONCENTRATOR_RAM_TYPE === 'low' ? EMBER_LOW_RAM_CONCENTRATOR : EMBER_HIGH_RAM_CONCENTRATOR,
            this.stackConfig.CONCENTRATOR_MIN_TIME,
            this.stackConfig.CONCENTRATOR_MAX_TIME,
            this.stackConfig.CONCENTRATOR_ROUTE_ERROR_THRESHOLD,
            this.stackConfig.CONCENTRATOR_DELIVERY_FAILURE_THRESHOLD,
            this.stackConfig.CONCENTRATOR_MAX_HOPS,
        );

        if (status !== SLStatus.OK) {
            throw new Error(`[CONCENTRATOR] Failed to set concentrator with status=${SLStatus[status]}.`);
        }

        const remainTilMTORR = await this.ezsp.ezspSetSourceRouteDiscoveryMode(EmberSourceRouteDiscoveryMode.RESCHEDULE);

        logger.info(`[CONCENTRATOR] Started source route discovery. ${remainTilMTORR}ms until next broadcast.`, NS);
    }

    /**
     * Register fixed endpoints and set any related multicast entries that need to be.
     */
    private async registerFixedEndpoints(): Promise<void> {
        for (const ep of FIXED_ENDPOINTS) {
            if (ep.networkIndex !== 0x00) {
                logger.debug(`Multi-network not currently supported. Skipping endpoint ${JSON.stringify(ep)}.`, NS);
                continue;
            }

            const [epStatus] = await this.ezsp.ezspGetEndpointFlags(ep.endpoint);

            // endpoint not already registered
            if (epStatus !== SLStatus.OK) {
                // check to see if ezspAddEndpoint needs to be called
                // if ezspInit is called without NCP reset, ezspAddEndpoint is not necessary and will return an error
                const status = await this.ezsp.ezspAddEndpoint(
                    ep.endpoint,
                    ep.profileId,
                    ep.deviceId,
                    ep.deviceVersion,
                    ep.inClusterList.slice(), // copy
                    ep.outClusterList.slice(), // copy
                );

                if (status === SLStatus.OK) {
                    logger.debug(`Registered endpoint '${ep.endpoint}'.`, NS);
                } else {
                    throw new Error(`Failed to register endpoint "${ep.endpoint}" with status=${SLStatus[status]}.`);
                }
            } else {
                logger.debug(`Endpoint "${ep.endpoint}" already registered.`, NS);
            }

            for (const multicastId of ep.multicastIds) {
                const multicastEntry: EmberMulticastTableEntry = {
                    multicastId,
                    endpoint: ep.endpoint,
                    networkIndex: ep.networkIndex,
                };

                const status = await this.ezsp.ezspSetMulticastTableEntry(this.multicastTable.length, multicastEntry);

                if (status !== SLStatus.OK) {
                    throw new Error(`Failed to register group "${multicastId}" in multicast table with status=${SLStatus[status]}.`);
                }

                logger.debug(`Registered multicast table entry (${this.multicastTable.length}): ${JSON.stringify(multicastEntry)}.`, NS);
                this.multicastTable.push(multicastEntry.multicastId);
            }
        }
    }

    /**
     *
     * @returns True if the network needed to be formed.
     */
    private async initTrustCenter(): Promise<TsType.StartResult> {
        // init TC policies
        {
            let status = await this.emberSetEzspPolicy(EzspPolicyId.TC_KEY_REQUEST_POLICY, EzspDecisionId.ALLOW_TC_KEY_REQUESTS_AND_SEND_CURRENT_KEY);

            if (status !== SLStatus.OK) {
                throw new Error(
                    `[INIT TC] Failed to set EzspPolicyId TC_KEY_REQUEST_POLICY to ALLOW_TC_KEY_REQUESTS_AND_SEND_CURRENT_KEY ` +
                        `with status=${SLStatus[status]}.`,
                );
            }

            const appKeyRequestsPolicy = ALLOW_APP_KEY_REQUESTS ? EzspDecisionId.ALLOW_APP_KEY_REQUESTS : EzspDecisionId.DENY_APP_KEY_REQUESTS;
            status = await this.emberSetEzspPolicy(EzspPolicyId.APP_KEY_REQUEST_POLICY, appKeyRequestsPolicy);

            if (status !== SLStatus.OK) {
                throw new Error(
                    `[INIT TC] Failed to set EzspPolicyId APP_KEY_REQUEST_POLICY to ${EzspDecisionId[appKeyRequestsPolicy]} ` +
                        `with status=${SLStatus[status]}.`,
                );
            }

            status = await this.emberSetJoinPolicy(EmberJoinDecision.USE_PRECONFIGURED_KEY);

            if (status !== SLStatus.OK) {
                throw new Error(`[INIT TC] Failed to set join policy to USE_PRECONFIGURED_KEY with status=${SLStatus[status]}.`);
            }
        }

        const configNetworkKey = Buffer.from(this.networkOptions.networkKey);
        const networkInitStruct: EmberNetworkInitStruct = {
            bitmask: EmberNetworkInitBitmask.PARENT_INFO_IN_TOKEN | EmberNetworkInitBitmask.END_DEVICE_REJOIN_ON_REBOOT,
        };
        const initStatus = await this.ezsp.ezspNetworkInit(networkInitStruct);

        logger.debug(`[INIT TC] Network init status=${SLStatus[initStatus]}.`, NS);

        if (initStatus !== SLStatus.OK && initStatus !== SLStatus.NOT_JOINED) {
            throw new Error(`[INIT TC] Failed network init request with status=${SLStatus[initStatus]}.`);
        }

        let action: NetworkInitAction = NetworkInitAction.DONE;

        if (initStatus === SLStatus.OK) {
            // network
            await this.oneWaitress.startWaitingForEvent(
                {eventName: OneWaitressEvents.STACK_STATUS_NETWORK_UP},
                DEFAULT_NETWORK_REQUEST_TIMEOUT,
                '[INIT TC] Network init',
            );

            const [npStatus, nodeType, netParams] = await this.ezsp.ezspGetNetworkParameters();

            logger.debug(`[INIT TC] Current adapter network: nodeType=${EmberNodeType[nodeType]} params=${JSON.stringify(netParams)}`, NS);

            if (
                npStatus === SLStatus.OK &&
                nodeType === EmberNodeType.COORDINATOR &&
                this.networkOptions.panID === netParams.panId &&
                equals(this.networkOptions.extendedPanID, netParams.extendedPanId)
            ) {
                // config matches adapter so far, no error, we can check the network key
                const context = initSecurityManagerContext();
                context.coreKeyType = SecManKeyType.NETWORK;
                context.keyIndex = 0;
                const [nkStatus, networkKey] = await this.ezsp.ezspExportKey(context);

                if (nkStatus !== SLStatus.OK) {
                    throw new Error(`[BACKUP] Failed to export Network Key with status=${SLStatus[nkStatus]}.`);
                }

                // config doesn't match adapter anymore
                if (!networkKey.contents.equals(configNetworkKey)) {
                    action = NetworkInitAction.LEAVE;
                }
            } else {
                // config doesn't match adapter
                action = NetworkInitAction.LEAVE;
            }

            if (action === NetworkInitAction.LEAVE) {
                logger.info(`[INIT TC] Adapter network does not match config. Leaving network...`, NS);
                const leaveStatus = await this.ezsp.ezspLeaveNetwork();

                if (leaveStatus !== SLStatus.OK) {
                    throw new Error(`[INIT TC] Failed leave network request with status=${SLStatus[leaveStatus]}.`);
                }

                await this.oneWaitress.startWaitingForEvent(
                    {eventName: OneWaitressEvents.STACK_STATUS_NETWORK_DOWN},
                    DEFAULT_NETWORK_REQUEST_TIMEOUT,
                    '[INIT TC] Leave network',
                );

                await Wait(200); // settle down

                action = NetworkInitAction.LEFT;
            }
        }

        const backup: Backup = this.getStoredBackup();

        if (initStatus === SLStatus.NOT_JOINED || action === NetworkInitAction.LEFT) {
            // no network
            if (backup != null) {
                if (
                    this.networkOptions.panID === backup.networkOptions.panId &&
                    Buffer.from(this.networkOptions.extendedPanID).equals(backup.networkOptions.extendedPanId) &&
                    this.networkOptions.channelList.includes(backup.logicalChannel) &&
                    configNetworkKey.equals(backup.networkOptions.networkKey)
                ) {
                    // config matches backup
                    action = NetworkInitAction.FORM_BACKUP;
                } else {
                    // config doesn't match backup
                    logger.info(`[INIT TC] Config does not match backup.`, NS);
                    action = NetworkInitAction.FORM_CONFIG;
                }
            } else {
                // no backup
                logger.info(`[INIT TC] No valid backup found.`, NS);
                action = NetworkInitAction.FORM_CONFIG;
            }
        }

        //---- from here on, we assume everything is in place for whatever decision was taken above

        let result: TsType.StartResult = 'resumed';

        switch (action) {
            case NetworkInitAction.FORM_BACKUP: {
                logger.info(`[INIT TC] Forming from backup.`, NS);
                const keyList: LinkKeyBackupData[] = backup.devices.map((device) => {
                    const octets = Array.from(device.ieeeAddress.reverse());

                    return {
                        deviceEui64: `0x${octets.map((octet) => octet.toString(16).padStart(2, '0')).join('')}`,
                        key: {contents: device.linkKey.key},
                        outgoingFrameCounter: device.linkKey.txCounter,
                        incomingFrameCounter: device.linkKey.rxCounter,
                    };
                });

                // before forming
                await this.importLinkKeys(keyList);

                await this.formNetwork(
                    true /*from backup*/,
                    backup.networkOptions.networkKey,
                    backup.networkKeyInfo.sequenceNumber,
                    backup.networkOptions.panId,
                    Array.from(backup.networkOptions.extendedPanId),
                    backup.logicalChannel,
                    backup.ezsp.hashed_tclk,
                );

                result = 'restored';
                break;
            }
            case NetworkInitAction.FORM_CONFIG: {
                logger.info(`[INIT TC] Forming from config.`, NS);
                await this.formNetwork(
                    false /*from config*/,
                    configNetworkKey,
                    0,
                    this.networkOptions.panID,
                    this.networkOptions.extendedPanID,
                    this.networkOptions.channelList[0],
                    randomBytes(EMBER_ENCRYPTION_KEY_SIZE), // rnd TC link key
                );

                result = 'reset';
                break;
            }
            case NetworkInitAction.DONE: {
                logger.info(`[INIT TC] Adapter network matches config.`, NS);
                break;
            }
            default: {
                throw new Error(`[INIT TC] Invalid action "${NetworkInitAction[action]}" for final stage.`);
            }
        }

        // can't let frame counter wrap to zero (uint32_t), will force a broadcast after init if getting too close
        if (backup != null && backup.networkKeyInfo.frameCounter > 0xfeeeeeee) {
            // XXX: while this remains a pretty low occurrence in most (small) networks,
            //      currently Z2M won't support the key update because of one-way config...
            //      need to investigate handling this properly

            // logger.warning(`[INIT TC] Network key frame counter is reaching its limit. Scheduling broadcast to update network key. `
            //     + `This may result in some devices (especially battery-powered) temporarily losing connection.`, NS);
            // // XXX: no idea here on the proper timer value, but this will block the network for several seconds on exec
            // //      (probably have to take the behavior of sleepy-end devices into account to improve chances of reaching everyone right away?)
            // setTimeout(async () => {
            //     this.requestQueue.enqueue(async (): Promise<SLStatus> => {
            //         await this.broadcastNetworkKeyUpdate();

            //         return SLStatus.OK;
            //     }, logger.error, true);// no reject just log error if any, will retry next start, & prioritize so we know it'll run when expected
            // }, 300000);
            logger.warning(`[INIT TC] Network key frame counter is reaching its limit. A new network key will have to be instaured soon.`, NS);
        }

        return result;
    }

    /**
     * Form a network using given parameters.
     */
    private async formNetwork(
        fromBackup: boolean,
        networkKey: Buffer,
        networkKeySequenceNumber: number,
        panId: PanId,
        extendedPanId: ExtendedPanId,
        radioChannel: number,
        tcLinkKey: Buffer,
    ): Promise<void> {
        const state: EmberInitialSecurityState = {
            bitmask:
                EmberInitialSecurityBitmask.TRUST_CENTER_GLOBAL_LINK_KEY |
                EmberInitialSecurityBitmask.HAVE_PRECONFIGURED_KEY |
                EmberInitialSecurityBitmask.HAVE_NETWORK_KEY |
                EmberInitialSecurityBitmask.TRUST_CENTER_USES_HASHED_LINK_KEY |
                EmberInitialSecurityBitmask.REQUIRE_ENCRYPTED_KEY,
            preconfiguredKey: {contents: tcLinkKey},
            networkKey: {contents: networkKey},
            networkKeySequenceNumber: networkKeySequenceNumber,
            preconfiguredTrustCenterEui64: ZSpec.BLANK_EUI64,
        };

        if (fromBackup) {
            state.bitmask |= EmberInitialSecurityBitmask.NO_FRAME_COUNTER_RESET;
        }

        let status = await this.ezsp.ezspSetInitialSecurityState(state);

        if (status !== SLStatus.OK) {
            throw new Error(`[INIT FORM] Failed to set initial security state with status=${SLStatus[status]}.`);
        }

        const extended: EmberExtendedSecurityBitmask =
            EmberExtendedSecurityBitmask.JOINER_GLOBAL_LINK_KEY | EmberExtendedSecurityBitmask.NWK_LEAVE_REQUEST_NOT_ALLOWED;
        status = await this.ezsp.ezspSetExtendedSecurityBitmask(extended);

        if (status !== SLStatus.OK) {
            throw new Error(`[INIT FORM] Failed to set extended security bitmask to ${extended} with status=${SLStatus[status]}.`);
        }

        if (!fromBackup) {
            status = await this.ezsp.ezspClearKeyTable();

            if (status !== SLStatus.OK) {
                logger.error(`[INIT FORM] Failed to clear key table with status=${SLStatus[status]}.`, NS);
            }
        }

        const netParams: EmberNetworkParameters = {
            panId,
            extendedPanId,
            radioTxPower: 5,
            radioChannel,
            joinMethod: EmberJoinMethod.MAC_ASSOCIATION,
            nwkManagerId: ZSpec.COORDINATOR_ADDRESS,
            nwkUpdateId: 0,
            channels: EMBER_ALL_802_15_4_CHANNELS_MASK,
        };

        logger.info(`[INIT FORM] Forming new network with: ${JSON.stringify(netParams)}`, NS);

        status = await this.ezsp.ezspFormNetwork(netParams);

        if (status !== SLStatus.OK) {
            throw new Error(`[INIT FORM] Failed form network request with status=${SLStatus[status]}.`);
        }

        await this.oneWaitress.startWaitingForEvent(
            {eventName: OneWaitressEvents.STACK_STATUS_NETWORK_UP},
            DEFAULT_NETWORK_REQUEST_TIMEOUT,
            '[INIT FORM] Form network',
        );

        status = await this.ezsp.ezspStartWritingStackTokens();

        logger.debug(`[INIT FORM] Start writing stack tokens status=${SLStatus[status]}.`, NS);
        logger.info(`[INIT FORM] New network formed!`, NS);
    }

    /**
     * Loads currently stored backup and returns it in internal backup model.
     */
    private getStoredBackup(): Backup {
        if (!existsSync(this.backupPath)) {
            return null;
        }

        let data: UnifiedBackupStorage;

        try {
            data = JSON.parse(readFileSync(this.backupPath).toString());
        } catch (error) {
            throw new Error(`[BACKUP] Coordinator backup is corrupted.`);
        }

        if (data.metadata?.format === 'zigpy/open-coordinator-backup' && data.metadata?.version) {
            if (data.metadata?.version !== 1) {
                throw new Error(`[BACKUP] Unsupported open coordinator backup version (version=${data.metadata?.version}).`);
            }

            if (!data.stack_specific?.ezsp || !data.metadata.internal.ezspVersion) {
                throw new Error(`[BACKUP] Current backup file is not for EmberZNet stack.`);
            }

            if (data.metadata.internal.ezspVersion < BACKUP_OLDEST_SUPPORTED_EZSP_VERSION) {
                renameSync(this.backupPath, `${this.backupPath}.old`);
                logger.warning(`[BACKUP] Current backup file is from an unsupported EZSP version. Renaming and ignoring.`, NS);
                return null;
            }

            return BackupUtils.fromUnifiedBackup(data);
        } else {
            throw new Error(`[BACKUP] Unknown backup format.`);
        }
    }

    /**
     * Export link keys for backup.
     *
     * @return List of keys data with AES hashed keys
     */
    public async exportLinkKeys(): Promise<LinkKeyBackupData[]> {
        const [confStatus, keyTableSize] = await this.ezsp.ezspGetConfigurationValue(EzspConfigId.KEY_TABLE_SIZE);

        if (confStatus !== SLStatus.OK) {
            throw new Error(`[BACKUP] Failed to retrieve key table size from NCP with status=${SLStatus[confStatus]}.`);
        }

        let context: SecManContext;
        let plaintextKey: SecManKey;
        let apsKeyMeta: SecManAPSKeyMetadata;
        let status: SLStatus;
        const keyList: LinkKeyBackupData[] = [];

        for (let i = 0; i < keyTableSize; i++) {
            [status, context, plaintextKey, apsKeyMeta] = await this.ezsp.ezspExportLinkKeyByIndex(i);
            logger.debug(`[BACKUP] Export link key at index ${i}, status=${SLStatus[status]}.`, NS);

            // only include key if we could retrieve one at index and hash it properly
            if (status === SLStatus.OK) {
                // Rather than give the real link key, the backup contains a hashed version of the key.
                // This is done to prevent a compromise of the backup data from compromising the current link keys.
                // This is per the Smart Energy spec.
                const [hashStatus, hashedKey] = await this.emberAesHashSimple(plaintextKey.contents);

                if (hashStatus === SLStatus.OK) {
                    keyList.push({
                        deviceEui64: context.eui64,
                        key: {contents: hashedKey},
                        outgoingFrameCounter: apsKeyMeta.outgoingFrameCounter,
                        incomingFrameCounter: apsKeyMeta.incomingFrameCounter,
                    });
                } else {
                    // this should never happen?
                    logger.error(`[BACKUP] Failed to hash link key at index ${i} with status=${SLStatus[hashStatus]}. Omitting from backup.`, NS);
                }
            }
        }

        logger.info(`[BACKUP] Retrieved ${keyList.length} link keys.`, NS);

        return keyList;
    }

    /**
     * Import link keys from backup.
     *
     * @param backupData
     */
    public async importLinkKeys(backupData: LinkKeyBackupData[]): Promise<void> {
        if (!backupData?.length) {
            return;
        }

        const [confStatus, keyTableSize] = await this.ezsp.ezspGetConfigurationValue(EzspConfigId.KEY_TABLE_SIZE);

        if (confStatus !== SLStatus.OK) {
            throw new Error(`[BACKUP] Failed to retrieve key table size from NCP with status=${SLStatus[confStatus]}.`);
        }

        if (backupData.length > keyTableSize) {
            throw new Error(`[BACKUP] Current key table of ${keyTableSize} is too small to import backup of ${backupData.length}!`);
        }

        const networkStatus = await this.emberNetworkState();

        if (networkStatus !== EmberNetworkStatus.NO_NETWORK) {
            throw new Error(`[BACKUP] Cannot import TC data while network is up, networkStatus=${EmberNetworkStatus[networkStatus]}.`);
        }

        let status: SLStatus;

        for (let i = 0; i < keyTableSize; i++) {
            // erase any key index not present in backup but available on the NCP
            status =
                i >= backupData.length
                    ? await this.ezsp.ezspEraseKeyTableEntry(i)
                    : await this.ezsp.ezspImportLinkKey(i, backupData[i].deviceEui64, backupData[i].key);

            if (status !== SLStatus.OK) {
                throw new Error(
                    `[BACKUP] Failed to ${i >= backupData.length ? 'erase' : 'set'} key table entry at index ${i} ` +
                        `with status=${SLStatus[status]}`,
                );
            }
        }

        logger.info(`[BACKUP] Imported ${backupData.length} keys.`, NS);
    }

    /**
     * Routine to update the network key and broadcast the update to the network after a set time.
     * NOTE: This should run at a large interval, but before the uint32_t of the frame counter is able to reach all Fs (can't wrap to 0).
     *       This may disrupt sleepy end devices that miss the update, but they should be able to TC rejoin (in most cases...).
     *       On the other hand, the more often this runs, the more secure the network is...
     */
    private async broadcastNetworkKeyUpdate(): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                logger.warning(`[TRUST CENTER] Performing a network key update. This might take a while and disrupt normal operation.`, NS);

                // zero-filled = let stack generate new random network key
                let status = await this.ezsp.ezspBroadcastNextNetworkKey({contents: Buffer.alloc(EMBER_ENCRYPTION_KEY_SIZE)});

                if (status !== SLStatus.OK) {
                    logger.error(`[TRUST CENTER] Failed to broadcast next network key with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                // XXX: this will block other requests for a while, but should ensure the key propagates without interference?
                //      could also stop dispatching entirely and do this outside the queue if necessary/better
                await Wait(BROADCAST_NETWORK_KEY_SWITCH_WAIT_TIME);

                status = await this.ezsp.ezspBroadcastNetworkKeySwitch();

                if (status !== SLStatus.OK) {
                    // XXX: Not sure how likely this is, but this is bad, probably should hard fail?
                    logger.error(`[TRUST CENTER] Failed to broadcast network key switch with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                resolve();
                return status;
            }, reject);
        });
    }

    /**
     * Received when EZSP layer alerts of a problem that needs the NCP to be reset.
     * @param status
     */
    private async onNcpNeedsResetAndInit(status: EzspStatus): Promise<void> {
        logger.error(`!!! ADAPTER FATAL ERROR reason=${EzspStatus[status]}. !!!`, NS);

        if (this.requestQueue.isHigh) {
            logger.info(`Request queue is high (${this.requestQueue.totalQueued}), triggering full restart to prevent stressing the adapter.`, NS);
            this.emit(Events.disconnected);
        } else {
            logger.info(`Attempting adapter reset...`, NS);

            try {
                await this.stop();
                await Wait(500); // just because
                await this.start();
            } catch (err) {
                logger.error(`Failed to reset and init adapter. ${err}`, NS);
                this.emit(Events.disconnected);
            }
        }
    }

    //---- START Events

    //---- END Events

    //---- START Cache-enabled EZSP wrappers

    /**
     * Clear the cached network values (set to invalid values).
     */
    private clearNetworkCache(): void {
        this.networkCache = initNetworkCache();
    }

    /**
     * Return the current network state.
     * This call caches the results on the host to prevent frequent EZSP transactions.
     * Check against UNKNOWN_NETWORK_STATE for validity.
     */
    public async emberNetworkState(): Promise<EmberNetworkStatus> {
        if (this.networkCache.status === (UNKNOWN_NETWORK_STATE as EmberNetworkStatus)) {
            const networkStatus = await this.ezsp.ezspNetworkState();

            this.networkCache.status = networkStatus;
        }

        return this.networkCache.status;
    }

    /**
     * Return the EUI 64 of the local node
     * This call caches the results on the host to prevent frequent EZSP transactions.
     * Check against BLANK_EUI64 for validity.
     */
    public async emberGetEui64(): Promise<EUI64> {
        if (this.networkCache.eui64 === ZSpec.BLANK_EUI64) {
            this.networkCache.eui64 = await this.ezsp.ezspGetEui64();
        }

        return this.networkCache.eui64;
    }

    /**
     * Return the PAN ID of the local node.
     * This call caches the results on the host to prevent frequent EZSP transactions.
     * Check against INVALID_PAN_ID for validity.
     */
    public async emberGetPanId(): Promise<PanId> {
        if (this.networkCache.parameters.panId === ZSpec.INVALID_PAN_ID) {
            const [status, , parameters] = await this.ezsp.ezspGetNetworkParameters();

            if (status === SLStatus.OK) {
                this.networkCache.parameters = parameters;
            } else {
                logger.error(`Failed to get PAN ID (via network parameters) with status=${SLStatus[status]}.`, NS);
            }
        }

        return this.networkCache.parameters.panId;
    }

    /**
     * Return the Extended PAN ID of the local node.
     * This call caches the results on the host to prevent frequent EZSP transactions.
     * Check against BLANK_EXTENDED_PAN_ID for validity.
     */
    public async emberGetExtendedPanId(): Promise<ExtendedPanId> {
        if (equals(this.networkCache.parameters.extendedPanId, ZSpec.BLANK_EXTENDED_PAN_ID)) {
            const [status, , parameters] = await this.ezsp.ezspGetNetworkParameters();

            if (status === SLStatus.OK) {
                this.networkCache.parameters = parameters;
            } else {
                logger.error(`Failed to get Extended PAN ID (via network parameters) with status=${SLStatus[status]}.`, NS);
            }
        }

        return this.networkCache.parameters.extendedPanId;
    }

    /**
     * Return the radio channel (uint8_t) of the current network.
     * This call caches the results on the host to prevent frequent EZSP transactions.
     * Check against INVALID_RADIO_CHANNEL for validity.
     */
    public async emberGetRadioChannel(): Promise<number> {
        if (this.networkCache.parameters.radioChannel === INVALID_RADIO_CHANNEL) {
            const [status, , parameters] = await this.ezsp.ezspGetNetworkParameters();

            if (status === SLStatus.OK) {
                this.networkCache.parameters = parameters;
            } else {
                logger.error(`Failed to get radio channel (via network parameters) with status=${SLStatus[status]}.`, NS);
            }
        }

        return this.networkCache.parameters.radioChannel;
    }

    // queued
    public async emberStartEnergyScan(): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                const status = await this.ezsp.ezspStartScan(EzspNetworkScanType.ENERGY_SCAN, EMBER_ALL_802_15_4_CHANNELS_MASK, ENERGY_SCAN_DURATION);

                if (status !== SLStatus.OK) {
                    logger.error(`Failed energy scan request with status=${SLStatus[status]}.`, NS);
                    return SLStatus.FAIL;
                }

                // TODO: result in logs only atm, since UI doesn't support it

                resolve();
                return SLStatus.OK;
            }, reject);
        });
    }

    //---- END Cache-enabled EZSP wrappers

    //---- START EZSP wrappers

    /**
     * Ensure the Host & NCP are aligned on protocols using version.
     * Cache the retrieved information.
     *
     * NOTE: currently throws on mismatch until support for lower versions is implemented (not planned atm)
     *
     * Does nothing if ncpNeedsResetAndInit == true.
     */
    private async emberVersion(): Promise<void> {
        // send the Host version number to the NCP.
        // The NCP returns the EZSP version that the NCP is running along with the stackType and stackVersion
        let [ncpEzspProtocolVer, ncpStackType, ncpStackVer] = await this.ezsp.ezspVersion(EZSP_PROTOCOL_VERSION);

        // verify that the stack type is what is expected
        if (ncpStackType !== EZSP_STACK_TYPE_MESH) {
            throw new Error(`Stack type ${ncpStackType} is not expected!`);
        }

        if (ncpEzspProtocolVer === EZSP_PROTOCOL_VERSION) {
            logger.debug(`Adapter EZSP protocol version (${ncpEzspProtocolVer}) matches Host.`, NS);
        } else if (ncpEzspProtocolVer < EZSP_PROTOCOL_VERSION && ncpEzspProtocolVer >= EZSP_MIN_PROTOCOL_VERSION) {
            [ncpEzspProtocolVer, ncpStackType, ncpStackVer] = await this.ezsp.ezspVersion(ncpEzspProtocolVer);

            logger.info(`Adapter EZSP protocol version (${ncpEzspProtocolVer}) lower than Host. Switched.`, NS);
        } else {
            throw new Error(
                `Adapter EZSP protocol version (${ncpEzspProtocolVer}) is not supported ` +
                    `by Host [${EZSP_MIN_PROTOCOL_VERSION}-${EZSP_PROTOCOL_VERSION}].`,
            );
        }

        this.ezsp.setProtocolVersion(ncpEzspProtocolVer);
        logger.debug(`Adapter info: EZSPVersion=${ncpEzspProtocolVer} StackType=${ncpStackType} StackVersion=${ncpStackVer}`, NS);

        const [status, versionStruct] = await this.ezsp.ezspGetVersionStruct();

        if (status !== SLStatus.OK) {
            // Should never happen with support of only EZSP v13+
            throw new Error(`NCP has old-style version number. Not supported.`);
        }

        this.version = {
            ezsp: ncpEzspProtocolVer,
            revision: `${versionStruct.major}.${versionStruct.minor}.${versionStruct.patch} [${EmberVersionType[versionStruct.type]}]`,
            ...versionStruct,
        };

        if (versionStruct.type !== EmberVersionType.GA) {
            logger.warning(`Adapter is running a non-GA version (${EmberVersionType[versionStruct.type]}).`, NS);
        }

        logger.info(`Adapter version info: ${JSON.stringify(this.version)}`, NS);
    }

    /**
     * This function sets an EZSP config value.
     * WARNING: Do not call for values that cannot be set after init without first resetting NCP (like table sizes).
     *          To avoid an extra NCP call, this does not check for it.
     * @param configId
     * @param value uint16_t
     * @returns
     */
    private async emberSetEzspConfigValue(configId: EzspConfigId, value: number): Promise<SLStatus> {
        const status = await this.ezsp.ezspSetConfigurationValue(configId, value);

        logger.debug(`[EzspConfigId] SET "${EzspConfigId[configId]}" TO "${value}" with status=${SLStatus[status]}.`, NS);

        if (status !== SLStatus.OK) {
            logger.info(
                `[EzspConfigId] Failed to SET "${EzspConfigId[configId]}" TO "${value}" with status=${SLStatus[status]}. ` +
                    `Firmware value will be used instead.`,
                NS,
            );
        }

        return status;
    }

    /**
     * This function sets an EZSP value.
     * @param valueId
     * @param valueLength uint8_t
     * @param value uint8_t *
     * @returns
     */
    private async emberSetEzspValue(valueId: EzspValueId, valueLength: number, value: number[]): Promise<SLStatus> {
        const status = await this.ezsp.ezspSetValue(valueId, valueLength, value);

        logger.debug(`[EzspValueId] SET "${EzspValueId[valueId]}" TO "${value}" with status=${SLStatus[status]}.`, NS);

        return status;
    }

    /**
     * This function sets an EZSP policy.
     * @param policyId
     * @param decisionId Can be bitop
     * @returns
     */
    private async emberSetEzspPolicy(policyId: EzspPolicyId, decisionId: number): Promise<SLStatus> {
        const status = await this.ezsp.ezspSetPolicy(policyId, decisionId);

        logger.debug(`[EzspPolicyId] SET "${EzspPolicyId[policyId]}" TO "${decisionId}" with status=${SLStatus[status]}.`, NS);

        return status;
    }

    /**
     * Here we convert the normal Ember AES hash call to the specialized EZSP call.
     * This came about because we cannot pass a block of data that is
     * both input and output into EZSP. The block must be broken up into two
     * elements. We unify the two pieces here to make it invisible to the users.
     * @param context EmberAesMmoHashContext *
     * @param finalize
     * @param data uint8_t * Expected of valid length (as in, not larger alloc)
     * @returns status
     * @returns result context or null
     */
    private async aesMmoHash(
        context: EmberAesMmoHashContext,
        finalize: boolean,
        data: Buffer,
    ): Promise<[SLStatus, reContext: EmberAesMmoHashContext]> {
        if (data.length > 255) {
            // will be caught by request queue and rejected internally.
            throw new EzspError(EzspStatus.ERROR_INVALID_CALL);
        }

        const [status, reContext] = await this.ezsp.ezspAesMmoHash(context, finalize, data);

        return [status, reContext];
    }

    /**
     *  This routine processes the passed chunk of data and updates
     *  the hash calculation based on it.  The data passed in MUST
     *  have a length that is a multiple of 16.
     *
     * @param context EmberAesMmoHashContext*  A pointer to the location of the hash context to update.
     * @param data const uint8_t* A pointer to the location of the data to hash.
     *
     * @returns An ::SLStatus value indicating EMBER_SUCCESS if the hash was
     *   calculated successfully.  EMBER_INVALID_CALL if the block size is not a
     *   multiple of 16 bytes, and EMBER_INDEX_OUT_OF_RANGE is returned when the
     *   data exceeds the maximum limits of the hash function.
     * @returns result context or null
     */
    private async emberAesMmoHashUpdate(context: EmberAesMmoHashContext, data: Buffer): Promise<[SLStatus, reContext: EmberAesMmoHashContext]> {
        return this.aesMmoHash(context, false /*finalize?*/, data);
    }

    /**
     *  This routine processes the passed chunk of data (if non-NULL)
     *  and update the hash context that is passed in.  In then performs
     *  the final calculations on the hash and returns the final answer
     *  in the result parameter of the ::EmberAesMmoHashContext structure.
     *  The length of the data passed in may be any value, it does not have
     *  to be a multiple of 16.
     *
     * @param context EmberAesMmoHashContext * A pointer to the location of the hash context to finalize.
     * @param data uint8_t * A pointer to the location of data to hash. May be NULL.
     *
     * @returns An ::SLStatus value indicating EMBER_SUCCESS if the hash was
     *   calculated successfully.  EMBER_INVALID_CALL if the block size is not a
     *   multiple of 16 bytes, and EMBER_INDEX_OUT_OF_RANGE is returned when the
     *   data exceeds the maximum limits of the hash function.
     * @returns result context or null
     */
    private async emberAesMmoHashFinal(context: EmberAesMmoHashContext, data: Buffer): Promise<[SLStatus, reContext: EmberAesMmoHashContext]> {
        return this.aesMmoHash(context, true /*finalize?*/, data);
    }

    /**
     *  This is a convenience method when the hash data is less than 255
     *  bytes. It inits, updates, and finalizes the hash in one function call.
     *
     * @param data const uint8_t* The data to hash. Expected of valid length (as in, not larger alloc)
     *
     * @returns An ::SLStatus value indicating EMBER_SUCCESS if the hash was
     *   calculated successfully.  EMBER_INVALID_CALL if the block size is not a
     *   multiple of 16 bytes, and EMBER_INDEX_OUT_OF_RANGE is returned when the
     *   data exceeds the maximum limits of the hash function.
     * @returns result uint8_t*  The location where the result of the hash will be written.
     */
    private async emberAesHashSimple(data: Buffer): Promise<[SLStatus, result: Buffer]> {
        const context = aesMmoHashInit();

        const [status, reContext] = await this.emberAesMmoHashFinal(context, data);

        return [status, reContext?.result];
    }

    /**
     * Enable local permit join and optionally broadcast the ZDO Mgmt_Permit_Join_req message.
     * This API can be called from any device type and still return EMBER_SUCCESS.
     * If the API is called from an end device, the permit association bit will just be left off.
     *
     * @param duration uint8_t The duration that the permit join bit will remain on
     * and other devices will be able to join the current network.
     * @param broadcastMgmtPermitJoin whether or not to broadcast the ZDO Mgmt_Permit_Join_req message.
     *
     * @returns status of whether or not permit join was enabled.
     * @returns apsFrame Will be null if not broadcasting.
     * @returns messageTag The tag passed to ezspSend${x} function.
     */
    private async emberPermitJoining(
        duration: number,
        broadcastMgmtPermitJoin: boolean,
    ): Promise<[SLStatus, apsFrame: EmberApsFrame, messageTag: number]> {
        let status = await this.ezsp.ezspPermitJoining(duration);
        let apsFrame: EmberApsFrame = null;
        let messageTag: number = null;

        logger.debug(`Permit joining for ${duration} sec. status=${[status]}`, NS);

        if (broadcastMgmtPermitJoin) {
            // `authentication`: TC significance always 1 (zb specs)
            const zdoPayload = BuffaloZdo.buildPermitJoining(duration, 1, []);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            [status, apsFrame, messageTag] = await this.sendZDORequest(
                ZSpec.BroadcastAddress.DEFAULT,
                Zdo.ClusterId.PERMIT_JOINING_REQUEST,
                zdoPayload,
                DEFAULT_APS_OPTIONS,
            );
        }

        return [status, apsFrame, messageTag];
    }

    /**
     * Set the trust center policy bitmask using decision.
     * @param decision
     * @returns
     */
    private async emberSetJoinPolicy(decision: EmberJoinDecision): Promise<SLStatus> {
        let policy: number = EzspDecisionBitmask.DEFAULT_CONFIGURATION;

        if (decision == EmberJoinDecision.USE_PRECONFIGURED_KEY) {
            policy = EzspDecisionBitmask.ALLOW_JOINS | EzspDecisionBitmask.ALLOW_UNSECURED_REJOINS;
        } else if (decision == EmberJoinDecision.SEND_KEY_IN_THE_CLEAR) {
            policy = EzspDecisionBitmask.ALLOW_JOINS | EzspDecisionBitmask.ALLOW_UNSECURED_REJOINS | EzspDecisionBitmask.SEND_KEY_IN_CLEAR;
        } else if (decision == EmberJoinDecision.ALLOW_REJOINS_ONLY) {
            policy = EzspDecisionBitmask.ALLOW_UNSECURED_REJOINS;
        }

        return this.emberSetEzspPolicy(EzspPolicyId.TRUST_CENTER_POLICY, policy);
    }

    //---- END EZSP wrappers

    //---- START Ember ZDO

    /**
     * ZDO
     * Change the default radius for broadcast ZDO requests
     *
     * @param radius uint8_t The radius to be used for future ZDO request broadcasts.
     */
    private setZDORequestRadius(radius: number): void {
        this.zdoRequestRadius = radius;
    }

    /**
     * ZDO
     * Retrieve the default radius for broadcast ZDO requests
     *
     * @return uint8_t The radius to be used for future ZDO request broadcasts.
     */
    private getZDORequestRadius(): number {
        return this.zdoRequestRadius;
    }

    /**
     * ZDO
     * Get the next device request sequence number.
     *
     * Requests have sequence numbers so that they can be matched up with the
     * responses. To avoid complexities, the library uses numbers with the high
     * bit clear and the stack uses numbers with the high bit set.
     *
     * @return uint8_t The next device request sequence number
     */
    private nextZDORequestSequence(): number {
        return (this.zdoRequestSequence = ++this.zdoRequestSequence & APPLICATION_ZDO_SEQUENCE_MASK);
    }

    /**
     * ZDO
     *
     * @param destination
     * @param clusterId uint16_t
     * @param messageContents Content of the ZDO request (sequence to be assigned at index zero)
     * @param options
     * @returns status Indicates success or failure (with reason) of send
     * @returns apsFrame The APS Frame resulting of the request being built and sent (`sequence` set from stack-given value).
     * @returns messageTag The tag passed to ezspSend${x} function.
     */
    private async sendZDORequest(
        destination: NodeId,
        clusterId: number,
        messageContents: Buffer,
        options: EmberApsOption,
    ): Promise<[SLStatus, apsFrame: EmberApsFrame, messageTag: number]> {
        if (messageContents.length > EZSP_MAX_FRAME_LENGTH) {
            return [SLStatus.MESSAGE_TOO_LONG, null, null];
        }

        const messageTag = this.nextZDORequestSequence();
        messageContents[0] = messageTag;

        const apsFrame: EmberApsFrame = {
            profileId: Zdo.ZDO_PROFILE_ID,
            clusterId,
            sourceEndpoint: Zdo.ZDO_ENDPOINT,
            destinationEndpoint: Zdo.ZDO_ENDPOINT,
            options,
            groupId: 0,
            sequence: 0, // set by stack
        };

        if (
            destination === ZSpec.BroadcastAddress.DEFAULT ||
            destination === ZSpec.BroadcastAddress.RX_ON_WHEN_IDLE ||
            destination === ZSpec.BroadcastAddress.SLEEPY
        ) {
            logger.debug(
                `~~~> [ZDO ${Zdo.ClusterId[clusterId]} BROADCAST to=${destination} messageTag=${messageTag} ` +
                    `messageContents=${messageContents.toString('hex')}]`,
                NS,
            );
            const [status, apsSequence] = await this.ezsp.ezspSendBroadcast(
                ZSpec.NULL_NODE_ID, // alias
                destination,
                0, // nwkSequence
                apsFrame,
                this.getZDORequestRadius(),
                messageTag,
                messageContents,
            );
            apsFrame.sequence = apsSequence;

            logger.debug(`~~~> [SENT ZDO type=BROADCAST apsSequence=${apsSequence} messageTag=${messageTag} status=${SLStatus[status]}`, NS);
            return [status, apsFrame, messageTag];
        } else {
            logger.debug(
                `~~~> [ZDO ${Zdo.ClusterId[clusterId]} UNICAST to=${destination} messageTag=${messageTag} ` +
                    `messageContents=${messageContents.toString('hex')}]`,
                NS,
            );
            const [status, apsSequence] = await this.ezsp.ezspSendUnicast(
                EmberOutgoingMessageType.DIRECT,
                destination,
                apsFrame,
                messageTag,
                messageContents,
            );
            apsFrame.sequence = apsSequence;

            logger.debug(`~~~> [SENT ZDO type=DIRECT apsSequence=${apsSequence} messageTag=${messageTag} status=${SLStatus[status]}`, NS);
            return [status, apsFrame, messageTag];
        }
    }

    //---- END Ember ZDO

    //-- START Adapter implementation

    public static async isValidPath(path: string): Promise<boolean> {
        // For TCP paths we cannot get device information, therefore we cannot validate it.
        if (SocketPortUtils.isTcpPath(path)) {
            return false;
        }

        try {
            return SerialPortUtils.is(RealpathSync(path), autoDetectDefinitions);
        } catch (error) {
            logger.debug(`Failed to determine if path is valid: '${error}'`, NS);
            return false;
        }
    }

    public static async autoDetectPath(): Promise<string> {
        const paths = await SerialPortUtils.find(autoDetectDefinitions);
        paths.sort((a, b) => (a < b ? -1 : 1));
        return paths.length > 0 ? paths[0] : null;
    }

    public async start(): Promise<TsType.StartResult> {
        logger.info(`======== Ember Adapter Starting ========`, NS);
        this.initVariables();

        const result = await this.initEzsp();

        return result;
    }

    public async stop(): Promise<void> {
        this.requestQueue.stopDispatching();
        await this.ezsp.stop();

        this.initVariables();
        logger.info(`======== Ember Adapter Stopped ========`, NS);
    }

    // queued, non-InterPAN
    public async getCoordinator(): Promise<TsType.Coordinator> {
        return new Promise<TsType.Coordinator>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                // in all likelihood this will be retrieved from cache
                const ieeeAddr = await this.emberGetEui64();

                resolve({
                    ieeeAddr,
                    networkAddress: ZSpec.COORDINATOR_ADDRESS,
                    manufacturerID: DEFAULT_MANUFACTURER_CODE,
                    endpoints: FIXED_ENDPOINTS.map((ep) => {
                        return {
                            profileID: ep.profileId,
                            ID: ep.endpoint,
                            deviceID: ep.deviceId,
                            inputClusters: ep.inClusterList.slice(), // copy
                            outputClusters: ep.outClusterList.slice(), // copy
                        };
                    }),
                });

                return SLStatus.OK;
            }, reject);
        });
    }

    public async getCoordinatorVersion(): Promise<TsType.CoordinatorVersion> {
        return {type: `EmberZNet`, meta: this.version};
    }

    // queued
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async reset(type: 'soft' | 'hard'): Promise<void> {
        return Promise.reject(new Error('Not supported'));
        // NOTE: although this function is legacy atm, a couple of new untested EZSP functions that could also prove useful:
        // this.ezsp.ezspTokenFactoryReset(true/*excludeOutgoingFC*/, true/*excludeBootCounter*/);
        // this.ezsp.ezspResetNode()
    }

    public async supportsBackup(): Promise<boolean> {
        return true;
    }

    // queued
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async backup(ieeeAddressesInDatabase: string[]): Promise<Backup> {
        return new Promise<Backup>((resolve, reject): void => {
            this.requestQueue.enqueue(
                async (): Promise<SLStatus> => {
                    // grab fresh version here, bypass cache
                    const [netStatus, , netParams] = await this.ezsp.ezspGetNetworkParameters();

                    if (netStatus !== SLStatus.OK) {
                        logger.error(`[BACKUP] Failed to get network parameters with status=${SLStatus[netStatus]}.`, NS);
                        return netStatus;
                    }

                    // update cache
                    this.networkCache.parameters = netParams;
                    this.networkCache.eui64 = await this.ezsp.ezspGetEui64();

                    const [netKeyStatus, netKeyInfo] = await this.ezsp.ezspGetNetworkKeyInfo();

                    if (netKeyStatus !== SLStatus.OK) {
                        logger.error(`[BACKUP] Failed to get network keys info with status=${SLStatus[netKeyStatus]}.`, NS);
                        return netKeyStatus;
                    }

                    if (!netKeyInfo.networkKeySet) {
                        throw new Error(`[BACKUP] No network key set.`);
                    }

                    const keyList: LinkKeyBackupData[] = ALLOW_APP_KEY_REQUESTS ? await this.exportLinkKeys() : [];

                    let context: SecManContext = initSecurityManagerContext();
                    context.coreKeyType = SecManKeyType.TC_LINK;
                    const [tclkStatus, tcLinkKey] = await this.ezsp.ezspExportKey(context);

                    if (tclkStatus !== SLStatus.OK) {
                        throw new Error(`[BACKUP] Failed to export TC Link Key with status=${SLStatus[tclkStatus]}.`);
                    }

                    context = initSecurityManagerContext(); // make sure it's back to zeroes
                    context.coreKeyType = SecManKeyType.NETWORK;
                    context.keyIndex = 0;
                    const [nkStatus, networkKey] = await this.ezsp.ezspExportKey(context);

                    if (nkStatus !== SLStatus.OK) {
                        throw new Error(`[BACKUP] Failed to export Network Key with status=${SLStatus[nkStatus]}.`);
                    }

                    const zbChannels = Array.from(Array(EMBER_NUM_802_15_4_CHANNELS), (e, i) => i + EMBER_MIN_802_15_4_CHANNEL_NUMBER);

                    resolve({
                        networkOptions: {
                            panId: netParams.panId, // uint16_t
                            extendedPanId: Buffer.from(netParams.extendedPanId),
                            channelList: zbChannels.map((c: number) => ((2 ** c) & netParams.channels ? c : null)).filter((x) => x),
                            networkKey: networkKey.contents,
                            networkKeyDistribute: false,
                        },
                        logicalChannel: netParams.radioChannel,
                        networkKeyInfo: {
                            sequenceNumber: netKeyInfo.networkKeySequenceNumber,
                            frameCounter: netKeyInfo.networkKeyFrameCounter,
                        },
                        securityLevel: SECURITY_LEVEL_Z3,
                        networkUpdateId: netParams.nwkUpdateId,
                        coordinatorIeeeAddress: Buffer.from(this.networkCache.eui64.substring(2) /*take out 0x*/, 'hex').reverse(),
                        devices: keyList.map((key) => ({
                            networkAddress: null, // not used for restore, no reason to make NCP calls for nothing
                            ieeeAddress: Buffer.from(key.deviceEui64.substring(2) /*take out 0x*/, 'hex').reverse(),
                            isDirectChild: false, // not used
                            linkKey: {
                                key: key.key.contents,
                                rxCounter: key.incomingFrameCounter,
                                txCounter: key.outgoingFrameCounter,
                            },
                        })),
                        ezsp: {
                            version: this.version.ezsp,
                            hashed_tclk: tcLinkKey.contents,
                            // tokens: tokensBuf.toString('hex'),
                            // altNetworkKey: altNetworkKey.contents,
                        },
                    });

                    return SLStatus.OK;
                },
                reject,
                true /*prioritize*/,
            );
        });
    }

    // queued, non-InterPAN
    public async getNetworkParameters(): Promise<TsType.NetworkParameters> {
        return new Promise<TsType.NetworkParameters>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                // first call will cache for the others, but in all likelihood, it will all be from freshly cached after init
                // since Controller caches this also.
                const channel = await this.emberGetRadioChannel();
                const panID = await this.emberGetPanId();
                const extendedPanID = await this.emberGetExtendedPanId();

                resolve({
                    panID,
                    extendedPanID: parseInt(Buffer.from(extendedPanID).toString('hex'), 16),
                    channel,
                });

                return SLStatus.OK;
            }, reject);
        });
    }

    public async supportsChangeChannel(): Promise<boolean> {
        return true;
    }

    // queued
    public async changeChannel(newChannel: number): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                const zdoPayload = BuffaloZdo.buildChannelChangeRequest(newChannel, null);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, apsFrame, messageTag] = await this.sendZDORequest(
                    ZSpec.BroadcastAddress.SLEEPY,
                    Zdo.ClusterId.NWK_UPDATE_REQUEST,
                    zdoPayload,
                    DEFAULT_APS_OPTIONS,
                );

                if (status !== SLStatus.OK) {
                    logger.error(`[ZDO] Failed broadcast channel change to "${newChannel}" with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                await this.oneWaitress.startWaitingForEvent(
                    {eventName: OneWaitressEvents.STACK_STATUS_CHANNEL_CHANGED},
                    DEFAULT_NETWORK_REQUEST_TIMEOUT * 2, // observed to ~9sec
                    '[ZDO] Change Channel',
                );

                resolve();
                return SLStatus.OK;
            }, reject);
        });
    }

    // queued
    public async scanChannels(networkAddress: NodeId, channels: number[], duration: number, count: number): Promise<ZdoTypes.NwkUpdateResponse> {
        return new Promise<ZdoTypes.NwkUpdateResponse>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                const zdoPayload = BuffaloZdo.buildScanChannelsRequest(channels, duration, count);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, apsFrame, messageTag] = await this.sendZDORequest(
                    networkAddress,
                    Zdo.ClusterId.NWK_UPDATE_REQUEST,
                    zdoPayload,
                    DEFAULT_APS_OPTIONS,
                );

                if (status !== SLStatus.OK) {
                    logger.error(`[ZDO] Failed to scan channels '${channels}' on '${networkAddress} with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                const result = await this.oneWaitress.startWaitingFor<ZdoTypes.NwkUpdateResponse>(
                    {
                        target: networkAddress,
                        apsFrame,
                        responseClusterId: Zdo.ClusterId.NWK_UPDATE_RESPONSE,
                    },
                    DEFAULT_ZDO_REQUEST_TIMEOUT + (((2 ** duration + 1) * (16 * 960)) / 1000) * count * channels.length,
                ); // time for scan

                resolve(result);
                return SLStatus.OK;
            }, reject);
        });
    }

    // queued
    public async setTransmitPower(value: number): Promise<void> {
        if (typeof value !== 'number') {
            logger.error(`Tried to set transmit power to non-number. Value ${value} of type ${typeof value}.`, NS);
            return;
        }

        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                const status = await this.ezsp.ezspSetRadioPower(value);

                if (status !== SLStatus.OK) {
                    logger.error(`Failed to set transmit power to ${value} status=${SLStatus[status]}.`, NS);
                    return status;
                }

                resolve();
                return SLStatus.OK;
            }, reject);
        });
    }

    // queued
    public async addInstallCode(ieeeAddress: string, key: Buffer): Promise<void> {
        if (!key) {
            throw new Error(`[ADD INSTALL CODE] Failed for '${ieeeAddress}'; no code given.`);
        }

        // codes with CRC, check CRC before sending to NCP, otherwise let NCP handle
        if (EMBER_INSTALL_CODE_SIZES.indexOf(key.length) !== -1) {
            // Reverse the bits in a byte (uint8_t)
            const reverse = (b: number): number => {
                return (((((b * 0x0802) & 0x22110) | ((b * 0x8020) & 0x88440)) * 0x10101) >> 16) & 0xff;
            };
            let crc = 0xffff; // uint16_t

            // Compute the CRC and verify that it matches.
            // The bit reversals, byte swap, and ones' complement are due to differences between halCommonCrc16 and the Smart Energy version.
            for (let index = 0; index < key.length - EMBER_INSTALL_CODE_CRC_SIZE; index++) {
                crc = halCommonCrc16(reverse(key[index]), crc);
            }

            crc = ~highLowToInt(reverse(lowByte(crc)), reverse(highByte(crc))) & 0xffff;

            if (
                key[key.length - EMBER_INSTALL_CODE_CRC_SIZE] !== lowByte(crc) ||
                key[key.length - EMBER_INSTALL_CODE_CRC_SIZE + 1] !== highByte(crc)
            ) {
                throw new Error(`[ADD INSTALL CODE] Failed for '${ieeeAddress}'; invalid code CRC.`);
            } else {
                logger.debug(`[ADD INSTALL CODE] CRC validated for '${ieeeAddress}'.`, NS);
            }
        }

        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                // Compute the key from the install code and CRC.
                const [aesStatus, keyContents] = await this.emberAesHashSimple(key);

                if (aesStatus !== SLStatus.OK) {
                    logger.error(`[ADD INSTALL CODE] Failed AES hash for '${ieeeAddress}' with status=${SLStatus[aesStatus]}.`, NS);
                    return aesStatus;
                }

                // Add the key to the transient key table.
                // This will be used while the DUT joins.
                const impStatus = await this.ezsp.ezspImportTransientKey(ieeeAddress as EUI64, {contents: keyContents});

                if (impStatus == SLStatus.OK) {
                    logger.debug(`[ADD INSTALL CODE] Success for '${ieeeAddress}'.`, NS);
                } else {
                    logger.error(`[ADD INSTALL CODE] Failed for '${ieeeAddress}' with status=${SLStatus[impStatus]}.`, NS);
                    return SLStatus.FAIL;
                }

                resolve();
                return SLStatus.OK;
            }, reject);
        });
    }

    /** WARNING: Adapter impl. Starts timer immediately upon returning */
    public waitFor(
        networkAddress: number,
        endpoint: number,
        frameType: Zcl.FrameType,
        direction: Zcl.Direction,
        transactionSequenceNumber: number,
        clusterID: number,
        commandIdentifier: number,
        timeout: number,
    ): {promise: Promise<ZclPayload>; cancel: () => void} {
        const sourceEndpointInfo = FIXED_ENDPOINTS[0];
        const waiter = this.oneWaitress.waitFor<ZclPayload>(
            {
                target: networkAddress,
                apsFrame: {
                    clusterId: clusterID,
                    profileId: sourceEndpointInfo.profileId, // XXX: only used by OTA upstream
                    sequence: 0, // set by stack
                    sourceEndpoint: sourceEndpointInfo.endpoint,
                    destinationEndpoint: endpoint,
                    groupId: 0,
                    options: EmberApsOption.NONE,
                },
                zclSequence: transactionSequenceNumber,
                commandIdentifier,
            },
            timeout || DEFAULT_ZCL_REQUEST_TIMEOUT * 3,
        ); // XXX: since this is used by OTA...

        return {
            cancel: (): void => this.oneWaitress.remove(waiter.id),
            promise: waiter.start().promise,
        };
    }

    //---- ZDO

    // queued, non-InterPAN
    public async permitJoin(seconds: number, networkAddress: number): Promise<void> {
        const preJoining = async (): Promise<SLStatus> => {
            if (seconds) {
                const plaintextKey: SecManKey = {contents: Buffer.from(ZIGBEE_PROFILE_INTEROPERABILITY_LINK_KEY)};
                const impKeyStatus = await this.ezsp.ezspImportTransientKey(ZSpec.BLANK_EUI64, plaintextKey);

                if (impKeyStatus !== SLStatus.OK) {
                    logger.error(`[ZDO] Failed import transient key with status=${SLStatus[impKeyStatus]}.`, NS);
                    return SLStatus.FAIL;
                }

                const setJPstatus = await this.emberSetJoinPolicy(EmberJoinDecision.USE_PRECONFIGURED_KEY);

                if (setJPstatus !== SLStatus.OK) {
                    logger.error(`[ZDO] Failed set join policy with status=${SLStatus[setJPstatus]}.`, NS);
                    return SLStatus.FAIL;
                }

                return SLStatus.OK;
            } else {
                if (this.manufacturerCode !== DEFAULT_MANUFACTURER_CODE) {
                    logger.debug(`[WORKAROUND] Reverting coordinator manufacturer code to default.`, NS);
                    await this.ezsp.ezspSetManufacturerCode(DEFAULT_MANUFACTURER_CODE);

                    this.manufacturerCode = DEFAULT_MANUFACTURER_CODE;
                }

                await this.ezsp.ezspClearTransientLinkKeys();

                const setJPstatus = await this.emberSetJoinPolicy(EmberJoinDecision.ALLOW_REJOINS_ONLY);

                if (setJPstatus !== SLStatus.OK) {
                    logger.error(`[ZDO] Failed set join policy for with status=${SLStatus[setJPstatus]}.`, NS);
                    return SLStatus.FAIL;
                }

                return SLStatus.OK;
            }
        };

        if (networkAddress) {
            // specific device that is not `Coordinator`
            return new Promise<void>((resolve, reject): void => {
                this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                    this.checkInterpanLock();

                    const pjStatus = await preJoining();

                    if (pjStatus !== SLStatus.OK) {
                        logger.error(`[ZDO] Failed pre joining request for "${networkAddress}" with status=${SLStatus[pjStatus]}.`, NS);
                        return pjStatus;
                    }

                    // `authentication`: TC significance always 1 (zb specs)
                    const zdoPayload = BuffaloZdo.buildPermitJoining(seconds, 1, []);
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [status, apsFrame, messageTag] = await this.sendZDORequest(
                        networkAddress,
                        Zdo.ClusterId.PERMIT_JOINING_REQUEST,
                        zdoPayload,
                        DEFAULT_APS_OPTIONS, // XXX: SDK has 0 here?
                    );

                    if (status !== SLStatus.OK) {
                        logger.error(`[ZDO] Failed permit joining request for "${networkAddress}" with status=${SLStatus[status]}.`, NS);
                        return status;
                    }

                    await this.oneWaitress.startWaitingFor<void>(
                        {
                            target: networkAddress,
                            apsFrame,
                            responseClusterId: Zdo.ClusterId.PERMIT_JOINING_RESPONSE,
                        },
                        DEFAULT_ZDO_REQUEST_TIMEOUT,
                    );

                    resolve();
                    return SLStatus.OK;
                }, reject);
            });
        } else {
            // coordinator-only, or all
            return new Promise<void>((resolve, reject): void => {
                this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                    this.checkInterpanLock();

                    const pjStatus = await preJoining();

                    if (pjStatus !== SLStatus.OK) {
                        logger.error(`[ZDO] Failed pre joining request for "${networkAddress}" with status=${SLStatus[pjStatus]}.`, NS);
                        return pjStatus;
                    }

                    // local permit join if `Coordinator`-only requested, else local + broadcast
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [status, apsFrame, messageTag] = await this.emberPermitJoining(
                        seconds,
                        networkAddress === ZSpec.COORDINATOR_ADDRESS ? false : true,
                    );

                    if (status !== SLStatus.OK) {
                        logger.error(`[ZDO] Failed permit joining request with status=${SLStatus[status]}.`, NS);
                        return status;
                    }

                    // NOTE: because Z2M is refreshing the permit join duration early to prevent it from closing
                    //       (every 200sec, even if only opened for 254sec), we can't wait for the stack opened status,
                    //       as it won't trigger again if already opened... so instead we assume it worked
                    // NOTE2: with EZSP, 255=forever, and 254=max, but since upstream logic uses fixed 254 with interval refresh,
                    //        we can't simply bypass upstream calls if called for "forever" to prevent useless NCP calls (3-4 each time),
                    //        until called with 0 (disable), since we don't know if it was requested for forever or not...
                    // TLDR: upstream logic change required to allow this
                    // if (seconds) {
                    //     await this.oneWaitress.startWaitingForEvent(
                    //         {eventName: OneWaitressEvents.STACK_STATUS_NETWORK_OPENED},
                    //         DEFAULT_ZCL_REQUEST_TIMEOUT,
                    //         '[ZDO] Permit Joining',
                    //     );
                    // } else {
                    //     // NOTE: CLOSED stack status is not triggered if the network was not OPENED in the first place, so don't wait for it
                    //     //       same kind of problem as described above (upstream always tries to close after start, but EZSP already is)
                    // }

                    resolve();
                    return SLStatus.OK;
                }, reject);
            });
        }
    }

    // queued, non-InterPAN
    public async lqi(networkAddress: number): Promise<TsType.LQI> {
        const neighbors: TsType.LQINeighbor[] = [];

        const request = async (startIndex: number): Promise<[SLStatus, tableEntries: number, entryCount: number]> => {
            const zdoPayload = BuffaloZdo.buildLqiTableRequest(startIndex);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [status, apsFrame, messageTag] = await this.sendZDORequest(
                networkAddress,
                Zdo.ClusterId.LQI_TABLE_REQUEST,
                zdoPayload,
                DEFAULT_APS_OPTIONS,
            );

            if (status !== SLStatus.OK) {
                logger.error(`[ZDO] Failed LQI request for "${networkAddress}" (index "${startIndex}") with status=${SLStatus[status]}.`, NS);
                return [status, null, null];
            }

            const result = await this.oneWaitress.startWaitingFor<ZdoTypes.LQITableResponse>(
                {
                    target: networkAddress,
                    apsFrame,
                    responseClusterId: Zdo.ClusterId.LQI_TABLE_RESPONSE,
                },
                DEFAULT_ZDO_REQUEST_TIMEOUT,
            );

            for (const entry of result.entryList) {
                neighbors.push({
                    ieeeAddr: entry.eui64,
                    networkAddress: entry.nwkAddress,
                    linkquality: entry.lqi,
                    relationship: entry.relationship,
                    depth: entry.depth,
                });
            }

            return [SLStatus.OK, result.neighborTableEntries, result.entryList.length];
        };

        return new Promise<TsType.LQI>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                let [status, tableEntries, entryCount] = await request(0);

                if (status !== SLStatus.OK) {
                    return status;
                }

                const size = tableEntries;
                let nextStartIndex = entryCount;

                while (neighbors.length < size) {
                    [status, tableEntries, entryCount] = await request(nextStartIndex);

                    if (status !== SLStatus.OK) {
                        return status;
                    }

                    nextStartIndex += entryCount;
                }

                resolve({neighbors});
                return status;
            }, reject);
        });
    }

    // queued, non-InterPAN
    public async routingTable(networkAddress: number): Promise<TsType.RoutingTable> {
        const table: TsType.RoutingTableEntry[] = [];

        const request = async (startIndex: number): Promise<[SLStatus, tableEntries: number, entryCount: number]> => {
            const zdoPayload = BuffaloZdo.buildRoutingTableRequest(startIndex);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [status, apsFrame, messageTag] = await this.sendZDORequest(
                networkAddress,
                Zdo.ClusterId.ROUTING_TABLE_REQUEST,
                zdoPayload,
                DEFAULT_APS_OPTIONS,
            );

            if (status !== SLStatus.OK) {
                logger.error(
                    `[ZDO] Failed routing table request for "${networkAddress}" (index "${startIndex}") with status=${SLStatus[status]}.`,
                    NS,
                );
                return [status, null, null];
            }

            const result = await this.oneWaitress.startWaitingFor<ZdoTypes.RoutingTableResponse>(
                {
                    target: networkAddress,
                    apsFrame,
                    responseClusterId: Zdo.ClusterId.ROUTING_TABLE_RESPONSE,
                },
                DEFAULT_ZDO_REQUEST_TIMEOUT,
            );

            for (const entry of result.entryList) {
                table.push({
                    destinationAddress: entry.destinationAddress,
                    status: RoutingTableStatus[entry.status], // get str value from enum to satisfy upstream's needs
                    nextHop: entry.nextHopAddress,
                });
            }

            return [SLStatus.OK, result.routingTableEntries, result.entryList.length];
        };

        return new Promise<TsType.RoutingTable>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                let [status, tableEntries, entryCount] = await request(0);

                if (status !== SLStatus.OK) {
                    return status;
                }

                const size = tableEntries;
                let nextStartIndex = entryCount;

                while (table.length < size) {
                    [status, tableEntries, entryCount] = await request(nextStartIndex);

                    if (status !== SLStatus.OK) {
                        return status;
                    }

                    nextStartIndex += entryCount;
                }

                resolve({table});
                return SLStatus.OK;
            }, reject);
        });
    }

    // queued, non-InterPAN
    public async nodeDescriptor(networkAddress: number): Promise<TsType.NodeDescriptor> {
        return new Promise<TsType.NodeDescriptor>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                const zdoPayload = BuffaloZdo.buildNodeDescriptorRequest(networkAddress);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, apsFrame, messageTag] = await this.sendZDORequest(
                    networkAddress,
                    Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST,
                    zdoPayload,
                    DEFAULT_APS_OPTIONS,
                );

                if (status !== SLStatus.OK) {
                    logger.error(`[ZDO] Failed node descriptor for "${networkAddress}" with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                const result = await this.oneWaitress.startWaitingFor<ZdoTypes.NodeDescriptorResponse>(
                    {
                        target: networkAddress,
                        apsFrame,
                        responseClusterId: Zdo.ClusterId.NODE_DESCRIPTOR_RESPONSE,
                    },
                    DEFAULT_ZDO_REQUEST_TIMEOUT,
                );

                let type: TsType.DeviceType = 'Unknown';

                switch (result.logicalType) {
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

                // always 0 before rev. 21 where field was added
                if (result.serverMask.stackComplianceResivion < CURRENT_ZIGBEE_SPEC_REVISION) {
                    logger.warning(
                        `[ZDO] Node descriptor for '${networkAddress}' reports device is only compliant to revision ` +
                            `'${result.serverMask.stackComplianceResivion < 21 ? 'pre-21' : result.serverMask.stackComplianceResivion}' ` +
                            `of the ZigBee specification (current revision: ${CURRENT_ZIGBEE_SPEC_REVISION}).`,
                        NS,
                    );
                }

                resolve({type, manufacturerCode: result.manufacturerCode});

                return SLStatus.OK;
            }, reject);
        });
    }

    // queued, non-InterPAN
    public async activeEndpoints(networkAddress: number): Promise<TsType.ActiveEndpoints> {
        return new Promise<TsType.ActiveEndpoints>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                const zdoPayload = BuffaloZdo.buildActiveEndpointsRequest(networkAddress);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, apsFrame, messageTag] = await this.sendZDORequest(
                    networkAddress,
                    Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST,
                    zdoPayload,
                    DEFAULT_APS_OPTIONS,
                );

                if (status !== SLStatus.OK) {
                    logger.error(`[ZDO] Failed active endpoints request for "${networkAddress}" with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                const result = await this.oneWaitress.startWaitingFor<ZdoTypes.ActiveEndpointsResponse>(
                    {
                        target: networkAddress,
                        apsFrame,
                        responseClusterId: Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE,
                    },
                    DEFAULT_ZDO_REQUEST_TIMEOUT,
                );

                resolve({endpoints: result.endpointList});

                return SLStatus.OK;
            }, reject);
        });
    }

    // queued, non-InterPAN
    public async simpleDescriptor(networkAddress: number, endpointID: number): Promise<TsType.SimpleDescriptor> {
        return new Promise<TsType.SimpleDescriptor>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                const zdoPayload = BuffaloZdo.buildSimpleDescriptorRequest(networkAddress, endpointID);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, apsFrame, messageTag] = await this.sendZDORequest(
                    networkAddress,
                    Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST,
                    zdoPayload,
                    DEFAULT_APS_OPTIONS,
                );

                if (status !== SLStatus.OK) {
                    logger.error(
                        `[ZDO] Failed simple descriptor request for "${networkAddress}" endpoint "${endpointID}" ` +
                            `with status=${SLStatus[status]}.`,
                        NS,
                    );
                    return status;
                }

                const result = await this.oneWaitress.startWaitingFor<ZdoTypes.SimpleDescriptorResponse>(
                    {
                        target: networkAddress,
                        apsFrame,
                        responseClusterId: Zdo.ClusterId.SIMPLE_DESCRIPTOR_RESPONSE,
                    },
                    DEFAULT_ZDO_REQUEST_TIMEOUT,
                );

                resolve({
                    profileID: result.profileId,
                    endpointID: result.endpoint,
                    deviceID: result.deviceId,
                    inputClusters: result.inClusterList,
                    outputClusters: result.outClusterList,
                });

                return SLStatus.OK;
            }, reject);
        });
    }

    // queued, non-InterPAN
    public async bind(
        destinationNetworkAddress: number,
        sourceIeeeAddress: string,
        sourceEndpoint: number,
        clusterID: number,
        destinationAddressOrGroup: string | number,
        type: 'endpoint' | 'group',
        destinationEndpoint?: number,
    ): Promise<void> {
        if (typeof destinationAddressOrGroup === 'string' && type === 'endpoint') {
            // dest address is EUI64 (str), so type should always be endpoint (unicast)
            return new Promise<void>((resolve, reject): void => {
                this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                    this.checkInterpanLock();

                    const zdoPayload = BuffaloZdo.buildBindRequest(
                        sourceIeeeAddress as EUI64,
                        sourceEndpoint,
                        clusterID,
                        Zdo.UNICAST_BINDING,
                        destinationAddressOrGroup as EUI64,
                        undefined, // not used with UNICAST_BINDING
                        destinationEndpoint,
                    );
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [status, apsFrame, messageTag] = await this.sendZDORequest(
                        destinationNetworkAddress,
                        Zdo.ClusterId.BIND_REQUEST,
                        zdoPayload,
                        DEFAULT_APS_OPTIONS,
                    );

                    if (status !== SLStatus.OK) {
                        logger.error(
                            `[ZDO] Failed bind request for "${destinationNetworkAddress}" destination "${destinationAddressOrGroup}" ` +
                                `endpoint "${destinationEndpoint}" with status=${SLStatus[status]}.`,
                            NS,
                        );
                        return status;
                    }

                    await this.oneWaitress.startWaitingFor<void>(
                        {
                            target: destinationNetworkAddress,
                            apsFrame,
                            responseClusterId: Zdo.ClusterId.BIND_RESPONSE,
                        },
                        DEFAULT_ZDO_REQUEST_TIMEOUT,
                    );

                    resolve();
                    return SLStatus.OK;
                }, reject);
            });
        } else if (typeof destinationAddressOrGroup === 'number' && type === 'group') {
            // dest is group num, so type should always be group (multicast)
            return new Promise<void>((resolve, reject): void => {
                this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                    this.checkInterpanLock();

                    const zdoPayload = BuffaloZdo.buildBindRequest(
                        sourceIeeeAddress as EUI64,
                        sourceEndpoint,
                        clusterID,
                        Zdo.MULTICAST_BINDING,
                        undefined, // not used with MULTICAST_BINDING
                        destinationAddressOrGroup,
                        undefined, // not used with MULTICAST_BINDING
                    );
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [status, apsFrame, messageTag] = await this.sendZDORequest(
                        destinationNetworkAddress,
                        Zdo.ClusterId.BIND_REQUEST,
                        zdoPayload,
                        DEFAULT_APS_OPTIONS,
                    );

                    if (status !== SLStatus.OK) {
                        logger.error(
                            `[ZDO] Failed bind request for "${destinationNetworkAddress}" group "${destinationAddressOrGroup}" ` +
                                `with status=${SLStatus[status]}.`,
                            NS,
                        );
                        return status;
                    }

                    await this.oneWaitress.startWaitingFor<void>(
                        {
                            target: destinationNetworkAddress,
                            apsFrame,
                            responseClusterId: Zdo.ClusterId.BIND_RESPONSE,
                        },
                        DEFAULT_ZDO_REQUEST_TIMEOUT,
                    );

                    resolve();

                    return SLStatus.OK;
                }, reject);
            });
        }
    }

    // queued, non-InterPAN
    public async unbind(
        destinationNetworkAddress: number,
        sourceIeeeAddress: string,
        sourceEndpoint: number,
        clusterID: number,
        destinationAddressOrGroup: string | number,
        type: 'endpoint' | 'group',
        destinationEndpoint: number,
    ): Promise<void> {
        if (typeof destinationAddressOrGroup === 'string' && type === 'endpoint') {
            // dest address is EUI64 (str), so type should always be endpoint (unicast)
            return new Promise<void>((resolve, reject): void => {
                this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                    this.checkInterpanLock();

                    const zdoPayload = BuffaloZdo.buildUnbindRequest(
                        sourceIeeeAddress as EUI64,
                        sourceEndpoint,
                        clusterID,
                        Zdo.UNICAST_BINDING,
                        destinationAddressOrGroup as EUI64,
                        undefined, // not used with UNICAST_BINDING
                        destinationEndpoint,
                    );
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [status, apsFrame, messageTag] = await this.sendZDORequest(
                        destinationNetworkAddress,
                        Zdo.ClusterId.UNBIND_REQUEST,
                        zdoPayload,
                        DEFAULT_APS_OPTIONS,
                    );

                    if (status !== SLStatus.OK) {
                        logger.error(
                            `[ZDO] Failed unbind request for "${destinationNetworkAddress}" destination "${destinationAddressOrGroup}" ` +
                                `endpoint "${destinationEndpoint}" with status=${SLStatus[status]}.`,
                            NS,
                        );
                        return status;
                    }

                    await this.oneWaitress.startWaitingFor<void>(
                        {
                            target: destinationNetworkAddress,
                            apsFrame,
                            responseClusterId: Zdo.ClusterId.UNBIND_RESPONSE,
                        },
                        DEFAULT_ZDO_REQUEST_TIMEOUT,
                    );

                    resolve();

                    return SLStatus.OK;
                }, reject);
            });
        } else if (typeof destinationAddressOrGroup === 'number' && type === 'group') {
            // dest is group num, so type should always be group (multicast)
            return new Promise<void>((resolve, reject): void => {
                this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                    this.checkInterpanLock();

                    const zdoPayload = BuffaloZdo.buildUnbindRequest(
                        sourceIeeeAddress as EUI64,
                        sourceEndpoint,
                        clusterID,
                        Zdo.MULTICAST_BINDING,
                        undefined, // not used with MULTICAST_BINDING
                        destinationAddressOrGroup,
                        undefined, // not used with MULTICAST_BINDING
                    );
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const [status, apsFrame, messageTag] = await this.sendZDORequest(
                        destinationNetworkAddress,
                        Zdo.ClusterId.UNBIND_REQUEST,
                        zdoPayload,
                        DEFAULT_APS_OPTIONS,
                    );

                    if (status !== SLStatus.OK) {
                        logger.error(
                            `[ZDO] Failed unbind request for "${destinationNetworkAddress}" group "${destinationAddressOrGroup}" ` +
                                `with status=${SLStatus[status]}.`,
                            NS,
                        );
                        return status;
                    }

                    await this.oneWaitress.startWaitingFor<void>(
                        {
                            target: destinationNetworkAddress,
                            apsFrame,
                            responseClusterId: Zdo.ClusterId.UNBIND_RESPONSE,
                        },
                        DEFAULT_ZDO_REQUEST_TIMEOUT,
                    );

                    resolve();

                    return SLStatus.OK;
                }, reject);
            });
        }
    }

    // queued, non-InterPAN
    public async removeDevice(networkAddress: number, ieeeAddr: string): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                const zdoPayload = BuffaloZdo.buildLeaveRequest(ieeeAddr as EUI64, Zdo.LeaveRequestFlags.WITHOUT_REJOIN);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, apsFrame, messageTag] = await this.sendZDORequest(
                    networkAddress,
                    Zdo.ClusterId.LEAVE_REQUEST,
                    zdoPayload,
                    DEFAULT_APS_OPTIONS,
                );

                if (status !== SLStatus.OK) {
                    logger.error(
                        `[ZDO] Failed remove device request for "${networkAddress}" target "${ieeeAddr}" ` + `with status=${SLStatus[status]}.`,
                        NS,
                    );
                    return status;
                }

                await this.oneWaitress.startWaitingFor<void>(
                    {
                        target: networkAddress,
                        apsFrame,
                        responseClusterId: Zdo.ClusterId.LEAVE_RESPONSE,
                    },
                    DEFAULT_ZDO_REQUEST_TIMEOUT,
                );

                resolve();

                return SLStatus.OK;
            }, reject);
        });
    }

    //---- ZCL

    // queued, non-InterPAN
    public async sendZclFrameToEndpoint(
        ieeeAddr: string,
        networkAddress: number,
        endpoint: number,
        zclFrame: Zcl.Frame,
        timeout: number,
        disableResponse: boolean,
        disableRecovery: boolean,
        sourceEndpoint?: number,
    ): Promise<ZclPayload> {
        const sourceEndpointInfo =
            typeof sourceEndpoint === 'number' ? FIXED_ENDPOINTS.find((epi) => epi.endpoint === sourceEndpoint) : FIXED_ENDPOINTS[0];
        const command = zclFrame.command;
        let commandResponseId: number = null;

        if (command.hasOwnProperty('response') && disableResponse === false) {
            commandResponseId = command.response;
        } else if (!zclFrame.header.frameControl.disableDefaultResponse) {
            commandResponseId = Zcl.Foundation.defaultRsp.ID;
        }

        const apsFrame: EmberApsFrame = {
            profileId: sourceEndpointInfo.profileId,
            clusterId: zclFrame.cluster.ID,
            sourceEndpoint: sourceEndpointInfo.endpoint,
            destinationEndpoint: typeof endpoint === 'number' ? endpoint : FIXED_ENDPOINTS[0].endpoint,
            options: DEFAULT_APS_OPTIONS,
            groupId: 0,
            sequence: 0, // set by stack
        };

        // don't RETRY if no response expected
        if (commandResponseId == null) {
            apsFrame.options &= ~EmberApsOption.RETRY;
        }

        const data = zclFrame.toBuffer();

        return new Promise<ZclPayload>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                logger.debug(`~~~> [ZCL to=${networkAddress} apsFrame=${JSON.stringify(apsFrame)} header=${JSON.stringify(zclFrame.header)}]`, NS);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, messageTag] = await this.ezsp.send(
                    EmberOutgoingMessageType.DIRECT,
                    networkAddress,
                    apsFrame,
                    data,
                    0, // alias
                    0, // alias seq
                );

                if (status !== SLStatus.OK) {
                    logger.error(`~x~> [ZCL to=${networkAddress}] Failed to send request with status=${SLStatus[status]}.`, NS);
                    return status; // let queue handle retry based on status
                }

                if (commandResponseId != null) {
                    // NOTE: aps sequence number will have been set by send function
                    const result = await this.oneWaitress.startWaitingFor<ZclPayload>(
                        {
                            target: networkAddress,
                            apsFrame,
                            zclSequence: zclFrame.header.transactionSequenceNumber,
                            commandIdentifier: commandResponseId,
                        },
                        timeout || DEFAULT_ZCL_REQUEST_TIMEOUT,
                    );

                    resolve(result);
                } else {
                    resolve(null); // don't expect a response
                    return SLStatus.OK;
                }
            }, reject);
        });
    }

    // queued, non-InterPAN
    public async sendZclFrameToGroup(groupID: number, zclFrame: Zcl.Frame, sourceEndpoint?: number): Promise<void> {
        const sourceEndpointInfo =
            typeof sourceEndpoint === 'number' ? FIXED_ENDPOINTS.find((epi) => epi.endpoint === sourceEndpoint) : FIXED_ENDPOINTS[0];
        const apsFrame: EmberApsFrame = {
            profileId: sourceEndpointInfo.profileId,
            clusterId: zclFrame.cluster.ID,
            sourceEndpoint: sourceEndpointInfo.endpoint,
            destinationEndpoint: FIXED_ENDPOINTS[0].endpoint,
            options: DEFAULT_APS_OPTIONS,
            groupId: groupID,
            sequence: 0, // set by stack
        };
        const data = zclFrame.toBuffer();

        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                logger.debug(`~~~> [ZCL GROUP apsFrame=${JSON.stringify(apsFrame)} header=${JSON.stringify(zclFrame.header)}]`, NS);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, messageTag] = await this.ezsp.send(
                    EmberOutgoingMessageType.MULTICAST,
                    apsFrame.groupId, // not used with MULTICAST
                    apsFrame,
                    data,
                    0, // alias
                    0, // alias seq
                );

                if (status !== SLStatus.OK) {
                    logger.error(`~x~> [ZCL GROUP] Failed to send with status=${SLStatus[status]}.`, NS);
                    return status; // let queue handle retry based on status
                }

                // NOTE: since ezspMessageSentHandler could take a while here, we don't block, it'll just be logged if the delivery failed

                resolve();
                return SLStatus.OK;
            }, reject);
        });
    }

    // queued, non-InterPAN
    public async sendZclFrameToAll(
        endpoint: number,
        zclFrame: Zcl.Frame,
        sourceEndpoint: number,
        destination: ZSpec.BroadcastAddress,
    ): Promise<void> {
        const sourceEndpointInfo =
            typeof sourceEndpoint === 'number' ? FIXED_ENDPOINTS.find((epi) => epi.endpoint === sourceEndpoint) : FIXED_ENDPOINTS[0];
        const apsFrame: EmberApsFrame = {
            profileId: sourceEndpointInfo.profileId,
            clusterId: zclFrame.cluster.ID,
            sourceEndpoint: sourceEndpointInfo.endpoint,
            destinationEndpoint: typeof endpoint === 'number' ? endpoint : FIXED_ENDPOINTS[0].endpoint,
            options: DEFAULT_APS_OPTIONS,
            groupId: destination,
            sequence: 0, // set by stack
        };
        const data = zclFrame.toBuffer();

        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.checkInterpanLock();

                logger.debug(`~~~> [ZCL BROADCAST apsFrame=${JSON.stringify(apsFrame)} header=${JSON.stringify(zclFrame.header)}]`, NS);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [status, messageTag] = await this.ezsp.send(
                    EmberOutgoingMessageType.BROADCAST,
                    destination,
                    apsFrame,
                    data,
                    0, // alias
                    0, // alias seq
                );

                if (status !== SLStatus.OK) {
                    logger.error(`~x~> [ZCL BROADCAST] Failed to send with status=${SLStatus[status]}.`, NS);
                    return status; // let queue handle retry based on status
                }

                // NOTE: since ezspMessageSentHandler could take a while here, we don't block, it'll just be logged if the delivery failed

                resolve();
                return SLStatus.OK;
            }, reject);
        });
    }

    //---- InterPAN for Touchlink
    // XXX: There might be a better way to handle touchlink with ZLL ezsp functions, but I don't have any device to test so, didn't look into it...
    // TODO: check all this touchlink/interpan stuff

    // queued
    public async setChannelInterPAN(channel: number): Promise<void> {
        if (typeof channel !== 'number') {
            logger.error(`Tried to set channel InterPAN to non-number. Channel ${channel} of type ${typeof channel}.`, NS);
            return;
        }

        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                this.interpanLock = true;
                const status = await this.ezsp.ezspSetLogicalAndRadioChannel(channel);

                if (status !== SLStatus.OK) {
                    this.interpanLock = false; // XXX: ok?
                    logger.error(`Failed to set InterPAN channel to ${channel} with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                resolve();
                return status;
            }, reject);
        });
    }

    // queued
    public async sendZclFrameInterPANToIeeeAddr(zclFrame: Zcl.Frame, ieeeAddress: string): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                const msgBuffalo = new EzspBuffalo(Buffer.alloc(MAXIMUM_INTERPAN_LENGTH));

                // cache-enabled getters
                const sourcePanId = await this.emberGetPanId();
                const sourceEui64 = await this.emberGetEui64();

                msgBuffalo.writeUInt16(LONG_DEST_FRAME_CONTROL | MAC_ACK_REQUIRED); // macFrameControl
                msgBuffalo.writeUInt8(0); // sequence Skip Sequence number, stack sets the sequence number.
                msgBuffalo.writeUInt16(ZSpec.INVALID_PAN_ID); // destPanId
                msgBuffalo.writeIeeeAddr(ieeeAddress); // destAddress (longAddress)
                msgBuffalo.writeUInt16(sourcePanId); // sourcePanId
                msgBuffalo.writeIeeeAddr(sourceEui64); // sourceAddress
                msgBuffalo.writeUInt16(STUB_NWK_FRAME_CONTROL); // nwkFrameControl
                msgBuffalo.writeUInt8(EmberInterpanMessageType.UNICAST | INTERPAN_APS_FRAME_TYPE); // apsFrameControl
                msgBuffalo.writeUInt16(zclFrame.cluster.ID);
                msgBuffalo.writeUInt16(ZSpec.TOUCHLINK_PROFILE_ID);

                logger.debug(`~~~> [ZCL TOUCHLINK to=${ieeeAddress} header=${JSON.stringify(zclFrame.header)}]`, NS);
                const status = await this.ezsp.ezspSendRawMessage(
                    Buffer.concat([msgBuffalo.getWritten(), zclFrame.toBuffer()]),
                    EmberTransmitPriority.NORMAL,
                    true,
                );

                if (status !== SLStatus.OK) {
                    logger.error(`~x~> [ZCL TOUCHLINK to=${ieeeAddress}] Failed to send with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                // NOTE: can use ezspRawTransmitCompleteHandler if needed here

                resolve();
                return status;
            }, reject);
        });
    }

    // queued
    public async sendZclFrameInterPANBroadcast(zclFrame: Zcl.Frame, timeout: number): Promise<ZclPayload> {
        const command = zclFrame.command;

        if (!command.hasOwnProperty('response')) {
            throw new Error(`Command '${command.name}' has no response, cannot wait for response.`);
        }

        // just for waitress
        const apsFrame: EmberApsFrame = {
            profileId: ZSpec.TOUCHLINK_PROFILE_ID,
            clusterId: zclFrame.cluster.ID,
            sourceEndpoint: 0,
            destinationEndpoint: 0,
            options: EmberApsOption.NONE,
            groupId: ZSpec.BroadcastAddress.SLEEPY,
            sequence: 0, // set by stack
        };

        return new Promise<ZclPayload>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                const msgBuffalo = new EzspBuffalo(Buffer.alloc(MAXIMUM_INTERPAN_LENGTH));

                // cache-enabled getters
                const sourcePanId = await this.emberGetPanId();
                const sourceEui64 = await this.emberGetEui64();

                msgBuffalo.writeUInt16(SHORT_DEST_FRAME_CONTROL); // macFrameControl
                msgBuffalo.writeUInt8(0); // sequence Skip Sequence number, stack sets the sequence number.
                msgBuffalo.writeUInt16(ZSpec.INVALID_PAN_ID); // destPanId
                msgBuffalo.writeUInt16(apsFrame.groupId); // destAddress (longAddress)
                msgBuffalo.writeUInt16(sourcePanId); // sourcePanId
                msgBuffalo.writeIeeeAddr(sourceEui64); // sourceAddress
                msgBuffalo.writeUInt16(STUB_NWK_FRAME_CONTROL); // nwkFrameControl
                msgBuffalo.writeUInt8(EmberInterpanMessageType.BROADCAST | INTERPAN_APS_FRAME_TYPE); // apsFrameControl
                msgBuffalo.writeUInt16(apsFrame.clusterId);
                msgBuffalo.writeUInt16(apsFrame.profileId);

                const data = Buffer.concat([msgBuffalo.getWritten(), zclFrame.toBuffer()]);

                logger.debug(`~~~> [ZCL TOUCHLINK BROADCAST header=${JSON.stringify(zclFrame.header)}]`, NS);
                const status = await this.ezsp.ezspSendRawMessage(data, EmberTransmitPriority.NORMAL, true);

                if (status !== SLStatus.OK) {
                    logger.error(`~x~> [ZCL TOUCHLINK BROADCAST] Failed to send with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                // NOTE: can use ezspRawTransmitCompleteHandler if needed here

                const result = await this.oneWaitress.startWaitingFor<ZclPayload>(
                    {
                        target: null,
                        apsFrame: apsFrame,
                        zclSequence: zclFrame.header.transactionSequenceNumber,
                        commandIdentifier: command.response,
                    },
                    timeout || DEFAULT_ZCL_REQUEST_TIMEOUT * 2,
                ); // XXX: touchlink timeout?

                resolve(result);

                return SLStatus.OK;
            }, reject);
        });
    }

    // queued
    public async restoreChannelInterPAN(): Promise<void> {
        return new Promise<void>((resolve, reject): void => {
            this.requestQueue.enqueue(async (): Promise<SLStatus> => {
                const status = await this.ezsp.ezspSetLogicalAndRadioChannel(this.networkOptions.channelList[0]);

                if (status !== SLStatus.OK) {
                    logger.error(`Failed to restore InterPAN channel to ${this.networkOptions.channelList[0]} with status=${SLStatus[status]}.`, NS);
                    return status;
                }

                // let adapter settle down
                await Wait(3000);

                this.interpanLock = false;

                resolve();
                return status;
            }, reject);
        });
    }

    //-- END Adapter implementation

    private checkInterpanLock(): void {
        if (this.interpanLock) {
            logger.error(`[INTERPAN MODE] Cannot execute non-InterPAN commands.`, NS);

            // will be caught by request queue and rejected internally.
            throw new EzspError(EzspStatus.ERROR_INVALID_CALL);
        }
    }
}
