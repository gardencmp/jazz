import { AccountID, AgentSecret, cojsonInternals, Peer } from "cojson";
import { AuthProvider, SessionProvider } from "jazz-browser";
import { Account, CoValueClass, ID, Me } from "jazz-tools";

type LocalStorageData = {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
};

const localStorageKey = "jazz-logged-in-secret";

interface BrowserPasskeyAuthDriver {
    onReady: (next: {
        signUp: (username: string) => Promise<void>;
        logIn: () => Promise<void>;
    }) => void;
    onSignedIn: (next: { logOut: () => void }) => void;
}

export class BrowserPasskeyAuth<Acc extends Account>
    implements AuthProvider<Acc>
{
    constructor(
        public accountSchema: CoValueClass<Acc> & typeof Account,
        public driver: BrowserPasskeyAuthDriver,
        public appName: string,
        // TODO: is this a safe default?
        public appHostname: string = window.location.hostname
    ) {}

    async createOrLoadAccount(
        getSessionFor: SessionProvider,
        initialPeers: Peer[]
    ): Promise<Acc & Me> {
        if (localStorage[localStorageKey]) {
            const localStorageData = JSON.parse(
                localStorage[localStorageKey]
            ) as LocalStorageData;

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
                        const account = await signUp<Acc>(
                            username,
                            getSessionFor,
                            this.appName,
                            this.appHostname,
                            this.accountSchema,
                            initialPeers
                        );

                        resolveAccount(account);
                        this.driver.onSignedIn({ logOut });
                    },
                    logIn: async () => {
                        const account = await logIn<Acc>(
                            getSessionFor,
                            this.appHostname,
                            this.accountSchema,
                            initialPeers
                        );
                        resolveAccount(account);
                        this.driver.onSignedIn({ logOut });
                    },
                });
            });
        }
    }
}

/** @category Auth Providers */
export namespace BrowserPasskeyAuth {
    export type Driver = BrowserPasskeyAuthDriver;
}

async function signUp<Acc extends Account>(
    username: string,
    getSessionFor: SessionProvider,
    appName: string,
    appHostname: string,
    accountSchema: CoValueClass<Acc> & typeof Account,
    initialPeers: Peer[]
): Promise<Acc & Me> {
    const secretSeed = cojsonInternals.newRandomSecretSeed();

    const account = (await accountSchema.create({
        creationProps: { name: username },
        initialAgentSecret:
            cojsonInternals.agentSecretFromSecretSeed(secretSeed),
        peersToLoadFrom: initialPeers,
    })) as Acc & Me;

    const webAuthNCredentialPayload = new Uint8Array(
        cojsonInternals.secretSeedLength + cojsonInternals.shortHashLength
    );

    webAuthNCredentialPayload.set(secretSeed);
    webAuthNCredentialPayload.set(
        cojsonInternals.rawCoIDtoBytes(account.id as unknown as AccountID),
        cojsonInternals.secretSeedLength
    );

    const webAuthNCredential = await navigator.credentials.create({
        publicKey: {
            challenge: Uint8Array.from([0, 1, 2]),
            rp: {
                name: appName,
                id: appHostname,
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

    console.log(webAuthNCredential, account.id);

    localStorage[localStorageKey] = JSON.stringify({
        accountID: account.id,
        accountSecret: account._raw.agentSecret,
    } satisfies LocalStorageData);

    account._raw.core.node.currentSessionID = await getSessionFor(account.id);

    return account;
}

async function logIn<Acc extends Account>(
    getSessionFor: SessionProvider,
    appHostname: string,
    accountSchema: CoValueClass<Acc> & typeof Account,
    initialPeers: Peer[]
): Promise<Acc & Me> {
    const webAuthNCredential = (await navigator.credentials.get({
        publicKey: {
            challenge: Uint8Array.from([0, 1, 2]),
            rpId: appHostname,
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
        webAuthNCredential.response.userHandle
    );
    const accountSecretSeed = webAuthNCredentialPayload.slice(
        0,
        cojsonInternals.secretSeedLength
    );

    const accountID = cojsonInternals.rawCoIDfromBytes(
        webAuthNCredentialPayload.slice(
            cojsonInternals.secretSeedLength,
            cojsonInternals.secretSeedLength + cojsonInternals.shortHashLength
        )
    ) as ID<Acc>;

    const accountSecret =
        cojsonInternals.agentSecretFromSecretSeed(accountSecretSeed);

    if (!accountSecret) {
        throw new Error("Invalid credential");
    }

    localStorage[localStorageKey] = JSON.stringify({
        accountID: accountID,
        accountSecret,
    } satisfies LocalStorageData);

    const account = (await accountSchema.become({
        accountID,
        accountSecret,
        sessionID: await getSessionFor(accountID),
        peersToLoadFrom: initialPeers,
    })) as Acc & Me;

    return account;
}

function logOut() {
    delete localStorage[localStorageKey];
}
