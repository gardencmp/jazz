import { SessionID } from "cojson";
import {
  Account,
  CoFeed,
  CoFeedEntry,
  CoList,
  ItemsSym,
  Ref,
  RefEncoded,
  UnCo,
} from "../internal.js";
import { CoKeys, CoMap } from "./coMap.js";
import { CoValue, ID } from "./interfaces.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fulfillsDepth(depth: any, value: CoValue): boolean {
  if (depth === true || depth === undefined) {
    return true;
  }
  if (
    value._type === "CoMap" ||
    value._type === "Group" ||
    value._type === "Account"
  ) {
    if ("items" in depth) {
      return Object.entries(value).every(([key, item]) => {
        return (
          value as unknown as {
            _refs: { [key: string]: Ref<CoValue> | undefined };
          }
        )._refs[key]
          ? item && fulfillsDepth(depth.items, item)
          : ((value as CoMap)._schema[ItemsSym] as RefEncoded<CoValue>)!
              .optional;
      });
    } else {
      for (const key of Object.keys(depth)) {
        const map = value as unknown as {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [key: string]: any;
          _refs: { [key: string]: Ref<CoValue> | undefined };
        };
        if (!map._refs[key] && map._schema[key].optional) {
          continue;
        }
        if (!map[key]) {
          return false;
        }
        if (!fulfillsDepth(depth[key], map[key])) {
          return false;
        }
      }
      return true;
    }
  } else if (value._type === "CoList") {
    const itemDepth = depth.items;
    return (value as CoList).every((item, i) =>
      (value as CoList)._refs[i]
        ? item && fulfillsDepth(itemDepth, item)
        : ((value as CoList)._schema[ItemsSym] as RefEncoded<CoValue>).optional,
    );
  } else if (value._type === "CoStream") {
    const itemDepth = depth.items;
    return Object.values((value as CoFeed).perSession).every((entry) =>
      entry.ref
        ? entry.value && fulfillsDepth(itemDepth, entry.value)
        : ((value as CoFeed)._schema[ItemsSym] as RefEncoded<CoValue>).optional,
    );
  } else if (value._type === "BinaryCoStream") {
    return true;
  } else {
    console.error(value);
    throw new Error("Unexpected value type: " + value._type);
  }
}

type UnCoNotNull<T> = UnCo<Exclude<T, null>>;
export type Clean<T> = UnCo<NonNullable<T>>;

export type RefsToResolve<
  V,
  DepthLimit extends number = 5,
  CurrentDepth extends number[] = [],
> =
  | boolean
  | (DepthLimit extends CurrentDepth["length"]
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      : // Basically V extends CoList - but if we used that we'd introduce circularity into the definition of CoList itself
        V extends Array<infer Item>
        ?
            | {
                items: RefsToResolve<
                  UnCoNotNull<Item>,
                  DepthLimit,
                  [0, ...CurrentDepth]
                >;
              }
            | boolean
        : // Basically V extends CoMap | Group | Account - but if we used that we'd introduce circularity into the definition of CoMap itself
          V extends { _type: "CoMap" | "Group" | "Account" }
          ?
              | {
                  [Key in CoKeys<V> as Clean<V[Key]> extends CoValue
                    ? Key
                    : never]?: RefsToResolve<
                    Clean<V[Key]>,
                    DepthLimit,
                    [0, ...CurrentDepth]
                  >;
                }
              | (ItemsSym extends keyof V
                  ? {
                      items: RefsToResolve<
                        Clean<V[ItemsSym]>,
                        DepthLimit,
                        [0, ...CurrentDepth]
                      >;
                    }
                  : never)
              | boolean
          : V extends {
                _type: "CoStream";
                byMe: CoFeedEntry<infer Item> | undefined;
              }
            ?
                | {
                    items: RefsToResolve<
                      UnCoNotNull<Item>,
                      DepthLimit,
                      [0, ...CurrentDepth]
                    >;
                  }
                | boolean
            : boolean);

export type Resolved<
  T,
  O extends { resolve?: RefsToResolve<T> } | undefined,
> = DeeplyLoaded<T, O extends { resolve: infer D } ? D : undefined, 5, []>;

export type DeeplyLoaded<
  V,
  Depth,
  DepthLimit extends number = 5,
  CurrentDepth extends number[] = [],
> = DepthLimit extends CurrentDepth["length"]
  ? V
  : Depth extends true | undefined
    ? V
    : // Basically V extends CoList - but if we used that we'd introduce circularity into the definition of CoList itself
      [V] extends [Array<infer Item>]
      ? UnCoNotNull<Item> extends CoValue
        ? Depth extends { items: infer ItemDepth }
          ? // Deeply loaded CoList
            (UnCoNotNull<Item> &
              DeeplyLoaded<
                UnCoNotNull<Item>,
                ItemDepth,
                DepthLimit,
                [0, ...CurrentDepth]
              >)[] &
              V // the CoList base type needs to be intersected after so that built-in methods return the correct narrowed array type
          : never
        : V
      : // Basically V extends CoMap | Group | Account - but if we used that we'd introduce circularity into the definition of CoMap itself
        [V] extends [{ _type: "CoMap" | "Group" | "Account" }]
        ? ItemsSym extends keyof V
          ? Depth extends { items: infer ItemDepth }
            ? // Deeply loaded Record-like CoMap
              {
                [key: string]: DeeplyLoaded<
                  Clean<V[ItemsSym]>,
                  ItemDepth,
                  DepthLimit,
                  [0, ...CurrentDepth]
                >;
              } & V // same reason as in CoList
            : never
          : keyof Depth extends never // Depth = {}
            ? V
            : // Deeply loaded CoMap
              {
                -readonly [Key in keyof Depth]-?: Key extends CoKeys<V>
                  ? Clean<V[Key]> extends CoValue
                    ?
                        | DeeplyLoaded<
                            Clean<V[Key]>,
                            Depth[Key],
                            DepthLimit,
                            [0, ...CurrentDepth]
                          >
                        | (undefined extends V[Key] ? undefined : never)
                    : never
                  : never;
              } & V // same reason as in CoList
        : [V] extends [
              {
                _type: "CoStream";
                byMe: CoFeedEntry<infer Item> | undefined;
              },
            ]
          ? // Deeply loaded CoStream
            {
              byMe?: { value: UnCoNotNull<Item> };
              inCurrentSession?: { value: UnCoNotNull<Item> };
              perSession: {
                [key: SessionID]: { value: UnCoNotNull<Item> };
              };
            } & { [key: ID<Account>]: { value: UnCoNotNull<Item> } } & V // same reason as in CoList
          : [V] extends [
                {
                  _type: "BinaryCoStream";
                },
              ]
            ? // BinaryCoStream
              V
            : never;
