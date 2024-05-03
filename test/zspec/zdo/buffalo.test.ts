import * as ZSpec from '../../../src/zspec';
import {ClusterId, EUI64, NodeId} from '../../../src/zspec/tstypes';
import * as Zcl from '../../../src/zspec/zcl';
import * as Zdo from '../../../src/zspec/zdo';
import {BuffaloZdo} from '../../../src/zspec/zdo/buffaloZdo';
import {APSFrameCounterChallengeTLV, AuthenticationTokenIdTLV, BeaconSurveyConfigurationTLV, ClearAllBindingsReqEUI64TLV, ConfigurationParametersGlobalTLV, Curve25519PublicPointTLV, DeviceEUI64ListTLV, FragmentationParametersGlobalTLV, NextChannelChangeGlobalTLV, NextPanIdChangeGlobalTLV, SelectedKeyNegotiationMethodTLV, TargetIEEEAddressTLV} from '../../../src/zspec/zdo/definition/tstypes';
import {uint16To8Array, uint32To8Array} from '../../utils/math';

const IEEE_ADDRESS1: EUI64 = `0xfe34ac2385ff8311`;
const IEEE_ADDRESS1_BYTES = [0x11, 0x83, 0xff, 0x85, 0x23, 0xac, 0x34, 0xfe];
const IEEE_ADDRESS2: EUI64 = `0x28373fecd834ba37`;
const IEEE_ADDRESS2_BYTES = [0x37, 0xba, 0x34, 0xd8, 0xec, 0x3f, 0x37, 0x28];
const NODE_ID: NodeId = 0xfe32;
const NODE_ID_BYTES = uint16To8Array(NODE_ID);
const CLUSTER_LIST1: ClusterId[] = [Zcl.Clusters.genAlarms.ID, Zcl.Clusters.seMetering.ID, Zcl.Clusters.haApplianceStatistics.ID];
const CLUSTER_LIST1_BYTES = [...uint16To8Array(CLUSTER_LIST1[0]), ...uint16To8Array(CLUSTER_LIST1[1]), ...uint16To8Array(CLUSTER_LIST1[2])];
const CLUSTER_LIST2: ClusterId[] = [Zcl.Clusters.genOnOff.ID, Zcl.Clusters.genBasic.ID, Zcl.Clusters.ssIasZone.ID, Zcl.Clusters.genLevelCtrl.ID];
const CLUSTER_LIST2_BYTES = [...uint16To8Array(CLUSTER_LIST2[0]), ...uint16To8Array(CLUSTER_LIST2[1]), ...uint16To8Array(CLUSTER_LIST2[2]), ...uint16To8Array(CLUSTER_LIST2[3])];

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

    it('buildNetworkAddressRequest', () => {
        expect(BuffaloZdo.buildNetworkAddressRequest(IEEE_ADDRESS1, false, 1)).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS1_BYTES, 0, 1]));
        expect(BuffaloZdo.buildNetworkAddressRequest(IEEE_ADDRESS2, true, 3)).toStrictEqual(Buffer.from([0, ...IEEE_ADDRESS2_BYTES, 1, 3]))
    });

    it('buildIeeeAddressRequest', () => {
        expect(BuffaloZdo.buildIeeeAddressRequest(NODE_ID, false, 1)).toStrictEqual(Buffer.from([0, ...NODE_ID_BYTES, 0, 1]));
        expect(BuffaloZdo.buildIeeeAddressRequest(NODE_ID, true, 3)).toStrictEqual(Buffer.from([0, ...NODE_ID_BYTES, 1, 3]))
    });

    it('buildNodeDescriptorRequest', () => {
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID)).toStrictEqual(Buffer.from([0, ...NODE_ID_BYTES]));

        const tlv: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID,
            /*fragmentationOptions: undefined,*/
            /*maxIncomingTransferUnit: undefined,*/
        };
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID, tlv)).toStrictEqual(
            Buffer.from([0, ...NODE_ID_BYTES, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 1, ...uint16To8Array(tlv.nwkAddress)])
        );

        const tlv2: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID,
            fragmentationOptions: 1,
            /*maxIncomingTransferUnit: undefined,*/
        };
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID, tlv2)).toStrictEqual(
            Buffer.from([0, ...NODE_ID_BYTES, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 2, ...uint16To8Array(tlv2.nwkAddress), 1])
        );

        const tlv3: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID,
            /*fragmentationOptions: undefined,*/
            maxIncomingTransferUnit: 256,
        };
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID, tlv3)).toStrictEqual(
            Buffer.from([0, ...NODE_ID_BYTES, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 3, ...uint16To8Array(tlv3.nwkAddress), ...uint16To8Array(tlv3.maxIncomingTransferUnit!)])
        );

        const tlv4: FragmentationParametersGlobalTLV = {
            nwkAddress: NODE_ID,
            fragmentationOptions: 1,
            maxIncomingTransferUnit: 65352,
        };
        expect(BuffaloZdo.buildNodeDescriptorRequest(NODE_ID, tlv4)).toStrictEqual(
            Buffer.from([0, ...NODE_ID_BYTES, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 4, ...uint16To8Array(tlv4.nwkAddress), 1, ...uint16To8Array(tlv4.maxIncomingTransferUnit!)])
        );
    });

    it('buildPowerDescriptorRequest', () => {
        expect(BuffaloZdo.buildPowerDescriptorRequest(NODE_ID)).toStrictEqual(Buffer.from([0, ...NODE_ID_BYTES]));
    });

    it('buildSimpleDescriptorRequest', () => {
        expect(BuffaloZdo.buildSimpleDescriptorRequest(NODE_ID, 3)).toStrictEqual(Buffer.from([0, ...NODE_ID_BYTES, 3]));
    });

    it('buildActiveEndpointsRequest', () => {
        expect(BuffaloZdo.buildActiveEndpointsRequest(NODE_ID)).toStrictEqual(Buffer.from([0, ...NODE_ID_BYTES]));
    });

    it('buildMatchDescriptorRequest', () => {
        expect(
            BuffaloZdo.buildMatchDescriptorRequest(NODE_ID, ZSpec.HA_PROFILE_ID, CLUSTER_LIST1, CLUSTER_LIST2)
        ).toStrictEqual(
            Buffer.from([0, ...NODE_ID_BYTES, ...uint16To8Array(ZSpec.HA_PROFILE_ID), CLUSTER_LIST1.length, ...CLUSTER_LIST1_BYTES, CLUSTER_LIST2.length, ...CLUSTER_LIST2_BYTES])
        );
        expect(
            BuffaloZdo.buildMatchDescriptorRequest(NODE_ID, ZSpec.HA_PROFILE_ID, CLUSTER_LIST1, [])
        ).toStrictEqual(
            Buffer.from([0, ...NODE_ID_BYTES, ...uint16To8Array(ZSpec.HA_PROFILE_ID), CLUSTER_LIST1.length, ...CLUSTER_LIST1_BYTES, 0])
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
                additionalTLVs: [{tagId: Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, length: 2, tlv: {nwkAddress: NODE_ID}}]
            },
        }];
        expect(
            BuffaloZdo.buildPermitJoining(255, 1, tlvs)
        ).toStrictEqual(Buffer.from([0, 255, 1, Zdo.GlobalTLV.BEACON_APPENDIX_ENCAPSULATION, 3, Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 1, ...NODE_ID_BYTES]));
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
        expect(BuffaloZdo.buildChannelChangeRequest(15)).toStrictEqual(Buffer.from([0, ...uint32To8Array(ZSpec.Utils.channelsToUInt32Mask([15])), 0xFE]));
    });

    it('buildSetActiveChannelsAndNwkManagerIdRequest', () => {
        expect(
            BuffaloZdo.buildSetActiveChannelsAndNwkManagerIdRequest(ZSpec.PREFERRED_802_15_4_CHANNELS, 0)
        ).toStrictEqual(Buffer.from([0, ...uint32To8Array(ZSpec.PREFERRED_802_15_4_CHANNELS_MASK), 0xFF, ...uint16To8Array(0)]));
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
            nwkAddress: NODE_ID,
            fragmentationOptions: 1
        };
        expect(
            BuffaloZdo.buildStartKeyUpdateRequest(method, params)
        ).toStrictEqual(
            Buffer.from([
                0,
                0, ZSpec.EUI64_SIZE + 2 - 1, method.protocol, method.presharedSecret, ...IEEE_ADDRESS2_BYTES,
                Zdo.GlobalTLV.FRAGMENTATION_PARAMETERS, 3 - 1, ...NODE_ID_BYTES, 1
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
    
});
