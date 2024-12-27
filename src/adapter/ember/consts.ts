//-------------------------------------------------------------------------------------------------
// General

/** Serves to initialize cache for config IDs */
export const INVALID_CONFIG_VALUE = 0xffff;
/** Serves to initialize cache */
export const INVALID_RADIO_CHANNEL = 0xff;
/**
 * A distinguished network ID that will never be assigned to any node.
 * This value is returned when getting the remote node ID from the binding table and the given binding table index refers
 * to a multicast binding entry.
 */
export const EMBER_MULTICAST_NODE_ID = 0xfffe;
/**
 * A distinguished network ID that will never be assigned
 * to any node.  This value is used when getting the remote node ID
 * from the address or binding tables.  It indicates that the address
 * or binding table entry is currently in use but the node ID
 * corresponding to the EUI64 in the table is currently unknown.
 */
export const EMBER_UNKNOWN_NODE_ID = 0xfffd;
/**
 * A distinguished network ID that will never be assigned
 * to any node.  This value is used when getting the remote node ID
 * from the address or binding tables.  It indicates that the address
 * or binding table entry is currently in use and network address
 * discovery is underway.
 */
export const EMBER_DISCOVERY_ACTIVE_NODE_ID = 0xfffc;
/** A distinguished address table index used to indicate the absence of an address table entry. */
export const EMBER_NULL_ADDRESS_TABLE_INDEX = 0xff;
/** Invalidates cached information */
export const SOURCE_ROUTE_OVERHEAD_UNKNOWN = 0xff;

//-------------------------------------------------------------------------------------------------
// Network

// From table 3.51 of 053474r14
// When sending many-to-one route requests, the following
// addresses are used
// 0xFFF9 indicates a non-memory-constrained many-to-one route request
// 0xFFF8 indicates a memory-constrained many-to-one route request
export const EMBER_MIN_BROADCAST_ADDRESS = 0xfff8;

/**
 * The additional overhead required for network source routing (relay count = 1, relay index = 1).
 * This does not include the size of the relay list itself.
 */
export const NWK_SOURCE_ROUTE_OVERHEAD = 2;
export const SOURCE_ROUTING_RESERVED_PAYLOAD_LENGTH = 0;
/**
 * The maximum APS payload, not including any APS options.
 * This value is also available from emberMaximumApsPayloadLength() or ezspMaximumPayloadLength().
 * See http://portal.ember.com/faq/payload for more information.
 */
export const MAXIMUM_APS_PAYLOAD_LENGTH = 82 - SOURCE_ROUTING_RESERVED_PAYLOAD_LENGTH;
// export const MAXIMUM_APS_PAYLOAD_LENGTH_SECURITY_NONE = (100 - SOURCE_ROUTING_RESERVED_PAYLOAD_LENGTH);
/** The additional overhead required for APS encryption (security = 5, MIC = 4). */
export const APS_ENCRYPTION_OVERHEAD = 9;
/** The additional overhead required for APS fragmentation. */
export const APS_FRAGMENTATION_OVERHEAD = 2;

/** An inactive concentrator. */
export const EMBER_INACTIVE_CONCENTRATOR = 0xffff;
/**
 * A concentrator with insufficient memory to store source routes for the entire network.
 * Route records are sent to the concentrator prior to every inbound APS unicast.
 */
export const EMBER_LOW_RAM_CONCENTRATOR = 0xfff8;
/**
 * A concentrator with sufficient memory to store source routes for the entire network.
 * Remote nodes stop sending route records once the concentrator has successfully received one.
 */
export const EMBER_HIGH_RAM_CONCENTRATOR = 0xfff9;

//-------------------------------------------------------------------------------------------------
// Security

/** The short address of the trust center. This address never changes dynamically. */
export const EMBER_TRUST_CENTER_NODE_ID = 0x0000;

/**
 * Default value for context's PSA algorithm permission (CCM* with 4 byte tag).
 * Only used by NCPs with secure key storage; define is mirrored here to allow
 * host code to initialize the context itself rather than needing a new EZSP frame.
 */
export const ZB_PSA_ALG = 0x05440100;

export const STACK_PROFILE_ZIGBEE_PRO = 0x02;
export const SECURITY_LEVEL_Z3 = 0x05;

