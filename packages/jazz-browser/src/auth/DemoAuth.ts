import {
    AccountID,
    AgentSecret,
    LocalNode,
    Peer,
    RawControlledAccount,
} from "cojson";
import { SessionProvider } from "..";
import { AuthProvider } from "./auth";
import { Account, CoValueClass, ID, Me } from "jazz-tools";

type StorageData = {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
};

const localStorageKey = "demo-auth-logged-in-secret";

export interface BrowserDemoAuthDriver {
    onReady: (next: {
        signUp: (username: string) => Promise<void>;
        existingUsers: string[];
        logInAs: (existingUser: string) => Promise<void>;
    }) => void;
    onSignedIn: (next: { logOut: () => void }) => void;
}

export class BrowserDemoAuth<Acc extends Account> implements AuthProvider<Acc> {
    constructor(
        public accountSchema: CoValueClass<Acc> & typeof Account,
        public driver: BrowserDemoAuthDriver,
        public appName: string
    ) {}

    async createOrLoadAccount(
        getSessionFor: SessionProvider,
        initialPeers: Peer[]
    ): Promise<Acc & Me> {
        const rawMigration = (account: RawControlledAccount) => {
            return this.accountSchema.fromRaw(account).migrate?.();
        };

        if (localStorage["demo-auth-logged-in-secret"]) {
            const localStorageData = JSON.parse(
                localStorage[localStorageKey]
            ) as StorageData;

            const sessionID = await getSessionFor(localStorageData.accountID);

            const node = await LocalNode.withLoadedAccount({
                accountID: localStorageData.accountID as unknown as AccountID,
                accountSecret: localStorageData.accountSecret,
                sessionID,
                peersToLoadFrom: initialPeers,
                migration: rawMigration,
            });

            this.driver.onSignedIn({ logOut });

            const account = this.accountSchema.fromRaw(
                node.account as RawControlledAccount
            ) as Acc & Me;

            return Promise.resolve(account);
        } else {
            const node = await new Promise<LocalNode>(
                (doneSigningUpOrLoggingIn) => {
                    this.driver.onReady({
                        signUp: async (username) => {
                            const { node, accountID, accountSecret } =
                                await LocalNode.withNewlyCreatedAccount({
                                    name: username,
                                    migration: rawMigration,
                                });
                            const storageData = JSON.stringify({
                                accountID: accountID as unknown as ID<Account>,
                                accountSecret,
                            } satisfies StorageData);
                            localStorage["demo-auth-logged-in-secret"] =
                                storageData;
                            localStorage[
                                "demo-auth-existing-users-" + username
                            ] = storageData;
                            localStorage["demo-auth-existing-users"] =
                                localStorage["demo-auth-existing-users"]
                                    ? localStorage["demo-auth-existing-users"] +
                                      "," +
                                      username
                                    : username;
                            for (const peer of initialPeers) {
                                node.syncManager.addPeer(peer);
                            }
                            doneSigningUpOrLoggingIn(node);
                            this.driver.onSignedIn({ logOut });
                        },
                        existingUsers:
                            localStorage["demo-auth-existing-users"]?.split(
                                ","
                            ) ?? [],
                        logInAs: async (existingUser) => {
                            const storageData = JSON.parse(
                                localStorage[
                                    "demo-auth-existing-users-" + existingUser
                                ]
                            ) as StorageData;

                            localStorage["demo-auth-logged-in-secret"] =
                                JSON.stringify(storageData);

                            const sessionID = await getSessionFor(
                                storageData.accountID
                            );

                            const node = await LocalNode.withLoadedAccount({
                                accountID:
                                    storageData.accountID as unknown as AccountID,
                                accountSecret: storageData.accountSecret,
                                sessionID,
                                peersToLoadFrom: initialPeers,
                                migration: rawMigration,
                            });

                            doneSigningUpOrLoggingIn(node);
                            this.driver.onSignedIn({ logOut });
                        },
                    });
                }
            );

            const account = this.accountSchema.fromRaw(
                node.account as RawControlledAccount
            ) as Acc & Me;

            return account;
        }
    }
}

function logOut() {
    delete localStorage[localStorageKey];
}
