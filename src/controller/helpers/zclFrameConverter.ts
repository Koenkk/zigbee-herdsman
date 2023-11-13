import {ZclFrame, Utils as ZclUtils} from '../../zcl';
import {Cluster} from '../../zcl/tstype';

interface KeyValue {[s: string]: number | string}

// Certain devices (e.g. Legrand/4129) fail to set the manufacturerSpecific flag and
// manufacturerCode in the frame header, despite using specific attributes.
// This leads to incorrect reported attribute names.
// Remap the attributes using the target device's manufacturer ID
// if the header is lacking the information.
// Note: Limit this feature to Legrand / 4129 only following regressions with Tuya devices
function getCluster(frame: ZclFrame, deviceManufacturerID: number): Cluster {
    let cluster = frame.Cluster;

    if (!frame?.Header?.manufacturerCode && frame?.Cluster && deviceManufacturerID == 4129) {
        cluster = ZclUtils.getCluster(frame.Cluster.ID, deviceManufacturerID);
    }
    return cluster;
}

function attributeKeyValue(frame: ZclFrame, deviceManufacturerID: number): KeyValue {
    const payload: KeyValue = {};
    const cluster = getCluster(frame, deviceManufacturerID);

    for (const item of frame.Payload) {
        try {
            const attribute = cluster.getAttribute(item.attrId);
            payload[attribute.name] = item.attrData;
        } catch (error) {
            payload[item.attrId] = item.attrData;
        }
    }
    return payload;
}

function attributeList(frame: ZclFrame, deviceManufacturerID: number): Array<string | number> {
    const payload: Array<string | number> = [];
    const cluster = getCluster(frame, deviceManufacturerID);

    for (const item of frame.Payload) {
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
