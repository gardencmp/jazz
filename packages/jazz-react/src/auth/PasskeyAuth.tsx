import { useMemo, useState } from "react";
import { BrowserPasskeyAuth } from "jazz-browser";

export type PasskeyAuthState = (
    | { state: "uninitialized" }
    | { state: "loading" }
    | {
          state: "ready";
          logIn: () => void;
          signUp: (username: string) => void;
      }
    | { state: "signedIn"; logOut: () => void }
) & {
    errors: string[];
};

/** @category Auth Providers */
export function usePasskeyAuth({
    appName,
    appHostname,
}: {
    appName: string;
    appHostname?: string;
}) {
    const [state, setState] = useState<PasskeyAuthState>({
        state: "loading",
        errors: [],
    });

    const authMethod = useMemo(() => {
        return new BrowserPasskeyAuth(
            {
                onReady(next) {
                    setState({
                        state: "ready",
                        logIn: next.logIn,
                        signUp: next.signUp,
                        errors: [],
                    });
                },
                onSignedIn(next) {
                    setState({
                        state: "signedIn",
                        logOut: () => {
                            next.logOut();
                            setState({ state: "loading", errors: [] });
                        },
                        errors: [],
                    });
                },
                onError(error) {
                    setState((state) => ({
                        ...state,
                        errors: [...state.errors, error.toString()],
                    }));
                },
            },
            appName,
            appHostname,
        );
    }, [appName, appHostname]);

    return [authMethod, state] as const;
}

export const PasskeyAuthBasicUI = ({ state }: { state: PasskeyAuthState }) => {
    const [username, setUsername] = useState<string>("");

    if (state.state === "signedIn") {
        return null;
    }

    if (state.state !== "ready") {
        return <div>Loading...</div>;
    }

    const { logIn, signUp } = state;

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
                {state.errors.length > 0 && (
                    <div style={{ color: "red" }}>
                        {state.errors.map((error, index) => (
                            <div key={index}>{error}</div>
                        ))}
                    </div>
                )}
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
                        value="Sign up"
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
                <button
                    onClick={logIn}
                    style={{
                        background: "#000",
                        color: "#fff",
                        padding: "13px 5px",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                >
                    Log in with existing account
                </button>
            </div>
        </div>
    );
};
