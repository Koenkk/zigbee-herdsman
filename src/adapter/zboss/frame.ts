import {crc16} from "./utils";
import { CommandId } from "./enums";
import { FRAMES } from "./commands";
import {KeyValue} from "../../controller/tstype";
import {BuffaloZcl} from "../../zspec/zcl/buffaloZcl";
import {BuffaloZclOptions} from '../../zspec/zcl/definition/tstype';
import {DataType} from "../../zspec/zcl";


function getFrameDesc(type: FrameType, key: CommandId) {
    const frameDesc = FRAMES[key];
    if (!frameDesc) throw new Error(`Unrecognized frame type from FrameID ${key}`);
    switch (type) {
        case FrameType.REQUEST:
            return frameDesc.request || [];
        case FrameType.RESPONSE:
            return frameDesc.response || [];
        case FrameType.INDICATION:
            return frameDesc.indication || [];
        default:
            return;
    }
}

export function readZBOSSFrame(buffer: Buffer): ZBOSSFrame {
    const buf = new BuffaloZcl(buffer);
    const version = buf.readUInt8();
    const type = buf.readUInt8();
    const commandId = buf.readUInt16();
    let sequence = 0;
    if ([FrameType.REQUEST, FrameType.RESPONSE].includes(type)) {
        sequence = buf.readUInt8();
    }
    const payload = readPayload(type, commandId, buf);

    return {
        version,
        type,
        commandId,
        sequence,
        payload,
    };
}


export function writeZBOSSFrame(frame: ZBOSSFrame): Buffer {
    const buf = new BuffaloZcl(Buffer.alloc(247));
    buf.writeInt8(frame.version);
    buf.writeInt8(frame.type);
    buf.writeUInt16(frame.commandId);
    buf.writeUInt8(frame.sequence);
    writePayload(frame.type, frame.commandId, frame.payload, buf);
    return buf.getWritten();
}

export enum FrameType {
    REQUEST = 0,
    RESPONSE = 1,
    INDICATION = 2,
}

export interface ZBOSSFrameData extends KeyValue {};

export interface ZBOSSFrame {
    version: number;
    type: FrameType;
    commandId: CommandId;
    sequence?: number;
    payload?: ZBOSSFrameData;
}

export function makeFrame(type: FrameType, commandId: CommandId, params: KeyValue): ZBOSSFrame {
    const frameDesc = getFrameDesc(type, commandId);
    const payload: ZBOSSFrameData = {};
    for (const parameter of frameDesc) {
        const options: BuffaloZclOptions = {payload};

        if (parameter.condition && !parameter.condition(payload, undefined)) {
            continue;
        }

        payload[parameter.name] = params[parameter.name];
    }
    return {
        version: 0,
        type: type,
        commandId: commandId,
        sequence: 0,
        payload: payload,
    }
}

function readPayload(type: FrameType, commandId: CommandId, buffalo: BuffaloZcl): ZBOSSFrameData {
    const frameDesc = getFrameDesc(type, commandId);
    const payload: ZBOSSFrameData = {};

    for (const parameter of frameDesc) {
        const options: BuffaloZclOptions = {payload};

        if (parameter.condition && !parameter.condition(payload, buffalo)) {
            continue;
        }
        if (parameter.options) parameter.options(payload, options);

        payload[parameter.name] = buffalo.read(parameter.type as DataType, options);
    }

    return payload;
}

function writePayload(type: FrameType, commandId: CommandId, payload: ZBOSSFrameData, buffalo: BuffaloZcl): number {
    const frameDesc = getFrameDesc(type, commandId);
    const start = buffalo.getPosition();
    for (const parameter of frameDesc) {
        const options: BuffaloZclOptions = {};

        if (parameter.condition && !parameter.condition(payload, buffalo)) {
            continue;
        }
        if (parameter.options) parameter.options(payload, options);

        buffalo.write(parameter.type as DataType, payload[parameter.name], options);
    }
    return buffalo.getPosition()-start;
}
