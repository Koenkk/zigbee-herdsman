interface Waiter<TPayload, TMatcher> {
    resolve: (payload: TPayload) => void;
    reject: Function;
    // eslint-disable-next-line
    timer?: any;
    timedout: boolean;
    matcher: TMatcher;
};

type Validator<TPayload, TMatcher> = (payload: TPayload, matcher: TMatcher) => boolean;
type TimeoutFormatter<TMatcher> = (matcher: TMatcher, timeout: number) => string;

class Waitress<TPayload, TMatcher> {
    private waiters: Waiter<TPayload, TMatcher>[];
    private validator: Validator<TPayload, TMatcher>;
    private timeoutFormatter: TimeoutFormatter<TMatcher>;

    public constructor(validator: Validator<TPayload, TMatcher>, timeoutFormatter: TimeoutFormatter<TMatcher>) {
        this.waiters = [];
        this.timeoutFormatter = timeoutFormatter;
        this.validator = validator;
    }

    public resolve(payload: TPayload): void {
        for (let index = 0; index < this.waiters.length; index++) {
            const waiter = this.waiters[index];

            if (waiter.timedout) {
                this.waiters.splice(index, 1);
            } else if (this.validator(payload, waiter.matcher)) {
                clearTimeout(waiter.timer);
                waiter.resolve(payload);
                this.waiters.splice(index, 1);
            }
        }
    }

    public waitFor(matcher: TMatcher, timeout: number): Promise<TPayload> {
        return new Promise((resolve, reject): void => {
            const object: Waiter<TPayload, TMatcher> = {matcher, resolve, reject, timedout: false};

            object.timer = setTimeout((): void => {
                const message = this.timeoutFormatter(matcher, timeout);
                object.timedout = true;
                reject(new Error(message));
            }, timeout);

            this.waiters.push(object);
        });
    }
}

export default Waitress;