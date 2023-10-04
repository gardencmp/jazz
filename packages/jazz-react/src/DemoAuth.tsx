import { ReactNode, useMemo, useState } from "react";
import { BrowserDemoAuth } from "jazz-browser";
import { ReactAuthHook } from ".";
import React from "react";

export type DemoAuthComponent = (props: {
    loading: boolean;
    existingUsers: string[];
    logInAs: (existingUser: string) => void;
    signUp: (username: string) => void;
}) => ReactNode;

export function DemoAuth({
    appName,
    appHostname,
    Component = DemoAuthBasicUI,
}: {
    appName: string;
    appHostname?: string;
    Component?: DemoAuthComponent;
}): ReactAuthHook {
    return function useLocalAuth() {
        const [authState, setAuthState] = useState<
            | { state: "loading" }
            | {
                  state: "ready";
                  existingUsers: string[];
                  logInAs: (existingUser: string) => void;
                  signUp: (username: string) => void;
              }
            | { state: "signedIn"; logOut: () => void }
        >({ state: "loading" });

        const [logOutCounter, setLogOutCounter] = useState(0);

        const auth = useMemo(() => {
            return new BrowserDemoAuth(
                {
                    onReady(next) {
                        setAuthState({
                            state: "ready",
                            existingUsers: next.existingUsers,
                            logInAs: next.logInAs,
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
                appName
            );
        }, [appName, appHostname, logOutCounter]);

        const AuthUI =
            authState.state === "ready"
                ? Component({
                      loading: false,
                      existingUsers: authState.existingUsers,
                      logInAs: authState.logInAs,
                      signUp: authState.signUp,
                  })
                : Component({
                      loading: false,
                      existingUsers: [],
                      logInAs: () => {},
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

export const DemoAuthBasicUI = ({
    existingUsers,
    logInAs,
    signUp,
}: {
    existingUsers: string[];
    logInAs: (existingUser: string) => void;
    signUp: (username: string) => void;
}) => {
    const [username, setUsername] = useState<string>("");

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
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {existingUsers.map((user) => (
                        <button
                            key={user}
                            onClick={() => logInAs(user)}
                            style={{
                                background: "#000",
                                color: "#fff",
                                padding: "13px 5px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                            }}
                        >
                            Log In as "{user}"
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
