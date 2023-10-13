import type { AccountID } from "../coValues/account.js";
import type { AgentID } from "../ids.js";


export function isAccountID(id: AccountID | AgentID): id is AccountID {
    return id.startsWith("co_");
}
