import type {MockInstance} from "vitest";
import type {ZclPayload} from "../src/adapter/events";

import {GreenPower} from "../src/controller/greenPower";
import type {GreenPowerDeviceJoinedPayload} from "../src/controller/tstype";
import {logger} from "../src/utils/logger";
import {GP_ENDPOINT, GP_GROUP_ID} from "../src/zspec/consts";
import * as Zcl from "../src/zspec/zcl";

describe("GreenPower", () => {
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

    const makeNotificationOptions = (
        applicationId: number,
        gpdfSecurityLevel: number,
        gpdfSecurityKeyType: number,
        bidirectionalInfo: number,
    ): number => {
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
        options?: number,
    ): Buffer => {
        const gpdHeader = Buffer.alloc(15);
        gpdHeader.writeUInt8(0b00000001, 0); // frameControl: FrameType.SPECIFIC + Direction.CLIENT_TO_SERVER + disableDefaultResponse=false
        gpdHeader.writeUInt8(sequenceNumber, 1);
        gpdHeader.writeUInt8(commandIdentifier, 2);
        gpdHeader.writeUInt16LE(options ?? makeNotificationOptions(applicationId, gpdfSecurityLevel, gpdfSecurityKeyType, bidirectionalInfo), 3);
        gpdHeader.writeUInt32LE(sourceId, 5);
        gpdHeader.writeUInt32LE(gpdSecurityFrameCounter, 9);
        gpdHeader.writeUInt8(gpdCommandId, 13);
        gpdHeader.writeUInt8(payloadLength, 14);

        return gpdHeader;
    };

    const makeFooter = (options: number, gppNwkAddr?: number, gppGpdLink?: number, mic?: number): Buffer => {
        const hasGppData = options & 0x800;
        const hasMic = options & 0x200;
        const gpdFooter = Buffer.alloc((hasGppData ? 3 : 0) + (hasMic ? 4 : 0));

        if (hasGppData) {
            gpdFooter.writeUInt16LE(gppNwkAddr!, 0);
            gpdFooter.writeUInt8(gppGpdLink!, 2);
        }

        if (hasMic) {
            gpdFooter.writeUInt32LE(mic!, hasGppData ? 3 : 0);
        }

        return gpdFooter;
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

        logDebugSpy = vi.spyOn(logger, "debug");
        logInfoSpy = vi.spyOn(logger, "info");
        logWarningSpy = vi.spyOn(logger, "warning");
        logErrorSpy = vi.spyOn(logger, "error");
    });

    beforeEach(() => {
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

    afterAll(() => {
        vi.useRealTimers();
    });

    it("encodes & decodes pairing options", () => {
        let rawByte = 0b000000000110101000;
        let rawOptions = {
            appId: 0,
            addSink: true,
            removeGpd: false,
            communicationMode: 0b01,
            gpdFixed: true,
            gpdMacSeqNumCapabilities: true,
            securityLevel: 0,
            securityKeyType: 0,
            gpdSecurityFrameCounterPresent: false,
            gpdSecurityKeyPresent: false,
            assignedAliasPresent: false,
            groupcastRadiusPresent: false,
        };
        let options = GreenPower.decodePairingOptions(rawByte);
        let byte = GreenPower.encodePairingOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);

        rawByte = 0b001110010101001000;
        rawOptions = {
            appId: 0,
            addSink: true,
            removeGpd: false,
            communicationMode: 0b10,
            gpdFixed: false,
            gpdMacSeqNumCapabilities: true,
            securityLevel: 0b10,
            securityKeyType: 0b100,
            gpdSecurityFrameCounterPresent: true,
            gpdSecurityKeyPresent: true,
            assignedAliasPresent: false,
            groupcastRadiusPresent: false,
        };
        options = GreenPower.decodePairingOptions(rawByte);
        byte = GreenPower.encodePairingOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);

        rawByte = 0b001110010101101000;
        rawOptions = {
            appId: 0,
            addSink: true,
            removeGpd: false,
            communicationMode: 0b11,
            gpdFixed: false,
            gpdMacSeqNumCapabilities: true,
            securityLevel: 0b10,
            securityKeyType: 0b100,
            gpdSecurityFrameCounterPresent: true,
            gpdSecurityKeyPresent: true,
            assignedAliasPresent: false,
            groupcastRadiusPresent: false,
        };
        options = GreenPower.decodePairingOptions(rawByte);
        byte = GreenPower.encodePairingOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);

        rawByte = 0b000000000110110000;
        rawOptions = {
            appId: 0,
            addSink: false,
            removeGpd: true,
            communicationMode: 0b01,
            gpdFixed: true,
            gpdMacSeqNumCapabilities: true,
            securityLevel: 0b00,
            securityKeyType: 0b000,
            gpdSecurityFrameCounterPresent: false,
            gpdSecurityKeyPresent: false,
            assignedAliasPresent: false,
            groupcastRadiusPresent: false,
        };
        options = GreenPower.decodePairingOptions(rawByte);
        byte = GreenPower.encodePairingOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);

        // coverage
        rawByte = 0b110000000010110000;
        rawOptions = {
            appId: 0,
            addSink: false,
            removeGpd: true,
            communicationMode: 0b01,
            gpdFixed: true,
            gpdMacSeqNumCapabilities: false,
            securityLevel: 0b00,
            securityKeyType: 0b000,
            gpdSecurityFrameCounterPresent: false,
            gpdSecurityKeyPresent: false,
            assignedAliasPresent: true,
            groupcastRadiusPresent: true,
        };
        options = GreenPower.decodePairingOptions(rawByte);
        byte = GreenPower.encodePairingOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);
    });

    it("encodes & decodes commissioning mode options", () => {
        let rawByte = 0x0b;
        let rawOptions = {action: 1, commissioningWindowPresent: true, exitMode: 0b10, channelPresent: false, unicastCommunication: false};
        let options = GreenPower.decodeCommissioningModeOptions(rawByte);
        let byte = GreenPower.encodeCommissioningModeOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);
        rawByte = 0x2b;
        rawOptions = {action: 1, commissioningWindowPresent: true, exitMode: 0b10, channelPresent: false, unicastCommunication: true};
        options = GreenPower.decodeCommissioningModeOptions(rawByte);
        byte = GreenPower.encodeCommissioningModeOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);
        rawByte = 0x0a;
        rawOptions = {action: 0, commissioningWindowPresent: true, exitMode: 0b10, channelPresent: false, unicastCommunication: false};
        options = GreenPower.decodeCommissioningModeOptions(rawByte);
        byte = GreenPower.encodeCommissioningModeOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);
        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);

        // coverage
        rawByte = 0b111100;
        rawOptions = {action: 0, commissioningWindowPresent: false, exitMode: 0b11, channelPresent: true, unicastCommunication: true};
        options = GreenPower.decodeCommissioningModeOptions(rawByte);
        byte = GreenPower.encodeCommissioningModeOptions(rawOptions);

        expect(options).toStrictEqual(rawOptions);
        expect(rawByte).toStrictEqual(byte);
    });

    it("omits GPP data from raw payload", async () => {
        const addr = {applicationId: 0, sourceId: 2777252112, endpoint: 0};
        const options = 0x800;
        const sequenceNumber = 18;
        const gpdSecurityFrameCounter = 17326;
        const gpdCommandId = 38;
        const gpdCommandPayload = Buffer.from([0x3e]);
        const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
        const gppNwkAddr = 24404;
        const gppGpdLink = 207;

        const gpdHeader = makeHeader(
            sequenceNumber,
            commandIdentifier,
            0,
            0,
            0,
            0,
            addr.sourceId,
            gpdSecurityFrameCounter,
            gpdCommandId,
            gpdCommandPayload.length,
            options,
        );
        const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink);
        const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 138);
        const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
        const retFrame = await gp.processCommand(payload, frame, undefined);

        expect(frame.payload.gppNwkAddr).toStrictEqual(gppNwkAddr);
        expect(frame.payload.gppGpdLink).toStrictEqual(gppGpdLink);
        expect(retFrame.payload.commandFrame).toStrictEqual({raw: gpdCommandPayload});
        expect(retFrame.payload.gppNwkAddr).toStrictEqual(gppNwkAddr);
        expect(retFrame.payload.gppGpdLink).toStrictEqual(gppGpdLink);
    });

    it("omits MIC from raw payload", async () => {
        const securityKey = Buffer.from([227, 227, 225, 134, 235, 104, 141, 250, 162, 211, 104, 147, 201, 146, 67, 175]);
        const addr = {applicationId: 0, sourceId: 2777252112, endpoint: 0};
        const options = 0x30 | 0x200;
        const sequenceNumber = 18;
        const gpdSecurityFrameCounter = 17326;
        const gpdCommandId = 38;
        const gpdCommandPayload = Buffer.from([0x3e]);
        const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
        const mic = 1441399364;

        const gpdHeader = makeHeader(
            sequenceNumber,
            commandIdentifier,
            0,
            0,
            0,
            0,
            addr.sourceId,
            gpdSecurityFrameCounter,
            gpdCommandId,
            gpdCommandPayload.length,
            options,
        );
        const gpdFooter = makeFooter(options, undefined, undefined, mic);
        const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 138);
        const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
        const retFrame = await gp.processCommand(payload, frame, securityKey);

        expect(frame.payload.mic).toBeDefined(); // garbage
        expect(retFrame.payload.commandID).toStrictEqual(0x21); // just to be sure it decrypted properly
        expect(retFrame.payload.commandFrame).toStrictEqual({raw: Buffer.from([207 /* decrypted, bogus data */])});
        expect(retFrame.payload.mic).toStrictEqual(undefined); // removed once decrypted
    });

    it("omits GPP data and MIC from raw payload", async () => {
        const securityKey = Buffer.from([227, 227, 225, 134, 235, 104, 141, 250, 162, 211, 104, 147, 201, 146, 67, 175]);
        const addr = {applicationId: 0, sourceId: 2777252112, endpoint: 0};
        const options = 0x30 | 0x200 | 0x800;
        const sequenceNumber = 18;
        const gpdSecurityFrameCounter = 17326;
        const gpdCommandId = 38;
        const gpdCommandPayload = Buffer.from([0x3e]);
        const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
        const gppNwkAddr = 24404;
        const gppGpdLink = 207;
        const mic = 1441399364;

        const gpdHeader = makeHeader(
            sequenceNumber,
            commandIdentifier,
            0,
            0,
            0,
            0,
            addr.sourceId,
            gpdSecurityFrameCounter,
            gpdCommandId,
            gpdCommandPayload.length,
            options,
        );
        const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink, mic);
        const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 138);
        const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
        const retFrame = await gp.processCommand(payload, frame, securityKey);

        expect(frame.payload.gppNwkAddr).toBeDefined(); // garbage
        expect(frame.payload.gppGpdLink).toBeDefined(); // garbage
        expect(frame.payload.mic).toBeDefined(); // garbage
        expect(retFrame.payload.commandID).toStrictEqual(0x21); // just to be sure it decrypted properly
        expect(retFrame.payload.commandFrame).toStrictEqual({raw: Buffer.from([207 /* decrypted, bogus data */])});
        expect(retFrame.payload.gppNwkAddr).toStrictEqual(gppNwkAddr); // removed once decrypted
        expect(retFrame.payload.gppGpdLink).toStrictEqual(gppGpdLink); // removed once decrypted
        expect(retFrame.payload.mic).toStrictEqual(undefined); // removed once decrypted
    });

    it("does not parse command frame when FULLENCR security level - SINK", async () => {
        const addr = {applicationId: 0, sourceId: 2888399791, endpoint: 0};
        const securityLevelFullEncr = 3;
        const securityKeyTypeNWK = 1;
        const gpdLink = 207;
        const sequenceNumber = 143;
        const bidirectionalInfo = 0;
        const gpdSecurityFrameCounter = 3727;
        const gpdCommandId = 227; // this would otherwise be CHANNEL_REQUEST and result in bad parsing
        const gpdCommandPayload = Buffer.from("", "hex");
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

        expect(frame.payload.commandFrame).toBeUndefined(); // as opposed to `{}` when parsing (payloadSize=0)

        const retFrame = await gp.processCommand(payload, frame, Buffer.alloc(16) /* just for the codepath, decrypting not important */);

        expect(logDebugSpy).toHaveBeenNthCalledWith(
            1,
            "[UNHANDLED_CMD/PASSTHROUGH] command=0x9d srcID=2888399791 gpp=NO",
            "zh:controller:greenpower",
        );

        const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
        clonedFrame.payload.commandID = 0x9d;
        clonedFrame.payload.options = 256;
        clonedFrame.payload.commandFrame = {};

        expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
    });

    it("does not parse command frame when FULLENCR security level - GPP", async () => {
        const addr = {applicationId: 0, sourceId: 2888399791, endpoint: 0};
        const gpdLink = 207;
        const sequenceNumber = 143;
        const gpdSecurityFrameCounter = 3727;
        const gpdCommandId = 227; // this would otherwise be CHANNEL_REQUEST and result in bad parsing
        const gpdCommandPayload = Buffer.from("", "hex");
        const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
        const gppNwkAddr = 24404;
        const gppGpdLink = 123;
        const mic = 456;
        const options = 2864;

        const gpdHeader = makeHeader(
            sequenceNumber,
            commandIdentifier,
            0,
            0,
            0,
            0,
            addr.sourceId,
            gpdSecurityFrameCounter,
            gpdCommandId,
            gpdCommandPayload.length,
            options,
        );
        const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink, mic);
        const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), gpdLink);
        const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});

        expect(frame.payload.commandFrame).toBeUndefined(); // as opposed to `{}` when parsing (payloadSize=0)

        const retFrame = await gp.processCommand(payload, frame, Buffer.alloc(16) /* just for the codepath, decrypting not important */);

        expect(logDebugSpy).toHaveBeenNthCalledWith(
            1,
            "[UNHANDLED_CMD/PASSTHROUGH] command=0x9d srcID=2888399791 gpp=24404 rssi=59 linkQuality=Moderate",
            "zh:controller:greenpower",
        );

        const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
        clonedFrame.payload.commandID = 0x9d;
        clonedFrame.payload.options = 2304;
        clonedFrame.payload.commandFrame = {};
        clonedFrame.payload.gppNwkAddr = gppNwkAddr;
        clonedFrame.payload.gppGpdLink = gppGpdLink;
        delete clonedFrame.payload.mic;

        expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
    });

    // @see https://github.com/Koenkk/zigbee2mqtt/issues/19405#issuecomment-2727338024
    it("FULLENCR ZT-LP-ZEU2S-WH-MS MOES 2-gang vectors from ember", async () => {
        let joinData: GreenPowerDeviceJoinedPayload | undefined;

        gp.on("deviceJoined", (payload) => {
            joinData = payload;
        });

        const addr = {applicationId: 0, sourceId: 1496140231, endpoint: 0};

        {
            const gpdLink = 214;
            const sequenceNumber = 19;
            const gpdfSecurityLevel = 0; // NONE
            const gpdfSecurityKeyType = 0; // NONE
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 4294967295;
            const gpdCommandId = 224;
            const gpdCommandPayload = Buffer.from("0289f31adb70a88d71196ee50c03580537767de27ad5331309000037647a62697061304047503030303157", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey); // always undefined since not yet joined

            await vi.waitUntil(() => joinData !== undefined);

            expect(joinData).toStrictEqual({
                sourceID: addr.sourceId,
                deviceID: frame.payload.commandFrame.deviceID,
                networkAddress: addr.sourceId & 0xffff,
                securityKey: frame.payload.commandFrame.securityKey,
            });
            expect(logInfoSpy).toHaveBeenNthCalledWith(1, "[COMMISSIONING] srcID=1496140231 gpp=NO", "zh:controller:greenpower");
            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[PAIRING] srcID=1496140231 gpp=NO options=58696 (addSink=true commMode=2)",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0xe0;
            clonedFrame.payload.options = 0;
            clonedFrame.payload.commandFrame = {
                deviceID: 2,
                options: 137,
                extendedOptions: 243,
                securityKey: joinData?.securityKey,
                keyMic: 869628642,
                outgoingCounter: 2323,
                applicationInfo: addr.applicationId,
                manufacturerID: 0,
                modelID: 0,
                numGpdCommands: 0,
                gpdCommandIdList: Buffer.from([]),
                numServerClusters: 0,
                numClientClusters: 0,
                gpdServerClusters: Buffer.from([]),
                gpdClientClusters: Buffer.from([]),
                genericSwitchConfig: 0,
                currentContactStatus: 0,
            };

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame.securityKey).toStrictEqual(joinData?.securityKey);
        }

        clearLogMocks();

        const securityLevelFullEncr = 3;
        const securityKeyTypeNWK = 1;

        // left
        {
            const gpdLink = 220;
            const sequenceNumber = 28;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2332;
            const gpdCommandId = 136;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x20 srcID=1496140231 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x20;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // left
        {
            const gpdLink = 220;
            const sequenceNumber = 46;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2350;
            const gpdCommandId = 152;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x20 srcID=1496140231 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x20;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // left
        {
            const gpdLink = 223;
            const sequenceNumber = 55;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2359;
            const gpdCommandId = 189;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x20 srcID=1496140231 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x20;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // right
        {
            const gpdLink = 218;
            const sequenceNumber = 37;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2341;
            const gpdCommandId = 172;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x21 srcID=1496140231 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x21;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // right
        {
            const gpdLink = 222;
            const sequenceNumber = 64;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2368;
            const gpdCommandId = 159;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x21 srcID=1496140231 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x21;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // right
        {
            const gpdLink = 222;
            const sequenceNumber = 73;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2377;
            const gpdCommandId = 11;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x21 srcID=1496140231 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x21;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // mock FULLENCR with unknown security key
        {
            const gpdLink = 222;
            const sequenceNumber = 73;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 2377;
            const gpdCommandId = 11;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, undefined);

            expect(logErrorSpy).toHaveBeenNthCalledWith(
                1,
                "[FULLENCR] srcID=1496140231 gpp=NO commandIdentifier=0 Unknown security key",
                "zh:controller:greenpower",
            );

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(frame)));
        }

        clearLogMocks();

        // mock FULLENCR with gpp data
        {
            const gpdLink = 222;
            const sequenceNumber = 73;
            const gpdSecurityFrameCounter = 2377;
            const gpdCommandId = 11;
            const gpdCommandPayload = Buffer.from("", "hex");
            const commandIdentifier = Zcl.Clusters.greenPower.commands.notification.ID;
            const gppNwkAddr = 24404;
            const gppGpdLink = 207;
            const options = ((0b11 & 0x3) << 6) | 0x4000;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                0,
                0,
                0,
                0,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
                options,
            );
            const gpdFooter = Buffer.alloc(3);
            gpdFooter.writeUInt16LE(gppNwkAddr, 0);
            gpdFooter.writeUInt8(gppGpdLink, 2);
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), gpdLink);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x21 srcID=1496140231 gpp=24404 rssi=15 linkQuality=Excellent",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x21;
            clonedFrame.payload.options = 16384;
            clonedFrame.payload.commandFrame = {};
            clonedFrame.payload.gppNwkAddr = gppNwkAddr;
            clonedFrame.payload.gppGpdLink = gppGpdLink;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }
    });

    // @see https://github.com/Koenkk/zigbee2mqtt/issues/19405#issuecomment-2732204071
    it("FULLENCR ZT-LP-ZEU2S-WH-MS MOES 3-gang vectors from ember", async () => {
        let joinData: GreenPowerDeviceJoinedPayload | undefined;

        gp.on("deviceJoined", (payload) => {
            joinData = payload;
        });

        const addr = {applicationId: 0, sourceId: 344902069, endpoint: 0};

        {
            const gpdLink = 219;
            const sequenceNumber = 139;
            const gpdfSecurityLevel = 0; // NONE
            const gpdfSecurityKeyType = 0; // NONE
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 4294967295;
            const gpdCommandId = 224;
            const gpdCommandPayload = Buffer.from("0289f35690230a93ea5f1951926f200236c7820891812a8b0400007165726837706f7840475030303031be", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey); // always undefined since not yet joined

            await vi.waitUntil(() => joinData !== undefined);

            expect(joinData).toStrictEqual({
                sourceID: addr.sourceId,
                deviceID: frame.payload.commandFrame.deviceID,
                networkAddress: addr.sourceId & 0xffff,
                securityKey: frame.payload.commandFrame.securityKey,
            });
            expect(logInfoSpy).toHaveBeenNthCalledWith(1, "[COMMISSIONING] srcID=344902069 gpp=NO", "zh:controller:greenpower");
            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[PAIRING] srcID=344902069 gpp=NO options=58696 (addSink=true commMode=2)",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0xe0;
            clonedFrame.payload.options = 0;
            clonedFrame.payload.commandFrame = {
                deviceID: 2,
                options: 137,
                extendedOptions: 243,
                securityKey: joinData?.securityKey,
                keyMic: 713134344,
                outgoingCounter: 1163,
                applicationInfo: addr.applicationId,
                manufacturerID: 0,
                modelID: 0,
                numGpdCommands: 0,
                gpdCommandIdList: Buffer.from([]),
                numServerClusters: 0,
                numClientClusters: 0,
                gpdServerClusters: Buffer.from([]),
                gpdClientClusters: Buffer.from([]),
                genericSwitchConfig: 0,
                currentContactStatus: 0,
            };

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame.securityKey).toStrictEqual(joinData?.securityKey);
        }

        clearLogMocks();

        const securityLevelFullEncr = 3;
        const securityKeyTypeNWK = 1;

        // left
        {
            const gpdLink = 224;
            const sequenceNumber = 175;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 1199;
            const gpdCommandId = 92;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x20 srcID=344902069 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x20;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // middle
        {
            const gpdLink = 225;
            const sequenceNumber = 184;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 1208;
            const gpdCommandId = 109;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x21 srcID=344902069 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x21;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // right
        {
            const gpdLink = 225;
            const sequenceNumber = 193;
            const bidirectionalInfo = 0;
            const gpdSecurityFrameCounter = 1217;
            const gpdCommandId = 219;
            const gpdCommandPayload = Buffer.from("", "hex");
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
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x11 srcID=344902069 gpp=NO",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x11;
            clonedFrame.payload.options = 256;
            clonedFrame.payload.commandFrame = {};

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }
    });

    // @see https://github.com/Koenkk/zigbee2mqtt/issues/19405#issuecomment-2744667458
    it("FULLENCR ZT-LP-ZEU2S-WH-MS MOES 2-gang vectors from zstack through GPP", async () => {
        const joinData: GreenPowerDeviceJoinedPayload = {
            sourceID: 2777252112,
            deviceID: 2,
            networkAddress: 2777252112 & 0xffff,
            securityKey: Buffer.from([227, 227, 225, 134, 235, 104, 141, 250, 162, 211, 104, 147, 201, 146, 67, 175]),
        };
        const addr = {applicationId: 0, sourceId: 2777252112, endpoint: 0};
        const gppNwkAddr = 24404;
        const options = 2864;

        // right
        {
            const sequenceNumber = 18;
            const gpdSecurityFrameCounter = 17326;
            const gpdCommandId = 38;
            const gpdCommandPayload = Buffer.from("", "hex");
            const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
            const gppGpdLink = 207;
            const mic = 1441399364;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                0,
                0,
                0,
                0,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
                options,
            );
            const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink, mic);
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 138);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x21 srcID=2777252112 gpp=24404 rssi=15 linkQuality=Excellent",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x21;
            clonedFrame.payload.options = 2304;
            clonedFrame.payload.commandFrame = {};
            clonedFrame.payload.gppNwkAddr = gppNwkAddr;
            clonedFrame.payload.gppGpdLink = gppGpdLink;
            delete clonedFrame.payload.mic;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // right
        {
            const sequenceNumber = 19;
            const gpdSecurityFrameCounter = 17335;
            const gpdCommandId = 17;
            const gpdCommandPayload = Buffer.from("", "hex");
            const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
            const gppGpdLink = 207;
            const mic = 3064327344;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                0,
                0,
                0,
                0,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
                options,
            );
            const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink, mic);
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 127);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x21 srcID=2777252112 gpp=24404 rssi=15 linkQuality=Excellent",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x21;
            clonedFrame.payload.options = 2304;
            clonedFrame.payload.commandFrame = {};
            clonedFrame.payload.gppNwkAddr = gppNwkAddr;
            clonedFrame.payload.gppGpdLink = gppGpdLink;
            delete clonedFrame.payload.mic;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // right
        {
            const sequenceNumber = 20;
            const gpdSecurityFrameCounter = 17344;
            const gpdCommandId = 211;
            const gpdCommandPayload = Buffer.from("", "hex");
            const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
            const gppGpdLink = 207;
            const mic = 3315864057;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                0,
                0,
                0,
                0,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
                options,
            );
            const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink, mic);
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 138);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x21 srcID=2777252112 gpp=24404 rssi=15 linkQuality=Excellent",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x21;
            clonedFrame.payload.options = 2304;
            clonedFrame.payload.commandFrame = {};
            clonedFrame.payload.gppNwkAddr = gppNwkAddr;
            clonedFrame.payload.gppGpdLink = gppGpdLink;
            delete clonedFrame.payload.mic;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // left
        {
            const sequenceNumber = 21;
            const gpdSecurityFrameCounter = 17353;
            const gpdCommandId = 174;
            const gpdCommandPayload = Buffer.from("", "hex");
            const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
            const gppGpdLink = 142;
            const mic = 827946906;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                0,
                0,
                0,
                0,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
                options,
            );
            const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink, mic);
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 138);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x20 srcID=2777252112 gpp=24404 rssi=14 linkQuality=High",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x20;
            clonedFrame.payload.options = 2304;
            clonedFrame.payload.commandFrame = {};
            clonedFrame.payload.gppNwkAddr = gppNwkAddr;
            clonedFrame.payload.gppGpdLink = gppGpdLink;
            delete clonedFrame.payload.mic;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // left
        {
            const sequenceNumber = 22;
            const gpdSecurityFrameCounter = 17362;
            const gpdCommandId = 230;
            const gpdCommandPayload = Buffer.from("", "hex");
            const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
            const gppGpdLink = 209;
            const mic = 2941277720;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                0,
                0,
                0,
                0,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
                options,
            );
            const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink, mic);
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 142);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x20 srcID=2777252112 gpp=24404 rssi=17 linkQuality=Excellent",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x20;
            clonedFrame.payload.options = 2304;
            clonedFrame.payload.commandFrame = {};
            clonedFrame.payload.gppNwkAddr = gppNwkAddr;
            clonedFrame.payload.gppGpdLink = gppGpdLink;
            delete clonedFrame.payload.mic;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }

        clearLogMocks();

        // left
        {
            const sequenceNumber = 23;
            const gpdSecurityFrameCounter = 17371;
            const gpdCommandId = 59;
            const gpdCommandPayload = Buffer.from("", "hex");
            const commandIdentifier = Zcl.Clusters.greenPower.commands.commissioningNotification.ID;
            const gppGpdLink = 209;
            const mic = 3231351307;

            const gpdHeader = makeHeader(
                sequenceNumber,
                commandIdentifier,
                0,
                0,
                0,
                0,
                addr.sourceId,
                gpdSecurityFrameCounter,
                gpdCommandId,
                gpdCommandPayload.length,
                options,
            );
            const gpdFooter = makeFooter(options, gppNwkAddr, gppGpdLink, mic);
            const payload = makePayload(addr.sourceId, Buffer.concat([gpdHeader, gpdCommandPayload, gpdFooter]), 138);
            const frame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            const retFrame = await gp.processCommand(payload, frame, joinData?.securityKey);

            expect(logDebugSpy).toHaveBeenNthCalledWith(
                1,
                "[UNHANDLED_CMD/PASSTHROUGH] command=0x20 srcID=2777252112 gpp=24404 rssi=17 linkQuality=Excellent",
                "zh:controller:greenpower",
            );

            const clonedFrame = Zcl.Frame.fromBuffer(payload.clusterID, payload.header, payload.data, {});
            clonedFrame.payload.commandID = 0x20;
            clonedFrame.payload.options = 2304;
            clonedFrame.payload.commandFrame = {};
            clonedFrame.payload.gppNwkAddr = gppNwkAddr;
            clonedFrame.payload.gppGpdLink = gppGpdLink;
            delete clonedFrame.payload.mic;

            expect(JSON.parse(JSON.stringify(retFrame))).toStrictEqual(JSON.parse(JSON.stringify(clonedFrame)));
            expect(retFrame.payload.commandFrame).toStrictEqual({});
        }
    });
});
