import {
    CoValue,
    agentCredentialFromBytes,
    agentCredentialToBytes,
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from './coValue.js';
import { LocalNode } from './node.js';
import { CoMap } from './contentTypes/coMap.js';

import type { AgentCredential } from './coValue.js';
import type { AgentID, SessionID } from './ids.js';
import type { CoValueID, ContentType } from './contentType.js';
import type { JsonValue } from './jsonValue.js';
import type { SyncMessage } from './sync.js';

type Value = JsonValue | ContentType;

const internals = {
    agentCredentialToBytes,
    agentCredentialFromBytes,
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
};

export { LocalNode, CoValue, CoMap, internals };

export type {
    Value,
    JsonValue,
    ContentType,
    CoValueID,
    AgentCredential,
    SessionID,
    AgentID,
    SyncMessage
};
