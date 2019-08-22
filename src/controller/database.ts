import Datastore from 'nedb';
import {KeyValue} from './tstype';

class Database {
    private store: Datastore;

    private constructor(store: Datastore) {
        this.store = store;
    }

    public static open(path: string): Promise<Database> {
        const store = new Datastore({filename: path, autoload: true});

        return new Promise((resolve, reject): void => {
            store.ensureIndex({fieldName: 'id', unique: true}, (error): void => {
                /* istanbul ignore else */
                if (error == null) {
                    resolve(new Database(store));
                } else {
                    reject(error);
                }
            });
        });
    }

    public find(query: KeyValue): Promise<KeyValue[]> {
        return new Promise((resolve, reject): void => {
            this.store.find(query, (error: Error, result: KeyValue[]): void => {
                /* istanbul ignore else */
                if (error == null) {
                    resolve(result);
                } else {
                    reject(error);
                }
            });
        });
    }

    public insert(object: KeyValue): Promise<KeyValue> {
        return new Promise((resolve, reject): void => {
            this.store.insert(object, (error: Error, newObject: KeyValue): void => {
                /* istanbul ignore else */
                if (error == null) {
                    resolve(newObject);
                } else {
                    reject(error);
                }
            });
        });
    }

    public update(ID: number, object: KeyValue): Promise<void> {
        return new Promise((resolve, reject): void => {
            this.store.update({id: ID}, object, {}, (error: Error): void => {
                /* istanbul ignore else */
                if (error == null) {
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
    }

    public async remove(ID: number): Promise<void> {
        return new Promise((resolve, reject): void => {
            this.store.remove({id: ID}, (error: Error): void => {
                /* istanbul ignore else */
                if (error == null) {
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
    }

    public async newID(): Promise<number> {
        return new Promise((resolve, reject): void => {
            this.store.find({}, (error: Error, result: KeyValue[]): void => {
                /* istanbul ignore if */
                if (error != null) {
                    reject(error);
                }

                let ID = 1;
                for (const entry of result) {
                    /* istanbul ignore else */
                    if (entry.id >= ID) {
                        ID = entry.id + 1;
                    }
                }

                resolve(ID);
            });
        });
    }
}

export default Database;