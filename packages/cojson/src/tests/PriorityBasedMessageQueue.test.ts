import { afterEach, describe, expect, test } from "vitest";
import { PriorityBasedMessageQueue } from "../PriorityBasedMessageQueue.js";
import { CO_VALUE_PRIORITY } from "../priority.js";
import type { SyncMessage } from "../sync.js";
import {
  createTestMetricReader,
  tearDownTestMetricReader,
} from "./testUtils.js";

function setup() {
  const metricReader = createTestMetricReader();
  const queue = new PriorityBasedMessageQueue(CO_VALUE_PRIORITY.MEDIUM);
  return { queue, metricReader };
}

describe("PriorityBasedMessageQueue", () => {
  afterEach(() => {
    tearDownTestMetricReader();
  });

  test("should initialize with correct properties", () => {
    const { queue } = setup();
    expect(queue["defaultPriority"]).toBe(CO_VALUE_PRIORITY.MEDIUM);
    expect(queue["queues"].length).toBe(8);
    expect(queue["queues"].every((q) => q.length === 0)).toBe(true);
  });

  test("should push message with default priority", async () => {
    const { queue } = setup();
    const message: SyncMessage = {
      action: "load",
      id: "co_ztest-id",
      header: false,
      sessions: {},
    };
    void queue.push(message);
    const pulledEntry = queue.pull();
    expect(pulledEntry?.msg).toEqual(message);
  });

  test("should push message with specified priority", async () => {
    const { queue } = setup();
    const message: SyncMessage = {
      action: "content",
      id: "co_zhigh",
      new: {},
      priority: CO_VALUE_PRIORITY.HIGH,
    };
    void queue.push(message);
    const pulledEntry = queue.pull();
    expect(pulledEntry?.msg).toEqual(message);
  });

  test("should pull messages in priority order", async () => {
    const { queue, metricReader } = setup();
    const lowPriorityMsg: SyncMessage = {
      action: "content",
      id: "co_zlow",
      new: {},
      priority: CO_VALUE_PRIORITY.LOW,
    };
    const mediumPriorityMsg: SyncMessage = {
      action: "content",
      id: "co_zmedium",
      new: {},
      priority: CO_VALUE_PRIORITY.MEDIUM,
    };
    const highPriorityMsg: SyncMessage = {
      action: "content",
      id: "co_zhigh",
      new: {},
      priority: CO_VALUE_PRIORITY.HIGH,
    };

    void queue.push(lowPriorityMsg);
    expect(
      await metricReader.getMetricValue("jazz.messagequeue.size", {
        priority: lowPriorityMsg.priority,
      }),
    ).toBe(1);
    void queue.push(mediumPriorityMsg);
    expect(
      await metricReader.getMetricValue("jazz.messagequeue.size", {
        priority: mediumPriorityMsg.priority,
      }),
    ).toBe(1);
    void queue.push(highPriorityMsg);
    expect(
      await metricReader.getMetricValue("jazz.messagequeue.size", {
        priority: highPriorityMsg.priority,
      }),
    ).toBe(1);

    expect(queue.pull()?.msg).toEqual(highPriorityMsg);
    expect(
      await metricReader.getMetricValue("jazz.messagequeue.size", {
        priority: highPriorityMsg.priority,
      }),
    ).toBe(0);
    expect(queue.pull()?.msg).toEqual(mediumPriorityMsg);
    expect(
      await metricReader.getMetricValue("jazz.messagequeue.size", {
        priority: mediumPriorityMsg.priority,
      }),
    ).toBe(0);
    expect(queue.pull()?.msg).toEqual(lowPriorityMsg);
    expect(
      await metricReader.getMetricValue("jazz.messagequeue.size", {
        priority: lowPriorityMsg.priority,
      }),
    ).toBe(0);
  });

  test("should return undefined when pulling from empty queue", () => {
    const { queue } = setup();
    expect(queue.pull()).toBeUndefined();
  });

  test("should resolve promise when message is pulled", async () => {
    const { queue } = setup();
    const message: SyncMessage = {
      action: "load",
      id: "co_ztest-id",
      header: false,
      sessions: {},
    };
    const pushPromise = queue.push(message);

    const pulledEntry = queue.pull();
    pulledEntry?.resolve();

    await expect(pushPromise).resolves.toBeUndefined();
  });

  test("should reject promise when message is rejected", async () => {
    const { queue } = setup();
    const message: SyncMessage = {
      action: "load",
      id: "co_ztest-id",
      header: false,
      sessions: {},
    };
    const pushPromise = queue.push(message);

    const pulledEntry = queue.pull();
    pulledEntry?.reject(new Error("Test error"));

    await expect(pushPromise).rejects.toThrow("Test error");
  });
});
