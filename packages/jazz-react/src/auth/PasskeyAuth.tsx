import { useMemo, useState, ReactNode, createContext, useContext } from "react";
import { BrowserPasskeyAuth } from "jazz-browser";
import { AuthMethodCtx } from "./auth.js";

export type PasskeyAuthState =
    | { state: "uninitialized" }
    | { state: "loading" }
    | {
          state: "ready";
          logIn: () => void;
          signUp: (username: string) => void;
      }
    | { state: "signedIn"; logOut: () => void };

const PasskeyAuthStateCtx = createContext<{
    state: PasskeyAuthState;
    errors: string[];
}>({
    state: { state: "uninitialized" },
    errors: [],
});

/** @category Auth Providers */
export function PasskeyAuth({
    children,
    appName,
    appHostname,
}: {
    children: ReactNode;
    appName: string;
    appHostname?: string;
}) {
    const [errors, setErrors] = useState<string[]>([]);
    const [state, setState] = useState<PasskeyAuthState>({
        state: "loading",
    });

    const authMethod = useMemo(() => {
        return new BrowserPasskeyAuth(
            {
                onReady(next) {
                    setState({
                        state: "ready",
                        logIn: next.logIn,
                        signUp: next.signUp,
                    });
                },
                onSignedIn(next) {
                    setState({
                        state: "signedIn",
                        logOut: () => {
                            next.logOut();
                            setState({ state: "loading" });
                        },
                    });
                },
                onError(error) {
                    setErrors((errors) => [...errors, error.toString()]);
                },
            },
            appName,
            appHostname,
        );
    }, [appName, appHostname]);

    return (
        <PasskeyAuthStateCtx.Provider value={{ state, errors }}>
            <AuthMethodCtx.Provider value={authMethod}>
                {children}
            </AuthMethodCtx.Provider>
        </PasskeyAuthStateCtx.Provider>
    );
}

const PasskeyAuthBasicUI = () => {
    const { state, errors } = useContext(PasskeyAuthStateCtx);
    const [username, setUsername] = useState<string>("");

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
                {errors.length > 0 && (
                    <div style={{ color: "red" }}>
                        {errors.map((error, index) => (
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
                    Log In with existing account
                </button>
            </div>
        </div>
    );
};

/** @category Auth Providers */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PasskeyAuth {
    export type Component = (props: {
        loading: boolean;
        logIn: () => void;
        signUp: (username: string) => void;
    }) => ReactNode;
    export const BasicUI = PasskeyAuthBasicUI;
}
