import { JsonValue } from "./jsonValue.js";
import { CoMap } from "./coValues/coMap.js";
import { BinaryCoStream, CoStream } from "./coValues/coStream.js";
import { CoList } from "./coValues/coList.js";
import { CoValue } from "./coValue.js";

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
