import { CoValueHeader } from './coValue.js';
import { CoValueID } from './contentType.js';
import { AgentSecret, RecipientID, RecipientSecret, SignatoryID, SignatorySecret, getAgentID, getAgentRecipientID, getAgentRecipientSecret, getAgentSignatoryID, getAgentSignatorySecret } from './crypto.js';
import { RawAgentID } from './ids.js';
import { CoMap, LocalNode } from './index.js';
import { Team, TeamContent } from './permissions.js';

export function accountHeaderForInitialAgentSecret(agentSecret: AgentSecret): CoValueHeader {
    const rawAgentID = getAgentID(agentSecret);
    return {
        type: "comap",
        ruleset: {type: "team", initialAdmin: rawAgentID},
        meta: {
            type: "account"
        },
        createdAt: null,
        uniqueness: null,
    }
}

export class Account extends Team {
    get id(): AccountID {
        return this.teamMap.id;
    }

    getCurrentAgentID(): RawAgentID {
        const agents = this.teamMap.keys().filter((k): k is RawAgentID => k.startsWith("recipient_"));

        if (agents.length !== 1) {
            throw new Error("Expected exactly one agent in account, got " + agents.length);
        }

        return agents[0]!;
    }
}

export interface GeneralizedControlledAccount {
    id: AccountIDOrAgentID;
    agentSecret: AgentSecret;

    currentAgentID: () => RawAgentID;
    currentSignatoryID: () => SignatoryID;
    currentSignatorySecret: () => SignatorySecret;
    currentRecipientID: () => RecipientID;
    currentRecipientSecret: () => RecipientSecret;
}

export class ControlledAccount extends Account implements GeneralizedControlledAccount {
    agentSecret: AgentSecret;

    constructor(agentSecret: AgentSecret, teamMap: CoMap<TeamContent, {}>, node: LocalNode) {
        super(teamMap, node);

        this.agentSecret = agentSecret;
    }

    currentAgentID(): RawAgentID {
        return getAgentID(this.agentSecret);
    }

    currentSignatoryID(): SignatoryID {
        return getAgentSignatoryID(this.currentAgentID());
    }

    currentSignatorySecret(): SignatorySecret {
        return getAgentSignatorySecret(this.agentSecret);
    }

    currentRecipientID(): RecipientID {
        return getAgentRecipientID(this.currentAgentID());
    }

    currentRecipientSecret(): RecipientSecret {
        return getAgentRecipientSecret(this.agentSecret);
    }
}

export class AnonymousControlledAccount implements GeneralizedControlledAccount {
    agentSecret: AgentSecret;

    constructor(agentSecret: AgentSecret) {
        this.agentSecret = agentSecret;
    }

    get id(): RawAgentID {
        return getAgentID(this.agentSecret);
    }

    currentAgentID(): RawAgentID {
        return getAgentID(this.agentSecret);
    }

    currentSignatoryID(): SignatoryID {
        return getAgentSignatoryID(this.currentAgentID());
    }

    currentSignatorySecret(): SignatorySecret {
        return getAgentSignatorySecret(this.agentSecret);
    }

    currentRecipientID(): RecipientID {
        return getAgentRecipientID(this.currentAgentID());
    }

    currentRecipientSecret(): RecipientSecret {
        return getAgentRecipientSecret(this.agentSecret);
    }
}

export type AccountMeta = {type: "account"};
export type AccountID = CoValueID<CoMap<TeamContent, AccountMeta>>;

export type AccountIDOrAgentID = RawAgentID | AccountID;
export type AccountOrAgentID = RawAgentID | Account;
export type AccountOrAgentSecret = AgentSecret | Account;
