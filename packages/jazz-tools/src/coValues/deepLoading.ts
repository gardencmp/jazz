import { SessionID } from "cojson";
import { Account, CoList, CoStream, CoStreamEntry, UnCo } from "../internal.js";
import { CoKeys } from "./coMap.js";
import { CoValue, ID } from "./interfaces.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fulfillsDepth(depth: any, value: CoValue): boolean {
    if (
        value._type === "CoMap" ||
        value._type === "Group" ||
        value._type === "Account"
    ) {
        for (const key of Object.keys(depth)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const map = value as { [key: string]: any };
            if (!map[key]) {
                return false;
            }
            if (!fulfillsDepth(depth[key], map[key])) {
                return false;
            }
        }
        return true;
    } else if (value._type === "CoList") {
        if (depth.length === 0) {
            return true;
        } else {
            const itemDepth = depth[0];
            return (value as CoList).every(
                (item) => item && fulfillsDepth(itemDepth, item),
            );
        }
    } else if (value._type === "CoStream") {
        if (depth.length === 0) {
            return true;
        } else {
            const itemDepth = depth[0];
            return Object.values((value as CoStream).perSession).every(
                (entry) => entry.value && fulfillsDepth(itemDepth, entry.value),
            );
        }
    } else if (value._type === "BinaryCoStream") {
        return true;
    } else {
        console.error(value);
        throw new Error("Unexpected value type: " + value._type);
    }
}

type Clean<T> = UnCo<Exclude<T, null>>;

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
                  | [DepthsIn<Clean<Item>, DepthLimit, [0, ...CurrentDepth]>]
                  | never[]
            : // Basically V extends CoMap - but if we used that we'd introduce circularity into the definition of CoMap itself
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
                    | never[]
              : V extends {
                      _type: "CoStream";
                      byMe: CoStreamEntry<infer Item> | undefined;
                  }
                ?
                      | [
                            DepthsIn<
                                Clean<Item>,
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
      V extends Array<infer Item>
      ? Depth extends never[] // []
          ? V
          : Clean<Item> extends CoValue
            ? Depth extends Array<infer ItemDepth> // [item-depth]
                ?
                      V &
                      CoList<(Clean<Item> &
                          DeeplyLoaded<
                              Clean<Item>,
                              ItemDepth,
                              DepthLimit,
                              [0, ...CurrentDepth]
                          >)>

                : never
            : V
      : // Basically V extends CoMap - but if we used that we'd introduce circularity into the definition of CoMap itself
        V extends { _type: "CoMap" | "Group" | "Account" }
        ? Depth extends never[]
            ? V
            : keyof Depth extends never
              ? V
              : V & {
                    [Key in keyof Depth]-?: Key extends CoKeys<V>
                        ? Clean<V[Key]> extends CoValue
                            ? DeeplyLoaded<
                                  Clean<V[Key]>,
                                  Depth[Key],
                                  DepthLimit,
                                  [0, ...CurrentDepth]
                              >
                            : never
                        : never;
                }
        : V extends {
                _type: "CoStream";
                byMe: CoStreamEntry<infer Item> | undefined;
            }
          ? Depth extends never[]
              ? V
              : V & {
                    byMe?: { value: Clean<Item> };
                    inCurrentSession?: { value: Clean<Item> };
                    perSession: { [key: SessionID]: { value: Clean<Item> } };
                } & { [key: ID<Account>]: { value: Clean<Item> } }
          : never;
