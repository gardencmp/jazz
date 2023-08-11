import {
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from './coValue.js';
import { LocalNode } from './node.js';
import { Peer, PeerID, SyncMessage } from './sync.js';
import { expectMap } from './contentType.js';
import { MapOpPayload } from './contentTypes/coMap.js';
import { Team } from './permissions.js';
import {
    ReadableStream,
    WritableStream,
    TransformStream,
} from "isomorphic-streams";
import { AgentID } from './ids.js';

test(
    "Node replies with initial tx and header to empty subscribe",
    async () => {
        const admin = newRandomAgentCredential("admin");
        const adminID = getAgentID(getAgent(admin));

        const node = new LocalNode(admin, newRandomSessionID(adminID));

        const team = node.createTeam();

        const map = team.createMap();

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
            action: "subscribe",
            coValueID: map.coValue.id,
            header: false,
            sessions: {},
        });

        const reader = outRx.getReader();

        expect((await reader.read()).value).toMatchObject(admStateEx(adminID));
        expect((await reader.read()).value).toMatchObject(teamStateEx(team));

        const mapTellKnownStateMsg = await reader.read();
        expect(mapTellKnownStateMsg.value).toEqual({
            action: "tellKnownState",
            ...map.coValue.knownState(),
        } satisfies SyncMessage);

        expect((await reader.read()).value).toMatchObject(admContEx(adminID));
        expect((await reader.read()).value).toMatchObject(teamContentEx(team));

        const newContentMsg = await reader.read();

        expect(newContentMsg.value).toEqual({
            action: "newContent",
            coValueID: map.coValue.id,
            header: {
                type: "comap",
                ruleset: { type: "ownedByTeam", team: team.id },
                meta: null,
                createdAt: map.coValue.header.createdAt,
                uniqueness: map.coValue.header.uniqueness,
                publicNickname: "map",
            },
            newContent: {
                [node.ownSessionID]: {
                    after: 0,
                    newTransactions: [
                        {
                            privacy: "trusting",
                            madeAt: map.coValue.sessions[node.ownSessionID]!
                                .transactions[0]!.madeAt,
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
                        map.coValue.sessions[node.ownSessionID]!.lastHash!,
                    lastSignature:
                        map.coValue.sessions[node.ownSessionID]!.lastSignature!,
                },
            },
        } satisfies SyncMessage);
    },
);

test("Node replies with only new tx to subscribe with some known state", async () => {
    const admin = newRandomAgentCredential("admin");
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

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "peer",
    });

    const writer = inTx.getWriter();

    await writer.write({
        action: "subscribe",
        coValueID: map.coValue.id,
        header: true,
        sessions: {
            [node.ownSessionID]: 1,
        },
    });

    const reader = outRx.getReader();

    expect((await reader.read()).value).toMatchObject(admStateEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamStateEx(team));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "tellKnownState",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);

    expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamContentEx(team));

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
                        madeAt: map.coValue.sessions[node.ownSessionID]!
                            .transactions[1]!.madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID]!.lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test.todo(
    "TODO: node only replies with new tx to subscribe with some known state, even in the depended on coValues",
);

