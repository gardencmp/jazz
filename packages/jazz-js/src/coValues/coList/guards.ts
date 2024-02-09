import { CoListSchema, CoList } from "./coList.js";

/** @category CoValues - CoList */

export function isCoListSchema(value: unknown): value is CoListSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "colist"
    );
}
/** @category CoValues - CoList */

export function isCoList(value: unknown): value is CoList {
    return (
        typeof value === "object" &&
        value !== null &&
        isCoListSchema(value.constructor) &&
        "id" in value
    );
}
