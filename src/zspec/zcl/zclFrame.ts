import '../../utils/patchBigIntSerialization';

import {BuffaloZcl} from './buffaloZcl';
import {BuffaloZclDataType, DataType, Direction, FrameType, ParameterCondition} from './definition/enums';
import {FoundationCommandName} from './definition/foundation';
import {Status} from './definition/status';
import {BuffaloZclOptions, Cluster, ClusterName, Command, CustomClusters, ParameterDefinition} from './definition/tstype';
import * as Utils from './utils';
import {ZclHeader} from './zclHeader';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZclPayload = any;

const ListTypes: number[] = [
    BuffaloZclDataType.LIST_UINT8,
    BuffaloZclDataType.LIST_UINT16,
    BuffaloZclDataType.LIST_UINT24,
    BuffaloZclDataType.LIST_UINT32,
    BuffaloZclDataType.LIST_ZONEINFO,
];

export class ZclFrame {
    public readonly header: ZclHeader;
    public readonly payload: ZclPayload;
    public readonly cluster: Cluster;
    public readonly command: Command;

    private constructor(header: ZclHeader, payload: ZclPayload, cluster: Cluster, command: Command) {
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
        frameType: FrameType,
        direction: Direction,
        disableDefaultResponse: boolean,
        manufacturerCode: number | undefined,
        transactionSequenceNumber: number,
        commandKey: number | string,
        clusterKey: number | string,
        payload: ZclPayload,
        customClusters: CustomClusters,
        reservedBits = 0,
    ): ZclFrame {
        const cluster = Utils.getCluster(clusterKey, manufacturerCode, customClusters);
        const command: Command =
            frameType === FrameType.GLOBAL
                ? Utils.getGlobalCommand(commandKey)
                : direction === Direction.CLIENT_TO_SERVER
                  ? cluster.getCommand(commandKey)
                  : cluster.getCommandResponse(commandKey);

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
        const command = Utils.getFoundationCommand(this.command.ID);

        if (command.parseStrategy === 'repetitive') {
            for (const entry of this.payload) {
                for (const parameter of command.parameters) {
                    const options: BuffaloZclOptions = {};

                    if (!ZclFrame.conditionsValid(parameter, entry, null)) {
                        continue;
                    }

                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && typeof entry.dataType === 'number') {
                        // We need to grab the dataType to parse useDataType
                        options.dataType = entry.dataType;
                    }

                    buffalo.write(parameter.type, entry[parameter.name], options);
                }
            }
        } else if (command.parseStrategy === 'flat') {
            for (const parameter of command.parameters) {
                buffalo.write(parameter.type, this.payload[parameter.name], {});
            }
        } else {
            if (command.parseStrategy === 'oneof') {
                if (Utils.isFoundationDiscoverRsp(command.ID)) {
                    buffalo.writeUInt8(this.payload.discComplete);

                    for (const entry of this.payload.attrInfos) {
                        for (const parameter of command.parameters) {
                            buffalo.write(parameter.type, entry[parameter.name], {});
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

            if (this.payload[parameter.name] == undefined) {
                throw new Error(`Parameter '${parameter.name}' is missing`);
            }

            buffalo.write(parameter.type, this.payload[parameter.name], {});
        }
    }

    /**
     * Parsing
     */
    public static fromBuffer(clusterID: number, header: ZclHeader | undefined, buffer: Buffer, customClusters: CustomClusters): ZclFrame {
        if (!header) {
            throw new Error('Invalid ZclHeader.');
        }

        const buffalo = new BuffaloZcl(buffer, header.length);
        const cluster = Utils.getCluster(clusterID, header.manufacturerCode, customClusters);
        const command: Command = header.isGlobal
            ? Utils.getGlobalCommand(header.commandIdentifier)
            : header.frameControl.direction === Direction.CLIENT_TO_SERVER
              ? cluster.getCommand(header.commandIdentifier)
              : cluster.getCommandResponse(header.commandIdentifier);
        const payload = this.parsePayload(header, cluster, buffalo);

        return new ZclFrame(header, payload, cluster, command);
    }

    private static parsePayload(header: ZclHeader, cluster: Cluster, buffalo: BuffaloZcl): ZclPayload {
        if (header.isGlobal) {
            return this.parsePayloadGlobal(header, buffalo);
        } else if (header.isSpecific) {
            return this.parsePayloadCluster(header, cluster, buffalo);
        } else {
            throw new Error(`Unsupported frameType '${header.frameControl.frameType}'`);
        }
    }

    private static parsePayloadCluster(header: ZclHeader, cluster: Cluster, buffalo: BuffaloZcl): ZclPayload {
        const command =
            header.frameControl.direction === Direction.CLIENT_TO_SERVER
                ? cluster.getCommand(header.commandIdentifier)
                : cluster.getCommandResponse(header.commandIdentifier);
        const payload: ZclPayload = {};

        for (const parameter of command.parameters) {
            const options: BuffaloZclOptions = {payload};

            if (!this.conditionsValid(parameter, payload, buffalo.getBuffer().length - buffalo.getPosition())) {
                continue;
            }

            if (ListTypes.includes(parameter.type)) {
                const lengthParameter = command.parameters[command.parameters.indexOf(parameter) - 1];
                const length = payload[lengthParameter.name];

                if (typeof length === 'number') {
                    options.length = length;
                }
            }

            payload[parameter.name] = buffalo.read(parameter.type, options);
        }

        return payload;
    }

    private static parsePayloadGlobal(header: ZclHeader, buffalo: BuffaloZcl): ZclPayload {
        const command = Utils.getFoundationCommand(header.commandIdentifier);

        if (command.parseStrategy === 'repetitive') {
            const payload = [];

            while (buffalo.isMore()) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const entry: {[s: string]: any} = {};

                for (const parameter of command.parameters) {
                    const options: BuffaloZclOptions = {};

                    if (!this.conditionsValid(parameter, entry, buffalo.getBuffer().length - buffalo.getPosition())) {
                        continue;
                    }

                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && typeof entry.dataType === 'number') {
                        // We need to grab the dataType to parse useDataType
                        options.dataType = entry.dataType;

                        if (entry.dataType === DataType.CHAR_STR && entry.attrId === 65281) {
                            // [workaround] parse char str as Xiaomi struct
                            options.dataType = BuffaloZclDataType.MI_STRUCT;
                        }
                    }

                    entry[parameter.name] = buffalo.read(parameter.type, options);

                    // TODO: not needed, but temp workaroudn to make payload equal to that of zcl-packet
                    // XXX: is this still needed?
                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && entry.dataType === DataType.STRUCT) {
                        entry['structElms'] = entry.attrData;
                        entry['numElms'] = entry.attrData.length;
                    }
                }

                payload.push(entry);
            }

            return payload;
        } else if (command.parseStrategy === 'flat') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: {[s: string]: any} = {};

            for (const parameter of command.parameters) {
                payload[parameter.name] = buffalo.read(parameter.type, {});
            }

            return payload;
        } else {
            if (command.parseStrategy === 'oneof') {
                if (Utils.isFoundationDiscoverRsp(command.ID)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const payload: {discComplete: number; attrInfos: {[k: string]: any}[]} = {
                        discComplete: buffalo.readUInt8(),
                        attrInfos: [],
                    };

                    while (buffalo.isMore()) {
                        const entry: (typeof payload.attrInfos)[number] = {};

                        for (const parameter of command.parameters) {
                            entry[parameter.name] = buffalo.read(parameter.type, {});
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

    public static conditionsValid(parameter: ParameterDefinition, entry: ZclPayload, remainingBufferBytes: number | null): boolean {
        if (parameter.conditions) {
            for (const condition of parameter.conditions) {
                switch (condition.type) {
                    case ParameterCondition.STATUS_EQUAL: {
                        if ((entry.status as Status) !== condition.value) return false;
                        break;
                    }
                    case ParameterCondition.STATUS_NOT_EQUAL: {
                        if ((entry.status as Status) === condition.value) return false;
                        break;
                    }
                    case ParameterCondition.DIRECTION_EQUAL: {
                        if ((entry.direction as Direction) !== condition.value) return false;
                        break;
                    }
                    case ParameterCondition.BITMASK_SET: {
                        if ((entry[condition.param] & condition.mask) !== condition.mask) return false;
                        break;
                    }
                    case ParameterCondition.BITFIELD_ENUM: {
                        if (((entry[condition.param] >> condition.offset) & ((1 << condition.size) - 1)) !== condition.value) return false;
                        break;
                    }
                    case ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES: {
                        if (remainingBufferBytes != null && remainingBufferBytes < condition.value) return false;
                        break;
                    }
                    case ParameterCondition.DATA_TYPE_CLASS_EQUAL: {
                        if (Utils.getDataTypeClass(entry.dataType) !== condition.value) return false;
                        break;
                    }
                    case ParameterCondition.FIELD_EQUAL: {
                        if (entry[condition.field] !== condition.value) return false;
                        break;
                    }
                }
            }
        }

        return true;
    }

    public isCluster(clusterName: FoundationCommandName | ClusterName): boolean {
        return this.cluster.name === clusterName;
    }

    // List of commands is not completed, feel free to add more.
    public isCommand(commandName: FoundationCommandName | 'remove' | 'add' | 'write' | 'enrollReq' | 'checkin' | 'getAlarm' | 'arm'): boolean {
        return this.command.name === commandName;
    }
}
