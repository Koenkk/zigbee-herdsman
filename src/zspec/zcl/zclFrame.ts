import assert from "node:assert";
import "../../utils/patchBigIntSerialization";

import {BuffaloZcl} from "./buffaloZcl";
import type {TClusterPayload, TFoundationPayload} from "./definition/clusters-types";
import {BuffaloZclDataType, type DataType, Direction, FrameType, ParameterCondition} from "./definition/enums";
import type {FoundationCommandName, FoundationDefinition} from "./definition/foundation";
import type {BuffaloZclOptions, Cluster, ClusterName, Command, CustomClusters, Parameter} from "./definition/tstype";
import * as Utils from "./utils";
import {ZclHeader} from "./zclHeader";

// biome-ignore lint/suspicious/noExplicitAny: API
type ZclPayload = any;

const LIST_TYPES: readonly (DataType | BuffaloZclDataType)[] = [
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
    public readonly command: Command | FoundationDefinition;

    private constructor(header: ZclHeader, payload: ZclPayload, cluster: Cluster, command: Command | FoundationDefinition) {
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
        commandKey: number | string | Command | FoundationDefinition,
        clusterKey: number | string | Cluster,
        payload: ZclPayload,
        customClusters: CustomClusters,
        reservedBits = 0,
    ): ZclFrame {
        const cluster = typeof clusterKey === "object" ? clusterKey : Utils.getCluster(clusterKey, manufacturerCode, customClusters);
        const command: Command | FoundationDefinition =
            typeof commandKey === "object"
                ? commandKey
                : frameType === FrameType.GLOBAL
                  ? Utils.getGlobalCommand(commandKey)
                  : direction === Direction.CLIENT_TO_SERVER
                    ? Utils.getClusterCommand(cluster, commandKey)
                    : Utils.getClusterCommandResponse(cluster, commandKey);

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
        assert("write" in this.command);

        this.command.write(buffalo, this.payload);
    }

    private writePayloadCluster(buffalo: BuffaloZcl): void {
        assert("parameters" in this.command);

        for (const parameter of this.command.parameters) {
            if (!ZclFrame.conditionsValid(parameter, this.payload, undefined)) {
                continue;
            }

            const paramPayload = this.payload[parameter.name];

            if (paramPayload == null) {
                // allow parameters with MINIMUM_REMAINING_BUFFER_BYTES conditions to be omitted similar to reception logic (without the value check)
                // should be needed only for off-spec handling (usually around backwards-compat issues)
                if (parameter.conditions?.some((c) => c.type === ParameterCondition.MINIMUM_REMAINING_BUFFER_BYTES)) {
                    continue;
                }

                throw new Error(`Parameter '${parameter.name}' is missing`);
            }

            const valueToWrite = Utils.processParameterWrite(parameter, paramPayload);

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
        const command: Command | FoundationDefinition = header.isGlobal
            ? Utils.getGlobalCommand(header.commandIdentifier)
            : header.frameControl.direction === Direction.CLIENT_TO_SERVER
              ? Utils.getClusterCommand(cluster, header.commandIdentifier)
              : Utils.getClusterCommandResponse(cluster, header.commandIdentifier);
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
                ? Utils.getClusterCommand(cluster, header.commandIdentifier)
                : Utils.getClusterCommandResponse(cluster, header.commandIdentifier);
        const payload: ZclPayload = {};

        for (const parameter of command.parameters) {
            const options: BuffaloZclOptions = {payload};

            if (!ZclFrame.conditionsValid(parameter, payload, buffalo.getBuffer().length - buffalo.getPosition())) {
                continue;
            }

            if (LIST_TYPES.includes(parameter.type)) {
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

        return command.parse(buffalo);
    }

    /**
     * Utils
     */

    public static conditionsValid(parameter: Parameter, entry: ZclPayload, remainingBufferBytes: number | undefined): boolean {
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
    readonly command: FoundationDefinition;
}
