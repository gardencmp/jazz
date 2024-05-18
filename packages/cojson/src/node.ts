import { CoValueHeader, Transaction } from "./coValueCore";
import { Hash, Signature, StreamingHash } from "./crypto";
import { RawCoID, SessionID } from "./ids";
import {
    CoValueKnownState,
    KnownStateMessage,
    SyncMessage,
    combinedKnownStates,
} from "./sync";

type SessionLog = {
    transactions: Transaction[];
    lastHash: Hash;
    streamingHash: StreamingHash;
    signatureAfter: { [txIdx: number]: Signature | undefined };
    lastSignature: Signature;
};

type PeerName = Exclude<string, "local">;
type PeerRelationship = "syncAllOurs" | "syncTheirs" | "syncCommon";

export type CoValueState = {
    id: RawCoID;
    header?: CoValueHeader;
    sessions: Map<SessionID, SessionLog>;
    done: boolean;
    sync: Map<
        PeerName,
        {
            toldKnownState: CoValueKnownState | undefined;
            assumedState: CoValueKnownState | "unknown" | "unavailable";
            confirmedState: CoValueKnownState | undefined;
            error: string | undefined;
        }
    >;
};

export type NodeState = {
    peers: Map<
        PeerName,
        {
            name: PeerName;
            relationship: PeerRelationship;
            priority: number;
        }
    >;
    coValues: Map<RawCoID, CoValueState>;
};

// ATOMIC UPDATES

export function unsafeAddVerifiedHeader(
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
    if (state.coValues.has(id)) {
        return { result: "error", reason: "coValueAlreadyExists" };
    }

    if (from !== "local" && !state.peers.has(from)) {
        return { result: "error", reason: "unknownPeer" };
    }

    const entry: CoValueState = {
        id,
        header,
        done: false,
        sessions: new Map(),
        sync: new Map(),
    };

    state.coValues.set(id, entry);

    for (const peerName of state.peers.keys()) {
        entry.sync.set(peerName, {
            assumedState:
                peerName === from
                    ? {
                          id,
                          header: true,
                          sessions: {},
                      }
                    : "unknown",
            confirmedState: undefined,
            toldKnownState: {
                id,
                header: true,
                sessions: {},
            },
            error: undefined,
        });
    }
    return {
        result: "success",
        events: [{ type: "addedNewHeader", id }],
    };
}

export function unsafeAddVerifiedTransactions(
    state: NodeState,
    id: RawCoID,
    sessionID: SessionID,
    after: number,
    transactions: Transaction[],
    signatureAfter: Signature,
    hash: Hash,
    streamingHash: StreamingHash,
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
    const coValue = state.coValues.get(id);
    if (coValue === undefined) {
        return { result: "error", reason: "coValueNotFound" };
    }

    if (from !== "local" && !state.peers.has(from)) {
        return { result: "error", reason: "unknownPeer" };
    }

    const session = coValue.sessions.get(sessionID);
    if (session === undefined) {
        if (after !== 0) {
            return { result: "error", reason: "invalidAfter" };
        }

        coValue.sessions.set(sessionID, {
            transactions: [...transactions],
            lastHash: hash,
            streamingHash,
            signatureAfter: {
                [after + transactions.length - 1]: signatureAfter,
            },
            lastSignature: signatureAfter,
        });
    } else {
        if (after !== session.transactions.length) {
            return { result: "error", reason: "invalidAfter" };
        }

        session.transactions.push(...transactions);
        session.lastHash = hash;
        session.streamingHash = streamingHash;
        session.signatureAfter[after + transactions.length - 1] =
            signatureAfter;
        session.lastSignature = signatureAfter;
    }

    if (from !== "local") {
        const fromState = coValue.sync.get(from)!;
        const knownStateForThisSession = {
            id,
            header: true,
            sessions: {
                [sessionID]:
                    coValue.sessions.get(sessionID)!.transactions.length,
            },
        };
        if (
            fromState.assumedState === "unknown" ||
            fromState.assumedState === "unavailable"
        ) {
            fromState.assumedState = knownStateForThisSession;
        } else {
            fromState.assumedState = combinedKnownStates(
                fromState.assumedState,
                knownStateForThisSession
            );
        }
    }

    return {
        result: "success",
        events: [{ type: "addedNewTransactions", id }],
    };
}

export function markCoValueDone(
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
    coValue.done = true;
    return {
        result: "success",
        events: [{ type: "coValueDone", id }],
    };
}

export function addPeer(
    state: NodeState,
    peer: PeerName,
    relationship: PeerRelationship,
    priority: number
):
    | {
          result: "success";
          events: [{ type: "addedPeer"; peer: PeerName }];
      }
    | {
          result: "error";
          reason: "peerAlreadyExists";
      } {
    if (state.peers.has(peer)) {
        return { result: "error", reason: "peerAlreadyExists" };
    }
    state.peers.set(peer, { name: peer, relationship, priority });

    for (const coValue of state.coValues.values()) {
        coValue.sync.set(peer, {
            assumedState: "unknown",
            confirmedState: undefined,
            toldKnownState: undefined,
            error: undefined,
        });
    }

    return {
        result: "success",
        events: [{ type: "addedPeer", peer }],
    };
}

export function removePeer(
    state: NodeState,
    peer: PeerName
):
    | {
          result: "success";
          events: [{ type: "removedPeer"; peer: PeerName }];
      }
    | {
          result: "error";
          reason: "unknownPeer";
      } {
    if (!state.peers.has(peer)) {
        return { result: "error", reason: "unknownPeer" };
    }
    state.peers.delete(peer);

    for (const coValue of state.coValues.values()) {
        coValue.sync.delete(peer);
    }

    return {
        result: "success",
        events: [{ type: "removedPeer", peer }],
    };
}

export function confirmPeerState(
    state: NodeState,
    peer: PeerName,
    knownState: CoValueKnownState
) {}


export function correctPeerAssumedState(
    state: NodeState,
    peer: PeerName,
    knownState: CoValueKnownState
):
    | {
          result: "success";
          events: [{ type: "syncStateUpdated"; peer: PeerName; id: RawCoID }];
      }
    | {
          result: "error";
          reason: "unknownPeer";
      } {}

function syncToPeer(
    state: NodeState,
    id: RawCoID
):
    | {
          result: "success";
          send: { to: PeerName; messages: SyncMessage[] } | undefined;
      }
    | {
          result: "error";
          reason: "unknownPeer";
      } {}

function loop() {
    const state: NodeState = {
        coValues: new Map(),
        peers: new Map(),
    };

    // trigger on local changes or incoming messages
    while (true) {
        // apply incoming or local changes
        // for each covalue, sync with the highest priority peer that has changes to sync
        // send resulting messages
    }
}
