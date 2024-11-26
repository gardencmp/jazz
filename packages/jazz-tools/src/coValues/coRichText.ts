import type { Account, CoMapInit, Group, TextPos } from "../internal.js";
import { CoList, CoMap, CoPlainText, co } from "../internal.js";

export class Mark extends CoMap {
  startAfter = co.json<TextPos | null>();
  startBefore = co.json<TextPos>();
  endAfter = co.json<TextPos>();
  endBefore = co.json<TextPos | null>();
  tag = co.string;
}

export type ResolvedMark<R extends Mark = Mark> = {
  startAfter: number;
  startBefore: number;
  endAfter: number;
  endBefore: number;
  sourceMark: R;
};

export type ResolvedAndDiffusedMark<R extends Mark = Mark> = {
  start: number;
  end: number;
  side: "uncertainStart" | "certainMiddle" | "uncertainEnd";
  sourceMark: R;
};

export type FocusBias = "far" | "close" | "closestWhitespace";

export type ResolvedAndFocusedMark<R extends Mark = Mark> = {
  start: number;
  end: number;
  sourceMark: R;
};

export class CoRichText extends CoMap {
  text = co.ref(CoPlainText);
  marks = co.ref(CoList.Of(co.ref(Mark)));

  static createFromPlainText(
    text: string,
    options: { owner: Account | Group },
  ) {
    return this.create(
      {
        text: CoPlainText.create(text, { owner: options.owner }),
        marks: CoList.Of(co.ref(Mark)).create([], {
          owner: options.owner,
        }),
      },
      { owner: options.owner },
    );
  }

  static createFromPlainTextAndMark<
    MarkClass extends {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (...args: any[]): Mark;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create(init: any, options: { owner: Account | Group }): Mark;
    },
  >(
    text: string,
    WrapIn: MarkClass,
    extraArgs: Omit<
      CoMapInit<InstanceType<MarkClass>>,
      "startAfter" | "startBefore" | "endAfter" | "endBefore"
    >,
    options: { owner: Account | Group },
  ) {
    const richtext = this.createFromPlainText(text, options);

    richtext.insertMark(0, text.length, WrapIn, extraArgs);

    return richtext;
  }

  insertAfter(idx: number, text: string) {
    if (!this.text)
      throw new Error("Cannot insert into a CoRichText without loaded text");
    this.text.insertAfter(idx, text);
  }

  deleteRange(range: { from: number; to: number }) {
    if (!this.text)
      throw new Error("Cannot delete from a CoRichText without loaded text");
    this.text.deleteRange(range);
  }

  posBefore(idx: number): TextPos | undefined {
    if (!this.text)
      throw new Error(
        "Cannot get posBefore in a CoRichText without loaded text",
      );
    return this.text.posBefore(idx);
  }

  posAfter(idx: number): TextPos | undefined {
    if (!this.text)
      throw new Error(
        "Cannot get posAfter in a CoRichText without loaded text",
      );
    return this.text.posAfter(idx);
  }

  idxBefore(pos: TextPos): number | undefined {
    if (!this.text)
      throw new Error(
        "Cannot get idxBefore in a CoRichText without loaded text",
      );
    return this.text.idxBefore(pos);
  }

  idxAfter(pos: TextPos): number | undefined {
    if (!this.text)
      throw new Error(
        "Cannot get idxAfter in a CoRichText without loaded text",
      );
    return this.text.idxAfter(pos);
  }

  insertMark<
    MarkClass extends {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (...args: any[]): Mark;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create(init: any, options: { owner: Account | Group }): Mark;
    },
  >(
    start: number,
    end: number,
    RangeClass: MarkClass,
    extraArgs: Omit<
      CoMapInit<InstanceType<MarkClass>>,
      "startAfter" | "startBefore" | "endAfter" | "endBefore"
    >,
    options?: { markOwner?: Account | Group },
  ) {
    if (!this.marks) {
      throw new Error("Cannot insert a range without loaded ranges");
    }
    const range = RangeClass.create(
      {
        ...extraArgs,
        startAfter: this.posBefore(start),
        startBefore: this.posAfter(start),
        endAfter: this.posBefore(end),
        endBefore: this.posAfter(end),
      },
      { owner: options?.markOwner || this._owner },
    );
    this.marks.push(range);
  }

  resolveMarks(): ResolvedMark[] {
    if (!this.text || !this.marks) {
      throw new Error("Cannot resolve ranges without loaded text and ranges");
    }
    const ranges = this.marks.flatMap((mark) => {
      if (!mark) return [];
      const startBefore = this.idxAfter(mark.startBefore);
      const endAfter = this.idxAfter(mark.endAfter);
      if (startBefore === undefined || endAfter === undefined) {
        return [];
      }
      const startAfter = mark.startAfter
        ? this.idxAfter(mark.startAfter)
        : startBefore - 1;
      const endBefore = mark.endBefore
        ? this.idxAfter(mark.endBefore)
        : endAfter + 1;
      if (startAfter === undefined || endBefore === undefined) {
        return [];
      }
      return [
        {
          sourceMark: mark,
          startAfter,
          startBefore,
          endAfter,
          endBefore,
          tag: mark.tag,
          from: mark,
        },
      ];
    });
    return ranges;
  }

