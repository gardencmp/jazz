import { SignedOut, SignInButton, useClerk } from "@clerk/clerk-react";
import { BrowserClerkAuth } from "jazz-browser-auth-clerk";
import { AuthMethodCtx } from "jazz-react";
import { useState, useMemo, ReactNode, useContext, createContext } from "react";

export const JazzClerkAuthCtx = createContext<{
    errors: string[];
}>({
    errors: [],
});

export function JazzClerkAuth({ children }: { children: ReactNode }) {
    const clerk = useClerk();
    const [errors, setErrors] = useState<string[]>([]);

    const authMethod = useMemo(() => {
        return new BrowserClerkAuth(
            {
                onError: (error) => {
                    void clerk.signOut();
                    setErrors((errors) => [...errors, error.toString()]);
                },
            },
            clerk,
        );
    }, [clerk]);

    return (
        <JazzClerkAuthCtx.Provider value={{ errors }}>
            <AuthMethodCtx.Provider value={authMethod}>
                {children}
            </AuthMethodCtx.Provider>
        </JazzClerkAuthCtx.Provider>
    );
}

const JazzClerkBasicUI = ({ appName }: { appName: string }) => {
    const { errors } = useContext(JazzClerkAuthCtx);
    const darkMode =
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : false;
    return (
        <SignedOut>
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
                    <SignInButton />
                    {errors.map((error) => (
                        <div key={error} style={{ color: "red" }}>
                            {error}
                        </div>
                    ))}
                </div>
            </div>
        </SignedOut>
    );
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JazzClerkAuth {
    export const BasicUI = JazzClerkBasicUI;
}
