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

function getUserStorageKey(username: string) {
  return `demo-auth-existing-users-${btoa(username)}`;
}

function getLegacyUserStorageKey(username: string) {
  return `demo-auth-existing-users-${username}`;
}

async function getStorageVersion(kvStore: KvStore) {
  try {
    const version = await kvStore.get("demo-auth-storage-version");
    return version ? parseInt(version) : 1;
  } catch (error) {
    return 1;
  }
}

async function setStorageVersion(kvStore: KvStore, version: number) {
  await kvStore.set("demo-auth-storage-version", version.toString());
}

async function getExistingUsers(kvStore: KvStore) {
  const existingUsers = await kvStore.get("demo-auth-existing-users");
  return existingUsers ? existingUsers.split(",") : [];
}

async function addUserToExistingUsers(username: string, kvStore: KvStore) {
  const existingUsers = await getExistingUsers(kvStore);

  if (existingUsers.includes(username)) {
    return;
  }

  await kvStore.set(
    "demo-auth-existing-users",
    existingUsers.concat(username).join(","),
  );
}

/**
 * Migrates existing users keys to use a base64 encoded username.
 *
 * This is done to avoid issues with special characters in the username.
 */
async function migrateExistingUsersKeys(kvStore: KvStore) {
  if ((await getStorageVersion(kvStore)) >= 2) {
    return;
  }

  await setStorageVersion(kvStore, 2);

  const existingUsers = await getExistingUsers(kvStore);

  for (const existingUsername of existingUsers) {
    const legacyKey = getLegacyUserStorageKey(existingUsername);
    const storageData = await kvStore.get(legacyKey);
    if (storageData) {
      await kvStore.set(getUserStorageKey(existingUsername), storageData);
      await kvStore.delete(legacyKey);
    }
  }
}

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
    store?: KvStore | undefined,
  ) {
    const kvStore = store ? store : KvStoreContext.getInstance().getStorage();

    await migrateExistingUsersKeys(kvStore);

    for (const [name, credentials] of Object.entries(seedAccounts || {})) {
      const storageData = JSON.stringify(credentials satisfies StorageData);

      await addUserToExistingUsers(name, kvStore);
      await kvStore.set(getUserStorageKey(name), storageData);
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

                  const existingUsernames = await getExistingUsers(
                    this.kvStore,
                  );

                  // Determine if the username already exists and generate a unique username
                  let uniqueUsername = username;
                  let counter = 1;
                  while (existingUsernames.includes(uniqueUsername)) {
                    counter++;
                    uniqueUsername = `${username}-${counter}`;
                  }

                  // Save credentials using the unique username
                  await this.kvStore.set(localStorageKey, storageData);
                  await this.kvStore.set(
                    getUserStorageKey(uniqueUsername),
                    storageData,
                  );

                  await addUserToExistingUsers(uniqueUsername, this.kvStore);
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
                  void (await this.kvStore.delete(localStorageKey));
                },
              });
            },
            getExistingUsers: async () => {
              return await getExistingUsers(this.kvStore);
            },
            logInAs: async (existingUser) => {
              const storageData = JSON.parse(
                (await this.kvStore.get(getUserStorageKey(existingUser))) ??
                  "{}",
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
                  void (await this.kvStore.delete(localStorageKey));
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
