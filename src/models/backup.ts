import type {ZnpVersion} from "../adapter/z-stack/adapter/tstype";
import type {NetworkOptions} from "./network-options";

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
    coordinatorIeeeAddress: Buffer<ArrayBuffer>;
    devices: {
        networkAddress: number | null;
        ieeeAddress: Buffer<ArrayBuffer>;
        isDirectChild: boolean;
        linkKey?: {
            key: Buffer<ArrayBuffer>;
            rxCounter: number;
            txCounter: number;
        };
    }[];
    znp?: {
        version?: ZnpVersion;
        trustCenterLinkKeySeed?: Buffer<ArrayBuffer>;
    };
    ezsp?: {
        version?: number;
        hashed_tclk?: Buffer<ArrayBuffer>;
    };
}
