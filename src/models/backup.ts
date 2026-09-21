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
    coordinatorIeeeAddress: Buffer;
    devices: {
        networkAddress: number | null;
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
    ezsp?: {
        version?: number;
        hashed_tclk?: Buffer;
    };
    zigate?: {
        tcLinkKey?: Buffer;
        tcKeyType?: number;
        /** Per-device APS link key type, keyed by IEEE address as a `0x`-prefixed hex string. */
        deviceLinkKeyTypes?: Record<string, number>;
    };
}
