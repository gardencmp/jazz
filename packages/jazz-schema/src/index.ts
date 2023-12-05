import {
    CoID,
    CojsonInternalTypes,
    Group,
    CoList as RawCoList,
    CoMap as RawCoMap,
    CoValue as RawCoValue,
} from "cojson";
import { CoList, CoListClass, isCoList, isCoListClass } from "./coList.js";
import { CoMap, CoMapClass, isCoMap, isCoMapClass } from "./coMap.js";
import { Account, AccountClass, isAccount, isAccountClass } from "./account.js";
import { GroupClass, isGroup, isGroupClass } from "./group.js";

export abstract class Schema<Value = any> {
    readonly _Value: Value;
}

export class BooleanSchema extends Schema<boolean> {}
export class StringSchema extends Schema<string> {}
export class NumberSchema extends Schema<number> {}
export class NullSchema extends Schema<null> {}

export type Primitive = string | number | boolean | null;

export class ConstSchema<Value extends Primitive> extends Schema<Value> {
    static _Type = "const";
    _Value: Value;

    constructor(value: Value) {
        super();
        this._Value = value;
    }
}

export type CoValueClass = CoListClass | CoMapClass | GroupClass | AccountClass;
export type CoValue = CoList | CoMap | Group | Account;

export interface CoValueClassBase {
    fromRaw(raw: RawCoValue, onGetRef?: (id: ID<CoValue>) => void): CoValue;
}

export function isCoValueClass(value: any): value is CoValueClass {
    return (
        isCoMapClass(value) || isCoListClass(value) || isGroupClass(value) || isAccountClass(value)
    );
}

export function isCoValue(value: any): value is CoValue {
    return (
        isCoMap(value) || isCoList(value) || isGroup(value) || isAccount(value)
    );
}

export type ID<T> = CojsonInternalTypes.RawCoID & {
    readonly __type: T;
};

export type PrimitiveOrRawID<Schema> = Schema extends CoListClass<
    infer Item
>
    ? CoID<RawCoList<PrimitiveOrRawID<Item>>>
    : Schema extends CoMapClass<infer Shape>
    ? CoID<RawCoMap<{ [Key in keyof Shape]: PrimitiveOrRawID<Shape[Key]> }>>
    : Schema extends BooleanSchema
    ? boolean
    : Schema extends StringSchema
    ? string
    : Schema extends NumberSchema
    ? number
    : Schema extends NullSchema
    ? null
    : Schema extends ConstSchema<infer Value>
    ? Value
    : never;

export type RawType<Schema> = Schema extends CoListClass<infer Item>
    ? RawCoList<PrimitiveOrRawID<Item>>
    : Schema extends CoMapClass<infer Shape>
    ? RawCoMap<{ [Key in keyof Shape]: PrimitiveOrRawID<Shape[Key]> }>
    : Schema extends BooleanSchema
    ? boolean
    : Schema extends StringSchema
    ? string
    : Schema extends NumberSchema
    ? number
    : Schema extends NullSchema
    ? null
    : Schema extends ConstSchema<infer Value>
    ? Value
    : never;

export type AccountMigration<A extends Account = Account> = (
    me: A
) => void | Promise<void>;
