import { Hash, Signature } from "./crypto";
import { CoValueHeader, Transaction } from "./coValue";
import { CoValue } from "./coValue";
import { LocalNode } from "./node";
import { newLoadingState } from "./node";
import { ReadableStream, WritableStream, WritableStreamDefaultWriter } from "isomorphic-streams";
import { RawCoValueID, SessionID } from "./ids";

export type CoValueKnownState = {
    coValueID: RawCoValueID;
    header: boolean;
    sessions: { [sessionID: SessionID]: number };
};

export function emptyKnownState(coValueID: RawCoValueID): CoValueKnownState {
    return {
        coValueID,
        header: false,
        sessions: {},
    };
}

export type SyncMessage =
    | SubscribeMessage
    | TellKnownStateMessage
    | NewContentMessage
    | WrongAssumedKnownStateMessage
    | UnsubscribeMessage;

export type SubscribeMessage = {
    action: "subscribe";
} & CoValueKnownState;

export type TellKnownStateMessage = {
    action: "tellKnownState";
    asDependencyOf?: RawCoValueID;
} & CoValueKnownState;

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
} & CoValueKnownState;

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
    toldKnownState: Set<RawCoValueID>;
    incoming: ReadableStream<SyncMessage>;
    outgoing: WritableStreamDefaultWriter<SyncMessage>;
    role: "peer" | "server" | "client";
}

