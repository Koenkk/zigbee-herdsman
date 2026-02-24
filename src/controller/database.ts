import fs from "node:fs";

import {logger} from "../utils/logger";
import type {DatabaseEntry, EntityType} from "./tstype";

const NS = "zh:controller:database";

export class Database {
    private entries: Map<number, DatabaseEntry>;
    private path: string;
    private maxId: number;

    private constructor(entries: Map<number, DatabaseEntry>, path: string, maxId: number) {
        this.entries = entries;
        this.path = path;
        this.maxId = maxId;
    }

    public static open(path: string): Database {
        const entries = new Map<number, DatabaseEntry>();
        let maxId = 0;

        if (fs.existsSync(path)) {
            const file = fs.readFileSync(path, "utf-8");

            for (const row of file.split("\n")) {
                if (!row) {
                    continue;
                }

                try {
                    const json = JSON.parse(row);

                    if (Number.isFinite(json.id)) {
                        entries.set(json.id, json);

                        if (json.id > maxId) {
                            maxId = json.id;
                        }
                    }
                } catch (error) {
                    logger.error(`Corrupted database line, ignoring. ${error}`, NS);
                }
            }
        }

        return new Database(entries, path, maxId);
    }

    public *getEntriesIterator(type: EntityType[]): Generator<DatabaseEntry> {
        for (const entry of this.entries.values()) {
            if (type.includes(entry.type)) {
                yield entry;
            }
        }
    }

    public insert(databaseEntry: DatabaseEntry): void {
        if (this.entries.has(databaseEntry.id)) {
            throw new Error(`DatabaseEntry with ID '${databaseEntry.id}' already exists`);
        }

        this.entries.set(databaseEntry.id, databaseEntry);
        this.write();
    }

    public update(databaseEntry: DatabaseEntry, write: boolean): void {
        if (!this.entries.has(databaseEntry.id)) {
            throw new Error(`DatabaseEntry with ID '${databaseEntry.id}' does not exist`);
        }

        this.entries.set(databaseEntry.id, databaseEntry);

        if (write) {
            this.write();
        }
    }

    public remove(id: number): void {
        if (this.entries.delete(id)) {
            this.write();
        } else {
            throw new Error(`DatabaseEntry with ID '${id}' does not exist`);
        }
    }

    public has(id: number): boolean {
        return this.entries.has(id);
    }

    public newID(): number {
        this.maxId += 1;
        return this.maxId;
    }

    public write(): void {
        logger.debug(`Writing database to '${this.path}'`, NS);
        let lines = "";

        for (const entry of this.entries.values()) {
            lines += `${JSON.stringify(entry)}\n`;
        }

        const tmpPath = `${this.path}.tmp`;

        try {
            // If there already exsits a database.db.tmp, rename it to database.db.tmp.<now>
            const dateTmpPath = `${tmpPath}.${new Date().toISOString().replaceAll(":", "-")}`;
            fs.renameSync(tmpPath, dateTmpPath);

            // If we got this far, we succeeded! Warn the user about this
            logger.warning(`Found '${tmpPath}' when writing database, indicating past write failure; renamed it to '${dateTmpPath}'`, NS);
        } catch {
            // Nothing to catch; if the renameSync fails, we ignore that exception
        }

        const fd = fs.openSync(tmpPath, "w");
        fs.writeFileSync(fd, lines.slice(0, -1)); // remove last newline, no effect if empty string
        // Ensure file is on disk https://github.com/Koenkk/zigbee2mqtt/issues/11759
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        fs.renameSync(tmpPath, this.path);
    }

    public clear(): void {
        logger.debug(`Clearing database '${this.path}'...`, NS);
        this.entries.clear();
        this.write();
    }
}

export default Database;
