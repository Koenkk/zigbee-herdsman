import Database from '../database'
import {Adapter} from '../../adapter'

class Entity {
    protected static database: Database;
    protected static adapter: Adapter;

    public static injectDatabse(database: Database): void {
        this.database = database;
    }

    public static injectAdapter(adapter: Adapter): void {
        this.adapter = adapter;
    }
}

export default Entity;