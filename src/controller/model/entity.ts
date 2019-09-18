import Database from '../database';
import {Adapter} from '../../adapter';
import assert from 'assert';

abstract class Entity {
    protected static database: Database = null;
    protected static adapter: Adapter = null;

    public static injectDatabse(database: Database): void {
        Entity.database = database;
    }

    public static injectAdapter(adapter: Adapter): void {
        Entity.adapter = adapter;
    }

    abstract isType(type: string): boolean;

    protected static getAdapter(): Adapter {
        assert(Entity.adapter != null, 'Adapter is not set yet');
        return Entity.adapter;
    }

    protected static getDatabase(): Database {
        assert(Entity.database != null, 'Database is not set yet');
        return Entity.database;
    }
}

export default Entity;