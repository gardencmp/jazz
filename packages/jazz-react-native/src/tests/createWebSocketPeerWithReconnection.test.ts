// @vitest-environment happy-dom

import NetInfo, {
  NetInfoChangeHandler,
  NetInfoState,
} from "@react-native-community/netinfo";
import { createWebSocketPeer } from "cojson-transport-ws";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createWebSocketPeerWithReconnection } from "../createWebSocketPeerWithReconnection.js";

// Mock WebSocket
class MockWebSocket {
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  close = vi.fn();
  readyState = 1;
}

vi.mock("@react-native-community/netinfo", async () => {
  return {
    default: {
      addEventListener: vi.fn(),
    },
  };
});

vi.mock("cojson-transport-ws", () => ({
  createWebSocketPeer: vi.fn().mockImplementation(({ onClose }) => ({
    id: "test-peer",
    incoming: { push: vi.fn() },
    outgoing: { push: vi.fn(), close: vi.fn() },
    onClose,
  })),
}));

let listeners = new Set<NetInfoChangeHandler>();
let unsubscribe: (() => void) | undefined = undefined;

function mockNetInfo() {
  listeners.clear();
  vi.mocked(NetInfo.addEventListener).mockImplementation((listener) => {
    listeners.add(listener);
    unsubscribe = vi.fn();
    return unsubscribe;
  });
}

function dispatchNetInfoChange(isConnected: boolean) {
  listeners.forEach((listener) => listener({ isConnected } as NetInfoState));
}

describe("createWebSocketPeerWithReconnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("WebSocket", MockWebSocket);
    mockNetInfo();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should reset reconnection timeout when coming online", async () => {
    vi.useFakeTimers();
    const addPeerMock = vi.fn();

    const { done } = createWebSocketPeerWithReconnection(
      "ws://localhost:8080",
      500,
      addPeerMock,
    );

    // Simulate multiple disconnections to increase timeout
    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;
    initialPeer.onClose();

    await vi.advanceTimersByTimeAsync(1000);

    expect(addPeerMock).toHaveBeenCalledTimes(1);

    vi.mocked(createWebSocketPeer).mock.results[1]!.value.onClose();
    await vi.advanceTimersByTimeAsync(2000);

    expect(addPeerMock).toHaveBeenCalledTimes(2);

    // Resets the timeout to initial value
    dispatchNetInfoChange(true);

    // Next reconnection should use initial timeout
    vi.mocked(createWebSocketPeer).mock.results[2]!.value.onClose();
    await vi.advanceTimersByTimeAsync(1000);

    expect(addPeerMock).toHaveBeenCalledTimes(3);

    done();
  });

  test("should wait for online event or timeout before reconnecting", async () => {
    vi.useFakeTimers();

    const addPeerMock = vi.fn();
    const { done } = createWebSocketPeerWithReconnection(
      "ws://localhost:8080",
      500,
      addPeerMock,
    );

    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;

    // Simulate offline state
    vi.stubGlobal("navigator", { onLine: false });

    initialPeer.onClose();

    // Advance timer but not enough to trigger reconnection
    await vi.advanceTimersByTimeAsync(500);
    expect(createWebSocketPeer).toHaveBeenCalledTimes(1);

    // Simulate coming back online
    dispatchNetInfoChange(true);

    // Wait for event loop to settle
    await Promise.resolve().then();

    // Should reconnect immediately after coming online
    expect(createWebSocketPeer).toHaveBeenCalledTimes(2);

    done();
  });

  test("should clean up event listeners when done", () => {
    const addPeerMock = vi.fn();
    const { done } = createWebSocketPeerWithReconnection(
      "ws://localhost:8080",
      1000,
      addPeerMock,
    );

    done();

    expect(unsubscribe).toHaveBeenCalled();
  });

  test("should not attempt reconnection after done is called", async () => {
    vi.useFakeTimers();

    const addPeerMock = vi.fn();
    const { done } = createWebSocketPeerWithReconnection(
      "ws://localhost:8080",
      500,
      addPeerMock,
    );

    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;

    done();

    initialPeer.onClose();
    await vi.advanceTimersByTimeAsync(1000);

    expect(createWebSocketPeer).toHaveBeenCalledTimes(1);
  });
});
