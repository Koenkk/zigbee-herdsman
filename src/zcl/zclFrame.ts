import {Direction, Foundation, DataType, BuffaloZclDataType} from './definition';
import ZclHeader from './zclHeader';
import * as Utils from './utils';
import BuffaloZcl from './buffaloZcl';
import {TsType as BuffaloTsType} from '../buffalo';
import * as TsType from './tstype';
import {TsType as DefinitionTsType, FrameType} from './definition';
import {CustomClusters} from './definition/tstype';

// eslint-disable-next-line
type ZclPayload = any;

const ListTypes: number[] = [
    BuffaloZclDataType.LIST_UINT8,
    BuffaloZclDataType.LIST_UINT16,
    BuffaloZclDataType.LIST_UINT24,
    BuffaloZclDataType.LIST_UINT32,
    BuffaloZclDataType.LIST_ZONEINFO,
];

class ZclFrame {
    public readonly header: ZclHeader;
    public readonly payload: ZclPayload;
    public readonly cluster: TsType.Cluster;
    public readonly command: TsType.Command;

    private constructor(header: ZclHeader, payload: ZclPayload, cluster: TsType.Cluster, command: TsType.Command) {
        this.header = header;
        this.payload = payload;
        this.cluster = cluster;
        this.command = command;
    }

    public toString(): string {
        return JSON.stringify({header: this.header, payload: this.payload, command: this.command});
    }

    /**
     * Creating
     */
    public static create(
        frameType: FrameType, direction: Direction, disableDefaultResponse: boolean, manufacturerCode: number | null,
        transactionSequenceNumber: number, commandKey: number | string, clusterKey: number | string,
        payload: ZclPayload, customClusters: CustomClusters, reservedBits = 0
    ): ZclFrame {
        const cluster = Utils.getCluster(clusterKey, manufacturerCode, customClusters);
        let command: TsType.Command = null;
        if (frameType === FrameType.GLOBAL) {
            command = Utils.getGlobalCommand(commandKey);
        } else {
            command = direction === Direction.CLIENT_TO_SERVER ?
                cluster.getCommand(commandKey) : cluster.getCommandResponse(commandKey);
        }

        const header = new ZclHeader(
            {reservedBits, frameType, direction, disableDefaultResponse, manufacturerSpecific: manufacturerCode != null},
            manufacturerCode,
            transactionSequenceNumber,
            command.ID,
        );

        return new ZclFrame(header, payload, cluster, command);
    }

    public toBuffer(): Buffer {
        const buffalo = new BuffaloZcl(Buffer.alloc(250));
        this.header.write(buffalo);

        if (this.header.isGlobal) {
            this.writePayloadGlobal(buffalo);
        } else if (this.header.isSpecific) {
            this.writePayloadCluster(buffalo);
        } else {
            throw new Error(`Frametype '${this.header.frameControl.frameType}' not valid`);
        }

        return buffalo.getWritten();
    }

