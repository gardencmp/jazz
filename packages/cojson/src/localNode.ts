import { AgentSecret, CryptoProvider } from "./crypto/crypto.js";
import {
    CoValueCore,
    CoValueHeader,
    newRandomSessionID,
} from "./coValueCore.js";
import {
    InviteSecret,
    RawGroup,
    secretSeedFromInviteSecret,
} from "./coValues/group.js";
import { Peer, PeerID, SyncManager } from "./sync.js";
import { AgentID, RawCoID, SessionID, isAgentID } from "./ids.js";
import { CoID } from "./coValue.js";
import {
    RawAccount,
    AccountMeta,
    accountHeaderForInitialAgentSecret,
    ControlledAccountOrAgent,
    RawControlledAccount,
    ControlledAgent,
    AccountID,
    RawProfile,
    RawAccountMigration,
    InvalidAccountAgentIDError,
} from "./coValues/account.js";
import { Profile, RawCoValue } from "./index.js";
import { expectGroup } from "./typeUtils/expectGroup.js";
import { err, ok, okAsync, Result, ResultAsync } from "neverthrow";

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
    crypto: CryptoProvider;
    /** @internal */
    coValues: { [key: RawCoID]: CoValueState } = {};
    /** @category 3. Low-level */
    account: ControlledAccountOrAgent;
    /** @category 3. Low-level */
    currentSessionID: SessionID;
    /** @category 3. Low-level */
    syncManager = new SyncManager(this);

    crashed: Error | undefined = undefined;

    /** @category 3. Low-level */
    constructor(
        account: ControlledAccountOrAgent,
        currentSessionID: SessionID,
        crypto: CryptoProvider,
    ) {
        this.account = account;
        this.currentSessionID = currentSessionID;
        this.crypto = crypto;
    }

    /** @category 2. Node Creation */
    static async withNewlyCreatedAccount<
        Meta extends AccountMeta = AccountMeta,
    >({
        creationProps,
        peersToLoadFrom,
        migration,
        crypto,
        initialAgentSecret = crypto.newRandomAgentSecret(),
    }: {
        creationProps: { name: string };
        peersToLoadFrom?: Peer[];
        migration?: RawAccountMigration<Meta>;
        crypto: CryptoProvider;
        initialAgentSecret?: AgentSecret;
    }): Promise<{
        node: LocalNode;
        accountID: AccountID;
        accountSecret: AgentSecret;
        sessionID: SessionID;
    }> {
        const throwawayAgent = crypto.newRandomAgentSecret();
        const setupNode = new LocalNode(
            new ControlledAgent(throwawayAgent, crypto),
            newRandomSessionID(crypto.getAgentID(throwawayAgent)),
            crypto,
        );

        const account = setupNode.createAccount(initialAgentSecret);

        const nodeWithAccount = account.core.node.testWithDifferentAccount(
            account,
            newRandomSessionID(account.id),
        );

        const accountOnNodeWithAccount =
            nodeWithAccount.account as RawControlledAccount<Meta>;

        if (peersToLoadFrom) {
            for (const peer of peersToLoadFrom) {
                nodeWithAccount.syncManager.addPeer(peer);
            }
        }

        if (migration) {
            await migration(
                accountOnNodeWithAccount,
                nodeWithAccount,
                creationProps,
            );
        } else {
            const profileGroup = accountOnNodeWithAccount.createGroup();
            profileGroup.addMember("everyone", "reader");
            const profile = profileGroup.createMap<Profile>({
                name: creationProps.name,
            });
            accountOnNodeWithAccount.set("profile", profile.id, "trusting");
        }

        const controlledAccount = new RawControlledAccount(
            accountOnNodeWithAccount.core,
            accountOnNodeWithAccount.agentSecret,
        );

        nodeWithAccount.account = controlledAccount;
        nodeWithAccount.coValues[controlledAccount.id] = {
            state: "loaded",
            coValue: controlledAccount.core,
        };
        controlledAccount.core._cachedContent = undefined;

        if (!controlledAccount.get("profile")) {
            throw new Error("Must set account profile in initial migration");
        }

        // we shouldn't need this, but it fixes account data not syncing for new accounts
        function syncAllCoValuesAfterCreateAccount() {
            for (const coValueEntry of Object.values(
                nodeWithAccount.coValues,
            )) {
                if (coValueEntry.state === "loaded") {
                    void nodeWithAccount.syncManager.syncCoValue(
                        coValueEntry.coValue,
                    );
                }
            }
        }

        syncAllCoValuesAfterCreateAccount();

        setTimeout(syncAllCoValuesAfterCreateAccount, 500);

        return {
            node: nodeWithAccount,
            accountID: accountOnNodeWithAccount.id,
            accountSecret: accountOnNodeWithAccount.agentSecret,
            sessionID: nodeWithAccount.currentSessionID,
        };
    }

    /** @category 2. Node Creation */
    static async withLoadedAccount<Meta extends AccountMeta = AccountMeta>({
        accountID,
        accountSecret,
        sessionID,
        peersToLoadFrom,
        crypto,
        migration,
    }: {
        accountID: AccountID;
        accountSecret: AgentSecret;
        sessionID: SessionID | undefined;
        peersToLoadFrom: Peer[];
        crypto: CryptoProvider;
        migration?: RawAccountMigration<Meta>;
    }): Promise<LocalNode> {
        const loadingNode = new LocalNode(
            new ControlledAgent(accountSecret, crypto),
            newRandomSessionID(accountID),
            crypto,
        );

        for (const peer of peersToLoadFrom) {
            loadingNode.syncManager.addPeer(peer);
        }

        const accountPromise = loadingNode.load(accountID);

        const account = await accountPromise;

        if (account === "unavailable") {
            throw new Error("Account unavailable from all peers");
        }

        const controlledAccount = new RawControlledAccount(
            account.core,
            accountSecret,
        );

        // since this is all synchronous, we can just swap out nodes for the SyncManager
        const node = loadingNode.testWithDifferentAccount(
            controlledAccount,
            sessionID || newRandomSessionID(accountID),
        );
        node.syncManager = loadingNode.syncManager;
        node.syncManager.local = node;

        controlledAccount.core.node = node;
        node.coValues[accountID] = {
            state: "loaded",
            coValue: controlledAccount.core,
        };
        controlledAccount.core._cachedContent = undefined;

        const profileID = account.get("profile");
        if (!profileID) {
            throw new Error("Account has no profile");
        }
        const profile = await node.load(profileID);

        if (profile === "unavailable") {
            throw new Error("Profile unavailable from all peers");
        }

        if (migration) {
            await migration(
                controlledAccount as RawControlledAccount<Meta>,
                node,
            );
            node.account = new RawControlledAccount(
                controlledAccount.core,
                controlledAccount.agentSecret,
            );
        }

        return node;
    }

    /** @internal */
    createCoValue(header: CoValueHeader): CoValueCore {
        if (this.crashed) {
            throw new Error("Trying to create CoValue after node has crashed", {
                cause: this.crashed,
            });
        }

        const coValue = new CoValueCore(header, this);
        this.coValues[coValue.id] = { state: "loaded", coValue: coValue };

        void this.syncManager.syncCoValue(coValue);

        return coValue;
    }

    /** @internal */
    async loadCoValueCore(
        id: RawCoID,
        options: {
            dontLoadFrom?: PeerID;
            dontWaitFor?: PeerID;
            onProgress?: (progress: number) => void;
        } = {},
    ): Promise<CoValueCore | "unavailable"> {
        if (this.crashed) {
            throw new Error("Trying to load CoValue after node has crashed", {
                cause: this.crashed,
            });
        }

        let entry = this.coValues[id];
        if (!entry) {
            const peersToWaitFor = new Set(
                Object.values(this.syncManager.peers)
                    .filter((peer) => peer.role === "server")
                    .map((peer) => peer.id),
            );
            if (options.dontWaitFor) peersToWaitFor.delete(options.dontWaitFor);
            entry = newLoadingState(peersToWaitFor, options.onProgress);

            this.coValues[id] = entry;

            this.syncManager
                .loadFromPeers(id, options.dontLoadFrom)
                .catch((e) => {
                    console.error(
                        "Error loading from peers",
                        id,

                        e,
                    );
                });
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
     * @category 3. Low-level
     */
    async load<T extends RawCoValue>(
        id: CoID<T>,
        onProgress?: (progress: number) => void,
    ): Promise<T | "unavailable"> {
        const core = await this.loadCoValueCore(id, { onProgress });

        if (core === "unavailable") {
            return "unavailable";
        }

        return core.getCurrentContent() as T;
    }

    getLoaded<T extends RawCoValue>(id: CoID<T>): T | undefined {
        const entry = this.coValues[id];
        if (!entry) {
            return undefined;
        }
        if (entry.state === "loaded") {
            return entry.coValue.getCurrentContent() as T;
        }
        return undefined;
    }

    /** @category 3. Low-level */
    subscribe<T extends RawCoValue>(
        id: CoID<T>,
        callback: (update: T | "unavailable") => void,
    ): () => void {
        let stopped = false;
        let unsubscribe!: () => void;

        // console.log("Subscribing to " + id);

        this.load(id)
            .then((coValue) => {
                if (stopped) {
                    return;
                }
                if (coValue === "unavailable") {
                    callback("unavailable");
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

    /** @deprecated Use Account.acceptInvite instead */
    async acceptInvite<T extends RawCoValue>(
        groupOrOwnedValueID: CoID<T>,
        inviteSecret: InviteSecret,
    ): Promise<void> {
        const groupOrOwnedValue = await this.load(groupOrOwnedValueID);

        if (groupOrOwnedValue === "unavailable") {
            throw new Error(
                "Trying to accept invite: Group/owned value unavailable from all peers",
            );
        }

        if (groupOrOwnedValue.core.header.ruleset.type === "ownedByGroup") {
            return this.acceptInvite(
                groupOrOwnedValue.core.header.ruleset.group as CoID<RawGroup>,
                inviteSecret,
            );
        } else if (groupOrOwnedValue.core.header.ruleset.type !== "group") {
            throw new Error("Can only accept invites to groups");
        }

        const group = expectGroup(groupOrOwnedValue);

        const inviteAgentSecret = this.crypto.agentSecretFromSecretSeed(
            secretSeedFromInviteSecret(inviteSecret),
        );
        const inviteAgentID = this.crypto.getAgentID(inviteAgentSecret);

        const inviteRole = await new Promise((resolve, reject) => {
            group.subscribe((groupUpdate) => {
                const role = groupUpdate.get(inviteAgentID);
                if (role) {
                    resolve(role);
                }
            });
            setTimeout(
                () => reject(new Error("Couldn't find invite before timeout")),
                2000,
            );
        });

        if (!inviteRole) {
            throw new Error("No invite found");
        }

        const existingRole = group.get(this.account.id);

        if (
            existingRole === "admin" ||
            (existingRole === "writer" && inviteRole === "writerInvite") ||
            (existingRole === "writer" && inviteRole === "reader") ||
            (existingRole === "reader" && inviteRole === "readerInvite")
        ) {
            console.debug(
                "Not accepting invite that would replace or downgrade role",
            );
            return;
        }

        const groupAsInvite = expectGroup(
            group.core
                .testWithDifferentAccount(
                    new ControlledAgent(inviteAgentSecret, this.crypto),
                    newRandomSessionID(inviteAgentID),
                )
                .getCurrentContent(),
        );

        groupAsInvite.addMemberInternal(
            this.account,
            inviteRole === "adminInvite"
                ? "admin"
                : inviteRole === "writerInvite"
                  ? "writer"
                  : "reader",
        );

        group.core._sessionLogs = groupAsInvite.core.sessionLogs;
        group.core._cachedContent = undefined;

        for (const groupListener of group.core.listeners) {
            groupListener(group.core.getCurrentContent());
        }
    }

    /** @internal */
    expectCoValueLoaded(id: RawCoID, expectation?: string): CoValueCore {
        const entry = this.coValues[id];
        if (!entry) {
            throw new Error(
                `${expectation ? expectation + ": " : ""}Unknown CoValue ${id}`,
            );
        }
        if (entry.state === "loading") {
            throw new Error(
                `${
                    expectation ? expectation + ": " : ""
                }CoValue ${id} not yet loaded`,
            );
        }
        return entry.coValue;
    }

    /** @internal */
    expectProfileLoaded(id: AccountID, expectation?: string): RawProfile {
        const account = this.expectCoValueLoaded(id, expectation);
        const profileID = expectGroup(account.getCurrentContent()).get(
            "profile",
        );
        if (!profileID) {
            throw new Error(
                `${
                    expectation ? expectation + ": " : ""
                }Account ${id} has no profile`,
            );
        }
        return this.expectCoValueLoaded(
            profileID,
            expectation,
        ).getCurrentContent() as RawProfile;
    }

    /** @internal */
    createAccount(
        agentSecret = this.crypto.newRandomAgentSecret(),
    ): RawControlledAccount {
        const accountAgentID = this.crypto.getAgentID(agentSecret);
        const account = expectGroup(
            this.createCoValue(
                accountHeaderForInitialAgentSecret(agentSecret, this.crypto),
            )
                .testWithDifferentAccount(
                    new ControlledAgent(agentSecret, this.crypto),
                    newRandomSessionID(accountAgentID),
                )
                .getCurrentContent(),
        );

        account.set(accountAgentID, "admin", "trusting");

        const readKey = this.crypto.newRandomKeySecret();

        const sealed = this.crypto.seal({
            message: readKey.secret,
            from: this.crypto.getAgentSealerSecret(agentSecret),
            to: this.crypto.getAgentSealerID(accountAgentID),
            nOnceMaterial: {
                in: account.id,
                tx: account.core.nextTransactionID(),
            },
        });

        account.set(`${readKey.id}_for_${accountAgentID}`, sealed, "trusting");

        account.set("readKey", readKey.id, "trusting");

        const accountOnThisNode = this.expectCoValueLoaded(account.id);

        accountOnThisNode._sessionLogs = new Map(account.core.sessionLogs);

        accountOnThisNode._cachedContent = undefined;

        return new RawControlledAccount(accountOnThisNode, agentSecret);
    }

    /** @internal */
    resolveAccountAgent(
        id: AccountID | AgentID,
        expectation?: string,
    ): Result<AgentID, ResolveAccountAgentError> {
        if (isAgentID(id)) {
            return ok(id);
        }

        const coValue = this.expectCoValueLoaded(id, expectation);

        if (
            coValue.header.type !== "comap" ||
            coValue.header.ruleset.type !== "group" ||
            !coValue.header.meta ||
            !("type" in coValue.header.meta) ||
            coValue.header.meta.type !== "account"
        ) {
            return err({
                type: "UnexpectedlyNotAccount",
                expectation,
                id,
            } satisfies UnexpectedlyNotAccountError);
        }

        return (coValue.getCurrentContent() as RawAccount).currentAgentID();
    }

    resolveAccountAgentAsync(
        id: AccountID | AgentID,
        expectation?: string,
    ): ResultAsync<AgentID, ResolveAccountAgentError> {
        if (isAgentID(id)) {
            return okAsync(id);
        }

        return ResultAsync.fromPromise(
            this.loadCoValueCore(id),
            (e) =>
                ({
                    type: "ErrorLoadingCoValueCore",
                    expectation,
                    id,
                    error: e,
                }) satisfies LoadCoValueCoreError,
        ).andThen((coValue) => {
            if (coValue === "unavailable") {
                return err({
                    type: "AccountUnavailableFromAllPeers" as const,
                    expectation,
                    id,
                } satisfies AccountUnavailableFromAllPeersError);
            }

            if (
                coValue.header.type !== "comap" ||
                coValue.header.ruleset.type !== "group" ||
                !coValue.header.meta ||
                !("type" in coValue.header.meta) ||
                coValue.header.meta.type !== "account"
            ) {
                return err({
                    type: "UnexpectedlyNotAccount" as const,
                    expectation,
                    id,
                } satisfies UnexpectedlyNotAccountError);
            }

            return (coValue.getCurrentContent() as RawAccount).currentAgentID();
        });
    }

    /**
     * @deprecated use Account.createGroup() instead
     */
    createGroup(): RawGroup {
        const groupCoValue = this.createCoValue({
            type: "comap",
            ruleset: { type: "group", initialAdmin: this.account.id },
            meta: null,
            ...this.crypto.createdNowUnique(),
        });

        const group = expectGroup(groupCoValue.getCurrentContent());

        group.set(this.account.id, "admin", "trusting");

        const readKey = this.crypto.newRandomKeySecret();

        group.set(
            `${readKey.id}_for_${this.account.id}`,
            this.crypto.seal({
                message: readKey.secret,
                from: this.account.currentSealerSecret(),
                to: this.account
                    .currentSealerID()
                    ._unsafeUnwrap({ withStackTrace: true }),
                nOnceMaterial: {
                    in: groupCoValue.id,
                    tx: groupCoValue.nextTransactionID(),
                },
            }),
            "trusting",
        );

        group.set("readKey", readKey.id, "trusting");

        return group;
    }

    /** @internal */
    testWithDifferentAccount(
        account: ControlledAccountOrAgent,
        currentSessionID: SessionID,
    ): LocalNode {
        const newNode = new LocalNode(account, currentSessionID, this.crypto);

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
                    new Map(entry.coValue.sessionLogs),
                );

                newNode.coValues[coValueID as RawCoID] = {
                    state: "loaded",
                    coValue: newCoValue,
                };

                coValuesToCopy.pop();
            }
        }

        if (account instanceof RawControlledAccount) {
            // To make sure that when we edit the account, we're modifying the correct sessions
            const accountInNode = new RawControlledAccount(
                newNode.expectCoValueLoaded(account.id),
                account.agentSecret,
            );
            if (accountInNode.core.node !== newNode) {
                throw new Error("Account's node is not the new node");
            }
            newNode.account = accountInNode;
        }

        return newNode;
    }

    gracefulShutdown() {
        this.syncManager.gracefulShutdown();
    }
}

/** @internal */
type CoValueState =
    | {
          state: "loading";
          done: Promise<CoValueCore | "unavailable">;
          resolve: (coValue: CoValueCore | "unavailable") => void;
          onProgress?: (progress: number) => void;
          firstPeerState: {
              [peerID: string]:
                  | {
                        type: "waiting";
                        done: Promise<void>;
                        resolve: () => void;
                    }
                  | { type: "available" }
                  | { type: "unavailable" };
          };
      }
    | {
          state: "loaded";
          coValue: CoValueCore;
          onProgress?: (progress: number) => void;
      };

export type LoadCoValueCoreError = {
    type: "ErrorLoadingCoValueCore";
    error: unknown;
    expectation?: string;
    id: AccountID;
};

export type AccountUnavailableFromAllPeersError = {
    type: "AccountUnavailableFromAllPeers";
    expectation?: string;
    id: AccountID;
};

export type UnexpectedlyNotAccountError = {
    type: "UnexpectedlyNotAccount";
    expectation?: string;
    id: AccountID;
};

export type ResolveAccountAgentError =
    | InvalidAccountAgentIDError
    | LoadCoValueCoreError
    | AccountUnavailableFromAllPeersError
    | UnexpectedlyNotAccountError;

/** @internal */
export function newLoadingState(
    currentPeerIds: Set<PeerID>,
    onProgress?: (progress: number) => void,
): CoValueState {
    let resolve: (coValue: CoValueCore | "unavailable") => void;

    const promise = new Promise<CoValueCore | "unavailable">((r) => {
        resolve = r;
    });

    return {
        state: "loading",
        done: promise,
        resolve: resolve!,
        onProgress,
        firstPeerState: Object.fromEntries(
            [...currentPeerIds].map((id) => {
                let resolve: () => void;
                const done = new Promise<void>((r) => {
                    resolve = r;
                });
                return [id, { type: "waiting", done, resolve: resolve! }];
            }),
        ),
    };
}
