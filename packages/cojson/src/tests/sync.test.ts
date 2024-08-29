import { expect, test } from "vitest";
import { LocalNode } from "../localNode.js";
import { SyncMessage } from "../sync.js";
import { MapOpPayload } from "../coValues/coMap.js";
import { RawGroup } from "../coValues/group.js";
import { randomAnonymousAccountAndSessionID } from "./testUtils.js";
import { connectedPeers, newQueuePair } from "../streamUtils.js";
import { RawAccountID } from "../coValues/account.js";
import { stableStringify } from "../jsonStringify.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import { expectMap } from "../coValue.js";
import { newRandomSessionID } from "../coValueCore.js";

const Crypto = await WasmCrypto.create();

test("Node replies with initial tx and header to empty subscribe", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    map.set("hello", "world", "trusting");

    const [inRx, inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
        crashOnClose: true,
    });

    await inTx.push({
        action: "load",
        id: map.core.id,
        header: false,
        sessions: {},
    });

    // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = (await outRxQ.next()).value;
    expect(mapTellKnownStateMsg).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

    const newContentMsg = (await outRxQ.next()).value;

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
                        madeAt: map.core.sessionLogs.get(node.currentSessionID)!
                            .transactions[0]!.madeAt,
                        changes: stableStringify([
                            {
                                op: "set",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ]),
                    },
                ],
                lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
                    .lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("Node replies with only new tx to subscribe with some known state", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    map.set("hello", "world", "trusting");
    map.set("goodbye", "world", "trusting");

    const [inRx, inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
        crashOnClose: true,
    });

    await inTx.push({
        action: "load",
        id: map.core.id,
        header: true,
        sessions: {
            [node.currentSessionID]: 1,
        },
    });

    // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = (await outRxQ.next()).value;
    expect(mapTellKnownStateMsg).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

    const mapNewContentMsg = (await outRxQ.next()).value;

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
                        madeAt: map.core.sessionLogs.get(node.currentSessionID)!
                            .transactions[1]!.madeAt,
                        changes: stableStringify([
                            {
                                op: "set",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ]),
                    },
                ],
                lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
                    .lastSignature!,
            },
        },
    } satisfies SyncMessage);
});
test.todo(
    "TODO: node only replies with new tx to subscribe with some known state, even in the depended on coValues",
);

