import * as ZSpec from '../../../src/zspec';
import {ClusterId, EUI64, ExtendedPanId, NodeId} from '../../../src/zspec/tstypes';
import * as Zcl from '../../../src/zspec/zcl';
import * as Zdo from '../../../src/zspec/zdo';
import {BuffaloZdo} from '../../../src/zspec/zdo/buffaloZdo';
import {
    APSFrameCounterChallengeTLV,
    APSFrameCounterResponseTLV,
    ActiveEndpointsResponse,
    AuthenticationTokenIdTLV,
    BeaconAppendixEncapsulationGlobalTLV,
    BeaconSurveyConfigurationTLV,
    BeaconSurveyResultsTLV,
    BindingTableResponse,
    ClearAllBindingsReqEUI64TLV,
    ConfigurationParametersGlobalTLV,
    Curve25519PublicPointTLV,
    DeviceAuthenticationLevelTLV,
    DeviceCapabilityExtensionGlobalTLV,
    DeviceEUI64ListTLV,
    EndDeviceAnnounce,
    FragmentationParametersGlobalTLV,
    IEEEAddressResponse,
    JoinerEncapsulationGlobalTLV,
    LQITableResponse,
    ManufacturerSpecificGlobalTLV,
    MatchDescriptorsResponse,
    NetworkAddressResponse,
    NextChannelChangeGlobalTLV,
    NextPanIdChangeGlobalTLV,
    NodeDescriptorResponse,
    NwkBeaconSurveyResponse,
    NwkEnhancedUpdateResponse,
    NwkIEEEJoiningListResponse,
    NwkUnsolicitedEnhancedUpdateResponse,
    NwkUpdateResponse,
    PanIdConflictReportGlobalTLV,
    PotentialParentsTLV,
    PowerDescriptorResponse,
    ProcessingStatusTLV,
    RouterInformationGlobalTLV,
    RoutingTableResponse,
    SelectedKeyNegotiationMethodTLV,
    ServerMask,
    SimpleDescriptorResponse,
    SupportedKeyNegotiationMethodsGlobalTLV,
    SymmetricPassphraseGlobalTLV,
    SystemServerDiscoveryResponse,
    TargetIEEEAddressTLV
} from '../../../src/zspec/zdo/definition/tstypes';
import {uint16To8Array, uint32To8Array} from '../../utils/math';

const IEEE_ADDRESS1: EUI64 = `0xfe34ac2385ff8311`;
const IEEE_ADDRESS1_BYTES = [0x11, 0x83, 0xff, 0x85, 0x23, 0xac, 0x34, 0xfe];
const IEEE_ADDRESS2: EUI64 = `0x28373fecd834ba37`;
const IEEE_ADDRESS2_BYTES = [0x37, 0xba, 0x34, 0xd8, 0xec, 0x3f, 0x37, 0x28];
const NODE_ID1: NodeId = 0xfe32;
const NODE_ID1_BYTES = uint16To8Array(NODE_ID1);
const NODE_ID2: NodeId = 0xab39;
const NODE_ID2_BYTES = uint16To8Array(NODE_ID2);
const EXT_PAN_ID1: ExtendedPanId = [3, 43, 56, 23, 65, 23, 67, 23];
const EXT_PAN_ID2: ExtendedPanId = [253, 231, 21, 3, 0, 44, 24, 46];
const CLUSTER_LIST1: ClusterId[] = [Zcl.Clusters.genAlarms.ID, Zcl.Clusters.seMetering.ID, Zcl.Clusters.haApplianceStatistics.ID];
const CLUSTER_LIST1_BYTES = [...uint16To8Array(CLUSTER_LIST1[0]), ...uint16To8Array(CLUSTER_LIST1[1]), ...uint16To8Array(CLUSTER_LIST1[2])];
const CLUSTER_LIST2: ClusterId[] = [Zcl.Clusters.genOnOff.ID, Zcl.Clusters.genBasic.ID, Zcl.Clusters.ssIasZone.ID, Zcl.Clusters.genLevelCtrl.ID];
const CLUSTER_LIST2_BYTES = [...uint16To8Array(CLUSTER_LIST2[0]), ...uint16To8Array(CLUSTER_LIST2[1]), ...uint16To8Array(CLUSTER_LIST2[2]), ...uint16To8Array(CLUSTER_LIST2[3])];
const SERVER_MASK_R22: ServerMask = {
    primaryTrustCenter: 1,
    backupTrustCenter: 1,
    deprecated1: 0,
    deprecated2: 0,
    deprecated3: 0,
    deprecated4: 0,
    networkManager: 1,
    reserved1: 0,
    reserved2: 0,
    stackComplianceResivion: 22,
};
const SERVER_MASK_R22_BYTE = Zdo.Utils.createServerMask(SERVER_MASK_R22);

const SERVER_MASK_R23: ServerMask = {
    primaryTrustCenter: 1,
    backupTrustCenter: 1,
    deprecated1: 0,
    deprecated2: 0,
    deprecated3: 0,
    deprecated4: 0,
    networkManager: 1,
    reserved1: 0,
    reserved2: 0,
    stackComplianceResivion: 23,
};
const SERVER_MASK_R23_BYTE = Zdo.Utils.createServerMask(SERVER_MASK_R23);

