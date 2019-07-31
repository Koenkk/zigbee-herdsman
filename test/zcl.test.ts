import * as ZCL from '../src/zcl';
//const zclId = require('../src/zcl-id');

describe('ZCL', () => {

    beforeEach(() => {
    });

    it('Get cluster by name', () => {
        const cluster = ZCL.getClusterByName('genPowerCfg');
        expect(cluster.ID).toBe(1);
    });

    it('Get cluster by name non-existing', () => {
        expect(() => {
            ZCL.getClusterByName('notExisting');
        }).toThrowError("Cluster with name 'notExisting' does not exist")
    });

    it('Get cluster by ID', () => {
        const cluster = ZCL.getClusterByID(1);
        expect(cluster.ID).toBe(1);
    });

    it('Get cluster by ID non-existing', () => {
        expect(() => {
            ZCL.getClusterByID(99999);
        }).toThrowError("Cluster with ID '99999' does not exist")
    });

    it('Get cluster legacy by number', () => {
        const cluster = ZCL.getClusterLegacy(1);
        expect(cluster).toStrictEqual({key: 'genPowerCfg', value: 1});
    });

    it('Get cluster legacy by string', () => {
        const cluster = ZCL.getClusterLegacy('genPowerCfg');
        expect(cluster).toStrictEqual({key: 'genPowerCfg', value: 1});
    });

    it('Get cluster legacy by array fails', () => {
        expect(() => {
            // @ts-ignore
            ZCL.getClusterLegacy({ID: 1});
        }).toThrowError("Get cluster with type 'object' is not supported");
    });

    //it('LEGACY', () => {
    //     expect(zclId.status('unsupAttribute').value).toBe(ZCL.Status.UNSUP_ATTRIBUTE);
    //     expect(zclId.status(0).key).toBe(ZCL.Status[ZCL.Status.SUCCESS].toLocaleLowerCase());

            // expect(zclId.cluster('manuSpecificCluster')).toStrictEqual(ZCL.getClusterLegacy('manuSpecificCluster'));
            // expect(zclId.cluster('64768')).toStrictEqual(ZCL.getClusterLegacy('64768'));


    //     expect(zclId.cluster('genBasic')).toStrictEqual(ZCL.getClusterLegacy('genBasic'));
    //     expect(zclId.cluster(0)).toStrictEqual(ZCL.getClusterLegacy(0));

    //     expect(zclId.attr(0, 0)).toStrictEqual(ZCL.getAttributeLegacy(0, 0));
    //     expect(zclId.attr('genBasic', 'modelId')).toStrictEqual(ZCL.getAttributeLegacy('genBasic', 'modelId'));
    //     expect(zclId.attr('genBasic', 5)).toStrictEqual(ZCL.getAttributeLegacy(0, 'modelId'));

    //     expect(zclId.attrType(0, 0)).toStrictEqual(ZCL.getAttributeTypeLegacy(0, 0));
    //     expect(zclId.attrType('genBasic', 'modelId')).toStrictEqual(ZCL.getAttributeTypeLegacy('genBasic', 'modelId'));
    //     expect(zclId.attrType('genBasic', 5)).toStrictEqual(ZCL.getAttributeTypeLegacy(0, 'modelId'));

    //     expect(zclId.foundation('report').value).toBe(ZCL.Foundation.report.ID);

    //     expect(zclId.foundation(1)).toStrictEqual(ZCL.getFoundationLegacy('readRsp'))
    //     expect(zclId.foundation('readRsp')).toStrictEqual(ZCL.getFoundationLegacy(1))

    //     expect(zclId.functional('genIdentify', 1)).toStrictEqual(ZCL.getFunctionalLegacy(3, 'identifyQuery'));
    //     expect(zclId.functional(3, 'identifyQuery')).toStrictEqual(ZCL.getFunctionalLegacy('genIdentify', 1));

    //     expect(zclId.getCmdRsp('genIdentify', 0)).toStrictEqual(ZCL.getCommandResponseLegacy(3, 'identifyQueryRsp'));
    //     expect(zclId.getCmdRsp(3, 'identifyQueryRsp')).toStrictEqual(ZCL.getCommandResponseLegacy('genIdentify', 0));

    //     expect(zclId.dataType(32)).toStrictEqual(ZCL.getDataTypeLegacy('uint8'));
    //     expect(zclId.dataType('uint8')).toStrictEqual(ZCL.getDataTypeLegacy(32));
    //})
});