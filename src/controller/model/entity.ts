import Database from '../database';
import {Adapter} from '../../adapter';

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
}

export default Entity;