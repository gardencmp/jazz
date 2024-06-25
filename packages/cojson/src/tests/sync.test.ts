import { expect, test } from "vitest";
import { LocalNode } from "../localNode.js";
import { SyncMessage } from "../sync.js";
import { MapOpPayload } from "../coValues/coMap.js";
import { RawGroup } from "../coValues/group.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";
import { connectedPeers, newQueuePair } from "../streamUtils.js";
import { AccountID } from "../coValues/account.js";
import { stableStringify } from "../jsonStringify.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { Effect, Queue, Sink, Stream } from "effect";
import { newRandomSessionID } from "../coValueCore.js";
import { expectMap } from "../coValue.js";

const Crypto = await WasmCrypto.create();

test("Node replies with initial tx and header to empty subscribe", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        map.set("hello", "world", "trusting");

        const [inRx, inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "peer",
        });

        yield* Queue.offer(inTx, {
            action: "load",
            id: map.core.id,
            header: false,
            sessions: {},
        });

        // expect((yield* Queue.take(outRxQ))).toMatchObject(admStateEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupStateEx(group));

        const mapTellKnownStateMsg = yield* Queue.take(outRxQ);
        expect(mapTellKnownStateMsg).toEqual({
            action: "known",
            ...map.core.knownState(),
        } satisfies SyncMessage);

        // expect((yield * Queue.take(outRxQ))).toMatchObject(admContEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

        const newContentMsg = yield* Queue.take(outRxQ);

        expect(newContentMsg).toEqual({
            action: "content",
            id: map.core.id,
            header: {
                type: "comap",
                ruleset: { type: "ownedByGroup", group: group.id },
                meta: null,
                createdAt: map.core.header.createdAt,
                uniqueness: map.core.header.uniqueness,
            },
            new: {
                [node.currentSessionID]: {
                    after: 0,
                    newTransactions: [
                        {
                            privacy: "trusting" as const,
                            madeAt: map.core.sessionLogs.get(
                                node.currentSessionID,
                            )!.transactions[0]!.madeAt,
                            changes: stableStringify([
                                {
                                    op: "set",
                                    key: "hello",
                                    value: "world",
                                } satisfies MapOpPayload<string, string>,
                            ]),
                        },
                    ],
                    lastSignature: map.core.sessionLogs.get(
                        node.currentSessionID,
                    )!.lastSignature!,
                },
            },
        } satisfies SyncMessage);
    }).pipe(Effect.scoped, Effect.runPromise));

test("Node replies with only new tx to subscribe with some known state", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        map.set("hello", "world", "trusting");
        map.set("goodbye", "world", "trusting");

        const [inRx, inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "peer",
        });

        yield* Queue.offer(inTx, {
            action: "load",
            id: map.core.id,
            header: true,
            sessions: {
                [node.currentSessionID]: 1,
            },
        });

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admStateEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupStateEx(group));

        const mapTellKnownStateMsg = yield* Queue.take(outRxQ);
        expect(mapTellKnownStateMsg).toEqual({
            action: "known",
            ...map.core.knownState(),
        } satisfies SyncMessage);

        // expect(yield* Queue.take(outRxQ))).toMatchObject(admContEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

        const mapNewContentMsg = yield* Queue.take(outRxQ);

        expect(mapNewContentMsg).toEqual({
            action: "content",
            id: map.core.id,
            header: undefined,
            new: {
                [node.currentSessionID]: {
                    after: 1,
                    newTransactions: [
                        {
                            privacy: "trusting" as const,
                            madeAt: map.core.sessionLogs.get(
                                node.currentSessionID,
                            )!.transactions[1]!.madeAt,
                            changes: stableStringify([
                                {
                                    op: "set",
                                    key: "goodbye",
                                    value: "world",
                                } satisfies MapOpPayload<string, string>,
                            ]),
                        },
                    ],
                    lastSignature: map.core.sessionLogs.get(
                        node.currentSessionID,
                    )!.lastSignature!,
                },
            },
        } satisfies SyncMessage);
    }).pipe(Effect.scoped, Effect.runPromise));

