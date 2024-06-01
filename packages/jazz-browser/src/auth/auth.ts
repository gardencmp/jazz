import { Account, CryptoProvider, Peer } from "jazz-tools";
import { SessionProvider } from "../index.js";

/** @category Auth Providers */
export interface AuthProvider<Acc extends Account> {
    createOrLoadAccount(
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        crypto: CryptoProvider,
    ): Promise<Acc>;
}

export { BrowserDemoAuth } from "./DemoAuth.js";
export { BrowserPasskeyAuth } from "./PasskeyAuth.js";
export { BrowserPassphraseAuth } from "./PassphraseAuth.js";
