import { CoValue, newRandomSessionID } from "./coValue.js";
import { LocalNode } from "./node.js";
import { CoMap } from "./contentTypes/coMap.js";
import { CoList } from "./contentTypes/coList.js";
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
import { Group, expectGroupContent } from "./group.js"

import type { SessionID, AgentID } from "./ids.js";
import type { CoID, ContentType } from "./contentType.js";
import type { JsonValue } from "./jsonValue.js";
import type { SyncMessage, Peer } from "./sync.js";
import type { AgentSecret } from "./crypto.js";
import type {
    AccountID,
    AccountContent,
    ProfileContent,
    ProfileMeta,
    Profile,
} from "./account.js";
import type { InviteSecret } from "./group.js";

type Value = JsonValue | ContentType;

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
    expectGroupContent
};

export {
    LocalNode,
    CoValue,
    CoMap,
    CoList,
    AnonymousControlledAccount,
    ControlledAccount,
    Group
};

export type {
    Value,
    JsonValue,
    ContentType,
    CoID,
    AgentSecret,
    SessionID,
    SyncMessage,
    AgentID,
    AccountID,
    Peer,
    AccountContent,
    Profile,
    ProfileContent,
    ProfileMeta,
    InviteSecret
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CojsonInternalTypes {
    export type CoValueKnownState = import("./sync.js").CoValueKnownState;
    export type DoneMessage = import("./sync.js").DoneMessage;
    export type KnownStateMessage = import("./sync.js").KnownStateMessage;
    export type LoadMessage = import("./sync.js").LoadMessage;
    export type NewContentMessage = import("./sync.js").NewContentMessage;
    export type CoValueHeader = import("./coValue.js").CoValueHeader;
    export type Transaction = import("./coValue.js").Transaction;
    export type Signature = import("./crypto.js").Signature;
    export type RawCoID = import("./ids.js").RawCoID;
}
