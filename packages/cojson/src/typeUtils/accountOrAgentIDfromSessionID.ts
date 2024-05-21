import { AgentID, SessionID } from "../ids.js";
import { AccountID } from "../coValues/account.js";

export function accountOrAgentIDfromSessionID(
    sessionID: SessionID,
): AccountID | AgentID {
    const until = sessionID.indexOf("_session");
    return sessionID.slice(0, until) as AccountID | AgentID;
}
