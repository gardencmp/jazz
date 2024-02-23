import { BinaryCoStreamSchema, BinaryCoStream } from "./binaryCoStream.js";


export function isBinaryCoStreamSchema(
    value: unknown
): value is BinaryCoStreamSchema {
    return (
        typeof value === "function" &&
        value !== null &&
        "_Type" in value &&
        value._Type === "binarycostream"
    );
}

export function isBinaryCoStream(value: unknown): value is BinaryCoStream {
    return (
        typeof value === "object" &&
        value !== null &&
        isBinaryCoStreamSchema(value.constructor) &&
        "id" in value
    );
}
