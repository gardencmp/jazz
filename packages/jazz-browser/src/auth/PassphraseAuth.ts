import {
    AccountID,
    AgentSecret,
    cojsonInternals,
    LocalNode,
    Peer,
    RawAccountMigration,
    RawControlledAccount,
} from "cojson";
import { agentSecretFromSecretSeed } from "cojson/src/crypto";
import { AuthProvider, SessionProvider } from "jazz-browser";

type LocalStorageData = {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
};

const localStorageKey = "jazz-logged-in-secret";

export interface BrowserPassphraseAuthDriver {
    onReady: (next: {
        signUp: (username: string, passphrase: string) => Promise<void>;
        logIn: (passphrase: string) => Promise<void>;
    }) => void;
    onSignedIn: (next: { logOut: () => void }) => void;
}

export class BrowserPassphraseAuth<Acc extends Account>
    implements AuthProvider<Acc>
{
    constructor(
        public accountSchema: CoValueClass<Acc> & typeof Account,
        public driver: BrowserPassphraseAuthDriver,
        public wordlist: string[],
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
                        signUp: async (username, passphrase) => {
                            const node = await signUp(
                                username,
                                passphrase,
                                this.wordlist,
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
                        logIn: async (passphrase: string) => {
                            const node = await logIn(
                                passphrase,
                                this.wordlist,
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

            return Promise.resolve(account);
        }
    }
}

import * as bip39 from "@scure/bip39";
import { Account, CoValueClass, ID, Me } from "jazz-tools";

async function signUp(
    username: string,
    passphrase: string,
    wordlist: string[],
    getSessionFor: SessionProvider,
    _appName: string,
    _appHostname: string,
    migration?: RawAccountMigration
): Promise<LocalNode> {
    const secretSeed = bip39.mnemonicToEntropy(passphrase, wordlist);

    const { node, accountID, accountSecret } =
        await LocalNode.withNewlyCreatedAccount({
            name: username,
            initialAgentSecret: agentSecretFromSecretSeed(secretSeed),
            migration,
        });

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
    passphrase: string,
    wordlist: string[],
    getSessionFor: SessionProvider,
    _appHostname: string,
    initialPeers: Peer[],
    migration?: RawAccountMigration
): Promise<LocalNode> {
    const accountSecretSeed = bip39.mnemonicToEntropy(passphrase, wordlist);

    const accountSecret = agentSecretFromSecretSeed(accountSecretSeed);

    if (!accountSecret) {
        throw new Error("Invalid credential");
    }

    const accountID = cojsonInternals.idforHeader(
        cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret)
    ) as AccountID;

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
