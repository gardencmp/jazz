import {
    AccountID,
    AgentSecret,
    cojsonInternals,
    LocalNode,
    Peer,
    RawAccountMigration,
    RawControlledAccount,
} from "cojson";
import { AuthProvider, SessionProvider } from "jazz-browser";
import { Account, CoValueClass, ID, Me } from "jazz-tools";

type LocalStorageData = {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
};

const localStorageKey = "jazz-logged-in-secret";

export interface BrowserPasskeyAuthDriver {
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
        const rawMigration = (account: RawControlledAccount) => {
            return this.accountSchema.fromRaw(account).migrate?.();
        };

        if (localStorage[localStorageKey]) {
            const localStorageData = JSON.parse(
                localStorage[localStorageKey]
            ) as LocalStorageData;

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
                            const node = await signUp(
                                username,
                                getSessionFor,
                                this.appName,
                                this.appHostname,
                                rawMigration
                            );
                            for (const peer of initialPeers) {
                                node.syncManager.addPeer(peer);
                            }
                            doneSigningUpOrLoggingIn(node);
                            this.driver.onSignedIn({ logOut });
                        },
                        logIn: async () => {
                            const node = await logIn(
                                getSessionFor,
                                this.appHostname,
                                initialPeers,
                                rawMigration
                            );
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

async function signUp(
    username: string,
    getSessionFor: SessionProvider,
    appName: string,
    appHostname: string,
    migration?: RawAccountMigration
): Promise<LocalNode> {
    const secretSeed = cojsonInternals.newRandomSecretSeed();

    const { node, accountID, accountSecret } =
        await LocalNode.withNewlyCreatedAccount({
            name: username,
            initialAgentSecret:
                cojsonInternals.agentSecretFromSecretSeed(secretSeed),
            migration,
        });

    const webAuthNCredentialPayload = new Uint8Array(
        cojsonInternals.secretSeedLength + cojsonInternals.shortHashLength
    );

    webAuthNCredentialPayload.set(secretSeed);
    webAuthNCredentialPayload.set(
        cojsonInternals.rawCoIDtoBytes(accountID),
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

    console.log(webAuthNCredential, accountID);

    localStorage[localStorageKey] = JSON.stringify({
        accountID: accountID as unknown as ID<Account>,
        accountSecret,
    } satisfies LocalStorageData);

    node.currentSessionID = await getSessionFor(
        accountID as unknown as ID<Account>
    );

    return node;
}

async function logIn(
    getSessionFor: SessionProvider,
    appHostname: string,
    initialPeers: Peer[],
    migration?: RawAccountMigration
): Promise<LocalNode> {
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
    ) as AccountID;

    const accountSecret =
        cojsonInternals.agentSecretFromSecretSeed(accountSecretSeed);

    if (!accountSecret) {
        throw new Error("Invalid credential");
    }

    localStorage[localStorageKey] = JSON.stringify({
        accountID: accountID as unknown as ID<Account>,
        accountSecret,
    } satisfies LocalStorageData);

    const node = await LocalNode.withLoadedAccount({
        accountID,
        accountSecret,
        sessionID: await getSessionFor(accountID as unknown as ID<Account>),
        peersToLoadFrom: initialPeers,
        migration,
    });

    return node;
}

function logOut() {
    delete localStorage[localStorageKey];
}
