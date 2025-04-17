import events from "node:events";

import type {Adapter} from "../../adapter";
import type Database from "../database";

// biome-ignore lint/suspicious/noExplicitAny: API
type EventMap<T> = Record<keyof T, any[]> | DefaultEventMap;
type DefaultEventMap = [never];

export abstract class Entity<T extends EventMap<T> = DefaultEventMap> extends events.EventEmitter<T> {
    protected static database?: Database;
    protected static adapter?: Adapter;

    public static injectDatabase(database: Database): void {
        Entity.database = database;
    }

    public static injectAdapter(adapter: Adapter): void {
        Entity.adapter = adapter;
    }
}

export default Entity;
