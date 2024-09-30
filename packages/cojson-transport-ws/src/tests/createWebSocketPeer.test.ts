import { describe, test, expect, vi, Mocked } from "vitest";
import {
    BUFFER_LIMIT,
    BUFFER_LIMIT_POLLING_INTERVAL,
    createWebSocketPeer,
} from "../index.js";
import { AnyWebSocket, PingMsg } from "../types.js";
import { SyncMessage } from "cojson";
import { Channel } from "cojson/src/streamUtils";

const g: typeof globalThis & {
    jazzPings?: {
        received: number;
        sent: number;
        dc: string;
    }[];
} = globalThis;

function setup() {
    const listeners = new Map<string, (event: MessageEvent) => void>();

    const mockWebSocket = {
        readyState: 1,
        addEventListener: vi.fn().mockImplementation((type, listener) => {
            listeners.set(type, listener);
        }),
        close: vi.fn(),
        send: vi.fn(),
    } as unknown as Mocked<AnyWebSocket>;

    const peer = createWebSocketPeer({
        id: "test-peer",
        websocket: mockWebSocket,
        role: "client",
    });

    return { mockWebSocket, peer, listeners };
}

describe("createWebSocketPeer", () => {
    test("should create a peer with correct properties", () => {
        const { peer } = setup();

        expect(peer).toHaveProperty("id", "test-peer");
        expect(peer).toHaveProperty("incoming");
        expect(peer).toHaveProperty("outgoing");
        expect(peer).toHaveProperty("role", "client");
        expect(peer).toHaveProperty("crashOnClose", false);
    });

    test("should handle ping messages", async () => {
        const { listeners } = setup();

        const pingMessage: PingMsg = {
            type: "ping",
            time: Date.now(),
            dc: "test-dc",
        };
        const messageEvent = new MessageEvent("message", {
            data: JSON.stringify(pingMessage),
        });

        const messageHandler = listeners.get("message");

        messageHandler?.(messageEvent);

        // Check if the ping was recorded in the global jazzPings array
        expect(g.jazzPings?.length).toBeGreaterThan(0);
        expect(g.jazzPings?.at(-1)).toMatchObject({
            sent: pingMessage.time,
            dc: pingMessage.dc,
        });
    });

    test("should handle disconnection", async () => {
        expect.assertions(1);

        const { listeners, peer } = setup();

        const incoming = peer.incoming as Channel<
            SyncMessage | "Disconnected" | "PingTimeout"
        >;
        const pushSpy = vi.spyOn(incoming, "push");

        const closeHandler = listeners.get("close");

        closeHandler?.(new MessageEvent("close"));

        expect(pushSpy).toHaveBeenCalledWith("Disconnected");
    });

    test("should handle ping timeout", async () => {
        vi.useFakeTimers();
        const { listeners, peer } = setup();

        const incoming = peer.incoming as Channel<
            SyncMessage | "Disconnected" | "PingTimeout"
        >;
        const pushSpy = vi.spyOn(incoming, "push");

        const messageHandler = listeners.get("message");

        messageHandler?.(new MessageEvent("message", { data: "{}" }));

        await vi.advanceTimersByTimeAsync(10_000);

        expect(pushSpy).toHaveBeenCalledWith("PingTimeout");

        vi.useRealTimers();
    });

    test("should send outgoing messages", async () => {
        const { peer, mockWebSocket } = setup();

        const testMessage: SyncMessage = {
            action: "known",
            id: "co_ztest",
            header: false,
            sessions: {},
        };
        const promise = peer.outgoing.push(testMessage);

        await new Promise<void>(queueMicrotask);

        expect(mockWebSocket.send).toHaveBeenCalledWith(
            JSON.stringify(testMessage),
        );
        await expect(promise).resolves.toBeUndefined();
    });

    test("should stop sending messages when the websocket is closed", async () => {
        const { peer, mockWebSocket } = setup();

        mockWebSocket.send.mockImplementation(() => {
            mockWebSocket.readyState = 0;
        });

        const message1: SyncMessage = {
            action: "known",
            id: "co_ztest",
            header: false,
            sessions: {},
        };
        const message2: SyncMessage = {
            action: "content",
            id: "co_zlow",
            new: {},
            priority: 1,
        };

        void peer.outgoing.push(message1);
        void peer.outgoing.push(message2);

        await new Promise<void>(queueMicrotask);

        expect(mockWebSocket.send).toHaveBeenNthCalledWith(
            1,
            JSON.stringify(message1),
        );
        expect(mockWebSocket.send).not.toHaveBeenNthCalledWith(
            2,
            JSON.stringify(message2),
        );
    });

    test("should wait for the buffer to be under BUFFER_LIMIT before sending more messages", async () => {
        vi.useFakeTimers();
        const { peer, mockWebSocket } = setup();

        mockWebSocket.send.mockImplementation(() => {
            mockWebSocket.bufferedAmount = BUFFER_LIMIT + 1;
        });

        const message1: SyncMessage = {
            action: "known",
            id: "co_ztest",
            header: false,
            sessions: {},
        };
        const message2: SyncMessage = {
            action: "content",
            id: "co_zlow",
            new: {},
            priority: 1,
        };

        void peer.outgoing.push(message1);
        void peer.outgoing.push(message2);

        await new Promise<void>(queueMicrotask);

        expect(mockWebSocket.send).toHaveBeenNthCalledWith(
            1,
            JSON.stringify(message1),
        );
        expect(mockWebSocket.send).not.toHaveBeenNthCalledWith(
            2,
            JSON.stringify(message2),
        );

        mockWebSocket.bufferedAmount = 0;

        await vi.advanceTimersByTimeAsync(BUFFER_LIMIT_POLLING_INTERVAL + 1);

        expect(mockWebSocket.send).toHaveBeenNthCalledWith(
            2,
            JSON.stringify(message2),
        );

        vi.useRealTimers();
    });

    test("should close the websocket connection", () => {
        const { mockWebSocket, peer } = setup();

        peer.outgoing.close();

        expect(mockWebSocket.close).toHaveBeenCalled();
    });
});
