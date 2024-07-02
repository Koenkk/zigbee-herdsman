/**
 * EUI 64-bit ID (IEEE 802.15.4 long address). uint8[EUI64_SIZE]
 *
 * NOTE: Expected to contain `0x` prefix
 */
export type EUI64 = `0x${string}`;
/** IEEE 802.15.4 node ID. Also known as short address. uint16 */
export type NodeId = number;
/** IEEE 802.15.4 PAN ID. uint16 */
export type PanId = number;
/** PAN 64-bit ID (IEEE 802.15.4 long address). uint8[EXTENDED_PAN_ID_SIZE] */
export type ExtendedPanId = number[];
/** 16-bit ZigBee multicast group identifier. uint16 */
export type MulticastId = number;
/** Refer to the Zigbee application profile ID. uint16 */
export type ProfileId = number;
/** Refer to the ZCL cluster ID. uint16 */
export type ClusterId = number;
