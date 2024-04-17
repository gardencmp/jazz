import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Account, jazzReady, Encoders, CoMap } from "..";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoMap operations", async () => {
    const me = await Account.create({
        name: "Hermes Puggington",
    });

    class TestMap extends CoMap<TestMap> {
        declare color: string;
        declare height: number;
        declare birthday: Date;
        declare name?: string;

        get _roughColor() {
            return this.color + "ish";
        }
    }
    TestMap.encoding({
        color: "json",
        height: "json",
        birthday: { encoded: Encoders.Date },
        name: "json",
    });

    console.log("TestMap schema", TestMap.prototype._encoding);

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
        expect(map._roughColor).toEqual("redish");
        expect(map.height).toEqual(10);
        expect(map.birthday).toEqual(birthday);
        expect(map._raw.get("birthday")).toEqual(birthday.toISOString());
    });

    describe("Mutation", () => {
        test("assignment", () => {
            map.color = "blue";
            expect(map.color).toEqual("blue");
            expect(map._raw.get("color")).toEqual("blue");
            const newBirthday = new Date();
            map.birthday = newBirthday;
            expect(map.birthday).toEqual(newBirthday);
            expect(map._raw.get("birthday")).toEqual(newBirthday.toISOString());

            Object.assign(map, { color: "green", height: 20 });
            expect(map.color).toEqual("green");
            expect(map._raw.get("color")).toEqual("green");
            expect(map.height).toEqual(20);
            expect(map._raw.get("height")).toEqual(20);

            map.name = "Secret name";
            expect(map.name).toEqual("Secret name");
            map.name = undefined;
            expect(map.name).toEqual(undefined);
        });
    });

    class RecursiveMap extends CoMap<RecursiveMap> {
        declare name: string;
        declare next: RecursiveMap | null;
    }
    RecursiveMap.encoding({
        name: "json",
        next: { ref: () => RecursiveMap },
    });

    const recursiveMap = new RecursiveMap(
        {
            name: "first",
            next: new RecursiveMap(
                {
                    name: "second",
                    next: new RecursiveMap(
                        {
                            name: "third",
                        },
                        { owner: me }
                    ),
                },
                { owner: me }
            ),
        },
        { owner: me }
    );

    describe("Recursive CoMap", () => {
        test("Construction", () => {
            expect(recursiveMap.name).toEqual("first");
            expect(recursiveMap.next?.name).toEqual("second");
            expect(recursiveMap.next?.next?.name).toEqual("third");
        });
    });
});

describe("CoMap resolution", async () => {
    class TwiceNestedMap extends CoMap<TwiceNestedMap> {
        taste!: string;
    }
    TwiceNestedMap.encoding({
        taste: "json",
    });

    class NestedMap extends CoMap<NestedMap> {
        name!: string;
        twiceNested!: TwiceNestedMap | null;

        get _fancyName() {
            return "Sir " + this.name;
        }
    }
    NestedMap.encoding({
        name: "json",
        twiceNested: { ref: () => TwiceNestedMap },
    });

    class TestMap extends CoMap<TestMap> {
        declare color: string;
        declare height: number;
        declare nested: NestedMap | null;

        get _roughColor() {
            return this.color + "ish";
        }
    }
    TestMap.encoding({
        color: "json",
        height: "json",
        nested: { ref: () => NestedMap },
    });

    const initNodeAndMap = async () => {
        const me = await Account.create({
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

        // const test: Schema.Schema.To<typeof NestedMap>

        expect(map.color).toEqual("red");
        expect(map._roughColor).toEqual("redish");
        expect(map.height).toEqual(10);
        expect(map.nested?.name).toEqual("nested");
        expect(map.nested?._fancyName).toEqual("Sir nested");
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
        me._raw.core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        const loadedMap = await TestMap.load(map.id, { as: meOnSecondPeer });

        expect(loadedMap?.color).toEqual("red");
        expect(loadedMap?.height).toEqual(10);
        expect(loadedMap?.nested).toEqual(null);
        expect(loadedMap?._refs.nested?.id).toEqual(map.nested?.id);
        expect(loadedMap?._refs.nested?.value).toEqual(null);

        const loadedNestedMap = await NestedMap.load(map.nested!.id, {
            as: meOnSecondPeer,
        });

        expect(loadedMap?.nested?.name).toEqual("nested");
        expect(loadedMap?.nested?._fancyName).toEqual("Sir nested");
        expect(loadedMap?._refs.nested?.value).toEqual(loadedNestedMap);
        expect(loadedMap?.nested?.twiceNested?.taste).toEqual(undefined);

        const loadedTwiceNestedMap = await TwiceNestedMap.load(
            map.nested!.twiceNested!.id,
            { as: meOnSecondPeer }
        );

        expect(loadedMap?.nested?.twiceNested?.taste).toEqual("sour");
        expect(loadedMap?.nested?._refs.twiceNested?.value).toEqual(
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
        expect(loadedMap?._refs.nested?.id).toEqual(otherNestedMap.id);
        expect(loadedMap?._refs.nested?.value).toEqual(otherNestedMap);
        expect(loadedMap?.nested?.twiceNested?.taste).toEqual("sweet");
        expect(loadedMap?.nested?._refs.twiceNested?.value).toBeDefined();
    });

    test("Subscription & auto-resolution", async () => {
        const { me, map } = await initNodeAndMap();

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
                const queue = yield* $(Queue.unbounded<TestMap>());

                TestMap.subscribe(
                    map.id,
                    { as: meOnSecondPeer },
                    (subscribedMap) => {
                        console.log(
                            "subscribedMap.nested?.twiceNested?.taste",
                            subscribedMap.nested?.twiceNested?.taste
                        );
                        Effect.runPromise(Queue.offer(queue, subscribedMap));
                    }
                );

                const update1 = yield* $(Queue.take(queue));
                expect(update1.nested).toEqual(null);

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

    class TestMapWithOptionalRef extends CoMap<TestMapWithOptionalRef> {
        declare color: string;
        declare nested?: NestedMap | null;
    }
    TestMapWithOptionalRef.encoding({
        color: "json",
        nested: { ref: () => NestedMap },
    });

    test("Construction with optional", async () => {
        const me = await Account.create({
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
        expect(mapWith.nested?._fancyName).toEqual("Sir wow!");
        expect(mapWith.nested?._raw).toBeDefined();
    });

    class TestRecord extends CoMap<TestRecord> {
        declare _item: number;
    }
    interface TestRecord extends Record<string, number> {}
    TestRecord.encoding({
        _item: "json",
    });

    test("Construction with index signature", async () => {
        const me = await Account.create({
            name: "Hermes Puggington",
        });

        const record = new TestRecord(
            {
                height: 5,
                other: 3,
            },
            { owner: me }
        );

        expect(record.height).toEqual(5);
        expect(record._raw.get("height")).toEqual(5);
        expect(record.other).toEqual(3);
        expect(record._raw.get("other")).toEqual(3);
        expect(Object.keys(record)).toEqual(["height", "other"]);
    });
});
