import { CommandId, BuffaloZBOSSDataType } from "./enums";
import { FRAMES, ParamsDesc } from "./commands";
import {KeyValue} from "../../controller/tstype";
import { BuffaloZcl } from "../../zspec/zcl/buffaloZcl";
import { BuffaloZclDataType } from "../../zspec/zcl/definition/enums";
import {BuffaloZclOptions} from '../../zspec/zcl/definition/tstype';
import {DataType} from "../../zspec/zcl";

export class ZBOSSBuffaloZcl extends BuffaloZcl {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public write(type: DataType | BuffaloZclDataType | BuffaloZBOSSDataType, value: any, options: BuffaloZclOptions): void {
        switch (type) {
            case BuffaloZBOSSDataType.EXTENDED_PAN_ID: {
                return this.writeBuffer(value, 8);
            }
            default: {
                return super.write(type as DataType | BuffaloZclDataType, value, options);
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public read(type: DataType | BuffaloZclDataType | BuffaloZBOSSDataType, options: BuffaloZclOptions): any {
        switch (type) {
            case BuffaloZBOSSDataType.EXTENDED_PAN_ID: {
                return this.readBuffer(8);
            }
            default: {
                return super.read(type as DataType | BuffaloZclDataType, options);
            }
        }
    }

    public writeByDesc(payload: KeyValue, params: ParamsDesc[]): number {
        const start = this.getPosition();
        for (const parameter of params) {
            const options: BuffaloZclOptions = {};
    
            if (parameter.condition && !parameter.condition(payload, this)) {
                continue;
            }
            if (parameter.options) parameter.options(payload, options);
    
            if (parameter.type == BuffaloZBOSSDataType.LIST_TYPED && parameter.typed) {
                const internalPaload = payload[parameter.name];
                for (const value of internalPaload) {
                    this.writeByDesc(value, parameter.typed);
                }
            } else {
                this.write(parameter.type as DataType, payload[parameter.name], options);
            }
        }
        return this.getPosition()-start;
    }

    public readByDesc(params: ParamsDesc[]): KeyValue {
        const payload: KeyValue = {};
    
        for (const parameter of params) {
            if (!this.isMore()) break;
            
            const options: BuffaloZclOptions = {payload};
    
            if (parameter.condition && !parameter.condition(payload, this)) {
                continue;
            }
            if (parameter.options) parameter.options(payload, options);
    
            payload[parameter.name] = this.read(parameter.type as DataType, options);
        }
    
        return payload;
    }
}

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
    const buf = new ZBOSSBuffaloZcl(buffer);
    const version = buf.readUInt8();
    const type = buf.readUInt8();
    const commandId = buf.readUInt16();
    let tsn = 0;
    if ([FrameType.REQUEST, FrameType.RESPONSE].includes(type)) {
        tsn = buf.readUInt8();
    }
    const payload = readPayload(type, commandId, buf);

    return {
        version,
        type,
        commandId,
        tsn,
        payload,
    };
}


export function writeZBOSSFrame(frame: ZBOSSFrame): Buffer {
    const buf = new ZBOSSBuffaloZcl(Buffer.alloc(247));
    buf.writeInt8(frame.version);
    buf.writeInt8(frame.type);
    buf.writeUInt16(frame.commandId);
    buf.writeUInt8(frame.tsn);
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
    tsn?: number;
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
        tsn: 0,
        payload: payload,
    }
}

function readPayload(type: FrameType, commandId: CommandId, buffalo: ZBOSSBuffaloZcl): ZBOSSFrameData {
    const frameDesc = getFrameDesc(type, commandId);
    return buffalo.readByDesc(frameDesc);
}

function writePayload(type: FrameType, commandId: CommandId, payload: ZBOSSFrameData, buffalo: ZBOSSBuffaloZcl): number {
    const frameDesc = getFrameDesc(type, commandId);
    return buffalo.writeByDesc(payload, frameDesc);
}