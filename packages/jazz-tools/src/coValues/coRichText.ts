import type { Account, CoMapInit, Group, TextPos } from "../internal.js";
import { CoList, CoMap, CoPlainText, co } from "../internal.js";

export class Range extends CoMap {
    startAfter = co.json<TextPos>();
    startBefore = co.json<TextPos>();
    endAfter = co.json<TextPos>();
    endBefore = co.json<TextPos>();
    tag = co.string;
}

export type ResolvedRange<R extends Range = Range> = {
    startAfter: number;
    startBefore: number;
    endAfter: number;
    endBefore: number;
    sourceRange: R;
};

export type ResolvedAndDiffusedRange<R extends Range = Range> = {
    startAfter: number;
    endBefore: number;
    side: "uncertainStart" | "certainMiddle" | "uncertainEnd";
    sourceRange: R;
};

export type FocusBias = "far" | "close" | "closestWhitespace";

export type ResolvedAndFocusedRange<R extends Range = Range> = {
    startAfter: number;
    endBefore: number;
    sourceRange: R;
}

export type RangeEvent = {
    at: number;
    sourceRange: Range
    event: "start" | "end"
}

export class CoRichText extends CoMap {
    text = co.ref(CoPlainText);
    ranges = co.ref(CoList.Of(co.ref(Range)));

    static createFromPlainText(
        text: string,
        options: { owner: Account | Group }
    ) {
        return this.create(
            {
                text: CoPlainText.create(text, { owner: options.owner }),
                ranges: CoList.Of(co.ref(Range)).create([], {
                    owner: options.owner,
                }),
            },
            {owner: options.owner,}
        );
    }

    insertAfter(idx: number, text: string) {
        if (!this.text)
            throw new Error(
                "Cannot insert into a CoRichText without loaded text"
            );
        this.text.insertAfter(idx, text);
    }

    deleteRange(range: {from: number, to: number}) {
        if (!this.text)
            throw new Error(
                "Cannot delete from a CoRichText without loaded text"
            );
        this.text.deleteRange(range);
    }

    posBefore(idx: number): TextPos | undefined {
        if (!this.text)
            throw new Error(
                "Cannot get posBefore in a CoRichText without loaded text"
            );
        return this.text.posBefore(idx);
    }

    posAfter(idx: number): TextPos | undefined {
        if (!this.text)
            throw new Error(
                "Cannot get posAfter in a CoRichText without loaded text"
            );
        return this.text.posAfter(idx);
    }

    idxBefore(pos: TextPos): number | undefined {
        if (!this.text)
            throw new Error(
                "Cannot get idxBefore in a CoRichText without loaded text"
            );
        return this.text.idxBefore(pos);
    }

    idxAfter(pos: TextPos): number | undefined {
        if (!this.text)
            throw new Error(
                "Cannot get idxAfter in a CoRichText without loaded text"
            );
        return this.text.idxAfter(pos);
    }

    insertRange<
        RC extends {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            new (...args: any[]): Range;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create(init: any, options: { owner: Account | Group }): Range;
        },
    >(
        start: number,
        end: number,
        RangeClass: RC,
        extraArgs: Omit<
            CoMapInit<InstanceType<RC>>,
            "startAfter" | "startBefore" | "endAfter" | "endBefore"
        >,
        options?: { rangeOwner?: Account | Group }
    ) {
        if (!this.ranges) {
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
            { owner: options?.rangeOwner || this._owner }
        );
        this.ranges.push(range);
    }

    resolveRanges(): ResolvedRange[] {
        if (!this.text || !this.ranges) {
            throw new Error(
                "Cannot resolve ranges without loaded text and ranges"
            );
        }
        const ranges = this.ranges.flatMap((range) => {
            if (!range) return [];
            const startAfter = this.idxAfter(range.startAfter);
            const startBefore = this.idxAfter(range.startBefore);
            const endAfter = this.idxAfter(range.endAfter);
            const endBefore = this.idxAfter(range.endBefore);
            if (
                startAfter === undefined ||
                startBefore === undefined ||
                endAfter === undefined ||
                endBefore === undefined
            ) {
                return [];
            }
            return [
                {
                    sourceRange: range,
                    startAfter,
                    startBefore,
                    endAfter,
                    endBefore,
                    tag: range.tag,
                    from: range,
                },
            ];
        });
        return ranges;
    }

    resolveAndDiffuseRanges(): ResolvedAndDiffusedRange[] {
        return this.resolveRanges().flatMap(range =>
            [
                ...range.startAfter < range.startBefore - 1 ? [{
                    startAfter: range.startAfter,
                    endBefore: range.startBefore,
                    side: "uncertainStart" as const,
                    sourceRange: range.sourceRange,
                }] : [],
                {
                    startAfter: range.startBefore - 1,
                    endBefore: range.endAfter + 1,
                    side: "certainMiddle" as const,
                    sourceRange: range.sourceRange,
                },
                ...range.endAfter + 1 < range.endBefore ? [{
                    startAfter: range.endAfter + 1,
                    endBefore: range.endBefore,
                    side: "uncertainEnd" as const,
                    sourceRange: range.sourceRange,
                }] : [],
            ]
        )
    }

    resolveAndDiffuseAndFocuseRanges(): ResolvedAndFocusedRange[] {
        throw new Error("Not implemented");
    }

    toString() {
        if (!this.text) return "";
        return this.text.toString();
    }
}

export const Ranges = {
    Heading: class Heading extends Range {
        tag = co.literal("heading");
        level = co.number;
    },
    Paragraph: class Paragraph extends Range {
        tag = co.literal("paragraph");
    },
    Link: class Link extends Range {
        tag = co.literal("link");
        url = co.string;
    },
    Bold: class Bold extends Range {
        tag = co.literal("bold");
    },
    Italic: class Italic extends Range {
        tag = co.literal("italic");
    },
};
