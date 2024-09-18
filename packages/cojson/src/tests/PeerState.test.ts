import { describe, test, expect, vi } from "vitest";
import { PeerState } from "../PeerState.js";
import { Peer, SyncMessage } from "../sync.js";
import { CO_VALUE_PRIORITY } from "../priority.js";

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
    const peerState = new PeerState(mockPeer);
    return { mockPeer, peerState };
}

describe("PeerState", () => {
    test("should initialize with correct properties", () => {
        const { peerState } = setup();
        expect(peerState.id).toBe("test-peer");
        expect(peerState.role).toBe("peer");
        expect(peerState.priority).toBe(1);
        expect(peerState.crashOnClose).toBe(false);
        expect(peerState.closed).toBe(false);
        expect(peerState.optimisticKnownStates).toEqual({});
        expect(peerState.toldKnownState).toEqual(new Set());
    });

    test("should push outgoing message to peer", async () => {
        const { mockPeer, peerState } = setup();
        const message: SyncMessage = { action: "load", id: "co_ztest-id", header: false, sessions: {} };
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

    test("should schedule outgoing messages based on their priority", async () => {
        const { peerState } = setup();

        const loadMessage: SyncMessage = { action: "load", id: "co_zhigh", header: false, sessions: {} };
        const contentMessageHigh: SyncMessage = { action: "content", id: "co_zhigh", new: {}, priority: CO_VALUE_PRIORITY.HIGH };
        const contentMessageMid: SyncMessage = { action: "content", id: "co_zmid", new: {}, priority: CO_VALUE_PRIORITY.MEDIUM };
        const contentMessageLow: SyncMessage = { action: "content", id: "co_zlow", new: {}, priority: CO_VALUE_PRIORITY.LOW };

        const promises = [
            peerState.pushOutgoingMessage(contentMessageLow),
            peerState.pushOutgoingMessage(contentMessageMid),
            peerState.pushOutgoingMessage(contentMessageHigh),
            peerState.pushOutgoingMessage(loadMessage),
        ];

        await Promise.all(promises);

        // The first message is pushed directly, the other three are queued because are waiting
        // for the first push to be completed.
        expect(peerState["peer"].outgoing.push).toHaveBeenNthCalledWith(1, contentMessageLow); 

        // Load message are managed as high priority messages and having the same priority as the content message
        // they follow the push order.
        expect(peerState["peer"].outgoing.push).toHaveBeenNthCalledWith(2, contentMessageHigh);
        expect(peerState["peer"].outgoing.push).toHaveBeenNthCalledWith(3, loadMessage);
        expect(peerState["peer"].outgoing.push).toHaveBeenNthCalledWith(4, contentMessageMid);
    });
});
