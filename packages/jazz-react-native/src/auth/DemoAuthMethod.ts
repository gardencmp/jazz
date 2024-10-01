import { AgentSecret } from "cojson";
import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();
// storage.clearAll();

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
            existingUsers: string[];
            logInAs: (existingUser: string) => Promise<void>;
        }) => void;
        onSignedIn: (next: { logOut: () => void }) => void;
        onError: (error: string | Error) => void;
    }
}

const localStorageKey = "demo-auth-logged-in-secret";

export class RNDemoAuth implements AuthMethod {
    private promise!: (value: AuthResult | PromiseLike<AuthResult>) => void;
    constructor(
        public driver: RNDemoAuth.Driver,
        seedAccounts?: {
            [name: string]: {
                accountID: ID<Account>;
                accountSecret: AgentSecret;
            };
        },
    ) {
        for (const [name, credentials] of Object.entries(seedAccounts || {})) {
            const storageData = JSON.stringify(
                credentials satisfies StorageData,
            );
            if (
                !(
                    storage
                        .getString("demo-auth-existing-users")
                        ?.split(",") as string[] | undefined
                )?.includes(name)
            ) {
                const existingUsers = storage.getString(
                    "demo-auth-existing-users",
                );
                if (existingUsers) {
                    storage.set(
                        "demo-auth-existing-users",
                        existingUsers + "," + name,
                    );
                } else {
                    storage.set("demo-auth-existing-users", name);
                }
            }
            storage.set("demo-auth-existing-users-" + name, storageData);
        }
    }

    async start() {
        try {
            if (storage.getString(localStorageKey)) {
                const localStorageData = JSON.parse(
                    storage.getString(localStorageKey) ?? "{}",
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
                    logOut: () => {
                        void storage.delete(localStorageKey);
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

                                    storage.set(localStorageKey, storageData);
                                    storage.set(
                                        "demo-auth-existing-users-" + username,
                                        storageData,
                                    );

                                    const existingUsers = storage.getString(
                                        "demo-auth-existing-users",
                                    );
                                    storage.set(
                                        "demo-auth-existing-users",
                                        existingUsers
                                            ? existingUsers + "," + username
                                            : username,
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
                                logOut: () => {
                                    void storage.delete(localStorageKey);
                                },
                            });
                        },
                        existingUsers:
                            storage
                                .getString("demo-auth-existing-users")
                                ?.split(",") ?? [],
                        logInAs: async (existingUser) => {
                            const storageData = JSON.parse(
                                storage.getString(
                                    "demo-auth-existing-users-" + existingUser,
                                ) ?? "{}",
                            ) as StorageData;

                            storage.set(
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
                                logOut: () => {
                                    void storage.delete(localStorageKey);
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

function logOut() {
    void storage.delete(localStorageKey);
}
