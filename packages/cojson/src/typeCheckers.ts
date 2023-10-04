import type { CoValue } from "./coValue.js";
import type { AccountID, AgentID, JsonValue } from "./index.js";


export function isCoValue(
    value: JsonValue | CoValue | undefined
): value is CoValue {
    return (
        typeof value === "object" && !!value && "id" in value && "headerMeta" in value && "core" in value
    );
}

export function isAccountID(id: AccountID | AgentID): id is AccountID {
    return id.startsWith("co_");
}