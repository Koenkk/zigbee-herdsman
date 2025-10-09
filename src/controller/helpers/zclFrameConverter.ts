import * as Zcl from "../../zspec/zcl";
import type {TFoundation} from "../../zspec/zcl/definition/clusters-types";
import type {Cluster, CustomClusters} from "../../zspec/zcl/definition/tstype";
import type {ClusterOrRawWriteAttributes, TCustomCluster} from "../tstype";

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

function attributeKeyValue<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
    frame: Zcl.Frame,
    deviceManufacturerID: number | undefined,
    customClusters: CustomClusters,
): ClusterOrRawWriteAttributes<Cl, Custom> {
    const payload: Record<string | number, unknown> = {};
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    // TODO: remove this type once Zcl.Frame is typed
    for (const item of frame.payload as TFoundation["report" | "write" | "readRsp"]) {
        const attribute = cluster.getAttribute(item.attrId);

        if (attribute) {
            // XXX: refs that are "after this item" won't be populated (pre-loop?)
            const attrData = Zcl.Utils.processAttributePostRead(attribute, item.attrData, payload);

            payload[attribute.name] = attrData;
        } else {
            payload[item.attrId] = item.attrData;
        }
    }

    return payload as ClusterOrRawWriteAttributes<Cl, Custom>;
}

function attributeList(frame: Zcl.Frame, deviceManufacturerID: number | undefined, customClusters: CustomClusters): Array<string | number> {
    const payload: Array<string | number> = [];
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    // TODO: remove this type once Zcl.Frame is typed
    for (const item of frame.payload as TFoundation["read"]) {
        const attribute = cluster.getAttribute(item.attrId);

        payload.push(attribute?.name ?? item.attrId);
    }

    return payload;
}

export {attributeKeyValue, attributeList};
