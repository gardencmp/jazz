import { AccountIDOrAgentID } from './account.js';

export type RawCoValueID = `co_z${string}` | `co_${string}_z${string}`;

export type TransactionID = { sessionID: SessionID; txIndex: number };

export type RawAgentID = `recipient_z${string}/signatory_z${string}`;

export function isRawAgentID(id: string): id is RawAgentID {
    return typeof id === "string" && id.startsWith("recipient_") && id.includes("/signatory_");
}

export type SessionID = `${AccountIDOrAgentID}_session_z${string}`;
