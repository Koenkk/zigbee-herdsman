import {ZclFrame} from '../../zcl';

interface KeyValue {[s: string]: number | string};

function attributeList(frame: ZclFrame): KeyValue {
    const payload: KeyValue = {};

    for (let item of frame.Payload) {
        const attribute = frame.getCluster().getAttribute(item.attrId);
        payload[attribute ? attribute.name : item.attrId] = item.attrData;
    }

    return payload;
}

export {
    attributeList,
}