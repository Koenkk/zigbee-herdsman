/* istanbul ignore file */
import {/* Basic Types */
    int8s,
    uint8_t,
    uint16_t,
    uint32_t,
    LVBytes,
    fixed_list,
    WordList,

    /* Named Types */
    EmberRf4ceTxOption,
    EmberRf4ceNodeCapabilities,
    EmberNodeId,
    EmberPanId,
    EmberEUI64,
    EmberLibraryStatus,
    SecureEzspSecurityType,
    SecureEzspSecurityLevel,
    EmberGpSecurityLevel,
    EmberGpKeyType,
    SecureEzspRandomNumber,
    Bool,
    EzspConfigId,
    EzspValueId,
    EzspExtendedValueId,
    EzspPolicyId,
    EzspDecisionId,
    EzspMfgTokenId,
    EzspStatus,
    EmberStatus,
    EmberEventUnits,
    EmberNodeType,
    EmberNetworkStatus,
    EmberIncomingMessageType,
    EmberOutgoingMessageType,
    EmberMacPassthroughType,
    EzspNetworkScanType,
    EmberJoinDecision,
    EmberKeyType,
    EmberDeviceUpdate,
    EmberKeyStatus,
    EmberCounterType,
    EzspZllNetworkOperation,

    /* Structs */
    EmberNetworkParameters,
    EmberZigbeeNetwork,
    EmberApsFrame,
    EmberBindingTableEntry,
    EmberMulticastTableEntry,
    EmberKeyData,
    EmberCertificateData,
    EmberPublicKeyData,
    EmberPrivateKeyData,
    EmberSmacData,
    EmberSignatureData,
    EmberCertificate283k1Data,
    EmberPublicKey283k1Data,
    EmberPrivateKey283k1Data,
    EmberSignature283k1Data,
    EmberMessageDigest,
    EmberAesMmoHashContext,
    EmberNeighborTableEntry,
    EmberRouteTableEntry,
    EmberInitialSecurityState,
    EmberCurrentSecurityState,
    EmberKeyStruct,
    EmberNetworkInitStruct,
    EmberZllNetwork,
    EmberZllInitialSecurityState,
    EmberZllDeviceInfoRecord,
    EmberZllAddressAssignment,
    EmberTokTypeStackZllData,
    EmberTokTypeStackZllSecurity,
    EmberRf4ceVendorInfo,
    EmberRf4ceApplicationInfo,
    EmberRf4cePairingTableEntry,
    EmberGpAddress,
    EmberGpSinkListEntry,
    EmberNodeDescriptor,
    EmberSimpleDescriptor,
    EmberMultiAddress,
    EmberNeighbors,
} from './types';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export const COMMANDS: { [key: string]: [number, any[], any[]] } = {
    "version": [0, [uint8_t],
        [uint8_t, uint8_t, uint16_t]
    ],
    "getConfigurationValue": [82, [EzspConfigId],
        [EzspStatus, uint16_t]
    ],
    "setConfigurationValue": [83, [EzspConfigId, uint16_t],
        [EzspStatus]
    ],
    "addEndpoint": [0x0002, [
        uint8_t,
        uint16_t,
        uint16_t,
        uint8_t,
        uint8_t,
        uint8_t,
        WordList,
        WordList,
    ],
    [EzspStatus],
    ],
    "setPolicy": [85, [EzspPolicyId, EzspDecisionId],
        [EzspStatus]
    ],
    "getPolicy": [86, [EzspPolicyId],
        [EzspStatus, EzspDecisionId]
    ],
    "getValue": [170, [EzspValueId],
        [EzspStatus, LVBytes]
    ],
    "getExtendedValue": [3, [EzspExtendedValueId, uint32_t],
        [EzspStatus, LVBytes]
    ],
    "setValue": [171, [EzspValueId, LVBytes],
        [EzspStatus]
    ],
    "setGpioCurrentConfiguration": [172, [uint8_t, uint8_t, uint8_t],
        [EzspStatus]
    ],
    "setGpioPowerUpDownConfiguration": [173, [uint8_t, uint8_t, uint8_t, uint8_t, uint8_t],
        [EzspStatus]
    ],
    "setGpioRadioPowerMask": [174, [uint32_t],
        []
    ],
    "setCtune": [245, [uint16_t],
        []
    ],
    "getCtune": [246, [],
        [uint16_t]
    ],
    "setChannelMap": [247, [uint8_t, uint8_t],
        []
    ],
    "nop": [5, [],
        []
    ],
    "echo": [129, [LVBytes],
        [LVBytes]
    ],
    "invalidCommand": [88, [],
        [EzspStatus]
    ],
    "callback": [6, [],
        []
    ],
    "noCallbacks": [7, [],
        []
    ],
    "setToken": [9, [uint8_t, fixed_list(8, uint8_t)],
        [EmberStatus]
    ],
    "getToken": [10, [uint8_t],
        [EmberStatus, fixed_list(8, uint8_t)]
    ],
    "getMfgToken": [11, [EzspMfgTokenId],
        [LVBytes]
    ],
    "setMfgToken": [12, [EzspMfgTokenId, LVBytes],
        [EmberStatus]
    ],
    "stackTokenChangedHandler": [13, [],
        [uint16_t]
    ],
    "getRandomNumber": [73, [],
        [EmberStatus, uint16_t]
    ],
    "setTimer": [14, [uint8_t, uint16_t, EmberEventUnits, Bool],
        [EmberStatus]
    ],
    "getTimer": [78, [uint8_t],
        [uint16_t, EmberEventUnits, Bool]
    ],
    "timerHandler": [15, [],
        [uint8_t]
    ],
    "debugWrite": [18, [Bool, LVBytes],
        [EmberStatus]
    ],
    "readAndClearCounters": [101, [],
        [fixed_list(EmberCounterType.COUNTER_TYPE_COUNT, uint16_t)]
    ],
    "readCounters": [241, [],
        [fixed_list(EmberCounterType.COUNTER_TYPE_COUNT, uint16_t)]
    ],
    "counterRolloverHandler": [242, [],
        [EmberCounterType]
    ],
    "delayTest": [157, [uint16_t],
        []
    ],
    "getLibraryStatus": [1, [uint8_t],
        [EmberLibraryStatus]
    ],
    "getXncpInfo": [19, [],
        [EmberStatus, uint16_t, uint16_t]
    ],
    "customFrame": [71, [LVBytes],
        [EmberStatus, LVBytes]
    ],
    "customFrameHandler": [84, [],
        [LVBytes]
    ],
    "getEui64": [38, [],
        [EmberEUI64]
    ],
    "getNodeId": [39, [],
        [EmberNodeId]
    ],
    "networkInit": [23, [],
        [EmberStatus]
    ],
    "setManufacturerCode": [21, [uint16_t],
        []
    ],
    "setPowerDescriptor": [22, [uint16_t],
        []
    ],
    "networkInitExtended": [112, [EmberNetworkInitStruct],
        [EmberStatus]
    ],
    "networkState": [24, [],
        [EmberNetworkStatus]
    ],
    "stackStatusHandler": [25, [],
        [EmberStatus]
    ],
    "startScan": [26, [EzspNetworkScanType, uint32_t, uint8_t],
        [EmberStatus]
    ],
    "energyScanResultHandler": [72, [],
        [uint8_t, int8s]
    ],
    "networkFoundHandler": [27, [],
        [EmberZigbeeNetwork, uint8_t, int8s]
    ],
    "scanCompleteHandler": [28, [],
        [uint8_t, EmberStatus]
    ],
    "stopScan": [29, [],
        [EmberStatus]
    ],
    "formNetwork": [30, [EmberNetworkParameters],
        [EmberStatus]
    ],
    "joinNetwork": [31, [EmberNodeType, EmberNetworkParameters],
        [EmberStatus]
    ],
    "leaveNetwork": [32, [],
        [EmberStatus]
    ],
    "findAndRejoinNetwork": [33, [Bool, uint32_t],
        [EmberStatus]
    ],
    "permitJoining": [34, [uint8_t],
        [EmberStatus]
    ],
    "childJoinHandler": [35, [],
        [uint8_t, Bool, EmberNodeId, EmberEUI64, EmberNodeType]
    ],
    "energyScanRequest": [156, [EmberNodeId, uint32_t, uint8_t, uint16_t],
        [EmberStatus]
    ],
    "getNetworkParameters": [40, [],
        [EmberStatus, EmberNodeType, EmberNetworkParameters]
    ],
    "getParentChildParameters": [41, [],
        [uint8_t, EmberEUI64, EmberNodeId]
    ],
    "getChildData": [74, [uint8_t],
        [EmberStatus, EmberNodeId, EmberEUI64, EmberNodeType]
    ],
    "getNeighbor": [121, [uint8_t],
        [EmberStatus, EmberNeighborTableEntry]
    ],
    "neighborCount": [122, [],
        [uint8_t]
    ],
    "getRouteTableEntry": [123, [uint8_t],
        [EmberStatus, EmberRouteTableEntry]
    ],
    "setRadioPower": [153, [int8s],
        [EmberStatus]
    ],
    "setRadioChannel": [154, [uint8_t],
        [EmberStatus]
    ],
    "setConcentrator": [16, [Bool, uint16_t, uint16_t, uint16_t, uint8_t, uint8_t, uint8_t],
        [EmberStatus]
    ],
    "clearBindingTable": [42, [],
        [EmberStatus]
    ],
    "setBinding": [43, [uint8_t, EmberBindingTableEntry],
        [EmberStatus]
    ],
    "getBinding": [44, [uint8_t],
        [EmberStatus, EmberBindingTableEntry]
    ],
    "deleteBinding": [45, [uint8_t],
        [EmberStatus]
    ],
    "bindingIsActive": [46, [uint8_t],
        [Bool]
    ],
    "getBindingRemoteNodeId": [47, [uint8_t],
        [EmberNodeId]
    ],
    "setBindingRemoteNodeId": [48, [uint8_t],
        []
    ],
    "remoteSetBindingHandler": [49, [],
        [EmberBindingTableEntry]
    ],
    "remoteDeleteBindingHandler": [50, [],
        [uint8_t, EmberStatus]
    ],
    "maximumPayloadLength": [51, [],
        [uint8_t]
    ],
    "sendUnicast": [52, [EmberOutgoingMessageType, EmberNodeId, EmberApsFrame, uint8_t, LVBytes],
        [EmberStatus, uint8_t]
    ],
    "sendBroadcast": [54, [EmberNodeId, EmberApsFrame, uint8_t, uint8_t, LVBytes],
        [EmberStatus, uint8_t]
    ],
    "proxyBroadcast": [55, [EmberNodeId, EmberNodeId, uint8_t, EmberApsFrame, uint8_t, uint8_t, LVBytes],
        [EmberStatus, uint8_t]
    ],
    "sendMulticast": [56, [EmberApsFrame, uint8_t, uint8_t, uint8_t, LVBytes],
        [EmberStatus, uint8_t]
    ],
    "sendReply": [57, [EmberNodeId, EmberApsFrame, LVBytes],
        [EmberStatus]
    ],
    "messageSentHandler": [63, [],
        [EmberOutgoingMessageType, uint16_t, EmberApsFrame, uint8_t, EmberStatus, LVBytes]
    ],
    "sendManyToOneRouteRequest": [65, [uint16_t, uint8_t],
        [EmberStatus]
    ],
    "pollForData": [66, [uint16_t, EmberEventUnits, uint8_t],
        [EmberStatus]
    ],
    "pollCompleteHandler": [67, [],
        [EmberStatus]
    ],
    "pollHandler": [68, [],
        [EmberNodeId]
    ],
    "incomingSenderEui64Handler": [98, [],
        [EmberEUI64]
    ],
    "incomingMessageHandler": [69, [],
        [EmberIncomingMessageType, EmberApsFrame, uint8_t, int8s, EmberNodeId, uint8_t, uint8_t, LVBytes]
    ],
    "incomingRouteRecordHandler": [89, [],
        [EmberNodeId, EmberEUI64, uint8_t, int8s, LVBytes]
    ],
    "incomingManyToOneRouteRequestHandler": [125, [],
        [EmberNodeId, EmberEUI64, uint8_t]
    ],
    "incomingRouteErrorHandler": [128, [],
        [EmberStatus, EmberNodeId]
    ],
    "addressTableEntryIsActive": [91, [uint8_t],
        [Bool]
    ],
    "setAddressTableRemoteEui64": [92, [uint8_t, EmberEUI64],
        [EmberStatus]
    ],
    "setAddressTableRemoteNodeId": [93, [uint8_t, EmberNodeId],
        []
    ],
    "getAddressTableRemoteEui64": [94, [uint8_t],
        [EmberEUI64]
    ],
    "getAddressTableRemoteNodeId": [95, [uint8_t],
        [EmberNodeId]
    ],
    "setExtendedTimeout": [126, [EmberEUI64, Bool],
        []
    ],
    "getExtendedTimeout": [127, [EmberEUI64],
        [Bool]
    ],
    "replaceAddressTableEntry": [130, [uint8_t, EmberEUI64, EmberNodeId, Bool],
        [EmberStatus, EmberEUI64, EmberNodeId, Bool]
    ],
    "lookupNodeIdByEui64": [96, [EmberEUI64],
        [EmberNodeId]
    ],
    "lookupEui64ByNodeId": [97, [EmberNodeId],
        [EmberStatus, EmberEUI64]
    ],
    "getMulticastTableEntry": [99, [uint8_t],
        [EmberMulticastTableEntry]
    ],
    "setMulticastTableEntry": [100, [uint8_t, EmberMulticastTableEntry],
        [EmberStatus]
    ],
    "idConflictHandler": [124, [],
        [EmberNodeId]
    ],
    "sendRawMessage": [150, [LVBytes],
        [EmberStatus]
    ],
    "macPassthroughMessageHandler": [151, [],
        [EmberMacPassthroughType, uint8_t, int8s, LVBytes]
    ],
    "macFilterMatchMessageHandler": [70, [],
        [uint8_t, EmberMacPassthroughType, uint8_t, int8s, LVBytes]
    ],
    "rawTransmitCompleteHandler": [152, [],
        [EmberStatus]
    ],
    "setInitialSecurityState": [104, [EmberInitialSecurityState],
        [EmberStatus]
    ],
    "getCurrentSecurityState": [105, [],
        [EmberStatus, EmberCurrentSecurityState]
    ],
    "getKey": [106, [EmberKeyType],
        [EmberStatus, EmberKeyStruct]
    ],
    "switchNetworkKeyHandler": [110, [],
        [uint8_t]
    ],
    "getKeyTableEntry": [113, [uint8_t],
        [EmberStatus, EmberKeyStruct]
    ],
    "setKeyTableEntry": [114, [uint8_t, EmberEUI64, Bool, EmberKeyData],
        [EmberStatus]
    ],
    "findKeyTableEntry": [117, [EmberEUI64, Bool],
        [uint8_t]
    ],
    "addOrUpdateKeyTableEntry": [102, [EmberEUI64, Bool, EmberKeyData],
        [EmberStatus]
    ],
    "eraseKeyTableEntry": [118, [uint8_t],
        [EmberStatus]
    ],
    "clearKeyTable": [177, [],
        [EmberStatus]
    ],
    "requestLinkKey": [20, [EmberEUI64],
        [EmberStatus]
    ],
    "zigbeeKeyEstablishmentHandler": [155, [],
        [EmberEUI64, EmberKeyStatus]
    ],
    "addTransientLinkKey": [175, [EmberEUI64, EmberKeyData],
        [EmberStatus]
    ],
    "clearTransientLinkKeys": [107, [],
        []
    ],
    "setSecurityKey": [202, [EmberKeyData, SecureEzspSecurityType],
        [EzspStatus]
    ],
    "setSecurityParameters": [203, [SecureEzspSecurityLevel, SecureEzspRandomNumber],
        [EzspStatus, SecureEzspRandomNumber]
    ],
    "resetToFactoryDefaults": [204, [],
        [EzspStatus]
    ],
    "getSecurityKeyStatus": [205, [],
        [EzspStatus, SecureEzspSecurityType]
    ],
    "trustCenterJoinHandler": [36, [],
        [EmberNodeId, EmberEUI64, EmberDeviceUpdate, EmberJoinDecision, EmberNodeId]
    ],
    "broadcastNextNetworkKey": [115, [EmberKeyData],
        [EmberStatus]
    ],
    "broadcastNetworkKeySwitch": [116, [],
        [EmberStatus]
    ],
    "becomeTrustCenter": [119, [EmberKeyData],
        [EmberStatus]
    ],
    "aesMmoHash": [111, [EmberAesMmoHashContext, Bool, LVBytes],
        [EmberStatus, EmberAesMmoHashContext]
    ],
    "removeDevice": [168, [EmberNodeId, EmberEUI64, EmberEUI64],
        [EmberStatus]
    ],
    "unicastNwkKeyUpdate": [169, [EmberNodeId, EmberEUI64, EmberKeyData],
        [EmberStatus]
    ],
    "generateCbkeKeys": [164, [],
        [EmberStatus]
    ],
    "generateCbkeKeysHandler": [158, [],
        [EmberStatus, EmberPublicKeyData]
    ],
    "calculateSmacs": [159, [Bool, EmberCertificateData, EmberPublicKeyData],
        [EmberStatus]
    ],
    "calculateSmacsHandler": [160, [],
        [EmberStatus, EmberSmacData, EmberSmacData]
    ],
    "generateCbkeKeys283k1": [232, [],
        [EmberStatus]
    ],
    "generateCbkeKeysHandler283k1": [233, [],
        [EmberStatus, EmberPublicKey283k1Data]
    ],
    "calculateSmacs283k1": [234, [Bool, EmberCertificate283k1Data, EmberPublicKey283k1Data],
        [EmberStatus]
    ],
    "calculateSmacsHandler283k1": [235, [],
        [EmberStatus, EmberSmacData, EmberSmacData]
    ],
    "clearTemporaryDataMaybeStoreLinkKey": [161, [Bool],
        [EmberStatus]
    ],
    "clearTemporaryDataMaybeStoreLinkKey283k1": [238, [Bool],
        [EmberStatus]
    ],
    "getCertificate": [165, [],
        [EmberStatus, EmberCertificateData]
    ],
    "getCertificate283k1": [236, [],
        [EmberStatus, EmberCertificate283k1Data]
    ],
    "dsaSign": [166, [LVBytes],
        [EmberStatus]
    ],
    "dsaSignHandler": [167, [],
        [EmberStatus, LVBytes]
    ],
    "dsaVerify": [163, [EmberMessageDigest, EmberCertificateData, EmberSignatureData],
        [EmberStatus]
    ],
    "dsaVerifyHandler": [120, [],
        [EmberStatus]
    ],
    "dsaVerify283k1": [176, [EmberMessageDigest, EmberCertificate283k1Data, EmberSignature283k1Data],
        [EmberStatus]
    ],
    "setPreinstalledCbkeData": [162, [EmberPublicKeyData, EmberCertificateData, EmberPrivateKeyData],
        [EmberStatus]
    ],
    "setPreinstalledCbkeData283k1": [237, 
        [EmberPublicKey283k1Data, EmberCertificate283k1Data, EmberPrivateKey283k1Data],
        [EmberStatus]
    ],
    "mfglibStart": [131, [Bool],
        [EmberStatus]
    ],
    "mfglibEnd": [132, [],
        [EmberStatus]
    ],
    "mfglibStartTone": [133, [],
        [EmberStatus]
    ],
    "mfglibStopTone": [134, [],
        [EmberStatus]
    ],
    "mfglibStartStream": [135, [],
        [EmberStatus]
    ],
    "mfglibStopStream": [136, [],
        [EmberStatus]
    ],
    "mfglibSendPacket": [137, [LVBytes],
        [EmberStatus]
    ],
    "mfglibSetChannel": [138, [uint8_t],
        [EmberStatus]
    ],
    "mfglibGetChannel": [139, [],
        [uint8_t]
    ],
    "mfglibSetPower": [140, [uint16_t, int8s],
        [EmberStatus]
    ],
    "mfglibGetPower": [141, [],
        [int8s]
    ],
    "mfglibRxHandler": [142, [],
        [uint8_t, int8s, LVBytes]
    ],
    "launchStandaloneBootloader": [143, [uint8_t],
        [EmberStatus]
    ],
    "sendBootloadMessage": [144, [Bool, EmberEUI64, LVBytes],
        [EmberStatus]
    ],
    "getStandaloneBootloaderVersionPlatMicroPhy": [145, [],
        [uint16_t, uint8_t, uint8_t, uint8_t]
    ],
    "incomingBootloadMessageHandler": [146, [],
        [EmberEUI64, uint8_t, int8s, LVBytes]
    ],
    "bootloadTransmitCompleteHandler": [147, [],
        [EmberStatus, LVBytes]
    ],
    "aesEncrypt": [148, [fixed_list(16, uint8_t), fixed_list(16, uint8_t)],
        [fixed_list(16, uint8_t)]
    ],
    "overrideCurrentChannel": [149, [uint8_t],
        [EmberStatus]
    ],
    "zllNetworkOps": [178, [EmberZllNetwork, EzspZllNetworkOperation, int8s],
        [EmberStatus]
    ],
    "zllSetInitialSecurityState": [179, [EmberKeyData, EmberZllInitialSecurityState],
        [EmberStatus]
    ],
    "zllStartScan": [180, [uint32_t, int8s, EmberNodeType],
        [EmberStatus]
    ],
    "zllSetRxOnWhenIdle": [181, [uint16_t],
        [EmberStatus]
    ],
    "zllNetworkFoundHandler": [182, [],
        [EmberZllNetwork, Bool, EmberZllDeviceInfoRecord, uint8_t, int8s]
    ],
    "zllScanCompleteHandler": [183, [],
        [EmberStatus]
    ],
    "zllAddressAssignmentHandler": [184, [],
        [EmberZllAddressAssignment, uint8_t, int8s]
    ],
    "setLogicalAndRadioChannel": [185, [uint8_t],
        [EmberStatus]
    ],
    "getLogicalChannel": [186, [],
        [uint8_t]
    ],
    "zllTouchLinkTargetHandler": [187, [],
        [EmberZllNetwork]
    ],
    "zllGetTokens": [188, [],
        [EmberTokTypeStackZllData, EmberTokTypeStackZllSecurity]
    ],
    "zllSetDataToken": [189, [EmberTokTypeStackZllData],
        []
    ],
    "zllSetNonZllNetwork": [191, [],
        []
    ],
    "isZllNetwork": [190, [],
        [Bool]
    ],
    "rf4ceSetPairingTableEntry": [208, [uint8_t, EmberRf4cePairingTableEntry],
        [EmberStatus]
    ],
    "rf4ceGetPairingTableEntry": [209, [uint8_t],
        [EmberStatus, EmberRf4cePairingTableEntry]
    ],
    "rf4ceDeletePairingTableEntry": [210, [uint8_t],
        [EmberStatus]
    ],
    "rf4ceKeyUpdate": [211, [uint8_t, EmberKeyData],
        [EmberStatus]
    ],
    "rf4ceSend": [212, [uint8_t, uint8_t, uint16_t, EmberRf4ceTxOption, uint8_t, LVBytes],
        [EmberStatus]
    ],
    "rf4ceIncomingMessageHandler": [213, [],
        [uint8_t, uint8_t, uint16_t, EmberRf4ceTxOption, LVBytes]
    ],
    "rf4ceMessageSentHandler": [214, [],
        [EmberStatus, uint8_t, EmberRf4ceTxOption, uint8_t, uint16_t, uint8_t, LVBytes]
    ],
    "rf4ceStart": [215, [EmberRf4ceNodeCapabilities, EmberRf4ceVendorInfo, int8s],
        [EmberStatus]
    ],
    "rf4ceStop": [216, [],
        [EmberStatus]
    ],
    "rf4ceDiscovery": [217, [EmberPanId, EmberNodeId, uint8_t, uint16_t, LVBytes],
        [EmberStatus]
    ],
    "rf4ceDiscoveryCompleteHandler": [218, [],
        [EmberStatus]
    ],
    "rf4ceDiscoveryRequestHandler": [219, [],
        [EmberEUI64, uint8_t, EmberRf4ceVendorInfo, EmberRf4ceApplicationInfo, uint8_t, uint8_t]
    ],
    "rf4ceDiscoveryResponseHandler": [220, [],
        [Bool, uint8_t, EmberPanId, EmberEUI64, uint8_t, EmberRf4ceVendorInfo, 
            EmberRf4ceApplicationInfo, uint8_t, uint8_t]
    ],
    "rf4ceEnableAutoDiscoveryResponse": [221, [uint16_t],
        [EmberStatus]
    ],
    "rf4ceAutoDiscoveryResponseCompleteHandler": [222, [],
        [EmberStatus, EmberEUI64, uint8_t, EmberRf4ceVendorInfo, EmberRf4ceApplicationInfo, uint8_t]
    ],
    "rf4cePair": [223, [uint8_t, EmberPanId, EmberEUI64, uint8_t],
        [EmberStatus]
    ],
    "rf4cePairCompleteHandler": [224, [],
        [EmberStatus, uint8_t, EmberRf4ceVendorInfo, EmberRf4ceApplicationInfo]
    ],
    "rf4cePairRequestHandler": [225, [],
        [EmberStatus, uint8_t, EmberEUI64, uint8_t, EmberRf4ceVendorInfo, EmberRf4ceApplicationInfo, uint8_t]
    ],
    "rf4ceUnpair": [226, [uint8_t],
        [EmberStatus]
    ],
    "rf4ceUnpairHandler": [227, [],
        [uint8_t]
    ],
    "rf4ceUnpairCompleteHandler": [228, [],
        [uint8_t]
    ],
    "rf4ceSetPowerSavingParameters": [229, [uint32_t, uint32_t],
        [EmberStatus]
    ],
    "rf4ceSetFrequencyAgilityParameters": [230, [uint8_t, uint8_t, int8s, uint16_t, uint8_t],
        [EmberStatus]
    ],
    "rf4ceSetApplicationInfo": [231, [EmberRf4ceApplicationInfo],
        [EmberStatus]
    ],
    "rf4ceGetApplicationInfo": [239, [],
        [EmberStatus, EmberRf4ceApplicationInfo]
    ],
    "rf4ceGetMaxPayload": [243, [uint8_t, EmberRf4ceTxOption],
        [uint8_t]
    ],
    "rf4ceGetNetworkParameters": [244, [],
        [EmberStatus, EmberNodeType, EmberNetworkParameters]
    ],
    "gpProxyTableProcessGpPairing": [201, 
        [uint32_t, EmberGpAddress, uint8_t, uint16_t, uint16_t, uint16_t, 
            fixed_list(8, uint8_t), EmberKeyData],
        []
    ],
    "dGpSend": [198, [Bool, Bool, EmberGpAddress, uint8_t, LVBytes, uint8_t, uint16_t],
        [EmberStatus]
    ],
    "dGpSentHandler": [199, [],
        [EmberStatus, uint8_t]
    ],
    "gpepIncomingMessageHandler": [197, [],
        [EmberStatus, uint8_t, uint8_t, EmberGpAddress, EmberGpSecurityLevel, EmberGpKeyType, 
            Bool, Bool, uint32_t, uint8_t, uint32_t, EmberGpSinkListEntry, LVBytes]
    ],
    "changeSourceRouteHandler": [196, [], [EmberNodeId, EmberNodeId]], //Bool
    "setSourceRouteDiscoveryMode": [0x005A, [uint8_t,], [uint32_t,]],
};

