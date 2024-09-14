/**
 * Defines for ZigBee device profile cluster IDs follow.
 * These include descriptions of the formats of the messages.
 *
 * Note that each message starts with a 1-byte transaction sequence number.
 * This sequence number is used to match a response command frame to the request frame that it is replying to.
 * The application shall maintain a 1-byte counter that is copied into this field and incremented by one for each command sent.
 * When a value of 0xff is reached, the next command shall re-start the counter with a value of 0x00.
 *
 * The Device Profile describes devices in one of two configurations:
 * - Client: A client issues requests to the server via Device Profile messages.
 * - Server: A server issues responses to the client that initiated the Device Profile message.
 *
 * Restricted Mode (`apsZdoRestrictedMode`) is a mode where a device will conditionally accept specific ZDO commands,
 * depending on the restricted criteria, source address, and encryption policy of the incoming command.
 * If a command is accepted, it is subject to normal command processing.
 * The acceptance criteria is explain further below:
 * 1. If the command is marked as “Yes” in the Restricted Command column, do the following:
 *   - a. If `apsZdoRestrictedMode` in the AIB is set to FALSE, the command is not restricted.
 *     - i. Go to Step 2.
 *   - b. If the sender is the Trust Center AND has APS encryption, the command is not restricted.
 *     - i. Go to Step 2.
 *   - c. Otherwise, the command SHALL NOT be processed. The receiver SHALL do the following:
 *     - i. If the command was broadcast, no error is generated.
 *       - No more processing is done.
 *     - ii. If the command was unicast, generate an error message. Create the corresponding ZDO Response frame with a status of NOT_AUTHORIZED.
 *       - No more processing is done.
 * 2. Continue processing the command normally.
 */
export enum ClusterId {
    //-------------------------------------------------------------------------------------------------
    //-- Device and Service Discovery Client Services

    /**
     * Request: [transaction sequence number: 1]
     *          [EUI64:8] [request type:1] [start index:1]
     *          [request type] = 0x00 single address response, ignore the start index
     *                         = 0x01 extended response, sends kid's IDs as well
     */
    NETWORK_ADDRESS_REQUEST = 0x0000,
    /**
     * Response: [transaction sequence number: 1]
     *           [status:1] [EUI64:8] [node ID:2]
     *           [assoc dev count:1] [start index:1] [assoc dev list:2]*
     */
    NETWORK_ADDRESS_RESPONSE = 0x8000,

    /**
     * Request:    [transaction sequence number: 1]
     *             [node ID:2] [request type:1] [start index:1]
     *             [request type] = 0x00 single address response, ignore the start index
     *                            = 0x01 extended response, sends kid's IDs as well
     */
    IEEE_ADDRESS_REQUEST = 0x0001,
    /**
     * Response: [transaction sequence number: 1]
     *           [status:1] [EUI64:8] [node ID:2]
     *           [assoc dev count:1] [start index:1] [assoc dev list:2]*
     */
    IEEE_ADDRESS_RESPONSE = 0x8001,

    /**
     * Request:  [transaction sequence number: 1] [node ID:2] [tlvs: varies]
     */
    NODE_DESCRIPTOR_REQUEST = 0x0002,
    /**
     * Response: [transaction sequence number: 1] [status:1] [node ID:2]
     *           [node descriptor: 13] [tlvs: varies]
     *
     * Node Descriptor field is divided into subfields of bitmasks as follows:
     *     (Note: All lengths below are given in bits rather than bytes.)
     *           Logical Type:                     3
     *           Complex Descriptor Available:     1
     *           User Descriptor Available:        1
     *           (reserved/unused):                3
     *           APS Flags:                        3
     *           Frequency Band:                   5
     *           MAC capability flags:             8
     *           Manufacturer Code:               16
     *           Maximum buffer size:              8
     *           Maximum incoming transfer size:  16
     *           Server mask:                     16
     *           Maximum outgoing transfer size:  16
     *           Descriptor Capability Flags:      8
     *    See ZigBee document 053474, Section 2.3.2.3 for more details.
     */
    NODE_DESCRIPTOR_RESPONSE = 0x8002,

