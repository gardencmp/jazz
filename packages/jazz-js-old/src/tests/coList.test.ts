import { expect, describe, test, beforeEach } from "vitest";
import { CoListOf, SimpleAccount, imm, jazzReady } from "../index.js";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoList operations", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    class TestList extends CoListOf(imm.string) {}

    const list = new TestList(me, ["red", "blue"]);

    test("Construction", () => {
        expect(list[0]).toEqual("red");
        expect(list[1]).toEqual("blue");
        expect(list.length).toEqual(2);
    });

    describe("Reading", () => {
        test("map() works", () => {
            expect(list.map((item) => item.toUpperCase())).toEqual([
                "RED",
                "BLUE",
            ]);
        });

        test("forEach() works", () => {
            const result: string[] = [];
            list.forEach((item) => result.push(item.toUpperCase()));
            expect(result).toEqual(["RED", "BLUE"]);
        });

        test("filter() works", () => {
            expect(list.filter((item) => item === "red")).toEqual(["red"]);
        });

        test("find() works", () => {
            expect(list.find((item) => item === "red")).toEqual("red");
        });

        test("findIndex() works", () => {
            expect(list.findIndex((item) => item === "red")).toEqual(0);
        });

        test("indexOf() works", () => {
            expect(list.indexOf("blue")).toEqual(1);
        });

        test("includes() works", () => {
            expect(list.includes("blue")).toEqual(true);
        });

        test("join() works", () => {
            expect(list.join(" ")).toEqual("red blue");
        });

        test("lastIndexOf() works", () => {
            expect(list.lastIndexOf("blue")).toEqual(1);
        });

        test("slice() works", () => {
            expect(list.slice(1)).toEqual(["blue"]);
        });

        test("toString() works", () => {
            expect(list.toString()).toEqual("red,blue");
        });

        test("toLocaleString() works", () => {
            expect(list.toLocaleString()).toEqual("red,blue");
        });

        test("values() works", () => {
            expect([...list.values()]).toEqual(["red", "blue"]);
        });

        test("entries() works", () => {
            expect([...list.entries()]).toEqual([
                [0, "red"],
                [1, "blue"],
            ]);
        });

        test("keys() works", () => {
            expect([...list.keys()]).toEqual([0, 1]);
        });

        test("reduce() works", () => {
            expect(
                list.reduce((acc, item) => {
                    return acc + item;
                }, "")
            ).toEqual("redblue");
        });

        test("reduceRight() works", () => {
            expect(
                list.reduceRight((acc, item) => {
                    return acc + item;
                }, "")
            ).toEqual("bluered");
        });

        test("some() works", () => {
            expect(list.some((item) => item === "red")).toEqual(true);
        });

        test("every() works", () => {
            expect(list.every((item) => item === "red")).toEqual(false);
        });

        test("at() works", () => {
            expect(list.at(0)).toEqual("red");
        });

        test("concat() works", () => {
            expect(list.concat(["green"])).toEqual(["red", "blue", "green"]);
        });

        test("Symbol.iterator works", () => {
            expect([...list]).toEqual(["red", "blue"]);
        });
    });

    describe("Mutation", () => {
        test("push() with one item", () => {
            list.push("green");
            expect(list[2]).toEqual("green");
            expect(list.meta._raw.get(2)).toEqual("green");
            expect(list.length).toEqual(3);
        });

        test("push() with multiple items", () => {
            list.push("orange", "yellow");
            expect(list[3]).toEqual("orange");
            expect(list[4]).toEqual("yellow");
            expect(list.meta._raw.get(3)).toEqual("orange");
            expect(list.meta._raw.get(4)).toEqual("yellow");
            expect(list.length).toEqual(5);
        });

        test("unshift() with one item", () => {
            list.unshift("purple");
            expect(list[0]).toEqual("purple");
            expect(list[1]).toEqual("red");
            expect(list[2]).toEqual("blue");
            expect(list[3]).toEqual("green");
            expect(list[4]).toEqual("orange");
            expect(list[5]).toEqual("yellow");
            expect(list.meta._raw.get(0)).toEqual("purple");
            expect(list.length).toEqual(6);
        });

        test("unshift() with multiple items", () => {
            list.unshift("black", "white");
            expect(list[0]).toEqual("black");
            expect(list[1]).toEqual("white");
            expect(list[2]).toEqual("purple");
            expect(list[3]).toEqual("red");
            expect(list[4]).toEqual("blue");
            expect(list[5]).toEqual("green");
            expect(list[6]).toEqual("orange");
            expect(list[7]).toEqual("yellow");
            expect(list.meta._raw.get(0)).toEqual("black");
            expect(list.meta._raw.get(1)).toEqual("white");
            expect(list.length).toEqual(8);
        });

        test("splice() that removes one element works", () => {
            const deleted = list.splice(3, 1);
            expect(deleted).toEqual(["red"]);
            expect(list[0]).toEqual("black");
            expect(list[1]).toEqual("white");
            expect(list[2]).toEqual("purple");
            expect(list[3]).toEqual("blue");
            expect(list[4]).toEqual("green");
            expect(list[5]).toEqual("orange");
            expect(list[6]).toEqual("yellow");
            expect(list[7]).toEqual(undefined);
            expect(list.meta._raw.get(0)).toEqual("black");
            expect(list.meta._raw.get(1)).toEqual("white");
            expect(list.meta._raw.get(2)).toEqual("purple");
            expect(list.meta._raw.get(3)).toEqual("blue");
            expect(list.meta._raw.get(4)).toEqual("green");
            expect(list.meta._raw.get(5)).toEqual("orange");
            expect(list.meta._raw.get(6)).toEqual("yellow");
            expect(list.length).toEqual(7);
        });
    });
});

