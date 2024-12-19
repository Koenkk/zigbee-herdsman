/* v8 ignore start */

import {
    Bool,
    EmberAesMmoHashContext,
    EmberApsFrame,
    EmberBindingTableEntry,
    EmberCertificate283k1Data,
    EmberCertificateData,
    EmberCounterType,
    EmberCurrentSecurityState,
    EmberDeviceUpdate,
    EmberEUI64,
    EmberEventUnits,
    EmberGpAddress,
    EmberGpKeyType,
    EmberGpSecurityLevel,
    EmberIncomingMessageType,
    EmberInitialSecurityState,
    EmberJoinDecision,
    EmberKeyData,
    EmberKeyStatus,
    EmberKeyStruct,
    EmberKeyType,
    EmberLibraryStatus,
    EmberMacPassthroughType,
    EmberMessageDigest,
    EmberMultiAddress,
    EmberMulticastTableEntry,
    EmberNeighbors,
    EmberNeighborTableEntry,
    EmberNetworkInitStruct /* Structs */,
    EmberNetworkParameters,
    EmberNetworkStatus,
    EmberNodeDescriptor /* Named Types */,
    EmberNodeId,
    EmberNodeType,
    EmberOutgoingMessageType,
    EmberPanId,
    EmberPrivateKeyData,
    EmberPublicKey283k1Data,
    EmberPublicKeyData,
    EmberRouteTableEntry,
    EmberRoutingTable,
    EmberSecurityManagerContext,
    EmberSecurityManagerNetworkKeyInfo,
    EmberSignature283k1Data,
    EmberSignatureData,
    EmberSimpleDescriptor,
    EmberSmacData,
    EmberStackError,
    EmberStatus,
    EmberTokTypeStackZllData,
    EmberTokTypeStackZllSecurity,
    EmberZigbeeNetwork,
    EmberZllAddressAssignment,
    EmberZllDeviceInfoRecord,
    EmberZllInitialSecurityState,
    EmberZllNetwork,
    EzspConfigId,
    EzspDecisionId,
    EzspExtendedValueId,
    EzspMfgTokenId,
    EzspNetworkScanType,
    EzspPolicyId,
    EzspStatus,
    EzspValueId,
    EzspZllNetworkOperation,
    fixed_list /* Basic Types */,
    int8s,
    LVBytes,
    SecureEzspRandomNumber,
    SecureEzspSecurityLevel,
    SecureEzspSecurityType,
    SLStatus,
    uint8_t,
    uint16_t,
    uint32_t,
    WordList,
} from './types';

export interface ParamsDesc {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
    [s: string]: any;
}

export interface EZSPFrameDesc {
    ID: number;
    request?: ParamsDesc;
    response?: ParamsDesc;
    minV?: number;
    maxV?: number;
}

