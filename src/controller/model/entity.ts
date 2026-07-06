import events from "node:events";

import type {Adapter} from "../../adapter";
import type Database from "../database";

// biome-ignore lint/suspicious/noExplicitAny: API
export abstract class Entity<T extends Record<keyof T, any[]> = Record<string, any[]>> extends events.EventEmitter<T> {
    protected static database: Database;
    protected static adapter: Adapter;

    public static injectDatabase(database: Database): void {
        Entity.database = database;
    }

    public static injectAdapter(adapter: Adapter): void {
        Entity.adapter = adapter;
    }
}

export default Entity;
