import { type RawCoValue } from "cojson";
import { type CoValue } from "../coValues/interfaces.js";

const weakMap = new WeakMap<RawCoValue, CoValue>();

export const coValuesCache = {
  get: <V extends CoValue>(raw: RawCoValue, compute: () => V) => {
    const cached = weakMap.get(raw);
    if (cached) {
      return cached as V;
    }
    const computed = compute();
    weakMap.set(raw, computed);
    return computed;
  },
};