export const FRAMES: {[key: string]: EZSPFrameDesc} = {
    // Configuration Frames
    version: {
        ID: 0x0000,
        request: {
            desiredProtocolVersion: uint8_t,
        },
        response: {
            protocolVersion: uint8_t,
            stackType: uint8_t,
            stackVersion: uint16_t,
        },
    },
    getConfigurationValue: {
        ID: 0x0052, // 82
        request: {
            configId: EzspConfigId,
        },
        response: {
            status: EzspStatus,
            value: uint16_t,
        },
    },
    setConfigurationValue: {
        ID: 0x0053, // 83
        request: {
            configId: EzspConfigId,
            value: uint16_t,
        },
        response: {
            status: EzspStatus,
        },
    },
    addEndpoint: {
        ID: 0x0002,
        request: {
            endpoint: uint8_t,
            profileId: uint16_t,
            deviceId: uint16_t,
            appFlags: uint8_t,
            inputClusterCount: uint8_t,
            outputClusterCount: uint8_t,
            inputClusterList: WordList,
            outputClusterList: WordList,
        },
        response: {
            status: EzspStatus,
        },
    },
    setPolicy: {
        ID: 0x0055, //85
        request: {
            policyId: EzspPolicyId,
            decisionId: EzspDecisionId,
        },
        response: {
            status: EzspStatus,
        },
    },
    getPolicy: {
        ID: 0x0056, //86
        request: {
            policyId: EzspPolicyId,
        },
        response: {
            status: EzspStatus,
            decisionId: EzspDecisionId,
        },
    },
    sendPanIdUpdate: {
        ID: 0x0057, //87
        request: {
            newPan: EmberPanId,
        },
        response: {
            status: Bool,
        },
    },
    getValue: {
        ID: 0x00aa, // 170
        request: {
            valueId: EzspValueId,
        },
        response: {
            status: EzspStatus,
            value: LVBytes,
        },
    },
    getExtendedValue: {
        ID: 0x0003,
        request: {
            valueId: EzspExtendedValueId,
            characteristics: uint32_t,
        },
        response: {
            status: EzspStatus,
            value: LVBytes,
        },
    },
    setValue: {
        ID: 0x00ab, // 171
        request: {
            valueId: EzspValueId,
            value: LVBytes,
        },
        response: {
            status: EzspStatus,
        },
    },

    // Utilities Frames
    nop: {
        ID: 0x0005,
        request: undefined,
        response: undefined,
    },
    echo: {
        ID: 0x0081, // 129
        request: {
            data: LVBytes,
        },
        response: {
            echo: LVBytes,
        },
    },
    invalidCommand: {
        ID: 0x0058, // 88
        request: undefined,
        response: {
            reason: EzspStatus,
        },
    },
    callback: {
        ID: 0x0006,
        request: undefined,
        response: undefined,
    },
    noCallbacks: {
        ID: 0x0007,
        request: undefined,
        response: undefined,
    },
    setToken: {
        ID: 0x0009,
        request: {
            tokenId: uint8_t,
            tokenData: fixed_list(8, uint8_t),
        },
        response: {
            status: EmberStatus,
        },
    },
    getToken: {
        ID: 0x000a, // 10
        request: {
            tokenId: uint8_t,
        },
        response: {
            status: EmberStatus,
            tokenData: fixed_list(8, uint8_t),
        },
    },
    getMfgToken: {
        ID: 0x000b, // 11
        request: {
            tokenId: EzspMfgTokenId,
        },
        response: {
            status: EmberStatus,
            tokenData: LVBytes,
        },
    },
    setMfgToken: {
        ID: 0x000c, // 12
        request: {
            tokenId: EzspMfgTokenId,
            tokenData: LVBytes,
        },
        response: {
            status: EmberStatus,
        },
    },
    stackTokenChangedHandler: {
        ID: 0x000d, // 13
        request: undefined,
        response: {
            tokenAddress: uint16_t,
        },
    },
    getRandomNumber: {
        ID: 0x0049, // 73
        request: undefined,
        response: {
            status: EmberStatus,
            value: uint16_t,
        },
    },
    setTimer: {
        ID: 0x000e, // 14
        request: {
            timerId: uint8_t,
            time: uint16_t,
            units: EmberEventUnits,
            repeat: Bool,
        },
        response: {
            status: EmberStatus,
        },
    },
    getTimer: {
        ID: 0x004e, // 78
        request: {
            timerId: uint8_t,
        },
        response: {
            time: uint16_t,
            units: EmberEventUnits,
            repeat: Bool,
        },
    },
    timerHandler: {
        ID: 0x000f, // 15
        request: undefined,
        response: {
            timerId: uint8_t,
        },
    },
    debugWrite: {
        ID: 0x0012, // 18
        request: {
            binaryMessage: Bool,
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
        },
    },
    readAndClearCounters: {
        ID: 0x0065, // 101
        request: undefined,
        response: {
            values: fixed_list(EmberCounterType.COUNTER_TYPE_COUNT, uint16_t),
        },
    },
    readCounters: {
        ID: 0x00f1, // 241
        request: undefined,
        response: {
            values: fixed_list(EmberCounterType.COUNTER_TYPE_COUNT, uint16_t),
        },
    },
    counterRolloverHandler: {
        ID: 0x00f2, // 242
        request: undefined,
        response: {
            type: EmberCounterType,
        },
    },
    delayTest: {
        ID: 0x009d, // 157
        request: {
            delay: uint16_t,
        },
        response: undefined,
    },
    getLibraryStatus: {
        ID: 0x0001,
        request: {
            libraryId: uint8_t,
        },
        response: {
            status: EmberLibraryStatus,
        },
    },
    getXncpInfo: {
        ID: 0x0013, // 19
        request: undefined,
        response: {
            status: EmberStatus,
            manufacturerId: uint16_t,
            versionNumber: uint16_t,
        },
    },
    customFrame: {
        ID: 0x0047, // 71
        request: {
            payload: LVBytes,
        },
        response: {
            status: EmberStatus,
            reply: LVBytes,
        },
    },
    customFrameHandler: {
        ID: 0x0054, // 84
        request: undefined,
        response: {
            payload: LVBytes,
        },
    },
    getEui64: {
        ID: 0x0026, // 38
        request: undefined,
        response: {
            eui64: EmberEUI64,
        },
    },
    getNodeId: {
        ID: 0x0027, // 39
        request: undefined,
        response: {
            nodeId: EmberNodeId,
        },
    },

    // Networking Frames
    setManufacturerCode: {
        ID: 0x0015, // 21
        request: {
            code: uint16_t,
        },
        response: undefined,
    },
    setPowerDescriptor: {
        ID: 0x0016, // 22
        request: {
            descriptor: uint16_t,
        },
        response: undefined,
    },
    networkInit: {
        ID: 0x0017, // 23
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    networkInitExtended: {
        ID: 112,
        request: {
            networkInitStruct: EmberNetworkInitStruct,
        },
        response: {
            status: EmberStatus,
        },
    },
    networkState: {
        ID: 0x0018, // 24
        request: undefined,
        response: {
            status: EmberNetworkStatus,
        },
    },
    stackStatusHandler: {
        ID: 0x0019, // 25
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    startScan: {
        ID: 0x001a, // 26
        request: {
            scanType: EzspNetworkScanType,
            channelMask: uint32_t,
            duration: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    energyScanResultHandler: {
        ID: 0x0048, // 72
        request: undefined,
        response: {
            channel: uint8_t,
            maxRssiValue: int8s,
        },
    },
    networkFoundHandler: {
        ID: 0x001b, // 27
        request: undefined,
        response: {
            networkFound: EmberZigbeeNetwork,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
        },
    },
    scanCompleteHandler: {
        ID: 0x001c, // 28
        request: undefined,
        response: {
            channel: uint8_t,
            status: EmberStatus,
        },
    },
    unusedPanIdFoundHandler: {
        ID: 0x00d2,
        request: undefined,
        response: {
            panId: EmberPanId,
            channel: uint8_t,
        },
    },
    findUnusedPanId: {
        ID: 0x00d3,
        request: {
            channelMask: uint32_t,
            duration: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    stopScan: {
        ID: 0x001d, // 29
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    formNetwork: {
        ID: 0x001e, // 30
        request: {
            parameters: EmberNetworkParameters,
        },
        response: {
            status: EmberStatus,
        },
    },
    joinNetwork: {
        ID: 0x001f, // 31
        request: {
            nodeType: EmberNodeType,
            parameters: EmberNetworkParameters,
        },
        response: {
            status: EmberStatus,
        },
    },
    // joinNetworkDirectly: {
    //     ID: 0x003B,
    //     request: {
    //         localNodeType: EmberNodeType,
    //         beacon: EmberBeaconData,
    //         radioTxPower: int8s,
    //         clearBeaconsAfterNetworkUp: Bool
    //     },
    //     response: {
    //         status: EmberStatus
    //     },
    // },
    leaveNetwork: {
        ID: 0x0020, // 32
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    findAndRejoinNetwork: {
        ID: 0x0021, // 33
        request: {
            haveCurrentNetworkKey: Bool,
            channelMask: uint32_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    permitJoining: {
        ID: 0x0022, // 34
        request: {
            duration: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    childJoinHandler: {
        ID: 0x0023, // 35
        request: undefined,
        response: {
            index: uint8_t,
            joining: Bool,
            childId: EmberNodeId,
            childEui64: EmberEUI64,
            childType: EmberNodeType,
        },
    },
    energyScanRequest: {
        ID: 0x009c, // 156
        request: {
            target: EmberNodeId,
            scanChannels: uint32_t,
            scanDuration: uint8_t,
            scanCount: uint16_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    getNetworkParameters: {
        ID: 0x0028, // 40
        request: undefined,
        response: {
            status: EmberStatus,
            nodeType: EmberNodeType,
            parameters: EmberNetworkParameters,
        },
    },
    getRadioParameters: {
        ID: 0x00fd,
        request: {
            childCount: uint8_t,
        },
        response: {
            status: EmberStatus,
            nodeType: EmberNodeType,
            parameters: EmberNetworkParameters,
        },
    },
    getParentChildParameters: {
        ID: 0x0029, // 41
        request: undefined,
        response: {
            childCount: uint8_t,
            parentEui64: EmberEUI64,
            parentNodeId: EmberNodeId,
        },
    },
    getChildData: {
        ID: 0x004a, // 74
        request: {
            index: uint8_t,
        },
        response: {
            status: EmberStatus,
            nodeId: EmberNodeId,
            eui64: EmberEUI64,
            nodeType: EmberNodeType,
        },
    },
    getNeighbor: {
        ID: 0x0079, // 121
        request: {
            index: uint8_t,
        },
        response: {
            status: EmberStatus,
            value: EmberNeighborTableEntry,
        },
    },
    neighborCount: {
        ID: 0x007a, // 122
        request: undefined,
        response: {
            value: uint8_t,
        },
    },
    getRouteTableEntry: {
        ID: 0x007b, // 123
        request: {
            index: uint8_t,
        },
        response: {
            status: EmberStatus,
            value: EmberRouteTableEntry,
        },
    },
    setRadioPower: {
        ID: 0x0099, // 153
        request: {
            power: int8s,
        },
        response: {
            status: EmberStatus,
        },
    },
    setRadioChannel: {
        ID: 0x009a, // 154
        request: {
            channel: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    setConcentrator: {
        ID: 0x0010, // 16
        request: {
            on: Bool,
            concentratorType: uint16_t,
            minTime: uint16_t,
            maxTime: uint16_t,
            routeErrorThreshold: uint8_t,
            deliveryFailureThreshold: uint8_t,
            maxHops: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },

    // Binding Frames
    clearBindingTable: {
        ID: 0x002a, // 42
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    setBinding: {
        ID: 0x002b, // 43
        request: {
            index: uint8_t,
            value: EmberBindingTableEntry,
        },
        response: {
            status: EmberStatus,
        },
    },
    getBinding: {
        ID: 0x002c, // 44
        request: {
            index: uint8_t,
        },
        response: {
            status: EmberStatus,
            value: EmberBindingTableEntry,
        },
    },
    deleteBinding: {
        ID: 0x002d, // 45
        request: {
            index: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    bindingIsActive: {
        ID: 0x002e, // 46
        request: {
            index: uint8_t,
        },
        response: {
            active: Bool,
        },
    },
    getBindingRemoteNodeId: {
        ID: 0x002f, // 47
        request: {
            index: uint8_t,
        },
        response: {
            nodeId: EmberNodeId,
        },
    },
    setBindingRemoteNodeId: {
        ID: 0x0030, // 48
        request: {
            index: uint8_t,
            nodeId: EmberNodeId,
        },
        response: undefined,
    },
    remoteSetBindingHandler: {
        ID: 0x0031, // 49
        request: undefined,
        response: {
            entry: EmberBindingTableEntry,
            index: uint8_t,
            policyDecision: EmberStatus,
        },
    },
    remoteDeleteBindingHandler: {
        ID: 0x0032, // 50
        request: undefined,
        response: {
            index: uint8_t,
            policyDecision: EmberStatus,
        },
    },

    // Messaging Frames
    maximumPayloadLength: {
        ID: 0x0033, // 51
        request: undefined,
        response: {
            apsLength: uint8_t,
        },
    },
    sendUnicast: {
        ID: 0x0034, // 52
        request: {
            type: EmberOutgoingMessageType,
            indexOrDestination: EmberNodeId,
            apsFrame: EmberApsFrame,
            messageTag: uint8_t,
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
            sequence: uint8_t,
        },
    },
    sendBroadcast: {
        ID: 0x0036, // 54
        request: {
            destination: EmberNodeId,
            apsFrame: EmberApsFrame,
            radius: uint8_t,
            messageTag: uint8_t,
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
            sequence: uint8_t,
        },
    },
    proxyBroadcast: {
        ID: 0x0037, // 55
        request: {
            source: EmberNodeId,
            destination: EmberNodeId,
            nwkSequence: uint8_t,
            apsFrame: EmberApsFrame,
            radius: uint8_t,
            messageTag: uint8_t,
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
            apsSequence: uint8_t,
        },
    },
    sendMulticast: {
        ID: 0x0038, // 56
        request: {
            apsFrame: EmberApsFrame,
            hops: uint8_t,
            nonmemberRadius: uint8_t,
            messageTag: uint8_t,
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
            sequence: uint8_t,
        },
    },
    sendMulticastWithAlias: {
        ID: 0x003a,
        request: {
            apsFrame: EmberApsFrame,
            hops: uint8_t,
            nonmemberRadius: uint8_t,
            alias: uint16_t,
            nwkSequence: uint8_t,
            messageTag: uint8_t,
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
            sequence: uint8_t,
        },
    },
    sendReply: {
        ID: 0x0039, // 57
        request: {
            sender: EmberNodeId,
            apsFrame: EmberApsFrame,
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
        },
    },
    messageSentHandler: {
        ID: 0x003f, // 63
        request: undefined,
        response: {
            type: EmberOutgoingMessageType,
            indexOrDestination: uint16_t,
            apsFrame: EmberApsFrame,
            messageTag: uint8_t,
            status: EmberStatus,
            message: LVBytes,
        },
    },
    sendManyToOneRouteRequest: {
        ID: 0x0041, // 65
        request: {
            concentratorType: uint16_t,
            radius: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    pollForData: {
        ID: 0x0042, // 66
        request: {
            interval: uint16_t,
            units: EmberEventUnits,
            failureLimit: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    pollCompleteHandler: {
        ID: 0x0043, // 67
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    pollHandler: {
        ID: 0x0044, // 68
        request: undefined,
        response: {
            childId: EmberNodeId,
        },
    },
    incomingSenderEui64Handler: {
        ID: 0x0062, // 98
        request: undefined,
        response: {
            senderEui64: EmberEUI64,
        },
    },
    incomingMessageHandler: {
        ID: 0x0045, // 69
        request: undefined,
        response: {
            type: EmberIncomingMessageType,
            apsFrame: EmberApsFrame,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            sender: EmberNodeId,
            bindingIndex: uint8_t,
            addressIndex: uint8_t,
            message: LVBytes,
        },
    },
    incomingRouteRecordHandler: {
        ID: 0x0059, // 89
        request: undefined,
        response: {
            source: EmberNodeId,
            longId: EmberEUI64,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            relay: LVBytes,
        },
    },
    incomingManyToOneRouteRequestHandler: {
        ID: 0x007d, // 125
        request: undefined,
        response: {
            source: EmberNodeId,
            longId: EmberEUI64,
            cost: uint8_t,
        },
    },
    incomingRouteErrorHandler: {
        ID: 0x0080, // 128
        request: undefined,
        response: {
            status: EmberStatus,
            target: EmberNodeId,
        },
    },
    unicastCurrentNetworkKey: {
        ID: 0x0050,
        request: {
            targetShort: EmberNodeId,
            targetLong: EmberEUI64,
            parentShortId: EmberNodeId,
        },
        response: {
            status: EmberStatus,
        },
    },
    addressTableEntryIsActive: {
        ID: 0x005b, // 91
        request: {
            addressTableIndex: uint8_t,
        },
        response: {
            active: Bool,
        },
    },
    setAddressTableRemoteEui64: {
        ID: 0x005c, // 92
        request: {
            addressTableIndex: uint8_t,
            eui64: EmberEUI64,
        },
        response: {
            status: EmberStatus,
        },
    },
    setAddressTableRemoteNodeId: {
        ID: 0x005d, // 93
        request: {
            addressTableIndex: uint8_t,
            id: EmberNodeId,
        },
        response: undefined,
    },
    getAddressTableRemoteEui64: {
        ID: 0x005e, // 94
        request: {
            addressTableIndex: uint8_t,
        },
        response: {
            eui64: EmberEUI64,
        },
    },
    getAddressTableRemoteNodeId: {
        ID: 0x005f, // 95
        request: {
            addressTableIndex: uint8_t,
        },
        response: {
            nodeId: EmberNodeId,
        },
    },
    setExtendedTimeout: {
        ID: 0x007e, // 126
        request: {
            remoteEui64: EmberEUI64,
            extendedTimeout: Bool,
        },
        response: undefined,
    },
    getExtendedTimeout: {
        ID: 0x007f, // 127,
        request: {
            remoteEui64: EmberEUI64,
        },
        response: {
            extendedTimeout: Bool,
        },
    },
    replaceAddressTableEntry: {
        ID: 0x0082, // 130
        request: {
            addressTableIndex: uint8_t,
            newEui64: EmberEUI64,
            newId: EmberNodeId,
            newExtendedTimeout: Bool,
        },
        response: {
            status: EmberStatus,
            oldEui64: EmberEUI64,
            oldId: EmberNodeId,
            oldExtendedTimeout: Bool,
        },
    },
    lookupNodeIdByEui64: {
        ID: 0x0060, // 96
        request: {
            eui64: EmberEUI64,
        },
        response: {
            nodeId: EmberNodeId,
        },
    },
    lookupEui64ByNodeId: {
        ID: 0x0061, // 97
        request: {
            nodeId: EmberNodeId,
        },
        response: {
            status: EmberStatus,
            eui64: EmberEUI64,
        },
    },
    getMulticastTableEntry: {
        ID: 0x0063, // 99
        request: {
            index: uint8_t,
        },
        response: {
            value: EmberMulticastTableEntry,
        },
    },
    setMulticastTableEntry: {
        ID: 0x0064, // 100
        request: {
            index: uint8_t,
            value: EmberMulticastTableEntry,
        },
        response: {
            status: EmberStatus,
        },
    },
    idConflictHandler: {
        ID: 0x007c, // 124
        request: undefined,
        response: {
            id: EmberNodeId,
        },
    },
    writeNodeData: {
        ID: 0x00fe,
        request: {
            erase: Bool,
        },
        response: {
            status: EmberStatus,
        },
    },
    sendRawMessage: {
        ID: 0x0096, // 150
        request: {
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
        },
    },
    sendRawMessageExtended: {
        ID: 0x0051,
        request: {
            message: LVBytes,
            priority: uint8_t,
            useCca: Bool,
        },
        response: {
            status: EmberStatus,
        },
    },
    macPassthroughMessageHandler: {
        ID: 0x0097, // 151
        request: undefined,
        response: {
            messageType: EmberMacPassthroughType,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            message: LVBytes,
        },
    },
    macFilterMatchMessageHandler: {
        ID: 0x0046, // 70
        request: undefined,
        response: {
            filterIndexMatch: uint8_t,
            legacyPassthroughType: EmberMacPassthroughType,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            message: LVBytes,
        },
    },
    rawTransmitCompleteHandler: {
        ID: 0x0098, // 152
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },

    // Security Frames
    setInitialSecurityState: {
        ID: 0x0068, // 104
        request: {
            state: EmberInitialSecurityState,
        },
        response: {
            success: EmberStatus,
        },
    },
    getCurrentSecurityState: {
        ID: 0x0069, // 105
        request: undefined,
        response: {
            status: EmberStatus,
            state: EmberCurrentSecurityState,
        },
    },
    getKey: {
        ID: 0x006a, // 106
        request: {
            keyType: EmberKeyType,
        },
        response: {
            status: EmberStatus,
            keyStruct: EmberKeyStruct,
        },
    },
    exportKey: {
        ID: 0x0114,
        request: {
            context: EmberSecurityManagerContext,
        },
        response: {
            keyData: EmberKeyData,
            status: SLStatus,
        },
    },
    getNetworkKeyInfo: {
        ID: 0x0116,
        request: undefined,
        response: {
            status: SLStatus,
            networkKeyInfo: EmberSecurityManagerNetworkKeyInfo,
        },
    },
    switchNetworkKeyHandler: {
        ID: 0x006e, // 110
        request: undefined,
        response: {
            sequenceNumber: uint8_t,
        },
    },
    getKeyTableEntry: {
        ID: 0x0071, // 113
        request: {
            index: uint8_t,
        },
        response: {
            status: EmberStatus,
            keyStruct: EmberKeyStruct,
        },
    },
    setKeyTableEntry: {
        ID: 0x0072, // 114
        request: {
            index: uint8_t,
            address: EmberEUI64,
            linkKey: Bool,
            keyData: EmberKeyData,
        },
        response: {
            status: EmberStatus,
        },
    },
    findKeyTableEntry: {
        ID: 0x0075, // 117
        request: {
            address: EmberEUI64,
            linkKey: Bool,
        },
        response: {
            index: uint8_t,
        },
    },
    addOrUpdateKeyTableEntry: {
        ID: 0x0066, // 102
        request: {
            address: EmberEUI64,
            linkKey: Bool,
            keyData: EmberKeyData,
        },
        response: {
            status: EmberStatus,
        },
    },
    sendTrustCenterLinkKey: {
        ID: 0x0067,
        request: {
            destinationNodeId: EmberNodeId,
            destinationEui64: EmberEUI64,
        },
        response: {
            status: EmberStatus,
        },
    },
    eraseKeyTableEntry: {
        ID: 0x0076, // 118
        request: {
            index: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    clearKeyTable: {
        ID: 0x00b1, // 177
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    requestLinkKey: {
        ID: 0x0014, // 20
        request: {
            partner: EmberEUI64,
        },
        response: {
            status: EmberStatus,
        },
    },
    updateTcLinkKey: {
        ID: 0x006c,
        request: {
            maxAttempts: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    zigbeeKeyEstablishmentHandler: {
        ID: 0x009b, // 155
        request: undefined,
        response: {
            partner: EmberEUI64,
            status: EmberKeyStatus,
        },
    },
    addTransientLinkKey: {
        ID: 0x00af, // 175
        request: {
            partner: EmberEUI64,
            transientKey: EmberKeyData,
        },
        response: {
            status: EmberStatus,
        },
    },
    importTransientKey: {
        ID: 0x0111,
        request: {
            partner: EmberEUI64,
            transientKey: EmberKeyData,
            flags: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    clearTransientLinkKeys: {
        ID: 0x006b, // 107
        request: undefined,
        response: undefined,
    },
    // getTransientLinkKey: {
    //     ID: 0x00CE,
    //     request: {
    //         eui: EmberEUI64
    //     },
    //     response: {
    //         status: EmberStatus,
    //         transientKeyData: EmberTransientKeyData
    //     },
    // },

    // Secure EZSP Frames
    setSecurityKey: {
        ID: 0x00ca, // 202
        request: {
            key: EmberKeyData,
            securityType: SecureEzspSecurityType,
        },
        response: {
            status: EzspStatus,
        },
    },
    setSecurityParameters: {
        ID: 0x00cb, // 203
        request: {
            securityLevel: SecureEzspSecurityLevel,
            hostRandomNumber: SecureEzspRandomNumber,
        },
        response: {
            status: EzspStatus,
            returnNcpRandomNumber: SecureEzspRandomNumber,
        },
    },
    resetToFactoryDefaults: {
        ID: 0x00cc, // 204
        request: undefined,
        response: {
            status: EzspStatus,
        },
    },
    getSecurityKeyStatus: {
        ID: 0x00cd, // 205
        request: undefined,
        response: {
            status: EzspStatus,
            returnSecurityType: SecureEzspSecurityType,
        },
    },

    // Trust Center Frames
    trustCenterJoinHandler: {
        ID: 0x0024, // 36
        request: undefined,
        response: {
            newNodeId: EmberNodeId,
            newNodeEui64: EmberEUI64,
            status: EmberDeviceUpdate,
            policyDecision: EmberJoinDecision,
            parentOfNewNodeId: EmberNodeId,
        },
    },
    broadcastNextNetworkKey: {
        ID: 0x0073, // 115
        request: {
            key: EmberKeyData,
        },
        response: {
            status: EmberStatus,
        },
    },
    broadcastNetworkKeySwitch: {
        ID: 0x0074, // 116
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    becomeTrustCenter: {
        ID: 0x0077, // 119
        request: {
            newNetworkKey: EmberKeyData,
        },
        response: {
            status: EmberStatus,
        },
    },
    aesMmoHash: {
        ID: 0x006f, // 111
        request: {
            context: EmberAesMmoHashContext,
            finalize: Bool,
            data: LVBytes,
        },
        response: {
            status: EmberStatus,
            returnContext: EmberAesMmoHashContext,
        },
    },
    removeDevice: {
        ID: 0x00a8, // 168
        request: {
            destShort: EmberNodeId,
            destLong: EmberEUI64,
            targetLong: EmberEUI64,
        },
        response: {
            status: EmberStatus,
        },
    },
    unicastNwkKeyUpdate: {
        ID: 0x00a9, // 169
        request: {
            destShort: EmberNodeId,
            destLong: EmberEUI64,
            key: EmberKeyData,
        },
        response: {
            status: EmberStatus,
        },
    },

    // Certificate Based Key Exchange (CBKE) Frames
    generateCbkeKeys: {
        ID: 0x00a4, // 164
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    generateCbkeKeysHandler: {
        ID: 0x009e, // 158
        request: undefined,
        response: {
            status: EmberStatus,
            ephemeralPublicKey: EmberPublicKeyData,
        },
    },
    calculateSmacs: {
        ID: 0x009f, // 159
        request: {
            amInitiator: Bool,
            partnerCertificate: EmberCertificateData,
            partnerEphemeralPublicKey: EmberPublicKeyData,
        },
        response: {
            status: EmberStatus,
        },
    },
    calculateSmacsHandler: {
        ID: 0x00a0, // 160
        request: undefined,
        response: {
            status: EmberStatus,
            initiatorSmac: EmberSmacData,
            responderSmac: EmberSmacData,
        },
    },
    generateCbkeKeys283k1: {
        ID: 0x00e8, // 232
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    generateCbkeKeysHandler283k1: {
        ID: 0x00e9, // 233
        request: undefined,
        response: {
            status: EmberStatus,
            ephemeralPublicKey: EmberPublicKey283k1Data,
        },
    },
    calculateSmacs283k1: {
        ID: 0x00ea, // 234
        request: {
            amInitiator: Bool,
            partnerCertificate: EmberCertificate283k1Data,
            partnerEphemeralPublicKey: EmberPublicKey283k1Data,
        },
        response: {
            status: EmberStatus,
        },
    },
    calculateSmacsHandler283k1: {
        ID: 0x00eb, // 235
        request: undefined,
        response: {
            status: EmberStatus,
            initiatorSmac: EmberSmacData,
            responderSmac: EmberSmacData,
        },
    },
    clearTemporaryDataMaybeStoreLinkKey: {
        ID: 0x00a1, // 161
        request: {
            storeLinkKey: Bool,
        },
        response: {
            status: EmberStatus,
        },
    },
    clearTemporaryDataMaybeStoreLinkKey283k1: {
        ID: 0x00ee, // 238
        request: {
            storeLinkKey: Bool,
        },
        response: {
            status: EmberStatus,
        },
    },
    getCertificate: {
        ID: 0x00a5, // 165
        request: undefined,
        response: {
            status: EmberStatus,
            localCert: EmberCertificateData,
        },
    },
    getCertificate283k1: {
        ID: 0x00ec, // 236
        request: undefined,
        response: {
            status: EmberStatus,
            localCert: EmberCertificate283k1Data,
        },
    },
    dsaSign: {
        ID: 0x00a6, // 166
        request: {
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
        },
    },
    dsaSignHandler: {
        ID: 0x00a7, // 167
        request: undefined,
        response: {
            status: EmberStatus,
            message: LVBytes,
        },
    },
    dsaVerify: {
        ID: 0x00a3, // 163
        request: {
            digest: EmberMessageDigest,
            signerCertificate: EmberCertificateData,
            receivedSig: EmberSignatureData,
        },
        response: {
            status: EmberStatus,
        },
    },
    dsaVerifyHandler: {
        ID: 0x0078, // 120
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    dsaVerify283k1: {
        ID: 0x00b0, // 176
        request: {
            digest: EmberMessageDigest,
            signerCertificate: EmberCertificate283k1Data,
            receivedSig: EmberSignature283k1Data,
        },
        response: {
            status: EmberStatus,
        },
    },
    setPreinstalledCbkeData: {
        ID: 0x00a2, // 162
        request: {
            caPublic: EmberPublicKeyData,
            myCert: EmberCertificateData,
            myKey: EmberPrivateKeyData,
        },
        response: {
            status: EmberStatus,
        },
    },
    // setPreinstalledCbkeData283k1: {
    //     ID: 237,
    //     request: {
    //         attr: EmberPublicKey283k1Data,
    //         attr: EmberCertificate283k1Data,
    //         attr: EmberPrivateKey283k1Data
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },

    // Mfglib Frames
    mfglibStart: {
        ID: 0x0083, // 131
        request: {
            rxCallback: Bool,
        },
        response: {
            status: EmberStatus,
        },
    },
    mfglibEnd: {
        ID: 0x0084, // 132
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    mfglibStartTone: {
        ID: 0x0085, // 133
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    mfglibStopTone: {
        ID: 0x0086, // 134
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    mfglibStartStream: {
        ID: 0x0087, // 135
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    mfglibStopStream: {
        ID: 0x0088, // 136
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    mfglibSendPacket: {
        ID: 0x0089, // 137
        request: {
            packet: LVBytes,
        },
        response: {
            status: EmberStatus,
        },
    },
    mfglibSetChannel: {
        ID: 0x008a, // 138
        request: {
            channel: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    mfglibGetChannel: {
        ID: 0x008b, // 139
        request: undefined,
        response: {
            channel: uint8_t,
        },
    },
    mfglibSetPower: {
        ID: 0x008c, // 140
        request: {
            txPowerMode: uint16_t,
            power: int8s,
        },
        response: {
            status: EmberStatus,
        },
    },
    mfglibGetPower: {
        ID: 0x008d, // 141
        request: undefined,
        response: {
            power: int8s,
        },
    },
    mfglibRxHandler: {
        ID: 0x008e, // 142
        request: undefined,
        response: {
            linkQuality: uint8_t,
            rssi: int8s,
            packet: LVBytes,
        },
    },

    // Bootloader Frames
    launchStandaloneBootloader: {
        ID: 0x008f, // 143
        request: {
            mode: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    sendBootloadMessage: {
        ID: 0x0090, // 144
        request: {
            broadcast: Bool,
            destEui64: EmberEUI64,
            message: LVBytes,
        },
        response: {
            status: EmberStatus,
        },
    },
    getStandaloneBootloaderVersionPlatMicroPhy: {
        ID: 0x0091, // 145
        request: undefined,
        response: {
            bootloader_version: uint16_t,
            nodePlat: uint8_t,
            nodeMicro: uint8_t,
            nodePhy: uint8_t,
        },
    },
    incomingBootloadMessageHandler: {
        ID: 0x0092, // 146
        request: undefined,
        response: {
            longId: EmberEUI64,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            message: LVBytes,
        },
    },
    bootloadTransmitCompleteHandler: {
        ID: 0x0093, // 147
        request: undefined,
        response: {
            status: EmberStatus,
            message: LVBytes,
        },
    },
    aesEncrypt: {
        ID: 0x0094, // 148
        request: {
            plaintext: fixed_list(16, uint8_t),
            key: fixed_list(16, uint8_t),
        },
        response: {
            ciphertext: fixed_list(16, uint8_t),
        },
    },
    overrideCurrentChannel: {
        ID: 0x0095, // 149
        request: {
            channel: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },

    // ZLL Frames
    zllNetworkOps: {
        ID: 0x00b2, // 178
        request: {
            networkInfo: EmberZllNetwork,
            op: EzspZllNetworkOperation,
            radioTxPower: int8s,
        },
        response: {
            status: EmberStatus,
        },
    },
    zllSetInitialSecurityState: {
        ID: 0x00b3, // 179
        request: {
            networkKey: EmberKeyData,
            securityState: EmberZllInitialSecurityState,
        },
        response: {
            status: EmberStatus,
        },
    },
    zllStartScan: {
        ID: 0x00b4, // 180
        request: {
            channelMask: uint32_t,
            radioPowerForScan: int8s,
            nodeType: EmberNodeType,
        },
        response: {
            status: EmberStatus,
        },
    },
    zllSetRxOnWhenIdle: {
        ID: 0x00b5, // 181
        request: {
            durationMs: uint16_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    zllNetworkFoundHandler: {
        ID: 0x00b6, // 182
        request: undefined,
        response: {
            networkInfo: EmberZllNetwork,
            isDeviceInfoNull: Bool,
            deviceInfo: EmberZllDeviceInfoRecord,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
        },
    },
    zllScanCompleteHandler: {
        ID: 0x00b7, // 183
        request: undefined,
        response: {
            status: EmberStatus,
        },
    },
    zllAddressAssignmentHandler: {
        ID: 0x00b8, // 184
        request: undefined,
        response: {
            addressInfo: EmberZllAddressAssignment,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
        },
    },
    setLogicalAndRadioChannel: {
        ID: 0x00b9, // 185
        request: {
            radioChannel: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    getLogicalChannel: {
        ID: 0x00ba, // 186
        request: undefined,
        response: {
            logicalChannel: uint8_t,
        },
    },
    zllTouchLinkTargetHandler: {
        ID: 0x00bb, // 187
        request: undefined,
        response: {
            networkInfo: EmberZllNetwork,
        },
    },
    zllGetTokens: {
        ID: 0x00bc, // 188
        request: undefined,
        response: {
            data: EmberTokTypeStackZllData,
            security: EmberTokTypeStackZllSecurity,
        },
    },
    zllSetDataToken: {
        ID: 0x00bd, // 189
        request: {
            data: EmberTokTypeStackZllData,
        },
        response: undefined,
    },
    zllSetNonZllNetwork: {
        ID: 0x00bf, // 191
        request: undefined,
        response: undefined,
    },
    isZllNetwork: {
        ID: 0x00be, // 190
        request: undefined,
        response: {
            isZllNetwork: Bool,
        },
    },
    // rf4ceSetPairingTableEntry: {
    //     ID: 208,
    //     request: {
    //         attr: uint8_t,
    //         attr: EmberRf4cePairingTableEntry
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceGetPairingTableEntry: {
    //     ID: 209,
    //     request: {
    //         attr: uint8_t
    //     },
    //     response: {
    //         attr: EmberStatus,
    //         attr: EmberRf4cePairingTableEntry
    //     },
    // },
    // rf4ceDeletePairingTableEntry: {
    //     ID: 210,
    //     request: {
    //         attr: uint8_t
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceKeyUpdate: {
    //     ID: 211,
    //     request: {
    //         attr: uint8_t,
    //         attr: EmberKeyData
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceSend: {
    //     ID: 212,
    //     request: {
    //         attr: uint8_t,
    //         attr: uint8_t,
    //         attr: uint16_t,
    //         attr: EmberRf4ceTxOption,
    //         attr: uint8_t,
    //         attr: LVBytes
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceIncomingMessageHandler: {
    //     ID: 213,
    //     request: undefined,
    //     response: {
    //         attr: uint8_t,
    //         attr: uint8_t,
    //         attr: uint16_t,
    //         attr: EmberRf4ceTxOption,
    //         attr: LVBytes
    //     },
    // },
    // rf4ceMessageSentHandler: {
    //     ID: 214,
    //     request: undefined,
    //     response: {
    //         attr: EmberStatus,
    //         attr: uint8_t,
    //         attr: EmberRf4ceTxOption,
    //         attr: uint8_t,
    //         attr: uint16_t,
    //         attr: uint8_t,
    //         attr: LVBytes
    //     },
    // },
    // rf4ceStart: {
    //     ID: 215,
    //     request: {
    //         attr: EmberRf4ceNodeCapabilities,
    //         attr: EmberRf4ceVendorInfo,
    //         attr: int8s
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceStop: {
    //     ID: 216,
    //     request: undefined,
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceDiscovery: {
    //     ID: 217,
    //     request: {
    //         attr: EmberPanId,
    //         attr: EmberNodeId,
    //         attr: uint8_t,
    //         attr: uint16_t,
    //         attr: LVBytes
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceDiscoveryCompleteHandler: {
    //     ID: 218,
    //     request: undefined,
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceDiscoveryRequestHandler: {
    //     ID: 219,
    //     request: undefined,
    //     response: {
    //         attr: EmberEUI64,
    //         attr: uint8_t,
    //         attr: EmberRf4ceVendorInfo,
    //         attr: EmberRf4ceApplicationInfo,
    //         attr: uint8_t,
    //         attr: uint8_t
    //     },
    // },
    // rf4ceDiscoveryResponseHandler: {
    //     ID: 220,
    //     request: undefined,
    //     response: {
    //         attr: Bool,
    //         attr: uint8_t,
    //         attr: EmberPanId,
    //         attr: EmberEUI64,
    //         attr: uint8_t,
    //         attr: EmberRf4ceVendorInfo,
    //         attr: EmberRf4ceApplicationInfo,
    //         attr: uint8_t,
    //         attr: uint8_t
    //     },
    // },
    // rf4ceEnableAutoDiscoveryResponse: {
    //     ID: 221,
    //     request: {
    //         attr: uint16_t
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceAutoDiscoveryResponseCompleteHandler: {
    //     ID: 222,
    //     request: undefined,
    //     response: {
    //         attr: EmberStatus,
    //         attr: EmberEUI64,
    //         attr: uint8_t,
    //         attr: EmberRf4ceVendorInfo,
    //         attr: EmberRf4ceApplicationInfo,
    //         attr: uint8_t
    //     },
    // },
    // rf4cePair: {
    //     ID: 223,
    //     request: {
    //         attr: uint8_t,
    //         attr: EmberPanId,
    //         attr: EmberEUI64,
    //         attr: uint8_t
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4cePairCompleteHandler: {
    //     ID: 224,
    //     request: undefined,
    //     response: {
    //         attr: EmberStatus,
    //         attr: uint8_t,
    //         attr: EmberRf4ceVendorInfo,
    //         attr: EmberRf4ceApplicationInfo
    //     },
    // },
    // rf4cePairRequestHandler: {
    //     ID: 225,
    //     request: undefined,
    //     response: {
    //         attr: EmberStatus,
    //         attr: uint8_t,
    //         attr: EmberEUI64,
    //         attr: uint8_t,
    //         attr: EmberRf4ceVendorInfo,
    //         attr: EmberRf4ceApplicationInfo,
    //         attr: uint8_t
    //     },
    // },
    // rf4ceUnpair: {
    //     ID: 226,
    //     request: {
    //         attr: uint8_t
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceUnpairHandler: {
    //     ID: 227,
    //     request: undefined,
    //     response: {
    //         attr: uint8_t
    //     },
    // },
    // rf4ceUnpairCompleteHandler: {
    //     ID: 228,
    //     request: undefined,
    //     response: {
    //         attr: uint8_t
    //     },
    // },
    // rf4ceSetPowerSavingParameters: {
    //     ID: 229,
    //     request: {
    //         attr: uint32_t,
    //         attr: uint32_t
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceSetFrequencyAgilityParameters: {
    //     ID: 230,
    //     request: {
    //         attr: uint8_t,
    //         attr: uint8_t,
    //         attr: int8s,
    //         attr: uint16_t,
    //         attr: uint8_t
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceSetApplicationInfo: {
    //     ID: 231,
    //     request: {
    //         attr: EmberRf4ceApplicationInfo
    //     },
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceGetApplicationInfo: {
    //     ID: 239,
    //     request: undefined,
    //     response: {
    //         attr: EmberStatus,
    //         attr: EmberRf4ceApplicationInfo
    //     },
    // },
    // rf4ceGetMaxPayload: {
    //     ID: 243,
    //     request: {
    //         attr: uint8_t,
    //         attr: EmberRf4ceTxOption
    //     },
    //     response: {
    //         attr: uint8_t
    //     },
    // },
    // rf4ceGetNetworkParameters: {
    //     ID: 244,
    //     request: undefined,
    //     response: {
    //         attr: EmberStatus,
    //         attr: EmberNodeType,
    //         attr: EmberNetworkParameters
    //     },
    // },

    // Green Power Frames
    gpProxyTableProcessGpPairing: {
        ID: 0x00c9, // 201
        request: {
            options: uint32_t,
            addr: EmberGpAddress,
            commMode: uint8_t,
            sinkNetworkAddress: uint16_t,
            sinkGroupId: uint16_t,
            assignedAlias: uint16_t,
            sinkIeeeAddress: fixed_list(8, uint8_t),
            gpdKey: EmberKeyData,
            gpdSecurityFrameCounter: uint32_t,
            forwardingRadius: uint8_t,
        },
        response: {
            gpPairingAdded: Bool,
        },
    },
    dGpSend: {
        ID: 0x00c6, // 198
        request: {
            action: Bool,
            useCca: Bool,
            addr: EmberGpAddress,
            gpdCommandId: uint8_t,
            gpdAsdu: LVBytes,
            gpepHandle: uint8_t,
            gpTxQueueEntryLifetimeMs: uint16_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    dGpSentHandler: {
        ID: 0x00c7, // 199
        request: undefined,
        response: {
            status: EmberStatus,
            gpepHandle: uint8_t,
        },
    },
    gpepIncomingMessageHandler: {
        ID: 0x00c5, // 197
        request: undefined,
        response: {
            status: EmberStatus,
            gpdLink: uint8_t,
            sequenceNumber: uint8_t,
            addrType: uint8_t,
            addr: uint32_t,
            srcId: uint32_t,
            addrE: uint8_t,
            gpdfSecurityLevel: EmberGpSecurityLevel,
            gpdfSecurityKeyType: EmberGpKeyType,
            autoCommissioning: Bool,
            bidirectionalInfo: uint8_t,
            gpdSecurityFrameCounter: uint32_t,
            gpdCommandId: uint8_t,
            mic: uint32_t,
            proxyTableIndex: uint8_t,
            gpdCommandPayload: LVBytes,
        },
    },
    changeSourceRouteHandler: {
        ID: 0x00c4,
        request: undefined,
        response: {
            newChildId: EmberNodeId,
            newParentId: EmberNodeId,
        },
        maxV: 8,
    },
    incomingNetworkStatusHandler: {
        ID: 0x00c4,
        request: undefined,
        response: {
            errorCode: EmberStackError,
            target: EmberNodeId,
        },
        minV: 9,
    },
    setSourceRouteDiscoveryMode: {
        ID: 0x005a,
        request: {
            mode: uint8_t,
        },
        response: {
            remainingTime: uint32_t,
        },
    },
};

export const FRAME_NAMES_BY_ID: {[key: string]: string[]} = {};
for (const key of Object.getOwnPropertyNames(FRAMES)) {
    const frameDesc = FRAMES[key];
    if (FRAME_NAMES_BY_ID[frameDesc.ID]) {
        FRAME_NAMES_BY_ID[frameDesc.ID].push(key);
    } else {
        FRAME_NAMES_BY_ID[frameDesc.ID] = [key];
    }
}

interface EZSPZDOResponseFrame {
    ID: number;
    params: ParamsDesc;
}

export const ZDOREQUESTS: {[key: string]: EZSPFrameDesc} = {
    // ZDO Device and Discovery Attributes
    nodeDescReq: {
        ID: 0x0002,
        request: {
            transId: uint8_t,
            dstaddr: EmberNodeId,
        },
        response: {
            status: EmberStatus,
        },
    },
    simpleDescReq: {
        ID: 0x0004,
        request: {
            transId: uint8_t,
            dstaddr: EmberNodeId,
            targetEp: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    activeEpReq: {
        ID: 0x0005,
        request: {
            transId: uint8_t,
            dstaddr: EmberNodeId,
        },
        response: {
            status: EmberStatus,
        },
    },
    // ZDO Bind Manager Attributes
    bindReq: {
        ID: 0x0021,
        request: {
            transId: uint8_t,
            sourceEui: EmberEUI64,
            sourceEp: uint8_t,
            clusterId: uint16_t,
            destAddr: EmberMultiAddress,
        },
        response: {
            status: EmberStatus,
        },
    },
    unBindReq: {
        ID: 0x0022,
        request: {
            transId: uint8_t,
            sourceEui: EmberEUI64,
            sourceEp: uint8_t,
            clusterId: uint16_t,
            destAddr: EmberMultiAddress,
        },
        response: {
            status: EmberStatus,
        },
    },
    // ZDO network manager attributes commands
    mgmtLqiReq: {
        ID: 0x0031,
        request: {
            transId: uint8_t,
            startindex: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    mgmtRtgReq: {
        ID: 0x0032,
        request: {
            transId: uint8_t,
            startindex: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    mgmtLeaveReq: {
        ID: 0x0034,
        request: {
            transId: uint8_t,
            destAddr: EmberEUI64,
            removechildrenRejoin: uint8_t,
        },
        response: {
            status: EmberStatus,
        },
    },
    mgmtPermitJoinReq: {
        ID: 0x0036,
        request: {
            transId: uint8_t,
            duration: uint8_t,
            tcSignificant: Bool,
        },
        response: {
            status: EmberStatus,
        },
    },
};

export const ZDORESPONSES: {[key: string]: EZSPZDOResponseFrame} = {
    // ZDO Device and Discovery Attributes
    nodeDescRsp: {
        ID: 0x8002,
        params: {
            transId: uint8_t,
            status: EmberStatus,
            nwkaddr: EmberNodeId,
            descriptor: EmberNodeDescriptor,
        },
    },
    simpleDescRsp: {
        ID: 0x8004,
        params: {
            transId: uint8_t,
            status: EmberStatus,
            nwkaddr: EmberNodeId,
            len: uint8_t,
            descriptor: EmberSimpleDescriptor,
        },
    },
    activeEpRsp: {
        ID: 0x8005,
        params: {
            transId: uint8_t,
            status: EmberStatus,
            nwkaddr: EmberNodeId,
            activeeplist: LVBytes,
        },
    },
    // ZDO Bind Manager Attributes
    bindRsp: {
        ID: 0x8021,
        params: {
            transId: uint8_t,
            status: EmberStatus,
        },
    },
    unBindRsp: {
        ID: 0x8022,
        params: {
            transId: uint8_t,
            status: EmberStatus,
        },
    },
    // ZDO network manager attributes commands
    mgmtLqiRsp: {
        ID: 0x8031,
        params: {
            transId: uint8_t,
            status: EmberStatus,
            neighborlqilist: EmberNeighbors,
        },
    },
    mgmtRtgRsp: {
        ID: 0x8032,
        params: {
            transId: uint8_t,
            status: EmberStatus,
            routingtablelist: EmberRoutingTable,
        },
    },
    mgmtLeaveRsp: {
        ID: 0x8034,
        params: {
            transId: uint8_t,
            status: EmberStatus,
        },
    },
    mgmtPermitJoinRsp: {
        ID: 0x8036,
        params: {
            transId: uint8_t,
            status: EmberStatus,
        },
    },
};

export const ZGP: {[key: string]: EZSPZDOResponseFrame} = {};

export const ZDOREQUEST_NAME_BY_ID: {[key: string]: string} = {};
for (const key of Object.getOwnPropertyNames(ZDOREQUESTS)) {
    const frameDesc = ZDOREQUESTS[key];
    ZDOREQUEST_NAME_BY_ID[frameDesc.ID] = key;
}

export const ZDORESPONSE_NAME_BY_ID: {[key: string]: string} = {};
for (const key of Object.getOwnPropertyNames(ZDORESPONSES)) {
    const frameDesc = ZDORESPONSES[key];
    ZDORESPONSE_NAME_BY_ID[frameDesc.ID] = key;
}
