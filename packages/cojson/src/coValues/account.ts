import { Result, ok } from "neverthrow";
import { CoID, RawCoValue } from "../coValue.js";
import {
  CoValueCore,
  CoValueHeader,
  CoValueUniqueness,
} from "../coValueCore.js";
import {
  AgentSecret,
  CryptoProvider,
  SealerID,
  SealerSecret,
  SignerID,
  SignerSecret,
} from "../crypto/crypto.js";
import { AgentID } from "../ids.js";
import { JsonObject } from "../jsonValue.js";
import { LocalNode } from "../localNode.js";
import type { AccountRole } from "../permissions.js";
import { RawCoMap } from "./coMap.js";
import { InviteSecret, RawGroup } from "./group.js";

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

export type InvalidAccountAgentIDError = {
  type: "InvalidAccountAgentID";
  reason: string;
};

export class RawAccount<
  Meta extends AccountMeta = AccountMeta,
> extends RawGroup<Meta> {
  _cachedCurrentAgentID: AgentID | undefined;

  currentAgentID(): Result<AgentID, InvalidAccountAgentIDError> {
    if (this._cachedCurrentAgentID) {
      return ok(this._cachedCurrentAgentID);
    }
    const agents = this.keys()
      .filter((k): k is AgentID => k.startsWith("sealer_"))
      .sort(
        (a, b) =>
          (this.lastEditAt(a)?.at.getTime() || 0) -
          (this.lastEditAt(b)?.at.getTime() || 0),
      );

    if (agents.length !== 1) {
      console.warn("Account has " + agents.length + " agents", this.id);
    }

    this._cachedCurrentAgentID = agents[0];

    return ok(agents[0]!);
  }

  createInvite(_: AccountRole): InviteSecret {
    throw new Error("Cannot create invite from an account");
  }
}

export interface ControlledAccountOrAgent {
  id: RawAccountID | AgentID;
  agentSecret: AgentSecret;

  currentAgentID: () => Result<AgentID, InvalidAccountAgentIDError>;
  currentSignerID: () => Result<SignerID, InvalidAccountAgentIDError>;
  currentSignerSecret: () => SignerSecret;
  currentSealerID: () => Result<SealerID, InvalidAccountAgentIDError>;
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
  createGroup(
    uniqueness: CoValueUniqueness = this.core.crypto.createdNowUnique(),
  ) {
    return this.core.node.createGroup(uniqueness);
  }

  async acceptInvite<T extends RawCoValue>(
    groupOrOwnedValueID: CoID<T>,
    inviteSecret: InviteSecret,
  ): Promise<void> {
    return this.core.node.acceptInvite(groupOrOwnedValueID, inviteSecret);
  }

  currentAgentID(): Result<AgentID, InvalidAccountAgentIDError> {
    if (this._cachedCurrentAgentID) {
      return ok(this._cachedCurrentAgentID);
    }
    const agentID = this.crypto.getAgentID(this.agentSecret);
    this._cachedCurrentAgentID = agentID;
    return ok(agentID);
  }

  currentSignerID() {
    return this.currentAgentID().map((id) => this.crypto.getAgentSignerID(id));
  }

  currentSignerSecret(): SignerSecret {
    return this.crypto.getAgentSignerSecret(this.agentSecret);
  }

  currentSealerID() {
    return this.currentAgentID().map((id) => this.crypto.getAgentSealerID(id));
  }

  currentSealerSecret(): SealerSecret {
    return this.crypto.getAgentSealerSecret(this.agentSecret);
  }
}

export class ControlledAgent implements ControlledAccountOrAgent {
  constructor(
    public agentSecret: AgentSecret,
    public crypto: CryptoProvider,
  ) {}

  get id(): AgentID {
    return this.crypto.getAgentID(this.agentSecret);
  }

  currentAgentID() {
    return ok(this.crypto.getAgentID(this.agentSecret));
  }

  currentSignerID() {
    return this.currentAgentID().map((id) => this.crypto.getAgentSignerID(id));
  }

  currentSignerSecret(): SignerSecret {
    return this.crypto.getAgentSignerSecret(this.agentSecret);
  }

  currentSealerID() {
    return this.currentAgentID().map((id) => this.crypto.getAgentSealerID(id));
  }

  currentSealerSecret(): SealerSecret {
    return this.crypto.getAgentSealerSecret(this.agentSecret);
  }
}

export type AccountMeta = { type: "account" };
export type RawAccountID = CoID<RawAccount>;

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
