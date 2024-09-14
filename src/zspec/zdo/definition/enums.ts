export enum LeaveRequestFlags {
    /** Leave and rejoin. */
    AND_REJOIN = 0x80,
    /** DEPRECATED */
    // AND_REMOVE_CHILDREN = 0x40,
    /** Leave. */
    WITHOUT_REJOIN = 0x00,
}

export enum JoiningPolicy {
    /** Any device is allowed to join. */
    ALL_JOIN = 0x00,
    /** Only devices on the mibJoiningIeeeList are allowed to join. */
    IEEELIST_JOIN = 0x01,
    /** No device is allowed to join. */
    NO_JOIN = 0x02,
}

//-------------------------------------------------------------------------------------------------
//-- TLVs

export enum SelectedKeyNegotiationProtocol {
    /** (Zigbee 3.0 Mechanism) */
    RESERVED = 0,
    /** SPEKE using Curve25519 with Hash AES-MMO-128 */
    SPEKE_CURVE25519_AESMMO128 = 1,
    /**  SPEKE using Curve25519 with Hash SHA-256 */
    SPEKE_CURVE25519_SHA256 = 2,
    // 3 – 255 Reserved
}

export enum SelectedPreSharedSecret {
    /** Symmetric Authentication Token */
    SYMMETRIC_AUTHENTICATION_TOKEN = 0,
    /** Pre-configured link-ley derived from installation code */
    PRECONFIGURED_LINKKEY_DERIVED_FROM_INSTALL_CODE = 1,
    /** Variable-length pass code (for PAKE protocols) */
    PAKE_VARIABLE_LENGTH_PASS_CODE = 2,
    /** Basic Authorization Key */
    BASIC_AUTHORIZATION_KEY = 3,
    /** Administrative Authorization Key */
    ADMIN_AUTHORIZATION_KEY = 4,
    // 5 – 254 Reserved,
    /** Anonymous Well-Known Secret */
    ANONYMOUS_WELLKNOWN_SECRET = 255,
}

export enum InitialJoinMethod {
    ANONYMOUS = 0x00,
    INSTALL_CODE_KEY = 0x01,
    WELLKNOWN_PASSPHRASE = 0x02,
    INSTALL_CODE_PASSPHRASE = 0x03,
}

export enum ActiveLinkKeyType {
    NOT_UPDATED = 0x00,
    KEY_REQUEST_METHOD = 0x01,
    UNAUTHENTICATED_KEY_NEGOTIATION = 0x02,
    AUTHENTICATED_KEY_NEGOTIATION = 0x03,
    APPLICATION_DEFINED_CERTIFICATE_BASED_MUTUAL_AUTHENTICATION = 0x04,
}

export enum GlobalTLV {
    /** Minimum Length 2-byte */
    MANUFACTURER_SPECIFIC = 64,
    /** Minimum Length 2-byte */
    SUPPORTED_KEY_NEGOTIATION_METHODS = 65,
    /** Minimum Length 4-byte XXX: spec min doesn't make sense, this is one pan id => 2-byte??? */
    PAN_ID_CONFLICT_REPORT = 66,
    /** Minimum Length 2-byte */
    NEXT_PAN_ID_CHANGE = 67,
    /** Minimum Length 4-byte */
    NEXT_CHANNEL_CHANGE = 68,
    /** Minimum Length 16-byte */
    SYMMETRIC_PASSPHRASE = 69,
    /** Minimum Length 2-byte */
    ROUTER_INFORMATION = 70,
    /** Minimum Length 2-byte */
    FRAGMENTATION_PARAMETERS = 71,
    JOINER_ENCAPSULATION = 72,
    BEACON_APPENDIX_ENCAPSULATION = 73,
    // Reserved = 74,
    /** Minimum Length 2-byte XXX: min not in spec??? */
    CONFIGURATION_PARAMETERS = 75,
    /** Refer to the Zigbee Direct specification for more details. */
    DEVICE_CAPABILITY_EXTENSION = 76,
    // Reserved = 77-255
}

export enum RoutingTableStatus {
    ACTIVE = 0x0,
    DISCOVERY_UNDERWAY = 0x1,
    DISCOVERY_FAILED = 0x2,
    INACTIVE = 0x3,
    VALIDATION_UNDERWAY = 0x4,
    RESERVED1 = 0x5,
    RESERVED2 = 0x6,
    RESERVED3 = 0x7,
}
