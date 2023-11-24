import { CojsonInternalTypes, CoMap, CoList } from "cojson";
import {
    CoMapNativeShape,
    CoMapValue,
    isCoMap,
    createCoMapSchema,
    CoMapSchema,
} from "./coMap.js";
import {
    CoListSchema,
    CoListValue,
    isCoList,
    createCoListSchema,
} from "./coList.js";
import {
    AccountClass,
    AccountSchema,
    ControlledAccountValue,
} from "./group.js";

export type ID<T> = CojsonInternalTypes.RawCoID & {
    readonly __type: T;
};

export abstract class Schema<Value = any> {
    readonly _value!: Value;

    or<Other extends Schema>(other: Other): UnionSchema<[this, Other]> {
        return new UnionSchema([this, other]);
    }

    optional(): UnionSchema<[this, NullSchema]> {
        return new UnionSchema([this, new NullSchema()]);
    }
}

export type SyncState =
    | { state: "neverLoaded" }
    | { state: "loading" }
    | { state: "loaded" }
    | { state: "unavailable" };

export type NativeCoValue<
    S extends Schema,
    HeaderMeta extends CojsonInternalTypes.JsonObject | null = CojsonInternalTypes.JsonObject | null
> = S extends CoMapSchema<infer Shape>
    ? CoMap<CoMapNativeShape<Shape>, HeaderMeta>
    : S extends CoListSchema<infer Item>
    ? CoList<SchemaToPrimitiveOrID<Item>, HeaderMeta>
    : never;

export type SchemaToPrimitiveOrID<S extends Schema> = S extends CoMapSchema<
    infer Shape
>
    ? ID<CoMapValue<Shape>>
    : S extends CoListSchema<infer Item>
    ? ID<CoListValue<Item["_value"]>>
    : S["_value"];

export class UnionSchema<Schemas extends Schema[]> extends Schema<
    Schemas[number]["_value"]
> {
    _schemas: Schemas;

    constructor(schemas: Schemas) {
        super();
        this._schemas = schemas;
    }
}

export class BooleanSchema extends Schema<boolean> {}
export class StringSchema extends Schema<string> {}
export class NumberSchema extends Schema<number> {}
export class NullSchema extends Schema<null> {}

export const co = {
    map: createCoMapSchema,
    list: createCoListSchema,
};

export const im = {
    boolean: new BooleanSchema(),
    string: new StringSchema(),
    number: new NumberSchema(),
    null: new NullSchema(),
};

export type CoValue = CoMapValue | CoListValue;
export type Primitive = string | number | boolean | null;

export function isCoValue(value: any): value is CoValue {
    return isCoMap(value) || isCoList(value);
}

export {
    AccountValue,
    AccountSchema,
    AccountClass,
    ProfileSchema,
    ControlledAccountValue,
} from "./group.js";

export { CoMapSchema } from "./coMap.js";

export type AppMigration<Account extends AccountSchema & AccountClass = AccountSchema & AccountClass> = (
    me: ControlledAccountValue<Account["_profile"], Account["_root"]>
) => void | Promise<void>;
