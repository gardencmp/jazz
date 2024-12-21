import { PeerEntry } from "./PeerEntry.js";
import { CoValueCore } from "./coValueCore.js";
import { RawCoID } from "./ids.js";
import { PeerID } from "./localNode.js";
import { CoValueKnownState, SyncMessage, emptyDataMessage } from "./sync.js";

export class PeerOperations {
  constructor(private readonly peer: PeerEntry) {}

  async pull({ coValue }: { coValue: CoValueCore }) {
    return this.peer.pushOutgoingMessage({
      ...coValue.knownState(),
      action: "pull",
    });
  }

  async ack({ coValue }: { coValue: CoValueCore }) {
    return this.peer.pushOutgoingMessage({
      ...coValue.knownState(),
      action: "ack",
    });
  }

  async push({
    peerKnownState,
    coValue,
  }: { peerKnownState: CoValueKnownState; coValue: CoValueCore }) {
    return this.sendContentIncludingDependencies({
      peerKnownState,
      coValue,
      action: "push",
    });
  }

  async data({
    peerKnownState,
    coValue,
  }: { peerKnownState: CoValueKnownState; coValue: CoValueCore }) {
    return this.sendContentIncludingDependencies({
      peerKnownState,
      coValue,
      action: "data",
    });
  }

  async emptyData(id: RawCoID) {
    return this.peer.pushOutgoingMessage(emptyDataMessage(id));
  }

  async sendContentIncludingDependencies({
    peerKnownState,
    coValue,
    action,
  }: {
    peerKnownState: CoValueKnownState;
    coValue: CoValueCore;
    action: "push" | "data";
  }): Promise<number> {
    // TODO probably, dependencies don't provide any new data? Do we really need it within the new algorythm
    // await Promise.all(
    //   coValue
    //     .getDependedOnCoValues()
    //     .map((id) => this.sendNewContentIncludingDependencies(id, peer)),
    // );

    const newContentPieces = coValue.newContentSince(peerKnownState);

    if (newContentPieces) {
      for (const [_i, piece] of newContentPieces.entries()) {
        void this.peer.pushOutgoingMessage({ ...piece, action } as SyncMessage);
      }
    }

    return newContentPieces?.length || 0;
  }
}
