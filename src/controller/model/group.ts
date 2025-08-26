import assert from "node:assert";
import {logger} from "../../utils/logger";
import * as Zcl from "../../zspec/zcl";
import type {TFoundation} from "../../zspec/zcl/definition/clusters-types";
import type {CustomClusters} from "../../zspec/zcl/definition/tstype";
import zclTransactionSequenceNumber from "../helpers/zclTransactionSequenceNumber";
import type {
    ClusterOrRawAttributeKeys,
    ClusterOrRawPayload,
    DatabaseEntry,
    KeyValue,
    PartialClusterOrRawWriteAttributes,
    TCustomCluster,
} from "../tstype";
import Device from "./device";
import type Endpoint from "./endpoint";
import Entity from "./entity";
import {ZigbeeEntity} from "./zigbeeEntity";

const NS = "zh:controller:group";

interface Options {
    manufacturerCode?: number;
    direction?: Zcl.Direction;
    srcEndpoint?: number;
    reservedBits?: number;
    transactionSequenceNumber?: number;
}

interface OptionsWithDefaults extends Options {
    direction: Zcl.Direction;
    reservedBits: number;
}

export class Group extends ZigbeeEntity {
    private databaseID: number;
    public readonly groupID: number;
    private readonly _members: Endpoint[];
    #customClusters: [input: CustomClusters, output: CustomClusters];
    // Can be used by applications to store data.
    public readonly meta: KeyValue;

    // This lookup contains all groups that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static readonly groups: Map<number /* groupID */, Group> = new Map();
    private static loadedFromDatabase = false;

    /** Member endpoints with valid devices (not unknown/deleted) */
    get members(): Endpoint[] {
        return this._members.filter((e) => e.getDevice() !== undefined);
    }

    /** List of server / client custom clusters common to all devices in the group */
    get customClusters(): [input: CustomClusters, output: CustomClusters] {
        return this.#customClusters;
    }

    private constructor(databaseID: number, groupID: number, members: Endpoint[], meta: KeyValue) {
        super();
        this.databaseID = databaseID;
        this.groupID = groupID;
        this._members = members;
        this.meta = meta;
        this.#customClusters = this.#identifyCustomClusters();
    }

    /*
     * CRUD
     */

    /**
     * Reset runtime lookups.
     */
    public static resetCache(): void {
        Group.groups.clear();
        Group.loadedFromDatabase = false;
    }

    private static fromDatabaseEntry(entry: DatabaseEntry): Group {
        // db is expected to never contain duplicate, so no need for explicit check
        const members: Endpoint[] = [];

        for (const member of entry.members) {
            const device = Device.byIeeeAddr(member.deviceIeeeAddr);

            if (device) {
                const endpoint = device.getEndpoint(member.endpointID);

                if (endpoint) {
                    members.push(endpoint);
                }
            }
        }

        return new Group(entry.id, entry.groupID, members, entry.meta);
    }

    private toDatabaseRecord(): DatabaseEntry {
        const members: DatabaseEntry["members"] = [];

        for (const member of this._members) {
            const device = member.getDevice();

            if (device) {
                members.push({deviceIeeeAddr: device.ieeeAddr, endpointID: member.ID});
            }
        }

        return {id: this.databaseID, type: "Group", groupID: this.groupID, members, meta: this.meta};
    }

    private static loadFromDatabaseIfNecessary(): void {
        if (!Group.loadedFromDatabase) {
            for (const entry of Entity.database.getEntriesIterator(["Group"])) {
                const group = Group.fromDatabaseEntry(entry);
                Group.groups.set(group.groupID, group);
            }

            Group.loadedFromDatabase = true;
        }
    }

    public static byGroupID(groupID: number): Group | undefined {
        Group.loadFromDatabaseIfNecessary();
        return Group.groups.get(groupID);
    }

    /**
     * @deprecated use allIterator()
     */
    public static all(): Group[] {
        Group.loadFromDatabaseIfNecessary();
        return Array.from(Group.groups.values());
    }

    public static *allIterator(predicate?: (value: Group) => boolean): Generator<Group> {
        Group.loadFromDatabaseIfNecessary();

        for (const group of Group.groups.values()) {
            if (!predicate || predicate(group)) {
                yield group;
            }
        }
    }

