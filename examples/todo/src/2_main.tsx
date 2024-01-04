import React from "react";
import ReactDOM from "react-dom/client";
import {
    RouterProvider,
    createHashRouter,
    useNavigate,
} from "react-router-dom";
import "./index.css";

import { useAcceptInvite, createReactContext } from "jazz-react";
import { LocalAuth } from "jazz-react-auth-local";

import {
    Button,
    ThemeProvider,
    TitleAndLogo,
} from "./basicComponents/index.ts";
import { PrettyAuthUI } from "./components/Auth.tsx";
import { NewProjectForm } from "./3_NewProjectForm.tsx";
import { ProjectTodoTable } from "./4_ProjectTodoTable.tsx";
import {
    TodoAccount,
    TodoAccountRoot,
    TodoProject,
    migration,
} from "./1_schema.ts";
import { AccountMigration, Profile } from "cojson";

/**
 * Walkthrough: The top-level provider `<WithJazz/>`
 *
 * This shows how to use the top-level provider `<WithJazz/>`,
 * which provides the rest of the app with a controlled account (used through `useJazz` later).
 * Here we use `LocalAuth`, which uses Passkeys (aka WebAuthn) to store a user's account secret
 * - no backend needed.
 *
 * `<WithJazz/>` also runs our account migration
 */

const appName = "Jazz Todo List Example";

const auth = LocalAuth({
    appName,
    Component: PrettyAuthUI,
});

export const { JazzProvider, useAccount, useCoState, useAcceptInvite } =
    createReactContext({
        auth,
        accountSchema: TodoAccount,
        migration,
    });

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider>
            <TitleAndLogo name={appName} />
            <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
                <JazzProvider>
                    <App />
                </JazzProvider>
            </div>
        </ThemeProvider>
    </React.StrictMode>
);

/**
 * Routing in `<App/>`
 *
 * <App> is the main app component, handling client-side routing based
 * on the CoValue ID (CoID) of our TodoProject, stored in the URL hash
 * - which can also contain invite links.
 */

function App() {
    // logOut logs out the AuthProvider passed to `<WithJazz/>` above.
    const { logOut } = useAccount();

    const router = createHashRouter([
        {
            path: "/",
            element: <HomeScreen />,
        },
        {
            path: "/project/:projectId",
            element: <ProjectTodoTable />,
        },
        {
            path: "/invite/*",
            element: <p>Accepting invite...</p>,
        },
    ]);

    // `useAcceptInvite()` is a hook that accepts an invite link from the URL hash,
    // and on success calls our callback where we navigate to the project that we were just invited to.
    useAcceptInvite({
        invitedObjectSchema: TodoProject,
        forValueHint: "project",
        onAccept: (projectID) => router.navigate("/project/" + projectID),
    });

    return (
        <>
            <RouterProvider router={router} />

            <Button
                onClick={() => router.navigate("/").then(logOut)}
                variant="outline"
            >
                Log Out
            </Button>
        </>
    );
}

export function HomeScreen() {
    const { me } = useAccount();
    const navigate = useNavigate();

    return (
        <>
            {me.root?.projects?.length ? <h1>My Projects</h1> : null}
            {me.root?.projects?.map((project) => {
                return (
                    <Button
                        key={project?.id}
                        onClick={() => navigate("/project/" + project?.id)}
                        variant="ghost"
                    >
                        {project?.title}
                    </Button>
                );
            })}
            <NewProjectForm />
        </>
    );
}

/** Walkthrough: Continue with ./3_NewProjectForm.tsx */