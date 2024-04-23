import {DataType, Clusters, Foundation} from './definition';
import {ClusterDefinition, ClusterName, CustomClusters} from './definition/tstype';
import * as TsType from './tstype';

const DataTypeValueType = {
    discrete: [
        DataType.data8, DataType.data16, DataType.data24, DataType.data32, DataType.data40,
        DataType.data48, DataType.data56, DataType.data64, DataType.boolean,
        DataType.bitmap8, DataType.bitmap16, DataType.bitmap24, DataType.bitmap32, DataType.bitmap40,
        DataType.bitmap48, DataType.bitmap56, DataType.bitmap64, DataType.enum8, DataType.enum16,
        DataType.octetStr, DataType.charStr, DataType.longOctetStr, DataType.longCharStr, DataType.array,
        DataType.struct, DataType.set, DataType.bag, DataType.clusterId, DataType.attrId, DataType.bacOid,
        DataType.ieeeAddr, DataType.secKey,
    ],
    analog:[
        DataType.uint8, DataType.uint16, DataType.uint24, DataType.uint32, DataType.uint40,
        DataType.uint48, DataType.uint56,
        DataType.int8, DataType.int16, DataType.int24, DataType.int32, DataType.int40,
        DataType.int48, DataType.int56, DataType.semiPrec, DataType.singlePrec, DataType.doublePrec,
        DataType.tod, DataType.date, DataType.utc,
    ],
};

function IsDataTypeAnalogOrDiscrete(dataType: DataType): 'ANALOG' | 'DISCRETE' {
    if (DataTypeValueType.discrete.includes(dataType)) {
        return 'DISCRETE';
    } else if (DataTypeValueType.analog.includes(dataType)) {
        return 'ANALOG';
    } else {
        throw new Error(`Don't know value type for '${DataType[dataType]}'`);
    }
}

function getClusterDefinition(
    key: string | number,
    manufacturerCode: number | null,
    customClusters: CustomClusters,
): {name: string, cluster: ClusterDefinition} {
    let name: string;

    const clusters: CustomClusters = {
        ...customClusters, // Custom clusters have a higher priority than Zcl clusters (custom cluster has a DIFFERENT name than Zcl clusters)
        ...Clusters,
        ...customClusters, // Custom clusters should override Zcl clusters (custom cluster has the SAME name than Zcl clusters)
    };

    if (typeof key === 'number') {
        if (manufacturerCode) {
            name = Object.entries(clusters)
                .find((e) => e[1].ID === key && e[1].manufacturerCode === manufacturerCode)?.[0];
        } 
        
        if (!name) {
            name = Object.entries(clusters).find((e) => e[1].ID === key && !e[1].manufacturerCode)?.[0];
        }

        if (!name) {
            name = Object.entries(clusters).find((e) => e[1].ID === key)?.[0];
        }
    } else {
        name = key;
    }

    let cluster = clusters[name];

    if (!cluster) {
        if (typeof key === 'number') {
            name = key.toString();
            cluster = {attributes: {}, commands: {}, commandsResponse: {}, manufacturerCode: null, ID: key};
        } else {
            throw new Error(`Cluster with name '${key}' does not exist`);
        }
    }

    return {name, cluster};
}

function createCluster(name: string, cluster: ClusterDefinition, manufacturerCode: number = null): TsType.Cluster {
    // eslint-disable-next-line
    let attributes: {[s: string]: TsType.Attribute} = Object.assign({}, ...Object.entries(cluster.attributes).map(([k, v]): any => ({[k]: {...v, name: k}})));
    // eslint-disable-next-line
    const commands: {[s: string]: TsType.Command} = Object.assign({}, ...Object.entries(cluster.commands).map(([k, v]): any => ({[k]: {...v, name: k}})));
    // eslint-disable-next-line
    const commandsResponse: {[s: string]: TsType.Command} = Object.assign({}, ...Object.entries(cluster.commandsResponse).map(([k, v]): any => ({[k]: {...v, name: k}})));

    const getAttributeInternal = (key: number | string): TsType.Attribute => {
        let result: TsType.Attribute = null;
        if (typeof key === 'number') {
            if (manufacturerCode) {
                result = Object.values(attributes).find((a): boolean => {
                    return a.ID === key && a.manufacturerCode === manufacturerCode;
                });
            }

            if (!result) {
                result = Object.values(attributes).find((a): boolean => a.ID === key && a.manufacturerCode == null);
            }
        } else {
            result = Object.values(attributes).find((a): boolean => a.name === key);
        }
        return result;
    };

    const getAttribute = (key: number | string): TsType.Attribute => {
        const result = getAttributeInternal(key);
        if (!result) {
            throw new Error(`Cluster '${name}' has no attribute '${key}'`);
        }

        return result;
    };

    const hasAttribute = (key: number | string): boolean => {
        const result = getAttributeInternal(key);
        return !!result;
    };

    const getCommand = (key: number | string): TsType.Command => {
        let result: TsType.Command = null;

        if (typeof key === 'number') {
            result = Object.values(commands).find((a): boolean => a.ID === key);
        } else {
            result = Object.values(commands).find((a): boolean => a.name === key);
        }

        if (!result) {
            throw new Error(`Cluster '${name}' has no command '${key}'`);
        }

        return result;
    };

    const getCommandResponse = (key: number | string): TsType.Command => {
        let result: TsType.Command = null;

        if (typeof key === 'number') {
            result = Object.values(commandsResponse).find((a): boolean => a.ID === key);
        } else {
            result = Object.values(commandsResponse).find((a): boolean => a.name === key);
        }

        if (!result) {
            throw new Error(`Cluster '${name}' has no command response '${key}'`);
        }

        return result;
    };

    return {
        ID: cluster.ID,
        attributes,
        manufacturerCode: cluster.manufacturerCode,
        name,
        commands,
        // eslint-disable-next-line
        commandsResponse: Object.assign({}, ...Object.entries(cluster.commandsResponse).map(([k, v]): any => ({[k]: {...v, name: k}}))),
        getAttribute,
        hasAttribute,
        getCommand,
        getCommandResponse,
    };
}

function getCluster(
    key: string | number,
    manufacturerCode: number | null,
    customClusters: CustomClusters,
): TsType.Cluster {
    const {name, cluster} = getClusterDefinition(key, manufacturerCode, customClusters);
    return createCluster(name, cluster, manufacturerCode);
}

function getGlobalCommand(key: number | string): TsType.Command {
    let name;

    if (typeof key === 'number') {
        for (const commandName in Foundation) {
            if (Foundation[commandName].ID === key) {
                name = commandName;
                break;
            }
        }
    } else {
        name = key;
    }

    const command = Foundation[name];

    if (!command) {
        throw new Error(`Global command with key '${key}' does not exist`);
    }

    const result: TsType.Command = {
        ID: command.ID,
        name,
        parameters: command.parameters,
    };

    if (command.hasOwnProperty('response')) {
        result.response = command.response;
    }

    return result;
}

function isClusterName(name: string): name is ClusterName {
    return (name in Clusters);
}

export {
    getCluster,
    getGlobalCommand,
    IsDataTypeAnalogOrDiscrete,
    createCluster,
    isClusterName,
};