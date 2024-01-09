import {
    CojsonInternalTypes,
    CoValue as RawCoValue,
} from "cojson";
import {
    CoList,
    CoListSchema,
} from "./coList.js";
import {
    CoMap,
    CoMapSchema,
} from "./coMap.js";
import {
    Account,
    AccountSchema,
    ControlledAccount,
} from "./account.js";
import { Group, GroupSchema } from "./group.js";
import {
    BinaryCoStream,
    BinaryCoStreamSchema,
    CoStream,
    CoStreamSchema,
} from "./coStream.js";
import { Schema } from "./schema.js";
import { Effect } from "effect";
import { CoValueUnavailableError, UnknownCoValueLoadError } from "./errors.js";

export { imm, Primitive } from "./primitives.js";

export {cojsonReady as jazzReady} from "cojson";

export {
    Account,
    AccountSchema,
    ControlledAccount,
    ControlledAccountSchema,
    AccountWith,
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
    /** @category Type Hints */
    _RawValue: RawValue;
    fromRaw(raw: RawCoValue, onGetRef?: (id: ID<CoValue>) => void): Value;
    load(
        id: ID<Value>,
        { as }: { as: ControlledAccount }
    ): Promise<Value | undefined>;
    loadEf(
        id: ID<Value>,
    ): Effect.Effect<
        ControlledAccount,
        CoValueUnavailableError | UnknownCoValueLoadError,
        Value
    >
}

export interface CoValueBase {
    id: ID<CoValue>;
    meta: CoValueMetaBase;
}

export interface CoValueMetaBase {
    owner: Account | Group;
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
