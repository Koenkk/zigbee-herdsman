import {Clusters} from './definition/cluster';
import {DataType, DataTypeClass} from './definition/enums';
import {Foundation, FoundationCommandName, FoundationDefinition} from './definition/foundation';
import {Attribute, Cluster, ClusterDefinition, ClusterName, Command, CustomClusters} from './definition/tstype';

const DATA_TYPE_CLASS_DISCRETE = [
    DataType.DATA8,
    DataType.DATA16,
    DataType.DATA24,
    DataType.DATA32,
    DataType.DATA40,
    DataType.DATA48,
    DataType.DATA56,
    DataType.DATA64,
    DataType.BOOLEAN,
    DataType.BITMAP8,
    DataType.BITMAP16,
    DataType.BITMAP24,
    DataType.BITMAP32,
    DataType.BITMAP40,
    DataType.BITMAP48,
    DataType.BITMAP56,
    DataType.BITMAP64,
    DataType.ENUM8,
    DataType.ENUM16,
    DataType.OCTET_STR,
    DataType.CHAR_STR,
    DataType.LONG_OCTET_STR,
    DataType.LONG_CHAR_STR,
    DataType.ARRAY,
    DataType.STRUCT,
    DataType.SET,
    DataType.BAG,
    DataType.CLUSTER_ID,
    DataType.ATTR_ID,
    DataType.BAC_OID,
    DataType.IEEE_ADDR,
    DataType.SEC_KEY,
];
const DATA_TYPE_CLASS_ANALOG = [
    DataType.UINT8,
    DataType.UINT16,
    DataType.UINT24,
    DataType.UINT32,
    DataType.UINT40,
    DataType.UINT48,
    DataType.UINT56,
    DataType.INT8,
    DataType.INT16,
    DataType.INT24,
    DataType.INT32,
    DataType.INT40,
    DataType.INT48,
    DataType.INT56,
    DataType.SEMI_PREC,
    DataType.SINGLE_PREC,
    DataType.DOUBLE_PREC,
    DataType.TOD,
    DataType.DATE,
    DataType.UTC,
];

const FOUNDATION_DISCOVER_RSP_IDS = [
    Foundation.discoverRsp.ID,
    Foundation.discoverCommandsRsp.ID,
    Foundation.discoverCommandsGenRsp.ID,
    Foundation.discoverExtRsp.ID,
];

export function getDataTypeClass(dataType: DataType): DataTypeClass {
    if (DATA_TYPE_CLASS_DISCRETE.includes(dataType)) {
        return DataTypeClass.DISCRETE;
    } else if (DATA_TYPE_CLASS_ANALOG.includes(dataType)) {
        return DataTypeClass.ANALOG;
    } else {
        throw new Error(`Don't know value type for '${DataType[dataType]}'`);
    }
}

function hasCustomClusters(customClusters: CustomClusters): boolean {
    // XXX: was there a good reason to not set the parameter `customClusters` optional? it would allow simple undefined check
    // below is twice faster than checking `Object.keys(customClusters).length`
    for (const k in customClusters) return true;
    return false;
}

function findClusterNameByID(
    id: number,
    manufacturerCode: number | undefined,
    clusters: CustomClusters,
): [name: string | undefined, partialMatch: boolean] {
    let name: string | undefined;
    // if manufacturer code is given, consider partial match if didn't match against manufacturer code
    let partialMatch = Boolean(manufacturerCode);

    for (const clusterName in clusters) {
        const cluster = clusters[clusterName as ClusterName];

        if (cluster.ID === id) {
            // priority on first match when matching only ID
            if (name == undefined) {
                name = clusterName;
            }

            if (manufacturerCode && cluster.manufacturerCode === manufacturerCode) {
                name = clusterName;
                partialMatch = false;
                break;
            } else if (!cluster.manufacturerCode) {
                name = clusterName;
                break;
            }
        }
    }

    return [name, partialMatch];
}

function getClusterDefinition(
    key: string | number,
    manufacturerCode: number | undefined,
    customClusters: CustomClusters,
): {name: string; cluster: ClusterDefinition} {
    let name: string | undefined;

    if (typeof key === 'number') {
        let partialMatch: boolean;

        // custom clusters have priority over Zcl clusters, except in case of better match (see below)
        [name, partialMatch] = findClusterNameByID(key, manufacturerCode, customClusters);

        if (!name) {
            [name, partialMatch] = findClusterNameByID(key, manufacturerCode, Clusters);
        } else if (partialMatch) {
            let zclName: string | undefined;
            [zclName, partialMatch] = findClusterNameByID(key, manufacturerCode, Clusters);

            // Zcl clusters contain a better match, use that one
            if (zclName !== undefined && !partialMatch) {
                name = zclName;
            }
        }
    } else {
        name = key;
    }

    let cluster =
        name !== undefined && hasCustomClusters(customClusters)
            ? {
                  ...Clusters[name as ClusterName],
                  ...customClusters[name], // should override Zcl clusters
              }
            : Clusters[name as ClusterName];

    if (!cluster) {
        if (typeof key === 'number') {
            name = key.toString();
            cluster = {attributes: {}, commands: {}, commandsResponse: {}, manufacturerCode: undefined, ID: key};
        } else {
            name = undefined;
        }
    }

    if (!name) {
        throw new Error(`Cluster with name '${key}' does not exist`);
    }

    return {name, cluster};
}

