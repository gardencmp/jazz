import { RawCoID } from "./ids.js";
import {
    SyncManager,
    PeerID,
    CoValueKnownState,
    emptyKnownState,
} from "./sync.js";

export class SyncStateSubscriptionManager {
    constructor(private syncManager: SyncManager) {}

    private listeners = new Set<
        (
            peerId: PeerID,
            knownState: CoValueKnownState,
            uploadCompleted: boolean,
        ) => void
    >();

    private listenersByPeers = new Map<
        PeerID,
        Set<(knownState: CoValueKnownState, uploadCompleted: boolean) => void>
    >();

    subscribeToUpdates(
        listener: (
            peerId: PeerID,
            knownState: CoValueKnownState,
            uploadCompleted: boolean,
        ) => void,
    ) {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    subscribeToPeerUpdates(
        peerId: PeerID,
        listener: (
            knownState: CoValueKnownState,
            uploadCompleted: boolean,
        ) => void,
    ) {
        let listeners = this.listenersByPeers.get(peerId);

        if (!listeners) {
            listeners = new Set();
            this.listenersByPeers.set(peerId, listeners);
        }

        listeners.add(listener);

        return () => {
            listeners.delete(listener);
        };
    }

    triggerUpdate(peerId: PeerID, id: RawCoID) {
        const peer = this.syncManager.peers[peerId];

        if (!peer) {
            return;
        }

        const peerListeners = this.listenersByPeers.get(peer.id);

        // If we don't have any active listeners do nothing
        if (!peerListeners?.size && !this.listeners.size) {
            return;
        }

        const knownState = peer.knownStates.get(id) ?? emptyKnownState(id);
        const fullyUploadedIntoPeer = this.getIsCoValueFullyUploadedIntoPeer(
            peerId,
            id,
        );

        for (const listener of this.listeners) {
            listener(peerId, knownState, fullyUploadedIntoPeer);
        }

        if (!peerListeners) return;

        for (const listener of peerListeners) {
            listener(knownState, fullyUploadedIntoPeer);
        }
    }

    getIsCoValueFullyUploadedIntoPeer(peerId: PeerID, id: RawCoID) {
        const peer = this.syncManager.peers[peerId];
        const entry = this.syncManager.local.coValues[id];

        if (!peer || !entry) {
            return false;
        }

        if (entry.state.type !== "available") {
            return false;
        }

        const coValue = entry.state.coValue;
        const knownState = peer.knownStates.get(id);

        if (!knownState) {
            return false;
        }

        return getIsUploadCompleted(
            coValue.knownState().sessions,
            knownState.sessions,
        );
    }
}

function getIsUploadCompleted(
    from: Record<string, number>,
    to: Record<string, number>,
) {
    for (const sessionId of Object.keys(from)) {
        if (from[sessionId] !== to[sessionId]) {
            return false;
        }
    }

    return true;
}
