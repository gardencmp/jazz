import { describe, test, expect } from "vitest";
import {
    CoValueState,
    NodeState,
    addPeer,
    markCoValueDone,
    removePeer,
    unsafeAddVerifiedHeader,
    unsafeAddVerifiedTransactions,
} from "./node";
import { RawCoID, SessionID } from "./ids";
import { CoValueHeader, Transaction } from "./coValueCore";
import { Hash, Signature, StreamingHash } from "./crypto";

describe("NodeState", () => {
    describe("unsafeAddVerifiedHeader", () => {
        test("Adding a new header locally to an empty state", () => {
            const state: NodeState = {
                coValues: new Map(),
                peers: new Map(),
            };

            const id = "id1" as RawCoID;
            const header = {};

            const result = unsafeAddVerifiedHeader(
                state,
                id,
                header as CoValueHeader,
                "local"
            );
            expect(result).toMatchObject({
                result: "success",
                events: [{ type: "addedNewHeader", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map(),
                sync: new Map(),
            });
        });

        test("Adding a new header locally with peers", () => {
            const state: NodeState = {
                coValues: new Map(),
                peers: threeDifferentPeers,
            };

            const id = "id1" as RawCoID;
            const header = {};

            const result = unsafeAddVerifiedHeader(
                state,
                id,
                header as CoValueHeader,
                "local"
            );
            expect(result).toMatchObject({
                result: "success",
                events: [{ type: "addedNewHeader", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map(),
                sync: new Map([
                    [
                        "peer1",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer2",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer3",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                ]),
            });
        });

        test("Adding a new header from a peer", () => {
            const state: NodeState = {
                coValues: new Map(),
                peers: threeDifferentPeers,
            };

            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const result = unsafeAddVerifiedHeader(state, id, header, "peer2");
            expect(result).toMatchObject({
                result: "success",
                events: [{ type: "addedNewHeader", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map(),
                sync: new Map([
                    [
                        "peer1",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer2",
                        {
                            assumedState: toldKnownStateWithJustHeader(id),
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer3",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                ]),
            });
        });
    });

    describe("unsafeAddVerifiedTransactions", () => {
        test("Adding transactions locally to an empty CoValue", () => {
            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const state: NodeState = {
                coValues: new Map(),
                peers: new Map(),
            };

            unsafeAddVerifiedHeader(state, id, header, "local");

            const sessionID = "session1" as SessionID;
            const transactions = [
                { _tx: 0 },
                { _tx: 1 },
            ] as unknown as Transaction[];
            const signature = "signatureAfterTx1" as Signature;
            const newHash = "hashAfterTx1" as Hash;
            const streamingHash = {
                _streamingHashAfterTx: 1,
            } as unknown as StreamingHash;

            const result = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                0,
                transactions,
                signature,
                newHash,
                streamingHash,
                "local"
            );
            expect(result).toMatchObject({
                result: "success",
                events: [{ type: "addedNewTransactions", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map([
                    [
                        sessionID,
                        {
                            transactions,
                            lastSignature: signature,
                            signatureAfter: { 1: signature },
                            lastHash: newHash,
                            streamingHash,
                        },
                    ],
                ]),
                sync: new Map(),
            });
        });

        test("Adding transactions locally to an empty CoValue with peers", () => {
            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const state: NodeState = {
                coValues: new Map(),
                peers: threeDifferentPeers,
            };

            unsafeAddVerifiedHeader(state, id, header, "local");

            const sessionID = "session1" as SessionID;
            const transactions = [
                { _tx: 0 },
                { _tx: 1 },
            ] as unknown as Transaction[];
            const signature = "signatureAfterTx1" as Signature;
            const newHash = "hashAfterTx1" as Hash;
            const streamingHash = {
                _streamingHashAfterTx: 1,
            } as unknown as StreamingHash;

            const result = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                0,
                transactions,
                signature,
                newHash,
                streamingHash,
                "local"
            );
            expect(result).toMatchObject({
                result: "success",
                events: [{ type: "addedNewTransactions", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map([
                    [
                        sessionID,
                        {
                            transactions,
                            lastSignature: signature,
                            signatureAfter: { 1: signature },
                            lastHash: newHash,
                            streamingHash,
                        },
                    ],
                ]),
                sync: new Map([
                    [
                        "peer1",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer2",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer3",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                ]),
            });
        });

        test("Adding transactions to an empty CoValue from peer", () => {
            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const state: NodeState = {
                coValues: new Map(),
                peers: threeDifferentPeers,
            };

            unsafeAddVerifiedHeader(state, id, header, "peer2");

            const sessionID = "session1" as SessionID;
            const transactions = [
                { _tx: 0 },
                { _tx: 1 },
            ] as unknown as Transaction[];
            const signature = "signatureAfterTx1" as Signature;
            const newHash = "hashAfterTx1" as Hash;
            const streamingHash = {
                _streamingHashAfterTx: 1,
            } as unknown as StreamingHash;

            const result = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                0,
                transactions,
                signature,
                newHash,
                streamingHash,
                "peer2"
            );
            expect(result).toMatchObject({
                result: "success",
                events: [{ type: "addedNewTransactions", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map([
                    [
                        sessionID,
                        {
                            transactions,
                            lastSignature: signature,
                            signatureAfter: { 1: signature },
                            lastHash: newHash,
                            streamingHash,
                        },
                    ],
                ]),
                sync: new Map([
                    [
                        "peer1",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer2",
                        {
                            assumedState: {
                                id,
                                header: true,
                                sessions: {
                                    session1: 2,
                                },
                            },
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer3",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                ]),
            });
        });

        test("Adding transactions locally to a non-empty CoValue", () => {
            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const state: NodeState = {
                coValues: new Map(),
                peers: new Map(),
            };

            const result1 = unsafeAddVerifiedHeader(state, id, header, "local");
            expect(result1.result).toBe("success");

            const sessionID = "session1" as SessionID;
            const transactions = [
                { _tx: 0 },
                { _tx: 1 },
            ] as unknown as Transaction[];
            const signature = "signatureAfterTx1" as Signature;
            const newHash = "hashAfterTx1" as Hash;
            const streamingHash = {
                _streamingHashAfterTx: 1,
            } as unknown as StreamingHash;

            const result2 = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                0,
                transactions,
                signature,
                newHash,
                streamingHash,
                "local"
            );
            expect(result2.result).toBe("success");

            const transactions2 = [
                { _tx: 2 },
                { _tx: 3 },
            ] as unknown as Transaction[];
            const signature2 = "signatureAfterTx3" as Signature;
            const newHash2 = "hashAfterTx3" as Hash;
            const streamingHash2 = {
                _streamingHashAfterTx: 3,
            } as unknown as StreamingHash;

            const result3 = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                2,
                transactions2,
                signature2,
                newHash2,
                streamingHash2,
                "local"
            );

            expect(result3).toMatchObject({
                result: "success",
                events: [{ type: "addedNewTransactions", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map([
                    [
                        sessionID,
                        {
                            transactions: [...transactions, ...transactions2],
                            lastSignature: signature2,
                            signatureAfter: { 1: signature, 3: signature2 },
                            lastHash: newHash2,
                            streamingHash: streamingHash2,
                        },
                    ],
                ]),
                sync: new Map()
            });
        });

        test("Adding transactions locally to a non-empty CoValue with Peers", () => {
            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const state: NodeState = {
                coValues: new Map(),
                peers: threeDifferentPeers,
            };

            unsafeAddVerifiedHeader(state, id, header, "local");

            const sessionID = "session1" as SessionID;
            const transactions = [
                { _tx: 0 },
                { _tx: 1 },
            ] as unknown as Transaction[];
            const signature = "signatureAfterTx1" as Signature;
            const newHash = "hashAfterTx1" as Hash;
            const streamingHash = {
                _streamingHashAfterTx: 1,
            } as unknown as StreamingHash;

            const _result = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                0,
                transactions,
                signature,
                newHash,
                streamingHash,
                "local"
            );

            const transactions2 = [
                { _tx: 2 },
                { _tx: 3 },
            ] as unknown as Transaction[];
            const signature2 = "signatureAfterTx3" as Signature;
            const newHash2 = "hashAfterTx3" as Hash;
            const streamingHash2 = {
                _streamingHashAfterTx: 3,
            } as unknown as StreamingHash;

            const result2 = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                2,
                transactions2,
                signature2,
                newHash2,
                streamingHash2,
                "local"
            );

            expect(result2).toMatchObject({
                result: "success",
                events: [{ type: "addedNewTransactions", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map([
                    [
                        sessionID,
                        {
                            transactions: [...transactions, ...transactions2],
                            lastSignature: signature2,
                            signatureAfter: { 1: signature, 3: signature2 },
                            lastHash: newHash2,
                            streamingHash: streamingHash2,
                        },
                    ],
                ]),
                sync: new Map([
                    [
                        "peer1",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer2",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer3",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                ]),
            });
        });

        test("Adding transactions from a peer to a non-empty CoValue", () => {
            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const state: NodeState = {
                coValues: new Map(),
                peers: threeDifferentPeers,
            };

            unsafeAddVerifiedHeader(state, id, header, "peer2");

            const sessionID = "session1" as SessionID;
            const transactions = [
                { _tx: 0 },
                { _tx: 1 },
            ] as unknown as Transaction[];
            const signature = "signatureAfterTx1" as Signature;
            const newHash = "hashAfterTx1" as Hash;
            const streamingHash = {
                _streamingHashAfterTx: 1,
            } as unknown as StreamingHash;

            const _result = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                0,
                transactions,
                signature,
                newHash,
                streamingHash,
                "peer2"
            );

            const transactions2 = [
                { _tx: 2 },
                { _tx: 3 },
            ] as unknown as Transaction[];
            const signature2 = "signatureAfterTx3" as Signature;
            const newHash2 = "hashAfterTx3" as Hash;
            const streamingHash2 = {
                _streamingHashAfterTx: 3,
            } as unknown as StreamingHash;

            const result2 = unsafeAddVerifiedTransactions(
                state,
                id,
                sessionID,
                2,
                transactions2,
                signature2,
                newHash2,
                streamingHash2,
                "peer2"
            );

            expect(result2).toMatchObject({
                result: "success",
                events: [{ type: "addedNewTransactions", id }],
            });
            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: false,
                sessions: new Map([
                    [
                        sessionID,
                        {
                            transactions: [...transactions, ...transactions2],
                            lastSignature: signature2,
                            signatureAfter: { 1: signature, 3: signature2 },
                            lastHash: newHash2,
                            streamingHash: streamingHash2,
                        },
                    ],
                ]),
                sync: new Map([
                    [
                        "peer1",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer2",
                        {
                            assumedState: {
                                id,
                                header: true,
                                sessions: {
                                    session1: 4,
                                },
                            },
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                    [
                        "peer3",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: toldKnownStateWithJustHeader(id),
                            error: undefined,
                        },
                    ],
                ]),
            });
        })
    });

    describe("markCoValueDone", () => {
        test("Marking a CoValue as done", () => {
            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const state: NodeState = {
                coValues: new Map(),
                peers: new Map(),
            };

            const result1 = unsafeAddVerifiedHeader(state, id, header, "local");
            expect(result1.result).toBe("success");

            const result2 = markCoValueDone(state, id);
            expect(result2).toMatchObject({
                result: "success",
                events: [{ type: "coValueDone", id }],
            });

            expect(state.coValues.get(id)).toEqual({
                id,
                header,
                done: true,
                sessions: new Map(),
                sync: new Map(),
            });
        })
    })

    describe("Add and removing peers", () => {
        test("Adding a peer to an empty state", () => {
            const state: NodeState = {
                coValues: new Map(),
                peers: new Map(),
            };
            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const result1 = unsafeAddVerifiedHeader(state, id, header, "local");
            expect(result1.result).toBe("success");

            const result2 = addPeer(state, "peer1", "syncAllOurs", 10);
            expect(result2).toMatchObject({
                result: "success",
                events: [{ type: "addedPeer", peer: "peer1" }],
            });
            expect(state.peers.get("peer1")).toEqual({
                name: "peer1",
                relationship: "syncAllOurs",
                priority: 10,
            });
            expect(state.coValues.get(id)).toMatchObject({
                sync: new Map([
                    [
                        "peer1",
                        {
                            assumedState: "unknown",
                            confirmedState: undefined,
                            toldKnownState: undefined,
                            error: undefined,
                        },
                    ],
                ]),
            });
        });

        test("Removing a peer from a state", () => {
            const state: NodeState = {
                coValues: new Map(),
                peers: new Map(),
            };

            const id = "id1" as RawCoID;
            const header = {} as CoValueHeader;

            const result1 = unsafeAddVerifiedHeader(state, id, header, "local");
            expect(result1.result).toBe("success");

            const result2 = addPeer(state, "peer1", "syncAllOurs", 10);
            expect(result2).toMatchObject({
                result: "success",
                events: [{ type: "addedPeer", peer: "peer1" }],
            });

            const result3 = removePeer(state, "peer1");
            expect(result3).toMatchObject({
                result: "success",
                events: [{ type: "removedPeer", peer: "peer1" }],
            });
            expect(state.peers.get("peer1")).toBeUndefined();
            expect(state.coValues.get(id)?.sync.get("peer1")).toBeUndefined();
        })
    });

    describe("Updating peer state", () => {
        test.todo("Confirming a peer's state updates confirmed state");
        test.todo("Confirming a peer's state older than the assumed state leaves the assumed state intact");
        test.todo("Confirming a peer's state newer than the assumed state updates the assumed state");

        test.todo("Correcting a peer's assumed state updates the assumed state");
        test.todo("Correcting a peer's assumed state older than the confirmed state updates the confirmed state as well");
        test.todo(
            "Correcting a peer's assumed state newer than the confirmed state updates both assumed and confirmed state"
        );
    });

    describe("Syncing a CoValue", () => {
        test.todo("Syncing a CoValue with unknown assumed state and no confirmed state sends a load request to syncAllOurs peers");
        test.todo(
            "Syncing a CoValue with unknown assumed state and no confirmed state sends a known request to syncTheirs peers"
        );
        test.todo("Syncing a CoValue with assumed state behind our state sends a newContent message to syncAllOurs peers");
        test.todo("Syncing a CoValue with assumed state behind our state sends a newContent message to syncTheirs peers");
        test.todo("Syncing a CoValue only creates messages for the highest priority peer that has assumed state behind ours")
    });
});

const toldKnownStateWithJustHeader = (id: RawCoID) => ({
    id,
    header: true,
    sessions: {},
});

const threeDifferentPeers = new Map([
    [
        "peer1",
        {
            name: "peer1",
            relationship: "syncAllOurs",
            priority: 0,
        },
    ] as const,
    [
        "peer2",
        {
            name: "peer2",
            relationship: "syncTheirs",
            priority: 0,
        },
    ] as const,
    [
        "peer3",
        {
            name: "peer3",
            relationship: "syncCommon",
            priority: 0,
        },
    ] as const,
]);
