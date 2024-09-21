import {ClusterId, EUI64, ExtendedPanId, NodeId, PanId, ProfileId} from '../../tstypes';
import {ClusterId as ZdoClusterId} from './clusters';
import {
    ActiveLinkKeyType,
    InitialJoinMethod,
    JoiningPolicy,
    LeaveRequestFlags,
    RoutingTableStatus,
    SelectedKeyNegotiationProtocol,
    SelectedPreSharedSecret,
} from './enums';
import {Status} from './status';

/**
 * Bits:
 * - [alternatePANCoordinator: 1]
 * - [deviceType: 1]
 * - [powerSource: 1]
 * - [rxOnWhenIdle: 1]
 * - [reserved1: 1]
 * - [reserved2: 1]
 * - [securityCapability: 1]
 * - [securityCapability: 1]
 */
export type MACCapabilityFlags = {
    /**
     * The alternate PAN coordinator sub-field is one bit in length and shall be set to 1 if this node is capable of becoming a PAN coordinator.
     * Otherwise, the alternative PAN coordinator sub-field shall be set to 0.
     */
    alternatePANCoordinator: number;
    /**
     * The device type sub-field is one bit in length and shall be set to 1 if this node is a full function device (FFD).
     * Otherwise, the device type sub-field shall be set to 0, indicating a reduced function device (RFD).
     */
    deviceType: number;
    /**
     * The power source sub-field is one bit in length and shall be set to 1 if the current power source is mains power.
     * Otherwise, the power source sub-field shall be set to 0.
     * This information is derived from the node current power source field of the node power descriptor.
     */
    powerSource: number;
    /**
     * The receiver on when idle sub-field is one bit in length and shall be set to 1 if the device does not disable its receiver to
     * conserve power during idle periods.
     * Otherwise, the receiver on when idle sub-field shall be set to 0 (see also section 2.3.2.4.)
     */
    rxOnWhenIdle: number;
    reserved1: number;
    reserved2: number;
    /**
     * The security capability sub-field is one bit in length and shall be set to 1 if the device is capable of sending and receiving
     * frames secured using the security suite specified in [B1].
     * Otherwise, the security capability sub-field shall be set to 0.
     */
    securityCapability: number;
    /** The allocate address sub-field is one bit in length and shall be set to 0 or 1. */
    allocateAddress: number;
};

/**
 * Bits:
 * - [primaryTrustCenter: 1]
 * - [backupTrustCenter: 1]
 * - [deprecated1: 1]
 * - [deprecated2: 1]
 * - [deprecated3: 1]
 * - [deprecated4: 1]
 * - [networkManager: 1]
 * - [reserved1: 1]
 * - [reserved2: 1]
 * - [stackComplianceRevision: 7]
 */
export type ServerMask = {
    primaryTrustCenter: number;
    backupTrustCenter: number;
    deprecated1: number;
    deprecated2: number;
    deprecated3: number;
    deprecated4: number;
    networkManager: number;
    reserved1: number;
    reserved2: number;
    /**
     * Indicate the Revision of the Zigbee Pro Core specification that the running stack is implemented to.
     * Prior to Revision 21 of the specification these bits were reserved and thus set to 0.
     * A stack that is compliant to Revision 23 would set these bits to 23 (0010111b).
     * A stack SHALL indicate the Revision of the specification it is compliant to by setting these bits.
     */
    stackComplianceRevision: number;
};

//-------------------------------------------------------------------------------------------------
//-- Responses

export type LQITableEntry = {
    /**
     * The 64-bit extended PAN identifier of the neighboring device.
     *
     * 64-bit
     */
    extendedPanId: ExtendedPanId;
    /**
     * 64-bit IEEE address that is unique to every device.
     * If this value is unknown at the time of the request, this field shall be set to 0xffffffffffffffff.
     *
     * 64-bit
     */
    eui64: EUI64;
    /** The 16-bit network address of the neighboring device. 16-bit */
    nwkAddress: NodeId;
    /**
     * The type of the neighbor device:
     * 0x00 = ZigBee coordinator
     * 0x01 = ZigBee router
     * 0x02 = ZigBee end device
     * 0x03 = Unknown
     *
     * 2-bit
     */
    deviceType: number;
    /**
     * Indicates if neighbor's receiver is enabled during idle portions of the CAP:
     * 0x00 = Receiver is off
     * 0x01 = Receiver is on
     * 0x02 = unknown
     *
     * 2-bit
     */
    rxOnWhenIdle: number;
    /**
     * The relationship between the neighbor and the current device:
     * 0x00 = neighbor is the parent
     * 0x01 = neighbor is a child
     * 0x02 = neighbor is a sibling
     * 0x03 = None of the above
     * 0x04 = previous child
     *
     * 3-bit
     */
    relationship: number;
    /** This reserved bit shall be set to 0. 1-bit */
    reserved1: number;
    /**
     * An indication of whether the neighbor device is accepting join requests:
     * 0x00 = neighbor is not accepting join requests
     * 0x01 = neighbor is accepting join requests
     * 0x02 = unknown
     *
     * 2-bit
     */
    permitJoining: number;
    /** Each of these reserved bits shall be set to 0. 6-bit */
    reserved2: number;
    /**
     * The tree depth of the neighbor device.
     * A value of 0x00 indicates that the device is the ZigBee coordinator for the network
     *
     * 8-bit
     */
    depth: number;
    /**
     * The estimated link quality for RF transmissions from this device.
     * See [B1] for discussion of how this is calculated.
     *
     * 8-bit
     */
    lqi: number;
};

export type RoutingTableEntry = {
    /** 16-bit network address of this route */
    destinationAddress: NodeId;
    /**
     * Status of the route
     * 0x0=ACTIVE.
     * 0x1=DISCOVERY_UNDERWAY.
     * 0x2=DISCOVERY_FAILED.
     * 0x3=INACTIVE.
     * 0x4=VALIDATION_UNDERWAY
     * 0x5-0x7=RESERVED
     *
     * 3-bit
     */
    status: keyof typeof RoutingTableStatus | 'UNKNOWN';
    /**
     * A flag indicating whether the device is a memory constrained concentrator
     *
     * 1-bit
     */
    memoryConstrained: number;
    /**
     * A flag indicating that the destination is a concentrator that issued a many-to-one request
     *
     * 1-bit
     */
    manyToOne: number;
    /**
     * A flag indicating that a route record command frame should be sent to the destination prior to the next data packet.
     *
     * 1-bit
     */
    routeRecordRequired: number;
    /** 2-bit */
    reserved1: number;
    /** 16-bit network address of the next hop on the way to the destination. */
    nextHopAddress: number;
};

