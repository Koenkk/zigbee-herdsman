import {logger} from "../../utils/logger";
import * as Zcl from "../../zspec/zcl";
import type {TFoundation} from "../../zspec/zcl/definition/clusters-types";
import type {CustomClusters} from "../../zspec/zcl/definition/tstype";
import type {ClusterOrRawWriteAttributes, TCustomCluster} from "../tstype";

const NS = "zh:controller:zcl";

const LEGRAND_GROUP_MANUF_CODE = Zcl.ManufacturerCode.LEGRAND_GROUP;

// NOTE: `legrandWorkaround`:
//   Legrand devices fail to set the manufacturerSpecific flag and manufacturerCode in the frame header, despite using specific attributes.
//   This leads to incorrect reported attribute names.
//   Remap the attributes using the target device's manufacturer ID if the header is lacking the information.

function attributeKeyValue<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
    frame: Zcl.Frame,
    deviceManufacturerID: number | undefined,
    customClusters: CustomClusters,
): ClusterOrRawWriteAttributes<Cl, Custom> {
    const payload: Record<string | number, unknown> = {};
    const legrandWorkaround = frame.header?.manufacturerCode === undefined && deviceManufacturerID === LEGRAND_GROUP_MANUF_CODE;
    const cluster = legrandWorkaround ? Zcl.Utils.getCluster(frame.cluster.name, deviceManufacturerID, customClusters) : frame.cluster;
    const manufacturerCode = legrandWorkaround ? deviceManufacturerID : frame.header.manufacturerCode;

    // TODO: remove this type once Zcl.Frame is typed
    for (const item of frame.payload as TFoundation["report" | "write" | "readRsp"]) {
        const attribute = Zcl.Utils.getClusterAttribute(cluster, item.attrId, manufacturerCode);

        if (attribute) {
            try {
                const attrData = Zcl.Utils.processAttributePostRead(attribute, item.attrData);

                payload[attribute.name] = attrData;
            } catch (error) {
                logger.debug(`Ignoring attribute ${attribute.name} from response: ${error}`, NS);
            }
        } else {
            payload[item.attrId] = item.attrData;
        }
    }

    return payload as ClusterOrRawWriteAttributes<Cl, Custom>;
}

function attributeList(frame: Zcl.Frame, deviceManufacturerID: number | undefined, customClusters: CustomClusters): Array<string | number> {
    const payload: Array<string | number> = [];
    const legrandWorkaround = frame.header?.manufacturerCode === undefined && deviceManufacturerID === LEGRAND_GROUP_MANUF_CODE;
    const cluster = legrandWorkaround ? Zcl.Utils.getCluster(frame.cluster.name, deviceManufacturerID, customClusters) : frame.cluster;
    const manufacturerCode = legrandWorkaround ? deviceManufacturerID : frame.header.manufacturerCode;

    // TODO: remove this type once Zcl.Frame is typed
    for (const item of frame.payload as TFoundation["read"]) {
        const attribute = Zcl.Utils.getClusterAttribute(cluster, item.attrId, manufacturerCode);

        payload.push(attribute?.name ?? item.attrId);
    }

    return payload;
}

export {attributeKeyValue, attributeList};
