import { CoValueContent } from "./coValue";
import { JsonValue } from "./jsonValue";
import { MultiLog } from "./multilog";
import { LocalNode } from "./node";

type Value = JsonValue | CoValueContent;

export {
    JsonValue,
    CoValueContent as CoValue,
    Value,
    LocalNode,
    MultiLog
}
