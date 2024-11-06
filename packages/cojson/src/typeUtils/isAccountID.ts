import type { RawAccountID } from "../coValues/account.js";
import type { AgentID } from "../ids.js";

export function isAccountID(id: RawAccountID | AgentID): id is RawAccountID {
  return id.startsWith("co_");
}
