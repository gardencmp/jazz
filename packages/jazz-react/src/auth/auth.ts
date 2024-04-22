import React from "react";
import { AuthProvider } from "jazz-browser";
import { Account } from "jazz-tools";

export type ReactAuthHook<Acc extends Account> = () => {
    auth: AuthProvider<Acc>;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};
export {
    DemoAuth,
    DemoAuthBasicUI,
    type DemoAuthComponent,
} from "./DemoAuth.js";
export { PasskeyAuth, type PasskeyAuthComponent } from "./PasskeyAuth.js";
export {
    PassphraseAuth,
    PassphraseAuthBasicUI,
    type PassphraseAuthComponent,
} from "./PassphraseAuth.js";