//// EmberZDOCmd
/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export const ZDO_COMMANDS: { [key: string]: [number, any[], any[]] } = {
    "Node_Desc_req": [0x0002, [uint8_t, EmberNodeId], [EmberStatus]],
    "Node_Desc_rsp": [0x8002, [uint8_t, EmberStatus, EmberNodeId, EmberNodeDescriptor], []],
    "Simple_Desc_req": [0x0004, [uint8_t, EmberNodeId, uint8_t], [EmberStatus]],
    "Simple_Desc_rsp": [0x8004, [uint8_t, EmberStatus, EmberNodeId, uint8_t, EmberSimpleDescriptor], []],
    "Active_EP_req": [0x0005, [uint8_t, EmberNodeId], [EmberStatus]],
    "Active_EP_rsp": [0x8005, [EmberStatus, uint8_t, EmberNodeId, LVBytes], []],
    "Bind_req": [0x0021, [uint8_t, EmberEUI64, uint8_t, uint16_t, EmberMultiAddress], [EmberStatus]],
    "Bind_rsp": [0x8021, [EmberStatus], []],
    "Unbind_req": [0x0022, [uint8_t, EmberEUI64, uint8_t, uint16_t, EmberMultiAddress], [EmberStatus]],
    "Unbind_rsp": [0x8022, [EmberStatus], []],
    "Mgmt_Leave_req": [0x0034, [uint8_t, EmberEUI64, uint8_t], [EmberStatus]],
    "Mgmt_Leave_rsp": [0x8034, [EmberStatus], []],
    "Mgmt_Lqi_req": [0x0031, [uint8_t, uint8_t], [EmberStatus]],
    "Mgmt_Lqi_rsp": [0x8031, [uint8_t, EmberStatus, EmberNeighbors], [EmberStatus]],
};
