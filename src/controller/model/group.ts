import {DatabaseEntry, KeyValue} from '../tstype';
import Entity from './entity';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import * as Zcl from '../../zcl';
import Endpoint from './endpoint';
import Device from './device';
import assert from 'assert';

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
        Entity.database.remove(this.databaseID);
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

    public async command(clusterKey: number | string, commandKey: number | string, payload: KeyValue): Promise<void> {
        const cluster = Zcl.Utils.getCluster(clusterKey);
        const command = cluster.getCommand(commandKey);

        for (const parameter of command.parameters) {
            if (!payload.hasOwnProperty(parameter.name)) {
                throw new Error(`Parameter '${parameter.name}' is missing`);
            }
        }

        const frame = Zcl.ZclFrame.create(
            Zcl.FrameType.SPECIFIC, Zcl.Direction.CLIENT_TO_SERVER, true, null, ZclTransactionSequenceNumber.next(),
            command.ID, cluster.ID, payload
        );
        await Entity.adapter.sendZclFrameGroup(this.groupID, frame);
    }
}

export default Group;