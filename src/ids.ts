import { AccountIDOrAgentID } from './account.js';

export type RawCoValueID = `co_z${string}` | `co_${string}_z${string}`;

export type TransactionID = { sessionID: SessionID; txIndex: number };

export type AgentID = `sealer_z${string}/signer_z${string}`;

export function isAgentID(id: string): id is AgentID {
    return typeof id === "string" && id.startsWith("sealer_") && id.includes("/signer_");
}

export type SessionID = `${AccountIDOrAgentID}_session_z${string}`;
