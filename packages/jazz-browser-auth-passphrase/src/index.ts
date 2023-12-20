import {
    AccountID,
    AccountMigration,
    AgentSecret,
    cojsonInternals,
    LocalNode,
    Peer,
} from "cojson";
import { agentSecretFromSecretSeed } from "cojson/src/crypto";
import { AuthProvider, SessionProvider } from "jazz-browser";

type SessionStorageData = {
    accountID: AccountID;
    accountSecret: AgentSecret;
};

const sessionStorageKey = "jazz-logged-in-secret";

export interface BrowserPassphraseAuthDriver {
    onReady: (next: {
        signUp: (username: string, passphrase: string) => Promise<void>;
        logIn: (passphrase: string) => Promise<void>;
    }) => void;
    onSignedIn: (next: { logOut: () => void }) => void;
}

export class BrowserPassphraseAuth implements AuthProvider {
    driver: BrowserPassphraseAuthDriver;
    appName: string;
    appHostname: string;
    wordlist: string[];

    constructor(
        driver: BrowserPassphraseAuthDriver,
        wordlist: string[],
        appName: string,
        // TODO: is this a safe default?
        appHostname: string = window.location.hostname
    ) {
        this.driver = driver;
        this.wordlist = wordlist;
        this.appName = appName;
        this.appHostname = appHostname;
    }

    async createNode(
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        migration?: AccountMigration
    ): Promise<LocalNode> {
        if (sessionStorage[sessionStorageKey]) {
            const sessionStorageData = JSON.parse(
                sessionStorage[sessionStorageKey]
            ) as SessionStorageData;

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
                        signUp: async (username, passphrase) => {
                            const node = await signUp(
                                username,
                                passphrase,
                                this.wordlist,
                                getSessionFor,
                                this.appName,
                                this.appHostname,
                                migration
                            );
                            for (const peer of initialPeers) {
                                node.syncManager.addPeer(peer);
                            }
                            doneSigningUpOrLoggingIn(node);
                            this.driver.onSignedIn({ logOut });
                        },
                        logIn: async (passphrase: string) => {
                            const node = await logIn(
                                passphrase,
                                this.wordlist,
                                getSessionFor,
                                this.appHostname,
                                initialPeers,
                                migration
                            );
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

import * as bip39 from '@scure/bip39';

async function signUp(
    username: string,
    passphrase: string,
    wordlist: string[],
    getSessionFor: SessionProvider,
    appName: string,
    appHostname: string,
    migration?: AccountMigration
): Promise<LocalNode> {
    const secretSeed = bip39.mnemonicToEntropy(passphrase, wordlist);

    const { node, accountID, accountSecret } =
        await LocalNode.withNewlyCreatedAccount({
            name: username,
            initialAgentSecret: agentSecretFromSecretSeed(secretSeed),
            migration,
        });

    sessionStorage[sessionStorageKey] = JSON.stringify({
        accountID,
        accountSecret,
    } satisfies SessionStorageData);

    node.currentSessionID = await getSessionFor(accountID);

    return node;
}

async function logIn(
    passphrase: string,
    wordlist: string[],
    getSessionFor: SessionProvider,
    appHostname: string,
    initialPeers: Peer[],
    migration?: AccountMigration
): Promise<LocalNode> {

    const accountSecretSeed = bip39.mnemonicToEntropy(passphrase, wordlist);

    const accountSecret = agentSecretFromSecretSeed(accountSecretSeed);

    if (!accountSecret) {
        throw new Error("Invalid credential");
    }

    const accountID = cojsonInternals.idforHeader(cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret)) as AccountID;

    sessionStorage[sessionStorageKey] = JSON.stringify({
        accountID,
        accountSecret,
    } satisfies SessionStorageData);

    const node = await LocalNode.withLoadedAccount({
        accountID,
        accountSecret,
        sessionID: await getSessionFor(accountID),
        peersToLoadFrom: initialPeers,
        migration,
    });

    return node;
}

function logOut() {
    delete sessionStorage[sessionStorageKey];
}
