import { createWebSocketPeer } from "cojson-transport-ws";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { WebSocket } from "ws";
import { webSocketWithReconnection } from "../webSocketWithReconnection";

// Mock dependencies
vi.mock("cojson-transport-ws", () => ({
  createWebSocketPeer: vi.fn().mockImplementation(({ onClose }) => ({
    id: "upstream",
    incoming: { push: vi.fn() },
    outgoing: { push: vi.fn(), close: vi.fn() },
    onClose,
  })),
}));

vi.mock("ws", () => ({
  WebSocket: vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    readyState: 1,
  })),
}));

describe("webSocketWithReconnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should create initial websocket connection", () => {
    const addPeerMock = vi.fn();
    const { peer } = webSocketWithReconnection(
      "ws://localhost:8080",
      addPeerMock,
    );

    expect(WebSocket).toHaveBeenCalledWith("ws://localhost:8080");
    expect(createWebSocketPeer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "upstream",
        role: "server",
      }),
    );
    expect(peer).toBeDefined();
  });

  test("should attempt reconnection when websocket closes", async () => {
    const addPeerMock = vi.fn();
    webSocketWithReconnection("ws://localhost:8080", addPeerMock);

    // Get the onClose handler from the first createWebSocketPeer call
    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;

    // Simulate websocket close
    initialPeer.onClose();

    // Fast-forward timer to trigger reconnection
    await vi.advanceTimersByTimeAsync(1000);

    expect(WebSocket).toHaveBeenCalledTimes(2);
    expect(createWebSocketPeer).toHaveBeenCalledTimes(2);
    expect(addPeerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "upstream",
      }),
    );
  });

  test("should clean up when done is called", () => {
    const addPeerMock = vi.fn();
    const { done } = webSocketWithReconnection(
      "ws://localhost:8080",
      addPeerMock,
    );

    // Get the onClose handler
    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;

    done();

    // Simulate websocket close
    initialPeer.onClose();

    // Fast-forward timer
    vi.advanceTimersByTime(1000);

    // Should not attempt reconnection
    expect(WebSocket).toHaveBeenCalledTimes(1);
    expect(createWebSocketPeer).toHaveBeenCalledTimes(1);
  });

  test("should not attempt reconnection after done is called", async () => {
    const addPeerMock = vi.fn();
    const { done } = webSocketWithReconnection(
      "ws://localhost:8080",
      addPeerMock,
    );

    // Get the onClose handler
    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;

    // Simulate first close and reconnection
    initialPeer.onClose();
    await vi.advanceTimersByTimeAsync(1000);

    expect(WebSocket).toHaveBeenCalledTimes(2);

    // Call done
    done();

    // Simulate another close
    vi.mocked(createWebSocketPeer).mock.results[1]!.value.onClose();
    await vi.advanceTimersByTimeAsync(1000);

    // Should not create another connection
    expect(WebSocket).toHaveBeenCalledTimes(2);
  });
});
