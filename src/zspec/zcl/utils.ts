import {Clusters} from "./definition/cluster";
import {ZCL_TYPE_INVALID_BY_TYPE} from "./definition/datatypes";
import {DataType} from "./definition/enums";
import {Foundation, type FoundationCommandName, type FoundationDefinition} from "./definition/foundation";
import type {Attribute, Cluster, ClusterName, Command, CustomClusters, Parameter} from "./definition/tstype";

/** Runtime fast lookup */
const ZCL_CLUSTERS_ID_TO_NAMES = (() => {
    const map = new Map<number, ClusterName>();

    for (const clusterName in Clusters) {
        const cluster = Clusters[clusterName as ClusterName];

        map.set(cluster.ID, clusterName as ClusterName);
    }

    return map;
})();

export function isAnalogDataType(dataType: DataType): boolean {
    return (
        dataType === DataType.UINT8 ||
        dataType === DataType.UINT16 ||
        dataType === DataType.UINT24 ||
        dataType === DataType.UINT32 ||
        dataType === DataType.UINT40 ||
        dataType === DataType.UINT48 ||
        dataType === DataType.UINT56 ||
        dataType === DataType.INT8 ||
        dataType === DataType.INT16 ||
        dataType === DataType.INT24 ||
        dataType === DataType.INT32 ||
        dataType === DataType.INT40 ||
        dataType === DataType.INT48 ||
        dataType === DataType.INT56 ||
        dataType === DataType.SEMI_PREC ||
        dataType === DataType.SINGLE_PREC ||
        dataType === DataType.DOUBLE_PREC ||
        dataType === DataType.TOD ||
        dataType === DataType.DATE ||
        dataType === DataType.UTC
    );
}

export function getCluster(key: string | number, manufacturerCode: number | undefined = undefined, customClusters: CustomClusters = {}): Cluster {
    let cluster: Cluster | undefined;

    if (typeof key === "number") {
        // custom clusters have priority over Zcl clusters, except in case of better match (see below)
        for (const clusterName in customClusters) {
            const foundCluster = customClusters[clusterName as ClusterName];

            if (foundCluster.ID === key) {
                // priority on first match when matching only ID
                if (cluster === undefined) {
                    cluster = foundCluster;
                }

                if (manufacturerCode && foundCluster.manufacturerCode === manufacturerCode) {
                    cluster = foundCluster;
                    break;
                }

                if (!foundCluster.manufacturerCode) {
                    cluster = foundCluster;
                    break;
                }
            }
        }

        if (!cluster) {
            const zclName = ZCL_CLUSTERS_ID_TO_NAMES.get(key);

            if (zclName) {
                const foundCluster = Clusters[zclName];

                // TODO: can remove all below once all manuf-specific moved to ZHC

                // priority on first match when matching only ID
                if (cluster === undefined) {
                    cluster = foundCluster;
                }

                if (manufacturerCode && foundCluster.manufacturerCode === manufacturerCode) {
                    cluster = foundCluster;
                } else if (foundCluster.manufacturerCode === undefined) {
                    cluster = foundCluster;
                }
            }
        }

        // TODO: cluster.ID can't be undefined?
        if (!cluster || cluster.ID === undefined) {
            cluster = {name: `${key}`, ID: key, attributes: {}, commands: {}, commandsResponse: {}};
        }
    } else {
        cluster = key in customClusters ? customClusters[key] : Clusters[key as ClusterName];

        // TODO: cluster.ID can't be undefined?
        if (!cluster || cluster.ID === undefined) {
            throw new Error(`Cluster '${key}' does not exist`);
        }
    }

    return cluster;
}

export function getClusterAttribute(cluster: Cluster, key: number | string, manufacturerCode: number | undefined): Attribute | undefined {
    const attributes = cluster.attributes;

    if (typeof key === "number") {
        let partialMatchAttr: Attribute | undefined;

        for (const attrKey in attributes) {
            const attr = attributes[attrKey];

            if (attr.ID === key) {
                if (manufacturerCode !== undefined && attr.manufacturerCode === manufacturerCode) {
                    return attr;
                }

                if (attr.manufacturerCode === undefined) {
                    partialMatchAttr = attr;
                }
            }
        }

        return partialMatchAttr;
    }

    return attributes[key];
}

export function getClusterCommand(cluster: Cluster, key: number | string): Command {
    const commands = cluster.commands;

    if (typeof key === "number") {
        for (const cmdKey in commands) {
            const cmd = commands[cmdKey];

            if (cmd.ID === key) {
                return cmd;
            }
        }
    } else {
        const cmd = commands[key];

        if (cmd) {
            return cmd;
        }
    }

    throw new Error(`Cluster '${cluster.name}' has no command '${key}'`);
}

export function getClusterCommandResponse(cluster: Cluster, key: number | string): Command {
    const commandResponses = cluster.commandsResponse;

    if (typeof key === "number") {
        for (const cmdKey in commandResponses) {
            const cmd = commandResponses[cmdKey];

            if (cmd.ID === key) {
                return cmd;
            }
        }
    } else {
        const cmd = commandResponses[key];

        if (cmd) {
            return cmd;
        }
    }

    throw new Error(`Cluster '${cluster.name}' has no command response '${key}'`);
}

