import React from "react";
import { useMemo, useState, ReactNode } from "react";
import { BrowserLocalAuth } from "jazz-browser-auth-local";
import { ReactAuthHook } from "jazz-react";
import { AccountMigration } from "cojson";

export type LocalAuthComponent = (props: {
    loading: boolean;
    logIn: () => void;
    signUp: (username: string) => void;
}) => ReactNode;

export function LocalAuth({
    appName,
    appHostname,
    Component = LocalAuthBasicUI,
}: {
    appName: string;
    appHostname?: string;
    Component?: LocalAuthComponent;
}): ReactAuthHook {
    return function useLocalAuth() {
        const [authState, setAuthState] = useState<
            | { state: "loading" }
            | {
                  state: "ready";
                  logIn: () => void;
                  signUp: (username: string) => void;
              }
            | { state: "signedIn"; logOut: () => void }
        >({ state: "loading" });

        const [logOutCounter, setLogOutCounter] = useState(0);

        const auth = useMemo(() => {
            return new BrowserLocalAuth(
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
                appName,
                appHostname,
            );
        }, [appName, appHostname, logOutCounter]);

        const AuthUI =
            authState.state === "ready"
                ? Component({
                      loading: false,
                      logIn: authState.logIn,
                      signUp: authState.signUp,
                  })
                : Component({
                      loading: false,
                      logIn: () => {},
                      signUp: (_) => {},
                  });

        return {
            auth,
            AuthUI,
            logOut:
                authState.state === "signedIn" ? authState.logOut : undefined,
        };
    };
}

export const LocalAuthBasicUI = ({
    logIn,
    signUp,
}: {
    logIn: () => void;
    signUp: (username: string) => void;
}) => {
    const [username, setUsername] = useState<string>("");

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <div
                style={{
                    width: "18rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                }}
            >
                <form
                    style={{
                        width: "18rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        signUp(username);
                    }}
                >
                    <input
                        placeholder="Display name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="webauthn"
                        style={{
                            border: "1px solid #333",
                            padding: "10px 5px",
                        }}
                    />
                    <input
                        type="submit"
                        value="Sign Up as new account"
                        style={{
                            background: "#aaa",
                            padding: "10px 5px",
                        }}
                    />
                </form>
                <button
                    onClick={logIn}
                    style={{ background: "#aaa", padding: "10px 5px" }}
                >
                    Log In with existing account
                </button>
            </div>
        </div>
    );
};
