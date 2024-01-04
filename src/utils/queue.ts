interface Job<T> {
    key: string | number;
    running: boolean;
    start: () => void;
}

class Queue {
    private jobs: Job<unknown>[];
    private readonly concurrent: number;

    constructor(concurrent = 1) {
        this.jobs = [];
        this.concurrent = concurrent;
    }

    public async execute<T>(func: () => Promise<T>, key: string | number = null): Promise<T> {
        const job : Job<unknown> = {key, running: false, start: null};
        await new Promise((resolve): void =>  {
            job.start = (): void => resolve(null);
            this.jobs.push(job);
            this.executeNext();
        });

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
            job.running = true;
            job.start();
        }
    }

    private getNext(): Job<unknown> {
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
