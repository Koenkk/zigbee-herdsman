/* istanbul ignore file */
import {EZSP_MAX_FRAME_LENGTH} from "../ezsp/consts";


/**
 * Buffer to hold a DATA frame.
 * Allocates `data` to `EZSP_MAX_FRAME_LENGTH` filled with zeroes.
 */
export class EzspBuffer {
    /** uint8_t[EZSP_MAX_FRAME_LENGTH] */
    public data: Buffer;
    public link: EzspBuffer;
    /** uint8_t */
    public len: number;

    constructor() {
        this.data = Buffer.alloc(EZSP_MAX_FRAME_LENGTH);// inits to all-zeroes
        this.link = null;
        this.len = 0;
    }
}

/**
 * Simple queue (singly-linked list)
 */
export class EzspQueue {
    public tail: EzspBuffer;

    constructor() {
        this.tail = null;
    }

    /**
     * Get the number of buffers in the queue.
     * @returns
     */
    get length(): number {
        let head: EzspBuffer = this.tail;
        let count: number = 0;

        for (count; head != null; count++) {
            head = head.link;
        }

        return count;
    }

    get empty(): boolean {
        return (this.tail == null);
    }

    /**
     * Get a pointer to the buffer at the head of the queue.
     * @returns 
     */
    get head(): EzspBuffer {
        let head: EzspBuffer = this.tail;

        if (head == null) {
            throw new Error(`Tried to get head from an empty queue.`);
        }

        if (head != null) {
            while (head.link != null) {
                head = head.link;
            }

        }

        return head;
    }

    /**
     * Get a pointer to the Nth entry in the queue (the tail corresponds to N = 1).
     * 
     * @param n 
     * @returns
     */
    public getNthEntry(n: number): EzspBuffer {
        if (n === 0) {
            throw new Error(`Asked for 0th element in queue.`);
        }

        let buf: EzspBuffer = this.tail;

        while (--n) {
            if (buf == null) {
                throw new Error(`Less than N entries in queue.`);
            }

            buf = buf.link;
        }

        return buf;
    }

    /**
     * Get a pointer to the entry before the specified entry (closer to the tail).
     * If the buffer specified is null, the head entry is returned.
     * If the buffer specified is the tail, null is returned.
     * @param entry The buffer to look before.
     * @returns
     */
    public getPrecedingEntry(entry: EzspBuffer): EzspBuffer {
        let buf: EzspBuffer = this.tail;

        if (buf === entry) {
            return null;
        } else {
            do {
                if (buf.link === entry) {
                    return buf;
                }

                buf = buf.link;
            } while (buf != null);

            throw new Error(`Buffer not in queue.`);
        }
    }

    /**
     * Add a buffer to the tail of the queue.
     * @param buf 
     */
    public addTail(buf: EzspBuffer): void {
        if (buf) {
            buf.link = this.tail;
            this.tail = buf;
        } else {
            throw new Error(`Called addTail with null buffer`);
        }
    }

    /**
     * Remove the buffer at the head of the queue.
     * @returns The removed buffer.
     */
    public removeHead(): EzspBuffer {
        let head: EzspBuffer = this.tail;

        if (head == null) {
            throw new Error(`Tried to remove head from an empty queue.`);
        }

        if (head.link == null) {
            this.tail = null;
        } else {
            let prev: EzspBuffer;

            do {
                prev = head;
                head = head.link;
            } while (head.link != null);

            prev.link = null;
        }

        return head;
    }

    /**
     * Remove the specified entry from the queue.
     * @param entry 
     * @returns A pointer to the preceding entry (if any).
     */
    public removeEntry(entry: EzspBuffer): EzspBuffer {
        const buf: EzspBuffer = this.getPrecedingEntry(entry);

        if (buf != null) {
            buf.link = entry.link;
        } else {
            this.tail = entry.link;
        }

        return buf;
    }
}

/**
 * Simple free list (singly-linked list)
 */
export class EzspFreeList {
    public link: EzspBuffer;

    constructor() {
        this.link = null;
    }

    /**
     * Get the number of buffers in the free list.
     * @returns
     */
    get length(): number {
        let next: EzspBuffer = this.link;
        let count: number = 0;

        for (count; next != null; count++) {
            next = next.link;
        }

        return count;
    }

    /**
     * Add a buffer to the free list.
     * @param buf 
     */
    public freeBuffer(buf: EzspBuffer): void {
        if (buf) {
            buf.link = this.link;
            this.link = buf;
        } else {
            throw new Error(`Called freeBuffer with null buffer`);
        }
    }

    /**
     * Get a buffer from the free list.
     * @returns 
     */
    public allocBuffer(): EzspBuffer {
        const buf: EzspBuffer = this.link;

        if (buf != null) {
            this.link = buf.link;
            buf.len = 0;

            if (buf.data.length !== EZSP_MAX_FRAME_LENGTH) {
                // should never happen if buffers are handled properly, but just in case, re-alloc to max length
                buf.data = Buffer.alloc(EZSP_MAX_FRAME_LENGTH);

                const e = new Error();
                console.assert(false, `Pre-allocated buffer had improper size and had to be re-allocated. ${e.stack}`);
            } else {
                // (void) memset(buffer->data, 0, EZSP_MAX_FRAME_LENGTH);
                buf.data.fill(0);
            }
        }

        return buf;
    }
}
