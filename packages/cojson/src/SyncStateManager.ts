import { RawCoID } from "./ids.js";
import {
  CoValueKnownState,
  PeerID,
  SyncManager,
  emptyKnownState,
} from "./sync.js";

export type SyncState = {
  uploaded: boolean;
};

export type GlobalSyncStateListenerCallback = (
  peerId: PeerID,
  knownState: CoValueKnownState,
  sync: SyncState,
) => void;

export type PeerSyncStateListenerCallback = (
  knownState: CoValueKnownState,
  sync: SyncState,
) => void;

export class SyncStateManager {
  constructor(private syncManager: SyncManager) {}

  private listeners = new Set<GlobalSyncStateListenerCallback>();
  private listenersByPeers = new Map<
    PeerID,
    Set<PeerSyncStateListenerCallback>
  >();

  subscribeToUpdates(listener: GlobalSyncStateListenerCallback) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeToPeerUpdates(
    peerId: PeerID,
    listener: PeerSyncStateListenerCallback,
  ) {
    const listeners = this.listenersByPeers.get(peerId) ?? new Set();

    if (listeners.size === 0) {
      this.listenersByPeers.set(peerId, listeners);
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  getCurrentSyncState(peerId: PeerID, id: RawCoID) {
    // Build a lazy sync state object to process the isUploaded info
    // only when requested
    const syncState = {} as SyncState;

    const getIsUploaded = () =>
      this.getIsCoValueFullyUploadedIntoPeer(peerId, id);

    Object.defineProperties(syncState, {
      uploaded: {
        enumerable: true,
        get: getIsUploaded,
      },
    });

    return syncState;
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
    const syncState = this.getCurrentSyncState(peerId, id);

    for (const listener of this.listeners) {
      listener(peerId, knownState, syncState);
    }

    if (!peerListeners) return;

    for (const listener of peerListeners) {
      listener(knownState, syncState);
    }
  }

  private getKnownStateSessions(peerId: PeerID, id: RawCoID) {
    const peer = this.syncManager.peers[peerId];

    if (!peer) {
      return undefined;
    }

    const peerSessions = peer.knownStates.get(id)?.sessions;

    if (!peerSessions) {
      return undefined;
    }

    const entry = this.syncManager.local.coValuesStore.get(id);

    if (entry.state.type !== "available") {
      return undefined;
    }

    const coValue = entry.state.coValue;
    const coValueSessions = coValue.knownState().sessions;

    return {
      peer: peerSessions,
      coValue: coValueSessions,
    };
  }

  private getIsCoValueFullyUploadedIntoPeer(peerId: PeerID, id: RawCoID) {
    const sessions = this.getKnownStateSessions(peerId, id);

    if (!sessions) {
      return false;
    }

    return getIsUploaded(sessions.coValue, sessions.peer);
  }
}

function getIsUploaded(
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
