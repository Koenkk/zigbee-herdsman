import "regenerator-runtime/runtime";
import {IsNumberArray, Wait, Queue, Waitress, AssertString} from '../src/utils';
import {logger, setLogger} from '../src/utils/logger';


const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
};

describe('Utils', () => {
    it('IsNumberArray valid', () => {
        expect(IsNumberArray([1,2,3])).toBeTruthy();
    });

    it('IsNumberArray invalid (partial)', () => {
        expect(IsNumberArray([1,2,'3'])).toBeFalsy();
    });

    it('IsNumberArray with non array type', () => {
        expect(IsNumberArray('nonarray')).toBeFalsy();
    });

    it('Assert string true', () => {
        AssertString('bla');
    });

    it('Assert string false', () => {
        let error;
        try {AssertString(1)} catch (e) {error = e;}
        expect(error).toStrictEqual(new Error('Input must be a string!'))
    });

    it('Test wait', async () => {
        const originalSetTimeout = setTimeout;
        setTimeout = jest.fn()
        Wait(1000).then(() => {});
        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000);
        setTimeout = originalSetTimeout;
    });

    it('Test waitress', async () => {
        jest.useFakeTimers();
        const validator = (payload: string, matcher: number): boolean => {
            if (payload === 'one' && matcher === 1) return true;
            if (payload === 'two' && matcher === 2) return true;
            return false;
        }
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
        jest.advanceTimersByTime(6000);
        waitress.remove(wait2_5.ID);
        waitress.resolve('two');
        expect(await wait2_1.promise).toBe('two');
        expect(await wait2_2.promise).toBe('two');

        let error2;
        try {await wait2_4.promise} catch (e) { error2 = e};
        expect(error2).toStrictEqual(new Error("Timedout '5000'"));

        let error3;
        try {await wait2_5.promise} catch (e) { error3 = e};
        expect(error3).toStrictEqual(new Error("Timedout '5000'"));

        jest.useRealTimers();

        // reject test
        const wait1_ = waitress.waitFor(1, 5000).start();
        let error1_;
        Wait(1000).then(() => {waitress.reject('one', 'drop');});
        try {await wait1_.promise} catch (e) { error1_ = e};
        expect(error1_).toStrictEqual(new Error("drop"));

        jest.useFakeTimers();
        const wait2_ = waitress.waitFor(2, 5000).start();
        let handled1 = waitress.reject('tree', 'drop');
        expect(handled1).toBe(false);
        let error2_;
        jest.advanceTimersByTime(6000);
        try {await wait2_.promise} catch (e) { error2_ = e};
        expect(error2_).toStrictEqual(new Error("Timedout '5000'"));
        let handled2 = waitress.reject('two', 'drop');
        expect(handled2).toBe(false);
        jest.useRealTimers();        
    });

    it('Test queue', async () => {
        const queue = new Queue(4);
        const finished = [];

        let job1Promise, job2Promise, job3Promise;
        const job1 = new Promise((resolve) => job1Promise = resolve);
        const job2 = new Promise((resolve) => job2Promise = resolve);
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
        const debugSpy = jest.spyOn(console, "debug");
        const infoSpy = jest.spyOn(console, "info");
        const warningSpy = jest.spyOn(console, "warn");
        const errorSpy = jest.spyOn(console, "error");
        logger.debug('debug', 'zh');
        expect(debugSpy).toHaveBeenCalledWith('zh: debug');
        logger.info('info', 'zh');
        expect(infoSpy).toHaveBeenCalledWith('zh: info');
        logger.warning('warning', 'zh');
        expect(warningSpy).toHaveBeenCalledWith('zh: warning');
        logger.error('error', 'zh');
        expect(errorSpy).toHaveBeenCalledWith('zh: error');

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