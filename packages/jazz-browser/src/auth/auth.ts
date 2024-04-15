import { Account, Me, Peer } from "jazz-tools";
import { SessionProvider } from "..";

export interface AuthProvider<Acc extends Account> {
    createOrLoadAccount(
        getSessionFor: SessionProvider,
        initialPeers: Peer[]
    ): Promise<Acc & Me>;
}

export { BrowserDemoAuth, BrowserDemoAuthDriver } from "./DemoAuth.js";
export { BrowserPasskeyAuth, BrowserPasskeyAuthDriver } from "./PasskeyAuth.js";
export {
    BrowserPassphraseAuth,
    BrowserPassphraseAuthDriver,
} from "./PassphraseAuth.js";
