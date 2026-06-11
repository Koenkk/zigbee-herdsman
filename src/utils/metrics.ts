import {EventEmitter} from "node:events";

export type SendStatus = "success" | "failure";

export interface AdapterSendZclUnicastPayload {
    ieeeAddr: string;
    status: SendStatus;
    durationSeconds: number;
}

export interface AdapterSendZdoPayload {
    ieeeAddr: string;
    clusterId: number;
    status: SendStatus;
    durationSeconds: number;
}

export interface AdapterSendZclGroupPayload {
    groupId: number;
    status: SendStatus;
    durationSeconds: number;
}

export interface AdapterSendZclBroadcastPayload {
    status: SendStatus;
    durationSeconds: number;
}

export interface AdapterRetryPayload {
    adapterType: string;
    ieeeAddr: string | undefined;
    reason: string;
}

export interface AdapterReceiveZclPayloadPayload {
    ieeeAddr: string | undefined;
    clusterID: number;
    wasBroadcast: boolean;
}

export interface AdapterReceiveZdoResponsePayload {
    clusterId: number;
}

export interface RequestQueueLengthPayload {
    ieeeAddr: string;
    endpointId: number;
    length: number;
}

export interface RequestQueueDurationPayload {
    ieeeAddr: string;
    endpointId: number;
    outcome: "sent" | "expired";
    durationSeconds: number;
}

export interface MetricsEventMap {
    adapterSendZclUnicast: [data: AdapterSendZclUnicastPayload];
    adapterSendZdo: [data: AdapterSendZdoPayload];
    adapterSendZclGroup: [data: AdapterSendZclGroupPayload];
    adapterSendZclBroadcast: [data: AdapterSendZclBroadcastPayload];
    adapterRetry: [data: AdapterRetryPayload];
    adapterReceiveZclPayload: [data: AdapterReceiveZclPayloadPayload];
    adapterReceiveZdoResponse: [data: AdapterReceiveZdoResponsePayload];
    requestQueueLength: [data: RequestQueueLengthPayload];
    requestQueueDuration: [data: RequestQueueDurationPayload];
}

export const metrics = new EventEmitter<MetricsEventMap>();
