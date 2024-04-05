import {
    AccountSchema,
    AccountMigration,
    Peer,
    controlledAccountSym,
} from "jazz-js";
import { SessionProvider } from "..";

export interface AuthProvider {
    createOrLoadAccount<A extends AccountSchema>(
        accountSchema: A,
        getSessionFor: SessionProvider,
        initialPeers: Peer[],
        migration?: AccountMigration<A>
    ): Promise<A[controlledAccountSym]>;
}

export { BrowserDemoAuth, BrowserDemoAuthDriver } from "./DemoAuth.js";
export { BrowserPasskeyAuth, BrowserPasskeyAuthDriver } from "./PasskeyAuth.js";
export { BrowserPassphraseAuth, BrowserPassphraseAuthDriver } from "./PassphraseAuth.js";