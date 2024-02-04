import { type RawCoValue } from "../coValue.js";
import type { JsonValue } from "../jsonValue.js";
import { RawCoMap } from "../coValues/coMap.js";
import { RawCoList } from "../coValues/coList.js";
import { RawCoStream } from "../coValues/coStream.js";
import { RawBinaryCoStream } from "../coValues/coStream.js";


export function isCoValue(
    value: JsonValue | RawCoValue | undefined
): value is RawCoValue {
    return (
        value instanceof RawCoMap ||
        value instanceof RawCoList ||
        value instanceof RawCoStream ||
        value instanceof RawBinaryCoStream
    );
}