export type BindingTableEntry = {
    /** The source IEEE address for the binding entry. */
    sourceEui64: EUI64;
    /** The source endpoint for the binding entry. */
    sourceEndpoint: number;
    /** The identifier of the cluster on the source device that is bound to the destination device. */
    clusterId: ClusterId;
    /**
     * The addressing mode for the destination address. This field can take one of the non-reserved values from the following list:
     *   - 0x00 = reserved
     *   - 0x01 = 16-bit group address for DstAddr and DstEndpoint not present
     *   - 0x02 = reserved
     *   - 0x03 = 64-bit extended address for DstAddr and DstEndp present
     *   - 0x04 – 0xff = reserved
     */
    destAddrMode: number;
    /** The destination address for the binding entry. 2-byte or 8-byte */
    dest: NodeId | EUI64;
    /**
     * This field shall be present only if the DstAddrMode field has a value of 0x03 and, if present,
     * shall be the destination endpoint for the binding entry.
     */
    destEndpoint?: number;
};

export type NetworkAddressResponse = {
    /** 64-bit address for the Remote Device. */
    eui64: EUI64;
    /** 16-bit address for the Remote Device. */
    nwkAddress: NodeId;
    /**
     * Starting index into the list of associated devices for this report.
     * If the RequestType in the request is Extended Response and there are no associated devices on the Remote Device,
     * this field SHALL NOT be included in the frame.
     * If an error occurs or the Request Type in the request is for a Single Device Response, this field SHALL NOT be included in the frame.
     */
    startIndex: number;
    /**
     * A list of 16-bit addresses, one corresponding to each associated device to Remote Device;
     * The number of 16-bit network addresses contained in this field is specified in the NumAssocDev field.
     * If the RequestType in the request is Extended Response and there are no associated devices on the Remote Device,
     * this field SHALL NOT be included in the frame.
     * If an error occurs or the Request Type in the request is for a Single Device Response, this field SHALL NOT be included in the frame.
     */
    assocDevList: NodeId[];
};

export type IEEEAddressResponse = {
    /** @see NetworkAddressResponse.eui64 */
    eui64: EUI64;
    /** @see NetworkAddressResponse.nwkAddress */
    nwkAddress: NodeId;
    /** @see NetworkAddressResponse.startIndex */
    startIndex: number;
    /** @see NetworkAddressResponse.assocDevList */
    assocDevList: NodeId[];
};

export type NodeDescriptorResponse = {
    /** NWK address for the request. */
    nwkAddress: NodeId;
    /** 000 == Zigbee Coordinator, 001 == Zigbee Router,  010 === Zigbee End Device, 011-111 === Reserved */
    logicalType: number;
    /** R23 and above (determined via other means if not). Indicates whether the device supports fragmentation at the APS layer. */
    fragmentationSupported: boolean | undefined;
    /** Specifies the application support sub-layer capabilities of the node. Currently not supported, should be zero */
    apsFlags: number;
    /**
     * Specifies the frequency bands that are supported by the underlying IEEE Std 802.15.4 radio(s) utilized by the node.
     * Bits:
     * - 0 = 868 – 868.6 MHz
     * - 1 = Reserved
     * - 2 = 902 – 928 MHz
     * - 3 = 2400 – 2483.5 MHz
     * - 4 = GB Smart Energy sub-GHz bands: (863-876MHz and 915-921MHz)
     */
    frequencyBand: number;
    /** Specifies the node capabilities. */
    capabilities: MACCapabilityFlags;
    /** Specifies a manufacturer code that is allocated by the Connectivity Standards Alliance, relating the manufacturer to the device. */
    manufacturerCode: number;
    /**
     * Specifies the maximum size, in octets, of the network sub-layer data unit (NSDU) for this node.
     * This is the maximum size of data or commands passed to or from the application by the application support sub-layer,
     * before any fragmentation or re-assembly.
     * This field can be used as a high-level indication for network management.
     * Valid range of 0x00-0x7f.
     */
    maxBufSize: number;
    /**
     * Indicates the device's apsMaxSizeASDU AIB value.
     * Specifies the maximum size, in octets, of the application sub-layer data unit (ASDU) that can be transferred to this node
     * in one single message transfer.
     * This value can exceed the value of the node maximum buffer size field (see section 2.3.2.3.9) through the use of fragmentation.
     * Valid range of 0x0000-0x7fff.
     */
    maxIncTxSize: number;
    /** The system server capabilities of this node */
    serverMask: ServerMask;
    /**
     * Specifies the maximum size, in octets, of the application sub-layer data unit (ASDU) that can be transferred
     * from this node in one single message transfer.
     * This value can exceed the value of the node 2777 maximum buffer size field (see section 2.3.2.3.9) through the use of fragmentation.
     * Valid range of 0x0000-0x7fff.
     */
    maxOutTxSize: number;
    deprecated1: number;
} & TLVs;

export type PowerDescriptorResponse = {
    /** NWK address for the request. */
    nwkAddress: NodeId;
    /**
     * - 0000 == receiver sync'ed with receiver on when idle subfield of the node descriptor
     * - 0001 == receiver comes on periodically as defined by the node power descriptor
     * - 0010 == receiver comes on when stimulated, for example, by a user pressing a button
     * - 0011-1111 reserved
     */
    currentPowerMode: number;
    /**
     * Bits:
     * - 0 == constants (mains) power
     * - 1 == rechargeable battery
     * - 2 == disposable battery
     * - 3 == reserved
     */
    availPowerSources: number;
    /**
     * Bits:
     * - 0 == constants (mains) power
     * - 1 == rechargeable battery
     * - 2 == disposable battery
     * - 3 == reserved
     */
    currentPowerSource: number;
    /**
     * - 0000 == critical
     * - 0100 == 33%
     * - 1000 == 66%
     * - 1100 == 100%
     */
    currentPowerSourceLevel: number;
};

