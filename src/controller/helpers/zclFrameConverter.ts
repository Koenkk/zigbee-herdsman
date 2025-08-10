import * as Zcl from "../../zspec/zcl";
import type {TFoundation} from "../../zspec/zcl/definition/clusters-types";
import type {Cluster, CustomClusters} from "../../zspec/zcl/definition/tstype";
import type {ClusterOrRawWriteAttributes} from "../tstype";

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

function attributeKeyValue<Cl extends number | string>(
    frame: Zcl.Frame,
    deviceManufacturerID: number | undefined,
    customClusters: CustomClusters,
): ClusterOrRawWriteAttributes<Cl> {
    const payload: Record<string | number, unknown> = {};
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    // TODO: remove this type once Zcl.Frame is typed
    for (const item of frame.payload as TFoundation["report" | "write" | "readRsp"]) {
        payload[cluster.getAttribute(item.attrId)?.name ?? item.attrId] = item.attrData;
    }

    return payload as ClusterOrRawWriteAttributes<Cl>;
}

function attributeList(frame: Zcl.Frame, deviceManufacturerID: number | undefined, customClusters: CustomClusters): Array<string | number> {
    const payload: Array<string | number> = [];
    const cluster = getCluster(frame, deviceManufacturerID, customClusters);

    // TODO: remove this type once Zcl.Frame is typed
    for (const item of frame.payload as TFoundation["read"]) {
        payload.push(cluster.getAttribute(item.attrId)?.name ?? item.attrId);
    }

    return payload;
}

export {attributeKeyValue, attributeList};
