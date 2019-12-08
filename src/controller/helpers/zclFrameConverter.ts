import {ZclFrame} from '../../zcl';

interface KeyValue {[s: string]: number | string};

function attributeList(frame: ZclFrame): KeyValue {
    const payload: KeyValue = {};

    for (const item of frame.Payload) {
        try {
            const attribute = frame.Cluster.getAttribute(item.attrId);
            payload[attribute.name] = item.attrData;
        } catch (error) {
            payload[item.attrId] = typeof item.attrData !== 'undefined' ? item.attrData : item.attrId;
        }
    }

    return payload;
}

export {
    attributeList,
};