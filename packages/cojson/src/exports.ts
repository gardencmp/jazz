import {
    CoValueCore,
    type CoValueUniqueness,
    MAX_RECOMMENDED_TX_SIZE,
    idforHeader,
} from "./coValueCore.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";
import { LocalNode } from "./localNode.js";
import { type RawCoValue } from "./coValue.js";
import { RawCoMap } from "./coValues/coMap.js";
import { RawCoList } from "./coValues/coList.js";
import { RawCoStream, RawBinaryCoStream } from "./coValues/coStream.js";
import {
    secretSeedLength,
    shortHashLength,
    StreamingHash,
    CryptoProvider,
} from "./crypto/crypto.js";
import { connectedPeers, Channel } from "./streamUtils.js";
import { ControlledAgent, RawControlledAccount } from "./coValues/account.js";
import type { Role } from "./permissions.js";
import { rawCoIDtoBytes, rawCoIDfromBytes, isRawCoID } from "./ids.js";
import { RawGroup, EVERYONE } from "./coValues/group.js";
import type { Everyone } from "./coValues/group.js";
import { base64URLtoBytes, bytesToBase64url } from "./base64url.js";
import { parseJSON } from "./jsonStringify.js";
import {
    RawAccount,
    RawProfile,
    accountHeaderForInitialAgentSecret,
} from "./coValues/account.js";
import { expectGroup } from "./typeUtils/expectGroup.js";
import { isAccountID } from "./typeUtils/isAccountID.js";

import type { SessionID, AgentID } from "./ids.js";
import type { CoID, AnyRawCoValue } from "./coValue.js";
import type {
    BinaryStreamInfo,
    BinaryCoStreamMeta,
} from "./coValues/coStream.js";
import type { JsonValue } from "./jsonValue.js";
import type {
    SyncMessage,
    Peer,
    IncomingSyncStream,
    OutgoingSyncQueue,
} from "./sync.js";
import { DisconnectedError, PingTimeoutError } from "./sync.js";
import type { AgentSecret } from "./crypto/crypto.js";
import type {
    RawAccountID,
    AccountMeta,
    RawAccountMigration,
} from "./coValues/account.js";
import type { InviteSecret } from "./coValues/group.js";
import type * as Media from "./media.js";

type Value = JsonValue | AnyRawCoValue;

import { LSMStorage, BlockFilename, WalFilename } from "./storage/index.js";
import { FileSystem } from "./storage/FileSystem.js";
import { getPriorityFromHeader } from "./priority.js";

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
    LocalNode,
    RawGroup,
    Role,
    EVERYONE,
    Everyone,
    RawCoMap,
    RawCoList,
    RawCoStream,
    RawBinaryCoStream,
    RawCoValue,
    CoID,
    AnyRawCoValue,
    RawAccount,
    RawAccountID,
    AccountMeta,
    RawAccountMigration,
    RawProfile as Profile,
    SessionID,
    Media,
    CoValueCore,
    ControlledAgent,
    RawControlledAccount,
    MAX_RECOMMENDED_TX_SIZE,
    JsonValue,
    Peer,
    BinaryStreamInfo,
    BinaryCoStreamMeta,
    AgentID,
    AgentSecret,
    InviteSecret,
    CryptoProvider,
    SyncMessage,
    isRawCoID,
    LSMStorage,
};

export type {
    Value,
    FileSystem,
    BlockFilename,
    WalFilename,
    IncomingSyncStream,
    OutgoingSyncQueue,
    DisconnectedError,
    PingTimeoutError,
    CoValueUniqueness,
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
