import { describe, test, expect } from "vitest";
import { PriorityBasedMessageQueue } from "./PriorityBasedMessageQueue.js";
import { SyncMessage } from "cojson";

describe("PriorityBasedMessageQueue", () => {
    test("should create a queue with correct initial state", () => {
        const queue = new PriorityBasedMessageQueue();
        expect(queue.isNonEmpty()).toBe(false);
    });

    test("should push high priority messages to the high priority queue", async () => {
        const queue = new PriorityBasedMessageQueue();
        const highPriorityMsg: SyncMessage = { action: "known", id: "co_ztest1", header: false, sessions: {} };
        
        void queue.push(highPriorityMsg);
        expect(queue.isNonEmpty()).toBe(true);
        
        const pulledEntry = queue.pull();
        expect(pulledEntry?.msg).toEqual(highPriorityMsg);
    });

    test("should push low priority messages to the low priority queue", async () => {
        const queue = new PriorityBasedMessageQueue();
        const lowPriorityMsg: SyncMessage = { action: "content", id: "co_zlow", lowPriority: true, new: {} };
        
        void queue.push(lowPriorityMsg);
        expect(queue.isNonEmpty()).toBe(true);
        
        const pulledEntry = queue.pull();
        expect(pulledEntry?.msg).toEqual(lowPriorityMsg);
    });

    test("should prioritize high priority messages", async () => {
        const queue = new PriorityBasedMessageQueue();
        const lowPriorityMsg: SyncMessage = { action: "content", id: "co_zlow", lowPriority: true, new: {} };
        const highPriorityMsg: SyncMessage = { action: "known", id: "co_zhigh", header: false, sessions: {} };
        
        void queue.push(lowPriorityMsg);
        void queue.push(highPriorityMsg);
        
        const firstPulled = queue.pull();
        expect(firstPulled?.msg).toEqual(highPriorityMsg);
        
        const secondPulled = queue.pull();
        expect(secondPulled?.msg).toEqual(lowPriorityMsg);
    });

    test("should return one low priority message after 2 high priority messages", async () => {
        const queue = new PriorityBasedMessageQueue();
        const lowPriorityMsg1: SyncMessage = { action: "content", id: "co_zlow", lowPriority: true, new: {} };
        const lowPriorityMsg2: SyncMessage = { action: "content", id: "co_zlow", lowPriority: true, new: {} };
        const highPriorityMsg1: SyncMessage = { action: "known", id: "co_zhigh1", header: false, sessions: {} };
        const highPriorityMsg2: SyncMessage = { action: "known", id: "co_zhigh2", header: false, sessions: {} };
        const highPriorityMsg3: SyncMessage = { action: "known", id: "co_zhigh2", header: false, sessions: {} };
        
        void queue.push(lowPriorityMsg1);
        void queue.push(lowPriorityMsg2);
        void queue.push(highPriorityMsg1);
        void queue.push(highPriorityMsg2);
        void queue.push(highPriorityMsg3);
        
        expect(queue.pull()?.msg).toEqual(highPriorityMsg1);
        expect(queue.pull()?.msg).toEqual(highPriorityMsg2);
        expect(queue.pull()?.msg).toEqual(lowPriorityMsg1);
        expect(queue.pull()?.msg).toEqual(highPriorityMsg3);
        expect(queue.pull()?.msg).toEqual(lowPriorityMsg2);
    });

    test("should resolve promises when the entry is resolved", async () => {
        const queue = new PriorityBasedMessageQueue();
        const msg: SyncMessage = { action: "known", id: "co_ztest", header: false, sessions: {} };
        
        const pushPromise = queue.push(msg);
        const entry = queue.pull();

        entry?.resolve();
        
        await expect(pushPromise).resolves.toBeUndefined();
    });
});
