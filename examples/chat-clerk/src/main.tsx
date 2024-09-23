import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createJazzReactApp } from "jazz-react";
import { App } from "./app.tsx";

import { ClerkProvider, SignInButton, useClerk } from "@clerk/clerk-react";
import { useJazzClerkAuth } from "jazz-react-auth-clerk";

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
    const clerk = useClerk();
    const [auth, state] = useJazzClerkAuth(clerk);

    return (
        <>
            {state.errors.map((error) => (
                <div key={error}>{error}</div>
            ))}
            {auth ? (
                <Jazz.Provider
                    auth={auth}
                    peer="wss://mesh.jazz.tools/?key=chat-example-jazz-clerk@gcmp.io"
                >
                    {children}
                </Jazz.Provider>
            ) : (
                <SignInButton />
            )}
        </>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ClerkProvider
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
            afterSignOutUrl="/"
        >
            <JazzAndAuth>
                <App />
            </JazzAndAuth>
        </ClerkProvider>
    </StrictMode>
);
