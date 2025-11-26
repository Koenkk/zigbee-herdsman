export type Adapter = "deconz" | "ember" | "zstack" | "zboss" | "zigate" | "ezsp" | "zoh";
export type DiscoverableUsbAdapter = "deconz" | "ember" | "zstack" | "zboss" | "zigate";

export type UsbAdapterFingerprint = {
    vendorId: string;
    productId: string;
    manufacturer?: string;
    pathRegex: string;
    options?: Pick<SerialPortOptions, "baudRate" | "rtscts">;
};

export interface NetworkOptions {
    panID: number;
    extendedPanID?: number[];
    channelList: number[];
    networkKey?: number[];
    networkKeyDistribute?: boolean;
}

export interface SerialPortOptions {
    baudRate?: number;
    rtscts?: boolean;
    path?: string;
    adapter?: Adapter;
}

export interface AdapterOptions {
    concurrent?: number;
    delay?: number;
    disableLED: boolean;
    transmitPower?: number;
    forceStartWithInconsistentAdapterConfiguration?: boolean;
}

export interface CoordinatorVersion {
    type: string;
    meta: {[s: string]: number | string};
}

export type DeviceType = "Coordinator" | "EndDevice" | "Router" | "Unknown";

export type StartResult = "resumed" | "reset" | "restored";

export interface Backup {
    adapterType: "zStack";
    time: string;
    meta: {[s: string]: number};
    // biome-ignore lint/suspicious/noExplicitAny: API
    data: any;
}

export interface NetworkParameters {
    panID: number;
    extendedPanID: string; // `0x${string}` same as IEEE address
    channel: number;
    nwkUpdateID: number;
}
