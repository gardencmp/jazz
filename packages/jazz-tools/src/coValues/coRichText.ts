import type { Account, CoMapInit, Group, TextPos } from "../internal.js";
import { CoList, CoMap, CoPlainText, co } from "../internal.js";

/**
 * Base class for text annotations and formatting marks.
 * Represents a mark with start and end positions in text.
 *
 * Example text: "Hello world! How are you?"
 * If we want to mark "world" with bold:
 *
 * ```
 *            uncertainty region
 *                   ↓
 * Hello [····]world[····]! How are you?
 *       ↑    ↑     ↑    ↑
 *       |    |     |    |
 * startAfter |     |  endBefore
 *  startBefore     endAfter
 * ```
 *
 * - startAfter: Position after "Hello " (exclusive boundary)
 * - startBefore: Position before "world" (inclusive boundary)
 * - endAfter: Position after "world" (inclusive boundary)
 * - endBefore: Position before "!" (exclusive boundary)
 *
 * The regions marked with [····] are "uncertainty regions" where:
 * - Text inserted in the left uncertainty region may or may not be part of the mark
 * - Text inserted in the right uncertainty region may or may not be part of the mark
 * - Text inserted between startBefore and endAfter is definitely part of the mark
 *
 * Positions must satisfy:
 * 0 ≤ startAfter ≤ startBefore < endAfter ≤ endBefore ≤ textLength
 * A mark cannot be zero-length, so endAfter must be greater than startBefore.
 */
export class Mark extends CoMap {
  startAfter = co.json<TextPos | null>();
  startBefore = co.json<TextPos>();
  endAfter = co.json<TextPos>();
  endBefore = co.json<TextPos | null>();
  tag = co.string;

  /**
   * Validates and clamps mark positions to ensure they are in the correct order
   * @returns Normalized positions or null if invalid
   */
  validatePositions(
    textLength: number,
    idxAfter: (pos: TextPos) => number | undefined,
    idxBefore: (pos: TextPos) => number | undefined,
  ) {
    if (!textLength) {
      console.error("Cannot validate positions for empty text");
      return null;
    }

    // Get positions with fallbacks
    const positions = {
      startAfter: this.startAfter ? (idxBefore(this.startAfter) ?? 0) : 0,
      startBefore: this.startBefore ? (idxAfter(this.startBefore) ?? 0) : 0,
      endAfter: this.endAfter
        ? (idxBefore(this.endAfter) ?? textLength)
        : textLength,
      endBefore: this.endBefore
        ? (idxAfter(this.endBefore) ?? textLength)
        : textLength,
    };

    // Clamp and ensure proper ordering in one step
    return {
      startAfter: Math.max(0, positions.startAfter),
      startBefore: Math.max(positions.startAfter + 1, positions.startBefore),
      endAfter: Math.min(textLength - 1, positions.endAfter),
      endBefore: Math.min(textLength, positions.endBefore),
    };
  }
}

/**
 * A mark with resolved numeric positions in text.
 * Contains both position information and reference to the source mark.
 * @template R Type extending Mark, defaults to Mark
 */
export type ResolvedMark<R extends Mark = Mark> = {
  startAfter: number;
  startBefore: number;
  endAfter: number;
  endBefore: number;
  sourceMark: R;
};

/**
 * A mark that has been resolved and diffused with certainty information.
 * Includes start/end positions and indication of boundary certainty.
 * @template R Type extending Mark, defaults to Mark
 */
export type ResolvedAndDiffusedMark<R extends Mark = Mark> = {
  start: number;
  end: number;
  side: "uncertainStart" | "certainMiddle" | "uncertainEnd";
  sourceMark: R;
};

/**
 * Defines how marks should be focused when resolving positions.
 * - 'far': Positions marks at furthest valid positions
 * - 'close': Positions marks at nearest valid positions
 * - 'closestWhitespace': Positions marks at nearest whitespace
 */
export type FocusBias = "far" | "close" | "closestWhitespace";

