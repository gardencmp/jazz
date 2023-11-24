import { CoList, CojsonInternalTypes } from "cojson";
import { ID, Schema, SchemaToPrimitiveOrID, SyncState } from ".";
import { CoMapSchema } from "./coMap.js";
import { AccountValue, GroupValue, ControlledAccountValue } from "./group.js";

export class CoListSchema<Item extends Schema = Schema> extends Schema<
    CoListValue<Item>
> {
    _item: Item;

    constructor(item: Item) {
        super();
        this._item = item;
    }
}

type CoListInsert<Item extends Schema> = {
    by?: AccountValue;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
    value: Item["_value"];
};

type CoListDelete = {
    by?: AccountValue;
    tx: CojsonInternalTypes.TransactionID;
    at: Date;
};

export type CoListValue<Item extends Schema = Schema> = Item["_value"][] & {
    _type: "colist";
    _inner: CoList<SchemaToPrimitiveOrID<Item>>;
    id: ID<CoListValue<Item>>;
    meta: {
        inserts: CoListInsert<Item>[];
        deletes: CoListDelete[];
        sync: SyncState &
            (Item extends CoMapSchema | CoListSchema ? SyncState[] : {});
        refs: Item extends CoMapSchema | CoListSchema
            ? ID<SchemaToPrimitiveOrID<Item>>[]
            : {};
    };
};
export type CoListClass<Item extends Schema> = {
    new (
        init: Item["_value"][],
        { owner }: { owner: AccountValue | GroupValue }
    ): CoListValue<Item["_value"]>;
    new ({ owner }: { owner: AccountValue | GroupValue }): CoListValue<
        Item["_value"]
    >;

    load(
        id: ID<CoListValue<Item>>,
        { as }: { as: ControlledAccountValue }
    ): Promise<CoListValue<Item>>;
};
export function isCoList(value: any): value is CoListValue {
    return (
        typeof value === "object" &&
        value instanceof CoListSchema &&
        "id" in value
    );
}
export const createCoListSchema = <Item extends Schema>(
    item: Item
): CoListSchema<Item> & CoListClass<Item> => {
    const CoListSchemaInstance = new CoListSchema<Item>(item);

    class CoListMeta {
        _inner!: CoList<SchemaToPrimitiveOrID<Item>>;

        constructor(_inner: CoList<SchemaToPrimitiveOrID<Item>>) {
            this._inner = _inner;
        }
    }

    class CoListFromSchema extends Array {
        id!: ID<CoListValue<Item>>;
        _inner!: CoList<SchemaToPrimitiveOrID<Item>>;
        meta!: CoListMeta;

        static fromInner(
            _inner: CoList<SchemaToPrimitiveOrID<Item>>,
            onGetRef?: (key: number, schema: Item) => void,
            onSetRef?: (
                key: number,
                schema: Item,
                value: Item["_value"]
            ) => void
        ): CoListFromSchema {
            const instance = Object.create(
                CoListFromSchema.prototype
            ) as CoListFromSchema;

            instance._inner = _inner;
            instance.meta = new CoListMeta(_inner);
            instance.id = _inner.id as unknown as ID<CoListValue<Item>>;

            return instance;
        }
    }

    Object.setPrototypeOf(CoListFromSchema.prototype, CoListSchemaInstance);

    return CoListFromSchema as unknown as CoListSchema<Item> &
        CoListClass<Item>;
};
