import {ZnpVersion} from "../adapter/z-stack/adapter/tstype";
import {NetworkOptions} from "./network-options";

/**
 * Internal representation of stored backup. Contains all essential network information.
 * 
 * Additional `znp` object may contain extra information specific to Z-Stack based coordinators.
 */
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
    devices: {
        networkAddress: number;
        ieeeAddress: Buffer;
        isDirectChild: boolean;
        linkKey?: {
            key: Buffer;
            rxCounter: number;
            txCounter: number;
        };
    }[];
    znp?: {
        version?: ZnpVersion;
        trustCenterLinkKeySeed?: Buffer;
    };
}
