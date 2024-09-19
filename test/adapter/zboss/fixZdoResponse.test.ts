import {readZBOSSFrame, ZBOSSFrame} from '../../../src/adapter/zboss/frame';
import * as Zdo from '../../../src/zspec/zdo';
import * as ZdoTypes from '../../../src/zspec/zdo/definition/tstypes';

describe('ZBOSS fix non-standard ZDO response payloads', () => {
    it('No fix needed', async () => {
        expect(readZBOSSFrame(Buffer.from('0001010211000088776655443322113412', 'hex'))).toStrictEqual({
            version: 0,
            type: 1,
            commandId: 513,
            tsn: 17,
            payload: {
                category: 0,
                zdoClusterId: Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE,
                zdo: [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0x1234,
                        eui64: '0x1122334455667788',
                        startIndex: 0,
                        assocDevList: [],
                    } as ZdoTypes.NetworkAddressResponse,
                ],
            },
        } as ZBOSSFrame);
    });

    it('NODE_DESCRIPTOR_RESPONSE', async () => {
        expect(readZBOSSFrame(Buffer.from('000104021100000000000000000000432c0000003412', 'hex'))).toStrictEqual({
            version: 0,
            type: 1,
            commandId: 516,
            tsn: 17,
            payload: {
                category: 0,
                zdoClusterId: Zdo.ClusterId.NODE_DESCRIPTOR_RESPONSE,
                zdo: [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0x1234,
                        logicalType: 0,
                        fragmentationSupported: undefined,
                        apsFlags: 0,
                        frequencyBand: 0,
                        capabilities: {
                            alternatePANCoordinator: 0,
                            deviceType: 0,
                            powerSource: 0,
                            rxOnWhenIdle: 0,
                            reserved1: 0,
                            reserved2: 0,
                            securityCapability: 0,
                            allocateAddress: 0,
                        },
                        manufacturerCode: 0,
                        maxBufSize: 0,
                        maxIncTxSize: 0,
                        serverMask: Zdo.Utils.getServerMask(0x2c43),
                        maxOutTxSize: 0,
                        deprecated1: 0,
                        tlvs: [],
                    } as ZdoTypes.NodeDescriptorResponse,
                ],
            },
        } as ZBOSSFrame);
    });

    it('POWER_DESCRIPTOR_RESPONSE', async () => {
        expect(readZBOSSFrame(Buffer.from('0001030211000001023412', 'hex'))).toStrictEqual({
            version: 0,
            type: 1,
            commandId: 515,
            tsn: 17,
            payload: {
                category: 0,
                zdoClusterId: Zdo.ClusterId.POWER_DESCRIPTOR_RESPONSE,
                zdo: [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0x1234,
                        currentPowerMode: 1,
                        availPowerSources: 0,
                        currentPowerSource: 2,
                        currentPowerSourceLevel: 0,
                    } as ZdoTypes.PowerDescriptorResponse,
                ],
            },
        } as ZBOSSFrame);
    });

    it('MATCH_DESCRIPTORS_RESPONSE', async () => {
        expect(readZBOSSFrame(Buffer.from('0001070211000002f2013412', 'hex'))).toStrictEqual({
            version: 0,
            type: 1,
            commandId: 519,
            tsn: 17,
            payload: {
                category: 0,
                zdoClusterId: Zdo.ClusterId.MATCH_DESCRIPTORS_RESPONSE,
                zdo: [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0x1234,
                        endpointList: [242, 1],
                    } as ZdoTypes.MatchDescriptorsResponse,
                ],
            },
        } as ZBOSSFrame);
    });

    it('ACTIVE_ENDPOINTS_RESPONSE', async () => {
        expect(readZBOSSFrame(Buffer.from('0001060211000002f2013412', 'hex'))).toStrictEqual({
            version: 0,
            type: 1,
            commandId: 518,
            tsn: 17,
            payload: {
                category: 0,
                zdoClusterId: Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE,
                zdo: [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0x1234,
                        endpointList: [242, 1],
                    } as ZdoTypes.ActiveEndpointsResponse,
                ],
            },
        } as ZBOSSFrame);
    });

    it('SIMPLE_DESCRIPTOR_RESPONSE', async () => {
        expect(readZBOSSFrame(Buffer.from('0001050211000001040100000301022c2ffefebcbc3412', 'hex'))).toStrictEqual({
            version: 0,
            type: 1,
            commandId: 517,
            tsn: 17,
            payload: {
                category: 0,
                zdoClusterId: Zdo.ClusterId.SIMPLE_DESCRIPTOR_RESPONSE,
                zdo: [
                    Zdo.Status.SUCCESS,
                    {
                        nwkAddress: 0x1234,
                        length: 14,
                        endpoint: 1,
                        profileId: 0x0104,
                        deviceId: 0x0000,
                        deviceVersion: 3,
                        inClusterList: [0x2f2c],
                        outClusterList: [0xfefe, 0xbcbc],
                    } as ZdoTypes.SimpleDescriptorResponse,
                ],
            },
        } as ZBOSSFrame);
    });
});
