import { CoID, CoValue, expectMap } from "../coValue.js";
import { CoMap } from "./coMap.js";
import { CoList } from "./coList.js";
import { JsonObject } from "../jsonValue.js";
import { BinaryCoStream, CoStream } from "./coStream.js";
import {
    Encrypted,
    KeyID,
    KeySecret,
    createdNowUnique,
    newRandomKeySecret,
    seal,
    encryptKeySecret,
    getAgentSealerID,
    Sealed,
    newRandomSecretSeed,
    agentSecretFromSecretSeed,
    getAgentID,
} from "../crypto.js";
import { AgentID, isAgentID } from "../ids.js";
import { AccountID, Profile } from "./account.js";
import { Role } from "../permissions.js";
import { base58 } from "@scure/base";

export const EVERYONE = "everyone" as const;
export type Everyone = "everyone";

export type GroupShape<P extends Profile, R extends CoMap> = {
    profile?: CoID<P> | null;
    root?: CoID<R> | null;
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

export function expectGroup(content: CoValue): Group {
    const map = expectMap(content);
    if (map.core.header.ruleset.type !== "group") {
        throw new Error("Expected group ruleset in group");
    }

    if (!(map instanceof Group)) {
        throw new Error("Expected group");
    }

    return map;
}

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
export class Group<
    P extends Profile = Profile,
    R extends CoMap = CoMap,
    Meta extends JsonObject | null = JsonObject | null
> extends CoMap<GroupShape<P, R>, Meta> {
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
    addMember(accountID: AccountID | Everyone, role: Role): this {
        return this.addMemberInternal(accountID, role);
    }

    /** @internal */
    addMemberInternal(
        accountID: AccountID | AgentID | Everyone,
        role: Role
    ): this {
        return this.mutate((mutable) => {
            const currentReadKey = this.core.getCurrentReadKey();

            if (!currentReadKey.secret) {
                throw new Error("Can't add member without read key secret");
            }

            if (accountID === EVERYONE) {
                if (!(role === "reader" || role === "writer")) {
                    throw new Error(
                        "Can't make everyone something other than reader or writer"
                    );
                }
                mutable.set(accountID, role, "trusting");

                if (mutable.get(accountID) !== role) {
                    throw new Error("Failed to set role");
                }

                mutable.set(
                    `${currentReadKey.id}_for_${EVERYONE}`,
                    currentReadKey.secret,
                    "trusting"
                );
            } else {
                const agent = this.core.node.resolveAccountAgent(
                    accountID,
                    "Expected to know agent to add them to group"
                );
                mutable.set(accountID, role, "trusting");

                if (mutable.get(accountID) !== role) {
                    throw new Error("Failed to set role");
                }

                mutable.set(
                    `${currentReadKey.id}_for_${accountID}`,
                    seal({
                        message: currentReadKey.secret,
                        from: this.core.node.account.currentSealerSecret(),
                        to: getAgentSealerID(agent),
                        nOnceMaterial: {
                            in: this.id,
                            tx: this.core.nextTransactionID(),
                        },
                    }),
                    "trusting"
                );
            }
        });
    }

    /** @internal */
    rotateReadKey(): this {
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
                "Can't rotate read key secret we don't have access to"
            );
        }

        const currentReadKey = {
            id: maybeCurrentReadKey.id,
            secret: maybeCurrentReadKey.secret,
        };

        const newReadKey = newRandomKeySecret();

        return this.mutate((mutable) => {
            for (const readerID of currentlyPermittedReaders) {
                const reader = this.core.node.resolveAccountAgent(
                    readerID,
                    "Expected to know currently permitted reader"
                );

                mutable.set(
                    `${newReadKey.id}_for_${readerID}`,
                    seal({
                        message: newReadKey.secret,
                        from: this.core.node.account.currentSealerSecret(),
                        to: getAgentSealerID(reader),
                        nOnceMaterial: {
                            in: this.id,
                            tx: this.core.nextTransactionID(),
                        },
                    }),
                    "trusting"
                );
            }

            mutable.set(
                `${currentReadKey.id}_for_${newReadKey.id}`,
                encryptKeySecret({
                    encrypting: newReadKey,
                    toEncrypt: currentReadKey,
                }).encrypted,
                "trusting"
            );

            mutable.set("readKey", newReadKey.id, "trusting");
        });
    }

    /**
     * Strips the specified member of all roles (preventing future writes in
     *  the group and owned values) and rotates the read encryption key for that group
     * (preventing reads of new content in the group and owned values)
     *
     * @category 2. Role changing
     */
    removeMember(accountID: AccountID): this {
        return this.removeMemberInternal(accountID);
    }

    /** @internal */
    removeMemberInternal(accountID: AccountID | AgentID): this {
        const afterRevoke = this.mutate((map) => {
            map.set(accountID, "revoked", "trusting");
        });

        return afterRevoke.rotateReadKey();
    }

    /**
     * Creates an invite for new members to indirectly join the group,
     * allowing them to grant themselves the specified role with the InviteSecret
     * (a string starting with "inviteSecret_") - use `LocalNode.acceptInvite()` for this purpose.
     *
     * @category 2. Role changing
     */
    createInvite(role: "reader" | "writer" | "admin"): InviteSecret {
        const secretSeed = newRandomSecretSeed();

        const inviteSecret = agentSecretFromSecretSeed(secretSeed);
        const inviteID = getAgentID(inviteSecret);

        this.addMemberInternal(inviteID, `${role}Invite` as Role);

        return inviteSecretFromSecretSeed(secretSeed);
    }

    /**
     * Creates a new `CoMap` within this group, with the specified specialized
     * `CoMap` type `M` and optional static metadata.
     *
     * @category 3. Value creation
     */
    createMap<M extends CoMap>(
        init?: M["_shape"],
        meta?: M["meta"],
        initPrivacy: "trusting" | "private" = "private"
    ): M {
        let map = this.core.node
            .createCoValue({
                type: "comap",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.id,
                },
                meta: meta || null,
                ...createdNowUnique(),
            })
            .getCurrentContent() as M;

        if (init) {
            for (const [key, value] of Object.entries(init)) {
                map = map.set(key, value, initPrivacy);
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
    createList<L extends CoList>(
        init?: L["_item"][],
        meta?: L["meta"],
        initPrivacy: "trusting" | "private" = "private"
    ): L {
        let list = this.core.node
            .createCoValue({
                type: "colist",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.id,
                },
                meta: meta || null,
                ...createdNowUnique(),
            })
            .getCurrentContent() as L;

        if (init) {
            for (const item of init) {
                list = list.append(item, undefined, initPrivacy);
            }
        }

        return list;
    }

    /** @category 3. Value creation */
    createStream<C extends CoStream>(meta?: C["meta"]): C {
        return this.core.node
            .createCoValue({
                type: "costream",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.id,
                },
                meta: meta || null,
                ...createdNowUnique(),
            })
            .getCurrentContent() as C;
    }

    /** @category 3. Value creation */
    createBinaryStream<C extends BinaryCoStream>(
        meta: C["meta"] = { type: "binary" }
    ): C {
        return this.core.node
            .createCoValue({
                type: "costream",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.id,
                },
                meta: meta,
                ...createdNowUnique(),
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