    public static create(groupID: number): Group {
        assert(typeof groupID === "number", "GroupID must be a number");
        // Don't allow groupID 0, from the spec:
        // "Scene identifier 0x00, along with group identifier 0x0000, is reserved for the global scene used by the OnOff cluster"
        assert(groupID >= 1, "GroupID must be at least 1");

        Group.loadFromDatabaseIfNecessary();

        if (Group.groups.has(groupID)) {
            throw new Error(`Group with groupID '${groupID}' already exists`);
        }

        const databaseID = Entity.database.newID();
        const group = new Group(databaseID, groupID, [], {});
        Entity.database.insert(group.toDatabaseRecord());

        Group.groups.set(group.groupID, group);
        return group;
    }

    public async removeFromNetwork(): Promise<void> {
        for (const endpoint of this._members) {
            await endpoint.removeFromGroup(this);
        }

        this.removeFromDatabase();
    }

    public removeFromDatabase(): void {
        Group.loadFromDatabaseIfNecessary();

        if (Entity.database.has(this.databaseID)) {
            Entity.database.remove(this.databaseID);
        }

        Group.groups.delete(this.groupID);
    }

    public save(writeDatabase = true): void {
        Entity.database.update(this.toDatabaseRecord(), writeDatabase);
    }

    public addMember(endpoint: Endpoint): void {
        if (!this._members.includes(endpoint)) {
            this._members.push(endpoint);
            this.save();

            this.#customClusters = this.#identifyCustomClusters();
        }
    }

    public removeMember(endpoint: Endpoint): void {
        const i = this._members.indexOf(endpoint);

        if (i > -1) {
            this._members.splice(i, 1);
            this.save();

            this.#customClusters = this.#identifyCustomClusters();
        }
    }

    public hasMember(endpoint: Endpoint): boolean {
        return this._members.includes(endpoint);
    }

    #identifyCustomClusters(): [input: CustomClusters, output: CustomClusters] {
        const members = this.members;

        if (members.length > 0) {
            const customClusters = members[0].getDevice().customClusters;
            const inputClusters: CustomClusters = {};
            const outputClusters: CustomClusters = {};

            for (const clusterName in customClusters) {
                const customCluster = customClusters[clusterName];
                let hasInput = true;
                let hasOutput = true;

                for (const member of members) {
                    if (clusterName in member.getDevice().customClusters) {
                        hasInput = member.inputClusters.includes(customCluster.ID);
                        hasOutput = member.outputClusters.includes(customCluster.ID);

                        if (!hasInput && !hasOutput) {
                            break;
                        }
                    } else {
                        hasInput = false;
                        hasOutput = false;

                        break;
                    }
                }

                if (hasInput) {
                    inputClusters[clusterName] = customCluster;
                }

                if (hasOutput) {
                    outputClusters[clusterName] = customCluster;
                }
            }

            return [inputClusters, outputClusters];
        }

