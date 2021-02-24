interface Waiter<TPayload, TMatcher> {
    ID: number;
    resolve: (payload: TPayload) => void;
    reject: (error: Error) => void;
    // eslint-disable-next-line
    timer?: any;
    resolved: boolean;
    timedout: boolean;
    matcher: TMatcher;
}

type Validator<TPayload, TMatcher> = (payload: TPayload, matcher: TMatcher) => boolean;
type TimeoutFormatter<TMatcher> = (matcher: TMatcher, timeout: number) => string;

class Waitress<TPayload, TMatcher> {
    private waiters: Map<number, Waiter<TPayload, TMatcher>>;
    private validator: Validator<TPayload, TMatcher>;
    private timeoutFormatter: TimeoutFormatter<TMatcher>;
    private currentID: number;

    public constructor(validator: Validator<TPayload, TMatcher>, timeoutFormatter: TimeoutFormatter<TMatcher>) {
        this.waiters = new Map();
        this.timeoutFormatter = timeoutFormatter;
        this.validator = validator;
        this.currentID = 0;
    }

    public resolve(payload: TPayload): boolean {
        let result = false;
        for (const entry of this.waiters.entries()) {
            const index = entry[0];
            const waiter = entry[1];
            if (waiter.timedout) {
                this.waiters.delete(index);
            } else if (this.validator(payload, waiter.matcher)) {
                clearTimeout(waiter.timer);
                waiter.resolved = true;
                waiter.resolve(payload);
                this.waiters.delete(index);
                result = true;
            }
        }
        return result;
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

    public reject(payload: TPayload, message: string): boolean {
        let result = false;
        for (const entry of this.waiters.entries()) {
            const index = entry[0];
            const waiter = entry[1];
            if (waiter.timedout) {
                this.waiters.delete(index);
            } else if (this.validator(payload, waiter.matcher)) {
                clearTimeout(waiter.timer);
                waiter.resolved = true;
                this.waiters.delete(index);
                waiter.reject(new Error(message));
                result = true;
            }
        }
        return result;
    }

    public waitFor(
        matcher: TMatcher, timeout: number
    ): {ID: number; start: () => {promise: Promise<TPayload>; ID: number}} {
        const ID = this.currentID++;

        const promise: Promise<TPayload> = new Promise((resolve, reject): void => {
            const object: Waiter<TPayload, TMatcher> = {matcher, resolve, reject, timedout: false, resolved: false, ID};
            this.waiters.set(ID, object);
        });

        const start = (): {promise: Promise<TPayload>; ID: number} => {
            const waiter = this.waiters.get(ID);
            if (waiter && !waiter.resolved && !waiter.timer) {
                waiter.timer = setTimeout((): void => {
                    const message = this.timeoutFormatter(matcher, timeout);
                    waiter.timedout = true;
                    waiter.reject(new Error(message));
                }, timeout);
            }

            return {promise, ID};
        };

        return {ID, start};
    }
}

export default Waitress;