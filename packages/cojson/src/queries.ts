import { JsonObject, JsonValue } from "./jsonValue.js";
import { CoMap, MutableCoMap } from "./coValues/coMap.js";
import { CoStream, MutableCoStream } from "./coValues/coStream.js";
import { CoList, MutableCoList } from "./coValues/coList.js";
import { CoValueCore } from "./coValueCore.js";
import { Group } from "./group.js";
import { Account, AccountID, Profile, isAccountID } from "./account.js";
import { AnyCoList, AnyCoMap, AnyCoStream, CoID, CoValue } from "./coValue.js";
import { SessionID, TransactionID } from "./ids.js";
import { LocalNode } from "./node.js";

export type QueriedCoMap<M extends AnyCoMap> = {
    [K in keyof M["_shape"] & string]: ValueOrSubQueried<M["_shape"][K]>;
} & {
    co: {
        id: CoID<M>;
        type: "comap";
        edits: {
            [K in keyof M["_shape"] & string]:
                | {
                      by?: QueriedAccountAndProfile;
                      tx: TransactionID;
                      at: Date;
                      value: M["_shape"][K] extends CoValue
                          ? CoID<M["_shape"][K]>
                          : Exclude<M["_shape"][K], CoValue>;
                      all: {
                          by?: QueriedAccountAndProfile;
                          tx: TransactionID;
                          at: Date;
                          value?: M["_shape"][K] extends CoValue
                              ? CoID<M["_shape"][K]>
                              : Exclude<M["_shape"][K], CoValue>;
                      }[];
                  }
                | undefined;
        };
        meta: M["meta"];
        group: Group;
        core: CoValueCore;
        set<K extends keyof M["_shape"] & string>(
            key: K,
            value: M["_shape"][K] extends CoValue
                ? M["_shape"][K] | CoID<M["_shape"][K]>
                : M["_shape"][K],
            privacy?: "private" | "trusting"
        ): M;
        set(
            kv: {
                [K in keyof M["_shape"] &
                    string]?: M["_shape"][K] extends CoValue
                    ? M["_shape"][K] | CoID<M["_shape"][K]>
                    : M["_shape"][K];
            },
            privacy?: "private" | "trusting"
        ): M;
        delete(
            key: keyof M["_shape"] & string,
            privacy?: "private" | "trusting"
        ): M;
        mutate(
            mutator: (mutable: MutableCoMap<M["_shape"], M["meta"]>) => void
        ): M;
    };
};

export type QueriedAccountAndProfile = {
    profile?: { name?: string; id: CoID<Profile> };
    isMe?: boolean;
    co: {
        id: AccountID;
    };
};

export type QueriedCoList<L extends AnyCoList> = readonly ValueOrSubQueried<
    L["_item"]
>[] & {
    co: {
        id: CoID<L>;
        type: "colist";
        meta: L["meta"];
        group: Group;
        core: CoValueCore;
        append(
            item: L["_item"] extends CoValue
                ? L["_item"] | CoID<L["_item"]>
                : L["_item"],
            after?: number,
            privacy?: "private" | "trusting"
        ): L;
        prepend(
            item: L["_item"] extends CoValue
                ? L["_item"] | CoID<L["_item"]>
                : L["_item"],
            before?: number,
            privacy?: "private" | "trusting"
        ): L;
        delete(at: number, privacy: "private" | "trusting"): L;
        mutate(
            mutator: (mutable: MutableCoList<L["_item"], L["meta"]>) => void
        ): L;
        edits: {
            by?: QueriedAccountAndProfile;
            tx: TransactionID;
            at: Date;
            value: L["_item"] extends CoValue
                ? CoID<L["_item"]>
                : Exclude<L["_item"], CoValue>;
        }[];

        deletions: {
            by?: QueriedAccountAndProfile;
            tx: TransactionID;
            at: Date;
        }[];
    };
};

export type QueriedCoStreamItems<Item extends JsonValue | CoValue> = {
    last?: ValueOrSubQueried<Item>;
    by?: QueriedAccountAndProfile;
    tx?: TransactionID;
    at?: Date;
    all: {
        value: ValueOrSubQueried<Item>;
        by?: QueriedAccountAndProfile;
        tx: TransactionID;
        at: Date;
    }[];
};

export type QueriedCoStream<S extends AnyCoStream> = {
    me?: QueriedCoStreamItems<S["_item"]>;
    perAccount: {
        [account: AccountID]: QueriedCoStreamItems<S["_item"]>;
    };
    perSession: {
        [session: SessionID]: QueriedCoStreamItems<S["_item"]>;
    };
    co: {
        id: CoID<S>;
        type: "costream";
        meta: S["meta"];
        group: Group;
        core: CoValueCore;
        push(
            item: S["_item"] extends CoValue
                ? S["_item"] | CoID<S["_item"]>
                : S["_item"],
            privacy?: "private" | "trusting"
        ): S;
        mutate(
            mutator: (mutable: MutableCoStream<S["_item"], S["meta"]>) => void
        ): S;
    };
};