    private writePayloadGlobal(buffalo: BuffaloZcl): void {
        const command = Object.values(Foundation).find((c): boolean => c.ID === this.command.ID);

        if (command.parseStrategy === 'repetitive') {
            for (const entry of this.payload) {
                for (const parameter of command.parameters) {
                    const options: TsType.BuffaloZclOptions = {};

                    if (!ZclFrame.conditionsValid(parameter, entry, null)) {
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
                buffalo.write(DataType[parameter.type], this.payload[parameter.name], {});
            }
        } else {
            /* istanbul ignore else */
            if (command.parseStrategy === 'oneof') {
                /* istanbul ignore else */
                if ([Foundation.discoverRsp, Foundation.discoverCommandsRsp,
                    Foundation.discoverCommandsGenRsp, Foundation.discoverExtRsp].includes(command)) {
                    buffalo.writeUInt8(this.payload.discComplete);

                    for (const entry of this.payload.attrInfos) {
                        for (const parameter of command.parameters) {
                            buffalo.write(DataType[parameter.type], entry[parameter.name], {});
                        }
                    }
                }
            }
        }
    }

    private writePayloadCluster(buffalo: BuffaloZcl): void {
        for (const parameter of this.command.parameters) {
            if (!ZclFrame.conditionsValid(parameter, this.payload, null)) {
                continue;
            }

            if (!this.payload.hasOwnProperty(parameter.name)) {
                throw new Error(`Parameter '${parameter.name}' is missing`);
            }

            const typeStr = ZclFrame.getDataTypeString(parameter.type);
            buffalo.write(typeStr, this.payload[parameter.name], {});
        }
    }

    /**
     * Parsing
     */
    public static fromBuffer(clusterID: number, header: ZclHeader, buffer: Buffer, customClusters: CustomClusters): ZclFrame {
        if (!header) {
            throw new Error("Invalid ZclHeader.");
        }

        const buffalo = new BuffaloZcl(buffer, header.length);
        const cluster = Utils.getCluster(clusterID, header.manufacturerCode, customClusters);

        let command: TsType.Command = null;
        if (header.isGlobal) {
            command = Utils.getGlobalCommand(header.commandIdentifier);
        } else {
            command = header.frameControl.direction === Direction.CLIENT_TO_SERVER ?
                cluster.getCommand(header.commandIdentifier) : cluster.getCommandResponse(header.commandIdentifier);
        }

        const payload = this.parsePayload(header, cluster, buffalo);

        return new ZclFrame(header, payload, cluster, command);
    }

    private static parsePayload(header: ZclHeader, cluster: TsType.Cluster, buffalo: BuffaloZcl): ZclPayload {
        if (header.isGlobal) {
            return this.parsePayloadGlobal(header, buffalo);
        } else if (header.isSpecific) {
            return this.parsePayloadCluster(header, cluster, buffalo);
        } else {
            throw new Error(`Unsupported frameType '${header.frameControl.frameType}'`);
        }
    }

    private static parsePayloadCluster(header: ZclHeader, cluster: TsType.Cluster,  buffalo: BuffaloZcl): ZclPayload {
        const command = header.frameControl.direction === Direction.CLIENT_TO_SERVER ?
            cluster.getCommand(header.commandIdentifier) : cluster.getCommandResponse(header.commandIdentifier);
        const payload: ZclPayload = {};

        for (const parameter of command.parameters) {
            const options: BuffaloTsType.Options = {payload};

            if (!this.conditionsValid(parameter, payload, buffalo.getBuffer().length - buffalo.getPosition())) {
                continue;
            }

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
    }

    private static parsePayloadGlobal(header: ZclHeader, buffalo: BuffaloZcl): ZclPayload {
        const command = Object.values(Foundation).find((c): boolean => c.ID === header.commandIdentifier);

        if (command.parseStrategy === 'repetitive') {
            const payload = [];

            while (buffalo.isMore()) {
                const entry: {[s: string]: BuffaloTsType.Value} = {};

                for (const parameter of command.parameters) {
                    const options: TsType.BuffaloZclOptions = {};

                    if (!this.conditionsValid(parameter, entry, buffalo.getBuffer().length - buffalo.getPosition())) {
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

                    const typeStr = DataType[parameter.type] != null ?
                        DataType[parameter.type] : BuffaloZclDataType[parameter.type];
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
                if ([Foundation.discoverRsp, Foundation.discoverCommandsRsp,
                    Foundation.discoverCommandsGenRsp, Foundation.discoverExtRsp].includes(command)) {
                    const payload: {[s: string]: BuffaloTsType.Value} = {};
                    payload.discComplete = buffalo.readUInt8();
                    payload.attrInfos = [];

                    while (buffalo.isMore()) {
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

    private static conditionsValid(
        parameter: DefinitionTsType.ParameterDefinition,
        entry: ZclPayload,
        remainingBufferBytes: number
    ): boolean {
        if (parameter.conditions) {
            const failedCondition = parameter.conditions.find((condition): boolean => {
                if (condition.type === 'statusEquals') {
                    return entry.status !== condition.value;
                } else if (condition.type == 'statusNotEquals') {
                    return entry.status === condition.value;
                } else if (condition.type == 'directionEquals') {
                    return entry.direction !== condition.value;
                } else if(condition.type == 'bitMaskSet') {
                    return (entry[condition.param] & condition.mask) !== condition.mask;
                } else if(condition.type == 'bitFieldEnum') {
                    return ((entry[condition.param] >> condition.offset) & ((1<<condition.size)-1)) !== condition.value;
                } else if (remainingBufferBytes != null && condition.type == 'minimumRemainingBufferBytes') {
                    return remainingBufferBytes < (condition.value as number);
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

    // List of clusters is not completed, feel free to add more.
    public isCluster(
        clusterName: 'genTime' | 'genAnalogInput' | 'genBasic' | 'genGroups' | 'genPollCtrl' | 'ssIasZone'
    ): boolean {
        return this.cluster.name === clusterName;
    }

    // List of commands is not completed, feel free to add more.
    public isCommand(
        commandName: 'read' | 'report' | 'readRsp' | 'remove' | 'add' | 'write' | 'enrollReq' | 'configReport' |
            'checkin' | 'writeRsp'
    ): boolean {
        return this.command.name === commandName;
    }
}

export default ZclFrame;
