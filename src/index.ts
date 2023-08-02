import { ContentType } from "./contentType";
import { JsonValue } from "./jsonValue";
import { MultiLog } from "./multilog";
import { LocalNode } from "./node";

type Value = JsonValue | ContentType;

export {
    JsonValue,
    ContentType as CoValue,
    Value,
    LocalNode,
    MultiLog
}
