import { RawCoID } from "./ids.js";
import { CO_VALUE_PRIORITY } from "./priority.js";
import {
    PriorityBasedMessageQueue,
    QueueEntry,
} from "./PriorityBasedMessageQueue.js";
import { CoValueKnownState, Peer, SyncMessage } from "./sync.js";

export class PeerState {
    readonly optimisticKnownStates: { [id: RawCoID]: CoValueKnownState } = {};
    readonly toldKnownState: Set<RawCoID> = new Set();
    readonly id = this.peer.id;
    readonly role = this.peer.role;
    readonly priority = this.peer.priority;
    readonly crashOnClose = this.peer.crashOnClose;

    /**
     * We set as default priority HIGH to handle all the messages without a
     * priority property as HIGH priority.
     *
     * This way we consider all the non-content messsages as HIGH priority.
     */
    private queue = new PriorityBasedMessageQueue(CO_VALUE_PRIORITY.HIGH);
    private processing = false;
    public closed = false;

    constructor(private peer: Peer) {}

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
