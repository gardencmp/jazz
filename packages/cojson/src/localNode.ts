import {
    AgentSecret,
    agentSecretFromSecretSeed,
    createdNowUnique,
    getAgentID,
    getAgentSealerID,
    getAgentSealerSecret,
    newRandomAgentSecret,
    newRandomKeySecret,
    seal,
} from "./crypto.js";
import {
    CoValueCore,
    CoValueHeader,
    newRandomSessionID,
} from "./coValueCore.js";
import {
    InviteSecret,
    Group,
    GroupContent,
    expectGroupContent,
    secretSeedFromInviteSecret,
} from "./group.js";
import { Peer, SyncManager } from "./sync.js";
import { AgentID, RawCoID, SessionID, isAgentID } from "./ids.js";
import { CoID } from "./coValue.js";
import { Queried, query } from "./queries.js";
import {
    AccountGroup,
    AccountMeta,
    accountHeaderForInitialAgentSecret,
    GeneralizedControlledAccount,
    ControlledAccount,
    AnonymousControlledAccount,
    AccountID,
    Profile,
    AccountContent,
} from "./account.js";
import { CoMap } from "./coValues/coMap.js";
import { CoValue } from "./index.js";

/** A `LocalNode` represents a local view of a set of loaded `CoValue`s, from the perspective of a particular account (or primitive cryptographic agent).

A `LocalNode` can have peers that it syncs to, for example some form of local persistence, or a sync server, such as `sync.jazz.tools` (Jazz Global Mesh).

@example
You typically get hold of a `LocalNode` using `jazz-react`'s `useJazz()`:

```typescript
const { localNode } = useJazz();
```
*/
export class LocalNode {
    /** @internal */
    coValues: { [key: RawCoID]: CoValueState } = {};
    /** @category Low-level */
    account: GeneralizedControlledAccount;
    /** @category Low-level */
    currentSessionID: SessionID;
    /** @category Low-level */
    syncManager = new SyncManager(this);

    /** @category Low-level */
    constructor(
        account: GeneralizedControlledAccount,
        currentSessionID: SessionID
    ) {
        this.account = account;
        this.currentSessionID = currentSessionID;
    }

    /** @category High-level */
    static withNewlyCreatedAccount(
        name: string,
        initialAgentSecret = newRandomAgentSecret()
    ): {
        node: LocalNode;
        accountID: AccountID;
        accountSecret: AgentSecret;
        sessionID: SessionID;
    } {
        const throwawayAgent = newRandomAgentSecret();
        const setupNode = new LocalNode(
            new AnonymousControlledAccount(throwawayAgent),
            newRandomSessionID(getAgentID(throwawayAgent))
        );

        const account = setupNode.createAccount(name, initialAgentSecret);

        const nodeWithAccount = account.node.testWithDifferentAccount(
            account,
            newRandomSessionID(account.id)
        );

        return {
            node: nodeWithAccount,
            accountID: account.id,
            accountSecret: account.agentSecret,
            sessionID: nodeWithAccount.currentSessionID,
        };
    }

    /** @category High-level */
    static async withLoadedAccount(
        accountID: AccountID,
        accountSecret: AgentSecret,
        sessionID: SessionID,
        peersToLoadFrom: Peer[]
    ): Promise<LocalNode> {
        const loadingNode = new LocalNode(
            new AnonymousControlledAccount(accountSecret),
            newRandomSessionID(accountID)
        );

        const accountPromise = loadingNode.load(accountID);

        for (const peer of peersToLoadFrom) {
            loadingNode.syncManager.addPeer(peer);
        }

        const account = await accountPromise;

        // since this is all synchronous, we can just swap out nodes for the SyncManager
        const node = loadingNode.testWithDifferentAccount(
            new ControlledAccount(accountSecret, account, loadingNode),
            sessionID
        );
        node.syncManager = loadingNode.syncManager;
        node.syncManager.local = node;

        return node;
    }

    /** @internal */
    createCoValue(header: CoValueHeader): CoValueCore {
        const coValue = new CoValueCore(header, this);
        this.coValues[coValue.id] = { state: "loaded", coValue: coValue };

        void this.syncManager.syncCoValue(coValue);

        return coValue;
    }

    /** @internal */
    loadCoValue(id: RawCoID): Promise<CoValueCore> {
        let entry = this.coValues[id];
        if (!entry) {
            entry = newLoadingState();

            this.coValues[id] = entry;

            this.syncManager.loadFromPeers(id);
        }
        if (entry.state === "loaded") {
            return Promise.resolve(entry.coValue);
        }
        return entry.done;
    }

    /**
     * Loads a CoValue's content, syncing from peers as necessary and resolving the returned
     * promise once a first version has been loaded. See `coValue.subscribe()` and `node.useTelepathicData()`
     * for listening to subsequent updates to the CoValue.
     *
     * @category Low-level
     */
    async load<T extends CoValue>(id: CoID<T>): Promise<T> {
        return (await this.loadCoValue(id)).getCurrentContent() as T;
    }

