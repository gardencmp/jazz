import {
    CoValueCore,
    newRandomSessionID,
    MAX_RECOMMENDED_TX_SIZE,
} from "./coValueCore.js";
import { LocalNode } from "./node.js";
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
import { AnonymousControlledAccount, ControlledAccount } from "./account.js";
import { rawCoIDtoBytes, rawCoIDfromBytes } from "./ids.js";
import { Group, expectGroupContent } from "./group.js";
import { base64URLtoBytes, bytesToBase64url } from "./base64url.js";
import { parseJSON } from "./jsonStringify.js";

import type { SessionID, AgentID } from "./ids.js";
import type { CoID, AnyCoValue } from "./coValue.js";
import type {
    Queried,
    QueriedCoMap,
    QueriedCoList,
    QueriedCoStream,
} from "./queries.js";
import type {
    BinaryStreamInfo,
    BinaryCoStreamMeta,
} from "./coValues/coStream.js";
import type { JsonValue } from "./jsonValue.js";
import type { SyncMessage, Peer } from "./sync.js";
import type { AgentSecret } from "./crypto.js";
import type { AccountID, Account, Profile } from "./account.js";
import type { InviteSecret } from "./group.js";
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
    expectGroupContent,
    base64URLtoBytes,
    bytesToBase64url,
    parseJSON,
};

export {
    LocalNode,
    Group,
    CoMap,
    MutableCoMap,
    CoList,
    MutableCoList,
    CoStream,
    MutableCoStream,
    BinaryCoStream,
    MutableBinaryCoStream,
    CoValueCore,
    AnonymousControlledAccount,
    ControlledAccount,
    cryptoReady as cojsonReady,
    MAX_RECOMMENDED_TX_SIZE,
};

export type {
    Value,
    JsonValue,
    CoValue,
    AnyCoValue,
    CoID,
    Queried,
    QueriedCoMap,
    QueriedCoList,
    QueriedCoStream,
    AccountID,
    Account,
    Profile,
    SessionID,
    Peer,
    BinaryStreamInfo,
    BinaryCoStreamMeta,
    AgentID,
    AgentSecret,
    InviteSecret,
    SyncMessage,
    Media,
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
    export type Signature = import("./crypto.js").Signature;
    export type RawCoID = import("./ids.js").RawCoID;
    export type AccountContent = import("./account.js").AccountContent;
    export type ProfileContent = import("./account.js").ProfileContent;
    export type ProfileMeta = import("./account.js").ProfileMeta;
    export type SealerSecret = import("./crypto.js").SealerSecret;
    export type SignerSecret = import("./crypto.js").SignerSecret;
}
