import type { CojsonInternalTypes, RawCoValue } from "cojson";
import { RawAccount } from "cojson";
import { AnonymousJazzAgent } from "../implementation/createContext.js";
import { inspect } from "../implementation/inspect.js";
import { subscriptionsScopes } from "../implementation/subscriptionScope.js";
import { coValuesCache } from "../lib/cache.js";
import { Account } from "./account.js";
import { Group } from "./group.js";

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

/** @category CoValues */
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
        ? Account.fromRaw(this._raw.group)
        : Group.fromRaw(this._raw.group);

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
      return coValuesCache.get(rawAccount, () => Account.fromRaw(rawAccount));
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
