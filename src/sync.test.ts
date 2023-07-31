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
            optimisticKnownStates: {},
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

function newStreamPair<T>(): [ReadableStream<T>, WritableStream<T>] {
    const queue: T[] = [];
    let resolveNextItemReady: () => void = () => {};
    let nextItemReady: Promise<void> = new Promise((resolve) => {
        resolveNextItemReady = resolve;
    });

    const readable = new ReadableStream<T>({
        async pull(controller) {
            if (queue.length > 0) {
                controller.enqueue(queue.shift());
            } else {
                await nextItemReady;
                nextItemReady = new Promise((resolve) => {
                    resolveNextItemReady = resolve;
                });
                controller.enqueue(queue.shift());
            }
        },
    });

    const writable = new WritableStream<T>({
        write(chunk) {
            queue.push(chunk);
            resolveNextItemReady();
        },
    });

    return [readable, writable];
}
