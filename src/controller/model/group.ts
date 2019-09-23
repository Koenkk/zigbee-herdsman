import {DatabaseEntry, KeyValue} from '../tstype';
import Entity from './entity';
import ZclTransactionSequenceNumber from '../helpers/zclTransactionSequenceNumber';
import * as Zcl from '../../zcl';
import Endpoint from './endpoint';
import Device from './device';
import assert from 'assert';

/**
 * @class Group
 */
class Group extends Entity {
    private databaseID: number;
    private groupID: number;
    private members: Set<Endpoint>;

    // Can be used by applications to store data.
    private meta: KeyValue;

    // This lookup contains all groups that are queried from the database, this is to ensure that always
    // the same instance is returned.
    private static groups: {[groupID: number]: Group} = null;

    private constructor(databaseID: number, groupID: number, members: Set<Endpoint>, meta: KeyValue) {
        super();
        this.databaseID = databaseID;
        this.groupID = groupID;
        this.members = members;
        this.meta = meta;
    }

    /**
     * @param {number} groupID
     * @returns {Group}
     */
    public get(key: 'groupID'): number {
        return this[key];
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
            return {deviceIeeeAddr: member.get('deviceIeeeAddress'), endpointID: member.get('ID')};
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

    /**
     * @param {number} groupID
     * @returns {Group}
     */
    public static byGroupID(groupID: number): Group {
        Group.loadFromDatabaseIfNecessary();
        return Group.groups[groupID];
    }

    /**
     * @returns {Group[]}
     */
    public static all(): Group[] {
        Group.loadFromDatabaseIfNecessary();
        return Object.values(Group.groups);
    }

    /**
     * @param {number} groupID
     * @returns {Promise}
     * @fulfil {Group}
     */
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

    /**
     * @returns {Group}
     */
    public removeFromDatabase(): void {
        Group.loadFromDatabaseIfNecessary();
        Entity.database.remove(this.databaseID);
        delete Group.groups[this.groupID];
    }

    /**
     * @returns {void}
     */
    private save(): void {
        Entity.database.update(this.toDatabaseRecord());
    }

    /**
     * @param {Endpoint} endpoint
     * @returns {void}
     */
    public addMember(endpoint: Endpoint): void {
        this.members.add(endpoint);
        this.save();
    }

    /**
     * @param {Endpoint} endpoint
     * @returns {void}
     */
    public removeMember(endpoint: Endpoint): void {
        this.members.delete(endpoint);
        this.save();
    }

    /**
     * @param {Endpoint} endpoint
     * @returns {boolean}
     */
    public hasMember(endpoint: Endpoint): boolean {
        return this.members.has(endpoint);
    }

    /**
     * @returns {Endpoint[]}
     */
    public getMembers(): Endpoint[] {
        return Array.from(this.members);
    }

    /*
     * Zigbee functions
     */

    /**
     * @param {number|string} clusterKey
     * @param {number} commandKey
     * @param {KeyValue} payload
     * @returns {Promise}
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