export type SimpleDescriptorResponse = {
    /** NWK address for the request. */
    nwkAddress: NodeId;
    /** Length of the descriptor */
    length: number;
    /**
     * Specifies the endpoint within the node to which this description refers.
     * Applications SHALL only use endpoints 1-254.
     * Endpoints 241-254 SHALL be used only with the approval of the Connectivity Standards Alliance.
     * The Green Power cluster, if implemented, SHALL use endpoint 242.
     */
    endpoint: number;
    /**
     * Specifies the profile that is supported on this endpoint.
     * Profile identifiers SHALL be obtained from the Connectivity Standards Alliance.
     */
    profileId: ProfileId;
    /**
     * Specifies the device description supported on this endpoint.
     * Device description identifiers SHALL be obtained from the Connectivity Standards Alliance.
     */
    deviceId: number;
    /**
     * Specifies the version of the device description supported on this endpoint.
     * The application device version field SHALL be set to one of the non-reserved values listed in Table 2-41.
     * Default SHALL be 0000 unless otherwise defined by the application profile.
     * Valid range 0000-1111, others reserved
     */
    deviceVersion: number;
    /**
     * Specifies the list of input clusters supported on this endpoint, for use during the service discovery and binding procedures.
     * The application input cluster list field SHALL be included only if the value of the application input cluster count field is greater than zero.
     */
    inClusterList: ClusterId[];
    /**
     * Specifies the list of output clusters supported on this endpoint, for use during the service discovery and binding procedures.
     * The application output cluster list field SHALL be included only if the value of the application output cluster count field
     * is greater than zero.
     */
    outClusterList: ClusterId[];
};

export type ActiveEndpointsResponse = {
    /** NWK address for the request. */
    nwkAddress: NodeId;
    /** List of bytes each of which represents an 8-bit endpoint. */
    endpointList: number[];
};

export type MatchDescriptorsResponse = {
    /** NWK address for the request. */
    nwkAddress: NodeId;
    /** List of bytes each of which represents an 8-bit endpoint. */
    endpointList: number[];
};

export type EndDeviceAnnounce = {
    /** NWK address for the request. */
    nwkAddress: NodeId;
    eui64: EUI64;
    capabilities: MACCapabilityFlags;
};

export type SystemServerDiscoveryResponse = {
    /** The system server capabilities of this node */
    serverMask: ServerMask;
};

export type ParentAnnounceResponse = {
    children: EUI64[];
};

export type LQITableResponse = {
    /** [0x00-0xFF] Total number of neighbor table entries within the remote device */
    neighborTableEntries: number;
    /** [0x00-0xFF] Starting index within the neighbor table to begin reporting for the NeighborTableList */
    startIndex: number;
    /**
     * A list of descriptors, beginning with the StartIndex element and continuing for NeighborTableListCount,
     * of the elements in the Remote Device's Neighbor Table including the device address and associated LQI ( @see LQITableEntry ).
     */
    entryList: LQITableEntry[];
};

export type RoutingTableResponse = {
    /** [0x00-0xFF] Total number of Routing Table entries within the Remote Device. */
    routingTableEntries: number;
    /** [0x00-0xFF] Starting index within the Routing Table to begin reporting for the RoutingTableList. */
    startIndex: number;
    /**
     * A list of descriptors, beginning with the StartIndex element and continuing for RoutingTableListCount,
     * of the elements in the Remote Device's Routing Table ( @see RoutingTableEntry ).
     */
    entryList: RoutingTableEntry[];
};

export type BindingTableResponse = {
    /** [0x00-0xFF] Total number of Binding Table entries within the Remote Device. */
    bindingTableEntries: number;
    /** [0x00-0xFF] Starting index within the Binding Table to begin reporting for the BindingTableList. */
    startIndex: number;
    /**
     * A list of descriptors, beginning with the StartIndex element and continuing for BindingTableList- Count,
     * of the elements in the Remote Device's Binding Table ( @see BindingTableEntry ).
     */
    entryList: BindingTableEntry[];
};

export type NwkUpdateResponse = {
    /**
     * The five most significant bits (b27,..., b31) represent the binary encoded Channel Page.
     * The 27 least significant bits (b0, b1,... b26) indicate which channels were scanned (1 = scan, 0 = do not scan)
     * for each of the 27 valid channels.
     */
    scannedChannels: number;
    /** Count of the total transmissions reported by the device. */
    totalTransmissions: number;
    /** Sum of the total transmission failures reported by the device. */
    totalFailures: number;
    /**
     * The result of an energy measurement made on this channel in accordance with [B1].
     * 0xff if there is too much interference on this channel.
     */
    entryList: number[];
};

export type NwkEnhancedUpdateResponse = {
    /**
     * The five most significant bits (b27,..., b31) represent the binary encoded Channel Page.
     * The 27 least significant bits (b0, b1,... b26) indicate which channels were scanned (1 = scan, 0 = do not scan)
     * for each of the 27 valid channels.
     */
    scannedChannels: number;
    /** Count of the total transmissions reported by the device. */
    totalTransmissions: number;
    /** Sum of the total transmission failures reported by the device. */
    totalFailures: number;
    /**
     * The result of an energy measurement made on this channel in accordance with [B1].
     * 0xff if there is too much interference on this channel.
     */
    entryList: number[];
};

export type NwkIEEEJoiningListResponse = {
    /**
     * The issue ID of the IeeeJoiningList.
     * This field SHALL start at 0 and increment for each change to the IeeeJoiningList,
     * or each change to the Joining Policy wrapping to 0 after 0xFF.
     */
    updateId: number;
    /** This is an enumeration. */
    joiningPolicy: JoiningPolicy;
    /** The total number of IEEE Joining Addresses contained in the response. */
    entryListTotal: number;
    /** The starting index in the mibIeeeJoiningList. This field SHALL be omitted if the entryListTotal is 0. */
    startIndex?: number;
    /** A list of IEEE addresses from the mibIeeeJoiningList. This field SHALL be omitted if the entryListTotal is 0. */
    entryList?: EUI64[];
};

