import { Effect } from "effect";
import type { CoID, RawCoValue } from "cojson";
import type {
    Account,
    CoValue,
    ID,
    Me,
    RefEncoded,
    UnavailableError,
} from "../internal.js";
import {
    instantiateRefEncoded,
    isRefEncoded,
    subscriptionsScopes,
} from "../internal.js";

export class Ref<V extends CoValue> {
    private cachedValue: V | undefined;

    constructor(
        readonly id: ID<V>,
        readonly controlledAccount: Account & Me,
        readonly schema: RefEncoded<V>
    ) {
        if (!isRefEncoded(schema)) {
            throw new Error("Ref must be constructed with a ref schema");
        }
    }

    get value() {
        if (this.cachedValue) return this.cachedValue;
        // TODO: cache it for object identity!!!
        const raw = this.controlledAccount._raw.core.node.getLoaded(
            this.id as unknown as CoID<RawCoValue>
        );
        if (raw) {
            const value = instantiateRefEncoded(this.schema, raw);
            this.cachedValue = value;
            return value;
        } else {
            return null;
        }
    }

    loadEf() {
        return Effect.async<V, UnavailableError>((fulfill) => {
            this.loadHelper()
                .then((value) => {
                    if (value === "unavailable") {
                        fulfill(Effect.fail<UnavailableError>("unavailable"));
                    } else {
                        fulfill(Effect.succeed(value));
                    }
                })
                .catch((e) => {
                    fulfill(Effect.die(e));
                });
        });
    }

    private async loadHelper(options?: {
        onProgress: (p: number) => void;
    }): Promise<V | "unavailable"> {
        const raw = await this.controlledAccount._raw.core.node.load(
            this.id as unknown as CoID<RawCoValue>,
            options?.onProgress
        );
        if (raw === "unavailable") {
            return "unavailable";
        } else {
            return new Ref(this.id, this.controlledAccount, this.schema)
                .value!;
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

    accessFrom(fromScopeValue: CoValue): V | null {
        const subScope = subscriptionsScopes.get(fromScopeValue);

        subScope?.onRefAccessedOrSet(this.id);

        if (this.value && subScope) {
            subscriptionsScopes.set(this.value, subScope);
        }

        return this.value;
    }
}

export function makeRefs<Keys extends string | number>(
    getIdForKey: (key: Keys) => ID<CoValue> | undefined,
    getKeysWithIds: () => Keys[],
    controlledAccount: Account & Me,
    refSchemaForKey: (key: Keys) => RefEncoded<CoValue>
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
                            refSchemaForKey(key)
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
                refSchemaForKey(key as Keys)
            );
        },
        ownKeys() {
            return getKeysWithIds().map((key) => key.toString());
        },
    });
}
