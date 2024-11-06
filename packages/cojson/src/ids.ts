import { base58 } from "@scure/base";
import { RawAccountID } from "./coValues/account.js";
import { shortHashLength } from "./crypto/crypto.js";

export type RawCoID = `co_z${string}`;

export function isRawCoID(id: unknown): id is RawCoID {
  return typeof id === "string" && id.startsWith("co_z");
}

export function rawCoIDtoBytes(id: RawCoID): Uint8Array {
  return base58.decode(id.substring("co_z".length));
}

export function rawCoIDfromBytes(bytes: Uint8Array): RawCoID {
  return `co_z${base58.encode(bytes.slice(0, shortHashLength))}` as RawCoID;
}

export type TransactionID = { sessionID: SessionID; txIndex: number };

export type AgentID = `sealer_z${string}/signer_z${string}`;

export function isAgentID(id: string): id is AgentID {
  return (
    typeof id === "string" &&
    id.startsWith("sealer_") &&
    id.includes("/signer_")
  );
}

export type SessionID = `${RawAccountID | AgentID}_session_z${string}`;