export type NwkUnsolicitedEnhancedUpdateResponse = {
    /**
     * The five most significant bits (b27,..., b31) represent the binary encoded Channel Page.
     * The 27 least significant bits (b0, b1,... b26) indicate which channels is in use (1 = in use, 0 = not in use)
     * for each of the 27 valid channels.
     */
    channelInUse: number;
    /**
     * Total number of Mac Tx Transactions to attempt to send a message (but not counting retries)
     */
    macTxUCastTotal: number;
    /**
     * Total number of failed Tx Transactions. So if the Mac sent a single packet, it will be retried 4 times without ACK, that counts as 1 failure.
     */
    macTxUCastFailures: number;
    /**
     * Total number of Mac Retries regardless of whether the transaction resulted in success or failure.
     */
    macTxUCastRetries: number;
    /** Time period over which MACTxyyy results are measured (in minutes) */
    timePeriod: number;
};

export type NwkBeaconSurveyResponse = TLVs;

export type StartKeyNegotiationResponse = TLVs;

export type RetrieveAuthenticationTokenResponse = TLVs;

export type GetAuthenticationLevelResponse = TLVs;

export type SetConfigurationResponse = TLVs;

export type GetConfigurationResponse = TLVs;

export type ChallengeResponse = TLVs;

//-------------------------------------------------------------------------------------------------
//-- TLVs

//-- Global TLVs

/** Defined outside the Zigbee specification. Only TLV that can be added more than once to same frame. */
export type ManufacturerSpecificGlobalTLV = {
    /** 2-byte */
    zigbeeManufacturerId: number;
    additionalData: Buffer;
};

export type SupportedKeyNegotiationMethodsGlobalTLV = {
    /**
     * Bits:
     * - 0 Static Key Request (Zigbee 3.0 Mechanism)
     * - 1 SPEKE using Curve25519 with Hash AES-MMO-128
     * - 2 SPEKE using Curve25519 with Hash SHA-256
     * - 3 – 7 Reserved
     */
    keyNegotiationProtocolsBitmask: number;
    /**
     * Bits:
     * - 0 Symmetric Authentication Token
     *   - This is a token unique to the Trust Center and network that the device is running on, and is assigned by the Trust center after joining.
     *     The token is used to renegotiate a link key using the Key Negotiation protocol and is good for the life of the device on the network.
     * - 1 Install Code Key
     *   - 128-bit pre-configured link-key derived from install code
     * - 2 Passcode Key
     *   - A variable length passcode for PAKE protocols. This passcode can be shorter for easy entry by a user.
     * - 3 Basic Access Key
     *   - This key is used by other Zigbee specifications for joining with an alternate pre-shared secret.
     *     The definition and usage is defined by those specifications. The usage is optional by the core Zigbee specification.
     * - 4 Administrative Access Key
     *   - This key is used by other Zigbee specifications for joining with an alternate pre-shared secret.
     *     The definition and usage is defined by those specifications. The usage is optional by the core Zigbee specification.
     * - 5-7 Reserved -
     */
    preSharedSecretsBitmask: number;
    /** XXX: Assumed optional from minimum length of TLV in spec */
    sourceDeviceEui64?: EUI64;
};

export type PanIdConflictReportGlobalTLV = {
    /** 2-byte */
    nwkPanIdConflictCount: number;
};

export type NextPanIdChangeGlobalTLV = {
    /** 2-bytes in length and indicates the next channel that will be used once a Network Update command is received to change PAN IDs. */
    panId: PanId;
};

export type NextChannelChangeGlobalTLV = {
    /** 4-bytes in length and indicates the next channel that will be used once a start channel change command is received. */
    channel: number;
};

export type SymmetricPassphraseGlobalTLV = {
    /** 16-byte 128-bit */
    passphrase: Buffer;
};

export type RouterInformationGlobalTLV = {
    /**
     * Bits:
     * - 0 Hub Connectivity
     *   - This bit indicates the state of nwkHubConnectivity from the NIB of the local device.
     *     It advertises whether the router has connectivity to a Hub device as defined by the higher-level application layer.
     *     A value of 1 means there is connectivity, and a value of 0 means there is no current Hub connectivity.
     * 1 Uptime
     *   - This 1-bit value indicates the uptime of the router. A value of 1 indicates the router has been up for more than 24 hours.
     *     A value of 0 indicates the router has been up for less than 24 hours.
     * 2 Preferred Parent
     *   - This bit indicates the state of nwkPreferredParent from the NIB of the local device.
     *     When supported, it extends Hub Connecivity, advertising the devices capacity to be the parent for an additional device.
     *     A value of 1 means that this device should be preferred. A value of 0 indicates that it should not be preferred.
     *     Devices that do not make this determination SHALL always report a value of 0.
     * 3 Battery Backup
     *   - This bit indicates that the router has battery backup and thus will not be affected by temporary losses in power.
     * 4 Enhanced Beacon Request Support
     *   - When this bit is set to 1, it indicates that the router supports responding to Enhanced beacon requests as defined by IEEE Std 802.15.4.
     *     A zero for this bit indicates the device has no support for responding to enhanced beacon requests.
     * 5 MAC Data Poll Keepalive Support
     *   - This indicates that the device has support for the MAC Data Poll Keepalive method for End Device timeouts.
     * 6 End Device Keepalive Support
     *   - This indicates that the device has support for the End Device Keepalive method for End Device timeouts.
     * 7 Power Negotiation Support
     *   - This indicates the device has support for Power Negotiation with end devices.
     * 8-15 Reserved These bits SHALL be set to 0.
     */
    bitmask: number;
};

export type FragmentationParametersGlobalTLV = {
    /** This indicates the node ID of the device that the subsequent fragmentation parameters apply to. */
    nwkAddress: NodeId;
    /**
     * This bitfield indicates what fragmentation options are supported by the device.
     * It has the following enumerated bits:
     * - Bit 0 = APS Fragmentation Supported. Set to 1 to indicate support; 0 to indicate no support
     *   If set to 1, the maximum reassembled message size is indicated by the Maximum Incoming Transfer Unit.
     * - Bit 1-7 = Reserved for future use
     *
     * XXX: Assumed optional from minimum length of TLV in spec
     */
    fragmentationOptions?: number;
    /**
     * This is a copy of the local device’s apsMaxSizeASDU AIB value.
     * This indicates the maximum reassembled message size at the application layer after fragmentation has been applied
     * on the message at the lower layers.
     * A device supporting fragmentation would set this field to be larger than the normal payload size of the underlying NWK and MAC layer.
     *
     * XXX: Assumed optional from minimum length of TLV in spec
     */
    maxIncomingTransferUnit?: number;
};

