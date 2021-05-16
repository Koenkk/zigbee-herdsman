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
    adapter?: 'zstack' | 'deconz' | 'zigate' | 'ezsp' | 'auto';
}

interface AdapterOptions {
    concurrent?: number;
    delay?: number;
    disableLED: boolean;
}

interface CoordinatorVersion {
    type: string;
    meta: {[s: string]: number | string};
}

type DeviceType = 'Coordinator' | 'EndDevice' | 'Router' | 'Unknown';

type StartResult = 'resumed' | 'reset' | 'restored';

interface NodeDescriptor {
    type: DeviceType;
    manufacturerCode: number;
}

interface ActiveEndpoints {
    endpoints: number[];
}

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

interface SimpleDescriptor {
    profileID: number;
    endpointID: number;
    deviceID: number;
    inputClusters: number[];
    outputClusters: number[];
}

interface Coordinator {
    ieeeAddr: string;
    networkAddress: number;
    manufacturerID: number;
    endpoints: {
        ID: number;
        profileID: number;
        deviceID: number;
        inputClusters: number[];
        outputClusters: number[];
    }[];
}

interface Backup {
    adapterType: "zStack";
    time: string;
    meta: {[s: string]: number};
    // eslint-disable-next-line
    data: any;
}

interface NetworkParameters {
    panID: number;
    extendedPanID: number;
    channel: number;
}

export {
    SerialPortOptions, NetworkOptions, Coordinator, CoordinatorVersion, NodeDescriptor,
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, LQINeighbor, RoutingTable, Backup, NetworkParameters,
    StartResult, RoutingTableEntry, AdapterOptions,
};
