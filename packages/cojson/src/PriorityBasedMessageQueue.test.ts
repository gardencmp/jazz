import { describe, test, expect } from "vitest";
import { PriorityBasedMessageQueue } from "./PriorityBasedMessageQueue.js";
import { SyncMessage } from "./sync.js";
import { CO_VALUE_PRIORITY, CoValuePriority } from "./coValue.js";

function createMessage(priority?: CoValuePriority): SyncMessage {
    return priority !== undefined
        ? { action: "content", id: "co_ztest-id", priority, new: {} }
        : { action: "load", id: "co_ztest-id", header: false, sessions: {} };
}

describe("PriorityBasedMessageQueue", () => {
    test("should initialize with empty queues", () => {
        const queue = new PriorityBasedMessageQueue();
        expect(queue.isNonEmpty()).toBe(false);
    });

    test("should push messages to correct priority queues", async () => {
        const queue = new PriorityBasedMessageQueue();

        void queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));
        void queue.push(createMessage(CO_VALUE_PRIORITY.MEDIUM));
        void queue.push(createMessage(CO_VALUE_PRIORITY.LOW));
        void queue.push(createMessage());

        expect(queue.isNonEmpty()).toBe(true);
    });

    test("should pull messages in correct priority order", () => {
        const queue = new PriorityBasedMessageQueue();

        void queue.push(createMessage(CO_VALUE_PRIORITY.LOW));
        void queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));
        void queue.push(createMessage(CO_VALUE_PRIORITY.MEDIUM));
        void queue.push(createMessage());

        const first = queue.pull();
        const second = queue.pull();
        const third = queue.pull();
        const fourth = queue.pull();

        expect(first?.msg).toMatchObject({ priority: CO_VALUE_PRIORITY.HIGH });
        expect(second?.msg).toMatchObject({ action: "load" });
        expect(third?.msg).toMatchObject({
            priority: CO_VALUE_PRIORITY.MEDIUM,
        });
        expect(fourth?.msg).toMatchObject({ priority: CO_VALUE_PRIORITY.LOW });
    });

    test("should handle cycle-based priority", () => {
        const queue = new PriorityBasedMessageQueue();

        void queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));
        void queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));
        void queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));
        void queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));
        void queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));
        void queue.push(createMessage(CO_VALUE_PRIORITY.MEDIUM));
        void queue.push(createMessage(CO_VALUE_PRIORITY.MEDIUM));
        void queue.push(createMessage(CO_VALUE_PRIORITY.MEDIUM));
        void queue.push(createMessage(CO_VALUE_PRIORITY.LOW));
        void queue.push(createMessage(CO_VALUE_PRIORITY.LOW));
        void queue.push(createMessage(CO_VALUE_PRIORITY.LOW));

        const results = [];

        while (queue.isNonEmpty()) {
            const entry = queue.pull();

            if (entry && "priority" in entry.msg) {
                results.push(entry.msg.priority);
            }
        }

        const expectedPattern = [
            CO_VALUE_PRIORITY.HIGH,
            CO_VALUE_PRIORITY.HIGH,
            CO_VALUE_PRIORITY.HIGH,
            CO_VALUE_PRIORITY.MEDIUM,
            CO_VALUE_PRIORITY.MEDIUM,
            CO_VALUE_PRIORITY.LOW,
            CO_VALUE_PRIORITY.HIGH,
            CO_VALUE_PRIORITY.HIGH,
            CO_VALUE_PRIORITY.MEDIUM,
            CO_VALUE_PRIORITY.LOW,
            CO_VALUE_PRIORITY.LOW,
        ];

        expect(results).toEqual(expectedPattern);
    });

    test("should return undefined when queue is empty", () => {
        const queue = new PriorityBasedMessageQueue();
        expect(queue.pull()).toBeUndefined();
    });

    test("should resolve promises when messages are pulled", async () => {
        const queue = new PriorityBasedMessageQueue();
        const promise = queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));

        const resolvedPromise = Promise.race([
            promise,
            new Promise((resolve) => setTimeout(resolve, 100, "timeout")),
        ]);

        const entry = queue.pull();
        entry?.resolve();
        const result = await resolvedPromise;
        expect(result).not.toBe("timeout");
    });

    test("should propagate errors to the push promise", async () => {
        const queue = new PriorityBasedMessageQueue();
        const promise = queue.push(createMessage(CO_VALUE_PRIORITY.HIGH));

        const resolvedPromise = Promise.race([
            promise,
            new Promise((resolve) => setTimeout(resolve, 100, "timeout")),
        ]);

        const entry = queue.pull();
        entry?.reject(new Error("test error"));
        
        await expect(resolvedPromise).to.rejects.toEqual(new Error("test error"))
    });
});
