import { expect, describe, test } from "vitest";
import { Account, CoRichText, Ranges, WasmCrypto } from "../index.js";

const Crypto = await WasmCrypto.create();

describe("Simple CoRichText operations", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto
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
