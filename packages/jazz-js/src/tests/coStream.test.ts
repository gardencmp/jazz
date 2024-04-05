import { expect, describe, test, beforeEach, Test } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { AnyAccount, BinaryCoStream, Co, ID, S, Account, jazzReady } from "..";
import { Simplify } from "effect/Types";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoStream operations", async () => {
    const me = await Account.create({
        name: "Hermes Puggington",
    });

    class TestStream extends Co.stream(S.string).as<TestStream>() {}

    const stream = new TestStream(["milk"], { owner: me });

    test("Construction", () => {
        expect(stream.by[me.id]?.value).toEqual("milk");
        expect(stream.in[me.sessionID]?.value).toEqual("milk");
    });

    describe("Mutation", () => {
        test("pushing", () => {
            stream.push("bread");
            expect(stream.by[me.id]?.value).toEqual("bread");
            expect(stream.in[me.sessionID]?.value).toEqual("bread");

            stream.push("butter");
            expect(stream.by[me.id]?.value).toEqual("butter");
            expect(stream.in[me.sessionID]?.value).toEqual("butter");
        });
    });
});

describe("CoStream resolution", async () => {
    class TwiceNestedStream extends Co.stream(
        S.string
    ).as<TwiceNestedStream>() {
        fancyValueOf(account: ID<AnyAccount>) {
            return "Sir " + this.by[account]?.value;
        }
    }

    class NestedStream extends Co.stream(
        TwiceNestedStream
    ).as<NestedStream>() {}

    class TestStream extends Co.stream(NestedStream).as<TestStream>() {}

    const initNodeAndStream = async () => {
        const me = await Account.create({
            name: "Hermes Puggington",
        });

        const stream = new TestStream(
            [
                new NestedStream(
                    [new TwiceNestedStream(["milk"], { owner: me })],
                    { owner: me }
                ),
            ],
            { owner: me }
        );

        return { me, stream };
    };

    test("Construction", async () => {
        const { me, stream } = await initNodeAndStream();
        expect(
            stream.by[me.id]?.value?.by[me.id]?.value?.by[me.id]?.value
        ).toEqual("milk");
    });

    test("Loading and availability", async () => {
        const { me, stream } = await initNodeAndStream();
        const [initialAsPeer, secondPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );
        me._raw.core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        const loadedStream = await TestStream.load(stream.id, {
            as: meOnSecondPeer,
        });

        expect(loadedStream?.by[me.id]?.value).toEqual(undefined);
        expect(loadedStream?.by[me.id]?.ref?.id).toEqual(
            stream.by[me.id]?.value?.id
        );

        const loadedNestedStream = await NestedStream.load(
            stream.by[me.id]!.value!.id,
            { as: meOnSecondPeer }
        );

        expect(loadedStream?.by[me.id]?.value).toEqual(loadedNestedStream);
        expect(loadedStream?.by[me.id]?.value?.by[me.id]?.value).toEqual(
            undefined
        );
        expect(loadedStream?.by[me.id]?.ref?.value).toEqual(loadedNestedStream);
        expect(loadedStream?.by[me.id]?.value?.by[me.id]?.ref?.id).toEqual(
            stream.by[me.id]?.value?.by[me.id]?.value?.id
        );

        const loadedTwiceNestedStream = await TwiceNestedStream.load(
            stream.by[me.id]!.value!.by[me.id]!.value!.id,
            { as: meOnSecondPeer }
        );

        expect(loadedStream?.by[me.id]?.value?.by[me.id]?.value).toEqual(
            loadedTwiceNestedStream
        );
        expect(
            loadedStream?.by[me.id]?.value?.by[me.id]?.value?.fancyValueOf(me.id)
        ).toEqual("Sir milk");
        expect(loadedStream?.by[me.id]?.ref?.value).toEqual(loadedNestedStream);
        expect(loadedStream?.by[me.id]?.value?.by[me.id]?.ref?.value).toEqual(
            loadedTwiceNestedStream
        );

        const otherNestedStream = new NestedStream(
            [new TwiceNestedStream(["butter"], { owner: meOnSecondPeer })],
            { owner: meOnSecondPeer }
        );
        loadedStream?.push(otherNestedStream);
        expect(loadedStream?.by[me.id]?.value).toEqual(otherNestedStream);
        expect(loadedStream?.by[me.id]?.ref?.value).toEqual(otherNestedStream);
        expect(loadedStream?.by[me.id]?.value?.by[me.id]?.value).toEqual(
            otherNestedStream.by[me.id]?.value
        );
        expect(
            loadedStream?.by[me.id]?.value?.by[me.id]?.value?.fancyValueOf(me.id)
        ).toEqual("Sir butter");
    });

    test("Subscription & auto-resolution", async () => {
        const { me, stream } = await initNodeAndStream();

        const [initialAsPeer, secondAsPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );

        me._raw.core.node.syncManager.addPeer(secondAsPeer);

        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<TestStream>());

                TestStream.subscribe(
                    stream.id,
                    { as: meOnSecondPeer },
                    (subscribedStream) => {
                        console.log(
                            "subscribedStream.by[me.id]",
                            subscribedStream.by[me.id]
                        );
                        console.log(
                            "subscribedStream.by[me.id]?.value?.by[me.id]?.value",
                            subscribedStream.by[me.id]?.value?.by[me.id]?.value
                        );
                        console.log(
                            "subscribedStream.by[me.id]?.value?.by[me.id]?.value?.by[me.id]?.value",
                            subscribedStream.by[me.id]?.value?.by[me.id]?.value
                                ?.by[me.id]?.value
                        );
                        Effect.runPromise(Queue.offer(queue, subscribedStream));
                    }
                );

                type T = Simplify<TestStream>;
                const te: T = stream;

                const update1 = yield* $(Queue.take(queue));
                expect(update1.by[me.id]?.value).toEqual(undefined);

                const update2 = yield* $(Queue.take(queue));
                expect(update2.by[me.id]?.value).toBeDefined();
                expect(
                    update2.by[me.id]?.value?.by[me.id]?.value
                ).toBeUndefined();

                const update3 = yield* $(Queue.take(queue));
                expect(update3.by[me.id]?.value?.by[me.id]?.value).toBeDefined();
                expect(
                    update3.by[me.id]?.value?.by[me.id]?.value?.by[me.id]?.value
                ).toBe("milk");

                update3.by[me.id]!.value!.by[me.id]!.value!.push("bread");

                const update4 = yield* $(Queue.take(queue));
                expect(
                    update4.by[me.id]?.value?.by[me.id]?.value?.by[me.id]?.value
                ).toBe("bread");

                // When assigning a new nested stream, we get an update
                const newTwiceNested = new TwiceNestedStream(["butter"], {
                    owner: meOnSecondPeer,
                });

                const newNested = new NestedStream([newTwiceNested], {
                    owner: meOnSecondPeer,
                });

                update4.push(newNested);

                const update5 = yield* $(Queue.take(queue));
                expect(
                    update5.by[me.id]?.value?.by[me.id]?.value?.by[me.id]?.value
                ).toBe("butter");

                // we get updates when the new nested stream changes
                newTwiceNested.push("jam");
                const update6 = yield* $(Queue.take(queue));
                expect(
                    update6.by[me.id]?.value?.by[me.id]?.value?.by[me.id]?.value
                ).toBe("jam");
            })
        );
    });
});

