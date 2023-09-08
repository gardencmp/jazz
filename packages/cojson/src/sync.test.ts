import { newRandomSessionID } from "./coValueCore.js";
import { LocalNode } from "./node.js";
import { SyncMessage } from "./sync.js";
import { expectMap } from "./coValue.js";
import { MapOpPayload } from "./coValues/coMap.js";
import { Group } from "./group.js";
import {
    randomAnonymousAccountAndSessionID,
    shouldNotResolve,
} from "./testUtils.js";
import {
    connectedPeers,
    newStreamPair
} from "./streamUtils.js";
import { AccountID } from "./account.js";
import { cojsonReady } from "./index.js";

beforeEach(async () => {
    await cojsonReady;
});

test("Node replies with initial tx and header to empty subscribe", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "load",
        id: map.core.id,
        header: false,
        sessions: {},
    });

    const reader = outRx.getReader();

    // expect((await reader.read()).value).toMatchObject(admStateEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await reader.read()).value).toMatchObject(admContEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const newContentMsg = await reader.read();

    expect(newContentMsg.value).toEqual({
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
                        madeAt: map.core.sessions[node.currentSessionID]!
                            .transactions[0]!.madeAt,
                        changes: [
                            {
                                op: "set",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastSignature:
                    map.core.sessions[node.currentSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("Node replies with only new tx to subscribe with some known state", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
        editable.set("goodbye", "world", "trusting");
    });

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "load",
        id: map.core.id,
        header: true,
        sessions: {
            [node.currentSessionID]: 1,
        },
    });

    const reader = outRx.getReader();

    // expect((await reader.read()).value).toMatchObject(admStateEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await reader.read()).value).toMatchObject(admContEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const mapNewContentMsg = await reader.read();

    expect(mapNewContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: undefined,
        new: {
            [node.currentSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting" as const,
                        madeAt: map.core.sessions[node.currentSessionID]!
                            .transactions[1]!.madeAt,
                        changes: [
                            {
                                op: "set",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastSignature:
                    map.core.sessions[node.currentSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test.todo(
    "TODO: node only replies with new tx to subscribe with some known state, even in the depended on coValues"
);

test("After subscribing, node sends own known state and new txs to peer", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "load",
        id: map.core.id,
        header: false,
        sessions: {
            [node.currentSessionID]: 0,
        },
    });

    const reader = outRx.getReader();

    // expect((await reader.read()).value).toMatchObject(admStateEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await reader.read()).value).toMatchObject(admContEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const mapNewContentHeaderOnlyMsg = await reader.read();

    expect(mapNewContentHeaderOnlyMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const mapEditMsg1 = await reader.read();

    expect(mapEditMsg1.value).toEqual({
        action: "content",
        id: map.core.id,
        new: {
            [node.currentSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting" as const,
                        madeAt: map.core.sessions[node.currentSessionID]!
                            .transactions[0]!.madeAt,
                        changes: [
                            {
                                op: "set",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastSignature:
                    map.core.sessions[node.currentSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("goodbye", "world", "trusting");
    });

    const mapEditMsg2 = await reader.read();

    expect(mapEditMsg2.value).toEqual({
        action: "content",
        id: map.core.id,
        new: {
            [node.currentSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting" as const,
                        madeAt: map.core.sessions[node.currentSessionID]!
                            .transactions[1]!.madeAt,
                        changes: [
                            {
                                op: "set",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastSignature:
                    map.core.sessions[node.currentSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("Client replies with known new content to tellKnownState from server", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const reader = outRx.getReader();

    // expect((await reader.read()).value).toMatchObject(groupStateEx(group));

    const writer = inTx.getWriter();

    await writer.write({
        action: "known",
        id: map.core.id,
        header: false,
        sessions: {
            [node.currentSessionID]: 0,
        },
    });

    // expect((await reader.read()).value).toMatchObject(admStateEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await reader.read()).value).toMatchObject(admContEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const mapNewContentMsg = await reader.read();

    expect(mapNewContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {
            [node.currentSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting" as const,
                        madeAt: map.core.sessions[node.currentSessionID]!
                            .transactions[0]!.madeAt,
                        changes: [
                            {
                                op: "set",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastSignature:
                    map.core.sessions[node.currentSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("No matter the optimistic known state, node respects invalid known state messages and resyncs", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "load",
        id: map.core.id,
        header: false,
        sessions: {
            [node.currentSessionID]: 0,
        },
    });

    const reader = outRx.getReader();

    // expect((await reader.read()).value).toMatchObject(admStateEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupStateEx(group));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await reader.read()).value).toMatchObject(admContEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const mapNewContentHeaderOnlyMsg = await reader.read();

    expect(mapNewContentHeaderOnlyMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    map.edit((editable) => {
        editable.set("goodbye", "world", "trusting");
    });

    const _mapEditMsg1 = await reader.read();
    const _mapEditMsg2 = await reader.read();

    await writer.write({
        action: "known",
        isCorrection: true,
        id: map.core.id,
        header: true,
        sessions: {
            [node.currentSessionID]: 1,
        },
    } satisfies SyncMessage);

    const newContentAfterWrongAssumedState = await reader.read();

    expect(newContentAfterWrongAssumedState.value).toEqual({
        action: "content",
        id: map.core.id,
        header: undefined,
        new: {
            [node.currentSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting" as const,
                        madeAt: map.core.sessions[node.currentSessionID]!
                            .transactions[1]!.madeAt,
                        changes: [
                            {
                                op: "set",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastSignature:
                    map.core.sessions[node.currentSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a peer, but it never subscribes to a coValue, it won't get any messages", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, _inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const reader = outRx.getReader();

    await expect(
        shouldNotResolve(reader.read(), { timeout: 100 })
    ).resolves.toBeUndefined();
});

test("If we add a server peer, all updates to all coValues are sent to it, even if it doesn't subscribe", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, _inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    // expect((await reader.read()).value).toMatchObject({
    //     action: "load",
    //     id: adminID,
    // });
    expect((await reader.read()).value).toMatchObject({
        action: "load",
        id: group.underlyingMap.core.id,
    });

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "load",
        id: map.core.id,
        header: true,
        sessions: {},
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    // expect((await reader.read()).value).toMatchObject(admContEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const mapNewContentMsg = await reader.read();

    expect(mapNewContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {
            [node.currentSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting" as const,
                        madeAt: map.core.sessions[node.currentSessionID]!
                            .transactions[0]!.madeAt,
                        changes: [
                            {
                                op: "set",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastSignature:
                    map.core.sessions[node.currentSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a server peer, newly created coValues are auto-subscribed to", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const [inRx, _inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    // expect((await reader.read()).value).toMatchObject({
    //     action: "load",
    //     id: admin.id,
    // });
    expect((await reader.read()).value).toMatchObject({
        action: "load",
        id: group.underlyingMap.core.id,
    });

    const map = group.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);
});

test.todo(
    "TODO: when receiving a subscribe response that is behind our optimistic state (due to already sent content), we ignore it"
);

test("When we connect a new server peer, we try to sync all existing coValues to it", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, _inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();

    // const _adminSubscribeMessage = await reader.read();
    const groupSubscribeMessage = await reader.read();

    expect(groupSubscribeMessage.value).toEqual({
        action: "load",
        ...group.underlyingMap.core.knownState(),
    } satisfies SyncMessage);

    const secondMessage = await reader.read();

    expect(secondMessage.value).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);
});

test("When receiving a subscribe with a known state that is ahead of our own, peers should respond with a corresponding subscribe response message", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const map = group.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "load",
        id: map.core.id,
        header: true,
        sessions: {
            [node.currentSessionID]: 1,
        },
    });

    const reader = outRx.getReader();

    // expect((await reader.read()).value).toMatchObject(admStateEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupStateEx(group));
    const mapTellKnownState = await reader.read();

    expect(mapTellKnownState.value).toEqual({
        action: "known",
        ...map.core.knownState(),
    } satisfies SyncMessage);
});

test.skip("When replaying creation and transactions of a coValue as new content, the receiving peer integrates this information", async () => {
    // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const node1 = new LocalNode(admin, session);

    const group = node1.createGroup();

    const [inRx1, inTx1] = newStreamPair<SyncMessage>();
    const [outRx1, outTx1] = newStreamPair<SyncMessage>();

    node1.sync.addPeer({
        id: "test2",
        incoming: inRx1,
        outgoing: outTx1,
        role: "server",
    });

    const to1 = inTx1.getWriter();
    const from1 = outRx1.getReader();

    const node2 = new LocalNode(admin, newRandomSessionID(admin.id));

    const [inRx2, inTx2] = newStreamPair<SyncMessage>();
    const [outRx2, outTx2] = newStreamPair<SyncMessage>();

    node2.sync.addPeer({
        id: "test1",
        incoming: inRx2,
        outgoing: outTx2,
        role: "client",
    });

    const to2 = inTx2.getWriter();
    const from2 = outRx2.getReader();

    const adminSubscribeMessage = await from1.read();
    expect(adminSubscribeMessage.value).toMatchObject({
        action: "load",
        id: admin.id,
    });
    const groupSubscribeMsg = await from1.read();
    expect(groupSubscribeMsg.value).toMatchObject({
        action: "load",
        id: group.underlyingMap.core.id,
    });

    await to2.write(adminSubscribeMessage.value!);
    await to2.write(groupSubscribeMsg.value!);

    // const adminTellKnownStateMsg = await from2.read();
    // expect(adminTellKnownStateMsg.value).toMatchObject(admStateEx(admin.id));

    const groupTellKnownStateMsg = await from2.read();
    expect(groupTellKnownStateMsg.value).toMatchObject(groupStateEx(group));

    expect(
        node2.sync.peers["test1"]!.optimisticKnownStates[
            group.underlyingMap.core.id
        ]
    ).toBeDefined();

    // await to1.write(adminTellKnownStateMsg.value!);
    await to1.write(groupTellKnownStateMsg.value!);

    // const adminContentMsg = await from1.read();
    // expect(adminContentMsg.value).toMatchObject(admContEx(admin.id));

    const groupContentMsg = await from1.read();
    expect(groupContentMsg.value).toMatchObject(groupContentEx(group));

    // await to2.write(adminContentMsg.value!);
    await to2.write(groupContentMsg.value!);

    const map = group.createMap();

    const mapSubscriptionMsg = await from1.read();
    expect(mapSubscriptionMsg.value).toMatchObject({
        action: "load",
        id: map.core.id,
    });

    const mapNewContentMsg = await from1.read();
    expect(mapNewContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    await to2.write(mapSubscriptionMsg.value!);

    const mapTellKnownStateMsg = await from2.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "known",
        id: map.core.id,
        header: false,
        sessions: {},
    } satisfies SyncMessage);

    expect(node2.coValues[map.core.id]?.state).toEqual("loading");

    await to2.write(mapNewContentMsg.value!);

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const mapEditMsg = await from1.read();

    await to2.write(mapEditMsg.value!);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.core.id).getCurrentContent()
        ).get("hello")
    ).toEqual("world");
});

test.skip("When loading a coValue on one node, the server node it is requested from replies with all the necessary depended on coValues to make it work", async () => {
    // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const node1 = new LocalNode(admin, session);

    const group = node1.createGroup();

    const map = group.createMap();
    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const node2 = new LocalNode(admin, newRandomSessionID(admin.id));

    const [node1asPeer, node2asPeer] = connectedPeers("peer1", "peer2");

    node1.sync.addPeer(node2asPeer);
    node2.sync.addPeer(node1asPeer);

    await node2.loadCoValue(map.core.id);

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.core.id).getCurrentContent()
        ).get("hello")
    ).toEqual("world");
});

test("Can sync a coValue through a server to another client", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const client1 = new LocalNode(admin, session);

    const group = client1.createGroup();

    const map = group.createMap();
    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const [serverUser, serverSession] = randomAnonymousAccountAndSessionID();

    const server = new LocalNode(serverUser, serverSession);

    const [serverAsPeer, client1AsPeer] = connectedPeers("server", "client1", {
        peer1role: "server",
        peer2role: "client",
    });

    client1.sync.addPeer(serverAsPeer);
    server.sync.addPeer(client1AsPeer);

    const client2 = new LocalNode(admin, newRandomSessionID(admin.id));

    const [serverAsOtherPeer, client2AsPeer] = connectedPeers(
        "server",
        "client2",
        { peer1role: "server", peer2role: "client" }
    );

    client2.sync.addPeer(serverAsOtherPeer);
    server.sync.addPeer(client2AsPeer);

    const mapOnClient2 = await client2.loadCoValue(map.core.id);

    expect(expectMap(mapOnClient2.getCurrentContent()).get("hello")).toEqual(
        "world"
    );
});

test("Can sync a coValue with private transactions through a server to another client", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const client1 = new LocalNode(admin, session);

    const group = client1.createGroup();

    const map = group.createMap();
    map.edit((editable) => {
        editable.set("hello", "world", "private");
    });

    const [serverUser, serverSession] = randomAnonymousAccountAndSessionID();

    const server = new LocalNode(serverUser, serverSession);

    const [serverAsPeer, client1AsPeer] = connectedPeers("server", "client1", {
        trace: true,
        peer1role: "server",
        peer2role: "client",
    });

    client1.sync.addPeer(serverAsPeer);
    server.sync.addPeer(client1AsPeer);

    const client2 = new LocalNode(admin, newRandomSessionID(admin.id));

    const [serverAsOtherPeer, client2AsPeer] = connectedPeers(
        "server",
        "client2",
        { trace: true, peer1role: "server", peer2role: "client" }
    );

    client2.sync.addPeer(serverAsOtherPeer);
    server.sync.addPeer(client2AsPeer);

    const mapOnClient2 = await client2.loadCoValue(map.core.id);

    expect(expectMap(mapOnClient2.getCurrentContent()).get("hello")).toEqual(
        "world"
    );
});

test("When a peer's incoming/readable stream closes, we remove the peer", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    // expect((await reader.read()).value).toMatchObject({
    //     action: "load",
    //     id: admin.id,
    // });
    expect((await reader.read()).value).toMatchObject({
        action: "load",
        id: group.underlyingMap.core.id,
    });

    const map = group.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await reader.read()).value).toMatchObject(admContEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    await inTx.abort();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(node.sync.peers["test"]).toBeUndefined();
});

test("When a peer's outgoing/writable stream closes, we remove the peer", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session);

    const group = node.createGroup();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    // expect((await reader.read()).value).toMatchObject({
    //     action: "load",
    //     id: admin.id,
    // });
    expect((await reader.read()).value).toMatchObject({
        action: "load",
        id: group.underlyingMap.core.id,
    });

    const map = group.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "load",
        ...map.core.knownState(),
    } satisfies SyncMessage);

    // expect((await reader.read()).value).toMatchObject(admContEx(admin.id));
    expect((await reader.read()).value).toMatchObject(groupContentEx(group));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "content",
        id: map.core.id,
        header: map.core.header,
        new: {},
    } satisfies SyncMessage);

    reader.releaseLock();
    await outRx.cancel();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(node.sync.peers["test"]).toBeUndefined();
});

test("If we start loading a coValue before connecting to a peer that has it, it will load it once we connect", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();

    const node1 = new LocalNode(admin, session);

    const group = node1.createGroup();

    const map = group.createMap();
    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const node2 = new LocalNode(admin, newRandomSessionID(admin.id));

    const [node1asPeer, node2asPeer] = connectedPeers("peer1", "peer2", {
        peer1role: "server",
        peer2role: "client",
        trace: true,
    });

    node1.sync.addPeer(node2asPeer);

    const mapOnNode2Promise = node2.loadCoValue(map.core.id);

    expect(node2.coValues[map.core.id]?.state).toEqual("loading");

    node2.sync.addPeer(node1asPeer);

    const mapOnNode2 = await mapOnNode2Promise;

    expect(expectMap(mapOnNode2.getCurrentContent()).get("hello")).toEqual(
        "world"
    );
});

function groupContentEx(group: Group) {
    return {
        action: "content",
        id: group.underlyingMap.core.id,
    };
}

function admContEx(adminID: AccountID) {
    return {
        action: "content",
        id: adminID,
    };
}

function groupStateEx(group: Group) {
    return {
        action: "known",
        id: group.underlyingMap.core.id,
    };
}

function admStateEx(adminID: AccountID) {
    return {
        action: "known",
        id: adminID,
    };
}