    /**
     * Request:  [transaction sequence number: 1] [node ID:2]
     */
    POWER_DESCRIPTOR_REQUEST = 0x0003,
    /**
     * Response: [transaction sequence number: 1] [status:1] [node ID:2]
     *           [current power mode, available power sources:1]
     *           [current power source, current power source level:1]
     *     See ZigBee document 053474, Section 2.3.2.4 for more details.
     */
    POWER_DESCRIPTOR_RESPONSE = 0x8003,

    /**
     * Request:  [transaction sequence number: 1]
     *           [node ID:2] [endpoint:1]
     */
    SIMPLE_DESCRIPTOR_REQUEST = 0x0004,
    /**
     * Response: [transaction sequence number: 1]
     *           [status:1] [node ID:2] [length:1] [endpoint:1]
     *           [app profile ID:2] [app device ID:2]
     *           [app device version, app flags:1]
     *           [input cluster count:1] [input cluster:2]*
     *           [output cluster count:1] [output cluster:2]*
     */
    SIMPLE_DESCRIPTOR_RESPONSE = 0x8004,

    /**
     * Request:  [transaction sequence number: 1] [node ID:2]
     */
    ACTIVE_ENDPOINTS_REQUEST = 0x0005,
    /**
     * Response: [transaction sequence number: 1]
     *           [status:1] [node ID:2] [endpoint count:1] [endpoint:1]*
     */
    ACTIVE_ENDPOINTS_RESPONSE = 0x8005,

    /**
     * Request:  [transaction sequence number: 1]
     *           [node ID:2] [app profile ID:2]
     *           [input cluster count:1] [input cluster:2]*
     *           [output cluster count:1] [output cluster:2]*
     */
    MATCH_DESCRIPTORS_REQUEST = 0x0006,
    /**
     * Response: [transaction sequence number: 1]
     *           [status:1] [node ID:2] [endpoint count:1] [endpoint:1]*
     */
    MATCH_DESCRIPTORS_RESPONSE = 0x8006,

    /** DEPRECATED */
    // COMPLEX_DESCRIPTOR_REQUEST = 0x0010,
    /** DEPRECATED */
    // COMPLEX_DESCRIPTOR_RESPONSE = 0x8010,
    /** DEPRECATED */
    // USER_DESCRIPTOR_REQUEST = 0x0011,
    /** DEPRECATED */
    // USER_DESCRIPTOR_RESPONSE = 0x8011,
    /** DEPRECATED */
    // DISCOVERY_REGISTER_REQUEST = 0x0012,
    /** DEPRECATED */
    // DISCOVERY_REGISTER_RESPONSE = 0x8012,

    /**
     * Request: [transaction sequence number: 1]
     *          [node ID:2] [EUI64:8] [capabilities:1]
     */
    END_DEVICE_ANNOUNCE = 0x0013,

    /** DEPRECATED */
    // USER_DESCRIPTOR_SET = 0x0014,
    /** DEPRECATED */
    // USER_DESCRIPTOR_CONFIRM = 0x8014,

    /**
     * This is broadcast and only servers which have matching services respond.
     *
     * Request:  [transaction sequence number: 1] [server mask:2]
     */
    SYSTEM_SERVER_DISCOVERY_REQUEST = 0x0015,
    /**
     * The response contains the request services that the recipient provides.
     *
     * Response: [transaction sequence number: 1]
     *           [status (== EMBER_ZDP_SUCCESS):1] [server mask:2]
     */
    SYSTEM_SERVER_DISCOVERY_RESPONSE = 0x8015,

