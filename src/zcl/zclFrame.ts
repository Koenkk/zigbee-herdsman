import {Direction, Foundation, DataType, BuffaloZclDataType, Cluster} from './definition';
import * as Utils from './utils';
import BuffaloZcl from './buffaloZcl';
import {TsType as BuffaloTsType} from '../buffalo';
import * as TsType from './tstype';
import {TsType as DefinitionTsType, FrameType} from './definition';

const MINIMAL_FRAME_LENGTH = 3;

interface FrameControl {
    frameType: FrameType;
    manufacturerSpecific: boolean;
    direction: Direction;
    disableDefaultResponse: boolean;
}

// eslint-disable-next-line
type ZclPayload = any;

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
    public readonly ClusterID: number;

    private constructor(header: ZclHeader, payload: ZclPayload, clusterID: number) {
        this.Header = header;
        this.Payload = payload;
        this.ClusterID = clusterID;
    }

    /**
     * Creating
     */
    public static create(
        frameType: FrameType, direction: Direction, disableDefaultResponse: boolean, manufacturerCode: number, transactionSequenceNumber: number,
        commandKey: number | string, clusterID: number, payload: ZclPayload
    ): ZclFrame {
        const command = frameType === FrameType.GLOBAL ?
            Utils.getGlobalCommand(commandKey) :
            Utils.getSpecificCommand(clusterID, direction, commandKey);

        const header: ZclHeader = {
            frameControl: {
                frameType, direction, disableDefaultResponse,
                manufacturerSpecific: manufacturerCode !== null,
            },
            transactionSequenceNumber,
            manufacturerCode,
            commandIdentifier: command.ID,
        }

        return new ZclFrame(header, payload, clusterID);
    }

    public toBuffer(): Buffer {
        const buffer = Buffer.alloc(250);
        let position = this.writeHeader(buffer);

        if (this.Header.frameControl.frameType === FrameType.GLOBAL) {
            position = this.writePayloadGlobal(buffer, position);
        } else if (this.Header.frameControl.frameType === FrameType.SPECIFIC) {
            position = this.writePayloadCluster(buffer, position);
        } else {
            throw new Error(`Frametype '${this.Header.frameControl.frameType}' not valid`)
        }

        return buffer.slice(0, position);
    }

    private writeHeader(buffer: Buffer): number {
        let position = 0;

        const frameControl = (
            (this.Header.frameControl.frameType & 0x03) |
            (((this.Header.frameControl.manufacturerSpecific ? 1 : 0) << 2) & 0x04) |
            ((this.Header.frameControl.direction << 3) & 0x08) |
            (((this.Header.frameControl.disableDefaultResponse ? 1 : 0) << 4) & 0x10)
        )

        buffer.writeUInt8(frameControl, position);
        position++;

        if (this.Header.frameControl.manufacturerSpecific) {
            buffer.writeUInt16LE(this.Header.manufacturerCode, position);
            position += 2;
        }

        buffer.writeUInt8(this.Header.transactionSequenceNumber, position);
        position++;
        buffer.writeUInt8(this.Header.commandIdentifier, position);
        position++;

        return position;
    }

    private writePayloadGlobal(buffer: Buffer, position: number): number {
        const command = Object.values(Foundation).find((c): boolean => c.ID === this.Header.commandIdentifier);

        if (command.parseStrategy === 'repetitive') {
            for (let entry of this.Payload) {
                for (let parameter of command.parameters) {
                    const options: TsType.BuffaloZclOptions = {};

                    if (!ZclFrame.conditionsValid(parameter, entry)) {
                        continue;
                    }

                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && typeof entry.dataType === 'number') {
                        // We need to grab the dataType to parse useDataType
                        options.dataType = DataType[entry.dataType];
                    }

                    const typeStr = ZclFrame.getDataTypeString(parameter.type);
                    position += BuffaloZcl.write(typeStr, buffer, position, entry[parameter.name], options);
                }
            }
        } else if (command.parseStrategy === 'flat') {
            for (let parameter of command.parameters) {
                position += BuffaloZcl.write(DataType[parameter.type], buffer, position, this.Payload[parameter.name], {});
            }
        } else {
            /* istanbul ignore else */
            if (command.parseStrategy === 'oneof') {
                /* istanbul ignore else */
                if (command === Foundation.discoverRsp) {
                    position += BuffaloZcl.writeUInt8(buffer, position, this.Payload.discComplete);

                    for (let entry of this.Payload.attrInfos) {
                        for (let parameter of command.parameters) {
                            position += BuffaloZcl.write(DataType[parameter.type], buffer, position, entry[parameter.name], {});
                        }
                    }
                }
            }
        }

        return position;
    }

    private writePayloadCluster(buffer: Buffer, position: number): number {
        const command = Utils.getSpecificCommand(this.ClusterID, this.Header.frameControl.direction, this.Header.commandIdentifier);
        for (let parameter of command.parameters) {
            const typeStr = ZclFrame.getDataTypeString(parameter.type);
            position += BuffaloZcl.write(typeStr, buffer, position, this.Payload[parameter.name], {});
        }

        return position;
    }

    /**
     * Parsing
     */
    public static fromBuffer(clusterID: number, buffer: Buffer): ZclFrame {
        if (buffer.length < MINIMAL_FRAME_LENGTH) {
            throw new Error("ZclFrame length is lower than minimal length");
        }

        const {position, header} = this.parseHeader(buffer);

        const payloadBuffer = buffer.slice(position, buffer.length);
        const payload = this.parsePayload(header, clusterID, payloadBuffer);

        return new ZclFrame(header, payload, clusterID);
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
        const command = Utils.getSpecificCommand(clusterID, header.frameControl.direction, header.commandIdentifier)
        const payload: ZclPayload = {};

        let position = 0;
        for (let parameter of command.parameters) {
            const options: BuffaloTsType.Options = {};

            if (ListTypes.includes(parameter.type)) {
                const lengthParameter = command.parameters[command.parameters.indexOf(parameter) - 1];
                const length = payload[lengthParameter.name];

                /* istanbul ignore else */
                if (typeof length === 'number') {
                    options.length = length;
                }
            }

            const typeStr = ZclFrame.getDataTypeString(parameter.type);
            const result = BuffaloZcl.read(typeStr, buffer, position, options);
            payload[parameter.name] = result.value;
            position += result.length;
        }

        return payload;
    };

    private static parsePayloadGlobal(header: ZclHeader, buffer: Buffer): ZclPayload {
        const command = Object.values(Foundation).find((c): boolean => c.ID === header.commandIdentifier);

        if (command.parseStrategy === 'repetitive') {
            const payload = [];

            for (let position = 0; position < buffer.length; position) {
                const entry: {[s: string]: BuffaloTsType.Value} = {};

                for (let parameter of command.parameters) {
                    const options: TsType.BuffaloZclOptions = {};

                    if (!this.conditionsValid(parameter, entry)) {
                        continue;
                    }

                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && typeof entry.dataType === 'number') {
                        // We need to grab the dataType to parse useDataType
                        options.dataType = DataType[entry.dataType];

                        if (entry.dataType === DataType.charStr && entry.hasOwnProperty('attrId')) {
                            // For Xiaomi struct parsing we need to pass the attributeID.
                            options.attrId = entry.attrId;
                        }
                    }

                    const typeStr = DataType[parameter.type] != null ? DataType[parameter.type] : BuffaloZclDataType[parameter.type];
                    const result = BuffaloZcl.read(typeStr, buffer, position, options);
                    entry[parameter.name] = result.value;
                    position += result.length;

                    // TODO: not needed, but temp workaroudn to make payload equal to that of zcl-packet
                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && entry.dataType === DataType.struct) {
                        entry['structElms'] = entry.attrData;
                        entry['numElms'] = entry.attrData.length;
                    }
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

            return payload;
        } else {
            /* istanbul ignore else */
            if (command.parseStrategy === 'oneof') {
                /* istanbul ignore else */
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

    /**
     * Utils
     */
    private static getDataTypeString(dataType: DataType | BuffaloZclDataType): string {
        return DataType[dataType] != null ? DataType[dataType] : BuffaloZclDataType[dataType];
    }

    private static conditionsValid(parameter: DefinitionTsType.FoundationParameterDefinition, entry: ZclPayload): boolean {
        if (parameter.conditions) {
            const failedCondition = parameter.conditions.find((condition): boolean => {
                if (condition.type === 'statusEquals') {
                    return entry.status !== condition.value;
                } else if (condition.type == 'statusNotEquals') {
                    return entry.status === condition.value;
                } else if (condition.type == 'directionEquals') {
                    return entry.direction !== condition.value;
                } else  {
                    /* istanbul ignore else */
                    if (condition.type == 'dataTypeValueTypeEquals') {
                        return Utils.IsDataTypeAnalogOrDiscrete(entry.dataType) !== condition.value;
                    }
                }
            });

            if (failedCondition) {
                return false;
            }
        }

        return true;
    }

    public getCluster(): TsType.Cluster {
        return Utils.getCluster(this.ClusterID);
    }

    public getCommand(): TsType.Command {
        return this.Header.frameControl.frameType === FrameType.GLOBAL ?
            Utils.getGlobalCommand(this.Header.commandIdentifier) :
            Utils.getSpecificCommand(this.ClusterID, this.Header.frameControl.direction, this.Header.commandIdentifier);
    }
}

export default ZclFrame;