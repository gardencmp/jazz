import { Account } from "./account.js";

/** @category CoValues - Account */

export function isAccountSchema(value: unknown): value is Account {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "account"
    );
}
/** @category CoValues - Account */

export function isAccount(value: unknown): value is Account {
    return (
        typeof value === "object" &&
        value !== null &&
        isAccountSchema(value.constructor) &&
        "id" in value
    );
}