    /** DEPRECATED */
    // DISCOVERY_STORE_REQUEST = 0x0016,
    /** DEPRECATED */
    // DISCOVERY_STORE_RESPONSE = 0x8016,
    /** DEPRECATED */
    // NODE_DESCRIPTOR_STORE_REQUEST = 0x0017,
    /** DEPRECATED */
    // NODE_DESCRIPTOR_STORE_RESPONSE = 0x8017,
    /** DEPRECATED */
    // POWER_DESCRIPTOR_STORE_REQUEST = 0x0018,
    /** DEPRECATED */
    // POWER_DESCRIPTOR_STORE_RESPONSE = 0x8018,
    /** DEPRECATED */
    // ACTIVE_ENDPOINTS_STORE_REQUEST = 0x0019,
    /** DEPRECATED */
    // ACTIVE_ENDPOINTS_STORE_RESPONSE = 0x8019,
    /** DEPRECATED */
    // SIMPLE_DESCRIPTOR_STORE_REQUEST = 0x001A,
    /** DEPRECATED */
    // SIMPLE_DESCRIPTOR_STORE_RESPONSE = 0x801A,
    /** DEPRECATED */
    // REMOVE_NODE_CACHE_REQUEST = 0x001B,
    /** DEPRECATED */
    // REMOVE_NODE_CACHE_RESPONSE = 0x801B,
    /** DEPRECATED */
    // FIND_NODE_CACHE_REQUEST = 0x001C,
    /** DEPRECATED */
    // FIND_NODE_CACHE_RESPONSE = 0x801C,
    /** DEPRECATED */
    // EXTENDED_SIMPLE_DESCRIPTOR_REQUEST = 0x001D,
    /** DEPRECATED */
    // EXTENDED_SIMPLE_DESCRIPTOR_RESPONSE = 0x801D,
    /** DEPRECATED */
    // EXTENDED_ACTIVE_ENDPOINTS_REQUEST = 0x001E,
    /** DEPRECATED */
    // EXTENDED_ACTIVE_ENDPOINTS_RESPONSE = 0x801E,

    /**
     * This is broadcast and only servers which have matching children respond.
     *
     * Request:  [transaction sequence number: 1]
     *           [number of children:1] [child EUI64:8]*
     */
    PARENT_ANNOUNCE = 0x001f,
    /**
     * The response contains the list of children that the recipient now holds.
     *
     * Response: [transaction sequence number: 1]
     *           [status: 1] [number of children:1] [child EUI64:8]*
     */
    PARENT_ANNOUNCE_RESPONSE = 0x801f,

    //-------------------------------------------------------------------------------------------------
    //-- Bind, Unbind, and Bind Management Client Services Primitives

    /** DEPRECATED */
    // END_DEVICE_BIND_REQUEST = 0x0020,
    /** DEPRECATED */
    // END_DEVICE_BIND_RESPONSE = 0x8020,

    /**
     * There are two possible formats, depending on whether the destination is a group address or a device address.
     * Device addresses include an endpoint, groups don't.
     *
     * Request:  [transaction sequence number: 1]
     *           [source EUI64:8] [source endpoint:1]
     *           [cluster ID:2] [destination address:3 or 10]
     * Destination address:
     *           [0x01:1] [destination group:2]
     * Or:
     *           [0x03:1] [destination EUI64:8] [destination endpoint:1]
     *
     */
    BIND_REQUEST = 0x0021,
    /**
     * Response: [transaction sequence number: 1] [status:1]
     */
    BIND_RESPONSE = 0x8021,
    /**
     * There are two possible formats, depending on whether the destination is a group address or a device address.
     * Device addresses include an endpoint, groups don't.
     *
     * Request:  [transaction sequence number: 1]
     *           [source EUI64:8] [source endpoint:1]
     *           [cluster ID:2] [destination address:3 or 10]
     * Destination address:
     *           [0x01:1] [destination group:2]
     * Or:
     *           [0x03:1] [destination EUI64:8] [destination endpoint:1]
     *
     */
    UNBIND_REQUEST = 0x0022,
    /**
     * Response: [transaction sequence number: 1] [status:1]
     */
    UNBIND_RESPONSE = 0x8022,

