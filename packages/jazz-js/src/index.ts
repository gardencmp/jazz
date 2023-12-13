import {
    CoID,
    CojsonInternalTypes,
    CoMap as RawCoMap,
    CoList as RawCoList,
    CoStream as RawCoStream,
    CoValue as RawCoValue,
} from "cojson";
import {
    CoList,
    CoListOf,
    CoListSchema,
    isCoList,
    isCoListSchema,
} from "./coList.js";
import {
    CoMap,
    CoMapOf,
    CoMapSchema,
    isCoMap,
    isCoMapSchema,
} from "./coMap.js";
import {
    Account,
    AccountSchema,
    ControlledAccount,
    isAccount,
    isAccountSchema,
} from "./account.js";
import { Group, GroupSchema, isGroup, isGroupSchema } from "./group.js";
import {
    BinaryCoStream,
    BinaryCoStreamSchema,
    CoStream,
    CoStreamSchema,
    isBinaryCoStream,
    isBinaryCoStreamSchema,
    isCoStream,
    isCoStreamSchema,
} from "./coStream.js";

export {
    Account,
    AccountSchema,
    ControlledAccount,
    ControlledAccountSchema,
    isAccount,
    isAccountSchema,
    SimpleAccount,
} from "./account.js";
export { Group } from "./group.js";
export {
    CoMap,
    CoMapSchema,
    CoMapOf,
    isCoMap,
    isCoMapSchema,
} from "./coMap.js";
export {
    CoList,
    CoListSchema,
    CoListOf,
    isCoList,
    isCoListSchema,
} from "./coList.js";
export {
    CoStream,
    CoStreamSchema,
    BinaryCoStream,
    BinaryCoStreamSchema,
} from "./coStream.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Schema<Value = any> {
    readonly _Value!: Value;
}

export class BooleanSchema extends Schema<boolean> {
    static _Type = "boolean";
    static _Value: boolean;
}
export class StringSchema extends Schema<string> {
    static _Type = "string";
    static _Value: string;
}
export class NumberSchema extends Schema<number> {
    static _Type = "number";
    static _Value: number;
}
export class NullSchema extends Schema<null> {
    static _Type = "null";
    static _Value: null;
}

export const imm = {
    boolean: new BooleanSchema(),
    string: new StringSchema(),
    number: new NumberSchema(),
    null: new NullSchema(),
};

export type Primitive = string | number | boolean | null;

export class ConstSchema<Value extends Primitive> extends Schema<Value> {
    static _Type = "const";
    _Value: Value;

    constructor(value: Value) {
        super();
        this._Value = value;
    }
}

export type CoValueSchema =
    | CoListSchema
    | CoMapSchema
    | CoStreamSchema
    | BinaryCoStreamSchema
    | GroupSchema
    | AccountSchema;

export type CoValue =
    | CoMap
    | CoList
    | CoStream
    | BinaryCoStream
    | Group
    | Account;

export interface CoValueSchemaBase<
    Value extends CoValue = CoValue,
    RawValue extends RawCoValue = RawCoValue
> extends Schema<Value> {
    _RawValue: RawValue;
    fromRaw(raw: RawCoValue, onGetRef?: (id: ID<CoValue>) => void): Value;
    load(
        id: ID<Value>,
        { as }: { as: ControlledAccount }
    ): Promise<Value | undefined>;
}

export interface CoValueBase {
    id: ID<CoValue>;
    meta: CoValueMetaBase;
}

export interface CoValueMetaBase {
    owner: Account | Group;
}

export function isCoValueSchema(value: unknown): value is CoValueSchema {
    return (
        isCoMapSchema(value) ||
        isCoListSchema(value) ||
        isCoStreamSchema(value) ||
        isBinaryCoStreamSchema(value) ||
        isGroupSchema(value) ||
        isAccountSchema(value)
    );
}

export function isCoValue(value: unknown): value is CoValue {
    return (
        isCoMap(value) ||
        isCoList(value) ||
        isCoStream(value) ||
        isBinaryCoStream(value) ||
        isGroup(value) ||
        isAccount(value)
    );
}

export type ID<T> = CojsonInternalTypes.RawCoID & {
    readonly __type: T;
};

export type AccountMigration<A extends AccountSchema> = (
    me: A["ControlledSchema"]["_Value"]
) => void | Promise<void>;

export function createAccountMigration<A extends AccountSchema>(
    accountSchema: A,
    migration: AccountMigration<A>
): AccountMigration<A> {
    return migration;
}

export type RawType<T extends Schema> = T extends CoValueSchemaBase<
    infer _,
    infer _
>
    ? T["_RawValue"]
    : T["_Value"];