test("After subscribing, node sends own known state and new txs to peer", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
        crashOnClose: true,
    });

    await inTx.push({
        action: "load",
        id: map.core.id,
        header: false,
        sessions: {
            [node.currentSessionID]: 0,
        },
    });

    // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = (await outRxQ.next()).value;
    expect(mapTellKnownStateMsg).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

    const mapNewContentHeaderOnlyMsg = (await outRxQ.next()).value;

    expect(mapNewContentHeaderOnlyMsg).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    map.set("hello", "world", "trusting");

    const mapEditMsg1 = (await outRxQ.next()).value;

    expect(mapEditMsg1).toEqual({
        action: "content",
        id: map.core.id,
        new: {
            [node.currentSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting" as const,
                        madeAt: map.core.sessionLogs.get(node.currentSessionID)!
                            .transactions[0]!.madeAt,
                        changes: stableStringify([
                            {
                                op: "set",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ]),
                    },
                ],
                lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
                    .lastSignature!,
            },
        },
    } satisfies SyncMessage);

    map.set("goodbye", "world", "trusting");

    const mapEditMsg2 = (await outRxQ.next()).value;

    expect(mapEditMsg2).toEqual({
        action: "content",
        id: map.core.id,
        new: {
            [node.currentSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting" as const,
                        madeAt: map.core.sessionLogs.get(node.currentSessionID)!
                            .transactions[1]!.madeAt,
                        changes: stableStringify([
                            {
                                op: "set",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ]),
                    },
                ],
                lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
                    .lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("Client replies with known new content to tellKnownState from server", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    map.set("hello", "world", "trusting");

    const [inRx, inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
        crashOnClose: true,
    });

    // expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

    await inTx.push({
        action: "known",
        id: map.core.id,
        header: false,
        sessions: {
            [node.currentSessionID]: 0,
        },
    });

    // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = (await outRxQ.next()).value;
    expect(mapTellKnownStateMsg).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

    const mapNewContentMsg = (await outRxQ.next()).value;

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
                        madeAt: map.core.sessionLogs.get(node.currentSessionID)!
                            .transactions[0]!.madeAt,
                        changes: stableStringify([
                            {
                                op: "set",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ]),
                    },
                ],
                lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
                    .lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("No matter the optimistic known state, node respects invalid known state messages and resyncs", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
        crashOnClose: true,
    });

    await inTx.push({
        action: "load",
        id: map.core.id,
        header: false,
        sessions: {
            [node.currentSessionID]: 0,
        },
    });

    // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = (await outRxQ.next()).value;
    expect(mapTellKnownStateMsg).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

    const mapNewContentHeaderOnlyMsg = (await outRxQ.next()).value;

    expect(mapNewContentHeaderOnlyMsg).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    map.set("hello", "world", "trusting");

    map.set("goodbye", "world", "trusting");

    const _mapEditMsgs = (await outRxQ.next()).value;

    console.log("Sending correction");

    await inTx.push({
        action: "known",
        isCorrection: true,
        id: map.core.id,
        header: true,
        sessions: {
            [node.currentSessionID]: 1,
        },
    } satisfies SyncMessage);

    const newContentAfterWrongAssumedState = (await outRxQ.next()).value;

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
                        madeAt: map.core.sessionLogs.get(node.currentSessionID)!
                            .transactions[1]!.madeAt,
                        changes: stableStringify([
                            {
                                op: "set",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ]),
                    },
                ],
                lastSignature: map.core.sessionLogs.get(node.currentSessionID)!
                    .lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a peer, but it never subscribes to a coValue, it won't get any messages", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, _inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
        crashOnClose: true,
    });

    map.set("hello", "world", "trusting");

    const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve("neverHappened"), 100),
    );

    const result = await Promise.race([
        outRxQ.next().then((value) => value.value),
        timeoutPromise,
    ]);

    expect(result).toEqual("neverHappened");
});

test.todo(
    "If we add a server peer, all updates to all coValues are sent to it, even if it doesn't subscribe",
    async () => {
        const [admin, session] = randomAnonymousAccountAndSessionID();
        const node = new LocalNode(admin, session, Crypto);

        const group = node.createGroup();

        const map = group.createMap();

        const [inRx, _inTx] = newQueuePair();
        const [outRx, outTx] = newQueuePair();
        const outRxQ = outRx[Symbol.asyncIterator]();

        node.syncManager.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "server",
            crashOnClose: true,
        });

        // expect((await outRxQ.next()).value).toMatchObject({
        //     action: "load",
        //     id: adminID,
        // });
        expect((await outRxQ.next()).value).toMatchObject({
            action: "load",
            id: group.core.id,
        });

        const mapSubscribeMsg = (await outRxQ.next()).value;

        expect(mapSubscribeMsg).toEqual({
            action: "load",
            id: map.core.id,
            header: true,
            sessions: {},
        } satisfies SyncMessage);

        map.set("hello", "world", "trusting");

        // expect((await outRxQ.next()).value).toMatchObject(admContEx(admin.id));
        expect((await outRxQ.next()).value).toMatchObject(
            groupContentEx(group),
        );

        const mapNewContentMsg = (await outRxQ.next()).value;

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
    },
);

test.skip("If we add a server peer, newly created coValues are auto-subscribed to", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const [inRx, _inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
        crashOnClose: true,
    });

    // expect((await outRxQ.next()).value).toMatchObject({
    //     action: "load",
    //     id: admin.id,
    // });
    expect((await outRxQ.next()).value).toMatchObject({
        action: "load",
        id: group.core.id,
    });

    const map = group.createMap();

    const mapSubscribeMsg = (await outRxQ.next()).value;

    expect(mapSubscribeMsg).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await outRxQ.next()).value).toMatchObject(admContEx(adminID));
    expect((await outRxQ.next()).value).toMatchObject(groupContentEx(group));

    const mapContentMsg = (await outRxQ.next()).value;

    expect(mapContentMsg).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);
});