describe("CoList resolution", async () => {
    class TwiceNestedList extends CoListOf(imm.string) {}
    class NestedList extends CoListOf(TwiceNestedList) {}
    class TestList extends CoListOf(NestedList) {}

    const initNodeAndList = async () => {
        const me = await SimpleAccount.createControlledAccount({
            name: "Hermes Puggington",
        });

        const list = new TestList(me, [
            new NestedList(me, [
                new TwiceNestedList(me, ["sour"]),
                new TwiceNestedList(me, ["sweet"]),
            ]),
        ]);

        return { me, list };
    };

    test("Construction", async () => {
        const { list } = await initNodeAndList();
        expect(list[0][0][0]).toEqual("sour");
        expect(list[0][0].length).toEqual(1);
        expect(list[0][1][0]).toEqual("sweet");
    });

    test("Loading and availability", async () => {
        const { me, list } = await initNodeAndList();
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

        const loadedList = await TestList.load(list.id, { as: meOnSecondPeer });

        expect(loadedList?.[0]).toEqual(undefined);
        expect(loadedList?.meta.refs[0]?.id).toEqual(list[0].id);
        expect(loadedList?.meta.refs[0]?.loaded).toEqual(false);

        const loadedNestedList = await NestedList.load(list[0].id, {
            as: meOnSecondPeer,
        });

        expect(loadedList?.[0]).toBeDefined();
        expect(loadedList?.meta.refs[0]?.loaded).toEqual(true);
        expect(loadedList?.meta.refs[0]?.value).toEqual(loadedNestedList);
        expect(loadedList?.[0][0]).toEqual(undefined);

        const loadedTwiceNestedList = await TwiceNestedList.load(
            list[0][0].id,
            { as: meOnSecondPeer }
        );

        expect(loadedList?.[0][0][0]).toEqual("sour");
        expect(loadedList?.[0].meta.refs[0]?.value).toEqual(
            loadedTwiceNestedList
        );
    });

    test("Subscription & auto-resolution", async () => {
        const { me, list } = await initNodeAndList();

        const [initialAsPeer, secondAsPeer] = connectedPeers(
            "initial",
            "second",
            { peer1role: "server", peer2role: "client" }
        );

        me._raw.core.node.syncManager.addPeer(secondAsPeer);

        const meOnSecondPeer = await SimpleAccount.loadControlledAccount({
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
                    (subscribedList: TestList) => {
                        console.log(
                            "subscribedList[0]?.[0]?.[0]",
                            subscribedList[0]?.[0]?.[0]
                        );
                        Effect.runPromise(Queue.offer(queue, subscribedList));
                    }
                );

                const update1 = yield* $(Queue.take(queue));
                expect(update1[0]).toEqual(undefined);

                const update2 = yield* $(Queue.take(queue));
                expect(update2[0]).toBeDefined();
                expect(update2[0][0]).toEqual(undefined);

                const update3 = yield* $(Queue.take(queue));
                expect(update3[0][0][0]).toEqual("sour");
                expect(update3[0][0].length).toEqual(1);

                update3[0][0][0] = "salty";

                const update4 = yield* $(Queue.take(queue));
                expect(update4[0][0][0]).toEqual("salty");
                expect(update4[0][0].length).toEqual(1);

                const oldTwiceNested = update4[0][0];

                // When assigning a new nested value, we get an update
                const newNested = new NestedList(meOnSecondPeer, [
                    new TwiceNestedList(meOnSecondPeer, ["umami"]),
                ]);

                update4[0] = newNested;

                const update5 = yield* $(Queue.take(queue));
                expect(update5[0][0][0]).toEqual("umami");
                expect(update5[0][0].length).toEqual(1);

                // we get updates when the new nested value changes
                update5[0][0][0] = "bitter";

                const update6 = yield* $(Queue.take(queue));
                expect(update6[0][0][0]).toEqual("bitter");
                expect(update6[0][0].length).toEqual(1);
                yield* $(Queue.take(queue));

                // ...but we don't get updates on the old nested value anymore
                oldTwiceNested[0] = "sweet";
                console.log("after set");

                yield* $(
                    Effect.raceFirst(
                        Effect.flatMap(Queue.take(queue), (update) =>
                            Effect.fail({ err: "Unexpected update", update })
                        ),
                        Effect.sleep(100)
                    )
                );

                console.log("got here");

                newNested[0][0] = "sour";
                const update7 = yield* $(Queue.take(queue));
                expect(update7[0][0][0]).toEqual("sour");
            })
        );
    });
});
