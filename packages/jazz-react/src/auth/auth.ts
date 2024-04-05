import React from "react";
import { AuthProvider } from "jazz-browser";


export type ReactAuthHook = () => {
    auth: AuthProvider;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};
export { DemoAuth, DemoAuthBasicUI, DemoAuthComponent } from "./DemoAuth.js";
export { PasskeyAuth, PasskeyAuthComponent } from "./PasskeyAuth.js";
export { PassphraseAuth, PassphraseAuthBasicUI, PassphraseAuthComponent } from "./PassphraseAuth.js";