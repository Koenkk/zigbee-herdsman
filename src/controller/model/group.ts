import {KeyValue} from '../tstype';
import Entity from './entity';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import * as Zcl from '../../zcl';
import Endpoint from './endpoint';
import assert from 'assert';

class Group extends Entity {
    private databaseID: number;
    groupID: number;
    private members: Endpoint[]; // TODO: not implemented yet

    // Can be used by applications to store data.
    private meta: KeyValue;

    // This lookup contains all groups that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static lookup: {[groupID: number]: Group} = {};
    static reload(): void { Group.lookup = {}; }

    private constructor(databaseID: number, groupID: number, members: Endpoint[], meta: KeyValue) {
        super();
        this.databaseID = databaseID;
        this.groupID = groupID;
        this.members = members;
        this.meta = meta;
    }

    public isType(type: string): boolean {
        return type === 'group';
    }

    public get(key: 'groupID'): number {
        return this[key];
    }

    /**
     * CRUD
     */

    static fromDatabaseRecord(record: KeyValue): Group {
        const group = new Group(record.id, record.groupID, record.members, record.meta);
        Group.lookup[group.groupID] = group;
        return group;
    }

    private toDatabaseRecord(): KeyValue {
        return {id: this.databaseID, type: 'Group', groupID: this.groupID, members: this.members, meta: this.meta};
    }

    public static all(): Group[] {
        return Object.values(Group.lookup);
    }

    public static byID(groupID: number): Group | undefined {
        return Group.lookup[groupID];
    }

    public static findSingle(query: {groupID?: number; [key: string]: unknown}): Group | undefined {
        const results = Group.find(query);
        if (results.length === 1) return results[0];
        return undefined;
    }

    public static find(query: {groupID?: number; [key: string]: unknown}): Group[] {
        const queryKeys = Object.keys(query);

        // fast path
        if (queryKeys.length === 1 && query.groupID) {
            const group = Group.byID(query.groupID);
            return group ? [group] : [];
        }

        return Group.all().filter((d: KeyValue) => {
            for (const key of queryKeys) {
                if (d[key] != query[key]) return false;
            }
            return true;
        });
    }

    public static create(groupID: number): Group {
        assert(typeof groupID === 'number', 'GroupID must be a number');
        if (Group.byID(groupID)) {
            throw new Error(`Group with groupID '${groupID}' already exists`);
        }

        const databaseID = Group.database.newID();
        const group = new Group(databaseID, groupID, [], {});
        Group.database.insert(group.toDatabaseRecord());

        Group.lookup[group.groupID] = group;
        return group;
    }

    public removeFromDatabase(): void {
        Group.database.remove(this.databaseID);
        delete Group.lookup[this.groupID];
    }

    /**
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
        await Group.adapter.sendZclFrameGroup(this.groupID, frame);
    }
}

export default Group;