    /** @category Low-level */
    subscribe<T extends CoValue>(
        id: CoID<T>,
        callback: (update: T) => void
    ): () => void {
        let stopped = false;
        let unsubscribe!: () => void;

        console.log("Subscribing to " + id);

        this.load(id)
            .then((coValue) => {
                if (stopped) {
                    return;
                }
                unsubscribe = coValue.subscribe(callback);
            })
            .catch((e) => {
                console.error("Error subscribing to ", id, e);
            });

        return () => {
            console.log("Unsubscribing from " + id);
            stopped = true;
            unsubscribe?.();
        };
    }

    /** @category High-level */
    query<T extends CoValue>(
        id: CoID<T>,
        callback: (update: Queried<T> | undefined) => void
    ): () => void {
        return query(id, this, callback);
    }

    /** @category High-level */
    async acceptInvite<T extends CoValue>(
        groupOrOwnedValueID: CoID<T>,
        inviteSecret: InviteSecret
    ): Promise<void> {
        const groupOrOwnedValue = await this.load(groupOrOwnedValueID);

        if (groupOrOwnedValue.core.header.ruleset.type === "ownedByGroup") {
            return this.acceptInvite(
                groupOrOwnedValue.core.header.ruleset.group as CoID<
                    CoMap<GroupContent>
                >,
                inviteSecret
            );
        } else if (groupOrOwnedValue.core.header.ruleset.type !== "group") {
            throw new Error("Can only accept invites to groups");
        }

        const group = new Group(expectGroupContent(groupOrOwnedValue), this);

        const inviteAgentSecret = agentSecretFromSecretSeed(
            secretSeedFromInviteSecret(inviteSecret)
        );
        const inviteAgentID = getAgentID(inviteAgentSecret);

        const inviteRole = await new Promise((resolve, reject) => {
            group.underlyingMap.subscribe((groupMap) => {
                const role = groupMap.get(inviteAgentID);
                if (role) {
                    resolve(role);
                }
            });
            setTimeout(
                () => reject(new Error("Couldn't find invite before timeout")),
                2000
            );
        });

        if (!inviteRole) {
            throw new Error("No invite found");
        }

        const existingRole = group.underlyingMap.get(this.account.id);

        if (
            existingRole === "admin" ||
            (existingRole === "writer" && inviteRole === "writerInvite") ||
            (existingRole === "writer" && inviteRole === "reader") ||
            (existingRole === "reader" && inviteRole === "readerInvite")
        ) {
            console.debug(
                "Not accepting invite that would replace or downgrade role"
            );
            return;
        }

        const groupAsInvite = group.testWithDifferentAccount(
            new AnonymousControlledAccount(inviteAgentSecret),
            newRandomSessionID(inviteAgentID)
        );

        groupAsInvite.addMemberInternal(
            this.account.id,
            inviteRole === "adminInvite"
                ? "admin"
                : inviteRole === "writerInvite"
                ? "writer"
                : "reader"
        );

        group.underlyingMap.core._sessions =
            groupAsInvite.underlyingMap.core.sessions;
        group.underlyingMap.core._cachedContent = undefined;

        for (const groupListener of group.underlyingMap.core.listeners) {
            groupListener(group.underlyingMap.core.getCurrentContent());
        }
    }

    /** @internal */
    expectCoValueLoaded(id: RawCoID, expectation?: string): CoValueCore {
        const entry = this.coValues[id];
        if (!entry) {
            throw new Error(
                `${expectation ? expectation + ": " : ""}Unknown CoValue ${id}`
            );
        }
        if (entry.state === "loading") {
            throw new Error(
                `${
                    expectation ? expectation + ": " : ""
                }CoValue ${id} not yet loaded`
            );
        }
        return entry.coValue;
    }

    /** @internal */
    expectProfileLoaded(id: AccountID, expectation?: string): Profile {
        const account = this.expectCoValueLoaded(id, expectation);
        const profileID = expectGroupContent(account.getCurrentContent()).get(
            "profile"
        );
        if (!profileID) {
            throw new Error(
                `${
                    expectation ? expectation + ": " : ""
                }Account ${id} has no profile`
            );
        }
        return this.expectCoValueLoaded(
            profileID,
            expectation
        ).getCurrentContent() as Profile;
    }

