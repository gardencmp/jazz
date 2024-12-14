import { RawCoID } from "./ids.js";
import {
  CoValueKnownState,
  PeerID,
  SyncManager,
  emptyKnownState,
} from "./sync.js";

export type SyncStateGetter = {
  isUploaded: boolean;
};

export type GlobalSyncStateListenerCallback = (
  peerId: PeerID,
  knownState: CoValueKnownState,
  sync: SyncStateGetter,
) => void;

export type PeerSyncStateListenerCallback = (
  knownState: CoValueKnownState,
  sync: SyncStateGetter,
) => void;

export class SyncStateSubscriptionManager {
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

  // triggerUpdate(peerId: PeerID, id: RawCoID) {
  //   const peer = this.syncManager.peers[peerId];
  //
  //   if (!peer) {
  //     return;
  //   }
  //
  //   const peerListeners = this.listenersByPeers.get(peer.id);
  //
  //   // If we don't have any active listeners do nothing
  //   if (!peerListeners?.size && !this.listeners.size) {
  //     return;
  //   }
  //
  //   const knownState = peer.knownStates.get(id) ?? emptyKnownState(id);
  //
  //   // Build a lazy sync state object to process the isUploaded info
  //   // only when requested
  //   const syncState = {} as SyncStateGetter;
  //
  //   const getIsUploaded = simpleMemoize(() =>
  //     this.getIsCoValueFullyUploadedIntoPeer(peerId, id),
  //   );
  //   Object.defineProperties(syncState, {
  //     isUploaded: {
  //       enumerable: true,
  //       get: getIsUploaded,
  //     },
  //   });
  //
  //   for (const listener of this.listeners) {
  //     listener(peerId, knownState, syncState);
  //   }
  //
  //   if (!peerListeners) return;
  //
  //   for (const listener of peerListeners) {
  //     listener(knownState, syncState);
  //   }
  // }

  // getIsCoValueFullyUploadedIntoPeer(peerId: PeerID, id: RawCoID) {
  //   const peer = this.syncManager.peers[peerId];
  //   const entry = this.syncManager.local.coValuesStore.get(id);
  //
  //   if (!peer) {
  //     return false;
  //   }
  //
  //   if (entry.state.type !== "available") {
  //     return false;
  //   }
  //
  //   const coValue = entry.state.coValue;
  //   const knownState = peer.knownStates.get(id);
  //
  //   if (!knownState) {
  //     return false;
  //   }
  //
  //   return getIsUploadCompleted(
  //     coValue.knownState().sessions,
  //     knownState.sessions,
  //   );
  // }
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

function simpleMemoize<T>(fn: () => T): () => T {
  let value: T | undefined;
  return () => value ?? (value = fn());
}
