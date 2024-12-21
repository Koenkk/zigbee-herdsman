import type {MockInstance} from 'vitest';

import {ZiGateAdapter} from '../../../src/adapter/zigate/adapter/zigateAdapter';
import {BLANK_EUI64} from '../../../src/zspec';
import * as Zdo from '../../../src/zspec/zdo';

describe('ZiGate ZDO payloads', () => {
    let adapter: ZiGateAdapter;
    let requestZdoSpy: MockInstance;

    beforeEach(() => {
        adapter = new ZiGateAdapter({panID: 0, channelList: [11]}, {}, 'tmp.db.backup', {disableLED: false});
        requestZdoSpy = vi
            .spyOn(
                // @ts-expect-error private
                adapter.driver,
                'requestZdo',
            )
            .mockResolvedValue(true);
    });

    it('ZiGateCommandCode.ManagementLQI', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.ManagementLQI, {
        //     targetAddress: 0x1122,
        //     startIndex: 0,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 112200
        const clusterId = Zdo.ClusterId.LQI_TABLE_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 0);
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('112200', 'hex'));
    });

    it('ZiGateCommandCode.LeaveRequest', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.LeaveRequest, {
        //     extendedAddress: '0x1122334455667788',
        //     rejoin: 0,
        //     removeChildren: 0,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 11223344556677880000
        const clusterId = Zdo.ClusterId.LEAVE_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, '0x1122334455667788', Zdo.LeaveRequestFlags.WITHOUT_REJOIN);
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('11223344556677880000', 'hex'));
    });

    it('ZiGateCommandCode.PermitJoin', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.PermitJoin, {
        //     targetShortAddress: 0x1122,
        //     interval: 254,
        //     TCsignificance: 1,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 1122fe01
        const clusterId = Zdo.ClusterId.PERMIT_JOINING_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 254, 1, []);
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('1122fe01', 'hex'));
    });

    it('ZiGateCommandCode.NodeDescriptor', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.NodeDescriptor, {
        //     targetShortAddress: 0x1122,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 1122
        const clusterId = Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 0x1122);
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('1122', 'hex'));
    });

    it('ZiGateCommandCode.ActiveEndpoint', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.ActiveEndpoint, {
        //     targetShortAddress: 0x1122,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 1122
        const clusterId = Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 0x1122);
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('1122', 'hex'));
    });

    it('ZiGateCommandCode.SimpleDescriptor', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.SimpleDescriptor, {
        //     targetShortAddress: 0x1122,
        //     endpoint: 3,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 112203
        const clusterId = Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, 0x1122, 3);
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('112203', 'hex'));
    });

    it('ZiGateCommandCode.Bind - UNICAST', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.Bind, {
        //     targetExtendedAddress: '0x1122334455667788',
        //     targetEndpoint: 5,
        //     clusterID: 0x4567,
        //     destinationAddressMode: Zdo.UNICAST_BINDING,
        //     destinationAddress: '0x9911882277336644',
        //     destinationEndpoint: 3,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 112233445566778805456703991188227733664403
        const clusterId = Zdo.ClusterId.BIND_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            clusterId,
            '0x1122334455667788',
            5,
            0x4567,
            Zdo.UNICAST_BINDING,
            '0x9911882277336644',
            0,
            3,
        );
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('112233445566778805456703991188227733664403', 'hex'));
    });

    it('ZiGateCommandCode.Bind - MULTICAST', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.Bind, {
        //     targetExtendedAddress: '0x1122334455667788',
        //     targetEndpoint: 5,
        //     clusterID: 0x4567,
        //     destinationAddressMode: Zdo.MULTICAST_BINDING,
        //     destinationAddress: 0x3456,
        //     destinationEndpoint: 0,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 112233445566778805456701345600
        const clusterId = Zdo.ClusterId.BIND_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, '0x1122334455667788', 5, 0x4567, Zdo.MULTICAST_BINDING, BLANK_EUI64, 0x3456, 0);
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('112233445566778805456701345600', 'hex'));
    });

    it('ZiGateCommandCode.UnBind - UNICAST', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.UnBind, {
        //     targetExtendedAddress: '0x1122334455667788',
        //     targetEndpoint: 5,
        //     clusterID: 0x4567,
        //     destinationAddressMode: Zdo.UNICAST_BINDING,
        //     destinationAddress: '0x9911882277336644',
        //     destinationEndpoint: 3,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 112233445566778805456703991188227733664403
        const clusterId = Zdo.ClusterId.UNBIND_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(
            false,
            clusterId,
            '0x1122334455667788',
            5,
            0x4567,
            Zdo.UNICAST_BINDING,
            '0x9911882277336644',
            0,
            3,
        );
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('112233445566778805456703991188227733664403', 'hex'));
    });

    it('ZiGateCommandCode.UnBind - MULTICAST', () => {
        // const ziPayload = ZiGateObject.createRequest(ZiGateCommandCode.UnBind, {
        //     targetExtendedAddress: '0x1122334455667788',
        //     targetEndpoint: 5,
        //     clusterID: 0x4567,
        //     destinationAddressMode: Zdo.MULTICAST_BINDING,
        //     destinationAddress: 0x3456,
        //     destinationEndpoint: 0,
        // });
        // console.log(ziPayload.toZiGateFrame().msgPayloadBytes.toString('hex'));
        // 112233445566778805456701345600
        const clusterId = Zdo.ClusterId.UNBIND_REQUEST;
        const zdoPayload = Zdo.Buffalo.buildRequest(false, clusterId, '0x1122334455667788', 5, 0x4567, Zdo.MULTICAST_BINDING, BLANK_EUI64, 0x3456, 0);
        adapter.sendZdo('0x1122334455667788', 0x1122, clusterId, zdoPayload, true);
        expect(requestZdoSpy).toHaveBeenCalledWith(clusterId, Buffer.from('112233445566778805456701345600', 'hex'));
    });
});
