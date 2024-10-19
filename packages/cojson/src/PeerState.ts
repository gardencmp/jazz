import { RawCoID, SessionID } from "./ids.js";
import { CO_VALUE_PRIORITY } from "./priority.js";
import {
    PriorityBasedMessageQueue,
    QueueEntry,
} from "./PriorityBasedMessageQueue.js";
import { combinedKnownStates, CoValueKnownState, emptyKnownState, Peer, SyncMessage } from "./sync.js";


class PeerCoValueKnownState {
    constructor(public value: CoValueKnownState) {}

    get() {
        return this.value;
    }

    updateHeader(header: boolean) {
        this.value.header = header;
    }

    combineWith(value: CoValueKnownState) {
        this.value = combinedKnownStates(this.value, value);
    }

    set(value: CoValueKnownState) {
        this.value = value;
    }

    updateSessionCounter(sessionId: SessionID, value: number) {
        const currentValue = this.value.sessions[sessionId] || 0;
        this.value.sessions[sessionId] = Math.max(currentValue, value);
    }
}

class PeerKnownStates {
    private coValues = new Map<RawCoID, PeerCoValueKnownState>();
    private sent = new Set<RawCoID>();

    constructor() {}

    get(id: RawCoID, createIfMissing: true): PeerCoValueKnownState;
    get(id: RawCoID, createIfMissing?: false): PeerCoValueKnownState | undefined;
    get(id: RawCoID, createIfMissing = false) {
        const entry = this.coValues.get(id);

        if (createIfMissing && !entry) {
            return this.setAsEmpty(id);
        }

        return entry;
    }

    has(id: RawCoID) {
        return this.coValues.has(id);
    }

    set(id: RawCoID, value: CoValueKnownState) {
        const previousEntry = this.get(id);

        if (previousEntry) {
            previousEntry.set(value);
            return previousEntry;
        }

        const knownState = new PeerCoValueKnownState(value);

        this.coValues.set(id, knownState);

        return knownState;
    }

    setAsEmpty(id: RawCoID) {
        return this.set(id, emptyKnownState(id));
    }

    hasBeenSent(id: RawCoID) {
        return this.sent.has(id);
    }

    trackSent(id: RawCoID) {
        this.sent.add(id);
    }
}

export class PeerState {
    constructor(private peer: Peer) {}

    public knownStates = new PeerKnownStates();

    // readonly optimisticKnownStates: { [id: RawCoID]: CoValueKnownState } = {};
    // readonly toldKnownState: Set<RawCoID> = new Set();
    get id() {
        return this.peer.id;
    }

    get role() {
        return this.peer.role;
    }

    get priority() {
        return this.peer.priority;
    }

    get crashOnClose() {
        return this.peer.crashOnClose;
    }

    /**
     * We set as default priority HIGH to handle all the messages without a
     * priority property as HIGH priority.
     *
     * This way we consider all the non-content messsages as HIGH priority.
     */
    private queue = new PriorityBasedMessageQueue(CO_VALUE_PRIORITY.HIGH);
    private processing = false;
    public closed = false;

    async processQueue() {
        if (this.processing) {
            return;
        }

        this.processing = true;


        let entry: QueueEntry | undefined;
        while ((entry = this.queue.pull())) {
            // Awaiting the push to send one message at a time
            // This way when the peer is "under pressure" we can enqueue all
            // the coming messages and organize them by priority
            await this.peer.outgoing
                .push(entry.msg)
                .then(entry.resolve)
                .catch(entry.reject);
        }

        this.processing = false;
    }

    pushOutgoingMessage(msg: SyncMessage) {
        const promise = this.queue.push(msg);

        void this.processQueue();

        return promise;
    }

    get incoming() {
        if (this.closed) {
            return (async function* () {
                yield "Disconnected" as const;
            })();
        }

        return this.peer.incoming;
    }

    gracefulShutdown() {
        console.debug("Gracefully closing", this.id);
        this.peer.outgoing.close();
        this.closed = true;
    }
}
