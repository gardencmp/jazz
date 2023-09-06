import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { WithJazz } from "jazz-react";
import { LocalAuth } from "jazz-react-auth-local";

import { ThemeProvider, TitleAndLogo } from "./basicComponents/index.ts";
import { PrettyAuthUI } from "./components/Auth.tsx";
import App from "./2_App.tsx";

/** Walkthrough: The top-level provider `<WithJazz/>`
 *
 *  This shows how to use the top-level provider `<WithJazz/>`,
 *  which provides the rest of the app with a `LocalNode` (used through `useJazz` later),
 *  based on `LocalAuth` that uses PassKeys (aka WebAuthn) to store a user's account secret
 *  - no backend needed. */

const appName = "Jazz Todo List Example";

const auth = LocalAuth({
    appName,
    Component: PrettyAuthUI,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider>
            <TitleAndLogo name={appName} />

            <WithJazz auth={auth}>
                <App />
            </WithJazz>
        </ThemeProvider>
    </React.StrictMode>
);

/** Walkthrough: Continue with ./1_types.ts */
