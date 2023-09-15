import { JsonValue } from "./jsonValue.js";
import { CoMap, WriteableCoMap } from "./coValues/coMap.js";
import {
    BinaryCoStream,
    BinaryStreamInfo,
    CoStream,
    WriteableBinaryCoStream,
    WriteableCoStream,
} from "./coValues/coStream.js";
import { Static } from "./coValues/static.js";
import { CoList, WriteableCoList } from "./coValues/coList.js";
import { CoValueCore, accountOrAgentIDfromSessionID } from "./coValueCore.js";
import { Group } from "./group.js";
import { AccountID, Profile, isAccountID } from "./account.js";
import {
    AnyBinaryCoStream,
    AnyCoList,
    AnyCoMap,
    AnyCoStream,
    AnyCoValue,
    AnyStatic,
    CoID,
    CoValue,
} from "./coValue.js";
import { SessionID } from "./ids.js";
import { LocalNode } from "./node.js";

export const AllReservedQueryProps = [
    "id",
    "type",
    "meta",
    "core",
    "group",
    "shadowed",
    "edit",
    "edits",
] as const;

export type ReservedQueryProps = (typeof AllReservedQueryProps)[number];

export type QueriedCoMap<T extends AnyCoMap> = T extends CoMap<
    infer M,
    infer Meta
>
    ? Readonly<{
          [K in keyof M as Exclude<K, ReservedQueryProps>]: ValueOrSubQueried<
              M[K]
          >;
      }> &
          (keyof M & ReservedQueryProps extends never
              ? // eslint-disable-next-line @typescript-eslint/ban-types
                {}
              : Readonly<{
                    shadowed: Readonly<{
                        [K in keyof M as Extract<
                            K,
                            ReservedQueryProps
                        >]: ValueOrSubQueried<M[K]>;
                    }>;
                }>) &
          Readonly<{
              id: CoID<T>;
              type: "comap";
              edits: Readonly<{
                  [K in keyof M & string]: Readonly<{
                      by?: QueriedAccountAndProfile;
                      at: Date;
                      // all: TODO;
                  }>;
              }>;
              meta: Meta;
              group: Group;
              core: CoValueCore;
              edit: (changer: (editable: WriteableCoMap<M, Meta>) => void) => T;
          }>
    : never;

export type QueriedAccountAndProfile = Readonly<{
    id: AccountID;
    profile?: Readonly<{ name?: string; id: CoID<Profile> }>;
    isMe?: boolean;
}>;

export type QueriedCoList<T extends AnyCoList> = T extends CoList<
    infer I,
    infer Meta
>
    ? readonly ValueOrSubQueried<I>[] &
          Readonly<{
              id: CoID<T>;
              type: "colist";
              meta: Meta;
              group: Group;
              core: CoValueCore;
              edit: (
                  changer: (editable: WriteableCoList<I, Meta>) => void
              ) => T;
              edits: readonly Readonly<{
                  by?: QueriedAccountAndProfile;
                  at: Date;
              }>[] & {
                  // deletions: TODO;
              };
          }>
    : never;

export type QueriedCoStreamItems<I extends JsonValue | CoValue> = Readonly<{
    last: ValueOrSubQueried<I> | undefined;
    by?: QueriedAccountAndProfile;
    at?: Date;
    all: { value: ValueOrSubQueried<I>; at: Date }[];
}>;

export type QueriedCoStream<T extends AnyCoStream> = T extends CoStream<
    infer I,
    infer Meta
>
    ? Readonly<{
          id: CoID<T>;
          type: "costream";
          me?: QueriedCoStreamItems<I>;
          perAccount: Readonly<{
              [account: AccountID]: QueriedCoStreamItems<I>;
          }>;
          perSession: Readonly<{
              [session: SessionID]: QueriedCoStreamItems<I>;
          }>;
          meta: Meta;
          group: Group;
          core: CoValueCore;
          edit: (changer: (editable: WriteableCoStream<I, Meta>) => void) => T;
      }>
    : never;

export type QueriedBinaryCoStreamItems = Readonly<{
    last: Uint8Array | undefined;
    by: QueriedAccountAndProfile;
    at: Date;
    all: { value: Uint8Array; at: Date }[];
}>;

