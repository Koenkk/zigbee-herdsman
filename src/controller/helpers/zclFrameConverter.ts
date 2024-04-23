import {ZclFrame, Utils as ZclUtils} from '../../zcl';
import {Cluster} from '../../zcl/tstype';
import ManufacturerCode from '../../zcl/definition/manufacturerCode';
import {CustomClusters} from '../../zcl/definition/tstype';

interface KeyValue {[s: string]: number | string}

// Legrand devices (e.g. 4129) fail to set the manufacturerSpecific flag and
// manufacturerCode in the frame header, despite using specific attributes.
// This leads to incorrect reported attribute names.
// Remap the attributes using the target device's manufacturer ID
// if the header is lacking the information.
function getCluster(frame: ZclFrame, deviceManufacturerID: number, customClusters: CustomClusters): Cluster {
    let cluster = frame.cluster;
    if (!frame?.header?.manufacturerCode && frame?.cluster && deviceManufacturerID == ManufacturerCode.LEGRAND_GROUP) {
        cluster = ZclUtils.getCluster(frame.cluster.ID, deviceManufacturerID, customClusters);
    }
    return cluster;
}

function attributeKeyValue(frame: ZclFrame, deviceManufacturerID: number, customClusters: CustomClusters): KeyValue {
    const payload: KeyValue = {};
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    for (const item of frame.payload) {
        try {
            const attribute = cluster.getAttribute(item.attrId);
            payload[attribute.name] = item.attrData;
        } catch (error) {
            payload[item.attrId] = item.attrData;
        }
    }
    return payload;
}

function attributeList(frame: ZclFrame, deviceManufacturerID: number, customClusters: CustomClusters): Array<string | number> {
    const payload: Array<string | number> = [];
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    for (const item of frame.payload) {
        try {
            const attribute = cluster.getAttribute(item.attrId);
            payload.push(attribute.name);
        } catch (error) {
            payload.push(item.attrId);
        }
    }
    return payload;
}

export {
    attributeKeyValue,
    attributeList,
};
