export class AsyncMutex {
    #locked = false;
    readonly #queue: Array<() => void> = [];

    get count() {
        return this.#queue.length;
    }

    async run<T>(fn: () => Promise<T>): Promise<T> {
        if (this.#locked) {
            await new Promise<void>((resolve) => this.#queue.push(resolve));
        }

        this.#locked = true;

        try {
            return await fn();
        } finally {
            this.#locked = false;
            const next = this.#queue.shift();

            if (next) {
                next();
            }
        }
    }

    clear() {
        this.#queue.length = 0;
    }
}
