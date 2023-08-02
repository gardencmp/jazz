import { Hash, Signature } from "./crypto";
import { CoValueHeader, RawCoValueID, SessionID, Transaction } from "./coValue";

export type CoValueKnownState = {
    coValueID: RawCoValueID;
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
    knownState: CoValueKnownState;
};

export type SubscribeResponseMessage = {
    action: "subscribeResponse";
    knownState: CoValueKnownState;
    asDependencyOf?: RawCoValueID;
};

export type NewContentMessage = {
    action: "newContent";
    coValueID: RawCoValueID;
    header?: CoValueHeader;
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
    knownState: CoValueKnownState;
};

export type UnsubscribeMessage = {
    action: "unsubscribe";
    coValueID: RawCoValueID;
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
    optimisticKnownStates: { [coValueID: RawCoValueID]: CoValueKnownState };
    incoming: ReadableStream<SyncMessage>;
    outgoing: WritableStreamDefaultWriter<SyncMessage>;
    role: "peer" | "server" | "client";
}

export function weAreStrictlyAhead(
    ourKnownState: CoValueKnownState,
    theirKnownState: CoValueKnownState
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

export function combinedKnownStates(stateA: CoValueKnownState, stateB: CoValueKnownState): CoValueKnownState {
    const sessionStates: CoValueKnownState["sessions"] = {};

    const allSessions = new Set([...Object.keys(stateA.sessions), ...Object.keys(stateB.sessions)] as SessionID[]);

    for (const sessionID of allSessions) {
        const stateAValue = stateA.sessions[sessionID];
        const stateBValue = stateB.sessions[sessionID];

        sessionStates[sessionID] = Math.max(stateAValue || 0, stateBValue || 0);
    }

    return {
        coValueID: stateA.coValueID,
        header: stateA.header || stateB.header,
        sessions: sessionStates,
    };
}