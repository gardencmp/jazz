import { CO_VALUE_PRIORITY } from "./coValue.js";
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

export class PriorityBasedMessageQueue {
    private lowPriorityQueue: QueueEntry[] = [];
    private mediumPriorityQueue: QueueEntry[] = [];
    private highPriorityQueue: QueueEntry[] = [];
    private cycle = 0;

    public push(msg: SyncMessage) {
        const { promise, resolve, reject } = promiseWithResolvers<void>();
        const entry: QueueEntry = { msg, promise, resolve, reject };

        if ('priority' in msg) {
            switch (msg.priority) {
                case CO_VALUE_PRIORITY.HIGH:
                    this.highPriorityQueue.push(entry);
                    break;
                case CO_VALUE_PRIORITY.MEDIUM:
                    this.mediumPriorityQueue.push(entry);
                    break;
                case CO_VALUE_PRIORITY.LOW:
                    this.lowPriorityQueue.push(entry);
                    break;
            }
        } else {
            this.highPriorityQueue.push(entry);
        }

        return promise;
    }

    public isNonEmpty() {
        return (
            this.highPriorityQueue.length > 0 ||
            this.mediumPriorityQueue.length > 0 ||
            this.lowPriorityQueue.length > 0
        );
    }

    public pull() {
        if (this.highPriorityQueue.length > 0) {
            if (this.cycle < 3) {
                this.cycle++;
                return this.highPriorityQueue.shift();
            }
        }

        if (this.mediumPriorityQueue.length > 0) {
            if (this.cycle < 5) {
                this.cycle++;
                return this.mediumPriorityQueue.shift();
            }
        }

        if (this.lowPriorityQueue.length > 0) {
            this.cycle = 0;
            return this.lowPriorityQueue.shift();
        }

        if (this.highPriorityQueue.length > 0) {
            return this.highPriorityQueue.shift();
        }

        if (this.mediumPriorityQueue.length > 0) {
            return this.mediumPriorityQueue.shift();
        }

        return undefined;
    }
}
