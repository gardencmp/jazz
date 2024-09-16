import { SyncMessage } from "cojson";

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
};

export class PriorityBasedMessageQueue {
    private highPriorityQueue: QueueEntry[] = [];
    private lowPriorityQueue: QueueEntry[] = [];
    private roundRobinCycle = 0;

    public push(msg: SyncMessage) {
        const { promise, resolve } = promiseWithResolvers<void>();

        if ("lowPriority" in msg && msg.lowPriority) {
            this.lowPriorityQueue.push({ msg, promise, resolve });
        } else {
            this.highPriorityQueue.push({ msg, promise, resolve });
        }

        return promise;
    }

    public isNonEmpty() {
        return (
            this.highPriorityQueue.length > 0 ||
            this.lowPriorityQueue.length > 0
        );
    }

    public pull() {
        const highPriorityActive =
            this.roundRobinCycle < 2 || this.lowPriorityQueue.length === 0;
        let entry: QueueEntry | undefined = undefined;

        if (this.highPriorityQueue.length > 0 && highPriorityActive) {
            entry = this.highPriorityQueue.shift();

            this.roundRobinCycle++;
        } else if (this.lowPriorityQueue.length > 0) {
            entry = this.lowPriorityQueue.shift();
            this.roundRobinCycle = 0;
        }

        return entry;
    }
}
