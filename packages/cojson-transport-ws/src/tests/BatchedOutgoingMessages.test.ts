import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { BatchedOutgoingMessages, MAX_OUTGOING_MESSAGES_CHUNK_BYTES } from "../BatchedOutgoingMessages.js";
import { SyncMessage } from "cojson";
import { CoValueKnownState } from "cojson/src/sync.js";

beforeEach(() => {
    vi.useFakeTimers();
})

afterEach(() => {
    vi.useRealTimers();
})

describe("BatchedOutgoingMessages", () => {
    function setup() {
        const sendMock = vi.fn();
        const batchedMessages = new BatchedOutgoingMessages(sendMock);
        return { sendMock, batchedMessages };
    }

    test("should batch messages and send them after a timeout", () => {
        const { sendMock, batchedMessages } = setup();
        const message1: SyncMessage = { action: "known", id: "co_z1", header: false, sessions: {} };
        const message2: SyncMessage = { action: "known", id: "co_z2", header: false, sessions: {} };

        batchedMessages.push(message1);
        batchedMessages.push(message2);

        expect(sendMock).not.toHaveBeenCalled();

        vi.runAllTimers();

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith(
            `${JSON.stringify(message1)}\n${JSON.stringify(message2)}`
        );
    });

    test("should send messages immediately when reaching MAX_OUTGOING_MESSAGES_CHUNK_BYTES", () => {
        const { sendMock, batchedMessages } = setup();
        const largeMessage: SyncMessage = {
            action: "known",
            id: "co_z_large",
            header: false,
            sessions: {
                // Add a large payload to exceed MAX_OUTGOING_MESSAGES_CHUNK_BYTES
                payload: "x".repeat(MAX_OUTGOING_MESSAGES_CHUNK_BYTES)
            } as CoValueKnownState['sessions'],
           
        };

        batchedMessages.push(largeMessage);

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith(JSON.stringify(largeMessage));
    });

    test("should send accumulated messages before a large message", () => {
        const { sendMock, batchedMessages } = setup();
        const smallMessage: SyncMessage = { action: "known", id: "co_z_small", header: false, sessions: {} };
        const largeMessage: SyncMessage = {
            action: "known",
            id: "co_z_large",
            header: false,
            sessions: {
                // Add a large payload to exceed MAX_OUTGOING_MESSAGES_CHUNK_BYTES
                payload: "x".repeat(MAX_OUTGOING_MESSAGES_CHUNK_BYTES)
            } as CoValueKnownState['sessions'],
        };

        batchedMessages.push(smallMessage);
        batchedMessages.push(largeMessage);

        vi.runAllTimers();

        expect(sendMock).toHaveBeenCalledTimes(2);
        expect(sendMock).toHaveBeenNthCalledWith(1, JSON.stringify(smallMessage));
        expect(sendMock).toHaveBeenNthCalledWith(2, JSON.stringify(largeMessage));
    });

    test("should send remaining messages on close", () => {
        const { sendMock, batchedMessages } = setup();
        const message: SyncMessage = { action: "known", id: "co_z_test", header: false, sessions: {} };

        batchedMessages.push(message);
        expect(sendMock).not.toHaveBeenCalled();

        batchedMessages.close();

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test("should clear timeout when pushing new messages", () => {
        const { sendMock, batchedMessages } = setup();
        const message1: SyncMessage = { action: "known", id: "co_z1", header: false, sessions: {} };
        const message2: SyncMessage = { action: "known", id: "co_z2", header: false, sessions: {} };

        batchedMessages.push(message1);
        
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        
        batchedMessages.push(message2);

        expect(clearTimeoutSpy).toHaveBeenCalled();

        vi.runAllTimers();

        expect(sendMock).toHaveBeenCalledTimes(1);
        expect(sendMock).toHaveBeenCalledWith(
            `${JSON.stringify(message1)}\n${JSON.stringify(message2)}`
        );
    });
});