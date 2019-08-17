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
                error == null ? resolve(new Database(store)) : reject(error);
            })
        });
    }

    public clear(): Promise<void> {
        return new Promise((resolve, reject): void => {
            this.store.remove({}, (error: Error): void => {
                error == null ? resolve() : reject(error);
            })
        });
    }

    public find(query: KeyValue): Promise<KeyValue[]> {
        return new Promise((resolve, reject): void => {
            this.store.find(query, (error: Error, result: KeyValue[]): void => {
                error == null ? resolve(result) : reject(error);
            });
        });
    }

    public insert(object: KeyValue): Promise<KeyValue> {
        return new Promise((resolve, reject): void => {
            this.store.insert(object, (error: Error, newObject: KeyValue): void => {
                error == null ? resolve(newObject) : reject(error);
            });
        });
    }

    public update(ID: number, object: KeyValue): Promise<void> {
        return new Promise((resolve, reject): void => {
            this.store.update({id: ID}, object, {}, (error: Error): void => {
                error == null ? resolve() : reject(error);
            });
        });
    }

    public async remove(ID: number): Promise<void> {
        return new Promise((resolve, reject): void => {
            this.store.remove({id: ID}, (error: Error): void => {
                error == null ? resolve() : reject(error);
            })
        });
    }

    public async newID(): Promise<number> {
        return new Promise((resolve, reject): void => {
            this.store.find({}, (error: Error, result: KeyValue[]): void => {
                if (error != null) {
                    reject(error);
                }

                let ID = 1;
                for (const entry of result) {
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