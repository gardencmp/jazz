import { CoValueCore, newRandomSessionID } from "./coValueCore.js";
import { LocalNode } from "./node.js";
import type { CoValue, ReadableCoValue } from "./coValue.js";
import { CoMap, WriteableCoMap } from "./coValues/coMap.js";
import { CoList, WriteableCoList } from "./coValues/coList.js";
import {
    CoStream,
    WriteableCoStream,
    BinaryCoStream,
    WriteableBinaryCoStream,
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
} from "./crypto.js";
import { connectedPeers } from "./streamUtils.js";
import { AnonymousControlledAccount, ControlledAccount } from "./account.js";
import { rawCoIDtoBytes, rawCoIDfromBytes } from "./ids.js";
import { Group, expectGroupContent } from "./group.js";

import type { SessionID, AgentID } from "./ids.js";
import type { CoID, CoValueImpl } from "./coValue.js";
import type { BinaryChunkInfo, BinaryCoStreamMeta } from "./coValues/coStream.js";
import type { JsonValue } from "./jsonValue.js";
import type { SyncMessage, Peer } from "./sync.js";
import type { AgentSecret } from "./crypto.js";
import type { AccountID, Profile } from "./account.js";
import type { InviteSecret } from "./group.js";

type Value = JsonValue | CoValueImpl;

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
};

export {
    LocalNode,
    Group,
    CoMap,
    WriteableCoMap,
    CoList,
    WriteableCoList,
    CoStream,
    WriteableCoStream,
    BinaryCoStream,
    WriteableBinaryCoStream,
    CoValueCore,
    AnonymousControlledAccount,
    ControlledAccount,
};

export type {
    Value,
    JsonValue,
    CoValue,
    ReadableCoValue,
    CoValueImpl,
    CoID,
    AccountID,
    Profile,
    SessionID,
    Peer,
    BinaryChunkInfo,
    BinaryCoStreamMeta,
    AgentID,
    AgentSecret,
    InviteSecret,
    SyncMessage,
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
