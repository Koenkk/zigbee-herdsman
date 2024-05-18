/* istanbul ignore file */
import {logger} from "../../../utils/logger";
import {EmberStatus, EzspStatus} from "../enums";

const NS = 'zh:ember:queue';

interface EmberRequestQueueEntry {
    /**
     * Times tried to successfully send the call.
     * This has no maximum, but since it is only for temporary issues, it will either succeed after a couple of tries, or hard fail.
     */
    sendAttempts: number;
    /** The function the entry is supposed to execute. */
    func: () => Promise<EmberStatus>;
    /** The wrapping promise's reject to reject if necessary. */
    reject: (reason: Error) => void;
};

export const NETWORK_BUSY_DEFER_MSEC = 500;
export const NETWORK_DOWN_DEFER_MSEC = 1500;

export class EmberRequestQueue {
    private readonly dispatchInterval: number;
    /** If true, the queue is currently busy dispatching. */
    private dispatching: boolean;
    /** The queue holding requests to be sent. */
    private queue: EmberRequestQueueEntry[];
    /** Queue with requests that should take priority over the above queue. */
    private priorityQueue: EmberRequestQueueEntry[];

    constructor(dispatchInterval: number) {
        this.dispatchInterval = dispatchInterval || 5;
        this.dispatching = false;
        this.queue = [];
        this.priorityQueue = [];
    }

    /**
     * Empty each queue.
     */
    public clear(): void {
        this.queue = [];
        this.priorityQueue = [];
    }

    /**
     * Prevent sending requests (usually due to NCP being reset).
     */
    public stopDispatching(): void {
        this.dispatching = false;

        logger.info(`Request dispatching stopped; queue=${this.queue.length} priorityQueue=${this.priorityQueue.length}`, NS);
    }

    /**
     * Allow sending requests.
     * Must be called after init.
     */
    public startDispatching(): void {
        this.dispatching = true;

        setTimeout(this.dispatch.bind(this), 0);

        logger.info(`Request dispatching started.`, NS);
    }

    /**
     * Store a function in the queue to be resolved when appropriate.
     * @param function The function to enqueue. Upon dispatch:
     *     - if its return value is one of MAX_MESSAGE_LIMIT_REACHED, NETWORK_BUSY, NETWORK_DOWN,
     *       queue will defer dispatching and keep the function in the queue; reject otherwise.
     *     - if it throws, it is expected to throw `EzspStatus`, and will act same as above if one of NOT_CONNECTED, NO_TX_SPACE; reject otherwise.
     *     - any other value will result in the function being removed from the queue.
     * @param reject The `reject` of the Promise wrapping the `enqueue` call
     *     (`resolve` is done in `func` directly to have typing on results & control on exec).
     * @param prioritize If true, function will be enqueued in the priority queue. Defaults to false.
     * @returns new length of the queue.
     */
    public enqueue(func: () => Promise<EmberStatus>, reject: (reason: Error) => void, prioritize: boolean = false): number {
        logger.debug(`Status queue=${this.queue.length} priorityQueue=${this.priorityQueue.length}.`, NS);
        return (prioritize ? this.priorityQueue : this.queue).push({
            sendAttempts: 0,
            func,
            reject,
        });
    }

    /**
     * Dispatch the head of the queue.
     * 
     * If request `func` throws, catch error and reject the request. `ezsp${x}` functions throw `EzspStatus` as error.
     * 
     * If request `func` resolves but has an error, look at what error, and determine if should retry or remove the request from queue.
     * 
     * If request `func` resolves without error, remove request from queue.
     * 
     * WARNING: Because of this logic for "internal retries", any error thrown by `func` will not immediatedly bubble back to Adapter/Controller
     */
    private async dispatch(): Promise<void> {
        if (!this.dispatching) {
            return;
        }

        let fromPriorityQueue = true;
        let entry = this.priorityQueue[0];// head of queue if any, priority first

        if (!entry) {
            fromPriorityQueue = false;
            entry = this.queue[0];
        }

        if (entry) {
            entry.sendAttempts++;

            // NOTE: refer to `enqueue()` comment to keep logic in sync with expectations, adjust comment on change.
            try {
                const status: EmberStatus = (await entry.func());

                if ((status === EmberStatus.MAX_MESSAGE_LIMIT_REACHED) || (status === EmberStatus.NETWORK_BUSY)) {
                    logger.debug(`Dispatching deferred: NCP busy.`, NS);
                    this.defer(NETWORK_BUSY_DEFER_MSEC);
                } else if (status === EmberStatus.NETWORK_DOWN) {
                    logger.debug(`Dispatching deferred: Network not ready`, NS);
                    this.defer(NETWORK_DOWN_DEFER_MSEC);
                } else {
                    // success
                    (fromPriorityQueue ? this.priorityQueue : this.queue).shift();

                    if (status !== EmberStatus.SUCCESS) {
                        entry.reject(new Error(EmberStatus[status]));
                    }
                }
            } catch (err) {// message is EzspStatus string from ezsp${x} commands, except for stuff rejected by OneWaitress, but that's never "retry"
                if (err.message === EzspStatus[EzspStatus.NO_TX_SPACE]) {
                    logger.debug(`Dispatching deferred: Host busy.`, NS);
                    this.defer(NETWORK_BUSY_DEFER_MSEC);
                } else if (err.message === EzspStatus[EzspStatus.NOT_CONNECTED]) {
                    logger.debug(`Dispatching deferred: Network not ready`, NS);
                    this.defer(NETWORK_DOWN_DEFER_MSEC);
                } else {
                    (fromPriorityQueue ? this.priorityQueue : this.queue).shift();
                    entry.reject(err);
                }
            }
        }

        if (this.dispatching) {
            setTimeout(this.dispatch.bind(this), this.dispatchInterval);
        }
    }

    /**
     * Defer dispatching for the specified duration (in msec).
     * @param msec 
     */
    private defer(msec: number): void {
        this.stopDispatching();

        setTimeout(this.startDispatching.bind(this), msec);
    }
}
