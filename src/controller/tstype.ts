// eslint-disable-next-line
interface KeyValue {[s: string]: any};

type DeviceType = 'Coordinator' | 'Router' | 'EndDevice' | 'Unknown';

type EntityType = DeviceType | 'Group';

interface DatabaseEntry {
    id: number;
    type: EntityType;
    // eslint-disable-next-line
    [s: string]: any;
}

export {
    KeyValue, DatabaseEntry, EntityType, DeviceType,
};