import { AccountSchema, controlledAccountSym } from "./account.js";

export type AccountMigration<A extends AccountSchema> = (
    me: A[controlledAccountSym]
) => void | Promise<void>;

export function createAccountMigration<A extends AccountSchema>(
    accountSchema: A,
    migration: AccountMigration<A>
): AccountMigration<A> {
    return migration;
}
