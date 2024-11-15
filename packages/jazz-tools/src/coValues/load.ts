import { AnonymousJazzAgent } from "../exports";
import { Account } from "./account";
import type { DeeplyLoaded, DepthsIn } from "./deepLoading";
import { CoValue, CoValueClass, ID } from "./interfaces";
import { subscribeToCoValue } from "./subscribe";

export function loadCoValue<V extends CoValue, Depth>(
  cls: CoValueClass<V>,
  id: ID<V>,
  as: Account | AnonymousJazzAgent,
  depth: Depth & DepthsIn<V>,
): Promise<DeeplyLoaded<V, Depth> | undefined> {
  return new Promise((resolve) => {
    const unsubscribe = subscribeToCoValue(
      cls,
      id,
      as,
      depth,
      (value) => {
        resolve(value);
        unsubscribe();
      },
      () => {
        resolve(undefined);
        unsubscribe();
      },
    );
  });
}

export function ensureCoValueLoaded<V extends CoValue, Depth>(
  existing: V,
  depth: Depth & DepthsIn<V>,
): Promise<DeeplyLoaded<V, Depth> | undefined> {
  return loadCoValue(
    existing.constructor as CoValueClass<V>,
    existing.id,
    existing._loadedAs,
    depth,
  );
}
