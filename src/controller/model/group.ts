import {DatabaseEntry, KeyValue} from '../tstype';
import Entity from './entity';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import * as Zcl from '../../zcl';
import Endpoint from './endpoint';
import Device from './device';
import assert from 'assert';
import Debug from "debug";

const debug = {
    info: Debug('zigbee-herdsman:controller:group'),
    error: Debug('zigbee-herdsman:controller:group'),
};

interface Options {
    manufacturerCode?: number;
    direction?: Zcl.Direction;
    srcEndpoint?: number;
    reservedBits?: number;
    transactionSequenceNumber?: number;
}

class Group extends Entity {
    private databaseID: number;
    public readonly groupID: number;
    private readonly _members: Set<Endpoint>;
    get members(): Endpoint[] {return Array.from(this._members);}
    // Can be used by applications to store data.
    public readonly meta: KeyValue;

    // This lookup contains all groups that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static groups: {[groupID: number]: Group} = null;

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

    private static fromDatabaseEntry(entry: DatabaseEntry): Group {
        const members = new Set<Endpoint>();
        for (const member of entry.members) {
            const device = Device.byIeeeAddr(member.deviceIeeeAddr);
            if (device) {
                const endpoint = device.getEndpoint(member.endpointID);
                members.add(endpoint);
            }
        }

        return new Group(entry.id, entry.groupID, members, entry.meta);
    }

    private toDatabaseRecord(): DatabaseEntry {
        const members = Array.from(this.members).map((member) => {
            return {deviceIeeeAddr: member.getDevice().ieeeAddr, endpointID: member.ID};
        });

        return {id: this.databaseID, type: 'Group', groupID: this.groupID, members, meta: this.meta};
    }

    private static loadFromDatabaseIfNecessary(): void {
        if (!Group.groups) {
            Group.groups = {};
            const entries = Entity.database.getEntries(['Group']);
            for (const entry of entries) {
                const group = Group.fromDatabaseEntry(entry);
                Group.groups[group.groupID] = group;
            }
        }
    }

    public static byGroupID(groupID: number): Group {
        Group.loadFromDatabaseIfNecessary();
        return Group.groups[groupID];
    }

    public static all(): Group[] {
        Group.loadFromDatabaseIfNecessary();
        return Object.values(Group.groups);
    }

    public static create(groupID: number): Group {
        assert(typeof groupID === 'number', 'GroupID must be a number');
        Group.loadFromDatabaseIfNecessary();
        if (Group.groups[groupID]) {
            throw new Error(`Group with groupID '${groupID}' already exists`);
        }

        const databaseID = Entity.database.newID();
        const group = new Group(databaseID, groupID, new Set(), {});
        Entity.database.insert(group.toDatabaseRecord());

        Group.groups[group.groupID] = group;
        return group;
    }

    public removeFromDatabase(): void {
        Group.loadFromDatabaseIfNecessary();

        if (Entity.database.has(this.databaseID)) {
            Entity.database.remove(this.databaseID);
        }

        delete Group.groups[this.groupID];
    }

    public save(): void {
        Entity.database.update(this.toDatabaseRecord());
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

    public async command(
        clusterKey: number | string, commandKey: number | string, payload: KeyValue, options?: Options
    ): Promise<void> {
        options = this.getOptionsWithDefaults(options, Zcl.Direction.CLIENT_TO_SERVER);
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const command = cluster.getCommand(commandKey);

        const log = `Command ${this.groupID} ${cluster.name}.${command.name}(${JSON.stringify(payload)})`;
        debug.info(log);

        try {
            const frame = Zcl.ZclFrame.create(
                Zcl.FrameType.SPECIFIC, options.direction, true, options.manufacturerCode,
                options.transactionSequenceNumber || ZclTransactionSequenceNumber.next(),
                command.ID, cluster.ID, payload, options.reservedBits
            );
            await Entity.adapter.sendZclFrameToGroup(this.groupID, frame, options.srcEndpoint);
        } catch (error) {
            const message = `${log} failed (${error})`;
            debug.error(message);
            throw Error(message);
        }
    }

    private getOptionsWithDefaults(
        options: Options, direction: Zcl.Direction
    ): Options {
        const providedOptions = options || {};
        return {
            direction,
            srcEndpoint: null,
            reservedBits: 0,
            manufacturerCode: null,
            transactionSequenceNumber: null,
            ...providedOptions
        };
    }
}

export default Group;