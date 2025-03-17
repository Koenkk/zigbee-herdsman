import {mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {SPINEL_HEADER_FLG_SPINEL, SpinelFrame} from 'zigbee-on-host/dist/spinel/spinel';

import {bigUInt64ToHexBE} from '../../../src/adapter/zoh/adapter/utils';
import {ZoHAdapter} from '../../../src/adapter/zoh/adapter/zohAdapter';
import * as ZSpec from '../../../src/zspec';
import * as Zcl from '../../../src/zspec/zcl';
import * as Zdo from '../../../src/zspec/zdo';

const TEMP_PATH = 'zoh-tmp';
const TEMP_PATH_SAVE = join(TEMP_PATH, 'zoh.save');
const DEFAULT_PAN_ID = 0x1a62;
const DEFAULT_EXT_PAN_ID = [0xdd, 0x11, 0x22, 0xdd, 0xdd, 0x33, 0x44, 0xdd];
const DEFAULT_CHANNEL = 11;
const DEFAULT_NETWORK_KEY = [0x11, 0x03, 0x15, 0x07, 0x09, 0x0b, 0x0d, 0x0f, 0x00, 0x02, 0x04, 0x06, 0x08, 0x1a, 0x1c, 0x1d];
const DEFAULT_STATE_FILE_HEX =
    '5a6f486f6e5a324d621add1122dddd3344dd0b001311031507090b0d0f00020406081a1c1d00040000005a6967426565416c6c69616e636530390004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

describe('ZigBee on Host', () => {
    let adapter: ZoHAdapter;

    const deleteZoHSave = () => {
        rmSync(TEMP_PATH_SAVE, {force: true});
    };

    const makeSpinelStreamRawFrame = (tid: number, macFrame: Buffer): SpinelFrame => {
        return {
            header: {
                tid,
                nli: 0,
                flg: SPINEL_HEADER_FLG_SPINEL,
            },
            commandId: 6 /* PROP_VALUE_IS */,
            payload: Buffer.from([113 /* STREAM_RAW */, macFrame.byteLength & 0xff, (macFrame.byteLength >> 8) & 0xff, ...macFrame]),
        };
    };

    beforeAll(() => {
        vi.useFakeTimers();

        rmSync(TEMP_PATH, {force: true, recursive: true});
        mkdirSync(TEMP_PATH, {recursive: true});
    });

    afterAll(() => {
        vi.useRealTimers();

        rmSync(TEMP_PATH, {force: true, recursive: true});
    });

    beforeEach(async () => {
        deleteZoHSave();

        adapter = new ZoHAdapter(
            {
                panID: DEFAULT_PAN_ID,
                extendedPanID: DEFAULT_EXT_PAN_ID,
                channelList: [DEFAULT_CHANNEL],
                networkKey: DEFAULT_NETWORK_KEY,
                networkKeyDistribute: false,
            },
            {
                baudRate: 460800,
                rtscts: true,
                path: '/dev/serial/by-id/mock-adapter',
                adapter: 'zoh',
            },
            join(TEMP_PATH, `ember_coordinator_backup.json`),
            {
                concurrent: 8,
                disableLED: false,
                transmitPower: 19,
            },
        );

        vi.spyOn(adapter, 'initPort').mockImplementation(() => Promise.resolve());

        vi.spyOn(adapter.driver, 'start').mockImplementation(async () => {
            await adapter.driver.loadState();
        });
        vi.spyOn(adapter.driver, 'getProperty').mockImplementation(() =>
            Promise.resolve({
                header: {tid: 1, nli: 0, flg: SPINEL_HEADER_FLG_SPINEL},
                commandId: 2 /* PROP_VALUE_GET */,
                payload: Buffer.alloc(254), // more than enough to not fail various reads
            }),
        );
        vi.spyOn(adapter.driver, 'setProperty').mockImplementation(() => Promise.resolve([0, Buffer.alloc(0)]));
        vi.spyOn(adapter.driver, 'formNetwork').mockImplementation(() => Promise.resolve());

        vi.spyOn(adapter.driver.writer, 'pipe').mockImplementation(
            // @ts-expect-error mock noop
            () => {},
        );
        vi.spyOn(adapter.driver.writer, 'writeBuffer').mockImplementation((b) => {});

        adapter.driver.parser.on('data', adapter.driver.onFrame.bind(adapter.driver));
    });

    afterEach(async () => {
        await adapter.stop();
    });

    it('Adapter impl: gets state', async () => {
        await expect(adapter.start()).resolves.toStrictEqual('reset');
        await expect(adapter.getCoordinatorIEEE()).resolves.toStrictEqual('0x4d325a6e6f486f5a');
        await expect(adapter.getCoordinatorVersion()).resolves.toStrictEqual({
            type: 'ZigBee on Host',
            meta: {revision: 'https://github.com/Nerivec/zigbee-on-host'},
        });
        await expect(adapter.getNetworkParameters()).resolves.toStrictEqual({
            panID: DEFAULT_PAN_ID,
            extendedPanID: `0x${bigUInt64ToHexBE(Buffer.from(DEFAULT_EXT_PAN_ID).readBigUint64LE())}`,
            channel: DEFAULT_CHANNEL,
            nwkUpdateID: 0,
        });
    });

    it('Adapter impl: sendZdo to device', async () => {
        await adapter.start();

        const waitForTIDSpy = vi.spyOn(adapter.driver, 'waitForTID');

        waitForTIDSpy.mockImplementationOnce(() => Promise.resolve(makeSpinelStreamRawFrame(1, Buffer.alloc(1))));

        const p1 = adapter.sendZdo(
            '0x0807060504030201',
            0x2211,
            Zdo.ClusterId.IEEE_ADDRESS_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.IEEE_ADDRESS_REQUEST, 0x2211, false, 0),
            false,
        );

        await vi.advanceTimersByTimeAsync(100);
        adapter.driver.emit(
            'frame',
            0x2211,
            578437695752307201n,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0,
                clusterId: Zdo.ClusterId.IEEE_ADDRESS_RESPONSE,
                sourceEndpoint: 0x0,
                destEndpoint: 0x0,
            },
            Buffer.from([1, 0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x11, 0x22]),
            -50,
        );

        await expect(p1).resolves.toStrictEqual([
            0,
            {
                eui64: '0x0807060504030201',
                nwkAddress: 0x2211,
                startIndex: 0,
                assocDevList: [],
            },
        ]);

        waitForTIDSpy.mockImplementationOnce(() => Promise.resolve(makeSpinelStreamRawFrame(1, Buffer.alloc(1))));

        const p2 = adapter.sendZdo(
            '0x0807060504030201',
            0x2211,
            Zdo.ClusterId.NETWORK_ADDRESS_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.NETWORK_ADDRESS_REQUEST, '0x0807060504030201', false, 0),
            false,
        );

        await vi.advanceTimersByTimeAsync(100);
        adapter.driver.emit(
            'frame',
            0x2211,
            578437695752307201n,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0,
                clusterId: Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE,
                sourceEndpoint: 0x0,
                destEndpoint: 0x0,
            },
            Buffer.from([1, 0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x11, 0x22]),
            -50,
        );

        await expect(p2).resolves.toStrictEqual([
            0,
            {
                eui64: '0x0807060504030201',
                nwkAddress: 0x2211,
                startIndex: 0,
                assocDevList: [],
            },
        ]);
    });

    it('Adapter impl: sendZdo to coordinator', async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, 'emit');

        await adapter.sendZdo(
            `0x${bigUInt64ToHexBE(adapter.driver.netParams.eui64)}`,
            0x0000,
            Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.NODE_DESCRIPTOR_REQUEST, 0x0000),
            false,
        );

        expect(emitSpy).toHaveBeenLastCalledWith('zdoResponse', Zdo.ClusterId.NODE_DESCRIPTOR_RESPONSE, [
            0,
            expect.objectContaining({
                nwkAddress: 0x0000,
                logicalType: 0x00,
                manufacturerCode: Zcl.ManufacturerCode.CONNECTIVITY_STANDARDS_ALLIANCE,
                serverMask: expect.objectContaining({primaryTrustCenter: 1, stackComplianceRevision: 22}),
            }),
        ]);

        await adapter.sendZdo(
            `0x${bigUInt64ToHexBE(adapter.driver.netParams.eui64)}`,
            0x0000,
            Zdo.ClusterId.POWER_DESCRIPTOR_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.POWER_DESCRIPTOR_REQUEST, 0x0000),
            false,
        );

        expect(emitSpy).toHaveBeenLastCalledWith('zdoResponse', Zdo.ClusterId.POWER_DESCRIPTOR_RESPONSE, [
            0,
            expect.objectContaining({nwkAddress: 0x0000}),
        ]);

        await adapter.sendZdo(
            `0x${bigUInt64ToHexBE(adapter.driver.netParams.eui64)}`,
            0x0000,
            Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.SIMPLE_DESCRIPTOR_REQUEST, 0x0000, 1),
            false,
        );

        expect(emitSpy).toHaveBeenLastCalledWith('zdoResponse', Zdo.ClusterId.SIMPLE_DESCRIPTOR_RESPONSE, [
            0,
            expect.objectContaining({endpoint: 1, profileId: 0x0104}),
        ]);

        await adapter.sendZdo(
            `0x${bigUInt64ToHexBE(adapter.driver.netParams.eui64)}`,
            0x0000,
            Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST,
            Zdo.Buffalo.buildRequest(true, Zdo.ClusterId.ACTIVE_ENDPOINTS_REQUEST, 0x0000),
            false,
        );

        expect(emitSpy).toHaveBeenLastCalledWith('zdoResponse', Zdo.ClusterId.ACTIVE_ENDPOINTS_RESPONSE, [
            0,
            {nwkAddress: 0, endpointList: [1, 242]},
        ]);
    });

    it('Adapter impl: permitJoin', async () => {
        await adapter.start();

        const sendZdoSpy = vi.spyOn(adapter, 'sendZdo');
        const allowJoinsSpy = vi.spyOn(adapter.driver, 'allowJoins');

        sendZdoSpy.mockImplementationOnce(() => Promise.resolve([0, undefined]));
        await adapter.permitJoin(254);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(254, true);

        await adapter.permitJoin(0);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(0, true);

        await adapter.permitJoin(200, 0x0000);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(200, true);

        await adapter.permitJoin(0);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(0, true);

        sendZdoSpy.mockImplementationOnce(() => Promise.resolve([0, undefined]));
        await adapter.permitJoin(150, 0x1234);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(150, false);

        await adapter.permitJoin(0);
        expect(allowJoinsSpy).toHaveBeenLastCalledWith(0, true);
    });

    it('Adapter impl: sendZclFrameToEndpoint', async () => {
        await adapter.start();

        const waitForTIDSpy = vi.spyOn(adapter.driver, 'waitForTID');
        const sendUnicastSpy = vi.spyOn(adapter.driver, 'sendUnicast');

        waitForTIDSpy.mockImplementationOnce(() => Promise.resolve(makeSpinelStreamRawFrame(1, Buffer.alloc(1))));
        sendUnicastSpy.mockImplementationOnce(() => Promise.resolve(1));

        const zclPayload = Buffer.from([16, 123, Zcl.Foundation.read.ID]);
        const zclFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(zclPayload), zclPayload, {});

        const p1 = adapter.sendZclFrameToEndpoint('0x00000000000004d2', 0x9876, 1, zclFrame, 10000, false, false, 2);

        await vi.advanceTimersByTimeAsync(100);
        adapter.driver.emit(
            'frame',
            0x9876,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0104,
                clusterId: Zcl.Clusters.genGroups.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x2,
            },
            Buffer.from([0, 123, Zcl.Foundation.read.response!, 0x01, 0xff]),
            -25,
        );
        await expect(p1).resolves.toStrictEqual({
            address: 0x9876,
            clusterID: Zcl.Clusters.genGroups.ID,
            data: Buffer.from([0, 123, Zcl.Foundation.read.response!, 0x01, 0xff]),
            destinationEndpoint: 2,
            endpoint: 1,
            groupID: undefined,
            header: expect.objectContaining({
                commandIdentifier: 1,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            }),
            linkquality: -25,
            wasBroadcast: false,
        });
        expect(sendUnicastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), 0x0104, Zcl.Clusters.genGroups.ID, 0x9876, undefined, 1, 2);

        waitForTIDSpy.mockImplementationOnce(() => Promise.resolve(makeSpinelStreamRawFrame(2, Buffer.alloc(1))));
        sendUnicastSpy.mockImplementationOnce(() => Promise.resolve(2));

        const p2 = adapter.sendZclFrameToEndpoint('0x00000000000004d2', 0x9876, 1, zclFrame, 10000, true, false);

        await vi.advanceTimersByTimeAsync(100);
        await expect(p2).resolves.toStrictEqual(undefined);
        expect(sendUnicastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), 0x0104, Zcl.Clusters.genGroups.ID, 0x9876, undefined, 1, 1);

        const zclPayloadDefRsp = Buffer.from([0, 123, Zcl.Foundation.read.ID]);
        const zclFrameDefRsp = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(zclPayloadDefRsp), zclPayloadDefRsp, {});

        waitForTIDSpy.mockImplementationOnce(() => Promise.resolve(makeSpinelStreamRawFrame(3, Buffer.alloc(1))));
        sendUnicastSpy.mockImplementationOnce(() => Promise.resolve(3));

        const p3 = adapter.sendZclFrameToEndpoint('0x00000000000004d2', 0x9876, 1, zclFrameDefRsp, 10000, true, false, 2);

        await vi.advanceTimersByTimeAsync(100);
        adapter.driver.emit(
            'frame',
            0x9876,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0104,
                clusterId: Zcl.Clusters.genGroups.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x2,
            },
            Buffer.from([0, 123, Zcl.Foundation.defaultRsp.ID, 0x01, 0xff]),
            -25,
        );
        await expect(p3).resolves.toStrictEqual({
            address: 0x9876,
            clusterID: Zcl.Clusters.genGroups.ID,
            data: Buffer.from([0, 123, Zcl.Foundation.defaultRsp.ID, 0x01, 0xff]),
            destinationEndpoint: 2,
            endpoint: 1,
            groupID: undefined,
            header: expect.objectContaining({
                commandIdentifier: Zcl.Foundation.defaultRsp.ID,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            }),
            linkquality: -25,
            wasBroadcast: false,
        });
        expect(sendUnicastSpy).toHaveBeenLastCalledWith(zclFrameDefRsp.toBuffer(), 0x0104, Zcl.Clusters.genGroups.ID, 0x9876, undefined, 1, 2);

        sendUnicastSpy.mockClear();
        waitForTIDSpy.mockImplementationOnce(() => Promise.resolve(makeSpinelStreamRawFrame(2, Buffer.alloc(1))));
        sendUnicastSpy.mockImplementationOnce(() => Promise.reject(new Error('Failed'))).mockImplementationOnce(() => Promise.resolve(2));

        const p4 = adapter.sendZclFrameToEndpoint('0x00000000000004d2', 0x9876, 1, zclFrame, 10000, false, false, 2);

        await vi.advanceTimersByTimeAsync(100);
        adapter.driver.emit(
            'frame',
            0x9876,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0104,
                clusterId: Zcl.Clusters.genGroups.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x2,
            },
            Buffer.from([0, 123, Zcl.Foundation.read.response!, 0x01, 0xff]),
            -25,
        );
        await expect(p4).resolves.toStrictEqual({
            address: 0x9876,
            clusterID: Zcl.Clusters.genGroups.ID,
            data: Buffer.from([0, 123, Zcl.Foundation.read.response!, 0x01, 0xff]),
            destinationEndpoint: 2,
            endpoint: 1,
            groupID: undefined,
            header: expect.objectContaining({
                commandIdentifier: 1,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            }),
            linkquality: -25,
            wasBroadcast: false,
        });
        expect(sendUnicastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), 0x0104, Zcl.Clusters.genGroups.ID, 0x9876, undefined, 1, 2);
        expect(sendUnicastSpy).toHaveBeenCalledTimes(2);

        sendUnicastSpy.mockClear();
        waitForTIDSpy.mockImplementationOnce(() => Promise.resolve(makeSpinelStreamRawFrame(2, Buffer.alloc(1))));
        sendUnicastSpy
            .mockImplementationOnce(() => Promise.reject(new Error('Failed')))
            .mockImplementationOnce(() => Promise.reject(new Error('Failed')));

        await expect(adapter.sendZclFrameToEndpoint('0x00000000000004d2', 0x9876, 1, zclFrame, 10000, false, false, 2)).rejects.toThrow('Failed');
        expect(sendUnicastSpy).toHaveBeenCalledTimes(2);
    });

    it('Adapter impl: sendZclFrameToGroup', async () => {
        await adapter.start();

        const sendMulticastSpy = vi.spyOn(adapter.driver, 'sendMulticast').mockImplementationOnce(() => Promise.resolve(1));

        const zclPayload = Buffer.from([0, 123, Zcl.Foundation.read.ID]);
        const zclFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(zclPayload), zclPayload, {});

        const p1 = adapter.sendZclFrameToGroup(123, zclFrame, 5);

        await vi.advanceTimersByTimeAsync(1000);
        await expect(p1).resolves.toStrictEqual(undefined);
        expect(sendMulticastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), 0x0104, Zcl.Clusters.genGroups.ID, 123, 0xff, 5);

        const p2 = adapter.sendZclFrameToGroup(123, zclFrame);

        await vi.advanceTimersByTimeAsync(1000);
        await expect(p2).resolves.toStrictEqual(undefined);
        expect(sendMulticastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), 0x0104, Zcl.Clusters.genGroups.ID, 123, 0xff, 1);
    });

    it('Adapter impl: sendZclFrameToAll', async () => {
        await adapter.start();

        const sendBroadcastSpy = vi.spyOn(adapter.driver, 'sendBroadcast').mockImplementationOnce(() => Promise.resolve(1));

        const zclPayload = Buffer.from([0, 123, Zcl.Foundation.read.ID]);
        const zclFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.genAlarms.ID, Zcl.Header.fromBuffer(zclPayload), zclPayload, {});

        const p = adapter.sendZclFrameToAll(3, zclFrame, 1, 0xfffc);

        await vi.advanceTimersByTimeAsync(1000);
        await expect(p).resolves.toStrictEqual(undefined);
        expect(sendBroadcastSpy).toHaveBeenLastCalledWith(zclFrame.toBuffer(), 0x0104, Zcl.Clusters.genAlarms.ID, 0xfffc, 3, 1);
    });

    it('receives ZDO frame', async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, 'emit');

        adapter.driver.emit(
            'frame',
            0x2211,
            578437695752307201n,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0,
                clusterId: Zdo.ClusterId.IEEE_ADDRESS_RESPONSE,
                sourceEndpoint: 0x0,
                destEndpoint: 0x0,
            },
            Buffer.from([1, 0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x11, 0x22]),
            -50,
        );

        expect(emitSpy).toHaveBeenLastCalledWith('zdoResponse', Zdo.ClusterId.IEEE_ADDRESS_RESPONSE, [
            0,
            {
                eui64: '0x0807060504030201',
                nwkAddress: 0x2211,
                startIndex: 0,
                assocDevList: [],
            },
        ]);

        // NETWORK_ADDRESS_RESPONSE codepath
        adapter.driver.emit(
            'frame',
            0x2211,
            578437695752307201n,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0,
                clusterId: Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE,
                sourceEndpoint: 0x0,
                destEndpoint: 0x0,
            },
            Buffer.from([1, 0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x11, 0x22]),
            -50,
        );

        expect(emitSpy).toHaveBeenLastCalledWith('zdoResponse', Zdo.ClusterId.NETWORK_ADDRESS_RESPONSE, [
            0,
            {
                eui64: '0x0807060504030201',
                nwkAddress: 0x2211,
                startIndex: 0,
                assocDevList: [],
            },
        ]);
    });

    it('receives ZCL frame', async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, 'emit');

        adapter.driver.emit(
            'frame',
            0x9876,
            undefined,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0104,
                clusterId: Zcl.Clusters.genAlarms.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x1,
            },
            Buffer.from([0, 123, Zcl.Foundation.read.ID, 0x01, 0xff]),
            -25,
        );

        expect(emitSpy).toHaveBeenLastCalledWith('zclPayload', {
            address: 0x9876,
            clusterID: Zcl.Clusters.genAlarms.ID,
            data: Buffer.from([0, 123, Zcl.Foundation.read.ID, 0x01, 0xff]),
            destinationEndpoint: 1,
            endpoint: 1,
            groupID: undefined,
            header: {
                commandIdentifier: Zcl.Foundation.read.ID,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            },
            linkquality: -25,
            wasBroadcast: false,
        });

        adapter.driver.emit(
            'frame',
            0x9876,
            1234n,
            {
                frameControl: {
                    frameType: 0 /* DATA */,
                    deliveryMode: 0 /* UNICAST */,
                    ackFormat: false,
                    security: false,
                    ackRequest: false,
                    extendedHeader: false,
                },
                profileId: 0x0104,
                clusterId: Zcl.Clusters.genIdentify.ID,
                sourceEndpoint: 0x1,
                destEndpoint: 0x1,
            },
            Buffer.from([0, 123, 0x00, 0x01, 0xff]),
            -25,
        );

        expect(emitSpy).toHaveBeenLastCalledWith('zclPayload', {
            address: '0x00000000000004d2',
            clusterID: Zcl.Clusters.genIdentify.ID,
            data: Buffer.from([0, 123, 0x00, 0x01, 0xff]),
            destinationEndpoint: 1,
            endpoint: 1,
            groupID: undefined,
            header: {
                commandIdentifier: 0,
                frameControl: {
                    direction: 0,
                    disableDefaultResponse: false,
                    frameType: 0,
                    manufacturerSpecific: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 123,
            },
            linkquality: -25,
            wasBroadcast: false,
        });
    });

    it('receives GP frame', async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, 'emit');

        adapter.driver.emit(
            'gpFrame',
            0xe0,
            Buffer.from([
                0x2, 0x85, 0xf2, 0xc9, 0x25, 0x82, 0x1d, 0xf4, 0x6f, 0x45, 0x8c, 0xf0, 0xe6, 0x37, 0xaa, 0xc3, 0xba, 0xb6, 0xaa, 0x45, 0x83, 0x1a,
                0x11, 0x46, 0x23, 0x0, 0x0, 0x4, 0x16, 0x10, 0x11, 0x22, 0x23, 0x18, 0x19, 0x14, 0x15, 0x12, 0x13, 0x64, 0x65, 0x62, 0x63, 0x1e, 0x1f,
                0x1c, 0x1d, 0x1a, 0x1b, 0x16, 0x17,
            ]),
            {
                frameControl: {
                    frameType: 0x1,
                    securityEnabled: false,
                    framePending: false,
                    ackRequest: false,
                    panIdCompression: false,
                    seqNumSuppress: false,
                    iePresent: false,
                    destAddrMode: 0x2,
                    frameVersion: 0,
                    sourceAddrMode: 0x0,
                },
                sequenceNumber: 70,
                destinationPANId: 0xffff,
                destination16: 0xffff,
                sourcePANId: 0xffff,
                fcs: 0xffff,
            },
            {
                frameControl: {
                    frameType: 0x0,
                    protocolVersion: 3,
                    autoCommissioning: false,
                    nwkFrameControlExtension: false,
                },
                sourceId: 0x0155f47a,
                micSize: 0,
                payloadLength: 52,
            },
            0,
        );

        const data = Buffer.from([
            1, 70, 4, 0, 0, 122, 244, 85, 1, 0, 0, 0, 0, 0xe0, 51, 0x2, 0x85, 0xf2, 0xc9, 0x25, 0x82, 0x1d, 0xf4, 0x6f, 0x45, 0x8c, 0xf0, 0xe6, 0x37,
            0xaa, 0xc3, 0xba, 0xb6, 0xaa, 0x45, 0x83, 0x1a, 0x11, 0x46, 0x23, 0x0, 0x0, 0x4, 0x16, 0x10, 0x11, 0x22, 0x23, 0x18, 0x19, 0x14, 0x15,
            0x12, 0x13, 0x64, 0x65, 0x62, 0x63, 0x1e, 0x1f, 0x1c, 0x1d, 0x1a, 0x1b, 0x16, 0x17,
        ]);
        const header = Zcl.Header.fromBuffer(data)!;

        expect(emitSpy).toHaveBeenLastCalledWith('zclPayload', {
            address: 0x0155f47a & 0xffff,
            clusterID: Zcl.Clusters.greenPower.ID,
            data,
            destinationEndpoint: 242,
            endpoint: 242,
            groupID: ZSpec.GP_GROUP_ID,
            header,
            linkquality: 0,
            wasBroadcast: true,
        });

        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, header, data, {});

        expect(frame).toMatchObject({
            header: {
                frameControl: {
                    frameType: 1,
                    manufacturerSpecific: false,
                    direction: 0,
                    disableDefaultResponse: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 70,
                commandIdentifier: 4,
            },
            payload: {
                options: 0,
                srcID: 22410362,
                frameCounter: 0,
                commandID: 0xe0,
                payloadSize: 51,
                commandFrame: {
                    deviceID: 2,
                    options: 133,
                    extendedOptions: 242,
                    securityKey: Buffer.from('c925821df46f458cf0e637aac3bab6aa', 'hex'),
                    keyMic: 286950213,
                    outgoingCounter: 9030,
                    applicationInfo: 4,
                    manufacturerID: 0,
                    modelID: 0,
                    numGdpCommands: 22,
                    gpdCommandIdList: Buffer.from('10112223181914151213646562631e1f1c1d1a1b1617', 'hex'),
                    numServerClusters: 0,
                    numClientClusters: 0,
                    gpdServerClusters: Buffer.alloc(0),
                    gpdClientClusters: Buffer.alloc(0),
                },
            },
            cluster: {
                ID: 0x21,
                name: 'greenPower',
            },
            command: {
                ID: 0x04,
                name: 'commissioningNotification',
            },
        });

        adapter.driver.emit(
            'gpFrame',
            0x10,
            Buffer.from([]),
            {
                frameControl: {
                    frameType: 0x1,
                    securityEnabled: false,
                    framePending: false,
                    ackRequest: false,
                    panIdCompression: false,
                    seqNumSuppress: false,
                    iePresent: false,
                    destAddrMode: 0x2,
                    frameVersion: 0,
                    sourceAddrMode: 0x0,
                },
                sequenceNumber: 185,
                destinationPANId: 0xffff,
                destination16: 0xffff,
                sourcePANId: 0xffff,
                fcs: 0xffff,
            },
            {
                frameControl: {
                    frameType: 0x0,
                    protocolVersion: 3,
                    autoCommissioning: false,
                    nwkFrameControlExtension: true,
                },
                frameControlExt: {
                    appId: 0,
                    direction: 0,
                    rxAfterTx: false,
                    securityKey: true,
                    securityLevel: 2,
                },
                sourceId: 24221335,
                securityFrameCounter: 185,
                micSize: 4,
                payloadLength: 1,
                mic: 3523079166,
            },
            0,
        );

        const data2 = Buffer.from([1, 185, 0, 0, 0, 151, 150, 113, 1, 185, 0, 0, 0, 0x10, 0]);
        const header2 = Zcl.Header.fromBuffer(data2)!;

        expect(emitSpy).toHaveBeenLastCalledWith('zclPayload', {
            address: 24221335 & 0xffff,
            clusterID: Zcl.Clusters.greenPower.ID,
            data: data2,
            destinationEndpoint: 242,
            endpoint: 242,
            groupID: ZSpec.GP_GROUP_ID,
            header: header2,
            linkquality: 0,
            wasBroadcast: true,
        });

        const frame2 = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, header2, data2, {});

        expect(frame2).toMatchObject({
            header: {
                frameControl: {
                    frameType: 1,
                    manufacturerSpecific: false,
                    direction: 0,
                    disableDefaultResponse: false,
                    reservedBits: 0,
                },
                manufacturerCode: undefined,
                transactionSequenceNumber: 185,
                commandIdentifier: 0,
            },
            payload: {
                options: 0,
                srcID: 24221335,
                frameCounter: 185,
                commandID: 0x10,
                payloadSize: 0,
                commandFrame: {},
            },
            cluster: {
                ID: 0x21,
                name: 'greenPower',
            },
            command: {
                ID: 0x00,
                name: 'notification',
            },
        });
    });

    it('receives device events', async () => {
        await adapter.start();

        const emitSpy = vi.spyOn(adapter, 'emit');

        adapter.driver.emit('deviceJoined', 0x123, 4321n);
        expect(emitSpy).toHaveBeenLastCalledWith('deviceJoined', {networkAddress: 0x123, ieeeAddr: `0x00000000000010e1`});

        adapter.driver.emit('deviceRejoined', 0x987, 4321n);
        expect(emitSpy).toHaveBeenLastCalledWith('deviceJoined', {networkAddress: 0x987, ieeeAddr: `0x00000000000010e1`});

        adapter.driver.emit('deviceLeft', 0x123, 4321n);
        expect(emitSpy).toHaveBeenLastCalledWith('deviceLeave', {networkAddress: 0x123, ieeeAddr: `0x00000000000010e1`});

        // adapter.driver.emit('deviceAuthorized', 0x123, 4321n);
    });

    it('resumes network', async () => {
        // create default
        writeFileSync(TEMP_PATH_SAVE, Buffer.from(DEFAULT_STATE_FILE_HEX, 'hex'));

        await expect(adapter.start()).resolves.toStrictEqual('resumed');
        expect(adapter.driver.netParams.networkKeyFrameCounter).toStrictEqual(1024); // jump means it loaded from saved state
    });

    it('resets network on mismatch PAN ID', async () => {
        // create default
        const state = Buffer.from(DEFAULT_STATE_FILE_HEX, 'hex');

        state.writeUInt16LE(0x1234, 8); // right after EUI64
        writeFileSync(TEMP_PATH_SAVE, state);

        const currentNetParams = await adapter.driver.readNetworkState();

        expect(currentNetParams?.panId).toStrictEqual(0x1234);
        await expect(adapter.start()).resolves.toStrictEqual('reset');
        expect(adapter.driver.netParams.panId).toStrictEqual(DEFAULT_PAN_ID);
    });

    it('resets network on mismatch extended PAN ID', async () => {
        // create default
        const state = Buffer.from(DEFAULT_STATE_FILE_HEX, 'hex');

        state.write('0011001100110011', 10, 'hex'); // right after PAN ID
        writeFileSync(TEMP_PATH_SAVE, state);

        const currentNetParams = await adapter.driver.readNetworkState();

        expect(currentNetParams?.extendedPANId).toStrictEqual(Buffer.from('0011001100110011', 'hex').readBigUInt64LE());

        await expect(adapter.start()).resolves.toStrictEqual('reset');
        expect(adapter.driver.netParams.extendedPANId).toStrictEqual(Buffer.from(DEFAULT_EXT_PAN_ID).readBigUInt64LE());
    });

    it('resets network on mismatch network key', async () => {
        // create default
        const state = Buffer.from(DEFAULT_STATE_FILE_HEX, 'hex');

        state.write('00110011001100110011001100110011', 21, 'hex'); // right after tx power
        writeFileSync(TEMP_PATH_SAVE, state);

        const currentNetParams = await adapter.driver.readNetworkState();

        expect(currentNetParams?.networkKey).toStrictEqual(Buffer.from('00110011001100110011001100110011', 'hex'));

        await expect(adapter.start()).resolves.toStrictEqual('reset');
        expect(adapter.driver.netParams.networkKey).toStrictEqual(Buffer.from(DEFAULT_NETWORK_KEY));
    });
});
