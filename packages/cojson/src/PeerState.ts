import { RawCoID } from "./ids.js";
import { PriorityBasedMessageQueue } from "./PriorityBasedMessageQueue.js";
import { CoValueKnownState, Peer, SyncMessage } from "./sync.js";

export class PeerState {
    readonly optimisticKnownStates: { [id: RawCoID]: CoValueKnownState } = {};
    readonly toldKnownState: Set<RawCoID> = new Set();
    readonly id = this.peer.id;
    readonly role = this.peer.role;
    readonly priority = this.peer.priority;
    readonly crashOnClose = this.peer.crashOnClose;

    private queue = new PriorityBasedMessageQueue();

    closed = false;

    constructor(private peer: Peer) {}

    private processing = false;

    async processQueue() {
        if (this.processing) {
            return;
        }

        this.processing = true;

        while (this.queue.isNonEmpty()) {
            const entry = this.queue.pull();

            console.debug("Processing message", entry?.msg, this.queue, this.peer);

            if (entry) {
                await this.peer.outgoing
                    .push(entry.msg)
                    .then(entry.resolve)
                    .catch(entry.reject);
            }
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
