import {ExtendedPanId} from "./tstypes";

/** Current supported Zigbee revision: https://csa-iot.org/wp-content/uploads/2023/04/05-3474-23-csg-zigbee-specification-compressed.pdf */
export const ZIGBEE_REVISION = 23;

/** The network ID of the coordinator in a ZigBee network is 0x0000. */
export const COORDINATOR_ADDRESS = 0x0000;

/** Endpoint profile ID for Zigbee 3.0. "Home Automation" */
export const HA_PROFILE_ID = 0x0104;
/** Endpoint profile ID for Smart Energy */
export const SE_PROFILE_ID = 0x0109;
/** Endpoint profile ID for Green Power */
export const GP_PROFILE_ID = 0xA1E0;
/** The touchlink (ZigBee Light Link/ZLL) Profile ID. */
export const TOUCHLINK_PROFILE_ID = 0xC05E;
/** The profile ID used to address all the public profiles. */
export const WILDCARD_PROFILE_ID = 0xFFFF;

/** The default HA endpoint. */
export const HA_ENDPOINT = 0x01;
/** The GP endpoint, as defined in the ZigBee spec. */
export const GP_ENDPOINT = 0xF2;

/** The maximum 802.15.4 channel number is 26. */
export const MAX_802_15_4_CHANNEL_NUMBER = 26;
/** The minimum 2.4GHz 802.15.4 channel number is 11. */
export const MIN_802_15_4_CHANNEL_NUMBER = 11;
/** There are sixteen 802.15.4 channels. */
export const NUM_802_15_4_CHANNELS = (MAX_802_15_4_CHANNEL_NUMBER - MIN_802_15_4_CHANNEL_NUMBER + 1);
/** A bitmask to scan all 2.4 GHz 802.15.4 channels. */
export const ALL_802_15_4_CHANNELS_MASK = 0x07FFF800;
/** A bitmask of the preferred 2.4 GHz 802.15.4 channels to scan. */
export const PREFERRED_802_15_4_CHANNELS_MASK = 0x0318C800;
/** List of all Zigbee channels */
export const ALL_802_15_4_CHANNELS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
/** List of preferred Zigbee channels */
export const PREFERRED_802_15_4_CHANNELS = [11, 14, 15, 19, 20, 24, 25];

/** A blank (also used as "wildcard") EUI64 hex string prefixed with 0x */
export const BLANK_EUI64 = "0xFFFFFFFFFFFFFFFF";
/** A blank extended PAN ID. (null/not present) */
export const BLANK_EXTENDED_PAN_ID: Readonly<ExtendedPanId> = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

/** An invalid profile ID. This is a reserved profileId. */
export const INVALID_PROFILE_ID = 0xFFFF;
/** An invalid cluster ID. */
export const INVALID_CLUSTER_ID = 0xFFFF;
/** An invalid PAN ID. */
export const INVALID_PAN_ID = 0xFFFF;

/** A distinguished network ID that will never be assigned to any node. It is used to indicate the absence of a node ID. */
export const NULL_NODE_ID = 0xFFFF;
/** A distinguished binding index used to indicate the absence of a binding. */
export const NULL_BINDING = 0xFF;

/** This key is "ZigBeeAlliance09" */
export const INTEROPERABILITY_LINK_KEY: readonly number[] = [
    0x5A, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6C, 0x6C, 0x69, 0x61, 0x6E, 0x63, 0x65, 0x30, 0x39
];

export const PERMIT_JOIN_FOREVER = 0xFF;
export const PERMIT_JOIN_MAX_TIMEOUT = 0xFE;

/** Size of EUI64 (an IEEE address) in bytes. */
export const EUI64_SIZE = 8;
/** Size of an PAN identifier in bytes. */
export const PAN_ID_SIZE = 2;
/** Size of an extended PAN identifier in bytes. */
export const EXTENDED_PAN_ID_SIZE = 8;
/** Size of an encryption key in bytes. */
export const DEFAULT_ENCRYPTION_KEY_SIZE = 16;
