import { CoValueHeader } from './coValue.js';
import { CoID } from './contentType.js';
import { AgentSecret, SealerID, SealerSecret, SignerID, SignerSecret, getAgentID, getAgentSealerID, getAgentSealerSecret, getAgentSignerID, getAgentSignerSecret } from './crypto.js';
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
        const agents = this.teamMap.keys().filter((k): k is AgentID => k.startsWith("sealer_"));

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
    currentSignerID: () => SignerID;
    currentSignerSecret: () => SignerSecret;
    currentSealerID: () => SealerID;
    currentSealerSecret: () => SealerSecret;
}

export class ControlledAccount extends Account implements GeneralizedControlledAccount {
    agentSecret: AgentSecret;

    constructor(agentSecret: AgentSecret, teamMap: CoMap<TeamContent, AccountMeta>, node: LocalNode) {
        super(teamMap, node);

        this.agentSecret = agentSecret;
    }

    currentAgentID(): AgentID {
        return getAgentID(this.agentSecret);
    }

    currentSignerID(): SignerID {
        return getAgentSignerID(this.currentAgentID());
    }

    currentSignerSecret(): SignerSecret {
        return getAgentSignerSecret(this.agentSecret);
    }

    currentSealerID(): SealerID {
        return getAgentSealerID(this.currentAgentID());
    }

    currentSealerSecret(): SealerSecret {
        return getAgentSealerSecret(this.agentSecret);
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

    currentSignerID(): SignerID {
        return getAgentSignerID(this.currentAgentID());
    }

    currentSignerSecret(): SignerSecret {
        return getAgentSignerSecret(this.agentSecret);
    }

    currentSealerID(): SealerID {
        return getAgentSealerID(this.currentAgentID());
    }

    currentSealerSecret(): SealerSecret {
        return getAgentSealerSecret(this.agentSecret);
    }
}

export type AccountMeta = {type: "account"};
export type AccountID = CoID<CoMap<TeamContent, AccountMeta>>;

export type AccountIDOrAgentID = AgentID | AccountID;
export type AccountOrAgentID = AgentID | Account;
export type AccountOrAgentSecret = AgentSecret | Account;
