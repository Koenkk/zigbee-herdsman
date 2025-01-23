interface Waiter<TPayload, TMatcher> {
    ID: number;
    resolve: (payload: TPayload) => void;
    reject: (error: Error) => void;
    timer?: NodeJS.Timeout;
    resolved: boolean;
    timedout: boolean;
    matcher: TMatcher;
}

type Validator<TPayload, TMatcher> = (payload: TPayload, matcher: TMatcher) => boolean;
type TimeoutFormatter<TMatcher> = (matcher: TMatcher, timeout: number) => string;

export class Waitress<TPayload, TMatcher> {
    private waiters: Map<number, Waiter<TPayload, TMatcher>>;
    private readonly validator: Validator<TPayload, TMatcher>;
    private readonly timeoutFormatter: TimeoutFormatter<TMatcher>;
    private currentID: number;

    public constructor(validator: Validator<TPayload, TMatcher>, timeoutFormatter: TimeoutFormatter<TMatcher>) {
        this.waiters = new Map();
        this.timeoutFormatter = timeoutFormatter;
        this.validator = validator;
        this.currentID = 0;
    }

    public clear(): void {
        for (const [, waiter] of this.waiters) {
            clearTimeout(waiter.timer);
        }

        this.waiters.clear();
    }

    public resolve(payload: TPayload): boolean {
        return this.forEachMatching(payload, (waiter) => waiter.resolve(payload));
    }

    public reject(payload: TPayload, message: string): boolean {
        return this.forEachMatching(payload, (waiter) => waiter.reject(new Error(message)));
    }

    public remove(ID: number): void {
        const waiter = this.waiters.get(ID);
        if (waiter) {
            if (!waiter.timedout && waiter.timer) {
                clearTimeout(waiter.timer);
            }

            this.waiters.delete(ID);
        }
    }

    public waitFor(matcher: TMatcher, timeout: number): {ID: number; start: () => {promise: Promise<TPayload>; ID: number}} {
        const ID = this.currentID++;

        const promise: Promise<TPayload> = new Promise((resolve, reject): void => {
            const object: Waiter<TPayload, TMatcher> = {matcher, resolve, reject, timedout: false, resolved: false, ID};
            this.waiters.set(ID, object);
        });

        const start = (): {promise: Promise<TPayload>; ID: number} => {
            const waiter = this.waiters.get(ID);
            if (waiter && !waiter.resolved && !waiter.timer) {
                // Capture the stack trace from the caller of start()
                const error = new Error(this.timeoutFormatter(matcher, timeout));
                Error.captureStackTrace(error);
                waiter.timer = setTimeout((): void => {
                    waiter.timedout = true;
                    waiter.reject(error);
                }, timeout);
            }

            return {promise, ID};
        };

        return {ID, start};
    }

    private forEachMatching(payload: TPayload, action: (waiter: Waiter<TPayload, TMatcher>) => void): boolean {
        let foundMatching = false;
        for (const [index, waiter] of this.waiters.entries()) {
            if (waiter.timedout) {
                this.waiters.delete(index);
            } else if (this.validator(payload, waiter.matcher)) {
                clearTimeout(waiter.timer);
                waiter.resolved = true;
                this.waiters.delete(index);
                action(waiter);
                foundMatching = true;
            }
        }
        return foundMatching;
    }
}
