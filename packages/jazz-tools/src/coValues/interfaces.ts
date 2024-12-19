import type { CojsonInternalTypes, RawCoValue } from "cojson";
import { RawAccount } from "cojson";
import { AnonymousJazzAgent } from "../implementation/anonymousJazzAgent.js";
import type { DeeplyLoaded, DepthsIn } from "../internal.js";
import {
  Ref,
  SubscriptionScope,
  inspect,
  subscriptionsScopes,
} from "../internal.js";
import { coValuesCache } from "../lib/cache.js";
import { type Account } from "./account.js";
import { fulfillsDepth } from "./deepLoading.js";
import { type Group } from "./group.js";
import { RegisteredSchemas } from "./registeredSchemas.js";

/** @category Abstract interfaces */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CoValueClass<Value extends CoValue = CoValue> {
  /** @ignore */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): Value;
}

export interface CoValueFromRaw<V extends CoValue> {
  fromRaw(raw: V["_raw"]): V;
}

/** @category Abstract interfaces */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CoValue {
  /** @category Content */
  readonly id: ID<this>;
  /** @category Type Helpers */
  _type: string;
  /** @category Collaboration */
  _owner: Account | Group;
  /** @category Internals */
  _raw: RawCoValue;
  /** @internal */
  readonly _loadedAs: Account | AnonymousJazzAgent;
  /** @category Stringifying & Inspection */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toJSON(key?: string, seenAbove?: ID<CoValue>[]): any[] | object | string;
  /** @category Stringifying & Inspection */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [inspect](): any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isCoValue(value: any): value is CoValue {
  return value && value._type !== undefined;
}

export function isCoValueClass<V extends CoValue>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
): value is CoValueClass<V> & CoValueFromRaw<V> {
  return typeof value === "function" && value.fromRaw !== undefined;
}

/**
 * IDs are unique identifiers for `CoValue`s.
 * Can be used with a type argument to refer to a specific `CoValue` type.
 *
 * @example
 *
 * ```ts
 * type AccountID = ID<Account>;
 * ```
 *
 * @category CoValues
 */
export type ID<T> = CojsonInternalTypes.RawCoID & IDMarker<T>;

type IDMarker<out T> = { __type(_: never): T };

/** @internal */
export class CoValueBase implements CoValue {
  declare id: ID<this>;
  declare _type: string;
  declare _raw: RawCoValue;
  /** @category Internals */
  declare _instanceID: string;

  get _owner(): Account | Group {
    const owner =
      this._raw.group instanceof RawAccount
        ? RegisteredSchemas["Account"].fromRaw(this._raw.group)
        : RegisteredSchemas["Group"].fromRaw(this._raw.group);

    const subScope = subscriptionsScopes.get(this);
    if (subScope) {
      subScope.onRefAccessedOrSet(this.id, owner.id);
      subscriptionsScopes.set(owner, subScope);
    }

    return owner;
  }

  /** @private */
  get _loadedAs() {
    const rawAccount = this._raw.core.node.account;

    if (rawAccount instanceof RawAccount) {
      return coValuesCache.get(rawAccount, () =>
        RegisteredSchemas["Account"].fromRaw(rawAccount),
      );
    }

    return new AnonymousJazzAgent(this._raw.core.node);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(..._args: any) {
    Object.defineProperty(this, "_instanceID", {
      value: `instance-${Math.random().toString(36).slice(2)}`,
      enumerable: false,
    });
  }

  /** @category Internals */
  static fromRaw<V extends CoValue>(this: CoValueClass<V>, raw: RawCoValue): V {
    return new this({ fromRaw: raw });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toJSON(): object | any[] | string {
    return {
      id: this.id,
      type: this._type,
      error: "unknown CoValue class",
    };
  }

  [inspect]() {
    return this.toJSON();
  }

  /** @category Type Helpers */
  castAs<Cl extends CoValueClass & CoValueFromRaw<CoValue>>(
    cl: Cl,
  ): InstanceType<Cl> {
    const casted = cl.fromRaw(this._raw) as InstanceType<Cl>;
    const subscriptionScope = subscriptionsScopes.get(this);
    if (subscriptionScope) {
      subscriptionsScopes.set(casted, subscriptionScope);
    }
    return casted;
  }
}

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

export function createCoValueObservable<V extends CoValue, Depth>() {
  let currentValue: DeeplyLoaded<V, Depth> | undefined = undefined;
  let subscriberCount = 0;

  function subscribe(
    cls: CoValueClass<V>,
    id: ID<V>,
    as: Account | AnonymousJazzAgent,
    depth: Depth & DepthsIn<V>,
    listener: () => void,
    onUnavailable?: () => void,
  ) {
    subscriberCount++;

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

    return () => {
      unsubscribe();
      subscriberCount--;
      if (subscriberCount === 0) {
        currentValue = undefined;
      }
    };
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
