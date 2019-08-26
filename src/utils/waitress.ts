interface Waiter<TPayload, TMatcher> {
    ID: number;
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
    private currentID: number;

    public constructor(validator: Validator<TPayload, TMatcher>, timeoutFormatter: TimeoutFormatter<TMatcher>) {
        this.waiters = [];
        this.timeoutFormatter = timeoutFormatter;
        this.validator = validator;
        this.currentID = 0;
    }

    public resolve(payload: TPayload): void {
        const toRemove = [];
        for (const waiter of this.waiters) {
            if (waiter.timedout) {
                toRemove.push(waiter);
            } else if (this.validator(payload, waiter.matcher)) {
                clearTimeout(waiter.timer);
                waiter.resolve(payload);
                toRemove.push(waiter);
            }
        }

        toRemove.forEach((waiter) => this.waiters.splice(this.waiters.indexOf(waiter), 1));
    }

    public remove(ID: number): void {
        for (let index = 0; index < this.waiters.length; index++) {
            const waiter = this.waiters[index];
            if (this.waiters[index].ID === ID) {
                if (!waiter.timedout && waiter.timer) {
                    clearTimeout(waiter.timer);
                }

                this.waiters.splice(index, 1);
                break;
            }
        }
    }

    public waitFor(matcher: TMatcher, timeout: number): {promise: Promise<TPayload>; ID: number} {
        const ID = this.currentID++;
        const promise: Promise<TPayload> = new Promise((resolve, reject): void => {
            const object: Waiter<TPayload, TMatcher> = {matcher, resolve, reject, timedout: false, ID};

            object.timer = setTimeout((): void => {
                const message = this.timeoutFormatter(matcher, timeout);
                object.timedout = true;
                reject(new Error(message));
            }, timeout);

            this.waiters.push(object);
        });

        return {ID, promise};
    }
}

export default Waitress;