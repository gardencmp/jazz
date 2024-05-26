import React from "react";
import { AuthProvider } from "jazz-browser";
import { Account } from "jazz-tools";

export type AuthState = "loading" | "ready" | "signedIn";

/** @category Auth Providers */
export type ReactAuthHook<Acc extends Account> = (
    setJazzAuthState: (state: AuthState) => void,
) => {
    auth: AuthProvider<Acc>;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};
export { DemoAuth } from "./DemoAuth.js";
export { PasskeyAuth } from "./PasskeyAuth.js";
export { PassphraseAuth } from "./PassphraseAuth.js";
