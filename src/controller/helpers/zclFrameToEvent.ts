import {ZclFrame} from "../../zcl";
import {KeyValue} from "../tstype";
import {FrameType, Foundation, TsType} from '../../zcl';

function attributeList(cluster: TsType.Cluster, frame: ZclFrame): KeyValue {
    const payload: KeyValue = {};

    for (let item of frame.Payload) {
        const attribute = cluster.getAttributeByID(item.attrId);
        payload[attribute ? attribute.name : item.attrId] = item.attrData;
    }

    return payload;
}

export default function(frame: ZclFrame): KeyValue {
    const command = frame.getCommand();
    const cluster = frame.getCluster();

    const frameType = frame.Header.frameControl.frameType;
    let data: KeyValue = {};

    if (frameType === FrameType.GLOBAL) {
        if (command.ID === Foundation.report.ID || command.ID === Foundation.readRsp.ID ) {
            data =  attributeList(cluster, frame);
        }
    }

    return {
        type: frame.getCommand().name,
        data: {
            cid: cluster.name,
            data: data
        }
    };
}