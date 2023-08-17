import { CoValue, newRandomSessionID } from "./coValue.js";
import { LocalNode } from "./node.js";
import { CoMap } from "./contentTypes/coMap.js";
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

import type { SessionID, AgentID } from "./ids.js";
import type { CoID, ContentType } from "./contentType.js";
import type { JsonValue } from "./jsonValue.js";
import type { SyncMessage, Peer } from "./sync.js";
import type { AgentSecret } from "./crypto.js";
import type { AccountID } from "./account.js";

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
};

export {
    LocalNode,
    CoValue,
    CoMap,
    AnonymousControlledAccount,
    ControlledAccount,
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
    Peer
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
    export type AccountIDOrAgentID = import("./account.js").AccountIDOrAgentID;
}
