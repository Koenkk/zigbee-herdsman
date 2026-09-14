export class AsyncMutex {
    #locked = false;
    readonly #queue: Array<{resolve: () => void; reject: (error: Error) => void}> = [];

    get count() {
        return this.#queue.length;
    }

    async run<T>(fn: () => Promise<T>): Promise<T> {
        if (this.#locked) {
            await new Promise<void>((resolve, reject) => this.#queue.push({resolve, reject}));
        }

        this.#locked = true;

        try {
            return await fn();
        } finally {
            const next = this.#queue.shift();

            if (next) {
                // Keep the lock reserved until the next acquisition resumes.
                next.resolve();
            } else {
                this.#locked = false;
            }
        }
    }

    /** Reject pending acquisitions without interrupting the active operation. */
    clear(): void {
        for (const waiter of this.#queue.splice(0)) {
            waiter.reject(new Error("Mutex cleared"));
        }
    }
}
