import { Signature } from "./crypto.js";
import { CoValueHeader, Transaction } from "./coValueCore.js";
import { CoValueCore } from "./coValueCore.js";
import { LocalNode } from "./localNode.js";
import { newLoadingState } from "./localNode.js";
import {
    ReadableStream,
    WritableStream,
    WritableStreamDefaultWriter,
} from "isomorphic-streams";
import { RawCoID, SessionID } from "./ids.js";
import { stableStringify } from "./jsonStringify.js";

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
    | LoadMessage
    | KnownStateMessage
    | NewContentMessage
    | DoneMessage;

export type LoadMessage = {
    action: "load";
} & CoValueKnownState;

export type KnownStateMessage = {
    action: "known";
    asDependencyOf?: RawCoID;
    isCorrection?: boolean;
} & CoValueKnownState;

export type NewContentMessage = {
    action: "content";
    id: RawCoID;
    header?: CoValueHeader;
    new: {
        [sessionID: SessionID]: SessionNewContent;
    };
};

export type SessionNewContent = {
    after: number;
    newTransactions: Transaction[];
    lastSignature: Signature;
};
export type DoneMessage = {
    action: "done";
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
                    action: "load",
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
            case "load":
                return await this.handleLoad(msg, peer);
            case "known":
                if (msg.isCorrection) {
                    return await this.handleCorrection(msg, peer);
                } else {
                    return await this.handleKnownState(msg, peer);
                }
            case "content":
                return await this.handleNewContent(msg, peer);
            case "done":
                return await this.handleUnsubscribe(msg);
            default:
                throw new Error(
                    `Unknown message type ${
                        (msg as { action: "string" }).action
                    }`
                );
        }
    }

    async subscribeToIncludingDependencies(id: RawCoID, peer: PeerState) {
        const entry = this.local.coValues[id];

        if (!entry) {
            throw new Error("Expected coValue entry on subscribe");
        }

        if (entry.state === "loading") {
            await this.trySendToPeer(peer, {
                action: "load",
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
                action: "load",
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
                action: "known",
                asDependencyOf,
                ...coValue.knownState(),
            });

            peer.toldKnownState.add(id);
        }
    }

    async sendNewContentIncludingDependencies(id: RawCoID, peer: PeerState) {
        const coValue = this.local.expectCoValueLoaded(id);

        for (const id of coValue.getDependedOnCoValues()) {
            await this.sendNewContentIncludingDependencies(id, peer);
        }

        const newContentPieces = coValue.newContentSince(
            peer.optimisticKnownStates[id]
        );

        if (newContentPieces) {
            const optimisticKnownStateBefore =
                peer.optimisticKnownStates[id] || emptyKnownState(id);

            const sendPieces = async () => {
                for (const [i, piece] of newContentPieces.entries()) {
                    // console.log(
                    //     `${id} -> ${peer.id}: Sending content piece ${i + 1}/${newContentPieces.length} header: ${!!piece.header}`,
                    //     // Object.values(piece.new).map((s) => s.newTransactions)
                    // );
                    await this.trySendToPeer(peer, piece);
                }
            };

            sendPieces().catch((e) => {
                console.error("Error sending new content piece, retrying", e);
                peer.optimisticKnownStates[id] = optimisticKnownStateBefore;
                return this.sendNewContentIncludingDependencies(id, peer);
            });

            peer.optimisticKnownStates[id] = combinedKnownStates(
                optimisticKnownStateBefore,
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
            try {
                for await (const msg of peerState.incoming) {
                    try {
                        await this.handleSyncMessage(msg, peerState);
                        await new Promise<void>((resolve) => {
                            setTimeout(resolve, 0);
                        });
                    } catch (e) {
                        console.error(
                            `Error reading from peer ${peer.id}, handling msg`,
                            JSON.stringify(msg, (k, v) =>
                                k === "changes" || k === "encryptedChanges"
                                    ? v.slice(0, 20) + "..."
                                    : v
                            ),
                            e
                        );
                    }
                }
            } catch (e) {
                console.error(`Error reading from peer ${peer.id}`, e);
            }

            console.log("Peer disconnected:", peer.id);
            delete this.peers[peer.id];
        };

        void readIncoming();
    }

    trySendToPeer(peer: PeerState, msg: SyncMessage) {
        return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                console.error(
                    new Error(
                        `Writing to peer ${peer.id} took >1s - this should never happen as write should resolve quickly or error`
                    )
                );
                resolve();
            }, 1000);
            peer.outgoing
                .write(msg)
                .then(() => {
                    clearTimeout(timeout);
                    resolve();
                })
                .catch((e) => {
                    console.error(
                        new Error(
                            `Error writing to peer ${peer.id}, disconnecting`,
                            {
                                cause: e,
                            }
                        )
                    );
                    delete this.peers[peer.id];
                });
        });
    }

    async handleLoad(msg: LoadMessage, peer: PeerState) {
        const entry = this.local.coValues[msg.id];

        if (!entry || entry.state === "loading") {
            if (!entry) {
                await new Promise<void>((resolve) => {
                    this.local
                        .loadCoValue(msg.id)
                        .then(() => resolve())
                        .catch((e) => {
                            console.error(
                                "Error loading coValue in handleLoad",
                                e
                            );
                            resolve();
                        });
                    setTimeout(resolve, 1000);
                });
            }

            peer.optimisticKnownStates[msg.id] = knownStateIn(msg);
            peer.toldKnownState.add(msg.id);

            await this.trySendToPeer(peer, {
                action: "known",
                id: msg.id,
                header: false,
                sessions: {},
            });

            return;
        }

        peer.optimisticKnownStates[msg.id] = knownStateIn(msg);

        await this.tellUntoldKnownStateIncludingDependencies(msg.id, peer);

        await this.sendNewContentIncludingDependencies(msg.id, peer);
    }

    async handleKnownState(msg: KnownStateMessage, peer: PeerState) {
        let entry = this.local.coValues[msg.id];

        peer.optimisticKnownStates[msg.id] = combinedKnownStates(
            peer.optimisticKnownStates[msg.id] || emptyKnownState(msg.id),
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

        await this.tellUntoldKnownStateIncludingDependencies(msg.id, peer);
        await this.sendNewContentIncludingDependencies(msg.id, peer);
    }

    async handleNewContent(msg: NewContentMessage, peer: PeerState) {
        let entry = this.local.coValues[msg.id];

        if (!entry) {
            throw new Error(
                "Expected coValue entry to be created, missing subscribe?"
            );
        }

        let resolveAfterDone: ((coValue: CoValueCore) => void) | undefined;

        const peerOptimisticKnownState = peer.optimisticKnownStates[msg.id];

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

            const coValue = new CoValueCore(msg.header, this.local);

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
            msg.new
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

            if (newTransactions.length === 0) {
                continue;
            }

            const before = performance.now();
            const success = await coValue.tryAddTransactionsAsync(
                sessionID,
                newTransactions,
                undefined,
                newContentForSession.lastSignature
            );
            const after = performance.now();
            if (after - before > 10) {
                const totalTxLength = newTransactions
                    .map((t) =>
                        t.privacy === "private"
                            ? t.encryptedChanges.length
                            : t.changes.length
                    )
                    .reduce((a, b) => a + b, 0);
                console.log(
                    `Adding incoming transactions took ${(
                        after - before
                    ).toFixed(2)}ms for ${totalTxLength} bytes = bandwidth: ${(
                        (1000 * totalTxLength) /
                        (after - before) /
                        (1024 * 1024)
                    ).toFixed(2)} MB/s`
                );
            }

            if (!success) {
                console.error(
                    "Failed to add transactions",
                    msg.id,
                    JSON.stringify(newTransactions, (k, v) =>
                        k === "changes" || k === "encryptedChanges"
                            ? v.slice(0, 20) + "..."
                            : v
                    )
                );
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
                action: "known",
                isCorrection: true,
                ...coValue.knownState(),
            });
        }
    }

    async handleCorrection(msg: KnownStateMessage, peer: PeerState) {
        peer.optimisticKnownStates[msg.id] = msg;

        return this.sendNewContentIncludingDependencies(msg.id, peer);
    }

    handleUnsubscribe(_msg: DoneMessage) {
        throw new Error("Method not implemented.");
    }

    async syncCoValue(coValue: CoValueCore) {
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

function knownStateIn(msg: LoadMessage | KnownStateMessage) {
    return {
        id: msg.id,
        header: msg.header,
        sessions: msg.sessions,
    };
}
