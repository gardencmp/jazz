import React from "react";
import { AuthProvider } from "jazz-browser";
import { Account } from "jazz-tools";

export type ReactAuthHook<Acc extends Account> = () => {
    auth: AuthProvider<Acc>;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};
export { DemoAuth, DemoAuthBasicUI, DemoAuthComponent } from "./DemoAuth.js";
export { PasskeyAuth, PasskeyAuthComponent } from "./PasskeyAuth.js";
export { PassphraseAuth, PassphraseAuthBasicUI, PassphraseAuthComponent } from "./PassphraseAuth.js";