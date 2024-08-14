/* eslint-disable @typescript-eslint/no-explicit-any */
import { CoList } from "./coList.js";
import { CoMap } from "./coMap.js";
import { DeepPlainData } from "./types.js";

interface PlainDataStrategy {
    toPlainData<T, Depth>(
        value: T,
        seen: WeakMap<CoMap | CoList, DeepPlainData<any, Depth>>,
    ): DeepPlainData<T, Depth>;
}

export const plainDataStrategy: PlainDataStrategy = {
    toPlainData<T, Depth>(
        value: T,
        seen: WeakMap<CoMap | CoList, DeepPlainData<any, Depth>>,
    ): DeepPlainData<T, Depth> {
        if (value instanceof CoMap || value instanceof CoList) {
            if (seen.has(value)) {
                return seen.get(value) as DeepPlainData<T, Depth>;
            }
            return (value as CoMap).asPlainData(seen) as DeepPlainData<
                T,
                Depth
            >;
        }
        return value as DeepPlainData<T, Depth>;
    },
};
