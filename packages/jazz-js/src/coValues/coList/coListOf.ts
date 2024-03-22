import { JsonValue, RawCoList } from "cojson";
import {
    CoValue,
    CoValueSchema,
    ID,
    inspect,
} from "../../coValueInterfaces.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { CoListCo, CoListSchema } from "./coList.js";
import { AST, Schema } from "@effect/schema";
import { Account } from "../account/account.js";
import { Group } from "../group/group.js";
import {
    constructorOfSchemaSym,
    propertyIsCoValueSchema,
} from "../resolution.js";
import { makeRefs } from "../../refs.js";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { subscriptionsScopes } from "../../subscriptionScope.js";
import { CoValueCoImpl, SharedCoValueConstructor } from "../construction.js";
import { pipeArguments } from "effect/Pipeable";

export function CoListOfHelper<
    Self,
    Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
>(itemSchema: Item) {
    const decodeItem = Schema.decodeSync(itemSchema);
    const encodeItem = Schema.encodeSync(itemSchema);

    class CoListOfItem
        extends Array<Schema.Schema.To<Item>>
        implements CoValue<"CoList", RawCoList>
    {
        static get ast() {
            return AST.setAnnotation(
                Schema.instanceOf(this).ast,
                constructorOfSchemaSym,
                this
            );
        }
        static [Schema.TypeId]: Schema.Schema.Variance<
            Self & CoListOfItem,
            Self & CoListOfItem,
            never
        >[Schema.TypeId];
        static pipe() {
            // eslint-disable-next-line prefer-rest-params
            return pipeArguments(this, arguments);
        }
        static type = "CoList" as const;

        id!: ID<this>;
        co!: CoListCo<this, Item>;

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
            super();

            const itemsAreCoValues = propertyIsCoValueSchema(itemSchema);

            if (typeof init === "number") {
                // this might be called from an intrinsic, like map, trying to create an empty array
                // passing `0` as the only parameter
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return new Array(init) as any;
            }

            if (!options) {
                throw new Error("Must provide options");
            }

            let raw: RawCoList;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else {
                const rawOwner = options.owner.co.raw;

                const rawInit = itemsAreCoValues
                    ? init?.map((item) => item.co.id)
                    : init?.map((item) => encodeItem(item));

                raw = rawOwner.createList(rawInit);
            }

            Object.defineProperty(this, "co", {
                value: new CoValueCoImpl(
                    raw.id as unknown as ID<this>,
                    "CoList",
                    raw,
                    this.constructor as CoListSchema<this, Item>,
                    itemsAreCoValues
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
                        : []
                ) satisfies CoListCo<this, Item>,
                writable: false,
                enumerable: false,
            });

            return new Proxy(this, {
                get(target, key, receiver) {
                    if (typeof key === "string" && !isNaN(+key)) {
                        if (itemsAreCoValues) {
                            return target.co.refs[Number(key)]?.accessFrom(receiver)
                        } else {
                            return decodeItem(
                                raw.get(Number(key))
                            );
                        }
                    } else if (key === "length") {
                        return raw.entries().length;
                    }
                    return Reflect.get(target, key, receiver);
                },
                set(target, key, value, receiver) {
                    if (typeof key === "string" && !isNaN(+key)) {
                        if (itemsAreCoValues) {
                            raw.replace(Number(key), value.co.id);
                            subscriptionsScopes
                                .get(receiver)
                                ?.onRefAccessedOrSet(value.co.id);
                            return true;
                        } else {
                            raw.replace(
                                Number(key),
                                encodeItem(
                                    value
                                ) as JsonValue
                            );
                            return true;
                        }
                    } else {
                        return Reflect.set(target, key, value);
                    }
                },
            });
        }

        static fromRaw(raw: RawCoList): CoListOfItem {
            return new CoListOfItem(undefined, { fromRaw: raw });
        }

        push(...items: Schema.Schema.To<Item>[]): number {
            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) =>
                    encodeItem(item)
                );
            }

            for (const item of rawItems) {
                this.co.raw.append(item);
            }

            return this.co.raw.entries().length;
        }

        unshift(...items: Schema.Schema.To<Item>[]): number {
            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) =>
                    encodeItem(item)
                );
            }

            for (const item of rawItems) {
                this.co.raw.prepend(item);
            }

            return this.co.raw.entries().length;
        }

        pop(): Schema.Schema.To<Item> | undefined {
            const last = this[this.length - 1];

            this.co.raw.delete(this.length - 1);

            return last;
        }

        shift(): Schema.Schema.To<Item> | undefined {
            const first = this[0];

            this.co.raw.delete(0);

            return first;
        }

        splice(
            start: number,
            deleteCount: number,
            ...items: Schema.Schema.To<Item>[]
        ): Schema.Schema.To<Item>[] {
            const deleted = this.slice(start, start + deleteCount);

            for (
                let idxToDelete = start + deleteCount;
                idxToDelete > start;
                idxToDelete--
            ) {
                this.co.raw.delete(idxToDelete);
            }

            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) =>
                    encodeItem(item)
                );
            }

            let appendAfter = start;
            for (const item of rawItems) {
                this.co.raw.append(item, appendAfter);
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
    }

    return CoListOfItem as CoListSchema<Self, Item>;
}

export function CoListOf<Self>() {
    return function narrowed<
        Item extends CoValueSchema | SchemaWithOutput<JsonValue>,
    >(itemSchema: Item) {
        return CoListOfHelper<Self, Item>(itemSchema);
    };
}
