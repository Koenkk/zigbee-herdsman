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
    EmberStackError,
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
    EmberGpAddress,
    EmberNodeDescriptor,
    EmberSimpleDescriptor,
    EmberMultiAddress,
    EmberNeighbors,
    EmberRoutingTable,
    EmberSecurityManagerContext,
    EmberSecurityManagerNetworkKeyInfo,
    SLStatus,
} from './types';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
export interface ParamsDesc {[s: string]: any}

export interface EZSPFrameDesc {
    ID: number,
    request: ParamsDesc,
    response: ParamsDesc,
    minV?: number,
    maxV?: number
}

export const FRAMES: {[key: string]: EZSPFrameDesc} = {
    // Configuration Frames
    version: {
        ID: 0x0000,
        request: {
            desiredProtocolVersion: uint8_t
        },
        response: {
            protocolVersion: uint8_t, 
            stackType: uint8_t, 
            stackVersion: uint16_t
        }
    },
    getConfigurationValue: {
        ID: 0x0052, // 82
        request: {
            configId: EzspConfigId
        },
        response: {
            status: EzspStatus,
            value: uint16_t
        }
    },
    setConfigurationValue: {
        ID: 0x0053, // 83
        request: {
            configId: EzspConfigId,
            value: uint16_t
        },
        response: {
            status: EzspStatus
        }
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
            status: EzspStatus
        }
    },
    setPolicy: {
        ID: 0x0055, //85
        request: {
            policyId: EzspPolicyId,
            decisionId: EzspDecisionId
        },
        response: {
            status: EzspStatus
        }
    },
    getPolicy: {
        ID: 0x0056, //86
        request: {
            policyId: EzspPolicyId,
        },
        response: {
            status: EzspStatus,
            decisionId: EzspDecisionId
        }
    },
    sendPanIdUpdate: {
        ID: 0x0057, //87
        request: {
            newPan: EmberPanId,
        },
        response: {
            status: Bool
        }
    },
    getValue: {
        ID: 0x00AA, // 170
        request: {
            valueId: EzspValueId
        },
        response: {
            status: EzspStatus,
            value: LVBytes
        }
    },
    getExtendedValue: {
        ID: 0x0003,
        request: {
            valueId: EzspExtendedValueId,
            characteristics: uint32_t
        },
        response: {
            status: EzspStatus,
            value: LVBytes
        }
    },
    setValue: {
        ID: 0x00AB, // 171
        request: {
            valueId: EzspValueId,
            value: LVBytes
        },
        response: {
            status: EzspStatus
        }
    },

    // Utilities Frames
    nop: {
        ID: 0x0005,
        request: null,
        response: null
    },
    echo: {
        ID: 0x0081, // 129
        request: {
            data: LVBytes
        },
        response: {
            echo: LVBytes
        }
    },
    invalidCommand: {
        ID: 0x0058, // 88
        request: null,
        response: {
            reason: EzspStatus
        }
    },
    callback: {
        ID: 0x0006,
        request: null,
        response: null
    },
    noCallbacks: {
        ID: 0x0007,
        request: null,
        response: null
    },
    setToken: {
        ID: 0x0009,
        request: {
            tokenId: uint8_t,
            tokenData: fixed_list(8, uint8_t)
        },
        response: {
            status: EmberStatus
        }
    },
    getToken: {
        ID: 0x000A, // 10
        request: {
            tokenId: uint8_t
        },
        response: {
            status: EmberStatus,
            tokenData: fixed_list(8, uint8_t)
        }
    },
    getMfgToken: {
        ID: 0x000B, // 11
        request: {
            tokenId: EzspMfgTokenId
        },
        response: {
            status: EmberStatus,
            tokenData: LVBytes
        }
    },
    setMfgToken: {
        ID: 0x000C, // 12
        request: {
            tokenId: EzspMfgTokenId,
            tokenData: LVBytes
        },
        response: {
            status: EmberStatus
        }
    },
    stackTokenChangedHandler: {
        ID: 0x000D, // 13
        request: null,
        response: {
            tokenAddress: uint16_t
        }
    },
    getRandomNumber: {
        ID: 0x0049, // 73
        request: null,
        response: {
            status: EmberStatus,
            value: uint16_t
        }
    },
    setTimer: {
        ID: 0x000E, // 14
        request: {
            timerId: uint8_t,
            time: uint16_t,
            units: EmberEventUnits,
            repeat: Bool
        },
        response: {
            status: EmberStatus
        },
    },
    getTimer: {
        ID: 0x004E, // 78
        request: {
            timerId: uint8_t
        },
        response: {
            time: uint16_t,
            units: EmberEventUnits,
            repeat: Bool
        },
    },
    timerHandler: {
        ID: 0x000F, // 15
        request: null,
        response: {
            timerId: uint8_t
        },
    },
    debugWrite: {
        ID: 0x0012, // 18
        request: {
            binaryMessage: Bool,
            message: LVBytes
        },
        response: {
            status: EmberStatus
        },
    },
    readAndClearCounters: {
        ID: 0x0065, // 101
        request: null,
        response: {
            values: fixed_list(EmberCounterType.COUNTER_TYPE_COUNT, uint16_t)
        },
    },
    readCounters: {
        ID: 0x00F1, // 241
        request: null,
        response: {
            values: fixed_list(EmberCounterType.COUNTER_TYPE_COUNT, uint16_t)
        },
    },
    counterRolloverHandler: {
        ID: 0x00F2, // 242
        request: null,
        response: {
            type: EmberCounterType
        },
    },
    delayTest: {
        ID: 0x009D, // 157
        request: {
            delay: uint16_t
        },
        response: null,
    },
    getLibraryStatus: {
        ID: 0x0001,
        request: {
            libraryId: uint8_t
        },
        response: {
            status: EmberLibraryStatus
        },
    },
    getXncpInfo: {
        ID: 0x0013, // 19
        request: null,
        response: {
            status: EmberStatus,
            manufacturerId: uint16_t,
            versionNumber: uint16_t
        },
    },
    customFrame: {
        ID: 0x0047, // 71
        request: {
            payload: LVBytes
        },
        response: {
            status: EmberStatus,
            reply: LVBytes
        },
    },
    customFrameHandler: {
        ID: 0x0054, // 84
        request: null,
        response: {
            payload: LVBytes
        },
    },
    getEui64: {
        ID: 0x0026, // 38
        request: null,
        response: {
            eui64: EmberEUI64
        },
    },
    getNodeId: {
        ID: 0x0027, // 39
        request: null,
        response: {
            nodeId: EmberNodeId
        },
    },

    // Networking Frames
    setManufacturerCode: {
        ID: 0x0015, // 21
        request: {
            code: uint16_t
        },
        response: null,
    },
    setPowerDescriptor: {
        ID: 0x0016, // 22
        request: {
            descriptor: uint16_t
        },
        response: null,
    },
    networkInit: {
        ID: 0x0017, // 23
        request: null,
        response: {
            status: EmberStatus
        },
    },
    networkInitExtended: {
        ID: 112,
        request: {
            networkInitStruct: EmberNetworkInitStruct
        },
        response: {
            status: EmberStatus
        },
    },
    networkState: {
        ID: 0x0018, // 24
        request: null,
        response: {
            status: EmberNetworkStatus
        },
    },
    stackStatusHandler: {
        ID: 0x0019, // 25
        request: null,
        response: {
            status: EmberStatus
        },
    },
    startScan: {
        ID: 0x001A, // 26
        request: {
            scanType: EzspNetworkScanType,
            channelMask: uint32_t,
            duration: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    energyScanResultHandler: {
        ID: 0x0048, // 72
        request: null,
        response: {
            channel: uint8_t,
            maxRssiValue: int8s
        },
    },
    networkFoundHandler: {
        ID: 0x001B, // 27
        request: null,
        response: {
            networkFound: EmberZigbeeNetwork,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s
        },
    },
    scanCompleteHandler: {
        ID: 0x001C, // 28
        request: null,
        response: {
            channel: uint8_t,
            status: EmberStatus
        },
    },
    unusedPanIdFoundHandler: {
        ID: 0x00D2,
        request: null,
        response: {
            panId: EmberPanId,
            channel: uint8_t
        },
    },
    findUnusedPanId: {
        ID: 0x00D3,
        request: {
            channelMask: uint32_t,
            duration: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    stopScan: {
        ID: 0x001D, // 29
        request: null,
        response: {
            status: EmberStatus
        },
    },
    formNetwork: {
        ID: 0x001E, // 30
        request: {
            parameters: EmberNetworkParameters
        },
        response: {
            status: EmberStatus
        },
    },
    joinNetwork: {
        ID: 0x001F, // 31
        request: {
            nodeType: EmberNodeType,
            parameters: EmberNetworkParameters
        },
        response: {
            status: EmberStatus
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
        request: null,
        response: {
            status: EmberStatus
        },
    },
    findAndRejoinNetwork: {
        ID: 0x0021, // 33
        request: {
            haveCurrentNetworkKey: Bool,
            channelMask: uint32_t
        },
        response: {
            status: EmberStatus
        },
    },
    permitJoining: {
        ID: 0x0022, // 34
        request: {
            duration: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    childJoinHandler: {
        ID: 0x0023, // 35
        request: null,
        response: {
            index: uint8_t,
            joining: Bool,
            childId: EmberNodeId,
            childEui64: EmberEUI64,
            childType: EmberNodeType
        },
    },
    energyScanRequest: {
        ID: 0x009C, // 156
        request: {
            target: EmberNodeId,
            scanChannels: uint32_t,
            scanDuration: uint8_t,
            scanCount: uint16_t
        },
        response: {
            status: EmberStatus
        },
    },
    getNetworkParameters: {
        ID: 0x0028, // 40
        request: null,
        response: {
            status: EmberStatus,
            nodeType: EmberNodeType,
            parameters: EmberNetworkParameters
        },
    },
    getRadioParameters: {
        ID: 0x00FD,
        request: {
            childCount: uint8_t
        },
        response: {
            status: EmberStatus,
            nodeType: EmberNodeType,
            parameters: EmberNetworkParameters
        },
    },
    getParentChildParameters: {
        ID: 0x0029, // 41
        request: null,
        response: {
            childCount: uint8_t,
            parentEui64: EmberEUI64,
            parentNodeId: EmberNodeId
        },
    },
    getChildData: {
        ID: 0x004A, // 74
        request: {
            index: uint8_t
        },
        response: {
            status: EmberStatus,
            nodeId: EmberNodeId,
            eui64: EmberEUI64,
            nodeType: EmberNodeType
        },
    },
    getNeighbor: {
        ID: 0x0079, // 121
        request: {
            index: uint8_t
        },
        response: {
            status: EmberStatus,
            value: EmberNeighborTableEntry
        },
    },
    neighborCount: {
        ID: 0x007A, // 122
        request: null,
        response: {
            value: uint8_t
        },
    },
    getRouteTableEntry: {
        ID: 0x007B, // 123
        request: {
            index: uint8_t
        },
        response: {
            status: EmberStatus,
            value: EmberRouteTableEntry
        },
    },
    setRadioPower: {
        ID: 0x0099, // 153
        request: {
            power: int8s
        },
        response: {
            status: EmberStatus
        },
    },
    setRadioChannel: {
        ID: 0x009A, // 154
        request: {
            channel: uint8_t
        },
        response: {
            status: EmberStatus
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
            maxHops: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },

    // Binding Frames
    clearBindingTable: {
        ID: 0x002A, // 42
        request: null,
        response: {
            status: EmberStatus
        },
    },
    setBinding: {
        ID: 0x002B, // 43
        request: {
            index: uint8_t,
            value: EmberBindingTableEntry
        },
        response: {
            status: EmberStatus
        },
    },
    getBinding: {
        ID: 0x002C, // 44
        request: {
            index: uint8_t
        },
        response: {
            status: EmberStatus,
            value: EmberBindingTableEntry
        },
    },
    deleteBinding: {
        ID: 0x002D, // 45
        request: {
            index: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    bindingIsActive: {
        ID: 0x002E, // 46
        request: {
            index: uint8_t
        },
        response: {
            active: Bool
        },
    },
    getBindingRemoteNodeId: {
        ID: 0x002F, // 47
        request: {
            index: uint8_t
        },
        response: {
            nodeId: EmberNodeId
        },
    },
    setBindingRemoteNodeId: {
        ID: 0x0030, // 48
        request: {
            index: uint8_t,
            nodeId: EmberNodeId
        },
        response: null,
    },
    remoteSetBindingHandler: {
        ID: 0x0031, // 49
        request: null,
        response: {
            entry: EmberBindingTableEntry,
            index: uint8_t,
            policyDecision: EmberStatus
        },
    },
    remoteDeleteBindingHandler: {
        ID: 0x0032, // 50
        request: null,
        response: {
            index: uint8_t,
            policyDecision: EmberStatus
        },
    },

    // Messaging Frames
    maximumPayloadLength: {
        ID: 0x0033, // 51
        request: null,
        response: {
            apsLength: uint8_t
        },
    },
    sendUnicast: {
        ID: 0x0034, // 52
        request: {
            type: EmberOutgoingMessageType,
            indexOrDestination: EmberNodeId,
            apsFrame: EmberApsFrame,
            messageTag: uint8_t,
            message: LVBytes
        },
        response: {
            status: EmberStatus,
            sequence: uint8_t
        },
    },
    sendBroadcast: {
        ID: 0x0036, // 54
        request: {
            destination: EmberNodeId,
            apsFrame: EmberApsFrame,
            radius: uint8_t,
            messageTag: uint8_t,
            message: LVBytes
        },
        response: {
            status: EmberStatus,
            sequence: uint8_t
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
            message: LVBytes
        },
        response: {
            status: EmberStatus,
            apsSequence: uint8_t
        },
    },
    sendMulticast: {
        ID: 0x0038, // 56
        request: {
            apsFrame: EmberApsFrame,
            hops: uint8_t,
            nonmemberRadius: uint8_t,
            messageTag: uint8_t,
            message: LVBytes
        },
        response: {
            status: EmberStatus,
            sequence: uint8_t
        },
    },
    sendMulticastWithAlias: {
        ID: 0x003A,
        request: {
            apsFrame: EmberApsFrame,
            hops: uint8_t,
            nonmemberRadius: uint8_t,
            alias: uint16_t,
            nwkSequence: uint8_t,
            messageTag: uint8_t,
            message: LVBytes
        },
        response: {
            status: EmberStatus,
            sequence: uint8_t
        },
    },
    sendReply: {
        ID: 0x0039, // 57
        request: {
            sender: EmberNodeId,
            apsFrame: EmberApsFrame,
            message: LVBytes
        },
        response: {
            status: EmberStatus
        },
    },
    messageSentHandler: {
        ID: 0x003F, // 63
        request: null,
        response: {
            type: EmberOutgoingMessageType,
            indexOrDestination: uint16_t,
            apsFrame: EmberApsFrame,
            messageTag: uint8_t,
            status: EmberStatus,
            message: LVBytes
        },
    },
    sendManyToOneRouteRequest: {
        ID: 0x0041, // 65
        request: {
            concentratorType: uint16_t,
            radius: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    pollForData: {
        ID: 0x0042, // 66
        request: {
            interval: uint16_t,
            units: EmberEventUnits,
            failureLimit: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    pollCompleteHandler: {
        ID: 0x0043, // 67
        request: null,
        response: {
            status: EmberStatus
        },
    },
    pollHandler: {
        ID: 0x0044, // 68
        request: null,
        response: {
            childId: EmberNodeId
        },
    },
    incomingSenderEui64Handler: {
        ID: 0x0062, // 98
        request: null,
        response: {
            senderEui64: EmberEUI64
        },
    },
    incomingMessageHandler: {
        ID: 0x0045, // 69
        request: null,
        response: {
            type: EmberIncomingMessageType,
            apsFrame: EmberApsFrame,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            sender: EmberNodeId,
            bindingIndex: uint8_t,
            addressIndex: uint8_t,
            message: LVBytes
        },
    },
    incomingRouteRecordHandler: {
        ID: 0x0059, // 89
        request: null,
        response: {
            source: EmberNodeId,
            longId: EmberEUI64,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            relay: LVBytes
        },
    },
    incomingManyToOneRouteRequestHandler: {
        ID: 0x007D, // 125
        request: null,
        response: {
            source: EmberNodeId,
            longId: EmberEUI64,
            cost: uint8_t
        },
    },
    incomingRouteErrorHandler: {
        ID: 0x0080, // 128
        request: null,
        response: {
            status: EmberStatus,
            target: EmberNodeId
        },
    },
    unicastCurrentNetworkKey: {
        ID: 0x0050,
        request: {
            targetShort: EmberNodeId,
            targetLong: EmberEUI64,
            parentShortId: EmberNodeId
        },
        response: {
            status: EmberStatus
        },
    },
    addressTableEntryIsActive: {
        ID: 0x005B, // 91
        request: {
            addressTableIndex: uint8_t
        },
        response: {
            active: Bool
        },
    },
    setAddressTableRemoteEui64: {
        ID: 0x005C, // 92
        request: {
            addressTableIndex: uint8_t,
            eui64: EmberEUI64
        },
        response: {
            status: EmberStatus
        },
    },
    setAddressTableRemoteNodeId: {
        ID: 0x005D, // 93
        request: {
            addressTableIndex: uint8_t,
            id: EmberNodeId
        },
        response: null,
    },
    getAddressTableRemoteEui64: {
        ID: 0x005E, // 94
        request: {
            addressTableIndex: uint8_t
        },
        response: {
            eui64: EmberEUI64
        },
    },
    getAddressTableRemoteNodeId: {
        ID: 0x005F, // 95
        request: {
            addressTableIndex: uint8_t
        },
        response: {
            nodeId: EmberNodeId
        },
    },
    setExtendedTimeout: {
        ID: 0x007E, // 126
        request: {
            remoteEui64: EmberEUI64,
            extendedTimeout: Bool
        },
        response: null,
    },
    getExtendedTimeout: {
        ID: 0x007F, // 127,
        request: {
            remoteEui64: EmberEUI64
        },
        response: {
            extendedTimeout: Bool
        },
    },
    replaceAddressTableEntry: {
        ID: 0x0082, // 130
        request: {
            addressTableIndex: uint8_t,
            newEui64: EmberEUI64,
            newId: EmberNodeId,
            newExtendedTimeout: Bool
        },
        response: {
            status: EmberStatus,
            oldEui64: EmberEUI64,
            oldId: EmberNodeId,
            oldExtendedTimeout: Bool
        },
    },
    lookupNodeIdByEui64: {
        ID: 0x0060, // 96
        request: {
            eui64: EmberEUI64
        },
        response: {
            nodeId: EmberNodeId
        },
    },
    lookupEui64ByNodeId: {
        ID: 0x0061, // 97
        request: {
            nodeId: EmberNodeId
        },
        response: {
            status: EmberStatus,
            eui64: EmberEUI64
        },
    },
    getMulticastTableEntry: {
        ID: 0x0063, // 99
        request: {
            index: uint8_t
        },
        response: {
            value: EmberMulticastTableEntry
        },
    },
    setMulticastTableEntry: {
        ID: 0x0064, // 100
        request: {
            index: uint8_t,
            value: EmberMulticastTableEntry
        },
        response: {
            status: EmberStatus
        },
    },
    idConflictHandler: {
        ID: 0x007C, // 124
        request: null,
        response: {
            id: EmberNodeId
        },
    },
    writeNodeData: {
        ID: 0x00FE,
        request: {
            erase: Bool
        },
        response: {
            status: EmberStatus
        },
    },
    sendRawMessage: {
        ID: 0x0096, // 150
        request: {
            message: LVBytes
        },
        response: {
            status: EmberStatus
        },
    },
    sendRawMessageExtended: {
        ID: 0x0051,
        request: {
            message: LVBytes,
            priority: uint8_t,
            useCca: Bool
        },
        response: {
            status: EmberStatus
        },
    },
    macPassthroughMessageHandler: {
        ID: 0x0097, // 151
        request: null,
        response: {
            messageType: EmberMacPassthroughType,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            message: LVBytes
        },
    },
    macFilterMatchMessageHandler: {
        ID: 0x0046, // 70
        request: null,
        response: {
            filterIndexMatch: uint8_t,
            legacyPassthroughType: EmberMacPassthroughType,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            message: LVBytes
        },
    },
    rawTransmitCompleteHandler: {
        ID: 0x0098, // 152
        request: null,
        response: {
            status: EmberStatus
        },
    },

    // Security Frames
    setInitialSecurityState: {
        ID: 0x0068, // 104
        request: {
            state: EmberInitialSecurityState
        },
        response: {
            success: EmberStatus
        },
    },
    getCurrentSecurityState: {
        ID: 0x0069, // 105
        request: null,
        response: {
            status: EmberStatus,
            state: EmberCurrentSecurityState
        },
    },
    getKey: {
        ID: 0x006a, // 106
        request: {
            keyType: EmberKeyType
        },
        response: {
            status: EmberStatus,
            keyStruct: EmberKeyStruct
        },
    },
    exportKey: {
        ID: 0x0114,
        request: {
            context: EmberSecurityManagerContext
        },
        response: {
            keyData: EmberKeyData,
            status: SLStatus,
        },
    },
    getNetworkKeyInfo: {
        ID: 0x0116,
        request: null,
        response: {
            status: SLStatus,
            networkKeyInfo: EmberSecurityManagerNetworkKeyInfo,
        },
    },
    switchNetworkKeyHandler: {
        ID: 0x006e, // 110
        request: null,
        response: {
            sequenceNumber: uint8_t
        },
    },
    getKeyTableEntry: {
        ID: 0x0071, // 113
        request: {
            index: uint8_t
        },
        response: {
            status: EmberStatus,
            keyStruct: EmberKeyStruct
        },
    },
    setKeyTableEntry: {
        ID: 0x0072, // 114
        request: {
            index: uint8_t,
            address: EmberEUI64,
            linkKey: Bool,
            keyData: EmberKeyData
        },
        response: {
            status: EmberStatus
        },
    },
    findKeyTableEntry: {
        ID: 0x0075, // 117
        request: {
            address: EmberEUI64,
            linkKey: Bool
        },
        response: {
            index: uint8_t
        },
    },
    addOrUpdateKeyTableEntry: {
        ID: 0x0066, // 102
        request: {
            address: EmberEUI64,
            linkKey: Bool,
            keyData: EmberKeyData
        },
        response: {
            status: EmberStatus
        },
    },
    sendTrustCenterLinkKey: {
        ID: 0x0067,
        request: {
            destinationNodeId: EmberNodeId,
            destinationEui64: EmberEUI64
        },
        response: {
            status: EmberStatus
        },
    },
    eraseKeyTableEntry: {
        ID: 0x0076, // 118
        request: {
            index: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    clearKeyTable: {
        ID: 0x00B1, // 177
        request: null,
        response: {
            status: EmberStatus
        },
    },
    requestLinkKey: {
        ID: 0x0014, // 20
        request: {
            partner: EmberEUI64
        },
        response: {
            status: EmberStatus
        },
    },
    updateTcLinkKey: {
        ID: 0x006C,
        request: {
            maxAttempts: uint8_t
        },
        response: {
            status: EmberStatus
        },
    }, 
    zigbeeKeyEstablishmentHandler: {
        ID: 0x009B, // 155
        request: null,
        response: {
            partner: EmberEUI64,
            status: EmberKeyStatus
        },
    },
    addTransientLinkKey: {
        ID: 0x00AF, // 175
        request: {
            partner: EmberEUI64,
            transientKey: EmberKeyData
        },
        response: {
            status: EmberStatus
        },
    },
    importTransientKey: {
        ID: 0x0111,
        request: {
            partner: EmberEUI64,
            transientKey: EmberKeyData,
            flags: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    clearTransientLinkKeys: {
        ID: 0x006B, // 107
        request: null,
        response: null,
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
        ID: 0x00CA, // 202
        request: {
            key: EmberKeyData,
            securityType: SecureEzspSecurityType
        },
        response: {
            status: EzspStatus
        },
    },
    setSecurityParameters: {
        ID: 0x00CB, // 203
        request: {
            securityLevel: SecureEzspSecurityLevel,
            hostRandomNumber: SecureEzspRandomNumber
        },
        response: {
            status: EzspStatus,
            returnNcpRandomNumber: SecureEzspRandomNumber
        },
    },
    resetToFactoryDefaults: {
        ID: 0x00CC, // 204
        request: null,
        response: {
            status: EzspStatus
        },
    },
    getSecurityKeyStatus: {
        ID: 0x00CD, // 205
        request: null,
        response: {
            status: EzspStatus,
            returnSecurityType: SecureEzspSecurityType
        },
    },

    // Trust Center Frames
    trustCenterJoinHandler: {
        ID: 0x0024, // 36
        request: null,
        response: {
            newNodeId: EmberNodeId,
            newNodeEui64: EmberEUI64,
            status: EmberDeviceUpdate,
            policyDecision: EmberJoinDecision,
            parentOfNewNodeId: EmberNodeId
        },
    },
    broadcastNextNetworkKey: {
        ID: 0x0073, // 115
        request: {
            key: EmberKeyData
        },
        response: {
            status: EmberStatus
        },
    },
    broadcastNetworkKeySwitch: {
        ID: 0x0074, // 116
        request: null,
        response: {
            status: EmberStatus
        },
    },
    becomeTrustCenter: {
        ID: 0x0077, // 119
        request: {
            newNetworkKey: EmberKeyData
        },
        response: {
            status: EmberStatus
        },
    },
    aesMmoHash: {
        ID: 0x006F, // 111
        request: {
            context: EmberAesMmoHashContext,
            finalize: Bool,
            data: LVBytes
        },
        response: {
            status: EmberStatus,
            returnContext: EmberAesMmoHashContext
        },
    },
    removeDevice: {
        ID: 0x00A8, // 168
        request: {
            destShort: EmberNodeId,
            destLong: EmberEUI64,
            targetLong: EmberEUI64
        },
        response: {
            status: EmberStatus
        },
    },
    unicastNwkKeyUpdate: {
        ID: 0x00A9, // 169
        request: {
            destShort: EmberNodeId,
            destLong: EmberEUI64,
            key: EmberKeyData
        },
        response: {
            status: EmberStatus
        },
    },

    // Certificate Based Key Exchange (CBKE) Frames
    generateCbkeKeys: {
        ID: 0x00A4, // 164
        request: null,
        response: {
            status: EmberStatus
        },
    },
    generateCbkeKeysHandler: {
        ID: 0x009E, // 158
        request: null,
        response: {
            status: EmberStatus,
            ephemeralPublicKey: EmberPublicKeyData
        },
    },
    calculateSmacs: {
        ID: 0x009F, // 159
        request: {
            amInitiator: Bool,
            partnerCertificate: EmberCertificateData,
            partnerEphemeralPublicKey: EmberPublicKeyData
        },
        response: {
            status: EmberStatus
        },
    },
    calculateSmacsHandler: {
        ID: 0x00A0, // 160
        request: null,
        response: {
            status: EmberStatus,
            initiatorSmac: EmberSmacData,
            responderSmac: EmberSmacData
        },
    },
    generateCbkeKeys283k1: {
        ID: 0x00E8, // 232
        request: null,
        response: {
            status: EmberStatus
        },
    },
    generateCbkeKeysHandler283k1: {
        ID: 0x00E9, // 233
        request: null,
        response: {
            status: EmberStatus,
            ephemeralPublicKey: EmberPublicKey283k1Data
        },
    },
    calculateSmacs283k1: {
        ID: 0x00EA, // 234
        request: {
            amInitiator: Bool,
            partnerCertificate: EmberCertificate283k1Data,
            partnerEphemeralPublicKey: EmberPublicKey283k1Data
        },
        response: {
            status: EmberStatus
        },
    },
    calculateSmacsHandler283k1: {
        ID: 0x00EB, // 235
        request: null,
        response: {
            status: EmberStatus,
            initiatorSmac: EmberSmacData,
            responderSmac: EmberSmacData
        },
    },
    clearTemporaryDataMaybeStoreLinkKey: {
        ID: 0x00A1, // 161
        request: {
            storeLinkKey: Bool
        },
        response: {
            status: EmberStatus
        },
    },
    clearTemporaryDataMaybeStoreLinkKey283k1: {
        ID: 0x00EE, // 238
        request: {
            storeLinkKey: Bool
        },
        response: {
            status: EmberStatus
        },
    },
    getCertificate: {
        ID: 0x00A5, // 165
        request: null,
        response: {
            status: EmberStatus,
            localCert: EmberCertificateData
        },
    },
    getCertificate283k1: {
        ID: 0x00EC, // 236
        request: null,
        response: {
            status: EmberStatus,
            localCert: EmberCertificate283k1Data
        },
    },
    dsaSign: {
        ID: 0x00A6, // 166
        request: {
            message: LVBytes
        },
        response: {
            status: EmberStatus
        },
    },
    dsaSignHandler: {
        ID: 0x00A7, // 167
        request: null,
        response: {
            status: EmberStatus,
            message: LVBytes
        },
    },
    dsaVerify: {
        ID: 0x00A3, // 163
        request: {
            digest: EmberMessageDigest,
            signerCertificate: EmberCertificateData,
            receivedSig: EmberSignatureData
        },
        response: {
            status: EmberStatus
        },
    },
    dsaVerifyHandler: {
        ID: 0x0078, // 120
        request: null,
        response: {
            status: EmberStatus
        },
    },
    dsaVerify283k1: {
        ID: 0x00B0, // 176
        request: {
            digest: EmberMessageDigest,
            signerCertificate: EmberCertificate283k1Data,
            receivedSig: EmberSignature283k1Data
        },
        response: {
            status: EmberStatus
        },
    },
    setPreinstalledCbkeData: {
        ID: 0x00A2, // 162
        request: {
            caPublic: EmberPublicKeyData,
            myCert: EmberCertificateData,
            myKey: EmberPrivateKeyData
        },
        response: {
            status: EmberStatus
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
            rxCallback: Bool
        },
        response: {
            status: EmberStatus
        },
    },
    mfglibEnd: {
        ID: 0x0084, // 132
        request: null,
        response: {
            status: EmberStatus
        },
    },
    mfglibStartTone: {
        ID: 0x0085, // 133
        request: null,
        response: {
            status: EmberStatus
        },
    },
    mfglibStopTone: {
        ID: 0x0086, // 134
        request: null,
        response: {
            status: EmberStatus
        },
    },
    mfglibStartStream: {
        ID: 0x0087, // 135
        request: null,
        response: {
            status: EmberStatus
        },
    },
    mfglibStopStream: {
        ID: 0x0088, // 136
        request: null,
        response: {
            status: EmberStatus
        },
    },
    mfglibSendPacket: {
        ID: 0x0089, // 137
        request: {
            packet: LVBytes
        },
        response: {
            status: EmberStatus
        },
    },
    mfglibSetChannel: {
        ID: 0x008A, // 138
        request: {
            channel: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    mfglibGetChannel: {
        ID: 0x008B, // 139
        request: null,
        response: {
            channel: uint8_t
        },
    },
    mfglibSetPower: {
        ID: 0x008C, // 140
        request: {
            txPowerMode: uint16_t,
            power: int8s
        },
        response: {
            status: EmberStatus
        },
    },
    mfglibGetPower: {
        ID: 0x008D, // 141
        request: null,
        response: {
            power: int8s
        },
    },
    mfglibRxHandler: {
        ID: 0x008E, // 142
        request: null,
        response: {
            linkQuality: uint8_t,
            rssi: int8s,
            packet: LVBytes
        },
    },

    // Bootloader Frames
    launchStandaloneBootloader: {
        ID: 0x008F, // 143
        request: {
            mode: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    sendBootloadMessage: {
        ID: 0x0090, // 144
        request: {
            broadcast: Bool,
            destEui64: EmberEUI64,
            message: LVBytes
        },
        response: {
            status: EmberStatus
        },
    },
    getStandaloneBootloaderVersionPlatMicroPhy: {
        ID: 0x0091, // 145
        request: null,
        response: {
            bootloader_version: uint16_t,
            nodePlat: uint8_t,
            nodeMicro: uint8_t,
            nodePhy: uint8_t
        },
    },
    incomingBootloadMessageHandler: {
        ID: 0x0092, // 146
        request: null,
        response: {
            longId: EmberEUI64,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s,
            message: LVBytes
        },
    },
    bootloadTransmitCompleteHandler: {
        ID: 0x0093, // 147
        request: null,
        response: {
            status: EmberStatus,
            message: LVBytes
        },
    },
    aesEncrypt: {
        ID: 0x0094, // 148
        request: {
            plaintext: fixed_list(16, uint8_t),
            key: fixed_list(16, uint8_t)
        },
        response: {
            ciphertext: fixed_list(16, uint8_t)
        },
    },
    overrideCurrentChannel: {
        ID: 0x0095, // 149
        request: {
            channel: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },

    // ZLL Frames
    zllNetworkOps: {
        ID: 0x00B2, // 178
        request: {
            networkInfo: EmberZllNetwork,
            op: EzspZllNetworkOperation,
            radioTxPower: int8s
        },
        response: {
            status: EmberStatus
        },
    },
    zllSetInitialSecurityState: {
        ID: 0x00B3, // 179
        request: {
            networkKey: EmberKeyData,
            securityState: EmberZllInitialSecurityState
        },
        response: {
            status: EmberStatus
        },
    },
    zllStartScan: {
        ID: 0x00B4, // 180
        request: {
            channelMask: uint32_t,
            radioPowerForScan: int8s,
            nodeType: EmberNodeType
        },
        response: {
            status: EmberStatus
        },
    },
    zllSetRxOnWhenIdle: {
        ID: 0x00B5, // 181
        request: {
            durationMs: uint16_t
        },
        response: {
            status: EmberStatus
        },
    },
    zllNetworkFoundHandler: {
        ID: 0x00B6, // 182
        request: null,
        response: {
            networkInfo: EmberZllNetwork,
            isDeviceInfoNull: Bool,
            deviceInfo: EmberZllDeviceInfoRecord,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s
        },
    },
    zllScanCompleteHandler: {
        ID: 0x00B7, // 183
        request: null,
        response: {
            status: EmberStatus
        },
    },
    zllAddressAssignmentHandler: {
        ID: 0x00B8, // 184
        request: null,
        response: {
            addressInfo: EmberZllAddressAssignment,
            lastHopLqi: uint8_t,
            lastHopRssi: int8s
        },
    },
    setLogicalAndRadioChannel: {
        ID: 0x00B9, // 185
        request: {
            radioChannel: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    getLogicalChannel: {
        ID: 0x00BA, // 186
        request: null,
        response: {
            logicalChannel: uint8_t
        },
    },
    zllTouchLinkTargetHandler: {
        ID: 0x00BB, // 187
        request: null,
        response: {
            networkInfo: EmberZllNetwork
        },
    },
    zllGetTokens: {
        ID: 0x00BC, // 188
        request: null,
        response: {
            data: EmberTokTypeStackZllData,
            security: EmberTokTypeStackZllSecurity
        },
    },
    zllSetDataToken: {
        ID: 0x00BD, // 189
        request: {
            data: EmberTokTypeStackZllData
        },
        response: null,
    },
    zllSetNonZllNetwork: {
        ID: 0x00BF, // 191
        request: null,
        response: null,
    },
    isZllNetwork: {
        ID: 0x00BE, // 190
        request: null,
        response: {
            isZllNetwork: Bool
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
    //     request: null,
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
    //     request: null,
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
    //     request: null,
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
    //     request: null,
    //     response: {
    //         attr: EmberStatus
    //     },
    // },
    // rf4ceDiscoveryRequestHandler: {
    //     ID: 219,
    //     request: null,
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
    //     request: null,
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
    //     request: null,
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
    //     request: null,
    //     response: {
    //         attr: EmberStatus,
    //         attr: uint8_t,
    //         attr: EmberRf4ceVendorInfo,
    //         attr: EmberRf4ceApplicationInfo
    //     },
    // },
    // rf4cePairRequestHandler: {
    //     ID: 225,
    //     request: null,
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
    //     request: null,
    //     response: {
    //         attr: uint8_t
    //     },
    // },
    // rf4ceUnpairCompleteHandler: {
    //     ID: 228,
    //     request: null,
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
    //     request: null,
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
    //     request: null,
    //     response: {
    //         attr: EmberStatus,
    //         attr: EmberNodeType,
    //         attr: EmberNetworkParameters
    //     },
    // },

    // Green Power Frames
    gpProxyTableProcessGpPairing: {
        ID: 0x00C9, // 201
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
            forwardingRadius: uint8_t
        },
        response: {
            gpPairingAdded: Bool
        },
    },
    dGpSend: {
        ID: 0x00C6, // 198
        request: {
            action: Bool,
            useCca: Bool,
            addr: EmberGpAddress,
            gpdCommandId: uint8_t,
            gpdAsdu: LVBytes,
            gpepHandle: uint8_t,
            gpTxQueueEntryLifetimeMs: uint16_t
        },
        response: {
            status: EmberStatus
        },
    },
    dGpSentHandler: {
        ID: 0x00C7, // 199
        request: null,
        response: {
            status: EmberStatus,
            gpepHandle: uint8_t
        },
    },
    gpepIncomingMessageHandler: {
        ID: 0x00C5, // 197
        request: null,
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
        ID: 0x00C4,
        request: null,
        response: {
            newChildId: EmberNodeId,
            newParentId: EmberNodeId
        },
        maxV: 8
    },
    incomingNetworkStatusHandler: {
        ID: 0x00C4,
        request: null,
        response: {
            errorCode: EmberStackError,
            target: EmberNodeId
        },
        minV: 9
    },
    setSourceRouteDiscoveryMode: {
        ID: 0x005a,
        request: {
            mode: uint8_t
        },
        response: {
            remainingTime: uint32_t
        },
    },
};

export const FRAME_NAMES_BY_ID: { [key: string]: string[] } = {};
for (const key of Object.getOwnPropertyNames(FRAMES)) {
    const frameDesc = FRAMES[key];
    if (FRAME_NAMES_BY_ID[frameDesc.ID]) {
        FRAME_NAMES_BY_ID[frameDesc.ID].push(key);
    } else {
        FRAME_NAMES_BY_ID[frameDesc.ID] = [key];
    }
}

interface EZSPZDOResponseFrame {
    ID: number, params: ParamsDesc
}

export const ZDOREQUESTS: {[key: string]: EZSPFrameDesc} = {
    // ZDO Device and Discovery Attributes
    nodeDescReq: {
        ID: 0x0002,
        request: {
            transId: uint8_t,
            dstaddr: EmberNodeId
        },
        response: {
            status: EmberStatus
        },
    },
    simpleDescReq: {
        ID: 0x0004,
        request: {
            transId: uint8_t,
            dstaddr: EmberNodeId,
            targetEp: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    activeEpReq: {
        ID: 0x0005,
        request: {
            transId: uint8_t,
            dstaddr: EmberNodeId
        },
        response: {
            status: EmberStatus
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
            destAddr: EmberMultiAddress
        },
        response: {
            status: EmberStatus
        },
    },
    unBindReq: {
        ID: 0x0022,
        request: {
            transId: uint8_t,
            sourceEui: EmberEUI64,
            sourceEp: uint8_t,
            clusterId: uint16_t,
            destAddr: EmberMultiAddress
        },
        response: {
            status: EmberStatus
        },
    },
    // ZDO network manager attributes commands 
    mgmtLqiReq: {
        ID: 0x0031,
        request: {
            transId: uint8_t,
            startindex: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    mgmtRtgReq: {
        ID: 0x0032,
        request: {
            transId: uint8_t,
            startindex: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    mgmtLeaveReq: {
        ID: 0x0034,
        request: {
            transId: uint8_t,
            destAddr: EmberEUI64,
            removechildrenRejoin: uint8_t
        },
        response: {
            status: EmberStatus
        },
    },
    mgmtPermitJoinReq: {
        ID: 0x0036,
        request: {
            transId: uint8_t,
            duration: uint8_t,
            tcSignificant: Bool
        },
        response: {
            status: EmberStatus
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
            descriptor: EmberNodeDescriptor
        },
    },
    simpleDescRsp: {
        ID: 0x8004,
        params: {
            transId: uint8_t,
            status: EmberStatus, 
            nwkaddr: EmberNodeId,
            len: uint8_t,
            descriptor: EmberSimpleDescriptor
        },
    },
    activeEpRsp: {
        ID: 0x8005,
        params: {
            transId: uint8_t,
            status: EmberStatus,
            nwkaddr: EmberNodeId, 
            activeeplist: LVBytes
        }
    },
    // ZDO Bind Manager Attributes
    bindRsp: {
        ID: 0x8021,
        params: {
            transId: uint8_t,
            status: EmberStatus
        }
    },
    unBindRsp: {
        ID: 0x8022,
        params: {
            transId: uint8_t,
            status: EmberStatus
        }
    },
    // ZDO network manager attributes commands 
    mgmtLqiRsp: {
        ID: 0x8031,
        params: {
            transId: uint8_t,
            status: EmberStatus,
            neighborlqilist: EmberNeighbors
        }
    },
    mgmtRtgRsp: {
        ID: 0x8032,
        params: {
            transId: uint8_t,
            status: EmberStatus,
            routingtablelist: EmberRoutingTable
        }
    },
    mgmtLeaveRsp: {
        ID: 0x8034,
        params: {
            transId: uint8_t,
            status: EmberStatus
        }
    },
    mgmtPermitJoinRsp: {
        ID: 0x8036,
        params: {
            transId: uint8_t,
            status: EmberStatus
        }
    },
};


export const ZGP: {[key: string]: EZSPZDOResponseFrame} = {

};

export const ZDOREQUEST_NAME_BY_ID: { [key: string]: string } = {};
for (const key of Object.getOwnPropertyNames(ZDOREQUESTS)) {
    const frameDesc = ZDOREQUESTS[key];
    ZDOREQUEST_NAME_BY_ID[frameDesc.ID] = key;
}

export const ZDORESPONSE_NAME_BY_ID: { [key: string]: string } = {};
for (const key of Object.getOwnPropertyNames(ZDORESPONSES)) {
    const frameDesc = ZDORESPONSES[key];
    ZDORESPONSE_NAME_BY_ID[frameDesc.ID] = key;
}