test("After subscribing, node sends own known state and new txs to peer", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

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
        action: "subscribe",
        coValueID: map.coValue.id,
        header: false,
        sessions: {
            [node.ownSessionID]: 0,
        },
    });

    const reader = outRx.getReader();

    expect((await reader.read()).value).toMatchObject(admStateEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamStateEx(team));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "tellKnownState",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);

    expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamContentEx(team));

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
                        madeAt: map.coValue.sessions[node.ownSessionID]!
                            .transactions[0]!.madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID]!.lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID]!.lastSignature!,
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
                        madeAt: map.coValue.sessions[node.ownSessionID]!
                            .transactions[1]!.madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID]!.lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("Client replies with known new content to tellKnownState from server", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

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

    // expect((await reader.read()).value).toMatchObject(teamStateEx(team));

    const writer = inTx.getWriter();

    await writer.write({
        action: "tellKnownState",
        coValueID: map.coValue.id,
        header: false,
        sessions: {
            [node.ownSessionID]: 0,
        },
    });

    expect((await reader.read()).value).toMatchObject(admStateEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamStateEx(team));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "tellKnownState",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);

    expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamContentEx(team));

    const mapNewContentMsg = await reader.read();

    expect(mapNewContentMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {
            [node.ownSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.coValue.sessions[node.ownSessionID]!
                            .transactions[0]!.madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID]!.lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("No matter the optimistic known state, node respects invalid known state messages and resyncs", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

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
        action: "subscribe",
        coValueID: map.coValue.id,
        header: false,
        sessions: {
            [node.ownSessionID]: 0,
        },
    });

    const reader = outRx.getReader();

    expect((await reader.read()).value).toMatchObject(admStateEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamStateEx(team));

    const mapTellKnownStateMsg = await reader.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "tellKnownState",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);

    expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamContentEx(team));

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

    map.edit((editable) => {
        editable.set("goodbye", "world", "trusting");
    });

    const _mapEditMsg1 = await reader.read();
    const _mapEditMsg2 = await reader.read();

    await writer.write({
        action: "wrongAssumedKnownState",
        coValueID: map.coValue.id,
        header: true,
        sessions: {
            [node.ownSessionID]: 1,
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
                        madeAt: map.coValue.sessions[node.ownSessionID]!
                            .transactions[1]!.madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "goodbye",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID]!.lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a peer, but it never subscribes to a coValue, it won't get any messages", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

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

    await expect(shouldNotResolve(reader.read(), {timeout: 100})).resolves.toBeUndefined();
});

test("If we add a server peer, all updates to all coValues are sent to it, even if it doesn't subscribe", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    const [inRx, _inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    expect((await reader.read()).value).toMatchObject({
        action: "subscribe",
        coValueID: adminID,
    });
    expect((await reader.read()).value).toMatchObject({
        action: "subscribe",
        coValueID: team.teamMap.coValue.id,
    });

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "subscribe",
        coValueID: map.coValue.id,
        header: true,
        sessions: {},
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamContentEx(team));

    const mapNewContentMsg = await reader.read();

    expect(mapNewContentMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {
            [node.ownSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.coValue.sessions[node.ownSessionID]!
                            .transactions[0]!.madeAt,
                        changes: [
                            {
                                op: "insert",
                                key: "hello",
                                value: "world",
                            } satisfies MapOpPayload<string, string>,
                        ],
                    },
                ],
                lastHash: map.coValue.sessions[node.ownSessionID]!.lastHash!,
                lastSignature:
                    map.coValue.sessions[node.ownSessionID]!.lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a server peer, newly created coValues are auto-subscribed to", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const [inRx, _inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    expect((await reader.read()).value).toMatchObject({
        action: "subscribe",
        coValueID: adminID,
    });
    expect((await reader.read()).value).toMatchObject({
        action: "subscribe",
        coValueID: team.teamMap.coValue.id,
    });

    const map = team.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "subscribe",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);

    expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamContentEx(team));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {},
    } satisfies SyncMessage);
});

test.todo(
    "TODO: when receiving a subscribe response that is behind our optimistic state (due to already sent content), we ignore it",
);

test("When we connect a new server peer, we try to sync all existing coValues to it", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

    const [inRx, _inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
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
        ...team.teamMap.coValue.knownState(),
    } satisfies SyncMessage);

    const secondMessage = await reader.read();

    expect(secondMessage.value).toEqual({
        action: "subscribe",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);
});

test("When receiving a subscribe with a known state that is ahead of our own, peers should respond with a corresponding subscribe response message", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const map = team.createMap();

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
        action: "subscribe",
        coValueID: map.coValue.id,
        header: true,
        sessions: {
            [node.ownSessionID]: 1,
        },
    });

    const reader = outRx.getReader();

    expect((await reader.read()).value).toMatchObject(admStateEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamStateEx(team));
    const mapTellKnownState = await reader.read();

    expect(mapTellKnownState.value).toEqual({
        action: "tellKnownState",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);
});