test.todo(
    "TODO: node only replies with new tx to subscribe with some known state, even in the depended on coValues",
);

test("After subscribing, node sends own known state and new txs to peer", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        const [inRx, inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "peer",
        });

        yield* Queue.offer(inTx, {
            action: "load",
            id: map.core.id,
            header: false,
            sessions: {
                [node.currentSessionID]: 0,
            },
        });

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admStateEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupStateEx(group));

        const mapTellKnownStateMsg = yield* Queue.take(outRxQ);
        expect(mapTellKnownStateMsg).toEqual({
            action: "known",
            ...map.core.knownState(),
        } satisfies SyncMessage);

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

        const mapNewContentHeaderOnlyMsg = yield* Queue.take(outRxQ);

        expect(mapNewContentHeaderOnlyMsg).toEqual({
            action: "content",
            id: map.core.id,
            header: map.core.header,
            new: {},
        } satisfies SyncMessage);

        map.set("hello", "world", "trusting");

        const mapEditMsg1 = yield* Queue.take(outRxQ);

        expect(mapEditMsg1).toEqual({
            action: "content",
            id: map.core.id,
            new: {
                [node.currentSessionID]: {
                    after: 0,
                    newTransactions: [
                        {
                            privacy: "trusting" as const,
                            madeAt: map.core.sessionLogs.get(
                                node.currentSessionID,
                            )!.transactions[0]!.madeAt,
                            changes: stableStringify([
                                {
                                    op: "set",
                                    key: "hello",
                                    value: "world",
                                } satisfies MapOpPayload<string, string>,
                            ]),
                        },
                    ],
                    lastSignature: map.core.sessionLogs.get(
                        node.currentSessionID,
                    )!.lastSignature!,
                },
            },
        } satisfies SyncMessage);

        map.set("goodbye", "world", "trusting");

        const mapEditMsg2 = yield* Queue.take(outRxQ);

        expect(mapEditMsg2).toEqual({
            action: "content",
            id: map.core.id,
            new: {
                [node.currentSessionID]: {
                    after: 1,
                    newTransactions: [
                        {
                            privacy: "trusting" as const,
                            madeAt: map.core.sessionLogs.get(
                                node.currentSessionID,
                            )!.transactions[1]!.madeAt,
                            changes: stableStringify([
                                {
                                    op: "set",
                                    key: "goodbye",
                                    value: "world",
                                } satisfies MapOpPayload<string, string>,
                            ]),
                        },
                    ],
                    lastSignature: map.core.sessionLogs.get(
                        node.currentSessionID,
                    )!.lastSignature!,
                },
            },
        } satisfies SyncMessage);
    }).pipe(Effect.scoped, Effect.runPromise));

test("Client replies with known new content to tellKnownState from server", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        map.set("hello", "world", "trusting");

        const [inRx, inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "peer",
        });

        // expect(yield* Queue.take(outRxQ)).toMatchObject(groupStateEx(group));

        yield* Queue.offer(inTx, {
            action: "known",
            id: map.core.id,
            header: false,
            sessions: {
                [node.currentSessionID]: 0,
            },
        });

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admStateEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupStateEx(group));

        const mapTellKnownStateMsg = yield* Queue.take(outRxQ);
        expect(mapTellKnownStateMsg).toEqual({
            action: "known",
            ...map.core.knownState(),
        } satisfies SyncMessage);

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

        const mapNewContentMsg = yield* Queue.take(outRxQ);

        expect(mapNewContentMsg).toEqual({
            action: "content",
            id: map.core.id,
            header: map.core.header,
            new: {
                [node.currentSessionID]: {
                    after: 0,
                    newTransactions: [
                        {
                            privacy: "trusting" as const,
                            madeAt: map.core.sessionLogs.get(
                                node.currentSessionID,
                            )!.transactions[0]!.madeAt,
                            changes: stableStringify([
                                {
                                    op: "set",
                                    key: "hello",
                                    value: "world",
                                } satisfies MapOpPayload<string, string>,
                            ]),
                        },
                    ],
                    lastSignature: map.core.sessionLogs.get(
                        node.currentSessionID,
                    )!.lastSignature!,
                },
            },
        } satisfies SyncMessage);
    }).pipe(Effect.scoped, Effect.runPromise));

