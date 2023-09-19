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

export const AllReservedQueryProps = [
    "id",
    "isMe",
    "type",
    "meta",
    "core",
    "group",
    "shadowed",
    "set",
    "delete",
    "mutate",
    "edits",
] as const;

export type ReservedQueryProps = (typeof AllReservedQueryProps)[number];

export type QueriedCoMap<M extends AnyCoMap> = M extends CoMap<
    infer Shape,
    infer Meta
>
    ? {
          [K in Exclude<
              keyof Shape & string,
              ReservedQueryProps
          >]: ValueOrSubQueried<Shape[K]>;
      } & (keyof Shape & ReservedQueryProps extends never
          ? // eslint-disable-next-line @typescript-eslint/ban-types
            {}
          : {
                shadowed: {
                    [K in Extract<
                        keyof Shape & string,
                        ReservedQueryProps
                    >]: ValueOrSubQueried<Shape[K]>;
                };
            }) & {
              id: CoID<M>;
              type: "comap";
              edits: {
                  [K in keyof Shape & string]:
                      | {
                            by?: QueriedAccountAndProfile;
                            tx: TransactionID;
                            at: Date;
                            value: Shape[K] extends CoValue
                                ? CoID<Shape[K]>
                                : Exclude<Shape[K], CoValue>;
                            all: {
                                by?: QueriedAccountAndProfile;
                                tx: TransactionID;
                                at: Date;
                                value?: Shape[K] extends CoValue
                                    ? CoID<Shape[K]>
                                    : Exclude<Shape[K], CoValue>;
                            }[];
                        }
                      | undefined;
              };
              meta: Meta;
              group: Group;
              core: CoValueCore;
              set<K extends keyof Shape & string>(
                  key: K,
                  value: Shape[K] extends CoValue
                      ? Shape[K] | CoID<Shape[K]>
                      : Shape[K],
                  privacy?: "private" | "trusting"
              ): M;
              set(
                  kv: {
                      [K in keyof Shape & string]?: Shape[K] extends CoValue
                          ? Shape[K] | CoID<Shape[K]>
                          : Shape[K];
                  },
                  privacy?: "private" | "trusting"
              ): M;
              delete(
                  key: keyof Shape & string,
                  privacy?: "private" | "trusting"
              ): M;
              mutate(mutator: (mutable: MutableCoMap<Shape, Meta>) => void): M;
          }
    : never;

export type QueriedAccountAndProfile = {
    id: AccountID;
    profile?: { name?: string; id: CoID<Profile> };
    isMe?: boolean;
};

export type QueriedCoList<L extends AnyCoList> = L extends CoList<
    infer Item,
    infer Meta
>
    ? readonly ValueOrSubQueried<Item>[] & {
          id: CoID<L>;
          type: "colist";
          meta: Meta;
          group: Group;
          core: CoValueCore;
          append(
              item: Item extends CoValue ? Item | CoID<Item> : Item,
              after?: number,
              privacy?: "private" | "trusting"
          ): L;
          prepend(
              item: Item extends CoValue ? Item | CoID<Item> : Item,
              before?: number,
              privacy?: "private" | "trusting"
          ): L;
          delete(at: number, privacy: "private" | "trusting"): L;
          mutate(mutator: (mutable: MutableCoList<Item, Meta>) => void): L;
          edits: {
              by?: QueriedAccountAndProfile;
              tx: TransactionID;
              at: Date;
              value: Item extends CoValue ? CoID<Item> : Exclude<Item, CoValue>;
          }[] & {
              deletions: {
                  by?: QueriedAccountAndProfile;
                  tx: TransactionID;
                  at: Date;
              }[];
          };
      }
    : never;

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

export type QueriedCoStream<S extends AnyCoStream> = S extends CoStream<
    infer Item,
    infer Meta
