import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Co, S, SimpleAccount, jazzReady } from "..";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoList operations", async () => {
    const me = await SimpleAccount.create({
        name: "Hermes Puggington",
    });

    class TestList extends Co.list(S.string).as<TestList>() {}

    const list = new TestList(["bread", "butter", "onion"], { owner: me });

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
            const list = new TestList(["bread", "butter", "onion"], {
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
            const list = new TestList(["bread", "butter", "onion"], {
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
            const list = new TestList(["bread", "butter", "onion"], {
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
            const list = new TestList(["bread", "butter", "onion"], {
                owner: me,
            });
            expect(list.pop()).toBe("onion");
            expect(list.length).toBe(2);
            expect(list._raw.asArray()).toEqual(["bread", "butter"]);
        });

        test("shift", () => {
            const list = new TestList(["bread", "butter", "onion"], {
                owner: me,
            });
            expect(list.shift()).toBe("bread");
            expect(list.length).toBe(2);
            expect(list._raw.asArray()).toEqual(["butter", "onion"]);
        });

        test("splice", () => {
            const list = new TestList(["bread", "butter", "onion"], {
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
    class TwiceNestedList extends Co.list(S.string).as<TwiceNestedList>() {
        joined() {
            return this.join(",");
        }
    }

    class NestedList extends Co.list(TwiceNestedList).as<NestedList>() {}

    class TestList extends Co.list(NestedList).as<TestList>() {}

    const initNodeAndList = async () => {
        const me = await SimpleAccount.create({
            name: "Hermes Puggington",
        });

        const list = new TestList(
            [
                new NestedList(
                    [new TwiceNestedList(["a", "b"], { owner: me })],
                    { owner: me }
                ),
                new NestedList(
                    [new TwiceNestedList(["c", "d"], { owner: me })],
                    { owner: me }
                ),
            ],
            { owner: me }
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
            { peer1role: "server", peer2role: "client" }
        );
        me._raw.core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await SimpleAccount.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        const loadedList = await TestList.load(list.id, { as: meOnSecondPeer });

        expect(loadedList?.[0]).toBe(undefined);
        expect(loadedList?._refs[0]?.id).toEqual(list[0]!.id);

        const loadedNestedList = await NestedList.load(list[0]!.id, {
            as: meOnSecondPeer,
        });

        expect(loadedList?.[0]).toBeDefined();
        expect(loadedList?.[0]?.[0]).toBeUndefined();
        expect(loadedList?.[0]?._refs[0]?.id).toEqual(list[0]![0]!.id);
        expect(loadedList?._refs[0]?.value).toEqual(loadedNestedList);

        const loadedTwiceNestedList = await TwiceNestedList.load(
            list[0]![0]!.id,
            { as: meOnSecondPeer }
        );

        expect(loadedList?.[0]?.[0]).toBeDefined();
        expect(loadedList?.[0]?.[0]?.[0]).toBe("a");
        expect(loadedList?.[0]?.[0]?.joined()).toBe("a,b");
        expect(loadedList?.[0]?._refs[0]?.id).toEqual(list[0]?.[0]?.id);
        expect(loadedList?.[0]?._refs[0]?.value).toEqual(
            loadedTwiceNestedList
        );

        const otherNestedList = new NestedList(
            [new TwiceNestedList(["e", "f"], { owner: meOnSecondPeer })],
            { owner: meOnSecondPeer }
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
            { peer1role: "server", peer2role: "client" }
        );
        me._raw.core.node.syncManager.addPeer(secondPeer);
        const meOnSecondPeer = await SimpleAccount.become({
            accountID: me.id,
            accountSecret: me._raw.agentSecret,
            peersToLoadFrom: [initialAsPeer],
            sessionID: newRandomSessionID(me.id as any),
        });

        await Effect.runPromise(
            Effect.gen(function* ($) {
                const queue = yield* $(Queue.unbounded<TestList>());

                TestList.subscribe(
                    list.id,
                    { as: meOnSecondPeer },
                    (subscribedList) => {
                        console.log(
                            "subscribedList?.[0]?.[0]?.[0]",
                            subscribedList?.[0]?.[0]?.[0]
                        );
                        Effect.runPromise(Queue.offer(queue, subscribedList));
                    }
                );

                const update1 = yield* $(Queue.take(queue));
                expect(update1?.[0]).toEqual(undefined);

                const update2 = yield* $(Queue.take(queue));
                expect(update2?.[0]).toBeDefined();
                expect(update2?.[0]?.[0]).toBeUndefined();

                const update3 = yield* $(Queue.take(queue));
                expect(update3?.[0]?.[0]).toBeDefined();
                expect(update3?.[0]?.[0]?.[0]).toBe("a");
                expect(update3?.[0]?.[0]?.joined()).toBe("a,b");

                update3[0]![0]![0] = "x";

                const update4 = yield* $(Queue.take(queue));
                expect(update4?.[0]?.[0]?.[0]).toBe("x");

                // When assigning a new nested value, we get an update

                const newTwiceNestedList = new TwiceNestedList(["y", "z"], {
                    owner: meOnSecondPeer,
                });

                const newNestedList = new NestedList([newTwiceNestedList], {
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
            })
        );
    });
});
