import type { JsonValue, RawCoMap } from "cojson";
import type { Simplify } from "effect/Types";
import { encodeSync, decodeSync } from "@effect/schema/Schema";
import type {
    CoValue,
    Schema,
    Group,
    ID,
    RefEncoded,
    IfCo,
    RefIfCoValue,
    DepthsIn,
    DeeplyLoaded,
    UnavailableError,
    AccountCtx,
    CoValueClass,
} from "../internal.js";
import {
    Account,
    CoValueBase,
    Ref,
    SchemaInit,
    inspect,
    makeRefs,
    subscriptionsScopes,
    ItemsSym,
    isRefEncoded,
    loadCoValue,
    loadCoValueEf,
    subscribeToCoValue,
    subscribeToCoValueEf,
    ensureCoValueLoaded,
    subscribeToExistingCoValue,
} from "../internal.js";
import { Effect, Stream } from "effect";

type CoMapEdit<V> = {
    value?: V;
    ref?: RefIfCoValue<V>;
    by?: Account;
    madeAt: Date;
};

/**
 * CoMaps are collaborative versions of plain objects, mapping string-like keys to values.
 *
 * @categoryDescription Declaration
 * Declare your own CoMap schemas by subclassing `CoMap` and assigning field schemas with `co`.
 *
 * Optional `co.ref(...)` fields must be marked with `{ optional: true }`.
 *
 * ```ts
 * import { co, CoMap } from "jazz-tools";
 *
 * class Person extends CoMap {
 *   name = co.string;
 *   age = co.number;
 *   pet = co.ref(Animal);
 *   car = co.ref(Car, { optional: true });
 * }
 * ```
 *
 * @categoryDescription Content
 * You can access properties you declare on a `CoMap` (using `co`) as if they were normal properties on a plain object, using dot notation, `Object.keys()`, etc.
 *
 * ```ts
 * person.name;
 * person["age"];
 * person.age = 42;
 * person.pet?.name;
 * Object.keys(person);
 * // => ["name", "age", "pet"]
 * ```
 *
 * @category CoValues
 *  */
export class CoMap extends CoValueBase implements CoValue {
    /**
     * The ID of this `CoMap`
     * @category Content */
    declare id: ID<this>;
    /** @category Type Helpers */
    declare _type: "CoMap";
    static {
        this.prototype._type = "CoMap";
    }
    /** @category Internals */
    declare _raw: RawCoMap;

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static _schema: any;
    /** @internal */
    get _schema() {
        return (this.constructor as typeof CoMap)._schema as {
            [key: string]: Schema;
        } & { [ItemsSym]?: Schema };
    }

    /**
     * If property `prop` is a `co.ref(...)`, you can use `coMaps._refs.prop` to access
     * the `Ref` instead of the potentially loaded/null value.
     *
     * This allows you to always get the ID or load the value manually.
     *
     * @example
     * ```ts
     * person._refs.pet.id; // => ID<Animal>
     * person._refs.pet.value;
     * // => Animal | null
     * const pet = await person._refs.pet.load();
     * ```
     *
     * @category Content
     **/
    get _refs(): {
        [Key in CoKeys<this>]: IfCo<this[Key], RefIfCoValue<this[Key]>>;
    } {
        return makeRefs<CoKeys<this>>(
            (key) => this._raw.get(key as string) as unknown as ID<CoValue>,
            () => {
                const keys = this._raw.keys().filter((key) => {
                    const schema =
                        this._schema[key as keyof typeof this._schema] ||
                        (this._schema[ItemsSym] as Schema | undefined);
                    return schema && schema !== "json" && isRefEncoded(schema);
                }) as CoKeys<this>[];

                return keys;
            },
            this._loadedAs,
            (key) =>
                (this._schema[key] ||
                    this._schema[ItemsSym]) as RefEncoded<CoValue>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) as any;
    }