  resolveAndDiffuseMarks(): ResolvedAndDiffusedMark[] {
    return this.resolveMarks().flatMap((range) => [
      ...(range.startAfter < range.startBefore - 1
        ? [
            {
              start: range.startAfter,
              end: range.startBefore - 1,
              side: "uncertainStart" as const,
              sourceMark: range.sourceMark,
            },
          ]
        : []),
      {
        start: range.startBefore - 1,
        end: range.endAfter + 1,
        side: "certainMiddle" as const,
        sourceMark: range.sourceMark,
      },
      ...(range.endAfter + 1 < range.endBefore
        ? [
            {
              start: range.endAfter + 1,
              end: range.endBefore,
              side: "uncertainEnd" as const,
              sourceMark: range.sourceMark,
            },
          ]
        : []),
    ]);
  }

  resolveAndDiffuseAndFocusMarks(): ResolvedAndFocusedMark[] {
    // for now we only keep the certainMiddle ranges
    return this.resolveAndDiffuseMarks().filter(
      (range) => range.side === "certainMiddle",
    );
  }

  toTree(tagPrecedence: string[]): TreeNode {
    const ranges = this.resolveAndDiffuseAndFocusMarks();

    // convert a bunch of (potentially overlapping) ranges into a tree
    // - make sure we include all text in leaves, even if it's not covered by a range
    // - we split overlapping ranges in a way where the higher precedence (tag earlier in tagPrecedence)
    // stays intact and the lower precende tag is split into two ranges, one inside and one outside the higher precedence range

    const text = this.text?.toString() || "";

    let currentNodes: (TreeLeaf | TreeNode)[] = [
      {
        type: "leaf",
        start: 0,
        end: text.length,
      },
    ];

    const rangesSortedLowToHighPrecedence = ranges.sort((a, b) => {
      const aPrecedence = tagPrecedence.indexOf(a.sourceMark.tag);
      const bPrecedence = tagPrecedence.indexOf(b.sourceMark.tag);
      return bPrecedence - aPrecedence;
    });

    // for each range, split the current nodes where necessary (no matter if leaf or already a node), wrapping the resulting "inside" parts in a node with the range's tag
    for (const range of rangesSortedLowToHighPrecedence) {
      // console.log("currentNodes", currentNodes);
      const newNodes = currentNodes.flatMap((node) => {
        const [before, inOrAfter] = splitNode(node, range.start);
        const [inside, after] = inOrAfter
          ? splitNode(inOrAfter, range.end)
          : [undefined, undefined];

        // console.log("split", range.start, range.end, {
        //     before,
        //     inside,
        //     after,
        // });

        // TODO: also split children

        return [
          ...(before ? [before] : []),
          ...(inside
            ? [
                {
                  type: "node" as const,
                  tag: range.sourceMark.tag,
                  start: inside.start,
                  end: inside.end,
                  children: [inside],
                },
              ]
            : []),
          ...(after ? [after] : []),
        ];
      });

      currentNodes = newNodes;
    }

    return {
      type: "node",
      tag: "root",
      start: 0,
      end: text.length,
      children: currentNodes,
    };
  }

  toString() {
    if (!this.text) return "";
    return this.text.toString();
  }
}

export type TreeLeaf = {
  type: "leaf";
  start: number;
  end: number;
};

export type TreeNode = {
  type: "node";
  tag: string;
  start: number;
  end: number;
  range?: ResolvedAndFocusedMark;
  children: (TreeNode | TreeLeaf)[];
};

function splitNode(
  node: TreeNode | TreeLeaf,
  at: number,
): [TreeNode | TreeLeaf | undefined, TreeNode | TreeLeaf | undefined] {
  if (node.type === "leaf") {
    return [
      at > node.start
        ? {
            type: "leaf",
            start: node.start,
            end: Math.min(at, node.end),
          }
        : undefined,
      at < node.end
        ? {
            type: "leaf",
            start: Math.max(at, node.start),
            end: node.end,
          }
        : undefined,
    ];
  } else {
    const children = node.children;
    return [
      at > node.start
        ? {
            type: "node",
            tag: node.tag,
            start: node.start,
            end: Math.min(at, node.end),
            children: children
              .map((child) => splitNode(child, at)[0])
              .filter((c): c is Exclude<typeof c, undefined> => !!c),
          }
        : undefined,
      at < node.end
        ? {
            type: "node",
            tag: node.tag,
            start: Math.max(at, node.start),
            end: node.end,
            children: children
              .map((child) => splitNode(child, at)[1])
              .filter((c): c is Exclude<typeof c, undefined> => !!c),
          }
        : undefined,
    ];
  }
}

export const Marks = {
  Heading: class Heading extends Mark {
    tag = co.literal("heading");
    level = co.number;
  },
  Paragraph: class Paragraph extends Mark {
    tag = co.literal("paragraph");
  },
  Link: class Link extends Mark {
    tag = co.literal("link");
    url = co.string;
  },
  Strong: class Strong extends Mark {
    tag = co.literal("strong");
  },
  Em: class Italic extends Mark {
    tag = co.literal("em");
  },
};
