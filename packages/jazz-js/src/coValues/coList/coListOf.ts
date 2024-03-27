import {
    CoValueCore,
    JsonValue,
    RawAccount,
    RawCoList,
    cojsonInternals,
} from "cojson";
import { CoValueSchema, ID, inspect } from "../../coValueInterfaces.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { CoListBase, CoListSchema } from "./coList.js";
import { AST, Schema } from "@effect/schema";
import { Account, ControlledAccount } from "../account/account.js";
import { Group } from "../group/group.js";
import {
    constructorOfSchemaSym,
    propertyIsCoValueSchema,
} from "../resolution.js";
import { ValueRef, makeRefs } from "../../refs.js";
import {
    SimpleAccount,
    controlledAccountFromNode,
} from "../account/accountOf.js";
import { subscriptionsScopes } from "../../subscriptionScope.js";
import { SharedCoValueConstructor } from "../construction.js";
import { pipeArguments } from "effect/Pipeable";
import { SimpleGroup } from "../group/groupOf.js";
import { Stream } from "effect";
import { UnavailableError } from "../../errors.js";

export function CoListOf<
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
>(itemSchema: Item) {
    const decodeItem = Schema.decodeSync(itemSchema);
    const encodeItem = Schema.encodeSync(itemSchema);

    class CoListOfItem
        extends Array<Item extends CoValueSchema ? (Schema.Schema.To<Item>|undefined) : Schema.Schema.To<Item>>
        implements CoListBase<Item>
    {
        static get ast() {
            return AST.setAnnotation(
                Schema.instanceOf(this).ast,
                constructorOfSchemaSym,
                this
            );
        }
        static [Schema.TypeId]: Schema.Schema.Variance<
            CoListOfItem,
            CoListOfItem,
            never
        >[Schema.TypeId];
        static pipe() {
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "CoList" as const;

        id!: ID<this>;
        _type!: "CoList";
        _owner!: Account | Group;
        _refs!: CoListBase<Item>["_refs"];
        _edits!: CoListBase<Item>["_edits"];
        _raw!: RawCoList;
        _loadedAs!: ControlledAccount;
        _schema!: typeof CoListOfItem;

        constructor(_init: undefined, options: { fromRaw: RawCoList });
        constructor(
            init: Schema.Schema.From<Item>[],
            options: { owner: Account | Group }
        );
        constructor(init: number);
        constructor(
            init: Schema.Schema.From<Item>[] | undefined | number,
            options?: { owner: Account | Group } | { fromRaw: RawCoList }
        ) {
            if (typeof init === "number") {
                // this might be called from an intrinsic, like map, trying to create an empty array
                // passing `0` as the only parameter
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return new Array(init) as any;
            }

            super();

            const itemsAreCoValues = propertyIsCoValueSchema(itemSchema);

            if (!options) {
                throw new Error("Must provide options");
            }

            let raw: RawCoList;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else {
                const rawOwner = options.owner._raw;

                const rawInit = itemsAreCoValues
                    ? init?.map((item) => item.id)
                    : init?.map((item) => encodeItem(item));

                raw = rawOwner.createList(rawInit);
            }

            const refs = itemsAreCoValues
                ? makeRefs<{ [key: number]: Schema.Schema.To<Item> }>(
                      (idx) => raw.get(idx),
                      () =>
                          Array.from(
                              { length: raw.entries().length },
                              (_, idx) => idx
                          ),
                      controlledAccountFromNode(raw.core.node),
                      (_idx) => itemSchema
                  )
                : [];

            const getEdits = () =>
                new Proxy(this, {
                    get: (target, key, receiver) => {
                        if (typeof key === "string" && !isNaN(+key)) {
                            const rawEdit = raw.editAt(Number(key));
                            if (!rawEdit) {
                                return undefined;
                            }

                            return {
                                get value() {
                                    if (itemsAreCoValues) {
                                        return this.ref?.accessFrom(receiver);
                                    } else {
                                        return (
                                            rawEdit?.value &&
                                            decodeItem(rawEdit?.value)
                                        );
                                    }
                                },

                                get ref() {
                                    if (itemsAreCoValues) {
                                        return (
                                            rawEdit?.value &&
                                            new ValueRef(
                                                rawEdit?.value as ID<CoListOfItem>,
                                                receiver.loadedAs,
                                                itemSchema
                                            )
                                        );
                                    }
                                },

                                get by() {
                                    if (
                                        cojsonInternals.isAccountID(rawEdit.by)
                                    ) {
                                        return new ValueRef(
                                            rawEdit.by as unknown as ID<Account>,
                                            receiver.loadedAs,
                                            SimpleAccount
                                        );
                                    }
                                },

                                madeAt: rawEdit.at,
                                tx: rawEdit.tx,
                            };
                        } else if (key === "length") {
                            return raw.entries().length;
                        }
                        return Reflect.get(target, key, receiver);
                    },
                });

            Object.defineProperties(this, {
                id: { value: raw.id, enumerable: false },
                _type: { value: "CoList", enumerable: false },
                _owner: {
                    get: () =>
                        raw.group instanceof RawAccount
                            ? SimpleAccount.fromRaw(raw.group)
                            : SimpleGroup.fromRaw(raw.group),
                    enumerable: false,
                },
                _refs: { value: refs, enumerable: false },
                _edits: { get: getEdits, enumerable: false },
                _raw: { value: raw, enumerable: false },
                _loadedAs: {
                    get: () => controlledAccountFromNode(raw.core.node),
                    enumerable: false,
                },
                _schema: { value: this.constructor, enumerable: false },
            });

            return new Proxy(this, {
                get(target, key, receiver) {
                    if (typeof key === "string" && !isNaN(+key)) {
                        if (itemsAreCoValues) {
                            return target._refs[Number(key)]?.accessFrom(
                                receiver
                            );
                        } else {
                            return decodeItem(raw.get(Number(key)));
                        }
                    } else if (key === "length") {
                        return raw.entries().length;
                    }
                    const prop = Reflect.get(target, key, receiver);
                    if (typeof prop === "function") {
                        return prop.bind(receiver);
                    }
                    return prop;
                },
                set(target, key, value, receiver) {
                    if (typeof key === "string" && !isNaN(+key)) {
                        if (itemsAreCoValues) {
                            raw.replace(Number(key), value.id);
                            subscriptionsScopes
                                .get(receiver)
                                ?.onRefAccessedOrSet(value.id);
                            return true;
                        } else {
                            raw.replace(
                                Number(key),
                                encodeItem(value) as JsonValue
                            );
                            return true;
                        }
                    } else {
                        return Reflect.set(target, key, value);
                    }
                },
                has(target, key) {
                    if (typeof key === "string" && !isNaN(+key)) {
                        return Number(key) < raw.entries().length;
                    } else {
                        return Reflect.has(target, key);

                    }
                }
            });
        }

        static fromRaw(raw: RawCoList): CoListOfItem {
            return new CoListOfItem(undefined, { fromRaw: raw });
        }

        push(...items: (Item extends CoValueSchema ? (Schema.Schema.To<Item>|undefined) : Schema.Schema.To<Item>)[]): number {
            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) => encodeItem(item));
            }

            for (const item of rawItems) {
                this._raw.append(item);
            }

            return this._raw.entries().length;
        }

        unshift(...items: (Item extends CoValueSchema ? (Schema.Schema.To<Item>|undefined) : Schema.Schema.To<Item>)[]): number {
            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) => encodeItem(item));
            }

            for (const item of rawItems) {
                this._raw.prepend(item);
            }

            return this._raw.entries().length;
        }

        pop(): Schema.Schema.To<Item> | undefined {
            const last = this[this.length - 1];

            this._raw.delete(this.length - 1);

            return last;
        }

        shift(): Schema.Schema.To<Item> | undefined {
            const first = this[0];

            this._raw.delete(0);

            return first;
        }

        splice(
            start: number,
            deleteCount: number,
            ...items: (Item extends CoValueSchema ? (Schema.Schema.To<Item>|undefined) : Schema.Schema.To<Item>)[]
        ): (Item extends CoValueSchema ? (Schema.Schema.To<Item>|undefined) : Schema.Schema.To<Item>)[] {
            const deleted = this.slice(start, start + deleteCount);

            for (
                let idxToDelete = start + deleteCount;
                idxToDelete > start;
                idxToDelete--
            ) {
                this._raw.delete(idxToDelete);
            }

            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) => encodeItem(item));
            }

            let appendAfter = start;
            for (const item of rawItems) {
                this._raw.append(item, appendAfter);
                appendAfter++;
            }

            return deleted;
        }

        static load = SharedCoValueConstructor.load;
        static loadEf = SharedCoValueConstructor.loadEf;
        static subscribe = SharedCoValueConstructor.subscribe;
        static subscribeEf = SharedCoValueConstructor.subscribeEf;

        toJSON() {
            return this.map((item) =>
                typeof item === "object" &&
                "toJSON" in item &&
                typeof item.toJSON === "function"
                    ? item.toJSON()
                    : item
            );
        }

        [inspect]() {
            return this.toJSON();
        }

        static as<SubClass>() {
            return CoListOfItem as unknown as CoListSchema<SubClass, Item>;
        }

        subscribe(listener: (update: this) => void): () => void {
            return SharedCoValueConstructor.prototype.subscribe.call(
                this,
                listener as unknown as (
                    update: SharedCoValueConstructor
                ) => void
            );
        }

        subscribeEf() {
            return SharedCoValueConstructor.prototype.subscribeEf.call(
                this
            ) as unknown as Stream.Stream<this, UnavailableError, never>;
        }
    }

    return CoListOfItem as CoListSchema<CoListOfItem, Item> & {
        as<SubClass>(): CoListSchema<SubClass, Item>;
    };
}