export type JoinerEncapsulationGlobalTLV = {
    additionalTLVs: TLV[];
};

export type BeaconAppendixEncapsulationGlobalTLV = {
    /** At least `SupportedKeyNegotiationMethodsGlobalTLV`, `FragmentationParametersGlobalTLV` */
    additionalTLVs: TLV[];
};

export type ConfigurationParametersGlobalTLV = {
    /**
     * 2-bytes in length and indicates various parameters about how the stack SHALL behave
     * Bit:
     *   - 0 AIB apsZdoRestrictedMode
     *   - 1 Device Security Policy requireLinkKeyEncryptionForApsTransportKey
     *   - 2 NIB nwkLeaveRequestAllowed
     *   - 3–15 Reserved Reserved
     */
    configurationParameters: number;
};

export type DeviceCapabilityExtensionGlobalTLV = {
    data: Buffer;
};

//-- Local TLVs

/**
 * NOTE: The Maximum Transmission Unit (MTU) of the underlying message will limit the maximum range of this field.
 */
export type ClearAllBindingsReqEUI64TLV = {
    /** A list of EUI64 that SHALL trigger corresponding bindings to be deleted. */
    eui64List: EUI64[];
};

export type BeaconSurveyConfigurationTLV = {
    /**
     * The list of channels and pages over which the scan is to be done.
     * For more information on the Channel List structure see section 3.2.2.2.1.
     */
    scanChannelList: number[];
    /**
     * - 0 Active or Enhanced Scan This bit determines whether to do an Active Scan or Enhanced Active Scan.
     *   When the bit is set to 1 it indicates an Enhanced Active Scan.
     *   And in case of Enhanced Active scan EBR shall be sent with EPID filter instead of PJOIN filter.
     * - 1 – 7 Reserved -
     */
    configurationBitmask: number;
};

export type Curve25519PublicPointTLV = {
    /** This indicates the EUI64 of the device that generated the public point. */
    eui64: EUI64;
    /** The 32-byte Curve public point. */
    publicPoint: Buffer;
};

export type AuthenticationTokenIdTLV = {
    /** The Global TLV Type Tag ID being requested for an authentication token. */
    tlvTypeTagId: number;
};

export type TargetIEEEAddressTLV = {
    /** Extended address of the device whose security level is requested. */
    ieee: EUI64;
};

export type SelectedKeyNegotiationMethodTLV = {
    /**
     * The enumeration of the key negotiation method the sender is requesting to use in key negotiation.
     */
    protocol: SelectedKeyNegotiationProtocol;
    /**
     * The enumeration indicating the pre-shared secret that the sending device is requesting to be used in the key negotiation.
     */
    presharedSecret: SelectedPreSharedSecret;
    /** The value of the EUI64 of the device sending the message. This field SHALL always be present. */
    sendingDeviceEui64: EUI64;
};

export type DeviceEUI64ListTLV = {
    /** A list of EUI64 that shall trigger decommissioning operations. Count: [0x00-0xFF] */
    eui64List: EUI64[];
};

export type APSFrameCounterChallengeTLV = {
    /** The EUI64 of the device that generated the frame. */
    senderEui64: EUI64;
    /**
     * A randomly generated 64-bit value sent to a device to prove they have the link key.
     * This allows the initiator to detect replayed challenge response frames.
     */
    challengeValue: Buffer;
};

export type APSFrameCounterResponseTLV = {
    /** The EUI64 of the device that is responding to the Security_Challenge_req with its own challenge. */
    responderEui64: EUI64;
    /** A randomly generated 64-bit value previously received in the APSFrameCounterChallengeTLV. */
    receivedChallengeValue: Buffer;
    /** The current outgoing APS security frame counter held by the Responder EUI64 device. */
    apsFrameCounter: number;
    /**
     * The AES-CCM-128 outgoing frame counter used to generate the MIC over the octet sequence
     * { tag || length || responder EUI-64 || received challenge value || APS frame counter }
     * using the special nonce and AES-128 key for frame counter synchronization.
     */
    challengeSecurityFrameCounter: number;
    /**
     * The AES-128-CCM 64-bit MIC (security level 2) on all previous fields of this TLV,
     * excluding the challenge security frame counter, including Tag ID and length fields.
     */
    mic: Buffer;
};

export type BeaconSurveyResultsTLV = {
    /** The total number of IEEE Std 802.15.4 beacons received during the scan. */
    totalBeaconsReceived: number;
    /** The total number of Zigbee Network beacons where the Extended PAN ID matches the local device’s nwkExtendedPanId. */
    onNetworkBeacons: number;
    /**
     * The total number of Zigbee Network beacons where the Extended PAN ID matches and the Zigbee Beacon payload indicates
     * End Device Capacity = TRUE.
     */
    potentialParentBeacons: number;
    /**
     * The total number of IEEE Std 802.15.4 beacons from other Zigbee networks or other IEEE Std 802.15.4 networks.
     * Other Zigbee network beacons are defined as when the Extended PAN ID does not match the local Extended PAN ID.
     */
    otherNetworkBeacons: number;
};

export type PotentialParentsTLV = {
    /** The short address that is the current parent for the device. For a router or coordinator this value SHALL be set to 0xFFFF. */
    currentParentNwkAddress: number;
    /** The value of the LQA of the current parent. */
    currentParentLQA: number;
    /**
     * This is the count of additional potential parent short addresses and their associated LQA.
     * If there are no other potential parents this SHALL indicate 0. This value SHALL not be greater than 5.
     */
    entryCount: number;
    potentialParents: {
        /** The short address for a potential parent that the device can hear a beacon for. */
        nwkAddress: number;
        /** The LQA value of the associated potential parent. */
        lqa: number;
    }[];
};

export type DeviceAuthenticationLevelTLV = {
    /** 64-bit address for the node that is being inquired about. */
    remoteNodeIeee: EUI64;
    /** This indicates the joining method that was used when the device joined the network. */
    initialJoinMethod: InitialJoinMethod;
    /** This indicates what Link Key update method was used to create the current active Link Key. */
    activeLinkKeyType: ActiveLinkKeyType;
};

