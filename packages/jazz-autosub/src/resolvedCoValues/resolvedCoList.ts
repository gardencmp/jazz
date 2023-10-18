import {
    CoID,
    CoList,
    Group,
    MutableCoList,
    CojsonInternalTypes,
    CoValue,
} from "cojson";
import { ValueOrResolvedRef, AutoSubContext } from "../autoSub.js";
import { ResolvedAccount } from "./resolvedAccount.js";

export type ResolvedCoListEdit<L extends CoList> = {
    by?: ResolvedAccount;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
    value: L["_item"] extends CoValue
        ? CoID<L["_item"]>
        : Exclude<L["_item"], CoValue>;
};

export type ResolvedCoListDeletion = {
    by?: ResolvedAccount;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
};

export type ResolvedCoListMeta<L extends CoList> = {
    coValue: L;
    edits: ResolvedCoListEdit<L>[];
    deletions: ResolvedCoListDeletion[];
    headerMeta: L["headerMeta"];
    group: Group;
};

export class ResolvedCoList<L extends CoList> extends Array<
    ValueOrResolvedRef<L["_item"]>
> {
    id!: CoID<L>;
    coValueType!: "colist";
    meta!: ResolvedCoListMeta<L>;

    /** @internal */
    constructor(coList: L, autoSubContext: AutoSubContext) {
        if (!(coList instanceof CoList)) {
            // this might be called from an intrinsic, like map, trying to create an empty array
            // passing `0` as the only parameter
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return new Array(coList) as any;
        }
        super();

        coList.asArray().forEach((item, idx) => {
            Object.defineProperty(this, idx, {
                get: () => {
                    return autoSubContext.subscribeIfCoID(
                        item,
                        [coList.id],
                        "idx_" + idx
                    ) as ValueOrResolvedRef<L["_item"]>;
                },
                enumerable: true,
                configurable: true,
            });
        });

        Object.defineProperties(this, {
            id: { value: coList.id, enumerable: false },
            coValueType: { value: "colist", enumerable: false },
            meta: {
                value: {
                    coValue: coList,
                    edits: [...this.keys()].map((i) => {
                        const edit = coList.editAt(i)!;
                        return autoSubContext.defineResolvedRefPropertiesIn(
                            {
                                tx: edit.tx,
                                at: new Date(edit.at),
                            },
                            {
                                by: { value: edit.by, enumerable: true },
                                value: { value: edit.value, enumerable: true },
                            },
                            [coList.id]
                        ) as ResolvedCoListEdit<L>;
                    }),
                    deletions: coList.deletionEdits().map(
                        (deletion) =>
                            autoSubContext.defineResolvedRefPropertiesIn(
                                {
                                    tx: deletion.tx,
                                    at: new Date(deletion.at),
                                },
                                {
                                    by: {
                                        value: deletion.by,
                                        enumerable: true,
                                    },
                                },
                                [coList.id]
                            ) as ResolvedCoListDeletion
                    ),
                    headerMeta: coList.headerMeta,
                    group: coList.group,
                } satisfies ResolvedCoListMeta<L>,
                enumerable: false,
            },
            mapDeferred: {
                value: <O>(
                    mapper: (
                        item: {
                            loaded: boolean;
                            id: L["_item"];
                            value(): ValueOrResolvedRef<L["_item"]>;
                        },
                        idx: number
                    ) => O
                ): O[] => {
                    return coList.asArray().map((id, idx) => {
                        return mapper(
                            {
                                loaded: typeof id === "string" && !!autoSubContext.values[id as CoID<CoValue>]?.lastLoaded,
                                id,
                                value: () => {
                                    return autoSubContext.subscribeIfCoID(
                                        id,
                                        [coList.id],
                                        "deferredIdx_" + idx
                                    ) as ValueOrResolvedRef<L["_item"]>
                                }
                            },
                            idx
                        );
                    });
                },
                enumerable: false,
            },
        });
    }

    mapDeferred!: <O>(
        mapper: (
            item: {
                loaded: boolean;
                id: L["_item"] extends CoID<CoValue> ? L["_item"] : never;
                value(): ValueOrResolvedRef<L["_item"]>;
            },
            idx: number
        ) => O
    ) => O[];

    append(
        item: L["_item"],
        after?: number,
        privacy?: "private" | "trusting"
    ): L {
        return this.meta.coValue.append(item, after, privacy);
    }

    prepend(
        item: L["_item"],
        before?: number,
        privacy?: "private" | "trusting"
    ): L {
        return this.meta.coValue.prepend(item, before, privacy);
    }

    delete(at: number, privacy?: "private" | "trusting"): L {
        return this.meta.coValue.delete(at, privacy);
    }

    mutate(
        mutator: (mutable: MutableCoList<L["_item"], L["headerMeta"]>) => void
    ): L {
        return this.meta.coValue.mutate(mutator);
    }

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
        throw new Error("Array method 'from' not supported on ResolvedCoList");
    }

    /** @internal */
    static of<T>(..._items: T[]): T[] {
        throw new Error("Array method 'of' not supported on ResolvedCoList");
    }

    /** @internal */
    pop(): ValueOrResolvedRef<L["_item"]> | undefined {
        throw new Error("Array method 'pop' not supported on ResolvedCoList");
    }

    /** @internal */
    push(..._items: ValueOrResolvedRef<L["_item"]>[]): number {
        throw new Error("Array method 'push' not supported on ResolvedCoList");
    }

    /** @internal */
    concat(
        ..._items: ConcatArray<ValueOrResolvedRef<L["_item"]>>[]
    ): ValueOrResolvedRef<L["_item"]>[];
    /** @internal */
    concat(
        ..._items: (
            | ValueOrResolvedRef<L["_item"]>
            | ConcatArray<ValueOrResolvedRef<L["_item"]>>
        )[]
    ): ValueOrResolvedRef<L["_item"]>[];
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    concat(..._items: any[]): ValueOrResolvedRef<L["_item"]>[] {
        throw new Error(
            "Array method 'concat' not supported on ResolvedCoList"
        );
    }

    /** @internal */
    reverse(): ValueOrResolvedRef<L["_item"]>[] {
        throw new Error(
            "Array method 'reverse' not supported on ResolvedCoList"
        );
    }

    /** @internal */
    shift(): ValueOrResolvedRef<L["_item"]> | undefined {
        throw new Error("Array method 'shift' not supported on ResolvedCoList");
    }

    /** @internal */
    sort(
        _compareFn?:
            | ((
                  a: ValueOrResolvedRef<L["_item"]>,
                  b: ValueOrResolvedRef<L["_item"]>
              ) => number)
            | undefined
    ): this {
        throw new Error("Array method 'sort' not supported on ResolvedCoList");
    }

    /** @internal */
    splice(
        _start: number,
        _deleteCount?: number | undefined
    ): ValueOrResolvedRef<L["_item"]>[] {
        throw new Error(
            "Array method 'splice' not supported on ResolvedCoList"
        );
    }

    /** @internal */
    unshift(..._items: ValueOrResolvedRef<L["_item"]>[]): number {
        throw new Error(
            "Array method 'unshift' not supported on ResolvedCoList"
        );
    }

    /** @internal */
    fill(
        _value: ValueOrResolvedRef<L["_item"]>,
        _start?: number | undefined,
        _end?: number | undefined
    ): this {
        throw new Error("Array method 'fill' not supported on ResolvedCoList");
    }

    /** @internal */
    copyWithin(
        _target: number,
        _start: number,
        _end?: number | undefined
    ): this {
        throw new Error(
            "Array method 'copyWithin' not supported on ResolvedCoList"
        );
    }
}
