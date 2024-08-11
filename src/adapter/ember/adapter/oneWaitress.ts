/* istanbul ignore file */
import equals from 'fast-deep-equal/es6';

import {TOUCHLINK_PROFILE_ID} from '../../../zspec/consts';
import {NodeId} from '../../../zspec/tstypes';
import * as Zdo from '../../../zspec/zdo/';
import {ZclPayload} from '../../events';
import {EmberApsFrame} from '../types';

/** Events specific to OneWaitress usage. */
export enum OneWaitressEvents {
    STACK_STATUS_NETWORK_UP = 'STACK_STATUS_NETWORK_UP',
    STACK_STATUS_NETWORK_DOWN = 'STACK_STATUS_NETWORK_DOWN',
    STACK_STATUS_NETWORK_OPENED = 'STACK_STATUS_NETWORK_OPENED',
    STACK_STATUS_NETWORK_CLOSED = 'STACK_STATUS_NETWORK_CLOSED',
    STACK_STATUS_CHANNEL_CHANGED = 'STACK_STATUS_CHANNEL_CHANGED',
}

type OneWaitressMatcher = {
    /**
     * Matches `indexOrDestination` in `ezspMessageSentHandler` or `sender` in `ezspIncomingMessageHandler`
     * Except for InterPAN touchlink, it should always be present.
     */
    target?: NodeId;
    apsFrame: EmberApsFrame;
    /** Cluster ID for when the response doesn't match the request. Takes priority over apsFrame.clusterId. Should be mostly for ZDO requests. */
    responseClusterId?: number;
    /** ZCL frame transaction sequence number */
    zclSequence?: number;
    /** Expected command ID for ZCL commands */
    commandIdentifier?: number;
};

type OneWaitressEventMatcher = {
    eventName: string;
    /** If supplied, keys/values are expected to match with resolve payload. */
    payload?: {[k: string]: unknown};
};

interface Waiter<A, B> {
    id: number;
    matcher: A;
    timer?: NodeJS.Timeout;
    resolve: (payload: B) => void;
    reject: (error: Error) => void;
    resolved: boolean;
    timedout: boolean;
}

/**
 * The one waitress to rule them all. Hopefully.
 * Careful, she'll burn you if you're late on delivery!
 *
 * NOTE: `messageTag` is unreliable, so not used...
 */
export class EmberOneWaitress {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly waiters: Map<number, Waiter<OneWaitressMatcher, any>>;
    // NOTE: for now, this could be much simpler (array-like), but more complex events might come into play
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly eventWaiters: Map<number, Waiter<OneWaitressEventMatcher, any>>;
    private currentId: number;
    private currentEventId: number;

    public constructor() {
        this.waiters = new Map();
        this.eventWaiters = new Map();
        this.currentId = 0;
        this.currentEventId = 0;
    }

    /**
     * Reject because of failed delivery notified by `ezspMessageSentHandler`.
     * NOTE: This checks for APS sequence, which is only valid in `ezspMessageSentHandler`, not `ezspIncomingMessageHandler` (sequence from stack)
     *
     * @param target
     * @param apsFrame
     * @returns
     */
    public deliveryFailedFor(target: number, apsFrame: EmberApsFrame): boolean {
        for (const [index, waiter] of this.waiters.entries()) {
            if (waiter.timedout) {
                this.waiters.delete(index);
                continue;
            }

            // no target in touchlink
            // in `ezspMessageSentHandler`, the clusterId for ZDO is still the request one, so check against apsFrame, not override
            if (
                (waiter.matcher.apsFrame.profileId === TOUCHLINK_PROFILE_ID || target === waiter.matcher.target) &&
                apsFrame.sequence === waiter.matcher.apsFrame.sequence &&
                apsFrame.profileId === waiter.matcher.apsFrame.profileId &&
                apsFrame.clusterId === waiter.matcher.apsFrame.clusterId
            ) {
                clearTimeout(waiter.timer);

                waiter.resolved = true;

                this.waiters.delete(index);
                waiter.reject(new Error(`Delivery failed for ${JSON.stringify(apsFrame)}`));

                return true;
            }
        }

        return false;
    }

    /**
     * Resolve or reject ZDO response based on given status.
     * @param status
     * @param sender
     * @param apsFrame
     * @param payload
     * @returns
     */
    public resolveZDO(sender: NodeId, apsFrame: EmberApsFrame, payload: unknown | Zdo.StatusError): boolean {
        for (const [index, waiter] of this.waiters.entries()) {
            if (waiter.timedout) {
                this.waiters.delete(index);
                continue;
            }

            // always a sender expected in ZDO, profileId is a bit redundant here, but...
            if (
                sender === waiter.matcher.target &&
                apsFrame.profileId === waiter.matcher.apsFrame.profileId &&
                apsFrame.clusterId ===
                    (waiter.matcher.responseClusterId != null ? waiter.matcher.responseClusterId : waiter.matcher.apsFrame.clusterId)
            ) {
                clearTimeout(waiter.timer);

                waiter.resolved = true;

                this.waiters.delete(index);

                if (payload instanceof Zdo.StatusError || payload instanceof Error) {
                    waiter.reject(new Error(`[ZDO] Failed response for '${sender}' cluster '${apsFrame.clusterId}' ${payload.message}.`));
                } else {
                    waiter.resolve(payload);
                }

                return true;
            }
        }

        return false;
    }

