import { CoValueCore } from "./coValueCore.js";
import { PeerID } from "./sync.js";

function createResolvablePromise<T>() {
    let resolve!: (value: T) => void;

    const promise = new Promise<T>((res) => {
        resolve = res;
    });

    return { promise, resolve };
}

class CoValueUnknownState {
    type = "unknown" as const;
    private peers: Map<PeerID, ReturnType<typeof createResolvablePromise<"available" | "unavailable">>>;
    private resolve: (value: "available" | "unavailable") => void;

    ready: Promise<"available" | "unavailable">;

    constructor(peersIds: Iterable<PeerID>) {
        this.peers = new Map();

        for (const peerId of peersIds) {
            this.peers.set(peerId, createResolvablePromise<"available" | "unavailable">());
        }

        const { resolve, promise } = createResolvablePromise<"available" | "unavailable">();

        this.ready = promise;
        this.resolve = resolve;
    }

    update(peerId: PeerID, value: "available" | "unavailable") {
        const entry = this.peers.get(peerId);

        if (entry) {
            entry.resolve(value);
        }

        if (value === "available") {
            this.resolve("available");
            return;
        }

        this.peers.delete(peerId);

        // If none of the peers have the coValue, we resolve to unavailable
        if (this.peers.size === 0) {
            this.resolve("unavailable");
        }
    }

    // Wait for a specific peer to have a known state
    waitForPeer(peerId: PeerID) {
        const entry = this.peers.get(peerId);

        if (!entry) {
            return Promise.resolve();
        }

        return entry.promise;
    }
}

class CoValueAvailableState {
    type = "available" as const;

    constructor(public coValue: CoValueCore) { }
}

type CoValueStateAction = {
    type: "not-found";
    peerId: PeerID;
} | {
    type: "found";
    peerId: PeerID;
    coValue: CoValueCore;
};

export class CoValueState {
    constructor(public state: CoValueUnknownState | CoValueAvailableState) { }

    static Unknown(peersToWaitFor: Set<PeerID>) {
        return new CoValueState(new CoValueUnknownState(peersToWaitFor));
    }

    static Available(coValue: CoValueCore) {
        return new CoValueState(new CoValueAvailableState(coValue));
    }

    dispatch(action: CoValueStateAction) {
        if (this.state.type === "available") {
            return;
        }

        switch (action.type) {
            case "not-found":
                this.state.update(action.peerId, "unavailable");
                break;
            case "found":
                this.state.update(action.peerId, "available");
                this.state = new CoValueAvailableState(action.coValue);
                break;
        }
    }
}
