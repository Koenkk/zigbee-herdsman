import {ZclFrame} from '../../zcl';

interface KeyValue {[s: string]: number | string};

function attributeKeyValue(frame: ZclFrame): KeyValue {
    const payload: KeyValue = {};

    for (const item of frame.Payload) {
        try {
            const attribute = frame.Cluster.getAttribute(item.attrId);
            payload[attribute.name] = item.attrData;
        } catch (error) {
            payload[item.attrId] = item.attrData;
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