    /** @category Collaboration */
    get _edits() {
        return new Proxy(this, {
            get(target, key) {
                const rawEdit = target._raw.lastEditAt(key as string);
                if (!rawEdit) return undefined;

                const descriptor = target._schema[
                    key as keyof typeof target._schema
                ] as Schema;

                return {
                    value:
                        descriptor === "json"
                            ? rawEdit.value
                            : "encoded" in descriptor
                              ? decodeSync(descriptor.encoded)(rawEdit.value)
                              : new Ref(
                                    rawEdit.value as ID<CoValue>,
                                    target._loadedAs,
                                    descriptor,
                                ).accessFrom(
                                    target,
                                    "_edits." + key.toString() + ".value",
                                ),
                    ref:
                        descriptor !== "json" && isRefEncoded(descriptor)
                            ? new Ref(
                                  rawEdit.value as ID<CoValue>,
                                  target._loadedAs,
                                  descriptor,
                              )
                            : undefined,
                    by:
                        rawEdit.by &&
                        new Ref<Account>(
                            rawEdit.by as ID<Account>,
                            target._loadedAs,
                            {
                                ref: Account,
                                optional: false,
                            },
                        ).accessFrom(
                            target,
                            "_edits." + key.toString() + ".by",
                        ),
                    madeAt: rawEdit.at,
                };
            },
        }) as {
            [Key in CoKeys<this>]: IfCo<this[Key], CoMapEdit<this[Key]>>;
        };
    }

    /** @internal */
    get _loadedAs() {
        return Account.fromNode(this._raw.core.node);
    }

