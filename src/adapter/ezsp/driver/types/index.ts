import {
    int8s,
    uint_t,
    uint8_t,
    uint16_t,
    uint24_t,
    uint32_t,
    uint64_t,
    LVBytes,
    list,
    LVList,
    fixed_list,
    WordList,
} from './basic';

import {
    NcpResetCode, EmberRf4ceTxOption, EmberRf4ceNodeCapabilities, EmberRf4ceApplicationCapabilities, EmberNodeId,
    EmberPanId, EmberMulticastId, EmberEUI64, EmberLibraryStatus, SecureEzspSecurityType, SecureEzspSecurityLevel, EmberGpSecurityLevel,
    EmberGpKeyType, SecureEzspRandomNumber, SecureEzspSessionId, Bool, EzspConfigId, EzspValueId, EzspExtendedValueId, EzspEndpointFlags,
    EmberConfigTxPowerMode, EzspPolicyId, EzspDecisionId, EzspMfgTokenId, EzspStatus, EmberStatus, EmberEventUnits, EmberNodeType,
    EmberNetworkStatus, EmberIncomingMessageType, EmberOutgoingMessageType, EmberMacPassthroughType, EmberBindingType, EmberApsOption,
    EzspNetworkScanType, EmberJoinDecision, EmberInitialSecurityBitmask, EmberCurrentSecurityBitmask, EmberKeyType, EmberKeyStructBitmask,
    EmberDeviceUpdate, EmberKeyStatus, EmberCounterType, EmberJoinMethod, EmberZdoConfigurationFlags, EmberConcentratorType, EmberZllState,
    EmberZllKeyIndex, EzspZllNetworkOperation, EzspSourceRouteOverheadInformation, EmberNetworkInitBitmask, EmberZDOCmd,
} from './named';

import {
    EzspStruct, EmberNetworkParameters, EmberZigbeeNetwork, EmberApsFrame, EmberBindingTableEntry, EmberMulticastTableEntry,
    EmberKeyData, EmberCertificateData, EmberPublicKeyData, EmberPrivateKeyData, EmberSmacData, EmberSignatureData,
    EmberCertificate283k1Data, EmberPublicKey283k1Data, EmberPrivateKey283k1Data, EmberSignature283k1Data, EmberMessageDigest,
    EmberAesMmoHashContext, EmberNeighborTableEntry, EmberRouteTableEntry, EmberInitialSecurityState, EmberCurrentSecurityState,
    EmberKeyStruct, EmberNetworkInitStruct, EmberZllSecurityAlgorithmData, EmberZllNetwork, EmberZllInitialSecurityState,
    EmberZllDeviceInfoRecord, EmberZllAddressAssignment, EmberTokTypeStackZllData, EmberTokTypeStackZllSecurity,
    EmberRf4ceVendorInfo, EmberRf4ceApplicationInfo, EmberRf4cePairingTableEntry, EmberGpAddress, EmberGpSinkListEntry,
    EmberNodeDescriptor,
} from './struct'

export function deserialize(payload: any, schema: any[]) {
    let result = [];
    let value, data = payload;
    for (let type of schema) {
        [value, data] = type.deserialize(type, data)
        result.push(value)
    }
    return [result, data];
}

export function serialize(data: any[], schema: { serialize: Function }[]) {
    return Buffer.concat(schema.map((s, idx) => s.serialize(s, data[idx])));
}

export {
    /* Basic Types */
    int8s,
    uint_t,
    uint8_t,
    uint16_t,
    uint24_t,
    uint32_t,
    uint64_t,
    LVBytes,
    list,
    LVList,
    fixed_list,
    WordList,

    /* Named Types */
    NcpResetCode, EmberRf4ceTxOption, EmberRf4ceNodeCapabilities, EmberRf4ceApplicationCapabilities, EmberNodeId,
    EmberPanId, EmberMulticastId, EmberEUI64, EmberLibraryStatus, SecureEzspSecurityType, SecureEzspSecurityLevel, EmberGpSecurityLevel,
    EmberGpKeyType, SecureEzspRandomNumber, SecureEzspSessionId, Bool, EzspConfigId, EzspValueId, EzspExtendedValueId, EzspEndpointFlags,
    EmberConfigTxPowerMode, EzspPolicyId, EzspDecisionId, EzspMfgTokenId, EzspStatus, EmberStatus, EmberEventUnits, EmberNodeType,
    EmberNetworkStatus, EmberIncomingMessageType, EmberOutgoingMessageType, EmberMacPassthroughType, EmberBindingType, EmberApsOption,
    EzspNetworkScanType, EmberJoinDecision, EmberInitialSecurityBitmask, EmberCurrentSecurityBitmask, EmberKeyType, EmberKeyStructBitmask,
    EmberDeviceUpdate, EmberKeyStatus, EmberCounterType, EmberJoinMethod, EmberZdoConfigurationFlags, EmberConcentratorType, EmberZllState,
    EmberZllKeyIndex, EzspZllNetworkOperation, EzspSourceRouteOverheadInformation, EmberNetworkInitBitmask, EmberZDOCmd,

    /* Structs */
    EzspStruct, EmberNetworkParameters, EmberZigbeeNetwork, EmberApsFrame, EmberBindingTableEntry, EmberMulticastTableEntry,
    EmberKeyData, EmberCertificateData, EmberPublicKeyData, EmberPrivateKeyData, EmberSmacData, EmberSignatureData,
    EmberCertificate283k1Data, EmberPublicKey283k1Data, EmberPrivateKey283k1Data, EmberSignature283k1Data, EmberMessageDigest,
    EmberAesMmoHashContext, EmberNeighborTableEntry, EmberRouteTableEntry, EmberInitialSecurityState, EmberCurrentSecurityState,
    EmberKeyStruct, EmberNetworkInitStruct, EmberZllSecurityAlgorithmData, EmberZllNetwork, EmberZllInitialSecurityState,
    EmberZllDeviceInfoRecord, EmberZllAddressAssignment, EmberTokTypeStackZllData, EmberTokTypeStackZllSecurity,
    EmberRf4ceVendorInfo, EmberRf4ceApplicationInfo, EmberRf4cePairingTableEntry, EmberGpAddress, EmberGpSinkListEntry,
    EmberNodeDescriptor
}