import { expect, describe, test, beforeEach, Test } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Account, Co, ID, S, SimpleAccount, jazzReady } from "..";
import { Simplify } from "effect/Types";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoStream operations", async () => {
    const me = await SimpleAccount.create({
        name: "Hermes Puggington",
    });

    class TestStream extends Co.stream<TestStream>()(S.string) {}

    const stream = new TestStream(["milk"], { owner: me });

    test("Construction", () => {
        expect(stream.by[me.co.id]).toEqual("milk");
        expect(stream.in[me.co.sessionID]).toEqual("milk");
    });

    describe("Mutation", () => {
        test("pushing", () => {
            stream.push("bread");
            expect(stream.by[me.co.id]).toEqual("bread");
            expect(stream.in[me.co.sessionID]).toEqual("bread");

            stream.push("butter");
            expect(stream.by[me.co.id]).toEqual("butter");
            expect(stream.in[me.co.sessionID]).toEqual("butter");
        });
    });
});

describe("CoStream resolution", async () => {
    class TwiceNestedStream extends Co.stream<TwiceNestedStream>()(S.string) {
        fancyValueOf(account: ID<Account>) {
            return "Sir " + this.by[account];
        }
    }

    class NestedStream extends Co.stream<NestedStream>()(TwiceNestedStream) {}

    class TestStream extends Co.stream<TestStream>()(NestedStream) {}

    const initNodeAndStream = async () => {
        const me = await SimpleAccount.create({
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
        expect(stream.by[me.co.id]?.by[me.co.id]?.by[me.co.id]).toEqual("milk");
    });

    test("Loading and availability", async () => {
        const { me, stream } = await initNodeAndStream();
        const [initialAsPeer, secondPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );
        me.co.raw.core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await SimpleAccount.become({
            accountID: me.co.id,
            accountSecret: me.co.raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.co.id as any),
        });

        const loadedStream = await TestStream.load(stream.co.id, {
            as: meOnSecondPeer,
        });

        expect(loadedStream?.by[me.co.id]).toEqual(undefined);
        expect(loadedStream?.co.refs.by[me.co.id]?.id).toEqual(
            stream.by[me.co.id]?.co.id
        );

        const loadedNestedStream = await NestedStream.load(
            stream.by[me.co.id]!.co.id,
            { as: meOnSecondPeer }
        );

        expect(loadedStream?.by[me.co.id]).toEqual(loadedNestedStream);
        expect(loadedStream?.by[me.co.id]?.by[me.co.id]).toEqual(undefined);
        expect(loadedStream?.co.refs.by[me.co.id]?.value).toEqual(
            loadedNestedStream
        );
        expect(loadedStream?.by[me.co.id]?.co.refs.by[me.co.id]?.id).toEqual(
            stream.by[me.co.id]?.by[me.co.id]?.co.id
        );

        const loadedTwiceNestedStream = await TwiceNestedStream.load(
            stream.by[me.co.id]!.by[me.co.id]!.co.id,
            { as: meOnSecondPeer }
        );

        expect(loadedStream?.by[me.co.id]?.by[me.co.id]).toEqual(
            loadedTwiceNestedStream
        );
        expect(
            loadedStream?.by[me.co.id]?.by[me.co.id]?.fancyValueOf(me.co.id)
        ).toEqual("Sir milk");
        expect(loadedStream?.co.refs.by[me.co.id]?.value).toEqual(
            loadedNestedStream
        );
        expect(loadedStream?.by[me.co.id]?.co.refs.by[me.co.id]?.value).toEqual(
            loadedTwiceNestedStream
        );

        const otherNestedStream = new NestedStream(
            [new TwiceNestedStream(["butter"], { owner: meOnSecondPeer })],
            { owner: meOnSecondPeer }
        );
        loadedStream?.push(otherNestedStream);
        expect(loadedStream?.by[me.co.id]).toEqual(otherNestedStream);
        expect(loadedStream?.co.refs.by[me.co.id]?.value).toEqual(
            otherNestedStream
        );
        expect(loadedStream?.by[me.co.id]?.by[me.co.id]).toEqual(
            otherNestedStream.by[me.co.id]
        );
        expect(
            loadedStream?.by[me.co.id]?.by[me.co.id]?.fancyValueOf(me.co.id)
        ).toEqual("Sir butter");
    });

    test("Subscription & auto-resolution", async () => {
        const { me, stream } = await initNodeAndStream();

        const [initialAsPeer, secondAsPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );

        me.co.raw.core.node.syncManager.addPeer(secondAsPeer);

        const meOnSecondPeer = await SimpleAccount.become({
            accountID: me.co.id,
            accountSecret: me.co.raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.co.id as any),
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<TestStream>());

                TestStream.subscribe(
                    stream.co.id,
                    { as: meOnSecondPeer },
                    (subscribedStream) => {
                        console.log(
                            "subscribedStream.by[me.co.id]",
                            subscribedStream.by[me.co.id]
                        );
                        console.log(
                            "subscribedStream.by[me.co.id]?.by[me.co.id]",
                            subscribedStream.by[me.co.id]?.by[me.co.id]
                        );
                        console.log(
                            "subscribedStream.by[me.co.id]?.by[me.co.id]?.by[me.co.id]",
                            subscribedStream.by[me.co.id]?.by[me.co.id]?.by[
                                me.co.id
                            ]
                        );
                        Effect.runPromise(Queue.offer(queue, subscribedStream));
                    }
                );

                type T = Simplify<TestStream>;
                const te: T = stream;

                const update1 = yield* $(Queue.take(queue));
                expect(update1.by[me.co.id]).toEqual(undefined);

                const update2 = yield* $(Queue.take(queue));
                expect(update2.by[me.co.id]).toBeDefined();
                expect(update2.by[me.co.id]?.by[me.co.id]).toBeUndefined();

                const update3 = yield* $(Queue.take(queue));
                expect(update3.by[me.co.id]?.by[me.co.id]).toBeDefined();
                expect(update3.by[me.co.id]?.by[me.co.id]?.by[me.co.id]).toBe("milk");

                update3.by[me.co.id]!.by[me.co.id]!.push("bread");

                const update4 = yield* $(Queue.take(queue));
                expect(update4.by[me.co.id]?.by[me.co.id]?.by[me.co.id]).toBe("bread");

                // When assigning a new nested stream, we get an update
                const newTwiceNested = new TwiceNestedStream(["butter"], {
                    owner: meOnSecondPeer,
                });

                const newNested = new NestedStream([newTwiceNested], {
                    owner: meOnSecondPeer,
                });

                update4.push(newNested);

                const update5 = yield* $(Queue.take(queue));
                expect(update5.by[me.co.id]?.by[me.co.id]?.by[me.co.id]).toBe("butter");

                // we get updates when the new nested stream changes
                newTwiceNested.push("jam");
                const update6 = yield* $(Queue.take(queue));
                expect(update6.by[me.co.id]?.by[me.co.id]?.by[me.co.id]).toBe("jam");
            })
        );
    });
});