    /** @internal */
    createAccount(
        name: string,
        agentSecret = newRandomAgentSecret()
    ): ControlledAccount {
        const accountAgentID = getAgentID(agentSecret);
        const account = this.createCoValue(
            accountHeaderForInitialAgentSecret(agentSecret)
        ).testWithDifferentAccount(
            new AnonymousControlledAccount(agentSecret),
            newRandomSessionID(accountAgentID)
        );

        const accountAsGroup = new Group(
            expectGroupContent(account.getCurrentContent()),
            account.node
        );

        accountAsGroup.underlyingMap.mutate((editable) => {
            editable.set(accountAgentID, "admin", "trusting");

            const readKey = newRandomKeySecret();

            editable.set(
                `${readKey.id}_for_${accountAgentID}`,
                seal({
                    message: readKey.secret,
                    from: getAgentSealerSecret(agentSecret),
                    to: getAgentSealerID(accountAgentID),
                    nOnceMaterial: {
                        in: account.id,
                        tx: account.nextTransactionID(),
                    },
                }),
                "trusting"
            );

            editable.set("readKey", readKey.id, "trusting");
        });

        const controlledAccount = new ControlledAccount(
            agentSecret,
            account.getCurrentContent() as CoMap<AccountContent, AccountMeta>,
            account.node
        );

        const profile = accountAsGroup.createMap<Profile>(
            { name },
            {
                type: "profile",
            },
            "trusting"
        );

        accountAsGroup.underlyingMap.set("profile", profile.id, "trusting");

        const accountOnThisNode = this.expectCoValueLoaded(account.id);

        accountOnThisNode._sessions = {
            ...accountAsGroup.underlyingMap.core.sessions,
        };
        accountOnThisNode._cachedContent = undefined;

        const profileOnThisNode = this.createCoValue(profile.core.header);

        profileOnThisNode._sessions = {
            ...profile.core.sessions,
        };
        profileOnThisNode._cachedContent = undefined;

        return controlledAccount;
    }

    /** @internal */
    resolveAccountAgent(
        id: AccountID | AgentID,
        expectation?: string
    ): AgentID {
        if (isAgentID(id)) {
            return id;
        }

        const coValue = this.expectCoValueLoaded(id, expectation);

        if (
            coValue.header.type !== "comap" ||
            coValue.header.ruleset.type !== "group" ||
            !coValue.header.meta ||
            !("type" in coValue.header.meta) ||
            coValue.header.meta.type !== "account"
        ) {
            throw new Error(
                `${
                    expectation ? expectation + ": " : ""
                }CoValue ${id} is not an account`
            );
        }

        return new AccountGroup(
            coValue.getCurrentContent() as CoMap<GroupContent, AccountMeta>,
            this
        ).getCurrentAgentID();
    }

    /**
     * Creates a new group (with the current account as the group's first admin).
     * @category High-level
     */
    createGroup(): Group {
        const groupCoValue = this.createCoValue({
            type: "comap",
            ruleset: { type: "group", initialAdmin: this.account.id },
            meta: null,
            ...createdNowUnique(),
        });

        let groupContent = expectGroupContent(groupCoValue.getCurrentContent());

        groupContent = groupContent.mutate((editable) => {
            editable.set(this.account.id, "admin", "trusting");

            const readKey = newRandomKeySecret();

            editable.set(
                `${readKey.id}_for_${this.account.id}`,
                seal({
                    message: readKey.secret,
                    from: this.account.currentSealerSecret(),
                    to: this.account.currentSealerID(),
                    nOnceMaterial: {
                        in: groupCoValue.id,
                        tx: groupCoValue.nextTransactionID(),
                    },
                }),
                "trusting"
            );

            editable.set("readKey", readKey.id, "trusting");
        });

        return new Group(groupContent, this);
    }

    /** @internal */
    testWithDifferentAccount(
        account: GeneralizedControlledAccount,
        currentSessionID: SessionID
    ): LocalNode {
        const newNode = new LocalNode(account, currentSessionID);

        const coValuesToCopy = Object.entries(this.coValues);

        while (coValuesToCopy.length > 0) {
            const [coValueID, entry] =
                coValuesToCopy[coValuesToCopy.length - 1]!;

            if (entry.state === "loading") {
                coValuesToCopy.pop();
                continue;
            } else {
                const allDepsCopied = entry.coValue
                    .getDependedOnCoValues()
                    .every((dep) => newNode.coValues[dep]?.state === "loaded");

                if (!allDepsCopied) {
                    // move to end of queue
                    coValuesToCopy.unshift(coValuesToCopy.pop()!);
                    continue;
                }

                const newCoValue = new CoValueCore(
                    entry.coValue.header,
                    newNode,
                    { ...entry.coValue.sessions }
                );

                newNode.coValues[coValueID as RawCoID] = {
                    state: "loaded",
                    coValue: newCoValue,
                };

                coValuesToCopy.pop();
            }
        }

        return newNode;
    }
}

/** @internal */
type CoValueState =
    | {
          state: "loading";
          done: Promise<CoValueCore>;
          resolve: (coValue: CoValueCore) => void;
      }
    | { state: "loaded"; coValue: CoValueCore };

/** @internal */
export function newLoadingState(): CoValueState {
    let resolve: (coValue: CoValueCore) => void;

    const promise = new Promise<CoValueCore>((r) => {
        resolve = r;
    });

    return {
        state: "loading",
        done: promise,
        resolve: resolve!,
    };
}