export type QueriedBinaryCoStream<T extends AnyBinaryCoStream> =
    T extends BinaryCoStream<infer Meta>
        ? Readonly<
              {
                  id: CoID<T>;
                  type: "costream";
                  me?: QueriedBinaryCoStreamItems;
                  perAccount: Readonly<{
                      [account: AccountID]: QueriedBinaryCoStreamItems;
                  }>;
                  perSession: Readonly<{
                      [session: SessionID]: QueriedBinaryCoStreamItems;
                  }>;
                  meta: Meta;
                  group: Group;
                  core: CoValueCore;
                  edit: (
                      changer: (editable: WriteableBinaryCoStream<Meta>) => void
                  ) => T;
              }
          > & Readonly<BinaryStreamInfo>
        : never;

export type QueriedStatic<T extends AnyStatic> = T extends Static<infer Meta>
    ? Readonly<{
          id: CoID<T>;
          type: "colist";
          meta: Meta;
          group: Group;
          core: CoValueCore;
      }>
    : never;

export type Queried<T extends CoValue> = T extends AnyCoMap
    ? QueriedCoMap<T>
    : T extends AnyCoList
    ? QueriedCoList<T>
    // : T extends BinaryCoStream<infer _>
    // ? QueriedBinaryCoStream<T>
    : T extends AnyCoStream
    ? QueriedCoStream<T>
    : T extends AnyStatic
    ? QueriedStatic<T>
    : never;

export type ValueOrSubQueried<
    V extends JsonValue | CoValue | CoID<CoValue> | undefined
> = V extends CoID<infer C>
    ? Queried<C> | undefined
    : V extends CoValue
    ? Queried<V> | undefined
    : V;

export type QueryInclude<T extends CoValue> = T extends CoMap<
    infer M,
    infer _Meta
>
    ? {
          [K in keyof M as M[K] extends AnyCoValue | CoID<AnyCoValue>
              ? K
              : never]?: M[K] extends AnyCoValue
              ? true | QueryInclude<M[K]>
              : M[K] extends CoID<infer S>
              ? true | QueryInclude<S>
              : never;
      }
    : T extends CoList<infer I, infer _>
    ? I extends AnyCoValue
        ? [true] | [QueryInclude<I>]
        : I extends CoID<infer S>
        ? [true] | [QueryInclude<S>]
        : never
    : never; // TODO add CoStream;

