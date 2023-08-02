import { test, expect } from "bun:test";
import {
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./coValue";
import { LocalNode } from "./node";
import { Peer, SyncMessage } from "./sync";
import { MapOpPayload, expectMap } from "./contentType";

test(
    "Node replies with initial tx and header to empty subscribe",
    async () => {
        const admin = newRandomAgentCredential();
        const adminID = getAgentID(getAgent(admin));

        const node = new LocalNode(admin, newRandomSessionID(adminID));

        const team = node.createTeam();

        const map = team.createMap();

        map.edit((editable) => {
            editable.set("hello", "world", "trusting");
        });

        const [inRx, inTx] = newStreamPair<SyncMessage>();
        const [outRx, outTx] = newStreamPair<SyncMessage>();

        node.addPeer({
            id: "test",
            incoming: inRx,
            outgoing: outTx,
            role: "peer",
        });

        const writer = inTx.getWriter();

        await writer.write({
            action: "subscribe",
            knownState: {
                coValueID: map.coValue.id,
                header: false,
                sessions: {},
            },
        });

        const reader = outRx.getReader();

        const _adminSubscribeResponseMsg = await reader.read();
        const _adminNewContentMsg = await reader.read();
        const _teamSubscribeResponseMsg = await reader.read();
        const _teamNewContentMsg = await reader.read();

        const subscribeResponseMsg = await reader.read();

        expect(subscribeResponseMsg.value).toEqual({
            action: "subscribeResponse",
            knownState: map.coValue.knownState(),
        } satisfies SyncMessage);

        const newContentMsg = await reader.read();

        expect(newContentMsg.value).toEqual({
            action: "newContent",
            coValueID: map.coValue.id,
            header: {
                type: "comap",
                ruleset: { type: "ownedByTeam", team: team.id },
                meta: null,
            },
            newContent: {
                [node.ownSessionID]: {
                    after: 0,
                    newTransactions: [
                        {
                            privacy: "trusting",
                            madeAt: map.coValue.sessions[node.ownSessionID]
                                .transactions[0].madeAt,
                            changes: [
                                {
                                    op: "insert",
                                    key: "hello",
                                    value: "world",
                                } satisfies MapOpPayload<string, string>,
                            ],
                        },
                    ],
                    lastHash:
                        map.coValue.sessions[node.ownSessionID].lastHash!,
                    lastSignature:
                        map.coValue.sessions[node.ownSessionID].lastSignature!,
                },
            },
        } satisfies SyncMessage);
    },
    { timeout: 100 }
);

test("Node replies with only new tx to subscribe with some known state", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
        editable.set("goodbye", "world", "trusting");
    });

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "subscribe",
        knownState: {
            coValueID: map.coValue.id,
            header: true,
            sessions: {
                [node.ownSessionID]: 1,
            },
        },
    });

    const reader = outRx.getReader();

    const _adminSubscribeResponseMsg = await reader.read();
    const _adminNewContentMsg = await reader.read();
    const _teamSubscribeResponseMsg = await reader.read();
    const _teamNewContentMsg = await reader.read();

    const mapSubscribeResponseMsg = await reader.read();

    expect(mapSubscribeResponseMsg.value).toEqual({
        action: "subscribeResponse",
        knownState: map.coValue.knownState(),
    } satisfies SyncMessage);

    const mapNewContentMsg = await reader.read();

    expect(mapNewContentMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: undefined,
        newContent: {
            [node.ownSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.coValue.sessions[node.ownSessionID]
                            .transactions[1].madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test.skip("TODO: node only replies with new tx to subscribe with some known state, even in the depended on coValues", () => {});

test("After subscribing, node sends own known state and new txs to peer", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "subscribe",
        knownState: {
            coValueID: map.coValue.id,
            header: false,
            sessions: {
                [node.ownSessionID]: 0,
            },
        },
    });

    const reader = outRx.getReader();

    const _adminSubscribeResponseMsg = await reader.read();
    const _adminNewContentMsg = await reader.read();
    const _teamSubscribeResponseMsg = await reader.read();
    const _teamNewContentMsg = await reader.read();

    const mapSubscribeResponseMsg = await reader.read();

    expect(mapSubscribeResponseMsg.value).toEqual({
        action: "subscribeResponse",
        knownState: map.coValue.knownState(),
    } satisfies SyncMessage);

    const mapNewContentHeaderOnlyMsg = await reader.read();

    expect(mapNewContentHeaderOnlyMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {},
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const mapEditMsg1 = await reader.read();

    expect(mapEditMsg1.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        newContent: {
            [node.ownSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.coValue.sessions[node.ownSessionID]
                            .transactions[0].madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("goodbye", "world", "trusting");
    });

    const mapEditMsg2 = await reader.read();

    expect(mapEditMsg2.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        newContent: {
            [node.ownSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.coValue.sessions[node.ownSessionID]
                            .transactions[1].madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("Client replies with known new content to subscribeResponse from server", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "subscribeResponse",
        knownState: {
            coValueID: map.coValue.id,
            header: false,
            sessions: {
                [node.ownSessionID]: 0,
            },
        },
    });

    const reader = outRx.getReader();

    const msg1 = await reader.read();

    expect(msg1.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {
            [node.ownSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.coValue.sessions[node.ownSessionID]
                            .transactions[0].madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("No matter the optimistic known state, node respects invalid known state messages and resyncs", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "subscribe",
        knownState: {
            coValueID: map.coValue.id,
            header: false,
            sessions: {
                [node.ownSessionID]: 0,
            },
        },
    });

    const reader = outRx.getReader();

    const _adminSubscribeResponseMsg = await reader.read();
    const _adminNewContentMsg = await reader.read();
    const _teamSubscribeResponseMsg = await reader.read();
    const _teamNewContentMsg = await reader.read();
    const _mapSubscribeResponseMsg = await reader.read();
    const _mapNewContentHeaderOnlyMsg = await reader.read();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    map.edit((editable) => {
        editable.set("goodbye", "world", "trusting");
    });

    const _mapEditMsg1 = await reader.read();
    const _mapEditMsg2 = await reader.read();

    await writer.write({
        action: "wrongAssumedKnownState",
        knownState: {
            coValueID: map.coValue.id,
            header: true,
            sessions: {
                [node.ownSessionID]: 1,
            },
        },
    } satisfies SyncMessage);

    const newContentAfterWrongAssumedState = await reader.read();

    expect(newContentAfterWrongAssumedState.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: undefined,
        newContent: {
            [node.ownSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.coValue.sessions[node.ownSessionID]
                            .transactions[1].madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a peer, but it never subscribes to a coValue, it won't get any messages", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const reader = outRx.getReader();

    await shouldNotResolve(reader.read(), { timeout: 50 });
});

test("If we add a server peer, all updates to all coValues are sent to it, even if it doesn't subscribe", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const reader = outRx.getReader();
    const _adminSubscribeMsg = await reader.read();
    const _teamSubscribeMsg = await reader.read();

    const subscribeMsg = await reader.read();

    expect(subscribeMsg.value).toEqual({
        action: "subscribe",
        knownState: {
            coValueID: map.coValue.id,
            header: true,
            sessions: {},
        },
    } satisfies SyncMessage);

    const newContentMsg = await reader.read();

    expect(newContentMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {
            [node.ownSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.coValue.sessions[node.ownSessionID]
                            .transactions[0].madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a server peer, newly created coValues are auto-subscribed to", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    team.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    const _initialMsg1 = await reader.read();
    const _initialMsg2 = await reader.read();

    const map = team.createMap();

    const msg1 = await reader.read();

    expect(msg1.value).toEqual({
        action: "subscribe",
        knownState: map.coValue.knownState(),
    } satisfies SyncMessage);

    const msg2 = await reader.read();

    expect(msg2.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {},
    } satisfies SyncMessage);
});

test.skip("TODO: when receiving a subscribe response that is behind our optimistic state (due to already sent content), we ignore it", () => {});

test("When we connect a new server peer, we try to sync all existing coValues to it", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();

    const _adminSubscribeMessage = await reader.read();
    const teamSubscribeMessage = await reader.read();

    expect(teamSubscribeMessage.value).toEqual({
        action: "subscribe",
        knownState: team.teamMap.coValue.knownState(),
    } satisfies SyncMessage);

    const secondMessage = await reader.read();

    expect(secondMessage.value).toEqual({
        action: "subscribe",
        knownState: map.coValue.knownState(),
    } satisfies SyncMessage);
});

test("When receiving a subscribe with a known state that is ahead of our own, peers should respond with a corresponding subscribe response message", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "subscribe",
        knownState: {
            coValueID: map.coValue.id,
            header: true,
            sessions: {
                [node.ownSessionID]: 1,
            },
        },
    });

    const reader = outRx.getReader();

    const _adminSubscribeResponseMsg = await reader.read();
    const _adminNewContentMsg = await reader.read();
    const _teamSubscribeResponseMsg = await reader.read();
    const _teamNewContentMsg = await reader.read();
    const mapSubscribeResponse = await reader.read();

    expect(mapSubscribeResponse.value).toEqual({
        action: "subscribeResponse",
        knownState: map.coValue.knownState(),
    } satisfies SyncMessage);
});

test("When replaying creation and transactions of a coValue as new content, the receiving peer integrates this information", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node1 = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node1.createTeam();

    const [inRx1, inTx1] = newStreamPair<SyncMessage>();
    const [outRx1, outTx1] = newStreamPair<SyncMessage>();

    node1.addPeer({
        id: "test2",
        incoming: inRx1,
        outgoing: outTx1,
        role: "server",
    });

    const reader1 = outRx1.getReader();

    const _adminSubscriptionMsg = await reader1.read();
    const teamSubscribeMsg = await reader1.read();

    const map = team.createMap();

    const mapSubscriptionMsg = await reader1.read();
    const mapNewContentMsg = await reader1.read();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const mapEditMsg = await reader1.read();

    const node2 = new LocalNode(admin, newRandomSessionID(adminID));

    const [inRx2, inTx2] = newStreamPair<SyncMessage>();
    const [outRx2, outTx2] = newStreamPair<SyncMessage>();

    node2.addPeer({
        id: "test1",
        incoming: inRx2,
        outgoing: outTx2,
        role: "client",
    });

    const writer2 = inTx2.getWriter();
    const reader2 = outRx2.getReader();

    await writer2.write(teamSubscribeMsg.value);
    const teamSubscribeResponseMsg = await reader2.read();

    expect(node2.coValues[team.teamMap.coValue.id]?.state).toEqual("loading");

    const writer1 = inTx1.getWriter();

    await writer1.write(teamSubscribeResponseMsg.value);
    const teamContentMsg = await reader1.read();

    await writer2.write(teamContentMsg.value);

    await writer2.write(mapSubscriptionMsg.value);
    const _mapSubscribeResponseMsg = await reader2.read();
    await writer2.write(mapNewContentMsg.value);

    expect(node2.coValues[map.coValue.id]?.state).toEqual("loading");

    await writer2.write(mapEditMsg.value);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.coValue.id).getCurrentContent()
        ).get("hello")
    ).toEqual("world");
});

test("When loading a coValue on one node, the server node it is requested from replies with all the necessary depended on coValues to make it work", async () => {
    const admin = newRandomAgentCredential();
    const adminID = getAgentID(getAgent(admin));

    const node1 = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node1.createTeam();

    const map = team.createMap();
    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const node2 = new LocalNode(admin, newRandomSessionID(adminID));

    const [node2asPeer, node1asPeer] = connectedPeers();

    node1.addPeer(node2asPeer);
    node2.addPeer(node1asPeer);

    await node2.loadCoValue(map.coValue.id);

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.coValue.id).getCurrentContent()
        ).get("hello")
    ).toEqual("world");
});

