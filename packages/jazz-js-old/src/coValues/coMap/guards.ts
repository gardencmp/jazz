import { CoMapSchema, CoMap } from "./coMap.js";

/** @category CoValues - CoMap */

export function isCoMapSchema(value: unknown): value is CoMapSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "comap"
    );
}
/** @category CoValues - CoMap */

export function isCoMap(value: unknown): value is CoMap {
    return (
        typeof value === "object" &&
        value !== null &&
        isCoMapSchema(value.constructor) &&
        "id" in value
    );
}
