import React from "react";
import ReactDOM from "react-dom/client";
import { Link, RouterProvider, createHashRouter } from "react-router-dom";
import "./index.css";

import { createJazzReactContext, PasskeyAuth } from "jazz-react";

import {
    Button,
    ThemeProvider,
    TitleAndLogo,
} from "./basicComponents/index.ts";
import { PrettyAuthUI } from "./components/Auth.tsx";
import { NewPetPostForm } from "./3_NewPetPostForm.tsx";
import { RatePetPostUI } from "./4_RatePetPostUI.tsx";
import { PetAccount, PetPost } from "./1_schema.ts";

/** Walkthrough: The top-level provider `<WithJazz/>`
 *
 *  This shows how to use the top-level provider `<WithJazz/>`,
 *  which provides the rest of the app with a `LocalNode` (used through `useJazz` later),
 *  based on `LocalAuth` that uses PassKeys (aka WebAuthn) to store a user's account secret
 *  - no backend needed. */

const appName = "Jazz Rate My Pet Example";

const auth = PasskeyAuth<PetAccount>({
    appName,
    Component: PrettyAuthUI,
    accountSchema: PetAccount,
});

const Jazz = createJazzReactContext({
    auth,
    peer: "wss://mesh.jazz.tools/?key=you@example.com",
});
export const { useAccount, useCoState, useAcceptInvite } = Jazz;

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider>
            <TitleAndLogo name={appName} />
            <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
                <Jazz.Provider>
                    <App />
                </Jazz.Provider>
            </div>
        </ThemeProvider>
    </React.StrictMode>
);

/** Walkthrough: Creating pet posts & routing in `<App/>`
 *
 *  <App> is the main app component, handling client-side routing based
 *  on the CoValue ID (CoID) of our PetPost, stored in the URL hash
 *  - which can also contain invite links.
 */

export default function App() {
    const { logOut } = useAccount();

    const router = createHashRouter([
        {
            path: "/",
            element: <PostOverview />,
        },
        {
            path: "/new",
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

    useAcceptInvite({
        invitedObjectSchema: PetPost,
        onAccept: (petPostID) => router.navigate("/pet/" + petPostID),
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

export function PostOverview() {
    const { me } = useAccount();

    const myPosts = me.root?.posts;

    return (
        <>
            {myPosts?.length ? (
                <>
                    <h1>My posts</h1>
                    {myPosts.map(
                        (post) =>
                            post && (
                                <Link key={post.id} to={"/pet/" + post.id}>
                                    {post.name}
                                </Link>
                            )
                    )}
                </>
            ) : undefined}
            <Link to="/new">New post</Link>
        </>
    );
}
