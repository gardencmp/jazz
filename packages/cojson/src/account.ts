import { CoValueHeader } from "./coValue.js";
import { CoID } from "./contentType.js";
import {
    AgentSecret,
    SealerID,
    SealerSecret,
    SignerID,
    SignerSecret,
    getAgentID,
    getAgentSealerID,
    getAgentSealerSecret,
    getAgentSignerID,
    getAgentSignerSecret,
} from "./crypto.js";
import { AgentID } from "./ids.js";
import { CoMap, LocalNode } from "./index.js";
import { Group, GroupContent } from "./group.js";

export function accountHeaderForInitialAgentSecret(
    agentSecret: AgentSecret
): CoValueHeader {
    const agent = getAgentID(agentSecret);
    return {
        type: "comap",
        ruleset: { type: "group", initialAdmin: agent },
        meta: {
            type: "account",
        },
        createdAt: null,
        uniqueness: null,
    };
}

export class Account extends Group {
    get id(): AccountID {
        return this.groupMap.id as AccountID;
    }

    getCurrentAgentID(): AgentID {
        const agents = this.groupMap
            .keys()
            .filter((k): k is AgentID => k.startsWith("sealer_"));

        if (agents.length !== 1) {
            throw new Error(
                "Expected exactly one agent in account, got " + agents.length
            );
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

export class ControlledAccount
    extends Account
    implements GeneralizedControlledAccount
{
    agentSecret: AgentSecret;

    constructor(
        agentSecret: AgentSecret,
        groupMap: CoMap<AccountContent, AccountMeta>,
        node: LocalNode
    ) {
        super(groupMap, node);

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

export class AnonymousControlledAccount
    implements GeneralizedControlledAccount
{
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

export type AccountContent = GroupContent & { profile: CoID<Profile> };
export type AccountMeta = { type: "account" };
export type AccountID = CoID<CoMap<AccountContent, AccountMeta>>;

export type AccountIDOrAgentID = AgentID | AccountID;
export type AccountOrAgentID = AgentID | Account;
export type AccountOrAgentSecret = AgentSecret | Account;

export function isAccountID(id: AccountIDOrAgentID): id is AccountID {
    return id.startsWith("co_");
}

export type ProfileContent = {
    name: string;
};
export type ProfileMeta = { type: "profile" };
export type Profile = CoMap<ProfileContent, ProfileMeta>;
