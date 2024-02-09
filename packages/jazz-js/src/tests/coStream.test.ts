import { expect, describe, test, beforeEach } from "vitest";
import { CoMapOf, CoStreamOf, SimpleAccount, imm, jazzReady } from "../index.js";
import { webcrypto } from "node:crypto";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { Effect, Queue } from "effect";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoStream operations", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    class TestStream extends CoStreamOf(imm.string) {}

    const stream = new TestStream({ owner: me });

    test("Construction", () => {
        expect(stream.meta.owner.id).toEqual(me.id);
        expect(stream.bySession).toEqual([]);
        expect(stream.byAccount).toEqual([]);
    });

    describe("Mutation", () => {
        test("assignment", () => {
            stream.push("hello");
            const expectation = {
                value: "hello",
                at: expect.any(Date),
                ref: undefined,
                tx: expect.objectContaining({
                    sessionID: stream.bySession[0].sessionID,
                    txIndex: 0,
                })
            };
            expect(stream.bySession[0].last).toEqual(expectation);
            expect(stream.bySession[0].all).toEqual([expectation]);
            expect(stream.byAccount[0].accountID).toEqual(me.id);
            expect(stream.byAccount[0].last).toEqual(expectation);
            expect(stream.byAccount[0].all).toEqual([expectation]);

            stream.push("world");
            const expectation2 = {
                value: "world",
                at: expect.any(Date),
                ref: undefined,
                tx: expect.objectContaining({
                    sessionID: stream.bySession[0].sessionID,
                    txIndex: 1,
                })
            };

            expect(stream.bySession[0].last).toEqual(expectation2);
            expect(stream.bySession[0].all).toEqual([expectation, expectation2]);
            expect(stream.byAccount[0].accountID).toEqual(me.id);
            expect(stream.byAccount[0].last).toEqual(expectation2);
            expect(stream.byAccount[0].all).toEqual([expectation, expectation2]);
        });
    });
});

describe("CoStream resolution", async () => {
    class SimpleMap extends CoMapOf({
        color: imm.string,
        height: imm.number,
    }) {}

    class StreamOfMaps extends CoStreamOf(SimpleMap) {}

    const initNodeAndStream = async () => {
        const me = await SimpleAccount.createControlledAccount({
            name: "Hermes Puggington",
        });

        const stream = new StreamOfMaps({ owner: me });
        const firstMap = new SimpleMap({ color: "red", height: 10 }, {owner: me})

        stream.push(firstMap);

        return { me, stream, firstMap };
    }

    test("Construction", async () => {
        const { stream, firstMap } = await initNodeAndStream();

        expect(stream.bySession[0].last?.value?.color).toEqual("red");
        expect(stream.bySession[0].last?.ref.id).toEqual(firstMap.id);
        expect(stream.byAccount[0].last?.ref.loaded).toEqual(true);
    });

    test("Loading and availability", async () => {
        const { me, stream, firstMap } = await initNodeAndStream();
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

        const loadedStream = await StreamOfMaps.load(stream.id, { as: meOnSecondPeer });

        expect(loadedStream.bySession[0].last?.value?.color).toEqual(undefined);
        expect(loadedStream.bySession[0].last?.ref.id).toEqual(firstMap.id);
        expect(loadedStream.bySession[0].last?.ref.loaded).toEqual(false);

        const _loadedNestedMap = await SimpleMap.load(loadedStream.bySession[0].last!.ref.id, { as: meOnSecondPeer });
        expect(loadedStream.bySession[0].last?.value?.color).toEqual("red");
        expect(loadedStream.bySession[0].last?.ref.loaded).toEqual(true);
    });

    test("Subscription & auto-resolution", async () => {
        const { me, stream, firstMap } = await initNodeAndStream();
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
                const queue = yield* $(Queue.unbounded<StreamOfMaps>());

                StreamOfMaps.subscribe(stream.id, {as: meOnSecondPeer}, (subscribedStream: StreamOfMaps) => {
                    console.log(
                        "subscribedStream.bySession[0].last?.value?.color",
                        subscribedStream.bySession[0].last?.value?.color
                    );
                    Effect.runPromise(Queue.offer(queue, subscribedStream));
                })

                const update1 = yield* $(Queue.take(queue));
                expect(update1.bySession[0].last?.value?.color).toEqual(undefined);

                const update2 = yield* $(Queue.take(queue));
                expect(update2.bySession[0].last?.value?.color).toEqual("red");

                stream.push(new SimpleMap({ color: "blue", height: 20 }, {owner: me}));
                expect(stream.bySession[0].all.length).toEqual(2);

                console.log("Before update 3")
                const update3 = yield* $(Queue.take(queue));
                expect(update3.bySession[0].all.length).toEqual(2);
                expect(update3.bySession[0].last?.ref.loaded).toEqual(false);
                expect(update3.bySession[0].last?.value?.color).toEqual(undefined);

                const update4 = yield* $(Queue.take(queue));
                expect(update4.bySession[0].last?.ref.loaded).toEqual(true);
                expect(update4.bySession[0].last?.value?.color).toEqual("blue");
            })
        )
    });
});