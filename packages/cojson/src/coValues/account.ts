import { CoValueCore, CoValueHeader } from "../coValueCore.js";
import { CoID, RawCoValue } from "../coValue.js";
import {
    AgentSecret,
    CryptoProvider,
    SealerID,
    SealerSecret,
    SignerID,
    SignerSecret,
} from "../crypto/crypto.js";
import { AgentID } from "../ids.js";
import { RawCoMap } from "./coMap.js";
import { RawGroup, InviteSecret } from "./group.js";
import { LocalNode } from "../index.js";
import { JsonObject } from "../jsonValue.js";

export function accountHeaderForInitialAgentSecret(
    agentSecret: AgentSecret,
    crypto: CryptoProvider,
): CoValueHeader {
    const agent = crypto.getAgentID(agentSecret);
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
    _cachedCurrentAgentID: AgentID | undefined;

    currentAgentID(): AgentID {
        if (this._cachedCurrentAgentID) {
            return this._cachedCurrentAgentID;
        }
        const agents = this.keys().filter((k): k is AgentID =>
            k.startsWith("sealer_"),
        );

        if (agents.length !== 1) {
            throw new Error(
                "Expected exactly one agent in account, got " + agents.length,
            );
        }

        this._cachedCurrentAgentID = agents[0];

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
    crypto: CryptoProvider;

    constructor(core: CoValueCore, agentSecret: AgentSecret) {
        super(core);

        this.agentSecret = agentSecret;
        this.crypto = core.node.crypto;
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
        inviteSecret: InviteSecret,
    ): Promise<void> {
        return this.core.node.acceptInvite(groupOrOwnedValueID, inviteSecret);
    }

    currentAgentID(): AgentID {
        return this.crypto.getAgentID(this.agentSecret);
    }

    currentSignerID(): SignerID {
        return this.crypto.getAgentSignerID(this.currentAgentID());
    }

    currentSignerSecret(): SignerSecret {
        return this.crypto.getAgentSignerSecret(this.agentSecret);
    }

    currentSealerID(): SealerID {
        return this.crypto.getAgentSealerID(this.currentAgentID());
    }

    currentSealerSecret(): SealerSecret {
        return this.crypto.getAgentSealerSecret(this.agentSecret);
    }
}

/** @hidden */
export class ControlledAgent implements ControlledAccountOrAgent {
    constructor(
        public agentSecret: AgentSecret,
        public crypto: CryptoProvider,
    ) {}

    get id(): AgentID {
        return this.crypto.getAgentID(this.agentSecret);
    }

    currentAgentID(): AgentID {
        return this.crypto.getAgentID(this.agentSecret);
    }

    currentSignerID(): SignerID {
        return this.crypto.getAgentSignerID(this.currentAgentID());
    }

    currentSignerSecret(): SignerSecret {
        return this.crypto.getAgentSignerSecret(this.agentSecret);
    }

    currentSealerID(): SealerID {
        return this.crypto.getAgentSealerID(this.currentAgentID());
    }

    currentSealerSecret(): SealerSecret {
        return this.crypto.getAgentSealerSecret(this.agentSecret);
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
    creationProps?: { name: string },
) => void | Promise<void>;