export type ProcessingStatusTLV = {
    /**
     * indicate the number of Tag ID and Processing Status pairs are present in the full TLV.
     * The count may be zero, indicating that there were no known TLVs in the previous message that could be processed.
     */
    count: number;
    tlvs: {
        /** Indicate a previously received TLV tag ID */
        tagId: number;
        /** The associated status of whether it is processed */
        processingStatus: Status.SUCCESS | Status.INV_REQUESTTYPE | Status.NOT_SUPPORTED;
    }[];
};

export type LocalTLVType =
    | ClearAllBindingsReqEUI64TLV
    | BeaconSurveyConfigurationTLV
    | Curve25519PublicPointTLV
    | AuthenticationTokenIdTLV
    | TargetIEEEAddressTLV
    | SelectedKeyNegotiationMethodTLV
    | DeviceEUI64ListTLV
    | APSFrameCounterChallengeTLV
    | APSFrameCounterResponseTLV
    | BeaconSurveyResultsTLV
    | PotentialParentsTLV
    | DeviceAuthenticationLevelTLV
    | ProcessingStatusTLV;

export type LocalTLVReader = (length: number) => LocalTLVType;

export type TLV = {
    /** 1-byte - 0-63: Local, 64-255: Global */
    tagId: number;
    /**
     * The Length byte encodes the number of bytes in the value field -1.
     * This means that a TLV with length field of 3 is expected to contain 4 bytes of data in the value field.
     *
     * WARNING: This field is assumed to always include the +1 offset, and logic should do the appropriate reversal when writing the actual buffer.
     *
     * 1-byte
     */
    length: number;
    /** Size = ${length + 1} */
    tlv:
        | ManufacturerSpecificGlobalTLV
        | SupportedKeyNegotiationMethodsGlobalTLV
        | PanIdConflictReportGlobalTLV
        | NextPanIdChangeGlobalTLV
        | NextChannelChangeGlobalTLV
        | SymmetricPassphraseGlobalTLV
        | RouterInformationGlobalTLV
        | FragmentationParametersGlobalTLV
        | JoinerEncapsulationGlobalTLV
        | BeaconAppendixEncapsulationGlobalTLV
        | ConfigurationParametersGlobalTLV
        | DeviceCapabilityExtensionGlobalTLV
        | LocalTLVType;
};

export type TLVs = {
    tlvs: TLV[];
};

export interface RequestMap {
    [ZdoClusterId.NETWORK_ADDRESS_REQUEST]: [target: EUI64, reportKids: boolean, childStartIndex: number];
    [ZdoClusterId.IEEE_ADDRESS_REQUEST]: [target: NodeId, reportKids: boolean, childStartIndex: number];
    [ZdoClusterId.NODE_DESCRIPTOR_REQUEST]: [target: NodeId, fragmentationParameters?: FragmentationParametersGlobalTLV];
    [ZdoClusterId.POWER_DESCRIPTOR_REQUEST]: [target: NodeId];
    [ZdoClusterId.SIMPLE_DESCRIPTOR_REQUEST]: [target: NodeId, targetEndpoint: number];
    [ZdoClusterId.ACTIVE_ENDPOINTS_REQUEST]: [target: NodeId];
    [ZdoClusterId.MATCH_DESCRIPTORS_REQUEST]: [target: NodeId, profileId: ProfileId, inClusterList: ClusterId[], outClusterList: ClusterId[]];
    [ZdoClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST]: [serverMask: ServerMask];
    [ZdoClusterId.PARENT_ANNOUNCE]: [children: EUI64[]];
    [ZdoClusterId.BIND_REQUEST]: [
        source: EUI64,
        sourceEndpoint: number,
        clusterId: ClusterId,
        type: number,
        destination: EUI64,
        groupAddress: number,
        destinationEndpoint: number,
    ];
    [ZdoClusterId.UNBIND_REQUEST]: [
        source: EUI64,
        sourceEndpoint: number,
        clusterId: ClusterId,
        type: number,
        destination: EUI64,
        groupAddress: number,
        destinationEndpoint: number,
    ];
    [ZdoClusterId.CLEAR_ALL_BINDINGS_REQUEST]: [tlv: ClearAllBindingsReqEUI64TLV];
    [ZdoClusterId.LQI_TABLE_REQUEST]: [startIndex: number];
    [ZdoClusterId.ROUTING_TABLE_REQUEST]: [startIndex: number];
    [ZdoClusterId.BINDING_TABLE_REQUEST]: [startIndex: number];
    [ZdoClusterId.LEAVE_REQUEST]: [deviceAddress: EUI64, leaveRequestFlags: LeaveRequestFlags];
    [ZdoClusterId.PERMIT_JOINING_REQUEST]: [duration: number, authentication: number, tlvs: TLV[]];
    [ZdoClusterId.NWK_UPDATE_REQUEST]: [
        channels: number[],
        duration: number,
        count: number | undefined,
        nwkUpdateId: number | undefined,
        nwkManagerAddr: number | undefined,
    ];
    [ZdoClusterId.NWK_ENHANCED_UPDATE_REQUEST]: [
        channelPages: number[],
        duration: number,
        count: number | undefined,
        nwkUpdateId: number | undefined,
        nwkManagerAddr: NodeId | undefined,
        configurationBitmask: number | undefined,
    ];
    [ZdoClusterId.NWK_IEEE_JOINING_LIST_REQUEST]: [startIndex: number];
    [ZdoClusterId.NWK_BEACON_SURVEY_REQUEST]: [tlv: BeaconSurveyConfigurationTLV];
    [ZdoClusterId.START_KEY_NEGOTIATION_REQUEST]: [tlv: Curve25519PublicPointTLV];
    [ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_REQUEST]: [tlv: AuthenticationTokenIdTLV];
    [ZdoClusterId.GET_AUTHENTICATION_LEVEL_REQUEST]: [tlv: TargetIEEEAddressTLV];
    [ZdoClusterId.SET_CONFIGURATION_REQUEST]: [
        nextPanIdChange: NextPanIdChangeGlobalTLV,
        nextChannelChange: NextChannelChangeGlobalTLV,
        configurationParameters: ConfigurationParametersGlobalTLV,
    ];
    [ZdoClusterId.GET_CONFIGURATION_REQUEST]: [tlvIds: number[]];
    [ZdoClusterId.START_KEY_UPDATE_REQUEST]: [
        selectedKeyNegotiationMethod: SelectedKeyNegotiationMethodTLV,
        fragmentationParameters: FragmentationParametersGlobalTLV,
    ];
    [ZdoClusterId.DECOMMISSION_REQUEST]: [tlv: DeviceEUI64ListTLV];
    [ZdoClusterId.CHALLENGE_REQUEST]: [tlv: APSFrameCounterChallengeTLV];
}