/**
 * A mark that has been resolved and focused to specific positions.
 * Contains simplified position information and reference to source mark.
 * @template R Type extending Mark, defaults to Mark
 */
export type ResolvedAndFocusedMark<R extends Mark = Mark> = {
  start: number;
  end: number;
  sourceMark: R;
};

/**
 * Main class for handling rich text content with marks.
 * Combines plain text with a list of marks for formatting and annotations.
 * Provides methods for text manipulation, mark insertion, and tree conversion.
 */
export class CoRichText extends CoMap {
  text = co.ref(CoPlainText);
  marks = co.ref(CoList.Of(co.ref(Mark)));

  /**
   * Create a CoRichText from plain text.
   */
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

  /**
   * Create a CoRichText from plain text and a mark.
   */
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

  /**
   * Insert text at a specific index.
   */
  insertAfter(idx: number, text: string) {
    if (!this.text)
      throw new Error("Cannot insert into a CoRichText without loaded text");
    this.text.insertAfter(idx, text);
  }

  /**
   * Delete a range of text.
   */
  deleteRange(range: { from: number; to: number }) {
    if (!this.text)
      throw new Error("Cannot delete from a CoRichText without loaded text");
    this.text.deleteRange(range);
  }

  /**
   * Get the position of a specific index.
   */
  posBefore(idx: number): TextPos | undefined {
    if (!this.text)
      throw new Error(
        "Cannot get posBefore in a CoRichText without loaded text",
      );
    return this.text.posBefore(idx);
  }

  /**
   * Get the position of a specific index.
   */
  posAfter(idx: number): TextPos | undefined {
    if (!this.text)
      throw new Error(
        "Cannot get posAfter in a CoRichText without loaded text",
      );
    return this.text.posAfter(idx);
  }

  /**
   * Get the index of a specific position.
   */
  idxBefore(pos: TextPos): number | undefined {
    if (!this.text)
      throw new Error(
        "Cannot get idxBefore in a CoRichText without loaded text",
      );
    return this.text.idxBefore(pos);
  }

  /**
   * Get the index of a specific position.
   */
  idxAfter(pos: TextPos): number | undefined {
    if (!this.text)
      throw new Error(
        "Cannot get idxAfter in a CoRichText without loaded text",
      );
    return this.text.idxAfter(pos);
  }

  /**
   * Insert a mark at a specific range.
   */
  insertMark<
    MarkClass extends {
      new (...args: any[]): Mark;
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
    if (!this.text || !this.marks) {
      throw new Error("Cannot insert a range without loaded ranges");
    }

    // Clamp positions to text bounds
    start = Math.max(0, Math.min(start, this.text.length));
    end = Math.max(start, Math.min(end, this.text.length));

    const owner = options?.markOwner || this._owner;
    if (!owner) {
      throw new Error("No owner specified for mark");
    }

    const range = RangeClass.create(
      {
        ...extraArgs,
        startAfter: this.posAfter(start),
        startBefore: this.posBefore(start),
        endAfter: this.posAfter(end - 1),
        endBefore: this.posBefore(end - 1),
      },
      { owner },
    );

    this.marks.push(range);
  }