export function query<T extends CoValue>(
    id: CoID<T>,
    node: LocalNode,
    callback: (queried: Queried<T> | undefined) => void
): () => void {
    console.log("querying", id);

    const children: {
        [id: CoID<CoValue>]: {
            lastQueried: { [key: string]: any } | undefined;
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
                    child!.lastQueried = childQueried;
                    onUpdate();
                }),
            };
            children[childID] = child;
        }
        return child.lastQueried as Queried<T> | undefined;
    }

    function resolveValue<T extends JsonValue>(
        value: T
    ): T extends CoID<CoValue> ? Queried<CoValue> | undefined : T {
        return (
            typeof value === "string" && value.startsWith("co_")
                ? getChildLastQueriedOrSubscribe(value as CoID<CoValue>)
                : value
        ) as T extends CoID<CoValue> ? Queried<CoValue> | undefined : T;
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
                return {}
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

    function queryMap(rootValue: T & CoMap<any, any>) {
        const mapResult: {
            [key: string]: any;
        } = {};
        // let allChildrenAvailable = true;
        for (const key of rootValue.keys()) {
            const value = rootValue.get(key);

            if (value === undefined) continue;

            if (AllReservedQueryProps.includes(key as ReservedQueryProps)) {
                mapResult.shadowed = mapResult.shadowed || {};
                mapResult.shadowed[key] = resolveValue(value);
            } else {
                mapResult[key] = resolveValue(value);
            }
        }

        Object.defineProperties(mapResult, {
            id: { value: rootValue.id },
            type: { value: "comap" },
        });

        if (
            rootValue.meta?.type !== "account" &&
            rootValue.meta?.type !== "profile"
        ) {
            Object.defineProperties(mapResult, {
                edit: {
                    value: (
                        changer: (editable: WriteableCoMap<any, any>) => void
                    ) => {
                        rootValue.edit(changer);
                        return rootValue;
                    },
                },
                edits: {
                    value: {},
                },
            });

            for (const key of rootValue.keys()) {
                const editorID = rootValue.whoEdited(key);
                const editor =
                    editorID && getChildLastQueriedOrSubscribe(editorID);
                mapResult.edits[key] = {
                    by: editor && {
                        id: editorID,
                        isMe: editorID === node.account.id ? true : undefined,
                        profile: editor.profile && {
                            id: editor.profile.id,
                            name: editor.profile.name,
                        },
                    },
                    at: new Date(rootValue.getLastEntry(key)!.at),
                };
            }
        }

        Object.defineProperties(mapResult, {
            meta: { value: rootValue.meta },
            group: {
                get() {
                    return rootValue.group;
                },
            },
            core: {
                get() {
                    return rootValue.core;
                },
            },
        });
        return mapResult;
    }

    function queryList(rootValue: T & CoList<any, any>) {
        const arr: any[] & { [key: string]: any } = rootValue
            .asArray()
            .map(resolveValue);

        Object.defineProperties(arr, {
            type: { value: "colist" },
            id: { value: rootValue.id },
            edit: {
                value: (
                    changer: (editable: WriteableCoList<any, any>) => void
                ) => {
                    rootValue.edit(changer);
                    return rootValue;
                },
            },
            edits: {
                value: [],
            },
            meta: { value: rootValue.meta },
            group: {
                get() {
                    return rootValue.group;
                },
            },
            core: {
                get() {
                    return rootValue.core;
                },
            },
        });

        for (let i = 0; i < arr.length; i++) {
            const editorID = rootValue.whoInserted(i);
            const editor = editorID && getChildLastQueriedOrSubscribe(editorID);
            arr.edits[i] = {
                by: editor && {
                    id: editorID,
                    isMe: editorID === node.account.id ? true : undefined,
                    profile: editor.profile && {
                        id: editor.profile.id,
                        name: editor.profile.name,
                    },
                },
                at: new Date(rootValue.entries()[i]!.madeAt),
            };
        }
        return arr;
    }

    function queryStream(rootValue: T & CoStream<any, any>) {
        const seenAccounts = new Set<AccountID>();

        const perSession = Object.fromEntries(
            Object.entries(rootValue.items).map(([sessionID, items]) => {
                const editorID = accountOrAgentIDfromSessionID(
                    sessionID as SessionID
                );
                if (isAccountID(editorID)) seenAccounts.add(editorID);
                const editor =
                    editorID &&
                    (isAccountID(editorID)
                        ? getChildLastQueriedOrSubscribe(editorID)
                        : undefined);
                const lastItem = items[items.length - 1];
                return [
                    sessionID as SessionID,
                    {
                        last: lastItem && resolveValue(lastItem.item),
                        by: editor && {
                            id: editorID as AccountID,
                            isMe:
                                editorID === node.account.id ? true : undefined,
                            profile: editor.profile && {
                                id: editor.profile.id,
                                name: editor.profile.name,
                            },
                        },
                        at: lastItem && new Date(lastItem.madeAt),
                        all: items.map((item) => ({
                            value: item.item && resolveValue(item.item),
                            at: new Date(item.madeAt),
                        })),
                    } satisfies QueriedCoStreamItems<JsonValue>,
                ];
            })
        );

        const perAccount = Object.fromEntries(
            [...seenAccounts.values()].map((accountID) => {
                const itemsFromAllMatchingSessions = Object.entries(perSession)
                    .flatMap(([sessionID, sessionItems]) =>
                        sessionID.startsWith(accountID) ? sessionItems.all : []
                    )
                    .sort((a, b) => {
                        return a.at.getTime() - b.at.getTime();
                    });
                const editor = getChildLastQueriedOrSubscribe(accountID);
                const lastItem =
                    itemsFromAllMatchingSessions[
                        itemsFromAllMatchingSessions.length - 1
                    ];

                return [
                    accountID,
                    {
                        last: lastItem?.value,
                        by: editor && {
                            id: accountID,
                            isMe:
                                accountID === node.account.id
                                    ? true
                                    : undefined,
                            profile: editor.profile && {
                                id: editor.profile.id,
                                name: editor.profile.name,
                            },
                        },
                        at: lastItem && new Date(lastItem.at),
                        all: itemsFromAllMatchingSessions,
                    } satisfies QueriedCoStreamItems<JsonValue>,
                ];
            })
        );

        const me = isAccountID(node.account.id)
            ? perAccount[node.account.id]
            : undefined;

        const streamResult: QueriedCoStream<AnyCoStream> = {
            type: "costream",
            id: rootValue.id,
            perSession,
            perAccount,
            me,
            meta: rootValue.meta,
            get group() {
                return rootValue.group;
            },
            get core() {
                return rootValue.core;
            },
            edit: (
                changer: (editable: WriteableCoStream<any, any>) => void
            ) => {
                rootValue.edit(changer);
                return rootValue;
            },
        };

        return streamResult;
    }
}
