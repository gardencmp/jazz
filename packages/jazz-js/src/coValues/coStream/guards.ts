import { CoStreamSchema, CoStream } from "./coStream.js";


export function isCoStreamSchema(value: unknown): value is CoStreamSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "costream"
    );
}

export function isCoStream(value: unknown): value is CoStream {
    return (
        typeof value === "object" &&
        value !== null &&
        isCoStreamSchema(value.constructor) &&
        "id" in value
    );
}
