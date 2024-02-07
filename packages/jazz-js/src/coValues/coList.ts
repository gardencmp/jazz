import {
    RawCoList as RawCoList,
    RawAccount as RawAccount,
    CoValueCore,
    RawControlledAccount as RawControlledAccount,
    CoID,
} from "cojson";
import {
    ID,
    CoValueSchemaBase,
    CoValue,
    ControlledAccount,
    RawType,
    CoValueBase,
    SimpleAccount,
    CoValueMetaBase,
    CoValueSchema,
    subscriptionScopeSym,
} from "../index.js";
import { Schema } from "../schema.js";
import { Group } from "./group.js";
import { Account } from "./account.js";
import { isCoValueSchema } from "../guards.js";
import { Chunk, Effect, Stream } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "../errors.js";
import { ValueRef } from "../valueRef.js";
import { ControlledAccountCtx } from "../services.js";
import { SubscriptionScope } from "../subscriptionScope.js";

/** A collaborative list of values that behaves mostly like an `Array`.
 *
 * Can be created by instatiating a `CoListSchema`.
 *
 * @category CoValues - CoList */
export interface CoList<Item extends Schema = Schema>
    extends Array<Item["_Value"]>,
        CoValueBase {
    /** @category Collaboration */
    id: ID<CoList<Item>>;
    /** @category Collaboration */
    meta: CoListMeta<Item>;
    /** @hidden */
    _raw: RawCoList<RawType<Item>>;

    /** @category Properties */
    length: number;

    /** @category Access & Finding */
    [index: number]: Item["_Value"];

    /** @category Access & Finding */
    at(index: number): Item["_Value"];

    /** @category Access & Finding */
    indexOf(searchElement: Item["_Value"], fromIndex?: number): number;

    /** @category Access & Finding */
    lastIndexOf(searchElement: Item["_Value"], fromIndex?: number): number;

    /** @category Access & Finding */
    includes(searchElement: Item["_Value"], fromIndex?: number): boolean;

    /** @category Mapping & Transformation */
    slice(start?: number, end?: number): Item["_Value"][];

    /** @category Mapping & Transformation */
    concat(...items: Item["_Value"][][]): Item["_Value"][];

    /** @category Mapping & Transformation */
    join(separator?: string): string;

    /** @category Mapping & Transformation */
    toString(): string;

    /** @category Mapping & Transformation */
    toLocaleString(): string;

    /** @category Iteration */
    entries(): IterableIterator<[number, Item["_Value"]]>;

    /** @category Iteration */
    keys(): IterableIterator<number>;

    /** @category Iteration */
    values(): IterableIterator<Item["_Value"]>;

    /** @category Iteration */
    [Symbol.iterator](): IterableIterator<Item["_Value"]>;

    /** @category Iteration */
    forEach(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => void,
        thisArg?: unknown
    ): void;

    /** @category Mapping & Transformation */
    filter(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => boolean,
        thisArg?: unknown
    ): Item["_Value"][];

    /** @category Mapping & Transformation */
    map<U>(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => U,
        thisArg?: unknown
    ): U[];

    /** @category Access & Finding */
    find(
        predicate: (
            value: Item["_Value"],
            index: number,
            obj: Item["_Value"][]
        ) => boolean,
        thisArg?: unknown
    ): Item["_Value"] | undefined;

    /** @category Access & Finding */
    findIndex(
        predicate: (
            value: Item["_Value"],
            index: number,
            obj: Item["_Value"][]
        ) => boolean,
        thisArg?: unknown
    ): number;

    /** @category Mapping & Transformation */
    reduce<U>(
        callbackfn: (
            previousValue: U,
            currentValue: Item["_Value"],
            currentIndex: number,
            array: Item["_Value"][]
        ) => U,
        initialValue: U
    ): U;

    /** @category Mapping & Transformation */
    reduce(
        callbackfn: (
            previousValue: Item["_Value"],
            currentValue: Item["_Value"],
            currentIndex: number,
            array: Item["_Value"][]
        ) => Item["_Value"]
    ): Item["_Value"];

    /** @category Mapping & Transformation */
    reduceRight<U>(
        callbackfn: (
            previousValue: U,
            currentValue: Item["_Value"],
            currentIndex: number,
            array: Item["_Value"][]
        ) => U,
        initialValue: U
    ): U;

    /** @category Mapping & Transformation */
    reduceRight(
        callbackfn: (
            previousValue: Item["_Value"],
            currentValue: Item["_Value"],
            currentIndex: number,
            array: Item["_Value"][]
        ) => Item["_Value"]
    ): Item["_Value"];

    /** @category Access & Finding */
    some(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => unknown,
        thisArg?: unknown
    ): boolean;

    /** @category Access & Finding */
    every(
        callbackfn: (
            value: Item["_Value"],
            index: number,
            array: Item["_Value"][]
        ) => unknown,
        thisArg?: unknown
    ): boolean;

    /** @category Mutation */
    push(...items: Item["_Value"][]): number;
    /** @category Mutation */
    unshift(..._items: Item["_Value"][]): number;

    /** @category Mutation */
    splice(start: number, deleteCount: 1): [Item["_Value"]];

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    splice(start: number, deleteCount?: number | undefined): Item["_Value"][];
    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    splice(
        start: number,
        deleteCount: number,
        ...items: Item["_Value"][]
    ): Item["_Value"][];

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    pop(): Item["_Value"] | undefined;

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    shift(): Item["_Value"] | undefined;

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    reverse(): Item["_Value"][];

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    sort(
        _compareFn?:
            | ((a: Item["_Value"], b: Item["_Value"]) => number)
            | undefined
    ): this;

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    copyWithin(
        _target: number,
        _start: number,
        _end?: number | undefined
    ): this;

    /** @deprecated Not yet implemented in CoList */
    /** @category Mutation - unimplemented */
    fill(
        _value: Item["_Value"],
        _start?: number | undefined,
        _end?: number | undefined
    ): this;
}

