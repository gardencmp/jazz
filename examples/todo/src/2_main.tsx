import ReactDOM from "react-dom/client";
import {
    RouterProvider,
    createHashRouter,
    useNavigate,
} from "react-router-dom";
import "./index.css";

import { createJazzReactApp, PasskeyAuthBasicUI, usePasskeyAuth } from "jazz-react";

import {
    Button,
    ThemeProvider,
    TitleAndLogo,
} from "./basicComponents/index.ts";
import { NewProjectForm } from "./3_NewProjectForm.tsx";
import { ProjectTodoTable } from "./4_ProjectTodoTable.tsx";
import { TodoAccount, TodoProject } from "./1_schema.ts";
import React from "react";

/**
 * Walkthrough: The top-level provider `<Jazz.Provider/>`
 *
 * This shows how to use the top-level provider `<Jazz.Provider/>`,
 * which provides the rest of the app with a controlled account (used through `useAccount` later).
 * Here we use `PasskeyAuth`, which uses Passkeys (aka WebAuthn) to store a user's account secret
 * - no backend needed.
 *
 * `<Jazz.Provider/>` also runs our account migration
 */

const appName = "Jazz Todo List Example";

const Jazz = createJazzReactApp<TodoAccount>({
    AccountSchema: TodoAccount,
});
// eslint-disable-next-line react-refresh/only-export-components
export const { useAccount, useCoState, useAcceptInvite } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
    const [passkeyAuth, passKeyState] = usePasskeyAuth({ appName });

    return (
        <>
            <Jazz.Provider
                auth={passkeyAuth}
                peer="wss://cloud.jazz.tools/?key=todo-example-jazz@gcmp.io"
            >
                {children}
            </Jazz.Provider>
            <PasskeyAuthBasicUI state={passKeyState} />
        </>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider>
            <TitleAndLogo name={appName} />
            <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
                <JazzAndAuth>
                    <App />
                </JazzAndAuth>
            </div>
        </ThemeProvider>,
    </React.StrictMode>
);

/**
 * Routing in `<App/>`
 *
 * <App> is the main app component, handling client-side routing based
 * on the CoValue ID (CoID) of our TodoProject, stored in the URL hash
 * - which can also contain invite links.
 */
export default function App() {
    // logOut logs out the AuthProvider passed to `<Jazz.Provider/>` above.
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
                onClick={() =>
                    router.navigate("/").then(logOut)
                }
                variant="outline"
            >
                Log out
            </Button>
        </>
    );
}

function HomeScreen() {
    const { me } = useAccount({
        root: { projects: [{}] },
    });
    const navigate = useNavigate();

    return (
        <>
            {me?.root.projects.length ? <h1>My Projects</h1> : null}
            {me?.root.projects.map((project) => {
                return (
                    <Button
                        key={project.id}
                        onClick={() => navigate("/project/" + project?.id)}
                        variant="ghost"
                    >
                        {project.title}
                    </Button>
                );
            })}
            <NewProjectForm />
        </>
    );
}

/** Walkthrough: Continue with ./3_NewProjectForm.tsx */
