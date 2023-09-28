import { CoMap, MutableCoMap } from "../coValues/coMap.js";
import { CoValueCore } from "../coValueCore.js";
import { Group } from "../coValues/group.js";
import { CoID } from "../coValue.js";
import { TransactionID } from "../ids.js";
import { ValueOrSubQueried, QueryContext, QueryExtension } from "../queries.js";
import { QueriedAccount } from "./queriedAccount.js";

export type QueriedCoMap<M extends CoMap> = {
    [K in keyof M["_shape"] & string]: ValueOrSubQueried<M["_shape"][K]>;
} & QueriedCoMapBase<M>;

export type QueriedCoMapEdit<M extends CoMap, K extends keyof M["_shape"]> = {
    by?: QueriedAccount;
    tx: TransactionID;
    at: Date;
    value: M["_shape"][K];
};

export class QueriedCoMapBase<M extends CoMap> {
    coMap!: M;
    id!: CoID<M>;
    type!: "comap";

    /** @internal */
    static newWithKVPairs<M extends CoMap>(
        coMap: M,
        queryContext: QueryContext
    ): QueriedCoMap<M> {
        const kv = {} as {
            [K in keyof M["_shape"] & string]: ValueOrSubQueried<
                M["_shape"][K]
            >;
        };
        for (const key of coMap.keys()) {
            const value = coMap.get(key);

            if (value === undefined) continue;

            queryContext.defineSubqueryPropertiesIn(
                kv,
                {
                    [key]: { value, enumerable: true },
                },
                [coMap.id]
            );
        }

        return Object.assign(new QueriedCoMapBase(coMap, queryContext), kv);
    }

    /** @internal */
    constructor(coMap: M, queryContext: QueryContext) {
        Object.defineProperties(this, {
            coMap: {
                get() {
                    return coMap;
                },
                enumerable: false,
            },
            id: { value: coMap.id, enumerable: false },
            type: { value: "comap", enumerable: false },
            edits: {
                value: Object.fromEntries(
                    coMap.keys().flatMap((key) => {
                        const edits = [...coMap.editsAt(key)].map((edit) =>
                            queryContext.defineSubqueryPropertiesIn(
                                {
                                    tx: edit.tx,
                                    at: new Date(edit.at),
                                },
                                {
                                    by: { value: edit.by, enumerable: true },
                                    value: {
                                        value: edit.value,
                                        enumerable: true,
                                    },
                                },
                                [coMap.id]
                            )
                        );
                        const lastEdit = edits[edits.length - 1];
                        if (!lastEdit) return [];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const editsAtKey = {
                            by: lastEdit.by,
                            tx: lastEdit.tx,
                            at: lastEdit.at,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            value: lastEdit.value as any,
                            all: edits,
                        };

                        return [[key, editsAtKey]];
                    })
                ),
                enumerable: false,
            },
            as: {
                value: <O>(extension: QueryExtension<M, O>) => {
                    return queryContext.getOrCreateExtension(
                        coMap.id,
                        extension
                    );
                },
                enumerable: false,
            },
        });
    }

    edits!: {
        [K in keyof M["_shape"] & string]:
            | (QueriedCoMapEdit<M, K> & {
                  all: QueriedCoMapEdit<M, K>[];
              })
            | undefined;
    };

    get meta(): M["meta"] {
        return this.coMap.meta;
    }

    get group(): Group {
        return this.coMap.group;
    }

    get core(): CoValueCore {
        return this.coMap.core;
    }

    set<K extends keyof M["_shape"] & string>(
        key: K,
        value: M["_shape"][K],
        privacy?: "private" | "trusting"
    ): M;
    set(
        kv: {
            [K in keyof M["_shape"] & string]?: M["_shape"][K];
        },
        privacy?: "private" | "trusting"
    ): M;
    set<K extends keyof M["_shape"] & string>(
        ...args:
            | [
                  {
                      [K in keyof M["_shape"] & string]?: M["_shape"][K];
                  },
                  ("private" | "trusting")?
              ]
            | [K, M["_shape"][K], ("private" | "trusting")?]
    ): M {
        // eslint-disable-next-line @typescript-eslint/ban-types
        return (this.coMap.set as Function)(...args);
    }
    delete(
        key: keyof M["_shape"] & string,
        privacy?: "private" | "trusting"
    ): M {
        return this.coMap.delete(key, privacy);
    }
    mutate(
        mutator: (mutable: MutableCoMap<M["_shape"], M["meta"]>) => void
    ): M {
        return this.coMap.mutate(mutator);
    }

    as!: <O>(extension: QueryExtension<M, O>) => O | undefined;
}
