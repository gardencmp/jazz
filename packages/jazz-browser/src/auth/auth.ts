import { Account, Me, Peer } from "jazz-tools";
import { SessionProvider } from "..";

export interface AuthProvider<Acc extends Account> {
    createOrLoadAccount(
        getSessionFor: SessionProvider,
        initialPeers: Peer[]
    ): Promise<Acc & Me>;
}

export { BrowserDemoAuth, type BrowserDemoAuthDriver } from "./DemoAuth.js";
export {
    BrowserPasskeyAuth,
    type BrowserPasskeyAuthDriver,
} from "./PasskeyAuth.js";
export {
    BrowserPassphraseAuth,
    type BrowserPassphraseAuthDriver,
} from "./PassphraseAuth.js";
