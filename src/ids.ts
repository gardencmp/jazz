import { AccountIDOrAgentID } from './account.js';

export type RawCoValueID = `co_z${string}` | `co_${string}_z${string}`;

export type TransactionID = { sessionID: SessionID; txIndex: number };

export type AgentID = `recipient_z${string}/signatory_z${string}`;

export function isAgentID(id: string): id is AgentID {
    return typeof id === "string" && id.startsWith("recipient_") && id.includes("/signatory_");
}

export type SessionID = `${AccountIDOrAgentID}_session_z${string}`;
