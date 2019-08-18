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
        frameType: FrameType, direction: Direction, disableDefaultResponse: boolean, manufacturerCode: number,
        transactionSequenceNumber: number, commandKey: number | string, clusterID: number, payload: ZclPayload
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
        };

        return new ZclFrame(header, payload, clusterID);
    }

    public toBuffer(): Buffer {
        const buffalo = new BuffaloZcl(Buffer.alloc(250));
        this.writeHeader(buffalo);

        if (this.Header.frameControl.frameType === FrameType.GLOBAL) {
            this.writePayloadGlobal(buffalo);
        } else if (this.Header.frameControl.frameType === FrameType.SPECIFIC) {
            this.writePayloadCluster(buffalo);
        } else {
            throw new Error(`Frametype '${this.Header.frameControl.frameType}' not valid`);
        }

        return buffalo.getBuffer().slice(0, buffalo.getPosition());
    }

    private writeHeader(buffalo: BuffaloZcl): void {
        const frameControl = (
            (this.Header.frameControl.frameType & 0x03) |
            (((this.Header.frameControl.manufacturerSpecific ? 1 : 0) << 2) & 0x04) |
            ((this.Header.frameControl.direction << 3) & 0x08) |
            (((this.Header.frameControl.disableDefaultResponse ? 1 : 0) << 4) & 0x10)
        );

        buffalo.writeUInt8(frameControl);

        if (this.Header.frameControl.manufacturerSpecific) {
            buffalo.writeUInt16(this.Header.manufacturerCode);
        }

        buffalo.writeUInt8(this.Header.transactionSequenceNumber);
        buffalo.writeUInt8(this.Header.commandIdentifier);
    }

    private writePayloadGlobal(buffalo: BuffaloZcl): void {
        const command = Object.values(Foundation).find((c): boolean => c.ID === this.Header.commandIdentifier);

        if (command.parseStrategy === 'repetitive') {
            for (const entry of this.Payload) {
                for (const parameter of command.parameters) {
                    const options: TsType.BuffaloZclOptions = {};

                    if (!ZclFrame.conditionsValid(parameter, entry)) {
                        continue;
                    }

                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && typeof entry.dataType === 'number') {
                        // We need to grab the dataType to parse useDataType
                        options.dataType = DataType[entry.dataType];
                    }

                    const typeStr = ZclFrame.getDataTypeString(parameter.type);
                    buffalo.write(typeStr, entry[parameter.name], options);
                }
            }
        } else if (command.parseStrategy === 'flat') {
            for (const parameter of command.parameters) {
                buffalo.write(DataType[parameter.type], this.Payload[parameter.name], {});
            }
        } else {
            /* istanbul ignore else */
            if (command.parseStrategy === 'oneof') {
                /* istanbul ignore else */
                if (command === Foundation.discoverRsp) {
                    buffalo.writeUInt8(this.Payload.discComplete);

                    for (const entry of this.Payload.attrInfos) {
                        for (const parameter of command.parameters) {
                            buffalo.write(DataType[parameter.type], entry[parameter.name], {});
                        }
                    }
                }
            }
        }
    }

    private writePayloadCluster(buffalo: BuffaloZcl): void {
        const command = Utils.getSpecificCommand(this.ClusterID, this.Header.frameControl.direction, this.Header.commandIdentifier);
        for (const parameter of command.parameters) {
            const typeStr = ZclFrame.getDataTypeString(parameter.type);
            buffalo.write(typeStr, this.Payload[parameter.name], {});
        }
    }

    /**
     * Parsing
     */
    public static fromBuffer(clusterID: number, buffer: Buffer): ZclFrame {
        if (buffer.length < MINIMAL_FRAME_LENGTH) {
            throw new Error("ZclFrame length is lower than minimal length");
        }

        const buffalo = new BuffaloZcl(buffer);
        const header = this.parseHeader(buffalo);
        const payload = this.parsePayload(header, clusterID, buffalo);

        return new ZclFrame(header, payload, clusterID);
    }

    private static parseHeader(buffalo: BuffaloZcl): ZclHeader {
        const frameControlValue = buffalo.readUInt8();
        const frameControl = {
            frameType: frameControlValue & 0x03,
            manufacturerSpecific: ((frameControlValue >> 2) & 0x01) === 1,
            direction: (frameControlValue >> 3) & 0x01,
            disableDefaultResponse: ((frameControlValue >> 4) & 0x01) === 1,
        };

        let manufacturerCode = null;
        if (frameControl.manufacturerSpecific) {
            manufacturerCode = buffalo.readUInt16();
        }

        const transactionSequenceNumber = buffalo.readUInt8();
        const commandIdentifier = buffalo.readUInt8();

        return {frameControl, transactionSequenceNumber, manufacturerCode, commandIdentifier};
    }

    private static parsePayload(header: ZclHeader, clusterID: number, buffalo: BuffaloZcl): ZclPayload {
        if (header.frameControl.frameType === FrameType.GLOBAL) {
            return this.parsePayloadGlobal(header, buffalo);
        } else if (header.frameControl.frameType === FrameType.SPECIFIC) {
            return this.parsePayloadCluster(header, clusterID, buffalo);
        } else {
            throw new Error(`Unsupported frameType '${header.frameControl.frameType}'`);
        }
    }

    private static parsePayloadCluster(header: ZclHeader, clusterID: number,  buffalo: BuffaloZcl): ZclPayload {
        const command = Utils.getSpecificCommand(clusterID, header.frameControl.direction, header.commandIdentifier);
        const payload: ZclPayload = {};

        for (const parameter of command.parameters) {
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
            payload[parameter.name] = buffalo.read(typeStr, options);
        }

        return payload;
    };

    private static parsePayloadGlobal(header: ZclHeader, buffalo: BuffaloZcl): ZclPayload {
        const command = Object.values(Foundation).find((c): boolean => c.ID === header.commandIdentifier);

        if (command.parseStrategy === 'repetitive') {
            const payload = [];

            while (buffalo.getPosition() < buffalo.getBuffer().length) {
                const entry: {[s: string]: BuffaloTsType.Value} = {};

                for (const parameter of command.parameters) {
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
                    entry[parameter.name] = buffalo.read(typeStr, options);

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

            for (const parameter of command.parameters) {
                payload[parameter.name] = buffalo.read(DataType[parameter.type], {});
            }

            return payload;
        } else {
            /* istanbul ignore else */
            if (command.parseStrategy === 'oneof') {
                /* istanbul ignore else */
                if (command === Foundation.discoverRsp) {
                    const payload: {[s: string]: BuffaloTsType.Value} = {};
                    payload.discComplete = buffalo.readUInt8();
                    payload.attrInfos = [];

                    while (buffalo.getPosition() < buffalo.getBuffer().length) {
                        const entry: {[s: string]: BuffaloTsType.Value} = {};

                        for (const parameter of command.parameters) {
                            entry[parameter.name] = buffalo.read(DataType[parameter.type], {});
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