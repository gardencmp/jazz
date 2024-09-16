import { RawCoID } from "./ids.js";
import { CoValueKnownState, Peer, SyncMessage } from "./sync.js";

export class PeerState {
    readonly optimisticKnownStates: { [id: RawCoID]: CoValueKnownState } = {};
    readonly toldKnownState: Set<RawCoID> = new Set();
    readonly id = this.peer.id;
    readonly role = this.peer.role;
    readonly priority = this.peer.priority;
    readonly crashOnClose = this.peer.crashOnClose;

    closed = false;

    constructor(private peer: Peer) {}

    pushOutgoingMessage(msg: SyncMessage) {
        return this.peer.outgoing.push(msg);
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
