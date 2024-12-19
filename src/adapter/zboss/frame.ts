/* v8 ignore start */

import {KeyValue} from '../../controller/tstype';
import {DataType} from '../../zspec/zcl';
import {BuffaloZcl} from '../../zspec/zcl/buffaloZcl';
import {BuffaloZclDataType} from '../../zspec/zcl/definition/enums';
import {BuffaloZclOptions} from '../../zspec/zcl/definition/tstype';
import {ClusterId as ZdoClusterId} from '../../zspec/zdo';
import {BuffaloZdo} from '../../zspec/zdo/buffaloZdo';
import {GenericZdoResponse} from '../../zspec/zdo/definition/tstypes';
import {FRAMES, ParamsDesc, ZBOSS_COMMAND_ID_TO_ZDO_RSP_CLUSTER_ID} from './commands';
import {BuffaloZBOSSDataType, CommandId} from './enums';

export class ZBOSSBuffaloZcl extends BuffaloZcl {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public override write(type: DataType | BuffaloZclDataType | BuffaloZBOSSDataType, value: any, options: BuffaloZclOptions): void {
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
    public override read(type: DataType | BuffaloZclDataType | BuffaloZBOSSDataType, options: BuffaloZclOptions): any {
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
        return this.getPosition() - start;
    }

    public readByDesc(params: ParamsDesc[]): KeyValue {
        const payload: KeyValue = {};

        for (const parameter of params) {
            const options: BuffaloZclOptions = {payload};

            if (parameter.condition && !parameter.condition(payload, this)) {
                continue;
            }
            if (parameter.options) parameter.options(payload, options);

            if (parameter.type == BuffaloZBOSSDataType.LIST_TYPED && parameter.typed) {
                payload[parameter.name] = [];

                if (!this.isMore()) break;

                for (let i = 0; i < (options.length || 0); i++) {
                    const internalPaload = this.readByDesc(parameter.typed);
                    payload[parameter.name].push(internalPaload);
                }
            } else {
                if (!this.isMore()) break;

                payload[parameter.name] = this.read(parameter.type as DataType, options);
            }
        }

        return payload;
    }
}

function getFrameDesc(type: FrameType, key: CommandId): ParamsDesc[] {
    const frameDesc = FRAMES[key];
    if (!frameDesc) throw new Error(`Unrecognized frame type from FrameID ${key}`);
    switch (type) {
        case FrameType.REQUEST:
            return frameDesc.request || [];
        case FrameType.RESPONSE:
            return frameDesc.response || [];
        case FrameType.INDICATION:
            return frameDesc.indication || [];
    }
}

function fixNonStandardZdoRspPayload(clusterId: ZdoClusterId, buffer: Buffer): Buffer {
    switch (clusterId) {
        case ZdoClusterId.NODE_DESCRIPTOR_RESPONSE:
        case ZdoClusterId.POWER_DESCRIPTOR_RESPONSE:
        case ZdoClusterId.ACTIVE_ENDPOINTS_RESPONSE:
        case ZdoClusterId.MATCH_DESCRIPTORS_RESPONSE: {
            // flip nwkAddress from end to start
            return Buffer.concat([buffer.subarray(0, 1), buffer.subarray(-2), buffer.subarray(1, -2)]);
        }

        case ZdoClusterId.SIMPLE_DESCRIPTOR_RESPONSE: {
            // flip nwkAddress from end to start
            // add length after nwkAddress
            // move outClusterCount before inClusterList
            const inClusterListSize = buffer[7] * 2; // uint16
            return Buffer.concat([
                buffer.subarray(0, 1), // status
                buffer.subarray(-2), // nwkAddress
                Buffer.from([buffer.length - 3 /* status + nwkAddress */]),
                buffer.subarray(1, 8), // endpoint>inClusterCount
                buffer.subarray(9, 9 + inClusterListSize), // inClusterList
                buffer.subarray(8, 9), // outClusterCount
                buffer.subarray(9 + inClusterListSize, -2), // outClusterList
            ]);
        }
    }

    return buffer;
}

export function readZBOSSFrame(buffer: Buffer): ZBOSSFrame {
    const buf = new ZBOSSBuffaloZcl(buffer);
    const version = buf.readUInt8();
    const type: FrameType = buf.readUInt8();
    const commandId: CommandId = buf.readUInt16();
    const tsn = type === FrameType.REQUEST || type === FrameType.RESPONSE ? buf.readUInt8() : 0;

    const zdoResponseClusterId =
        type === FrameType.RESPONSE || type === FrameType.INDICATION ? ZBOSS_COMMAND_ID_TO_ZDO_RSP_CLUSTER_ID[commandId] : undefined;

    if (zdoResponseClusterId !== undefined) {
        // FrameType.INDICATION has no tsn (above), no category
        const category = type === FrameType.RESPONSE ? buf.readUInt8() : undefined;
        const zdoPayload = fixNonStandardZdoRspPayload(zdoResponseClusterId, buffer.subarray(type === FrameType.RESPONSE ? 6 : 4));
        const zdo = BuffaloZdo.readResponse(false, zdoResponseClusterId, zdoPayload);

        return {
            version,
            type,
            commandId,
            tsn,
            payload: {
                category,
                zdoClusterId: zdoResponseClusterId,
                zdo,
            },
        };
    } else {
        return {
            version,
            type,
            commandId,
            tsn,
            payload: readPayload(type, commandId, buf),
        };
    }
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

export interface ZBOSSFrame {
    version: number;
    type: FrameType;
    commandId: CommandId;
    tsn: number;
    payload: KeyValue & {zdoCluster?: ZdoClusterId; zdo?: GenericZdoResponse};
}

export function makeFrame(type: FrameType, commandId: CommandId, params: KeyValue): ZBOSSFrame {
    const frameDesc = getFrameDesc(type, commandId);
    const payload: KeyValue = {};
    for (const parameter of frameDesc) {
        // const options: BuffaloZclOptions = {payload};

        if (parameter.condition && !parameter.condition(params, undefined)) {
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
    };
}

function readPayload(type: FrameType, commandId: CommandId, buffalo: ZBOSSBuffaloZcl): KeyValue {
    const frameDesc = getFrameDesc(type, commandId);
    return buffalo.readByDesc(frameDesc);
}

function writePayload(type: FrameType, commandId: CommandId, payload: KeyValue, buffalo: ZBOSSBuffaloZcl): number {
    const frameDesc = getFrameDesc(type, commandId);
    return buffalo.writeByDesc(payload, frameDesc);
}
