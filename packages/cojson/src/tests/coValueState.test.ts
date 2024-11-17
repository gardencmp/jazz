import { describe, expect, test, vi } from "vitest";
import { PeerState } from "../PeerState";
import { CoValueCore } from "../coValueCore";
import {
  CO_VALUE_LOADING_MAX_RETRIES,
  CoValueLoadingState,
  CoValueState,
} from "../coValueState";
import { RawCoID } from "../ids";

describe("CoValueState", () => {
  const mockCoValueId = "co_test123" as RawCoID;

  test("should create unknown state", () => {
    const state = CoValueState.Unknown(mockCoValueId);

    expect(state.id).toBe(mockCoValueId);
    expect(state.state.type).toBe("unknown");
  });

  test("should create loading state", () => {
    const peerIds = ["peer1", "peer2"];
    const state = CoValueState.Loading(mockCoValueId, peerIds);

    expect(state.id).toBe(mockCoValueId);
    expect(state.state.type).toBe("loading");
  });

  test("should create available state", async () => {
    const mockCoValue = { id: mockCoValueId } as CoValueCore;
    const state = CoValueState.Available(mockCoValue);

    expect(state.id).toBe(mockCoValueId);
    expect(state.state.type).toBe("available");
    expect((state.state as any).coValue).toBe(mockCoValue);
    await expect(state.getCoValue()).resolves.toEqual(mockCoValue);
  });

  test("should handle not-found action", async () => {
    const state = CoValueState.Loading(mockCoValueId, ["peer1", "peer2"]);

    const innerState = state.state as CoValueLoadingState;

    state.dispatch({
      type: "not-found-in-peer",
      peerId: "peer1",
    });

    expect(innerState.resolution).toBe(undefined);

    state.dispatch({
      type: "not-found-in-peer",
      peerId: "peer2",
    });

    expect(innerState.resolution).toBe("unavailable");
  });

  test("should handle found action", async () => {
    const mockCoValue = { id: mockCoValueId } as CoValueCore;
    const state = CoValueState.Loading(mockCoValueId, ["peer1", "peer2"]);

    const innerState = state.state as CoValueLoadingState;
    const stateValuePromise = state.getCoValue();

    state.dispatch({
      type: "found-in-peer",
      peerId: "peer1",
      coValue: mockCoValue,
    });

    expect(innerState.resolution).toBe(mockCoValue);

    const result = await state.getCoValue();
    expect(result).toBe(mockCoValue);
    await expect(stateValuePromise).resolves.toBe(mockCoValue);
  });

  test("should ignore actions when not in loading state", () => {
    const state = CoValueState.Unknown(mockCoValueId);

    state.dispatch({
      type: "not-found-in-peer",
      peerId: "peer1",
    });

    expect(state.state.type).toBe("unknown");
  });

  test("should retry loading from peers when unsuccessful", async () => {
    vi.useFakeTimers();

    const peer1 = {
      id: "peer1",
      erroredCoValues: new Set(),
      retryUnavailableCoValues: true,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
      }),
    };
    const peer2 = {
      id: "peer2",
      erroredCoValues: new Set(),
      retryUnavailableCoValues: true,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer2",
        });
      }),
    };

    const mockPeers = [peer1, peer2] as unknown as PeerState[];

    const state = CoValueState.Unknown(mockCoValueId);
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

    const peer1 = {
      id: "peer1",
      erroredCoValues: new Set<RawCoID>(),
      retryUnavailableCoValues: true,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        peer1.erroredCoValues.add(mockCoValueId);
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
      }),
    };
    const peer2 = {
      id: "peer2",
      erroredCoValues: new Set(),
      retryUnavailableCoValues: true,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        console.log("pushing not-found from peer2");
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer2",
        });
      }),
    };
    const mockPeers = [peer1, peer2] as unknown as PeerState[];

    const state = CoValueState.Unknown(mockCoValueId);
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

  test("should retry only from peers that have the retry flag enabled", async () => {
    vi.useFakeTimers();

    const peer1 = {
      id: "peer1",
      erroredCoValues: new Set([]),
      retryUnavailableCoValues: false,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
      }),
    };
    const peer2 = {
      id: "peer2",
      erroredCoValues: new Set(),
      retryUnavailableCoValues: true,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer2",
        });
      }),
    };
    const mockPeers = [peer1, peer2] as unknown as PeerState[];

    const state = CoValueState.Unknown(mockCoValueId);
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

    const peer1 = {
      id: "peer1",
      erroredCoValues: new Set([]),
      retryUnavailableCoValues: true,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        retries++;
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });

        if (retries === 2) {
          setTimeout(() => {
            state.dispatch({
              type: "found-in-peer",
              peerId: "peer1",
              coValue: { id: mockCoValueId } as CoValueCore,
            });
          }, 100);
        }
      }),
    };
    const mockPeers = [peer1] as unknown as PeerState[];

    const state = CoValueState.Unknown(mockCoValueId);
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

    const peer1 = {
      id: "peer1",
      erroredCoValues: new Set([]),
      retryUnavailableCoValues: true,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
      }),
    };
    const mockPeers = [peer1] as unknown as PeerState[];

    const state = CoValueState.Unknown(mockCoValueId);
    const loadPromise = state.loadFromPeers(mockPeers);

    // Should attempt CO_VALUE_LOADING_MAX_RETRIES retries
    for (let i = 0; i < CO_VALUE_LOADING_MAX_RETRIES; i++) {
      await vi.runAllTimersAsync();
    }

    state.dispatch({
      type: "found-in-peer",
      peerId: "peer1",
      coValue: { id: mockCoValueId } as CoValueCore,
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

    const peer1 = {
      id: "peer1",
      erroredCoValues: new Set(),
      retryUnavailableCoValues: true,
      pushOutgoingMessage: vi.fn().mockImplementation(async () => {
        if (run > 2) {
          state.dispatch({
            type: "found-in-peer",
            peerId: "peer1",
            coValue: { id: mockCoValueId } as CoValueCore,
          });
        }
        state.dispatch({
          type: "not-found-in-peer",
          peerId: "peer1",
        });
        run++;
      }),
    };

    const mockPeers = [peer1] as unknown as PeerState[];

    const state = CoValueState.Unknown(mockCoValueId);
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
});
