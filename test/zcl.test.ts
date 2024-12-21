import * as Zcl from '../src/zspec/zcl';
import {BuffaloZcl} from '../src/zspec/zcl/buffaloZcl';
import {BuffaloZclDataType, DataType, Direction, FrameType, StructuredIndicatorType} from '../src/zspec/zcl/definition/enums';

describe('Zcl', () => {
    it('Get cluster by name', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify', undefined, {});
        expect(cluster.ID).toBe(3);
        expect(cluster.name).toBe('genIdentify');
        expect(cluster.commands.identifyQuery.ID).toBe(1);
        expect(cluster.commands.identifyQuery.name).toBe('identifyQuery');
        expect(cluster.commandsResponse.identifyQueryRsp.ID).toBe(0);
        expect(cluster.commandsResponse.identifyQueryRsp.name).toBe('identifyQueryRsp');
    });

    it('Get cluster by ID', () => {
        const cluster1 = Zcl.Utils.getCluster(0, undefined, {});
        // @ts-expect-error testing
        delete cluster1.getAttribute;
        // @ts-expect-error testing
        delete cluster1.getCommand;
        // @ts-expect-error testing
        delete cluster1.hasAttribute;
        // @ts-expect-error testing
        delete cluster1.getCommandResponse;
        const cluster2 = Zcl.Utils.getCluster('genBasic', undefined, {});
        // @ts-expect-error testing
        delete cluster2.getAttribute;
        // @ts-expect-error testing
        delete cluster2.getCommand;
        // @ts-expect-error testing
        delete cluster2.hasAttribute;
        // @ts-expect-error testing
        delete cluster2.getCommandResponse;
        expect(cluster1).toStrictEqual(cluster2);
    });

    it('Get cluster attribute by ID', () => {
        const cluster = Zcl.Utils.getCluster(0, undefined, {});
        const attribute = cluster.getAttribute(1);
        expect(attribute).toStrictEqual({ID: 1, type: DataType.UINT8, name: 'appVersion'});
    });

    it('Cluster has attribute', () => {
        const cluster = Zcl.Utils.getCluster(0, undefined, {});
        expect(cluster.hasAttribute('zclVersion')).toBeTruthy();
        expect(cluster.hasAttribute('NOTEXISTING')).toBeFalsy();
        expect(cluster.hasAttribute(0)).toBeTruthy();
        expect(cluster.hasAttribute(910293)).toBeFalsy();
    });

    it('Get specific command by name', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify', undefined, {});
        const command = cluster.getCommand('ezmodeInvoke');
        expect(command.ID).toBe(2);
        expect(command.name).toBe('ezmodeInvoke');
    });

    it('Get global command by name', () => {
        const command = Zcl.Utils.getGlobalCommand('readRsp');
        expect(command.ID).toBe(1);
        expect(command.name).toBe('readRsp');
    });

    it('Get global command non existing', () => {
        expect(() => {
            Zcl.Utils.getGlobalCommand('nonexisting');
        }).toThrow("Global command with key 'nonexisting' does not exist");
    });

    it('Get cluster by name non-existing', () => {
        expect(() => {
            Zcl.Utils.getCluster('notExisting', undefined, {});
        }).toThrow("Cluster with name 'notExisting' does not exist");
    });

    it('Get cluster by id non-existing', () => {
        expect(JSON.parse(JSON.stringify(Zcl.Utils.getCluster(0x190231, undefined, {})))).toStrictEqual({
            ID: 1638961,
            attributes: {},
            name: '1638961',
            commands: {},
            commandsResponse: {},
        });
    });

    it('Get specific command by ID', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify', undefined, {});
        const command = cluster.getCommand(2);
        expect(command).toStrictEqual(cluster.getCommand('ezmodeInvoke'));
    });

    it('Get specific command by name server to client', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify', undefined, {});
        const command = cluster.getCommandResponse(0);
        expect(command.ID).toBe(0);
        expect(command.name).toBe('identifyQueryRsp');
    });

    it('Get specific command by name non existing', () => {
        expect(() => {
            const cluster = Zcl.Utils.getCluster('genIdentify', undefined, {});
            cluster.getCommandResponse('nonexisting');
        }).toThrow("Cluster 'genIdentify' has no command response 'nonexisting'");
    });

    it('Get discrete or analog of unkown type', () => {
        expect(() => {
            // @ts-expect-error invalid on purpose
            Zcl.Utils.getDataTypeClass(99999);
        }).toThrow("Don't know value type for 'undefined'");
    });

    it('ZclFrame from buffer parse payload with unknown frame type', () => {
        expect(() => {
            // @ts-ignore
            Zcl.Frame.parsePayload({frameControl: {frameType: 9}}, undefined);
        }).toThrow("Unsupported frameType '9'");
    });

    it('ZclFrame from buffer report', () => {
        const buffer = Buffer.from([0x18, 0x4a, 0x0a, 0x55, 0x00, 0x39, 0x00, 0x00, 0x00, 0x00]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genAnalogInput.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            74,
            10,
        );

        const payload = [
            {
                attrData: 0,
                attrId: 85,
                dataType: 57,
            },
        ];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
        expect(frame.header.isGlobal).toBe(true);
        expect(frame.header.isSpecific).toBe(false);
        expect(frame.isCluster('genAnalogInput')).toBe(true);
        expect(frame.isCommand('report')).toBe(true);
    });

    it('ZclFrame from buffer tradfriArrowSingle', () => {
        const buffer = Buffer.from([0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genScenes.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: false,
                frameType: 1,
                manufacturerSpecific: true,
            },
            4476,
            29,
            7,
        );

        const payload = {value: 256, value2: 13};

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
        expect(frame.command.ID).toStrictEqual(7);
        expect(frame.command.name).toStrictEqual('tradfriArrowSingle');
    });

    it('ZclFrame from buffer genGroups getMembership', () => {
        const buffer = Buffer.from([0x11, 0x7c, 0x02, 2, 10, 0, 20, 0]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            undefined,
            124,
            2,
        );

        const payload = {groupcount: 2, grouplist: [10, 20]};

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer genGroups getMembership', () => {
        const buffer = Buffer.from([0x19, 0x7c, 0x03, 0, 10, 0]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            undefined,
            124,
            3,
        );

        const payload = {groupid: 10, status: 0};

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer occupancy report', () => {
        const buffer = Buffer.from([24, 169, 10, 0, 0, 24, 1]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.msOccupancySensing.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            169,
            10,
        );

        const payload = [{attrId: 0, dataType: 24, attrData: 1}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp - short', () => {
        const buffer = Buffer.from([0x08, 0x01, 0x07, 0x00]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genPowerCfg.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            7,
        );

        const payload = [{status: 0}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp - long', () => {
        const buffer = Buffer.from([0x08, 0x01, 0x07, 0x00, 0x01, 0x34, 0x12, 0x01, 0x01, 0x35, 0x12]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genPowerCfg.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            7,
        );

        const payload = [
            {status: 0, direction: 1, attrId: 0x1234},
            {status: 1, direction: 1, attrId: 0x1235},
        ];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp (hvacThermostat)', () => {
        const buffer = Buffer.from([0x18, 0x03, 0x07, 0x00, 0x00, 0x12, 0x00]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.hvacThermostat.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            3,
            7,
        );

        const payload = [{status: 0, direction: 0, attrId: 18}];

        expect(frame.payload).toStrictEqual(payload);
        expect(frame.header).toStrictEqual(header);
    });

    it('ZclFrame from buffer getWeeklyScheduleRsp (hvacThermostat)', () => {
        const bufferHeat = Buffer.from([
            9, 7, 0, 6, 64, 1, 104, 1, 252, 8, 58, 2, 152, 8, 208, 2, 102, 8, 72, 3, 102, 8, 222, 3, 252, 8, 100, 5, 52, 8,
        ]);
        const frameHeat = Zcl.Frame.fromBuffer(Zcl.Clusters.hvacThermostat.ID, Zcl.Header.fromBuffer(bufferHeat)!, bufferHeat, {});
        expect(frameHeat.payload).toStrictEqual({
            numoftrans: 6,
            dayofweek: 64,
            mode: 1,
            transitions: [
                {transitionTime: 360, heatSetpoint: 2300},
                {transitionTime: 570, heatSetpoint: 2200},
                {transitionTime: 720, heatSetpoint: 2150},
                {transitionTime: 840, heatSetpoint: 2150},
                {transitionTime: 990, heatSetpoint: 2300},
                {transitionTime: 1380, heatSetpoint: 2100},
            ],
        });

        const bufferCool = Buffer.from([
            9, 7, 0, 6, 64, 2, 104, 1, 252, 8, 58, 2, 152, 8, 208, 2, 102, 8, 72, 3, 102, 8, 222, 3, 252, 8, 100, 5, 52, 8,
        ]);
        const frameCool = Zcl.Frame.fromBuffer(Zcl.Clusters.hvacThermostat.ID, Zcl.Header.fromBuffer(bufferCool)!, bufferCool, {});
        expect(frameCool.payload).toStrictEqual({
            numoftrans: 6,
            dayofweek: 64,
            mode: 2,
            transitions: [
                {transitionTime: 360, coolSetpoint: 2300},
                {transitionTime: 570, coolSetpoint: 2200},
                {transitionTime: 720, coolSetpoint: 2150},
                {transitionTime: 840, coolSetpoint: 2150},
                {transitionTime: 990, coolSetpoint: 2300},
                {transitionTime: 1380, coolSetpoint: 2100},
            ],
        });

        const bufferHeatAndCool = Buffer.from([9, 7, 0, 1, 64, 3, 104, 1, 252, 8, 58, 2]);
        const frameHeatAndCool = Zcl.Frame.fromBuffer(
            Zcl.Clusters.hvacThermostat.ID,
            Zcl.Header.fromBuffer(bufferHeatAndCool)!,
            bufferHeatAndCool,
            {},
        );
        expect(frameHeatAndCool.payload).toStrictEqual({
            numoftrans: 1,
            dayofweek: 64,
            mode: 3,
            transitions: [{transitionTime: 360, coolSetpoint: 570, heatSetpoint: 2300}],
        });
    });

    it('ZclFrame to buffer setWeeklyScheduleRsp (hvacThermostat)', () => {
        const payloadHeat = {
            numoftrans: 6,
            dayofweek: 64,
            mode: 1,
            transitions: [
                {transitionTime: 360, heatSetpoint: 23},
                {transitionTime: 570, heatSetpoint: 2200},
                {transitionTime: 720, heatSetpoint: 2150},
                {transitionTime: 840, heatSetpoint: 2150},
                {transitionTime: 990, heatSetpoint: 2300},
                {transitionTime: 1380, heatSetpoint: 2100},
            ],
        };
        const frameHeat = Zcl.Frame.create(
            FrameType.SPECIFIC,
            Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            8,
            'setWeeklySchedule',
            513,
            payloadHeat,
            {},
        );
        expect(frameHeat.toBuffer()).toStrictEqual(
            Buffer.from([1, 8, 1, 6, 64, 1, 104, 1, 23, 0, 58, 2, 152, 8, 208, 2, 102, 8, 72, 3, 102, 8, 222, 3, 252, 8, 100, 5, 52, 8]),
        );

        const payloadCool = {
            numoftrans: 6,
            dayofweek: 64,
            mode: 2,
            transitions: [
                {transitionTime: 360, coolSetpoint: 2300},
                {transitionTime: 570, coolSetpoint: 2200},
                {transitionTime: 720, coolSetpoint: 2150},
                {transitionTime: 840, coolSetpoint: 2150},
                {transitionTime: 990, coolSetpoint: 2300},
                {transitionTime: 1380, coolSetpoint: 2100},
            ],
        };
        const frameCool = Zcl.Frame.create(
            FrameType.SPECIFIC,
            Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            8,
            'setWeeklySchedule',
            513,
            payloadCool,
            {},
        );
        expect(frameCool.toBuffer()).toStrictEqual(
            Buffer.from([1, 8, 1, 6, 64, 2, 104, 1, 252, 8, 58, 2, 152, 8, 208, 2, 102, 8, 72, 3, 102, 8, 222, 3, 252, 8, 100, 5, 52, 8]),
        );

        const payloadHeatAndCool = {
            numoftrans: 6,
            dayofweek: 64,
            mode: 2,
            transitions: [{transitionTime: 360, coolSetpoint: 570, heatSetpoint: 2300}],
        };
        const frameHeatAndCool = Zcl.Frame.create(
            FrameType.SPECIFIC,
            Direction.CLIENT_TO_SERVER,
            false,
            undefined,
            8,
            'setWeeklySchedule',
            513,
            payloadHeatAndCool,
            {},
        );
        expect(frameHeatAndCool.toBuffer()).toStrictEqual(Buffer.from([1, 8, 1, 6, 64, 2, 104, 1, 252, 8, 58, 2]));
    });

    it('ZclFrame from buffer configReportRsp failed', () => {
        const buffer = Buffer.from([0x08, 0x01, 0x07, 0x02, 0x01, 0x01, 0x01]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genPowerCfg.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            7,
        );

        const payload = [{status: 2, direction: 1, attrId: 257}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer defaultRsp', () => {
        const buffer = Buffer.from([0x18, 0x04, 0x0b, 0x0c, 0x82]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            4,
            11,
        );

        const payload = {cmdId: 12, statusCode: 130};

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    test.each([
        [
            [
                28, 95, 17, 3, 10, 1, 255, 66, 68, 3, 40, 29, 5, 33, 190, 45, 8, 33, 47, 18, 9, 33, 2, 21, 100, 16, 1, 101, 16, 0, 110, 32, 255, 111,
                32, 255, 148, 32, 4, 149, 57, 184, 30, 21, 62, 150, 57, 211, 249, 17, 69, 151, 57, 0, 48, 104, 59, 152, 57, 0, 0, 0, 0, 155, 33, 1, 0,
                156, 32, 1, 10, 33, 56, 38, 12, 40, 0, 0,
            ],
            [
                {
                    attrId: 65281,
                    dataType: 66,
                    attrData: {
                        '3': 29,
                        '5': 11710,
                        '8': 4655,
                        '9': 5378,
                        '10': 9784,
                        '12': 0,
                        '100': 1,
                        '101': 0,
                        '110': 255,
                        '111': 255,
                        '148': 4,
                        '149': 0.14562499523162842,
                        '150': 2335.614013671875,
                        '151': 0.0035429000854492188,
                        '152': 0,
                        '155': 1,
                        '156': 1,
                    },
                },
            ],
        ],
        [
            [
                28, 95, 17, 3, 10, 5, 0, 66, 21, 108, 117, 109, 105, 46, 115, 101, 110, 115, 111, 114, 95, 119, 108, 101, 97, 107, 46, 97, 113, 49, 1,
                255, 66, 34, 1, 33, 213, 12, 3, 40, 33, 4, 33, 168, 19, 5, 33, 43, 0, 6, 36, 0, 0, 5, 0, 0, 8, 33, 4, 2, 10, 33, 0, 0, 100, 16, 0,
            ],
            [
                {attrId: 5, dataType: 66, attrData: 'lumi.sensor_wleak.aq1'},
                {attrId: 65281, dataType: 66, attrData: {'1': 3285, '3': 33, '4': 5032, '5': 43, '6': 327680, '8': 516, '10': 0, '100': 0}},
            ],
        ],
    ])('ZclFrame from buffer xiaomiStruct', (data, payload) => {
        const buffer = Buffer.from(data);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: true,
            },
            4447,
            3,
            10,
        );

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer struct', () => {
        const buffer = Buffer.from([28, 52, 18, 194, 10, 2, 255, 76, 6, 0, 16, 1, 33, 206, 11, 33, 168, 67, 36, 1, 0, 0, 0, 0, 33, 48, 2, 32, 86]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: true,
            },
            4660,
            194,
            10,
        );

        const payload = [
            {
                attrId: 65282,
                dataType: 76,
                numElms: 6,
                structElms: [
                    {elmType: 16, elmVal: 1},
                    {elmType: 33, elmVal: 3022},
                    {elmType: 33, elmVal: 17320},
                    {elmType: 36, elmVal: 1},
                    {elmType: 33, elmVal: 560},
                    {elmType: 32, elmVal: 86},
                ],
                attrData: [
                    {elmType: 16, elmVal: 1},
                    {elmType: 33, elmVal: 3022},
                    {elmType: 33, elmVal: 17320},
                    {elmType: 36, elmVal: 1},
                    {elmType: 33, elmVal: 560},
                    {elmType: 32, elmVal: 86},
                ],
            },
        ];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer discoverRsp', () => {
        const buffer = Buffer.from([24, 23, 13, 0, 32, 0, 32, 33, 0, 32, 49, 0, 48, 51, 0, 32, 53, 0, 24]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genPowerCfg.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            23,
            13,
        );

        const payload = {
            discComplete: 0,
            attrInfos: [
                {attrId: 32, dataType: 32},
                {attrId: 33, dataType: 32},
                {attrId: 49, dataType: 48},
                {attrId: 51, dataType: 32},
                {attrId: 53, dataType: 24},
            ],
        };

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
        expect(frame.cluster.name).toEqual('genPowerCfg');
        expect(frame.command.name).toEqual('discoverRsp');
    });

    it('ZclFrame from buffer error on malformed', () => {
        const buffer = Buffer.from([0x08, 0x01]);
        expect(() => {
            Zcl.Frame.fromBuffer(Zcl.Clusters.genPowerCfg.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        }).toThrow('Invalid ZclHeader');
    });

    it('ZclFrame from buffer readRsp failed', () => {
        const buffer = Buffer.from([8, 1, 1, 1, 0, 2]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            1,
        );

        const payload = [{status: 2, attrId: 1}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp success', () => {
        const buffer = Buffer.from([8, 1, 1, 1, 0, 0, 32, 3]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            1,
        );

        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.UINT8, attrData: 3}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer GDP commission', () => {
        const buffer = Buffer.from([
            0x11, 0x00, 0x04, 0x00, 0x00, 0xfe, 0xf4, 0x46, 0x00, 0xf9, 0x00, 0x00, 0x00, 0xe0, 0x1b, 0x02, 0x81, 0xf2, 0xf1, 0xec, 0x92, 0xab, 0xff,
            0x8f, 0x13, 0x63, 0xe1, 0x46, 0xbe, 0xb5, 0x18, 0xc9, 0x0c, 0xab, 0xa4, 0x46, 0xd4, 0xd5, 0xf9, 0x01, 0x00, 0x00,
        ]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            undefined,
            0,
            4,
        );

        const payload = {
            options: 0,
            srcID: 4650238,
            frameCounter: 249,
            commandID: 224,
            payloadSize: 27,
            commandFrame: {
                deviceID: 2,
                options: 129,
                extendedOptions: 242,
                gpdClientClusters: Buffer.alloc(0),
                gpdServerClusters: Buffer.alloc(0),
                manufacturerID: 0,
                modelID: 0,
                numClientClusters: 0,
                numServerClusters: 0,
                securityKey: Buffer.from([0xf1, 0xec, 0x92, 0xab, 0xff, 0x8f, 0x13, 0x63, 0xe1, 0x46, 0xbe, 0xb5, 0x18, 0xc9, 0x0c, 0xab]),
                keyMic: 3587458724,
                outgoingCounter: 505,
                applicationInfo: 0,
                numGdpCommands: 0,
                gpdCommandIdList: Buffer.alloc(0),
            },
        };

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer GDP scene 0', () => {
        const buffer = Buffer.from([0x11, 0x00, 0x00, 0xa0, 0x14, 0xfe, 0xf4, 0x46, 0x00, 0xe5, 0x04, 0x00, 0x00, 0x10, 0xff]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            undefined,
            0,
            0,
        );

        const payload = {
            srcID: 4650238,
            commandFrame: {},
            commandID: 16,
            frameCounter: 1253,
            options: 5280,
            payloadSize: 255,
        };

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer GDP with extra data', () => {
        const buffer = Buffer.from([0x11, 0x00, 0x00, 0xa0, 0x14, 0xfe, 0xf4, 0x46, 0x00, 0xe5, 0x04, 0x00, 0x00, 0x10, 0xff, 0x01]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            undefined,
            0,
            0,
        );

        const payload = {
            srcID: 4650238,
            commandFrame: {raw: Buffer.from([1])},
            commandID: 16,
            frameCounter: 1253,
            options: 5280,
            payloadSize: 255,
        };

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer GDP pairing', () => {
        const buffer = Buffer.from([
            0x19, 0x17, 0x01, 0x68, 0xe5, 0x00, 0xf8, 0x71, 0x71, 0x01, 0x47, 0x65, 0xa1, 0x1c, 0x00, 0x4b, 0x12, 0x00, 0x00, 0x00, 0x02, 0x1c, 0x12,
            0x00, 0x00, 0x09, 0x3c, 0xed, 0x1d, 0xbf, 0x25, 0x63, 0xf9, 0x29, 0x5c, 0x0d, 0x3d, 0x9f, 0xc5, 0x76, 0xe1, 0, 0, 0, 0, 0, 0,
        ]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.greenPower.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            undefined,
            23,
            1,
        );

        const payload = {
            options: 0x00e568,
            srcID: 0x017171f8,
            sinkIEEEAddr: '0x00124b001ca16547',
            sinkNwkAddr: 0,
            deviceID: 2,
            frameCounter: 4636,
            gpdKey: Buffer.from([0x09, 0x3c, 0xed, 0x1d, 0xbf, 0x25, 0x63, 0xf9, 0x29, 0x5c, 0x0d, 0x3d, 0x9f, 0xc5, 0x76, 0xe1]),
        };

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp alias type', () => {
        const buffer = Buffer.from([8, 1, 1, 1, 0, 0, 8, 3]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            1,
        );

        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.DATA8, attrData: 3}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp server to client', () => {
        const buffer = Buffer.from([8, 1, 6, 1, 1, 0, 10, 10]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            6,
        );

        const payload = [{attrId: 1, direction: 1, timeout: 2570}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp client to server analog', () => {
        const buffer = Buffer.from([8, 1, 6, 0, 0, 1, 32, 1, 0, 10, 0, 20]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            6,
        );

        const payload = [{attrId: 256, dataType: 32, direction: 0, maxRepIntval: 10, minRepIntval: 1, repChange: 20}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp client to server analog', () => {
        const buffer = Buffer.from([8, 1, 6, 0, 0, 1, 8, 1, 0, 10, 0]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            6,
        );

        const payload = [{attrId: 256, dataType: 8, direction: 0, maxRepIntval: 10, minRepIntval: 1}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp', () => {
        const buffer = Buffer.from([
            24, 7, 1, 5, 0, 0, 66, 30, 84, 82, 65, 68, 70, 82, 73, 32, 98, 117, 108, 98, 32, 69, 50, 55, 32, 87, 83, 32, 111, 112, 97, 108, 32, 57,
            56, 48, 108, 109, 6, 0, 0, 66, 8, 50, 48, 49, 55, 48, 51, 51, 49, 7, 0, 0, 48, 1, 10, 0, 0, 65, 15, 76, 69, 68, 49, 53, 52, 53, 71, 49,
            50, 69, 50, 55, 69, 85,
        ]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            7,
            1,
        );

        const payload = [
            {attrId: 5, status: 0, dataType: 66, attrData: 'TRADFRI bulb E27 WS opal 980lm'},
            {attrId: 6, status: 0, dataType: 66, attrData: '20170331'},
            {attrId: 7, status: 0, dataType: 48, attrData: 1},
            {attrId: 10, status: 0, dataType: 65, attrData: Buffer.from([76, 69, 68, 49, 53, 52, 53, 71, 49, 50, 69, 50, 55, 69, 85])},
        ];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame with Assa (manufacturer specific) cluster create', () => {
        const payload = [{attrId: 0x0012, status: 0, attrData: 1, dataType: 32}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, 0x101d, 8, 'readRsp', 0xfc00, payload, {});

        expect(frame.cluster.name).toBe('manuSpecificAssaDoorLock');
    });

    it('ZclFrame with Assa (manufacturer specific) cluster create with non Assamanufcode', () => {
        const payload = [{attrId: 0x0012, status: 0, attrData: 1, dataType: 32}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, 0x10f3, 8, 'readRsp', 0xfc00, payload, {});

        expect(frame.cluster.name).toBe('manuSpecificAssaDoorLock');
    });

    it('ZclFrame with Assa (manufacturer specific) cluster fromBuffer', () => {
        const buffer = Buffer.from([0x04, 0xf2, 0x10, 0x08, 0x01, 0x00, 0x00, 0x00, 0x20, 0x01]);
        const frame = Zcl.Frame.fromBuffer(0xfc00, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        expect(frame.cluster.name).toBe('manuSpecificAssaDoorLock');
    });

    it('ZclFrame to buffer with reservered bits', () => {
        const expected = Buffer.from([224, 8, 12, 0, 0, 240]);
        const payload = {startAttrId: 0, maxAttrIds: 240};
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, undefined, 8, 'discover', 0, payload, {}, 7);

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame from buffer with reservered bits', () => {
        const buffer = Buffer.from([224, 8, 12, 0, 0, 240]);
        const frame = Zcl.Frame.fromBuffer(0, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 7,
                direction: 0,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            undefined,
            8,
            12,
        );

        const payload = {startAttrId: 0, maxAttrIds: 240};

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame to buffer discover', () => {
        const expected = Buffer.from([0, 8, 12, 0, 0, 240]);
        const payload = {startAttrId: 0, maxAttrIds: 240};
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, undefined, 8, 'discover', 0, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer queryNextImageResponse with non zero status', () => {
        const expected = Buffer.from([9, 8, 2, 1]);
        const payload = {status: 1};
        const frame = Zcl.Frame.create(
            FrameType.SPECIFIC,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            8,
            'queryNextImageResponse',
            25,
            payload,
            {},
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer queryNextImageResponse with zero status', () => {
        const expected = Buffer.from([9, 8, 2, 0, 1, 0, 3, 0, 5, 0, 0, 0, 6, 0, 0, 0]);
        const payload = {status: 0, manufacturerCode: 1, imageType: 3, fileVersion: 5, imageSize: 6};
        const frame = Zcl.Frame.create(
            FrameType.SPECIFIC,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            8,
            'queryNextImageResponse',
            25,
            payload,
            {},
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer queryNextImageResponse with zero status and missing parameters', () => {
        const expected = Buffer.from([9, 8, 2, 1]);
        const payload = {status: 0};
        const frame = Zcl.Frame.create(
            FrameType.SPECIFIC,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            8,
            'queryNextImageResponse',
            25,
            payload,
            {},
        );

        let error;
        try {
            frame.toBuffer();
        } catch (e) {
            error = e;
        }
        expect(error).toStrictEqual(new Error(`Parameter 'manufacturerCode' is missing`));
    });

    it('ZclFrame to buffer readRsp UTC', () => {
        const expected = Buffer.from([24, 74, 1, 0, 0, 0, 226, 234, 83, 218, 36]);
        const payload = [{attrId: 0, status: 0, attrData: 618288106, dataType: 226}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, undefined, 74, 'readRsp', 0, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer write Livolo malformed', () => {
        // Created as example for https://github.com/Koenkk/zigbee-herdsman/issues/127
        const expectedOn = Buffer.from([0x1c, 0xd2, 0x1a, 0xe9, 0x02, 0x01, 0x00, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        const payloadOn = [{attrId: 1, attrData: Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]), dataType: 1}];
        const frameOn = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, 0x1ad2, 233, 'write', 0, payloadOn, {});
        expect(frameOn.toBuffer()).toStrictEqual(expectedOn);

        const expectedOff = Buffer.from([0x1c, 0xd2, 0x1a, 0xe9, 0x02, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        const payloadOff = [{attrId: 1, attrData: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]), dataType: 1}];
        const frameOff = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, 0x1ad2, 233, 'write', 0, payloadOff, {});
        expect(frameOff.toBuffer()).toStrictEqual(expectedOff);
    });

    it('ZclFrame write request with string as bytes array', () => {
        const payload = [{attrId: 0x0401, attrData: [0x07, 0x00, 0x02, 0x01, 0x00, 0x00, 0x00, 0x14], dataType: 0x42}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, 0x115f, 15, 'write', 0, payload, {});

        const expected = [0x14, 0x5f, 0x11, 0x0f, 0x02, 0x01, 0x04, 0x42, 0x07, 0x00, 0x02, 0x01, 0x00, 0x00, 0x00, 0x14];
        expect(Buffer.from(expected)).toStrictEqual(frame.toBuffer());
    });

    it('ZclFrame write rsp', () => {
        const payload = [{status: 0x11, attrId: 0x22}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, 0x115f, 15, 'writeRsp', 0, payload, {});
        const buffer = frame.toBuffer();

        const expected = [0x14, 0x5f, 0x11, 0x0f, 0x04, 0x11, 0x22, 0x00];
        expect(Buffer.from(expected)).toStrictEqual(buffer);
    });

    //{ frameType: 0, manufSpec: 0, direction: 0, disDefaultRsp: 0 } 0 8 'discover' { startAttrId: 0, maxAttrIds: 240 }
    it('ZclFrame to buffer readRsp success', () => {
        const expected = Buffer.from([8, 1, 1, 1, 0, 0, 32, 3]);
        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.UINT8, attrData: 3}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, false, undefined, 1, 1, 0, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer defaultRsp success', () => {
        const expected = Buffer.from([0x18, 0x04, 0x0b, 0x0c, 0x82]);
        const payload = {cmdId: 12, statusCode: 130};
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, undefined, 4, 11, 0, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer readStructured single element', () => {
        const expected = Buffer.from([0x18, 0x02, 0x0e, 0x01, 0x00, 0x01, 0x02, 0x00]);
        const payload = [{attrId: 0x0001, selector: {indexes: [2]}}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, undefined, 2, 0x0e, Zcl.Clusters.genBasic.ID, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer readStructured multiple elements', () => {
        const expected = Buffer.from([
            0x18, 0x02, 0x0e, 0x02, 0x00, 0x02, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x03, 0x06, 0x00, 0x07, 0x00, 0x08, 0x00,
        ]);
        const payload = [
            {attrId: 0x0002, selector: {indexes: [3, 4]}},
            {attrId: 0x0005, selector: {indexes: [6, 7, 8]}},
        ];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, undefined, 2, 0x0e, Zcl.Clusters.genBasic.ID, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer readStructured whole attribute', () => {
        const expected = Buffer.from([0x18, 0x02, 0x0e, 0x09, 0x00, 0x00]);
        const payload = [{attrId: 0x0009, selector: {}}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, undefined, 2, 0x0e, Zcl.Clusters.genBasic.ID, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame from buffer readStructured single elements', () => {
        const buffer = Buffer.from([0x18, 0x02, 0x0e, 0x01, 0x00, 0x01, 0x02, 0x00]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: Direction.SERVER_TO_CLIENT,
                disableDefaultResponse: true,
                frameType: FrameType.GLOBAL,
                manufacturerSpecific: false,
            },
            undefined,
            2,
            0x0e,
        );
        const payload = [{attrId: 0x0001, selector: {indexes: [2]}}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readStructured multiple elements', () => {
        const buffer = Buffer.from([
            0x18, 0x02, 0x0e, 0x02, 0x00, 0x02, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x03, 0x06, 0x00, 0x07, 0x00, 0x08, 0x00,
        ]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: Direction.SERVER_TO_CLIENT,
                disableDefaultResponse: true,
                frameType: FrameType.GLOBAL,
                manufacturerSpecific: false,
            },
            undefined,
            2,
            0x0e,
        );
        const payload = [
            {attrId: 0x0002, selector: {indexes: [3, 4]}},
            {attrId: 0x0005, selector: {indexes: [6, 7, 8]}},
        ];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readStructured whole attribute', () => {
        const buffer = Buffer.from([0x18, 0x02, 0x0e, 0x09, 0x00, 0x00]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: Direction.SERVER_TO_CLIENT,
                disableDefaultResponse: true,
                frameType: FrameType.GLOBAL,
                manufacturerSpecific: false,
            },
            undefined,
            2,
            0x0e,
        );
        const payload = [{attrId: 0x0009, selector: {indicatorType: StructuredIndicatorType.Whole}}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame to buffer writeStructured single element', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x01, 0x00, 0x01, 0x02, 0x00, 0x20, 0x03]);
        const payload = [{attrId: 0x0001, selector: {indexes: [2]}, dataType: Zcl.DataType.UINT8, elementData: 3}];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, undefined, 2, 0x0f, Zcl.Clusters.genBasic.ID, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured multiple elements', () => {
        const expected = Buffer.from([
            0x10, 0x02, 0x0f, 0x02, 0x00, 0x02, 0x03, 0x00, 0x04, 0x00, 0x42, 0x03, 0x66, 0x6f, 0x6f, 0x05, 0x00, 0x03, 0x06, 0x00, 0x07, 0x00, 0x08,
            0x00, 0x42, 0x03, 0x62, 0x61, 0x72,
        ]);
        const payload = [
            {attrId: 0x0002, selector: {indexes: [3, 4]}, dataType: Zcl.DataType.CHAR_STR, elementData: 'foo'},
            {attrId: 0x0005, selector: {indexes: [6, 7, 8]}, dataType: Zcl.DataType.CHAR_STR, elementData: 'bar'},
        ];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, undefined, 2, 0x0f, Zcl.Clusters.genBasic.ID, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured whole attribute', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x09, 0x00, 0x00, 0x48, 0x20, 0x03, 0x00, 0x0a, 0x0b, 0x0c]);
        const payload = [
            {attrId: 0x0009, selector: {}, dataType: Zcl.DataType.ARRAY, elementData: {elementType: Zcl.DataType.UINT8, elements: [10, 11, 12]}},
        ];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, undefined, 2, 0x0f, Zcl.Clusters.genBasic.ID, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured add element into set/bag', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x0d, 0x00, 0x10, 0x42, 0x03, 0x66, 0x6f, 0x6f]);
        const payload = [
            {attrId: 0x000d, selector: {indicatorType: StructuredIndicatorType.WriteAdd}, dataType: Zcl.DataType.CHAR_STR, elementData: 'foo'},
        ];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, undefined, 2, 0x0f, Zcl.Clusters.genBasic.ID, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured remove element from set/bag', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x0e, 0x00, 0x20, 0x42, 0x03, 0x62, 0x61, 0x72]);
        const payload = [
            {attrId: 0x000e, selector: {indicatorType: StructuredIndicatorType.WriteRemove}, dataType: Zcl.DataType.CHAR_STR, elementData: 'bar'},
        ];
        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, undefined, 2, 0x0f, Zcl.Clusters.genBasic.ID, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured Livolo malformed', () => {
        const expected = Buffer.from([0x7c, 0xd2, 0x1a, 0xe9, 0x0f, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        const payload = [{attrId: 0x0000, selector: null, elementData: [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]}];
        const frame = Zcl.Frame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            true,
            0x1ad2,
            0xe9,
            0x0f,
            Zcl.Clusters.genBasic.ID,
            payload,
            {},
            3,
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructuredRsp success', () => {
        const expected = Buffer.from([8, 1, 0x10, 0]);
        const payload = [{status: Zcl.Status.SUCCESS}];
        const frame = Zcl.Frame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            0x10,
            Zcl.Clusters.genBasic.ID,
            payload,
            {},
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructuredRsp failed selector unknown or none for type', () => {
        const expected = Buffer.from([8, 1, 0x10, 147, 1, 0, 0]);
        const payload = [{status: Zcl.Status.ACTION_DENIED, attrId: 1, selector: {indicatorType: StructuredIndicatorType.Whole}}];
        const frame = Zcl.Frame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            0x10,
            Zcl.Clusters.genBasic.ID,
            payload,
            {},
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructuredRsp failed with selector', () => {
        const expected = Buffer.from([8, 1, 0x10, 147, 1, 0, 1, 254, 0]);
        const payload = [{status: Zcl.Status.ACTION_DENIED, attrId: 1, selector: {indexes: [254]}}];
        const frame = Zcl.Frame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            0x10,
            Zcl.Clusters.genBasic.ID,
            payload,
            {},
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructuredRsp failed mixed selectors', () => {
        const expected = Buffer.from([8, 1, 0x10, 147, 16, 0, 0, 149, 14, 0, 2, 254, 0, 32, 0]);
        const payload = [
            {status: Zcl.Status.ACTION_DENIED, attrId: 16, selector: {indicatorType: StructuredIndicatorType.Whole}},
            {status: Zcl.Status.ABORT, attrId: 14, selector: {indexes: [254, 32]}},
        ];
        const frame = Zcl.Frame.create(
            FrameType.GLOBAL,
            Direction.SERVER_TO_CLIENT,
            false,
            undefined,
            1,
            0x10,
            Zcl.Clusters.genBasic.ID,
            payload,
            {},
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame from buffer writeStructuredRsp success', () => {
        const buffer = Buffer.from([8, 1, 0x10, 0]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: Direction.SERVER_TO_CLIENT,
                disableDefaultResponse: false,
                frameType: FrameType.GLOBAL,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            0x10,
        );
        const payload = [{status: Zcl.Status.SUCCESS}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer writeStructuredRsp failed selector unknown or none for type', () => {
        const buffer = Buffer.from([8, 1, 0x10, 147, 1, 0, 0]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: Direction.SERVER_TO_CLIENT,
                disableDefaultResponse: false,
                frameType: FrameType.GLOBAL,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            0x10,
        );
        const payload = [{status: Zcl.Status.ACTION_DENIED, attrId: 1, selector: {indicatorType: StructuredIndicatorType.Whole}}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer writeStructuredRsp failed with selector', () => {
        const buffer = Buffer.from([8, 1, 0x10, 147, 1, 0, 1, 254, 0]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: Direction.SERVER_TO_CLIENT,
                disableDefaultResponse: false,
                frameType: FrameType.GLOBAL,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            0x10,
        );
        const payload = [{status: Zcl.Status.ACTION_DENIED, attrId: 1, selector: {indexes: [254]}}];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer writeStructuredRsp failed mixed selectors', () => {
        const buffer = Buffer.from([8, 1, 0x10, 147, 16, 0, 0, 149, 14, 0, 2, 254, 0, 32, 0]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.genBasic.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: Direction.SERVER_TO_CLIENT,
                disableDefaultResponse: false,
                frameType: FrameType.GLOBAL,
                manufacturerSpecific: false,
            },
            undefined,
            1,
            0x10,
        );
        const payload = [
            {status: Zcl.Status.ACTION_DENIED, attrId: 16, selector: {indicatorType: StructuredIndicatorType.Whole}},
            {status: Zcl.Status.ABORT, attrId: 14, selector: {indexes: [254, 32]}},
        ];

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer ssIasAce arm command', () => {
        const buffer = Buffer.from([1, 87, 0, 0, 6, 49, 50, 51, 52, 53, 54, 0]);
        const frame = Zcl.Frame.fromBuffer(Zcl.Clusters.ssIasAce.ID, Zcl.Header.fromBuffer(buffer)!, buffer, {});
        const header = new Zcl.Header(
            {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: false,
                frameType: 1,
                manufacturerSpecific: false,
            },
            undefined,
            87,
            0,
        );

        const payload = {
            armmode: 0,
            code: '123456',
            zoneid: 0,
        };

        expect(frame.header).toStrictEqual(header);
        expect(frame.payload).toStrictEqual(payload);
        expect(frame.header.isGlobal).toBe(false);
        expect(frame.header.isSpecific).toBe(true);
        expect(frame.isCluster('ssIasAce')).toBe(true);
        expect(frame.isCommand('arm')).toBe(true);
    });

    it('ZclFrame to buffer discoverRsp', () => {
        const expected = Buffer.from([24, 23, 13, 0, 32, 0, 32, 33, 0, 32, 49, 0, 48, 51, 0, 32, 53, 0, 24]);
        const payload = {
            discComplete: 0,
            attrInfos: [
                {attrId: 32, dataType: 32},
                {attrId: 33, dataType: 32},
                {attrId: 49, dataType: 48},
                {attrId: 51, dataType: 32},
                {attrId: 53, dataType: 24},
            ],
        };

        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, undefined, 23, 13, 0, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer tradfriArrowSingle', () => {
        const expected = Buffer.from([0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00]);
        const payload = {value: 256, value2: 13};

        const frame = Zcl.Frame.create(FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, 4476, 29, 7, 5, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer readRsp failed', () => {
        const expected = Buffer.from([8, 1, 1, 1, 0, 2]);
        const payload = [{status: 2, attrId: 1}];

        const frame = Zcl.Frame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, false, undefined, 1, 1, 0, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer offWithEffect', () => {
        const expected = Buffer.from([0x1, 1, 64, 1, 0]);
        const payload = {effectid: 1, effectvariant: 0};

        const frame = Zcl.Frame.create(FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, undefined, 1, 64, 6, payload, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer offWithEffect', () => {
        const expected = Buffer.from([9, 9, 0, 1]);

        const frame = Zcl.Frame.create(FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, undefined, 9, 'restartDeviceRsp', 21, {status: 1}, {});

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer invalid frametype', () => {
        expect(() => {
            Zcl.Frame.create(
                // @ts-expect-error invalid on purpose
                3,
                Direction.CLIENT_TO_SERVER,
                false,
                undefined,
                1,
                64,
                6,
                {},
                {},
            ).toBuffer();
        }).toThrow("Frametype '3' not valid");
    });

    it('BuffaloZcl read array', () => {
        const buffer = Buffer.from([32, 3, 0, 1, 2, 3]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType.ARRAY, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([1, 2, 3]);
    });

    it('BuffaloZcl read struct', () => {
        const buffer = Buffer.from([0, 2, 0, 32, 8, 33, 4, 0]);
        const buffalo = new BuffaloZcl(buffer, 1);
        const value = buffalo.read(DataType.STRUCT, {});
        expect(buffalo.getPosition()).toBe(8);
        expect(value).toStrictEqual([
            {elmType: 32, elmVal: 8},
            {elmType: 33, elmVal: 4},
        ]);
    });

    it('BuffaloZcl read longCharStr', () => {
        const buffer = Buffer.from([5, 0, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType.LONG_CHAR_STR, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(value).toStrictEqual('hello');
    });

    it('BuffaloZcl read longOctetStr', () => {
        const buffer = Buffer.from([5, 0, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType.LONG_OCTET_STR, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(value).toStrictEqual(buffer.subarray(2));
    });

    it('BuffaloZcl read extensionFieldSets', () => {
        const buffer = Buffer.from([0, 3, 8, 1, 0, 2, 0, 3, 0, 4, 5]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType.EXTENSION_FIELD_SETS, {});
        expect(buffalo.getPosition()).toBe(11);
        expect(value).toStrictEqual([{clstId: 768, len: 8, extField: [1, 2, 3, 4, 5]}]);
    });

    it('BuffaloZcl read list zoneinfo', () => {
        const buffer = Buffer.from([1, 5, 0, 2, 6, 0]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType.LIST_ZONEINFO, {length: 2});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([
            {zoneID: 1, zoneStatus: 5},
            {zoneID: 2, zoneStatus: 6},
        ]);
    });

    it.each([DataType.UINT40, DataType.DATA40, DataType.BITMAP40])('BuffaloZcl read uint40, data40, bitmap40', (type) => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(type, {});
        expect(buffalo.getPosition()).toBe(5);
        expect(value).toStrictEqual(25853953281);
    });

    it.each([DataType.UINT48, DataType.DATA48, DataType.BITMAP48])('BuffaloZcl read uint48, data48, bitmap48', (type) => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(type, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual(7722435347713);
    });

    it.each([DataType.UINT56, DataType.DATA56, DataType.BITMAP56])('BuffaloZcl read uint56, data56, bitmap56', (type) => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7, 7]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(type, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(value).toStrictEqual(1978047272322305n);
    });

    it.each([DataType.UINT64, DataType.DATA64, DataType.BITMAP64])('BuffaloZcl read uint64, data64, bitmap64', (type) => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7, 7, 9]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(type, {});
        expect(buffalo.getPosition()).toBe(8);
        expect(value).toStrictEqual(0x0907070605040501n);
    });

    it('BuffaloZcl read int40', () => {
        const buffer = Buffer.from([254, 255, 255, 255, 127]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType.INT40, {});
        expect(buffalo.getPosition()).toBe(5);
        expect(value).toStrictEqual(549755813886);
    });

    it('BuffaloZcl read int56', () => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7, 7]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType.INT56, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(value).toStrictEqual(1978047272322305n);
    });

    it('BuffaloZcl read int64', () => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7, 7, 9]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType.INT64, {});
        expect(buffalo.getPosition()).toBe(8);
        expect(value).toStrictEqual(650496393613673729n);
    });

    it.each([
        ['no data point', Buffer.from([]), []],
        ['single data point', Buffer.from([1, 4, 0, 1, 1]), [{dp: 1, datatype: 4, data: Buffer.from([1])}]],
        [
            'two data points',
            Buffer.from([1, 4, 0, 1, 1, 4, 2, 0, 4, 0, 0, 0, 90]),
            [
                {dp: 1, datatype: 4, data: Buffer.from([1])},
                {dp: 4, datatype: 2, data: Buffer.from([0, 0, 0, 90])},
            ],
        ],
        ['incomplete data point is ignored', Buffer.from([1, 4, 0, 1, 1, 4]), [{dp: 1, datatype: 4, data: Buffer.from([1])}]],
        [
            'incomplete data buffer',
            Buffer.from([1, 4, 0, 1, 1, 4, 2, 0, 4, 0, 0, 0]),
            [
                {dp: 1, datatype: 4, data: Buffer.from([1])},
                {dp: 4, datatype: 2, data: Buffer.from([0, 0, 0])},
            ],
        ],
    ])('BuffaloZcl read readListTuyaDataPointValues %s', (_name, buffer, payload) => {
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES, {});
        expect(buffalo.isMore()).not.toBeTruthy();
        expect(value).toStrictEqual(payload);
    });

    it('BuffaloZcl write charStr', () => {
        const payload = 'hello';
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([5, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType.CHAR_STR, payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write longCharStr', () => {
        const payload = 'hello';
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([5, 0, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType.LONG_CHAR_STR, payload, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write octetStr', () => {
        const payload = [1, 2, 4];
        const buffer = Buffer.alloc(5);
        const expected = Buffer.from([3, 1, 2, 4, 0]);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType.OCTET_STR, payload, {});
        expect(buffalo.getPosition()).toBe(4);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write longOctetStr', () => {
        const payload = [1, 2, 3, 4, 5];
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([5, 0, 1, 2, 3, 4, 5]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType.LONG_OCTET_STR, payload, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write extensionFieldSets', () => {
        const payload = [{clstId: 768, len: 8, extField: [1, 2, 3, 4, 5]}];
        const buffer = Buffer.alloc(12);
        const expected = Buffer.from([0, 3, 8, 1, 0, 2, 0, 3, 0, 4, 5, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType.EXTENSION_FIELD_SETS, payload, {});
        expect(buffalo.getPosition()).toBe(11);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write zoneinfo', () => {
        const payload = [
            {zoneID: 1, zoneStatus: 5},
            {zoneID: 2, zoneStatus: 6},
        ];
        const buffer = Buffer.alloc(6);
        const expected = Buffer.from([1, 5, 0, 2, 6, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType.LIST_ZONEINFO, payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it.each([DataType.UINT40, DataType.DATA40, DataType.BITMAP40])('BuffaloZcl write uint40, data40, bitmap40', (type) => {
        const payload = 1099511627773;
        const buffer = Buffer.alloc(5);
        const expected = Buffer.from([253, 255, 255, 255, 255]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(type, payload, {});
        expect(buffalo.getPosition()).toBe(5);
        expect(buffer).toStrictEqual(expected);
    });

    it.each([DataType.UINT48, DataType.DATA48, DataType.BITMAP48])('BuffaloZcl write uint48, data48, bitmap48', (type) => {
        const payload = 281474976710653;
        const buffer = Buffer.alloc(6);
        const expected = Buffer.from([253, 255, 255, 255, 255, 255]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(type, payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it.each([DataType.UINT56, DataType.DATA56, DataType.BITMAP56])('BuffaloZcl write uint56, data56, bitmap56', (type) => {
        const payload = 1978047272322305n;
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([1, 5, 4, 5, 6, 7, 7]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(type, payload, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(buffer).toStrictEqual(expected);
    });

    it.each([DataType.UINT64, DataType.DATA64, DataType.BITMAP64])('BuffaloZcl write uint64, data64, bitmap64', (type) => {
        const payload = 0x0907070605040501n;
        const buffer = Buffer.alloc(8);
        const expected = Buffer.from([1, 5, 4, 5, 6, 7, 7, 9]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(type, payload, {});
        expect(buffalo.getPosition()).toBe(8);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write int40', () => {
        const payload = 549755813886;
        const buffer = Buffer.alloc(5);
        const expected = Buffer.from([254, 255, 255, 255, 127]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType.INT40, payload, {});
        expect(buffalo.getPosition()).toBe(5);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write int56', () => {
        const payload = 1978047272322305n;
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([1, 5, 4, 5, 6, 7, 7]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType.INT56, payload, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write int64', () => {
        const payload = 650496393613673729n;
        const buffer = Buffer.alloc(8);
        const expected = Buffer.from([1, 5, 4, 5, 6, 7, 7, 9]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType.INT64, payload, {});
        expect(buffalo.getPosition()).toBe(8);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write array element type string', () => {
        const payload = {
            elementType: Zcl.DataType.OCTET_STR,
            elements: [
                [0, 13, 1, 6, 0, 2],
                [1, 13, 2, 6, 0, 2],
                [2, 13, 3, 6, 0, 2],
                [3, 13, 4, 6, 0, 2],
            ],
        };
        const expected = Buffer.from([0x41, 0x04, 0x00, 6, 0, 13, 1, 6, 0, 2, 6, 1, 13, 2, 6, 0, 2, 6, 2, 13, 3, 6, 0, 2, 6, 3, 13, 4, 6, 0, 2]);
        const buffer = Buffer.alloc(expected.length);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType.ARRAY, payload, {});
        expect(buffalo.getPosition()).toBe(expected.length);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write array element type numeric', () => {
        const payload = {elementType: Zcl.DataType.DATA8, elements: [0, 0, 0, 0]};
        const expected = Buffer.from([0x08, 0x04, 0x00, 0, 0, 0, 0]);
        const buffer = Buffer.alloc(expected.length);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType.ARRAY, payload, {});
        expect(buffalo.getPosition()).toBe(expected.length);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write array element type numeric passed as string of DataType', () => {
        const payload = {elementType: 'DATA8', elements: [0, 0, 0, 0]};
        const expected = Buffer.from([0x08, 0x04, 0x00, 0, 0, 0, 0]);
        const buffer = Buffer.alloc(expected.length);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType.ARRAY, payload, {});
        expect(buffalo.getPosition()).toBe(expected.length);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write struct', () => {
        const payload = [
            {elmType: Zcl.DataType.UINT8, elmVal: 3},
            {elmType: Zcl.DataType.CHAR_STR, elmVal: 'a'},
        ];
        const expected = Buffer.from([2, 0, Zcl.DataType.UINT8, 3, Zcl.DataType.CHAR_STR, 1, 0x61]);
        const buffer = Buffer.alloc(expected.length);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType.STRUCT, payload, {});
        expect(buffalo.getPosition()).toBe(expected.length);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write security key', () => {
        const payload = [0x09, 0x07, 0x07, 0x06, 0x05, 0x04, 0x05, 0x01, 0x09, 0x07, 0x07, 0x06, 0x05, 0x04, 0x05, 0x01];
        const buffer = Buffer.alloc(16);
        const expected = Buffer.from([0x09, 0x07, 0x07, 0x06, 0x05, 0x04, 0x05, 0x01, 0x09, 0x07, 0x07, 0x06, 0x05, 0x04, 0x05, 0x01]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType.SEC_KEY, payload, {});
        expect(buffalo.getPosition()).toBe(16);
        expect(buffer).toStrictEqual(expected);
    });

    it.each([
        ['no data point', [], Buffer.from([])],
        ['single data point', [{dp: 1, datatype: 4, data: Buffer.from([1])}], Buffer.from([1, 4, 0, 1, 1])],
        [
            'two data points',
            [
                {dp: 1, datatype: 4, data: Buffer.from([1])},
                {dp: 4, datatype: 2, data: Buffer.from([0, 0, 0, 90])},
            ],
            Buffer.from([1, 4, 0, 1, 1, 4, 2, 0, 4, 0, 0, 0, 90]),
        ],
    ])('BuffaloZcl writeListTuyaDataPointValues %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(expected.length);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES, payload, {});
        expect(buffalo.getPosition()).toBe(expected.length);
        expect(buffer).toStrictEqual(expected);
    });

    it('Zcl utils get cluster without manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00, undefined, {});
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificAssaDoorLock');
    });

    it('Zcl utils get cluster with manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00, 0x100b, {});
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificPhilips');
    });

    it('Zcl utils get cluster manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00, 0x10f2, {});
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificAssaDoorLock');
    });

    it('Zcl utils get cluster manufacturerCode wrong', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00, 123, {});
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificAssaDoorLock');
    });

    it('Zcl utils get cluster attributes manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster('closuresWindowCovering', 0x1021, {});
        const attribute = cluster.getAttribute(0xf004);
        expect(attribute).toStrictEqual({ID: 0xf004, manufacturerCode: 0x1021, name: 'stepPositionTilt', type: 48});
    });

    it('Zcl utils get cluster attributes manufacturerCode wrong', () => {
        const cluster = Zcl.Utils.getCluster('closuresWindowCovering', 123, {});
        expect(() => cluster.getAttribute(0x1000)).toThrow("Cluster 'closuresWindowCovering' has no attribute '4096'");
    });

    it('Zcl utils get command', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff', undefined, {});
        const command = cluster.getCommand(0);
        expect(command.name).toEqual('off');
        expect(cluster.getCommand('off')).toEqual(command);
    });

    it('Zcl utils get attribute', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff', undefined, {});
        const command = cluster.getAttribute(16385);
        expect(command.name).toEqual('onTime');
        expect(cluster.getAttribute('onTime')).toEqual(command);
    });

    it('Zcl utils get attribute non-existing', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff', undefined, {});
        expect(() => cluster.getAttribute('notExisting')).toThrow("Cluster 'genOnOff' has no attribute 'notExisting'");
    });

    it('Zcl utils get command non-existing', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff', undefined, {});
        expect(() => cluster.getCommand('notExisting')).toThrow("Cluster 'genOnOff' has no command 'notExisting'");
    });

    it('Zcl green power readGdp commissioning', () => {
        const buffer = [
            0xff, // device
            0x00, // options
        ];
        const frame = new BuffaloZcl(Buffer.from(buffer));

        expect(
            frame.read(BuffaloZclDataType.GDP_FRAME, {
                payload: {
                    commandID: 0xe0,
                },
            }),
        ).toStrictEqual({
            deviceID: 0xff,
            options: 0x00,
            extendedOptions: 0x00,
            securityKey: Buffer.alloc(16),
            keyMic: 0,
            outgoingCounter: 0,
            manufacturerID: 0,
            modelID: 0,
            numGdpCommands: 0,
            gpdCommandIdList: Buffer.alloc(0),
            numServerClusters: 0,
            numClientClusters: 0,
            gpdServerClusters: Buffer.alloc(0),
            gpdClientClusters: Buffer.alloc(0),
            applicationInfo: 0x00,
        });
    });

    it('Zcl green power readGdp commissioning all options', () => {
        const buffer = [
            0xff, // device
            0x80 | 0x04, // options
            0x20 | 0x40 | 0x80, // extended options
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0, // security key
            0,
            0,
            0,
            0, // key mic
            0,
            0,
            0,
            0, // outgoing counter
            0x01 | 0x02 | 0x04 | 0x08, // application info
            0,
            0, // manufacturer ID
            0,
            0, // model ID
            0, // num GDP commands + commands
            0, // clusters
        ];
        const frame = new BuffaloZcl(Buffer.from(buffer));

        expect(
            frame.read(BuffaloZclDataType.GDP_FRAME, {
                payload: {
                    commandID: 0xe0,
                },
            }),
        ).toStrictEqual({
            deviceID: 0xff,
            options: 0x80 | 0x04,
            extendedOptions: 0x20 | 0x40 | 0x80,
            securityKey: Buffer.alloc(16),
            keyMic: 0,
            outgoingCounter: 0,
            manufacturerID: 0,
            modelID: 0,
            numGdpCommands: 0,
            gpdCommandIdList: Buffer.alloc(0),
            numServerClusters: 0,
            numClientClusters: 0,
            gpdServerClusters: Buffer.alloc(0),
            gpdClientClusters: Buffer.alloc(0),
            applicationInfo: 0x01 | 0x02 | 0x04 | 0x08,
        });
    });

    it('Zcl green power readGdp channel request', () => {
        const buffer = [0xfa];
        const frame = new BuffaloZcl(Buffer.from(buffer));

        expect(
            frame.read(BuffaloZclDataType.GDP_FRAME, {
                payload: {
                    commandID: 0xe3,
                },
            }),
        ).toStrictEqual({
            nextChannel: 0xa,
            nextNextChannel: 0xf,
        });
    });

    it('Zcl green power readGdp attribute report', () => {
        const buffer = [
            0x12,
            0x34, // Manufacturer ID
            0xff,
            0xff, // Cluster ID
            0x00,
            0x00, // Attribute ID
            DataType.UINT32, // Attribute Type
            0x00,
            0x01,
            0x02,
            0x03,
            0x01,
            0x00,
            DataType.CHAR_STR,
            0x06,
            0x5a,
            0x49,
            0x47,
            0x42,
            0x45,
            0x45,
            0x02,
            0x00,
            DataType.BOOLEAN,
            0x01,
        ];
        const frame = new BuffaloZcl(Buffer.from(buffer));

        expect(
            frame.read(BuffaloZclDataType.GDP_FRAME, {
                payload: {
                    commandID: 0xa1,
                    payloadSize: buffer.length,
                },
            }),
        ).toStrictEqual({
            manufacturerCode: 13330,
            clusterID: 65535,
            attributes: {
                '0': 50462976,
                '1': 'ZIGBEE',
                '2': 1,
            },
        });
    });

    it('Zcl green power writeGdp commissioning', () => {
        const expected = [
            1, // length
            0, // options
        ];
        const frame = new BuffaloZcl(Buffer.alloc(2));

        frame.write(
            BuffaloZclDataType.GDP_FRAME,
            {
                commandID: 0xf0,
                options: 0,
                panID: 0,
                securityKey: Buffer.alloc(16),
                keyMic: 0,
                frameCounter: 0,
            },
            {},
        );

        expect(frame.getWritten()).toStrictEqual(Buffer.from(expected));
    });

    it('Zcl green power writeGdp commissioning all options', () => {
        const expected = [
            27, // length
            0b11111, // options
            0xff,
            0xff, // PAN ID
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0, // security key
            0,
            0,
            0,
            0, // key mic
            0,
            0,
            0,
            0, // frame counter
        ];
        const frame = new BuffaloZcl(Buffer.alloc(28));

        frame.write(
            BuffaloZclDataType.GDP_FRAME,
            {
                commandID: 0xf0,
                options: 0b11111,
                panID: 0xffff,
                securityKey: Buffer.alloc(16),
                keyMic: 0,
                frameCounter: 0,
            },
            {},
        );

        expect(frame.getWritten()).toStrictEqual(Buffer.from(expected));
    });

    it('Zcl green power writeGdp custom reply', () => {
        const expected = [
            6, // length
            90,
            73,
            71,
            66,
            69,
            69, // ZIGBEE
        ];

        const frame = new BuffaloZcl(Buffer.alloc(7));
        frame.write(
            BuffaloZclDataType.GDP_FRAME,
            {
                commandID: 0xf4,
                buffer: Buffer.from('ZIGBEE'),
            },
            {},
        );

        expect(frame.getWritten()).toStrictEqual(Buffer.from(expected));
    });

    it('Zcl green power writeGdp unhandled command', () => {
        const frame = new BuffaloZcl(Buffer.alloc(7));
        frame.write(
            BuffaloZclDataType.GDP_FRAME,
            {
                commandID: 0x1ff,
            },
            {},
        );

        expect(frame.getWritten()).toStrictEqual(Buffer.alloc(0));
    });

    it('Zcl green power writeGdp channel configuration', () => {
        const expected = [
            1, // length
            0xf, // Channel 26
        ];

        const frame = new BuffaloZcl(Buffer.alloc(2));
        frame.write(
            BuffaloZclDataType.GDP_FRAME,
            {
                commandID: 0xf3,
                operationalChannel: 0xf,
                basic: false,
            },
            {},
        );

        expect(frame.getWritten()).toStrictEqual(Buffer.from(expected));
    });

    it('Zcl green power writeGdp channel configuration basic', () => {
        const expected = [
            1, // length
            0x1f, // Channel 26 + Basic
        ];

        const frame = new BuffaloZcl(Buffer.alloc(2));
        frame.write(
            BuffaloZclDataType.GDP_FRAME,
            {
                commandID: 0xf3,
                operationalChannel: 0xf,
                basic: true,
            },
            {},
        );

        expect(frame.getWritten()).toStrictEqual(Buffer.from(expected));
    });

    it('ZclFrame parse MiBoxer zone configuration command', () => {
        const zoneConfigPayload = Buffer.from([
            0x11, 0x01, 0xf0, 0x08, 0x84, 0x2b, 0x01, 0x98, 0x2b, 0x02, 0xac, 0x2b, 0x03, 0xc0, 0x2b, 0x04, 0xd4, 0x2b, 0x05, 0xe8, 0x2b, 0x06, 0xfc,
            0x2b, 0x07, 0x10, 0x2c, 0x08,
        ]);
        const zoneConfigFrame = Zcl.Frame.fromBuffer(Zcl.Clusters.genGroups.ID, Zcl.Header.fromBuffer(zoneConfigPayload)!, zoneConfigPayload, {});
        expect(zoneConfigFrame.payload.zones).toStrictEqual([
            {zoneNum: 1, groupId: 0x2b84},
            {zoneNum: 2, groupId: 0x2b98},
            {zoneNum: 3, groupId: 0x2bac},
            {zoneNum: 4, groupId: 0x2bc0},
            {zoneNum: 5, groupId: 0x2bd4},
            {zoneNum: 6, groupId: 0x2be8},
            {zoneNum: 7, groupId: 0x2bfc},
            {zoneNum: 8, groupId: 0x2c10},
        ]);
    });
    it('ZclFrame serialize MiBoxer zone configuration command', () => {
        const testZones = [
            {zoneNum: 1, groupId: 0x2b84},
            {zoneNum: 2, groupId: 0x2b98},
            {zoneNum: 3, groupId: 0x2bac},
            {zoneNum: 4, groupId: 0x2bc0},
            {zoneNum: 5, groupId: 0x2bd4},
            {zoneNum: 6, groupId: 0x2be8},
            {zoneNum: 7, groupId: 0x2bfc},
            {zoneNum: 8, groupId: 0x2c10},
        ];
        const zoneConfigFrame = Zcl.Frame.create(
            FrameType.SPECIFIC,
            Direction.CLIENT_TO_SERVER,
            true,
            undefined,
            1,
            'miboxerSetZones',
            Zcl.Clusters.genGroups.ID,
            {zones: testZones},
            {},
        );
        expect(zoneConfigFrame.toBuffer()).toStrictEqual(
            Buffer.from([
                0x11, 0x01, 0xf0, 0x08, 0x84, 0x2b, 0x01, 0x98, 0x2b, 0x02, 0xac, 0x2b, 0x03, 0xc0, 0x2b, 0x04, 0xd4, 0x2b, 0x05, 0xe8, 0x2b, 0x06,
                0xfc, 0x2b, 0x07, 0x10, 0x2c, 0x08,
            ]),
        );
    });

    it('BuffaloZcl read BIG_ENDIAN_UINT24', () => {
        const buffer = Buffer.from([0x01, 0x01, 0x86, 0xa0, 0x02]);
        const buffalo = new BuffaloZcl(buffer, 1);
        const value = buffalo.read(BuffaloZclDataType.BIG_ENDIAN_UINT24, {});
        expect(buffalo.getPosition()).toBe(4);
        expect(value).toStrictEqual(100000);
    });

    it('BuffaloZcl write BIG_ENDIAN_UINT24', () => {
        const payload = 16777200;
        const buffer = Buffer.alloc(4);
        const expected = Buffer.from([0x00, 0xff, 0xff, 0xf0]);
        const buffalo = new BuffaloZcl(buffer, 1);
        buffalo.write(BuffaloZclDataType.BIG_ENDIAN_UINT24, payload, {});
        expect(buffalo.getPosition()).toBe(4);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl read BUFFER whole', () => {
        const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType.BUFFER, {});
        expect(value).toStrictEqual(Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]));
    });

    it('BuffaloZcl read BUFFER with length', () => {
        const buffer = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType.BUFFER, {length: 3});
        expect(value).toStrictEqual(Buffer.from([0x01, 0x02, 0x03]));
    });

    it('BuffaloZcl write BUFFER whole', () => {
        const buffer = Buffer.alloc(5);
        const expected = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType.BUFFER, expected, {});
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write BUFFER always whole - length ignored', () => {
        const buffer = Buffer.alloc(5);
        const expected = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType.BUFFER, expected, {length: 3});
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write non existing type', () => {
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(0));
            // @ts-expect-error invalid typing
            buffalo.write(9999, 1, {});
        }).toThrow(new Error("Write for '9999' not available"));
    });

    it('BuffaloZcl read non existing type', () => {
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(0));
            // @ts-expect-error invalid typing
            buffalo.read(9999, {});
        }).toThrow(new Error("Read for '9999' not available"));
    });

    it('BuffaloZcl write TOD', () => {
        const buffer = Buffer.alloc(4);
        const expected = Buffer.from([0, 59, 34, 88]);
        const buffalo = new BuffaloZcl(buffer);
        const payload = {hours: 0, minutes: 59, seconds: 34, hundredths: 88};
        buffalo.write(DataType.TOD, payload, {});
        expect(buffalo.getBuffer()).toStrictEqual(expected);
    });

    it('BuffaloZcl read TOD', () => {
        const expected = {hours: 0, minutes: 59, seconds: 34, hundredths: 88};
        const buffalo = new BuffaloZcl(Buffer.from([0, 59, 34, 88]));
        const value = buffalo.read(DataType.TOD, {});
        expect(value).toStrictEqual(expected);
    });

    it('BuffaloZcl write DATE', () => {
        const buffer = Buffer.alloc(4);
        const expected = Buffer.from([100, 8, 31, 3]);
        const buffalo = new BuffaloZcl(buffer);
        const payload = {year: 2000, month: 8, dayOfMonth: 31, dayOfWeek: 3};
        buffalo.write(DataType.DATE, payload, {});
        expect(buffalo.getBuffer()).toStrictEqual(expected);
    });

    it('BuffaloZcl read DATE', () => {
        const expected = {year: 2000, month: 8, dayOfMonth: 31, dayOfWeek: 3};
        const buffalo = new BuffaloZcl(Buffer.from([100, 8, 31, 3]));
        const value = buffalo.read(DataType.DATE, {});
        expect(value).toStrictEqual(expected);
    });

    it('BuffaloZcl write TOD non-value', () => {
        const buffer = Buffer.alloc(4);
        const expected = Buffer.from([0xff, 0xff, 0xff, 0xff]);
        const buffalo = new BuffaloZcl(buffer);
        const payload = {hours: undefined, minutes: undefined, seconds: undefined, hundredths: undefined};
        buffalo.write(DataType.TOD, payload, {});
        expect(buffalo.getBuffer()).toStrictEqual(expected);
    });

    it('BuffaloZcl read DATE non-value', () => {
        const buffer = Buffer.alloc(4);
        const expected = Buffer.from([0xff, 0xff, 0xff, 0xff]);
        const buffalo = new BuffaloZcl(buffer);
        const payload = {year: undefined, month: undefined, dayOfMonth: undefined, dayOfWeek: undefined};
        buffalo.write(DataType.DATE, payload, {});
        expect(buffalo.getBuffer()).toStrictEqual(expected);
    });

    it('BuffaloZcl read OCTET_STR non-value', () => {
        const buffalo = new BuffaloZcl(Buffer.from([0xff]));
        const value = buffalo.read(DataType.OCTET_STR, {});
        expect(value).toStrictEqual(Buffer.from([]));
    });

    it('BuffaloZcl read CHAR_STR non-value', () => {
        const buffalo = new BuffaloZcl(Buffer.from([0xff]));
        const value = buffalo.read(DataType.CHAR_STR, {});
        expect(value).toStrictEqual('');
    });

    it('BuffaloZcl read MI_STRUCT non-value', () => {
        const buffalo = new BuffaloZcl(Buffer.from([0xff]));
        const value = buffalo.read(BuffaloZclDataType.MI_STRUCT, {});
        expect(value).toStrictEqual({});
    });

    it('BuffaloZcl read LONG_OCTET_STR non-value', () => {
        const buffalo = new BuffaloZcl(Buffer.from([0xff, 0xff]));
        const value = buffalo.read(DataType.LONG_OCTET_STR, {});
        expect(value).toStrictEqual(Buffer.from([]));
    });

    it('BuffaloZcl read LONG_CHAR_STR non-value', () => {
        const buffalo = new BuffaloZcl(Buffer.from([0xff, 0xff]));
        const value = buffalo.read(DataType.LONG_CHAR_STR, {});
        expect(value).toStrictEqual('');
    });

    it('BuffaloZcl read ARRAY non-value', () => {
        const buffalo = new BuffaloZcl(Buffer.from([DataType.UINT8, 0xff, 0xff]));
        const value = buffalo.read(DataType.ARRAY, {});
        expect(value).toStrictEqual([]);
    });

    it('BuffaloZcl read STRUCT non-value', () => {
        const buffalo = new BuffaloZcl(Buffer.from([0xff, 0xff]));
        const value = buffalo.read(DataType.STRUCT, {});
        expect(value).toStrictEqual([]);
    });

    it('BuffaloZcl write NO_DATA', () => {
        const buffalo = new BuffaloZcl(Buffer.alloc(2));
        const payload = null;
        buffalo.write(DataType.NO_DATA, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(0);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00]));
    });

    it('BuffaloZcl read NO_DATA', () => {
        const buffalo = new BuffaloZcl(Buffer.from([0x00, 0x00]), 1);
        const value = buffalo.read(DataType.NO_DATA, {});
        expect(buffalo.getPosition()).toStrictEqual(1);
        expect(value).toStrictEqual(undefined);
    });

    it('BuffaloZcl write UNKNOWN', () => {
        const buffalo = new BuffaloZcl(Buffer.alloc(2));
        const payload = null;
        buffalo.write(DataType.UNKNOWN, payload, {});
        expect(buffalo.getPosition()).toStrictEqual(0);
        expect(buffalo.getBuffer()).toStrictEqual(Buffer.from([0x00, 0x00]));
    });

    it('BuffaloZcl read UNKNOWN', () => {
        const buffalo = new BuffaloZcl(Buffer.from([0x00, 0x00]), 1);
        const value = buffalo.read(DataType.UNKNOWN, {});
        expect(buffalo.getPosition()).toStrictEqual(1);
        expect(value).toStrictEqual(undefined);
    });

    it('ZclHeader return undefined when too short', () => {
        const header = Zcl.Header.fromBuffer(Buffer.from([0, 8]));
        expect(header).toStrictEqual(undefined);
    });

    it('ZclHeader return undefined when too short manufacturer specific', () => {
        const header = Zcl.Header.fromBuffer(Buffer.from([4, 8, 3]));
        expect(header).toStrictEqual(undefined);
    });

    describe('BuffaloZcl write passthrough to Buffalo', () => {
        let buffalo: BuffaloZcl;

        beforeEach(() => {
            buffalo = new BuffaloZcl(Buffer.alloc(255));
        });

        it('uint8', () => {
            const uint8Spy = vi.spyOn(buffalo, 'writeUInt8');
            const types = [DataType.DATA8, DataType.BOOLEAN, DataType.BITMAP8, DataType.UINT8, DataType.ENUM8];
            let i = 0;

            for (const type of types) {
                buffalo.write(type, 1, {});
                expect(uint8Spy).toHaveBeenCalledTimes(++i);
            }
        });

        it('uint16', () => {
            const uint16Spy = vi.spyOn(buffalo, 'writeUInt16');
            const types = [DataType.DATA16, DataType.BITMAP16, DataType.UINT16, DataType.ENUM16, DataType.CLUSTER_ID, DataType.ATTR_ID];
            let i = 0;

            for (const type of types) {
                buffalo.write(type, 1, {});
                expect(uint16Spy).toHaveBeenCalledTimes(++i);
            }
        });

        it('uint24', () => {
            const uint24Spy = vi.spyOn(buffalo, 'writeUInt24');
            const types = [DataType.DATA24, DataType.BITMAP24, DataType.UINT24];
            let i = 0;

            for (const type of types) {
                buffalo.write(type, 1, {});
                expect(uint24Spy).toHaveBeenCalledTimes(++i);
            }
        });

        it('uint32', () => {
            const uint32Spy = vi.spyOn(buffalo, 'writeUInt32');
            const types = [DataType.DATA32, DataType.BITMAP32, DataType.UINT32, DataType.UTC, DataType.BAC_OID];
            let i = 0;

            for (const type of types) {
                buffalo.write(type, 1, {});
                expect(uint32Spy).toHaveBeenCalledTimes(++i);
            }
        });

        it('int8', () => {
            const int8Spy = vi.spyOn(buffalo, 'writeInt8');
            buffalo.write(DataType.INT8, 1, {});
            expect(int8Spy).toHaveBeenCalledTimes(1);
        });

        it('int16', () => {
            const int16Spy = vi.spyOn(buffalo, 'writeInt16');
            buffalo.write(DataType.INT16, 1, {});
            expect(int16Spy).toHaveBeenCalledTimes(1);
        });

        it('int24', () => {
            const int24Spy = vi.spyOn(buffalo, 'writeInt24');
            buffalo.write(DataType.INT24, 1, {});
            expect(int24Spy).toHaveBeenCalledTimes(1);
        });

        it('int32', () => {
            const int32Spy = vi.spyOn(buffalo, 'writeInt32');
            buffalo.write(DataType.INT32, 1, {});
            expect(int32Spy).toHaveBeenCalledTimes(1);
        });

        it('int48', () => {
            const int48Spy = vi.spyOn(buffalo, 'writeInt48');
            buffalo.write(DataType.INT48, 1, {});
            expect(int48Spy).toHaveBeenCalledTimes(1);
        });

        it('list uint8', () => {
            const listuint8Spy = vi.spyOn(buffalo, 'writeListUInt8');
            buffalo.write(BuffaloZclDataType.LIST_UINT8, [1], {});
            expect(listuint8Spy).toHaveBeenCalledTimes(1);
        });

        it('list uint16', () => {
            const listuint16Spy = vi.spyOn(buffalo, 'writeListUInt16');
            buffalo.write(BuffaloZclDataType.LIST_UINT16, [1], {});
            expect(listuint16Spy).toHaveBeenCalledTimes(1);
        });

        it('list uint24', () => {
            const listuint24Spy = vi.spyOn(buffalo, 'writeListUInt24');
            buffalo.write(BuffaloZclDataType.LIST_UINT24, [1], {});
            expect(listuint24Spy).toHaveBeenCalledTimes(1);
        });

        it('list uint32', () => {
            const listuint32Spy = vi.spyOn(buffalo, 'writeListUInt32');
            buffalo.write(BuffaloZclDataType.LIST_UINT32, [1], {});
            expect(listuint32Spy).toHaveBeenCalledTimes(1);
        });

        // NOT SUPPORTED
        // it('semi prec', () => {
        //     const semiPrecSpy = vi.spyOn(buffalo, 'writeSemiFloatLE');
        //     buffalo.write(DataType.SEMI_PREC, 1, {});
        //     expect(semiPrecSpy).toHaveBeenCalledTimes(1);
        // });

        it('single prec', () => {
            const singlePrecSpy = vi.spyOn(buffalo, 'writeFloatLE');
            buffalo.write(DataType.SINGLE_PREC, 1.1, {});
            expect(singlePrecSpy).toHaveBeenCalledTimes(1);
        });

        it('double prec', () => {
            const doublePrecSpy = vi.spyOn(buffalo, 'writeDoubleLE');
            buffalo.write(DataType.DOUBLE_PREC, 1.1, {});
            expect(doublePrecSpy).toHaveBeenCalledTimes(1);
        });

        it('ieee add', () => {
            const doublePrecSpy = vi.spyOn(buffalo, 'writeIeeeAddr');
            buffalo.write(DataType.IEEE_ADDR, '0xf1f1f1f1f1f1f1f1', {});
            expect(doublePrecSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('BuffaloZcl read passthrough to Buffalo', () => {
        let buffalo: BuffaloZcl;

        beforeEach(() => {
            buffalo = new BuffaloZcl(Buffer.alloc(255));
        });

        it('uint8', () => {
            const uint8Spy = vi.spyOn(buffalo, 'readUInt8');
            const types = [DataType.DATA8, DataType.BOOLEAN, DataType.BITMAP8, DataType.UINT8, DataType.ENUM8];
            let i = 0;

            for (const type of types) {
                buffalo.read(type, {});
                expect(uint8Spy).toHaveBeenCalledTimes(++i);
            }
        });

        it('uint16', () => {
            const uint16Spy = vi.spyOn(buffalo, 'readUInt16');
            const types = [DataType.DATA16, DataType.BITMAP16, DataType.UINT16, DataType.ENUM16, DataType.CLUSTER_ID, DataType.ATTR_ID];
            let i = 0;

            for (const type of types) {
                buffalo.read(type, {});
                expect(uint16Spy).toHaveBeenCalledTimes(++i);
            }
        });

        it('uint24', () => {
            const uint24Spy = vi.spyOn(buffalo, 'readUInt24');
            const types = [DataType.DATA24, DataType.BITMAP24, DataType.UINT24];
            let i = 0;

            for (const type of types) {
                buffalo.read(type, {});
                expect(uint24Spy).toHaveBeenCalledTimes(++i);
            }
        });

        it('uint32', () => {
            const uint32Spy = vi.spyOn(buffalo, 'readUInt32');
            const types = [DataType.DATA32, DataType.BITMAP32, DataType.UINT32, DataType.UTC, DataType.BAC_OID];
            let i = 0;

            for (const type of types) {
                buffalo.read(type, {});
                expect(uint32Spy).toHaveBeenCalledTimes(++i);
            }
        });

        it('int8', () => {
            const int8Spy = vi.spyOn(buffalo, 'readInt8');
            buffalo.read(DataType.INT8, {});
            expect(int8Spy).toHaveBeenCalledTimes(1);
        });

        it('int16', () => {
            const int16Spy = vi.spyOn(buffalo, 'readInt16');
            buffalo.read(DataType.INT16, {});
            expect(int16Spy).toHaveBeenCalledTimes(1);
        });

        it('int24', () => {
            const int24Spy = vi.spyOn(buffalo, 'readInt24');
            buffalo.read(DataType.INT24, {});
            expect(int24Spy).toHaveBeenCalledTimes(1);
        });

        it('int32', () => {
            const int32Spy = vi.spyOn(buffalo, 'readInt32');
            buffalo.read(DataType.INT32, {});
            expect(int32Spy).toHaveBeenCalledTimes(1);
        });

        it('int48', () => {
            const int48Spy = vi.spyOn(buffalo, 'readInt48');
            buffalo.read(DataType.INT48, {});
            expect(int48Spy).toHaveBeenCalledTimes(1);
        });

        it('list uint8', () => {
            const listuint8Spy = vi.spyOn(buffalo, 'readListUInt8');
            buffalo.read(BuffaloZclDataType.LIST_UINT8, {length: 1});
            expect(listuint8Spy).toHaveBeenCalledTimes(1);
        });

        it('list uint16', () => {
            const listuint16Spy = vi.spyOn(buffalo, 'readListUInt16');
            buffalo.read(BuffaloZclDataType.LIST_UINT16, {length: 1});
            expect(listuint16Spy).toHaveBeenCalledTimes(1);
        });

        it('list uint24', () => {
            const listuint24Spy = vi.spyOn(buffalo, 'readListUInt24');
            buffalo.read(BuffaloZclDataType.LIST_UINT24, {length: 1});
            expect(listuint24Spy).toHaveBeenCalledTimes(1);
        });

        it('list uint32', () => {
            const listuint32Spy = vi.spyOn(buffalo, 'readListUInt32');
            buffalo.read(BuffaloZclDataType.LIST_UINT32, {length: 1});
            expect(listuint32Spy).toHaveBeenCalledTimes(1);
        });

        // NOT SUPPORTED
        // it('semi prec', () => {
        //     const semiPrecSpy = vi.spyOn(buffalo, 'readSemiFloatLE');
        //     buffalo.read(DataType.SEMI_PREC, {});
        //     expect(semiPrecSpy).toHaveBeenCalledTimes(1);
        // });

        it('single prec', () => {
            const singlePrecSpy = vi.spyOn(buffalo, 'readFloatLE');
            buffalo.read(DataType.SINGLE_PREC, {});
            expect(singlePrecSpy).toHaveBeenCalledTimes(1);
        });

        it('double prec', () => {
            const doublePrecSpy = vi.spyOn(buffalo, 'readDoubleLE');
            buffalo.read(DataType.DOUBLE_PREC, {});
            expect(doublePrecSpy).toHaveBeenCalledTimes(1);
        });

        it('ieee add', () => {
            const doublePrecSpy = vi.spyOn(buffalo, 'readIeeeAddr');
            buffalo.read(DataType.IEEE_ADDR, {});
            expect(doublePrecSpy).toHaveBeenCalledTimes(1);
        });
    });

    it.each([
        BuffaloZclDataType.LIST_UINT8,
        BuffaloZclDataType.LIST_UINT16,
        BuffaloZclDataType.LIST_UINT24,
        BuffaloZclDataType.LIST_UINT32,
        BuffaloZclDataType.LIST_ZONEINFO,
    ])('Throws when read is missing required length option - param %s', (type) => {
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(type, {});
        }).toThrow(`Cannot read ${BuffaloZclDataType[type]} without length option specified`);
    });

    it('Reads as buffer when USE_DATA_TYPE is missing dataType option', () => {
        const buffalo = new BuffaloZcl(Buffer.from([12, 34]));
        const value = buffalo.read(BuffaloZclDataType.USE_DATA_TYPE, {});
        expect(value).toStrictEqual(Buffer.from([12, 34]));
        // @ts-expect-error protected
        buffalo.position = 1;
        const value2 = buffalo.read(BuffaloZclDataType.USE_DATA_TYPE, {length: 1});
        expect(value2).toStrictEqual(Buffer.from([34]));
    });

    it('Writes as buffer when USE_DATA_TYPE is missing dataType option', () => {
        const payload = Buffer.from([12, 34]);
        const buffer = Buffer.alloc(2);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType.USE_DATA_TYPE, payload, {});
        expect(buffer).toStrictEqual(payload);
    });

    it('Throws when write USE_DATA_TYPE is missing dataType option and value isnt buffer or number array', () => {
        expect(() => {
            const payload = 'abcd';
            const buffalo = new BuffaloZcl(Buffer.alloc(2));
            buffalo.write(BuffaloZclDataType.USE_DATA_TYPE, payload, {});
        }).toThrow(`Cannot write USE_DATA_TYPE without dataType option specified`);
    });

    it('Throws when read GDP_FRAME is missing payload.payloadSize option when payload.commandID is 0xA1', () => {
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(BuffaloZclDataType.GDP_FRAME, {payload: {commandID: 0xa1}});
        }).toThrow(`Cannot read GDP_FRAME with commandID=0xA1 without payloadSize options specified`);
    });

    it('Throws when read LIST_THERMO_TRANSITIONS is missing required payload options', () => {
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(BuffaloZclDataType.LIST_THERMO_TRANSITIONS, {});
        }).toThrow(`Cannot read LIST_THERMO_TRANSITIONS without required payload options specified`);
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(BuffaloZclDataType.LIST_THERMO_TRANSITIONS, {payload: {}});
        }).toThrow(`Cannot read LIST_THERMO_TRANSITIONS without required payload options specified`);
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(BuffaloZclDataType.LIST_THERMO_TRANSITIONS, {payload: {mode: 1}});
        }).toThrow(`Cannot read LIST_THERMO_TRANSITIONS without required payload options specified`);
        expect(() => {
            const buffalo = new BuffaloZcl(Buffer.alloc(1));
            buffalo.read(BuffaloZclDataType.LIST_THERMO_TRANSITIONS, {payload: {numoftrans: 1}});
        }).toThrow(`Cannot read LIST_THERMO_TRANSITIONS without required payload options specified`);
    });
});
