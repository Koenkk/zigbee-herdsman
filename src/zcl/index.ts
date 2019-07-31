import Cluster from './cluster';
import Status from './status';
import DataType from './dataType';
import * as TsType from './tstype';
import Foundation from './foundation';

interface KeyValue {
    key: string;
    value: number;
}

function getClusterByName(name: string): TsType.Cluster {
    let cluster = Cluster[name];

    if (!cluster) {
        throw new Error(`Cluster with name '${name}' does not exist`)
    }

    return {...cluster, name};
}

function getClusterByID(ID: number): TsType.Cluster {
    let cluster: TsType.Cluster;

    for (let name in Cluster) {
        if (Cluster[name].ID === ID) {
            cluster = getClusterByName(name);
            break;
        }
    }

    if (!cluster) {
        throw new Error(`Cluster with ID '${ID}' does not exist`)
    }

    return cluster;
}

// TODO: remove
/* istanbul ignore next */
function getClusterLegacy(ID: string | number): KeyValue  {
    let cluster;

    try {
    if (typeof ID === 'number') {
        try {
            cluster = getClusterByID(ID);
        } catch {
            return undefined;
        }
    } else if (typeof ID === 'string') {
        try {
            cluster = getClusterByName(ID);
        } catch {
            return undefined;
        }

    } else {
        throw new Error(`Get cluster with type '${typeof ID}' is not supported`);
    }

    return {key: cluster.name, value: cluster.ID};
}

// TODO: remove
/* istanbul ignore next */
function getAttributeLegacy(clusterID: string | number, attributeID: string | number): KeyValue {
    const cluster = getClusterByName(getClusterLegacy(clusterID).key);

    for (let [key, value] of Object.entries(cluster.attributes)) {
        if ((typeof attributeID === 'string' && key === attributeID) ||
            (typeof attributeID) === 'number' && value.ID === attributeID) {
            return {key, value: value.ID};
        }
    }

    return null;
}

// TODO: remove
/* istanbul ignore next */
function getAttributeTypeLegacy(clusterID: string | number, attributeID: string | number): KeyValue {
    const cluster = getClusterByName(getClusterLegacy(clusterID).key);

    for (let [key, value] of Object.entries(cluster.attributes)) {
        if ((typeof attributeID === 'string' && key === attributeID) ||
            (typeof attributeID) === 'number' && value.ID === attributeID) {
            return {key: DataType[value.type], value: value.type};
        }
    }

    return null;
}

// TODO: remove
/* istanbul ignore next */
function getFoundationLegacy(ID: number | string): KeyValue {
    for (let [key, value] of Object.entries(Foundation)) {
        if ((typeof ID === 'string' && key === ID) ||
            (typeof ID) === 'number' && value.ID === ID) {
            return {key, value: value.ID};
        }
    }

    return null;
}

// TODO: remove
/* istanbul ignore next */
function getFunctionalLegacy(clusterID: number | string, commandID: number | string): KeyValue {
    const cluster = getClusterByName(getClusterLegacy(clusterID).key);

    for (let [key, value] of Object.entries(cluster.commands)) {
        if ((typeof commandID === 'string' && key === commandID) ||
            (typeof commandID) === 'number' && value.ID === commandID) {
            return {key, value: value.ID};
        }
    }

    return null;
}

// TODO: remove
/* istanbul ignore next */
function getCommandResponseLegacy(clusterID: number | string, commandID: number | string): KeyValue {
    const cluster = getClusterByName(getClusterLegacy(clusterID).key);

    for (let [key, value] of Object.entries(cluster.commandsResponse)) {
        if ((typeof commandID === 'string' && key === commandID) ||
            (typeof commandID) === 'number' && value.ID === commandID) {
            return {key, value: value.ID};
        }
    }

    return null;
}

// TODO: remove
/* istanbul ignore next */
function getDataTypeLegacy(ID: number | string): KeyValue {
    if (typeof ID === 'number') {
        return {key: DataType[ID], value: ID};
    } else if (typeof ID === 'string') {
        // @ts-ignore
        return {key: ID, value: DataType[ID]};
    }
}

export {
    getClusterByName,
    getClusterByID,
    Status,
    DataType,
    Foundation,

    getClusterLegacy,
    getAttributeLegacy,
    getAttributeTypeLegacy,
    getFoundationLegacy,
    getFunctionalLegacy,
    getCommandResponseLegacy,
    getDataTypeLegacy,
}