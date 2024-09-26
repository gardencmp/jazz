import { useMemo, useState } from "react";
import { BrowserDemoAuth } from "jazz-browser";
import { Account, ID } from "jazz-tools";
import { AgentSecret } from "cojson";

type DemoAuthState = (
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
      }
) & {
    errors: string[];
};

/** @category Auth Providers */
export function useDemoAuth({
    seedAccounts,
}: {
    seedAccounts?: {
        [name: string]: { accountID: ID<Account>; accountSecret: AgentSecret };
    };
} = {}) {
    const [state, setState] = useState<DemoAuthState>({
        state: "loading",
        errors: [],
    });

    const authMethod = useMemo(() => {
        return new BrowserDemoAuth(
            {
                onReady: ({ signUp, existingUsers, logInAs }) => {
                    setState({
                        state: "ready",
                        signUp,
                        existingUsers,
                        logInAs,
                        errors: [],
                    });
                },
                onSignedIn: ({ logOut }) => {
                    setState({ state: "signedIn", logOut, errors: [] });
                },
                onError: (error) => {
                    setState((current) => ({
                        ...current,
                        errors: [...current.errors, error.toString()],
                    }));
                },
            },
            seedAccounts,
        );
    }, [seedAccounts]);

    return [authMethod, state] as const;
}

export const DemoAuthBasicUI = ({
    appName,
    state,
}: {
    appName: string;
    state: DemoAuthState;
}) => {
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
                    {state.errors.map((error) => (
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
                            value="Sign up"
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
                                Log in as "{user}"
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};