export type GenericZdoResponse = [Status, unknown | undefined];

export interface ResponseMap {
    [ZdoClusterId.NETWORK_ADDRESS_RESPONSE]: [Status, NetworkAddressResponse | undefined];
    [ZdoClusterId.IEEE_ADDRESS_RESPONSE]: [Status, IEEEAddressResponse | undefined];
    [ZdoClusterId.NODE_DESCRIPTOR_RESPONSE]: [Status, NodeDescriptorResponse | undefined];
    [ZdoClusterId.POWER_DESCRIPTOR_RESPONSE]: [Status, PowerDescriptorResponse | undefined];
    [ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE]: [Status, SimpleDescriptorResponse | undefined];
    [ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE]: [Status, ActiveEndpointsResponse | undefined];
    [ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE]: [Status, MatchDescriptorsResponse | undefined];
    [ZdoClusterId.END_DEVICE_ANNOUNCE]: [Status, EndDeviceAnnounce | undefined];
    [ZdoClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE]: [Status, SystemServerDiscoveryResponse | undefined];
    [ZdoClusterId.PARENT_ANNOUNCE_RESPONSE]: [Status, ParentAnnounceResponse | undefined];
    [ZdoClusterId.BIND_RESPONSE]: [Status, void | undefined];
    [ZdoClusterId.UNBIND_RESPONSE]: [Status, void | undefined];
    [ZdoClusterId.CLEAR_ALL_BINDINGS_RESPONSE]: [Status, void | undefined];
    [ZdoClusterId.LQI_TABLE_RESPONSE]: [Status, LQITableResponse | undefined];
    [ZdoClusterId.ROUTING_TABLE_RESPONSE]: [Status, RoutingTableResponse | undefined];
    [ZdoClusterId.BINDING_TABLE_RESPONSE]: [Status, BindingTableResponse | undefined];
    [ZdoClusterId.LEAVE_RESPONSE]: [Status, void | undefined];
    [ZdoClusterId.PERMIT_JOINING_RESPONSE]: [Status, void | undefined];
    [ZdoClusterId.NWK_UPDATE_RESPONSE]: [Status, NwkUpdateResponse | undefined];
    [ZdoClusterId.NWK_ENHANCED_UPDATE_RESPONSE]: [Status, NwkEnhancedUpdateResponse | undefined];
    [ZdoClusterId.NWK_IEEE_JOINING_LIST_RESPONSE]: [Status, NwkIEEEJoiningListResponse | undefined];
    [ZdoClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE]: [Status, NwkUnsolicitedEnhancedUpdateResponse | undefined];
    [ZdoClusterId.NWK_BEACON_SURVEY_RESPONSE]: [Status, NwkBeaconSurveyResponse | undefined];
    [ZdoClusterId.START_KEY_NEGOTIATION_RESPONSE]: [Status, StartKeyNegotiationResponse | undefined];
    [ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE]: [Status, RetrieveAuthenticationTokenResponse | undefined];
    [ZdoClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE]: [Status, GetAuthenticationLevelResponse | undefined];
    [ZdoClusterId.SET_CONFIGURATION_RESPONSE]: [Status, SetConfigurationResponse | undefined];
    [ZdoClusterId.GET_CONFIGURATION_RESPONSE]: [Status, GetConfigurationResponse | undefined];
    [ZdoClusterId.START_KEY_UPDATE_RESPONSE]: [Status, void | undefined];
    [ZdoClusterId.DECOMMISSION_RESPONSE]: [Status, void | undefined];
    [ZdoClusterId.CHALLENGE_RESPONSE]: [Status, ChallengeResponse | undefined];
    // allow passing number to readResponse() from parsed payload without explicitly converting with `as`
    [key: number]: GenericZdoResponse;
}

export interface ValidResponseMap {
    [ZdoClusterId.NETWORK_ADDRESS_RESPONSE]: [Status.SUCCESS, NetworkAddressResponse];
    [ZdoClusterId.IEEE_ADDRESS_RESPONSE]: [Status.SUCCESS, IEEEAddressResponse];
    [ZdoClusterId.NODE_DESCRIPTOR_RESPONSE]: [Status.SUCCESS, NodeDescriptorResponse];
    [ZdoClusterId.POWER_DESCRIPTOR_RESPONSE]: [Status.SUCCESS, PowerDescriptorResponse];
    [ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE]: [Status.SUCCESS, SimpleDescriptorResponse];
    [ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE]: [Status.SUCCESS, ActiveEndpointsResponse];
    [ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE]: [Status.SUCCESS, MatchDescriptorsResponse];
    [ZdoClusterId.END_DEVICE_ANNOUNCE]: [Status.SUCCESS, EndDeviceAnnounce];
    [ZdoClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE]: [Status.SUCCESS, SystemServerDiscoveryResponse];
    [ZdoClusterId.PARENT_ANNOUNCE_RESPONSE]: [Status.SUCCESS, ParentAnnounceResponse];
    [ZdoClusterId.BIND_RESPONSE]: [Status.SUCCESS, void];
    [ZdoClusterId.UNBIND_RESPONSE]: [Status.SUCCESS, void];
    [ZdoClusterId.CLEAR_ALL_BINDINGS_RESPONSE]: [Status.SUCCESS, void];
    [ZdoClusterId.LQI_TABLE_RESPONSE]: [Status.SUCCESS, LQITableResponse];
    [ZdoClusterId.ROUTING_TABLE_RESPONSE]: [Status.SUCCESS, RoutingTableResponse];
    [ZdoClusterId.BINDING_TABLE_RESPONSE]: [Status.SUCCESS, BindingTableResponse];
    [ZdoClusterId.LEAVE_RESPONSE]: [Status.SUCCESS, void];
    [ZdoClusterId.PERMIT_JOINING_RESPONSE]: [Status.SUCCESS, void];
    [ZdoClusterId.NWK_UPDATE_RESPONSE]: [Status.SUCCESS, NwkUpdateResponse];
    [ZdoClusterId.NWK_ENHANCED_UPDATE_RESPONSE]: [Status.SUCCESS, NwkEnhancedUpdateResponse];
    [ZdoClusterId.NWK_IEEE_JOINING_LIST_RESPONSE]: [Status.SUCCESS, NwkIEEEJoiningListResponse];
    [ZdoClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE]: [Status.SUCCESS, NwkUnsolicitedEnhancedUpdateResponse];
    [ZdoClusterId.NWK_BEACON_SURVEY_RESPONSE]: [Status.SUCCESS, NwkBeaconSurveyResponse];
    [ZdoClusterId.START_KEY_NEGOTIATION_RESPONSE]: [Status.SUCCESS, StartKeyNegotiationResponse];
    [ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE]: [Status.SUCCESS, RetrieveAuthenticationTokenResponse];
    [ZdoClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE]: [Status.SUCCESS, GetAuthenticationLevelResponse];
    [ZdoClusterId.SET_CONFIGURATION_RESPONSE]: [Status.SUCCESS, SetConfigurationResponse];
    [ZdoClusterId.GET_CONFIGURATION_RESPONSE]: [Status.SUCCESS, GetConfigurationResponse];
    [ZdoClusterId.START_KEY_UPDATE_RESPONSE]: [Status.SUCCESS, void];
    [ZdoClusterId.DECOMMISSION_RESPONSE]: [Status.SUCCESS, void];
    [ZdoClusterId.CHALLENGE_RESPONSE]: [Status.SUCCESS, ChallengeResponse];
}

