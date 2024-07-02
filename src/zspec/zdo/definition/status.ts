/**
 * ZDO response status.
 *
 * Most responses to ZDO commands contain a status byte.
 * The meaning of this byte is defined by the ZigBee Device Profile.
 *
 * Zigbee Document – 05-3474-23 - Table 2-129. ZDP Enumerations Description
 *
 * uint8_t
 */
export enum Status {
    /** The requested operation or transmission was completed successfully. */
    SUCCESS = 0x00,
    // 0x01 – 0x7F are reserved
    /** The supplied request type was invalid. */
    INV_REQUESTTYPE = 0x80,
    /** The requested device did not exist on a device following a child descriptor request to a parent. */
    DEVICE_NOT_FOUND = 0x81,
    /** The supplied endpoint was equal to 0x00 or 0xff. */
    INVALID_EP = 0x82,
    /** The requested endpoint is not described by a simple descriptor. */
    NOT_ACTIVE = 0x83,
    /** The requested optional feature is not supported on the target device. */
    NOT_SUPPORTED = 0x84,
    /** A timeout has occurred with the requested operation. */
    TIMEOUT = 0x85,
    /** failure to match any suitable clusters. */
    NO_MATCH = 0x86,
    // 0x87 is reserved        = 0x87,
    /** The unbind request was unsuccessful due to the coordinator or source device not having an entry in its binding table to unbind. */
    NO_ENTRY = 0x88,
    /** A child descriptor was not available following a discovery request to a parent. */
    NO_DESCRIPTOR = 0x89,
    /** The device does not have storage space to support the requested operation. */
    INSUFFICIENT_SPACE = 0x8a,
    /** The device is not in the proper state to support the requested operation. */
    NOT_PERMITTED = 0x8b,
    /** The device does not have table space to support the operation. */
    TABLE_FULL = 0x8c,
    /** The device has rejected the command due to security restrictions. */
    NOT_AUTHORIZED = 0x8d,
    /** The device does not have binding table space to support the operation. */
    DEVICE_BINDING_TABLE_FULL = 0x8e,
    /** The index in the received command is out of bounds. */
    INVALID_INDEX = 0x8f,
    /** The response was too large to fit in a single unfragmented message. */
    FRAME_TOO_LARGE = 0x90,
    /** The requested Key Negotiation Method was not accepted. */
    BAD_KEY_NEGOTIATION_METHOD = 0x91,
    /** The request encountered a temporary failure but a retry at a later time should be attempted and may succeed. */
    TEMPORARY_FAILURE = 0x92,
    // 0x92 – 0xff are reserved

    //-- NWK layer statuses included because some like TLV-related are used as ZDO status

    /** An invalid or out-of-range parameter has been passed to a primitive from the next higher layer. */
    NWK_LAYER_INVALID_PARAMETER = 0xc1,
    /** The next higher layer has issued a request that is invalid or cannot be executed given the current state of the NWK layer. */
    NWK_LAYER_INV_REQUESTTYPE = 0xc2,
    /** An NLME-JOIN.request has been disallowed. */
    NWK_LAYER_NOT_PERMITTED = 0xc3,
    /** An NLME-NETWORK-FORMATION.request has failed to start a network. */
    NWK_LAYER_STARTUP_FAILURE = 0xc4,
    /**
     * A device with the address supplied to the NLME-ADDNEIGHBOR. request is already present in the neighbor table of the device
     * on which the NLME-ADD-NEIGHBOR.request was issued.
     */
    NWK_LAYER_ALREADY_PRESENT = 0xc5,
    /** Used to indicate that an NLME-SYNC.request has failed at the MAC layer. */
    NWK_LAYER_SYNC_FAILURE = 0xc6,
    /** An NLME-JOIN-DIRECTLY.request has failed because there is no more room in the neighbor table. */
    NWK_LAYER_NEIGHBOR_TABLE_FULL = 0xc7,
    /** An NLME-LEAVE.request has failed because the device addressed in the parameter list is not in the neighbor table of the issuing device. */
    NWK_LAYER_UNKNOWN_DEVICE = 0xc8,
    /** An NLME-GET.request or NLME-SET.request has been issued with an unknown attribute identifier. */
    NWK_LAYER_UNSUPPORTED_ATTRIBUTE = 0xc9,
    /** An NLME-JOIN.request has been issued in an environment where no networks are detectable. */
    NWK_LAYER_NO_NETWORKS = 0xca,
    // Reserved 0xcb Reserved for future use.
    /** Security processing has been attempted on an outgoing frame, and has failed because the frame counter has reached its maximum value. */
    NWK_LAYER_MAX_FRM_COUNTER = 0xcc,
    /** Security processing has been attempted on an outgoing frame, and has failed because no key was available with which to process it. */
    NWK_LAYER_NO_KEY = 0xcd,
    /** Security processing has been attempted on an outgoing frame, and has failed because the security engine produced erroneous output. */
    NWK_LAYER_BAD_CCM_OUTPUT = 0xce,
    /** Reserved for future use. */
    NWK_LAYER_Reserved = 0xcf,
    /** An attempt to discover a route has failed due to a reason other than a lack of routing capacity. */
    NWK_LAYER_ROUTE_DISCOVERY_FAILED = 0xd0,
    /**
     * An NLDE-DATA.request has failed due to a routing failure on the sending device or an NLME-ROUTE-DISCOVERY.request has failed due to
     * the cause cited in the accompanying NetworkStatusCode.
     */
    NWK_LAYER_ROUTE_ERROR = 0xd1,
    /** An attempt to send a broadcast frame has failed because there is no room in the BTT. */
    NWK_LAYER_BT_TABLE_FULL = 0xd2,
    /** An NLDE-DATA.request has failed due to insufficient buffering available. */
    NWK_LAYER_FRAME_NOT_BUFFERED = 0xd3,
    /** An attempt was made to use a MAC Interface with a state that is currently set to FALSE (disabled) or that is unknown to the stack.. */
    NWK_LAYER_INVALID_INTERFACE = 0xd5,
    /** A required TLV for processing the request was not present. */
    NWK_LAYER_MISSING_TLV = 0xd6,
    /** A TLV was malformed or missing relevant information. */
    NWK_LAYER_INVALID_TLV = 0xd7,
}
