import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Co, S, SimpleAccount, jazzReady } from "..";
import { rawSym } from "../coValueInterfaces";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoMap operations", async () => {
    const me = await SimpleAccount.create({
        name: "Hermes Puggington",
    });

    class TestMap extends Co.map({
        color: S.string,
        height: S.number,
        birthday: S.Date,
    }) {}

    const birthday = new Date();

    const map = new TestMap(
        {
            color: "red",
            height: 10,
            birthday: birthday,
        },
        { owner: me }
    );

    test("Construction", () => {
        expect(map.color).toEqual("red");
        expect(map.height).toEqual(10);
        expect(map.birthday).toEqual(birthday);
        expect(map[rawSym].get("birthday")).toEqual(birthday.toISOString());
    });

    describe("Mutation", () => {
        test("assignment", () => {
            map.color = "blue";
            expect(map.color).toEqual("blue");
            expect(map[rawSym].get("color")).toEqual("blue");
            const newBirthday = new Date();
            map.birthday = newBirthday;
            expect(map.birthday).toEqual(newBirthday);
            expect(map[rawSym].get("birthday")).toEqual(
                newBirthday.toISOString()
            );
        });
    });
});

describe("CoMap resolution", async () => {
    class TwiceNestedMap extends Co.map({
        taste: S.string,
    }) {}

    class NestedMap extends Co.map({
        name: S.string,
        twiceNested: TwiceNestedMap,
    }) {}

    class TestMap extends Co.map({
        color: S.string,
        height: S.number,
        nested: NestedMap,
    }) {}

    const initNodeAndMap = async () => {
        const me = await SimpleAccount.create({
            name: "Hermes Puggington",
        });

        const map = new TestMap(
            {
                color: "red",
                height: 10,
                nested: new NestedMap(
                    {
                        name: "nested",
                        twiceNested: new TwiceNestedMap(
                            { taste: "sour" },
                            { owner: me }
                        ),
                    },
                    { owner: me }
                ),
            },
            { owner: me }
        );

        return { me, map };
    };

    test("Construction", async () => {
        const { map } = await initNodeAndMap();
        expect(map.color).toEqual("red");
        expect(map.height).toEqual(10);
        expect(map.nested?.name).toEqual("nested");
        expect(map.nested?.id).toBeDefined();
        expect(map.nested?.twiceNested?.taste).toEqual("sour");
    });

    test("Loading and availability", async () => {
        const { me, map } = await initNodeAndMap();
        const [initialAsPeer, secondPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );
        me[rawSym].core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await SimpleAccount.become({
            accountID: me.id,
            accountSecret: me[rawSym].agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        const loadedMap = await TestMap.load(map.id, { as: meOnSecondPeer });

        expect(loadedMap?.color).toEqual("red");
        expect(loadedMap?.height).toEqual(10);
        expect(loadedMap?.nested).toEqual(undefined);
        expect(loadedMap?.meta.refs.nested?.id).toEqual(map.nested?.id);
        expect(loadedMap?.meta.refs.nested?.value).toEqual(undefined);

        const loadedNestedMap = await NestedMap.load(map.nested!.id, {
            as: meOnSecondPeer,
        });

        expect(loadedMap?.nested?.name).toEqual("nested");
        expect(loadedMap?.meta.refs.nested?.value).toEqual(loadedNestedMap);
        expect(loadedMap?.nested?.twiceNested?.taste).toEqual(undefined);

        const loadedTwiceNestedMap = await TwiceNestedMap.load(
            map.nested!.twiceNested!.id,
            { as: meOnSecondPeer }
        );

        expect(loadedMap?.nested?.twiceNested?.taste).toEqual("sour");
        expect(loadedMap?.nested?.meta.refs.twiceNested?.value).toEqual(
            loadedTwiceNestedMap
        );

        const otherNestedMap = new NestedMap(
            {
                name: "otherNested",
                twiceNested: new TwiceNestedMap(
                    { taste: "sweet" },
                    { owner: meOnSecondPeer }
                ),
            },
            { owner: meOnSecondPeer }
        );

        loadedMap!.nested = otherNestedMap;
        expect(loadedMap?.nested?.name).toEqual("otherNested");
        expect(loadedMap?.meta.refs.nested?.id).toEqual(otherNestedMap.id);
        expect(loadedMap?.meta.refs.nested?.value).toEqual(otherNestedMap);
        expect(loadedMap?.nested?.twiceNested?.taste).toEqual("sweet");
        expect(loadedMap?.nested?.meta.refs.twiceNested?.value).toBeDefined();
    });

    test("Subscription & auto-resolution", async () => {
        const { me, map } = await initNodeAndMap();

        const [initialAsPeer, secondAsPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );

        me[rawSym].core.node.syncManager.addPeer(secondAsPeer);

        const meOnSecondPeer = await SimpleAccount.become({
            accountID: me.id,
            accountSecret: me[rawSym].agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<TestMap>());

                TestMap.subscribe(
                    map.id,
                    { as: meOnSecondPeer },
                    (subscribedMap: TestMap) => {
                        console.log(
                            "subscribedMap.nested?.twiceNested?.taste",
                            subscribedMap.nested?.twiceNested?.taste
                        );
                        Effect.runPromise(Queue.offer(queue, subscribedMap));
                    }
                );

                const update1 = yield* $(Queue.take(queue));
                expect(update1.nested).toEqual(undefined);

                const update2 = yield* $(Queue.take(queue));
                expect(update2.nested?.name).toEqual("nested");

                map.nested!.name = "nestedUpdated";

                const _ = yield* $(Queue.take(queue));
                const update3 = yield* $(Queue.take(queue));
                expect(update3.nested?.name).toEqual("nestedUpdated");

                const oldTwiceNested = update3.nested!.twiceNested;
                expect(oldTwiceNested?.taste).toEqual("sour");

                // When assigning a new nested value, we get an update
                const newTwiceNested = new TwiceNestedMap(
                    {
                        taste: "sweet",
                    },
                    { owner: meOnSecondPeer }
                );

                const newNested = new NestedMap(
                    {
                        name: "newNested",
                        twiceNested: newTwiceNested,
                    },
                    { owner: meOnSecondPeer }
                );

                update3.nested = newNested;

                yield* $(Queue.take(queue));
                // const update4 = yield* $(Queue.take(queue));
                const update4b = yield* $(Queue.take(queue));

                expect(update4b.nested?.name).toEqual("newNested");
                expect(update4b.nested?.twiceNested?.taste).toEqual("sweet");

                // we get updates when the new nested value changes
                newTwiceNested.taste = "salty";
                const update5 = yield* $(Queue.take(queue));
                expect(update5.nested?.twiceNested?.taste).toEqual("salty");

                newTwiceNested.taste = "umami";
                const update6 = yield* $(Queue.take(queue));
                expect(update6.nested?.twiceNested?.taste).toEqual("umami");
            })
        );
    });

    class TestMapWithOptionalRef extends Co.map({
        color: S.string,
        nested: S.optional(NestedMap),
    }) {}

    test("Construction with optional", async () => {
        const me = await SimpleAccount.create({
            name: "Hermes Puggington",
        });

        const mapWithout = new TestMapWithOptionalRef(
            {
                color: "red",
            },
            { owner: me }
        );

        expect(mapWithout.color).toEqual("red");
        expect(mapWithout.nested).toEqual(undefined);

        const mapWith = new TestMapWithOptionalRef(
            {
                color: "red",
                nested: new NestedMap(
                    {
                        name: "wow!",
                        twiceNested: new TwiceNestedMap(
                            { taste: "sour" },
                            { owner: me }
                        ),
                    },
                    { owner: me }
                ),
            },
            { owner: me }
        );

        expect(mapWith.color).toEqual("red");
        expect(mapWith.nested?.name).toEqual("wow!");
        expect(mapWith.nested?.[rawSym]).toBeDefined();
    });
});
