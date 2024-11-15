import { AnonymousJazzAgent } from "../exports";
import { Ref } from "../implementation/refs";
import { SubscriptionScope } from "../implementation/subscriptionScope";
import { Account } from "./account";
import { type DeeplyLoaded, type DepthsIn, fulfillsDepth } from "./deepLoading";
import { CoValue, CoValueClass, CoValueFromRaw, ID } from "./interfaces";

export function createCoValueObservable<V extends CoValue, Depth>() {
  let currentValue: DeeplyLoaded<V, Depth> | undefined = undefined;

  function subscribe(
    cls: CoValueClass<V>,
    id: ID<V>,
    as: Account | AnonymousJazzAgent,
    depth: Depth & DepthsIn<V>,
    listener: () => void,
    onUnavailable?: () => void,
  ) {
    const unsubscribe = subscribeToCoValue(
      cls,
      id,
      as,
      depth,
      (value) => {
        currentValue = value;
        listener();
      },
      onUnavailable,
    );

    return unsubscribe;
  }

  const observable = {
    getCurrentValue: () => currentValue,
    subscribe,
  };

  return observable;
}

export function subscribeToExistingCoValue<V extends CoValue, Depth>(
  existing: V,
  depth: Depth & DepthsIn<V>,
  listener: (value: DeeplyLoaded<V, Depth>) => void,
): () => void {
  return subscribeToCoValue(
    existing.constructor as CoValueClass<V>,
    existing.id,
    existing._loadedAs,
    depth,
    listener,
  );
}
export function subscribeToCoValue<V extends CoValue, Depth>(
  cls: CoValueClass<V>,
  id: ID<V>,
  as: Account | AnonymousJazzAgent,
  depth: Depth & DepthsIn<V>,
  listener: (value: DeeplyLoaded<V, Depth>) => void,
  onUnavailable?: () => void,
): () => void {
  const ref = new Ref(id, as, { ref: cls, optional: false });

  let unsubscribed = false;
  let unsubscribe: (() => void) | undefined;

  ref
    .load()
    .then((value) => {
      if (!value) {
        onUnavailable && onUnavailable();
        return;
      }
      if (unsubscribed) return;
      const subscription = new SubscriptionScope(
        value,
        cls as CoValueClass<V> & CoValueFromRaw<V>,
        (update) => {
          if (fulfillsDepth(depth, update)) {
            listener(update as DeeplyLoaded<V, Depth>);
          }
        },
      );

      unsubscribe = () => subscription.unsubscribeAll();
    })
    .catch((e) => {
      console.error("Failed to load / subscribe to CoValue", e);
    });

  return function unsubscribeAtAnyPoint() {
    unsubscribed = true;
    unsubscribe && unsubscribe();
  };
}
