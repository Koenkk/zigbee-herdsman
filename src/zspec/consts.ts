import {ExtendedPanId} from './tstypes';

/** Current supported Zigbee revision: https://csa-iot.org/wp-content/uploads/2023/04/05-3474-23-csg-zigbee-specification-compressed.pdf */
export const ZIGBEE_REVISION = 23;

/** The network ID of the coordinator in a ZigBee network is 0x0000. */
export const COORDINATOR_ADDRESS = 0x0000;

/** Endpoint profile ID for Zigbee 3.0. "Home Automation" */
export const HA_PROFILE_ID = 0x0104;
/** Endpoint profile ID for Smart Energy */
export const SE_PROFILE_ID = 0x0109;
/** Endpoint profile ID for Green Power */
export const GP_PROFILE_ID = 0xa1e0;
/** The touchlink (ZigBee Light Link/ZLL) Profile ID. */
export const TOUCHLINK_PROFILE_ID = 0xc05e;
/** The profile ID used to address all the public profiles. */
export const WILDCARD_PROFILE_ID = 0xffff;

/** The default HA endpoint. */
export const HA_ENDPOINT = 0x01;
/** The GP endpoint, as defined in the ZigBee spec. */
export const GP_ENDPOINT = 0xf2;

export const GP_GROUP_ID = 0x0b84;

/** The maximum 802.15.4 channel number is 26. */
export const MAX_802_15_4_CHANNEL_NUMBER = 26;
/** The minimum 2.4GHz 802.15.4 channel number is 11. */
export const MIN_802_15_4_CHANNEL_NUMBER = 11;
/** There are sixteen 802.15.4 channels. */
export const NUM_802_15_4_CHANNELS = MAX_802_15_4_CHANNEL_NUMBER - MIN_802_15_4_CHANNEL_NUMBER + 1;
/** A bitmask to scan all 2.4 GHz 802.15.4 channels. */
export const ALL_802_15_4_CHANNELS_MASK = 0x07fff800;
/** A bitmask of the preferred 2.4 GHz 802.15.4 channels to scan. */
export const PREFERRED_802_15_4_CHANNELS_MASK = 0x0318c800;
/** List of all Zigbee channels */
export const ALL_802_15_4_CHANNELS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
/** List of preferred Zigbee channels */
export const PREFERRED_802_15_4_CHANNELS = [11, 14, 15, 19, 20, 24, 25];

/** A blank (also used as "wildcard") EUI64 hex string prefixed with 0x */
export const BLANK_EUI64 = '0xFFFFFFFFFFFFFFFF';
/** A blank extended PAN ID. (null/not present) */
export const BLANK_EXTENDED_PAN_ID: Readonly<ExtendedPanId> = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

/** An invalid profile ID. This is a reserved profileId. */
export const INVALID_PROFILE_ID = 0xffff;
/** An invalid cluster ID. */
export const INVALID_CLUSTER_ID = 0xffff;
/** An invalid PAN ID. */
export const INVALID_PAN_ID = 0xffff;

/** A distinguished network ID that will never be assigned to any node. It is used to indicate the absence of a node ID. */
export const NULL_NODE_ID = 0xffff;
/** A distinguished binding index used to indicate the absence of a binding. */
export const NULL_BINDING = 0xff;

/** This key is "ZigBeeAlliance09" */
export const INTEROPERABILITY_LINK_KEY: readonly number[] = [
    0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39,
];

export const PERMIT_JOIN_FOREVER = 0xff;
export const PERMIT_JOIN_MAX_TIMEOUT = 0xfe;

/** Size of EUI64 (an IEEE address) in bytes. */
export const EUI64_SIZE = 8;
/** Size of an PAN identifier in bytes. */
export const PAN_ID_SIZE = 2;
/** Size of an extended PAN identifier in bytes. */
export const EXTENDED_PAN_ID_SIZE = 8;
/** Size of an encryption key in bytes. */
export const DEFAULT_ENCRYPTION_KEY_SIZE = 16;
/** Size of a AES-128-MMO (Matyas-Meyer-Oseas) block in bytes. */
export const AES_MMO_128_BLOCK_SIZE = 16;
/**
 * Valid install code sizes, including `INSTALL_CODE_CRC_SIZE`.
 *
 * NOTE: 18 is now standard, first for iterations, order after is important (8 before 10)!
 */
export const INSTALL_CODE_SIZES: ReadonlyArray<number> = [18, 8, 10, 14];
/** Size of the CRC appended to install codes. */
export const INSTALL_CODE_CRC_SIZE = 2;
