import { CoList as RawCoList } from "cojson";
import { Schema, PrimitiveOrRawID, ID, RawType, CoValueClassBase, CoValue } from ".";
import { Group } from "./group.js";
import { Account } from "./account.js";

export interface CoList<Item extends Schema = Schema>
    extends Array<Item["_Value"]> {
    id: ID<CoList<Item>>;
    meta: {};
}

export interface CoListClass<Item extends Schema = Schema>
    extends Schema<CoList<Item>>, CoValueClassBase {
    _Type: "colist";
    _Item: Item;

    new (
        init: Item["_Value"],
        options: { owner: Account | Group }
    ): CoList<Item>;
    new (
        init: undefined,
        options: { fromRaw: RawType<CoListClass<Item>> }
    ): CoList<Item>;

    fromRaw(raw: RawType<CoListClass<Item>>, onGetRef?: (id: ID<CoValue>) => void): CoList<Item>;
}

export function isCoListClass(value: any): value is CoListClass {
    return (
        typeof value === "object" && value !== null && value._Type === "colist"
    );
}

export function isCoList(value: any): value is CoList {
    return isCoListClass(value) && "id" in value;
}

export function CoListOf<Item extends Schema>(
    ItemSchema: Item
): CoListClass<Item> {
    return class CoListClassForItem extends Array<Item["_Value"]> {
        static _Type = "colist" as const;
        static _Item = ItemSchema;
        static _Value: CoList<Item> = "CoList<Item>" as any;

        _raw!: RawType<CoListClass<Item>>;
        id!: ID<CoList<Item>>;
        meta = {};

        constructor(init: Item["_Value"], options: { owner: Account | Group });
        constructor(
            init: undefined,
            options: { fromRaw: RawType<CoListClass<Item>> }
        );
        constructor(
            init: Item["_Value"] | undefined,
            options:
                | { owner: Account | Group }
                | { fromRaw: RawType<CoListClass<Item>> }
        ) {
            super();

            let raw: RawType<CoListClass<Item>>;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else if (init && "owner" in options) {
                const rawOwner = options.owner._raw;
                raw = rawOwner.createList<RawType<CoListClass<Item>>>(
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
            this.id = raw.id as any;

            raw.asArray().forEach((item, idx) => {
                Object.defineProperty(this, idx, {
                    get: () => {
                        // TODO
                    },
                    set(value) {
                        // TODO
                    },
                    enumerable: true,
                    configurable: true,
                });
            });
        }
    } satisfies CoListClass<Item>;
}
