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

export {
    SerialPortOptions, NetworkOptions,
}