  /**
   * Remove a mark at a specific range.
   */
  removeMark<
    MarkClass extends {
      new (...args: any[]): Mark;
      create(init: any, options: { owner: Account | Group }): Mark;
    },
  >(start: number, end: number, RangeClass: MarkClass) {
    if (!this.marks) {
      throw new Error("Cannot remove marks without loaded marks");
    }

    // Find marks of the given class that overlap with the range
    const resolvedMarks = this.resolveMarks();

    for (const mark of resolvedMarks) {
      // If mark is outside the range, we'll skip it
      if (mark.endAfter < start || mark.startBefore > end) {
        continue;
      }

      const markIndex = this.marks.findIndex((m) => m === mark.sourceMark);
      if (markIndex === -1) {
        continue;
      }

      // If mark is completely inside the range, we'll remove it
      if (mark.startBefore < start && mark.endAfter > end) {
        // Remove the mark
        this.marks.splice(markIndex, 1);
        continue;
      }

      // If mark starts before the end of the range, we'll shorten it
      if (mark.startBefore < end) {
        const startAfterPos = this.posAfter(end + 2); // TODO: why +2? Looks like an off-by-one error twice
        const startBeforePos = this.posBefore(end + 2);
        if (startAfterPos && startBeforePos) {
          mark.sourceMark.startAfter = startAfterPos;
          mark.sourceMark.startBefore = startBeforePos;
        }
        continue;
      }

      // If mark ends after the start of the range, we'll shorten it
      if (mark.endAfter > start) {
        const endAfterPos = this.posAfter(start - 1);
        const endBeforePos = this.posBefore(start - 1);
        if (endAfterPos && endBeforePos) {
          mark.sourceMark.endAfter = endAfterPos;
          mark.sourceMark.endBefore = endBeforePos;
        }
        continue;
      }

      // If range is inside the mark, we'll split the mark
      if (start >= mark.startBefore && end <= mark.endAfter) {
        // Split the mark by removing the part that overlaps with the range and adding two new marks
        this.insertMark(
          mark.startBefore,
          start,
          RangeClass,
          {},
          {
            markOwner: mark.sourceMark._owner || this._owner,
          },
        );
        this.insertMark(
          end,
          mark.endAfter,
          RangeClass,
          {},
          {
            markOwner: mark.sourceMark._owner || this._owner,
          },
        );
        continue;
      }
    }
  }

  /**
   * Resolve the positions of all marks.
   */
  resolveMarks(): ResolvedMark[] {
    if (!this.text || !this.marks) {
      throw new Error("Cannot resolve ranges without loaded text and ranges");
    }

    const textLength = this.length;

    return this.marks.flatMap((mark) => {
      if (!mark) return [];

      const positions = mark.validatePositions(
        textLength,
        (pos) => this.idxAfter(pos),
        (pos) => this.idxBefore(pos),
      );
      if (!positions) return [];

      return [
        {
          sourceMark: mark,
          ...positions,
          tag: mark.tag,
        },
      ];
    });
  }

  /**
   * Resolve and diffuse the positions of all marks.
   */
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

  /**
   * Resolve, diffuse, and focus the positions of all marks.
   */
  resolveAndDiffuseAndFocusMarks(): ResolvedAndFocusedMark[] {
    // for now we only keep the certainMiddle ranges
    return this.resolveAndDiffuseMarks().filter(
      (range) => range.side === "certainMiddle",
    );
  }

  /**
   * Convert a CoRichText to a tree structure useful for client libraries.
   */
  toTree(tagPrecedence: string[]): TreeNode {
    const ranges = this.resolveAndDiffuseAndFocusMarks();

    // Convert a bunch of (potentially overlapping) ranges into a tree
    // - make sure we include all text in leaves, even if it's not covered by a range
    // - we split overlapping ranges in a way where the higher precedence (tag earlier in tagPrecedence)
    // stays intact and the lower precedence tag is split into two ranges, one inside and one outside the higher precedence range

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

  get length() {
    return this.text?.toString().length || 0;
  }

  /**
   * Convert a CoRichText to plain text.
   */
  toString() {
    if (!this.text) return "";
    return this.text.toString();
  }
}

/**
 * Represents a leaf node in the rich text tree structure.
 * Contains plain text without any marks.
 */
export type TreeLeaf = {
  type: "leaf";
  start: number;
  end: number;
};

/**
 * Represents a node in the rich text tree structure.
 * Can contain other nodes or leaves, and includes formatting information.
 */
export type TreeNode = {
  type: "node";
  tag: string;
  start: number;
  end: number;
  range?: ResolvedAndFocusedMark;
  children: (TreeNode | TreeLeaf)[];
};

/**
 * Split a node at a specific index. So that the node is split into two parts, one before the index, and one after the index.
 */
export function splitNode(
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

/**
 * Collection of predefined mark types for common text formatting.
 * Includes marks for headings, paragraphs, links, and text styling.
 */
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