function getGlobalCommandNameById(id: number): FoundationCommandName {
    for (const commandName in Foundation) {
        if (Foundation[commandName as FoundationCommandName].ID === id) {
            return commandName as FoundationCommandName;
        }
    }

    throw new Error(`Global command with id '${id}' does not exist.`);
}

export function getGlobalCommand(key: number | string): FoundationDefinition {
    const name = typeof key === "number" ? getGlobalCommandNameById(key) : (key as FoundationCommandName);
    const command = Foundation[name];

    if (!command) {
        throw new Error(`Global command with key '${key}' does not exist`);
    }

    return command;
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

export function getFoundationCommandByName(name: string): FoundationDefinition {
    const command = Foundation[name as FoundationCommandName];

    if (command === undefined) {
        throw new Error(`Foundation command '${name}' does not exist.`);
    }

    return command;
}

/** Check if value is equal to either min, max, minRef or maxRef */
function isMinOrMax<T>(entry: Attribute | Parameter, value: T): boolean {
    if (value === entry.max || value === entry.min) {
        return true;
    }

    return false;
}

function processRestrictions<T>(entry: Attribute | Parameter, value: T): void {
    if (entry.min !== undefined && (value as number) < entry.min) {
        throw new Error(`${entry.name} requires min of ${entry.min}`);
    }

    if (entry.minExcl !== undefined && (value as number) <= entry.minExcl) {
        throw new Error(`${entry.name} requires min exclusive of ${entry.minExcl}`);
    }

    if (entry.max !== undefined && (value as number) > entry.max) {
        throw new Error(`${entry.name} requires max of ${entry.max}`);
    }

    if (entry.maxExcl !== undefined && (value as number) >= entry.maxExcl) {
        throw new Error(`${entry.name} requires max exclusive of ${entry.maxExcl}`);
    }

    if (entry.length !== undefined && (value as string | unknown[] | Buffer).length !== entry.length) {
        throw new Error(`${entry.name} requires length of ${entry.length}`);
    }

    if (entry.minLen !== undefined && (value as string | unknown[] | Buffer).length < entry.minLen) {
        throw new Error(`${entry.name} requires min length of ${entry.minLen}`);
    }

    if (entry.maxLen !== undefined && (value as string | unknown[] | Buffer).length > entry.maxLen) {
        throw new Error(`${entry.name} requires max length of ${entry.maxLen}`);
    }
}

export function processAttributeWrite<T>(attribute: Attribute, value: T): T {
    if (attribute.write !== true) {
        throw new Error(`Attribute ${attribute.name} (${attribute.ID}) is not writable`);
    }

    if (value == null) {
        return attribute.default !== undefined ? (attribute.default as T) : value /* XXX: dangerous fallback */;
    }

    // if default, always valid
    if (attribute.default === value) {
        return value;
    }

    if (Number.isNaN(value)) {
        if (attribute.default === undefined) {
            const nonValue = ZCL_TYPE_INVALID_BY_TYPE[attribute.type];

            if (nonValue === undefined) {
                throw new Error(`Attribute ${attribute.name} (${attribute.ID}) does not have a default nor a non-value`);
            }

            return nonValue as T;
        }

        return attribute.default as T;
    }

    processRestrictions(attribute, value);

    return value;
}

export function processAttributePreRead(attribute: Attribute): void {
    if (attribute.read === false) {
        throw new Error(`Attribute ${attribute.name} (${attribute.ID}) is not readable`);
    }
}

export function processAttributePostRead<T>(attribute: Attribute, value: T): T {
    // should never happen?
    if (value == null) {
        return value;
    }

    // if default, always valid
    if (attribute.default === value) {
        return value;
    }

    // if type does not have an `invalid` (undefined) it won't match since value is checked above
    if (value === ZCL_TYPE_INVALID_BY_TYPE[attribute.type]) {
        // if value is same as max or min, ignore invalid sentinel
        if (isMinOrMax(attribute, value)) {
            return value;
        }

        // return NaN for both number & bigint to keep logic consistent
        return Number.NaN as T;
    }

    processRestrictions(attribute, value);

    return value;
}

export function processParameterWrite<T>(parameter: Parameter, value: T): T {
    // should never happen?
    if (value == null) {
        return value;
    }

    if (Number.isNaN(value)) {
        const nonValue = ZCL_TYPE_INVALID_BY_TYPE[parameter.type];

        if (nonValue === undefined) {
            throw new Error(`Parameter ${parameter.name} does not have a non-value`);
        }

        return nonValue as T;
    }

    processRestrictions(parameter, value);

    return value;
}

export function processParameterRead<T>(parameter: Parameter, value: T): T {
    // should never happen?
    if (value == null) {
        return value;
    }

    // if type does not have an `invalid` (undefined) it won't match since value is checked above
    if (value === ZCL_TYPE_INVALID_BY_TYPE[parameter.type]) {
        // if value is same as max or min, ignore invalid sentinel
        if (isMinOrMax(parameter, value)) {
            return value;
        }

        // return NaN for both number & bigint to keep logic consistent
        return Number.NaN as T;
    }

    processRestrictions(parameter, value);

    return value;
}
