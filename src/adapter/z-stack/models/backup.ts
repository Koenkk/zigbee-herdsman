import {apsmeTcLinkKeyEntry} from "../structs";
import {NetworkOptions} from "./network-options";

export interface Backup {
    networkOptions: NetworkOptions;
    networkKeyInfo: {
        sequenceNumber: number;
        frameCounter: number;
    };
    securityLevel: number;
    networkUpdateId: number;
    coordinatorIeeeAddress: Buffer;
    tcLinkKeyTable?: ReturnType<typeof apsmeTcLinkKeyEntry>[];
}
