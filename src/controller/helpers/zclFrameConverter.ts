import * as Zcl from "../../zspec/zcl";
import type {Cluster, CustomClusters} from "../../zspec/zcl/definition/tstype";

interface KeyValue {
    [s: string]: number | string;
}

// Legrand devices (e.g. 4129) fail to set the manufacturerSpecific flag and
// manufacturerCode in the frame header, despite using specific attributes.
// This leads to incorrect reported attribute names.
// Remap the attributes using the target device's manufacturer ID
// if the header is lacking the information.
function getCluster(frame: Zcl.Frame, deviceManufacturerID: number | undefined, customClusters: CustomClusters): Cluster {
    let cluster = frame.cluster;
    if (!frame?.header?.manufacturerCode && frame?.cluster && deviceManufacturerID === Zcl.ManufacturerCode.LEGRAND_GROUP) {
        cluster = Zcl.Utils.getCluster(frame.cluster.ID, deviceManufacturerID, customClusters);
    }
    return cluster;
}

type AttrPayload = {
    attrId: number;
    dataType: number;
    attrData: number | string;
}[];

function attributeKeyValue(frame: Zcl.Frame, deviceManufacturerID: number | undefined, customClusters: CustomClusters): KeyValue {
    const payload: KeyValue = {};
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    for (const item of frame.payload as AttrPayload) {
        try {
            const attribute = cluster.getAttribute(item.attrId);
            payload[attribute.name] = item.attrData;
        } catch {
            payload[item.attrId] = item.attrData;
        }
    }
    return payload;
}

type AttrListPayload = {attrId: number}[];

function attributeList(frame: Zcl.Frame, deviceManufacturerID: number | undefined, customClusters: CustomClusters): Array<string | number> {
    const payload: Array<string | number> = [];
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    for (const item of frame.payload as AttrListPayload) {
        try {
            const attribute = cluster.getAttribute(item.attrId);
            payload.push(attribute.name);
        } catch {
            payload.push(item.attrId);
        }
    }
    return payload;
}

export {attributeKeyValue, attributeList};
