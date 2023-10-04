import {
    CoValueCore,
    newRandomSessionID,
    MAX_RECOMMENDED_TX_SIZE,
    accountOrAgentIDfromSessionID,
} from "./coValueCore.js";
import { LocalNode } from "./localNode.js";
import type { CoValue } from "./coValue.js";
import { CoMap, MutableCoMap } from "./coValues/coMap.js";
import { CoList, MutableCoList } from "./coValues/coList.js";
import {
    CoStream,
    MutableCoStream,
    BinaryCoStream,
    MutableBinaryCoStream,
} from "./coValues/coStream.js";
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
import {
    AnonymousControlledAccount,
    ControlledAccount,
} from "./coValues/account.js";
import type { Role } from "./permissions.js";
import { rawCoIDtoBytes, rawCoIDfromBytes } from "./ids.js";
import { Group, expectGroup, EVERYONE } from "./coValues/group.js";
import type { Everyone } from "./coValues/group.js";
import { base64URLtoBytes, bytesToBase64url } from "./base64url.js";
import { parseJSON } from "./jsonStringify.js";
import { Account, Profile } from "./coValues/account.js";
import { isAccountID } from "./typeCheckers.js";

import type { SessionID, AgentID } from "./ids.js";
import type { CoID, AnyCoValue } from "./coValue.js";
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
    AccountMigration,
    ProfileMeta,
} from "./coValues/account.js";
import type { InviteSecret } from "./coValues/group.js";
import type * as Media from "./media.js";

type Value = JsonValue | AnyCoValue;

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
};

export {
    LocalNode,
    Group,
    Role,
    EVERYONE,
    Everyone,
    CoMap,
    MutableCoMap,
    CoList,
    MutableCoList,
    CoStream,
    MutableCoStream,
    BinaryCoStream,
    MutableBinaryCoStream,
    CoValue,
    CoID,
    AnyCoValue,
    Account,
    AccountID,
    AccountMeta,
    AccountMigration,
    Profile,
    ProfileMeta,
    SessionID,
    Media,
    CoValueCore,
    AnonymousControlledAccount,
    ControlledAccount,
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
};

export type {
    Value,
}

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
    export type ProfileMeta = import("./coValues/account.js").ProfileMeta;
    export type SealerSecret = import("./crypto.js").SealerSecret;
    export type SignerSecret = import("./crypto.js").SignerSecret;
}