test("No matter the optimistic known state, node respects invalid known state messages and resyncs", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        const [inRx, inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "peer",
        });

        yield* Queue.offer(inTx, {
            action: "load",
            id: map.core.id,
            header: false,
            sessions: {
                [node.currentSessionID]: 0,
            },
        });

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admStateEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupStateEx(group));

        const mapTellKnownStateMsg = yield* Queue.take(outRxQ);
        expect(mapTellKnownStateMsg).toEqual({
            action: "known",
            ...map.core.knownState(),
        } satisfies SyncMessage);

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

        const mapNewContentHeaderOnlyMsg = yield* Queue.take(outRxQ);

        expect(mapNewContentHeaderOnlyMsg).toEqual({
            action: "content",
            id: map.core.id,
            header: map.core.header,
            new: {},
        } satisfies SyncMessage);

        map.set("hello", "world", "trusting");

        map.set("goodbye", "world", "trusting");

        const _mapEditMsgs = yield* Queue.take(outRxQ);

        console.log("Sending correction");

        yield* Queue.offer(inTx, {
            action: "known",
            isCorrection: true,
            id: map.core.id,
            header: true,
            sessions: {
                [node.currentSessionID]: 1,
            },
        } satisfies SyncMessage);

        const newContentAfterWrongAssumedState = yield* Queue.take(outRxQ);

        expect(newContentAfterWrongAssumedState).toEqual({
            action: "content",
            id: map.core.id,
            header: undefined,
            new: {
                [node.currentSessionID]: {
                    after: 1,
                    newTransactions: [
                        {
                            privacy: "trusting" as const,
                            madeAt: map.core.sessionLogs.get(
                                node.currentSessionID,
                            )!.transactions[1]!.madeAt,
                            changes: stableStringify([
                                {
                                    op: "set",
                                    key: "goodbye",
                                    value: "world",
                                } satisfies MapOpPayload<string, string>,
                            ]),
                        },
                    ],
                    lastSignature: map.core.sessionLogs.get(
                        node.currentSessionID,
                    )!.lastSignature!,
                },
            },
        } satisfies SyncMessage);
    }).pipe(Effect.scoped, Effect.runPromise));

test("If we add a peer, but it never subscribes to a coValue, it won't get any messages", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        const [inRx, _inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "peer",
        });

        map.set("hello", "world", "trusting");

        expect(
            yield* Queue.take(outRxQ).pipe(
                Effect.timeout(100),
                Effect.catch("_tag", {
                    failure: "TimeoutException",
                    onFailure: () => Effect.succeed("neverHappened"),
                }),
            ),
        ).toEqual("neverHappened");
    }).pipe(Effect.scoped, Effect.runPromise));

