import { AnyAccountSchema, controlledAccountSym } from "./account.js";

export type AccountMigration<A extends AnyAccountSchema> = (
    me: A[controlledAccountSym]
) => void | Promise<void>;

export function createAccountMigration<A extends AnyAccountSchema>(
    accountSchema: A,
    migration: AccountMigration<A>
): AccountMigration<A> {
    return migration;
}
