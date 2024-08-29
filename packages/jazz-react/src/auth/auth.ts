import React from "react";
import { AuthMethod } from "jazz-tools";

export type AuthState = "loading" | "ready" | "signedIn";

/** @category Auth Methods */
export const AuthMethodCtx = React.createContext<AuthMethod | undefined>(
    undefined,
);

export { DemoAuth } from "./DemoAuth.js";
export { PasskeyAuth, usePasskeyAuth } from "./PasskeyAuth.js";
export { PassphraseAuth } from "./PassphraseAuth.js";
