import {
    RawCoList as RawCoList,
    RawControlledAccount as RawControlledAccount,
    CoID,
} from "cojson";
import { subscriptionScopeSym } from "../../subscriptionScopeSym.js";
import { RawType } from "../../baseInterfaces.js";
import { ID } from "../../id.js";
import { Schema } from "../../schema.js";
import { Account } from "../account/account.js";
import { isCoValueSchema } from "../../guards.js";
import { Chunk, Effect, Stream } from "effect";
import {
    CoValueUnavailableError,
    UnknownCoValueLoadError,
} from "../../errors.js";
import { ValueRef } from "../../valueRef.js";
import { ControlledAccountCtx } from "../../services.js";
import { SubscriptionScope } from "../../subscriptionScope.js";
import { Group } from "../group/group.js";
import { SimpleAccount } from "../account/simpleAccount.js";
import { ControlledAccount } from "../account/account.js";
import { CoValueSchema } from "../../index.js";
import { CoListMeta } from "./meta.js";
import { isCoListSchema } from "./guards.js";
import { CoListSchema, CoList } from "./coList.js";

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

        constructor(owner: Account | Group, init: Item["_Value"][]);
        constructor(options: { fromRaw: RawCoList<RawType<Item>> });
        constructor(
            optionsOrOwner:
                | Account
                | Group
                | { fromRaw: RawCoList<RawType<Item>> },
            init?: Item["_Value"][] | undefined
        ) {
            super();

            let raw: RawCoList<RawType<Item>>;

            if ("fromRaw" in optionsOrOwner) {
                raw = optionsOrOwner.fromRaw;
            } else if (init) {
                const rawOwner = optionsOrOwner._raw;
                raw = rawOwner.createList<RawCoList<RawType<Item>>>(
                    isCoListSchema(ItemSchema)
                        ? init.map((item: Item["_Value"]) => item.id)
                        : init
                );
            } else {
                if (typeof optionsOrOwner === "number") {
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
                                    target._raw.replace(idx, value.id);
                                } else {
                                    target._raw.replace(idx, value);
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
                },
            });
        }

        static fromRaw(raw: RawCoList<RawType<Item>>): CoList<Item> {
            return new CoListSchemaForItem({
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
            const scope = new SubscriptionScope(
                subscribable,
                CoListSchemaForItem,
                (update) => {
                    listener(update);
                }
            );

            return () => {
                scope.unsubscribeAll();
            };
        }

        toJSON(): Item["_Value"][] {
            const items = [];

            for (let i = 0; i < this.length; i++) {
                if (isCoValueSchema(ItemSchema)) {
                    items.push(this[i]?.toJSON());
                } else {
                    items.push(this[i]);
                }
            }

            return items;
        }

        [Symbol.for("nodejs.util.inspect.custom")](
            _depth: number,
            _opts: unknown
        ) {
            return this.toJSON();
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
