import { UnCo } from "../internal.js";
import { CoList } from "./coList.js";
import { CoMap, CoMapInit } from "./coMap.js";

export type RecursiveCoMapInit<T> = T extends CoMap
    ? { [K in keyof CoMapInit<T>]: RecursiveCoMapInit<CoMapInit<T>[K]> }
    : T extends CoList
    ? Array<RecursiveCoMapInit<UnCo<T[number]>>>
    : T;