export type Queried<T extends CoValue> = T extends AnyCoMap
    ? QueriedCoMap<T>
    : T extends AnyCoList
    ? QueriedCoList<T>
    : T extends AnyCoStream
    ? T["meta"] extends { type: "binary" }
        ? never
        : QueriedCoStream<T>
    : never;

export type ValueOrSubQueried<
    V extends JsonValue | CoValue | CoID<CoValue> | undefined
> = V extends CoID<infer C>
    ? Queried<C> | undefined
    : V extends CoValue
    ? Queried<V> | undefined
    : V;

export function query<T extends CoValue>(
    id: CoID<T>,
    node: LocalNode,
    callback: (queried: Queried<T> | undefined) => void
): () => void {
    console.log("querying", id);

    const children: {
        [id: CoID<CoValue>]: {
            lastQueried: Queried<CoValue> | undefined;
            unsubscribe: () => void;
        };
    } = {};

    const unsubscribe = node.subscribe(id, (update) => {
        lastRootValue = update;
        onUpdate();
    });

    function getChildLastQueriedOrSubscribe<T extends CoValue>(
        childID: CoID<T>
    ) {
        let child = children[childID];
        if (!child) {
            child = {
                lastQueried: undefined,
                unsubscribe: query(childID, node, (childQueried) => {
                    child!.lastQueried = childQueried as Queried<CoValue>;
                    onUpdate();
                }),
            };
            children[childID] = child;
        }
        return child.lastQueried as Queried<T> | undefined;
    }

    function resolveAccount(accountID: AccountID) {
        return getChildLastQueriedOrSubscribe(
            accountID
        ) as QueriedAccountAndProfile;
    }

    function resolveValue<T extends JsonValue>(
        value: T
    ): T extends CoID<infer C> ? Queried<C> | undefined : T {
        return (
            typeof value === "string" && value.startsWith("co_")
                ? getChildLastQueriedOrSubscribe(value as CoID<CoValue>)
                : value
        ) as T extends CoID<infer C> ? Queried<C> | undefined : T;
    }

    let lastRootValue: T | undefined;

    function onUpdate() {
        const rootValue = lastRootValue;

        if (rootValue === undefined) {
            return undefined;
        }

        if (rootValue instanceof CoMap) {
            callback(queryMap(rootValue) as Queried<T>);
        } else if (rootValue instanceof CoList) {
            callback(queryList(rootValue) as unknown as Queried<T>);
        } else if (rootValue instanceof CoStream) {
            if (rootValue.meta?.type === "binary") {
                // Querying binary string not yet implemented
                return {};
            } else {
                callback(queryStream(rootValue) as unknown as Queried<T>);
            }
        }
    }

    return function cleanup() {
        for (const child of Object.values(children)) {
            child.unsubscribe();
        }
        unsubscribe();
    };

    function queryMap<
        Shape extends { [key: string]: JsonValue | CoValue | undefined },
        Meta extends JsonObject | null = null
    >(map: CoMap<Shape, Meta>) {
        const kv = {} as {
            [K in keyof Shape & string]: ValueOrSubQueried<Shape[K]>;
        };

        if (map.meta?.type === "account") {
            const profileID = map.get("profile");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (kv as any).profile = profileID && resolveValue(profileID);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (kv as any).isMe =
                (map as unknown as Account).id === node.account.id;
        } else {
            for (const key of map.keys()) {
                const value = map.get(key);

                if (value === undefined) continue;

                kv[key as keyof typeof kv] = resolveValue(
                    value
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ) as any;
            }
        }

        const mapResult = kv as QueriedCoMap<CoMap<Shape, Meta>>;
        Object.defineProperty(mapResult, "co", {
            value: {},
        });

        Object.defineProperties(mapResult.co, {
            id: { value: map.id },
            type: { value: "comap" },
        });

        if (map.meta?.type !== "account" && map.meta?.type !== "profile") {
            Object.defineProperties(mapResult.co, {
                set: {
                    value: (...args: Parameters<CoMap<Shape, Meta>["set"]>) => {
                        return map.set(...args);
                    },
                },
                delete: {
                    value: (
                        key: keyof Shape & string,
                        privacy: "private" | "trusting" = "private"
                    ) => {
                        return map.delete(key, privacy);
                    },
                },
                mutate: {
                    value: (
                        mutator: (mutable: MutableCoMap<Shape, Meta>) => void
                    ) => {
                        return map.mutate(mutator);
                    },
                },
                edits: {
                    value: {},
                },
            });

            for (const key of map.keys()) {
                const edits = [...map.editsAt(key)].map((edit) => ({
                    by:
                        edit.by && isAccountID(edit.by)
                            ? resolveAccount(edit.by)
                            : undefined,
                    tx: edit.tx,
                    at: new Date(edit.at),
                    value: edit.value && resolveValue(edit.value),
                }));
                const lastEdit = edits[edits.length - 1];
                if (!lastEdit) continue;
                mapResult.co.edits[key] = {
                    by: lastEdit.by,
                    tx: lastEdit.tx,
                    at: lastEdit.at,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value: lastEdit.value as any,
                    all: edits,
                };
            }
        }

        Object.defineProperties(mapResult.co, {
            meta: { value: map.meta },
            group: {
                get() {
                    return map.group;
                },
            },
            core: {
                get() {
                    return map.core;
                },
            },
        });
        return mapResult;
    }

    function queryList<
        Item extends JsonValue | CoValue,
        Meta extends JsonObject | null = null
    >(list: CoList<Item, Meta>) {
        const arr = list
            .asArray()
            .map(resolveValue) as unknown as QueriedCoList<CoList<Item, Meta>>;

        Object.defineProperty(arr, "co", {
            value: {
                type: "colist",
                id: list.id,
                append: (
                    item: Item extends CoValue ? Item | CoID<Item> : Item,
                    after: number | undefined,
                    privacy: "private" | "trusting" = "private"
                ) => {
                    return list.append(item, after, privacy);
                },

                prepend: (
                    item: Item extends CoValue ? Item | CoID<Item> : Item,
                    before: number | undefined,
                    privacy: "private" | "trusting" = "private"
                ) => {
                    return list.prepend(item, before, privacy);
                },

                delete: (
                    at: number,
                    privacy: "private" | "trusting" = "private"
                ) => {
                    return list.delete(at, privacy);
                },

                mutate: (
                    mutator: (mutable: MutableCoList<Item, Meta>) => void
                ) => {
                    return list.mutate(mutator);
                },

                edits: [],

                meta: list.meta,
                get group() {
                    return list.group;
                },
                get core() {
                    return list.core;
                },
            },
        });

        for (let i = 0; i < arr.length; i++) {
            const edit = list.editAt(i)!;
            arr.co.edits[i] = {
                by:
                    edit.by && isAccountID(edit.by)
                        ? resolveAccount(edit.by)
                        : undefined,
                tx: edit.tx,
                at: new Date(edit.at),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value: resolveValue(edit.value) as any,
            };
        }
        arr.co.deletions = list.deletionEdits().map((deletion) => ({
            by:
                deletion.by && isAccountID(deletion.by)
                    ? resolveAccount(deletion.by)
                    : undefined,
            tx: deletion.tx,
            at: new Date(deletion.at),
        }));
        return arr;
    }

    function queryStream<
        Item extends CoValue | JsonValue,
        Meta extends JsonObject | null
    >(stream: CoStream<Item, Meta>) {
        const perSession = Object.fromEntries(
            stream.sessions().map((sessionID) => {
                const items = [...stream.itemsIn(sessionID)].map((item) => ({
                    by:
                        item.by && isAccountID(item.by)
                            ? resolveAccount(item.by)
                            : undefined,
                    tx: item.tx,
                    at: new Date(item.at),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value: resolveValue(item.value) as any,
                }));

                const lastItem = items[items.length - 1];

                return [
                    sessionID,
                    {
                        last: lastItem?.value,
                        by: lastItem?.by,
                        tx: lastItem?.tx,
                        at: lastItem?.at,
                        all: items,
                    } satisfies QueriedCoStreamItems<Item>,
                ];
            })
        );

        const perAccount = Object.fromEntries(
            [...stream.accounts()].map((accountID) => {
                const items = [...stream.itemsBy(accountID)].map((item) => ({
                    by:
                        item.by && isAccountID(item.by)
                            ? resolveAccount(item.by)
                            : undefined,
                    tx: item.tx,
                    at: new Date(item.at),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value: resolveValue(item.value) as any,
                }));

                const lastItem = items[items.length - 1];

                return [
                    accountID,
                    {
                        last: lastItem?.value,
                        by: lastItem?.by,
                        tx: lastItem?.tx,
                        at: lastItem?.at,
                        all: items,
                    } satisfies QueriedCoStreamItems<Item>,
                ];
            })
        );

        const me = isAccountID(node.account.id)
            ? perAccount[node.account.id]
            : undefined;

        const streamResult: QueriedCoStream<CoStream<Item, Meta>> = {
            perSession,
            perAccount,
            me,
            co: {
                type: "costream",
                id: stream.id,
                meta: stream.meta,
                get group() {
                    return stream.group;
                },
                get core() {
                    return stream.core;
                },
                push: (
                    item: Item extends CoValue ? Item | CoID<Item> : Item,
                    privacy: "private" | "trusting" = "private"
                ) => {
                    return stream.push(item, privacy);
                },
                mutate: (
                    mutator: (mutable: MutableCoStream<Item, Meta>) => void
                ) => {
                    return stream.mutate(mutator);
                },
            },
        };

        return streamResult;
    }
}