function newStreamPair<T>(): [ReadableStream<T>, WritableStream<T>] {
    const queue: T[] = [];
    let resolveNextItemReady: () => void = () => {};
    let nextItemReady: Promise<void> = new Promise((resolve) => {
        resolveNextItemReady = resolve;
    });

    const readable = new ReadableStream<T>({
        async pull(controller) {
            while (true) {
                if (queue.length > 0) {
                    controller.enqueue(queue.shift());
                    if (queue.length === 0) {
                        nextItemReady = new Promise((resolve) => {
                            resolveNextItemReady = resolve;
                        });
                    }
                    return;
                } else {
                    await nextItemReady;
                }
            }
        },
    });

    const writable = new WritableStream<T>({
        write(chunk) {
            queue.push(chunk);
            if (queue.length === 1) {
                resolveNextItemReady();
            }
        },
    });

    return [readable, writable];
}

function shouldNotResolve(promise: Promise<any>, ops: { timeout: number }) {
    return new Promise((resolve, reject) => {
        promise.then((v) =>
            reject(
                new Error(
                    "Should not have resolved, but resolved to " +
                        JSON.stringify(v)
                )
            )
        );
        setTimeout(resolve, ops.timeout);
    });
}

function connectedPeers(trace?: boolean): [Peer, Peer] {
    const [inRx1, inTx1] = newStreamPair<SyncMessage>();
    const [outRx1, outTx1] = newStreamPair<SyncMessage>();

    const [inRx2, inTx2] = newStreamPair<SyncMessage>();
    const [outRx2, outTx2] = newStreamPair<SyncMessage>();

    outRx2
        .pipeThrough(
            new TransformStream({
                transform(chunk, controller) {
                    trace && console.log("peer 2 -> peer 1", chunk);
                    controller.enqueue(chunk);
                },
            })
        )
        .pipeTo(inTx1);

    outRx1
        .pipeThrough(
            new TransformStream({
                transform(chunk, controller) {
                    trace && console.log("peer 1 -> peer 2", chunk);
                    controller.enqueue(chunk);
                },
            })
        )
        .pipeTo(inTx2);

    const peer2AsPeer: Peer = {
        id: "test2",
        incoming: inRx1,
        outgoing: outTx1,
        role: "peer",
    };

    const peer1AsPeer: Peer = {
        id: "test1",
        incoming: inRx2,
        outgoing: outTx2,
        role: "peer",
    };

    return [peer2AsPeer, peer1AsPeer];
}
