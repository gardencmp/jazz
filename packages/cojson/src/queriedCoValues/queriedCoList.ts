import { MutableCoList } from "../coValues/coList.js";
import { CoValueCore } from "../coValueCore.js";
import { Group } from "../group.js";
import { isAccountID } from "../account.js";
import { AnyCoList, CoID, CoValue } from "../coValue.js";
import { TransactionID } from "../ids.js";
import { QueriedAccountAndProfile } from "./queriedCoMap.js";
import { ValueOrSubQueried, QueryContext } from "../queries.js";

export class QueriedCoList<L extends AnyCoList> extends Array<
    ValueOrSubQueried<L["_item"]>
> {
    coList!: L;
    id!: CoID<L>;
    type!: "colist";

    /** @internal */
    constructor(coList: L, queryContext: QueryContext) {
        super(
            ...coList
                .asArray()
                .map(
                    (item) =>
                        queryContext.resolveValue(item) as ValueOrSubQueried<
                            L["_item"]
                        >
                )
        );

        Object.defineProperties(this, {
            coList: { value: coList },
            id: { value: coList.id },
            type: { value: "colist" },
            edits: {
                value: [...this.keys()].map((i) => {
                    const edit = coList.editAt(i)!;
                    return {
                        by:
                            edit.by && isAccountID(edit.by)
                                ? queryContext.resolveAccount(edit.by)
                                : undefined,
                        tx: edit.tx,
                        at: new Date(edit.at),
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value: queryContext.resolveValue(edit.value) as any,
                    };
                }),
            },
            deletions: {
                value: coList.deletionEdits().map((deletion) => ({
                    by:
                        deletion.by && isAccountID(deletion.by)
                            ? queryContext.resolveAccount(deletion.by)
                            : undefined,
                    tx: deletion.tx,
                    at: new Date(deletion.at),
                })),
            },
        });
    }

    get meta(): L["meta"] {
        return this.coList.meta;
    }

    get group(): Group {
        return this.coList.group;
    }

    get core(): CoValueCore {
        return this.coList.core;
    }

    append(
        item: L["_item"] extends CoValue
            ? L["_item"] | CoID<L["_item"]>
            : L["_item"],
        after?: number,
        privacy?: "private" | "trusting"
    ): L {
        return this.coList.append(item, after, privacy);
    }

    prepend(
        item: L["_item"] extends CoValue
            ? L["_item"] | CoID<L["_item"]>
            : L["_item"],
        before?: number,
        privacy?: "private" | "trusting"
    ): L {
        return this.coList.prepend(item, before, privacy);
    }

    delete(at: number, privacy: "private" | "trusting"): L {
        return this.coList.delete(at, privacy);
    }

    mutate(
        mutator: (mutable: MutableCoList<L["_item"], L["meta"]>) => void
    ): L {
        return this.coList.mutate(mutator);
    }

    edits!: {
        by?: QueriedAccountAndProfile;
        tx: TransactionID;
        at: Date;
        value: L["_item"] extends CoValue
            ? CoID<L["_item"]>
            : Exclude<L["_item"], CoValue>;
    }[];

    deletions!: {
        by?: QueriedAccountAndProfile;
        tx: TransactionID;
        at: Date;
    }[];

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static isArray(arg: any): arg is any[] {
        return Array.isArray(arg);
    }

    /** @internal */
    static from<T>(arrayLike: ArrayLike<T>): T[];
    /** @internal */
    static from<T, U>(
        arrayLike: ArrayLike<T>,
        mapfn: (v: T, k: number) => U,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisArg?: any
    ): U[];
    /** @internal */
    static from<T>(iterable: Iterable<T> | ArrayLike<T>): T[];
    /** @internal */
    static from<T, U>(
        iterable: Iterable<T> | ArrayLike<T>,
        mapfn: (v: T, k: number) => U,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisArg?: any
    ): U[];
    /** @internal */
    static from<T, U>(
        _iterable: unknown,
        _mapfn?: unknown,
        _thisArg?: unknown
    ): T[] | U[] | T[] | U[] {
        throw new Error("Array method 'from' not supported on QueriedCoList");
    }

    /** @internal */
    static of<T>(..._items: T[]): T[] {
        throw new Error("Array method 'of' not supported on QueriedCoList");
    }

    /** @internal */
    pop(): ValueOrSubQueried<L["_item"]> | undefined {
        throw new Error("Array method 'pop' not supported on QueriedCoList");
    }

    /** @internal */
    push(..._items: ValueOrSubQueried<L["_item"]>[]): number {
        throw new Error("Array method 'push' not supported on QueriedCoList");
    }

    /** @internal */
    concat(
        ..._items: ConcatArray<ValueOrSubQueried<L["_item"]>>[]
    ): ValueOrSubQueried<L["_item"]>[];
    /** @internal */
    concat(
        ..._items: (
            | ValueOrSubQueried<L["_item"]>
            | ConcatArray<ValueOrSubQueried<L["_item"]>>
        )[]
    ): ValueOrSubQueried<L["_item"]>[];
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    concat(..._items: any[]): ValueOrSubQueried<L["_item"]>[] {
        throw new Error("Array method 'concat' not supported on QueriedCoList");
    }

    /** @internal */
    reverse(): ValueOrSubQueried<L["_item"]>[] {
        throw new Error(
            "Array method 'reverse' not supported on QueriedCoList"
        );
    }

    /** @internal */
    shift(): ValueOrSubQueried<L["_item"]> | undefined {
        throw new Error("Array method 'shift' not supported on QueriedCoList");
    }

    /** @internal */
    sort(
        _compareFn?:
            | ((
                  a: ValueOrSubQueried<L["_item"]>,
                  b: ValueOrSubQueried<L["_item"]>
              ) => number)
            | undefined
    ): this {
        throw new Error("Array method 'sort' not supported on QueriedCoList");
    }

    /** @internal */
    splice(
        _start: number,
        _deleteCount?: number | undefined
    ): ValueOrSubQueried<L["_item"]>[] {
        throw new Error("Array method 'splice' not supported on QueriedCoList");
    }

    /** @internal */
    unshift(..._items: ValueOrSubQueried<L["_item"]>[]): number {
        throw new Error(
            "Array method 'unshift' not supported on QueriedCoList"
        );
    }

    /** @internal */
    fill(
        _value: ValueOrSubQueried<L["_item"]>,
        _start?: number | undefined,
        _end?: number | undefined
    ): this {
        throw new Error("Array method 'fill' not supported on QueriedCoList");
    }

    /** @internal */
    copyWithin(
        _target: number,
        _start: number,
        _end?: number | undefined
    ): this {
        throw new Error(
            "Array method 'copyWithin' not supported on QueriedCoList"
        );
    }
}
