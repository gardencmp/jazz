import {
    AccountID,
    AgentSecret,
    LocalNode,
    Peer,
    RawControlledAccount,
} from "cojson";
import { AuthProvider, SessionProvider } from ".";
import {
    AnyAccount,
    AccountMigration,
    AccountSchema,
    ID,
    controlledAccountSym,
} from "jazz-js";

type StorageData = {
    accountID: ID<AnyAccount>;
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

export class BrowserDemoAuth implements AuthProvider {
    driver: BrowserDemoAuthDriver;
    appName: string;

    constructor(driver: BrowserDemoAuthDriver, appName: string) {
        this.driver = driver;
        this.appName = appName;
    }

    async createOrLoadAccount<A extends AccountSchema>(
        accountSchema: A,
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        migration?: AccountMigration<A>
    ): Promise<A[controlledAccountSym]> {
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
                migration: (account) => {
                    return migration?.(
                        accountSchema.fromRaw(
                            account
                        ) as A[controlledAccountSym]
                    );
                },
            });

            this.driver.onSignedIn({ logOut });

            const account = accountSchema.fromRaw(
                node.account as RawControlledAccount
            ) as A[controlledAccountSym];

            return Promise.resolve(account);
        } else {
            const node = await new Promise<LocalNode>(
                (doneSigningUpOrLoggingIn) => {
                    this.driver.onReady({
                        signUp: async (username) => {
                            const { node, accountID, accountSecret } =
                                await LocalNode.withNewlyCreatedAccount({
                                    name: username,
                                    migration: (account) => {
                                        return migration?.(
                                            accountSchema.fromRaw(
                                                account
                                            ) as A[controlledAccountSym]
                                        );
                                    },
                                });
                            const storageData = JSON.stringify({
                                accountID: accountID as unknown as ID<AnyAccount>,
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
                                migration: (account) => {
                                    return migration?.(
                                        accountSchema.fromRaw(
                                            account
                                        ) as A[controlledAccountSym]
                                    );
                                },
                            });

                            doneSigningUpOrLoggingIn(node);
                            this.driver.onSignedIn({ logOut });
                        },
                    });
                }
            );

            const account = accountSchema.fromRaw(
                node.account as RawControlledAccount
            ) as A[controlledAccountSym];

            return account;
        }
    }
}

function logOut() {
    delete localStorage[localStorageKey];
}
