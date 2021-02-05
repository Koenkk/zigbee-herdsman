import {NetworkOptions} from "./network-options";

export interface Backup {
    networkOptions: NetworkOptions;
    logicalChannel: number;
    networkKeyInfo: {
        sequenceNumber: number;
        frameCounter: number;
    };
    securityLevel: number;
    networkUpdateId: number;
    coordinatorIeeeAddress: Buffer;
    trustCenterLinkKeySeed?: Buffer;
    devices: {
        networkAddress: number;
        ieeeAddress: Buffer;
        linkKey?: {
            key: Buffer;
            rxCounter: number;
            txCounter: number;
        };
    }[];
}
