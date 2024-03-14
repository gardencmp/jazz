import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { connectedPeers } from "cojson/src/streamUtils.js";
import { newRandomSessionID } from "cojson/src/coValueCore.js";
import { Effect, Queue } from "effect";
import { Co, S, SimpleAccount, jazzReady } from "..";
import { rawSym } from "../coValueInterfaces";
import { TypeId } from "@effect/schema/Schema";
import { CoMapInit, CoMapSchema } from "../coValues/coMap/coMap";

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

    class TestList extends Co.list(S.string) {}

    const list = new TestList(["bread", "butter", "onion"], { owner: me });

    test("Construction", () => {
        expect(list[0]).toBe("bread");
        expect(list[1]).toBe("butter");
        expect(list[2]).toBe("onion");
        expect(list[rawSym].asArray()).toEqual(["bread", "butter", "onion"]);
        expect(list.length).toBe(3);
    });

    describe("Mutation", () => {
        test("assignment", () => {
            const list = new TestList(["bread", "butter", "onion"], { owner: me });
            list[1] = "margarine";
            expect(list[rawSym].asArray()).toEqual(["bread", "margarine", "onion"]);
            expect(list[1]).toBe("margarine");
        });

        test("push", () => {
            const list = new TestList(["bread", "butter", "onion"], { owner: me });
            list.push("cheese");
            expect(list[3]).toBe("cheese");
            expect(list[rawSym].asArray()).toEqual(["bread", "butter", "onion", "cheese"]);
        })

        test("unshift", () => {
            const list = new TestList(["bread", "butter", "onion"], { owner: me });
            list.unshift("lettuce");
            expect(list[0]).toBe("lettuce");
            expect(list[rawSym].asArray()).toEqual(["lettuce", "bread", "butter", "onion"]);
        })

        test("pop", () => {
            const list = new TestList(["bread", "butter", "onion"], { owner: me });
            expect(list.pop()).toBe("onion");
            expect(list.length).toBe(2);
            expect(list[rawSym].asArray()).toEqual(["bread", "butter"]);
        })

        test("shift", () => {
            const list = new TestList(["bread", "butter", "onion"], { owner: me });
            expect(list.shift()).toBe("bread");
            expect(list.length).toBe(2);
            expect(list[rawSym].asArray()).toEqual(["butter", "onion"]);
        })

        test("splice", () => {
            const list = new TestList(["bread", "butter", "onion"], { owner: me });
            list.splice(1, 1, "salt", "pepper");
            expect(list.length).toBe(4);
            expect(list[rawSym].asArray()).toEqual(["bread", "salt", "pepper", "onion"]);
        })
    });
});
