import { MutableCoMap } from "../coValues/coMap.js";
import { CoValueCore } from "../coValueCore.js";
import { Group } from "../group.js";
import { Account, AccountID, Profile, isAccountID } from "../account.js";
import { AnyCoMap, CoID, CoValue } from "../coValue.js";
import { TransactionID } from "../ids.js";
import { ValueOrSubQueried, QueryContext } from "../queries.js";

export type QueriedCoMap<M extends AnyCoMap> = {
    [K in keyof M["_shape"] & string]: ValueOrSubQueried<M["_shape"][K]>;
} & QueriedCoMapBase<M>;

export type QueriedCoMapEdit<
    M extends AnyCoMap,
    K extends keyof M["_shape"]
> = {
    by?: QueriedAccountAndProfile;
    tx: TransactionID;
    at: Date;
    value: M["_shape"][K] extends CoValue
        ? CoID<M["_shape"][K]>
        : Exclude<M["_shape"][K], CoValue>;
};

export class QueriedCoMapBase<M extends AnyCoMap> {
    coMap!: M;
    id!: CoID<M>;
    type!: "comap";

    /** @internal */
    static newWithKVPairs<M extends AnyCoMap>(
        coMap: M,
        queryContext: QueryContext
    ): QueriedCoMap<M> {
        const kv = {} as {
            [K in keyof M["_shape"] & string]: ValueOrSubQueried<
                M["_shape"][K]
            >;
        };

        if (coMap.meta?.type === "account") {
            const profileID = coMap.get("profile");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (kv as any).profile =
                profileID && queryContext.resolveValue(profileID);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (kv as any).isMe =
                (coMap as unknown as Account).id ===
                queryContext.node.account.id;
        } else {
            for (const key of coMap.keys()) {
                const value = coMap.get(key);

                if (value === undefined) continue;

                kv[key as keyof typeof kv] = queryContext.resolveValue(
                    value
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ) as any;
            }
        }

        return Object.assign(new QueriedCoMapBase(coMap, queryContext), kv);
    }

    /** @internal */
    constructor(coMap: M, queryContext: QueryContext) {
        Object.defineProperties(this, {
            coMap: { value: coMap, enumerable: false },
            id: { value: coMap.id, enumerable: false },
            type: { value: "comap", enumerable: false },
            edits: {
                value: Object.fromEntries(
                    coMap.keys().flatMap((key) => {
                        const edits = [...coMap.editsAt(key)].map((edit) => ({
                            by:
                                edit.by && isAccountID(edit.by)
                                    ? queryContext.resolveAccount(edit.by)
                                    : undefined,
                            tx: edit.tx,
                            at: new Date(edit.at),
                            value:
                                edit.value &&
                                queryContext.resolveValue(edit.value),
                        }));
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
        value: M["_shape"][K] extends CoValue
            ? M["_shape"][K] | CoID<M["_shape"][K]>
            : M["_shape"][K],
        privacy?: "private" | "trusting"
    ): M;
    set(
        kv: {
            [K in keyof M["_shape"] & string]?: M["_shape"][K] extends CoValue
                ? M["_shape"][K] | CoID<M["_shape"][K]>
                : M["_shape"][K];
        },
        privacy?: "private" | "trusting"
    ): M;
    set<K extends keyof M["_shape"] & string>(
        ...args:
            | [
                  {
                      [K in keyof M["_shape"] &
                          string]?: M["_shape"][K] extends CoValue
                          ? M["_shape"][K] | CoID<M["_shape"][K]>
                          : M["_shape"][K];
                  },
                  ("private" | "trusting")?
              ]
            | [
                  K,
                  M["_shape"][K] extends CoValue
                      ? M["_shape"][K] | CoID<M["_shape"][K]>
                      : M["_shape"][K],
                  ("private" | "trusting")?
              ]
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
}

export type QueriedAccountAndProfile = {
    profile?: { name?: string; id: CoID<Profile> };
    isMe?: boolean;
    id: AccountID;
};
