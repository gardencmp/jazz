import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { BrowserDemoAuth } from "jazz-browser";
import { Account, ID } from "jazz-tools";
import { AgentSecret } from "cojson";
import { AuthMethodCtx } from "./auth.js";

type DemoAuthState =
    | {
          state: "uninitialized";
      }
    | {
          state: "loading";
      }
    | {
          state: "ready";
          existingUsers: string[];
          signUp: (username: string) => void;
          logInAs: (existingUser: string) => void;
      }
    | {
          state: "signedIn";
          logOut: () => void;
      };

const DemoAuthStateCtx = createContext<{
    state: DemoAuthState;
    errors: string[];
}>({
    state: { state: "uninitialized" },
    errors: [],
});

/** @category Auth Providers */
export function DemoAuth({
    children,
    seedAccounts,
}: {
    children: ReactNode;
    seedAccounts?: {
        [name: string]: { accountID: ID<Account>; accountSecret: AgentSecret };
    };
}) {
    const [errors, setErrors] = useState<string[]>([]);
    const [state, setState] = useState<DemoAuthState>({ state: "loading" });

    const authMethod = useMemo(() => {
        return new BrowserDemoAuth(
            {
                onReady: ({ signUp, existingUsers, logInAs }) => {
                    setState({
                        state: "ready",
                        signUp,
                        existingUsers,
                        logInAs,
                    });
                },
                onSignedIn: ({ logOut }) => {
                    setState({ state: "signedIn", logOut });
                },
                onError: (error) => {
                    setErrors((errors) => [...errors, error.toString()]);
                },
            },
            seedAccounts,
        );
    }, [seedAccounts]);

    return (
        <DemoAuthStateCtx.Provider value={{ state, errors }}>
            <AuthMethodCtx.Provider value={authMethod}>
                {children}
            </AuthMethodCtx.Provider>
        </DemoAuthStateCtx.Provider>
    );
}

const DemoAuthBasicUI = ({ appName }: { appName: string }) => {
    const { state, errors } = useContext(DemoAuthStateCtx);
    const [username, setUsername] = useState<string>("");
    const darkMode =
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : false;

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...(darkMode ? { background: "#000" } : {}),
            }}
        >
            {state.state === "loading" ? (
                <div>Loading...</div>
            ) : state.state === "ready" ? (
                <div
                    style={{
                        width: "18rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2rem",
                    }}
                >
                    <h1
                        style={{
                            color: darkMode ? "#fff" : "#000",
                            textAlign: "center",
                        }}
                    >
                        {appName}
                    </h1>
                    {errors.map((error) => (
                        <div key={error} style={{ color: "red" }}>
                            {error}
                        </div>
                    ))}
                    <form
                        style={{
                            width: "18rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        }}
                        onSubmit={(e) => {
                            e.preventDefault();
                            state.signUp(username);
                        }}
                    >
                        <input
                            placeholder="Display name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="webauthn"
                            style={{
                                border: darkMode
                                    ? "2px solid #444"
                                    : "2px solid #ddd",
                                padding: "11px 8px",
                                borderRadius: "6px",
                                background: darkMode ? "#000" : "#fff",
                                color: darkMode ? "#fff" : "#000",
                            }}
                        />
                        <input
                            type="submit"
                            value="Sign Up as new account"
                            style={{
                                padding: "13px 5px",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                background: darkMode ? "#444" : "#ddd",
                                color: darkMode ? "#fff" : "#000",
                            }}
                        />
                    </form>
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                        }}
                    >
                        {state.existingUsers.map((user) => (
                            <button
                                key={user}
                                onClick={() => state.logInAs(user)}
                                style={{
                                    background: darkMode ? "#222" : "#eee",
                                    color: darkMode ? "#fff" : "#000",
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
            ) : null}
        </div>
    );
};

/** @category Auth Providers */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DemoAuth {
    export const BasicUI = DemoAuthBasicUI;
}
