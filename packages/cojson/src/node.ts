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
import { CoValue, CoValueHeader, newRandomSessionID } from "./coValue.js";
import {
    InviteSecret,
    Group,
    GroupContent,
    expectGroupContent,
    secretSeedFromInviteSecret,
} from "./group.js";
import { Peer, SyncManager } from "./sync.js";
import { AgentID, RawCoID, SessionID, isAgentID } from "./ids.js";
import { CoID, ContentType } from "./contentType.js";
import {
    Account,
    AccountMeta,
    accountHeaderForInitialAgentSecret,
    GeneralizedControlledAccount,
    ControlledAccount,
    AnonymousControlledAccount,
    AccountID,
    Profile,
    AccountContent,
    AccountMap,
} from "./account.js";
import { CoMap } from "./index.js";

export class LocalNode {
    /** @internal */
    coValues: { [key: RawCoID]: CoValueState } = {};
    /** @internal */
    account: GeneralizedControlledAccount;
    currentSessionID: SessionID;
    sync = new SyncManager(this);

    constructor(
        account: GeneralizedControlledAccount,
        currentSessionID: SessionID
    ) {
        this.account = account;
        this.currentSessionID = currentSessionID;
    }

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
            loadingNode.sync.addPeer(peer);
        }

        const account = await accountPromise;

        // since this is all synchronous, we can just swap out nodes for the SyncManager
        const node = loadingNode.testWithDifferentAccount(
            new ControlledAccount(accountSecret, account, loadingNode),
            sessionID
        );
        node.sync = loadingNode.sync;
        node.sync.local = node;

        return node;
    }

    /** @internal */
    createCoValue(header: CoValueHeader): CoValue {
        const coValue = new CoValue(header, this);
        this.coValues[coValue.id] = { state: "loaded", coValue: coValue };

        void this.sync.syncCoValue(coValue);

        return coValue;
    }

    /** @internal */
    loadCoValue(id: RawCoID): Promise<CoValue> {
        let entry = this.coValues[id];
        if (!entry) {
            entry = newLoadingState();

            this.coValues[id] = entry;

            this.sync.loadFromPeers(id);
        }
        if (entry.state === "loaded") {
            return Promise.resolve(entry.coValue);
        }
        return entry.done;
    }

    async load<T extends ContentType>(id: CoID<T>): Promise<T> {
        return (await this.loadCoValue(id)).getCurrentContent() as T;
    }

    async loadProfile(id: AccountID): Promise<Profile> {
        const account = await this.load<AccountMap>(id);
        const profileID = account.get("profile");

        if (!profileID) {
            throw new Error(`Account ${id} has no profile`);
        }
        return (
            await this.loadCoValue(profileID)
        ).getCurrentContent() as Profile;
    }

    async acceptInvite<T extends ContentType>(
        groupOrOwnedValueID: CoID<T>,
        inviteSecret: InviteSecret
    ): Promise<void> {
        const groupOrOwnedValue = await this.load(groupOrOwnedValueID);

        if (groupOrOwnedValue.coValue.header.ruleset.type === "ownedByGroup") {
            return this.acceptInvite(
                groupOrOwnedValue.coValue.header.ruleset.group as CoID<
                    CoMap<GroupContent>
                >,
                inviteSecret
            );
        } else if (groupOrOwnedValue.coValue.header.ruleset.type !== "group") {
            throw new Error("Can only accept invites to groups");
        }

        const group = new Group(expectGroupContent(groupOrOwnedValue), this);

        const inviteAgentSecret = agentSecretFromSecretSeed(
            secretSeedFromInviteSecret(inviteSecret)
        );
        const inviteAgentID = getAgentID(inviteAgentSecret);

        const inviteRole = await new Promise((resolve, reject) => {
            group.groupMap.subscribe((groupMap) => {
                const role = groupMap.get(inviteAgentID);
                if (role) {
                    resolve(role);
                }
            });
            setTimeout(
                () =>
                    reject(
                        new Error("Couldn't find invite before timeout")
                    ),
                1000
            );
        });

        if (!inviteRole) {
            throw new Error("No invite found");
        }

        const existingRole = group.groupMap.get(this.account.id);

        if (
            existingRole === "admin" ||
            (existingRole === "writer" && inviteRole === "writerInvite") ||
            (existingRole === "writer" && inviteRole === "reader") ||
            (existingRole === "reader" && inviteRole === "readerInvite")
        ) {
            console.debug("Not accepting invite that would replace or downgrade role");
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

        group.groupMap.coValue._sessions = groupAsInvite.groupMap.coValue.sessions;
        group.groupMap.coValue._cachedContent = undefined;

        for (const groupListener of group.groupMap.coValue.listeners) {
            groupListener(group.groupMap.coValue.getCurrentContent());
        }
    }

    /** @internal */
    expectCoValueLoaded(id: RawCoID, expectation?: string): CoValue {
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
        const account = this.createCoValue(
            accountHeaderForInitialAgentSecret(agentSecret)
        ).testWithDifferentAccount(
            new AnonymousControlledAccount(agentSecret),
            newRandomSessionID(getAgentID(agentSecret))
        );

        const accountAsGroup = new Group(
            expectGroupContent(account.getCurrentContent()),
            account.node
        );

        accountAsGroup.groupMap.edit((editable) => {
            editable.set(getAgentID(agentSecret), "admin", "trusting");

            const readKey = newRandomKeySecret();

            editable.set(
                `${readKey.id}_for_${getAgentID(agentSecret)}`,
                seal(
                    readKey.secret,
                    getAgentSealerSecret(agentSecret),
                    getAgentSealerID(getAgentID(agentSecret)),
                    {
                        in: account.id,
                        tx: account.nextTransactionID(),
                    }
                ),
                "trusting"
            );

            editable.set("readKey", readKey.id, "trusting");
        });

        const controlledAccount = new ControlledAccount(
            agentSecret,
            account.getCurrentContent() as CoMap<AccountContent, AccountMeta>,
            account.node
        );

        const profile = accountAsGroup.createMap<Profile>({
            type: "profile",
        });

        profile.edit((editable) => {
            editable.set("name", name, "trusting");
        });

        accountAsGroup.groupMap.edit((editable) => {
            editable.set("profile", profile.id, "trusting");
        });

        const accountOnThisNode = this.expectCoValueLoaded(account.id);

        accountOnThisNode._sessions = {...accountAsGroup.groupMap.coValue.sessions};
        accountOnThisNode._cachedContent = undefined;

        return controlledAccount;
    }

    /** @internal */
    resolveAccountAgent(id: AccountID | AgentID, expectation?: string): AgentID {
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

        return new Account(
            coValue.getCurrentContent() as CoMap<GroupContent, AccountMeta>,
            this
        ).getCurrentAgentID();
    }

    createGroup(): Group {
        const groupCoValue = this.createCoValue({
            type: "comap",
            ruleset: { type: "group", initialAdmin: this.account.id },
            meta: null,
            ...createdNowUnique(),
        });

        let groupContent = expectGroupContent(groupCoValue.getCurrentContent());

        groupContent = groupContent.edit((editable) => {
            editable.set(this.account.id, "admin", "trusting");

            const readKey = newRandomKeySecret();

            editable.set(
                `${readKey.id}_for_${this.account.id}`,
                seal(
                    readKey.secret,
                    this.account.currentSealerSecret(),
                    this.account.currentSealerID(),
                    {
                        in: groupCoValue.id,
                        tx: groupCoValue.nextTransactionID(),
                    }
                ),
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

                const newCoValue = new CoValue(entry.coValue.header, newNode, {...entry.coValue.sessions});

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
          done: Promise<CoValue>;
          resolve: (coValue: CoValue) => void;
      }
    | { state: "loaded"; coValue: CoValue };

/** @internal */
export function newLoadingState(): CoValueState {
    let resolve: (coValue: CoValue) => void;

    const promise = new Promise<CoValue>((r) => {
        resolve = r;
    });

    return {
        state: "loading",
        done: promise,
        resolve: resolve!,
    };
}
