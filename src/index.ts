import { ContentType } from "./contentType";
import { JsonValue } from "./jsonValue";
import { CoValue } from "./coValue";
import { LocalNode } from "./node";

type Value = JsonValue | ContentType;

export {
    JsonValue,
    ContentType,
    Value,
    LocalNode,
    CoValue
}
