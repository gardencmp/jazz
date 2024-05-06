import { expect, describe, test, beforeEach } from "vitest";

import { webcrypto } from "node:crypto";
import { Account, CoList, CoRichText, Ranges, co, jazzReady } from "..";

if (!("crypto" in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).crypto = webcrypto;
}

beforeEach(async () => {
    await jazzReady;
});

describe("Simple CoRichText operations", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
    });

    const text = CoRichText.createFromPlainText("hello world", { owner: me });

    test("Construction", () => {
        expect(text + "").toEqual("hello world");
    });

    describe("Mutation", () => {
        test("insertion", () => {
            const text = CoRichText.createFromPlainText("hello world", {
                owner: me,
            });

            text.insertAfter(5, " cruel");
            expect(text + "").toEqual("hello cruel world");
        });

        test("deletion", () => {
            const text = CoRichText.createFromPlainText("hello world", {
                owner: me,
            });

            text.deleteFrom(3, 5);
            expect(text + "").toEqual("helrld");
        });

        test("inserting ranges", () => {
            const text = CoRichText.createFromPlainText("hello world", {
                owner: me,
            });

            text.insertRange(6, 9, Ranges.Bold, { tag: "bold" });

            console.log(text.text?._raw.entries());
            console.log(text.text?._raw.mapping);

            expect(text.resolveRanges()).toEqual([
                {
                    startAfter: 6,
                    startBefore: 7,
                    endAfter: 9,
                    endBefore: 10,
                    tag: "bold",
                    from: text.ranges![0],
                },
            ]);
        });
    });
});
