import { expect, describe, test, expectTypeOf } from "vitest";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import {
    Account,
    Encoders,
    CoMap,
    co,
    WasmCrypto,
    isControlledAccount,
    cojsonInternals,
} from "../index.js";

const Crypto = await WasmCrypto.create();

describe("Simple CoMap operations", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto,
    });

    class TestMap extends CoMap {
        color = co.string;
        _height = co.number;
        birthday = co.encoded(Encoders.Date);
        name? = co.string;
        nullable = co.optional.encoded<string | undefined>({
            encode: (value: string | undefined) => value || null,
            decode: (value: unknown) => (value as string) || undefined,
        });
        optionalDate = co.optional.encoded(Encoders.Date);

        get roughColor() {
            return this.color + "ish";
        }
    }

    console.log("TestMap schema", TestMap.prototype._schema);

    const birthday = new Date();

    const map = TestMap.create(
        {
            color: "red",
            _height: 10,
            birthday: birthday,
            nullable: undefined,
        },
        { owner: me },
    );

    test("Construction", () => {
        expect(map.color).toEqual("red");
        expect(map.roughColor).toEqual("redish");
        expect(map._height).toEqual(10);
        expect(map.birthday).toEqual(birthday);
        expect(map._raw.get("birthday")).toEqual(birthday.toISOString());
        expect(Object.keys(map)).toEqual([
            "color",
            "_height",
            "birthday",
            "nullable",
        ]);
    });

    test("Construction with too many things provided", () => {
        const mapWithExtra = TestMap.create(
            {
                color: "red",
                _height: 10,
                birthday: birthday,
                name: "Hermes",
                extra: "extra",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
            { owner: me },
        );

        expect(mapWithExtra.color).toEqual("red");
    });

    describe("Mutation", () => {
        test("assignment & deletion", () => {
            map.color = "blue";
            expect(map.color).toEqual("blue");
            expect(map._raw.get("color")).toEqual("blue");
            const newBirthday = new Date();
            map.birthday = newBirthday;
            expect(map.birthday).toEqual(newBirthday);
            expect(map._raw.get("birthday")).toEqual(newBirthday.toISOString());

            Object.assign(map, { color: "green", _height: 20 });
            expect(map.color).toEqual("green");
            expect(map._raw.get("color")).toEqual("green");
            expect(map._height).toEqual(20);
            expect(map._raw.get("_height")).toEqual(20);

            map.nullable = "not null";
            map.nullable = undefined;
            delete map.nullable;
            map.nullable = undefined;

            map.name = "Secret name";
            expect(map.name).toEqual("Secret name");
            map.name = undefined;
            expect(map.name).toEqual(undefined);
            expect(Object.keys(map)).toContain("name");
            delete map.name;
            expect(map.name).toEqual(undefined);
            expect(Object.keys(map)).not.toContain("name");
        });
    });

    describe("property existence", () => {
        class TestMap extends CoMap.Record(co.string) {}
        test("CoMap", () => {
            const map = TestMap.create(
                { name: "test" },
                {
                    owner: me,
                },
            );

            expect("name" in map).toBe(true);
            expect("something" in map).toBe(false);
        });
    });

    class RecursiveMap extends CoMap {
        name = co.string;
        next?: co<RecursiveMap | null> = co.ref(RecursiveMap);
    }

    const recursiveMap = RecursiveMap.create(
        {
            name: "first",
            next: RecursiveMap.create(
                {
                    name: "second",
                    next: RecursiveMap.create(
                        {
                            name: "third",
                        },
                        { owner: me },
                    ),
                },
                { owner: me },
            ),
        },
        { owner: me },
    );

    describe("Recursive CoMap", () => {
        test("Construction", () => {
            expect(recursiveMap.name).toEqual("first");
            expect(recursiveMap.next?.name).toEqual("second");
            expect(recursiveMap.next?.next?.name).toEqual("third");
        });
    });

    class MapWithEnumOfMaps extends CoMap {
        name = co.string;
        child = co.ref<typeof ChildA | typeof ChildB>((raw) =>
            raw.get("type") === "a" ? ChildA : ChildB,
        );
    }

    class ChildA extends CoMap {
        type = co.literal("a");
        value = co.number;
    }

    class ChildB extends CoMap {
        type = co.literal("b");
        value = co.string;
    }

    const mapWithEnum = MapWithEnumOfMaps.create(
        {
            name: "enum",
            child: ChildA.create(
                {
                    type: "a",
                    value: 5,
                },
                { owner: me },
            ),
        },
        { owner: me },
    );

    test("Enum of maps", () => {
        expect(mapWithEnum.name).toEqual("enum");
        expect(mapWithEnum.child?.type).toEqual("a");
        expect(mapWithEnum.child?.value).toEqual(5);
        expect(mapWithEnum.child?.id).toBeDefined();
    });

    class SuperClassMap extends CoMap {
        name = co.string;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class SubClassMap extends SuperClassMap {
        name = co.literal("specificString");
        value = co.number;
        extra = co.ref(TestMap);
    }

    class GenericMapWithLoose<out T extends string = string> extends CoMap {
        name = co.json<T>();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const loose: GenericMapWithLoose<string> = {} as GenericMapWithLoose<
        "a" | "b"
    >;
});

describe("CoMap resolution", async () => {
    class TwiceNestedMap extends CoMap {
        taste = co.string;
    }

    class NestedMap extends CoMap {
        name = co.string;
        twiceNested = co.ref(TwiceNestedMap);

        get _fancyName() {
            return "Sir " + this.name;
        }
    }

    class TestMap extends CoMap {
        color = co.string;
        height = co.number;
        nested = co.ref(NestedMap);

        get _roughColor() {
            return this.color + "ish";
        }
    }

    const initNodeAndMap = async () => {
        const me = await Account.create({
            creationProps: { name: "Hermes Puggington" },
            crypto: Crypto,
        });

        const map = TestMap.create(
            {
                color: "red",
                height: 10,
                nested: NestedMap.create(
                    {
                        name: "nested",
                        twiceNested: TwiceNestedMap.create(
                            { taste: "sour" },
                            { owner: me },
                        ),
                    },
                    { owner: me },
                ),
            },
            { owner: me },
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
            {
                peer1role: "server",
                peer2role: "client",
            },
        );

        if (!isControlledAccount(me)) {
            throw "me is not a controlled account";
        }
        me._raw.core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sessionID: newRandomSessionID(me.id as any),
            crypto: Crypto,
        });

        const loadedMap = await TestMap.load(map.id, meOnSecondPeer, {});

        expect(loadedMap?.color).toEqual("red");
        expect(loadedMap?.height).toEqual(10);
        expect(loadedMap?.nested).toEqual(null);
        expect(loadedMap?._refs.nested?.id).toEqual(map.nested?.id);
        expect(loadedMap?._refs.nested?.value).toEqual(null);

        const loadedNestedMap = await NestedMap.load(
            map.nested!.id,
            meOnSecondPeer,
            {},
        );

        expect(loadedMap?.nested?.name).toEqual("nested");
        expect(loadedMap?.nested?._fancyName).toEqual("Sir nested");
        expect(loadedMap?._refs.nested?.value).toEqual(loadedNestedMap);
        expect(loadedMap?.nested?.twiceNested?.taste).toEqual(undefined);

        const loadedTwiceNestedMap = await TwiceNestedMap.load(
            map.nested!.twiceNested!.id,
            meOnSecondPeer,
            {},
        );

        expect(loadedMap?.nested?.twiceNested?.taste).toEqual("sour");
        expect(loadedMap?.nested?._refs.twiceNested?.value).toEqual(
            loadedTwiceNestedMap,
        );

        const otherNestedMap = NestedMap.create(
            {
                name: "otherNested",
                twiceNested: TwiceNestedMap.create(
                    { taste: "sweet" },
                    { owner: meOnSecondPeer },
                ),
            },
            { owner: meOnSecondPeer },
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
            {
                peer1role: "server",
                peer2role: "client",
            },
        );

        if (!isControlledAccount(me)) {
            throw "me is not a controlled account";
        }
        me._raw.core.node.syncManager.addPeer(secondAsPeer);
        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sessionID: newRandomSessionID(me.id as any),
            crypto: Crypto,
        });

        const queue = new cojsonInternals.Channel<TestMap>();

        TestMap.subscribe(map.id, meOnSecondPeer, {}, (subscribedMap) => {
            console.log(
                "subscribedMap.nested?.twiceNested?.taste",
                subscribedMap.nested?.twiceNested?.taste,
            );
            void queue.push(subscribedMap);
        });

        const update1 = (await queue.next()).value;
        expect(update1.nested).toEqual(null);

        const update2 = (await queue.next()).value;
        expect(update2.nested?.name).toEqual("nested");

        map.nested!.name = "nestedUpdated";

        const _ = (await queue.next()).value;
        const update3 = (await queue.next()).value;
        expect(update3.nested?.name).toEqual("nestedUpdated");

        const oldTwiceNested = update3.nested!.twiceNested;
        expect(oldTwiceNested?.taste).toEqual("sour");

        // When assigning a new nested value, we get an update
        const newTwiceNested = TwiceNestedMap.create(
            {
                taste: "sweet",
            },
            { owner: meOnSecondPeer },
        );

        const newNested = NestedMap.create(
            {
                name: "newNested",
                twiceNested: newTwiceNested,
            },
            { owner: meOnSecondPeer },
        );

        update3.nested = newNested;

        (await queue.next()).value;
        // const update4 = (await queue.next()).value;
        const update4b = (await queue.next()).value;

        expect(update4b.nested?.name).toEqual("newNested");
        expect(update4b.nested?.twiceNested?.taste).toEqual("sweet");

        // we get updates when the new nested value changes
        newTwiceNested.taste = "salty";
        const update5 = (await queue.next()).value;
        expect(update5.nested?.twiceNested?.taste).toEqual("salty");

        newTwiceNested.taste = "umami";
        const update6 = (await queue.next()).value;
        expect(update6.nested?.twiceNested?.taste).toEqual("umami");
    });

    class TestMapWithOptionalRef extends CoMap {
        color = co.string;
        nested = co.optional.ref(NestedMap);
    }

    test("Construction with optional", async () => {
        const me = await Account.create({
            creationProps: { name: "Hermes Puggington" },
            crypto: Crypto,
        });

        const mapWithout = TestMapWithOptionalRef.create(
            {
                color: "red",
            },
            { owner: me },
        );

        expect(mapWithout.color).toEqual("red");
        expect(mapWithout.nested).toEqual(undefined);

        const mapWith = TestMapWithOptionalRef.create(
            {
                color: "red",
                nested: NestedMap.create(
                    {
                        name: "wow!",
                        twiceNested: TwiceNestedMap.create(
                            { taste: "sour" },
                            { owner: me },
                        ),
                    },
                    { owner: me },
                ),
            },
            { owner: me },
        );

        expect(mapWith.color).toEqual("red");
        expect(mapWith.nested?.name).toEqual("wow!");
        expect(mapWith.nested?._fancyName).toEqual("Sir wow!");
        expect(mapWith.nested?._raw).toBeDefined();
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
    class TestRecord extends CoMap {
        [co.items] = co.number;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
    interface TestRecord extends Record<string, number> {}

    test("Construction with index signature", async () => {
        const me = await Account.create({
            creationProps: { name: "Hermes Puggington" },
            crypto: Crypto,
        });

        const record = TestRecord.create(
            {
                height: 5,
                other: 3,
            },
            { owner: me },
        );

        expect(record.height).toEqual(5);
        expect(record._raw.get("height")).toEqual(5);
        expect(record.other).toEqual(3);
        expect(record._raw.get("other")).toEqual(3);
        expect(Object.keys(record)).toEqual(["height", "other"]);
        expect(record.toJSON()).toMatchObject({
            _type: "CoMap",
            height: 5,
            id: expect.any(String),
            other: 3,
        });
    });

    class TestRecord2 extends CoMap.Record(co.number) {}

    test("Construction with index signature (shorthand)", async () => {
        const me = await Account.create({
            creationProps: { name: "Hermes Puggington" },
            crypto: Crypto,
        });

        const record = TestRecord2.create(
            {
                height: 5,
                other: 3,
            },
            { owner: me },
        );

        expect(record.height).toEqual(5);
        expect(record._raw.get("height")).toEqual(5);
        expect(record.other).toEqual(3);
        expect(record._raw.get("other")).toEqual(3);
        expect(Object.keys(record)).toEqual(["height", "other"]);
    });

    class TestRecordRef extends CoMap.Record(co.ref(TwiceNestedMap)) {}

    test("Construction with index signature ref", async () => {
        const me = await Account.create({
            creationProps: { name: "Hermes Puggington" },
            crypto: Crypto,
        });

        const record = TestRecordRef.create(
            {
                firstNested: TwiceNestedMap.create(
                    { taste: "sour" },
                    { owner: me },
                ),
                secondNested: TwiceNestedMap.create(
                    { taste: "sweet" },
                    { owner: me },
                ),
            },
            { owner: me },
        );

        expect(record.firstNested?.taste).toEqual("sour");
        expect(record.firstNested?.id).toBeDefined();
        expect(record.secondNested?.taste).toEqual("sweet");
        expect(record.secondNested?.id).toBeDefined();
        expect(Object.keys(record)).toEqual(["firstNested", "secondNested"]);
        expect(Object.keys(record._refs)).toEqual([
            "firstNested",
            "secondNested",
        ]);
    });
});

describe("CoMap applyDiff", async () => {
    const me = await Account.create({
        creationProps: { name: "Tester McTesterson" },
        crypto: Crypto,
    });

    class TestMap extends CoMap {
        name = co.string;
        age = co.number;
        isActive = co.boolean;
        birthday = co.encoded(Encoders.Date);
        nested = co.ref(NestedMap);
        optionalField = co.optional.string;
    }

    class NestedMap extends CoMap {
        value = co.string;
    }

    test("Basic applyDiff", () => {
        const map = TestMap.create(
            {
                name: "Alice",
                age: 30,
                isActive: true,
                birthday: new Date("1990-01-01"),
                nested: NestedMap.create({ value: "original" }, { owner: me }),
            },
            { owner: me },
        );

        const newValues = {
            name: "Bob",
            age: 35,
            isActive: false,
        };

        map.applyDiff(newValues);

        expect(map.name).toEqual("Bob");
        expect(map.age).toEqual(35);
        expect(map.isActive).toEqual(false);
        expect(map.birthday).toEqual(new Date("1990-01-01"));
        expect(map.nested?.value).toEqual("original");
    });

    test("applyDiff with nested changes", () => {
        const map = TestMap.create(
            {
                name: "Charlie",
                age: 25,
                isActive: true,
                birthday: new Date("1995-01-01"),
                nested: NestedMap.create({ value: "original" }, { owner: me }),
            },
            { owner: me },
        );

        const newValues = {
            name: "David",
            nested: NestedMap.create({ value: "updated" }, { owner: me }),
        };

        map.applyDiff(newValues);

        expect(map.name).toEqual("David");
        expect(map.age).toEqual(25);
        expect(map.nested?.value).toEqual("updated");
    });

    test("applyDiff with encoded fields", () => {
        const map = TestMap.create(
            {
                name: "Eve",
                age: 28,
                isActive: true,
                birthday: new Date("1993-01-01"),
                nested: NestedMap.create({ value: "original" }, { owner: me }),
            },
            { owner: me },
        );

        const newValues = {
            birthday: new Date("1993-06-15"),
        };

        map.applyDiff(newValues);

        expect(map.birthday).toEqual(new Date("1993-06-15"));
    });

    test("applyDiff with optional fields", () => {
        const map = TestMap.create(
            {
                name: "Frank",
                age: 40,
                isActive: true,
                birthday: new Date("1980-01-01"),
                nested: NestedMap.create({ value: "original" }, { owner: me }),
            },
            { owner: me },
        );

        const newValues = {
            optionalField: "New optional value",
        };

        map.applyDiff(newValues);

        expect(map.optionalField).toEqual("New optional value");

        map.applyDiff({ optionalField: undefined });

        expect(map.optionalField).toBeUndefined();
    });

    test("applyDiff with no changes", () => {
        const map = TestMap.create(
            {
                name: "Grace",
                age: 35,
                isActive: true,
                birthday: new Date("1985-01-01"),
                nested: NestedMap.create({ value: "original" }, { owner: me }),
            },
            { owner: me },
        );

        const originalJSON = map.toJSON();

        map.applyDiff({});

        expect(map.toJSON()).toEqual(originalJSON);
    });

    test("applyDiff with invalid field", () => {
        const map = TestMap.create(
            {
                name: "Henry",
                age: 45,
                isActive: false,
                birthday: new Date("1975-01-01"),
                nested: NestedMap.create({ value: "original" }, { owner: me }),
            },
            { owner: me },
        );

        const newValues = {
            name: "Ian",
            invalidField: "This should be ignored",
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.applyDiff(newValues as any);

        expect(map.name).toEqual("Ian");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((map as any).invalidField).toBeUndefined();
    });
});

describe("CoMap Typescript validation", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto,
    });

    test("Is not ok to pass null into a required ref", () => {
        class TestMap extends CoMap {
            required = co.ref(NestedMap);
            optional = co.optional.ref(NestedMap);
        }

        class NestedMap extends CoMap {
            value = co.string;
        }

        expectTypeOf<typeof TestMap.create<TestMap>>().toBeCallableWith(
            {
                optional: NestedMap.create({ value: "" }, { owner: me }),
                // @ts-expect-error null can't be passed to a non-optional field
                required: null,
            },
            { owner: me },
        );
    });

    test("Is not ok if a required ref is omitted", () => {
        class TestMap extends CoMap {
            required = co.ref(NestedMap);
            optional = co.ref(NestedMap, { optional: true });
        }

        class NestedMap extends CoMap {
            value = co.string;
        }

        expectTypeOf<typeof TestMap.create<TestMap>>().toBeCallableWith(
            // @ts-expect-error non-optional fields can't be omitted
            {},
            { owner: me },
        );
    });

    test("Is ok to omit optional fields", () => {
        class TestMap extends CoMap {
            required = co.ref(NestedMap);
            optional = co.ref(NestedMap, { optional: true });
        }

        class NestedMap extends CoMap {
            value = co.string;
        }

        expectTypeOf<typeof TestMap.create<TestMap>>().toBeCallableWith(
            {
                required: NestedMap.create({ value: "" }, { owner: me }),
            },
            { owner: me },
        );

        expectTypeOf<typeof TestMap.create<TestMap>>().toBeCallableWith(
            {
                required: NestedMap.create({ value: "" }, { owner: me }),
                optional: null,
            },
            { owner: me },
        );
    });

    test("the required refs should be nullable", () => {
        class TestMap extends CoMap {
            required = co.ref(NestedMap);
            optional = co.ref(NestedMap, { optional: true });
        }

        class NestedMap extends CoMap {
            value = co.string;
        }

        const map = TestMap.create(
            {
                required: NestedMap.create({ value: "" }, { owner: me }),
            },
            { owner: me },
        );

        expectTypeOf(map.required).toBeNullable();
    });
});
