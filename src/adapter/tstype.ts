interface NetworkOptions {
    panID: number;
    extenedPanID: number[];
    channelList: number[];
    networkKey: number[];
    networkKeyDistribute: boolean;
}


interface SerialPortOptions {
    baudRate: number;
    rtscts: boolean;
    path: string;
};

interface CoordinatorVersion {
    type: string;
    meta: {[s: string]: number | string};
}

type DeviceType = 'Coordinator' | 'EndDevice' | 'Router' | 'Unknown';

interface NodeDescriptor {
    type: DeviceType;
    manufacturerCode: number;
}

interface ActiveEndpoints {
    endpoints: number[];
}

interface SimpleDescriptor {
    profileID: number;
    endpointID: number;
    deviceID: number;
    inputerClusters: number[];
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

export {
    SerialPortOptions, NetworkOptions, Coordinator, CoordinatorVersion, NodeDescriptor, DeviceType, ActiveEndpoints, SimpleDescriptor,
}