    /** @internal */
    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: { fromRaw: RawCoMap } | undefined,
    ) {
        super();

        if (options) {
            if ("fromRaw" in options) {
                Object.defineProperties(this, {
                    id: {
                        value: options.fromRaw.id as unknown as ID<this>,
                        enumerable: false,
                    },
                    _raw: { value: options.fromRaw, enumerable: false },
                });
            } else {
                throw new Error("Invalid CoMap constructor arguments");
            }
        }

        return new Proxy(this, CoMapProxyHandler as ProxyHandler<this>);
    }

    /**
     * Create a new CoMap with the given initial values and owner.
     *
     * The owner (a Group or Account) determines access rights to the CoMap.
     *
     * The CoMap will immediately be persisted and synced to connected peers.
     *
     * @example
     * ```ts
     * const person = Person.create({
     *   name: "Alice",
     *   age: 42,
     *   pet: cat,
     * }, { owner: friendGroup });
     * ```
     *
     * @category Creation
     **/
    static create<M extends CoMap>(
        this: CoValueClass<M>,
        init: Simplify<CoMapInit<M>>,
        options: { owner: Account | Group },
    ) {
        const instance = new this();
        const raw = instance.rawFromInit(init, options.owner);
        Object.defineProperties(instance, {
            id: {
                value: raw.id,
                enumerable: false,
            },
            _raw: { value: raw, enumerable: false },
        });
        return instance;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toJSON(_key?: string, seenAbove?: ID<CoValue>[]): any[] {
        const jsonedFields = this._raw.keys().map((key) => {
            const tKey = key as CoKeys<this>;
            const descriptor = (this._schema[tKey] ||
                this._schema[ItemsSym]) as Schema;

            if (descriptor == "json" || "encode" in descriptor) {
                return [key, this._raw.get(key)];
            } else if (isRefEncoded(descriptor)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (seenAbove?.includes((this as any)[tKey]?.id)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return [key, { _circular: (this as any)[tKey]?.id }];
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const jsonedRef = (this as any)[tKey]?.toJSON(tKey, [
                    ...(seenAbove || []),
                    this.id,
                ]);
                return [key, jsonedRef];
            } else {
                return [key, undefined];
            }
        });

        return {
            id: this.id,
            _type: this._type,
            ...Object.fromEntries(jsonedFields),
        };
    }

    [inspect]() {
        return this.toJSON();
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawFromInit<Fields extends object = Record<string, any>>(
        init: Simplify<CoMapInit<Fields>> | undefined,
        owner: Account | Group,
    ) {
        const rawOwner = owner._raw;

        const rawInit = {} as {
            [key in keyof Fields]: JsonValue | undefined;
        };

        if (init)
            for (const key of Object.keys(init) as (keyof Fields)[]) {
                const initValue = init[key as keyof typeof init];

                const descriptor = (this._schema[
                    key as keyof typeof this._schema
                ] || this._schema[ItemsSym]) as Schema;

                if (!descriptor) {
                    continue;
                }

                if (descriptor === "json") {
                    rawInit[key] = initValue as JsonValue;
                } else if (isRefEncoded(descriptor)) {
                    if (initValue) {
                        rawInit[key] = (initValue as unknown as CoValue).id;
                    }
                } else if ("encoded" in descriptor) {
                    rawInit[key] = encodeSync(descriptor.encoded)(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        initValue as any,
                    );
                }
            }

        return rawOwner.createMap(rawInit);
    }

    /**
     * Declare a Record-like CoMap schema, by extending `CoMap.Record(...)` and passing the value schema using `co`. Keys are always `string`.
     *
     * @example
     * ```ts
     * import { co, CoMap } from "jazz-tools";
     *
     * class ColorToFruitMap extends CoMap.Record(
     *  co.ref(Fruit)
     * ) {}
     *
     * // assume we have map: ColorToFruitMap
     * // and strawberry: Fruit
     * map["red"] = strawberry;
     * ```
     *
     * @category Declaration
     */
    static Record<Value>(value: IfCo<Value, Value>) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
        class RecordLikeCoMap extends CoMap {
            [ItemsSym] = value;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
        interface RecordLikeCoMap extends Record<string, Value> {}

        return RecordLikeCoMap;
    }

    /**
     * Load a `CoMap` with a given ID, as a given account.
     *
     * `depth` specifies which (if any) fields that reference other CoValues to load as well before resolving.
     * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
     *
     * You can pass `[]` or `{}` for shallowly loading only this CoMap, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
     *
     * Check out the `load` methods on `CoMap`/`CoList`/`CoStream`/`Group`/`Account` to see which depth structures are valid to nest.
     *
     * @example
     * ```ts
     * const person = await Person.load(
     *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
     *   me,
     *   { pet: {} }
     * );
     * ```
     *
     * @category Subscription & Loading
     */
    static load<M extends CoMap, Depth>(
        this: CoValueClass<M>,
        id: ID<M>,
        as: Account,
        depth: Depth & DepthsIn<M>,
    ): Promise<DeeplyLoaded<M, Depth> | undefined> {
        return loadCoValue(this, id, as, depth);
    }

    /**
     * Effectful version of `CoMap.load()`.
     *
     * Needs to be run inside an `AccountCtx` context.
     *
     * @category Subscription & Loading
     */
    static loadEf<M extends CoMap, Depth>(
        this: CoValueClass<M>,
        id: ID<M>,
        depth: Depth & DepthsIn<M>,
    ): Effect.Effect<DeeplyLoaded<M, Depth>, UnavailableError, AccountCtx> {
        return loadCoValueEf<M, Depth>(this, id, depth);
    }

    /**
     * Load and subscribe to a `CoMap` with a given ID, as a given account.
     *
     * Automatically also subscribes to updates to all referenced/nested CoValues as soon as they are accessed in the listener.
     *
     * `depth` specifies which (if any) fields that reference other CoValues to load as well before calling `listener` for the first time.
     * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
     *
     * You can pass `[]` or `{}` for shallowly loading only this CoMap, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
     *
     * Check out the `load` methods on `CoMap`/`CoList`/`CoStream`/`Group`/`Account` to see which depth structures are valid to nest.
     *
     * Returns an unsubscribe function that you should call when you no longer need updates.
     *
     * Also see the `useCoState` hook to reactively subscribe to a CoValue in a React component.
     *
     * @example
     * ```ts
     * const unsub = Person.subscribe(
     *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
     *   me,
     *   { pet: {} },
     *   (person) => console.log(person)
     * );
     * ```
     *
     * @category Subscription & Loading
     */
    static subscribe<M extends CoMap, Depth>(
        this: CoValueClass<M>,
        id: ID<M>,
        as: Account,
        depth: Depth & DepthsIn<M>,
        listener: (value: DeeplyLoaded<M, Depth>) => void,
    ): () => void {
        return subscribeToCoValue<M, Depth>(this, id, as, depth, listener);
    }

    /**
     * Effectful version of `CoMap.subscribe()` that returns a stream of updates.
     *
     * Needs to be run inside an `AccountCtx` context.
     *
     * @category Subscription & Loading
     */
    static subscribeEf<M extends CoMap, Depth>(
        this: CoValueClass<M>,
        id: ID<M>,
        depth: Depth & DepthsIn<M>,
    ): Stream.Stream<DeeplyLoaded<M, Depth>, UnavailableError, AccountCtx> {
        return subscribeToCoValueEf<M, Depth>(this, id, depth);
    }

    /**
     * Given an already loaded `CoMap`, ensure that the specified fields are loaded to the specified depth.
     *
     * Works like `CoMap.load()`, but you don't need to pass the ID or the account to load as again.
     *
     * @category Subscription & Loading
     */
    ensureLoaded<M extends CoMap, Depth>(
        this: M,
        depth: Depth & DepthsIn<M>,
    ): Promise<DeeplyLoaded<M, Depth> | undefined> {
        return ensureCoValueLoaded(this, depth);
    }

    /**
     * Given an already loaded `CoMap`, subscribe to updates to the `CoMap` and ensure that the specified fields are loaded to the specified depth.
     *
     * Works like `CoMap.subscribe()`, but you don't need to pass the ID or the account to load as again.
     *
     * Returns an unsubscribe function that you should call when you no longer need updates.
     *
     * @category Subscription & Loading
     **/
    subscribe<M extends CoMap, Depth>(
        this: M,
        depth: Depth & DepthsIn<M>,
        listener: (value: DeeplyLoaded<M, Depth>) => void,
    ): () => void {
        return subscribeToExistingCoValue(this, depth, listener);
    }
}

export type CoKeys<Map extends object> = Exclude<
    keyof Map & string,
    keyof CoMap
>;

export type CoMapInit<Map extends object> = {
    [Key in CoKeys<Map> as undefined extends Map[Key]
        ? never
        : IfCo<Map[Key], Key>]: Map[Key];
} & { [Key in CoKeys<Map> as IfCo<Map[Key], Key>]?: Map[Key] };

// TODO: cache handlers per descriptor for performance?
const CoMapProxyHandler: ProxyHandler<CoMap> = {
    get(target, key, receiver) {
        if (key === "_schema") {
            return Reflect.get(target, key);
        } else if (key in target) {
            return Reflect.get(target, key, receiver);
        } else {
            const descriptor = (target._schema[key as keyof CoMap["_schema"]] ||
                target._schema[ItemsSym]) as Schema;
            if (descriptor && typeof key === "string") {
                const raw = target._raw.get(key);

                if (descriptor === "json") {
                    return raw;
                } else if ("encoded" in descriptor) {
                    return raw === undefined
                        ? undefined
                        : decodeSync(descriptor.encoded)(raw);
                } else if (isRefEncoded(descriptor)) {
                    return raw === undefined
                        ? undefined
                        : new Ref(
                              raw as unknown as ID<CoValue>,
                              target._loadedAs,
                              descriptor,
                          ).accessFrom(receiver, key);
                }
            } else {
                return undefined;
            }
        }
    },
    set(target, key, value, receiver) {
        if (
            (typeof key === "string" || ItemsSym) &&
            typeof value === "object" &&
            value !== null &&
            SchemaInit in value
        ) {
            (target.constructor as typeof CoMap)._schema ||= {};
            (target.constructor as typeof CoMap)._schema[key] =
                value[SchemaInit];
            return true;
        }

        const descriptor = (target._schema[key as keyof CoMap["_schema"]] ||
            target._schema[ItemsSym]) as Schema;
        if (descriptor && typeof key === "string") {
            if (descriptor === "json") {
                target._raw.set(key, value);
            } else if ("encoded" in descriptor) {
                target._raw.set(key, encodeSync(descriptor.encoded)(value));
            } else if (isRefEncoded(descriptor)) {
                target._raw.set(key, value.id);
                subscriptionsScopes
                    .get(target)
                    ?.onRefAccessedOrSet(target.id, value.id);
            }
            return true;
        } else {
            return Reflect.set(target, key, value, receiver);
        }
    },
    defineProperty(target, key, attributes) {
        if (
            "value" in attributes &&
            typeof attributes.value === "object" &&
            SchemaInit in attributes.value
        ) {
            (target.constructor as typeof CoMap)._schema ||= {};
            (target.constructor as typeof CoMap)._schema[key as string] =
                attributes.value[SchemaInit];
            return true;
        } else {
            return Reflect.defineProperty(target, key, attributes);
        }
    },
    ownKeys(target) {
        const keys = Reflect.ownKeys(target).filter((k) => k !== ItemsSym);
        // for (const key of Reflect.ownKeys(target._schema)) {
        //     if (key !== ItemsSym && !keys.includes(key)) {
        //         keys.push(key);
        //     }
        // }
        for (const key of target._raw.keys()) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }

        return keys;
    },
    getOwnPropertyDescriptor(target, key) {
        if (key in target) {
            return Reflect.getOwnPropertyDescriptor(target, key);
        } else {
            const descriptor = (target._schema[key as keyof CoMap["_schema"]] ||
                target._schema[ItemsSym]) as Schema;
            if (descriptor || key in target._raw.ops) {
                return {
                    enumerable: true,
                    configurable: true,
                    writable: true,
                };
            }
        }
    },
    deleteProperty(target, key) {
        const descriptor = (target._schema[key as keyof CoMap["_schema"]] ||
            target._schema[ItemsSym]) as Schema;
        if (typeof key === "string" && descriptor) {
            target._raw.delete(key);
            return true;
        } else {
            return Reflect.deleteProperty(target, key);
        }
    },
};
