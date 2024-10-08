/* eslint-disable react-refresh/only-export-components */
import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster"
import { useMediaPlayer } from "./5_useMediaPlayer";
import { HomePage } from "./3_HomePage";
import { InvitePage } from "./6_InvitePage";
import { PlayerControls } from "./components/PlayerControls";
import "./index.css";

import { MusicaAccount } from "@/1_schema";
import { createJazzReactApp, DemoAuthBasicUI, useDemoAuth } from "jazz-react";
import { useUploadExampleData } from "./lib/useUploadExampleData";

/**
 * Walkthrough: The top-level provider `<Jazz.Provider/>`
 *
 * This shows how to use the top-level provider `<Jazz.Provider/>`,
 * which provides the rest of the app with a controlled account (used through `useAccount` later).
 * Here we use `DemoAuth` which is great for prototyping you app without wasting time on figuring out
 * the best way to do auth.
 *
 * `<Jazz.Provider/>` also runs our account migration
 */

const Jazz = createJazzReactApp({
    AccountSchema: MusicaAccount,
});

export const { useAccount, useCoState, useAcceptInvite } = Jazz;

function Main() {
    const mediaPlayer = useMediaPlayer();

    useUploadExampleData();

    const router = createHashRouter([
        {
            path: "/",
            element: <HomePage mediaPlayer={mediaPlayer} />,
        },
        {
            path: "/playlist/:playlistId",
            element: <HomePage mediaPlayer={mediaPlayer} />,
        },
        {
            path: "/invite/*",
            element: <InvitePage />,
        },
    ]);

    return (
        <>
            <RouterProvider router={router} />
            <PlayerControls mediaPlayer={mediaPlayer} />
            <Toaster />
        </>
    );
}

function JazzAndAuth({ children }: { children: React.ReactNode }) {
    const [auth, state] = useDemoAuth();

    const peer =
        (new URL(window.location.href).searchParams.get(
            "peer",
        ) as `ws://${string}`) ??
        "wss://mesh.jazz.tools/?key=music-player-example-jazz@gcmp.io";

    return (
        <>
            <Jazz.Provider auth={auth} peer={peer}>
                {children}
            </Jazz.Provider>
            <DemoAuthBasicUI appName="Jazz Music Player" state={state} />
        </>
    );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <JazzAndAuth>
            <Main />
        </JazzAndAuth>
    </React.StrictMode>,
);
