import { expect, describe, test } from "vitest";
import { Account, CoPlainText, WasmCrypto } from "../index.js";

const Crypto = await WasmCrypto.create();

describe("Simple CoPlainText operations", async () => {
    const me = await Account.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto
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

            text.deleteRange({from: 3, to: 8});
            expect(text + "").toEqual("helrld");
        });
    });
});