test.skip("When replaying creation and transactions of a coValue as new content, the receiving peer integrates this information", async () => {
    // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node1 = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node1.createTeam();

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

    const node2 = new LocalNode(admin, newRandomSessionID(adminID));

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
        action: "subscribe",
        coValueID: adminID,
    });
    const teamSubscribeMsg = await from1.read();
    expect(teamSubscribeMsg.value).toMatchObject({
        action: "subscribe",
        coValueID: team.teamMap.coValue.id,
    });

    await to2.write(adminSubscribeMessage.value!);
    await to2.write(teamSubscribeMsg.value!);

    const adminTellKnownStateMsg = await from2.read();
    expect(adminTellKnownStateMsg.value).toMatchObject(admStateEx(adminID));

    const teamTellKnownStateMsg = await from2.read();
    expect(teamTellKnownStateMsg.value).toMatchObject(teamStateEx(team));

    expect(
        node2.sync.peers["test1"]!.optimisticKnownStates[
            team.teamMap.coValue.id
        ]
    ).toBeDefined();

    await to1.write(adminTellKnownStateMsg.value!);
    await to1.write(teamTellKnownStateMsg.value!);

    const adminContentMsg = await from1.read();
    expect(adminContentMsg.value).toMatchObject(admContEx(adminID));

    const teamContentMsg = await from1.read();
    expect(teamContentMsg.value).toMatchObject(teamContentEx(team));

    await to2.write(adminContentMsg.value!);
    await to2.write(teamContentMsg.value!);

    const map = team.createMap();

    const mapSubscriptionMsg = await from1.read();
    expect(mapSubscriptionMsg.value).toMatchObject({
        action: "subscribe",
        coValueID: map.coValue.id,
    });

    const mapNewContentMsg = await from1.read();
    expect(mapNewContentMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {},
    } satisfies SyncMessage);

    await to2.write(mapSubscriptionMsg.value!);

    const mapTellKnownStateMsg = await from2.read();
    expect(mapTellKnownStateMsg.value).toEqual({
        action: "tellKnownState",
        coValueID: map.coValue.id,
        header: false,
        sessions: {},
    } satisfies SyncMessage);

    expect(node2.coValues[map.coValue.id]?.state).toEqual("loading");

    await to2.write(mapNewContentMsg.value!);

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const mapEditMsg = await from1.read();

    await to2.write(mapEditMsg.value!);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.coValue.id).getCurrentContent()
        ).get("hello")
    ).toEqual("world");
});

test.skip("When loading a coValue on one node, the server node it is requested from replies with all the necessary depended on coValues to make it work", async () => {
    // TODO: this test is mostly correct but also slightly unrealistic, make sure we pass all messages back and forth as expected and then it should work
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node1 = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node1.createTeam();

    const map = team.createMap();
    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const node2 = new LocalNode(admin, newRandomSessionID(adminID));

    const [node1asPeer, node2asPeer] = connectedPeers("peer1", "peer2");

    node1.sync.addPeer(node2asPeer);
    node2.sync.addPeer(node1asPeer);

    await node2.loadCoValue(map.coValue.id);

    expect(
        expectMap(
            node2.expectCoValueLoaded(map.coValue.id).getCurrentContent()
        ).get("hello")
    ).toEqual("world");
});

test("Can sync a coValue through a server to another client", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const client1 = new LocalNode(admin, newRandomSessionID(adminID));

    const team = client1.createTeam();

    const map = team.createMap();
    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const serverUser = newRandomAgentCredential("serverUser");
    const serverUserID = getAgentID(getAgent(serverUser));

    const server = new LocalNode(serverUser, newRandomSessionID(serverUserID));

    const [serverAsPeer, client1AsPeer] = connectedPeers("server", "client1", {
        peer1role: "server",
        peer2role: "client",
    });

    client1.sync.addPeer(serverAsPeer);
    server.sync.addPeer(client1AsPeer);

    const client2 = new LocalNode(admin, newRandomSessionID(adminID));

    const [serverAsOtherPeer, client2AsPeer] = connectedPeers(
        "server",
        "client2",
        { peer1role: "server", peer2role: "client" }
    );

    client2.sync.addPeer(serverAsOtherPeer);
    server.sync.addPeer(client2AsPeer);

    const mapOnClient2 = await client2.loadCoValue(map.coValue.id);

    expect(expectMap(mapOnClient2.getCurrentContent()).get("hello")).toEqual(
        "world"
    );
});

