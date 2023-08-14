import { Hash, Signature } from "./crypto.js";
import { CoValueHeader, Transaction } from "./coValue.js";
import { CoValue } from "./coValue.js";
import { LocalNode } from "./node.js";
import { newLoadingState } from "./node.js";
import {
    ReadableStream,
    WritableStream,
    WritableStreamDefaultWriter,
} from "isomorphic-streams";
import { RawCoID, SessionID } from "./ids.js";

export type CoValueKnownState = {
    id: RawCoID;
    header: boolean;
    sessions: { [sessionID: SessionID]: number };
};

export function emptyKnownState(id: RawCoID): CoValueKnownState {
    return {
        id,
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
    asDependencyOf?: RawCoID;
} & CoValueKnownState;

export type NewContentMessage = {
    action: "newContent";
    id: RawCoID;
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
    id: RawCoID;
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
    optimisticKnownStates: { [id: RawCoID]: CoValueKnownState };
    toldKnownState: Set<RawCoID>;
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
        id: stateA.id,
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

    loadFromPeers(id: RawCoID) {
        for (const peer of Object.values(this.peers)) {
            peer.outgoing
                .write({
                    action: "subscribe",
                    id: id,
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
        id: RawCoID,
        peer: PeerState
    ) {
        const entry = this.local.coValues[id];

        if (!entry) {
            throw new Error(
                "Expected coValue entry on subscribe"
            );
        }

        if (entry.state === "loading") {
            await this.trySendToPeer(peer, {
                action: "subscribe",
                id,
                header: false,
                sessions: {},
            });
            return;
        }

        const coValue = entry.coValue;

        for (const id of coValue.getDependedOnCoValues()) {
            await this.subscribeToIncludingDependencies(id, peer);
        }

        if (!peer.toldKnownState.has(id)) {
            peer.toldKnownState.add(id);
            await this.trySendToPeer(peer, {
                action: "subscribe",
                ...coValue.knownState(),
            });
        }
    }

    async tellUntoldKnownStateIncludingDependencies(
        id: RawCoID,
        peer: PeerState,
        asDependencyOf?: RawCoID
    ) {
        const coValue = this.local.expectCoValueLoaded(id);

        for (const dependentCoID of coValue.getDependedOnCoValues()) {
            await this.tellUntoldKnownStateIncludingDependencies(
                dependentCoID,
                peer,
                asDependencyOf || id
            );
        }

        if (!peer.toldKnownState.has(id)) {
            await this.trySendToPeer(peer, {
                action: "tellKnownState",
                asDependencyOf,
                ...coValue.knownState(),
            });

            peer.toldKnownState.add(id);
        }
    }

    async sendNewContentIncludingDependencies(
        id: RawCoID,
        peer: PeerState
    ) {
        const coValue = this.local.expectCoValueLoaded(id);

        for (const id of coValue.getDependedOnCoValues()) {
            await this.sendNewContentIncludingDependencies(id, peer);
        }

        const newContent = coValue.newContentSince(
            peer.optimisticKnownStates[id]
        );

        if (newContent) {
            await this.trySendToPeer(peer, newContent);
            peer.optimisticKnownStates[id] = combinedKnownStates(
                peer.optimisticKnownStates[id] ||
                    emptyKnownState(id),
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
                for (const id of Object.keys(
                    this.local.coValues
                ) as RawCoID[]) {
                    await this.subscribeToIncludingDependencies(id, peerState);

                    peerState.optimisticKnownStates[id] = {
                        id: id,
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
            console.log("Peer disconnected:", peer.id);
            delete this.peers[peer.id];
        };

        void readIncoming();
    }

    trySendToPeer(peer: PeerState, msg: SyncMessage) {
        return peer.outgoing.write(msg).catch((e) => {
            console.error("Error writing to peer, disconnecting", e);
            delete this.peers[peer.id];
        });
    }

    async handleSubscribe(msg: SubscribeMessage, peer: PeerState) {
        const entry = this.local.coValues[msg.id];

        if (!entry || entry.state === "loading") {
            if (!entry) {
                this.local.coValues[msg.id] = newLoadingState();
            }

            peer.optimisticKnownStates[msg.id] = knownStateIn(msg);
            peer.toldKnownState.add(msg.id);

            await this.trySendToPeer(peer, {
                action: "tellKnownState",
                id: msg.id,
                header: false,
                sessions: {},
            });

            return;
        }

        peer.optimisticKnownStates[msg.id] = knownStateIn(msg);

        await this.tellUntoldKnownStateIncludingDependencies(
            msg.id,
            peer
        );

        await this.sendNewContentIncludingDependencies(msg.id, peer);
    }

    async handleTellKnownState(msg: TellKnownStateMessage, peer: PeerState) {
        let entry = this.local.coValues[msg.id];

        peer.optimisticKnownStates[msg.id] = combinedKnownStates(
            peer.optimisticKnownStates[msg.id] ||
                emptyKnownState(msg.id),
            knownStateIn(msg)
        );

        if (!entry) {
            if (msg.asDependencyOf) {
                if (this.local.coValues[msg.asDependencyOf]) {
                    entry = newLoadingState();

                    this.local.coValues[msg.id] = entry;
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
            msg.id,
            peer
        );
        await this.sendNewContentIncludingDependencies(msg.id, peer);
    }

    async handleNewContent(msg: NewContentMessage, peer: PeerState) {
        let entry = this.local.coValues[msg.id];

        if (!entry) {
            throw new Error(
                "Expected coValue entry to be created, missing subscribe?"
            );
        }

        let resolveAfterDone: ((coValue: CoValue) => void) | undefined;

        const peerOptimisticKnownState =
            peer.optimisticKnownStates[msg.id];

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

            this.local.coValues[msg.id] = entry;
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
            await this.trySendToPeer(peer, {
                action: "wrongAssumedKnownState",
                ...coValue.knownState(),
            });
        }
    }

    async handleWrongAssumedKnownState(
        msg: WrongAssumedKnownStateMessage,
        peer: PeerState
    ) {
        const coValue = this.local.expectCoValueLoaded(msg.id);

        peer.optimisticKnownStates[msg.id] = combinedKnownStates(
            msg,
            coValue.knownState()
        );

        const newContent = coValue.newContentSince(msg);

        if (newContent) {
            await this.trySendToPeer(peer, newContent);
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
                await this.subscribeToIncludingDependencies(coValue.id, peer);
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
        id: msg.id,
        header: msg.header,
        sessions: msg.sessions,
    };
}
