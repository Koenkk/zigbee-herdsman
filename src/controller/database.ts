import * as fs from "fs";
import {KeyValue} from './tstype';
import {Entity} from './model';

type ReviveFunction = (value: KeyValue) => Entity;

class Database {
    private lastID = 0;

    constructor(private data: KeyValue[], private path: string) {

    }

    public static async open(path: string | undefined, revive: ReviveFunction): Promise<Database> {
        let data = [];
        if (path && fs.existsSync(path)) {
            const json = fs.readFileSync(path, "UTF8");
            if (json.trim().length > 0) {
                data = JSON.parse(json);
                if (!Array.isArray(data)) {
                    data = [];
                }
            }
        }
        const db = new Database(data, path);
        db.data.forEach(value => revive(value));
        return db;
    }

    private save(): void {
        if (!this.path) return;
        const data = JSON.stringify(this.data);
        fs.writeFileSync(this.path, data, "UTF8");
    }

    public findById(id: number): KeyValue | undefined {
        return this.data.find(d => d.id === id);
    }

    public find(query: KeyValue): KeyValue[] {
        const queryKeys = Object.keys(query);
        return this.data.filter(d => {
            for (const key of queryKeys) {
                if (d[key] != query[key]) return false;
            }
            return true;
        });
    }

    public insert(object: KeyValue): void {
        const id = object.id;
        if (typeof id !== "number") throw Error("no object.id: " + JSON.stringify(object));
        if (this.findById(id)) throw Error("object with that id already exists");
        this.data.push(object);
        this.save();
    }

    public update(id: number, object: KeyValue): void {
        const at = this.data.findIndex(d => d.id === id);
        if (at < 0) throw Error("no object with that ID exists");
        this.data[at] = object;
        this.save();
    }

    public remove(id: number): void {
        const at = this.data.findIndex(d => d.id === id);
        if (at < 0) throw Error("no object with that ID exists");
        this.data.splice(at, 1);
        this.save();
    }

    public newID(): number {
        if (this.data.length === 0) {
            this.lastID = 0;
        }
        for (let i = 0; i < 100000; i++) {
            const id = ++this.lastID;
            if (!this.findById(id)) return id;
        }
        throw Error("unable to allocate new ID");
    }
}

export default Database;