test("Can sync a coValue with private transactions through a server to another client", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const client1 = new LocalNode(admin, newRandomSessionID(adminID));

    const team = client1.createTeam();

    const map = team.createMap();
    map.edit((editable) => {
        editable.set("hello", "world", "private");
    });

    const serverUser = newRandomAgentCredential("serverUser");
    const serverUserID = getAgentID(getAgent(serverUser));

    const server = new LocalNode(serverUser, newRandomSessionID(serverUserID));

    const [serverAsPeer, client1AsPeer] = connectedPeers("server", "client1", {
        trace: true,
        peer1role: "server",
        peer2role: "client",
    });

    client1.sync.addPeer(serverAsPeer);
    server.sync.addPeer(client1AsPeer);

    const client2 = new LocalNode(admin, newRandomSessionID(adminID));

    const [serverAsOtherPeer, client2AsPeer] = connectedPeers(
        "server",
        "client2",
        { trace: true, peer1role: "server", peer2role: "client" }
    );

    client2.sync.addPeer(serverAsOtherPeer);
    server.sync.addPeer(client2AsPeer);

    const mapOnClient2 = await client2.loadCoValue(map.coValue.id);

    expect(expectMap(mapOnClient2.getCurrentContent()).get("hello")).toEqual(
        "world"
    );
});

test("When a peer's incoming/readable stream closes, we remove the peer", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    expect((await reader.read()).value).toMatchObject({
        action: "subscribe",
        coValueID: adminID,
    });
    expect((await reader.read()).value).toMatchObject({
        action: "subscribe",
        coValueID: team.teamMap.coValue.id,
    });

    const map = team.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "subscribe",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);

    expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamContentEx(team));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {},
    } satisfies SyncMessage);

    await inTx.abort();

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(node.sync.peers["test"]).toBeUndefined();
});

test("When a peer's outgoing/writable stream closes, we remove the peer", async () => {
    const admin = newRandomAgentCredential("admin");
    const adminID = getAgentID(getAgent(admin));

    const node = new LocalNode(admin, newRandomSessionID(adminID));

    const team = node.createTeam();

    const [inRx, inTx] = newStreamPair<SyncMessage>();
    const [outRx, outTx] = newStreamPair<SyncMessage>();

    node.sync.addPeer({
        id: "test",
        incoming: inRx,
        outgoing: outTx,
        role: "server",
    });

    const reader = outRx.getReader();
    expect((await reader.read()).value).toMatchObject({
        action: "subscribe",
        coValueID: adminID,
    });
    expect((await reader.read()).value).toMatchObject({
        action: "subscribe",
        coValueID: team.teamMap.coValue.id,
    });

    const map = team.createMap();

    const mapSubscribeMsg = await reader.read();

    expect(mapSubscribeMsg.value).toEqual({
        action: "subscribe",
        ...map.coValue.knownState(),
    } satisfies SyncMessage);

    expect((await reader.read()).value).toMatchObject(admContEx(adminID));
    expect((await reader.read()).value).toMatchObject(teamContentEx(team));

    const mapContentMsg = await reader.read();

    expect(mapContentMsg.value).toEqual({
        action: "newContent",
        coValueID: map.coValue.id,
        header: map.coValue.header,
        newContent: {},
    } satisfies SyncMessage);

    reader.releaseLock();
    await outRx.cancel();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(node.sync.peers["test"]).toBeUndefined();
})

