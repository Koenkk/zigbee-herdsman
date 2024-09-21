interface NetworkOptions {
    panID: number;
    extendedPanID?: number[];
    channelList: number[];
    networkKey?: number[];
    networkKeyDistribute?: boolean;
}

interface SerialPortOptions {
    baudRate?: number;
    rtscts?: boolean;
    path?: string;
    adapter?: 'zstack' | 'deconz' | 'zigate' | 'ezsp' | 'ember' | 'zboss' | 'auto';
}

interface AdapterOptions {
    concurrent?: number;
    delay?: number;
    disableLED: boolean;
    transmitPower?: number;
    forceStartWithInconsistentAdapterConfiguration?: boolean;
}

interface CoordinatorVersion {
    type: string;
    meta: {[s: string]: number | string};
}

type DeviceType = 'Coordinator' | 'EndDevice' | 'Router' | 'Unknown';

type StartResult = 'resumed' | 'reset' | 'restored';

interface LQINeighbor {
    ieeeAddr: string;
    networkAddress: number;
    linkquality: number;
    relationship: number;
    depth: number;
}

interface LQI {
    neighbors: LQINeighbor[];
}

interface RoutingTableEntry {
    destinationAddress: number;
    status: string;
    nextHop: number;
}

interface RoutingTable {
    table: RoutingTableEntry[];
}

interface Backup {
    adapterType: 'zStack';
    time: string;
    meta: {[s: string]: number};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
}

interface NetworkParameters {
    panID: number;
    extendedPanID: number;
    channel: number;
}

export {
    SerialPortOptions,
    NetworkOptions,
    CoordinatorVersion,
    DeviceType,
    LQI,
    LQINeighbor,
    RoutingTable,
    Backup,
    NetworkParameters,
    StartResult,
    RoutingTableEntry,
    AdapterOptions,
};