    /** DEPRECATED */
    // BIND_REGISTER_REQUEST = 0x0023,
    /** DEPRECATED */
    // BIND_REGISTER_RESPONSE = 0x8023,
    /** DEPRECATED */
    // REPLACE_DEVICE_REQUEST = 0x0024,
    /** DEPRECATED */
    // REPLACE_DEVICE_RESPONSE = 0x8024,
    /** DEPRECATED */
    // STORE_BACKUP_BIND_ENTRY_REQUEST = 0x0025,
    /** DEPRECATED */
    // STORE_BACKUP_BIND_ENTRY_RESPONSE = 0x8025,
    /** DEPRECATED */
    // REMOVE_BACKUP_BIND_ENTRY_REQUEST = 0x0026,
    /** DEPRECATED */
    // REMOVE_BACKUP_BIND_ENTRY_RESPONSE = 0x8026,
    /** DEPRECATED */
    // BACKUP_BIND_TABLE_REQUEST = 0x0027,
    /** DEPRECATED */
    // BACKUP_BIND_TABLE_RESPONSE = 0x8027,
    /** DEPRECATED */
    // RECOVER_BIND_TABLE_REQUEST = 0x0028,
    /** DEPRECATED */
    // RECOVER_BIND_TABLE_RESPONSE = 0x8028,
    /** DEPRECATED */
    // BACKUP_SOURCE_BIND_REQUEST = 0x0029,
    /** DEPRECATED */
    // BACKUP_SOURCE_BIND_RESPONSE = 0x8029,
    /** DEPRECATED */
    // RECOVER_SOURCE_BIND_REQUEST = 0x002A,
    /** DEPRECATED */
    // RECOVER_SOURCE_BIND_RESPONSE = 0x802A,

    /**
     * Request:  [transaction sequence number: 1]
     *           [tlvs: Variable]
     *           tlvs: [Count N:1][EUI64 1:8]...[EUI64 N:8]
     */
    CLEAR_ALL_BINDINGS_REQUEST = 0x002b,
    /**
     * Response: [transaction sequence number: 1] [status:1]
     */
    CLEAR_ALL_BINDINGS_RESPONSE = 0x802b,

    //-------------------------------------------------------------------------------------------------
    //-- Network Management Client Services

    /** DEPRECATED */
    // NETWORK_DISCOVERY_REQUEST = 0x0030,
    /** DEPRECATED */
    // NETWORK_DISCOVERY_RESPONSE = 0x8030,

    /**
     * Request:  [transaction sequence number: 1] [start index:1]
     */
    LQI_TABLE_REQUEST = 0x0031,
    /**
     * Response: [transaction sequence number: 1] [status:1]
     *           [neighbor table entries:1] [start index:1]
     *           [entry count:1] [entry:22]*
     *   [entry] = [extended PAN ID:8] [EUI64:8] [node ID:2]
     *             [device type, RX on when idle, relationship:1]
     *             [permit joining:1] [depth:1] [LQI:1]
     *
     * The device-type byte has the following fields:
     *
     *      Name          Mask        Values
     *
     *   device type      0x03     0x00 coordinator
     *                             0x01 router
     *                             0x02 end device
     *                             0x03 unknown
     *
     *   rx mode          0x0C     0x00 off when idle
     *                             0x04 on when idle
     *                             0x08 unknown
     *
     *   relationship     0x70     0x00 parent
     *                             0x10 child
     *                             0x20 sibling
     *                             0x30 other
     *                             0x40 previous child
     *   reserved         0x10
     *
     * The permit-joining byte has the following fields
     *
     *      Name          Mask        Values
     *
     *   permit joining   0x03     0x00 not accepting join requests
     *                             0x01 accepting join requests
     *                             0x02 unknown
     *   reserved         0xFC
     *
     */
    LQI_TABLE_RESPONSE = 0x8031,

