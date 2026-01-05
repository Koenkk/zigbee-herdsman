import "../../utils/patchBigIntSerialization";

import {BuffaloZcl} from "./buffaloZcl";
import type {TClusterPayload, TFoundationPayload} from "./definition/clusters-types";
import {BuffaloZclDataType, DataType, Direction, FrameType, ParameterCondition} from "./definition/enums";
import type {FoundationCommandName} from "./definition/foundation";
import type {BuffaloZclOptions, Cluster, ClusterName, Command, CustomClusters, ParameterDefinition} from "./definition/tstype";
import * as Utils from "./utils";
import {ZclHeader} from "./zclHeader";

// biome-ignore lint/suspicious/noExplicitAny: API
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
        commandKey: number | string | Command,
        clusterKey: number | string | Cluster,
        payload: ZclPayload,
        customClusters: CustomClusters,
        reservedBits = 0,
    ): ZclFrame {
        const cluster = typeof clusterKey === "object" ? clusterKey : Utils.getCluster(clusterKey, manufacturerCode, customClusters);
        const command: Command =
            typeof commandKey === "object"
                ? commandKey
                : frameType === FrameType.GLOBAL
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

        if (command.parseStrategy === "repetitive") {
            for (const entry of this.payload) {
                for (const parameter of command.parameters) {
                    const options: BuffaloZclOptions = {};

                    if (!ZclFrame.conditionsValid(parameter, entry, undefined)) {
                        continue;
                    }

                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && typeof entry.dataType === "number") {
                        // We need to grab the dataType to parse useDataType
                        options.dataType = entry.dataType;
                    }

                    buffalo.write(parameter.type, entry[parameter.name], options);
                }
            }
        } else if (command.parseStrategy === "flat") {
            for (const parameter of command.parameters) {
                buffalo.write(parameter.type, this.payload[parameter.name], {});
            }
        } else {
            if (command.parseStrategy === "oneof") {
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
            if (!ZclFrame.conditionsValid(parameter, this.payload, undefined)) {
                continue;
            }

            // TODO: biome migration - safer
            if (this.payload[parameter.name] == null) {
                throw new Error(`Parameter '${parameter.name}' is missing`);
            }

            const valueToWrite = Utils.processParameterWrite(parameter, this.payload[parameter.name]);

            buffalo.write(parameter.type, valueToWrite, {});
        }
    }

    /**
     * Parsing
     */
    public static fromBuffer(clusterID: number, header: ZclHeader | undefined, buffer: Buffer, customClusters: CustomClusters): ZclFrame {
        if (!header) {
            throw new Error("Invalid ZclHeader.");
        }

        const buffalo = new BuffaloZcl(buffer, header.length);
        const cluster = Utils.getCluster(clusterID, header.manufacturerCode, customClusters);
        const command: Command = header.isGlobal
            ? Utils.getGlobalCommand(header.commandIdentifier)
            : header.frameControl.direction === Direction.CLIENT_TO_SERVER
              ? cluster.getCommand(header.commandIdentifier)
              : cluster.getCommandResponse(header.commandIdentifier);
        const payload = ZclFrame.parsePayload(header, cluster, buffalo);

        return new ZclFrame(header, payload, cluster, command);
    }

    private static parsePayload(header: ZclHeader, cluster: Cluster, buffalo: BuffaloZcl): ZclPayload {
        if (header.isGlobal) {
            return ZclFrame.parsePayloadGlobal(header, buffalo);
        }

        if (header.isSpecific) {
            return ZclFrame.parsePayloadCluster(header, cluster, buffalo);
        }

        throw new Error(`Unsupported frameType '${header.frameControl.frameType}'`);
    }

    private static parsePayloadCluster(header: ZclHeader, cluster: Cluster, buffalo: BuffaloZcl): ZclPayload {
        const command =
            header.frameControl.direction === Direction.CLIENT_TO_SERVER
                ? cluster.getCommand(header.commandIdentifier)
                : cluster.getCommandResponse(header.commandIdentifier);
        const payload: ZclPayload = {};

        for (const parameter of command.parameters) {
            const options: BuffaloZclOptions = {payload};

            if (!ZclFrame.conditionsValid(parameter, payload, buffalo.getBuffer().length - buffalo.getPosition())) {
                continue;
            }

            if (ListTypes.includes(parameter.type)) {
                const lengthParameter = command.parameters[command.parameters.indexOf(parameter) - 1];
                const length = payload[lengthParameter.name];

                if (typeof length === "number") {
                    options.length = length;
                }
            }

            try {
                const valueToProcess = buffalo.read(parameter.type, options);
                payload[parameter.name] = Utils.processParameterRead(parameter, valueToProcess);
            } catch (error) {
                throw new Error(`Cannot parse '${command.name}:${parameter.name}' (${(error as Error).message})`);
            }
        }

        return payload;
    }

    private static parsePayloadGlobal(header: ZclHeader, buffalo: BuffaloZcl): ZclPayload {
        const command = Utils.getFoundationCommand(header.commandIdentifier);

        if (command.parseStrategy === "repetitive") {
            const payload = [];

            while (buffalo.isMore()) {
                // biome-ignore lint/suspicious/noExplicitAny: API
                const entry: {[s: string]: any} = {};

                for (const parameter of command.parameters) {
                    const options: BuffaloZclOptions = {};

                    if (!ZclFrame.conditionsValid(parameter, entry, buffalo.getBuffer().length - buffalo.getPosition())) {
                        continue;
                    }

                    if (parameter.type === BuffaloZclDataType.USE_DATA_TYPE && typeof entry.dataType === "number") {
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
                        entry.structElms = entry.attrData;
                        entry.numElms = entry.attrData.length;
                    }
                }

                payload.push(entry);
            }

            return payload;
        }

        if (command.parseStrategy === "flat") {
            // biome-ignore lint/suspicious/noExplicitAny: API
            const payload: {[s: string]: any} = {};

            for (const parameter of command.parameters) {
                payload[parameter.name] = buffalo.read(parameter.type, {});
            }

            return payload;
        }

        if (command.parseStrategy === "oneof") {
            if (Utils.isFoundationDiscoverRsp(command.ID)) {
                // biome-ignore lint/suspicious/noExplicitAny: API
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

    /**
     * Utils
     */

    public static conditionsValid(parameter: ParameterDefinition, entry: ZclPayload, remainingBufferBytes: number | undefined): boolean {
        if (parameter.conditions) {
            for (const condition of parameter.conditions) {
                switch (condition.type) {
                    case ParameterCondition.FIELD_EQUAL: {
                        if (condition.reversed) {
                            if (entry[condition.field] === condition.value) {
                                return false;
                            }
                        } else if (entry[condition.field] !== condition.value) {
                            return false;
                        }
                        break;
                    }
                    case ParameterCondition.BITMASK_SET: {
                        if (condition.reversed) {
                            if ((entry[condition.param] & condition.mask) === condition.mask) {
                                return false;
                            }
                        } else if ((entry[condition.param] & condition.mask) !== condition.mask) {
                            return false;
                        }
                        break;
                    }
                    case ParameterCondition.BITFIELD_ENUM: {
                        if (((entry[condition.param] >> condition.offset) & ((1 << condition.size) - 1)) !== condition.value) {
                            return false;
                        }
                        break;
                    }
                    case ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES: {
                        if (remainingBufferBytes !== undefined && remainingBufferBytes < condition.value) {
                            return false;
                        }
                        break;
                    }
                    case ParameterCondition.DATA_TYPE_CLASS_EQUAL: {
                        if (Utils.getDataTypeClass(entry.dataType) !== condition.value) {
                            return false;
                        }
                        break;
                    }
                    case ParameterCondition.FIELD_GT: {
                        /*if (condition.reversed) {
                            if (entry[condition.field] >= condition.value) {
                                return false;
                            }
                        } else */
                        if (entry[condition.field] <= condition.value) {
                            return false;
                        }
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
    public isCommand(
        commandName: FoundationCommandName | "remove" | "add" | "write" | "enrollReq" | "checkin" | "getAlarm" | "arm" | "queryNextImageRequest",
    ): boolean {
        return this.command.name === commandName;
    }
}

export interface TZclFrame<Cl extends string, Co extends string> {
    readonly header: ZclHeader;
    readonly payload: TClusterPayload<Cl, Co>;
    readonly cluster: Cluster;
    readonly command: Command;
}

export interface TFoundationZclFrame<Co extends string> {
    readonly header: ZclHeader;
    readonly payload: TFoundationPayload<Co>;
    readonly cluster: Cluster;
    readonly command: Command;
}
