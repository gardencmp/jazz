import { metrics } from "@opentelemetry/api";
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  MetricReader,
  type MetricReaderOptions,
  type PushMetricExporter,
} from "@opentelemetry/sdk-metrics";
import { describe, expect, test } from "vitest";
import { PriorityBasedMessageQueue } from "../PriorityBasedMessageQueue.js";
import { CO_VALUE_PRIORITY } from "../priority.js";
import type { SyncMessage } from "../sync.js";

interface A extends MetricReaderOptions {
  exporter: PushMetricExporter;
}

/**
 * This is a test metric reader that uses an in-memory metric exporter and exposes a method to get the value of a metric given its name and attributes.
 *
 * This is useful for testing the values of metrics that are collected by the SDK.
 *
 * TODO: We could move this to a separate file and make it a utility class that can be used in other tests.
 * TODO: We may want to rethink how we access metrics (see `getMetricValue` method) to make it more flexible.
 */
class TestMetricReader extends MetricReader {
  private _exporter = new InMemoryMetricExporter(
    AggregationTemporality.CUMULATIVE,
  );

  protected onShutdown(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  protected onForceFlush(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getMetricValue(
    name: string,
    attributes: { [key: string]: string | number } = {},
  ) {
    await this.collectAndExport();
    const metric = this._exporter
      .getMetrics()[0]
      ?.scopeMetrics[0]?.metrics.find((m) => m.descriptor.name === name);

    const dp = metric?.dataPoints.find(
      (dp) => JSON.stringify(dp.attributes) === JSON.stringify(attributes),
    );

    this._exporter.reset();

    return dp?.value;
  }

  async collectAndExport(): Promise<void> {
    const result = await this.collect();
    await new Promise<void>((resolve, reject) => {
      this._exporter.export(result.resourceMetrics, (result) => {
        if (result.error != null) {
          reject(result.error);
        } else {
          resolve();
        }
      });
    });
  }
}

function setup() {
  const metricReader = new TestMetricReader();
  metrics.setGlobalMeterProvider(
    new MeterProvider({
      readers: [metricReader],
    }),
  );

  const queue = new PriorityBasedMessageQueue(CO_VALUE_PRIORITY.MEDIUM);
  return { queue, metricReader };
}

describe("PriorityBasedMessageQueue", () => {
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
