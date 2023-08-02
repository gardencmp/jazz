import { Hash, Signature } from "./crypto";
import { MultiLogHeader, MultiLogID, SessionID, Transaction } from "./multilog";

export type MultiLogKnownState = {
    multilogID: MultiLogID;
    header: boolean;
    sessions: { [sessionID: SessionID]: number };
};

export type SyncMessage =
    | SubscribeMessage
    | SubscribeResponseMessage
    | NewContentMessage
    | WrongAssumedKnownStateMessage
    | UnsubscribeMessage;

export type SubscribeMessage = {
    action: "subscribe";
    knownState: MultiLogKnownState;
};

export type SubscribeResponseMessage = {
    action: "subscribeResponse";
    knownState: MultiLogKnownState;
    asDependencyOf?: MultiLogID;
};

export type NewContentMessage = {
    action: "newContent";
    multilogID: MultiLogID;
    header?: MultiLogHeader;
    newContent: {
        [sessionID: SessionID]: SessionNewContent;
    };
};

export type SessionNewContent = {
    after: number;
    newTransactions: Transaction[];
    // TODO: is lastHash needed here?
    lastHash: Hash;
    lastSignature: Signature;
};

export type WrongAssumedKnownStateMessage = {
    action: "wrongAssumedKnownState";
    knownState: MultiLogKnownState;
};

export type UnsubscribeMessage = {
    action: "unsubscribe";
    multilogID: MultiLogID;
};

export type PeerID = string;

export interface Peer {
    id: PeerID;
    incoming: ReadableStream<SyncMessage>;
    outgoing: WritableStream<SyncMessage>;
    role: "peer" | "server" | "client";
}

export interface PeerState {
    id: PeerID;
    optimisticKnownStates: { [multilogID: MultiLogID]: MultiLogKnownState };
    incoming: ReadableStream<SyncMessage>;
    outgoing: WritableStreamDefaultWriter<SyncMessage>;
    role: "peer" | "server" | "client";
}

export function weAreStrictlyAhead(
    ourKnownState: MultiLogKnownState,
    theirKnownState: MultiLogKnownState
): boolean {
    if (theirKnownState.header && !ourKnownState.header) {
        return false;
    }

    const allSessions = new Set([
        ...(Object.keys(ourKnownState.sessions) as SessionID[]),
        ...(Object.keys(theirKnownState.sessions) as SessionID[]),
    ]);

    for (const sessionID of allSessions) {
        const ourSession = ourKnownState.sessions[sessionID];
        const theirSession = theirKnownState.sessions[sessionID];

        if ((ourSession || 0) < (theirSession || 0)) {
            return false;
        }
    }

    return true;
}

export function combinedKnownStates(stateA: MultiLogKnownState, stateB: MultiLogKnownState): MultiLogKnownState {
    const sessionStates: MultiLogKnownState["sessions"] = {};

    const allSessions = new Set([...Object.keys(stateA.sessions), ...Object.keys(stateB.sessions)] as SessionID[]);

    for (const sessionID of allSessions) {
        const stateAValue = stateA.sessions[sessionID];
        const stateBValue = stateB.sessions[sessionID];

        sessionStates[sessionID] = Math.max(stateAValue || 0, stateBValue || 0);
    }

    return {
        multilogID: stateA.multilogID,
        header: stateA.header || stateB.header,
        sessions: sessionStates,
    };
}