export class CoListMeta<Item extends Schema> implements CoValueMetaBase {
    owner: Account | Group;
    _raw: RawCoList;
    core: CoValueCore;
    loadedAs: ControlledAccount;
    refs: ValueRef<Item["_Value"]>[];
    constructor(raw: RawCoList, refs: ValueRef<Item["_Value"]>[]) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
        this._raw = raw;
        this.core = raw.core;
        this.loadedAs = SimpleAccount.ControlledSchema.fromRaw(
            this._raw.core.node.account as RawControlledAccount
        );
        this.refs = refs;
    }
}

/** @category CoValues - CoList */
export interface CoListSchema<Item extends Schema = Schema>
    extends Schema<CoList<Item>>,
        CoValueSchemaBase<CoList<Item>, RawCoList<RawType<Item>>> {
    /** @category Type Tag */
    _Type: "colist";
    /** @category Type Hints */
    _Item: Item;
    /** @category Type Hints */
    _Value: CoList<Item>;

    /** @category Value Creation */
    new (
        init: Item["_Value"][],
        options: { owner: Account | Group }
    ): CoList<Item>;

    /** @hidden */
    fromRaw(
        raw: RawCoList<RawType<Item>>,
    ): CoList<Item>;
}

/** @category CoValues - CoList */
export function isCoListSchema(value: unknown): value is CoListSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "colist"
    );
}

/** @category CoValues - CoList */
export function isCoList(value: unknown): value is CoList {
    return (
        typeof value === "object" &&
        value !== null &&
        isCoListSchema(value.constructor) &&
        "id" in value
    );
}

