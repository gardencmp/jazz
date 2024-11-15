import { AgentSecret } from "cojson";
import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";

type StorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
  username: string;
};

const localStorageKey = "demo-auth-logged-in-secret";

export class BrowserDemoAuth implements AuthMethod {
  constructor(
    public driver: BrowserDemoAuth.Driver,
    seedAccounts?: {
      [name: string]: {
        accountID: ID<Account>;
        accountSecret: AgentSecret;
        username?: string;
      };
    },
  ) {
    for (const [name, credentials] of Object.entries(seedAccounts || {})) {
      if (
        !(
          localStorage["demo-auth-existing-users"]?.split(",") as
            | string[]
            | undefined
        )?.includes(name)
      ) {
        localStorage["demo-auth-existing-users"] = localStorage[
          "demo-auth-existing-users"
        ]
          ? localStorage["demo-auth-existing-users"] + "," + name
          : name;
      }
      localStorage["demo-auth-existing-users-" + name] = JSON.stringify({
        username: name,
        ...credentials,
      } satisfies StorageData);
    }
  }

  async start() {
    if (localStorage["demo-auth-logged-in-secret"]) {
      const localStorageData = JSON.parse(
        localStorage[localStorageKey],
      ) as StorageData;

      const accountID = localStorageData.accountID as ID<Account>;
      const secret = localStorageData.accountSecret;

      return {
        type: "existing",
        credentials: { accountID, secret },
        onSuccess: () => {
          this.driver.onSignedIn({
            logOut,
            username: localStorageData.username,
          });
        },
        onError: (error: string | Error) => {
          this.driver.onError(error);
        },
        logOut: () => {
          delete localStorage[localStorageKey];
        },
      } satisfies AuthResult;
    } else {
      return new Promise<AuthResult>((resolve) => {
        this.driver.onReady({
          signUp: async (username) => {
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
                  username,
                } satisfies StorageData);

                localStorage["demo-auth-logged-in-secret"] = storageData;
                localStorage["demo-auth-existing-users-" + username] =
                  storageData;

                localStorage["demo-auth-existing-users"] = localStorage[
                  "demo-auth-existing-users"
                ]
                  ? localStorage["demo-auth-existing-users"] + "," + username
                  : username;
              },
              onSuccess: () => {
                this.driver.onSignedIn({ logOut });
              },
              onError: (error: string | Error) => {
                this.driver.onError(error);
              },
              logOut: () => {
                delete localStorage[localStorageKey];
              },
            });
          },
          existingUsers:
            localStorage["demo-auth-existing-users"]?.split(",") ?? [],
          logInAs: async (existingUser) => {
            const storageData = JSON.parse(
              localStorage["demo-auth-existing-users-" + existingUser],
            ) as StorageData;

            localStorage["demo-auth-logged-in-secret"] =
              JSON.stringify(storageData);

            resolve({
              type: "existing",
              credentials: {
                accountID: storageData.accountID,
                secret: storageData.accountSecret,
              },
              onSuccess: (username) => {
                this.driver.onSignedIn({ logOut, username });
              },
              onError: (error: string | Error) => {
                this.driver.onError(error);
              },
              logOut: () => {
                delete localStorage[localStorageKey];
              },
            });
          },
        });
      });
    }
  }
}

/** @category Auth Providers */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserDemoAuth {
  export interface Driver {
    onReady: (next: {
      signUp: (username: string) => Promise<void>;
      existingUsers: string[];
      logInAs: (existingUser: string) => Promise<void>;
    }) => void;
    onSignedIn: (next: { logOut: () => void; username?: string }) => void;
    onError: (error: string | Error) => void;
  }
}

function logOut() {
  delete localStorage[localStorageKey];
}
