import { expect, describe, test, beforeEach } from "vitest";
import { CoListOf, CoMapOf, SimpleAccount, imm, jazzReady } from "./index.js";

import { webcrypto } from "node:crypto";
if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoMap operations", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    class TestMap extends CoMapOf({
        color: imm.string,
        height: imm.number,
    }) {}

    const map = new TestMap(
        {
            color: "red",
            height: 10,
        },
        { owner: me }
    );

    test("Construction", () => {
        expect(map.color).toEqual("red");
        expect(map.height).toEqual(10);
    });

    describe("Mutation", () => {
        test("assignment", () => {
            map.color = "blue";
            expect(map.color).toEqual("blue");
            expect(map.meta._raw.get("color")).toEqual("blue");
        });
    });
});

describe("Simple CoList operations", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    class TestList extends CoListOf(imm.string) {}

    const list = new TestList(["red", "blue"], { owner: me });

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
            expect(list.concat("green")).toEqual(["red", "blue", "green"]);
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