export interface RequestToResponseMap {
    [ZdoClusterId.NETWORK_ADDRESS_REQUEST]: ResponseMap[ZdoClusterId.NETWORK_ADDRESS_RESPONSE];
    [ZdoClusterId.IEEE_ADDRESS_REQUEST]: ResponseMap[ZdoClusterId.IEEE_ADDRESS_RESPONSE];
    [ZdoClusterId.NODE_DESCRIPTOR_REQUEST]: ResponseMap[ZdoClusterId.NODE_DESCRIPTOR_RESPONSE];
    [ZdoClusterId.POWER_DESCRIPTOR_REQUEST]: ResponseMap[ZdoClusterId.POWER_DESCRIPTOR_RESPONSE];
    [ZdoClusterId.SIMPLE_DESCRIPTOR_REQUEST]: ResponseMap[ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE];
    [ZdoClusterId.ACTIVE_ENDPOINTS_REQUEST]: ResponseMap[ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE];
    [ZdoClusterId.MATCH_DESCRIPTORS_REQUEST]: ResponseMap[ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE];
    [ZdoClusterId.SYSTEM_SERVER_DISCOVERY_REQUEST]: ResponseMap[ZdoClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE];
    [ZdoClusterId.PARENT_ANNOUNCE]: ResponseMap[ZdoClusterId.PARENT_ANNOUNCE_RESPONSE];
    [ZdoClusterId.BIND_REQUEST]: ResponseMap[ZdoClusterId.BIND_RESPONSE];
    [ZdoClusterId.UNBIND_REQUEST]: ResponseMap[ZdoClusterId.UNBIND_RESPONSE];
    [ZdoClusterId.CLEAR_ALL_BINDINGS_REQUEST]: ResponseMap[ZdoClusterId.CLEAR_ALL_BINDINGS_RESPONSE];
    [ZdoClusterId.LQI_TABLE_REQUEST]: ResponseMap[ZdoClusterId.LQI_TABLE_RESPONSE];
    [ZdoClusterId.ROUTING_TABLE_REQUEST]: ResponseMap[ZdoClusterId.ROUTING_TABLE_RESPONSE];
    [ZdoClusterId.BINDING_TABLE_REQUEST]: ResponseMap[ZdoClusterId.BINDING_TABLE_RESPONSE];
    [ZdoClusterId.LEAVE_REQUEST]: ResponseMap[ZdoClusterId.LEAVE_RESPONSE];
    [ZdoClusterId.PERMIT_JOINING_REQUEST]: ResponseMap[ZdoClusterId.PERMIT_JOINING_RESPONSE];
    [ZdoClusterId.NWK_UPDATE_REQUEST]: ResponseMap[ZdoClusterId.NWK_UPDATE_RESPONSE];
    [ZdoClusterId.NWK_ENHANCED_UPDATE_REQUEST]: ResponseMap[ZdoClusterId.NWK_ENHANCED_UPDATE_RESPONSE];
    [ZdoClusterId.NWK_IEEE_JOINING_LIST_REQUEST]: ResponseMap[ZdoClusterId.NWK_IEEE_JOINING_LIST_RESPONSE];
    [ZdoClusterId.NWK_BEACON_SURVEY_REQUEST]: ResponseMap[ZdoClusterId.NWK_BEACON_SURVEY_RESPONSE];
    [ZdoClusterId.START_KEY_NEGOTIATION_REQUEST]: ResponseMap[ZdoClusterId.START_KEY_NEGOTIATION_RESPONSE];
    [ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_REQUEST]: ResponseMap[ZdoClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE];
    [ZdoClusterId.GET_AUTHENTICATION_LEVEL_REQUEST]: ResponseMap[ZdoClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE];
    [ZdoClusterId.SET_CONFIGURATION_REQUEST]: ResponseMap[ZdoClusterId.SET_CONFIGURATION_RESPONSE];
    [ZdoClusterId.GET_CONFIGURATION_REQUEST]: ResponseMap[ZdoClusterId.GET_CONFIGURATION_RESPONSE];
    [ZdoClusterId.START_KEY_UPDATE_REQUEST]: ResponseMap[ZdoClusterId.START_KEY_UPDATE_RESPONSE];
    [ZdoClusterId.DECOMMISSION_REQUEST]: ResponseMap[ZdoClusterId.DECOMMISSION_RESPONSE];
    [ZdoClusterId.CHALLENGE_REQUEST]: ResponseMap[ZdoClusterId.CHALLENGE_RESPONSE];
}
