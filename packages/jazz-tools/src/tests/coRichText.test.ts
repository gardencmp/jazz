import { describe, expect, test } from "vitest";
import { Account, CoRichText, Group, Marks, WasmCrypto } from "../index.web.js";

const Crypto = await WasmCrypto.create();

describe("Simple CoRichText operations", async () => {
  const me = await Account.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
  });

  const myGroup = await Group.create({
    owner: me,
  });

  const text = CoRichText.createFromPlainText("hello world", {
    owner: myGroup,
  });

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

      text.deleteRange({ from: 3, to: 8 });
      expect(text + "").toEqual("helrld");
    });

    test("inserting ranges", () => {
      const text = CoRichText.createFromPlainText("hello world", {
        owner: me,
      });

      text.insertMark(6, 9, Marks.Strong, { tag: "strong" });

      expect(text.resolveMarks()).toEqual([
        {
          startAfter: 6,
          startBefore: 7,
          endAfter: 9,
          endBefore: 10,
          tag: "strong",
          from: text.marks![0],
          sourceMark: text.marks![0],
        },
      ]);
    });
  });
});
