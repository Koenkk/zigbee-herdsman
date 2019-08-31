interface NetworkOptions {
    panID: number;
    extenedPanID?: number[];
    channelList: number[];
    networkKey?: number[];
    networkKeyDistribute?: boolean;
}


interface SerialPortOptions {
    baudRate: number;
    rtscts: boolean;
    path?: string;
};

interface CoordinatorVersion {
    type: string;
    meta: {[s: string]: number | string};
}

type DeviceType = 'Coordinator' | 'EndDevice' | 'Router' | 'Unknown';

type StartResult = 'resumed' | 'resetted' | 'restored';

interface NodeDescriptor {
    type: DeviceType;
    manufacturerCode: number;
}

interface ActiveEndpoints {
    endpoints: number[];
}

interface LQI {
    neighbors: {
        ieeeAddr: string;
        networkAddress: number;
        linkquality: number;
    }[];
}

interface RoutingTable {
    table: {
        destinationAddress: number;
        status: string;
        nextHop: number;
    }[];
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
    DeviceType, ActiveEndpoints, SimpleDescriptor, LQI, RoutingTable, Backup, NetworkParameters,
    StartResult,
};