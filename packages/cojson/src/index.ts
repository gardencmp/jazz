import {
    CoValueCore,
    newRandomSessionID,
    MAX_RECOMMENDED_TX_SIZE,
    idforHeader,
} from "./coValueCore.js";
import { accountOrAgentIDfromSessionID } from "./typeUtils/accountOrAgentIDfromSessionID.js";
import { LocalNode } from "./localNode.js";
import type { RawCoValue } from "./coValue.js";
import { RawCoMap } from "./coValues/coMap.js";
import { RawCoList } from "./coValues/coList.js";
import { RawCoPlainText, stringifyOpID } from "./coValues/coPlainText.js";
import { RawCoStream, RawBinaryCoStream } from "./coValues/coStream.js";
import {
    agentSecretFromBytes,
    agentSecretToBytes,
    getAgentID,
    newRandomAgentSecret,
    newRandomSecretSeed,
    agentSecretFromSecretSeed,
    secretSeedLength,
    shortHashLength,
    cryptoReady,
} from "./crypto.js";
import { connectedPeers } from "./streamUtils.js";
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
import type { SyncMessage, Peer } from "./sync.js";
import type { AgentSecret } from "./crypto.js";
import type {
    AccountID,
    AccountMeta,
    RawAccountMigration,
} from "./coValues/account.js";
import type { InviteSecret } from "./coValues/group.js";
import type * as Media from "./media.js";

type Value = JsonValue | AnyRawCoValue;

/** @hidden */
export const cojsonInternals = {
    agentSecretFromBytes,
    agentSecretToBytes,
    newRandomSessionID,
    newRandomAgentSecret,
    connectedPeers,
    getAgentID,
    rawCoIDtoBytes,
    rawCoIDfromBytes,
    newRandomSecretSeed,
    agentSecretFromSecretSeed,
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
};

export {
    LocalNode,
    RawGroup,
    Role,
    EVERYONE,
    Everyone,
    RawCoMap,
    RawCoList,
    RawCoPlainText,
    RawCoStream,
    RawBinaryCoStream,
    RawCoValue,
    CoID,
    AnyRawCoValue,
    RawAccount,
    AccountID,
    AccountMeta,
    RawAccountMigration,
    RawProfile as Profile,
    SessionID,
    Media,
    CoValueCore,
    ControlledAgent,
    RawControlledAccount,
    cryptoReady as cojsonReady,
    MAX_RECOMMENDED_TX_SIZE,
    JsonValue,
    Peer,
    BinaryStreamInfo,
    BinaryCoStreamMeta,
    AgentID,
    AgentSecret,
    InviteSecret,
    SyncMessage,
    isRawCoID,
    stringifyOpID
};

export type { Value };

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
    export type Signature = import("./crypto.js").Signature;
    export type RawCoID = import("./ids.js").RawCoID;
    export type ProfileShape = import("./coValues/account.js").ProfileShape;
    export type SealerSecret = import("./crypto.js").SealerSecret;
    export type SignerSecret = import("./crypto.js").SignerSecret;
    export type JsonObject = import("./jsonValue.js").JsonObject;
    export type OpID = import("./coValues/coList.js").OpID;
}
