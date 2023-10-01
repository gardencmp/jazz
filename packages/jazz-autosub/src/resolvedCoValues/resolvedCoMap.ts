import { CoID, CoMap, Group, MutableCoMap, CojsonInternalTypes } from "cojson";
import { ValueOrResolvedRef, AutoSubContext, AutoSubExtension } from "../autoSub.js";
import { ResolvedAccount } from "./resolvedAccount.js";

export type ResolvedCoMap<M extends CoMap> = {
    [K in keyof M["_shape"] & string]: ValueOrResolvedRef<M["_shape"][K]>;
} & ResolvedCoMapBase<M>;

export type ResolvedCoMapEdit<M extends CoMap, K extends keyof M["_shape"]> = {
    by?: ResolvedAccount;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
    value: M["_shape"][K];
};

export type ResolvedCoMapLastAndAllEdits<
    M extends CoMap,
    K extends keyof M["_shape"]
> = ResolvedCoMapEdit<M, K> & {
    all: ResolvedCoMapEdit<M, K>[];
};

export type ResolvedCoMapMeta<M extends CoMap> = {
    coValue: M;
    edits: {
        [K in keyof M["_shape"] & string]:
            | ResolvedCoMapLastAndAllEdits<M, K>
            | undefined;
    };
    headerMeta: M["headerMeta"];
    group: Group;
};

export class ResolvedCoMapBase<M extends CoMap> {
    id!: CoID<M>;
    coValueType!: "comap";
    meta!: ResolvedCoMapMeta<M>;

    /** @internal */
    static newWithKVPairs<M extends CoMap>(
        coMap: M,
        autoSubContext: AutoSubContext
    ): ResolvedCoMap<M> {
        const kv = {} as {
            [K in keyof M["_shape"] & string]: ValueOrResolvedRef<M["_shape"][K]>;
        };
        for (const key of coMap.keys()) {
            const value = coMap.get(key);

            if (value === undefined) continue;

            autoSubContext.defineResolvedRefPropertiesIn(
                kv,
                {
                    [key]: { value, enumerable: true },
                },
                [coMap.id]
            );
        }

        return Object.assign(new ResolvedCoMapBase(coMap, autoSubContext), kv);
    }

    /** @internal */
    constructor(coMap: M, autoSubContext: AutoSubContext) {
        Object.defineProperties(this, {
            id: { value: coMap.id, enumerable: false },
            coValueType: { value: "comap", enumerable: false },
            meta: {
                value: {
                    coValue: coMap,
                    edits: Object.fromEntries(
                        coMap.keys().flatMap((key) => {
                            const edits = [...coMap.editsAt(key)].map(
                                (edit) =>
                                    autoSubContext.defineResolvedRefPropertiesIn(
                                        {
                                            tx: edit.tx,
                                            at: new Date(edit.at),
                                        },
                                        {
                                            by: {
                                                value: edit.by,
                                                enumerable: true,
                                            },
                                            value: {
                                                value: edit.value,
                                                enumerable: true,
                                            },
                                        },
                                        [coMap.id]
                                    ) as ResolvedCoMapEdit<M, keyof M["_shape"]>
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
                    ) as {
                        [K in keyof M["_shape"] & string]:
                            | ResolvedCoMapLastAndAllEdits<M, K>
                            | undefined;
                    },
                    headerMeta: coMap.headerMeta,
                    group: coMap.group,
                } satisfies ResolvedCoMapMeta<M>,
                enumerable: false,
            },
            as: {
                value: <O>(extension: AutoSubExtension<M, O>) => {
                    return autoSubContext.getOrCreateExtension(
                        coMap.id,
                        extension
                    );
                },
                enumerable: false,
            },
        });
    }

    get<K extends keyof M["_shape"] & string>(key: K): ResolvedCoMap<M>[K] {
        return (this as ResolvedCoMap<M>)[key];
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
        return (this.meta.coValue.set as Function)(...args);
    }
    delete(
        key: keyof M["_shape"] & string,
        privacy?: "private" | "trusting"
    ): M {
        return this.meta.coValue.delete(key, privacy);
    }
    mutate(
        mutator: (mutable: MutableCoMap<M["_shape"], M["headerMeta"]>) => void
    ): M {
        return this.meta.coValue.mutate(mutator);
    }

    as!: <O>(extension: AutoSubExtension<M, O>) => O | undefined;
}
