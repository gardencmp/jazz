import { CoID, CoValue, AnyCoValue } from "./coValue.js";
import { CoMap } from "./coValues/coMap.js";
import { JsonObject, JsonValue } from "./jsonValue.js";
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
} from "./crypto.js";
import { LocalNode } from "./node.js";
import { AgentID, SessionID, isAgentID } from "./ids.js";
import { AccountID, GeneralizedControlledAccount, Profile } from "./account.js";
import { Role } from "./permissions.js";
import { base58 } from "@scure/base";
import { CoList } from "./coValues/coList.js";
import {
    BinaryCoStream,
    BinaryCoStreamMeta,
    CoStream,
} from "./coValues/coStream.js";

export type GroupContent = {
    profile: CoID<Profile> | null;
    [key: AccountID | AgentID]: Role;
    readKey: KeyID;
    [revelationFor: `${KeyID}_for_${AccountID | AgentID}`]: Sealed<KeySecret>;
    [oldKeyForNewKey: `${KeyID}_for_${KeyID}`]: Encrypted<
        KeySecret,
        { encryptedID: KeyID; encryptingID: KeyID }
    >;
};

export function expectGroupContent(
    content: CoValue
): CoMap<GroupContent, JsonObject | null> {
    if (content.type !== "comap") {
        throw new Error("Expected map");
    }

    return content as CoMap<GroupContent, JsonObject | null>;
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
export class Group {
    underlyingMap: CoMap<GroupContent, JsonObject | null>;
    /** @internal */
    node: LocalNode;

    /** @internal */
    constructor(
        underlyingMap: CoMap<GroupContent, JsonObject | null>,
        node: LocalNode
    ) {
        this.underlyingMap = underlyingMap;
        this.node = node;
    }

    /** Returns the `CoID` of the `Group`. */
    get id(): CoID<CoMap<GroupContent, JsonObject | null>> {
        return this.underlyingMap.id;
    }

    /** Returns the current role of a given account. */
    roleOf(accountID: AccountID): Role | undefined {
        return this.roleOfInternal(accountID);
    }

    /** @internal */
    roleOfInternal(accountID: AccountID | AgentID): Role | undefined {
        return this.underlyingMap.get(accountID);
    }

    /** Returns the role of the current account in the group. */
    myRole(): Role | undefined {
        return this.roleOfInternal(this.node.account.id);
    }

    /** Directly grants a new member a role in the group. The current account must be an
     * admin to be able to do so. Throws otherwise. */
    addMember(accountID: AccountID, role: Role) {
        this.addMemberInternal(accountID, role);
    }

    /** @internal */
    addMemberInternal(accountID: AccountID | AgentID, role: Role) {
        this.underlyingMap = this.underlyingMap.edit((map) => {
            const currentReadKey = this.underlyingMap.core.getCurrentReadKey();

            if (!currentReadKey.secret) {
                throw new Error("Can't add member without read key secret");
            }

            const agent = this.node.resolveAccountAgent(
                accountID,
                "Expected to know agent to add them to group"
            );

            map.set(accountID, role, "trusting");

            if (map.get(accountID) !== role) {
                throw new Error("Failed to set role");
            }

            map.set(
                `${currentReadKey.id}_for_${accountID}`,
                seal(
                    currentReadKey.secret,
                    this.underlyingMap.core.node.account.currentSealerSecret(),
                    getAgentSealerID(agent),
                    {
                        in: this.underlyingMap.core.id,
                        tx: this.underlyingMap.core.nextTransactionID(),
                    }
                ),
                "trusting"
            );
        });
    }

    /** @internal */
    rotateReadKey() {
        const currentlyPermittedReaders = this.underlyingMap
            .keys()
            .filter((key) => {
                if (key.startsWith("co_") || isAgentID(key)) {
                    const role = this.underlyingMap.get(key);
                    return (
                        role === "admin" ||
                        role === "writer" ||
                        role === "reader"
                    );
                } else {
                    return false;
                }
            }) as (AccountID | AgentID)[];

        const maybeCurrentReadKey = this.underlyingMap.core.getCurrentReadKey();

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

        this.underlyingMap = this.underlyingMap.edit((map) => {
            for (const readerID of currentlyPermittedReaders) {
                const reader = this.node.resolveAccountAgent(
                    readerID,
                    "Expected to know currently permitted reader"
                );

                map.set(
                    `${newReadKey.id}_for_${readerID}`,
                    seal(
                        newReadKey.secret,
                        this.underlyingMap.core.node.account.currentSealerSecret(),
                        getAgentSealerID(reader),
                        {
                            in: this.underlyingMap.core.id,
                            tx: this.underlyingMap.core.nextTransactionID(),
                        }
                    ),
                    "trusting"
                );
            }

            map.set(
                `${currentReadKey.id}_for_${newReadKey.id}`,
                encryptKeySecret({
                    encrypting: newReadKey,
                    toEncrypt: currentReadKey,
                }).encrypted,
                "trusting"
            );

            map.set("readKey", newReadKey.id, "trusting");
        });
    }

    /** Strips the specified member of all roles (preventing future writes in
     *  the group and owned values) and rotates the read encryption key for that group
     * (preventing reads of new content in the group and owned values) */
    removeMember(accountID: AccountID) {
        this.removeMemberInternal(accountID);
    }

    /** @internal */
    removeMemberInternal(accountID: AccountID | AgentID) {
        this.underlyingMap = this.underlyingMap.edit((map) => {
            map.set(accountID, "revoked", "trusting");
        });

        this.rotateReadKey();
    }

    /** Creates an invite for new members to indirectly join the group, allowing them to grant themselves the specified role with the InviteSecret (a string starting with "inviteSecret_") - use `LocalNode.acceptInvite()` for this purpose. */
    createInvite(role: "reader" | "writer" | "admin"): InviteSecret {
        const secretSeed = newRandomSecretSeed();

        const inviteSecret = agentSecretFromSecretSeed(secretSeed);
        const inviteID = getAgentID(inviteSecret);

        this.addMemberInternal(inviteID, `${role}Invite` as Role);

        return inviteSecretFromSecretSeed(secretSeed);
    }

    /** Creates a new `CoMap` within this group, with the specified specialized
     *  `CoMap` type `M` and optional static metadata. */
    createMap<
        M extends CoMap<
            { [key: string]: JsonValue | AnyCoValue | undefined },
            JsonObject | null
        >
    >(
        init?: M extends CoMap<infer M, infer _Meta>
            ? {
                  [K in keyof M]: M[K] extends AnyCoValue
                      ? M[K] | CoID<M[K]>
                      : M[K];
              }
            : never,
        meta?: M["meta"]
    ): M {
        let map = this.node
            .createCoValue({
                type: "comap",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.underlyingMap.id,
                },
                meta: meta || null,
                ...createdNowUnique(),
            })
            .getCurrentContent() as M;

        if (init) {
            map = map.edit((editable) => {
                for (const [key, value] of Object.entries(init)) {
                    editable.set(key, value);
                }
            });
        }

        return map;
    }

    /** Creates a new `CoList` within this group, with the specified specialized
     * `CoList` type `L` and optional static metadata. */
    createList<L extends CoList<JsonValue | CoValue, JsonObject | null>>(
        init?: L extends CoList<infer I, infer _Meta>
            ? (I extends CoValue ? CoID<I> | I : I)[]
            : never,
        meta?: L["meta"]
    ): L {
        let list = this.node
            .createCoValue({
                type: "colist",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.underlyingMap.id,
                },
                meta: meta || null,
                ...createdNowUnique(),
            })
            .getCurrentContent() as L;

        if (init) {
            list = list.edit((editable) => {
                for (const item of init) {
                    editable.push(item);
                }
            });
        }

        return list;
    }

    createStream<C extends CoStream<JsonValue | CoValue, JsonObject | null>>(
        meta?: C["meta"]
    ): C {
        return this.node
            .createCoValue({
                type: "costream",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.underlyingMap.id,
                },
                meta: meta || null,
                ...createdNowUnique(),
            })
            .getCurrentContent() as C;
    }

    createBinaryStream<C extends BinaryCoStream<BinaryCoStreamMeta>>(
        meta: C["meta"] = { type: "binary" }
    ): C {
        return this.node
            .createCoValue({
                type: "costream",
                ruleset: {
                    type: "ownedByGroup",
                    group: this.underlyingMap.id,
                },
                meta: meta,
                ...createdNowUnique(),
            })
            .getCurrentContent() as C;
    }

    /** @internal */
    testWithDifferentAccount(
        account: GeneralizedControlledAccount,
        sessionId: SessionID
    ): Group {
        return new Group(
            expectGroupContent(
                this.underlyingMap.core
                    .testWithDifferentAccount(account, sessionId)
                    .getCurrentContent()
            ),
            this.node
        );
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
