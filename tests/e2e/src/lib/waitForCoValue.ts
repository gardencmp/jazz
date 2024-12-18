import {
  Account,
  CoValue,
  CoValueClass,
  ID,
  RefsToResolve,
  subscribeToCoValue,
} from "jazz-tools";

export function waitForCoValue<
  T extends CoValue,
  const O extends { resolve?: RefsToResolve<T> },
>(
  coMap: CoValueClass<T>,
  valueId: ID<T>,
  account: Account,
  predicate: (value: T) => boolean,
  options?: O,
) {
  return new Promise<T>((resolve) => {
    function subscribe() {
      const unsubscribe = subscribeToCoValue(
        coMap,
        valueId,
        account,
        options,
        (value) => {
          if (predicate(value)) {
            resolve(value);
            unsubscribe();
          }
        },
        () => {
          unsubscribe();
          setTimeout(subscribe, 100);
        },
      );
    }

    subscribe();
  });
}
