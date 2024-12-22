import { Peer, PeerEntry, PeerID } from "./PeerEntry.js";

export class Peers {
  private readonly peers: { [key: PeerID]: PeerEntry } = {};

  add(peerData: Peer) {
    const prevPeer = this.peers[peerData.id];
    const peer = new PeerEntry(peerData);
    this.peers[peerData.id] = peer;

    if (prevPeer && !prevPeer.closed) {
      prevPeer.gracefulShutdown();
    }

    return peer;
  }

  get(id: PeerID): PeerEntry | void {
    if (this.peers[id]) {
      return this.peers[id];
    }
  }

  getAll() {
    return Object.values(this.peers);
  }

  delete(id: PeerID) {
    if (this.peers[id]) {
      delete this.peers[id];
    }
  }

  getInPriorityOrder({
    excludedId,
  }: { excludedId?: PeerID } = {}): PeerEntry[] {
    return Object.values(this.peers)
      .sort((a, b) => {
        const aPriority = a.priority || 0;
        const bPriority = b.priority || 0;

        return bPriority - aPriority;
      })
      .filter((peer) => (excludedId ? peer.id !== excludedId : true));
  }

  getServerAndStorage({
    excludedId,
    includedId,
  }: { excludedId?: PeerID; includedId?: PeerID } = {}): PeerEntry[] {
    return this.getInPriorityOrder({ excludedId }).filter(
      (peer) =>
        peer.isServerOrStoragePeer() ||
        (includedId ? peer.id === includedId : false),
    );
  }

  // peersInPriorityOrder(): PeerEntry[] {
  //   return Object.values(this.peers).sort((a, b) => {
  //     const aPriority = a.priority || 0;
  //     const bPriority = b.priority || 0;
  //
  //     return bPriority - aPriority;
  //   });
  // }

  // getServerAndStoragePeers(excludePeerId?: PeerID): PeerEntry[] {
  //   return this.getInPriorityOrder().filter(
  //     (peer) => peer.isServerOrStoragePeer() && peer.id !== excludePeerId,
  //   );
  // }
}
