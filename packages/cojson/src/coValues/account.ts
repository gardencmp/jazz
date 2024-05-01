import { CoValueCore, CoValueHeader } from "../coValueCore.js";
import { CoID, RawCoValue } from "../coValue.js";
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
} from "../crypto.js";
import { AgentID } from "../ids.js";
import { RawCoMap } from "./coMap.js";
import { RawGroup, InviteSecret } from "./group.js";
import { LocalNode } from "../index.js";
import { JsonObject } from "../jsonValue.js";

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

export class RawAccount<
    Meta extends AccountMeta = AccountMeta,
> extends RawGroup<Meta> {
    currentAgentID(): AgentID {
        const agents = this.keys().filter((k): k is AgentID =>
            k.startsWith("sealer_")
        );

        if (agents.length !== 1) {
            throw new Error(
                "Expected exactly one agent in account, got " + agents.length
            );
        }

        return agents[0]!;
    }
}

export interface ControlledAccountOrAgent {
    id: AccountID | AgentID;
    agentSecret: AgentSecret;

    currentAgentID: () => AgentID;
    currentSignerID: () => SignerID;
    currentSignerSecret: () => SignerSecret;
    currentSealerID: () => SealerID;
    currentSealerSecret: () => SealerSecret;
}

/** @hidden */
export class RawControlledAccount<Meta extends AccountMeta = AccountMeta>
    extends RawAccount<Meta>
    implements ControlledAccountOrAgent
{
    agentSecret: AgentSecret;

    constructor(core: CoValueCore, agentSecret: AgentSecret) {
        super(core);

        this.agentSecret = agentSecret;
    }

    /**
     * Creates a new group (with the current account as the group's first admin).
     * @category 1. High-level
     */
    createGroup() {
        return this.core.node.createGroup();
    }

    async acceptInvite<T extends RawCoValue>(
        groupOrOwnedValueID: CoID<T>,
        inviteSecret: InviteSecret
    ): Promise<void> {
        return this.core.node.acceptInvite(groupOrOwnedValueID, inviteSecret);
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
export class ControlledAgent implements ControlledAccountOrAgent {
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

export type AccountMeta = { type: "account" };
export type AccountID = CoID<RawAccount>;

export type ProfileShape = {
    name: string;
};

export class RawProfile<
    Shape extends ProfileShape = ProfileShape,
    Meta extends JsonObject | null = JsonObject | null,
> extends RawCoMap<Shape, Meta> {}

export type RawAccountMigration<Meta extends AccountMeta = AccountMeta> = (
    account: RawControlledAccount<Meta>,
    localNode: LocalNode,
    creationProps?: { name: string }
) => void | Promise<void>;
