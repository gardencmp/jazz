import { useMemo, useState, ReactNode } from "react";
import { BrowserPasskeyAuth } from "jazz-browser";
import { ReactAuthHook } from "./auth";

export type PasskeyAuthComponent = (props: {
    loading: boolean;
    logIn: () => void;
    signUp: (username: string) => void;
}) => ReactNode;

export function PasskeyAuth({
    appName,
    appHostname,
    Component = LocalAuthBasicUI,
}: {
    appName: string;
    appHostname?: string;
    Component?: PasskeyAuthComponent;
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
            return new BrowserPasskeyAuth(
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
                appHostname
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
                      loading: true,
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
                            cursor: "pointer"
                        }}
                    />
                </form>
                <button
                    onClick={logIn}
                    style={{
                        background: "#000",
                        color: "#fff",
                        padding: "13px 5px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Log In with existing account
                </button>
            </div>
        </div>
    );
};
