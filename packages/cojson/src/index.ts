import { CoValue, newRandomSessionID } from "./coValue.js";
import { LocalNode } from "./node.js";
import { CoMap } from "./contentTypes/coMap.js";
import {
    agentSecretFromBytes,
    agentSecretToBytes,
    getAgentID,
    newRandomAgentSecret,
} from "./crypto.js";
import { connectedPeers } from "./streamUtils.js";
import { AnonymousControlledAccount, ControlledAccount } from "./account.js";

import type { SessionID, AgentID } from "./ids.js";
import type { CoID, ContentType } from "./contentType.js";
import type { JsonValue } from "./jsonValue.js";
import type { SyncMessage } from "./sync.js";
import type { AgentSecret } from "./crypto.js";

type Value = JsonValue | ContentType;

export const cojsonInternals = {
    agentSecretFromBytes,
    agentSecretToBytes,
    newRandomSessionID,
    newRandomAgentSecret,
    connectedPeers,
    getAgentID,
};

export {
    LocalNode,
    CoValue,
    CoMap,
    cojsonInternals as internals,
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
};

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
