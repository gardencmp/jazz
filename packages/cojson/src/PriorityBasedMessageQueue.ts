import { CoValuePriority } from "./priority.js";
import { SyncMessage } from "./sync.js";

function promiseWithResolvers<R>() {
    let resolve = (_: R) => {};
    let reject = (_: unknown) => {};

    const promise = new Promise<R>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    return {
        promise,
        resolve,
        reject,
    };
}

export type QueueEntry = {
    msg: SyncMessage;
    promise: Promise<void>;
    resolve: () => void;
    reject: (_: unknown) => void;
};

/**
 * Since we have a fixed range of priority values (0-7) we can create a fixed array of queues.
 */
type Tuple<T, N extends number, A extends unknown[] = []> = A extends { length: N } ? A : Tuple<T, N, [...A, T]>;
type QueueTuple = Tuple<QueueEntry[], 8>;

export class PriorityBasedMessageQueue {
    private queues: QueueTuple = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
    ];

    private getQueue(priority: CoValuePriority) {
        return this.queues[priority];
    }

    constructor(
        private defaultPriority: CoValuePriority,
    ) {}

    public push(msg: SyncMessage) {
        const { promise, resolve, reject } = promiseWithResolvers<void>();
        const entry: QueueEntry = { msg, promise, resolve, reject };

        if ("priority" in msg) {
            const queue = this.getQueue(msg.priority);

            queue?.push(entry);
        } else {
            this.getQueue(this.defaultPriority).push(entry);
        }

        return promise;
    }

    public pull() {
        const activeQueue = this.queues.find((queue) => queue.length > 0);

        if (!activeQueue) {
            return undefined;
        }

        return activeQueue.shift();
    }
}