    /**
     * Request:  [transaction sequence number: 1] [start index:1]
     */
    ROUTING_TABLE_REQUEST = 0x0032,
    /**
     * Response: [transaction sequence number: 1] [status:1]
     *           [routing table entries:1] [start index:1]
     *           [entry count:1] [entry:5]*
     *   [entry] = [destination address:2]
     *             [status:1]
     *             [next hop:2]
     *
     *
     * The status byte has the following fields:
     *      Name          Mask        Values
     *
     *   status           0x07     0x00 active
     *                             0x01 discovery underway
     *                             0x02 discovery failed
     *                             0x03 inactive
     *                             0x04 validation underway
     *
     *   flags            0x38
     *                             0x08 memory constrained
     *                             0x10 many-to-one
     *                             0x20 route record required
     *
     *   reserved         0xC0
     */
    ROUTING_TABLE_RESPONSE = 0x8032,

    /**
     * Request:  [transaction sequence number: 1] [start index:1]
     */
    BINDING_TABLE_REQUEST = 0x0033,
    /**
     * Response: [transaction sequence number: 1]
     *           [status:1] [binding table entries:1] [start index:1]
     *           [entry count:1] [entry:14/21]*
     *   [entry] = [source EUI64:8] [source endpoint:1] [cluster ID:2]
     *             [dest addr mode:1] [dest:2/8] [dest endpoint:0/1]
     *
     * @note If Dest. Address Mode = 0x03, then the Long Dest. Address will be
     * used and Dest. endpoint will be included.  If Dest. Address Mode = 0x01,
     * then the Short Dest. Address will be used and there will be no Dest.
     * endpoint.
     */
    BINDING_TABLE_RESPONSE = 0x8033,

    /**
     * Stacks certified prior to Revision 21 MAY or MAY NOT support this command.
     * If this management command is not supported, a status of NOT_SUPPORTED SHALL be returned.
     * All stacks certified to Revision 21 and later SHALL support this command.
     *
     * Request: [transaction sequence number: 1] [EUI64:8] [flags:1]
     *          The flag bits are:
     *          0x40 remove children
     *          0x80 rejoin
     */
    LEAVE_REQUEST = 0x0034,
    /**
     * Response: [transaction sequence number: 1] [status:1]
     */
    LEAVE_RESPONSE = 0x8034,

    /** DEPRECATED */
    // DIRECT_JOIN_REQUEST = 0x0035,
    /** DEPRECATED */
    // DIRECT_JOIN_RESPONSE = 0x8035,

    /**
     * Request:  [transaction sequence number: 1]
     *           [duration:1] [permit authentication:1]
     */
    PERMIT_JOINING_REQUEST = 0x0036,
    /**
     * No response if broadcasted to all routers.
     *
     * Response: [transaction sequence number: 1] [status:1]
     */
    PERMIT_JOINING_RESPONSE = 0x8036,

    /** DEPRECATED */
    // CACHE_REQUEST = 0x0037,
    /** DEPRECATED */
    // CACHE_RESPONSE = 0x8037,

    /**
     * Request:  [transaction sequence number: 1]
     *           [scan channels:4] [duration:1] [count:0/1] [nwkUpdateId:0/1] [manager:0/2]
     *
     *   If the duration is in 0x00 ... 0x05, 'count' is present but
     *   not 'manager'.  Perform 'count' scans of the given duration on the
     *   given channels.
     *
     *   If duration is 0xFE, 'channels' should have a single channel
     *   and 'count' and 'manager' are not present.  Switch to the indicated
     *   channel.
     *
     *   If duration is 0xFF, 'count' is not present.  Set the active
     *   channels and the network manager ID to the values given.
     *
     *   Unicast requests always get a response, which is INVALID_REQUEST if the
     *   duration is not a legal value.
     */
    NWK_UPDATE_REQUEST = 0x0038,
    /**
     * Response: [transaction sequence number: 1] [status:1]
     *   [scanned channels:4] [transmissions:2] [failures:2]
     *   [energy count:1] [energy:1]*
     */
    NWK_UPDATE_RESPONSE = 0x8038,

    /**
     * Request:  [transaction sequence number: 1]
     *           [scan channels list structure: Variable] [duration:1] [count:0/1] [nwkUpdateId:0/1] [manager:0/2] [configuration bitmask:0/1]
     */
    NWK_ENHANCED_UPDATE_REQUEST = 0x0039,
    /**
     * Response: [transaction sequence number: 1] [status:1]
     *   [scanned channels:4] [transmissions:2] [failures:2]
     *   [energy count:1] [energy:1]*
     */
    NWK_ENHANCED_UPDATE_RESPONSE = 0x8039,

