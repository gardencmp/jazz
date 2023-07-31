import { Hash } from "./crypto";
import { MultiLogHeader, MultiLogID, SessionID, Transaction } from "./multilog";

type MultiLogKnownState = {
    multilogID: MultiLogID;
    header: boolean;
    sessions: { [sessionID: SessionID]: number };
};

export type SyncMessage =
    | SubscribeMessage
    | NewContentMessage
    | WrongAssumedKnownStateMessage
    | UnsubscribeMessage;

export type SubscribeMessage = {
    type: "subscribe";
    knownState: MultiLogKnownState;
};

export type NewContentMessage = {
    type: "newContent";
    multilogID: MultiLogID;
    header?: MultiLogHeader;
    newContent: {
        [sessionID: SessionID]: SessionNewContent;
    };
};

export type SessionNewContent = {
    after: number;
    newTransactions: Transaction[];
    lastHash: Hash;
    lastSignature: string;
}

export type WrongAssumedKnownStateMessage = {
    type: "wrongAssumedKnownState";
    knownState: MultiLogKnownState;
};

export type UnsubscribeMessage = {
    type: "unsubscribe";
    multilogID: MultiLogID;
};

export type PeerID = string;

export interface Peer {
    id: PeerID;
    incoming: ReadableStream<SyncMessage>;
    outgoing: WritableStream<SyncMessage>;
    optimisticKnownStates: {[multilogID: MultiLogID]: MultiLogKnownState};
}

