import {Direction, Foundation, DataType, BuffaloZclDataType, Cluster} from './definition';
import BuffaloZcl from './buffaloZcl';
import {TsType as BuffaloTsType} from '../buffalo';
import * as Utils from './definition/utils';

const MINIMAL_FRAME_LENGTH = 3;

enum FrameType {
    GLOBAL = 0,
    SPECIFIC = 1,
}

interface FrameControl {
    frameType: FrameType;
    manufacturerSpecific: boolean;
    direction: Direction;
    disableDefaultResponse: boolean;
}

type ZclPayload = number[] | {[s: string]: number | string};

interface ZclHeader {
    frameControl: FrameControl;
    manufacturerCode: number;
    transactionSequenceNumber: number;
    commandIdentifier: number;
}

const ListTypes: number[] = [
    BuffaloZclDataType.LIST_UINT8,
    BuffaloZclDataType.LIST_UINT16,
    BuffaloZclDataType.LIST_UINT24,
    BuffaloZclDataType.LIST_UINT32,
    BuffaloZclDataType.LIST_ZONEINFO,
];

class ZclFrame {
    public readonly Header: ZclHeader;
    public readonly Payload: ZclPayload;

    private constructor(header: ZclHeader, payload: ZclPayload) {
        this.Header = header;
        this.Payload = payload;
    }

    public static fromBuffer(clusterID: number, buffer: Buffer): ZclFrame {
        if (buffer.length < MINIMAL_FRAME_LENGTH) {
            throw new Error("ZclFrame length is lower than minimal length");
        }

        const {position, header} = this.parseHeader(buffer);

        const payloadBuffer = buffer.slice(position, buffer.length);
        const payload = this.parsePayload(header, clusterID, payloadBuffer);

        return new ZclFrame(header, payload);
    }

    private static parseHeader(buffer: Buffer): {position: number; header: ZclHeader} {
        let position = 0;

        const frameControlValue = buffer.readUInt8(position);
        position++;
        const frameControl = {
            frameType: frameControlValue & 0x03,
            manufacturerSpecific: ((frameControlValue >> 2) & 0x01) === 1,
            direction: (frameControlValue >> 3) & 0x01,
            disableDefaultResponse: ((frameControlValue >> 4) & 0x01) === 1,
        }

        let manufacturerCode = null;
        if (frameControl.manufacturerSpecific) {
            manufacturerCode = buffer.readUInt16LE(position);
            position += 2;
        }

        const transactionSequenceNumber = buffer.readUInt8(position);
        position++;

        const commandIdentifier = buffer.readUInt8(position);
        position++;

        const header = {frameControl, transactionSequenceNumber, manufacturerCode, commandIdentifier};
        return {position, header};
    }

    private static parsePayload(header: ZclHeader, clusterID: number, buffer: Buffer): ZclPayload {
        if (header.frameControl.frameType === FrameType.GLOBAL) {
            return this.parsePayloadGlobal(header, buffer);
        } else if (header.frameControl.frameType === FrameType.SPECIFIC) {
            return this.parsePayloadCluster(header, clusterID, buffer);
        } else {
            throw new Error(`Unsupported frameType '${header.frameControl.frameType}'`);
        }
    }

    private static parsePayloadCluster(header: ZclHeader, clusterID: number, buffer: Buffer): ZclPayload {
        const cluster = Object.values(Cluster).find((c): boolean => c.ID === clusterID);
        const commands = header.frameControl.direction === Direction.CLIENT_TO_SERVER ? cluster.commands : cluster.commandsResponse;
        const command = Object.values(commands).find((c): boolean => c.ID === header.commandIdentifier);
        const payload: ZclPayload = {};

        let position = 0;
        for (let parameter of command.parameters) {
            const options: BuffaloTsType.Options = {};

            if (ListTypes.includes(parameter.type)) {
                const lengthParameter = command.parameters[command.parameters.indexOf(parameter) - 1];
                options.length = payload[lengthParameter.name];
            }

            const typeStr = DataType[parameter.type] != null ? DataType[parameter.type] : BuffaloZclDataType[parameter.type];
            const result = BuffaloZcl.read(typeStr, buffer, position, options);
            payload[parameter.name] = result.value;
            position += result.length;
        }

        return payload;
    };

    private static parsePayloadGlobal(header: ZclHeader, buffer: Buffer): any {
        if (header.frameControl.manufacturerSpecific) {
            throw new Error(`Global commands are not supported for manufacturer specific commands`);
        }

        const command = Object.values(Foundation).find((c): boolean => c.ID === header.commandIdentifier);

        if (command.parseStrategy === 'repetitive') {
            const payload = [];

            for (let position = 0; position < buffer.length; position) {
                const entry: {[s: string]: BuffaloTsType.Value} = {};

                for (let parameter of command.parameters) {
                    const options: BuffaloTsType.Options = {};

                    if (parameter.conditions) {
                        const failedCondition = parameter.conditions.map((condition): boolean => {
                            if (condition.type === 'statusEquals') {
                                return entry.status !== condition.value;
                            } else if (condition.type == 'statusNotEquals') {
                                return entry.status === condition.value;
                            } else if (condition.type == 'directionEquals') {
                                return entry.direction !== condition.value;
                            } else if (condition.type == 'dataTypeValueTypeEquals') {
                                return Utils.IsDataTypeAnalogOrDiscrete(entry.dataType) !== condition.value;
                            }
                        }).find((condition): boolean => condition === false);

                        if (failedCondition) {
                            continue;
                        }
                    }

                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && typeof entry.dataType === 'number') {
                        // We need to grab the dataType to parse useDataType
                        options.dataType = DataType[entry.dataType];
                    }

                    const typeStr = DataType[parameter.type] != null ? DataType[parameter.type] : BuffaloZclDataType[parameter.type];
                    const result = BuffaloZcl.read(typeStr, buffer, position, options);
                    entry[parameter.name] = result.value;
                    position += result.length;
                }

                payload.push(entry);
            }

            return payload;
        } else if (command.parseStrategy === 'flat') {
            const payload: {[s: string]: BuffaloTsType.Value} = {};
            let position = 0;

            for (let parameter of command.parameters) {
                const result = BuffaloZcl.read(DataType[parameter.type], buffer, position, {});
                payload[parameter.name] = result.value;
                position += result.length;
            }
        } else if (command.parseStrategy === 'oneof') {
            if (command === Foundation.discoverRsp) {
                const payload: {[s: string]: BuffaloTsType.Value} = {};
                payload.discComplete = buffer.readUInt8(0);
                payload.attrInfos = [];

                for (let position = 1; position < buffer.length; position) {
                    const entry: {[s: string]: BuffaloTsType.Value} = {};

                    for (let parameter of command.parameters) {
                        const result = BuffaloZcl.read(DataType[parameter.type], buffer, position, {});
                        entry[parameter.name] = result.value;
                        position += result.length;
                    }

                    payload.attrInfos.push(entry);
                }

                return payload;
            }
        }
    }
}

export default ZclFrame;