test.todo(
    "TODO: when receiving a subscribe response that is behind our optimistic state (due to already sent content), we ignore it",
);

test("When we connect a new server peer, we try to sync all existing coValues to it", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, _inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
        crashOnClose: true,
    });

    // const _adminSubscribeMessage = await outRxQ.next();
    const groupSubscribeMessage = (await outRxQ.next()).value;

    expect(groupSubscribeMessage).toEqual({
        action: "load",
        ...group.core.knownState(),
    } satisfies SyncMessage);

    const secondMessage = (await outRxQ.next()).value;

    expect(secondMessage).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);
});

test("When receiving a subscribe with a known state that is ahead of our own, peers should respond with a corresponding subscribe response message", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, inTx] = newQueuePair();
    const [outRx, outTx] = newQueuePair();
    const outRxQ = outRx[Symbol.asyncIterator]();

    node.syncManager.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
        crashOnClose: true,
    });

    await inTx.push({
        action: "load",
        id: map.core.id,
        header: true,
        sessions: {
            [node.currentSessionID]: 1,
        },
    });

    // expect((await outRxQ.next()).value).toMatchObject(admStateEx(admin.id));
    expect((await outRxQ.next()).value).toMatchObject(groupStateEx(group));
    const mapTellKnownState = (await outRxQ.next()).value;

    expect(mapTellKnownState).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);
});

test.skip("When replaying creation and transactions of a coValue as new content, the receiving peer integrates this information", async () => {
    // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const node1 = new LocalNode(admin, session, Crypto);

    const group = node1.createGroup();

    const [inRx1, inTx1] = newQueuePair();
    const [outRx1, outTx1] = newQueuePair();
    const outRxQ1 = outRx1[Symbol.asyncIterator]();

    node1.syncManager.addPeer({
        id: "test2",
        incoming: inRx1,
        outgoing: outTx1,
        role: "server",
        crashOnClose: true,
    });

    const node2 = new LocalNode(admin, newRandomSessionID(admin.id), Crypto);

    const [inRx2, inTx2] = newQueuePair();
    const [outRx2, outTx2] = newQueuePair();
    const outRxQ2 = outRx2[Symbol.asyncIterator]();

    node2.syncManager.addPeer({
        id: "test1",
        incoming: inRx2,
        outgoing: outTx2,
        role: "client",
        crashOnClose: true,
    });

    const adminSubscribeMessage = (await outRxQ1.next()).value;
    expect(adminSubscribeMessage).toMatchObject({
        action: "load",
        id: admin.id,
    });
    const groupSubscribeMsg = (await outRxQ1.next()).value;
    expect(groupSubscribeMsg).toMatchObject({
        action: "load",
        id: group.core.id,
    });

    await inTx2.push(adminSubscribeMessage);
    await inTx2.push(groupSubscribeMsg);

    // const adminTellKnownStateMsg = (await outRxQ2.next()).value;
    // expect(adminTellKnownStateMsg).toMatchObject(admStateEx(admin.id));

    const groupTellKnownStateMsg = (await outRxQ2.next()).value;
    expect(groupTellKnownStateMsg).toMatchObject(groupStateEx(group));

    expect(
        node2.syncManager.peers["test1"]!.optimisticKnownStates[group.core.id],
    ).toBeDefined();

    // await inTx1.push(adminTellKnownStateMsg);
    await inTx1.push(groupTellKnownStateMsg);

    // const adminContentMsg = (await outRxQ1.next()).value;
    // expect(adminContentMsg).toMatchObject(admContEx(admin.id));

    const groupContentMsg = (await outRxQ1.next()).value;
    expect(groupContentMsg).toMatchObject(groupContentEx(group));

    // await inTx2.push(adminContentMsg);
    await inTx2.push(groupContentMsg);

    const map = group.createMap();

    const mapSubscriptionMsg = (await outRxQ1.next()).value;
    expect(mapSubscriptionMsg).toMatchObject({
        action: "load",
        id: map.core.id,
    });

    const mapNewContentMsg = (await outRxQ1.next()).value;
    expect(mapNewContentMsg).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    await inTx2.push(mapSubscriptionMsg);

    const mapTellKnownStateMsg = (await outRxQ2.next()).value;
    expect(mapTellKnownStateMsg).toEqual({
        action: "known",
        id: map.core.id,
        header: false,
        sessions: {},
    } satisfies SyncMessage);

    expect(node2.coValues[map.core.id]?.state).toEqual("loading");

    await inTx2.push(mapNewContentMsg);

    map.set("hello", "world", "trusting");

    const mapEditMsg = (await outRxQ1.next()).value;

    await inTx2.push(mapEditMsg);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.core.id).getCurrentContent(),
        ).get("hello"),
    ).toEqual("world");
});

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

