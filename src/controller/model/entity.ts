import Database from '../database';
import {Adapter} from '../../adapter';

abstract class Entity {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    protected static database: Database = null;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    protected static adapter: Adapter = null;

    public static injectDatabase(database: Database): void {
        Entity.database = database;
    }

    public static injectAdapter(adapter: Adapter): void {
        Entity.adapter = adapter;
    }
}

export default Entity;