import { describe, expect, test, vi } from "vitest";
import { PeerKnownStateActions } from "../PeerKnownStates.js";
import { PeerState } from "../PeerState.js";
import { CO_VALUE_PRIORITY } from "../priority.js";
import { Peer, SyncMessage } from "../sync.js";

function setup() {
  const mockPeer: Peer = {
    id: "test-peer",
    role: "peer",
    priority: 1,
    crashOnClose: false,
    incoming: (async function* () {})(),
    outgoing: {
      push: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    },
  };
  const peerState = new PeerState(mockPeer, undefined);
  return { mockPeer, peerState };
}

describe("PeerState", () => {
  test("should push outgoing message to peer", async () => {
    const { mockPeer, peerState } = setup();
    const message: SyncMessage = {
      action: "load",
      id: "co_ztest-id",
      header: false,
      sessions: {},
    };
    await peerState.pushOutgoingMessage(message);
    expect(mockPeer.outgoing.push).toHaveBeenCalledWith(message);
  });

  test("should return peer's incoming when not closed", () => {
    const { mockPeer, peerState } = setup();
    expect(peerState.incoming).toBe(mockPeer.incoming);
  });

  test("should return Disconnected when closed", async () => {
    const { peerState } = setup();
    peerState.gracefulShutdown();
    const incomingIterator = peerState.incoming[Symbol.asyncIterator]();
    const { value, done } = await incomingIterator.next();
    expect(value).toBe("Disconnected");
    expect(done).toBe(false);
  });

  test("should perform graceful shutdown", () => {
    const { mockPeer, peerState } = setup();
    const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    peerState.gracefulShutdown();
    expect(mockPeer.outgoing.close).toHaveBeenCalled();
    expect(peerState.closed).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith("Gracefully closing", "test-peer");
    consoleSpy.mockRestore();
  });

  test("should empty the queue when closing", async () => {
    const { mockPeer, peerState } = setup();

    mockPeer.outgoing.push = vi.fn().mockImplementation((message) => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    const message1 = peerState.pushOutgoingMessage({
      action: "content",
      id: "co_z1",
      new: {},
      priority: CO_VALUE_PRIORITY.HIGH,
    });
    const message2 = peerState.pushOutgoingMessage({
      action: "content",
      id: "co_z1",
      new: {},
      priority: CO_VALUE_PRIORITY.HIGH,
    });

    peerState.gracefulShutdown();

    await Promise.allSettled([message1, message2]);

    await expect(message1).resolves.toBe(undefined);
    await expect(message2).resolves.toBe(undefined);
  });

  test("should schedule outgoing messages based on their priority", async () => {
    const { peerState } = setup();

    const loadMessage: SyncMessage = {
      action: "load",
      id: "co_zhigh",
      header: false,
      sessions: {},
    };
    const contentMessageHigh: SyncMessage = {
      action: "content",
      id: "co_zhigh",
      new: {},
      priority: CO_VALUE_PRIORITY.HIGH,
    };
    const contentMessageMid: SyncMessage = {
      action: "content",
      id: "co_zmid",
      new: {},
      priority: CO_VALUE_PRIORITY.MEDIUM,
    };
    const contentMessageLow: SyncMessage = {
      action: "content",
      id: "co_zlow",
      new: {},
      priority: CO_VALUE_PRIORITY.LOW,
    };

    const promises = [
      peerState.pushOutgoingMessage(contentMessageLow),
      peerState.pushOutgoingMessage(contentMessageMid),
      peerState.pushOutgoingMessage(contentMessageHigh),
      peerState.pushOutgoingMessage(loadMessage),
    ];

    await Promise.all(promises);

    // The first message is pushed directly, the other three are queued because are waiting
    // for the first push to be completed.
    expect(peerState["peer"].outgoing.push).toHaveBeenNthCalledWith(
      1,
      contentMessageLow,
    );

    // Load message are managed as high priority messages and having the same priority as the content message
    // they follow the push order.
    expect(peerState["peer"].outgoing.push).toHaveBeenNthCalledWith(
      2,
      contentMessageHigh,
    );
    expect(peerState["peer"].outgoing.push).toHaveBeenNthCalledWith(
      3,
      loadMessage,
    );
    expect(peerState["peer"].outgoing.push).toHaveBeenNthCalledWith(
      4,
      contentMessageMid,
    );
  });

  test("should clone the knownStates into optimisticKnownStates and knownStates when passed as argument", () => {
    const { peerState, mockPeer } = setup();
    const action: PeerKnownStateActions = {
      type: "SET",
      id: "co_z1",
      value: {
        id: "co_z1",
        header: false,
        sessions: {},
      },
    };
    peerState.dispatchToKnownStates(action);

    const newPeerState = new PeerState(mockPeer, peerState.knownStates);

    expect(newPeerState.knownStates).toEqual(peerState.knownStates);
    expect(newPeerState.optimisticKnownStates).toEqual(peerState.knownStates);
  });

  test("should dispatch to both states", () => {
    const { peerState } = setup();
    const knownStatesSpy = vi.spyOn(peerState.knownStates, "dispatch");
    const optimisticKnownStatesSpy = vi.spyOn(
      peerState.optimisticKnownStates,
      "dispatch",
    );

    const action: PeerKnownStateActions = {
      type: "SET",
      id: "co_z1",
      value: {
        id: "co_z1",
        header: false,
        sessions: {},
      },
    };
    peerState.dispatchToKnownStates(action);

    expect(knownStatesSpy).toHaveBeenCalledWith(action);
    expect(optimisticKnownStatesSpy).toHaveBeenCalledWith(action);
  });

  test("should use same reference for knownStates and optimisticKnownStates for storage peers", () => {
    const mockStoragePeer: Peer = {
      id: "test-storage-peer",
      role: "storage",
      priority: 1,
      crashOnClose: false,
      incoming: (async function* () {})(),
      outgoing: {
        push: vi.fn().mockResolvedValue(undefined),
        close: vi.fn(),
      },
    };
    const peerState = new PeerState(mockStoragePeer, undefined);

    // Verify they are the same reference
    expect(peerState.knownStates).toBe(peerState.optimisticKnownStates);

    // Verify that dispatching only updates one state
    const knownStatesSpy = vi.spyOn(peerState.knownStates, "dispatch");
    const optimisticKnownStatesSpy = vi.spyOn(
      peerState.optimisticKnownStates,
      "dispatch",
    );

    const action: PeerKnownStateActions = {
      type: "SET",
      id: "co_z1",
      value: {
        id: "co_z1",
        header: false,
        sessions: {},
      },
    };
    peerState.dispatchToKnownStates(action);

    // Only one dispatch should happen since they're the same reference
    expect(knownStatesSpy).toHaveBeenCalledTimes(1);
    expect(knownStatesSpy).toHaveBeenCalledWith(action);
    expect(optimisticKnownStatesSpy).toHaveBeenCalledTimes(1);
    expect(optimisticKnownStatesSpy).toHaveBeenCalledWith(action);
  });

  test("should use separate references for knownStates and optimisticKnownStates for non-storage peers", () => {
    const { peerState } = setup(); // Uses a regular peer

    // Verify they are different references
    expect(peerState.knownStates).not.toBe(peerState.optimisticKnownStates);
  });
});
