import { describe, expect, it, vi } from "vitest";
import { createCoValueObservable } from "../coValues/interfaces";
import { Account, CoMap, DepthsIn, Group, co } from "../index.web.js";
import { setupAccount, waitFor } from "./utils";

class TestMap extends CoMap {
  color = co.string;
}

function createTestMap(me: Account | Group) {
  return TestMap.create({ color: "red" }, { owner: me });
}

describe("createCoValueObservable", () => {
  it("should return undefined when there are no subscribers", async () => {
    const observable = createCoValueObservable();

    expect(observable.getCurrentValue()).toBeUndefined();
  });

  it("should update currentValue when subscribed", async () => {
    const { me, meOnSecondPeer } = await setupAccount();
    const testMap = createTestMap(me);
    const observable = createCoValueObservable<TestMap, DepthsIn<TestMap>>();
    const mockListener = vi.fn();

    const unsubscribe = observable.subscribe(
      TestMap,
      testMap.id,
      meOnSecondPeer,
      {},
      () => {
        mockListener();
      },
    );

    testMap.color = "blue";

    await waitFor(() => mockListener.mock.calls.length > 0);

    expect(observable.getCurrentValue()).toMatchObject({
      id: testMap.id,
      color: "blue",
    });

    unsubscribe();
  });

  it("should reset to undefined after unsubscribe", async () => {
    const { me, meOnSecondPeer } = await setupAccount();
    const testMap = createTestMap(me);
    const observable = createCoValueObservable<TestMap, DepthsIn<TestMap>>();
    const mockListener = vi.fn();

    const unsubscribe = observable.subscribe(
      TestMap,
      testMap.id,
      meOnSecondPeer,
      {},
      () => {
        mockListener();
      },
    );

    await waitFor(() => mockListener.mock.calls.length > 0);
    expect(observable.getCurrentValue()).toBeDefined();

    unsubscribe();
    expect(observable.getCurrentValue()).toBeUndefined();
  });
});
