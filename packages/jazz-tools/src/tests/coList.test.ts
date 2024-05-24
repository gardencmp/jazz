import { expect, describe, test } from "vitest";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Account, CoList, WasmCrypto, co, isControlledAccount } from "../index.js";

const Crypto = await WasmCrypto.create();

describe("Simple CoList operations", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto,
    });

    class TestList extends CoList.Of(co.string) {}

    const list = TestList.create(["bread", "butter", "onion"], { owner: me });

    test("Construction", () => {
        expect(list[0]).toBe("bread");
        expect(list[1]).toBe("butter");
        expect(list[2]).toBe("onion");
        expect(list._raw.asArray()).toEqual(["bread", "butter", "onion"]);
        expect(list.length).toBe(3);
        expect(list.map((item) => item.toUpperCase())).toEqual([
            "BREAD",
            "BUTTER",
            "ONION",
        ]);
    });

    describe("Mutation", () => {
        test("assignment", () => {
            const list = TestList.create(["bread", "butter", "onion"], {
                owner: me,
            });
            list[1] = "margarine";
            expect(list._raw.asArray()).toEqual([
                "bread",
                "margarine",
                "onion",
            ]);
            expect(list[1]).toBe("margarine");
        });

        test("push", () => {
            const list = TestList.create(["bread", "butter", "onion"], {
                owner: me,
            });
            list.push("cheese");
            expect(list[3]).toBe("cheese");
            expect(list._raw.asArray()).toEqual([
                "bread",
                "butter",
                "onion",
                "cheese",
            ]);
        });

        test("unshift", () => {
            const list = TestList.create(["bread", "butter", "onion"], {
                owner: me,
            });
            list.unshift("lettuce");
            expect(list[0]).toBe("lettuce");
            expect(list._raw.asArray()).toEqual([
                "lettuce",
                "bread",
                "butter",
                "onion",
            ]);
        });

        test("pop", () => {
            const list = TestList.create(["bread", "butter", "onion"], {
                owner: me,
            });
            expect(list.pop()).toBe("onion");
            expect(list.length).toBe(2);
            expect(list._raw.asArray()).toEqual(["bread", "butter"]);
        });

        test("shift", () => {
            const list = TestList.create(["bread", "butter", "onion"], {
                owner: me,
            });
            expect(list.shift()).toBe("bread");
            expect(list.length).toBe(2);
            expect(list._raw.asArray()).toEqual(["butter", "onion"]);
        });

        test("splice", () => {
            const list = TestList.create(["bread", "butter", "onion"], {
                owner: me,
            });
            list.splice(1, 1, "salt", "pepper");
            expect(list.length).toBe(4);
            expect(list._raw.asArray()).toEqual([
                "bread",
                "salt",
                "pepper",
                "onion",
            ]);
        });
    });
});

