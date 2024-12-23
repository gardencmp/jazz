import { SessionID } from "cojson";
import { ItemsSym, type Ref, RefEncoded, UnCo } from "../internal.js";
import { type Account } from "./account.js";
import { type CoFeed, CoFeedEntry } from "./coFeed.js";
import { type CoList } from "./coList.js";
import { type CoKeys, type CoMap } from "./coMap.js";
import { type CoValue, type ID } from "./interfaces.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fulfillsDepth(depth: any, value: CoValue): boolean {
  if (
    value._type === "CoMap" ||
    value._type === "Group" ||
    value._type === "Account"
  ) {
    if (Array.isArray(depth) && depth.length === 1) {
      return Object.entries(value).every(([key, item]) => {
        return (
          value as unknown as {
            _refs: { [key: string]: Ref<CoValue> | undefined };
          }
        )._refs[key]
          ? item && fulfillsDepth(depth[0], item)
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
    if (depth.length === 0) {
      return true;
    } else {
      const itemDepth = depth[0];
      return (value as CoList).every((item, i) =>
        (value as CoList)._refs[i]
          ? item && fulfillsDepth(itemDepth, item)
          : ((value as CoList)._schema[ItemsSym] as RefEncoded<CoValue>)
              .optional,
      );
    }
  } else if (value._type === "CoStream") {
    if (depth.length === 0) {
      return true;
    } else {
      const itemDepth = depth[0];
      return Object.values((value as CoFeed).perSession).every((entry) =>
        entry.ref
          ? entry.value && fulfillsDepth(itemDepth, entry.value)
          : ((value as CoFeed)._schema[ItemsSym] as RefEncoded<CoValue>)
              .optional,
      );
    }
  } else if (value._type === "BinaryCoStream") {
    return true;
  } else {
    console.error(value);
    throw new Error("Unexpected value type: " + value._type);
  }
}

type UnCoNotNull<T> = UnCo<Exclude<T, null>>;
type Clean<T> = UnCo<NonNullable<T>>;

export type DepthsIn<
  V,
  DepthLimit extends number = 5,
  CurrentDepth extends number[] = [],
> =
  | (DepthLimit extends CurrentDepth["length"]
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      : // Basically V extends CoList - but if we used that we'd introduce circularity into the definition of CoList itself
        V extends Array<infer Item>
        ?
            | [DepthsIn<UnCoNotNull<Item>, DepthLimit, [0, ...CurrentDepth]>]
            | never[]
        : // Basically V extends CoMap | Group | Account - but if we used that we'd introduce circularity into the definition of CoMap itself
          V extends { _type: "CoMap" | "Group" | "Account" }
          ?
              | {
                  [Key in CoKeys<V> as Clean<V[Key]> extends CoValue
                    ? Key
                    : never]?: DepthsIn<
                    Clean<V[Key]>,
                    DepthLimit,
                    [0, ...CurrentDepth]
                  >;
                }
              | (ItemsSym extends keyof V
                  ? [
                      DepthsIn<
                        Clean<V[ItemsSym]>,
                        DepthLimit,
                        [0, ...CurrentDepth]
                      >,
                    ]
                  : never)
              | never[]
          : V extends {
                _type: "CoStream";
                byMe: CoFeedEntry<infer Item> | undefined;
              }
            ?
                | [
                    DepthsIn<
                      UnCoNotNull<Item>,
                      DepthLimit,
                      [0, ...CurrentDepth]
                    >,
                  ]
                | never[]
            : never[])
  | never[];

export type DeeplyLoaded<
  V,
  Depth,
  DepthLimit extends number = 5,
  CurrentDepth extends number[] = [],
> = DepthLimit extends CurrentDepth["length"]
  ? V
  : // Basically V extends CoList - but if we used that we'd introduce circularity into the definition of CoList itself
    [V] extends [Array<infer Item>]
    ? Depth extends never[] // []
      ? V
      : UnCoNotNull<Item> extends CoValue
        ? Depth extends Array<infer ItemDepth> // [item-depth]
          ? (UnCoNotNull<Item> &
              DeeplyLoaded<
                UnCoNotNull<Item>,
                ItemDepth,
                DepthLimit,
                [0, ...CurrentDepth]
              >)[] &
              V
          : never
        : V
    : // Basically V extends CoMap | Group | Account - but if we used that we'd introduce circularity into the definition of CoMap itself
      [V] extends [{ _type: "CoMap" | "Group" | "Account" }]
      ? Depth extends never[]
        ? V
        : Depth extends Array<infer ItemDepth>
          ? ItemsSym extends keyof V
            ? V & {
                [key: string]: DeeplyLoaded<
                  Clean<V[ItemsSym]>,
                  ItemDepth,
                  DepthLimit,
                  [0, ...CurrentDepth]
                >;
              }
            : never
          : keyof Depth extends never
            ? V
            : {
                [Key in keyof Depth]-?: Key extends CoKeys<V>
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
              } & V
      : [V] extends [
            {
              _type: "CoStream";
              byMe: CoFeedEntry<infer Item> | undefined;
            },
          ]
        ? Depth extends never[]
          ? V
          : V & {
              byMe?: { value: UnCoNotNull<Item> };
              inCurrentSession?: { value: UnCoNotNull<Item> };
              perSession: {
                [key: SessionID]: { value: UnCoNotNull<Item> };
              };
            } & { [key: ID<Account>]: { value: UnCoNotNull<Item> } }
        : [V] extends [
              {
                _type: "BinaryCoStream";
              },
            ]
          ? V
          : never;