>
    ? {
          id: CoID<S>;
          type: "costream";
          me?: QueriedCoStreamItems<Item>;
          perAccount: {
              [account: AccountID]: QueriedCoStreamItems<Item>;
          };
          perSession: {
              [session: SessionID]: QueriedCoStreamItems<Item>;
          };
          meta: Meta;
          group: Group;
          core: CoValueCore;
          push(
              item: Item extends CoValue ? Item | CoID<Item> : Item,
              privacy?: "private" | "trusting"
          ): S;
          mutate(mutator: (mutable: MutableCoStream<Item, Meta>) => void): S;
      }
    : never;

export type Queried<T extends CoValue> = T extends AnyCoMap
    ? QueriedCoMap<T>
    : T extends AnyCoList
    ? QueriedCoList<T>
    : T extends AnyCoStream
    ? T["meta"] extends { type: "binary" }
        ? // eslint-disable-next-line @typescript-eslint/ban-types
          {}
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
        const shadowed = {} as {
            [K in Extract<
                keyof Shape & string,
                ReservedQueryProps
            >]: ValueOrSubQueried<Shape[K]>;
        };
        const nonShadowed = {} as {
            [K in Exclude<
                keyof Shape & string,
                ReservedQueryProps
            >]: ValueOrSubQueried<Shape[K]>;
        };

        if (map.meta?.type === "account") {
            const profileID = map.get("profile");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (nonShadowed as any).profile = profileID && resolveValue(profileID);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (nonShadowed as any).isMe =
                (map as unknown as Account).id === node.account.id;
        } else {
            for (const key of map.keys()) {
                const value = map.get(key);

                if (value === undefined) continue;

                if (AllReservedQueryProps.includes(key as ReservedQueryProps)) {
                    shadowed[key as keyof typeof shadowed] = resolveValue(
                        value
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ) as any;
                } else {
                    nonShadowed[key as keyof typeof nonShadowed] = resolveValue(
                        value
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ) as any;
                }
            }
        }

        const mapResult = (
            Object.keys(shadowed).length > 0
                ? Object.assign({ shadowed }, nonShadowed)
                : nonShadowed
        ) as QueriedCoMap<CoMap<Shape, Meta>>;

        Object.defineProperties(mapResult, {
            id: { value: map.id },
            type: { value: "comap" },
        });

        if (map.meta?.type !== "account" && map.meta?.type !== "profile") {
            Object.defineProperties(mapResult, {
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
                mapResult.edits[key] = {
                    by: lastEdit.by,
                    tx: lastEdit.tx,
                    at: lastEdit.at,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value: lastEdit.value as any,
                    all: edits,
                };
            }
        }

        Object.defineProperties(mapResult, {
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

        Object.defineProperties(arr, {
            type: { value: "colist" },
            id: { value: list.id },
            append: {
                value: (
                    item: Item extends CoValue ? Item | CoID<Item> : Item,
                    after: number | undefined,
                    privacy: "private" | "trusting" = "private"
                ) => {
                    return list.append(item, after, privacy);
                },
            },
            prepend: {
                value: (
                    item: Item extends CoValue ? Item | CoID<Item> : Item,
                    before: number | undefined,
                    privacy: "private" | "trusting" = "private"
                ) => {
                    return list.prepend(item, before, privacy);
                },
            },
            delete: {
                value: (
                    at: number,
                    privacy: "private" | "trusting" = "private"
                ) => {
                    return list.delete(at, privacy);
                },
            },
            mutate: {
                value: (
                    mutator: (mutable: MutableCoList<Item, Meta>) => void
                ) => {
                    return list.mutate(mutator);
                },
            },
            edits: {
                value: [],
            },
            meta: { value: list.meta },
            group: {
                get() {
                    return list.group;
                },
            },
            core: {
                get() {
                    return list.core;
                },
            },
        });

        for (let i = 0; i < arr.length; i++) {
            const edit = list.editAt(i)!;
            arr.edits[i] = {
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
        arr.edits.deletions = list.deletionEdits().map((deletion) => ({
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
            type: "costream",
            id: stream.id,
            perSession,
            perAccount,
            me,
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
        };

        return streamResult;
    }
}