    /**
     * Request:  [transaction sequence number: 1]
     *           [start index: 1]
     */
    NWK_IEEE_JOINING_LIST_REQUEST = 0x003a,
    /**
     * Response: [transaction sequence number: 1] [status: 1] [ieee joining list update id: 1] [joining policy: 1]
     *           [ieee joining list total: 1] [start index: 1] [ieee joining count: 1] [ieee:8]*
     */
    NWK_IEEE_JOINING_LIST_RESPONSE = 0x803a,

    /**
     * Response: [transaction sequence number: 1] [status: 1] [channel in use: 4] [mac tx ucast total: 2] [mac tx ucast failures: 2]
     *           [mac tx ucast retries: 2] [period of time for results: 1]
     */
    NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE = 0x803b,

    /**
     * This command can be used by a remote device to survey the end devices to determine how many potential parents they have access to.
     *
     * Request:  [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains one Beacon Survey Configuration TLV (variable octets),
     * which contain the ScanChannelListStructure (variable length)
     * and the ConfigurationBitmask (1 octet). This information provides
     * the configuration for the end device's beacon survey.
     * See R23 spec section 2.4.3.3.12 for the request and 3.2.2.2.1
     * for the ChannelListStructure.
     */
    NWK_BEACON_SURVEY_REQUEST = 0x003c,
    /**
     *
     * Response:  [transaction sequence number: 1]
     *            [status: 1]
     *            [TLVs: varies]
     *
     * Contains one Beacon Survey Results TLV (4 octets), which contain
     * the number of on-network, off-network, potential parent and total
     * beacons recorded. If the device that received the request is not a
     * router, a Potential Parent TLV (variable octects) will be found. This
     * will contain information on the device's current parent, as well as
     * any potential parents found via beacons (up to a maximum of 5). A
     * Pan ID Conflict TLV can also found in the response.
     * See R23 spec section 2.4.4.3.13 for the response.
     */
    NWK_BEACON_SURVEY_RESPONSE = 0x803c,

    //-------------------------------------------------------------------------------------------------
    //-- Security Client Services

    /**
     *
     * Request:  [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains one or more Curve25519 Public Point TLVs (40 octets),
     * which contain an EUI64 and the 32-byte Curve public point.
     * See R23 spec section 2.4.3.4.1
     *
     * @note This command SHALL NOT be APS encrypted regardless of
     * whether sent before or after the device joins the network.
     * This command SHALL be network encrypted if the device has a
     * network key, i.e. it has joined the network earlier and wants
     * to negotiate or renegotiate a new link key; otherwise, if it
     * is used prior to joining the network, it SHALL NOT be network
     *  encrypted.
     */
    START_KEY_NEGOTIATION_REQUEST = 0x0040,
    /**
     *
     * Response: [transaction sequence number: 1] [status:1]
     *           [TLVs: varies]
     *
     * Contains one or more Curve25519 Public Point TLVs (40 octets),
     * which contain an EUI64 and the 32-byte Curve public point, or
     * Local TLVs.
     * See R23 spec section 2.4.4.4.1
     *
     * @note This command SHALL NOT be APS encrypted. When performing
     * Key Negotiation with an unauthenticated neighbor that is not
     * yet on the network, network layer encryption SHALL NOT be used
     * on the message. If the message is being sent to unauthenticated
     * device that is not on the network and is not a neighbor, it
     * SHALL be relayed as described in section 4.6.3.7.7. Otherwise
     * the message SHALL have network layer encryption.
     */
    START_KEY_NEGOTIATION_RESPONSE = 0x8040,