test("Can sync a coValue through a server to another client", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const client1 = new LocalNode(admin, session, Crypto);

    const group = client1.createGroup();

    const map = group.createMap();
    map.set("hello", "world", "trusting");

    const [serverUser, serverSession] = randomAnonymousAccountAndSessionID();

    const server = new LocalNode(serverUser, serverSession, Crypto);

    const [serverAsPeerForClient1, client1AsPeer] = await connectedPeers(
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

    const client2 = new LocalNode(admin, newRandomSessionID(admin.id), Crypto);

    const [serverAsPeerForClient2, client2AsPeer] = connectedPeers(
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

    const mapOnClient2 = await client2.loadCoValueCore(map.core.id);
    if (mapOnClient2 === "unavailable") {
        throw new Error("Map is unavailable");
    }

    expect(expectMap(mapOnClient2.getCurrentContent()).get("hello")).toEqual(
        "world",
    );
});

test("Can sync a coValue with private transactions through a server to another client", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const client1 = new LocalNode(admin, session, Crypto);

    const group = client1.createGroup();

    const map = group.createMap();
    map.set("hello", "world", "private");

    const [serverUser, serverSession] = randomAnonymousAccountAndSessionID();

    const server = new LocalNode(serverUser, serverSession, Crypto);

    const [serverAsPeer, client1AsPeer] = await connectedPeers(
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

    const client2 = new LocalNode(admin, newRandomSessionID(admin.id), Crypto);

    const [serverAsOtherPeer, client2AsPeer] = await connectedPeers(
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

    const mapOnClient2 = await client2.loadCoValueCore(map.core.id);
    if (mapOnClient2 === "unavailable") {
        throw new Error("Map is unavailable");
    }

    expect(expectMap(mapOnClient2.getCurrentContent()).get("hello")).toEqual(
        "world",
    );
});

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

test("If we start loading a coValue before connecting to a peer that has it, it will load it once we connect", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const node1 = new LocalNode(admin, session, Crypto);

    const group = node1.createGroup();

    const map = group.createMap();
    map.set("hello", "world", "trusting");

    const node2 = new LocalNode(admin, newRandomSessionID(admin.id), Crypto);

    const [node1asPeer, node2asPeer] = await connectedPeers("peer1", "peer2", {
        peer1role: "server",
        peer2role: "client",
        trace: true,
    });

    node1.syncManager.addPeer(node2asPeer);

    const mapOnNode2Promise = node2.loadCoValueCore(map.core.id);

    expect(node2.coValues[map.core.id]?.state).toEqual("loading");

    node2.syncManager.addPeer(node1asPeer);

    const mapOnNode2 = await mapOnNode2Promise;
    if (mapOnNode2 === "unavailable") {
        throw new Error("Map is unavailable");
    }

    expect(expectMap(mapOnNode2.getCurrentContent()).get("hello")).toEqual(
        "world",
    );
});

function groupContentEx(group: RawGroup) {
    return {
        action: "content",
        id: group.core.id,
    };
}

function _admContEx(adminID: RawAccountID) {
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

function _admStateEx(adminID: RawAccountID) {
    return {
        action: "known",
        id: adminID,
    };
}