test.todo(
    "If we add a server peer, all updates to all coValues are sent to it, even if it doesn't subscribe",
    () =>
        Effect.gen(function* () {
            const [admin, session] = randomAnonymousAccountAndSessionID();
            const node = new LocalNode(admin, session, Crypto);

            const group = node.createGroup();

            const map = group.createMap();

            const [inRx, _inTx] = yield* newQueuePair();
            const [outRx, outTx] = yield* newQueuePair();
            const outRxQ = yield* Queue.unbounded<SyncMessage>();
            yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

            node.syncManager.addPeer({
                id: "test",
                incoming: inRx,
                outgoing: outTx,
                role: "server",
            });

            // expect(yield* Queue.take(outRxQ)).toMatchObject({
            //     action: "load",
            //     id: adminID,
            // });
            expect(yield* Queue.take(outRxQ)).toMatchObject({
                action: "load",
                id: group.core.id,
            });

            const mapSubscribeMsg = Queue.take(outRxQ);

            expect(mapSubscribeMsg).toEqual({
                action: "load",
                id: map.core.id,
                header: true,
                sessions: {},
            } satisfies SyncMessage);

            map.set("hello", "world", "trusting");

            // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(admin.id));
            expect(yield* Queue.take(outRxQ)).toMatchObject(
                groupContentEx(group),
            );

            const mapNewContentMsg = Queue.take(outRxQ);

            expect(mapNewContentMsg).toEqual({
                action: "content",
                id: map.core.id,
                header: map.core.header,
                new: {
                    [node.currentSessionID]: {
                        after: 0,
                        newTransactions: [
                            {
                                privacy: "trusting" as const,
                                madeAt: map.core.sessionLogs.get(
                                    node.currentSessionID,
                                )!.transactions[0]!.madeAt,
                                changes: stableStringify([
                                    {
                                        op: "set",
                                        key: "hello",
                                        value: "world",
                                    } satisfies MapOpPayload<string, string>,
                                ]),
                            },
                        ],
                        lastSignature: map.core.sessionLogs.get(
                            node.currentSessionID,
                        )!.lastSignature!,
                    },
                },
            } satisfies SyncMessage);
        }).pipe(Effect.scoped, Effect.runPromise),
);

test.skip("If we add a server peer, newly created coValues are auto-subscribed to", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const [inRx, _inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "server",
        });

        // expect(yield* Queue.take(outRxQ)).toMatchObject({
        //     action: "load",
        //     id: admin.id,
        // });
        expect(yield* Queue.take(outRxQ)).toMatchObject({
            action: "load",
            id: group.core.id,
        });

        const map = group.createMap();

        const mapSubscribeMsg = Queue.take(outRxQ);

        expect(mapSubscribeMsg).toEqual({
            action: "load",
            ...map.core.knownState(),
        } satisfies SyncMessage);

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(adminID));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

        const mapContentMsg = Queue.take(outRxQ);

        expect(mapContentMsg).toEqual({
            action: "content",
            id: map.core.id,
            header: map.core.header,
            new: {},
        } satisfies SyncMessage);
    }).pipe(Effect.scoped, Effect.runPromise));

test.todo(
    "TODO: when receiving a subscribe response that is behind our optimistic state (due to already sent content), we ignore it",
);

test("When we connect a new server peer, we try to sync all existing coValues to it", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        const [inRx, _inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "server",
        });

        // const _adminSubscribeMessage = yield* Queue.take(outRxQ);
        const groupSubscribeMessage = yield* Queue.take(outRxQ);

        expect(groupSubscribeMessage).toEqual({
            action: "load",
            ...group.core.knownState(),
        } satisfies SyncMessage);

        const secondMessage = yield* Queue.take(outRxQ);

        expect(secondMessage).toEqual({
            action: "load",
            ...map.core.knownState(),
        } satisfies SyncMessage);
    }).pipe(Effect.scoped, Effect.runPromise));

test("When receiving a subscribe with a known state that is ahead of our own, peers should respond with a corresponding subscribe response message", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        const [inRx, inTx] = yield* newQueuePair();
        const [outRx, outTx] = yield* newQueuePair();
        const outRxQ = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx, Sink.fromQueue(outRxQ)));

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "peer",
        });

        yield* Queue.offer(inTx, {
            action: "load",
            id: map.core.id,
            header: true,
            sessions: {
                [node.currentSessionID]: 1,
            },
        });

        // expect(yield* Queue.take(outRxQ)).toMatchObject(admStateEx(admin.id));
        expect(yield* Queue.take(outRxQ)).toMatchObject(groupStateEx(group));
        const mapTellKnownState = yield* Queue.take(outRxQ);

        expect(mapTellKnownState).toEqual({
            action: "known",
            ...map.core.knownState(),
        } satisfies SyncMessage);
    }).pipe(Effect.scoped, Effect.runPromise));

