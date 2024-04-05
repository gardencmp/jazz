import React from "react";
import { AuthProvider } from "jazz-browser";


export type ReactAuthHook = () => {
    auth: AuthProvider;
    AuthUI: React.ReactNode;
    logOut?: () => void;
};
export { DemoAuth } from "./DemoAuth.js";
export { PasskeyAuth } from "./PasskeyAuth.js";
export { PassphraseAuth } from "./PassphraseAuth.js";