        return [{}, {}];
    }

    /*
     * Zigbee functions
     */

    public async write<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        attributes: PartialClusterOrRawWriteAttributes<Cl, Custom>,
        options?: Options,
    ): Promise<void> {
        const customClusters = this.#customClusters[options?.direction === Zcl.Direction.SERVER_TO_CLIENT ? 1 : 0 /* default to CLIENT_TO_SERVER */];
        const cluster = Zcl.Utils.getCluster(clusterKey, options?.manufacturerCode, customClusters);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const payload: TFoundation["write"] = [];

        for (const nameOrID in attributes) {
            const attribute = cluster.getAttribute(nameOrID);

            if (attribute) {
                payload.push({attrId: attribute.ID, attrData: attributes[nameOrID], dataType: attribute.type});
            } else if (!Number.isNaN(Number(nameOrID))) {
                const value = attributes[nameOrID];

                payload.push({attrId: Number(nameOrID), attrData: value.value, dataType: value.type});
            } else {
                throw new Error(`Unknown attribute '${nameOrID}', specify either an existing attribute or a number`);
            }
        }

        const createLogMessage = (): string =>
            `Write ${this.groupID} ${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(optionsWithDefaults)})`;
        logger.debug(createLogMessage, NS);

        try {
            const frame = Zcl.Frame.create(
                Zcl.FrameType.GLOBAL,
                optionsWithDefaults.direction,
                true,
                optionsWithDefaults.manufacturerCode,
                optionsWithDefaults.transactionSequenceNumber ?? zclTransactionSequenceNumber.next(),
                "write",
                cluster,
                payload,
                customClusters,
                optionsWithDefaults.reservedBits,
            );

            await Entity.adapter.sendZclFrameToGroup(this.groupID, frame, optionsWithDefaults.srcEndpoint);
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            logger.debug(err.stack!, NS);

            throw error;
        }
    }

    public async read<Cl extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        attributes: ClusterOrRawAttributeKeys<Cl, Custom>,
        options?: Options,
    ): Promise<undefined> {
        const customClusters = this.#customClusters[options?.direction === Zcl.Direction.SERVER_TO_CLIENT ? 1 : 0 /* default to CLIENT_TO_SERVER */];
        const cluster = Zcl.Utils.getCluster(clusterKey, options?.manufacturerCode, customClusters);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const payload: TFoundation["read"] = [];

        for (const attribute of attributes) {
            if (typeof attribute === "number") {
                payload.push({attrId: attribute});
            } else {
                const attr = cluster.getAttribute(attribute);

                if (attr) {
                    payload.push({attrId: attr.ID});
                } else {
                    logger.warning(`Ignoring unknown attribute ${attribute} in cluster ${cluster.name}`, NS);
                }
            }
        }

        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            optionsWithDefaults.direction,
            true,
            optionsWithDefaults.manufacturerCode,
            optionsWithDefaults.transactionSequenceNumber ?? zclTransactionSequenceNumber.next(),
            "read",
            cluster,
            payload,
            customClusters,
            optionsWithDefaults.reservedBits,
        );

        const createLogMessage = (): string =>
            `Read ${this.groupID} ${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(optionsWithDefaults)})`;
        logger.debug(createLogMessage, NS);

        try {
            await Entity.adapter.sendZclFrameToGroup(this.groupID, frame, optionsWithDefaults.srcEndpoint);
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            logger.debug(err.stack!, NS);

            throw error;
        }
    }

    public async command<Cl extends number | string, Co extends number | string, Custom extends TCustomCluster | undefined = undefined>(
        clusterKey: Cl,
        commandKey: Co,
        payload: ClusterOrRawPayload<Cl, Co, Custom>,
        options?: Options,
    ): Promise<undefined> {
        const customClusters = this.#customClusters[options?.direction === Zcl.Direction.SERVER_TO_CLIENT ? 1 : 0 /* default to CLIENT_TO_SERVER */];
        const cluster = Zcl.Utils.getCluster(clusterKey, options?.manufacturerCode, customClusters);
        const optionsWithDefaults = this.getOptionsWithDefaults(options, Zcl.Direction.CLIENT_TO_SERVER, cluster.manufacturerCode);
        const command =
            optionsWithDefaults.direction === Zcl.Direction.CLIENT_TO_SERVER
                ? cluster.getCommand(commandKey)
                : cluster.getCommandResponse(commandKey);

        const createLogMessage = (): string => `Command ${this.groupID} ${cluster.name}.${command.name}(${JSON.stringify(payload)})`;
        logger.debug(createLogMessage, NS);

        try {
            const frame = Zcl.Frame.create(
                Zcl.FrameType.SPECIFIC,
                optionsWithDefaults.direction,
                true,
                optionsWithDefaults.manufacturerCode,
                optionsWithDefaults.transactionSequenceNumber || zclTransactionSequenceNumber.next(),
                command,
                cluster,
                payload,
                customClusters,
                optionsWithDefaults.reservedBits,
            );

            await Entity.adapter.sendZclFrameToGroup(this.groupID, frame, optionsWithDefaults.srcEndpoint);
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            // biome-ignore lint/style/noNonNullAssertion: ignored using `--suppress`
            logger.debug(err.stack!, NS);

            throw error;
        }
    }

    private getOptionsWithDefaults(
        options: Options | undefined,
        direction: Zcl.Direction,
        manufacturerCode: number | undefined,
    ): OptionsWithDefaults {
        return {
            direction,
            srcEndpoint: undefined,
            reservedBits: 0,
            manufacturerCode,
            transactionSequenceNumber: undefined,
            ...(options || {}),
        };
    }
}

export default Group;
