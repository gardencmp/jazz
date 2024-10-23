import { createJazzReactApp, useDemoAuth } from "jazz-react";
import { useEffect, useRef } from "react";

const key = `test-comap@jazz.tools`;

const localSync = new URLSearchParams(location.search).has("localSync");

const Jazz = createJazzReactApp();

export const { useAccount, useCoState } = Jazz;

function getUserInfo() {
    const url = new URL(window.location.href);
    return {
        signUp: url.searchParams.get("signUp") ?? "Mister X",
        logInAs: url.searchParams.get("logInAs"),
    };
}

export function AuthAndJazz({ children }: { children: React.ReactNode }) {
    const [auth, state] = useDemoAuth();

    const signedUp = useRef(false);

    useEffect(() => {
        if (state.state === "ready" && !signedUp.current) {
            const { signUp, logInAs } = getUserInfo();
            
            if (logInAs) {
                state.logInAs(logInAs);
            } else {
                state.signUp(signUp);
            }

            signedUp.current = true;
        }
    }, [state.state]);

    return (
        <Jazz.Provider
            auth={auth}
            peer={
                localSync
                    ? `ws://localhost:4200?key=${key}`
                    : `wss://cloud.jazz.tools/?key=${key}`
            }
        >
            {children}
        </Jazz.Provider>
    );
}
