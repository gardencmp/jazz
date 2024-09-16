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

type QueueEntry = {
    msg: SyncMessage;
    promise: Promise<void>;
    resolve: () => void;
    reject: (_: unknown) => void;
};

function getOrderedQueueList(priorities: number[]) {
    const source = priorities.slice().sort((a, b) => b - a);
    const indexes: Record<number, number> = {};
    const queues: QueueEntry[][] = new Array(priorities.length);

    source.forEach((priority, i) => {
        indexes[priority] = i;
        queues[i] = [];
    });

    return { indexes, list: queues };
}

function getWeighedRoundRobin(priorities: number[]) {
    const items: number[] = [];

    for (const priority of priorities) {
        for (let i = 0; i < priority; i++) {
            items.push(priority);
        }
    }

    let cycle = 0;
    return (): number => {
        return items[cycle++ % items.length]!;
    };
}

export class PriorityBasedMessageQueue {
    private queues = getOrderedQueueList(this.priorities);
    private weighedRoundRobin = getWeighedRoundRobin(this.priorities);

    constructor(private priorities: number[], private defaultPriority: number) {}

    private getQueue(priority: number) {
        return this.queues.list[this.queues.indexes[priority]!];
    }

    public push(msg: SyncMessage) {
        const { promise, resolve, reject } = promiseWithResolvers<void>();
        const entry: QueueEntry = { msg, promise, resolve, reject };

        if ("priority" in msg) {
            const queue = this.getQueue(msg.priority);

            queue?.push(entry);
        } else {
            this.getQueue(this.defaultPriority)?.push(entry);
        }

        return promise;
    }

    public isNonEmpty() {
        return this.queues.list.some((queue) => queue.length > 0);
    }

    public pull() {
        const selectedPriority = this.weighedRoundRobin();
        let activeQueue: QueueEntry[] | undefined = this.getQueue(selectedPriority);

        // If the active queue is empty, we need to select the non-empty queue with the highest priority.
        if (activeQueue?.length === 0) {
            activeQueue = this.queues.list.find((queue) => queue.length > 0);
        }

        if (!activeQueue) {
            return;
        }

        return activeQueue.shift();
    }
}
