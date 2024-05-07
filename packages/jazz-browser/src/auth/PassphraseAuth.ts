import { AgentSecret, cojsonInternals, Peer } from "cojson";
import { Account, CoValueClass, ID, Me } from "jazz-tools";
import { AuthProvider, SessionProvider } from "jazz-browser";
import * as bip39 from "@scure/bip39";

type LocalStorageData = {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
};

const localStorageKey = "jazz-logged-in-secret";

interface BrowserPassphraseAuthDriver {
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
                    signUp: async (username, passphrase) => {
                        const account = await signUp<Acc>(
                            username,
                            passphrase,
                            this.wordlist,
                            getSessionFor,
                            this.appName,
                            this.appHostname,
                            this.accountSchema,
                            initialPeers
                        );
                        resolveAccount(account);
                        this.driver.onSignedIn({ logOut });
                    },
                    logIn: async (passphrase: string) => {
                        const account = await logIn<Acc>(
                            passphrase,
                            this.wordlist,
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
export namespace BrowserPassphraseAuth {
    export type Driver = BrowserPassphraseAuthDriver;
}

async function signUp<Acc extends Account>(
    username: string,
    passphrase: string,
    wordlist: string[],
    getSessionFor: SessionProvider,
    _appName: string,
    _appHostname: string,
    accountSchema: CoValueClass<Acc> & typeof Account,
    initialPeers: Peer[]
): Promise<Acc & Me> {
    const secretSeed = bip39.mnemonicToEntropy(passphrase, wordlist);

    const account = (await accountSchema.create({
        creationProps: { name: username },
        initialAgentSecret:
            cojsonInternals.agentSecretFromSecretSeed(secretSeed),
        peersToLoadFrom: initialPeers,
    })) as Acc & Me;

    localStorage[localStorageKey] = JSON.stringify({
        accountID: account.id as ID<Account>,
        accountSecret: account._raw.agentSecret,
    } satisfies LocalStorageData);

    account._raw.core.node.currentSessionID = await getSessionFor(account.id);

    return account;
}

async function logIn<Acc extends Account>(
    passphrase: string,
    wordlist: string[],
    getSessionFor: SessionProvider,
    _appHostname: string,
    accountSchema: CoValueClass<Acc> & typeof Account,
    initialPeers: Peer[]
): Promise<Acc & Me> {
    const accountSecretSeed = bip39.mnemonicToEntropy(passphrase, wordlist);

    const accountSecret =
        cojsonInternals.agentSecretFromSecretSeed(accountSecretSeed);

    if (!accountSecret) {
        throw new Error("Invalid credential");
    }

    const accountID = cojsonInternals.idforHeader(
        cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret)
    ) as ID<Acc>;

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