function teamContentEx(team: Team) {
    return {
        action: "newContent",
        coValueID: team.teamMap.coValue.id,
    };
}

function admContEx(adminID: AgentID) {
    return {
        action: "newContent",
        coValueID: adminID,
    };
}

function teamStateEx(team: Team) {
    return {
        action: "tellKnownState",
        coValueID: team.teamMap.coValue.id,
    };
}

function admStateEx(adminID: AgentID) {
    return {
        action: "tellKnownState",
        coValueID: adminID,
    };
}

function newStreamPair<T>(): [ReadableStream<T>, WritableStream<T>] {
    const queue: T[] = [];
    let resolveNextItemReady: () => void = () => {};
    let nextItemReady: Promise<void> = new Promise((resolve) => {
        resolveNextItemReady = resolve;
    });

    let writerClosed = false;
    let readerClosed = false;

    const readable = new ReadableStream<T>({
        async pull(controller) {
            let retriesLeft = 3;
            while (retriesLeft > 0) {
                if (writerClosed) {
                    controller.close();
                    return;
                }
                retriesLeft--;
                if (queue.length > 0) {
                    controller.enqueue(queue.shift()!);
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
            throw new Error("Should only use one retry to get next item in queue.")
        },

        cancel(reason) {
            console.log("Manually closing reader")
            readerClosed = true;
        },
    });

    const writable = new WritableStream<T>({
        write(chunk, controller) {
            if (readerClosed) {
                console.log("Reader closed, not writing chunk", chunk);
                throw new Error("Reader closed, not writing chunk");
            }
            queue.push(chunk);
            if (queue.length === 1) {
                // make sure that await write resolves before corresponding read
                process.nextTick(() => resolveNextItemReady());
            }
        },
        abort(reason) {
            console.log("Manually closing writer")
            writerClosed = true;
            resolveNextItemReady();
            return Promise.resolve();
        },
    });

    return [readable, writable];
}

function shouldNotResolve<T>(promise: Promise<T>, ops: { timeout: number }): Promise<void> {
    return new Promise((resolve, reject) => {
        promise
            .then((v) =>
                reject(
                    new Error(
                        "Should not have resolved, but resolved to " +
                            JSON.stringify(v)
                    )
                )
            )
            .catch(reject);
        setTimeout(resolve, ops.timeout);
    });
}

function connectedPeers(
    peer1id: PeerID,
    peer2id: PeerID,
    {
        trace = false,
        peer1role = "peer",
        peer2role = "peer",
    }: {
        trace?: boolean;
        peer1role?: Peer["role"];
        peer2role?: Peer["role"];
    } = {}
): [Peer, Peer] {
    const [inRx1, inTx1] = newStreamPair<SyncMessage>();
    const [outRx1, outTx1] = newStreamPair<SyncMessage>();

    const [inRx2, inTx2] = newStreamPair<SyncMessage>();
    const [outRx2, outTx2] = newStreamPair<SyncMessage>();

    void outRx2
        .pipeThrough(
            new TransformStream({
                transform(
                    chunk: SyncMessage,
                    controller: { enqueue: (msg: SyncMessage) => void }
                ) {
                    trace && console.log(`${peer2id} -> ${peer1id}`, chunk);
                    controller.enqueue(chunk);
                },
            })
        )
        .pipeTo(inTx1);

    void outRx1
        .pipeThrough(
            new TransformStream({
                transform(
                    chunk: SyncMessage,
                    controller: { enqueue: (msg: SyncMessage) => void }
                ) {
                    trace && console.log(`${peer1id} -> ${peer2id}`, chunk);
                    controller.enqueue(chunk);
                },
            })
        )
        .pipeTo(inTx2);

    const peer2AsPeer: Peer = {
        id: peer2id,
        incoming: inRx1,
        outgoing: outTx1,
        role: peer2role,
    };

    const peer1AsPeer: Peer = {
        id: peer1id,
        incoming: inRx2,
        outgoing: outTx2,
        role: peer1role,
    };

    return [peer1AsPeer, peer2AsPeer];
}
