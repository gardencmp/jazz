import { AgentSecret, Peer } from "cojson";
import { SessionProvider } from "..";
import { AuthProvider } from "./auth";
import { Account, CoValueClass, ID, Me } from "jazz-tools";

type StorageData = {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
};

const localStorageKey = "demo-auth-logged-in-secret";

interface BrowserDemoAuthDriver {
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
        if (localStorage["demo-auth-logged-in-secret"]) {
            const localStorageData = JSON.parse(
                localStorage[localStorageKey]
            ) as StorageData;

            const sessionID = await getSessionFor(localStorageData.accountID);

            const account = (await this.accountSchema.become({
                accountID: localStorageData.accountID as ID<Acc>,
                accountSecret: localStorageData.accountSecret,
                sessionID,
                peersToLoadFrom: initialPeers,
            })) as Acc & Me;

            this.driver.onSignedIn({ logOut });
            return Promise.resolve(account);
        } else {
            return new Promise<Acc & Me>((resolveAccount) => {
                this.driver.onReady({
                    signUp: async (username) => {
                        const account = (await this.accountSchema.create({
                            creationProps: { name: username },
                            peersToLoadFrom: initialPeers,
                        })) as Acc & Me;

                        const storageData = JSON.stringify({
                            accountID: account.id,
                            accountSecret: account._raw.agentSecret,
                        } satisfies StorageData);

                        localStorage["demo-auth-logged-in-secret"] =
                            storageData;
                        localStorage["demo-auth-existing-users-" + username] =
                            storageData;

                        localStorage["demo-auth-existing-users"] = localStorage[
                            "demo-auth-existing-users"
                        ]
                            ? localStorage["demo-auth-existing-users"] +
                              "," +
                              username
                            : username;

                        resolveAccount(account);
                        this.driver.onSignedIn({ logOut });
                    },
                    existingUsers:
                        localStorage["demo-auth-existing-users"]?.split(",") ??
                        [],
                    logInAs: async (existingUser) => {
                        const storageData = JSON.parse(
                            localStorage[
                                "demo-auth-existing-users-" + existingUser
                            ]
                        ) as StorageData;

                        localStorage["demo-auth-logged-in-secret"] =
                            JSON.stringify(storageData);

                        const account = (await this.accountSchema.become({
                            accountID: storageData.accountID as ID<Acc>,
                            accountSecret: storageData.accountSecret,
                            sessionID: await getSessionFor(
                                storageData.accountID
                            ),
                            peersToLoadFrom: initialPeers,
                        })) as Acc & Me;

                        resolveAccount(account);
                        this.driver.onSignedIn({ logOut });
                    },
                });
            });
        }
    }
}

/** @category Auth Providers */
export namespace BrowserDemoAuth {
    export type Driver = BrowserDemoAuthDriver;
}

function logOut() {
    delete localStorage[localStorageKey];
}