test.skip("When replaying creation and transactions of a coValue as new content, the receiving peer integrates this information", () =>
    Effect.gen(function* () {
        // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
        const [admin, session] = randomAnonymousAccountAndSessionID();

        const node1 = new LocalNode(admin, session, Crypto);

        const group = node1.createGroup();

        const [inRx1, inTx1] = yield* newQueuePair();
        const [outRx1, outTx1] = yield* newQueuePair();
        const outRxQ1 = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx1, Sink.fromQueue(outRxQ1)));

        node1.syncManager.addPeer({
            id: "test2",
            incoming: inRx1,
            outgoing: outTx1,
            role: "server",
        });

        const node2 = new LocalNode(
            admin,
            newRandomSessionID(admin.id),
            Crypto,
        );

        const [inRx2, inTx2] = yield* newQueuePair();
        const [outRx2, outTx2] = yield* newQueuePair();
        const outRxQ2 = yield* Queue.unbounded<SyncMessage>();
        yield* Effect.fork(Stream.run(outRx2, Sink.fromQueue(outRxQ1)));

        node2.syncManager.addPeer({
            id: "test1",
            incoming: inRx2,
            outgoing: outTx2,
            role: "client",
        });

        const adminSubscribeMessage: SyncMessage = yield* Queue.take(outRxQ1);
        expect(adminSubscribeMessage).toMatchObject({
            action: "load",
            id: admin.id,
        });
        const groupSubscribeMsg = yield* Queue.take(outRxQ1);
        expect(groupSubscribeMsg).toMatchObject({
            action: "load",
            id: group.core.id,
        });

        yield* Queue.offer(inTx2, adminSubscribeMessage);
        yield* Queue.offer(inTx2, groupSubscribeMsg);

        // const adminTellKnownStateMsg = yield* Queue.take(outRxQ2);
        // expect(adminTellKnownStateMsg).toMatchObject(admStateEx(admin.id));

        const groupTellKnownStateMsg = yield* Queue.take(outRxQ2);
        expect(groupTellKnownStateMsg).toMatchObject(groupStateEx(group));

        expect(
            node2.syncManager.peers["test1"]!.optimisticKnownStates[
                group.core.id
            ],
        ).toBeDefined();

        // yield* Queue.offer(inTx1, adminTellKnownStateMsg);
        yield* Queue.offer(inTx1, groupTellKnownStateMsg);

        // const adminContentMsg = yield* Queue.take(outRxQ1);
        // expect(adminContentMsg).toMatchObject(admContEx(admin.id));

        const groupContentMsg = yield* Queue.take(outRxQ1);
        expect(groupContentMsg).toMatchObject(groupContentEx(group));

        // yield* Queue.offer(inTx2, adminContentMsg);
        yield* Queue.offer(inTx2, groupContentMsg);

        const map = group.createMap();

        const mapSubscriptionMsg = yield* Queue.take(outRxQ1);
        expect(mapSubscriptionMsg).toMatchObject({
            action: "load",
            id: map.core.id,
        });

        const mapNewContentMsg = yield* Queue.take(outRxQ1);
        expect(mapNewContentMsg).toEqual({
            action: "content",
            id: map.core.id,
            header: map.core.header,
            new: {},
        } satisfies SyncMessage);

        yield* Queue.offer(inTx2, mapSubscriptionMsg);

        const mapTellKnownStateMsg = yield* Queue.take(outRxQ2);
        expect(mapTellKnownStateMsg).toEqual({
            action: "known",
            id: map.core.id,
            header: false,
            sessions: {},
        } satisfies SyncMessage);

        expect(node2.coValues[map.core.id]?.state).toEqual("loading");

        yield* Queue.offer(inTx2, mapNewContentMsg);

        map.set("hello", "world", "trusting");

        const mapEditMsg = yield* Queue.take(outRxQ1);

        yield* Queue.offer(inTx2, mapEditMsg);

        yield* Effect.sleep(100);

        expect(
            expectMap(
                node2.expectCoValueLoaded(map.core.id).getCurrentContent(),
            ).get("hello"),
        ).toEqual("world");
    }).pipe(Effect.scoped, Effect.runPromise));

