import { createJazzReactApp, useDemoAuth } from "jazz-react";
import { useEffect, useRef } from "react";

const key = `test-comap@jazz.tools`;

const localSync = new URLSearchParams(location.search).has("localSync");

const Jazz = createJazzReactApp();

export const { useAccount, useCoState } = Jazz;

function getUserInfo() {
    const url = new URL(window.location.href);
    return url.searchParams.get("userName") ?? "Mister X";
}

export function AuthAndJazz({ children }: { children: React.ReactNode }) {
    const [auth, state] = useDemoAuth();

    const signedUp = useRef(false);

    useEffect(() => {
        if (state.state === "ready" && !signedUp.current) {
            const userName = getUserInfo();

            if (state.existingUsers.includes(userName)) {
                state.logInAs(userName)
            } else {
                state.signUp(userName)
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
