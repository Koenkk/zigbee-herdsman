interface Job {
    key: string | number;
    running: boolean;
    start: () => void;
}

class Queue {
    private jobs: Job[];
    private readonly concurrent: number;

    constructor(concurrent = 1) {
        this.jobs = [];
        this.concurrent = concurrent;
    }

    public async execute<T>(func: () => Promise<T>, key: string | number = null): Promise<T> {
        const job : Job = {key, running: false, start: null};
        // Minor optimization/workaround: various tests like the idea that a job that is
        // immediately runnable is run without an event loop spin. This also helps with stack
        // traces in some cases, so avoid an `await` if we can help it.
        this.jobs.push(job);
        if (this.getNext() !== job) {
            await new Promise((resolve): void =>  {
                job.start = (): void => {
                    job.running = true;
                    resolve(null);
                };
                this.executeNext();
            });
        } else {
            job.running = true;
        }

        try {
            return await func();
        } finally {
            this.jobs.splice(this.jobs.indexOf(job), 1);
            this.executeNext();
        }
    }

    private executeNext(): void {
        const job = this.getNext();

        if (job) {
            job.start();
        }
    }

    private getNext(): Job {
        if (this.jobs.filter((j) => j.running).length > (this.concurrent - 1)) {
            return null;
        }

        for (let i = 0; i < this.jobs.length; i++) {
            const job = this.jobs[i];

            if (!job.running && (!job.key || !this.jobs.find((j) => j.key === job.key && j.running))) {
                return job;
            }
        }

        return null;
    }

    public clear(): void {
        this.jobs = [];
    }

    public count(): number {
        return this.jobs.length;
    }
}

export default Queue;
