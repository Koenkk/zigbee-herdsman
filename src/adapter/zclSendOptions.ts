import type {ZclSendOptions} from "./tstype";

/** Check again inside the adapter queue, immediately before each radio submission. */
export function assertZclSendDeadline(options?: ZclSendOptions): void {
    if (options?.sendDeadline !== undefined) {
        if (!Number.isFinite(options.sendDeadline)) throw new Error("Invalid ZCL send deadline");
        if (performance.now() >= options.sendDeadline) throw new Error("ZCL request expired before transmission");
    }
}

/** Drivers must opt in; silently ignoring an actuator deadline is unsafe. */
export function validateZclSendOptions(options?: ZclSendOptions, supported = false): void {
    if (options?.requestApsAck !== undefined && typeof options.requestApsAck !== "boolean") {
        throw new Error("Invalid ZCL APS acknowledgement option");
    }
    assertZclSendDeadline(options);
    if (!supported && (options?.requestApsAck === true || options?.sendDeadline !== undefined)) {
        throw new Error("Adapter does not support requested ZCL delivery options");
    }
}
