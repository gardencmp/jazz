import { base58 } from "@scure/base";
import { CoID } from "./coValue.js";
import { RawAccountID } from "./coValues/account.js";
import { shortHashLength } from "./crypto/crypto.js";
import { RawGroup } from "./exports.js";

export type RawCoID = `co_z${string}`;
export type ParentGroupReference = `parent_${CoID<RawGroup>}`;
export type ChildGroupReference = `child_${CoID<RawGroup>}`;

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

export function isParentGroupReference(
  key: string,
): key is ParentGroupReference {
  return key.startsWith("parent_");
}

export function getParentGroupId(key: ParentGroupReference): CoID<RawGroup> {
  return key.slice("parent_".length) as CoID<RawGroup>;
}

export function isChildGroupReference(key: string): key is ChildGroupReference {
  return key.startsWith("child_");
}

export function getChildGroupId(key: ChildGroupReference): CoID<RawGroup> {
  return key.slice("child_".length) as CoID<RawGroup>;
}

export function getGroupDependentKey(key: unknown) {
  if (typeof key !== "string") return undefined;

  if (isParentGroupReference(key)) {
    return getParentGroupId(key);
  } else if (key.startsWith("co_")) {
    return key as RawCoID;
  }

  return undefined;
}

export function getGroupDependentKeyList(keys: unknown[]) {
  const groupDependentKeys: RawCoID[] = [];

  for (const key of keys) {
    const value = getGroupDependentKey(key);

    if (value) {
      groupDependentKeys.push(value);
    }
  }

  return groupDependentKeys;
}
