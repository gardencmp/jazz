import { AgentID, SessionID } from "../ids.js";
import { AccountID } from "../coValues/account.js";


export function accountOrAgentIDfromSessionID(
    sessionID: SessionID
): AccountID | AgentID {
    return sessionID.split("_session")[0] as AccountID | AgentID;
}
