import { UnCo } from "../internal";
import { CoList } from "./coList";
import { CoMap, CoMapInit } from "./coMap";

export type RecursiveCoMapInit<T> = T extends CoMap
    ? { [K in keyof CoMapInit<T>]: RecursiveCoMapInit<CoMapInit<T>[K]> }
    : T extends CoList
    ? Array<RecursiveCoMapInit<UnCo<T[number]>>>
    : T;