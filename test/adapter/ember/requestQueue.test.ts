import {EmberRequestQueue, NETWORK_BUSY_DEFER_MSEC, NETWORK_DOWN_DEFER_MSEC} from '../../../src/adapter/ember/adapter/requestQueue';
import {EmberStatus, EzspStatus} from '../../../src/adapter/ember/enums';
import {Wait} from '../../../src/utils';

let fakeWaitTime = 1000;
let varyingReturn: EmberStatus = EmberStatus.SUCCESS;
const getVaryingReturn = async (): Promise<EmberStatus> => {
    await Wait(fakeWaitTime);
    return varyingReturn;
};
const getThrownError = async (): Promise<EmberStatus> => {
    await Wait(fakeWaitTime);
    throw new Error(EzspStatus[EzspStatus.ASH_ACK_TIMEOUT]);
}
const getThrowNetworkBusy = async (): Promise<EmberStatus> => {
    await Wait(fakeWaitTime);
    throw new Error(EzspStatus[EzspStatus.NO_TX_SPACE]);
};
const getThrowNetworkDown = async (): Promise<EmberStatus> => {
    await Wait(fakeWaitTime);
    throw new Error(EzspStatus[EzspStatus.NOT_CONNECTED]);
};

class TestThis {
    public bs: boolean;
    public q: EmberRequestQueue;

    constructor() {
        this.bs = false;
        this.q = new EmberRequestQueue(60);
    }

    public async getNewBS(): Promise<boolean> {
        await new Promise<void>((resolve, reject): void => {
            this.q.enqueue(
                async (): Promise<EmberStatus> => {
                    await Wait(fakeWaitTime);

                    this.bs = true;

                    resolve();
                    return EmberStatus.SUCCESS;
                },
                reject,
            )
        })
        
        return this.bs;
    }
}

let deferSpy;

