import type {FrameControl} from "../zspec/zcl/definition/tstype";
import type {Device, Endpoint} from "./model";
import type {KeyValue} from "./tstype";

export interface DeviceJoinedPayload {
    device: Device;
}

export interface DeviceInterviewPayload {
    status: "started" | "successful" | "failed";
    device: Device;
}

export interface DeviceNetworkAddressChangedPayload {
    device: Device;
}

export interface DeviceAnnouncePayload {
    device: Device;
}

export interface DeviceLeavePayload {
    ieeeAddr: string;
}

export interface PermitJoinChangedPayload {
    permitted: boolean;
    time?: number;
}

export interface LastSeenChangedPayload {
    device: Device;
    reason: "deviceAnnounce" | "networkAddress" | "deviceJoined" | "messageEmitted" | "messageNonEmitted";
}

export type MessagePayloadType = "attributeReport" | "readResponse" | "raw" | "read" | "write" | `command${string}`;

export interface MessagePayload {
    type: MessagePayloadType;
    device: Device;
    endpoint: Endpoint;
    linkquality: number;
    groupID: number;
    cluster: string | number;
    data: KeyValue | Array<string | number> | Buffer;
    meta: {
        zclTransactionSequenceNumber?: number;
        manufacturerCode?: number;
        frameControl?: FrameControl;
        rawData: Buffer;
    };
}
