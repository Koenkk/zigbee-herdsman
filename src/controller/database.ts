import Datastore from 'nedb';

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
}

export default Database;