import { describe, expect, test } from "vitest";
import { Account, CoRichText, Group, Marks, WasmCrypto } from "../index.web.js";
import { splitNode } from "../internal.js";
import type { TreeNode } from "../internal.js";

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

  describe("Conversion", () => {
    test("to tree", () => {
      const text = CoRichText.createFromPlainText("hello world", {
        owner: me,
      });

      expect(text.toTree(["strong"])).toEqual({
        type: "node",
        tag: "root",
        start: 0,
        end: 11,
        children: [
          {
            type: "leaf",
            start: 0,
            end: 11,
          },
        ],
      });
    });

    test("to string", () => {
      const text = CoRichText.createFromPlainText("hello world", {
        owner: me,
      });

      expect(text.toString()).toEqual("hello world");
    });

    test("splits nested children correctly", () => {
      // Create text with nested marks
      const text = CoRichText.createFromPlainText("hello world", {
        owner: me,
      });

      // Add an outer mark spanning the whole text
      text.insertMark(0, 11, Marks.Strong, { tag: "strong" });

      // Add an inner mark spanning part of the text
      text.insertMark(6, 11, Marks.Em, { tag: "em" });

      // Split at position 8 (between 'wo' and 'rld')
      const tree = text.toTree(["strong", "em"]);

      expect(tree).toEqual({
        type: "node",
        tag: "root",
        start: 0,
        end: 11,
        children: [
          {
            type: "node",
            tag: "strong",
            start: 0,
            end: 6,
            children: [
              {
                type: "leaf",
                start: 0,
                end: 6,
              },
            ],
          },
          {
            type: "node",
            tag: "strong",
            start: 6,
            end: 11,
            children: [
              {
                type: "node",
                tag: "em",
                start: 6,
                end: 11,
                children: [
                  {
                    type: "leaf",
                    start: 6,
                    end: 11,
                  },
                ],
              },
            ],
          },
        ],
      });

      // Now verify splitting works by checking a specific position
      const [before, after] = splitNode(tree.children[1] as TreeNode, 8);

      // Verify the structure of the split nodes
      expect(before).toEqual({
        type: "node",
        tag: "strong",
        start: 6,
        end: 8,
        children: [
          {
            type: "node",
            tag: "em",
            start: 6,
            end: 8,
            children: [
              {
                type: "leaf",
                start: 6,
                end: 8,
              },
            ],
          },
        ],
      });

      expect(after).toEqual({
        type: "node",
        tag: "strong",
        start: 8,
        end: 11,
        children: [
          {
            type: "node",
            tag: "em",
            start: 8,
            end: 11,
            children: [
              {
                type: "leaf",
                start: 8,
                end: 11,
              },
            ],
          },
        ],
      });
    });
  });
});
