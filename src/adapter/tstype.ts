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
    SerialPortOptions, NetworkOptions, Coordinator,
}