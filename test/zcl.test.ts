import * as Zcl from '../src/zcl';
import {Utils} from '../src/zcl/definition';

describe('Zcl', () => {

    beforeEach(() => {
    });

    it('Get cluster by name', () => {
        const cluster = Zcl.getClusterByName('genPowerCfg');
        expect(cluster.ID).toBe(1);
    });

    it('Get cluster by name non-existing', () => {
        expect(() => {
            Zcl.getClusterByName('notExisting');
        }).toThrowError("Cluster with name 'notExisting' does not exist")
    });

    it('Get discrete or analog of unkown type', () => {
        expect(() => {
            Utils.IsDataTypeAnalogOrDiscrete(99999);
        }).toThrowError("Don't know value type for 'undefined'")
    });

    it('ZclFrame parse payload with unknown frame type', () => {
        expect(() => {
            // @ts-ignore
            Zcl.ZclFrame.parsePayload({frameControl: {frameType: 9}}, null);
        }).toThrowError("Unsupported frameType '9'")
    });

    it('Get cluster by ID', () => {
        const cluster = Zcl.getClusterByID(1);
        expect(cluster.ID).toBe(1);
    });

    it('Get cluster by ID non-existing', () => {
        expect(() => {
            Zcl.getClusterByID(99999);
        }).toThrowError("Cluster with ID '99999' does not exist")
    });

    it('Get cluster legacy by number', () => {
        const cluster = Zcl.getClusterLegacy(1);
        expect(cluster).toStrictEqual({key: 'genPowerCfg', value: 1});
    });

    it('Get cluster legacy by string', () => {
        const cluster = Zcl.getClusterLegacy('genPowerCfg');
        expect(cluster).toStrictEqual({key: 'genPowerCfg', value: 1});
    });

    it('Get cluster legacy by array fails', () => {
        expect(() => {
            // @ts-ignore
            Zcl.getClusterLegacy({ID: 1});
        }).toThrowError("Get cluster with type 'object' is not supported");
    });

    it('ZclFrame report', () => {
        const buffer = [0x18, 0x4a, 0x0a, 0x55, 0x00, 0x39, 0x00, 0x00, 0x00, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genAnalogInput").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
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
    });

    it('ZclFrame tradfriArrowSingle', () => {
        const buffer = [0x05, 0x7c, 0x11, 0x1d, 0x07, 0x00, 0x01, 0x0d, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genScenes").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
                direction: 0,
                disableDefaultResponse: false,
                frameType: 1,
                manufacturerSpecific: true,
            },
            manufacturerCode: 4476,
            transactionSequenceNumber: 29,
        };

        const payload = {value: 256};

        expect(frame.Header).toStrictEqual(header);
        expect(frame.Payload).toStrictEqual(payload);
    });

    // it('ZclFrame tradfriArrowSingle', () => {
    //     const buffer = [0x05, 0x7c, 0x02, 2, 10, 0, 20, 0];
    //     const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genGroups").ID, Buffer.from(buffer));
    //     const header = {
    //         commandIdentifier: 2,
    //         frameControl: {
    //             direction: 0,
    //             disableDefaultResponse: false,
    //             frameType: 1,
    //             manufacturerSpecific: true,
    //         },
    //         manufacturerCode: 4476,
    //         transactionSequenceNumber: 29,
    //     };

    //     const payload = {value: 256};

    //     expect(frame.Header).toStrictEqual(header);
    //     expect(frame.Payload).toStrictEqual(payload);
    // });

    it('ZclFrame occupancy report', () => {
        const buffer = [24,169,10,0,0,24,1];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("msOccupancySensing").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
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

    it('ZclFrame configReportRsp', () => {
        const buffer = [0x08, 0x01, 0x07, 0x00];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
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

    it('ZclFrame configReportRsp failed', () => {
        const buffer = [0x08, 0x01, 0x07, 0x02, 0x01, 0x01, 0x01];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 7,
            frameControl: {
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

    it('ZclFrame defaultRsp', () => {
        const buffer = [0x18, 0x04, 0x0b, 0x0c, 0x82];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 11,
            frameControl: {
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

    it('ZclFrame xiaomiStruct', () => {
        const buffer = [28,95,17,3,10,5,0,66,21,108,117,109,105,46,115,101,110,115,111,114,95,119,108,101,97,107,46,97,113,49,1,255,66,34,1,33,213,12,3,40,33,4,33,168,19,5,33,43,0,6,36,0,0,5,0,0,8,33,4,2,10,33,0,0,100,16,0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 10,
            frameControl: {
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

    it('ZclFrame discoverRsp', () => {
        const buffer = [24,23,13,0,32,0,32,33,0,32,49,0,48,51,0,32,53,0,24];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genPowerCfg").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 13,
            frameControl: {
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
    });

    it('ZclFrame error on malformed', () => {
        const buffer = [0x08, 0x01];
        expect(() => {
            Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genPowerCfg").ID, Buffer.from(buffer));
        }).toThrowError("ZclFrame length is lower than minimal length");
    });

    it('ZclFrame readRsp failed', () => {
        const buffer = [8, 1, 1, 1, 0, 2];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
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

    it('ZclFrame readRsp success', () => {
        const buffer = [8, 1, 1, 1, 0, 0, 32, 3];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 1,
            frameControl: {
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

    it('ZclFrame configReportRsp server to client', () => {
        const buffer = [8, 1, 6, 1, 1, 0, 10, 10];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
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

    it('ZclFrame configReportRsp client to server analog', () => {
        const buffer = [8, 1, 6, 0, 0, 1, 32, 1, 0, 10, 0, 20];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
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

    it('ZclFrame configReportRsp client to server analog', () => {
        const buffer = [8, 1, 6, 0, 0, 1, 8, 1, 0, 10, 0];
        const frame = Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genBasic").ID, Buffer.from(buffer));
        const header = {
            commandIdentifier: 6,
            frameControl: {
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
});