/** @category CoValues - CoList */
export function CoListOf<Item extends Schema>(
    ItemSchema: Item
): CoListSchema<Item> {
    class RefsForItem {
        raw: RawCoList<RawType<Item>>;
        as: ControlledAccount;

        constructor(raw: RawCoList<RawType<Item>>, as: ControlledAccount) {
            this.raw = raw;
            this.as = as;

            if (!isCoValueSchema(ItemSchema)) {
                return;
            }
            const length = raw.asArray().length;
            for (let idx = 0; idx < length; idx++) {
                Object.defineProperty(this, idx, {
                    get(this: RefsForItem) {
                        const id = this.raw.get(idx);

                        if (!id) {
                            return undefined;
                        }

                        const value = ValueRef(
                            id as unknown as ID<CoList<Item>>,
                            ItemSchema as unknown as CoValueSchema,
                            this.as
                        );

                        return value;
                    },
                });
            }
        }
    }

    return class CoListSchemaForItem extends Array<Item["_Value"]> {
        static _Type = "colist" as const;
        static _RawValue: RawCoList<RawType<Item>>;
        static _Item = ItemSchema;
        static _Value: CoList<Item> = "CoList<Item>" as unknown as CoList<Item>;

        _raw!: RawCoList<RawType<Item>>;
        id!: ID<CoList<Item>>;
        meta!: CoListMeta<Item>;
        _refs!: ValueRef<Item["_Value"]>[];
        [subscriptionScopeSym]?: SubscriptionScope;

        constructor(
            init: Item["_Value"][],
            options: { owner: Account | Group }
        );
        constructor(
            init: undefined,
            options: { fromRaw: RawCoList<RawType<Item>> }
        );
        constructor(
            init: Item["_Value"][] | undefined,
            options:
                | { owner: Account | Group }
                | { fromRaw: RawCoList<RawType<Item>> }
        ) {
            super();

            let raw: RawCoList<RawType<Item>>;

            if (options && "fromRaw" in options) {
                raw = options.fromRaw;
            } else if (init && options && "owner" in options) {
                const rawOwner = options.owner._raw;
                raw = rawOwner.createList<RawCoList<RawType<Item>>>(
                    isCoListSchema(ItemSchema)
                        ? init.map((item: Item["_Value"]) => item.id)
                        : init
                );
            } else {
                if (typeof init === "number") {
                    // this might be called from an intrinsic, like map, trying to create an empty array
                    // passing `0` as the only parameter
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return new Array(init) as any;
                } else {
                    throw new Error("Expected init and owner");
                }
            }

            this._raw = raw;
            this.id = raw.id as unknown as ID<CoList<Item>>;
            this._refs = new RefsForItem(
                raw,
                SimpleAccount.ControlledSchema.fromRaw(
                    raw.core.node.account as RawControlledAccount
                )
            ) as unknown as ValueRef<Item["_Value"]>[];
            this.meta = new CoListMeta(raw, this._refs);

            return new Proxy(this, {
                get(target, prop, receiver) {
                    if (typeof prop === "string") {
                        if (!isNaN(+prop)) {
                            const idx = +prop;
                            if (
                                idx >= 0 &&
                                idx < target._raw.asArray().length
                            ) {
                                if (isCoValueSchema(ItemSchema)) {
                                    const ref = target._refs[idx]!;

                                    if (target[subscriptionScopeSym]) {
                                        target[
                                            subscriptionScopeSym
                                        ].onRefAccessedOrSet(
                                            target.id,
                                            idx,
                                            ref.id,
                                            ItemSchema as unknown as CoValueSchema
                                        );
                                    }

                                    if (ref.loaded) {
                                        ref.value[subscriptionScopeSym] =
                                            target[subscriptionScopeSym];
                                        return ref.value;
                                    }
                                } else {
                                    return target._raw.get(idx);
                                }
                            }
                        } else if (prop === "length") {
                            return target._raw.asArray().length;
                        } else if (prop === "constructor") {
                            return CoListSchemaForItem;
                        } else {
                            const value = Reflect.get(target, prop, receiver);
                            if (typeof value === "function") {
                                value.bind(receiver);
                            } else {
                                return value;
                            }
                        }
                    }

                    return Reflect.get(target, prop, receiver);
                },
                set(target, prop, value, receiver) {
                    if (typeof prop === "string") {
                        if (!isNaN(+prop)) {
                            const idx = +prop;
                            if (
                                idx >= 0 &&
                                idx < target._raw.asArray().length
                            ) {
                                if (isCoValueSchema(ItemSchema)) {
                                    target._raw.append(value?.id, idx);
                                    target._raw.delete(idx);
                                    target[
                                        subscriptionScopeSym
                                    ]?.onRefRemovedOrReplaced(target.id, idx);
                                    if (value) {
                                        target[
                                            subscriptionScopeSym
                                        ]?.onRefAccessedOrSet(
                                            target.id,
                                            idx,
                                            value?.id,
                                            ItemSchema
                                        );
                                    }
                                } else {
                                    target._raw.append(value, idx);
                                    target._raw.delete(idx);
                                }
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return Reflect.set(target, prop, value, receiver);
                        }
                    }

                    return Reflect.set(target, prop, value, receiver);
                },
                has(target, prop) {
                    if (typeof prop === "string") {
                        if (!isNaN(+prop)) {
                            const idx = +prop;
                            if (
                                idx >= 0 &&
                                idx < target._raw.asArray().length
                            ) {
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return Reflect.has(target, prop);
                        }
                    }

                    return Reflect.has(target, prop);
                }
            });
        }

        static fromRaw(
            raw: RawCoList<RawType<Item>>,
        ): CoList<Item> {
            return new CoListSchemaForItem(undefined, {
                fromRaw: raw,
            });
        }

        static load(
            id: ID<CoList<Item>>,
            { as }: { as: ControlledAccount }
        ): Promise<CoList<Item>> {
            return Effect.runPromise(
                Effect.provideService(
                    this.loadEf(id),
                    ControlledAccountCtx,
                    ControlledAccountCtx.of(as)
                )
            );
        }

        static loadEf(
            id: ID<CoList<Item>>
        ): Effect.Effect<
            ControlledAccountCtx,
            CoValueUnavailableError | UnknownCoValueLoadError,
            CoList<Item>
        > {
            return Effect.gen(function* ($) {
                const as = yield* $(ControlledAccountCtx);
                const raw = yield* $(
                    Effect.tryPromise({
                        try: () =>
                            as._raw.core.node.load(
                                id as unknown as CoID<RawCoList<RawType<Item>>>
                            ),
                        catch: (cause) =>
                            new UnknownCoValueLoadError({ cause }),
                    })
                );

                if (raw === "unavailable") {
                    return yield* $(Effect.fail(new CoValueUnavailableError()));
                }

                return CoListSchemaForItem.fromRaw(raw);
            });
        }

        static subscribeEf(
            id: ID<CoList<Item>>
        ): Stream.Stream<
            ControlledAccountCtx,
            CoValueUnavailableError | UnknownCoValueLoadError,
            CoList<Item>
        > {
            throw new Error(
                "TODO: implement somehow with Scope and Stream.asyncScoped"
            );
        }

        static subscribe(
            id: ID<CoList<Item>>,
            { as }: { as: ControlledAccount },
            onUpdate: (value: CoList<Item>) => void
        ): () => void {
            let unsub: () => void = () => {
                stopImmediately = true;
            };
            let stopImmediately = false;
            void this.load(id, { as }).then((value) => {
                unsub = value.subscribe(onUpdate);
                if (stopImmediately) {
                    unsub();
                }
            });

            return () => {
                unsub();
            };
        }

        subscribeEf(): Stream.Stream<never, never, CoList<Item>> {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            return Stream.asyncScoped((emit) =>
                Effect.gen(function* ($) {
                    const unsub = self.subscribe((value) => {
                        void emit(Effect.succeed(Chunk.of(value)));
                    });

                    yield* $(Effect.addFinalizer(() => Effect.sync(unsub)));
                })
            );
        }

        subscribe(listener: (newValue: CoList<Item>) => void): () => void {
            const subscribable = CoListSchemaForItem.fromRaw(this._raw);
            const scope = new SubscriptionScope(subscribable, (scope) => {
                const updatedValue = CoListSchemaForItem.fromRaw(this._raw);
                updatedValue[subscriptionScopeSym] = scope;
                listener(updatedValue);
            });

            return () => {
                scope.unsubscribeAll();
            };
        }

        toJSON(): Item["_Value"][] {
            const items = [];

            for (let i = 0; i < this.length; i++) {
                items.push(this[i]!);
            }

            return items;
        }

        push(...items: Item["_Value"][]): number {
            if (isCoValueSchema(ItemSchema)) {
                for (const item of items) {
                    this._raw.append(item.id);
                }
            } else {
                for (const item of items) {
                    this._raw.append(item);
                }
            }
            return this.length;
        }

        splice(start: number, deleteCount: 1): [Item["_Value"]];
        splice(
            start: number,
            deleteCount?: number | undefined
        ): Item["_Value"][];
        splice(
            start: number,
            deleteCount: number,
            ...items: Item["_Value"][]
        ): Item["_Value"][];
        splice(
            start: unknown,
            deleteCount?: unknown,
            ...rest: Item["_Value"][]
        ): Item["_Value"][] {
            if (deleteCount === 1 && rest.length === 0) {
                const idx = start as number;
                const deleted = this.at(idx);
                this._raw.delete(idx);
                delete this[this.length - 1];
                this.length = this.length - 1;
                return [deleted];
            } else {
                throw new Error(
                    "TODO: implement more complicated splice cases in CoList"
                );
            }
        }

        // provide mock implementation of all other array mutating methods which throw "TODO: implement ... "

        pop(): Item["_Value"] | undefined {
            throw new Error("TODO: implement pop in CoList");
        }

        shift(): Item["_Value"] | undefined {
            throw new Error("TODO: implement shift in CoList");
        }

        unshift(...items: Item["_Value"][]): number {
            if (isCoValueSchema(ItemSchema)) {
                for (let i = items.length - 1; i >= 0; i--) {
                    const item = items[i]!;
                    this._raw.prepend(item.id);
                }
            } else {
                for (let i = items.length - 1; i >= 0; i--) {
                    const item = items[i]!;
                    this._raw.prepend(item);
                }
            }
            return this.length;
        }

        reverse(): Item["_Value"][] {
            throw new Error("TODO: implement reverse in CoList");
        }

        sort(
            _compareFn?:
                | ((a: Item["_Value"], b: Item["_Value"]) => number)
                | undefined
        ): this {
            throw new Error("TODO: implement sort in CoList");
        }

        copyWithin(
            _target: number,
            _start: number,
            _end?: number | undefined
        ): this {
            throw new Error("TODO: implement copyWithin in CoList");
        }

        fill(
            _value: Item["_Value"],
            _start?: number | undefined,
            _end?: number | undefined
        ): this {
            throw new Error("TODO: implement fill in CoList");
        }
    } satisfies CoListSchema<Item>;
}
