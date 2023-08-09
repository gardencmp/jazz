import type { CoValueID, ContentType } from "./contentType";
import type { JsonValue } from "./jsonValue";
import {
    CoValue,
    agentCredentialFromBytes,
    agentCredentialToBytes,
    getAgent,
    getAgentID,
    newRandomAgentCredential,
    newRandomSessionID,
} from "./coValue";
import { LocalNode } from "./node";
import { CoMap } from "./contentTypes/coMap";

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

export type { Value, JsonValue, ContentType, CoValueID };
