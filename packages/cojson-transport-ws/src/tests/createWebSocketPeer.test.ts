import { describe, test, expect, vi, Mocked } from "vitest";
import {
    BUFFER_LIMIT,
    BUFFER_LIMIT_POLLING_INTERVAL,
    createWebSocketPeer,
    CreateWebSocketPeerOpts,
} from "../index.js";
import { AnyWebSocket } from "../types.js";
import { SyncMessage } from "cojson";
import { Channel } from "cojson/src/streamUtils.ts";
import { MAX_OUTGOING_MESSAGES_CHUNK_SIZE } from "../BatchedOutgoingMessages.js";

function setup(opts: Partial<CreateWebSocketPeerOpts> = {}) {
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
        batchingByDefault: true,
        ...opts,
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

        await waitFor(() => {
            expect(mockWebSocket.send).toHaveBeenCalledWith(
                JSON.stringify(testMessage),
            );
        });

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

        await waitFor(() => {
            expect(mockWebSocket.send).toHaveBeenCalled();
        });

        expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message1));

        mockWebSocket.send.mockClear();
        void peer.outgoing.push(message2);

        await new Promise<void>((resolve) => setTimeout(resolve, 100))

        expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    test("should close the websocket connection", () => {
        const { mockWebSocket, peer } = setup();

        peer.outgoing.close();

        expect(mockWebSocket.close).toHaveBeenCalled();
    });

    describe("batchingByDefault = true", () => {
        test("should batch outgoing messages", async () => {
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

            await waitFor(() => {
                expect(mockWebSocket.send).toHaveBeenCalled();
            });

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                [message1, message2]
                    .map((msg) => JSON.stringify(msg))
                    .join("\n"),
            );
        });

        test("should send all the pending messages when the websocket is closed", async () => {
            const { peer, mockWebSocket } = setup();

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

            peer.outgoing.close();

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                [message1, message2]
                    .map((msg) => JSON.stringify(msg))
                    .join("\n"),
            );
        });

        test("should limit the chunk size to MAX_OUTGOING_MESSAGES_CHUNK_SIZE", async () => {
            const { peer, mockWebSocket } = setup();

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

            Array.from({ length: MAX_OUTGOING_MESSAGES_CHUNK_SIZE }).forEach(
                () => {
                    void peer.outgoing.push(message1);
                },
            );
            void peer.outgoing.push(message2);

            await waitFor(() => {
                expect(mockWebSocket.send).toHaveBeenCalledTimes(2);
            });

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                Array.from(
                    { length: MAX_OUTGOING_MESSAGES_CHUNK_SIZE },
                    () => message1,
                )
                    .map((msg) => JSON.stringify(msg))
                    .join("\n"),
            );

            expect(mockWebSocket.send).toHaveBeenNthCalledWith(
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

            Array.from({ length: MAX_OUTGOING_MESSAGES_CHUNK_SIZE }).forEach(
                () => {
                    void peer.outgoing.push(message1);
                },
            );
            void peer.outgoing.push(message2);

            await vi.advanceTimersByTimeAsync(100);

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                Array.from({ length: 10 }, () => message1)
                    .map((msg) => JSON.stringify(msg))
                    .join("\n"),
            );

            mockWebSocket.bufferedAmount = 0;

            await vi.advanceTimersByTimeAsync(
                BUFFER_LIMIT_POLLING_INTERVAL + 1,
            );

            expect(mockWebSocket.send).toHaveBeenNthCalledWith(
                2,
                JSON.stringify(message2),
            );

            vi.useRealTimers();
        });
    });

    describe("batchingByDefault = false", () => {
        test("should not batch outgoing messages", async () => {
            const { peer, mockWebSocket } = setup({ batchingByDefault: false });

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

            await waitFor(() => {
                expect(mockWebSocket.send).toHaveBeenCalled();
            });

            expect(mockWebSocket.send).toHaveBeenNthCalledWith(
                1,
                JSON.stringify(message1),
            );
            expect(mockWebSocket.send).toHaveBeenNthCalledWith(
                2,
                JSON.stringify(message2),
            );
        });

        test("should start batching outgoing messages when reiceving a batched message", async () => {
            const { peer, mockWebSocket, listeners } = setup({
                batchingByDefault: false,
            });

            const message1: SyncMessage = {
                action: "known",
                id: "co_ztest",
                header: false,
                sessions: {},
            };

            const messageHandler = listeners.get("message");

            messageHandler?.(
                new MessageEvent("message", {
                    data: Array.from(
                        { length: MAX_OUTGOING_MESSAGES_CHUNK_SIZE },
                        () => message1,
                    )
                        .map((msg) => JSON.stringify(msg))
                        .join("\n"),
                }),
            );


            const message2: SyncMessage = {
                action: "content",
                id: "co_zlow",
                new: {},
                priority: 1,
            };

            void peer.outgoing.push(message1);
            void peer.outgoing.push(message2);

            await waitFor(() => {
                expect(mockWebSocket.send).toHaveBeenCalled();
            });

            expect(mockWebSocket.send).toHaveBeenCalledWith(
                [message1, message2]
                    .map((msg) => JSON.stringify(msg))
                    .join("\n"),
            );
        });
    });
});

function waitFor(callback: () => boolean | void) {
    return new Promise<void>((resolve, reject) => {
        const checkPassed = () => {
            try {
                return { ok: callback(), error: null };
            } catch (error) {
                return { ok: false, error };
            }
        };

        let retries = 0;

        const interval = setInterval(() => {
            const { ok, error } = checkPassed();

            if (ok !== false) {
                clearInterval(interval);
                resolve();
            }

            if (++retries > 10) {
                clearInterval(interval);
                reject(error);
            }
        }, 100);
    });
}
