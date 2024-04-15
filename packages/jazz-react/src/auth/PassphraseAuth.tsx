import { useMemo, useState, ReactNode } from "react";
import { BrowserPassphraseAuth } from "jazz-browser";
import { ReactAuthHook } from "jazz-react";

import { generateMnemonic } from "@scure/bip39";
import { cojsonInternals } from "cojson";
import { Account, CoValueClass } from "jazz-tools";

export type PassphraseAuthComponent = (props: {
    loading: boolean;
    logIn: (passphrase: string) => void;
    signUp: (username: string, passphrase: string) => void;
    generateRandomPassphrase: () => string;
}) => ReactNode;

export function PassphraseAuth<Acc extends Account>({
    accountSchema,
    appName,
    appHostname,
    wordlist,
    Component = PassphraseAuthBasicUI,
}: {
    accountSchema: CoValueClass<Acc> & typeof Account;
    appName: string;
    appHostname?: string;
    wordlist: string[];
    Component?: PassphraseAuthComponent;
}): ReactAuthHook<Acc> {
    return function useLocalAuth() {
        const [authState, setAuthState] = useState<
            | { state: "loading" }
            | {
                  state: "ready";
                  logIn: (passphrase: string) => void;
                  signUp: (username: string, passphrase: string) => void;
              }
            | { state: "signedIn"; logOut: () => void }
        >({ state: "loading" });

        const [logOutCounter, setLogOutCounter] = useState(0);

        const auth = useMemo(() => {
            return new BrowserPassphraseAuth<Acc>(
                accountSchema,
                {
                    onReady(next) {
                        setAuthState({
                            state: "ready",
                            logIn: next.logIn,
                            signUp: next.signUp,
                        });
                    },
                    onSignedIn(next) {
                        setAuthState({
                            state: "signedIn",
                            logOut: () => {
                                next.logOut();
                                setAuthState({ state: "loading" });
                                setLogOutCounter((c) => c + 1);
                            },
                        });
                    },
                },
                wordlist,
                appName,
                appHostname
            );
        }, [appName, appHostname, logOutCounter]);

        const generateRandomPassphrase = () => {
            return generateMnemonic(
                wordlist,
                cojsonInternals.secretSeedLength * 8
            );
        };

        const AuthUI =
            authState.state === "ready"
                ? Component({
                      loading: false,
                      logIn: authState.logIn,
                      signUp: authState.signUp,
                      generateRandomPassphrase,
                  })
                : Component({
                      loading: false,
                      logIn: () => {},
                      signUp: (_) => {},
                      generateRandomPassphrase,
                  });

        return {
            auth,
            AuthUI,
            logOut:
                authState.state === "signedIn" ? authState.logOut : undefined,
        };
    };
}

export const PassphraseAuthBasicUI = ({
    logIn,
    signUp,
    generateRandomPassphrase,
}: {
    logIn: (passphrase: string) => void;
    signUp: (username: string, passphrase: string) => void;
    generateRandomPassphrase: () => string;
}) => {
    const [username, setUsername] = useState<string>("");
    const [passphrase, setPassphrase] = useState<string>("");
    const [loginPassphrase, setLoginPassphrase] = useState<string>("");

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    width: "30rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                }}
            >
                <form
                    style={{
                        width: "30rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setPassphrase("");
                        setUsername("");
                        signUp(username, passphrase);
                    }}
                >
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <textarea
                            placeholder="Passphrase"
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            style={{
                                border: "2px solid #000",
                                padding: "11px 8px",
                                borderRadius: "6px",
                                height: "7rem",
                                flex: 1,
                            }}
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                setPassphrase(generateRandomPassphrase());
                                e.preventDefault();
                            }}
                            style={{
                                padding: "11px 8px",
                                borderRadius: "6px",
                                background: "#eee",
                            }}
                        >
                            Random
                        </button>
                    </div>
                    <input
                        placeholder="Display name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{
                            border: "2px solid #000",
                            padding: "11px 8px",
                            borderRadius: "6px",
                        }}
                    />
                    <input
                        type="submit"
                        value="Sign Up as new account"
                        style={{
                            background: "#000",
                            color: "#fff",
                            padding: "13px 5px",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    />
                </form>
                <div style={{ textAlign: "center" }}>&mdash; or &mdash;</div>
                <form
                    style={{
                        width: "30rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        setLoginPassphrase("");
                        logIn(loginPassphrase);
                    }}
                >
                    <textarea
                        placeholder="Passphrase"
                        value={loginPassphrase}
                        onChange={(e) => setLoginPassphrase(e.target.value)}
                        style={{
                            border: "2px solid #000",
                            padding: "11px 8px",
                            borderRadius: "6px",
                            height: "7rem",
                        }}
                    />
                    <input
                        type="submit"
                        value="Log in as existing account"
                        style={{
                            background: "#000",
                            color: "#fff",
                            padding: "13px 5px",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                        }}
                    />
                </form>
            </div>
        </div>
    );
};
