import { PeerEntry } from "./PeerEntry.js";
import { CoValueCore } from "./coValueCore.js";
import { RawCoID } from "./ids.js";
import { CoValueKnownState, SyncMessage, emptyDataMessage } from "./sync.js";

export class PeerOperations {
  constructor(private readonly peer: PeerEntry) {}

  async pull({ knownState }: { knownState: CoValueKnownState }) {
    if (this.peer.closed) return;

    return this.peer.pushOutgoingMessage({
      ...knownState,
      action: "pull",
    });
  }

  async ack({ knownState }: { knownState: CoValueKnownState }) {
    if (this.peer.closed) return;

    return this.peer.pushOutgoingMessage({
      ...knownState,
      action: "ack",
    });
  }

  async push({
    peerKnownState,
    coValue,
  }: { peerKnownState: CoValueKnownState; coValue: CoValueCore }) {
    if (this.peer.closed) return;

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
    if (this.peer.closed) return;

    // Send new content pieces (possibly, in chunks) created after peerKnownState that passed in
    return this.sendContentIncludingDependencies({
      peerKnownState,
      coValue,
      action: "data",
    }).then((newContentPiecesNumber) => {
      // We send an empty data message
      // if number of new content pieces is 0
      if (!newContentPiecesNumber) {
        void this.emptyData(coValue.id);
      }
    });
  }

  async emptyData(id: RawCoID) {
    return this.peer.pushOutgoingMessage(emptyDataMessage(id));
  }

  private async sendContentIncludingDependencies({
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
