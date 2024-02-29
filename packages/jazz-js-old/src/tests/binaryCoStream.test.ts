import { expect, describe, test, beforeEach } from "vitest";
import {
    BinaryCoStream,
    CoMapOf,
    CoStreamOf,
    SimpleAccount,
    imm,
    jazzReady,
} from "../index.js";
import { webcrypto } from "node:crypto";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { Effect, Queue } from "effect";
import { s } from "vitest/dist/reporters-5f784f42.js";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple BinaryCoStream operations", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    const stream = new BinaryCoStream(me);

    test("Construction", () => {
        expect(stream.meta.owner.id).toEqual(me.id);
        expect(stream.getChunks()).toEqual(undefined);
    });

    describe("Mutation", () => {
        test("Start, pushes and end", () => {
            stream.start({
                mimeType: "text/plain",
                fileName: "test.txt",
                totalSizeBytes: 12,
            });
            stream.push(new Uint8Array([104, 101, 108, 108, 111]));
            stream.push(new Uint8Array([32, 119, 111, 114, 108]));
            stream.push(new Uint8Array([100, 33]));
            stream.end();
            expect(stream.getChunks({ allowUnfinished: true })).toEqual({
                chunks: [
                    new Uint8Array([104, 101, 108, 108, 111]),
                    new Uint8Array([32, 119, 111, 114, 108]),
                    new Uint8Array([100, 33]),
                ],
                mimeType: "text/plain",
                fileName: "test.txt",
                totalSizeBytes: 12,
                finished: true,
            });
        });
    });
});

describe("Loading & subscription", async () => {
    const initNodeAndStream = async () => {
        const me = await SimpleAccount.createControlledAccount({
            name: "Hermes Puggington",
        });

        const stream = new BinaryCoStream(me);

        stream.start({
            mimeType: "text/plain",
            fileName: "test.txt",
            totalSizeBytes: 12,
        });

        stream.push(new Uint8Array([104, 101, 108, 108, 111]));
        stream.push(new Uint8Array([32, 119, 111, 114, 108]));

        return { me, stream };
    };

    test("Loading and availability", async () => {
        const { me, stream } = await initNodeAndStream();
        const [initialAsPeer, secondPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );
        me._raw.core.node.syncManager.addPeer(secondPeer);

        const meOnSecondPeer = await SimpleAccount.loadControlledAccount({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        const loadedStream = await BinaryCoStream.load(stream.id, {
            as: meOnSecondPeer,
        });

        expect(loadedStream?.getChunks({allowUnfinished: true})).toEqual({
            chunks: [
                new Uint8Array([104, 101, 108, 108, 111]),
                new Uint8Array([32, 119, 111, 114, 108]),
            ],
            mimeType: "text/plain",
            fileName: "test.txt",
            totalSizeBytes: 12,
            finished: false,
        });
    });

    test("Subscription", async () => {
        const { me, stream } = await initNodeAndStream();
        const [initialAsPeer, secondPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );
        me._raw.core.node.syncManager.addPeer(secondPeer);

        const meOnSecondPeer = await SimpleAccount.loadControlledAccount({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<BinaryCoStream>());

                BinaryCoStream.subscribe(
                    stream.id,
                    { as: meOnSecondPeer },
                    (subscribedStream: BinaryCoStream) => {
                        Effect.runPromise(Queue.offer(queue, subscribedStream));
                    }
                );

                const update1 = yield* $(Queue.take(queue));
                expect(update1.getChunks()).toEqual(undefined);
                expect(update1.getChunks({allowUnfinished: true})).toEqual({
                    chunks: [
                        new Uint8Array([104, 101, 108, 108, 111]),
                        new Uint8Array([32, 119, 111, 114, 108]),
                    ],
                    mimeType: "text/plain",
                    fileName: "test.txt",
                    totalSizeBytes: 12,
                    finished: false,
                });


                stream.push(new Uint8Array([100, 33]));

                const update2 = yield* $(Queue.take(queue));
                expect(update2.getChunks()).toEqual(undefined);
                expect(update2.getChunks({allowUnfinished: true})).toEqual({
                    chunks: [
                        new Uint8Array([104, 101, 108, 108, 111]),
                        new Uint8Array([32, 119, 111, 114, 108]),
                        new Uint8Array([100, 33])
                    ],
                    mimeType: "text/plain",
                    fileName: "test.txt",
                    totalSizeBytes: 12,
                    finished: false,
                });

                stream.end();

                const update3 = yield* $(Queue.take(queue));
                expect(update3.getChunks()).toEqual({
                    chunks: [
                        new Uint8Array([104, 101, 108, 108, 111]),
                        new Uint8Array([32, 119, 111, 114, 108]),
                        new Uint8Array([100, 33])
                    ],
                    mimeType: "text/plain",
                    fileName: "test.txt",
                    totalSizeBytes: 12,
                    finished: true,
                });
            })
        );
    });
});
