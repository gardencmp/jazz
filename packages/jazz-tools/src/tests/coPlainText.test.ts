import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { Account, CoList, CoPlainText, co, jazzReady } from "..";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoPlainText operations", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
    });

    const text = CoPlainText.create("hello world", { owner: me });

    test("Construction", () => {
        expect(text + "").toEqual("hello world");
    });

    describe("Mutation", () => {
        test("insertion", () => {
            const text = CoPlainText.create("hello world", { owner: me });

            text.insertAfter(5, " cruel");
            expect(text + "").toEqual("hello cruel world");
        });

        test("deletion", () => {
            const text = CoPlainText.create("hello world", { owner: me });

            text.deleteFrom(3, 5);
            expect(text + "").toEqual("helrld");
        });
    });
});
