import "regenerator-runtime/runtime";
import * as Zcl from '../src/zcl';
import {BuffaloZclDataType, DataType} from '../src/zcl/definition';
import BuffaloZcl from '../src/zcl/buffaloZcl';
import FrameType from "../src/zcl/definition/frameType";
import Direction from "../src/zcl/definition/direction";
import {StructuredIndicatorType} from "../src/zcl/tstype";

describe('Zcl', () => {

    it('Get cluster by name', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify');
        expect(cluster.ID).toBe(3);
        expect(cluster.name).toBe('genIdentify');
        expect(cluster.commands.identifyQuery.ID).toBe(1);
        expect(cluster.commands.identifyQuery.name).toBe('identifyQuery');
        expect(cluster.commandsResponse.identifyQueryRsp.ID).toBe(0);
        expect(cluster.commandsResponse.identifyQueryRsp.name).toBe('identifyQueryRsp');
    });

    it('Get cluster by ID', () => {
        const cluster1 = Zcl.Utils.getCluster(0);
        delete cluster1.getAttribute;
        delete cluster1.getCommand;
        delete cluster1.hasAttribute;
        delete cluster1.getCommandResponse;
        const cluster2 = Zcl.Utils.getCluster('genBasic');
        delete cluster2.getAttribute;
        delete cluster2.getCommand;
        delete cluster2.hasAttribute;
        delete cluster2.getCommandResponse;
        expect(cluster1).toStrictEqual(cluster2);
    });

    it('Get cluster attribute by ID', () => {
        const cluster = Zcl.Utils.getCluster(0);
        const attribute = cluster.getAttribute(1)
        expect(attribute).toStrictEqual({ID: 1, type: DataType.uint8, name: 'appVersion'});
    });

    it('Cluster has attribute', () => {
        const cluster = Zcl.Utils.getCluster(0);
        expect(cluster.hasAttribute('zclVersion')).toBeTruthy();
        expect(cluster.hasAttribute('NOTEXISTING')).toBeFalsy();
        expect(cluster.hasAttribute(0)).toBeTruthy();
        expect(cluster.hasAttribute(910293)).toBeFalsy();
    });

    it('Get specific command by name', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify');
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
        }).toThrowError("Global command with key 'nonexisting' does not exist")
    });

    it('Get cluster by name non-existing', () => {
        expect(() => {
            Zcl.Utils.getCluster('notExisting');
        }).toThrowError("Cluster with name 'notExisting' does not exist")
    });

    it('Get cluster by id non-existing', () => {
        expect(JSON.parse(JSON.stringify(Zcl.Utils.getCluster(0x190231)))).toStrictEqual({"ID":1638961,"attributes":{},"manufacturerCode":null,"name":"1638961","commands":{},"commandsResponse":{}});
    });

    it('Get specific command by ID', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify');
        const command = cluster.getCommand(2);
        expect(command).toStrictEqual(cluster.getCommand('ezmodeInvoke'));
    });

    it('Get specific command by name server to client', () => {
        const cluster = Zcl.Utils.getCluster('genIdentify');
        const command = cluster.getCommandResponse(0);
        expect(command.ID).toBe(0);
        expect(command.name).toBe('identifyQueryRsp');
    });

    it('Get specific command by name non existing', () => {
        expect(() => {
            const cluster = Zcl.Utils.getCluster('genIdentify');
            cluster.getCommandResponse('nonexisting');
        }).toThrowError("Cluster 'genIdentify' has no command response 'nonexisting'")
    });

    it('Get discrete or analog of unkown type', () => {
        expect(() => {
            Zcl.Utils.IsDataTypeAnalogOrDiscrete(99999);
        }).toThrowError("Don't know value type for 'undefined'")
    });

    it('ZclFrame from buffer parse payload with unknown frame type', () => {
        expect(() => {
            // @ts-ignore
            Zcl.ZclFrame.parsePayload({frameControl: {frameType: 9}}, null);
        }).toThrowError("Unsupported frameType '9'")
    });

    it('ZclFrame from buffer report', () => {
        const buffer = [0x18, 0x4a, 0x0a, 0x55, 0x00, 0x39, 0x00, 0x00, 0x00, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genAnalogInput").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 74,
        };

        const payload = [{
            attrData: 0,
            attrId: 85,
            dataType: 57,
        }];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
        expect(frame.isGlobal()).toBe(true);
        expect(frame.isSpecific()).toBe(false);
        expect(frame.isCluster("genAnalogInput")).toBe(true);
        expect(frame.isCommand('report')).toBe(true);
    });

    it('ZclFrame from buffer tradfriArrowSingle', () => {
        const buffer = [0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genScenes").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: false,
                frameType: 1,
                manufacturerSpecific: true,
            },
            manufacturerCode: 4476,
            transactionSequenceNumber: 29,
        };

        const payload = {value: 256, value2: 13};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
        expect(frame.getCommand().ID).toStrictEqual(7);
        expect(frame.getCommand().name).toStrictEqual('tradfriArrowSingle');
    });

    it('ZclFrame from buffer genGroups getMembership', () => {
        const buffer = [0x11, 0x7c, 0x02, 2, 10, 0, 20, 0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genGroups").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 2,
            frameControl: {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 124,
        };

        const payload = {groupcount: 2, grouplist: [10, 20]};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer genGroups getMembership', () => {
        const buffer = [0x19, 0x7c, 0x03, 0, 10, 0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genGroups").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 3,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 124,
        };

        const payload = {groupid: 10, status: 0};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer occupancy report', () => {
        const buffer = [24,169,10,0,0,24,1];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("msOccupancySensing").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 169,
        };

        const payload = [{ attrId: 0, dataType: 24, attrData: 1 }];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp - short', () => {
        const buffer = [0x08, 0x01, 0x07, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: 0}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp - long', () => {
        const buffer = [0x08, 0x01, 0x07, 0x00, 0x01, 0x34, 0x12, 0x01, 0x01, 0x35, 0x12];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: 0, direction:1, attrId: 0x1234}, {status: 1, direction:1, attrId: 0x1235}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp (hvacThermostat)', () => {
        const buffer = [0x18, 0x03, 0x07, 0x00, 0x00, 0x12, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("hvacThermostat").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 3,
        };

        const payload = [{status:0, direction: 0, attrId: 18}];

        expect(frame.Payload).toStrictEqual(payload);
        expect(frame.Header).toStrictEqual(header);
    });

    it('ZclFrame from buffer getWeeklyScheduleRsp (hvacThermostat)', () => {
        const bufferHeat = [9, 7, 0, 6, 64, 1, 104, 1, 252, 8, 58, 2, 152, 8, 208, 2, 102, 8, 72, 3, 102, 8, 222, 3, 252, 8, 100, 5, 52, 8];
        const frameHeat = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("hvacThermostat").ID, Buffer.from(bufferHeat));
        expect(frameHeat.Payload).toStrictEqual({numoftrans:6, dayofweek:64, mode:1, transitions: [{transitionTime:360,heatSetpoint:2300},{transitionTime:570,heatSetpoint:2200},{transitionTime:720,heatSetpoint:2150},{transitionTime:840,heatSetpoint:2150},{transitionTime:990,heatSetpoint:2300},{transitionTime:1380,heatSetpoint:2100}]});

        const bufferCool = [9, 7, 0, 6, 64, 2, 104, 1, 252, 8, 58, 2, 152, 8, 208, 2, 102, 8, 72, 3, 102, 8, 222, 3, 252, 8, 100, 5, 52, 8];
        const frameCool = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("hvacThermostat").ID, Buffer.from(bufferCool));
        expect(frameCool.Payload).toStrictEqual({numoftrans:6, dayofweek:64, mode:2, transitions: [{transitionTime:360,coolSetpoint:2300},{transitionTime:570,coolSetpoint:2200},{transitionTime:720,coolSetpoint:2150},{transitionTime:840,coolSetpoint:2150},{transitionTime:990,coolSetpoint:2300},{transitionTime:1380,coolSetpoint:2100}]});

        const bufferHeatAndCool = [9, 7, 0, 1, 64, 3, 104, 1, 252, 8, 58, 2];
        const frameHeatAndCool = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("hvacThermostat").ID, Buffer.from(bufferHeatAndCool));
        expect(frameHeatAndCool.Payload).toStrictEqual({numoftrans:1, dayofweek:64, mode:3, transitions: [{transitionTime:360,coolSetpoint:570, heatSetpoint: 2300}]});
    });

    it('ZclFrame to buffer setWeeklyScheduleRsp (hvacThermostat)', () => {
        const payloadHeat = {numoftrans:6, dayofweek:64, mode:1, transitions: [{transitionTime:360,heatSetpoint:23},{transitionTime:570,heatSetpoint:2200},{transitionTime:720,heatSetpoint:2150},{transitionTime:840,heatSetpoint:2150},{transitionTime:990,heatSetpoint:2300},{transitionTime:1380,heatSetpoint:2100}]};
        const frameHeat = Zcl.ZclFrame.create(FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, null, 8, 'setWeeklySchedule', 513, payloadHeat);
        expect(frameHeat.toBuffer()).toStrictEqual(Buffer.from([1,8,1,6,64,1,104,1,23,0,58,2,152,8,208,2,102,8,72,3,102,8,222,3,252,8,100,5,52,8]));

        const payloadCool = {numoftrans:6, dayofweek:64, mode:2, transitions: [{transitionTime:360,coolSetpoint:2300},{transitionTime:570,coolSetpoint:2200},{transitionTime:720,coolSetpoint:2150},{transitionTime:840,coolSetpoint:2150},{transitionTime:990,coolSetpoint:2300},{transitionTime:1380,coolSetpoint:2100}]};
        const frameCool = Zcl.ZclFrame.create(FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, null, 8, 'setWeeklySchedule', 513, payloadCool);
        expect(frameCool.toBuffer()).toStrictEqual(Buffer.from([1,8,1,6,64,2,104,1,252,8,58,2,152,8,208,2,102,8,72,3,102,8,222,3,252,8,100,5,52,8]));

        const payloadHeatAndCool = {numoftrans:6, dayofweek:64, mode:2, transitions: [{transitionTime:360,coolSetpoint:570, heatSetpoint: 2300}]};
        const frameHeatAndCool = Zcl.ZclFrame.create(FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, null, 8, 'setWeeklySchedule', 513, payloadHeatAndCool);
        expect(frameHeatAndCool.toBuffer()).toStrictEqual(Buffer.from([1,8,1,6,64,2,104,1,252,8,58,2]));
    });

    it('ZclFrame from buffer configReportRsp failed', () => {
        const buffer = [0x08, 0x01, 0x07, 0x02, 0x01, 0x01, 0x01];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: 2, direction: 1, attrId: 257}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer defaultRsp', () => {
        const buffer = [0x18, 0x04, 0x0b, 0x0c, 0x82];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 11,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 4,
        };

        const payload = {cmdId: 12, statusCode: 130};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer xiaomiStruct', () => {
        const buffer = [28,95,17,3,10,5,0,66,21,108,117,109,105,46,115,101,110,115,111,114,95,119,108,101,97,107,46,97,113,49,1,255,66,34,1,33,213,12,3,40,33,4,33,168,19,5,33,43,0,6,36,0,0,5,0,0,8,33,4,2,10,33,0,0,100,16,0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: true,
            },
            manufacturerCode: 4447,
            transactionSequenceNumber: 3,
        };

        const payload = [{"attrId":5,"dataType":66,"attrData":"lumi.sensor_wleak.aq1"},{"attrId":65281,"dataType":66,"attrData":{"1":3285,"3":33,"4":5032,"5":43,"6":[0,327680],"8":516,"10":0,"100":0}}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer struct', () => {
        const buffer = [28,52,18,194,10,2,255,76,6,0,16,1,33,206,11,33,168,67,36,1,0,0,0,0,33,48,2,32,86];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: true,
            },
            manufacturerCode: 4660,
            transactionSequenceNumber: 194,
        };

        const payload = [
            {
                "attrId":65282,
                "dataType":76,
                "numElms":6,
                "structElms":[
                    {"elmType":16,"elmVal":1},
                    {"elmType":33,"elmVal":3022},
                    {"elmType":33,"elmVal":17320},
                    {"elmType":36,"elmVal":[0,1]},
                    {"elmType":33,"elmVal":560},
                    {"elmType":32,"elmVal":86},
                ],
                "attrData":[
                    {"elmType":16,"elmVal":1},
                    {"elmType":33,"elmVal":3022},
                    {"elmType":33,"elmVal":17320},
                    {"elmType":36,"elmVal":[0,1]},
                    {"elmType":33,"elmVal":560},
                    {"elmType":32,"elmVal":86}
                ]
            }
        ];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer discoverRsp', () => {
        const buffer = [24,23,13,0,32,0,32,33,0,32,49,0,48,51,0,32,53,0,24];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 13,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 23,
        };

        const payload = {"discComplete":0,"attrInfos":[{"attrId":32,"dataType":32},{"attrId":33,"dataType":32},{"attrId":49,"dataType":48},{"attrId":51,"dataType":32},{"attrId":53,"dataType":24}]};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
        expect(frame.Cluster.name).toEqual('genPowerCfg');
        expect(frame.getCommand().name).toEqual('discoverRsp');
    });

    it('ZclFrame from buffer error on malformed', () => {
        const buffer = [0x08, 0x01];
        expect(() => {
            Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genPowerCfg").ID, Buffer.from(buffer));
        }).toThrowError("ZclFrame length is lower than minimal length");
    });

    it('ZclFrame from buffer readRsp failed', () => {
        const buffer = [8, 1, 1, 1, 0, 2];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: 2, attrId: 1}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp success', () => {
        const buffer = [8, 1, 1, 1, 0, 0, 32, 3];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.uint8, attrData: 3}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer GDP commission', () => {
        const buffer = [0x11, 0x00, 0x04, 0x00, 0x00, 0xfe, 0xf4, 0x46, 0x00, 0xf9, 0x00, 0x00, 0x00, 0xe0, 0x1b, 0x02, 0x81, 0xf2, 0xf1, 0xec, 0x92, 0xab, 0xff, 0x8f, 0x13, 0x63, 0xe1, 0x46, 0xbe, 0xb5, 0x18, 0xc9, 0x0c, 0xab, 0xa4, 0x46, 0xd4, 0xd5, 0xf9, 0x01, 0x00, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("greenPower").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 4,
            frameControl: {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 0,
        };

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
                securityKey: Buffer.from([0xf1,0xec,0x92,0xab,0xff,0x8f,0x13,0x63,0xe1,0x46,0xbe,0xb5,0x18,0xc9,0x0c,0xab]),
                keyMic: 3587458724,
                outgoingCounter: 505,
                applicationInfo: 0,
                numGdpCommands: 0,
                gpdCommandIdList: Buffer.alloc(0),
            },
        };

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer GDP scene 0', () => {
        const buffer = [0x11, 0x00, 0x00, 0xa0, 0x14, 0xfe, 0xf4, 0x46, 0x00, 0xe5, 0x04, 0x00, 0x00, 0x10, 0xff];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("greenPower").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 0,
            frameControl: {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 0,
        };

        const payload = {
            srcID: 4650238,
            commandFrame: {},
            commandID: 16,
            frameCounter: 1253,
            options: 5280,
            payloadSize: 255,
        };

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer GDP with extra data', () => {
        const buffer = [0x11, 0x00, 0x00, 0xa0, 0x14, 0xfe, 0xf4, 0x46, 0x00, 0xe5, 0x04, 0x00, 0x00, 0x10, 0xff, 0x01];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("greenPower").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 0,
            frameControl: {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 0,
        };

        const payload = {
            srcID: 4650238,
            commandFrame: {raw: Buffer.from([1])},
            commandID: 16,
            frameCounter: 1253,
            options: 5280,
            payloadSize: 255,
        };

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer GDP pairing', () => {
        const buffer = [0x19, 0x17, 0x01, 0x68, 0xe5, 0x00, 0xf8, 0x71, 0x71, 0x01, 0x47, 0x65, 0xa1, 0x1c, 0x00, 0x4b, 0x12, 0x00, 0x00, 0x00, 0x02, 0x1c, 0x12, 0x00, 0x00, 0x09, 0x3c, 0xed, 0x1d, 0xbf, 0x25, 0x63, 0xf9, 0x29, 0x5c, 0x0d, 0x3d, 0x9f, 0xc5, 0x76, 0xe1,0,0,0,0,0,0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("greenPower").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 23,
        };

        const payload = {
            options: 0x00e568,
            srcID: 0x017171f8,
            sinkIEEEAddr: "0x00124b001ca16547",
            sinkNwkAddr: 0,
            deviceID: 2,
            frameCounter: 4636,
            gpdKey: Buffer.from([0x09, 0x3c, 0xed, 0x1d, 0xbf, 0x25, 0x63, 0xf9, 0x29, 0x5c, 0x0d, 0x3d, 0x9f, 0xc5, 0x76, 0xe1])
        };

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp alias type', () => {
        const buffer = [8, 1, 1, 1, 0, 0, 8, 3];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.data8, attrData: 3}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp server to client', () => {
        const buffer = [8, 1, 6, 1, 1, 0, 10, 10];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{attrId: 1, direction: 1, timeout: 2570}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp client to server analog', () => {
        const buffer = [8, 1, 6, 0, 0, 1, 32, 1, 0, 10, 0, 20];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{attrId: 256, dataType: 32, direction: 0, maxRepIntval: 10, minRepIntval: 1, repChange: 20,}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer configReportRsp client to server analog', () => {
        const buffer = [8, 1, 6, 0, 0, 1, 8, 1, 0, 10, 0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 1,
        };

        const payload = [{attrId: 256, dataType: 8, direction: 0, maxRepIntval: 10, minRepIntval: 1}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame from buffer readRsp', () => {
        const buffer = [24,7,1,5,0,0,66,30,84,82,65,68,70,82,73,32,98,117,108,98,32,69,50,55,32,87,83,32,111,112,97,108,32,57,56,48,108,109,6,0,0,66,8,50,48,49,55,48,51,51,49,7,0,0,48,1,10,0,0,65,15,76,69,68,49,53,52,53,71,49,50,69,50,55,69,85];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
                reservedBits: 0,
                direction: 1,
                disableDefaultResponse: true,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 7,
        };

        const payload = [{"attrId":5,"status":0,"dataType":66,"attrData":"TRADFRI bulb E27 WS opal 980lm"},{"attrId":6,"status":0,"dataType":66,"attrData":"20170331"},{"attrId":7,"status":0,"dataType":48,"attrData":1},{"attrId":10,"status":0,"dataType":65,"attrData":Buffer.from([76,69,68,49,53,52,53,71,49,50,69,50,55,69,85])}];

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame with Ubisys (manufacturer specific) cluster create', () => {
        const payload = [{attrId: 0x0000, status: 0, attrData: 1, dataType: 32}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, 0x10f2, 8, 'readRsp', 0xfc00, payload
        );

        expect(frame.Cluster.name).toBe('manuSpecificUbisysDeviceSetup');
    });

    it('ZclFrame with Ubisys (manufacturer specific) cluster create with non Ubisys manufcode', () => {
        const payload = [{attrId: 0x0000, status: 0, attrData: 1, dataType: 32}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, 0x10f3, 8, 'readRsp', 0xfc00, payload
        );

        expect(frame.Cluster.name).toBe('manuSpecificPhilips');
    });

    it('ZclFrame with Ubisys (manufacturer specific) cluster fromBuffer', () => {
        const buffer = Buffer.from([0x04, 0xf2, 0x10, 0x08, 0x01, 0x00, 0x00, 0x00, 0x20, 0x01])
        const frame = Zcl.ZclFrame.fromBuffer(0xfc00, buffer);
        expect(frame.Cluster.name).toBe('manuSpecificUbisysDeviceSetup');
    });

    it('ZclFrame to buffer with reservered bits', () => {
        const expected = Buffer.from([224,8,12,0,0,240]);
        const payload = {startAttrId: 0, maxAttrIds: 240};
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, null, 8, 'discover', 0, payload, 7
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame from buffer with reservered bits', () => {
        const buffer = Buffer.from([224,8,12,0,0,240]);
        const frame = Zcl.ZclFrame.fromBuffer(0, Buffer.from(buffer));
        const header = {
            commandIdentifier: 12,
            frameControl: {
                reservedBits: 7,
                direction: 0,
                disableDefaultResponse: false,
                frameType: 0,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 8,
        };

        const payload = {startAttrId: 0, maxAttrIds: 240};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    it('ZclFrame to buffer discover', () => {
        const expected = Buffer.from([0,8,12,0,0,240]);
        const payload = {startAttrId: 0, maxAttrIds: 240};
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, false, null, 8, 'discover', 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer queryNextImageResponse with non zero status', () => {
        const expected = Buffer.from([9, 8, 2, 1]);
        const payload = {status: 1};
        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, null, 8, 'queryNextImageResponse', 25, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer queryNextImageResponse with zero status', () => {
        const expected = Buffer.from([9, 8, 2, 0, 1, 0, 3, 0, 5, 0, 0, 0, 6, 0, 0, 0]);
        const payload = {status: 0, manufacturerCode: 1, imageType: 3, fileVersion: 5, imageSize: 6};
        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, null, 8, 'queryNextImageResponse', 25, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer queryNextImageResponse with zero status and missing parameters', () => {
        const expected = Buffer.from([9, 8, 2, 1]);
        const payload = {status: 0};
        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, null, 8, 'queryNextImageResponse', 25, payload
        );

        let error;
        try {frame.toBuffer()} catch (e) {error = e};
        expect(error).toStrictEqual(new Error(`Parameter 'manufacturerCode' is missing`))
    });

    it('ZclFrame to buffer readRsp UTC', () => {
        const expected = Buffer.from([24,74,1,0,0,0,226,234,83,218,36]);
        const payload = [{attrId: 0, status: 0, attrData: 618288106, dataType: 226}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, null, 74, 'readRsp', 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer write Livolo malformed', () => {
        // Created as example for https://github.com/Koenkk/zigbee-herdsman/issues/127
        const expectedOn = Buffer.from([0x1c ,0xd2 ,0x1a ,0xe9 ,0x02 ,0x01 ,0x00 ,0x01 ,0x01 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00, 0x00]);
        const payloadOn = [{attrId: 1, attrData: Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]), dataType: 1}];
        const frameOn = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, 0x1ad2, 233, 'write', 0, payloadOn
        );
        expect(frameOn.toBuffer()).toStrictEqual(expectedOn);

        const expectedOff = Buffer.from([0x1c ,0xd2 ,0x1a ,0xe9 ,0x02 ,0x01 ,0x00 ,0x01 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00 ,0x00, 0x00]);
        const payloadOff = [{attrId: 1, attrData: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]), dataType: 1}];
        const frameOff = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, 0x1ad2, 233, 'write', 0, payloadOff
        );
        expect(frameOff.toBuffer()).toStrictEqual(expectedOff);
    });

    it('ZclFrame write request with string as bytes array', () => {
        const payload = [{attrId: 0x0401, attrData: [0x07, 0x00, 0x02, 0x01, 0x00, 0x00, 0x00, 0x14], dataType: 0x42}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, 0x115f, 15, 'write', 0, payload
        );

        const expected = [0x14, 0x5f, 0x11, 0x0f, 0x02, 0x01, 0x04, 0x42, 0x07, 0x00, 0x02, 0x01, 0x00, 0x00, 0x00, 0x14];
        expect(Buffer.from(expected)).toStrictEqual(frame.toBuffer());
    });

    it('ZclFrame write rsp', () => {
        const payload = [{status: 0x11, attrId: 0x22}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, 0x115f, 15, 'writeRsp', 0, payload
        );
        const buffer = frame.toBuffer();

        const expected = [0x14, 0x5f, 0x11, 0x0f, 0x04, 0x11, 0x22, 0x00];
        expect(Buffer.from(expected)).toStrictEqual(buffer);
    });

    //{ frameType: 0, manufSpec: 0, direction: 0, disDefaultRsp: 0 } 0 8 'discover' { startAttrId: 0, maxAttrIds: 240 }
    it('ZclFrame to buffer readRsp success', () => {
        const expected = Buffer.from([8, 1, 1, 1, 0, 0, 32, 3]);
        const payload = [{status: Zcl.Status.SUCCESS, attrId: 1, dataType: Zcl.DataType.uint8, attrData: 3}];
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, false, null, 1, 1, 0, payload,
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer defaultRsp success', () => {
        const expected = Buffer.from([0x18, 0x04, 0x0b, 0x0c, 0x82]);
        const payload = {cmdId: 12, statusCode: 130};
        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, null, 4, 11, 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured single element', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x01, 0x00, 0x01, 0x02, 0x00, 0x20, 0x03]);
        const payload = [{attrId: 0x0001, selector: {indexes: [2]}, dataType: Zcl.DataType.uint8, elementData: 3}];
        const frame = Zcl.ZclFrame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, null, 2, 0x0f, 0, payload);

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured multiple elements', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x02, 0x00, 0x02, 0x03, 0x00, 0x04, 0x00, 0x42, 0x03, 0x66, 0x6f, 0x6f, 0x05, 0x00, 0x03, 0x06, 0x00, 0x07, 0x00, 0x08, 0x00, 0x42, 0x03, 0x62, 0x61, 0x72]);
        const payload = [
            {attrId: 0x0002, selector: {indexes: [3, 4]}, dataType: Zcl.DataType.charStr, elementData: 'foo'},
            {attrId: 0x0005, selector: {indexes: [6, 7, 8]}, dataType: Zcl.DataType.charStr, elementData: 'bar'}
        ];
        const frame = Zcl.ZclFrame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, null, 2, 0x0f, 0, payload);

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured whole attribute', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x09, 0x00, 0x00, 0x48, 0x20, 0x03, 0x00, 0x0a, 0x0b, 0x0c]);
        const payload = [
            {attrId: 0x0009, selector: {}, dataType: Zcl.DataType.array, elementData: {elementType: 'uint8', elements: [10, 11, 12]}},
        ];
        const frame = Zcl.ZclFrame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, null, 2, 0x0f, 0, payload);

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured add element into set/bag', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x0d, 0x00, 0x10, 0x42, 0x03, 0x66, 0x6f, 0x6f]);
        const payload = [
            {attrId: 0x000d, selector: {indicatorType: StructuredIndicatorType.Add}, dataType: Zcl.DataType.charStr, elementData: 'foo'},
        ];
        const frame = Zcl.ZclFrame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, null, 2, 0x0f, 0, payload);

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured remove element from set/bag', () => {
        const expected = Buffer.from([0x10, 0x02, 0x0f, 0x0e, 0x00, 0x20, 0x42, 0x03, 0x62, 0x61, 0x72]);
        const payload = [
            {attrId: 0x000e, selector: {indicatorType: StructuredIndicatorType.Remove}, dataType: Zcl.DataType.charStr, elementData: 'bar'},
        ];
        const frame = Zcl.ZclFrame.create(FrameType.GLOBAL, Direction.CLIENT_TO_SERVER, true, null, 2, 0x0f, 0, payload);

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer writeStructured Livolo malformed', () => {
        const expected = Buffer.from([0x7c, 0xd2, 0x1a, 0xe9, 0x0f, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
        const payload = [
            {attrId: 0x0000, selector: null, elementData: [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]},
        ];
        const frame = Zcl.ZclFrame.create(FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, 0x1ad2, 0xe9, 0x0f, 0, payload, 3);

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame from buffer ssIasAce arm command', () => {
        const buffer = [1,87,0,0,6,49,50,51,52,53,54,0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.Utils.getCluster("ssIasAce").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 0,
            frameControl: {
                reservedBits: 0,
                direction: 0,
                disableDefaultResponse: false,
                frameType: 1,
                manufacturerSpecific: false,
            },
            manufacturerCode: null,
            transactionSequenceNumber: 87,
        };

        const payload = {
            armmode: 0,
            code: '123456',
            zoneid: 0,
        };

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
        expect(frame.isGlobal()).toBe(false);
        expect(frame.isSpecific()).toBe(true);
        expect(frame.isCluster("ssIasAce")).toBe(true);
        expect(frame.isCommand('arm')).toBe(true);
    });

    it('ZclFrame to buffer discoverRsp', () => {
        const expected = Buffer.from([24,23,13,0,32,0,32,33,0,32,49,0,48,51,0,32,53,0,24]);
        const payload = {"discComplete":0,"attrInfos":[{"attrId":32,"dataType":32},{"attrId":33,"dataType":32},{"attrId":49,"dataType":48},{"attrId":51,"dataType":32},{"attrId":53,"dataType":24}]};

        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, true, null, 23, 13, 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer tradfriArrowSingle', () => {
        const expected = Buffer.from([0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00]);
        const payload = {value: 256, value2: 13};

        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, 4476, 29, 7, 5, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer readRsp failed', () => {
        const expected = Buffer.from([8, 1, 1, 1, 0, 2]);
        const payload = [{status: 2, attrId: 1}];

        const frame = Zcl.ZclFrame.create(
            FrameType.GLOBAL, Direction.SERVER_TO_CLIENT, false, null, 1, 1, 0, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer offWithEffect', () => {
        const expected = Buffer.from([0x1, 1, 64, 1, 0]);
        const payload = {effectid: 1, effectvariant: 0};

        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.CLIENT_TO_SERVER, false, null, 1, 64, 6, payload
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer offWithEffect', () => {
        const expected = Buffer.from([9, 9, 0, 1]);

        const frame = Zcl.ZclFrame.create(
            FrameType.SPECIFIC, Direction.SERVER_TO_CLIENT, false, null, 9, 'restartDeviceRsp', 21, {status: 1}
        );

        expect(frame.toBuffer()).toStrictEqual(expected);
    });

    it('ZclFrame to buffer invalid frametype', () => {
        expect(() => {
            Zcl.ZclFrame.create(
                3, Direction.CLIENT_TO_SERVER, false, null, 1, 64, 6, {},
            ).toBuffer();
        }).toThrowError("Frametype '3' not valid");
    });

    it('BuffaloZcl read array', () => {
        const buffer = Buffer.from([32, 3, 0, 1, 2, 3]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.array], {});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([1, 2, 3]);
    });

    it('BuffaloZcl read struct', () => {
        const buffer = Buffer.from([0, 2, 0, 32, 8, 33, 4, 0]);
        const buffalo = new BuffaloZcl(buffer, 1);
        const value = buffalo.read(DataType[DataType.struct], {});
        expect(buffalo.getPosition()).toBe(8);
        expect(value).toStrictEqual([{"elmType": 32, "elmVal": 8}, {"elmType": 33, "elmVal": 4}]);
    });

    it('BuffaloZcl read longCharStr', () => {
        const buffer = Buffer.from([5, 0, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.longCharStr], {});
        expect(buffalo.getPosition()).toBe(7);
        expect(value).toStrictEqual('hello');
    });

    it('BuffaloZcl read extensionFieldSets', () => {
        const buffer = Buffer.from([0, 3, 8, 1, 0, 2, 0, 3, 0, 4, 5]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType[BuffaloZclDataType.EXTENSION_FIELD_SETS], {});
        expect(buffalo.getPosition()).toBe(11);
        expect(value).toStrictEqual([{clstId: 768, len: 8, extField: [1, 2, 3, 4, 5]}]);
    });

    it('BuffaloZcl read list zoneinfo', () => {
        const buffer = Buffer.from([1, 5, 0, 2, 6, 0]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType[BuffaloZclDataType.LIST_ZONEINFO], {length: 2});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([{zoneID: 1, zoneStatus: 5}, {zoneID: 2, zoneStatus: 6}]);
    });

    it('BuffaloZcl read uint48', () => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.uint48], {});
        expect(buffalo.getPosition()).toBe(6);
        expect(value).toStrictEqual([1798, 84149505]);
    });

    it('BuffaloZcl read uint56', () => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7, 7]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.uint56], {});
        expect(buffalo.getPosition()).toBe(7);
        expect(value).toStrictEqual([7, 1798, 84149505]);
    });

    it('BuffaloZcl read uint64', () => {
        const buffer = Buffer.from([1, 5, 4, 5, 6, 7, 7, 9]);
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(DataType[DataType.uint64], {});
        expect(buffalo.getPosition()).toBe(8);
        expect(value).toStrictEqual("0x0907070605040501");
    });

    it.each([
        [
            'no data point',
            Buffer.from([]),
            [],
        ],
        [
            'single data point',
            Buffer.from([1, 4, 0, 1, 1]),
            [
                {"dp":1, "datatype":4, "data": Buffer.from([1])},
            ],
        ],
        [
            'two data points',
            Buffer.from([1, 4, 0, 1, 1, 4, 2, 0, 4, 0, 0, 0, 90]),
            [
                {"dp":1, "datatype":4, "data": Buffer.from([1])},
                {"dp":4, "datatype":2, "data": Buffer.from([0, 0, 0, 90])}
            ],
        ],
        [
            'incomplete data point is ignored',
            Buffer.from([1, 4, 0, 1, 1, 4]),
            [
                {"dp":1, "datatype":4, "data": Buffer.from([1])},
            ],
        ],
        [
            'incomplete data buffer',
            Buffer.from([1, 4, 0, 1, 1, 4, 2, 0, 4, 0, 0, 0]),
            [
                {"dp":1, "datatype":4, "data": Buffer.from([1])},
                {"dp":4, "datatype":2, "data": Buffer.from([0, 0, 0])}
            ],
        ],
    ])
    ('BuffaloZcl read readListTuyaDataPointValues %s', (_name, buffer, payload) => {
        const buffalo = new BuffaloZcl(buffer);
        const value = buffalo.read(BuffaloZclDataType[BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES], {});
        expect(buffalo.isMore()).not.toBeTruthy();
        expect(value).toStrictEqual(payload);
    });

    it('BuffaloZcl write charStr', () => {
        const payload = 'hello';
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([5, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.charStr], payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write longCharStr', () => {
        const payload = 'hello';
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([5, 0, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType[DataType.longCharStr], payload, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write octetStr', () => {
        const payload = [1,2,4];
        const buffer = Buffer.alloc(5);
        const expected = Buffer.from([3, 1, 2, 4, 0]);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType[DataType.octetStr], payload, {});
        expect(buffalo.getPosition()).toBe(4);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write extensionFieldSets', () => {
        const payload = [{clstId: 768, len: 8, extField: [1, 2, 3, 4, 5]}];
        const buffer = Buffer.alloc(12);
        const expected = Buffer.from([0, 3, 8, 1, 0, 2, 0, 3, 0, 4, 5, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType[BuffaloZclDataType.EXTENSION_FIELD_SETS], payload, {});
        expect(buffalo.getPosition()).toBe(11);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write zoneinfo', () => {
        const payload = [{zoneID: 1, zoneStatus: 5}, {zoneID: 2, zoneStatus: 6}];
        const buffer = Buffer.alloc(6);
        const expected = Buffer.from([1, 5, 0, 2, 6, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(BuffaloZclDataType[BuffaloZclDataType.LIST_ZONEINFO], payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write uint40', () => {
        const payload = [30, 40];
        const buffer = Buffer.alloc(5);
        const expected = Buffer.from([40, 0, 0, 0, 30]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.uint40], payload, {});
        expect(buffalo.getPosition()).toBe(5);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write uint48', () => {
        const payload = [1798, 84149505];
        const buffer = Buffer.alloc(6);
        const expected = Buffer.from([1, 5, 4, 5, 6, 7]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.uint48], payload, {});
        expect(buffalo.getPosition()).toBe(6);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write uint56', () => {
        const payload = [7, 1798, 84149505];
        const buffer = Buffer.alloc(7);
        const expected = Buffer.from([6, 7, 0, 0, 7, 0, 0]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.uint56], payload, {});
        expect(buffalo.getPosition()).toBe(7);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write uint64', () => {
        const payload = "0x0907070605040501";
        const buffer = Buffer.alloc(8);
        const expected = Buffer.from([1, 5, 4, 5, 6, 7, 7, 9]);
        const buffalo = new BuffaloZcl(buffer);
        buffalo.write(DataType[DataType.uint64], payload, {});
        expect(buffalo.getPosition()).toBe(8);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write array element type string', () => {
        const payload = {elementType: 'octetStr', elements: [[0,13,1,6,0,2], [1,13,2,6,0,2], [2,13,3,6,0,2], [3,13,4,6,0,2]]};
        const expected = Buffer.from([0x41, 0x04, 0x00, 6, 0, 13, 1, 6, 0, 2, 6, 1, 13, 2, 6, 0, 2, 6, 2, 13, 3, 6, 0, 2, 6, 3, 13, 4, 6, 0, 2]);
        const buffer = Buffer.alloc(expected.length);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType[DataType.array], payload, {});
        expect(buffalo.getPosition()).toBe(expected.length);
        expect(buffer).toStrictEqual(expected);
    });

    it('BuffaloZcl write array element type numeric', () => {
        const payload = {elementType: 0x08, elements: [0, 0, 0, 0]};
        const expected = Buffer.from([0x08, 0x04, 0x00, 0, 0, 0, 0]);
        const buffer = Buffer.alloc(expected.length);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(DataType[DataType.array], payload, {});
        expect(buffalo.getPosition()).toBe(expected.length);
        expect(buffer).toStrictEqual(expected);
    });

    it.each([
        [
            'no data point',
            [],
            Buffer.from([]),
        ],
        [
            'single data point',
            [
                {"dp":1, "datatype":4, "data": Buffer.from([1])},
            ],
            Buffer.from([1, 4, 0, 1, 1]),
        ],
        [
            'two data points',
            [
                {"dp":1, "datatype":4, "data": Buffer.from([1])},
                {"dp":4, "datatype":2, "data": Buffer.from([0, 0, 0, 90])}
            ],
            Buffer.from([1, 4, 0, 1, 1, 4, 2, 0, 4, 0, 0, 0, 90]),
        ],
    ])
    ('BuffaloZcl writeListTuyaDataPointValues %s', (_name, payload, expected) => {
        const buffer = Buffer.alloc(expected.length);
        const buffalo = new BuffaloZcl(buffer);
        const result = buffalo.write(BuffaloZclDataType[BuffaloZclDataType.LIST_TUYA_DATAPOINT_VALUES], payload, {});
        expect(buffalo.getPosition()).toBe(expected.length);
        expect(buffer).toStrictEqual(expected);
    });

    it('Zcl utils get cluster without manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00);
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificPhilips');
    });

    it('Zcl utils get cluster manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00, 0x10f2);
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificUbisysDeviceSetup');
    });

    it('Zcl utils get cluster manufacturerCode wrong', () => {
        const cluster = Zcl.Utils.getCluster(0xfc00, 123);
        expect(cluster.ID).toBe(0xfc00);
        expect(cluster.name).toBe('manuSpecificPhilips');
    });

    it('Zcl utils get cluster attributes manufacturerCode', () => {
        const cluster = Zcl.Utils.getCluster('closuresWindowCovering', 0x10f2);
        const attribute = cluster.getAttribute(0x1000);
        expect(attribute).toStrictEqual({"ID": 4096, "manufacturerCode": 4338, "name": "ubisysTurnaroundGuardTime", "type": 32});
    });

    it('Zcl utils get cluster attributes manufacturerCode wrong', () => {
        const cluster = Zcl.Utils.getCluster('closuresWindowCovering', 123);
        expect(() => cluster.getAttribute(0x1000))
            .toThrowError("Cluster 'closuresWindowCovering' has no attribute '4096'");
    });

    it('Zcl utils get command', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff');
        const command = cluster.getCommand(0);
        expect(command.name).toEqual('off');
        expect(cluster.getCommand('off')).toEqual(command);
    });

    it('Zcl utils get attribute', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff');
        const command = cluster.getAttribute(16385);
        expect(command.name).toEqual('onTime');
        expect(cluster.getAttribute('onTime')).toEqual(command);
    });

    it('Zcl utils get attribute non-existing', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff');
        expect(() => cluster.getAttribute('notExisting'))
            .toThrowError("Cluster 'genOnOff' has no attribute 'notExisting'");
    });

    it('Zcl utils get command non-existing', () => {
        const cluster = Zcl.Utils.getCluster('genOnOff');
        expect(() => cluster.getCommand('notExisting'))
            .toThrowError("Cluster 'genOnOff' has no command 'notExisting'");
    });
});
