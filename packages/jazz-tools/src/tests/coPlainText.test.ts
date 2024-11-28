import { describe, expect, test } from "vitest";
import { Account, CoPlainText, WasmCrypto } from "../index.web.js";

const Crypto = await WasmCrypto.create();

describe("Simple CoPlainText operations", async () => {
  const me = await Account.create({
    creationProps: { name: "Hermes Puggington" },
    crypto: Crypto,
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

      text.deleteRange({ from: 3, to: 8 });
      expect(text + "").toEqual("helrld");
    });
  });

  describe("Position operations", () => {
    test("idxBefore returns index before a position", () => {
      const text = CoPlainText.create("hello world", { owner: me });
      
      // Get position at index 5 (between "hello" and " world")
      const pos = text.posBefore(5);
      expect(pos).toBeDefined();
      
      // Verify idxBefore returns the index before the position (4)
      // This makes sense as the position is between characters,
      // and idxBefore returns the index of the last character before that position
      const idx = text.idxBefore(pos!);
      expect(idx).toBe(4);  // Index of 'o' in "hello"
    });

    test("idxAfter returns index after a position", () => {
      const text = CoPlainText.create("hello world", { owner: me });
      
      // Get position at index 5 (between "hello" and " world")
      const pos = text.posBefore(5);
      expect(pos).toBeDefined();
      
      // Verify idxAfter returns the index after the position (5)
      // This makes sense as the position is between characters,
      // and idxAfter returns the index of the first character after that position
      const idx = text.idxAfter(pos!);
      expect(idx).toBe(5);  // Index of ' ' in "hello world"
    });
  });
});
