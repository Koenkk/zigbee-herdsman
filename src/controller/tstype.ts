// eslint-disable-next-line
interface KeyValue {[s: string]: any};

type DeviceType = 'Coordinator' | 'Router' | 'EndDevice' | 'Unknown' | 'GreenPower';

type EntityType = DeviceType | 'Group';

interface DatabaseEntry {
    id: number;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    type: EntityType;
    // eslint-disable-next-line
    [s: string]: any;
}

enum GreenPowerEvents {
    deviceJoined = "deviceJoined",
}

interface GreenPowerDeviceJoinedPayload {
    sourceID: number;
    deviceID: number;
    networkAddress: number;
}

export {
    KeyValue, DatabaseEntry, EntityType, DeviceType, GreenPowerEvents, GreenPowerDeviceJoinedPayload,
};