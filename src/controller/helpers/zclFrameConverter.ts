import {ZclFrame} from '../../zcl';

interface KeyValue {[s: string]: {data: number | string, statusCode: number}};

function attributeKeyValue(frame: ZclFrame, flat=true): KeyValue {
    const payload: KeyValue = {};

    for (const item of frame.Payload) {
        try {
            const attribute = frame.Cluster.getAttribute(item.attrId);
            if (flat) {
                payload[attribute.name] = item.attrData;
            } else {
                payload[attribute.name] = {data:item.attrData, statusCode: item.status};
            }
        } catch (error) {
            if (flat) {
                payload[item.attrId] = item.attrData;
            } else {
                payload[item.attrId] = {data: item.attrData, statusCode: 1}; // 1=failure
            }
        }
    }

    return payload;
}

function attributeList(frame: ZclFrame): Array<string | number> {
    const payload: Array<string | number> = [];

    for (const item of frame.Payload) {
        try {
            const attribute = frame.Cluster.getAttribute(item.attrId);
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