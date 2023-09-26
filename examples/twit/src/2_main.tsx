import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter, useParams } from "react-router-dom";
import "./index.css";

import { WithJazz, useJazz, useAcceptInvite, useSyncedQuery } from "jazz-react";
import { LocalAuth } from "jazz-react-auth-local";

import {
    Button,
    Input,
    ThemeProvider,
    TitleAndLogo,
} from "./basicComponents/index.ts";
import { PrettyAuthUI } from "./components/Auth.tsx";
import { Chat, Twit, TwitProfile } from "./1_types.ts";
import { Queried } from "cojson";

const appName = "Jazz Twit Example";

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

/**
 * Routing in `<App/>`
 *
 * <App> is the main app component, handling client-side routing based
 * on the CoValue ID (CoID) of our TodoProject, stored in the URL hash
 * - which can also contain invite links.
 */

function App() {
    // logOut logs out the AuthProvider passed to `<WithJazz/>` above.
    const { logOut } = useJazz();

    const router = createHashRouter([
        {
            path: "/",
            element: <ChronoFeedUI />,
        },
        {
            path: "/chat/:chatId",
            element: <ChatUI />,
        },
        {
            path: "/:userId",
            element: <ProfileUI />,
        },
        {
            path: "/invite/*",
            element: <p>Accepting invite...</p>,
        },
    ]);

    // `useAcceptInvite()` is a hook that accepts an invite link from the URL hash,
    // and on success calls our callback where we navigate to the project that we were just invited to.
    useAcceptInvite((projectID) => router.navigate("/project/" + projectID));

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

export function ProfileUI() {
    const { profileId } = useParams<{ profileId: TwitProfile["id"] }>();

    const profile = useSyncedQuery(profileId);

    return (
        <div>
            <h1>{profile?.name}</h1>
            <img src={profile?.avatar?.highestResSrc} />
            <p>{profile?.bio}</p>
            {profile?.posts?.map((post) => (
                <TwitUI twit={twit} />
            ))}
        </div>
    );
}

export function TwitUI({ twit }: { twit?: Queried<Twit> }) {
    return (
        <div>
            <h1>{twit?.text}</h1>
            {twit?.quotedPost && <TwitUI twit={twit.quotedPost} />}
            {twit?.images?.map((image) => (
                <img src={image?.highestResSrc} />
            ))}
            <p>by: {twit?.edits.text?.by?.profile?.name}</p>
            <p>
                {
                    Object.values(twit?.likes?.perAccount || {}).filter(
                        (byAccount) => byAccount.last === "❤️"
                    ).length
                }
            </p>
            <div>
                {Object.values(twit?.replies?.perAccount || {})
                    .flatMap((byAccount) => byAccount.all)
                    .sort((a, b) => a.at.getTime() - b.at.getTime())
                    .map((replyEntry) => (
                        <TwitUI twit={replyEntry.value} />
                    ))}
            </div>
        </div>
    );
}
