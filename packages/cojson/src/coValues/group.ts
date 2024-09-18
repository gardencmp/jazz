import { CoID } from "../coValue.js";
import { RawCoMap } from "./coMap.js";
import { RawCoList } from "./coList.js";
import { JsonObject } from "../jsonValue.js";
import { RawBinaryCoStream, RawCoStream } from "./coStream.js";
import { Encrypted, KeyID, KeySecret, Sealed } from "../crypto/crypto.js";
import { AgentID, isAgentID } from "../ids.js";
import { RawAccount, AccountID, ControlledAccountOrAgent } from "./account.js";
import { Role } from "../permissions.js";
import { base58 } from "@scure/base";

export const EVERYONE = "everyone" as const;
export type Everyone = "everyone";

export type GroupShape = {
    profile: CoID<RawCoMap> | null;
    root: CoID<RawCoMap> | null;
    [key: AccountID | AgentID]: Role;
    [EVERYONE]?: Role;
    readKey?: KeyID;
    [revelationFor: `${KeyID}_for_${AccountID | AgentID}`]: Sealed<KeySecret>;
    [revelationFor: `${KeyID}_for_${Everyone}`]: KeySecret;
    [oldKeyForNewKey: `${KeyID}_for_${KeyID}`]: Encrypted<
        KeySecret,
        { encryptedID: KeyID; encryptingID: KeyID }
    >;
};

/** A `Group` is a scope for permissions of its members (`"reader" | "writer" | "admin"`), applying to objects owned by that group.
 *
 *  A `Group` object exposes methods for permission management and allows you to create new CoValues owned by that group.
 *
 *  (Internally, a `Group` is also just a `CoMap`, mapping member accounts to roles and containing some
 *  state management for making cryptographic keys available to current members)
 *
 *  @example
 *  You typically get a group from a CoValue that you already have loaded:
 *
 *  ```typescript
 *  const group = coMap.group;
 *  ```
 *
 *  @example
 *  Or, you can create a new group with a `LocalNode`:
 *
 *  ```typescript
 *  const localNode.createGroup();
 *  ```
 * */
export class RawGroup<
    Meta extends JsonObject | null = JsonObject | null,