describe("CoList resolution", async () => {
    class TwiceNestedList extends CoList.Of(co.string) {
        joined() {
            return this.join(",");
        }
    }

    class NestedList extends CoList.Of(co.ref(TwiceNestedList)) {}

    class TestList extends CoList.Of(co.ref(NestedList)) {}

    const initNodeAndList = async () => {
        const me = await Account.create({
            creationProps: { name: "Hermes Puggington" },
            crypto: Crypto,
        });

        const list = TestList.create(
            [
                NestedList.create(
                    [TwiceNestedList.create(["a", "b"], { owner: me })],
                    { owner: me },
                ),
                NestedList.create(
                    [TwiceNestedList.create(["c", "d"], { owner: me })],
                    { owner: me },
                ),
            ],
            { owner: me },
        );

        return { me, list };
    };

    test("Construction", async () => {
        const { list } = await initNodeAndList();

        expect(list[0]?.[0]?.[0]).toBe("a");
        expect(list[0]?.[0]?.joined()).toBe("a,b");
        expect(list[0]?.[0]?.id).toBeDefined();
        expect(list[1]?.[0]?.[0]).toBe("c");
    });

    test("Loading and availability", async () => {
        const { me, list } = await initNodeAndList();

        const [initialAsPeer, secondPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" },
        );
        if (!isControlledAccount(me)) { throw("me is not a controlled account") }
        me._raw.core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sessionID: newRandomSessionID(me.id as any),
            crypto: Crypto,
        });

        const loadedList = await TestList.load(list.id, meOnSecondPeer, []);

        expect(loadedList?.[0]).toBe(null);
        expect(loadedList?._refs[0]?.id).toEqual(list[0]!.id);

        const loadedNestedList = await NestedList.load(
            list[0]!.id,
            meOnSecondPeer,
            [],
        );

        expect(loadedList?.[0]).toBeDefined();
        expect(loadedList?.[0]?.[0]).toBe(null);
        expect(loadedList?.[0]?._refs[0]?.id).toEqual(list[0]![0]!.id);
        expect(loadedList?._refs[0]?.value).toEqual(loadedNestedList);

        const loadedTwiceNestedList = await TwiceNestedList.load(
            list[0]![0]!.id,
            meOnSecondPeer,
            [],
        );

        expect(loadedList?.[0]?.[0]).toBeDefined();
        expect(loadedList?.[0]?.[0]?.[0]).toBe("a");
        expect(loadedList?.[0]?.[0]?.joined()).toBe("a,b");
        expect(loadedList?.[0]?._refs[0]?.id).toEqual(list[0]?.[0]?.id);
        expect(loadedList?.[0]?._refs[0]?.value).toEqual(loadedTwiceNestedList);

        const otherNestedList = NestedList.create(
            [TwiceNestedList.create(["e", "f"], { owner: meOnSecondPeer })],
            { owner: meOnSecondPeer },
        );

        loadedList![0] = otherNestedList;
        expect(loadedList?.[0]).toEqual(otherNestedList);
        expect(loadedList?._refs[0]?.id).toEqual(otherNestedList.id);
    });

    test("Subscription & auto-resolution", async () => {
        const { me, list } = await initNodeAndList();

        const [initialAsPeer, secondPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" },
        );
        if (!isControlledAccount(me)) { throw("me is not a controlled account") }
        me._raw.core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await Account.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sessionID: newRandomSessionID(me.id as any),
            crypto: Crypto,
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<TestList>());

                TestList.subscribe(
                    list.id,
                    meOnSecondPeer,
                    [],
                    (subscribedList) => {
                        console.log(
                            "subscribedList?.[0]?.[0]?.[0]",
                            subscribedList?.[0]?.[0]?.[0],
                        );
                        void Effect.runPromise(
                            Queue.offer(queue, subscribedList),
                        );
                    },
                );

                const update1 = yield* $(Queue.take(queue));
                expect(update1?.[0]).toBe(null);

                const update2 = yield* $(Queue.take(queue));
                expect(update2?.[0]).toBeDefined();
                expect(update2?.[0]?.[0]).toBe(null);

                const update3 = yield* $(Queue.take(queue));
                expect(update3?.[0]?.[0]).toBeDefined();
                expect(update3?.[0]?.[0]?.[0]).toBe("a");
                expect(update3?.[0]?.[0]?.joined()).toBe("a,b");

                update3[0]![0]![0] = "x";

                const update4 = yield* $(Queue.take(queue));
                expect(update4?.[0]?.[0]?.[0]).toBe("x");

                // When assigning a new nested value, we get an update

                const newTwiceNestedList = TwiceNestedList.create(["y", "z"], {
                    owner: meOnSecondPeer,
                });

                const newNestedList = NestedList.create([newTwiceNestedList], {
                    owner: meOnSecondPeer,
                });

                update4[0] = newNestedList;

                const update5 = yield* $(Queue.take(queue));
                expect(update5?.[0]?.[0]?.[0]).toBe("y");
                expect(update5?.[0]?.[0]?.joined()).toBe("y,z");

                // we get updates when the new nested value changes
                newTwiceNestedList[0] = "w";
                const update6 = yield* $(Queue.take(queue));
                expect(update6?.[0]?.[0]?.[0]).toBe("w");
            }),
        );
    });
});
