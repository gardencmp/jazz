import { test, expect } from "bun:test";
import {
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./multilog";
import { LocalNode } from "./node";
import { SyncMessage } from "./sync";
import { MapOpPayload } from "./coValue";

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
            type: "subscribe",
            knownState: {
                multilogID: map.multiLog.id,
                header: false,
                sessions: {},
            },
        });

        const reader = outRx.getReader();

        const firstMessage = await reader.read();

        expect(firstMessage.value).toEqual({
            type: "newContent",
            multilogID: map.multiLog.id,
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
                            madeAt: map.multiLog.sessions[node.ownSessionID]
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
                        map.multiLog.sessions[node.ownSessionID].lastHash!,
                    lastSignature:
                        map.multiLog.sessions[node.ownSessionID].lastSignature!,
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
        type: "subscribe",
        knownState: {
            multilogID: map.multiLog.id,
            header: true,
            sessions: {
                [node.ownSessionID]: 1,
            },
        },
    });

    const reader = outRx.getReader();

    const firstMessage = await reader.read();

    expect(firstMessage.value).toEqual({
        type: "newContent",
        multilogID: map.multiLog.id,
        header: undefined,
        newContent: {
            [node.ownSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.multiLog.sessions[node.ownSessionID]
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
                lastHash: map.multiLog.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.multiLog.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("After subscribing, node sends new txs to peer", async () => {
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
        type: "subscribe",
        knownState: {
            multilogID: map.multiLog.id,
            header: false,
            sessions: {
                [node.ownSessionID]: 0,
            },
        },
    });

    const reader = outRx.getReader();

    const firstMessage = await reader.read();

    expect(firstMessage.value).toEqual({
        type: "newContent",
        multilogID: map.multiLog.id,
        header: map.multiLog.header,
        newContent: {},
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    const secondMessage = await reader.read();

    expect(secondMessage.value).toEqual({
        type: "newContent",
        multilogID: map.multiLog.id,
        newContent: {
            [node.ownSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.multiLog.sessions[node.ownSessionID]
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
                lastHash: map.multiLog.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.multiLog.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);

    map.edit((editable) => {
        editable.set("goodbye", "world", "trusting");
    });

    const thirdMessage = await reader.read();

    expect(thirdMessage.value).toEqual({
        type: "newContent",
        multilogID: map.multiLog.id,
        newContent: {
            [node.ownSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.multiLog.sessions[node.ownSessionID]
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
                lastHash: map.multiLog.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.multiLog.sessions[node.ownSessionID].lastSignature!,
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
        type: "subscribe",
        knownState: {
            multilogID: map.multiLog.id,
            header: false,
            sessions: {
                [node.ownSessionID]: 0,
            },
        },
    });

    const reader = outRx.getReader();

    const _firstMessage = await reader.read();

    map.edit((editable) => {
        editable.set("hello", "world", "trusting");
    });

    map.edit((editable) => {
        editable.set("goodbye", "world", "trusting");
    });

    const _secondMessage = await reader.read();
    const _thirdMessage = await reader.read();

    await writer.write({
        type: "wrongAssumedKnownState",
        knownState: {
            multilogID: map.multiLog.id,
            header: true,
            sessions: {
                [node.ownSessionID]: 1,
            },
        },
    } satisfies SyncMessage);

    const fourthMessage = await reader.read();

    expect(fourthMessage.value).toEqual({
        type: "newContent",
        multilogID: map.multiLog.id,
        header: undefined,
        newContent: {
            [node.ownSessionID]: {
                after: 1,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.multiLog.sessions[node.ownSessionID]
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
                lastHash: map.multiLog.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.multiLog.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a peer, but it never subscribes to a multilog, it won't get any messages", async () => {
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

test("If we add a server peer, all updates to all multilogs are sent to it, even if it doesn't subscribe", async () => {
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
    const _initialSyncMessage = await reader.read();

    const firstMessage = await reader.read();

    expect(firstMessage.value).toEqual({
        type: "newContent",
        multilogID: map.multiLog.id,
        header: map.multiLog.header,
        newContent: {
            [node.ownSessionID]: {
                after: 0,
                newTransactions: [
                    {
                        privacy: "trusting",
                        madeAt: map.multiLog.sessions[node.ownSessionID]
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
                lastHash: map.multiLog.sessions[node.ownSessionID].lastHash!,
                lastSignature:
                    map.multiLog.sessions[node.ownSessionID].lastSignature!,
            },
        },
    } satisfies SyncMessage);
});

test("If we add a server peer, it even receives just headers of newly created multilogs", async () => {
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
    const _initialSyncMessage = await reader.read();

    const map = team.createMap();

    const firstMessage = await reader.read();

    expect(firstMessage.value).toEqual({
        type: "newContent",
        multilogID: map.multiLog.id,
        header: map.multiLog.header,
        newContent: {},
    } satisfies SyncMessage);
});

test("When we connect a new server peer, we try to sync all existing multilogs to it", async () => {
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

    const firstMessage = await reader.read();

    expect(firstMessage.value).toEqual({
        type: "subscribe",
        knownState: team.teamMap.multiLog.knownState(),
    } satisfies SyncMessage);

    const secondMessage = await reader.read();

    expect(secondMessage.value).toEqual({
        type: "subscribe",
        knownState: map.multiLog.knownState(),
    } satisfies SyncMessage);
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
