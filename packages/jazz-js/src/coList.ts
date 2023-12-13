import { CoID, CoList as RawCoList, Account as RawAccount } from "cojson";
import {
    Schema,
    ID,
    CoValueSchemaBase,
    CoValue,
    ControlledAccount,
    RawType,
    CoValueBase,
    SimpleAccount,
} from "./index.js";
import { Group } from "./group.js";
import { Account } from "./account.js";

export interface CoList<Item extends Schema = Schema>
    extends Array<Item["_Value"]>,
        CoValueBase {
    id: ID<CoList<Item>>;
    meta: CoListMeta;
    _raw: RawCoList<RawType<Item>>;
}

export class CoListMeta {
    owner: Account | Group;
    constructor(raw: RawCoList) {
        const rawOwner = raw.core.getGroup();
        if (rawOwner instanceof RawAccount) {
            this.owner = SimpleAccount.fromRaw(rawOwner);
        } else {
            this.owner = Group.fromRaw(rawOwner);
        }
    }
}

export interface CoListSchema<Item extends Schema = Schema>
    extends Schema<CoList<Item>>,
        CoValueSchemaBase<CoList<Item>, RawCoList<RawType<Item>>> {
    _Type: "colist";
    _Item: Item;
    _Value: CoList<Item>;

    new (
        init: Item["_Value"][],
        options: { owner: Account | Group }
    ): CoList<Item>;

    fromRaw(
        raw: RawCoList<RawType<Item>>,
        onGetRef?: (id: ID<CoValue>) => void
    ): CoList<Item>;
}

export function isCoListSchema(value: unknown): value is CoListSchema {
    return (
        typeof value === "object" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "colist"
    );
}

export function isCoList(value: unknown): value is CoList {
    return (
        typeof value === "object" &&
        value !== null &&
        isCoListSchema(value.constructor) &&
        "id" in value
    );
}

export function CoListOf<Item extends Schema>(
    ItemSchema: Item
): CoListSchema<Item> {
    return class CoListSchemaForItem extends Array<Item["_Value"]> {
        static _Type = "colist" as const;
        static _RawValue: RawCoList<RawType<Item>>;
        static _Item = ItemSchema;
        static _Value: CoList<Item> = "CoList<Item>" as unknown as CoList<Item>;

        _raw!: RawCoList<RawType<Item>>;
        id!: ID<CoList<Item>>;
        meta!: CoListMeta;

        constructor(
            init: Item["_Value"][],
            options: { owner: Account | Group }
        );
        constructor(
            init: undefined,
            options: { fromRaw: RawCoList<RawType<Item>> }
        );
        constructor(
            init: Item["_Value"] | undefined,
            options:
                | { owner: Account | Group }
                | { fromRaw: RawCoList<RawType<Item>> }
        ) {
            super();

            let raw: RawCoList<RawType<Item>>;

            if ("fromRaw" in options) {
                raw = options.fromRaw;
            } else if (init && "owner" in options) {
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
            this.meta = new CoListMeta(raw);

            raw.asArray().forEach((item, idx) => {
                Object.defineProperty(this, idx, {
                    get: () => {
                        // TODO
                    },
                    set(_value) {
                        // TODO
                    },
                    enumerable: true,
                    configurable: true,
                });
            });
        }

        static fromRaw(
            raw: RawCoList<RawType<Item>>,
            _onGetRef?: (id: ID<CoValue>) => void
        ): CoList<Item> {
            return new CoListSchemaForItem(undefined, {
                fromRaw: raw,
            });
        }

        static load(
            id: ID<CoList<Item>>,
            { as }: { as: ControlledAccount }
        ): Promise<CoList<Item>> {
            throw new Error("Not implemented");
        }
    } satisfies CoListSchema<Item>;
}
