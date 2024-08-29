import { AgentID, SessionID } from "../ids.js";
import { RawAccountID } from "../coValues/account.js";

export function accountOrAgentIDfromSessionID(
    sessionID: SessionID,
): RawAccountID | AgentID {
    const until = sessionID.indexOf("_session");
    return sessionID.slice(0, until) as RawAccountID | AgentID;
}
