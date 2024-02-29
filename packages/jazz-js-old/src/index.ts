import { CoList, CoListSchema } from "./coValues/coList/coList.js";
import { CoMap, CoMapSchema } from "./coValues/coMap/coMap.js";
import { Account, AccountSchema } from "./coValues/account/account.js";
import { Group, GroupSchema } from "./coValues/group/group.js";
import { CoStream, CoStreamSchema } from "./coValues/coStream/coStream.js";
import {
    BinaryCoStream,
    BinaryCoStreamSchema,
} from "./coValues/binaryCoStream/binaryCoStream.js";

export { imm } from "./immutables/index.js";

export { cojsonReady as jazzReady } from "cojson";

export {
    Account,
    AccountSchema,
    ControlledAccount,
    ControlledAccountSchema,
} from "./coValues/account/account.js";
export { AccountWith } from "./coValues/account/impl.js";
export { isAccount, isAccountSchema } from "./coValues/account/guards.js";
export { SimpleAccount } from "./coValues/account/simpleAccount.js";
export { SimpleGroup } from "./coValues/group/simpleGroup.js";
export { CoMap, CoMapSchema } from "./coValues/coMap/coMap.js";
export { CoMapOf } from "./coValues/coMap/impl.js";
export { isCoMap, isCoMapSchema } from "./coValues/coMap/guards.js";
export { CoList, CoListSchema } from "./coValues/coList/coList.js";
export { CoListOf } from "./coValues/coList/impl.js";
export { isCoList, isCoListSchema } from "./coValues/coList/guards.js";
export { CoStream, CoStreamSchema } from "./coValues/coStream/coStream.js";
export { CoStreamOf } from "./coValues/coStream/impl.js";
export { isCoStream, isCoStreamSchema } from "./coValues/coStream/guards.js";
export {
    BinaryCoStream,
    BinaryCoStreamSchema,
} from "./coValues/binaryCoStream/binaryCoStream.js";
export {
    isBinaryCoStream,
    isBinaryCoStreamSchema,
} from "./coValues/binaryCoStream/guards.js";

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

export type AccountMigration<A extends AccountSchema> = (
    me: A["ControlledSchema"]["_Value"]
) => void | Promise<void>;

export function createAccountMigration<A extends AccountSchema>(
    accountSchema: A,
    migration: AccountMigration<A>
): AccountMigration<A> {
    return migration;
}
