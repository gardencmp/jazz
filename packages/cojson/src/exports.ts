import { base64URLtoBytes, bytesToBase64url } from "./base64url.js";
import { type RawCoValue } from "./coValue.js";
import {
  CoValueCore,
  type CoValueUniqueness,
  MAX_RECOMMENDED_TX_SIZE,
  idforHeader,
} from "./coValueCore.js";
import {
  ControlledAgent,
  RawAccount,
  RawControlledAccount,
  RawProfile,
  accountHeaderForInitialAgentSecret,
} from "./coValues/account.js";
import { OpID, RawCoList } from "./coValues/coList.js";
import { RawCoMap } from "./coValues/coMap.js";
import { RawCoPlainText, stringifyOpID } from "./coValues/coPlainText.js";
import { RawBinaryCoStream, RawCoStream } from "./coValues/coStream.js";
import type { Everyone } from "./coValues/group.js";
import { EVERYONE, RawGroup } from "./coValues/group.js";
import {
  CryptoProvider,
  StreamingHash,
  secretSeedLength,
  shortHashLength,
} from "./crypto/crypto.js";
import { isRawCoID, rawCoIDfromBytes, rawCoIDtoBytes } from "./ids.js";
import { parseJSON } from "./jsonStringify.js";
import { LocalNode } from "./localNode.js";
import type { Role } from "./permissions.js";
import { Channel, connectedPeers } from "./streamUtils.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";
import { expectGroup } from "./typeUtils/expectGroup.js";
import { isAccountID } from "./typeUtils/isAccountID.js";

import type { AnyRawCoValue, CoID } from "./coValue.js";
import type {
  AccountMeta,
  RawAccountID,
  RawAccountMigration,
} from "./coValues/account.js";
import type {
  BinaryCoStreamMeta,
  BinaryStreamInfo,
} from "./coValues/coStream.js";
import type { InviteSecret } from "./coValues/group.js";
import type { AgentSecret } from "./crypto/crypto.js";
import type { AgentID, SessionID } from "./ids.js";
import type { JsonValue } from "./jsonValue.js";
import type * as Media from "./media.js";
import type {
  IncomingSyncStream,
  OutgoingSyncQueue,
  Peer,
  SyncMessage,
} from "./sync.js";
import { DisconnectedError, PingTimeoutError } from "./sync.js";

type Value = JsonValue | AnyRawCoValue;

import { getPriorityFromHeader } from "./priority.js";
import { FileSystem } from "./storage/FileSystem.js";
import { BlockFilename, LSMStorage, WalFilename } from "./storage/index.js";

/** @hidden */
export const cojsonInternals = {
  connectedPeers,
  rawCoIDtoBytes,
  rawCoIDfromBytes,
  secretSeedLength,
  shortHashLength,
  expectGroup,
  base64URLtoBytes,
  bytesToBase64url,
  parseJSON,
  accountOrAgentIDfromSessionID,
  isAccountID,
  accountHeaderForInitialAgentSecret,
  idforHeader,
  StreamingHash,
  Channel,
  getPriorityFromHeader,
};

export {
  AccountMeta,
  AgentID,
  AgentSecret,
  AnyRawCoValue,
  BinaryCoStreamMeta,
  BinaryStreamInfo,
  CoID,
  CoValueCore,
  ControlledAgent,
  CryptoProvider,
  EVERYONE,
  Everyone,
  InviteSecret,
  JsonValue,
  LSMStorage,
  LocalNode,
  MAX_RECOMMENDED_TX_SIZE,
  Media,
  Peer,
  RawProfile as Profile,
  RawAccount,
  RawAccountID,
  RawAccountMigration,
  RawBinaryCoStream,
  RawCoList,
  RawCoMap,
  RawCoPlainText,
  RawCoStream,
  RawCoValue,
  RawControlledAccount,
  RawGroup,
  Role,
  SessionID,
  SyncMessage,
  isRawCoID,
  stringifyOpID,
};

export type {
  BlockFilename,
  CoValueUniqueness,
  DisconnectedError,
  FileSystem,
  IncomingSyncStream,
  OpID,
  OutgoingSyncQueue,
  PingTimeoutError,
  Value,
  WalFilename,
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CojsonInternalTypes {
  export type CoValueKnownState = import("./sync.js").CoValueKnownState;
  export type DoneMessage = import("./sync.js").DoneMessage;
  export type KnownStateMessage = import("./sync.js").KnownStateMessage;
  export type LoadMessage = import("./sync.js").LoadMessage;
  export type NewContentMessage = import("./sync.js").NewContentMessage;
  export type CoValueHeader = import("./coValueCore.js").CoValueHeader;
  export type Transaction = import("./coValueCore.js").Transaction;
  export type TransactionID = import("./ids.js").TransactionID;
  export type Signature = import("./crypto/crypto.js").Signature;
  export type RawCoID = import("./ids.js").RawCoID;
  export type ProfileShape = import("./coValues/account.js").ProfileShape;
  export type SealerSecret = import("./crypto/crypto.js").SealerSecret;
  export type SignerSecret = import("./crypto/crypto.js").SignerSecret;
  export type JsonObject = import("./jsonValue.js").JsonObject;
}
