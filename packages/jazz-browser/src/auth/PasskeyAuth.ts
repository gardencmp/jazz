import {
  AgentSecret,
  CryptoProvider,
  RawAccountID,
  cojsonInternals,
} from "cojson";
import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";

type LocalStorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
};

const localStorageKey = "jazz-logged-in-secret";

export class BrowserPasskeyAuth implements AuthMethod {
  constructor(
    public driver: BrowserPasskeyAuth.Driver,
    public appName: string,
    // TODO: is this a safe default?
    public appHostname: string = window.location.hostname,
  ) {}

  accountLoaded() {
    this.driver.onSignedIn({ logOut });
  }

  onError(error: string | Error) {
    this.driver.onError(error);
  }

  async start(crypto: CryptoProvider): Promise<AuthResult> {
    if (localStorage[localStorageKey]) {
      const localStorageData = JSON.parse(
        localStorage[localStorageKey],
      ) as LocalStorageData;

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
          delete localStorage[localStorageKey];
        },
      } satisfies AuthResult;
    } else {
      return new Promise<AuthResult>((resolve) => {
        this.driver.onReady({
          signUp: async (username) => {
            const secretSeed = crypto.newRandomSecretSeed();

            resolve({
              type: "new",
              creationProps: { name: username },
              initialSecret: crypto.agentSecretFromSecretSeed(secretSeed),
              saveCredentials: async ({ accountID, secret }) => {
                const webAuthNCredentialPayload = new Uint8Array(
                  cojsonInternals.secretSeedLength +
                    cojsonInternals.shortHashLength,
                );

                webAuthNCredentialPayload.set(secretSeed);
                webAuthNCredentialPayload.set(
                  cojsonInternals.rawCoIDtoBytes(
                    accountID as unknown as RawAccountID,
                  ),
                  cojsonInternals.secretSeedLength,
                );

                await navigator.credentials.create({
                  publicKey: {
                    challenge: Uint8Array.from([0, 1, 2]),
                    rp: {
                      name: this.appName,
                      id: this.appHostname,
                    },
                    user: {
                      id: webAuthNCredentialPayload,
                      name: username + ` (${new Date().toLocaleString()})`,
                      displayName: username,
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                      authenticatorAttachment: "platform",
                    },
                    timeout: 60000,
                    attestation: "direct",
                  },
                });

                localStorage[localStorageKey] = JSON.stringify({
                  accountID,
                  accountSecret: secret,
                } satisfies LocalStorageData);
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
          logIn: async () => {
            const webAuthNCredential = (await navigator.credentials.get({
              publicKey: {
                challenge: Uint8Array.from([0, 1, 2]),
                rpId: this.appHostname,
                allowCredentials: [],
                timeout: 60000,
              },
            })) as unknown as {
              response: { userHandle: ArrayBuffer };
            };
            if (!webAuthNCredential) {
              throw new Error("Couldn't log in");
            }

            const webAuthNCredentialPayload = new Uint8Array(
              webAuthNCredential.response.userHandle,
            );
            const accountSecretSeed = webAuthNCredentialPayload.slice(
              0,
              cojsonInternals.secretSeedLength,
            );

            const secret = crypto.agentSecretFromSecretSeed(accountSecretSeed);

            const accountID = cojsonInternals.rawCoIDfromBytes(
              webAuthNCredentialPayload.slice(
                cojsonInternals.secretSeedLength,
                cojsonInternals.secretSeedLength +
                  cojsonInternals.shortHashLength,
              ),
            ) as ID<Account>;

            resolve({
              type: "existing",
              credentials: { accountID, secret },
              saveCredentials: async ({ accountID, secret }) => {
                localStorage[localStorageKey] = JSON.stringify({
                  accountID,
                  accountSecret: secret,
                } satisfies LocalStorageData);
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
        });
      });
    }
  }
}

/** @category Auth Providers */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserPasskeyAuth {
  export interface Driver {
    onReady: (next: {
      signUp: (username: string) => Promise<void>;
      logIn: () => Promise<void>;
    }) => void;
    onSignedIn: (next: { logOut: () => void }) => void;
    onError: (error: string | Error) => void;
  }
}

function logOut() {
  delete localStorage[localStorageKey];
}
