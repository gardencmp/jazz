import { AgentSecret } from "cojson";
import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";
import { KvStore, KvStoreContext } from "../storage/kv-store-context.js";

type StorageData = {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
};

/** @category Auth Providers */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace RNDemoAuth {
    export interface Driver {
        onReady: (next: {
            signUp: (username: string) => Promise<void>;
            getExistingUsers: () => Promise<string[]>;
            logInAs: (existingUser: string) => Promise<void>;
        }) => void;
        onSignedIn: (next: { logOut: () => void }) => void;
        onError: (error: string | Error) => void;
    }
}

const localStorageKey = "demo-auth-logged-in-secret";

export class RNDemoAuth implements AuthMethod {
    private constructor(
        private driver: RNDemoAuth.Driver,
        private kvStore: KvStore,
    ) {}

    public static async init(
        driver: RNDemoAuth.Driver,
        seedAccounts?: {
            [name: string]: {
                accountID: ID<Account>;
                accountSecret: AgentSecret;
            };
        },
    ) {
        const kvStore = KvStoreContext.getInstance().getStorage();
        for (const [name, credentials] of Object.entries(seedAccounts || {})) {
            const storageData = JSON.stringify(
                credentials satisfies StorageData,
            );
            if (
                !(
                    (await kvStore.get("demo-auth-existing-users"))?.split(
                        ",",
                    ) as string[] | undefined
                )?.includes(name)
            ) {
                const existingUsers = await kvStore.get(
                    "demo-auth-existing-users",
                );
                if (existingUsers) {
                    await kvStore.set(
                        "demo-auth-existing-users",
                        existingUsers + "," + name,
                    );
                } else {
                    await kvStore.set("demo-auth-existing-users", name);
                }
            }
            await kvStore.set("demo-auth-existing-users-" + name, storageData);
        }
        return new RNDemoAuth(driver, kvStore);
    }

    async start() {
        try {
            if (await this.kvStore.get(localStorageKey)) {
                const localStorageData = JSON.parse(
                    (await this.kvStore.get(localStorageKey)) ?? "{}",
                ) as StorageData;

                const accountID = localStorageData.accountID as ID<Account>;
                const secret = localStorageData.accountSecret;

                return {
                    type: "existing",
                    credentials: { accountID, secret },
                    onSuccess: () => {
                        this.driver.onSignedIn({ logOut });
                    },
                    onError: (error: string | Error) => {
                        this.driver.onError(error);
                    },
                    logOut: async () => {
                        void (await this.kvStore.delete(localStorageKey));
                    },
                } satisfies AuthResult;
            } else {
                return new Promise<AuthResult>((resolve) => {
                    this.driver.onReady({
                        // @ts-expect-error asd
                        signUp: (username: string) => {
                            resolve({
                                type: "new",
                                creationProps: { name: username },
                                saveCredentials: async (credentials: {
                                    accountID: ID<Account>;
                                    secret: AgentSecret;
                                }) => {
                                    const storageData = JSON.stringify({
                                        accountID: credentials.accountID,
                                        accountSecret: credentials.secret,
                                    } satisfies StorageData);

                                    // Retrieve the list of existing users
                                    const existingUsers =
                                        await this.kvStore.get(
                                            "demo-auth-existing-users",
                                        );
                                    const existingUsernames = existingUsers
                                        ? existingUsers.split(",")
                                        : [];

                                    // Determine if the username already exists and generate a unique username
                                    let uniqueUsername = username;
                                    let counter = 1;
                                    while (
                                        existingUsernames.includes(
                                            uniqueUsername,
                                        )
                                    ) {
                                        counter++;
                                        uniqueUsername = `${username}-${counter}`;
                                    }

                                    // Save credentials using the unique username
                                    await this.kvStore.set(
                                        localStorageKey,
                                        storageData,
                                    );
                                    await this.kvStore.set(
                                        "demo-auth-existing-users-" +
                                            uniqueUsername,
                                        storageData,
                                    );

                                    // Update the list of existing users
                                    const updatedUsers = existingUsers
                                        ? `${existingUsers},${uniqueUsername}`
                                        : uniqueUsername;
                                    await this.kvStore.set(
                                        "demo-auth-existing-users",
                                        updatedUsers,
                                    );
                                },
                                onSuccess: () => {
                                    this.driver.onSignedIn({ logOut });
                                },
                                onError: (error: string | Error) => {
                                    // @ts-expect-error asd
                                    console.error("onError", error.cause);
                                    this.driver.onError(error);
                                },
                                logOut: async () => {
                                    void (await this.kvStore.delete(
                                        localStorageKey,
                                    ));
                                },
                            });
                        },
                        getExistingUsers: async () => {
                            return (
                                (
                                    await this.kvStore.get(
                                        "demo-auth-existing-users",
                                    )
                                )?.split(",") ?? []
                            );
                        },
                        logInAs: async (existingUser) => {
                            const storageData = JSON.parse(
                                (await this.kvStore.get(
                                    "demo-auth-existing-users-" + existingUser,
                                )) ?? "{}",
                            ) as StorageData;

                            await this.kvStore.set(
                                localStorageKey,
                                JSON.stringify(storageData),
                            );

                            resolve({
                                type: "existing",
                                credentials: {
                                    accountID: storageData.accountID,
                                    secret: storageData.accountSecret,
                                },
                                onSuccess: () => {
                                    this.driver.onSignedIn({ logOut });
                                },
                                onError: (error: string | Error) => {
                                    this.driver.onError(error);
                                },
                                logOut: async () => {
                                    void (await this.kvStore.delete(
                                        localStorageKey,
                                    ));
                                },
                            });
                        },
                    });
                });
            }
        } catch (error) {
            console.error("error", error);
            throw error;
        }
    }
}

async function logOut() {
    const kvStore = KvStoreContext.getInstance().getStorage();
    void (await kvStore.delete(localStorageKey));
}
