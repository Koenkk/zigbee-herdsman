import events from 'events';

import {Adapter} from '../../adapter';
import Database from '../database';

abstract class Entity extends events.EventEmitter {
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
