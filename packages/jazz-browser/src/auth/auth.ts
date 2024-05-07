import { Account, Me, Peer } from "jazz-tools";
import { SessionProvider } from "..";

/** @category Auth Providers */
export interface AuthProvider<Acc extends Account> {
    createOrLoadAccount(
        getSessionFor: SessionProvider,
        initialPeers: Peer[]
    ): Promise<Acc & Me>;
}

export { BrowserDemoAuth } from "./DemoAuth.js";
export { BrowserPasskeyAuth } from "./PasskeyAuth.js";
export { BrowserPassphraseAuth } from "./PassphraseAuth.js";
