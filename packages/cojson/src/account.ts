import { CoValueHeader } from "./coValueCore.js";
import { CoID } from "./coValue.js";
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
import { CoMap } from "./coValues/coMap.js";
import { LocalNode } from "./node.js";
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

export class AccountGroup extends Group {
    get id(): AccountID {
        return this.underlyingMap.id as AccountID;
    }

    getCurrentAgentID(): AgentID {
        const agents = this.underlyingMap
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
    id: AccountID | AgentID;
    agentSecret: AgentSecret;

    currentAgentID: () => AgentID;
    currentSignerID: () => SignerID;
    currentSignerSecret: () => SignerSecret;
    currentSealerID: () => SealerID;
    currentSealerSecret: () => SealerSecret;
}

/** @hidden */
export class ControlledAccount
    extends AccountGroup
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

/** @hidden */
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

export type AccountContent = { profile: Profile } & GroupContent;
export type AccountMeta = { type: "account" };
export type Account = CoMap<AccountContent, AccountMeta>;
export type AccountID = CoID<Account>;

export function isAccountID(id: AccountID | AgentID): id is AccountID {
    return id.startsWith("co_");
}

export type ProfileContent = {
    name: string;
};
export type ProfileMeta = { type: "profile" };
export type Profile = CoMap<ProfileContent, ProfileMeta>;
