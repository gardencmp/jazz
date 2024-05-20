import { expect, describe, test } from "vitest";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { BinaryCoStream, ID, Account, CoStream, co, WasmCrypto } from "..";
import { Simplify } from "effect/Types";

const Crypto = await WasmCrypto.create();


describe("Simple CoStream operations", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto,
    });

    class TestStream extends CoStream.Of(co.string) {}

    const stream = TestStream.create(["milk"], { owner: me });

    test("Construction", () => {
        expect(stream[me.id]?.value).toEqual("milk");
        expect(stream.perSession[me.sessionID]?.value).toEqual("milk");
    });

    describe("Mutation", () => {
        test("pushing", () => {
            stream.push("bread");
            expect(stream[me.id]?.value).toEqual("bread");
            expect(stream.perSession[me.sessionID]?.value).toEqual("bread");

            stream.push("butter");
            expect(stream[me.id]?.value).toEqual("butter");
            expect(stream.perSession[me.sessionID]?.value).toEqual("butter");
        });
    });
});

describe("CoStream resolution", async () => {
    class TwiceNestedStream extends CoStream.Of(co.string) {
        fancyValueOf(account: ID<Account>) {
            return "Sir " + this[account]?.value;
        }
    }

    class NestedStream extends CoStream.Of(co.ref(TwiceNestedStream)) {}

    class TestStream extends CoStream.Of(co.ref(NestedStream)) {}

    const initNodeAndStream = async () => {
        const me = await Account.create({
            creationProps: { name: "Hermes Puggington" },
            crypto: Crypto,
        });

        const stream = TestStream.create(
            [
                NestedStream.create(
                    [TwiceNestedStream.create(["milk"], { owner: me })],
                    { owner: me }
                ),
            ],
            { owner: me }
        );

        return { me, stream };
    };

    test("Construction", async () => {
        const { me, stream } = await initNodeAndStream();
        expect(stream[me.id]?.value?.[me.id]?.value?.[me.id]?.value).toEqual(
            "milk"
        );
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
            crypto: Crypto,
        });

        const loadedStream = await TestStream.load(stream.id, {
            as: meOnSecondPeer,
        });

        expect(loadedStream?.[me.id]?.value).toEqual(null);
        expect(loadedStream?.[me.id]?.ref?.id).toEqual(
            stream[me.id]?.value?.id
        );

        const loadedNestedStream = await NestedStream.load(
            stream[me.id]!.value!.id,
            { as: meOnSecondPeer }
        );

        // expect(loadedStream?.[me.id]?.value).toEqual(loadedNestedStream);
        expect(loadedStream?.[me.id]?.value?.id).toEqual(
            loadedNestedStream?.id
        );
        expect(loadedStream?.[me.id]?.value?.[me.id]?.value).toEqual(null);
        // expect(loadedStream?.[me.id]?.ref?.value).toEqual(loadedNestedStream);
        expect(loadedStream?.[me.id]?.ref?.value?.id).toEqual(
            loadedNestedStream?.id
        );
        expect(loadedStream?.[me.id]?.value?.[me.id]?.ref?.id).toEqual(
            stream[me.id]?.value?.[me.id]?.value?.id
        );

        const loadedTwiceNestedStream = await TwiceNestedStream.load(
            stream[me.id]!.value![me.id]!.value!.id,
            { as: meOnSecondPeer }
        );

        // expect(loadedStream?.[me.id]?.value?.[me.id]?.value).toEqual(
        //     loadedTwiceNestedStream
        // );
        expect(loadedStream?.[me.id]?.value?.[me.id]?.value?.id).toEqual(
            loadedTwiceNestedStream?.id
        );
        expect(
            loadedStream?.[me.id]?.value?.[me.id]?.value?.fancyValueOf(me.id)
        ).toEqual("Sir milk");
        // expect(loadedStream?.[me.id]?.ref?.value).toEqual(loadedNestedStream);
        expect(loadedStream?.[me.id]?.ref?.value?.id).toEqual(
            loadedNestedStream?.id
        );
        expect(loadedStream?.[me.id]?.value?.[me.id]?.ref?.value?.id).toEqual(
            loadedTwiceNestedStream?.id
        );

        const otherNestedStream = NestedStream.create(
            [TwiceNestedStream.create(["butter"], { owner: meOnSecondPeer })],
            { owner: meOnSecondPeer }
        );
        loadedStream?.push(otherNestedStream);
        // expect(loadedStream?.[me.id]?.value).toEqual(otherNestedStream);
        expect(loadedStream?.[me.id]?.value?.id).toEqual(otherNestedStream?.id);
        expect(loadedStream?.[me.id]?.ref?.value?.id).toEqual(
            otherNestedStream?.id
        );
        expect(loadedStream?.[me.id]?.value?.[me.id]?.value?.id).toEqual(
            otherNestedStream[me.id]?.value?.id
        );
        expect(
            loadedStream?.[me.id]?.value?.[me.id]?.value?.fancyValueOf(me.id)
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
            crypto: Crypto,
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<TestStream>());

                TestStream.subscribe(
                    stream.id,
                    { as: meOnSecondPeer },
                    (subscribedStream) => {
                        console.log(
                            "subscribedStream[me.id]",
                            subscribedStream[me.id]
                        );
                        console.log(
                            "subscribedStream[me.id]?.value?.[me.id]?.value",
                            subscribedStream[me.id]?.value?.[me.id]?.value
                        );
                        console.log(
                            "subscribedStream[me.id]?.value?.[me.id]?.value?.[me.id]?.value",
                            subscribedStream[me.id]?.value?.[me.id]?.value?.[
                                me.id
                            ]?.value
                        );
                        Effect.runPromise(Queue.offer(queue, subscribedStream));
                    }
                );

                type T = Simplify<TestStream>;
                const te: T = stream;

                const update1 = yield* $(Queue.take(queue));
                expect(update1[me.id]?.value).toEqual(null);

                const update2 = yield* $(Queue.take(queue));
                expect(update2[me.id]?.value).toBeDefined();
                expect(update2[me.id]?.value?.[me.id]?.value).toBe(null);

                const update3 = yield* $(Queue.take(queue));
                expect(update3[me.id]?.value?.[me.id]?.value).toBeDefined();
                expect(
                    update3[me.id]?.value?.[me.id]?.value?.[me.id]?.value
                ).toBe("milk");

                update3[me.id]!.value![me.id]!.value!.push("bread");

                const update4 = yield* $(Queue.take(queue));
                expect(
                    update4[me.id]?.value?.[me.id]?.value?.[me.id]?.value
                ).toBe("bread");

                // When assigning a new nested stream, we get an update
                const newTwiceNested = TwiceNestedStream.create(["butter"], {
                    owner: meOnSecondPeer,
                });

                const newNested = NestedStream.create([newTwiceNested], {
                    owner: meOnSecondPeer,
                });

                update4.push(newNested);

                const update5 = yield* $(Queue.take(queue));
                expect(
                    update5[me.id]?.value?.[me.id]?.value?.[me.id]?.value
                ).toBe("butter");

                // we get updates when the new nested stream changes
                newTwiceNested.push("jam");
                const update6 = yield* $(Queue.take(queue));
                expect(
                    update6[me.id]?.value?.[me.id]?.value?.[me.id]?.value
                ).toBe("jam");
            })
        );
    });
});

describe("Simple BinaryCoStream operations", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto,
    });

    const stream = BinaryCoStream.create({ owner: me });

    test("Construction", () => {
        expect(stream.getChunks()).toBe(undefined);
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
            creationProps: { name: "Hermes Puggington" },
            crypto: Crypto,
        });

        const stream = BinaryCoStream.create({ owner: me });

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
            crypto: Crypto,
        });

        const loadedStream = await BinaryCoStream.load(stream.id, {
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

        const stream = BinaryCoStream.create({ owner: me });

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
            crypto: Crypto,
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<BinaryCoStream>());

                BinaryCoStream.subscribe(
                    stream.id,
                    { as: meOnSecondPeer },
                    (subscribedStream) => {
                        Effect.runPromise(Queue.offer(queue, subscribedStream));
                    }
                );

                const update1 = yield* $(Queue.take(queue));
                expect(update1.getChunks()).toBe(undefined);

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