    public resolveZCL(payload: ZclPayload): boolean {
        if (!payload.header) return false;

        for (const [index, waiter] of this.waiters.entries()) {
            if (waiter.timedout) {
                this.waiters.delete(index);
                continue;
            }

            // no target in touchlink, also no APS sequence, but use the ZCL one instead
            if (
                (waiter.matcher.apsFrame.profileId === TOUCHLINK_PROFILE_ID || payload.address === waiter.matcher.target) &&
                (!waiter.matcher.zclSequence || payload.header.transactionSequenceNumber === waiter.matcher.zclSequence) &&
                (!waiter.matcher.commandIdentifier || payload.header.commandIdentifier === waiter.matcher.commandIdentifier) &&
                payload.clusterID === waiter.matcher.apsFrame.clusterId &&
                payload.endpoint === waiter.matcher.apsFrame.destinationEndpoint
            ) {
                clearTimeout(waiter.timer);

                waiter.resolved = true;

                this.waiters.delete(index);
                waiter.resolve(payload);

                return true;
            }
        }

        return false;
    }

    public waitFor<T>(matcher: OneWaitressMatcher, timeout: number): {id: number; start: () => {promise: Promise<T>; id: number}} {
        const id = this.currentId++;
        this.currentId &= 0xffff; // roll-over every so often - 65535 should be enough not to create conflicts ;-)

        const promise: Promise<T> = new Promise((resolve, reject): void => {
            const object: Waiter<typeof matcher, T> = {matcher, resolve, reject, timedout: false, resolved: false, id};

            this.waiters.set(id, object);
        });

        const start = (): {promise: Promise<T>; id: number} => {
            const waiter = this.waiters.get(id);

            if (waiter && !waiter.resolved && !waiter.timer) {
                // Capture the stack trace from the caller of start()
                const error = new Error();
                Error.captureStackTrace(error);

                waiter.timer = setTimeout((): void => {
                    error.message = `${JSON.stringify(matcher)} timed out after ${timeout}ms`;
                    waiter.timedout = true;

                    waiter.reject(error);
                }, timeout);
            }

            return {promise, id};
        };

        return {id, start};
    }

    /**
     * Shortcut that starts the timer immediately and returns the promise.
     * No access to `id`, so no easy cancel.
     * @param matcher
     * @param timeout
     * @returns
     */
    public startWaitingFor<T>(matcher: OneWaitressMatcher, timeout: number): Promise<T> {
        return this.waitFor<T>(matcher, timeout).start().promise;
    }

    public remove(id: number): void {
        const waiter = this.waiters.get(id);

        if (waiter) {
            if (!waiter.timedout && waiter.timer) {
                clearTimeout(waiter.timer);
            }

            this.waiters.delete(id);
        }
    }

    /**
     * Matches event name with matcher's, and payload (if any in matcher) using `fast-deep-equal/es6` (all keys & values must match)
     * @param eventName
     * @param payload
     * @returns
     */
    public resolveEvent(eventName: string, payload?: {[k: string]: unknown}): boolean {
        for (const [index, waiter] of this.eventWaiters.entries()) {
            if (waiter.timedout) {
                this.eventWaiters.delete(index);
                continue;
            }

            if (eventName === waiter.matcher.eventName && (!waiter.matcher.payload || equals(payload, waiter.matcher.payload))) {
                clearTimeout(waiter.timer);

                waiter.resolved = true;

                this.eventWaiters.delete(index);
                waiter.resolve(payload);

                return true;
            }
        }

        return false;
    }

    public waitForEvent<T>(
        matcher: OneWaitressEventMatcher,
        timeout: number,
        reason?: string,
    ): {id: number; start: () => {promise: Promise<T>; id: number}} {
        // NOTE: logic is very much the same as `waitFor`, just different matcher
        const id = this.currentEventId++;
        this.currentEventId &= 0xffff; // roll-over every so often - 65535 should be enough not to create conflicts ;-)

        const promise: Promise<T> = new Promise((resolve, reject): void => {
            const object: Waiter<typeof matcher, T> = {matcher, resolve, reject, timedout: false, resolved: false, id};

            this.eventWaiters.set(id, object);
        });

        const start = (): {promise: Promise<T>; id: number} => {
            const waiter = this.eventWaiters.get(id);

            if (waiter && !waiter.resolved && !waiter.timer) {
                // Capture the stack trace from the caller of start()
                const error = new Error();
                Error.captureStackTrace(error);

                waiter.timer = setTimeout((): void => {
                    error.message = `${reason ? reason : JSON.stringify(matcher)} timed out after ${timeout}ms`;
                    waiter.timedout = true;

                    waiter.reject(error);
                }, timeout);
            }

            return {promise, id};
        };

        return {id, start};
    }

    /**
     * Shortcut that starts the timer immediately and returns the promise.
     * No access to `id`, so no easy cancel.
     * @param matcher
     * @param timeout
     * @param reason If supplied, will be used as timeout label, otherwise stringified matcher is.
     * @returns
     */
    public startWaitingForEvent<T>(matcher: OneWaitressEventMatcher, timeout: number, reason?: string): Promise<T> {
        return this.waitForEvent<T>(matcher, timeout, reason).start().promise;
    }

    public removeEvent(id: number): void {
        const waiter = this.eventWaiters.get(id);

        if (waiter) {
            if (!waiter.timedout && waiter.timer) {
                clearTimeout(waiter.timer);
            }

            this.eventWaiters.delete(id);
        }
    }
}
