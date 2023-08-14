import { CoValueHeader } from './coValue.js';
import { CoValueID } from './contentType.js';
import { AgentSecret, RecipientID, RecipientSecret, SignatoryID, SignatorySecret, getAgentID, getAgentRecipientID, getAgentRecipientSecret, getAgentSignatoryID, getAgentSignatorySecret } from './crypto.js';
import { AgentID } from './ids.js';
import { CoMap, LocalNode } from './index.js';
import { Team, TeamContent } from './permissions.js';

export function accountHeaderForInitialAgentSecret(agentSecret: AgentSecret): CoValueHeader {
    const agent = getAgentID(agentSecret);
    return {
        type: "comap",
        ruleset: {type: "team", initialAdmin: agent},
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

    getCurrentAgentID(): AgentID {
        const agents = this.teamMap.keys().filter((k): k is AgentID => k.startsWith("recipient_"));

        if (agents.length !== 1) {
            throw new Error("Expected exactly one agent in account, got " + agents.length);
        }

        return agents[0]!;
    }
}

export interface GeneralizedControlledAccount {
    id: AccountIDOrAgentID;
    agentSecret: AgentSecret;

    currentAgentID: () => AgentID;
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

    currentAgentID(): AgentID {
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

    get id(): AgentID {
        return getAgentID(this.agentSecret);
    }

    currentAgentID(): AgentID {
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

export type AccountIDOrAgentID = AgentID | AccountID;
export type AccountOrAgentID = AgentID | Account;
export type AccountOrAgentSecret = AgentSecret | Account;
