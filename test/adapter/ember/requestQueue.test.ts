import {
    EmberRequestQueue,
    BUSY_DEFER_MSEC,
    NETWORK_DOWN_DEFER_MSEC,
    MAX_SEND_ATTEMPTS,
    HIGH_COUNT,
} from '../../../src/adapter/ember/adapter/requestQueue';
import {SLStatus, EzspStatus} from '../../../src/adapter/ember/enums';
import {EzspError} from '../../../src/adapter/ember/ezspError';
import {Wait} from '../../../src/utils';

describe('Ember Request Queue', () => {
    let requestQueue: EmberRequestQueue;
    let fakeWaitTime: number = 1000;
    let varyingReturn: SLStatus = SLStatus.OK;
    let deferSpy: jest.SpyInstance;

    const getVaryingReturn = async (): Promise<SLStatus> => {
        await Wait(fakeWaitTime);
        return varyingReturn;
    };

    const getQueueEntryAt = (index: number, fromPriorityQueue: boolean = false) => {
        // @ts-expect-error private
        const queue = fromPriorityQueue ? requestQueue.priorityQueue : requestQueue.queue;

        return queue[index];
    };

    const mockAdapterCommand = async (returnFunc: () => Promise<SLStatus>, priority: boolean = false): Promise<number> => {
        return new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<SLStatus> => {
                    const status: SLStatus = await returnFunc();

                    if (status !== SLStatus.OK) {
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
                priority,
            );
        });
    };

    beforeAll(async () => {
        jest.useFakeTimers();
    });

    afterAll(async () => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        requestQueue = new EmberRequestQueue(60);
        //@ts-expect-error private
        deferSpy = jest.spyOn(requestQueue, 'defer');
    });

    afterEach(() => {
        fakeWaitTime = 1000;
        varyingReturn = SLStatus.OK;

        requestQueue.stopDispatching();
        requestQueue.clear();
    });

    it('Creates queue with fallback dispatch interval', async () => {
        const queue = new EmberRequestQueue(0);

        // @ts-expect-error private
        expect(queue.dispatchInterval).toStrictEqual(5);
    });

    it('Queues request and resolves it', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = SLStatus.OK;
        const p = mockAdapterCommand(getVaryingReturn);
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');
        const funcRejectSpy = jest.spyOn(getQueueEntryAt(0), 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.startDispatching();

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20);

        await expect(p).resolves.toBe(123); // gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(1); // enqueued func was called
        expect(funcRejectSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0); // no longer in queue
    });

    it('Queues request, rejects it on error, and removes it from queue', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = SLStatus.FAIL;
        const p = mockAdapterCommand(getVaryingReturn);
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');
        const funcRejectSpy = jest.spyOn(getQueueEntryAt(0), 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.startDispatching();

        jest.advanceTimersByTime(fakeWaitTime + 20);

        await expect(p).rejects.toStrictEqual(new Error(SLStatus[varyingReturn]));

        expect(funcSpy).toHaveBeenCalledTimes(1);
        expect(funcRejectSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0); // no longer in queue
    });

    it('Queues request, rejects it on throw, and removes it from queue', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        const p = mockAdapterCommand(async (): Promise<SLStatus> => {
            await Wait(fakeWaitTime);
            throw new EzspError(EzspStatus.ASH_ACK_TIMEOUT);
        });
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');
        const funcRejectSpy = jest.spyOn(getQueueEntryAt(0), 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.startDispatching();

        jest.advanceTimersByTime(fakeWaitTime + 20);
        await expect(p).rejects.toStrictEqual(new EzspError(EzspStatus.ASH_ACK_TIMEOUT));

        expect(funcSpy).toHaveBeenCalledTimes(1);
        expect(funcRejectSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0); // no longer in queue
    });

    it('Queues priority request, rejects it on throw, and removes it from queue', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        const p = mockAdapterCommand(async (): Promise<SLStatus> => {
            await Wait(fakeWaitTime);
            throw new EzspError(EzspStatus.ASH_ACK_TIMEOUT);
        }, true);
        const funcSpy = jest.spyOn(getQueueEntryAt(0, true), 'func');
        const funcRejectSpy = jest.spyOn(getQueueEntryAt(0, true), 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.priorityQueue).toHaveLength(1);

        requestQueue.startDispatching();

        jest.advanceTimersByTime(fakeWaitTime + 20);
        await expect(p).rejects.toStrictEqual(new EzspError(EzspStatus.ASH_ACK_TIMEOUT));

        expect(funcSpy).toHaveBeenCalledTimes(1);
        expect(funcRejectSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.priorityQueue).toHaveLength(0); // no longer in queue
    });

    it('Queues request, defers on BUSY and defers again on NETWORK_DOWN', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = SLStatus.BUSY;
        const p = mockAdapterCommand(getVaryingReturn);
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // enqueued

        requestQueue.startDispatching();

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20 + BUSY_DEFER_MSEC * 0.25);

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // still in queue

        await jest.advanceTimersByTimeAsync(BUSY_DEFER_MSEC + 20);

        varyingReturn = SLStatus.NETWORK_DOWN;

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20 + NETWORK_DOWN_DEFER_MSEC * 0.25);

        expect(deferSpy).toHaveBeenCalledTimes(2);
        expect(funcSpy).toHaveBeenCalledTimes(2); // dispatch x2, func called x2
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // still in queue

        await jest.advanceTimersByTimeAsync(NETWORK_DOWN_DEFER_MSEC + 20);
    });

    it('Queues request, defers on BUSY and then resolves it', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = SLStatus.BUSY;
        const p = mockAdapterCommand(getVaryingReturn);
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // enqueued

        requestQueue.startDispatching();

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20 + BUSY_DEFER_MSEC * 0.25);

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // still in queue

        await jest.advanceTimersByTimeAsync(BUSY_DEFER_MSEC + 20);

        varyingReturn = SLStatus.OK;

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20);

        await expect(p).resolves.toBe(123); // gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(2); // enqueued func was called
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0); // no longer in queue
    });

    it('Queues request, defers on BUSY and only retries once after internal change', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = SLStatus.BUSY;
        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(async (): Promise<SLStatus> => {
                const status: SLStatus = await getVaryingReturn();

                if (status !== SLStatus.OK) {
                    // internally changes external parameter that changes the queue's next run
                    varyingReturn = SLStatus.OK;
                    return status;
                }

                resolve(123);
                return status;
            }, reject);
        });
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // enqueued

        requestQueue.startDispatching();

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20 + BUSY_DEFER_MSEC * 0.25);

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // still in queue

        await jest.advanceTimersByTimeAsync(BUSY_DEFER_MSEC + 20);

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20);

        await expect(p).resolves.toBe(123); // gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(2); // enqueued func was called
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0); // no longer in queue
    });

    it('Queues request, defers on thrown BUSY', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        const p = mockAdapterCommand(async (): Promise<SLStatus> => {
            await Wait(fakeWaitTime);
            throw new EzspError(EzspStatus.NO_TX_SPACE);
        });
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // enqueued

        requestQueue.startDispatching();

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20 + BUSY_DEFER_MSEC * 0.25);

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // still in queue

        await jest.advanceTimersByTimeAsync(BUSY_DEFER_MSEC + 20);
    });

    it('Queues request, defers on thrown NETWORK_DOWN', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        const p = mockAdapterCommand(async (): Promise<SLStatus> => {
            await Wait(fakeWaitTime);
            throw new EzspError(EzspStatus.NOT_CONNECTED);
        });
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // enqueued

        requestQueue.startDispatching();

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 20 + BUSY_DEFER_MSEC * 0.25);

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // still in queue

        await jest.advanceTimersByTimeAsync(BUSY_DEFER_MSEC + 20);
    });

    it('Queues request and resolves by priority', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = SLStatus.OK;
        const p = mockAdapterCommand(getVaryingReturn);
        const pPrio = mockAdapterCommand(getVaryingReturn, true);
        const funcSpy = jest.spyOn(getQueueEntryAt(0), 'func');
        const funcPrioSpy = jest.spyOn(getQueueEntryAt(0, true), 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(2);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        expect(funcPrioSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);
        //@ts-expect-error private
        expect(requestQueue.priorityQueue).toHaveLength(1);

        requestQueue.startDispatching();

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 1); // before 2nd setTimeout triggers

        await expect(pPrio).resolves.toBe(123); // gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(0); // enqueued func was not called
        expect(funcPrioSpy).toHaveBeenCalledTimes(1); // enqueued func was called
        //@ts-expect-error private
        expect(requestQueue.priorityQueue).toHaveLength(0); // no longer in queue
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1); // still in queue

        await jest.advanceTimersByTimeAsync(fakeWaitTime * 2 + 20);

        await expect(p).resolves.toBe(123); // gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(1); // enqueued func was called
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0); // no longer in queue
    });

    it('Clears queue', async () => {
        const mockFunc = jest.fn();
        const mockReject = jest.fn();

        requestQueue.enqueue(mockFunc, mockReject);
        requestQueue.enqueue(mockFunc, mockReject);
        requestQueue.enqueue(mockFunc, mockReject, true);
        requestQueue.clear();
        expect(requestQueue.totalQueued).toStrictEqual(0);
        expect(mockFunc).toHaveBeenCalledTimes(0);
        expect(mockReject).toHaveBeenCalledTimes(0);
    });

    it('Detects when queue is high', () => {
        const mockFunc = jest.fn();
        const mockReject = jest.fn();

        requestQueue.enqueue(mockFunc, mockReject);

        expect(requestQueue.isHigh).toStrictEqual(false);

        for (let i = 0; i < HIGH_COUNT; i++) {
            requestQueue.enqueue(mockFunc, mockReject);
        }

        expect(requestQueue.isHigh).toStrictEqual(true);

        requestQueue.clear();

        expect(requestQueue.isHigh).toStrictEqual(false);
    });

    it('Rejects after too many attempts', async () => {
        varyingReturn = SLStatus.OK;
        const p = mockAdapterCommand(getVaryingReturn);

        getQueueEntryAt(0).sendAttempts = MAX_SEND_ATTEMPTS + 1;

        requestQueue.startDispatching();

        jest.advanceTimersByTime(fakeWaitTime + 20);

        expect(p).rejects.toStrictEqual(new Error(`Failed ${MAX_SEND_ATTEMPTS} attempts to send`));
    });
});
