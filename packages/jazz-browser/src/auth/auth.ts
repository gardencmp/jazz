import { Account, CryptoProvider, Me, Peer } from "jazz-tools";
import { SessionProvider } from "../index.js";

/** @category Auth Providers */
export interface AuthProvider<Acc extends Account> {
    createOrLoadAccount(
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        crypto: CryptoProvider,
    ): Promise<Acc & Me>;
}

export { BrowserDemoAuth } from "./DemoAuth.js";
export { BrowserPasskeyAuth } from "./PasskeyAuth.js";
export { BrowserPassphraseAuth } from "./PassphraseAuth.js";
