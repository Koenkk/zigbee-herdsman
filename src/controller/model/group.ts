import assert from 'node:assert';

import {logger} from '../../utils/logger';
import * as Zcl from '../../zspec/zcl';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import {DatabaseEntry, KeyValue} from '../tstype';
import Device from './device';
import Endpoint from './endpoint';
import Entity from './entity';

const NS = 'zh:controller:group';

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

export class Group extends Entity {
    private databaseID: number;
    public readonly groupID: number;
    private readonly _members: Set<Endpoint>;
    get members(): Endpoint[] {
        return Array.from(this._members).filter((e) => e.getDevice());
    }
    // Can be used by applications to store data.
    public readonly meta: KeyValue;

    // This lookup contains all groups that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static readonly groups: Map<number /* groupID */, Group> = new Map();
    private static loadedFromDatabase: boolean = false;

    private constructor(databaseID: number, groupID: number, members: Set<Endpoint>, meta: KeyValue) {
        super();
        this.databaseID = databaseID;
        this.groupID = groupID;
        this._members = members;
        this.meta = meta;
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
        const members = new Set<Endpoint>();

        for (const member of entry.members) {
            const device = Device.byIeeeAddr(member.deviceIeeeAddr);

            if (device) {
                const endpoint = device.getEndpoint(member.endpointID);

                if (endpoint) {
                    members.add(endpoint);
                }
            }
        }

        return new Group(entry.id, entry.groupID, members, entry.meta);
    }

    private toDatabaseRecord(): DatabaseEntry {
        const members: DatabaseEntry['members'] = [];

        for (const member of this.members) {
            members.push({deviceIeeeAddr: member.getDevice().ieeeAddr, endpointID: member.ID});
        }

        return {id: this.databaseID, type: 'Group', groupID: this.groupID, members, meta: this.meta};
    }

    private static loadFromDatabaseIfNecessary(): void {
        if (!Group.loadedFromDatabase) {
            for (const entry of Entity.database!.getEntriesIterator(['Group'])) {
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
        assert(typeof groupID === 'number', 'GroupID must be a number');
        // Don't allow groupID 0, from the spec:
        // "Scene identifier 0x00, along with group identifier 0x0000, is reserved for the global scene used by the OnOff cluster"
        assert(groupID >= 1, 'GroupID must be at least 1');

        Group.loadFromDatabaseIfNecessary();

        if (Group.groups.has(groupID)) {
            throw new Error(`Group with groupID '${groupID}' already exists`);
        }

        const databaseID = Entity.database!.newID();
        const group = new Group(databaseID, groupID, new Set(), {});
        Entity.database!.insert(group.toDatabaseRecord());

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

        if (Entity.database!.has(this.databaseID)) {
            Entity.database!.remove(this.databaseID);
        }

        Group.groups.delete(this.groupID);
    }

    public save(writeDatabase = true): void {
        Entity.database!.update(this.toDatabaseRecord(), writeDatabase);
    }

    public addMember(endpoint: Endpoint): void {
        this._members.add(endpoint);
        this.save();
    }

    public removeMember(endpoint: Endpoint): void {
        this._members.delete(endpoint);
        this.save();
    }

    public hasMember(endpoint: Endpoint): boolean {
        return this._members.has(endpoint);
    }

    /*
     * Zigbee functions
     */

    public async write(clusterKey: number | string, attributes: KeyValue, options?: Options): Promise<void> {
        const optionsWithDefaults = this.getOptionsWithDefaults(options, Zcl.Direction.CLIENT_TO_SERVER);
        const cluster = Zcl.Utils.getCluster(clusterKey, undefined, {});
        const payload: {attrId: number; dataType: number; attrData: number | string | boolean}[] = [];

        for (const [nameOrID, value] of Object.entries(attributes)) {
            if (cluster.hasAttribute(nameOrID)) {
                const attribute = cluster.getAttribute(nameOrID);
                payload.push({attrId: attribute.ID, attrData: value, dataType: attribute.type});
            } else if (!isNaN(Number(nameOrID))) {
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
                optionsWithDefaults.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
                'write',
                cluster.ID,
                payload,
                {},
                optionsWithDefaults.reservedBits,
            );

            await Entity.adapter!.sendZclFrameToGroup(this.groupID, frame, optionsWithDefaults.srcEndpoint);
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            logger.debug(err.stack!, NS);

            throw error;
        }
    }

    public async read(clusterKey: number | string, attributes: (string | number)[], options?: Options): Promise<void> {
        const optionsWithDefaults = this.getOptionsWithDefaults(options, Zcl.Direction.CLIENT_TO_SERVER);
        const cluster = Zcl.Utils.getCluster(clusterKey, undefined, {});
        const payload: {attrId: number}[] = [];

        for (const attribute of attributes) {
            payload.push({attrId: typeof attribute === 'number' ? attribute : cluster.getAttribute(attribute).ID});
        }

        const frame = Zcl.Frame.create(
            Zcl.FrameType.GLOBAL,
            optionsWithDefaults.direction,
            true,
            optionsWithDefaults.manufacturerCode,
            optionsWithDefaults.transactionSequenceNumber ?? ZclTransactionSequenceNumber.next(),
            'read',
            cluster.ID,
            payload,
            {},
            optionsWithDefaults.reservedBits,
        );

        const createLogMessage = (): string =>
            `Read ${this.groupID} ${cluster.name}(${JSON.stringify(attributes)}, ${JSON.stringify(optionsWithDefaults)})`;
        logger.debug(createLogMessage, NS);

        try {
            await Entity.adapter!.sendZclFrameToGroup(this.groupID, frame, optionsWithDefaults.srcEndpoint);
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            logger.debug(err.stack!, NS);

            throw error;
        }
    }

    public async command(clusterKey: number | string, commandKey: number | string, payload: KeyValue, options?: Options): Promise<void> {
        const optionsWithDefaults = this.getOptionsWithDefaults(options, Zcl.Direction.CLIENT_TO_SERVER);
        const cluster = Zcl.Utils.getCluster(clusterKey, undefined, {});
        const command = cluster.getCommand(commandKey);

        const createLogMessage = (): string => `Command ${this.groupID} ${cluster.name}.${command.name}(${JSON.stringify(payload)})`;
        logger.debug(createLogMessage, NS);

        try {
            const frame = Zcl.Frame.create(
                Zcl.FrameType.SPECIFIC,
                optionsWithDefaults.direction,
                true,
                optionsWithDefaults.manufacturerCode,
                optionsWithDefaults.transactionSequenceNumber || ZclTransactionSequenceNumber.next(),
                command.ID,
                cluster.ID,
                payload,
                {},
                optionsWithDefaults.reservedBits,
            );

            await Entity.adapter!.sendZclFrameToGroup(this.groupID, frame, optionsWithDefaults.srcEndpoint);
        } catch (error) {
            const err = error as Error;
            err.message = `${createLogMessage()} failed (${err.message})`;
            logger.debug(err.stack!, NS);

            throw error;
        }
    }

    private getOptionsWithDefaults(options: Options | undefined, direction: Zcl.Direction): OptionsWithDefaults {
        return {
            direction,
            srcEndpoint: undefined,
            reservedBits: 0,
            manufacturerCode: undefined,
            transactionSequenceNumber: undefined,
            ...(options || {}),
        };
    }
}

export default Group;
