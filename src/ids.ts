export type RawCoValueID = `co_z${string}` | `co_${string}_z${string}`;

export type TransactionID = { sessionID: SessionID; txIndex: number };

export type AgentID = `co_agent${string}_z${string}`;

export type SessionID = `${AgentID}_session_z${string}`;