test.skip("When loading a coValue on one node, the server node it is requested from replies with all the necessary depended on coValues to make it work", async () => {
    /*
    // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const node1 = new LocalNode(admin, session, Crypto);

    const group = node1.createGroup();

    const map = group.createMap();
    map.set("hello", "world", "trusting");

    const node2 = new LocalNode(admin, newRandomSessionID(admin.id), Crypto);

    const [node1asPeer, node2asPeer] = connectedPeers("peer1", "peer2");

    node1.syncManager.addPeer(node2asPeer);
    node2.syncManager.addPeer(node1asPeer);

    await node2.loadCoValueCore(map.core.id);

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.core.id).getCurrentContent(),
        ).get("hello"),
    ).toEqual("world");
    */
});

test("Can sync a coValue through a server to another client", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();

        const client1 = new LocalNode(admin, session, Crypto);

        const group = client1.createGroup();

        const map = group.createMap();
        map.set("hello", "world", "trusting");

        const [serverUser, serverSession] =
            randomAnonymousAccountAndSessionID();

        const server = new LocalNode(serverUser, serverSession, Crypto);

        const [serverAsPeerForClient1, client1AsPeer] = yield* connectedPeers(
            "serverFor1",
            "client1",
            {
                peer1role: "server",
                peer2role: "client",
                trace: true,
            },
        );

        client1.syncManager.addPeer(serverAsPeerForClient1);
        server.syncManager.addPeer(client1AsPeer);

        const client2 = new LocalNode(
            admin,
            newRandomSessionID(admin.id),
            Crypto,
        );

        const [serverAsPeerForClient2, client2AsPeer] = yield* connectedPeers(
            "serverFor2",
            "client2",
            {
                peer1role: "server",
                peer2role: "client",
                trace: true,
            },
        );

        client2.syncManager.addPeer(serverAsPeerForClient2);
        server.syncManager.addPeer(client2AsPeer);

        const mapOnClient2 = yield* Effect.promise(() =>
            client2.loadCoValueCore(map.core.id),
        );
        if (mapOnClient2 === "unavailable") {
            throw new Error("Map is unavailable");
        }

        expect(
            expectMap(mapOnClient2.getCurrentContent()).get("hello"),
        ).toEqual("world");
    }).pipe(Effect.scoped, Effect.runPromise));

test("Can sync a coValue with private transactions through a server to another client", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();

        const client1 = new LocalNode(admin, session, Crypto);

        const group = client1.createGroup();

        const map = group.createMap();
        map.set("hello", "world", "private");

        const [serverUser, serverSession] =
            randomAnonymousAccountAndSessionID();

        const server = new LocalNode(serverUser, serverSession, Crypto);

        const [serverAsPeer, client1AsPeer] = yield* connectedPeers(
            "server",
            "client1",
            {
                trace: true,
                peer1role: "server",
                peer2role: "client",
            },
        );

        client1.syncManager.addPeer(serverAsPeer);
        server.syncManager.addPeer(client1AsPeer);

        const client2 = new LocalNode(
            admin,
            newRandomSessionID(admin.id),
            Crypto,
        );

        const [serverAsOtherPeer, client2AsPeer] = yield* connectedPeers(
            "server",
            "client2",
            {
                trace: true,
                peer1role: "server",
                peer2role: "client",
            },
        );

        client2.syncManager.addPeer(serverAsOtherPeer);
        server.syncManager.addPeer(client2AsPeer);

        const mapOnClient2 = yield* Effect.promise(() =>
            client2.loadCoValueCore(map.core.id),
        );
        if (mapOnClient2 === "unavailable") {
            throw new Error("Map is unavailable");
        }

        expect(
            expectMap(mapOnClient2.getCurrentContent()).get("hello"),
        ).toEqual("world");
    }).pipe(Effect.scoped, Effect.runPromise));

