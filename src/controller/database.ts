import fs from 'fs';
import Debug from "debug";
import {DatabaseEntry, EntityType} from './tstype';

const debug = {
    log: Debug('zigbee-herdsman:controller:database:log'),
};

class Database {
    private entries: {[id: number]: DatabaseEntry};
    private path: string;

    private constructor(entries: {[id: number]: DatabaseEntry}, path: string) {
        this.entries = entries;
        this.path = path;
    }

    public static open(path: string): Database {
        const entries: {[id: number]: DatabaseEntry} = {};

        if (fs.existsSync(path)) {
            const rows = fs.readFileSync(path, 'utf-8').split('\n').map((r) => r.trim()).filter((r) => r != '');
            for (const row of rows) {
                const json = JSON.parse(row);
                if (json.hasOwnProperty('id')) {
                    entries[json.id] = json;
                }
            }
        }

        return new Database(entries, path);
    }

    public getEntries(type: EntityType[]): DatabaseEntry[] {
        return Object.values(this.entries).filter(e => type.includes(e.type));
    }

    public insert(DatabaseEntry: DatabaseEntry): void {
        if (this.entries[DatabaseEntry.id]) {
            throw new Error(`DatabaseEntry with ID '${DatabaseEntry.id}' already exists`);
        }

        this.entries[DatabaseEntry.id] = DatabaseEntry;
        this.write();
    }

    public update(DatabaseEntry: DatabaseEntry, write: boolean): void {
        if (!this.entries[DatabaseEntry.id]) {
            throw new Error(`DatabaseEntry with ID '${DatabaseEntry.id}' does not exist`);
        }

        this.entries[DatabaseEntry.id] = DatabaseEntry;

        if (write) {
            this.write();
        }
    }

    public remove(ID: number): void {
        if (!this.entries[ID]) {
            throw new Error(`DatabaseEntry with ID '${ID}' does not exist`);
        }

        delete this.entries[ID];
        this.write();
    }

    public has(ID: number): boolean {
        return this.entries.hasOwnProperty(ID);
    }

    public newID(): number {
        for (let i = 1; i < 100000; i++) {
            if (!this.entries[i]) {
                return i;
            }
        }
    }

    public write(): void {
        debug.log(`Writing database to '${this.path}'`);
        const lines = [];
        for (const DatabaseEntry of Object.values(this.entries)) {
            const json = JSON.stringify(DatabaseEntry);
            lines.push(json);
        }
        const tmpPath = this.path + '.tmp';
        fs.writeFileSync(tmpPath, lines.join('\n'));
        // Ensure file is on disk https://github.com/Koenkk/zigbee2mqtt/issues/11759
        const fd = fs.openSync(tmpPath, 'r+');
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        fs.renameSync(tmpPath, this.path);
    }
}

export default Database;