describe('Ember Request Queue', () => {
    let requestQueue: EmberRequestQueue;

    beforeAll(async () => {
        jest.useFakeTimers();
    });

    afterAll(async () => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        requestQueue = new EmberRequestQueue(60);
        // don't let defer (dispatching tick mgmt) interfere with "manual" flow of tests unless wanted
        deferSpy = jest.spyOn(requestQueue, 'defer').mockImplementation(jest.fn());
    });

    afterEach(() => {
        fakeWaitTime = 1000;
        varyingReturn = EmberStatus.SUCCESS;
    });

    it('Queues request and resolves it', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = EmberStatus.SUCCESS;
        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getVaryingReturn();

                    if (status !== EmberStatus.SUCCESS) {
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
            );
        });
        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');
        //@ts-expect-error private
        const funcRejectSpy = jest.spyOn(requestQueue.queue[0], 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.dispatch();// don't await so we can advance timer

        jest.advanceTimersByTime(fakeWaitTime + 100);

        await expect(p).resolves.toBe(123);// gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(1);// enqueued func was called
        expect(funcRejectSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request, rejects it on error, and removes it from queue', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = EmberStatus.ERR_FATAL;
        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getVaryingReturn();

                    if (status !== EmberStatus.SUCCESS) {
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
            );
        });
        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');
        //@ts-expect-error private
        const funcRejectSpy = jest.spyOn(requestQueue.queue[0], 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.dispatch();// don't await so we can advance timer

        jest.advanceTimersByTime(fakeWaitTime + 100);

        await expect(p).rejects.toStrictEqual(new Error(EmberStatus[varyingReturn]));

        expect(funcSpy).toHaveBeenCalledTimes(1);
        expect(funcRejectSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request, rejects it on throw, and removes it from queue', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getThrownError();

                    if (status !== EmberStatus.SUCCESS) {
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
            );
        });
        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');
        //@ts-expect-error private
        const funcRejectSpy = jest.spyOn(requestQueue.queue[0], 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.dispatch();// don't await so we can advance timer

        jest.advanceTimersByTime(fakeWaitTime + 100);

        await expect(p).rejects.toStrictEqual(new Error(EzspStatus[EzspStatus.ASH_ACK_TIMEOUT]));

        expect(funcSpy).toHaveBeenCalledTimes(1);
        expect(funcRejectSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request, defers on NETWORK_BUSY and defers again on NETWORK_DOWN', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = EmberStatus.NETWORK_BUSY;
        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getVaryingReturn();

                    if (status !== EmberStatus.SUCCESS) {
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
            );
        });
        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// enqueued


        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100 + (NETWORK_BUSY_DEFER_MSEC * 0.25));

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// still in queue

        await jest.advanceTimersByTimeAsync(NETWORK_BUSY_DEFER_MSEC + 100);

        varyingReturn = EmberStatus.NETWORK_DOWN;

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100 + (NETWORK_DOWN_DEFER_MSEC * 0.25));

        expect(deferSpy).toHaveBeenCalledTimes(2);
        expect(funcSpy).toHaveBeenCalledTimes(2);// dispatch x2, func called x2
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// still in queue

        await jest.advanceTimersByTimeAsync(NETWORK_DOWN_DEFER_MSEC + 100);
    });
    it('Queues request, defers on NETWORK_BUSY and then resolves it', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = EmberStatus.NETWORK_BUSY;
        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getVaryingReturn();

                    if (status !== EmberStatus.SUCCESS) {
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
            );
        });
        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// enqueued

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100 + (NETWORK_BUSY_DEFER_MSEC * 0.25));

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// still in queue

        await jest.advanceTimersByTimeAsync(NETWORK_BUSY_DEFER_MSEC + 100);

        varyingReturn = EmberStatus.SUCCESS;

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100);

        await expect(p).resolves.toBe(123);// gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(2);// enqueued func was called
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request, defers on NETWORK_BUSY and only retries once after internal change', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = EmberStatus.NETWORK_BUSY;
        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getVaryingReturn();

                    if (status !== EmberStatus.SUCCESS) {
                        // internally changes external parameter that changes the queue's next run
                        varyingReturn = EmberStatus.SUCCESS;
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
            );
        });
        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// enqueued

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100 + (NETWORK_BUSY_DEFER_MSEC * 0.25));

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// still in queue

        await jest.advanceTimersByTimeAsync(NETWORK_BUSY_DEFER_MSEC + 100);

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100);

        await expect(p).resolves.toBe(123);// gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(2);// enqueued func was called
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request, defers on thrown NETWORK_BUSY', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getThrowNetworkBusy();

                    if (status !== EmberStatus.SUCCESS) {
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
            );
        });
        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// enqueued

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100 + (NETWORK_BUSY_DEFER_MSEC * 0.25));

        expect(deferSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// still in queue

        await jest.advanceTimersByTimeAsync(NETWORK_BUSY_DEFER_MSEC + 100);
    });
    it('Queues request and resolves by priority', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = EmberStatus.SUCCESS;
        const p = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getVaryingReturn();

                    if (status !== EmberStatus.SUCCESS) {
                        return status;
                    }

                    resolve(123);
                    return status;
                },
                reject,
            );
        });
        const pPrio = new Promise<number>((resolve, reject) => {
            requestQueue.enqueue(
                async (): Promise<EmberStatus> => {
                    const status: EmberStatus = await getVaryingReturn();

                    if (status !== EmberStatus.SUCCESS) {
                        return status;
                    }

                    resolve(456);
                    return status;
                },
                reject,
                true,
            );
        });
        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');
        //@ts-expect-error private
        const funcPrioSpy = jest.spyOn(requestQueue.priorityQueue[0], 'func');

        expect(enqueueSpy).toHaveBeenCalledTimes(2);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        expect(funcPrioSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);
        //@ts-expect-error private
        expect(requestQueue.priorityQueue).toHaveLength(1);

        requestQueue.dispatch();// don't await so we can advance timer

        jest.advanceTimersByTime(fakeWaitTime + 100);

        await expect(pPrio).resolves.toBe(456);// gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(0);// enqueued func was not called
        expect(funcPrioSpy).toHaveBeenCalledTimes(1);// enqueued func was called
        //@ts-expect-error private
        expect(requestQueue.priorityQueue).toHaveLength(0);// no longer in queue
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// still in queue

        requestQueue.dispatch();// don't await so we can advance timer

        jest.advanceTimersByTime(fakeWaitTime + 100);

        await expect(p).resolves.toBe(123);// gives result of resolve

        expect(funcSpy).toHaveBeenCalledTimes(1);// enqueued func was called
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request send & forget style', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = EmberStatus.SUCCESS;

        requestQueue.enqueue(async (): Promise<EmberStatus> => {
            const status: EmberStatus = await getVaryingReturn();

            if (status !== EmberStatus.SUCCESS) {
                return status;
            }

            return status;
        }, () => {});

        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');
        //@ts-expect-error private
        const funcRejectSpy = jest.spyOn(requestQueue.queue[0], 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100);

        expect(funcSpy).toHaveBeenCalledTimes(1);// enqueued func was called
        expect(funcRejectSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request send & forget style that errors out silently', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        varyingReturn = EmberStatus.ERR_FATAL;

        requestQueue.enqueue(async (): Promise<EmberStatus> => {
            const status: EmberStatus = await getVaryingReturn();

            if (status !== EmberStatus.SUCCESS) {
                return status;
            }

            return status;
        }, () => {});

        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');
        //@ts-expect-error private
        const funcRejectSpy = jest.spyOn(requestQueue.queue[0], 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100);

        expect(funcSpy).toHaveBeenCalledTimes(1);// enqueued func was called
        expect(funcRejectSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request send & forget style that throws silently', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        requestQueue.enqueue(async (): Promise<EmberStatus> => {
            const status: EmberStatus = await getThrownError();

            if (status !== EmberStatus.SUCCESS) {
                return status;
            }

            return status;
        }, () => {});

        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');
        //@ts-expect-error private
        const funcRejectSpy = jest.spyOn(requestQueue.queue[0], 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100);

        expect(funcSpy).toHaveBeenCalledTimes(1);// enqueued func was called
        expect(funcRejectSpy).toHaveBeenCalledTimes(1);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(0);// no longer in queue
    });
    it('Queues request send & forget style that throws NETWORK_DOWN silently and retries', async () => {
        const enqueueSpy = jest.spyOn(requestQueue, 'enqueue');

        requestQueue.enqueue(async (): Promise<EmberStatus> => {
            const status: EmberStatus = await getThrowNetworkDown();

            if (status !== EmberStatus.SUCCESS) {
                return status;
            }

            return status;
        }, () => {});

        //@ts-expect-error private
        const funcSpy = jest.spyOn(requestQueue.queue[0], 'func');
        //@ts-expect-error private
        const funcRejectSpy = jest.spyOn(requestQueue.queue[0], 'reject');

        expect(enqueueSpy).toHaveBeenCalledTimes(1);
        expect(funcSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100);

        expect(funcSpy).toHaveBeenCalledTimes(1);// enqueued func was called
        expect(funcRejectSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// still in queue

        await jest.advanceTimersByTimeAsync(NETWORK_DOWN_DEFER_MSEC * 2);

        requestQueue.dispatch();// don't await so we can advance timer

        await jest.advanceTimersByTimeAsync(fakeWaitTime + 100);

        expect(funcSpy).toHaveBeenCalledTimes(2);// enqueued func was called
        expect(funcRejectSpy).toHaveBeenCalledTimes(0);
        //@ts-expect-error private
        expect(requestQueue.queue).toHaveLength(1);// still in queue

        await jest.advanceTimersByTimeAsync(NETWORK_DOWN_DEFER_MSEC * 2);
    });

    it('In-class queues also work, just for kicks...', async () => {
        const t = new TestThis();

        expect(t.bs).toBeFalsy();

        const tBS = t.getNewBS();

        t.q.dispatch();// don't await so we can advance timer
        jest.advanceTimersByTime(fakeWaitTime + 100);

        await expect(tBS).resolves.toBeTruthy();
    })
});
