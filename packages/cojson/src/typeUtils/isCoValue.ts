import { type CoValue } from "../coValue.js";
import type { JsonValue } from "../jsonValue.js";
import { CoMap } from "../coValues/coMap.js";
import { CoList } from "../coValues/coList.js";
import { CoStream } from "../coValues/coStream.js";
import { BinaryCoStream } from "../coValues/coStream.js";


export function isCoValue(
    value: JsonValue | CoValue | undefined
): value is CoValue {
    return (
        value instanceof CoMap ||
        value instanceof CoList ||
        value instanceof CoStream ||
        value instanceof BinaryCoStream
    );
}
