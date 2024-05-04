import * as Zcl from '../../../src/zspec/zcl';
import {Command, CustomClusters} from '../../../src/zspec/zcl/definition/tstype';

const CUSTOM_CLUSTERS: CustomClusters = {
    genBasic: {ID: Zcl.Clusters.genBasic.ID, commands: {}, commandsResponse: {}, attributes: {myCustomAttr: {ID: 65533, type: Zcl.DataType.UINT8}}},
    myCustomCluster: {ID: 65534, commands: {}, commandsResponse: {}, attributes: {myCustomAttr: {ID: 65533, type: Zcl.DataType.UINT8}}},
    myCustomClusterManuf: {ID: 65533, manufacturerCode: 65534, commands: {}, commandsResponse: {}, attributes: {myCustomAttr: {ID: 65533, type: Zcl.DataType.UINT8}}},
    manuSpecificBosch10NoManuf: {ID: Zcl.Clusters.manuSpecificBosch10.ID, commands: {}, commandsResponse: {}, attributes: {myCustomAttr: {ID: 65533, type: Zcl.DataType.UINT8}}}
};

describe('ZCL Utils', () => {
    it('Creates status error', () => {
        const zclError = new Zcl.StatusError(Zcl.Status.ABORT);
        
        expect(zclError).toBeInstanceOf(Zcl.StatusError);
        expect(zclError.code).toStrictEqual(Zcl.Status.ABORT);
        expect(zclError.message).toStrictEqual(`Status '${Zcl.Status[Zcl.Status.ABORT]}'`);
    });

    it('Gets data type class', () => {
        expect(Zcl.Utils.getDataTypeClass(Zcl.DataType.UINT16)).toStrictEqual(Zcl.DataTypeClass.ANALOG);
        expect(Zcl.Utils.getDataTypeClass(Zcl.DataType.DATA16)).toStrictEqual(Zcl.DataTypeClass.DISCRETE);
        expect(() => {
            Zcl.Utils.getDataTypeClass(Zcl.DataType.NO_DATA);
        }).toThrow();
    });

    it.each([
        [
            'by ID',
            {key: Zcl.Clusters.genBasic.ID, manufacturerCode: null, customClusters: {}},
            {cluster: Zcl.Clusters.genBasic, name: 'genBasic'},
        ],
        [
            'by name',
            {key: 'genAlarms', manufacturerCode: null, customClusters: {}},
            {cluster: Zcl.Clusters.genAlarms, name: 'genAlarms'},
        ],
        [
            'by ID with no manufacturer code',
            {key: Zcl.Clusters.genAlarms.ID, manufacturerCode: 123, customClusters: {}},
            {cluster: Zcl.Clusters.genAlarms, name: 'genAlarms'},
        ],
        [
            'by ID with non-matching manufacturer code',
            {key: Zcl.Clusters.sprutDevice.ID, manufacturerCode: 123, customClusters: {}},
            {cluster: Zcl.Clusters.sprutDevice, name: 'sprutDevice'},
        ],
        [
            'by ID with matching manufacturer code',
            {key: Zcl.Clusters.sprutDevice.ID, manufacturerCode: Zcl.Clusters.sprutDevice.manufacturerCode!, customClusters: {}},
            {cluster: Zcl.Clusters.sprutDevice, name: 'sprutDevice'},
        ],
        [
            'custom by ID',
            {key: CUSTOM_CLUSTERS.myCustomCluster.ID, manufacturerCode: null, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.myCustomCluster, name: 'myCustomCluster'},
        ],
        [
            'custom by name',
            {key: 'myCustomCluster', manufacturerCode: null, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.myCustomCluster, name: 'myCustomCluster'},
        ],
        [
            'custom by ID with no manufacturer code',
            {key: CUSTOM_CLUSTERS.myCustomCluster.ID, manufacturerCode: 123, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.myCustomCluster, name: 'myCustomCluster'},
        ],
        [
            'custom by ID with non-matching manufacturer code',
            {key: CUSTOM_CLUSTERS.myCustomClusterManuf.ID, manufacturerCode: 123, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.myCustomClusterManuf, name: 'myCustomClusterManuf'},
        ],
        [
            'custom by ID with matching manufacturer code',
            {
                key: CUSTOM_CLUSTERS.myCustomClusterManuf.ID, manufacturerCode: CUSTOM_CLUSTERS.myCustomClusterManuf.manufacturerCode!,
                customClusters: CUSTOM_CLUSTERS,
            },
            {cluster: CUSTOM_CLUSTERS.myCustomClusterManuf, name: 'myCustomClusterManuf'},
        ],
        [
            'custom by ID overriding same Zcl ID entirely',
            {key: CUSTOM_CLUSTERS.genBasic.ID, manufacturerCode: null, customClusters: CUSTOM_CLUSTERS},
            {cluster: CUSTOM_CLUSTERS.genBasic, name: 'genBasic'},
        ],
        [
            'by ID ignoring same custom ID if Zcl is better match with manufacture code',
            {
                key: CUSTOM_CLUSTERS.manuSpecificBosch10NoManuf.ID, manufacturerCode: Zcl.ManufacturerCode.ROBERT_BOSCH_GMBH,
                customClusters: CUSTOM_CLUSTERS
            },
            {cluster: Zcl.Clusters.manuSpecificBosch10, name: 'manuSpecificBosch10'},
        ],
    ])('Gets cluster %s', (_name, payload, expected) => {
        const cluster = Zcl.Utils.getCluster(payload.key, payload.manufacturerCode, payload.customClusters);

        expect(cluster.ID).toStrictEqual(expected.cluster.ID);
        expect(cluster.name).toStrictEqual(expected.name);

        for (const k in expected.cluster.attributes) {
            expect(cluster.attributes[k]).toBeDefined();
            expect(cluster.attributes[k].name).toStrictEqual(k);
        }

        expect(cluster.manufacturerCode).toStrictEqual(expected.cluster.manufacturerCode);
        expect(cluster.getAttribute).toBeInstanceOf(Function);
        expect(cluster.getCommand).toBeInstanceOf(Function);
        expect(cluster.getCommandResponse).toBeInstanceOf(Function);
        expect(cluster.hasAttribute).toBeInstanceOf(Function);
    });

    it('Creates empty cluster when getting by invalid ID', () => {
        const cluster = Zcl.Utils.getCluster(99999, null, {});
        expect(cluster.ID).toStrictEqual(99999);
        expect(cluster.name).toStrictEqual('99999');
        expect(cluster.manufacturerCode).toStrictEqual(null);
        expect(cluster.attributes).toStrictEqual({});
        expect(cluster.commands).toStrictEqual({});
        expect(cluster.commandsResponse).toStrictEqual({});
        expect(cluster.getAttribute).toBeInstanceOf(Function);
        expect(cluster.getCommand).toBeInstanceOf(Function);
        expect(cluster.getCommandResponse).toBeInstanceOf(Function);
        expect(cluster.hasAttribute).toBeInstanceOf(Function);
    });

    it('Throws when getting invalid cluster name', () => {
        expect(() => {
            Zcl.Utils.getCluster('invalid', null, {});
        }).toThrow();
    });

    it.each([
        [
            'by ID',
            {key: Zcl.Clusters.genBasic.attributes.zclVersion.ID, manufacturerCode: null, customClusters: {}},
            {cluster: Zcl.Clusters.genBasic, name: 'zclVersion'},
        ],
        [
            'by name',
            {key: 'alarmCount', manufacturerCode: null, customClusters: {}},
            {cluster: Zcl.Clusters.genAlarms, name: 'alarmCount'},
        ],
        [
            'by ID with no manufacturer code',
            {key: Zcl.Clusters.genAlarms.attributes.alarmCount.ID, manufacturerCode: 123, customClusters: {}},
            {cluster: Zcl.Clusters.genAlarms, name: 'alarmCount'},
        ],
        [
            'by ID with matching manufacturer code',
            {key: Zcl.Clusters.haDiagnostic.attributes.danfossSystemStatusCode.ID, manufacturerCode: Zcl.ManufacturerCode.DANFOSS_A_S, customClusters: {}},
            {cluster: Zcl.Clusters.haDiagnostic, name: 'danfossSystemStatusCode'},
        ],
        [
            'custom by ID',
            {key: CUSTOM_CLUSTERS.genBasic.attributes.myCustomAttr.ID, manufacturerCode: null, customClusters: CUSTOM_CLUSTERS},
            {cluster: Zcl.Clusters.genBasic, name: 'myCustomAttr'},
        ],
        [
            'custom by name',
            {key: 'myCustomAttr', manufacturerCode: null, customClusters: CUSTOM_CLUSTERS},
            {cluster: Zcl.Clusters.genBasic, name: 'myCustomAttr'},
        ],
    ])('Gets and checks cluster attribute %s', (_name, payload, expected) => {
        const cluster = Zcl.Utils.getCluster(expected.cluster.ID, payload.manufacturerCode, payload.customClusters);
        const attribute = cluster.getAttribute(payload.key);
        expect(cluster.hasAttribute(payload.key)).toBeTruthy();
        expect(attribute).toStrictEqual(cluster.attributes[expected.name]);
    });

    it('Throws when getting invalid attribute', () => {
        const cluster = Zcl.Utils.getCluster(Zcl.Clusters.genAlarms.ID, null, {});
        expect(() => {
            cluster.getAttribute('abcd');
        }).toThrow();
        expect(() => {
            cluster.getAttribute(99999);
        }).toThrow();
    });

    it('Throws when getting attribute with invalid manufacturer code', () => {
        const cluster = Zcl.Utils.getCluster(Zcl.Clusters.haDiagnostic.ID, 123, {});
        expect(() => {
            cluster.getAttribute(Zcl.Clusters.haDiagnostic.attributes.danfossSystemStatusCode.ID);
        }).toThrow();
    });

    it.each([
        [
            'by ID',
            {key: Zcl.Clusters.genBasic.commands.resetFactDefault.ID},
            {cluster: Zcl.Clusters.genBasic, name: 'resetFactDefault'},
        ],
        [
            'by name',
            {key: 'resetAll'},
            {cluster: Zcl.Clusters.genAlarms, name: 'resetAll'},
        ],
    ])('Gets cluster command %s', (_name, payload, expected) => {
        const cluster = Zcl.Utils.getCluster(expected.cluster.ID, null, {});
        const command = cluster.getCommand(payload.key);
        expect(command).toStrictEqual(cluster.commands[expected.name]);
    });

    it('Throws when getting invalid command', () => {
        const cluster = Zcl.Utils.getCluster(Zcl.Clusters.genAlarms.ID, null, {});
        expect(() => {
            cluster.getCommand('abcd');
        }).toThrow();
        expect(() => {
            cluster.getCommand(99999);
        }).toThrow();
    });

    it.each([
        [
            'by ID',
            {key: Zcl.Clusters.genIdentify.commandsResponse.identifyQueryRsp.ID},
            {cluster: Zcl.Clusters.genIdentify, name: 'identifyQueryRsp'},
        ],
        [
            'by name',
            {key: 'getEventLog'},
            {cluster: Zcl.Clusters.genAlarms, name: 'getEventLog'},
        ],
    ])('Gets cluster command response %s', (_name, payload, expected) => {
        const cluster = Zcl.Utils.getCluster(expected.cluster.ID, null, {});
        const commandResponse = cluster.getCommandResponse(payload.key);
        expect(commandResponse).toStrictEqual(cluster.commandsResponse[expected.name]);
    });

    it('Throws when getting invalid command response', () => {
        const cluster = Zcl.Utils.getCluster(Zcl.Clusters.genAlarms.ID, null, {});
        expect(() => {
            cluster.getCommandResponse('abcd');
        }).toThrow();
        expect(() => {
            cluster.getCommandResponse(99999);
        }).toThrow();
    });

    it.each([
        [
            'by ID',
            {key: Zcl.Foundation.writeUndiv.ID},
            {cluster: Zcl.Foundation.writeUndiv, name: 'writeUndiv'},
        ],
        [
            'by name',
            {key: 'read'},
            {cluster: Zcl.Foundation.read, name: 'read'},
        ],
    ])('Gets global command %s', (_name, payload, expected) => {
        let command: Command = {
            ID: expected.cluster.ID,
            name: expected.name,
            parameters: expected.cluster.parameters,
        };

        if (expected.cluster.response) {
            command.response = expected.cluster.response;
        }

        expect(Zcl.Utils.getGlobalCommand(payload.key)).toStrictEqual(command);
    });

    it('Throws when getting invalid global command', () => {
        expect(() => {
            Zcl.Utils.getGlobalCommand(99999);
        }).toThrow();
        expect(() => {
            Zcl.Utils.getGlobalCommand('abcd');
        }).toThrow();
    });

    it('Checks cluster name', () => {
        expect(Zcl.Utils.isClusterName('genBasic')).toBeTruthy();
        expect(Zcl.Utils.isClusterName('genAlarms')).toBeTruthy();
        expect(Zcl.Utils.isClusterName('invalid')).toBeFalsy();
    });
});
