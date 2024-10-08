import { useMemo, useState } from "react";
import { BrowserPassphraseAuth } from "jazz-browser";
import { generateMnemonic } from "@scure/bip39";
import { cojsonInternals } from "cojson";

export type PassphraseAuthState = (
    | { state: "uninitialized" }
    | { state: "loading" }
    | {
          state: "ready";
          logIn: (passphrase: string) => void;
          signUp: (username: string, passphrase: string) => void;
          generateRandomPassphrase: () => string;
      }
    | { state: "signedIn"; logOut: () => void }
) & {
    errors: string[];
};

/** @category Auth Providers */
export function usePassphraseAuth({
    appName,
    appHostname,
    wordlist,
}: {
    appName: string;
    appHostname?: string;
    wordlist: string[];
}) {
    const [state, setState] = useState<PassphraseAuthState>({
        state: "loading",
        errors: [],
    });

    const generateRandomPassphrase = () => {
        return generateMnemonic(wordlist, cojsonInternals.secretSeedLength * 8);
    };

    const authMethod = useMemo(() => {
        return new BrowserPassphraseAuth(
            {
                onReady(next) {
                    setState({
                        state: "ready",
                        logIn: next.logIn,
                        signUp: next.signUp,
                        generateRandomPassphrase,
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
            wordlist,
            appName,
            appHostname,
        );
    }, [appName, appHostname, wordlist]);

    return [authMethod, state] as const;
}

export const PassphraseAuthBasicUI = (state: PassphraseAuthState) => {
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
                {state.errors.length > 0 && (
                    <div style={{ color: "red" }}>
                        {state.errors.map((error, index) => (
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
                                setPassphrase(state.generateRandomPassphrase());
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
