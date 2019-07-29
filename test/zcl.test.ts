import * as Zcl from '../src/zcl';

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

    it('ZclFrame error on malformed', () => {
        const buffer = [0x08, 0x01];
        expect(() => {
            Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genPowerCfg").ID, Buffer.from(buffer));
        }).toThrowError("ZclFrame length is lower than minimal length");
    });

    it('ZclFrame error on manufacturer specific global command', () => {
        const buffer = [0x1C, 0x4a, 0x0a, 0x55, 0x00, 0x39, 0x00, 0x00, 0x00, 0x00];
        expect(() => {
            Zcl.ZclFrame.fromBuffer(Zcl.getClusterByName("genPowerCfg").ID, Buffer.from(buffer));
        }).toThrowError("Global commands are not supported for manufacturer specific commands");
    });

    //it('LEGACY', () => {
    //     expect(zclId.status('unsupAttribute').value).toBe(ZCL.Status.UNSUP_ATTRIBUTE);
    //     expect(zclId.status(0).key).toBe(ZCL.Status[ZCL.Status.SUCCESS].toLocaleLowerCase());

            // expect(zclId.cluster('manuSpecificCluster')).toStrictEqual(ZCL.getClusterLegacy('manuSpecificCluster'));
            // expect(zclId.cluster('64768')).toStrictEqual(ZCL.getClusterLegacy('64768'));


    //     expect(zclId.cluster('genBasic')).toStrictEqual(ZCL.getClusterLegacy('genBasic'));
    //     expect(zclId.cluster(0)).toStrictEqual(ZCL.getClusterLegacy(0));
    // it('LEGACY', () => {
    //     expect(zclId.status('unsupAttribute').value).toBe(Zcl.Status.UNSUP_ATTRIBUTE);
    //     expect(zclId.status(0).key).toBe(Zcl.Status[Zcl.Status.SUCCESS].toLocaleLowerCase());

    //     expect(zclId.cluster('genBasic')).toStrictEqual(Zcl.getClusterLegacy('genBasic'));
    //     expect(zclId.cluster(0)).toStrictEqual(Zcl.getClusterLegacy(0));

    //     expect(zclId.attr(0, 0)).toStrictEqual(Zcl.getAttributeLegacy(0, 0));
    //     expect(zclId.attr('genBasic', 'modelId')).toStrictEqual(Zcl.getAttributeLegacy('genBasic', 'modelId'));
    //     expect(zclId.attr('genBasic', 5)).toStrictEqual(Zcl.getAttributeLegacy(0, 'modelId'));

    //     expect(zclId.attrType(0, 0)).toStrictEqual(Zcl.getAttributeTypeLegacy(0, 0));
    //     expect(zclId.attrType('genBasic', 'modelId')).toStrictEqual(Zcl.getAttributeTypeLegacy('genBasic', 'modelId'));
    //     expect(zclId.attrType('genBasic', 5)).toStrictEqual(Zcl.getAttributeTypeLegacy(0, 'modelId'));

    //     expect(zclId.foundation('report').value).toBe(Zcl.Foundation.report.ID);

    //     expect(zclId.foundation(1)).toStrictEqual(Zcl.getFoundationLegacy('readRsp'))
    //     expect(zclId.foundation('readRsp')).toStrictEqual(Zcl.getFoundationLegacy(1))

    //     expect(zclId.functional('genIdentify', 1)).toStrictEqual(Zcl.getFunctionalLegacy(3, 'identifyQuery'));
    //     expect(zclId.functional(3, 'identifyQuery')).toStrictEqual(Zcl.getFunctionalLegacy('genIdentify', 1));

    //     expect(zclId.getCmdRsp('genIdentify', 0)).toStrictEqual(Zcl.getCommandResponseLegacy(3, 'identifyQueryRsp'));
    //     expect(zclId.getCmdRsp(3, 'identifyQueryRsp')).toStrictEqual(Zcl.getCommandResponseLegacy('genIdentify', 0));

    //     expect(zclId.dataType(32)).toStrictEqual(ZCL.getDataTypeLegacy('uint8'));
    //     expect(zclId.dataType('uint8')).toStrictEqual(ZCL.getDataTypeLegacy(32));
    //})
    //     expect(zclId.dataType(32)).toStrictEqual(Zcl.getDataTypeLegacy('uint8'));
    //     expect(zclId.dataType('uint8')).toStrictEqual(Zcl.getDataTypeLegacy(32));
    // })
});