    /**
     *
     * Request:  [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains one or more Authentication Token ID TLVs (1 octet),
     * which contain the TLV Type Tag ID of the source of the
     * authentication token. See R23 spec section 2.4.3.4.2
     */
    RETRIEVE_AUTHENTICATION_TOKEN_REQUEST = 0x0041,
    /**
     *
     * Response: [transaction sequence number: 1] [status:1]
     *           [TLVs: varies]
     *
     * Contains one or more 128-bit Symmetric Passphrase Global TLVs
     * (16 octets), which contain the symmetric passphrase authentication
     * token. See R23 spec section 2.4.4.4.2
     */
    RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE = 0x8041,

    /**
     *
     * Request:  [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains one or more Target IEEE Address TLVs (8 octets),
     * which contain the EUI64 of the device of interest.
     * See R23 spec section 2.4.3.4.3
     */
    GET_AUTHENTICATION_LEVEL_REQUEST = 0x0042,
    /**
     *
     * Response: [transaction sequence number: 1] [status:1]
     *           [TLVs: varies]
     *
     * Contains one or more Device Authentication Level TLVs
     * (10 octets), which contain the EUI64 of the inquired device,
     * along with the its initial join method and its active link
     * key update method.
     * See R23 spec section 2.4.4.4.3
     */
    GET_AUTHENTICATION_LEVEL_RESPONSE = 0x8042,

    /**
     *
     * Request:  [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains one or more Global TLVs (1 octet),
     * which contain the TLV Type Tag ID, and their
     * value.
     */
    SET_CONFIGURATION_REQUEST = 0x0043,
    /**
     *
     * Response: [transaction sequence number: 1] [status:1]
     */
    SET_CONFIGURATION_RESPONSE = 0x8043,

    /**
     *
     * Request:  [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains one or more TLVs (1 octet),
     * which the sender wants to get information
     */
    GET_CONFIGURATION_REQUEST = 0x0044,
    /**
     *
     * Response: [transaction sequence number: 1] [status:1]
     *           [TLVs: varies]
     *
     * Contains one or more TLV tag Ids and their values
     * in response to the request
     */
    GET_CONFIGURATION_RESPONSE = 0x8044,

    /**
     *
     * Request:  [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains one or more TLVs. These TLVs can be Selected Key
     * Negotiation Method TLVs (10 octets), Fragmentation Parameters
     * Global TLVs (5 octets), or other TLVs.
     * See R23 spec section 2.4.3.4.6
     *
     * @note This SHALL NOT be APS encrypted or NWK encrypted if the
     * link key update mechanism is done as part of the initial join
     * and before the receiving device has been issued a network
     * key. This SHALL be both APS encrypted and NWK encrypted if
     * the link key update mechanism is performed to refresh the
     * link key when the receiving device has the network key and
     * has previously successfully joined the network.
     */
    START_KEY_UPDATE_REQUEST = 0x0045,
    /**
     *
     * Response: [transaction sequence number: 1] [status:1]
     *
     * See R23 spec section 2.4.4.4.6
     *
     * @note This command SHALL be APS encrypted.
     */
    START_KEY_UPDATE_RESPONSE = 0x8045,

    /**
     * Request:  [transaction sequence number: 1]
     *           [security decommission request EUI64 TLV:Variable]
     * Security Decommission request EUI64 TLV:
     *           [Count N:1][EUI64 1:8]...[EUI64 N:8]
     */
    DECOMMISSION_REQUEST = 0x0046,
    /**
     *
     * Response: [transaction sequence number: 1] [status:1]
     */
    DECOMMISSION_RESPONSE = 0x8046,

    /**
     * Request:  [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains at least the APS Frame Counter Challenge TLV, which holds the
     * sender EUI and the 64 bit challenge value.
     */
    CHALLENGE_REQUEST = 0x0047,
    /**
     * Response: [transaction sequence number: 1]
     *           [TLVs: varies]
     *
     * Contains at least the APS Frame Counter Response TLV, which holds the
     * sender EUI, received challenge value, APS frame counter, challenge
     * security frame counter, and 8-byte MIC.
     */
    CHALLENGE_RESPONSE = 0x8047,
}
