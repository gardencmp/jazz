import ReactDOM from "react-dom/client";
import App from "./5_App.tsx";
import "./index.css";
import {
    createJazzReactApp,
    PasskeyAuthBasicUI,
    usePasskeyAuth,
} from "jazz-react";
import { PasswordManagerAccount } from "./1_schema.ts";
import React from "react";

const Jazz = createJazzReactApp<PasswordManagerAccount>({
    AccountSchema: PasswordManagerAccount,
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;

function AuthAndJazz({ children }: { children: React.ReactNode }) {
    const [auth, state] = usePasskeyAuth({
        appName: "Jazz Password Manager",
    });

    return (
        <Jazz.Provider
            auth={auth}
            peer="wss://mesh.jazz.tools/?key=password-manager-example-jazz@gcmp.io"
        >
            {state.state === "signedIn" ? (
                children
            ) : (
                <PasskeyAuthBasicUI state={state} />
            )}
        </Jazz.Provider>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AuthAndJazz>
            <App />
        </AuthAndJazz>
    </React.StrictMode>
);