> extends RawCoMap<GroupShape, Meta> {
    /**
     * Returns the current role of a given account.
     *
     * @category 1. Role reading
     */
    roleOf(accountID: AccountID): Role | undefined {
        return this.roleOfInternal(accountID);
    }

    /** @internal */
    roleOfInternal(accountID: AccountID | AgentID): Role | undefined {
        return this.get(accountID);
    }

    /**
     * Returns the role of the current account in the group.
     *
     * @category 1. Role reading
     */
    myRole(): Role | undefined {
        return this.roleOfInternal(this.core.node.account.id);
    }

    /**
     * Directly grants a new member a role in the group. The current account must be an
     * admin to be able to do so. Throws otherwise.
     *
     * @category 2. Role changing
     */
    addMember(
        account: RawAccount | ControlledAccountOrAgent | Everyone,
        role: Role,
    ) {
        this.addMemberInternal(account, role);
    }

    /** @internal */
    addMemberInternal(
        account: RawAccount | ControlledAccountOrAgent | AgentID | Everyone,
        role: Role,
    ) {
        const currentReadKey = this.core.getCurrentReadKey();

        if (!currentReadKey.secret) {
            throw new Error("Can't add member without read key secret");
        }

        if (account === EVERYONE) {
            if (!(role === "reader" || role === "writer")) {
                throw new Error(
                    "Can't make everyone something other than reader or writer",
                );
            }
            this.set(account, role, "trusting");

            if (this.get(account) !== role) {
                throw new Error("Failed to set role");
            }

            this.set(
                `${currentReadKey.id}_for_${EVERYONE}`,
                currentReadKey.secret,
                "trusting",
            );
        } else {
            const memberKey =
                typeof account === "string" ? account : account.id;
            const agent =
                typeof account === "string"
                    ? account
                    : account
                          .currentAgentID()
                          ._unsafeUnwrap({ withStackTrace: true });
            this.set(memberKey, role, "trusting");

            if (this.get(memberKey) !== role) {
                throw new Error("Failed to set role");
            }

            this.set(
                `${currentReadKey.id}_for_${memberKey}`,
                this.core.crypto.seal({
                    message: currentReadKey.secret,
                    from: this.core.node.account.currentSealerSecret(),
                    to: this.core.crypto.getAgentSealerID(agent),
                    nOnceMaterial: {
                        in: this.id,
                        tx: this.core.nextTransactionID(),
                    },
                }),
                "trusting",
            );
        }
    }

    /** @internal */
    rotateReadKey() {
        const currentlyPermittedReaders = this.keys().filter((key) => {
            if (key.startsWith("co_") || isAgentID(key)) {
                const role = this.get(key);
                return (
                    role === "admin" || role === "writer" || role === "reader"
                );
            } else {
                return false;
            }
        }) as (AccountID | AgentID)[];

        const maybeCurrentReadKey = this.core.getCurrentReadKey();

        if (!maybeCurrentReadKey.secret) {
            throw new Error(
                "Can't rotate read key secret we don't have access to",
            );
        }

        const currentReadKey = {
            id: maybeCurrentReadKey.id,
            secret: maybeCurrentReadKey.secret,
        };

        const newReadKey = this.core.crypto.newRandomKeySecret();

        for (const readerID of currentlyPermittedReaders) {
            const reader = this.core.node.resolveAccountAgent(
                readerID,
                "Expected to know currently permitted reader",
            )._unsafeUnwrap({ withStackTrace: true });

            this.set(
                `${newReadKey.id}_for_${readerID}`,
                this.core.crypto.seal({
                    message: newReadKey.secret,
                    from: this.core.node.account.currentSealerSecret(),
                    to: this.core.crypto.getAgentSealerID(reader),
                    nOnceMaterial: {
                        in: this.id,
                        tx: this.core.nextTransactionID(),
                    },
                }),
                "trusting",
            );
        }

        this.set(
            `${currentReadKey.id}_for_${newReadKey.id}`,
            this.core.crypto.encryptKeySecret({
                encrypting: newReadKey,
                toEncrypt: currentReadKey,
            }).encrypted,
            "trusting",
        );

        this.set("readKey", newReadKey.id, "trusting");
    }

    /**
     * Strips the specified member of all roles (preventing future writes in
     *  the group and owned values) and rotates the read encryption key for that group
     * (preventing reads of new content in the group and owned values)
     *
     * @category 2. Role changing
     */
    removeMember(account: RawAccount | ControlledAccountOrAgent | Everyone) {
        this.removeMemberInternal(account);
    }

    /** @internal */
    removeMemberInternal(
        account: RawAccount | ControlledAccountOrAgent | AgentID | Everyone,
    ) {
        const memberKey = typeof account === "string" ? account : account.id;
        this.set(memberKey, "revoked", "trusting");
        this.rotateReadKey();
    }

    /**
     * Creates an invite for new members to indirectly join the group,
     * allowing them to grant themselves the specified role with the InviteSecret
     * (a string starting with "inviteSecret_") - use `LocalNode.acceptInvite()` for this purpose.
     *
     * @category 2. Role changing
     */
    createInvite(role: "reader" | "writer" | "admin"): InviteSecret {
        const secretSeed = this.core.crypto.newRandomSecretSeed();

        const inviteSecret =
            this.core.crypto.agentSecretFromSecretSeed(secretSeed);
        const inviteID = this.core.crypto.getAgentID(inviteSecret);

        this.addMemberInternal(inviteID, `${role}Invite` as Role);

        return inviteSecretFromSecretSeed(secretSeed);
    }

    /**
     * Creates a new `CoMap` within this group, with the specified specialized
     * `CoMap` type `M` and optional static metadata.
     *
     * @category 3. Value creation
     */
    createMap<M extends RawCoMap>(
        init?: M["_shape"],
        meta?: M["headerMeta"],
        initPrivacy: "trusting" | "private" = "private",
    ): M {
        const map = this.core.node
            .createCoValue({
                type: "comap",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.id,
                },
                meta: meta || null,
                ...this.core.crypto.createdNowUnique(),
            })
            .getCurrentContent() as M;

        if (init) {
            for (const [key, value] of Object.entries(init)) {
                map.set(key, value, initPrivacy);
            }
        }

        return map;
    }

    /**
     * Creates a new `CoList` within this group, with the specified specialized
     * `CoList` type `L` and optional static metadata.
     *
     * @category 3. Value creation
     */
    createList<L extends RawCoList>(
        init?: L["_item"][],
        meta?: L["headerMeta"],
        initPrivacy: "trusting" | "private" = "private",
    ): L {
        const list = this.core.node
            .createCoValue({
                type: "colist",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.id,
                },
                meta: meta || null,
                ...this.core.crypto.createdNowUnique(),
            })
            .getCurrentContent() as L;

        if (init) {
            for (const item of init) {
                list.append(item, undefined, initPrivacy);
            }
        }

        return list;
    }

    /** @category 3. Value creation */
    createStream<C extends RawCoStream>(meta?: C["headerMeta"]): C {
        return this.core.node
            .createCoValue({
                type: "costream",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.id,
                },
                meta: meta || null,
                ...this.core.crypto.createdNowUnique(),
            })
            .getCurrentContent() as C;
    }

    /** @category 3. Value creation */
    createBinaryStream<C extends RawBinaryCoStream>(
        meta: C["headerMeta"] = { type: "binary" },
    ): C {
        return this.core.node
            .createCoValue({
                type: "costream",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.id,
                },
                meta: meta,
                ...this.core.crypto.createdNowUnique(),
            })
            .getCurrentContent() as C;
    }
}

export type InviteSecret = `inviteSecret_z${string}`;

function inviteSecretFromSecretSeed(secretSeed: Uint8Array): InviteSecret {
    return `inviteSecret_z${base58.encode(secretSeed)}`;
}

export function secretSeedFromInviteSecret(inviteSecret: InviteSecret) {
    if (!inviteSecret.startsWith("inviteSecret_z")) {
        throw new Error("Invalid invite secret");
    }

    return base58.decode(inviteSecret.slice("inviteSecret_z".length));
}
