import {
    AccountID,
    AccountMigration,
    AgentSecret,
    LocalNode,
    Peer,
} from "cojson";
import { AuthProvider, SessionProvider } from ".";

type StorageData = {
    accountID: AccountID;
    accountSecret: AgentSecret;
};

const sessionStorageKey = "demo-auth-logged-in-secret";

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

    async createNode(
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        migration?: AccountMigration
    ): Promise<LocalNode> {
        if (sessionStorage["demo-auth-logged-in-secret"]) {
            const sessionStorageData = JSON.parse(
                sessionStorage[sessionStorageKey]
            ) as StorageData;

            const sessionID = await getSessionFor(sessionStorageData.accountID);

            const node = await LocalNode.withLoadedAccount({
                accountID: sessionStorageData.accountID,
                accountSecret: sessionStorageData.accountSecret,
                sessionID,
                peersToLoadFrom: initialPeers,
                migration,
            });

            this.driver.onSignedIn({ logOut });

            return Promise.resolve(node);
        } else {
            const node = await new Promise<LocalNode>(
                (doneSigningUpOrLoggingIn) => {
                    this.driver.onReady({
                        signUp: async (username) => {
                            const { node, accountID, accountSecret } =
                                await LocalNode.withNewlyCreatedAccount({
                                    name: username,
                                    migration,
                                });
                            const storageData = JSON.stringify({
                                accountID,
                                accountSecret,
                            } satisfies StorageData);
                            sessionStorage["demo-auth-logged-in-secret"] =
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

                            sessionStorage["demo-auth-logged-in-secret"] =
                                JSON.stringify(storageData);

                            const sessionID = await getSessionFor(
                                storageData.accountID
                            );

                            const node = await LocalNode.withLoadedAccount({
                                accountID: storageData.accountID,
                                accountSecret: storageData.accountSecret,
                                sessionID,
                                peersToLoadFrom: initialPeers,
                                migration,
                            });

                            doneSigningUpOrLoggingIn(node);
                            this.driver.onSignedIn({ logOut });
                        },
                    });
                }
            );

            return node;
        }
    }
}

function logOut() {
    delete sessionStorage[sessionStorageKey];
}
