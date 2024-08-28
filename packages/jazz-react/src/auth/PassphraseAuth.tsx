import { useMemo, useState, ReactNode, createContext, useContext } from "react";
import { BrowserPassphraseAuth } from "jazz-browser";
import { generateMnemonic } from "@scure/bip39";
import { cojsonInternals } from "cojson";
import { AuthMethodCtx } from "./auth.js";

export type PassphraseAuthState =
    | { state: "uninitialized" }
    | { state: "loading" }
    | {
          state: "ready";
          logIn: (passphrase: string) => void;
          signUp: (username: string, passphrase: string) => void;
      }
    | { state: "signedIn"; logOut: () => void };

const PassphraseAuthStateCtx = createContext<{
    state: PassphraseAuthState;
    errors: string[];
    generateRandomPassphrase: () => string;
}>({
    state: { state: "uninitialized" },
    errors: [],
    generateRandomPassphrase: () => "",
});

/** @category Auth Providers */
export function PassphraseAuth({
    children,
    appName,
    appHostname,
    wordlist,
}: {
    children: ReactNode;
    appName: string;
    appHostname?: string;
    wordlist: string[];
}) {
    const [errors, setErrors] = useState<string[]>([]);
    const [state, setState] = useState<PassphraseAuthState>({
        state: "loading",
    });

    const generateRandomPassphrase = () => {
        return generateMnemonic(
            wordlist,
            cojsonInternals.secretSeedLength * 8,
        );
    };

    const authMethod = useMemo(() => {
        return new BrowserPassphraseAuth(
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
            wordlist,
            appName,
            appHostname,
        );
    }, [appName, appHostname, wordlist]);

    return (
        <PassphraseAuthStateCtx.Provider value={{ state, errors, generateRandomPassphrase }}>
            <AuthMethodCtx.Provider value={authMethod}>
                {children}
            </AuthMethodCtx.Provider>
        </PassphraseAuthStateCtx.Provider>
    );
}

const PassphraseAuthBasicUI = () => {
    const { state, errors, generateRandomPassphrase } = useContext(PassphraseAuthStateCtx);
    const [username, setUsername] = useState<string>("");
    const [passphrase, setPassphrase] = useState<string>("");
    const [loginPassphrase, setLoginPassphrase] = useState<string>("");

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
                    width: "30rem",
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
                        width: "30rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        signUp(username, passphrase);
                        setPassphrase("");
                        setUsername("");
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
                        logIn(loginPassphrase);
                        setLoginPassphrase("");
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

/** @category Auth Providers */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PassphraseAuth {
    export const BasicUI = PassphraseAuthBasicUI;
}
