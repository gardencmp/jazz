/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnCo } from "../internal.js";
import { CoList } from "./coList.js";
import { CoMap, CoMapInit } from "./coMap.js";

type RecursiveCoMapInit<T> = T extends CoMap
    ? { [K in keyof CoMapInit<T>]: RecursiveCoMapInit<CoMapInit<T>[K]> }
    : T extends CoList
      ? Array<RecursiveCoMapInit<UnCo<T[number]>>>
      : T;

interface PlainDataStrategy {
    toPlainData<T>(
        value: T,
        seen: WeakMap<CoMap | CoList, RecursiveCoMapInit<any>>,
    ): RecursiveCoMapInit<T>;
}

export const plainDataStrategy: PlainDataStrategy = {
    toPlainData<T>(
        value: T,
        seen: WeakMap<CoMap | CoList, RecursiveCoMapInit<any>>,
    ): RecursiveCoMapInit<T> {
        if (value instanceof CoMap || value instanceof CoList) {
            if (seen.has(value)) {
                return seen.get(value) as RecursiveCoMapInit<T>;
            }
            return (value as CoMap).asPlainData(seen) as RecursiveCoMapInit<T>;
        }
        return value as RecursiveCoMapInit<T>;
    },
};
