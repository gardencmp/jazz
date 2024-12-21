import { describe, expect, test, vi } from "vitest";
import { PeerEntry } from "../PeerEntry.js";
import { CoValueCore } from "../coValueCore";
import { CO_VALUE_LOADING_MAX_RETRIES, CoValueEntry } from "../coValueEntry.js";
import { RawCoID } from "../ids";

import { Peer } from "../localNode.js";

describe("CoValueState", () => {
  const mockCoValueId = "co_test123" as RawCoID;

  test("should create unknown state", () => {
    const state = CoValueEntry.Unknown(mockCoValueId);

    expect(state.id).toBe(mockCoValueId);
    expect(state.state.type).toBe("unknown");
  });

  test("should create loading state", () => {
    const peerIds = ["peer1", "peer2"];
    const state = CoValueEntry.Loading(mockCoValueId, peerIds);

    expect(state.id).toBe(mockCoValueId);
    expect(state.state.type).toBe("loading");
  });

  test("should create available state", async () => {
    const mockCoValue = createMockCoValueCore(mockCoValueId);
    const state = CoValueEntry.Available(mockCoValue);

    expect(state.id).toBe(mockCoValueId);
    expect(state.state.type).toBe("available");
    expect((state.state as any).coValue).toBe(mockCoValue);
    await expect(state.getCoValue()).resolves.toEqual(mockCoValue);
  });

  test("should handle found action", async () => {
    const mockCoValue = createMockCoValueCore(mockCoValueId);
    const state = CoValueEntry.Loading(mockCoValueId, ["peer1", "peer2"]);

    const stateValuePromise = state.getCoValue();

    state.dispatch({
      type: "available",
      coValue: mockCoValue,
    });

    const result = await state.getCoValue();
    expect(result).toBe(mockCoValue);
    await expect(stateValuePromise).resolves.toBe(mockCoValue);
  });

  test("should ignore actions when not in loading state", () => {
    const state = CoValueEntry.Unknown(mockCoValueId);

    state.dispatch({
      type: "not-found-in-peer",
      peerId: "peer1",
    });

    expect(state.state.type).toBe("unknown");
  });

  test("should retry loading from peers when unsuccessful", async () => {
    vi.useFakeTimers();

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "server",
      },
      async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
      },
    );
    const peer2 = createMockPeerState(
      {
        id: "peer2",
        role: "server",
      },
      async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer2",
        });
      },
    );
    const mockPeers = [peer1, peer2] as unknown as PeerEntry[];

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers(mockPeers);

    // Should attempt CO_VALUE_LOADING_MAX_RETRIES retries
    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES; i++) {
      await vi.runAllTimersAsync();
    }

    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(
      CO_VALUE_LOADING_MAX_RETRIES,
    );
    expect(peer2.pushOutgoingMessage).toHaveBeenCalledTimes(
      CO_VALUE_LOADING_MAX_RETRIES,
    );
    expect(state.state.type).toBe("unavailable");
    await expect(state.getCoValue()).resolves.toBe("unavailable");

    vi.useRealTimers();
  });

  test("should skip errored coValues when loading from peers", async () => {
    vi.useFakeTimers();

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "server",
      },
      async () => {
        peer1.erroredCoValues.set(mockCoValueId, new Error("test") as any);
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
      },
    );
    const peer2 = createMockPeerState(
      {
        id: "peer2",
        role: "server",
      },
      async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer2",
        });
      },
    );

    const mockPeers = [peer1, peer2] as unknown as PeerEntry[];

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers(mockPeers);

    // Should attempt CO_VALUE_LOADING_MAX_RETRIES retries
    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES; i++) {
      await vi.runAllTimersAsync();
    }

    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(1);
    expect(peer2.pushOutgoingMessage).toHaveBeenCalledTimes(
      CO_VALUE_LOADING_MAX_RETRIES,
    );
    expect(state.state.type).toBe("unavailable");
    await expect(state.getCoValue()).resolves.toBe("unavailable");

    vi.useRealTimers();
  });

  test("should retry only on server peers", async () => {
    vi.useFakeTimers();

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "storage",
      },
      async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
      },
    );
    const peer2 = createMockPeerState(
      {
        id: "peer2",
        role: "server",
      },
      async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer2",
        });
      },
    );
    const mockPeers = [peer1, peer2] as unknown as PeerEntry[];

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers(mockPeers);

    // Should attempt CO_VALUE_LOADING_MAX_RETRIES retries
    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES; i++) {
      await vi.runAllTimersAsync();
    }

    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(1);
    expect(peer2.pushOutgoingMessage).toHaveBeenCalledTimes(
      CO_VALUE_LOADING_MAX_RETRIES,
    );
    expect(state.state.type).toBe("unavailable");
    await expect(state.getCoValue()).resolves.toEqual("unavailable");

    vi.useRealTimers();
  });

  test("should handle the coValues that become available in between of the retries", async () => {
    vi.useFakeTimers();

    let retries = 0;

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "server",
      },
      async () => {
        retries++;
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });

        if (retries === 2) {
          setTimeout(() => {
            state.dispatch({
              type: "available",
              coValue: createMockCoValueCore(mockCoValueId),
            });
          }, 100);
        }
      },
    );

    const mockPeers = [peer1] as unknown as PeerEntry[];

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers(mockPeers);

    // Should attempt CO_VALUE_LOADING_MAX_RETRIES retries
    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES + 1; i++) {
      await vi.runAllTimersAsync();
    }

    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(2);
    expect(state.state.type).toBe("available");
    await expect(state.getCoValue()).resolves.toEqual({ id: mockCoValueId });
    vi.useRealTimers();
  });

  test("should have a coValue as value property when becomes available after that have been marked as unavailable", async () => {
    vi.useFakeTimers();

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "server",
      },
      async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
      },
    );

    const mockPeers = [peer1] as unknown as PeerEntry[];

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers(mockPeers);

    // Should attempt CO_VALUE_LOADING_MAX_RETRIES retries
    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES; i++) {
      await vi.runAllTimersAsync();
    }

    state.dispatch({
      type: "available",
      coValue: createMockCoValueCore(mockCoValueId),
    });

    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(5);
    expect(state.state.type).toBe("available");
    await expect(state.getCoValue()).resolves.toEqual({ id: mockCoValueId });

    vi.useRealTimers();
  });

  test("should stop retrying when value becomes available", async () => {
    vi.useFakeTimers();

    let run = 1;

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "server",
      },
      async () => {
        if (run > 2) {
          state.dispatch({
            type: "available",
            coValue: createMockCoValueCore(mockCoValueId),
          });
        }
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
        run++;
      },
    );

    const mockPeers = [peer1] as unknown as PeerEntry[];

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers(mockPeers);

    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES; i++) {
      await vi.runAllTimersAsync();
    }
    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(3);
    expect(state.state.type).toBe("available");
    await expect(state.getCoValue()).resolves.toEqual({ id: mockCoValueId });

    vi.useRealTimers();
  });

  test("should start sending the known state to peers when available", async () => {
    vi.useFakeTimers();

    const mockCoValue = createMockCoValueCore(mockCoValueId);

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "storage",
      },
      async () => {
        state.dispatch({
          type: "available",
          coValue: mockCoValue,
        });
      },
    );
    const peer2 = createMockPeerState(
      {
        id: "peer1",
        role: "server",
      },
      async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer2",
        });
      },
    );

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers([peer1, peer2]);

    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES; i++) {
      await vi.runAllTimersAsync();
    }
    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(1);
    expect(peer2.pushOutgoingMessage).toHaveBeenCalledTimes(1);
    expect(peer2.pushOutgoingMessage).toHaveBeenCalledWith({
      action: "load",
      ...mockCoValue.knownState(),
    });
    expect(state.state.type).toBe("available");
    await expect(state.getCoValue()).resolves.toEqual({ id: mockCoValueId });

    vi.useRealTimers();
  });

  test("should skip closed peers", async () => {
    vi.useFakeTimers();

    const mockCoValue = createMockCoValueCore(mockCoValueId);

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "storage",
      },
      async () => {
        return new Promise(() => {});
      },
    );
    const peer2 = createMockPeerState(
      {
        id: "peer1",
        role: "server",
      },
      async () => {
        state.dispatch({
          type: "available",
          coValue: mockCoValue,
        });
      },
    );

    peer1.closed = true;

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers([peer1, peer2]);

    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES; i++) {
      await vi.runAllTimersAsync();
    }
    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(0);
    expect(peer2.pushOutgoingMessage).toHaveBeenCalledTimes(1);

    expect(state.state.type).toBe("available");
    await expect(state.getCoValue()).resolves.toEqual({ id: mockCoValueId });

    vi.useRealTimers();
  });

  test("should not be stuck in loading state when not getting a response", async () => {
    vi.useFakeTimers();

    const peer1 = createMockPeerState(
      {
        id: "peer1",
        role: "server",
      },
      async () => {},
    );

    const state = CoValueEntry.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers([peer1]);

    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES * 2; i++) {
      await vi.runAllTimersAsync();
    }
    await loadPromise;

    expect(peer1.pushOutgoingMessage).toHaveBeenCalledTimes(5);

    expect(state.state.type).toBe("unavailable");
    await expect(state.getCoValue()).resolves.toEqual("unavailable");

    vi.useRealTimers();
  });
});

function createMockPeerState(
  peer: Partial<Peer>,
  pushFn = () => Promise.resolve(),
) {
  const peerState = new PeerEntry(
    {
      id: "peer",
      role: "server",
      outgoing: {
        push: pushFn,
      },
      ...peer,
    } as Peer,
    undefined,
  );

  vi.spyOn(peerState, "pushOutgoingMessage").mockImplementation(pushFn);

  return peerState;
}

function createMockCoValueCore(mockCoValueId: string) {
  // Setting the knownState as part of the prototype to simplify
  // the equality checks
  const mockCoValue = Object.create({
    knownState: vi.fn().mockReturnValue({
      id: mockCoValueId,
      header: true,
      sessions: {},
    }),
  });

  mockCoValue.id = mockCoValueId;
  return mockCoValue as unknown as CoValueCore;
}
