import { SessionID } from "cojson";
import {
    Account,
    Clean,
    CoStreamEntry,
    CoValue,
    ID,
    ItemsSym,
    UnCoNotNull,
} from "../internal.js";
import { CoKeys } from "./coMap.js";

export type DeepPlainData<
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
                      DeepPlainData<
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
                        [key: string]: DeepPlainData<
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
                                    | DeepPlainData<
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
                  } & V
        : [V] extends [
                {
                    _type: "CoStream";
                    byMe: CoStreamEntry<infer Item> | undefined;
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
