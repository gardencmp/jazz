import { ValueType, metrics } from "@opentelemetry/api";
import type { CoValuePriority } from "./priority.js";
import type { SyncMessage } from "./sync.js";

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
type Tuple<T, N extends number, A extends unknown[] = []> = A extends {
  length: N;
}
  ? A
  : Tuple<T, N, [...A, T]>;
type QueueTuple = Tuple<QueueEntry[], 8>;

export class PriorityBasedMessageQueue {
  private queues: QueueTuple = [[], [], [], [], [], [], [], []];
  queueSizeCounter = metrics
    .getMeter("cojson")
    .createUpDownCounter("jazz.messagequeue.size", {
      description: "Size of the message queue",
      valueType: ValueType.INT,
      unit: "entry",
    });

  private getQueue(priority: CoValuePriority) {
    return this.queues[priority];
  }

  constructor(private defaultPriority: CoValuePriority) {}

  public push(msg: SyncMessage) {
    const { promise, resolve, reject } = promiseWithResolvers<void>();
    const entry: QueueEntry = { msg, promise, resolve, reject };

    const priority = "priority" in msg ? msg.priority : this.defaultPriority;

    this.getQueue(priority).push(entry);

    this.queueSizeCounter.add(1, {
      priority,
    });

    return promise;
  }

  public pull() {
    const priority = this.queues.findIndex((queue) => queue.length > 0);

    if (priority === -1) {
      return;
    }

    this.queueSizeCounter.add(-1, {
      priority,
    });

    return this.queues[priority]?.shift();
  }
}