export function combinedKnownStates(
    stateA: CoValueKnownState,
    stateB: CoValueKnownState
): CoValueKnownState {
    const sessionStates: CoValueKnownState["sessions"] = {};

    const allSessions = new Set([
        ...Object.keys(stateA.sessions),
        ...Object.keys(stateB.sessions),
    ] as SessionID[]);

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

export class SyncManager {
    peers: { [key: PeerID]: PeerState } = {};
    local: LocalNode;

    constructor(local: LocalNode) {
        this.local = local;
    }

    loadFromPeers(id: RawCoValueID) {
        for (const peer of Object.values(this.peers)) {
            peer.outgoing
                .write({
                    action: "subscribe",
                    coValueID: id,
                    header: false,
                    sessions: {},
                })
                .catch((e) => {
                    console.error("Error writing to peer", e);
                });
        }
    }

    async handleSyncMessage(msg: SyncMessage, peer: PeerState) {
        // TODO: validate
        switch (msg.action) {
            case "subscribe":
                return await this.handleSubscribe(msg, peer);
            case "tellKnownState":
                return await this.handleTellKnownState(msg, peer);
            case "newContent":
                return await this.handleNewContent(msg, peer);
            case "wrongAssumedKnownState":
                return await this.handleWrongAssumedKnownState(msg, peer);
            case "unsubscribe":
                return await this.handleUnsubscribe(msg);
            default:
                throw new Error(
                    `Unknown message type ${
                        (msg as { action: "string" }).action
                    }`
                );
        }
    }

    async subscribeToIncludingDependencies(
        coValueID: RawCoValueID,
        peer: PeerState
    ) {
        const coValue = this.local.expectCoValueLoaded(coValueID);

        for (const coValueID of coValue.getDependedOnCoValues()) {
            await this.subscribeToIncludingDependencies(coValueID, peer);
        }

        if (!peer.toldKnownState.has(coValueID)) {
            peer.toldKnownState.add(coValueID);
            await peer.outgoing.write({
                action: "subscribe",
                ...coValue.knownState(),
            });
        }
    }

    async tellUntoldKnownStateIncludingDependencies(
        coValueID: RawCoValueID,
        peer: PeerState,
        asDependencyOf?: RawCoValueID
    ) {
        const coValue = this.local.expectCoValueLoaded(coValueID);

        for (const dependentCoValueID of coValue.getDependedOnCoValues()) {
            await this.tellUntoldKnownStateIncludingDependencies(
                dependentCoValueID,
                peer,
                asDependencyOf || coValueID
            );
        }

        if (!peer.toldKnownState.has(coValueID)) {
            await peer.outgoing.write({
                action: "tellKnownState",
                asDependencyOf,
                ...coValue.knownState(),
            });

            peer.toldKnownState.add(coValueID);
        }
    }

    async sendNewContentIncludingDependencies(
        coValueID: RawCoValueID,
        peer: PeerState
    ) {
        const coValue = this.local.expectCoValueLoaded(coValueID);

        for (const coValueID of coValue.getDependedOnCoValues()) {
            await this.sendNewContentIncludingDependencies(coValueID, peer);
        }

        const newContent = coValue.newContentSince(
            peer.optimisticKnownStates[coValueID]
        );

        if (newContent) {
            await peer.outgoing.write(newContent);
            peer.optimisticKnownStates[coValueID] = combinedKnownStates(
                peer.optimisticKnownStates[coValueID] ||
                    emptyKnownState(coValueID),
                coValue.knownState()
            );
        }
    }

    addPeer(peer: Peer) {
        const peerState: PeerState = {
            id: peer.id,
            optimisticKnownStates: {},
            incoming: peer.incoming,
            outgoing: peer.outgoing.getWriter(),
            toldKnownState: new Set(),
            role: peer.role,
        };
        this.peers[peer.id] = peerState;

        if (peer.role === "server") {
            const initialSync = async () => {
                for (const entry of Object.values(this.local.coValues)) {
                    if (entry.state === "loading") {
                        continue;
                    }

                    await this.subscribeToIncludingDependencies(
                        entry.coValue.id,
                        peerState
                    );

                    peerState.optimisticKnownStates[entry.coValue.id] = {
                        coValueID: entry.coValue.id,
                        header: false,
                        sessions: {},
                    };
                }
            };
            void initialSync();
        }

        const readIncoming = async () => {
            for await (const msg of peerState.incoming) {
                try {
                    await this.handleSyncMessage(msg, peerState);
                } catch (e) {
                    console.error(
                        `Error reading from peer ${peer.id}`,
                        JSON.stringify(msg),
                        e
                    );
                }
            }
        };

        void readIncoming();
    }

    async handleSubscribe(msg: SubscribeMessage, peer: PeerState) {
        const entry = this.local.coValues[msg.coValueID];

        if (!entry || entry.state === "loading") {
            if (!entry) {
                this.local.coValues[msg.coValueID] = newLoadingState();
            }

            peer.optimisticKnownStates[msg.coValueID] = knownStateIn(msg);
            peer.toldKnownState.add(msg.coValueID);

            await peer.outgoing.write({
                action: "tellKnownState",
                coValueID: msg.coValueID,
                header: false,
                sessions: {},
            });

            return;
        }

        peer.optimisticKnownStates[msg.coValueID] = knownStateIn(msg);

        await this.tellUntoldKnownStateIncludingDependencies(
            msg.coValueID,
            peer
        );

        await this.sendNewContentIncludingDependencies(msg.coValueID, peer);
    }

    async handleTellKnownState(msg: TellKnownStateMessage, peer: PeerState) {
        let entry = this.local.coValues[msg.coValueID];

        peer.optimisticKnownStates[msg.coValueID] = combinedKnownStates(
            peer.optimisticKnownStates[msg.coValueID] || emptyKnownState(msg.coValueID),
            knownStateIn(msg)
        );

        if (!entry) {
            if (msg.asDependencyOf) {
                if (this.local.coValues[msg.asDependencyOf]) {
                    entry = newLoadingState();

                    this.local.coValues[msg.coValueID] = entry;
                } else {
                    throw new Error(
                        "Expected coValue dependency entry to be created, missing subscribe?"
                    );
                }
            } else {
                throw new Error(
                    "Expected coValue entry to be created, missing subscribe?"
                );
            }
        }

        if (entry.state === "loading") {
            return [];
        }

        await this.tellUntoldKnownStateIncludingDependencies(
            msg.coValueID,
            peer
        );
        await this.sendNewContentIncludingDependencies(msg.coValueID, peer);
    }

    async handleNewContent(msg: NewContentMessage, peer: PeerState) {
        let entry = this.local.coValues[msg.coValueID];

        if (!entry) {
            throw new Error(
                "Expected coValue entry to be created, missing subscribe?"
            );
        }

        let resolveAfterDone: ((coValue: CoValue) => void) | undefined;

        const peerOptimisticKnownState =
            peer.optimisticKnownStates[msg.coValueID];

        if (!peerOptimisticKnownState) {
            throw new Error(
                "Expected optimisticKnownState to be set for coValue we receive new content for"
            );
        }

        if (entry.state === "loading") {
            if (!msg.header) {
                throw new Error("Expected header to be sent in first message");
            }

            peerOptimisticKnownState.header = true;

            const coValue = new CoValue(msg.header, this.local);

            resolveAfterDone = entry.resolve;

            entry = {
                state: "loaded",
                coValue: coValue,
            };

            this.local.coValues[msg.coValueID] = entry;
        }

        const coValue = entry.coValue;

        let invalidStateAssumed = false;

        for (const [sessionID, newContentForSession] of Object.entries(
            msg.newContent
        ) as [SessionID, SessionNewContent][]) {
            const ourKnownTxIdx =
                coValue.sessions[sessionID]?.transactions.length;
            const theirFirstNewTxIdx = newContentForSession.after;

            if ((ourKnownTxIdx || 0) < theirFirstNewTxIdx) {
                invalidStateAssumed = true;
                continue;
            }

            const alreadyKnownOffset = ourKnownTxIdx
                ? ourKnownTxIdx - theirFirstNewTxIdx
                : 0;

            const newTransactions =
                newContentForSession.newTransactions.slice(alreadyKnownOffset);

            const success = coValue.tryAddTransactions(
                sessionID,
                newTransactions,
                newContentForSession.lastHash,
                newContentForSession.lastSignature
            );

            if (!success) {
                console.error("Failed to add transactions", newTransactions);
                continue;
            }

            peerOptimisticKnownState.sessions[sessionID] =
                newContentForSession.after +
                newContentForSession.newTransactions.length;
        }

        if (resolveAfterDone) {
            resolveAfterDone(coValue);
        }

        await this.syncCoValue(coValue);

        if (invalidStateAssumed) {
            await peer.outgoing.write({
                action: "wrongAssumedKnownState",
                ...coValue.knownState(),
            });
        }
    }

    async handleWrongAssumedKnownState(
        msg: WrongAssumedKnownStateMessage,
        peer: PeerState
    ) {
        const coValue = this.local.expectCoValueLoaded(msg.coValueID);

        peer.optimisticKnownStates[msg.coValueID] = combinedKnownStates(
            msg,
            coValue.knownState()
        );

        const newContent = coValue.newContentSince(msg);

        if (newContent) {
            await peer.outgoing.write(newContent);
        }
    }

    handleUnsubscribe(_msg: UnsubscribeMessage) {
        throw new Error("Method not implemented.");
    }

    async syncCoValue(coValue: CoValue) {
        for (const peer of Object.values(this.peers)) {
            const optimisticKnownState = peer.optimisticKnownStates[coValue.id];

            if (optimisticKnownState) {
                await this.tellUntoldKnownStateIncludingDependencies(
                    coValue.id,
                    peer
                );
                await this.sendNewContentIncludingDependencies(
                    coValue.id,
                    peer
                );
            } else if (peer.role === "server") {
                await this.subscribeToIncludingDependencies(
                    coValue.id,
                    peer
                );
                await this.sendNewContentIncludingDependencies(
                    coValue.id,
                    peer
                );
            }
        }
    }
}

function knownStateIn(
    msg:
        | SubscribeMessage
        | TellKnownStateMessage
        | WrongAssumedKnownStateMessage
) {
    return {
        coValueID: msg.coValueID,
        header: msg.header,
        sessions: msg.sessions,
    };
}