describe("Simple BinaryCoStream operations", async () => {
    const me = await Account.create({
        name: "Hermes Puggington",
    });

    const stream = new Co.binaryStream(undefined, { owner: me });

    test("Construction", () => {
        expect(stream.getChunks()).toBeUndefined();
    });

    test("Mutation", () => {
        stream.start({ mimeType: "text/plain" });
        stream.push(new Uint8Array([1, 2, 3]));
        stream.push(new Uint8Array([4, 5, 6]));
        stream.end();

        const chunks = stream.getChunks();
        expect(chunks?.mimeType).toBe("text/plain");
        expect(chunks?.chunks).toEqual([
            new Uint8Array([1, 2, 3]),
            new Uint8Array([4, 5, 6]),
        ]);
        expect(chunks?.finished).toBe(true);
    });
});

describe("BinaryCoStream loading & Subscription", async () => {
    const initNodeAndStream = async () => {
        const me = await Account.create({
            name: "Hermes Puggington",
        });

        const stream = new Co.binaryStream(undefined, { owner: me });

        stream.start({ mimeType: "text/plain" });
        stream.push(new Uint8Array([1, 2, 3]));
        stream.push(new Uint8Array([4, 5, 6]));
        stream.end();

        return { me, stream };
    };

    test("Construction", async () => {
        const { me, stream } = await initNodeAndStream();
        expect(stream.getChunks()).toEqual({
            mimeType: "text/plain",
            chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
            finished: true,
        });
    });

    test("Loading and availability", async () => {
        const { me, stream } = await initNodeAndStream();
        const [initialAsPeer, secondAsPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );
        me._raw.core.node.syncManager.addPeer(secondAsPeer);
        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        const loadedStream = await Co.binaryStream.load(stream.id, {
            as: meOnSecondPeer,
        });

        expect(loadedStream?.getChunks()).toEqual({
            mimeType: "text/plain",
            chunks: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
            finished: true,
        });
    });

    test("Subscription", async () => {
        const { me } = await initNodeAndStream();

        const stream = new Co.binaryStream(undefined, { owner: me });

        const [initialAsPeer, secondAsPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );

        me._raw.core.node.syncManager.addPeer(secondAsPeer);

        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<BinaryCoStream>());

                Co.binaryStream.subscribe(
                    stream.id,
                    { as: meOnSecondPeer },
                    (subscribedStream) => {
                        Effect.runPromise(Queue.offer(queue, subscribedStream));
                    }
                );

                const update1 = yield* $(Queue.take(queue));
                expect(update1.getChunks()).toBeUndefined();

                stream.start({ mimeType: "text/plain" });

                const update2 = yield* $(Queue.take(queue));
                expect(update2.getChunks({ allowUnfinished: true })).toEqual({
                    mimeType: "text/plain",
                    fileName: undefined,
                    chunks: [],
                    totalSizeBytes: undefined,
                    finished: false,
                });

                stream.push(new Uint8Array([1, 2, 3]));

                const update3 = yield* $(Queue.take(queue));
                expect(update3.getChunks({ allowUnfinished: true })).toEqual({
                    mimeType: "text/plain",
                    fileName: undefined,
                    chunks: [new Uint8Array([1, 2, 3])],
                    totalSizeBytes: undefined,
                    finished: false,
                });

                stream.push(new Uint8Array([4, 5, 6]));

                const update4 = yield* $(Queue.take(queue));
                expect(update4.getChunks({ allowUnfinished: true })).toEqual({
                    mimeType: "text/plain",
                    fileName: undefined,
                    chunks: [
                        new Uint8Array([1, 2, 3]),
                        new Uint8Array([4, 5, 6]),
                    ],
                    totalSizeBytes: undefined,
                    finished: false,
                });

                stream.end();

                const update5 = yield* $(Queue.take(queue));
                expect(update5.getChunks()).toEqual({
                    mimeType: "text/plain",
                    fileName: undefined,
                    chunks: [
                        new Uint8Array([1, 2, 3]),
                        new Uint8Array([4, 5, 6]),
                    ],
                    totalSizeBytes: undefined,
                    finished: true,
                });
            })
        );
    });
});
