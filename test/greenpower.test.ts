import type {ZclPayload} from '../src/adapter/events';

import {MockInstance} from 'vitest';

import {GreenPower} from '../src/controller/greenPower';
import {GreenPowerDeviceJoinedPayload} from '../src/controller/tstype';
import {logger} from '../src/utils/logger';
import {GP_ENDPOINT, GP_GROUP_ID} from '../src/zspec/consts';
import * as Zcl from '../src/zspec/zcl';

describe('GreenPower', () => {
    let gp: GreenPower;
    let logDebugSpy: MockInstance;
    let logInfoSpy: MockInstance;
    let logWarningSpy: MockInstance;
    let logErrorSpy: MockInstance;

    const clearLogMocks = (): void => {
        logDebugSpy.mockClear();
        logInfoSpy.mockClear();
        logWarningSpy.mockClear();
        logErrorSpy.mockClear();
    };

    const makeOptions = (applicationId: number, gpdfSecurityLevel: number, gpdfSecurityKeyType: number, bidirectionalInfo: number): number => {
        return (applicationId & 0x7) | ((gpdfSecurityLevel & 0x3) << 6) | ((gpdfSecurityKeyType & 0x7) << 8) | ((bidirectionalInfo & 0x3) << 11);
    };

    const makeHeader = (
        sequenceNumber: number,
        commandIdentifier: number,
        applicationId: number,
        gpdfSecurityLevel: number,
        gpdfSecurityKeyType: number,
        bidirectionalInfo: number,
        sourceId: number,
        gpdSecurityFrameCounter: number,
        gpdCommandId: number,
        payloadLength: number,
    ): Buffer => {
        const gpdHeader = Buffer.alloc(15);
        gpdHeader.writeUInt8(0b00000001, 0); // frameControl: FrameType.SPECIFIC + Direction.CLIENT_TO_SERVER + disableDefaultResponse=false
        gpdHeader.writeUInt8(sequenceNumber, 1);
        gpdHeader.writeUInt8(commandIdentifier, 2);
        gpdHeader.writeUInt16LE(makeOptions(applicationId, gpdfSecurityLevel, gpdfSecurityKeyType, bidirectionalInfo), 3);
        gpdHeader.writeUInt32LE(sourceId, 5);
        gpdHeader.writeUInt32LE(gpdSecurityFrameCounter, 9);
        gpdHeader.writeUInt8(gpdCommandId, 13);
        gpdHeader.writeUInt8(payloadLength, 14);

        return gpdHeader;
    };

    const makePayload = (sourceId: number, buffer: Buffer, linkQuality: number): ZclPayload => {
        return {
            clusterID: Zcl.Clusters.greenPower.ID,
            header: Zcl.Header.fromBuffer(buffer),
            address: sourceId & 0xffff,
            data: buffer,
            endpoint: GP_ENDPOINT,
            linkquality: linkQuality,
            groupID: GP_GROUP_ID,
            wasBroadcast: true,
            destinationEndpoint: GP_ENDPOINT,
        };
    };

    beforeAll(() => {
        vi.useFakeTimers();

        logDebugSpy = vi.spyOn(logger, 'debug');
        logInfoSpy = vi.spyOn(logger, 'info');
        logWarningSpy = vi.spyOn(logger, 'warning');
        logErrorSpy = vi.spyOn(logger, 'error');
    });

    beforeEach(async () => {
        clearLogMocks();

        gp = new GreenPower(
            // @ts-expect-error minimal mock
            {
                getCoordinatorIEEE: vi.fn(),
                sendZclFrameToAll: vi.fn(),
                sendZclFrameToEndpoint: vi.fn(),
                getNetworkParameters: vi.fn(),
            },
        );
    });

    afterAll(async () => {
        vi.useRealTimers();
    });

    // @see https://github.com/Koenkk/zigbee2mqtt/issues/19405#issuecomment-2727338024
    it('FULLENCR ZT-LP-ZEU2S-WH-MS MOES 2-gang', async () => {
        let joinData: GreenPowerDeviceJoinedPayload | undefined;

        gp.on('deviceJoined', (payload) => {
            joinData = payload;
        });

        const addr = {applicationId: 0, sourceId: 1496140231, endpoint: 0};

        {
            const status = 0; // NO_SECURITY
            const gpdLink = 214;
            const sequenceNumber = 19;
            const gpdfSecurityLevel = 0; // NONE
            const gpdfSecurityKeyType = 0; // NONE
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 4294967295;
            const gpdCommandId = 224;
            const mic = 4294967295;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('0289f31adb70a88d71196ee50c03580537767de27ad5331309000037647a62697061304047503030303157', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                gpdfSecurityLevel,
                gpdfSecurityKeyType,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey); // always undefined since not yet joined

            await vi.waitUntil(() => joinData !== undefined);

            expect(joinData).toStrictEqual({
                sourceID: addr.sourceId,
                deviceID: frame.payload.commandFrame.deviceID,
                networkAddress: addr.sourceId & 0xffff,
                securityKey: frame.payload.commandFrame.securityKey,
            });
            expect(logInfoSpy).toHaveBeenNthCalledWith(1, '[COMMISSIONING] from=18887', 'zh:controller:greenpower');
            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                '[PAIRING] options=58696 (appId=0 communicationMode=2) wasBroadcast=true gppNwkAddr=undefined',
                'zh:controller:greenpower',
            );

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0xe0;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        const statusUnprocessed = 3;
        const securityLevelFullEncr = 3;
        const securityKeyTypeNWK = 1;

        // left
        {
            const gpdLink = 220;
            const sequenceNumber = 28;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2332;
            const gpdCommandId = 136;
            const mic = 4131949313;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x20 from=18887', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x20;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        // left
        {
            const gpdLink = 220;
            const sequenceNumber = 46;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2350;
            const gpdCommandId = 152;
            const mic = 3001674474;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x20 from=18887', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x20;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        // left
        {
            const gpdLink = 223;
            const sequenceNumber = 55;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2359;
            const gpdCommandId = 189;
            const mic = 2400705126;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x20 from=18887', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x20;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        // right
        {
            const gpdLink = 218;
            const sequenceNumber = 37;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2341;
            const gpdCommandId = 172;
            const mic = 910775396;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x21 from=18887', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x21;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        // right
        {
            const gpdLink = 222;
            const sequenceNumber = 64;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2368;
            const gpdCommandId = 159;
            const mic = 3815901271;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x21 from=18887', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x21;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        // right
        {
            const gpdLink = 222;
            const sequenceNumber = 73;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2377;
            const gpdCommandId = 11;
            const mic = 1323179061;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x21 from=18887', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x21;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        // mock unsupported FULLENCR cmd
        {
            const gpdLink = 222;
            const sequenceNumber = 73;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2377;
            const gpdCommandId = 11;
            const mic = 1323179061;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            // @ts-expect-error mock override
            frame.header.commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logErrorSpy).toHaveBeenNthCalledWith(
                1,
                `[FULLENCR] from=18887 commandIdentifier=${Zcl.Clusters.greenPower.commands.commissioningNotification.ID} Not supported`,
                'zh:controller:greenpower',
            );

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(frame)));
        }

        clearLogMocks();

        // mock FULLENCR with unknown security key
        {
            const gpdLink = 222;
            const sequenceNumber = 73;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2377;
            const gpdCommandId = 11;
            const mic = 1323179061;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, undefined);

            expect(logErrorSpy).toHaveBeenNthCalledWith(
                1,
                '[FULLENCR] from=18887 commandIdentifier=0 Unknown security key',
                'zh:controller:greenpower',
            );

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(frame)));
        }
    });

    // @see https://github.com/Koenkk/zigbee2mqtt/issues/19405#issuecomment-2732204071
    it('FULLENCR ZT-LP-ZEU2S-WH-MS MOES 3-gang', async () => {
        let joinData: GreenPowerDeviceJoinedPayload | undefined;

        gp.on('deviceJoined', (payload) => {
            joinData = payload;
        });

        const addr = {applicationId: 0, sourceId: 344902069, endpoint: 0};

        {
            const status = 0; // NO_SECURITY
            const gpdLink = 219;
            const sequenceNumber = 139;
            const gpdfSecurityLevel = 0; // NONE
            const gpdfSecurityKeyType = 0; // NONE
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 4294967295;
            const gpdCommandId = 224;
            const mic = 4294967295;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('0289f35690230a93ea5f1951926f200236c7820891812a8b0400007165726837706f7840475030303031be', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                gpdfSecurityLevel,
                gpdfSecurityKeyType,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey); // always undefined since not yet joined

            await vi.waitUntil(() => joinData !== undefined);

            expect(joinData).toStrictEqual({
                sourceID: addr.sourceId,
                deviceID: frame.payload.commandFrame.deviceID,
                networkAddress: addr.sourceId & 0xffff,
                securityKey: frame.payload.commandFrame.securityKey,
            });
            expect(logInfoSpy).toHaveBeenNthCalledWith(1, '[COMMISSIONING] from=51637', 'zh:controller:greenpower');
            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                '[PAIRING] options=58696 (appId=0 communicationMode=2) wasBroadcast=true gppNwkAddr=undefined',
                'zh:controller:greenpower',
            );

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0xe0;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        const statusUnprocessed = 3;
        const securityLevelFullEncr = 3;
        const securityKeyTypeNWK = 1;

        // left
        {
            const gpdLink = 224;
            const sequenceNumber = 175;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 1199;
            const gpdCommandId = 92;
            const mic = 814351874;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x20 from=51637', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x20;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        // middle
        {
            const gpdLink = 225;
            const sequenceNumber = 184;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 1208;
            const gpdCommandId = 109;
            const mic = 603647566;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x21 from=51637', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x21;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }

        clearLogMocks();

        // right
        {
            const gpdLink = 225;
            const sequenceNumber = 193;
            const autoCommissioning = false;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 1217;
            const gpdCommandId = 219;
            const mic = 119880410;
            const proxyTableIndex = 255;
            const gpdCommandPayload = Buffer.from('', 'hex');
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                addr.applicationId,
                securityLevelFullEncr,
                securityKeyTypeNWK,
                bidirectionalInfo,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
            );
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

            // console.log(JSON.stringify(frame.header, undefined, 2));
            // console.log(JSON.stringify(frame.payload, undefined, 2));

            const retFrame = await gp.onZclGreenPowerData(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(1, '[UNHANDLED_CMD/PASSTHROUGH] command=0x11 from=51637', 'zh:controller:greenpower');

            const clonedFrame = JSON.parse(JSON.stringify(frame));
            clonedFrame.payload.commandID = 0x11;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(clonedFrame);
        }
    });
});
