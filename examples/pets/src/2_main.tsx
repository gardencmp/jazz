import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";
import "./index.css";

import { WithJazz, useJazz, useAcceptInvite } from "jazz-react";
import { LocalAuth } from "jazz-react-auth-local";

import {
    Button,
    ThemeProvider,
    TitleAndLogo,
} from "./basicComponents/index.ts";
import { PrettyAuthUI } from "./components/Auth.tsx";
import { NewPetPostForm } from "./3_NewPetPostForm.tsx";
import { RatePetPostUI } from "./4_RatePetPostUI.tsx";

/** Walkthrough: The top-level provider `<WithJazz/>`
 *
 *  This shows how to use the top-level provider `<WithJazz/>`,
 *  which provides the rest of the app with a `LocalNode` (used through `useJazz` later),
 *  based on `LocalAuth` that uses PassKeys (aka WebAuthn) to store a user's account secret
 *  - no backend needed. */

const appName = "Jazz Rate My Pet Example";

const auth = LocalAuth({
    appName,
    Component: PrettyAuthUI,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <WithJazz auth={auth}>
            <App />
        </WithJazz>
    </React.StrictMode>
);

/** Walkthrough: Creating pet posts & routing in `<App/>`
 *
 *  <App> is the main app component, handling client-side routing based
 *  on the CoValue ID (CoID) of our PetPost, stored in the URL hash
 *  - which can also contain invite links.
 */

export default function App() {
    const { logOut } = useJazz();

    const router = createHashRouter([
        {
            path: "/",
            element: <NewPetPostForm />,
        },
        {
            path: "/pet/:petPostId",
            element: <RatePetPostUI />,
        },
        {
            path: "/invite/*",
            element: <p>Accepting invite...</p>,
        },
    ]);

    useAcceptInvite((petPostID) => router.navigate("/pet/" + petPostID));

    return (
        <ThemeProvider>
            <TitleAndLogo name={appName} />
            <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
                <RouterProvider router={router} />

                <Button
                    onClick={() => router.navigate("/").then(logOut)}
                    variant="outline"
                >
                    Log Out
                </Button>
            </div>
        </ThemeProvider>
    );
}

/** Walkthrough: continue with ./3_CreatePetPostForm.tsx */

/** Walkthrough: Continue with ./1_types.ts */