function createCluster(name: string, cluster: ClusterDefinition, manufacturerCode?: number): Cluster {
    const attributes: {[s: string]: Attribute} = Object.assign({}, ...Object.entries(cluster.attributes).map(([k, v]) => ({[k]: {...v, name: k}})));
    const commands: {[s: string]: Command} = Object.assign({}, ...Object.entries(cluster.commands).map(([k, v]) => ({[k]: {...v, name: k}})));
    const commandsResponse: {[s: string]: Command} = Object.assign(
        {},
        ...Object.entries(cluster.commandsResponse).map(([k, v]) => ({[k]: {...v, name: k}})),
    );

    const getAttributeInternal = (key: number | string): Attribute | undefined => {
        if (typeof key === 'number') {
            let partialMatchAttr: Attribute | undefined;

            for (const attrKey in attributes) {
                const attr = attributes[attrKey];

                if (attr.ID === key) {
                    if (manufacturerCode && attr.manufacturerCode === manufacturerCode) {
                        return attr;
                    }

                    if (attr.manufacturerCode == undefined) {
                        partialMatchAttr = attr;
                    }
                }
            }

            return partialMatchAttr;
        } else {
            for (const attrKey in attributes) {
                const attr = attributes[attrKey];

                if (attr.name === key) {
                    return attr;
                }
            }
        }

        return undefined;
    };

    const getAttribute = (key: number | string): Attribute => {
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

    const getCommand = (key: number | string): Command => {
        if (typeof key === 'number') {
            for (const cmdKey in commands) {
                const cmd = commands[cmdKey];

                if (cmd.ID === key) {
                    return cmd;
                }
            }
        } else {
            for (const cmdKey in commands) {
                const cmd = commands[cmdKey];

                if (cmd.name === key) {
                    return cmd;
                }
            }
        }

        throw new Error(`Cluster '${name}' has no command '${key}'`);
    };

    const getCommandResponse = (key: number | string): Command => {
        if (typeof key === 'number') {
            for (const cmdKey in commandsResponse) {
                const cmd = commandsResponse[cmdKey];

                if (cmd.ID === key) {
                    return cmd;
                }
            }
        } else {
            for (const cmdKey in commandsResponse) {
                const cmd = commandsResponse[cmdKey];

                if (cmd.name === key) {
                    return cmd;
                }
            }
        }

        throw new Error(`Cluster '${name}' has no command response '${key}'`);
    };

    return {
        ID: cluster.ID,
        attributes,
        manufacturerCode: cluster.manufacturerCode,
        name,
        commands,
        commandsResponse,
        getAttribute,
        hasAttribute,
        getCommand,
        getCommandResponse,
    };
}

export function getCluster(key: string | number, manufacturerCode: number | undefined, customClusters: CustomClusters): Cluster {
    const {name, cluster} = getClusterDefinition(key, manufacturerCode, customClusters);
    return createCluster(name, cluster, manufacturerCode);
}

function getGlobalCommandNameById(id: number): FoundationCommandName {
    for (const commandName in Foundation) {
        if (Foundation[commandName as FoundationCommandName].ID === id) {
            return commandName as FoundationCommandName;
        }
    }

    throw new Error(`Global command with id '${id}' does not exist.`);
}

export function getGlobalCommand(key: number | string): Command {
    const name = typeof key === 'number' ? getGlobalCommandNameById(key) : (key as FoundationCommandName);
    const command = Foundation[name];

    if (!command) {
        throw new Error(`Global command with key '${key}' does not exist`);
    }

    const result: Command = {
        ID: command.ID,
        name,
        parameters: command.parameters,
    };

    if (command.response != undefined) {
        result.response = command.response;
    }

    return result;
}

export function isClusterName(name: string): name is ClusterName {
    return name in Clusters;
}

export function getFoundationCommand(id: number): FoundationDefinition {
    for (const commandName in Foundation) {
        const command = Foundation[commandName as FoundationCommandName];

        if (command.ID === id) {
            return command;
        }
    }

    throw new Error(`Foundation command '${id}' does not exist.`);
}

export function isFoundationDiscoverRsp(id: number): boolean {
    return FOUNDATION_DISCOVER_RSP_IDS.includes(id);
}