/** This key is "ZigBeeAlliance09" */
export const ZIGBEE_PROFILE_INTEROPERABILITY_LINK_KEY: readonly number[] = [
    0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c, 0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39,
];

//-------------------------------------------------------------------------------------------------
// Zigbee Green Power types and defines.

/** Number of GP sink list entries. Minimum is 2 sink list entries. */
export const GP_SINK_LIST_ENTRIES = 2;
/** The size of the SinkList entries in sink table in format of octet string that has a format of {<1 byte length>, <n bytes for sink groups>} */
export const GP_SIZE_OF_SINK_LIST_ENTRIES_OCTET_STRING = 1 + GP_SINK_LIST_ENTRIES * 4; // sizeof(EmberGpSinkGroup) === uint16_t * 2

//-------------------------------------------------------------------------------------------------
//-- InterPAN

// Max PHY size = 128
//   -1 byte for PHY length
//   -2 bytes for MAC CRC
export const MAXIMUM_INTERPAN_LENGTH = 125;

// MAC frame control
// Bits:
// | 0-2   |   3      |    4    |  5  |  6    |   7-9    | 10-11 |  12-13   | 14-15 |
// | Frame | Security |  Frame  | Ack | Intra | Reserved | Dest. | Reserved | Src   |
// | Type  | Enabled  | Pending | Req | PAN   |          | Addr. |          | Adrr. |
// |       |          |         |     |       |          | Mode  |          | Mode  |

// Frame Type
//   000       = Beacon
//   001       = Data
//   010       = Acknwoledgement
//   011       = MAC Command
//   100 - 111 = Reserved

// Addressing Mode
//   00 - PAN ID and address field are not present
//   01 - Reserved
//   10 - Address field contains a 16-bit short address
//   11 - Address field contains a 64-bit extended address

const MAC_FRAME_TYPE_DATA = 0x0001;
// const MAC_FRAME_SOURCE_MODE_SHORT      = 0x8000;
const MAC_FRAME_SOURCE_MODE_LONG = 0xc000;
const MAC_FRAME_DESTINATION_MODE_SHORT = 0x0800;
const MAC_FRAME_DESTINATION_MODE_LONG = 0x0c00;

// The two possible incoming MAC frame controls.
// Using short source address is not allowed.
export const SHORT_DEST_FRAME_CONTROL = MAC_FRAME_TYPE_DATA | MAC_FRAME_DESTINATION_MODE_SHORT | MAC_FRAME_SOURCE_MODE_LONG;
export const LONG_DEST_FRAME_CONTROL = MAC_FRAME_TYPE_DATA | MAC_FRAME_DESTINATION_MODE_LONG | MAC_FRAME_SOURCE_MODE_LONG;

export const MAC_ACK_REQUIRED = 0x0020;

/** NWK stub frame has two control bytes. */
export const STUB_NWK_SIZE = 2;
export const STUB_NWK_FRAME_CONTROL = 0x000b;

/**
 * Interpan APS Unicast, same for Broadcast.
 * - Frame Control   (1-byte)
 * - Cluster ID      (2-bytes)
 * - Profile ID      (2-bytes)
 */
export const INTERPAN_APS_UNICAST_BROADCAST_SIZE = 5;
/**
 * Interpan APS Multicast
 * - Frame Control   (1-byte)
 * - Group ID        (2-bytes)
 * - Cluster ID      (2-bytes)
 * - Profile ID      (2-bytes)
 */
export const INTERPAN_APS_MULTICAST_SIZE = 7;

export const MAX_STUB_APS_SIZE = INTERPAN_APS_MULTICAST_SIZE;
export const MIN_STUB_APS_SIZE = INTERPAN_APS_UNICAST_BROADCAST_SIZE;

export const INTERPAN_APS_FRAME_TYPE = 0x03;
export const INTERPAN_APS_FRAME_TYPE_MASK = 0x03;

/** The only allowed APS FC value (without the delivery mode subfield) */
export const INTERPAN_APS_FRAME_CONTROL_NO_DELIVERY_MODE = INTERPAN_APS_FRAME_TYPE;

export const INTERPAN_APS_FRAME_DELIVERY_MODE_MASK = 0x0c;
export const INTERPAN_APS_FRAME_SECURITY = 0x20;

export const MANUFACTURING_STRING_SIZE = 16;
