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
import {
    AccountMigration,
    AccountSchema,
    AnyAccount,
    controlledAccountSym,
    ID,
} from "jazz-js";

type LocalStorageData = {
    accountID: ID<AnyAccount>;
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

export class BrowserPasskeyAuth implements AuthProvider {
    driver: BrowserPasskeyAuthDriver;
    appName: string;
    appHostname: string;

    constructor(
        driver: BrowserPasskeyAuthDriver,
        appName: string,
        // TODO: is this a safe default?
        appHostname: string = window.location.hostname
    ) {
        this.driver = driver;
        this.appName = appName;
        this.appHostname = appHostname;
    }

    async createOrLoadAccount<A extends AccountSchema>(
        accountSchema: A,
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        migration?: AccountMigration<A>
    ): Promise<A[controlledAccountSym]> {
        const rawMigration = (account: RawControlledAccount) => {
            return migration?.(
                accountSchema.fromRaw(account) as A[controlledAccountSym]
            );
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

            const account = accountSchema.fromRaw(
                node.account as RawControlledAccount
            ) as A[controlledAccountSym];

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

            const account = accountSchema.fromRaw(
                node.account as RawControlledAccount
            ) as A[controlledAccountSym];

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
        accountID: accountID as unknown as ID<AnyAccount>,
        accountSecret,
    } satisfies LocalStorageData);

    node.currentSessionID = await getSessionFor(
        accountID as unknown as ID<AnyAccount>
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
        accountID: accountID as unknown as ID<AnyAccount>,
        accountSecret,
    } satisfies LocalStorageData);

    const node = await LocalNode.withLoadedAccount({
        accountID,
        accountSecret,
        sessionID: await getSessionFor(accountID as unknown as ID<AnyAccount>),
        peersToLoadFrom: initialPeers,
        migration,
    });

    return node;
}

function logOut() {
    delete localStorage[localStorageKey];
}
