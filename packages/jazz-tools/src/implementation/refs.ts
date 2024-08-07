import type { CoID, RawCoValue } from "cojson";
import type {
    Account,
    CoValue,
    ID,
    RefEncoded,
    UnCo,
} from "../internal.js";
import {
    instantiateRefEncoded,
    isRefEncoded,
    subscriptionsScopes,
} from "../internal.js";

const refCache = new WeakMap<RawCoValue, CoValue>();

const TRACE_ACCESSES = false;

export class Ref<out V extends CoValue> {
    constructor(
        readonly id: ID<V>,
        readonly controlledAccount: Account,
        readonly schema: RefEncoded<V>,
    ) {
        if (!isRefEncoded(schema)) {
            throw new Error("Ref must be constructed with a ref schema");
        }
    }

    get value() {
        const raw = this.controlledAccount._raw.core.node.getLoaded(
            this.id as unknown as CoID<RawCoValue>,
        );
        if (raw) {
            let value = refCache.get(raw);
            if (value) {
                // console.log("Using cached value for " + this.id);
            } else {
                value = instantiateRefEncoded(this.schema, raw);
                refCache.set(raw, value);
            }
            return value as V;
        } else {
            return null;
        }
    }

    private async loadHelper(options?: {
        onProgress: (p: number) => void;
    }): Promise<V | "unavailable"> {
        const raw = await this.controlledAccount._raw.core.node.load(
            this.id as unknown as CoID<RawCoValue>,
            options?.onProgress,
        );
        if (raw === "unavailable") {
            return "unavailable";
        } else {
            return new Ref(this.id, this.controlledAccount, this.schema).value!;
        }
    }

    async load(options?: {
        onProgress: (p: number) => void;
    }): Promise<V | undefined> {
        const result = await this.loadHelper(options);
        if (result === "unavailable") {
            return undefined;
        } else {
            return result;
        }
    }

    accessFrom(
        fromScopeValue: CoValue,
        key: string | number | symbol,
    ): V | null {
        const subScope = subscriptionsScopes.get(fromScopeValue);

        subScope?.onRefAccessedOrSet(fromScopeValue.id, this.id);
        TRACE_ACCESSES &&
            console.log(
                subScope?.scopeID,
                "accessing",
                fromScopeValue,
                key,
                this.id,
            );

        if (this.value && subScope) {
            subscriptionsScopes.set(this.value, subScope);
        }

        if (subScope) {
            const cached = subScope.cachedValues[this.id];
            if (cached) {
                TRACE_ACCESSES && console.log("cached", cached);
                return cached as V;
            } else if (this.value !== null) {
                const freshValueInstance = instantiateRefEncoded(
                    this.schema,
                    this.value?._raw,
                );
                TRACE_ACCESSES &&
                    console.log("freshValueInstance", freshValueInstance);
                subScope.cachedValues[this.id] = freshValueInstance;
                subscriptionsScopes.set(freshValueInstance, subScope);
                return freshValueInstance as V;
            } else {
                return null;
            }
        } else {
            return this.value;
        }
    }
}

export function makeRefs<Keys extends string | number>(
    getIdForKey: (key: Keys) => ID<CoValue> | undefined,
    getKeysWithIds: () => Keys[],
    controlledAccount: Account,
    refSchemaForKey: (key: Keys) => RefEncoded<CoValue>,
): { [K in Keys]: Ref<CoValue> } & {
    [Symbol.iterator]: () => IterableIterator<Ref<CoValue>>;
    length: number;
} {
    const refs = {} as { [K in Keys]: Ref<CoValue> } & {
        [Symbol.iterator]: () => IterableIterator<Ref<CoValue>>;
        length: number;
    };
    return new Proxy(refs, {
        get(_target, key) {
            if (key === Symbol.iterator) {
                return function* () {
                    for (const key of getKeysWithIds()) {
                        yield new Ref(
                            getIdForKey(key)!,
                            controlledAccount,
                            refSchemaForKey(key),
                        );
                    }
                };
            }
            if (typeof key === "symbol") return undefined;
            if (key === "length") {
                return getKeysWithIds().length;
            }
            const id = getIdForKey(key as Keys);
            if (!id) return undefined;
            return new Ref(
                id as ID<CoValue>,
                controlledAccount,
                refSchemaForKey(key as Keys),
            );
        },
        ownKeys() {
            return getKeysWithIds().map((key) => key.toString());
        },
        getOwnPropertyDescriptor(target, key) {
            const id = getIdForKey(key as Keys);
            if (id) {
                return {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                };
            } else {
                return Reflect.getOwnPropertyDescriptor(target, key);
            }
        },
    });
}

export type RefIfCoValue<V> = NonNullable<V> extends CoValue
    ? Ref<UnCo<NonNullable<V>>>
    : never;
