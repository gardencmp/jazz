import { CoValueCore, JsonValue, RawCoList } from "cojson";
import {
    AnyCoValueSchema,
    CoValue,
    ID,
    inspect,
    rawSym,
    tagSym,
} from "../../coValueInterfaces.js";
import { SchemaWithOutput } from "../../schemaHelpers.js";
import { CoList, CoListSchema } from "./coList.js";
import { AST, Schema } from "@effect/schema";
import { Account, ControlledAccount } from "../account/account.js";
import { Group } from "../group/group.js";
import {
    constructorOfSchemaSym,
    propertyIsCoValueSchema,
} from "../resolution.js";
import { ValueRef, makeRefs } from "../../refs.js";
import { controlledAccountFromNode } from "../account/accountOf.js";
import { subscriptionsScopes } from "../../subscriptionScope.js";

export function CoListOf<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
>(itemSchema: Item) {
    const listS = Schema.array(itemSchema);

    class CoListOfItem
        extends Array<Schema.Schema.To<Item>>
        implements CoValue<"CoList", RawCoList>
    {
        static get ast() {
            return AST.setAnnotation(listS.ast, constructorOfSchemaSym, this);
        }
        static [Schema.TypeId] = listS[Schema.TypeId];
        static pipe = listS.pipe;
        static [tagSym] = "CoList" as const;

        [tagSym] = "CoList" as const;
        [rawSym]!: RawCoList;

        id!: ID<this>;
        meta!: CoListMeta<Item>;

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

            if ("fromRaw" in options) {
                this[rawSym] = options.fromRaw;
            } else {
                const rawOwner = options.owner[rawSym];

                const rawInit = itemsAreCoValues
                    ? init?.map((item) => item.id)
                    : init?.map((item) => Schema.encodeSync(itemSchema)(item));

                this[rawSym] = rawOwner.createList(rawInit);
            }

            this.id = this[rawSym].id as unknown as ID<this>;

            Object.defineProperty(this, "meta", {
                value: {
                    loadedAs: controlledAccountFromNode(this[rawSym].core.node),
                    core: this[rawSym].core,
                    refs: itemsAreCoValues
                        ? makeRefs<{ [key: number]: Schema.Schema.To<Item> }>(
                              (idx) => this[rawSym].get(idx),
                              () =>
                                  Array.from(
                                      { length: this[rawSym].entries().length },
                                      (_, idx) => idx
                                  ),
                              controlledAccountFromNode(this[rawSym].core.node),
                              (_idx) => itemSchema
                          )
                        : [],
                },
                writable: false,
                enumerable: false,
            });

            return new Proxy(this, {
                get(target, key, receiver) {
                    if (typeof key === "string" && !isNaN(+key)) {
                        if (itemsAreCoValues) {
                            const ref = target.meta.refs[Number(key)];
                            if (!ref) {
                                // TODO: check if this allowed to be undefined
                                return undefined;
                            }

                            const subScope = subscriptionsScopes.get(target);

                            subScope?.onRefAccessedOrSet(ref.id);

                            if (ref.value && subScope) {
                                subscriptionsScopes.set(ref.value, subScope);
                            }

                            return ref.value;
                        } else {
                            return Schema.decodeSync(itemSchema)(
                                target[rawSym].get(Number(key))
                            );
                        }
                    } else if (key === "length") {
                        return target[rawSym].entries().length;
                    }
                    return Reflect.get(target, key, receiver);
                },
                set(target, key, value) {
                    if (typeof key === "string" && !isNaN(+key)) {
                        if (itemsAreCoValues) {
                            target[rawSym].replace(Number(key), value.id);
                            subscriptionsScopes
                                .get(target)
                                ?.onRefAccessedOrSet(value.id);
                            return true;
                        } else {
                            target[rawSym].replace(
                                Number(key),
                                Schema.encodeSync(itemSchema)(
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

        push(...items: Schema.Schema.To<Item>[]): number {
            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) =>
                    Schema.encodeSync(itemSchema)(item)
                );
            }

            for (const item of rawItems) {
                this[rawSym].append(item);
            }

            return this[rawSym].entries().length;
        }

        unshift(...items: Schema.Schema.To<Item>[]): number {
            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) =>
                    Schema.encodeSync(itemSchema)(item)
                );
            }

            for (const item of rawItems) {
                this[rawSym].prepend(item);
            }

            return this[rawSym].entries().length;
        }

        pop(): Schema.Schema.To<Item> | undefined {
            const last = this[this.length - 1];

            this[rawSym].delete(this.length - 1);

            return last;
        }

        shift(): Schema.Schema.To<Item> | undefined {
            const first = this[0];

            this[rawSym].delete(0);

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
                this[rawSym].delete(idxToDelete);
            }

            let rawItems;
            if (propertyIsCoValueSchema(itemSchema)) {
                rawItems = items.map((item) => item.id);
            } else {
                rawItems = items.map((item) =>
                    Schema.encodeSync(itemSchema)(item)
                );
            }

            let appendAfter = start;
            for (const item of rawItems) {
                this[rawSym].append(item, appendAfter);
                appendAfter++;
            }

            return deleted;
        }

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

        static as<Self extends any>(): CoListSchema<Self, Item> {
            return CoListOfItem as unknown as CoListSchema<Self, Item>;
        }
    }

    return CoListOfItem as CoListSchema<CoList<Item>, Item> & {
        as<Self extends any>(): CoListSchema<Self, Item>;
    };
}

export interface CoListMeta<
    Item extends AnyCoValueSchema | SchemaWithOutput<JsonValue>,
> {
    loadedAs: ControlledAccount;
    core: CoValueCore;
    refs: ValueRef<Schema.Schema.To<Item>>[];
}