test.skip("When a peer's incoming/readable stream closes, we remove the peer", async () => {
    /*
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const [inRx, inTx] = await Effect.runPromise(newStreamPair());
    const [outRx, outTx] = await Effect.runPromise(newStreamPair());

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    // expect(yield* Queue.take(outRxQ)).toMatchObject({
    //     action: "load",
    //     id: admin.id,
    // });
    expect(yield * Queue.take(outRxQ)).toMatchObject({
        action: "load",
        id: group.core.id,
    });

    const map = group.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(admin.id));
    expect(yield * Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    await inTx.abort();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(node.syncManager.peers["test"]).toBeUndefined();
    */
});

test.skip("When a peer's outgoing/writable stream closes, we remove the peer", async () => {
    /*
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const [inRx] = await Effect.runPromise(newStreamPair());
    const [outRx, outTx] = await Effect.runPromise(newStreamPair());

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    // expect(yield* Queue.take(outRxQ)).toMatchObject({
    //     action: "load",
    //     id: admin.id,
    // });
    expect(yield * Queue.take(outRxQ)).toMatchObject({
        action: "load",
        id: group.core.id,
    });

    const map = group.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect(yield* Queue.take(outRxQ)).toMatchObject(admContEx(admin.id));
    expect(yield * Queue.take(outRxQ)).toMatchObject(groupContentEx(group));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    reader.releaseLock();
    await outRx.cancel();

    map.set("hello", "world", "trusting");

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(node.syncManager.peers["test"]).toBeUndefined();
    */
});

test("If we start loading a coValue before connecting to a peer that has it, it will load it once we connect", () =>
    Effect.gen(function* () {
        const [admin, session] = randomAnonymousAccountAndSessionID();

        const node1 = new LocalNode(admin, session, Crypto);

        const group = node1.createGroup();

        const map = group.createMap();
        map.set("hello", "world", "trusting");

        const node2 = new LocalNode(
            admin,
            newRandomSessionID(admin.id),
            Crypto,
        );

        const [node1asPeer, node2asPeer] = yield* connectedPeers(
            "peer1",
            "peer2",
            {
                peer1role: "server",
                peer2role: "client",
                trace: true,
            },
        );

        node1.syncManager.addPeer(node2asPeer);

        const mapOnNode2Promise = node2.loadCoValueCore(map.core.id);

        expect(node2.coValues[map.core.id]?.state).toEqual("loading");

        node2.syncManager.addPeer(node1asPeer);

        const mapOnNode2 = yield* Effect.promise(() => mapOnNode2Promise);
        if (mapOnNode2 === "unavailable") {
            throw new Error("Map is unavailable");
        }

        expect(expectMap(mapOnNode2.getCurrentContent()).get("hello")).toEqual(
            "world",
        );
    }).pipe(Effect.scoped, Effect.runPromise));

function groupContentEx(group: RawGroup) {
    return {
        action: "content",
        id: group.core.id,
    };
}

function _admContEx(adminID: AccountID) {
    return {
        action: "content",
        id: adminID,
    };
}

function groupStateEx(group: RawGroup) {
    return {
        action: "known",
        id: group.core.id,
    };
}

function _admStateEx(adminID: AccountID) {
    return {
        action: "known",
        id: adminID,
    };
}
