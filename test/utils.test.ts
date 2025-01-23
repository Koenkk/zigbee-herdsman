import {Queue, Utils, wait, Waitress} from '../src/utils';
import {logger, setLogger} from '../src/utils/logger';

const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
};

describe('Utils', () => {
    it('Is Number Array', () => {
        expect(Utils.isNumberArray([1, 2, 3])).toBeTruthy();
        expect(Utils.isNumberArray([1, 2, '3'])).toBeFalsy();
        expect(Utils.isNumberArray('nonarray')).toBeFalsy();
    });

    it('Is Number Array of length', () => {
        expect(Utils.isNumberArrayOfLength([1, 2, 3], 3)).toBeTruthy();
        expect(Utils.isNumberArrayOfLength([1, 2], 3)).toBeFalsy();
        expect(Utils.isNumberArrayOfLength([1, 2, '3'], 3)).toBeFalsy();
        expect(Utils.isNumberArrayOfLength('nonarray', 3)).toBeFalsy();
    });

    it('Is object empty', () => {
        expect(Utils.isObjectEmpty({})).toBeTruthy();
        expect(Utils.isObjectEmpty({a: 1})).toBeFalsy();
    });

    it('Assert string', () => {
        expect(Utils.assertString('bla')).toBeUndefined();

        expect(() => {
            Utils.assertString(1);
        }).toThrow('Input must be a string!');
    });

    it('Test wait', async () => {
        const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce(
            // @ts-expect-error mocked
            () => {},
        );
        wait(1000).then(() => {});
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
        setTimeoutSpy.mockRestore();
    });

    it('Test waitress', async () => {
        vi.useFakeTimers();
        const validator = (payload: string, matcher: number): boolean => {
            if (payload === 'one' && matcher === 1) return true;
            if (payload === 'two' && matcher === 2) return true;
            return false;
        };
        const waitress = new Waitress<string, number>(validator, (_, timeout) => `Timedout '${timeout}'`);

        const wait1 = waitress.waitFor(1, 10000).start();
        waitress.resolve('one');
        expect(await wait1.promise).toBe('one');

        const wait2_1 = waitress.waitFor(2, 10000).start();
        const wait2_2 = waitress.waitFor(2, 10000).start();
        const wait2_3 = waitress.waitFor(2, 10000).start();
        const wait2_4 = waitress.waitFor(2, 5000).start();
        const wait2_5 = waitress.waitFor(2, 5000).start();

        waitress.remove(wait2_3.ID);
        vi.advanceTimersByTime(6000);
        waitress.remove(wait2_5.ID);
        waitress.resolve('two');
        expect(await wait2_1.promise).toBe('two');
        expect(await wait2_2.promise).toBe('two');

        let error2;
        try {
            await wait2_4.promise;
        } catch (e) {
            error2 = e;
        }
        expect(error2).toStrictEqual(new Error("Timedout '5000'"));

        let error3;
        try {
            await wait2_5.promise;
        } catch (e) {
            error3 = e;
        }
        expect(error3).toStrictEqual(new Error("Timedout '5000'"));

        vi.useRealTimers();

        // reject test
        const wait1_ = waitress.waitFor(1, 5000).start();
        let error1_;
        wait(1000).then(() => {
            waitress.reject('one', 'drop');
        });
        try {
            await wait1_.promise;
        } catch (e) {
            error1_ = e;
        }
        expect(error1_).toStrictEqual(new Error('drop'));

        vi.useFakeTimers();
        const wait2_ = waitress.waitFor(2, 5000).start();
        let handled1 = waitress.reject('tree', 'drop');
        expect(handled1).toBe(false);
        let error2_;
        vi.advanceTimersByTime(6000);
        try {
            await wait2_.promise;
        } catch (e) {
            error2_ = e;
        }
        expect(error2_).toStrictEqual(new Error("Timedout '5000'"));
        let handled2 = waitress.reject('two', 'drop');
        expect(handled2).toBe(false);

        const waitClear_1 = waitress.waitFor(2, 10000).start().promise;
        const waitClear_2 = waitress.waitFor(2, 10000).start().promise;

        await vi.advanceTimersByTimeAsync(2000);
        waitress.clear();
        await vi.advanceTimersByTimeAsync(12000);

        // @ts-expect-error private
        expect(waitress.waiters.size).toStrictEqual(0);

        vi.useRealTimers();
    });

    it('Test queue', async () => {
        const queue = new Queue(4);
        const finished = [];

        let job1Promise, job2Promise, job3Promise;
        const job1 = new Promise((resolve) => (job1Promise = resolve));
        const job2 = new Promise((resolve) => (job2Promise = resolve));
        const job5 = new Promise((resolve) => {});
        const job6 = new Promise((resolve) => {});
        const job7 = new Promise((resolve) => {});

        const job1Result = queue.execute<string>(async () => {
            await job1;
            finished.push(1);
            return 'finished';
        });

        const job2Result = queue.execute<void>(async () => {
            await job2;
            finished.push(2);
        }, 'mykey');

        queue.execute<void>(async () => {
            finished.push(3);
        }, 'mykey');

        queue.execute<void>(async () => {
            finished.push(4);
        }, 'mykey2');

        queue.execute<void>(async () => {
            await job5;
            finished.push(5);
        });

        queue.execute<void>(async () => {
            await job6;
            finished.push(6);
        });

        queue.execute<void>(async () => {
            await job7;
            finished.push(7);
        });

        queue.execute<void>(async () => {
            finished.push(8);
        });

        expect(finished).toEqual([4]);
        job1Promise();
        expect(await job1Result).toBe('finished');
        await job1Result;
        expect(finished).toEqual([4, 1]);
        job2Promise();
        await job2Result;
        expect(finished).toEqual([4, 1, 2, 3]);
        expect(queue.count()).toBe(5);
    });

    it('Logs', () => {
        const debugSpy = vi.spyOn(console, 'debug');
        const infoSpy = vi.spyOn(console, 'info');
        const warningSpy = vi.spyOn(console, 'warn');
        const errorSpy = vi.spyOn(console, 'error');
        logger.debug('debug', 'zh');
        expect(debugSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ\] zh: debug$/));
        logger.info('info', 'zh');
        expect(infoSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ\] zh: info$/));
        logger.warning('warning', 'zh');
        expect(warningSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ\] zh: warning$/));
        logger.error('error', 'zh');
        expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/^\[\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ\] zh: error$/));

        setLogger(mockLogger);
        expect(logger).toEqual(mockLogger);
        logger.debug('debug', 'zh');
        expect(mockLogger.debug).toHaveBeenCalledWith('debug', 'zh');
        logger.info('info', 'zh');
        expect(mockLogger.info).toHaveBeenCalledWith('info', 'zh');
        logger.warning('warning', 'zh');
        expect(mockLogger.warning).toHaveBeenCalledWith('warning', 'zh');
        logger.error('error', 'zh');
        expect(mockLogger.error).toHaveBeenCalledWith('error', 'zh');
    });
});
