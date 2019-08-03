import * as Utils from './utils';
import Status from './definition/status';
import DataType from './definition/dataType';
import Foundation from './definition/foundation';
import ZclFrame from './zclFrame';

interface KeyValue {
    key: string;
    value: number;
}

// TODO: remove
/* istanbul ignore next */
function getClusterLegacy(ID: string | number): KeyValue  {
    let cluster;

    try {
        cluster = Utils.getCluster(ID);
    } catch {
        return undefined;
    }

    return {key: cluster.name, value: cluster.ID};
}

// TODO: remove
/* istanbul ignore next */
function getAttributeLegacy(clusterID: string | number, attributeID: string | number): KeyValue {
    const cluster = Utils.getCluster(clusterID);

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
    const cluster = Utils.getCluster(clusterID);

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
    const cluster = Utils.getCluster(clusterID);

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
    const cluster = Utils.getCluster(clusterID);

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
    Status,
    DataType,
    Foundation,
    ZclFrame,
    Utils,

    getClusterLegacy,
    getAttributeLegacy,
    getAttributeTypeLegacy,
    getFoundationLegacy,
    getFunctionalLegacy,
    getCommandResponseLegacy,
    getDataTypeLegacy,
}