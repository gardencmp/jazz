import { SessionID } from "cojson";
import {
    Account,
    Clean,
    CoStreamEntry,
    CoValue,
    ID,
    ItemsSym,
    UnCo,
    UnCoNotNull,
} from "../internal.js";
import { CoKeys } from "./coMap.js";

export type ShallowPlainData<V> = [V] extends [Array<infer Item>]
    ? UnCoNotNull<Item> extends CoValue
        ? (null | ShallowPlainData<UnCoNotNull<Item>>)[]
        : Item[]
    : [V] extends [{ _type: "CoMap" | "Group" | "Account" }]
      ? ItemsSym extends keyof V
          ? {
                [key: string]: UnCoNotNull<V[ItemsSym]> extends CoValue
                    ? null | ShallowPlainData<UnCoNotNull<V[ItemsSym]>>
                    : UnCo<V[ItemsSym]>;
            }
          : {
                [Key in CoKeys<V>]: UnCoNotNull<V[Key]> extends CoValue
                    ? null | ShallowPlainData<UnCoNotNull<V[Key]>>
                    : UnCo<V[Key]>;
            }
      : never;

export type Simplify<A> = {
    [K in keyof A]: A[K];
} extends infer B
    ? B
    : never;

export type DeepPlainData<V, Depth> = Simplify<DeepPlainDataHelper<V, Depth>>;

export type DeepPlainDataHelper<
    V,
    Depth,
    DepthLimit extends number = 5,
    CurrentDepth extends number[] = [],
> = DepthLimit extends CurrentDepth["length"]
    ? ShallowPlainData<V>
    : // Basically V extends CoList - but if we used that we'd introduce circularity into the definition of CoList itself
      [V] extends [Array<infer Item>]
      ? Depth extends never[] // []
          ? ShallowPlainData<V>
          : UnCoNotNull<Item> extends CoValue
            ? Depth extends Array<infer ItemDepth> // [item-depth]
                ? (UnCoNotNull<Item> &
                      DeepPlainDataHelper<
                          UnCoNotNull<Item>,
                          ItemDepth,
                          DepthLimit,
                          [0, ...CurrentDepth]
                      >)[]
                : never
            : V
      : // Basically V extends CoMap | Group | Account - but if we used that we'd introduce circularity into the definition of CoMap itself
        [V] extends [{ _type: "CoMap" | "Group" | "Account" }]
        ? Depth extends never[]
            ? ShallowPlainData<V>
            : Depth extends Array<infer ItemDepth>
              ? ItemsSym extends keyof V
                  ? {
                        [key: string]: DeepPlainDataHelper<
                            Clean<V[ItemsSym]>,
                            ItemDepth,
                            DepthLimit,
                            [0, ...CurrentDepth]
                        >;
                    }
                  : never
              : keyof Depth extends never
                ? ShallowPlainData<V>
                : {
                      [Key in keyof Depth]-?: Key extends CoKeys<V>
                          ? Clean<V[Key]> extends CoValue
                              ?
                                    | DeepPlainDataHelper<
                                          Clean<V[Key]>,
                                          Depth[Key],
                                          DepthLimit,
                                          [0, ...CurrentDepth]
                                      >
                                    | (undefined extends V[Key]
                                          ? undefined
                                          : never)
                              : never
                          : never;
                  } & ShallowPlainData<V>
        : never;
