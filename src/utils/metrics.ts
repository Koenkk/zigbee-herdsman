export interface Metrics {
    adapterSendZclUnicast(ieeeAddr: string, status: "success" | "failure", durationSeconds: number): void;
    adapterSendZdo(ieeeAddr: string, clusterId: number, status: "success" | "failure", durationSeconds: number): void;
    adapterSendZclGroup(groupId: number, status: "success" | "failure", durationSeconds: number): void;
    adapterSendZclBroadcast(status: "success" | "failure", durationSeconds: number): void;
    adapterRetry(adapterType: string, ieeeAddr: string | undefined, reason: string): void;
    requestQueueLength(ieeeAddr: string, endpointId: number, length: number): void;
    requestQueueDuration(ieeeAddr: string, endpointId: number, outcome: "sent" | "expired", durationSeconds: number): void;
}

export const noopMetrics: Metrics = {
    adapterSendZclUnicast: () => {},
    adapterSendZdo: () => {},
    adapterSendZclGroup: () => {},
    adapterSendZclBroadcast: () => {},
    adapterRetry: () => {},
    requestQueueLength: () => {},
    requestQueueDuration: () => {},
};

export let metrics: Metrics = noopMetrics;

export function setMetrics(m: Metrics): void {
    metrics = m;
}
