import { CoValueHeader, Transaction } from "./coValueCore";
import { Hash, Signature, StreamingHash } from "./crypto";
import { RawCoID, SessionID } from "./ids";
import { CoValueKnownState, KnownStateMessage, SyncMessage } from "./sync";

type SessionLog = {
    transactions: Transaction[];
    lastHash?: Hash;
    streamingHash: StreamingHash;
    signatureAfter: { [txIdx: number]: Signature | undefined };
    lastSignature: Signature;
};

type PeerName = string;
type PeerRelationship = "syncAllOurs" | "syncTheirs" | "syncCommon";

type NodeState = {
    peers: Map<
        PeerName,
        {
            name: PeerName;
            relationship: PeerRelationship;
            priority: number;
        }
    >;
    coValues: Map<
        RawCoID,
        {
            id: RawCoID;
            header?: CoValueHeader;
            sessions: Map<SessionID, SessionLog>;
            sync: Map<
                PeerName,
                {
                    toldKnownState: CoValueKnownState | undefined;
                    assumedState: CoValueKnownState | "unknown" | "unavailable";
                    confirmedState: CoValueKnownState | undefined;
                    error: string | undefined;
                    msgsToSend: SyncMessage[];
                }
            >;
        }
    >;
};

// ATOMIC UPDATES

function unsafeAddVerifiedHeader(
    state: NodeState,
    id: RawCoID,
    header: CoValueHeader,
    from: PeerName | "local"
):
    | {
          result: "success";
          events: [{ type: "addedNewHeader"; id: RawCoID }];
      }
    | { result: "error"; reason: "coValueAlreadyExists" | "unknownPeer" } {

}

function unsafeAddVerifiedTransactions(
    state: NodeState,
    id: RawCoID,
    sessionID: SessionID,
    after: number,
    transactions: Transaction[],
    signatureAfter: Signature,
    from: PeerName | "local"
):
    | {
          result: "success";
          events: [{ type: "addedNewTransactions"; id: RawCoID }];
      }
    | {
          result: "error";
          reason: "coValueNotFound" | "invalidAfter" | "unknownPeer";
      } {

}

function markCoValueDone(
    state: NodeState,
    id: RawCoID
):
    | {
          result: "success";
          events: [{ type: "coValueDone"; id: RawCoID }];
      }
    | { result: "error"; reason: "coValueNotFound" } {
    const coValue = state.coValues.get(id);
    if (coValue === undefined) {
        return { result: "error", reason: "coValueNotFound" };
    }
    state.coValues.delete(id);
}

function addPeer(
    state: NodeState,
    peer: PeerName,
    relationship: PeerRelationship,
    priority: number
): {
    result: "success";
    events: [{ type: "addedPeer"; peer: PeerName }];
} {

}

function popPeerMessage(
    state: NodeState,
    peer: PeerName
): {
    result: "success";
    message: SyncMessage | undefined;
} | {
    result: "error";
    reason: "unknownPeer" | "noMessages";
} {

}

function correctPeerAssumedState(
    state: NodeState,
    peer: PeerName,
    knownState: CoValueKnownState
): {
    result: "success";
    events: [{ type: "syncStateUpdated"; peer: PeerName; id: RawCoID }];
} | {
    result: "error";
    reason: "unknownPeer";
} {

}

function confirmPeerState(state: NodeState, peer: PeerName, knownState: CoValueKnownState) {

}

function removePeer(
    state: NodeState,
    peer: PeerName
): {
    result: "success";
    events: [{ type: "removedPeer"; peer: PeerName }];
} | {
    result: "error";
    reason: "unknownPeer";
} {

}