describe('ZDO Buffalo', () => {
    it('Sets & Gets position', () => {
        const buffalo = new BuffaloZdo(Buffer.alloc(3));
        expect(buffalo.getPosition()).toStrictEqual(0);
        buffalo.setPosition(3);
        expect(buffalo.getPosition()).toStrictEqual(3);
        buffalo.setPosition(1);
        expect(buffalo.getPosition()).toStrictEqual(1);
        buffalo.setPosition(0);
        expect(buffalo.getPosition()).toStrictEqual(0);
    });

    it('Sets & Gets bytes without changing internal position', () => {
        const buffalo = new BuffaloZdo(Buffer.from([1, 2, 3, 255]));
        expect(buffalo.getByte(0)).toStrictEqual(1);
        expect(buffalo.getByte(1)).toStrictEqual(2);
        expect(buffalo.getByte(2)).toStrictEqual(3);
        expect(buffalo.getByte(3)).toStrictEqual(255);
        expect(buffalo.getPosition()).toStrictEqual(0);
        buffalo.setByte(3, 127);
        expect(buffalo.getByte(3)).toStrictEqual(127);
        buffalo.setByte(0, 7);
        expect(buffalo.getByte(0)).toStrictEqual(7);
    });

    it('Checks if more available to by amount', () => {
        const buffalo = new BuffaloZdo(Buffer.from([1, 2, 3, 255]));
        buffalo.setPosition(4);
        expect(buffalo.isMoreBy(0)).toBeTruthy();
        expect(buffalo.isMoreBy(1)).toBeFalsy();
        buffalo.setPosition(1);
        expect(buffalo.isMoreBy(0)).toBeTruthy();
        expect(buffalo.isMoreBy(3)).toBeTruthy();
        expect(buffalo.isMoreBy(4)).toBeFalsy();
    });

    it('Throws when duplicate TLV tag found and not valid', () => {
        expect(() => {
            new BuffaloZdo(Buffer.from([
                Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 5 - 1, ...uint16To8Array(NODE_ID1), 1, ...uint16To8Array(213),
                Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 5 - 1, ...uint16To8Array(NODE_ID2), 0, ...uint16To8Array(344)
            ])).readTLVs();
        }).toThrow(`Duplicate tag. Cannot have more than one of tagId=${Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS}.`);
        expect(() => {
            new BuffaloZdo(Buffer.from([
                Zdo.GlobalTLV.MANUFACTURER_SPECIFIC, 2 - 1, ...uint16To8Array(Zcl.ManufacturerCode.ABB),
                Zdo.GlobalTLV.MANUFACTURER_SPECIFIC, 2 - 1, ...uint16To8Array(Zcl.ManufacturerCode.ABB_GENWAY_XIAMEN_ELECTRICAL_EQUIPMENT_CO_LTD),
            ])).readTLVs();
        }).not.toThrow();
    });

    it('Throws when encapsulated TLV tag found inside encapsulated', () => {
        expect(() => {
            new BuffaloZdo(Buffer.from([
                Zdo.GlobalTLV.BEACON_APPENDIX_ENCAPSULATION, 4 - 1, Zdo.GlobalTLV.JOINER_ENCAPSULATION, 2 - 1, 123, 456
            ])).readTLVs();
        }).toThrow(`Invalid nested encapsulation for tagId=${Zdo.GlobalTLV.JOINER_ENCAPSULATION}.`);
    });

    it('Throws when not enough bytes to read in TLV', () => {
        expect(() => {
            new BuffaloZdo(Buffer.from([
                Zdo.GlobalTLV.MANUFACTURER_SPECIFIC, 6 - 1, ...uint16To8Array(Zcl.ManufacturerCode.ABB),
            ])).readTLVs();
        }).toThrow(`Malformed TLV. Invalid data length for tagId=${Zdo.GlobalTLV.MANUFACTURER_SPECIFIC}, expected ${6}.`);
    });

    it('Ignores invalid TLV tag and reads next TLV', () => {
        const buffalo = new BuffaloZdo(Buffer.from([
            0xFF, 5 - 1, ...uint16To8Array(Zcl.ManufacturerCode.ABB), 4, 5, 6,
            Zdo.GlobalTLV.MANUFACTURER_SPECIFIC, 5 - 1, ...uint16To8Array(Zcl.ManufacturerCode.ABB), 1, 2, 3
        ]))
        const tlvs = buffalo.readTLVs();

        expect(tlvs).toStrictEqual([{
            tagId: Zdo.GlobalTLV.MANUFACTURER_SPECIFIC, length: 5, tlv: {
                zigbeeManufacturerId: Zcl.ManufacturerCode.ABB,
                additionalData: Buffer.from([1, 2, 3]),
            } as ManufacturerSpecificGlobalTLV
        }]);
    });

    it('Throws when writing invalid TLV tag', () => {
        const buffalo = new BuffaloZdo(Buffer.alloc(3));

        expect(() => {
            buffalo.writeGlobalTLV({tagId: 0xFE, length: 2, tlv: {nwkPanIdConflictCount: NODE_ID2} as PanIdConflictReportGlobalTLV});
        }).toThrow(new Zdo.StatusError(Zdo.Status.NOT_SUPPORTED));
    })

    it.each([
        ['readProcessingStatusTLV', {length: 6, error: `Malformed TLV. Invalid length '6', expected 5.`, bytes: [2]}],
        ['readDeviceAuthenticationLevelTLV', {length: 11, error: `Malformed TLV. Invalid length '11', expected 10.`, bytes: []}],
        ['readPotentialParentsTLV', {length: 3, error: `Malformed TLV. Invalid length '3', expected at least 4.`, bytes: []}],
        ['readPotentialParentsTLV', {length: 11, error: `Malformed TLV. Invalid length '11', expected 13.`, bytes: [1, 2, 230, 3]}],
        ['readBeaconSurveyResultsTLV', {length: 6, error: `Malformed TLV. Invalid length '6', expected 4.`, bytes: []}],
        ['readAPSFrameCounterResponseTLV', {length: 36, error: `Malformed TLV. Invalid length '36', expected 32.`, bytes: []}],
        // ['readDeviceEUI64ListTLV', {length: 36, error: `Malformed TLV. Invalid length '36', expected 41.`, bytes: [5]}],
        // ['readSelectedKeyNegotiationMethodTLV', {length: 11, error: `Malformed TLV. Invalid length '11', expected 10.`, bytes: []}],
        // ['readTargetIEEEAddressTLV', {length: 11, error: `Malformed TLV. Invalid length '11', expected 8.`, bytes: []}],
        ['readCurve25519PublicPointTLV', {length: 11, error: `Malformed TLV. Invalid length '11', expected 40.`, bytes: []}],
        // ['readBeaconSurveyConfigurationTLV', {length: 3, error: `Malformed TLV. Invalid length '3', expected 6.`, bytes: [1]}],
        ['readConfigurationParametersGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
        ['readBeaconAppendixEncapsulationGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
        ['readJoinerEncapsulationGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
        ['readFragmentationParametersGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
        ['readRouterInformationGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
        ['readSymmetricPassphraseGlobalTLV', {length: 13, error: `Malformed TLV. Invalid length '13', expected at least 16.`, bytes: []}],
        ['readNextChannelChangeGlobalTLV', {length: 3, error: `Malformed TLV. Invalid length '3', expected at least 4.`, bytes: []}],
        ['readNextPanIdChangeGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
        ['readPanIdConflictReportGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
        ['readSupportedKeyNegotiationMethodsGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
        ['readManufacturerSpecificGlobalTLV', {length: 1, error: `Malformed TLV. Invalid length '1', expected at least 2.`, bytes: []}],
    ])('Throws when reading invalid length TLV %s', (func, payload) => {
        expect(() => {
            const buffalo = new BuffaloZdo(Buffer.from(payload.bytes));

            buffalo[func](payload.length);
        }).toThrow(payload.error);
    })

    it.each([
        [
            'MANUFACTURER_SPECIFIC',
            [Zdo.GlobalTLV.MANUFACTURER_SPECIFIC, 3 - 1, ...uint16To8Array(256), 123],
            [{tagId: Zdo.GlobalTLV.MANUFACTURER_SPECIFIC, length: 3, tlv: {zigbeeManufacturerId: 256, additionalData: Buffer.from([123])} as ManufacturerSpecificGlobalTLV}]
        ],
        [
            'SUPPORTED_KEY_NEGOTIATION_METHODS',
            [Zdo.GlobalTLV.SUPPORTED_KEY_NEGOTIATION_METHODS, 2 - 1, 1, 2],
            [{tagId: Zdo.GlobalTLV.SUPPORTED_KEY_NEGOTIATION_METHODS, length: 2, tlv: {keyNegotiationProtocolsBitmask: 1, preSharedSecretsBitmask: 2, sourceDeviceEui64: undefined} as SupportedKeyNegotiationMethodsGlobalTLV}]
        ],
        [
            'SUPPORTED_KEY_NEGOTIATION_METHODS with IEEE',
            [Zdo.GlobalTLV.SUPPORTED_KEY_NEGOTIATION_METHODS, 10 - 1, 1, 2, ...IEEE_ADDRESS1_BYTES],
            [{tagId: Zdo.GlobalTLV.SUPPORTED_KEY_NEGOTIATION_METHODS, length: 10, tlv: {keyNegotiationProtocolsBitmask: 1, preSharedSecretsBitmask: 2, sourceDeviceEui64: IEEE_ADDRESS1} as SupportedKeyNegotiationMethodsGlobalTLV}]
        ],
        [
            'PAN_ID_CONFLICT_REPORT',
            [Zdo.GlobalTLV.PAN_ID_CONFLICT_REPORT, 2 - 1, ...NODE_ID2_BYTES],
            [{tagId: Zdo.GlobalTLV.PAN_ID_CONFLICT_REPORT, length: 2, tlv: {nwkPanIdConflictCount: NODE_ID2} as PanIdConflictReportGlobalTLV}]
        ],
        [
            'NEXT_PAN_ID_CHANGE',
            [Zdo.GlobalTLV.NEXT_PAN_ID_CHANGE, 2 - 1, ...uint16To8Array(0xff00)],
            [{tagId: Zdo.GlobalTLV.NEXT_PAN_ID_CHANGE, length: 2, tlv: {panId: 0xff00} as NextPanIdChangeGlobalTLV}]
        ],
        [
            'NEXT_CHANNEL_CHANGE',
            [Zdo.GlobalTLV.NEXT_CHANNEL_CHANGE, 4 - 1, ...uint32To8Array(423432)],
            [{tagId: Zdo.GlobalTLV.NEXT_CHANNEL_CHANGE, length: 4, tlv: {channel: 423432} as NextChannelChangeGlobalTLV}]
        ],
        [
            'SYMMETRIC_PASSPHRASE',
            [Zdo.GlobalTLV.SYMMETRIC_PASSPHRASE, ZSpec.DEFAULT_ENCRYPTION_KEY_SIZE - 1, ...Buffer.alloc(ZSpec.DEFAULT_ENCRYPTION_KEY_SIZE).fill(0xca)],
            [{tagId: Zdo.GlobalTLV.SYMMETRIC_PASSPHRASE, length: ZSpec.DEFAULT_ENCRYPTION_KEY_SIZE, tlv: {passphrase: Buffer.alloc(ZSpec.DEFAULT_ENCRYPTION_KEY_SIZE).fill(0xca)} as SymmetricPassphraseGlobalTLV}]
        ],
        [
            'ROUTER_INFORMATION',
            [Zdo.GlobalTLV.ROUTER_INFORMATION, 2 - 1, ...uint16To8Array(4396)],
            [{tagId: Zdo.GlobalTLV.ROUTER_INFORMATION, length: 2, tlv: {bitmask: 4396} as RouterInformationGlobalTLV}]
        ],
        [
            'FRAGMENTATION_PARAMETERS',
            [Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 5 - 1, ...NODE_ID1_BYTES, 5, ...uint16To8Array(32456)],
            [{tagId: Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, length: 5, tlv: {nwkAddress: NODE_ID1, fragmentationOptions: 5, maxIncomingTransferUnit: 32456} as FragmentationParametersGlobalTLV}]
        ],
        [
            'JOINER_ENCAPSULATION',
            [Zdo.GlobalTLV.JOINER_ENCAPSULATION, 4 - 1, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 2 - 1, ...NODE_ID1_BYTES],
            [{tagId: Zdo.GlobalTLV.JOINER_ENCAPSULATION, length: 4, tlv: {additionalTLVs: [{tagId: Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, length: 2, tlv: {nwkAddress: NODE_ID1, fragmentationOptions: undefined, maxIncomingTransferUnit: undefined}}]} as JoinerEncapsulationGlobalTLV}]
        ],
        [
            'BEACON_APPENDIX_ENCAPSULATION',
            [Zdo.GlobalTLV.BEACON_APPENDIX_ENCAPSULATION, 4 - 1, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 2 - 1, ...NODE_ID1_BYTES],
            [{tagId: Zdo.GlobalTLV.BEACON_APPENDIX_ENCAPSULATION, length: 4, tlv: {additionalTLVs: [{tagId: Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, length: 2, tlv: {nwkAddress: NODE_ID1, fragmentationOptions: undefined, maxIncomingTransferUnit: undefined}}]} as BeaconAppendixEncapsulationGlobalTLV}]
        ],
        [
            'CONFIGURATION_PARAMETERS',
            [Zdo.GlobalTLV.CONFIGURATION_PARAMETERS, 2 - 1, ...uint16To8Array(47593)],
            [{tagId: Zdo.GlobalTLV.CONFIGURATION_PARAMETERS, length: 2, tlv: {configurationParameters: 47593} as ConfigurationParametersGlobalTLV}]
        ],
        [
            'DEVICE_CAPABILITY_EXTENSION',
            [Zdo.GlobalTLV.DEVICE_CAPABILITY_EXTENSION, 3 - 1, 3, 1, 2],
            [{tagId: Zdo.GlobalTLV.DEVICE_CAPABILITY_EXTENSION, length: 3, tlv: {data: Buffer.from([3, 1, 2])} as DeviceCapabilityExtensionGlobalTLV}]
        ],
        [
            'invalid',
            [0xfe, 0, 0],
            []
        ],
    ])('Reads & Writes global TLV %s', (_name, bytes, expected) => {
        const readBuffalo = new BuffaloZdo(Buffer.from(bytes));
        expect(readBuffalo.readTLVs()).toStrictEqual(expected);

        const writeBuffer = new BuffaloZdo(Buffer.alloc(255));
        writeBuffer.writeGlobalTLVs(expected);
        expect(writeBuffer.getWritten()).toStrictEqual(Buffer.from(expected.length ? bytes : []));
    })

    it('buildNetworkAddressRequest', () => {
        expect(BuffaloZdo.buildNetworkAddressRequest(IEEE_ADDRESS1, false, 1)).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS1_BYTES, 0, 1]));
        expect(BuffaloZdo.buildNetworkAddressRequest(IEEE_ADDRESS2, true, 3)).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS2_BYTES, 1, 3]))
    });

    it('buildIeeeAddressRequest', () => {
        expect(BuffaloZdo.buildIeeeAddressRequest(NODE_ID1, false, 1)).toStrictEqual(Buffer.from([0, ...NODE_ID1_BYTES, 0, 1]));
        expect(BuffaloZdo.buildIeeeAddressRequest(NODE_ID1, true, 3)).toStrictEqual(Buffer.from([0, ...NODE_ID1_BYTES, 1, 3]))
    });

    it('buildNodeDescriptorRequest', () => {
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID1)).toStrictEqual(Buffer.from([0, ...NODE_ID1_BYTES]));

        const tlv: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID1,
            /*fragmentationOptions: undefined,*/
            /*maxIncomingTransferUnit: undefined,*/
        };
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID1, tlv)).toStrictEqual(
            Buffer.from([0, ...NODE_ID1_BYTES, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 1, ...uint16To8Array(tlv.nwkAddress)])
        );

        const tlv2: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID1,
            fragmentationOptions: 1,
            /*maxIncomingTransferUnit: undefined,*/
        };
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID1, tlv2)).toStrictEqual(
            Buffer.from([0, ...NODE_ID1_BYTES, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 2, ...uint16To8Array(tlv2.nwkAddress), tlv2.fragmentationOptions!])
        );

        const tlv3: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID1,
            /*fragmentationOptions: undefined,*/
            maxIncomingTransferUnit: 256,
        };
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID1, tlv3)).toStrictEqual(
            Buffer.from([0, ...NODE_ID1_BYTES, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 3, ...uint16To8Array(tlv3.nwkAddress), ...uint16To8Array(tlv3.maxIncomingTransferUnit!)])
        );

        const tlv4: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID1,
            fragmentationOptions: 1,
            maxIncomingTransferUnit: 65352,
        };
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID1, tlv4)).toStrictEqual(
            Buffer.from([0, ...NODE_ID1_BYTES, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 4, ...uint16To8Array(tlv4.nwkAddress), tlv4.fragmentationOptions!, ...uint16To8Array(tlv4.maxIncomingTransferUnit!)])
        );
    });

    it('buildPowerDescriptorRequest', () => {
        expect(BuffaloZdo.buildPowerDescriptorRequest(NODE_ID1)).toStrictEqual(Buffer.from([0, ...NODE_ID1_BYTES]));
    });

    it('buildSimpleDescriptorRequest', () => {
        expect(BuffaloZdo.buildSimpleDescriptorRequest(NODE_ID1, 3)).toStrictEqual(Buffer.from([0, ...NODE_ID1_BYTES, 3]));
    });

    it('buildActiveEndpointsRequest', () => {
        expect(BuffaloZdo.buildActiveEndpointsRequest(NODE_ID1)).toStrictEqual(Buffer.from([0, ...NODE_ID1_BYTES]));
    });

    it('buildMatchDescriptorRequest', () => {
        expect(
            BuffaloZdo.buildMatchDescriptorRequest(NODE_ID1, ZSpec.HA_PROFILE_ID, CLUSTER_LIST1, CLUSTER_LIST2)
        ).toStrictEqual(
            Buffer.from([0, ...NODE_ID1_BYTES, ...uint16To8Array(ZSpec.HA_PROFILE_ID), CLUSTER_LIST1.length, ...CLUSTER_LIST1_BYTES, CLUSTER_LIST2.length, ...CLUSTER_LIST2_BYTES])
        );
        expect(
            BuffaloZdo.buildMatchDescriptorRequest(NODE_ID1, ZSpec.HA_PROFILE_ID, CLUSTER_LIST1, [])
        ).toStrictEqual(
            Buffer.from([0, ...NODE_ID1_BYTES, ...uint16To8Array(ZSpec.HA_PROFILE_ID), CLUSTER_LIST1.length, ...CLUSTER_LIST1_BYTES, 0])
        );
    });

    it('buildSystemServiceDiscoveryRequest', () => {
        expect(BuffaloZdo.buildSystemServiceDiscoveryRequest({
            primaryTrustCenter: 1, backupTrustCenter: 0, deprecated1: 0, deprecated2: 0, deprecated3: 0, deprecated4: 0,
            networkManager: 0, reserved1: 0, reserved2: 0, stackComplianceResivion: 0
        })).toStrictEqual(Buffer.from([0, ...uint16To8Array(0b0000000000000001)]));
        expect(BuffaloZdo.buildSystemServiceDiscoveryRequest({
            primaryTrustCenter: 1, backupTrustCenter: 0, deprecated1: 0, deprecated2: 0, deprecated3: 0, deprecated4: 0,
            networkManager: 1, reserved1: 0, reserved2: 0, stackComplianceResivion: 23
        })).toStrictEqual(Buffer.from([0, ...uint16To8Array(0b0010111001000001)]));
    });

    it('buildParentAnnounce', () => {
        const children = [IEEE_ADDRESS1, IEEE_ADDRESS2];
        expect(BuffaloZdo.buildParentAnnounce(children)).toStrictEqual(Buffer.from([0, children.length, ...IEEE_ADDRESS1_BYTES, ...IEEE_ADDRESS2_BYTES]));
    });

    it('buildBindRequest', () => {
        expect(
            BuffaloZdo.buildBindRequest(IEEE_ADDRESS1, 2, Zcl.Clusters.seMetering.ID, Zdo.UNICAST_BINDING, IEEE_ADDRESS2, 123, 64)
        ).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS1_BYTES, 2, ...uint16To8Array(Zcl.Clusters.seMetering.ID), Zdo.UNICAST_BINDING, ...IEEE_ADDRESS2_BYTES, 64]));
        expect(
            BuffaloZdo.buildBindRequest(IEEE_ADDRESS1, 3, Zcl.Clusters.seMetering.ID, Zdo.MULTICAST_BINDING, IEEE_ADDRESS2, 123, 64)
        ).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS1_BYTES, 3, ...uint16To8Array(Zcl.Clusters.seMetering.ID), Zdo.MULTICAST_BINDING, ...uint16To8Array(123)]));
    });

    it('buildUnbindRequest', () => {
        expect(
            BuffaloZdo.buildUnbindRequest(IEEE_ADDRESS1, 2, Zcl.Clusters.seMetering.ID, Zdo.UNICAST_BINDING, IEEE_ADDRESS2, 123, 64)
        ).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS1_BYTES, 2, ...uint16To8Array(Zcl.Clusters.seMetering.ID), Zdo.UNICAST_BINDING, ...IEEE_ADDRESS2_BYTES, 64]));
        expect(
            BuffaloZdo.buildUnbindRequest(IEEE_ADDRESS1, 3, Zcl.Clusters.seMetering.ID, Zdo.MULTICAST_BINDING, IEEE_ADDRESS2, 123, 64)
        ).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS1_BYTES, 3, ...uint16To8Array(Zcl.Clusters.seMetering.ID), Zdo.MULTICAST_BINDING, ...uint16To8Array(123)]));
    });

    it('Throws when buildBindRequest/buildUnbindRequest invalid type', () => {
        expect(() => {
            BuffaloZdo.buildBindRequest(IEEE_ADDRESS1, 2, Zcl.Clusters.seMetering.ID, 99, IEEE_ADDRESS2, 123, 64)
        }).toThrow(`Status 'NOT_SUPPORTED'`);
        expect(() => {
            BuffaloZdo.buildUnbindRequest(IEEE_ADDRESS1, 2, Zcl.Clusters.seMetering.ID, 99, IEEE_ADDRESS2, 123, 64)
        }).toThrow(`Status 'NOT_SUPPORTED'`);
    });

    it('buildClearAllBindingsRequest', () => {
        const eui64List = [IEEE_ADDRESS1, IEEE_ADDRESS2];
        expect(
            BuffaloZdo.buildClearAllBindingsRequest({eui64List} as ClearAllBindingsReqEUI64TLV)
        ).toStrictEqual(
            Buffer.from([0, 0, ZSpec.EUI64_SIZE * eui64List.length + 1 - 1, eui64List.length, ...IEEE_ADDRESS1_BYTES, ...IEEE_ADDRESS2_BYTES])
        );
        expect(
            BuffaloZdo.buildClearAllBindingsRequest({eui64List: []} as ClearAllBindingsReqEUI64TLV)
        ).toStrictEqual(
            Buffer.from([0, 0, 0, 0])
        );
    });

    it('buildLqiTableRequest', () => {
        expect(BuffaloZdo.buildLqiTableRequest(1)).toStrictEqual(Buffer.from([0, 1]));
        expect(BuffaloZdo.buildLqiTableRequest(254)).toStrictEqual(Buffer.from([0, 254]));
    });

    it('buildRoutingTableRequest', () => {
        expect(BuffaloZdo.buildRoutingTableRequest(1)).toStrictEqual(Buffer.from([0, 1]));
        expect(BuffaloZdo.buildRoutingTableRequest(254)).toStrictEqual(Buffer.from([0, 254]));
    });

    it('buildBindingTableRequest', () => {
        expect(BuffaloZdo.buildBindingTableRequest(1)).toStrictEqual(Buffer.from([0, 1]));
        expect(BuffaloZdo.buildBindingTableRequest(254)).toStrictEqual(Buffer.from([0, 254]));
    });

    it('buildLeaveRequest', () => {
        expect(
            BuffaloZdo.buildLeaveRequest(IEEE_ADDRESS2, Zdo.LeaveRequestFlags.WITHOUT_REJOIN)
        ).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS2_BYTES, Zdo.LeaveRequestFlags.WITHOUT_REJOIN]));
        expect(
            BuffaloZdo.buildLeaveRequest(IEEE_ADDRESS2, Zdo.LeaveRequestFlags.AND_REJOIN)
        ).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS2_BYTES, Zdo.LeaveRequestFlags.AND_REJOIN]));
    });

    it('buildPermitJoining', () => {
        expect(BuffaloZdo.buildPermitJoining(254, 1, [])).toStrictEqual(Buffer.from([0, 254, 1]));

        const tlvs = [{
            tagId: Zdo.GlobalTLV.BEACON_APPENDIX_ENCAPSULATION,
            length: 4,
            tlv: {
                additionalTLVs: [{tagId: Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, length: 2, tlv: {nwkAddress: NODE_ID1}}]
            },
        }];
        expect(
            BuffaloZdo.buildPermitJoining(255, 1, tlvs)
        ).toStrictEqual(Buffer.from([0, 255, 1, Zdo.GlobalTLV.BEACON_APPENDIX_ENCAPSULATION, 4 - 1, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 2 - 1, ...NODE_ID1_BYTES]));
    });

    it('buildScanChannelsRequest', () => {
        expect(
            BuffaloZdo.buildScanChannelsRequest(ZSpec.ALL_802_15_4_CHANNELS, 3, 3)
        ).toStrictEqual(Buffer.from([0, ...uint32To8Array(ZSpec.ALL_802_15_4_CHANNELS_MASK), 3, 3]));
        expect(
            BuffaloZdo.buildScanChannelsRequest(ZSpec.ALL_802_15_4_CHANNELS, 64, 3)
        ).toStrictEqual(Buffer.from([0, ...uint32To8Array(ZSpec.ALL_802_15_4_CHANNELS_MASK), 64/*, 3*/]));
    });

    it('buildChannelChangeRequest', () => {
        expect(BuffaloZdo.buildChannelChangeRequest(15, 1)).toStrictEqual(Buffer.from([0, ...uint32To8Array(ZSpec.Utils.channelsToUInt32Mask([15])), 0xFE, 1]));
    });

    it('buildSetActiveChannelsAndNwkManagerIdRequest', () => {
        expect(
            BuffaloZdo.buildSetActiveChannelsAndNwkManagerIdRequest(ZSpec.PREFERRED_802_15_4_CHANNELS, 3, 123)
        ).toStrictEqual(Buffer.from([0, ...uint32To8Array(ZSpec.PREFERRED_802_15_4_CHANNELS_MASK), 0xFF, 3, ...uint16To8Array(123)]));
    });

    it('buildEnhancedScanChannelsRequest', () => {
        const channelPages = [123, 54394, 29344];
        expect(
            BuffaloZdo.buildEnhancedScanChannelsRequest(channelPages, 5, 3, 1)
        ).toStrictEqual(
            Buffer.from([
                0, channelPages.length,
                ...uint32To8Array(channelPages[0]), ...uint32To8Array(channelPages[1]), ...uint32To8Array(channelPages[2]),
                5, 3, 1
            ])
        );
        expect(
            BuffaloZdo.buildEnhancedScanChannelsRequest(channelPages, 6, 3, 1)
        ).toStrictEqual(
            Buffer.from([
                0, channelPages.length,
                ...uint32To8Array(channelPages[0]), ...uint32To8Array(channelPages[1]), ...uint32To8Array(channelPages[2]),
                6/*, 3*/, 1
            ])
        );
    });

    it('buildEnhancedChannelChangeRequest', () => {
        const channelPage = 54394;
        expect(
            BuffaloZdo.buildEnhancedChannelChangeRequest(channelPage, 3, 1)
        ).toStrictEqual(Buffer.from([0, 1, ...uint32To8Array(channelPage), 0xFE, 3, 1]));
    });

    it('buildEnhancedSetActiveChannelsAndNwkManagerIdRequest', () => {
        const channelPages = [123, 54394, 29344];
        const nwkManagerAddr = 0xfe01;
        expect(
            BuffaloZdo.buildEnhancedSetActiveChannelsAndNwkManagerIdRequest(channelPages, 2, nwkManagerAddr, 1)
        ).toStrictEqual(
            Buffer.from([
                0, channelPages.length,
                ...uint32To8Array(channelPages[0]), ...uint32To8Array(channelPages[1]), ...uint32To8Array(channelPages[2]),
                0xFF, 2, ...uint16To8Array(nwkManagerAddr), 1
            ])
        );
    });

    it('buildNwkIEEEJoiningListRequest', () => {
        expect(BuffaloZdo.buildNwkIEEEJoiningListRequest(3)).toStrictEqual(Buffer.from([0, 3]));

    });

    it('buildNwkBeaconSurveyRequest', () => {
        const tlv: BeaconSurveyConfigurationTLV = {
            scanChannelList: [],
            configurationBitmask: 0
        };
        expect(BuffaloZdo.buildNwkBeaconSurveyRequest(tlv)).toStrictEqual(Buffer.from([0, 0, 2 - 1, 0, 0]));
        const tlv2: BeaconSurveyConfigurationTLV = {
            scanChannelList: [34252],
            configurationBitmask: 1
        };
        expect(BuffaloZdo.buildNwkBeaconSurveyRequest(tlv2)).toStrictEqual(Buffer.from([0, 0, 6 - 1, 1, ...uint32To8Array(tlv2.scanChannelList[0]), 1]));
        const tlv3: BeaconSurveyConfigurationTLV = {
            scanChannelList: [34252, 123],
            configurationBitmask: 1
        };
        expect(
            BuffaloZdo.buildNwkBeaconSurveyRequest(tlv3)
        ).toStrictEqual(
            Buffer.from([0, 0, 10 - 1, 2, ...uint32To8Array(tlv3.scanChannelList[0]), ...uint32To8Array(tlv3.scanChannelList[1]), 1])
        );
    });

    it('buildStartKeyNegotiationRequest', () => {
        const tlv: Curve25519PublicPointTLV = {
            eui64: IEEE_ADDRESS1,
            publicPoint: Buffer.alloc(Zdo.CURVE_PUBLIC_POINT_SIZE).fill(0xCD),
        };
        expect(
            BuffaloZdo.buildStartKeyNegotiationRequest(tlv)
        ).toStrictEqual(
            Buffer.from([0, 0, ZSpec.EUI64_SIZE + Zdo.CURVE_PUBLIC_POINT_SIZE - 1, ...IEEE_ADDRESS1_BYTES, ...tlv.publicPoint]
        ));
        const tlv2: Curve25519PublicPointTLV = {
            eui64: IEEE_ADDRESS2,
            publicPoint: Buffer.alloc(Zdo.CURVE_PUBLIC_POINT_SIZE).fill(0x3C),
        };
        expect(
            BuffaloZdo.buildStartKeyNegotiationRequest(tlv2)
        ).toStrictEqual(
            Buffer.from([0, 0, ZSpec.EUI64_SIZE + Zdo.CURVE_PUBLIC_POINT_SIZE - 1, ...IEEE_ADDRESS2_BYTES, ...tlv2.publicPoint]
        ));
    });

    it('buildRetrieveAuthenticationTokenRequest', () => {
        const tlv: AuthenticationTokenIdTLV = {tlvTypeTagId: 0};
        expect(BuffaloZdo.buildRetrieveAuthenticationTokenRequest(tlv)).toStrictEqual(Buffer.from([0, 0, 1 - 1, 0]));
        const tlv2: AuthenticationTokenIdTLV = {tlvTypeTagId: 31};
        expect(BuffaloZdo.buildRetrieveAuthenticationTokenRequest(tlv2)).toStrictEqual(Buffer.from([0, 0, 1 - 1, 31]));
    });

    it('buildGetAuthenticationLevelRequest', () => {
        const tlv: TargetIEEEAddressTLV = {ieee: IEEE_ADDRESS2};
        expect(BuffaloZdo.buildGetAuthenticationLevelRequest(tlv)).toStrictEqual(Buffer.from([0, 0, ZSpec.EUI64_SIZE - 1, ...IEEE_ADDRESS2_BYTES]));
    });

    it.each([
       {panId: 0xFEEF, channel: 0, configurationParameters: 0},
       {panId: 0x1234, channel: 15, configurationParameters: 0},
       {panId: 0x1234, channel: 0, configurationParameters: 1},
       {panId: 0x6543, channel: 45, configurationParameters: 1},
    ])('buildSetConfigurationRequest', ({panId, channel, configurationParameters}) => {
        expect(
            BuffaloZdo.buildSetConfigurationRequest(
                {panId} as NextPanIdChangeGlobalTLV,
                {channel} as NextChannelChangeGlobalTLV,
                {configurationParameters} as ConfigurationParametersGlobalTLV
            )
        ).toStrictEqual(
            Buffer.from([
                0,
                Zdo.GlobalTLV.NEXT_PAN_ID_CHANGE, ZSpec.PAN_ID_SIZE - 1, ...uint16To8Array(panId),
                Zdo.GlobalTLV.NEXT_CHANNEL_CHANGE, 4 - 1, ...uint32To8Array(channel),
                Zdo.GlobalTLV.CONFIGURATION_PARAMETERS, 2 - 1, ...uint16To8Array(configurationParameters)
            ])
        );
    });

    it('buildGetConfigurationRequest', () => {
        expect(BuffaloZdo.buildGetConfigurationRequest([84])).toStrictEqual(Buffer.from([0, 1, 84]));
        expect(BuffaloZdo.buildGetConfigurationRequest([67, 71])).toStrictEqual(Buffer.from([0, 2, 67, 71]));
    });

    it('buildStartKeyUpdateRequest', () => {
        const method: SelectedKeyNegotiationMethodTLV = {
            protocol: Zdo.SelectedKeyNegotiationProtocol.SPEKE_CURVE25519_SHA256,
            presharedSecret: Zdo.SelectedPreSharedSecret.BASIC_AUTHORIZATION_KEY,
            sendingDeviceEui64: IEEE_ADDRESS2,
        };
        const params: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID1,
            fragmentationOptions: 1,
            maxIncomingTransferUnit: 2345
        };
        expect(
            BuffaloZdo.buildStartKeyUpdateRequest(method, params)
        ).toStrictEqual(
            Buffer.from([
                0,
                0, ZSpec.EUI64_SIZE + 2 - 1, method.protocol, method.presharedSecret, ...IEEE_ADDRESS2_BYTES,
                Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 5 - 1, ...NODE_ID1_BYTES, params.fragmentationOptions!, ...uint16To8Array(params.maxIncomingTransferUnit!)
            ])
        );
    });

    it('buildDecommissionRequest', () => {
        const tlv: DeviceEUI64ListTLV = {
            eui64List: [IEEE_ADDRESS1]
        };
        expect(
            BuffaloZdo.buildDecommissionRequest(tlv)
        ).toStrictEqual(
            Buffer.from([0, 0, ZSpec.EUI64_SIZE * tlv.eui64List.length + 1 - 1, tlv.eui64List.length, ...IEEE_ADDRESS1_BYTES])
        );

        const tlv2: DeviceEUI64ListTLV = {
            eui64List: [IEEE_ADDRESS2, IEEE_ADDRESS1]
        };
        expect(
            BuffaloZdo.buildDecommissionRequest(tlv2)
        ).toStrictEqual(
            Buffer.from([0, 0, ZSpec.EUI64_SIZE * tlv2.eui64List.length + 1 - 1, tlv2.eui64List.length, ...IEEE_ADDRESS2_BYTES, ...IEEE_ADDRESS1_BYTES])
        );

        const tlv3: DeviceEUI64ListTLV = {
            eui64List: []
        };
        expect(
            BuffaloZdo.buildDecommissionRequest(tlv3)
        ).toStrictEqual(
            Buffer.from([0, 0, ZSpec.EUI64_SIZE * tlv3.eui64List.length + 1 - 1, tlv3.eui64List.length])
        );
    });

    it('buildChallengeRequest', () => {
        const tlv: APSFrameCounterChallengeTLV = {
            senderEui64: IEEE_ADDRESS2,
            challengeValue: Buffer.alloc(Zdo.CHALLENGE_VALUE_SIZE).fill(0xFE),
        };
        expect(
            BuffaloZdo.buildChallengeRequest(tlv)
        ).toStrictEqual(
            Buffer.from([0, 0, ZSpec.EUI64_SIZE + Zdo.CHALLENGE_VALUE_SIZE - 1, ...IEEE_ADDRESS2_BYTES, ...tlv.challengeValue])
        );

        const tlv2: APSFrameCounterChallengeTLV = {
            senderEui64: IEEE_ADDRESS1,
            challengeValue: Buffer.from([0xFE, 0xAC, 0x12, 0x23, 0x85, 0x8C, 0x7C, 0xA3]),
        };
        expect(
            BuffaloZdo.buildChallengeRequest(tlv2)
        ).toStrictEqual(
            Buffer.from([0, 0, ZSpec.EUI64_SIZE + Zdo.CHALLENGE_VALUE_SIZE - 1, ...IEEE_ADDRESS1_BYTES, ...tlv2.challengeValue])
        );
    });
    
    it.each([
        'readNetworkAddressResponse',
        'readIEEEAddressResponse',
        'readNodeDescriptorResponse',
        'readPowerDescriptorResponse',
        'readSimpleDescriptorResponse',
        'readActiveEndpointsResponse',
        'readMatchDescriptorsResponse',
        'readSystemServerDiscoveryResponse',
        'readParentAnnounceResponse',
        'readBindResponse',
        'readUnbindResponse',
        'readClearAllBindingsResponse',
        'readLQITableResponse',
        'readRoutingTableResponse',
        'readBindingTableResponse',
        'readLeaveResponse',
        'readPermitJoiningResponse',
        'readNwkUpdateResponse',
        'readNwkEnhancedUpdateResponse',
        'readNwkIEEEJoiningListResponse',
        'readNwkUnsolicitedEnhancedUpdateResponse',
        'readNwkBeaconSurveyResponse',
        'readStartKeyNegotiationResponse',
        'readRetrieveAuthenticationTokenResponse',
        'readGetAuthenticationLevelResponse',
        'readSetConfigurationResponse',
        'readGetConfigurationResponse',
        'readStartKeyUpdateResponse',
        'readDecommissionResponse',
        'readChallengeResponse',
    ])('Throws status error when reading unsuccessful response for %s', (func) => {
        const buffalo = new BuffaloZdo(Buffer.from([Zdo.Status.INV_REQUESTTYPE, 1, 2, 3]));
        expect(() => {
            buffalo[func]();
        }).toThrow(new Zdo.StatusError(Zdo.Status.INV_REQUESTTYPE));
    });

    it.each([
        [Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, 'readNetworkAddressResponse'],
        [Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, 'readIEEEAddressResponse'],
        [Zdo.ClusterId.NODE_DESCRIPTOR_RESPONSE, 'readNodeDescriptorResponse'],
        [Zdo.ClusterId.POWER_DESCRIPTOR_RESPONSE, 'readPowerDescriptorResponse'],
        [Zdo.ClusterId.SIMPLE_DESCRIPTOR_RESPONSE, 'readSimpleDescriptorResponse'],
        [Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE, 'readActiveEndpointsResponse'],
        [Zdo.ClusterId.MATCH_DESCRIPTORS_RESPONSE, 'readMatchDescriptorsResponse'],
        [Zdo.ClusterId.END_DEVICE_ANNOUNCE, 'readEndDeviceAnnounce'],
        [Zdo.ClusterId.SYSTEM_SERVER_DISCOVERY_RESPONSE, 'readSystemServerDiscoveryResponse'],
        [Zdo.ClusterId.PARENT_ANNOUNCE_RESPONSE, 'readParentAnnounceResponse'],
        [Zdo.ClusterId.BIND_RESPONSE, 'readBindResponse'],
        [Zdo.ClusterId.UNBIND_RESPONSE, 'readUnbindResponse'],
        [Zdo.ClusterId.CLEAR_ALL_BINDINGS_RESPONSE, 'readClearAllBindingsResponse'],
        [Zdo.ClusterId.LQI_TABLE_RESPONSE, 'readLQITableResponse'],
        [Zdo.ClusterId.ROUTING_TABLE_RESPONSE, 'readRoutingTableResponse'],
        [Zdo.ClusterId.BINDING_TABLE_RESPONSE, 'readBindingTableResponse'],
        [Zdo.ClusterId.LEAVE_RESPONSE, 'readLeaveResponse'],
        [Zdo.ClusterId.PERMIT_JOINING_RESPONSE, 'readPermitJoiningResponse'],
        [Zdo.ClusterId.NWK_UPDATE_RESPONSE, 'readNwkUpdateResponse'],
        [Zdo.ClusterId.NWK_ENHANCED_UPDATE_RESPONSE, 'readNwkEnhancedUpdateResponse'],
        [Zdo.ClusterId.NWK_IEEE_JOINING_LIST_REPONSE, 'readNwkIEEEJoiningListResponse'],
        [Zdo.ClusterId.NWK_UNSOLICITED_ENHANCED_UPDATE_RESPONSE, 'readNwkUnsolicitedEnhancedUpdateResponse'],
        [Zdo.ClusterId.NWK_BEACON_SURVEY_RESPONSE, 'readNwkBeaconSurveyResponse'],
        [Zdo.ClusterId.START_KEY_NEGOTIATION_RESPONSE, 'readStartKeyNegotiationResponse'],
        [Zdo.ClusterId.RETRIEVE_AUTHENTICATION_TOKEN_RESPONSE, 'readRetrieveAuthenticationTokenResponse'],
        [Zdo.ClusterId.GET_AUTHENTICATION_LEVEL_RESPONSE, 'readGetAuthenticationLevelResponse'],
        [Zdo.ClusterId.SET_CONFIGURATION_RESPONSE, 'readSetConfigurationResponse'],
        [Zdo.ClusterId.GET_CONFIGURATION_RESPONSE, 'readGetConfigurationResponse'],
        [Zdo.ClusterId.START_KEY_UPDATE_RESPONSE, 'readStartKeyUpdateResponse'],
        [Zdo.ClusterId.DECOMMISSION_RESPONSE, 'readDecommissionResponse'],
        [Zdo.ClusterId.CHALLENGE_RESPONSE, 'readChallengeResponse'],
    ])('Reads response by cluster ID %s', (clusterId, func) => {
        // @ts-expect-error TS typing is lost here ;(
        const readSpy = jest.spyOn(BuffaloZdo.prototype, func).mockImplementationOnce(jest.fn());// passing bogus data, don't want to actually call it
        BuffaloZdo.readResponse(clusterId, Buffer.from([123]));
        expect(readSpy).toHaveBeenCalledTimes(1);
    });

    it('Throws when reading unknown cluster ID', () => {
        const clusterId = Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST;

        expect(() => {
            BuffaloZdo.readResponse(clusterId, Buffer.from([123]));
        }).toThrow(`Unsupported response reading for cluster ID '${clusterId}'.`);
    })

    it('readNetworkAddressResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, ...IEEE_ADDRESS1_BYTES, ...NODE_ID1_BYTES]);
        expect(new BuffaloZdo(buffer).readNetworkAddressResponse()).toStrictEqual({
            eui64: IEEE_ADDRESS1,
            nwkAddress: NODE_ID1,
            startIndex: 0,
            assocDevList: [],
        } as NetworkAddressResponse);
        const bufferWAssoc = Buffer.from([Zdo.Status.SUCCESS, ...IEEE_ADDRESS2_BYTES, ...NODE_ID1_BYTES, 2, 3, ...uint16To8Array(123), ...uint16To8Array(52523)]);
        expect(new BuffaloZdo(bufferWAssoc).readNetworkAddressResponse()).toStrictEqual({
            eui64: IEEE_ADDRESS2,
            nwkAddress: NODE_ID1,
            startIndex: 3,
            assocDevList: [123, 52523],
        } as NetworkAddressResponse);
    });

    it('readIEEEAddressResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, ...IEEE_ADDRESS1_BYTES, ...NODE_ID1_BYTES]);
        expect(new BuffaloZdo(buffer).readIEEEAddressResponse()).toStrictEqual({
            eui64: IEEE_ADDRESS1,
            nwkAddress: NODE_ID1,
            startIndex: 0,
            assocDevList: [],
        } as IEEEAddressResponse);
        const bufferWAssoc = Buffer.from([Zdo.Status.SUCCESS, ...IEEE_ADDRESS2_BYTES, ...NODE_ID1_BYTES, 2, 3, ...uint16To8Array(123), ...uint16To8Array(52523)]);
        expect(new BuffaloZdo(bufferWAssoc).readIEEEAddressResponse()).toStrictEqual({
            eui64: IEEE_ADDRESS2,
            nwkAddress: NODE_ID1,
            startIndex: 3,
            assocDevList: [123, 52523],
        } as IEEEAddressResponse);
    });

    it('readNodeDescriptorResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS, ...NODE_ID1_BYTES,
            0b00100010, 0b00100000, 0b00001110,
            ...uint16To8Array(Zcl.ManufacturerCode.BARACODA_SA), 0x7c, ...uint16To8Array(0x7eff),
            ...uint16To8Array(SERVER_MASK_R22_BYTE), ...uint16To8Array(0x3cff), 0
        ]);
        expect(new BuffaloZdo(buffer).readNodeDescriptorResponse()).toStrictEqual({
            nwkAddress: NODE_ID1,
            logicalType: 0b010,
            fragmentationSupported: null,
            apsFlags: 0,
            frequencyBand: 0b00100,
            capabilities: {
                alternatePANCoordinator: 0,
                deviceType: 1,
                powerSource: 1,
                rxOnWhenIdle: 1,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 0,
            },
            manufacturerCode: Zcl.ManufacturerCode.BARACODA_SA,
            maxBufSize: 0x7c,
            maxIncTxSize: 0x7eff,
            serverMask: SERVER_MASK_R22,
            maxOutTxSize: 0x3cff,
            deprecated1: 0,
            tlvs: [],
        } as NodeDescriptorResponse);

        const tlv: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID1,
            fragmentationOptions: 1,
            maxIncomingTransferUnit: 65352,
        };
        const buffer2 = Buffer.from([
            Zdo.Status.SUCCESS, ...NODE_ID1_BYTES,
            0b00100010, 0b00100000, 0b00001110,
            ...uint16To8Array(Zcl.ManufacturerCode.BEIJING_RUYING_TECH_LIMITED), 0x3a, ...uint16To8Array(0x7cff),
            ...uint16To8Array(SERVER_MASK_R23_BYTE), ...uint16To8Array(0x11ff), 0,
            Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 5 - 1, ...uint16To8Array(tlv.nwkAddress), tlv.fragmentationOptions!, ...uint16To8Array(tlv.maxIncomingTransferUnit!)
        ]);
        expect(new BuffaloZdo(buffer2).readNodeDescriptorResponse()).toStrictEqual({
            nwkAddress: NODE_ID1,
            logicalType: 0b010,
            fragmentationSupported: true,
            apsFlags: 0,
            frequencyBand: 0b00100,
            capabilities: {
                alternatePANCoordinator: 0,
                deviceType: 1,
                powerSource: 1,
                rxOnWhenIdle: 1,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 0,
                allocateAddress: 0,
            },
            manufacturerCode: Zcl.ManufacturerCode.BEIJING_RUYING_TECH_LIMITED,
            maxBufSize: 0x3a,
            maxIncTxSize: 0x7cff,
            serverMask: SERVER_MASK_R23,
            maxOutTxSize: 0x11ff,
            deprecated1: 0,
            tlvs: [{tagId: Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, length: 5, tlv}],
        } as NodeDescriptorResponse);
    });

    it('readPowerDescriptorResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS, ...NODE_ID1_BYTES, 0b10100100, 0b11110100
        ]);
        expect(new BuffaloZdo(buffer).readPowerDescriptorResponse()).toStrictEqual({
            nwkAddress: NODE_ID1,
            currentPowerMode: 0b0100,
            availPowerSources: 0b1010,
            currentPowerSource: 0b0100,
            currentPowerSourceLevel: 0b1111,
        } as PowerDescriptorResponse);
    });

    it('readSimpleDescriptorResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS, ...NODE_ID1_BYTES, 8,
            ZSpec.HA_ENDPOINT, ...uint16To8Array(ZSpec.HA_PROFILE_ID), ...uint16To8Array(123), 0,
            2, ...uint16To8Array(7653), ...uint16To8Array(624), 1, ...uint16To8Array(5322)
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readSimpleDescriptorResponse()).toStrictEqual({
            nwkAddress: NODE_ID1, 
            endpoint: ZSpec.HA_ENDPOINT,
            profileId: ZSpec.HA_PROFILE_ID,
            deviceId: 123,
            deviceVersion: 0,
            inClusterList: [7653, 624],
            outClusterList: [5322],
        } as SimpleDescriptorResponse);
        const bufferEmpty = Buffer.from([
            Zdo.Status.SUCCESS, ...NODE_ID1_BYTES, 8,
            ZSpec.HA_ENDPOINT, ...uint16To8Array(ZSpec.HA_PROFILE_ID), ...uint16To8Array(123), 0, 0, 0
        ]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readSimpleDescriptorResponse()).toStrictEqual({
            nwkAddress: NODE_ID1, 
            endpoint: ZSpec.HA_ENDPOINT,
            profileId: ZSpec.HA_PROFILE_ID,
            deviceId: 123,
            deviceVersion: 0,
            inClusterList: [],
            outClusterList: [],
        } as SimpleDescriptorResponse);
    });

    it('readActiveEndpointsResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, ...NODE_ID1_BYTES, 2, 0xEF, 0x87]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readActiveEndpointsResponse()).toStrictEqual({
            nwkAddress: NODE_ID1,
            endpointList: [0xEF, 0x87],
        } as ActiveEndpointsResponse);
        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, ...NODE_ID1_BYTES, 0]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readActiveEndpointsResponse()).toStrictEqual({
            nwkAddress: NODE_ID1,
            endpointList: [],
        } as ActiveEndpointsResponse);
    });

    it('readMatchDescriptorsResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, ...NODE_ID1_BYTES, 2, 0xEF, 0x87]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readMatchDescriptorsResponse()).toStrictEqual({
            nwkAddress: NODE_ID1,
            endpointList: [0xEF, 0x87],
        } as MatchDescriptorsResponse);
        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, ...NODE_ID1_BYTES, 0]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readMatchDescriptorsResponse()).toStrictEqual({
            nwkAddress: NODE_ID1,
            endpointList: [],
        } as MatchDescriptorsResponse);
    });

    it('readEndDeviceAnnounce', () => {
        const buffer = Buffer.from([...NODE_ID1_BYTES, ...IEEE_ADDRESS2_BYTES, 0b01000000]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readEndDeviceAnnounce()).toStrictEqual({
            nwkAddress: NODE_ID1,
            eui64: IEEE_ADDRESS2,
            capabilities: {
                alternatePANCoordinator: 0,
                deviceType: 0,
                powerSource: 0,
                rxOnWhenIdle: 0,
                reserved1: 0,
                reserved2: 0,
                securityCapability: 1,
                allocateAddress: 0,
            },
        } as EndDeviceAnnounce);
    });

    it('readSystemServerDiscoveryResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, ...uint16To8Array(SERVER_MASK_R23_BYTE)]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readSystemServerDiscoveryResponse()).toStrictEqual({
            serverMask: SERVER_MASK_R23,
        } as SystemServerDiscoveryResponse);
    });

    it('readParentAnnounceResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, 2, ...IEEE_ADDRESS2_BYTES, ...IEEE_ADDRESS1_BYTES]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readParentAnnounceResponse()).toStrictEqual({
            children: [IEEE_ADDRESS2, IEEE_ADDRESS1],
        });
        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, 0]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readParentAnnounceResponse()).toStrictEqual({
            children: [],
        });
    });

    it('readLQITableResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, 16, 3, 2,
            ...EXT_PAN_ID2, ...IEEE_ADDRESS1_BYTES, ...NODE_ID2_BYTES, 0b00100101, 0b00000001, 1, 235,
            ...EXT_PAN_ID1, ...IEEE_ADDRESS2_BYTES, ...NODE_ID1_BYTES, 0b01000010, 0b00000000, 1, 179
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readLQITableResponse()).toStrictEqual({
            neighborTableEntries: 16,
            startIndex: 3,
            entryList: [
                {
                    extendedPanId: EXT_PAN_ID2,
                    eui64: IEEE_ADDRESS1,
                    nwkAddress: NODE_ID2,
                    deviceType: 1,
                    rxOnWhenIdle: 1,
                    relationship: 2,
                    reserved1: 0,
                    permitJoining: 1,
                    reserved2: 0,
                    depth: 1,
                    lqi: 235,
                },
                {
                    extendedPanId: EXT_PAN_ID1,
                    eui64: IEEE_ADDRESS2,
                    nwkAddress: NODE_ID1,
                    deviceType: 2,
                    rxOnWhenIdle: 0,
                    relationship: 4,
                    reserved1: 0,
                    permitJoining: 0,
                    reserved2: 0,
                    depth: 1,
                    lqi: 179,
                },
            ],
        } as LQITableResponse);

        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, 5, 4, 0]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readLQITableResponse()).toStrictEqual({
            neighborTableEntries: 5,
            startIndex: 4,
            entryList: [],
        } as LQITableResponse);
    });

    it('readRoutingTableResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, 4, 3, 1, ...NODE_ID2_BYTES, 0b00101000, ...NODE_ID1_BYTES]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readRoutingTableResponse()).toStrictEqual({
            routingTableEntries: 4,
            startIndex: 3,
            entryList: [
                {
                    destinationAddress: NODE_ID2,
                    status: 0,
                    memoryConstrained: 1,
                    manyToOne: 0,
                    routeRecordRequired: 1,
                    reserved1: 0,
                    nextHopAddress: NODE_ID1,
                },
            ],
        } as RoutingTableResponse);

        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, 0, 0, 0]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readRoutingTableResponse()).toStrictEqual({
            routingTableEntries: 0,
            startIndex: 0,
            entryList: [],
        } as RoutingTableResponse);
    });

    it('readBindingTableResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS, 1, 0, 3,
            ...IEEE_ADDRESS1_BYTES, 0xf0, ...uint16To8Array(Zcl.Clusters.barrierControl.ID), 0x03, ...IEEE_ADDRESS2_BYTES, ZSpec.GP_ENDPOINT,
            ...IEEE_ADDRESS2_BYTES, 0x34, ...uint16To8Array(Zcl.Clusters.closuresShadeCfg.ID), 0x01, ...NODE_ID2_BYTES,
            ...IEEE_ADDRESS2_BYTES, 0xf4, ...uint16To8Array(Zcl.Clusters.genAnalogInput.ID), 0x02
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readBindingTableResponse()).toStrictEqual({
            bindingTableEntries: 1,
            startIndex: 0,
            entryList: [
                {
                    sourceEui64: IEEE_ADDRESS1,
                    sourceEndpoint: 0xf0,
                    clusterId: Zcl.Clusters.barrierControl.ID,
                    destAddrMode: 0x03,
                    dest: IEEE_ADDRESS2,
                    destEndpoint: ZSpec.GP_ENDPOINT,
                },
                {
                    sourceEui64: IEEE_ADDRESS2,
                    sourceEndpoint: 0x34,
                    clusterId: Zcl.Clusters.closuresShadeCfg.ID,
                    destAddrMode: 0x01,
                    dest: NODE_ID2,
                    destEndpoint: null,
                },
                {
                    sourceEui64: IEEE_ADDRESS2,
                    sourceEndpoint: 0xf4,
                    clusterId: Zcl.Clusters.genAnalogInput.ID,
                    destAddrMode: 0x02,
                    dest: null,
                    destEndpoint: null,
                },
            ],
        } as BindingTableResponse);
    
        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, 30, 2, 0]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readBindingTableResponse()).toStrictEqual({
            bindingTableEntries: 30,
            startIndex: 2,
            entryList: [],
        } as BindingTableResponse);
    });

    it('readNwkUpdateResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, ...uint32To8Array(34732495), ...uint16To8Array(445), ...uint16To8Array(34), 3, 0x43, 0xff, 0x6f]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readNwkUpdateResponse()).toStrictEqual({
            scannedChannels: 34732495,
            totalTransmissions: 445,
            totalFailures: 34,
            entryList: [0x43, 0xff, 0x6f],
        } as NwkUpdateResponse);
    });

    it('readNwkEnhancedUpdateResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, ...uint32To8Array(34732495), ...uint16To8Array(445), ...uint16To8Array(34), 3, 0x43, 0xff, 0x6f]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readNwkEnhancedUpdateResponse()).toStrictEqual({
            scannedChannels: 34732495,
            totalTransmissions: 445,
            totalFailures: 34,
            entryList: [0x43, 0xff, 0x6f],
        } as NwkEnhancedUpdateResponse);
    });

    it('readNwkIEEEJoiningListResponse', () => {
        const buffer = Buffer.from([Zdo.Status.SUCCESS, 3, Zdo.JoiningPolicy.IEEELIST_JOIN, 4, 0, 2, ...IEEE_ADDRESS2_BYTES, ...IEEE_ADDRESS1_BYTES]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readNwkIEEEJoiningListResponse()).toStrictEqual({
            updateId: 3,
            joiningPolicy: Zdo.JoiningPolicy.IEEELIST_JOIN,
            entryListTotal: 4,
            startIndex: 0,
            entryList: [IEEE_ADDRESS2, IEEE_ADDRESS1],
        } as NwkIEEEJoiningListResponse);
        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, 0xff, Zdo.JoiningPolicy.ALL_JOIN, 0]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readNwkIEEEJoiningListResponse()).toStrictEqual({
            updateId: 0xff,
            joiningPolicy: Zdo.JoiningPolicy.ALL_JOIN,
            entryListTotal: 0,
            startIndex: undefined,
            entryList: undefined,
        } as NwkIEEEJoiningListResponse);
    });

    it('readNwkUnsolicitedEnhancedUpdateResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS, ...uint32To8Array(9023342),
            ...uint16To8Array(3454), ...uint16To8Array(435), ...uint16To8Array(1239), 32
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readNwkUnsolicitedEnhancedUpdateResponse()).toStrictEqual({
            channelInUse: 9023342,
            macTxUCastTotal: 3454,
            macTxUCastFailures: 435,
            macTxUCastRetries: 1239,
            timePeriod: 32,
        } as NwkUnsolicitedEnhancedUpdateResponse);
    });

    it('readNwkBeaconSurveyResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS,
            0x01, 4 - 1, 14, 7, 5, 2,
            0x02, 7 - 1, ...NODE_ID1_BYTES, 234, 1, ...NODE_ID2_BYTES, 223
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readNwkBeaconSurveyResponse()).toStrictEqual({
            tlvs: [
                {tagId: 0x01, length: 4, tlv: {
                    totalBeaconsReceived: 14,
                    onNetworkBeacons: 7,
                    potentialParentBeacons: 5,
                    otherNetworkBeacons: 2,
                } as BeaconSurveyResultsTLV},
                {tagId: 0x02, length: 7, tlv: {
                    currentParentNwkAddress: NODE_ID1,
                    currentParentLQA: 234,
                    entryCount: 1,
                    potentialParents: [{nwkAddress: NODE_ID2, lqa: 223}],
                } as PotentialParentsTLV},
            ],
        } as NwkBeaconSurveyResponse);

        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readNwkBeaconSurveyResponse()).toStrictEqual({
            tlvs: []
        } as NwkBeaconSurveyResponse);
    });

    it('readStartKeyNegotiationResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS, 0x00, ZSpec.EUI64_SIZE + Zdo.CURVE_PUBLIC_POINT_SIZE - 1,
            ...IEEE_ADDRESS2_BYTES, ...Buffer.alloc(Zdo.CURVE_PUBLIC_POINT_SIZE).fill(0xAB)
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readStartKeyNegotiationResponse()).toStrictEqual({
            tlvs: [
                {tagId: 0x00, length: ZSpec.EUI64_SIZE + Zdo.CURVE_PUBLIC_POINT_SIZE, tlv: {
                    eui64: IEEE_ADDRESS2,
                    publicPoint: Buffer.alloc(Zdo.CURVE_PUBLIC_POINT_SIZE).fill(0xAB),
                } as Curve25519PublicPointTLV},
            ],
        });
    });

    it('readRetrieveAuthenticationTokenResponse', () => {
        // this one has no local TLV, so test with a global one
        const tlv: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID1,
            fragmentationOptions: 1,
            maxIncomingTransferUnit: 65352,
        };
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS,
            Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 5 - 1, ...uint16To8Array(tlv.nwkAddress), tlv.fragmentationOptions!, ...uint16To8Array(tlv.maxIncomingTransferUnit!)
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readRetrieveAuthenticationTokenResponse()).toStrictEqual({
            tlvs: [{tagId: Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, length: 5, tlv}],
        });

        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readRetrieveAuthenticationTokenResponse()).toStrictEqual({
            tlvs: [],
        });
    });

    it('readGetAuthenticationLevelResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS,
            0x00, 10 - 1, ...IEEE_ADDRESS2_BYTES, Zdo.InitialJoinMethod.INSTALL_CODE_KEY, Zdo.ActiveLinkKeyType.AUTHENTICATED_KEY_NEGOTIATION
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readGetAuthenticationLevelResponse()).toStrictEqual({
            tlvs: [
                {tagId: 0x00, length: 10, tlv: {
                    remoteNodeIeee: IEEE_ADDRESS2,
                    initialJoinMethod: Zdo.InitialJoinMethod.INSTALL_CODE_KEY,
                    activeLinkKeyType: Zdo.ActiveLinkKeyType.AUTHENTICATED_KEY_NEGOTIATION,
                } as DeviceAuthenticationLevelTLV},
            ],
        });
    });

    it('readSetConfigurationResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS,
            0x00, 7 - 1, 3,
            0x00, Zdo.Status.SUCCESS,
            Zdo.GlobalTLV.CONFIGURATION_PARAMETERS, Zdo.Status.SUCCESS,
            Zdo.GlobalTLV.ROUTER_INFORMATION, Zdo.Status.INV_REQUESTTYPE,
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readSetConfigurationResponse()).toStrictEqual({
            tlvs: [
                {tagId: 0x00, length: 7, tlv: {
                    count: 3,
                    tlvs: [
                        {tagId: 0x00, processingStatus: Zdo.Status.SUCCESS},
                        {tagId: Zdo.GlobalTLV.CONFIGURATION_PARAMETERS, processingStatus: Zdo.Status.SUCCESS},
                        {tagId: Zdo.GlobalTLV.ROUTER_INFORMATION, processingStatus: Zdo.Status.INV_REQUESTTYPE},
                    ],
                } as ProcessingStatusTLV},
            ],
        });

        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, 0x00, 1 - 1, 0]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readSetConfigurationResponse()).toStrictEqual({
            tlvs: [
                {tagId: 0x00, length: 1, tlv: {
                    count: 0,
                    tlvs: [],
                } as ProcessingStatusTLV},
            ],
        });
    });

    it('readGetConfigurationResponse', () => {
        // this one has no local TLV, so test with a global one
        const tlv: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID1,
            fragmentationOptions: 1,
            maxIncomingTransferUnit: 65352,
        };
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS,
            Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 5 - 1, ...uint16To8Array(tlv.nwkAddress), tlv.fragmentationOptions!, ...uint16To8Array(tlv.maxIncomingTransferUnit!)
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readGetConfigurationResponse()).toStrictEqual({
            tlvs: [{tagId: Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, length: 5, tlv}],
        });

        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS, ]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readGetConfigurationResponse()).toStrictEqual({
            tlvs: [],
        });
    });

    it('readChallengeResponse', () => {
        const buffer = Buffer.from([
            Zdo.Status.SUCCESS,
            0x00, 32 - 1, ...IEEE_ADDRESS1_BYTES, ...Buffer.alloc(Zdo.CHALLENGE_VALUE_SIZE).fill(0x39),
            ...uint32To8Array(4302952), ...uint32To8Array(12435682), ...Buffer.from([0xff, 0xfe, 0x34, 0x04, 0x49, 0x9f, 0x03, 0xbc])
        ]);
        expect(new BuffaloZdo(Buffer.from(buffer)).readChallengeResponse()).toStrictEqual({
            tlvs: [
                {tagId: 0x00, length: 32, tlv: {
                    responderEui64: IEEE_ADDRESS1,
                    receivedChallengeValue: Buffer.alloc(Zdo.CHALLENGE_VALUE_SIZE).fill(0x39),
                    apsFrameCounter: 4302952,
                    challengeSecurityFrameCounter: 12435682,
                    mic: Buffer.from([0xff, 0xfe, 0x34, 0x04, 0x49, 0x9f, 0x03, 0xbc]),
                } as APSFrameCounterResponseTLV}
            ]
        });

        const bufferEmpty = Buffer.from([Zdo.Status.SUCCESS]);
        expect(new BuffaloZdo(Buffer.from(bufferEmpty)).readChallengeResponse()).toStrictEqual({
            tlvs: []
        });
    });

});
