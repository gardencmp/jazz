import { expect, describe, test, beforeEach } from "vitest";
import { CoStreamOf, SimpleAccount, imm } from "../index.js";

describe("Simple CoStream operations", async () => {
    const me = await SimpleAccount.createControlledAccount({
        name: "Hermes Puggington",
    });

    class TestStream extends CoStreamOf(imm.string) {}

    const stream = new TestStream({ owner: me });

    test("Construction", () => {
        expect(stream.meta.owner).toEqual(me);
    });

    describe("Mutation", () => {
        test("assignment", () => {
            stream.push("hello");
        });
    });
})